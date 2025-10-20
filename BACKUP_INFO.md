# Backup aplikacji RODEO

## Informacje o backupie

**Data ostatniej aktualizacji:** 2025-10-20 10:57:51
**Wersja:** v1.2 - System uczenia AI i rozszerzone metryki
**Plik backup:** `rodeo-backup-20251020-105751.tar.gz` (292 KB skompresowany)

### Nowe funkcje w tej wersji:
- ✅ **System uczenia się AI z ręcznych dopasowań**
  - Tabela `voice_learning_corrections` - zapisuje korekty użytkowników
  - Automatyczne tworzenie mapowań fraz (`voice_phrase_mappings`)
  - Funkcja `smart_product_match` - wykorzystuje historię korekt
  - Funkcja `get_learned_product_match` - znajduje najczęściej wybierane produkty
  - Automatyczne triggery analizujące wzorce co 10 korekt

- ✅ **Rozbudowane panele analityczne**
  - AIMetricsPanel z 4 zakładkami (Metryki, Nauka głosowa, Nierozpoznane próby, Cache)
  - VoiceLearningPanel - analiza produktów problemowych, mapowań fraz i konfliktów
  - Szczegółowe widoki: `problem_products_view`, `phrase_mapping_view`, `phrase_conflicts_view`
  - Tracking nieudanych rozpoznań w `voice_recognition_attempts`

- ✅ **Pamięć podręczna AI (Embeddings Cache)**
  - IndexedDB storage dla embeddingów produktów (384-wymiarowe wektory)
  - Import/Export cache do pliku JSON
  - Zarządzanie pojedynczymi embeddingami (edycja, usuwanie)
  - Metryki użycia cache i wydajności

- ✅ **Poprzednie funkcje (v1.1)**
  - Rozpoznawanie polskich liczb słownie (trzy, pięć, dwadzieścia)
  - Automatyczny dobór jednostek z cennika (kg/szt)
  - Obsługa zamówień bez jawnej jednostki ("3 karkówki")
  - Tracking nieudanych rozpoznań do analityki
  - Sortowanie w panelu Top Products

## Zawartość backupu

Backup zawiera kompletny kod źródłowy aplikacji:

### Frontend (React + TypeScript)
- Wszystkie komponenty UI
- System zamówień (głosowy, manualny, auto, cennikowy)
- Panel administracyjny
- Panel analityczny z 4 zakładkami
- Panel AI z metrykami, nauką głosową i cache
- Zarządzanie użytkownikami, produktami, sklepami
- System tagów i kategorii
- Tryb dark mode
- PWA support

### Baza danych (Supabase)
- Migracje SQL w folderze `supabase/migrations/` (**107 plików migracji**)
- Wszystkie tabele z RLS policies (bezpieczny dostęp do danych)
- Views analityczne (problem_products_view, phrase_mapping_view, phrase_conflicts_view)
- Funkcje automatycznych sugestii (auto_order_suggestions)
- System trackingu sesji użytkowników (user_sessions, session_cleanup)
- **NOWOŚĆ v1.2:** Tabela `voice_learning_corrections` - korekty użytkowników
- **NOWOŚĆ v1.2:** Tabela `voice_phrase_mappings` - automatyczne mapowania fraz
- **NOWOŚĆ v1.2:** Tabela `voice_recognition_attempts` - tracking prób rozpoznawania
- **NOWOŚĆ v1.2:** Funkcja `smart_product_match` - inteligentne dopasowanie z uczeniem
- **NOWOŚĆ v1.2:** Funkcja `get_learned_product_match` - matching oparty o historię
- **NOWOŚĆ v1.2:** Funkcja `analyze_and_create_phrase_mappings` - auto-analiza wzorców
- **NOWOŚĆ v1.2:** Triggery automatycznej analizy mapowań

### Edge Functions (Supabase)
- auto-order-suggestion
- auto-order-refresh-scheduler

## Jak przywrócić backup

### 1. Rozpakowanie
```bash
tar -xzf rodeo-backup-YYYYMMDD-HHMMSS.tar.gz
cd project
```

### 2. Instalacja zależności
```bash
npm install
```

### 3. Konfiguracja środowiska
Skopiuj plik `.env` i uzupełnij danymi Supabase:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Przywrócenie bazy danych
Wszystkie migracje są w folderze `supabase/migrations/`.
Użyj narzędzi Supabase aby zastosować migracje w kolejności:

```bash
# Jeśli używasz Supabase CLI (nie wymagane, możesz też ręcznie przez dashboard)
supabase db push
```

Lub ręcznie wykonaj SQL z każdego pliku migracji przez Supabase Dashboard w kolejności alfabetycznej.

### 5. Deploy Edge Functions
```bash
# Funkcje są w folderze supabase/functions/
# Deploy przez Supabase Dashboard lub CLI
```

### 6. Build i uruchomienie
```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

## Struktura projektu

```
project/
├── src/
│   ├── components/       # Wszystkie komponenty React
│   ├── contexts/         # Context providers (Auth, Theme)
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities i helpers
│   └── main.tsx         # Entry point
├── supabase/
│   ├── migrations/      # Migracje bazy danych
│   └── functions/       # Edge Functions
├── public/              # Static assets
└── package.json         # Dependencies

```

## Kluczowe funkcje

### Użytkownicy
- Role: user, admin, driver, analyst
- Przypisanie do sklepów
- Preferencje wyświetlania i motywu

### Zamówienia
- 4 tryby: głosowy, manualny, auto-sugestie, z cennika
- Statusy: notatnik, draft, in_progress, completed, rejected
- Auto-sugestie oparte o historię
- System promocji (10+1, zniżki procentowe)

### Analityka
- **Automatyczne** zarządzanie sesjami (zamykanie nieaktywnych co 5 min)
- Tracking sesji użytkowników z wykrywaniem urządzeń
- Metryki AI (embeddings, similarity search)
- Voice recognition accuracy
- Rankingi logowań (sklepy, użytkownicy)
- Przeglądarka sesji z filtrowaniem
- Path clustering
- Top produkty z filtrowaniem i statystykami
- SessionCleanupService - automatyczne czyszczenie w tle

### AI & Machine Learning
- **Embeddings System:**
  - 384-wymiarowe wektory dla każdego produktu (model: Xenova/all-MiniLM-L6-v2)
  - Lokalny cache w IndexedDB (rodeo-embeddings)
  - Import/Export cache do pliku JSON
  - Automatyczna regeneracja przy braku cache

- **Similarity Search:**
  - Cosine similarity dla porównywania produktów
  - Threshold 30% dla filtrowania wyników
  - Ranking confidence score (0-100%)
  - Fallback do text matching gdy AI niedostępne

- **Voice Recognition System:**
  - Web Speech API (Chrome/Edge)
  - Konwersja polskich liczb słownie (trzy → 3, pół → 0.5)
  - Smart product matching z trzema poziomami:
    1. Learned matches (z historii korekt) - najwyższy priorytet
    2. Exact matches (dokładne dopasowanie nazwy)
    3. Fuzzy matches (częściowe dopasowanie)
  - Automatyczny dobór jednostek z bazy danych (kg/szt)
  - Pattern matching dla zamówień bez jednostek
  - Profanity filter i auto-cenzura

- **Learning System:**
  - Automatyczne zapisywanie korekt użytkowników
  - Phrase mapping - mapowanie synonimów i wariantów
  - Analiza wzorców co 10 korekt (trigger)
  - Confidence scoring dla mapowań (50-100%)
  - Problem products detection
  - Phrase conflicts analysis

- **Metryki i Analytics:**
  - Tabela ai_metrics - wszystkie operacje AI
  - Widok ai_model_performance - agregacje wydajności
  - Tracking accuracy rate dla rozpoznawania głosowego
  - Szczegółowe logi nieudanych prób
  - Metadata z kontekstem (metoda, przyczyna, czas)

## Ważne uwagi

1. **Environment Variables:** Zawsze sprawdź plik `.env` przed uruchomieniem
2. **Migracje:** Wykonuj migracje dokładnie w kolejności nazw plików
3. **RLS Policies:** Wszystkie tabele mają włączone RLS dla bezpieczeństwa
4. **Edge Functions:** Wymagają deploymentu przez Supabase
5. **PWA:** Service worker w `public/sw.js` dla offline support

## Kontakt

W razie problemów z przywróceniem backupu, sprawdź:
- Logi konsoli przeglądarki
- Logi Supabase Dashboard
- Network tab w DevTools

## Wersje technologii

- React: 18.3.1
- TypeScript: 5.5.3
- Vite: 5.4.2
- Supabase JS: 2.57.4
- Tailwind CSS: 3.4.1
- Transformers.js: 2.17.2
