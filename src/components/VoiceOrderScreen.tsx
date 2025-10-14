import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Plus, Minus, Check, Edit2, Send, X, ShoppingCart, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  index: string;
  base_price: number;
}

interface OrderItem {
  productName: string;
  quantity: number;
  unit: string;
  productIndex?: string;
  productId?: string;
  matched?: boolean;
  suggestions?: Product[];
  confidence?: number;
  aiMatched?: boolean;
}

interface VoiceOrderScreenProps {
  storeId: string;
  userId: string;
  onDraftCreated: (orderId: string) => void;
}

export default function VoiceOrderScreen({ storeId, userId, onDraftCreated }: VoiceOrderScreenProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const allProductsRef = useRef<Product[]>([]);
  const [stage, setStage] = useState<'recording' | 'confirmation'>('recording');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [shouldContinueListening, setShouldContinueListening] = useState(false);
  const [notification, setNotification] = useState<string>('');
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [aiReady, setAiReady] = useState(false);
  const [aiInitializing, setAiInitializing] = useState(false);
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome lub Edge.');
    }
    loadProducts();
  }, []);

  const initializeAI = async () => {
    if (aiReady || aiInitializing) return;

    try {
      setAiInitializing(true);
      console.log('[AI] Starting initialization...');

      const { embeddingsManager } = await import('../lib/embeddingsManager');
      await embeddingsManager.initialize();

      setAiReady(true);
      console.log('[AI] Ready!');
    } catch (error) {
      console.error('[AI] Failed to initialize:', error);
      setUseAI(false);
      setNotification('⚠️ AI niedostępne - używam klasycznego dopasowania');
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setAiInitializing(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, index, base_price')
        .eq('active', true);
      if (data) {
        console.log('Loaded products:', data.length);
        setAllProducts(data);
        allProductsRef.current = data;
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  useEffect(() => {
    if (aiReady && allProducts.length > 0) {
      console.log('[AI] Generating embeddings for products...');
      import('../lib/embeddingsManager').then(({ embeddingsManager }) => {
        embeddingsManager.generateProductEmbeddings(allProducts).catch(console.error);
      });
    }
  }, [aiReady, allProducts]);

  const findSimilarProducts = (searchName: string, products: Product[], limit = 3): Product[] => {
    const normalized = searchName.toLowerCase().trim();
    const scored = products.map(product => {
      const productName = product.name.toLowerCase();
      let score = 0;

      if (productName === normalized) score = 100;
      else if (productName.includes(normalized)) score = 80;
      else if (normalized.includes(productName)) score = 70;
      else {
        const words = normalized.split(' ');
        words.forEach(word => {
          if (word.length > 2 && productName.includes(word)) score += 20;
        });
      }

      return { product, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
  };

  const startListening = () => {
    if (!aiReady && !aiInitializing && useAI) {
      initializeAI();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pl-PL';
    recognition.continuous = false;
    recognition.interimResults = true;

    setShouldContinueListening(true);
    (window as any).shouldContinueListening = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      const newTimer = setTimeout(() => {
        stopListening();
      }, 30000);
      setInactivityTimer(newTimer);

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      setTranscript(currentText);

      if (finalTranscript) {
        parseTranscript(finalTranscript, allProductsRef.current);
        setTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        return;
      }
      if (event.error === 'aborted') {
        setIsListening(false);
        (window as any).shouldContinueListening = false;
        return;
      }
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      (window as any).shouldContinueListening = false;
    };

    recognition.onend = () => {
      const shouldRestart = (window as any).shouldContinueListening;

      if (shouldRestart) {
        setTimeout(() => {
          if (!(window as any).shouldContinueListening) {
            setIsListening(false);
            return;
          }

          try {
            const newRecognition = new SpeechRecognition();
            newRecognition.lang = 'pl-PL';
            newRecognition.continuous = false;
            newRecognition.interimResults = true;

            newRecognition.onstart = recognition.onstart;
            newRecognition.onresult = recognition.onresult;
            newRecognition.onerror = recognition.onerror;
            newRecognition.onend = recognition.onend;

            newRecognition.start();
            (window as any).currentRecognition = newRecognition;
          } catch (error) {
            console.error('Error restarting recognition:', error);
            setIsListening(false);
            (window as any).shouldContinueListening = false;
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognition.start();
    (window as any).currentRecognition = recognition;
  };

  const stopListening = async () => {
    setShouldContinueListening(false);
    (window as any).shouldContinueListening = false;
    setIsListening(false);
    if ((window as any).currentRecognition) {
      try {
        (window as any).currentRecognition.stop();
      } catch (error) {

      }
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
    setIsListening(false);
    setTranscript('');
  };

  const parseTranscript = async (text: string, products: Product[]) => {
    console.log('Parsing transcript:', text);
    console.log('Available products:', products.length);
    const items: OrderItem[] = [];

    const pattern1 = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram|kilograma|kilogramów|szt|sztuk|sztuki)\s+([a-ząćęłńóśźż\s]+)/gi;
    const pattern2 = /([a-ząćęłńóśźż\s]+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram|kilograma|kilogramów|szt|sztuk|sztuki)/gi;

    const matches = [];
    let match;

    while ((match = pattern1.exec(text)) !== null) {
      matches.push({ quantity: match[1], unit: match[2], productName: match[3] });
    }

    while ((match = pattern2.exec(text)) !== null) {
      matches.push({ productName: match[1], quantity: match[2], unit: match[3] });
    }

    console.log('All matches found:', matches);

    for (const matchData of matches) {
      const quantity = parseFloat(matchData.quantity.replace(',', '.'));
      let unit = 'kg';
      const productName = matchData.productName?.trim();

      if (matchData.unit && (matchData.unit.toLowerCase().includes('szt') || matchData.unit.toLowerCase().includes('sztuk'))) {
        unit = 'szt';
      }

      if (productName && productName.length > 2) {
        const normalizedName = productName.toLowerCase().trim();
        console.log('Looking for product:', normalizedName, 'in', products.length, 'products');

        const exactProduct = products.find(p => {
          const pName = p.name.toLowerCase();
          return pName === normalizedName || pName.includes(normalizedName) || normalizedName.includes(pName);
        });

        if (exactProduct) {
          console.log('Found exact match:', exactProduct.name);
          items.push({
            productName: exactProduct.name,
            quantity,
            unit,
            productIndex: exactProduct.index,
            productId: exactProduct.id,
            matched: true,
            confidence: 100,
            aiMatched: false,
          });
        } else if (useAI && aiReady) {
          console.log('[AI] Using AI to find similar products...');
          try {
            const { embeddingsManager } = await import('../lib/embeddingsManager');
            const aiResults = await embeddingsManager.findSimilarProducts(productName, products, 5);

            if (aiResults.length > 0 && aiResults[0].confidence >= 85) {
              console.log('[AI] High confidence match:', aiResults[0].product.name, aiResults[0].confidence);
              items.push({
                productName: aiResults[0].product.name,
                quantity,
                unit,
                productIndex: aiResults[0].product.index,
                productId: aiResults[0].product.id,
                matched: true,
                confidence: aiResults[0].confidence,
                aiMatched: true,
              });
            } else if (aiResults.length > 0) {
              console.log('[AI] Found suggestions:', aiResults.length);
              items.push({
                productName,
                quantity,
                unit,
                matched: false,
                suggestions: aiResults.map(r => r.product),
                confidence: aiResults[0]?.confidence,
              });
            } else {
              items.push({
                productName,
                quantity,
                unit,
                matched: false,
                suggestions: [],
              });
            }
          } catch (error) {
            console.error('[AI] Error during similarity search:', error);
            const fallbackSuggestions = findSimilarProducts(productName, products);
            items.push({
              productName,
              quantity,
              unit,
              matched: false,
              suggestions: fallbackSuggestions,
            });
          }
        } else {
          console.log('Using fallback text matching');
          const suggestions = findSimilarProducts(productName, products);
          if (suggestions.length > 0) {
            items.push({
              productName,
              quantity,
              unit,
              matched: false,
              suggestions,
            });
          } else {
            items.push({
              productName,
              quantity,
              unit,
              matched: false,
              suggestions: [],
            });
          }
        }
      }
    }

    console.log('Parsed items:', items);

    if (items.length > 0) {
      console.log('Adding items to orderItems');
      setOrderItems(prev => {
        const newList = [...prev, ...items];
        console.log('New orderItems list:', newList);
        return newList;
      });

      const unmatchedCount = items.filter(item => !item.matched).length;
      if (unmatchedCount > 0) {
        const unmatchedItems = items.filter(item => !item.matched);
        const unmatchedNames = unmatchedItems.map(item => item.productName).join(', ');

        const hasSuggestions = unmatchedItems.some(item => item.suggestions && item.suggestions.length > 0);

        if (hasSuggestions) {
          setNotification(`⚠️ Nie znaleziono w cenniku: ${unmatchedNames}. Zobacz sugestie poniżej lub podyktuj ponownie.`);
        } else {
          setNotification(`⚠️ Nie znaleziono w cenniku: ${unmatchedNames}. Proszę podyktować ponownie lub sprawdzić nazwę produktu.`);
        }
        setTimeout(() => setNotification(''), 7000);
      } else {
        const addedNames = items.map(item => item.productName).join(', ');
        setNotification(`✓ Dodano: ${addedNames}`);
        setTimeout(() => setNotification(''), 3000);
      }
    }
    setTranscript('');
  };

  const addMoreItems = () => {
    setStage('recording');
  };

  const editItem = (index: number) => {
    const newQuantity = prompt('Podaj nową ilość:', orderItems[index].quantity.toString());
    if (newQuantity) {
      const updated = [...orderItems];
      updated[index].quantity = parseFloat(newQuantity);
      setOrderItems(updated);
    }
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(0.1, quantity);
    setOrderItems(updated);
  };

  const adjustQuantity = (index: number, delta: number) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(0.1, updated[index].quantity + delta);
    setOrderItems(updated);
  };

  const selectSuggestion = (itemIndex: number, product: Product) => {
    const updated = [...orderItems];
    updated[itemIndex] = {
      ...updated[itemIndex],
      productName: product.name,
      productIndex: product.index,
      productId: product.id,
      matched: true,
      suggestions: undefined,
    };
    setOrderItems(updated);
  };

  const sendOrder = async () => {
    if (orderItems.length === 0) {
      alert('Dodaj pozycje do zamówienia');
      return;
    }

    const unmatchedItems = orderItems.filter(item => !item.matched);
    if (unmatchedItems.length > 0) {
      alert(`Nie wszystkie produkty zostały dopasowane. Wybierz sugestie lub usuń niedopasowane pozycje (${unmatchedItems.length} pozycji).`);
      return;
    }

    setSending(true);
    try {
      const matchedItems = orderItems
        .filter(item => item.matched && item.productId)
        .map(item => {
          const product = allProducts.find(p => p.id === item.productId);
          if (!product) return null;

          const unitPrice = Number(product.base_price);
          const totalPrice = Number((item.quantity * unitPrice).toFixed(2));

          return {
            product_id: product.id,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: unitPrice,
            total_price: totalPrice,
            productIndex: product.index,
          };
        })
        .filter(Boolean);

      if (matchedItems.length === 0) {
        alert('Nie udało się dopasować żadnego produktu z cennika. Sprawdź nazwy produktów.');
        setSending(false);
        return;
      }

      const totalAmount = matchedItems.reduce((sum, item) => sum + (item?.total_price || 0), 0);
      const orderNumber = `RO-${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          created_by: userId,
          status: 'draft',
          requires_confirmation: requiresConfirmation,
          total_amount: totalAmount,
          voice_transcript: JSON.stringify(orderItems),
          notes: notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          matchedItems.map(item => ({
            ...item,
            order_id: order.id,
            status: 'pending',
          }))
        );

      if (itemsError) throw itemsError;

      await supabase.from('order_history').insert({
        order_id: order.id,
        action: 'draft_created',
        performed_by: userId,
        details: {
          items_count: matchedItems.length,
          matched: matchedItems.length,
          total: orderItems.length
        },
      });

      setTimeout(() => {
        alert(`Szkic utworzony! Dopasowano ${matchedItems.length} z ${orderItems.length} produktów.`);
      }, 100);
      onDraftCreated(order.id);
    } catch (error) {
      console.error('Error creating draft order:', error);
      alert('Błąd podczas tworzenia zamówienia');
    } finally {
      setSending(false);
    }
  };

  if (stage === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Brak pozycji w zamówieniu</p>
            ) : (
              orderItems.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${item.matched ? 'bg-gray-50' : 'bg-yellow-50 border-2 border-yellow-300'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-lg">{item.productName}</p>
                        {!item.matched && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                            Nie znaleziono
                          </span>
                        )}
                        {item.matched && !item.aiMatched && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            ✓ Dopasowano
                          </span>
                        )}
                        {item.matched && item.aiMatched && (
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI {item.confidence}%
                          </span>
                        )}
                        {item.confidence && !item.matched && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {item.confidence}% pewności
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">
                        {item.quantity} {item.unit}
                      </p>
                      {item.productIndex && (
                        <div className="mt-2 flex items-center gap-2">
                          <svg className="w-28 h-12" viewBox="0 0 140 50">
                            {item.productIndex.split('').map((digit, i) => (
                              <rect
                                key={i}
                                x={i * 10.5}
                                y="8"
                                width={i % 2 === 0 ? "3.5" : "5"}
                                height="30"
                                fill="#000"
                              />
                            ))}
                          </svg>
                          <span className="font-mono text-xs text-gray-600">{item.productIndex}</span>
                        </div>
                      )}

                      {!item.matched && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-200">
                          {item.suggestions && item.suggestions.length > 0 ? (
                            <>
                              <p className="text-sm font-medium text-gray-700 mb-2">Czy chodziło o:</p>
                              <div className="space-y-1">
                                {item.suggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    onClick={() => selectSuggestion(index, suggestion)}
                                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-blue-50 rounded border border-gray-200 hover:border-blue-300 transition"
                                  >
                                    <span className="font-medium text-blue-600">{suggestion.name}</span>
                                    <span className="text-gray-500 ml-2">({suggestion.index})</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-red-600">
                              <p className="font-medium mb-1">⚠️ Produkt nie istnieje w cenniku</p>
                              <p className="text-xs text-gray-600">Proszę podyktować ponownie używając prawidłowej nazwy lub usuń tę pozycję</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={addMoreItems}
              className="flex-1 py-4 bg-white border-2 border-amber-500 text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition flex items-center justify-center gap-2 shadow"
            >
              <Plus className="w-5 h-5" />
              Dodaj więcej
            </button>
            <button
              onClick={sendOrder}
              disabled={sending}
              className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              {sending ? 'Zapisuję...' : 'Zapisz jako szkic'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 space-y-4">
        {aiInitializing && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-semibold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Ładowanie AI...
                </p>
                <p className="text-xs text-blue-700">Przygotowuję inteligentne dopasowywanie produktów</p>
              </div>
            </div>
          </div>
        )}

        {aiReady && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">AI gotowe</span>
              <span className="text-xs">- inteligentne dopasowywanie produktów włączone</span>
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
                  <div className="absolute inset-0 rounded-full bg-red-300 animate-pulse"></div>
                </>
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 animate-mic-pulse'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                }`}
              >
                {isListening ? (
                  <Mic className="w-16 h-16 text-white animate-pulse" />
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}
              </button>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">
              {isListening ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  Słucham... Dyktuj pozycję
                </span>
              ) : (
                'Kliknij aby rozpocząć nagrywanie'
              )}
            </p>
            {isListening && (
              <>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Przykład: "5 kg schab" lub "3 kg kiełbasa"
                </p>
                <p className="mt-1 text-xs text-gray-400 text-center">
                  Automatyczne zatrzymanie po 30 sekundach bezczynności
                </p>
              </>
            )}
          </div>

          {transcript && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">Transkrypcja na żywo:</p>
              <p className="text-gray-700">{transcript}</p>
            </div>
          )}

          {notification && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${
              notification.includes('⚠️')
                ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                : 'bg-green-50 border-green-400 text-green-800'
            }`}>
              <p className="text-sm font-medium">{notification}</p>
            </div>
          )}
        </div>

        {orderItems.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Rozpoznane pozycje
                </h3>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Pozycje</p>
                  <p className="font-bold text-amber-600 text-lg">{orderItems.length}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} {item.unit}
                      </p>
                      {item.productIndex && (
                        <div className="mt-1 flex items-center gap-1">
                          <svg className="w-16 h-6" viewBox="0 0 80 25">
                            {item.productIndex.split('').map((digit, i) => (
                              <rect
                                key={i}
                                x={i * 6}
                                y="3"
                                width={i % 2 === 0 ? "2" : "3"}
                                height="18"
                                fill="#000"
                              />
                            ))}
                          </svg>
                          <span className="font-mono text-[10px] text-gray-500">{item.productIndex}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustQuantity(index, -1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0.1)}
                        className="w-16 p-1 text-center text-sm border border-gray-300 rounded focus:border-amber-500 focus:outline-none"
                        step="1"
                        min="0.1"
                      />
                      <button
                        onClick={() => adjustQuantity(index, 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStage('confirmation')}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow"
              >
                <Check className="w-5 h-5" />
                Zapisz jako szkic
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
