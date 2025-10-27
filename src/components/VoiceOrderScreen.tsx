/**
 * VoiceOrderScreen - Komponent do składania zamówień głosowych
 *
 * Główne funkcje:
 * - Rozpoznawanie mowy w czasie rzeczywistym (Web Speech API)
 * - Konwersja polskich liczb słownie na cyfry (trzy → 3, pół → 0.5)
 * - Inteligentne dopasowywanie produktów przez:
 *   1. smart_product_match (funkcja SQL w Supabase) - najlepsza metoda
 *   2. AI similarity search (embeddings + transformers.js) - fallback
 *   3. Text matching (indexOf, includes) - ostatnia deska ratunku
 * - Automatyczny dobór jednostek z cennika (kg vs szt)
 * - Tracking wszystkich nieudanych prób do analityki
 * - Learning system - zapamiętywanie korekt użytkownika
 *
 * Przepływ danych:
 * 1. Użytkownik mówi → Web Speech API → transkrypt
 * 2. Konwersja liczb słownie → regex patterns → wyodrębnienie produktów
 * 3. Dla każdego produktu:
 *    - Próba smart_match (SQL) → jeśli confidence >= 90% → automatyczna akceptacja
 *    - Jeśli nie → próba AI matching → jeśli confidence >= 70% → sugestie
 *    - Jeśli nie → fallback text matching → sugestie
 *    - Jeśli nic → logowanie do voice_recognition_attempts z przyczyną błędu
 * 4. Użytkownik potwierdza/koryguje → zapis do voice_learning_corrections
 * 5. Wysłanie zamówienia → draft order w bazie danych
 *
 * Tracking i analityka:
 * - voice_recognition_attempts - każda próba (udana i nieudana)
 * - voice_learning_corrections - korekty użytkownika dla uczenia się systemu
 * - metadata zawiera: metoda, przyczyna błędu, dostępność AI, czas przetwarzania
 */
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Plus, Minus, Check, Edit2, Send, X, ShoppingCart, Trash2, Sparkles, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HelpTooltip from './HelpTooltip';

/**
 * Produkt z bazy danych
 */
interface Product {
  id: string;
  name: string;
  index: string;      // Indeks katalogowy produktu
  unit: string;       // Jednostka: 'kg' lub 'szt'
}

/**
 * Pozycja zamówienia podczas składania
 *
 * matched:
 * - true = znaleziono dokładne dopasowanie (auto-akceptacja)
 * - false = nie znaleziono, pokazujemy sugestie
 * - 'ambiguous' = znaleziono kilka podobnych produktów (wymaga wyboru)
 *
 * suggestions: produkty do wyboru gdy matched === false lub 'ambiguous'
 * confidence: % pewności dopasowania AI (0-100)
 * aiMatched: czy użyto AI do dopasowania
 * phraseMapped: czy fraza została zmapowana przez phrase_mapping
 */
interface OrderItem {
  productName: string;
  quantity: number;
  unit: string;
  productIndex?: string;
  productId?: string;
  matched?: boolean | 'ambiguous';
  suggestions?: Product[];
  confidence?: number;
  aiMatched?: boolean;
  matchCount?: number;
  convertedQuantity?: number;
  convertedUnit?: string;
  originalQuantity?: number;
  originalUnit?: string;
  phraseMapped?: boolean;
  originalPhrase?: string;
  mappedPhrase?: string;
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
  const [showProductBrowser, setShowProductBrowser] = useState(false);
  const [browsingItemIndex, setBrowsingItemIndex] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchingItemIndex, setSearchingItemIndex] = useState<number | null>(null);
  const [inlineSearchQuery, setInlineSearchQuery] = useState('');
  const [showDeleteIcons, setShowDeleteIcons] = useState(false);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('show_delete_icons')
        .eq('id', userId)
        .maybeSingle();

      // Handle missing column or other errors gracefully
      if (error) {
        if (error.code === '42703' || error.message?.includes('column')) {
          // Column doesn't exist, use default
          setShowDeleteIcons(false);
        }
        return;
      }

      if (data?.show_delete_icons !== null && data?.show_delete_icons !== undefined) {
        setShowDeleteIcons(data.show_delete_icons);
      }
    } catch (err) {
      // Silently fail and use default
      setShowDeleteIcons(false);
    }
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome lub Edge.');
    }
    loadUserPreferences();
    loadProducts();

    const checkAIStatus = async () => {
      try {
        const { embeddingsManager } = await import('../lib/embeddingsManager');
        if (embeddingsManager.isReady()) {
          console.log('[AI] Detected preloaded AI');
          setAiReady(true);
        }
      } catch (error) {
        console.log('[AI] Not yet loaded');
      }
    };

    setTimeout(checkAIStatus, 500);
  }, []);

  const initializeAI = async () => {
    if (aiReady || aiInitializing) return;

    try {
      setAiInitializing(true);
      console.log('[AI] Checking initialization...');

      const { embeddingsManager } = await import('../lib/embeddingsManager');

      if (embeddingsManager.isReady()) {
        console.log('[AI] Already initialized (preloaded)!');
        setAiReady(true);
        setAiInitializing(false);

        // Jeśli mamy już produkty, wygeneruj embeddingi
        if (allProductsRef.current.length > 0) {
          console.log('[AI] Generating embeddings for existing products...');
          await embeddingsManager.generateProductEmbeddings(allProductsRef.current);
          console.log('[AI] Embeddings ready!');
        }
        return;
      }

      console.log('[AI] Starting initialization...');
      await embeddingsManager.initialize();

      // Wygeneruj embeddingi dla produktów
      if (allProductsRef.current.length > 0) {
        console.log('[AI] Generating embeddings for', allProductsRef.current.length, 'products...');
        await embeddingsManager.generateProductEmbeddings(allProductsRef.current);
        console.log('[AI] Embeddings ready!');
      }

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
        .select('id, name, index, unit')
        .eq('active', true);
      if (data) {
        console.log('Loaded products:', data.length);
        setAllProducts(data);
        allProductsRef.current = data;

        // Jeśli AI jest gotowe, wygeneruj embeddingi dla produktów
        if (aiReady && useAI) {
          try {
            console.log('[AI] Generating embeddings for loaded products...');
            const { embeddingsManager } = await import('../lib/embeddingsManager');
            await embeddingsManager.generateProductEmbeddings(data);
            console.log('[AI] Embeddings ready for', data.length, 'products');
          } catch (error) {
            console.error('[AI] Failed to generate embeddings:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };


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

  const checkAndCleanProfanity = async (text: string): Promise<string> => {
    try {
      // Check if text contains profanity
      const { data: hasProfanity, error: checkError } = await supabase
        .rpc('contains_profanity', { input_text: text });

      if (checkError) {
        console.error('[Profanity] Error checking:', checkError);
        return text;
      }

      if (hasProfanity) {
        console.warn('[Profanity] Detected profanity in voice input');

        // Log the profanity attempt
        try {
          await supabase.rpc('log_profanity_attempt', {
            p_user_id: userId,
            p_store_id: storeId,
            p_original_text: text
          });
        } catch (logError) {
          console.error('[Profanity] Error logging:', logError);
        }

        // Clean the profanity
        const { data: cleanedText, error: cleanError } = await supabase
          .rpc('clean_profanity', { input_text: text });

        if (cleanError) {
          console.error('[Profanity] Error cleaning:', cleanError);
          return text;
        }

        // Show warning to user
        setNotification('⚠️ Wykryto niedozwolone słowa. Tekst został ocenzurowany.');
        setTimeout(() => setNotification(''), 3000);

        return cleanedText || text;
      }

      return text;
    } catch (error) {
      console.error('[Profanity] Unexpected error:', error);
      return text;
    }
  };

  /**
   * Rozpoczyna nagrywanie głosu i rozpoznawanie mowy
   *
   * Proces:
   * 1. Sprawdza czy AI jest gotowe, jeśli nie - inicjalizuje w tle
   * 2. Tworzy instancję Web Speech API (SpeechRecognition)
   * 3. Konfiguruje:
   *    - lang: 'pl-PL' - rozpoznawanie polskiego
   *    - continuous: false - zatrzymuje się po zakończeniu wypowiedzi
   *    - interimResults: true - pokazuje częściowe wyniki w czasie rzeczywistym
   * 4. Ustawia timer nieaktywności (5 sekund bez mowy = auto stop)
   * 5. Na każdy wynik aktualizuje transkrypt i resetuje timer
   * 6. Po zakończeniu przetwarza transkrypt przez parseTranscript()
   *
   * Obsługa błędów:
   * - 'no-speech' - po 5 sekundach ciszy automatycznie kończy
   * - 'not-allowed' - brak uprawnień do mikrofonu
   * - inne błędy - loguje i kończy nagrywanie
   */
  const startListening = () => {
    // Inicjalizacja AI w tle jeśli jeszcze nie gotowe
    if (!aiReady && !aiInitializing && useAI) {
      initializeAI();
    }

    // Web Speech API - obsługa różnych prefiksów przeglądarek
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Konfiguracja rozpoznawania
    recognition.lang = 'pl-PL';              // Polski język
    recognition.continuous = false;           // Zatrzymaj po zakończeniu wypowiedzi
    recognition.interimResults = true;        // Pokazuj częściowe wyniki

    // Flaga do kontynuowania nasłuchiwania
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
        // Check and clean profanity before processing
        checkAndCleanProfanity(finalTranscript).then(cleanedText => {
          parseTranscript(cleanedText, allProductsRef.current);
        });
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

  /**
   * Przetwarza transkrypt głosowy i dopasowuje produkty
   *
   * Proces:
   * 1. Konwertuje polskie liczby słownie na cyfry (trzy → 3)
   * 2. Wyodrębnia ilości, jednostki i nazwy produktów za pomocą regex
   * 3. Dopasowuje produkty używając smart_match (baza danych)
   * 4. Używa jednostki produktu z cennika zamiast domyślnej
   * 5. Fallback do AI matching jeśli smart_match nie znalazł produktu
   * 6. Loguje nieudane próby do analityki
   *
   * @param text - Transkrypt głosowy od użytkownika
   * @param products - Lista wszystkich aktywnych produktów
   */
  const parseTranscript = async (text: string, products: Product[]) => {
    console.log('Parsing transcript:', text);
    console.log('Available products:', products.length);
    const items: OrderItem[] = [];

    // Słownik konwersji polskich liczb na cyfry
    // Obsługuje liczby 1-30 oraz "pół" (0.5)
    const numberWords: Record<string, string> = {
      'jeden': '1', 'jedna': '1', 'jedno': '1',
      'dwa': '2', 'dwie': '2',
      'trzy': '3',
      'cztery': '4',
      'pięć': '5', 'piec': '5',
      'sześć': '6', 'szesc': '6',
      'siedem': '7',
      'osiem': '8',
      'dziewięć': '9', 'dziewiec': '9',
      'dziesięć': '10', 'dziesiec': '10',
      'jedenaście': '11', 'jedenascie': '11',
      'dwanaście': '12', 'dwanascie': '12',
      'trzynaście': '13', 'trzynascie': '13',
      'czternaście': '14', 'czternascie': '14',
      'piętnaście': '15', 'pietnascie': '15',
      'szesnaście': '16', 'szesnascie': '16',
      'dwadzieścia': '20', 'dwadziescia': '20',
      'trzydzieści': '30', 'trzydziesci': '30',
      'pół': '0.5', 'pol': '0.5'
    };

    // Konwersja słownych liczb na cyfry w całym tekście
    let processedText = text;
    Object.keys(numberWords).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processedText = processedText.replace(regex, numberWords[word]);
    });

    // Pattern 1: Ilość + jednostka + nazwa ("3 kg schab")
    const pattern1 = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram|kilograma|kilogramów|szt|sztuk|sztuki)\s+([a-ząćęłńóśźż\s]+)/gi;

    // Pattern 2: Nazwa + ilość + jednostka ("schab 3 kg")
    const pattern2 = /([a-ząćęłńóśźż\s]+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram|kilograma|kilogramów|szt|sztuk|sztuki)/gi;

    // Pattern 3: Ilość + nazwa BEZ jednostki ("3 karkówki")
    // Dopasowuje polskie końcówki liczby mnogiej: -ki, -ek, -ów, -y, -i, -e
    const pattern3 = /(\d+(?:[.,]\d+)?)\s+([a-ząćęłńóśźż]+(?:ki|ek|ów|y|i|e)?(?:\s+[a-ząćęłńóśźż]+)*)/gi;

    const matches = [];
    let match;

    while ((match = pattern1.exec(processedText)) !== null) {
      matches.push({ quantity: match[1], unit: match[2], productName: match[3] });
    }

    while ((match = pattern2.exec(processedText)) !== null) {
      matches.push({ productName: match[1], quantity: match[2], unit: match[3] });
    }

    // Try pattern without explicit unit
    if (matches.length === 0) {
      while ((match = pattern3.exec(processedText)) !== null) {
        matches.push({ quantity: match[1], unit: 'kg', productName: match[2] });
      }
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
        let normalizedName = productName.toLowerCase().trim();
        let originalPhrase = normalizedName;
        let phraseMapped = false;

        console.log('[SmartMatch] Looking for product:', normalizedName);

        // Use the new smart_product_match function that combines all methods
        try {
          const { data: smartMatches, error } = await supabase
            .rpc('smart_product_match', {
              search_phrase: normalizedName,
              p_store_id: storeId,
              max_results: 5
            });

          if (error) {
            console.error('[SmartMatch] Error:', error);
          } else if (smartMatches && smartMatches.length > 0) {
            console.log(`[SmartMatch] Found ${smartMatches.length} matches:`, smartMatches);

            const topMatch = smartMatches[0];

            // Check if phrase was mapped
            const { data: mappedPhrase } = await supabase
              .rpc('apply_phrase_mapping', {
                phrase: normalizedName,
                p_store_id: storeId
              });

            if (mappedPhrase && mappedPhrase !== normalizedName) {
              phraseMapped = true;
            }

            // Wysokie dopasowanie (>= 90%) - automatyczna akceptacja
            if (smartMatches.length === 1 || topMatch.confidence >= 90) {
              console.log(`[SmartMatch] Auto-matching with ${topMatch.confidence}% confidence (${topMatch.match_method})`);

              //WAŻNE: Używamy jednostki z cennika, nie tej podanej przez użytkownika
              // Przykład: użytkownik mówi "3 jajka" (bez jednostki, domyślnie kg)
              // ale w cenniku "Jajka L" ma unit='szt', więc użyjemy 'szt'
              const productUnit = (topMatch as any).product_unit || unit;

              items.push({
                productName: topMatch.product_name,
                quantity,
                unit: productUnit,
                productIndex: topMatch.product_index,
                productId: topMatch.product_id,
                matched: true,
                confidence: topMatch.confidence,
                aiMatched: topMatch.match_method === 'learned',
                phraseMapped,
                originalPhrase: phraseMapped ? originalPhrase : undefined,
                mappedPhrase: phraseMapped ? topMatch.product_name : undefined,
              });
              continue;
            }

            // If we have multiple matches or moderate confidence, show as ambiguous
            if (smartMatches.length > 1) {
              const matchProducts = smartMatches.map(m => ({
                id: m.product_id,
                name: m.product_name,
                index: m.product_index,
                unit: (m as any).product_unit || 'kg',
                store_id: storeId
              }));

              console.log(`[SmartMatch] Multiple matches, showing ${matchProducts.length} suggestions`);
              items.push({
                productName,
                quantity,
                unit,
                matched: 'ambiguous',
                suggestions: matchProducts,
                confidence: topMatch.confidence,
                aiMatched: false,
                matchCount: smartMatches.length,
                phraseMapped,
                originalPhrase: phraseMapped ? originalPhrase : undefined,
                mappedPhrase: phraseMapped ? normalizedName : undefined,
              });
              continue;
            }
          }

          // Smart match nie znalazł produktu - próbujemy fallback
          console.log('[SmartMatch] No matches found, trying fallback methods');

          // Logowanie nieudanej próby rozpoznania do analityki
          // Te dane są używane do identyfikacji problematycznych fraz i produktów
          try {
            await supabase.from('voice_recognition_attempts').insert({
              user_id: userId,
              original_phrase: normalizedName,
              recognized_phrase: normalizedName,
              initial_product_id: null,
              final_product_id: null,
              was_corrected: false,
              confidence_score: 0,
              metadata: {
                method: 'smart_match_failed',
                processed_text: processedText,
                original_text: text
              }
            });
          } catch (trackError) {
            console.error('[Tracking] Failed to log recognition attempt:', trackError);
          }
        } catch (error) {
          console.error('[SmartMatch] Unexpected error:', error);
        }

        const allMatches = products.filter(p => {
          const pName = p.name.toLowerCase();

          // Exact match
          if (pName === normalizedName) return true;

          // Normalize Polish word forms (dopełniacz, etc)
          const normalizedBase = normalizedName.replace(/y$|i$|ę$|ą$/, 'a').replace(/ów$/, '');
          const pNameBase = pName.replace(/y$|i$|ę$|ą$/, 'a').replace(/ów$/, '');

          // Check if product name starts with the normalized search term
          if (pName.startsWith(normalizedBase) || pName.startsWith(normalizedName)) return true;

          // Check if search term (min 4 chars) is at the beginning of any word in product name
          if (normalizedName.length >= 4) {
            const words = pName.split(' ');
            return words.some(word => word.startsWith(normalizedBase) || word.startsWith(normalizedName));
          }

          return false;
        });

        if (allMatches.length === 1) {
          console.log('Found exact match:', allMatches[0].name);
          // Use product's unit from database
          const productUnit = allMatches[0].unit || unit;

          items.push({
            productName: allMatches[0].name,
            quantity,
            unit: productUnit,
            productIndex: allMatches[0].index,
            productId: allMatches[0].id,
            matched: true,
            confidence: 100,
            aiMatched: false,
            phraseMapped,
            originalPhrase: phraseMapped ? originalPhrase : undefined,
            mappedPhrase: phraseMapped ? normalizedName : undefined,
          });
        } else if (allMatches.length > 1) {
          console.log('[Fallback] Found multiple matches:', allMatches.length, allMatches.map(p => p.name));

          items.push({
            productName,
            quantity,
            unit,
            matched: 'ambiguous',
            suggestions: allMatches,
            confidence: 100,
            aiMatched: false,
            matchCount: allMatches.length,
            phraseMapped,
            originalPhrase: phraseMapped ? originalPhrase : undefined,
            mappedPhrase: phraseMapped ? normalizedName : undefined,
          });
        } else if (useAI && aiReady) {
          console.log('[AI] Using AI to find similar products for:', productName);
          console.log('[AI] useAI:', useAI, 'aiReady:', aiReady);
          try {
            const { embeddingsManager } = await import('../lib/embeddingsManager');
            console.log('[AI] embeddingsManager loaded, isReady:', embeddingsManager.isReady());
            const aiResults = await embeddingsManager.findSimilarProducts(productName, products, 5);
            console.log('[AI] Found', aiResults.length, 'results');

            if (aiResults.length > 0 && aiResults[0].confidence >= 95) {
              console.log('[AI] Very high confidence match:', aiResults[0].product.name, aiResults[0].confidence);
              // Use product's unit from database
              const productUnit = aiResults[0].product.unit || unit;

              items.push({
                productName: aiResults[0].product.name,
                quantity,
                unit: productUnit,
                productIndex: aiResults[0].product.index,
                productId: aiResults[0].product.id,
                matched: true,
                confidence: aiResults[0].confidence,
                aiMatched: true,
                phraseMapped,
                originalPhrase: phraseMapped ? originalPhrase : undefined,
                mappedPhrase: phraseMapped ? normalizedName : undefined,
              });
            } else if (aiResults.length > 1 && aiResults[0].confidence >= 85) {
              const topResults = aiResults.slice(0, Math.min(5, aiResults.length));
              const confidenceDiff = topResults[0].confidence - topResults[topResults.length - 1].confidence;

              if (confidenceDiff <= 10) {
                console.log('[AI] Multiple similar confidence matches:', topResults.map(r => `${r.product.name} (${r.confidence}%)`));
                items.push({
                  productName,
                  quantity,
                  unit,
                  matched: 'ambiguous',
                  suggestions: topResults.map(r => r.product),
                  confidence: topResults[0].confidence,
                  aiMatched: true,
                  matchCount: topResults.length,
                  phraseMapped,
                  originalPhrase: phraseMapped ? originalPhrase : undefined,
                  mappedPhrase: phraseMapped ? normalizedName : undefined,
                });
              } else {
                console.log('[AI] High confidence match with gap:', aiResults[0].product.name, aiResults[0].confidence);
                // Use product's unit from database
                const productUnit = aiResults[0].product.unit || unit;

                items.push({
                  productName: aiResults[0].product.name,
                  quantity,
                  unit: productUnit,
                  productIndex: aiResults[0].product.index,
                  productId: aiResults[0].product.id,
                  matched: true,
                  confidence: aiResults[0].confidence,
                  aiMatched: true,
                  phraseMapped,
                  originalPhrase: phraseMapped ? originalPhrase : undefined,
                  mappedPhrase: phraseMapped ? normalizedName : undefined,
                });
              }
            } else if (aiResults.length > 0) {
              console.log('[AI] Found suggestions:', aiResults.length);

              // Use AI suggestions
              const suggestions = aiResults.map(r => r.product);

              items.push({
                productName,
                quantity,
                unit,
                matched: false,
                suggestions: suggestions,
                confidence: aiResults[0]?.confidence,
                phraseMapped,
                originalPhrase: phraseMapped ? originalPhrase : undefined,
                mappedPhrase: phraseMapped ? normalizedName : undefined,
              });
            } else {
              // No AI results - logujemy nieudaną próbę
              console.log('[Tracking] No products found at all for:', normalizedName);
              try {
                await supabase.from('voice_recognition_attempts').insert({
                  user_id: userId,
                  original_phrase: normalizedName,
                  recognized_phrase: normalizedName,
                  initial_product_id: null,
                  final_product_id: null,
                  was_corrected: false,
                  confidence_score: 0,
                  metadata: {
                    method: 'no_matches_found',
                    reason: 'Brak jakichkolwiek dopasowań - ani smart_match, ani AI, ani fallback',
                    processed_text: processedText,
                    original_text: text,
                    ai_available: useAI && aiReady
                  }
                });
              } catch (trackError) {
                console.error('[Tracking] Failed to log no matches:', trackError);
              }

              const suggestions: Product[] = [];
              items.push({
                productName,
                quantity,
                unit,
                matched: false,
                suggestions: suggestions,
                phraseMapped,
                originalPhrase: phraseMapped ? originalPhrase : undefined,
                mappedPhrase: phraseMapped ? normalizedName : undefined,
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
              phraseMapped,
              originalPhrase: phraseMapped ? originalPhrase : undefined,
              mappedPhrase: phraseMapped ? normalizedName : undefined,
            });
          }
        } else {
          console.log('[Fallback] Using text matching for:', productName);
          console.log('[Fallback] useAI:', useAI, 'aiReady:', aiReady);
          const suggestions = findSimilarProducts(productName, products);

          console.log('[Fallback] Found', suggestions.length, 'suggestions');
          if (suggestions.length > 0) {
            items.push({
              productName,
              quantity,
              unit,
              matched: false,
              suggestions,
              phraseMapped,
              originalPhrase: phraseMapped ? originalPhrase : undefined,
              mappedPhrase: phraseMapped ? normalizedName : undefined,
            });
          } else {
            // Fallback też nie znalazł produktów - logujemy
            console.log('[Tracking] Fallback found no products for:', normalizedName);
            try {
              await supabase.from('voice_recognition_attempts').insert({
                user_id: userId,
                original_phrase: normalizedName,
                recognized_phrase: normalizedName,
                initial_product_id: null,
                final_product_id: null,
                was_corrected: false,
                confidence_score: 0,
                metadata: {
                  method: 'fallback_no_matches',
                  reason: 'Fallback text matching nie znalazł podobnych produktów',
                  processed_text: processedText,
                  original_text: text
                }
              });
            } catch (trackError) {
              console.error('[Tracking] Failed to log fallback failure:', trackError);
            }

            items.push({
              productName,
              quantity,
              unit,
              matched: false,
              suggestions: [],
              phraseMapped,
              originalPhrase: phraseMapped ? originalPhrase : undefined,
              mappedPhrase: phraseMapped ? normalizedName : undefined,
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

      const ambiguousCount = items.filter(item => item.matched === 'ambiguous').length;
      const unmatchedCount = items.filter(item => item.matched === false).length;
      const matchedCount = items.filter(item => item.matched === true).length;

      if (ambiguousCount > 0 || unmatchedCount > 0) {
        let message = '';

        if (ambiguousCount > 0) {
          const ambiguousItems = items.filter(item => item.matched === 'ambiguous');
          const ambiguousNames = ambiguousItems.map(item => item.productName).join(', ');
          message += `🔶 Doprecyzuj: ${ambiguousNames} (${ambiguousCount} opcji)`;
        }

        if (unmatchedCount > 0) {
          const unmatchedItems = items.filter(item => item.matched === false);
          const unmatchedNames = unmatchedItems.map(item => item.productName).join(', ');
          if (message) message += '\n';
          message += `⚠️ Nie znaleziono: ${unmatchedNames}`;
        }

        if (matchedCount > 0) {
          const matchedNames = items.filter(item => item.matched === true).map(item => item.productName).join(', ');
          if (message) message += '\n';
          message += `✓ Dodano: ${matchedNames}`;
        }

        setNotification(message);
        setTimeout(() => setNotification(''), 8000);
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

  const browseAllProducts = (itemIndex: number) => {
    setSearchingItemIndex(itemIndex);
    setInlineSearchQuery('');
  };

  const selectProductFromInlineSearch = async (itemIndex: number, product: Product) => {
    const originalItem = orderItems[itemIndex];
    const spokenPhrase = originalItem.productName;

    // Record the learning correction
    try {
      await supabase.from('voice_learning_corrections').insert({
        user_id: userId,
        store_id: storeId,
        spoken_phrase: spokenPhrase,
        selected_product_id: product.id,
      });
      console.log(`[Learning] Recorded from inline search: "${spokenPhrase}" -> "${product.name}"`);
    } catch (error) {
      console.error('[Learning] Failed to record correction:', error);
    }

    // Track voice recognition attempt
    try {
      await supabase.from('voice_recognition_attempts').insert({
        user_id: userId,
        original_phrase: spokenPhrase,
        recognized_phrase: spokenPhrase,
        initial_product_id: originalItem.productId || null,
        final_product_id: product.id,
        was_corrected: true,
        confidence_score: originalItem.confidence || 0,
        metadata: {
          selection_method: 'inline_search',
          ai_matched: originalItem.aiMatched || false
        }
      });
    } catch (trackError) {
      console.error('[Tracking] Failed to log recognition attempt:', trackError);
    }

    const updated = [...orderItems];
    updated[itemIndex] = {
      ...updated[itemIndex],
      productName: product.name,
      productId: product.id,
      matched: true,
      suggestions: [],
    };
    setOrderItems(updated);
    setSearchingItemIndex(null);
    setInlineSearchQuery('');
  };

  const selectProductFromBrowser = async (product: Product) => {
    if (browsingItemIndex === null) return;

    const originalItem = orderItems[browsingItemIndex];
    const spokenPhrase = originalItem.productName;

    // Record the learning correction
    try {
      await supabase.from('voice_learning_corrections').insert({
        user_id: userId,
        store_id: storeId,
        spoken_phrase: spokenPhrase,
        selected_product_id: product.id,
      });
      console.log(`[Learning] Recorded from browser: "${spokenPhrase}" -> "${product.name}"`);
    } catch (error) {
      console.error('[Learning] Failed to record correction:', error);
    }

    // Track voice recognition attempt
    try {
      await supabase.from('voice_recognition_attempts').insert({
        user_id: userId,
        original_phrase: spokenPhrase,
        recognized_phrase: spokenPhrase,
        initial_product_id: originalItem.productId || null,
        final_product_id: product.id,
        was_corrected: true,
        confidence_score: originalItem.confidence || 0,
        metadata: {
          selection_method: 'product_browser',
          ai_matched: originalItem.aiMatched || false
        }
      });
    } catch (trackError) {
      console.error('[Tracking] Failed to log recognition attempt:', trackError);
    }

    const updated = [...orderItems];
    updated[browsingItemIndex] = {
      ...updated[browsingItemIndex],
      productName: product.name,
      productId: product.id,
      productIndex: product.index,
      matched: true,
      suggestions: [],
    };
    setOrderItems(updated);
    setShowProductBrowser(false);
    setBrowsingItemIndex(null);
  };

  const selectSuggestion = async (itemIndex: number, product: Product) => {
    const originalItem = orderItems[itemIndex];
    const spokenPhrase = originalItem.productName;

    // Record the learning correction
    try {
      await supabase.from('voice_learning_corrections').insert({
        user_id: userId,
        store_id: storeId,
        spoken_phrase: spokenPhrase,
        selected_product_id: product.id,
      });
      console.log(`[Learning] Recorded: "${spokenPhrase}" -> "${product.name}"`);
    } catch (error) {
      console.error('[Learning] Failed to record correction:', error);
    }

    // Track voice recognition attempt with correction
    try {
      await supabase.from('voice_recognition_attempts').insert({
        user_id: userId,
        original_phrase: spokenPhrase,
        recognized_phrase: spokenPhrase,
        initial_product_id: originalItem.productId || null,
        final_product_id: product.id,
        was_corrected: true,
        confidence_score: originalItem.confidence || 0,
        metadata: {
          ai_matched: originalItem.aiMatched || false,
          match_count: originalItem.matchCount || (originalItem.suggestions?.length || 0)
        }
      });
    } catch (trackError) {
      console.error('[Tracking] Failed to log recognition attempt:', trackError);
    }

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

    const unmatchedItems = orderItems.filter(item => item.matched !== true);
    if (unmatchedItems.length > 0) {
      const ambiguousCount = unmatchedItems.filter(item => item.matched === 'ambiguous').length;
      const notFoundCount = unmatchedItems.filter(item => !item.matched).length;
      const matchedCount = orderItems.length - unmatchedItems.length;

      if (matchedCount === 0) {
        alert('Nie dopasowano żadnego produktu. Wybierz produkty z listy sugestii lub usuń niedopasowane pozycje.');
        return;
      }

      let message = `Niektóre produkty nie zostały dopasowane i zostaną pominięte:\n`;
      if (ambiguousCount > 0) {
        message += `\n• ${ambiguousCount} wymaga doprecyzowania`;
      }
      if (notFoundCount > 0) {
        message += `\n• ${notFoundCount} nie znaleziono w cenniku`;
      }
      message += `\n\nZapisać szkic z ${matchedCount} dopasowanymi produktami?`;

      if (!confirm(message)) {
        return;
      }
    }

    setSending(true);
    try {
      const matchedItems = orderItems
        .filter(item => item.matched === true && item.productId)
        .map(item => {
          const product = allProducts.find(p => p.id === item.productId);
          if (!product) return null;

          return {
            product_id: product.id,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: 0,
            total_price: 0,
          };
        })
        .filter(Boolean);

      if (matchedItems.length === 0) {
        alert('Nie udało się dopasować żadnego produktu z cennika. Sprawdź nazwy produktów.');
        setSending(false);
        return;
      }

      const orderNumber = `RO-${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          created_by: userId,
          status: 'draft',
          requires_confirmation: requiresConfirmation,
          total_amount: 0,
          voice_transcript: JSON.stringify(orderItems),
          notes: notes,
          source_type: 'voice',
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
    const itemsWithConversion = orderItems.map(item => {
      const product = item.productId ? allProducts.find(p => p.id === item.productId) : null;

      if (item.unit === 'szt' && product?.average_weight && product.average_weight > 0) {
        const estimatedKg = item.quantity * product.average_weight;
        const convertedKg = Math.ceil(estimatedKg);
        return {
          ...item,
          convertedQuantity: convertedKg,
          convertedUnit: 'kg',
          originalQuantity: item.quantity,
          originalUnit: item.unit
        };
      }

      return item;
    });

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {itemsWithConversion.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Brak pozycji w zamówieniu</p>
            ) : (
              itemsWithConversion.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  item.matched === 'ambiguous' ? 'bg-orange-50 border-2 border-orange-300' :
                  item.matched === true ? 'bg-gray-50' :
                  'bg-yellow-50 border-2 border-yellow-300'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-lg">{item.productName}</p>
                        {item.phraseMapped && item.originalPhrase && (
                          <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded flex items-center gap-1 font-medium">
                            🔄 "{item.originalPhrase}" → "{item.mappedPhrase}"
                          </span>
                        )}
                        {item.matched === 'ambiguous' && (
                          <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded font-medium">
                            ⚠️ Doprecyzuj ({item.matchCount} opcji)
                          </span>
                        )}
                        {!item.matched && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                            Nie znaleziono
                          </span>
                        )}
                        {item.matched === true && !item.aiMatched && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            ✓ Dopasowano
                          </span>
                        )}
                        {item.matched === true && item.aiMatched && (
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
                      <div className="text-gray-600">
                        {item.convertedQuantity && item.convertedUnit ? (
                          <div>
                            <p className="font-semibold text-amber-700">
                              {item.convertedQuantity}{item.convertedUnit && item.convertedUnit !== 'kg' ? ` ${item.convertedUnit}` : ''}
                            </p>
                            <p className="text-sm text-gray-500">
                              (z {item.originalQuantity}{item.originalUnit && item.originalUnit !== 'kg' ? ` ${item.originalUnit}` : ''})
                            </p>
                          </div>
                        ) : (
                          <p>{item.quantity}{item.unit && item.unit !== 'kg' ? ` ${item.unit}` : ''}</p>
                        )}
                      </div>

                      {item.matched === 'ambiguous' && item.suggestions && item.suggestions.length > 0 && searchingItemIndex !== index && (
                        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-orange-300">
                          <p className="text-sm font-semibold text-orange-800 mb-2">Znaleziono {item.matchCount} produktów pasujących do '{item.productName}'. Którą chcesz zamówić?</p>
                          <div className="space-y-1 mb-3">
                            {item.suggestions.map((suggestion) => (
                              <button
                                key={suggestion.id}
                                onClick={() => selectSuggestion(index, suggestion)}
                                className="w-full text-left p-3 text-sm bg-orange-50 hover:bg-orange-100 rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all"
                              >
                                <span className="font-semibold text-orange-900">{suggestion.name}</span>
                                <span className="text-gray-600 ml-2 text-xs">({suggestion.index})</span>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => browseAllProducts(index)}
                            className="w-full py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Search className="w-4 h-4" />
                            Żadna z powyższych - szukaj ręcznie
                          </button>
                        </div>
                      )}
                      {searchingItemIndex === index && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                          <div className="mb-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                placeholder="Wpisz nazwę lub indeks produktu..."
                                value={inlineSearchQuery}
                                onChange={(e) => setInlineSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                autoFocus
                              />
                            </div>
                          </div>
                          {inlineSearchQuery.length >= 2 && (
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {allProducts
                                .filter(p =>
                                  p.name.toLowerCase().includes(inlineSearchQuery.toLowerCase()) ||
                                  p.index.toLowerCase().includes(inlineSearchQuery.toLowerCase())
                                )
                                .slice(0, 10)
                                .map((product) => (
                                  <button
                                    key={product.id}
                                    onClick={() => selectProductFromInlineSearch(index, product)}
                                    className="w-full text-left p-2 text-sm bg-white hover:bg-blue-100 rounded border border-blue-200 hover:border-blue-400 transition"
                                  >
                                    <span className="font-medium text-blue-700">{product.name}</span>
                                    <span className="text-gray-500 ml-2 text-xs">({product.index})</span>
                                  </button>
                                ))}
                              {allProducts.filter(p =>
                                p.name.toLowerCase().includes(inlineSearchQuery.toLowerCase()) ||
                                p.index.toLowerCase().includes(inlineSearchQuery.toLowerCase())
                              ).length === 0 && (
                                <p className="text-sm text-gray-500 py-2 text-center">Brak wyników</p>
                              )}
                            </div>
                          )}
                          {inlineSearchQuery.length < 2 && (
                            <p className="text-xs text-gray-600 text-center py-2">Wpisz minimum 2 znaki aby wyszukać</p>
                          )}
                          <button
                            onClick={() => {
                              setSearchingItemIndex(null);
                              setInlineSearchQuery('');
                            }}
                            className="w-full mt-3 py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Anuluj
                          </button>
                        </div>
                      )}
                      {item.matched === false && searchingItemIndex !== index && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-200">
                          {item.suggestions && item.suggestions.length > 0 ? (
                            <>
                              <p className="text-sm font-medium text-gray-700 mb-2">Czy chodziło o:</p>
                              <div className="space-y-1 mb-3">
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
                              <button
                                onClick={() => browseAllProducts(index)}
                                className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <Search className="w-4 h-4" />
                                Żadna z powyższych - szukaj ręcznie
                              </button>
                            </>
                          ) : (
                            <div className="text-sm">
                              <p className="font-medium mb-2 text-amber-700">⚠️ Nie znaleziono pasującego produktu</p>
                              <p className="text-xs text-gray-600 mb-3">Wyszukaj produkt wpisując jego nazwę lub indeks:</p>
                              <button
                                onClick={() => browseAllProducts(index)}
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <Search className="w-4 h-4" />
                                Szukaj produktu
                              </button>
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
              className="flex-1 py-2.5 px-4 bg-white border-2 border-amber-500 text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Dodaj więcej
            </button>
            <button
              onClick={sendOrder}
              disabled={sending}
              className="flex-1 py-5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Zamówienie głosowe</h3>
            <HelpTooltip
              tooltipId="voice-order-mic-button"
              position="bottom"
            />
          </div>
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
                        {item.quantity}{item.unit && item.unit !== 'kg' ? ` ${item.unit}` : ''}
                      </p>
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
                      {showDeleteIcons && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStage('confirmation')}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <Check className="w-5 h-5" />
                Zapisz jako szkic
              </button>
            </div>
          </>
        )}
      </div>

      {/* Product Browser Modal */}
      {showProductBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Wybierz produkt z cennika</h2>
                <button
                  onClick={() => setShowProductBrowser(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj produktu..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {allProducts
                  .filter(p =>
                    productSearchQuery === '' ||
                    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    p.index.toLowerCase().includes(productSearchQuery.toLowerCase())
                  )
                  .map((product) => (
                    <button
                      key={product.id}
                      onClick={() => selectProductFromBrowser(product)}
                      className="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Indeks: {product.index}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
              {allProducts.filter(p =>
                productSearchQuery === '' ||
                p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                p.index.toLowerCase().includes(productSearchQuery.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nie znaleziono produktów</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
