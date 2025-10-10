import { useState, useEffect } from 'react';
import { Mic, MicOff, Plus, Check, Edit2, Send, X } from 'lucide-react';
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
}

interface VoiceOrderScreenProps {
  storeId: string;
  userId: string;
  onOrderSent: () => void;
}

export default function VoiceOrderScreen({ storeId, userId, onOrderSent }: VoiceOrderScreenProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [stage, setStage] = useState<'recording' | 'confirmation' | 'summary'>('recording');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome lub Edge.');
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, index, base_price')
        .eq('active', true);
      if (data) {
        setAllProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const findSimilarProducts = (searchName: string, limit = 3): Product[] => {
    const normalized = searchName.toLowerCase().trim();
    const scored = allProducts.map(product => {
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

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pl-PL';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
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

      if (finalTranscript && finalTranscript.toLowerCase().includes('kg')) {
        parseTranscript(finalTranscript);
        setTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    (window as any).currentRecognition = recognition;
  };

  const stopListening = async () => {
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
    }
    setIsListening(false);
    setTranscript('');
  };

  const parseTranscript = async (text: string) => {
    const items: OrderItem[] = [];
    const pattern = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram|kilograma|kilogramów|szt|sztuk|sztuki)\s+([a-ząćęłńóśźż\s]+)/gi;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const quantity = parseFloat(match[1].replace(',', '.'));
      let unit = 'kg';
      const productName = match[3]?.trim();

      if (match[2] && (match[2].toLowerCase().includes('szt') || match[2].toLowerCase().includes('sztuk'))) {
        unit = 'szt';
      }

      if (productName && productName.length > 2) {
        const normalizedName = productName.toLowerCase().trim();
        const product = allProducts.find(p => {
          const pName = p.name.toLowerCase();
          return pName.includes(normalizedName) || normalizedName.includes(pName);
        });

        if (product) {
          items.push({
            productName: product.name,
            quantity,
            unit,
            productIndex: product.index,
            productId: product.id,
            matched: true,
          });
        } else {
          const suggestions = findSimilarProducts(productName);
          items.push({
            productName,
            quantity,
            unit,
            matched: false,
            suggestions,
          });
        }
      }
    }

    setOrderItems(prev => [...prev, ...items]);
    setTranscript('');
  };

  const confirmOrder = () => {
    const unmatchedItems = orderItems.filter(item => !item.matched);
    if (unmatchedItems.length > 0) {
      const confirmed = window.confirm(
        `Uwaga! ${unmatchedItems.length} pozycji nie zostało dopasowanych do cennika. Przejdź do podsumowania i usuń te pozycje lub wróć i wybierz sugestie.`
      );
      if (!confirmed) return;
    }
    setStage('summary');
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
          status: 'sent',
          requires_confirmation: requiresConfirmation,
          total_amount: totalAmount,
          voice_transcript: JSON.stringify(orderItems),
          notes: notes,
          sent_at: new Date().toISOString(),
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
        action: 'created',
        performed_by: userId,
        details: {
          items_count: matchedItems.length,
          matched: matchedItems.length,
          total: orderItems.length
        },
      });

      alert(`Zamówienie wysłane! Dopasowano ${matchedItems.length} z ${orderItems.length} produktów.`);
      onOrderSent();
    } catch (error) {
      console.error('Error sending order:', error);
      alert('Błąd podczas wysyłania zamówienia');
    } finally {
      setSending(false);
    }
  };

  if (stage === 'summary') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🐃</span>
            <div>
              <h2 className="text-xl font-bold">Podsumowanie zamówienia</h2>
              <p className="text-amber-100 text-sm">Weź byka za rogi</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Pozycje zamówienia</h3>
            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit}
                      </p>
                      {item.productIndex && (
                        <div className="mt-2 flex items-center gap-2">
                          <svg className="w-24 h-10" viewBox="0 0 120 40">
                            {item.productIndex.split('').map((digit, i) => (
                              <rect
                                key={i}
                                x={i * 9}
                                y="5"
                                width={i % 2 === 0 ? "3" : "4.5"}
                                height="25"
                                fill="#000"
                              />
                            ))}
                          </svg>
                          <span className="font-mono text-xs text-gray-600">{item.productIndex}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editItem(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block mb-2 font-medium">Uwagi do zamówienia</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Dodaj uwagi..."
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresConfirmation}
                onChange={(e) => setRequiresConfirmation(e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded"
              />
              <span className="font-medium">Wymaga potwierdzenia przez hurtownię</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('confirmation')}
              className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              Wstecz
            </button>
            <button
              onClick={sendOrder}
              disabled={sending}
              className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Wysyłanie...' : 'Wyślij zamówienie'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🐃</span>
            <div>
              <h2 className="text-xl font-bold">Potwierdź zamówienie</h2>
              <p className="text-amber-100 text-sm">Weź byka za rogi</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Brak pozycji w zamówieniu</p>
            ) : (
              orderItems.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${item.matched ? 'bg-gray-50' : 'bg-yellow-50 border-2 border-yellow-300'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-lg">{item.productName}</p>
                        {!item.matched && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                            Nie znaleziono
                          </span>
                        )}
                        {item.matched && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            ✓ Dopasowano
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

                      {!item.matched && item.suggestions && item.suggestions.length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-200">
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
              onClick={confirmOrder}
              className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Check className="w-5 h-5" />
              Dalej
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🐃</span>
          <h2 className="text-xl font-bold">Nowe zamówienie głosowe</h2>
        </div>
        <p className="text-white font-semibold">Weź byka za rogi</p>
        <p className="text-amber-100 mt-1 text-sm">Dyktuj pozycje linijka po linijce, końcowe słowo: "kg"</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
              }`}
            >
              {isListening ? (
                <MicOff className="w-16 h-16 text-white" />
              ) : (
                <Mic className="w-16 h-16 text-white" />
              )}
            </button>
            <p className="mt-6 text-lg font-medium text-gray-700">
              {isListening ? 'Nagrywanie... Powiedz pozycję i zakończ słowem "kg"' : 'Kliknij aby rozpocząć nagrywanie'}
            </p>
            {isListening && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                Przykład: "5 kg schab" lub "3 kg kiełbasa"
              </p>
            )}
          </div>

          {transcript && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">Transkrypcja na żywo:</p>
              <p className="text-gray-700">{transcript}</p>
            </div>
          )}
        </div>

        {orderItems.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Rozpoznane pozycje ({orderItems.length})</h3>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit}
                      </p>
                      {item.productIndex && (
                        <div className="mt-2 flex items-center gap-2">
                          <svg className="w-20 h-8" viewBox="0 0 100 35">
                            {item.productIndex.split('').map((digit, i) => (
                              <rect
                                key={i}
                                x={i * 7.5}
                                y="4"
                                width={i % 2 === 0 ? "2.5" : "3.5"}
                                height="24"
                                fill="#000"
                              />
                            ))}
                          </svg>
                          <span className="font-mono text-xs text-gray-600">{item.productIndex}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStage('confirmation')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Check className="w-5 h-5" />
              Przejdź do potwierdzenia
            </button>
          </>
        )}
      </div>
    </div>
  );
}
