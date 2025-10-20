# RODEO - Manifest Backupu v1.2

**Data utworzenia:** 2025-10-20 10:57:51
**Plik archiwum:** `rodeo-backup-20251020-105751.tar.gz`
**Rozmiar skompresowany:** 292 KB
**Rozmiar nieskompresowany:** ~364 MB
**Liczba plików:** 14,134

---

## Statystyki projektu

### Kod źródłowy
- **React komponenty:** 38 plików (.tsx)
- **Hooki:** 4 pliki
- **Context providers:** 2 pliki (Auth, Theme)
- **Utilities:** 6 plików bibliotecznych
- **Migracje SQL:** 107 plików
- **Edge Functions:** 2 funkcje Supabase

### Struktura bazy danych

#### Główne tabele
1. `users` - użytkownicy z rolami (user, admin, driver, analyst)
2. `stores` - sklepy z lokalizacjami GPS
3. `products` - produkty z jednostkami i cenami
4. `orders` - zamówienia ze statusami
5. `order_items` - pozycje zamówień
6. `price_lists` - cenniki dla sklepów
7. `special_prices` - ceny specjalne i promocje
8. `tags` - tagi produktów
9. `user_sessions` - sesje użytkowników z trackingiem
10. `session_paths` - ścieżki nawigacji w sesjach
11. `user_session_gaps` - przerwy między sesjami
12. `order_history` - historia zmian zamówień

#### Tabele AI i uczenia maszynowego
13. `voice_learning_corrections` - korekty rozpoznawania głosowego (per-user + global)
14. `voice_phrase_mappings` - automatyczne mapowania fraz (synonimów)
15. `voice_recognition_attempts` - tracking wszystkich prób rozpoznawania
16. `ai_metrics` - metryki operacji AI (embeddings, similarity search)
17. `ai_model_performance` - agregacje wydajności modelu

#### Tabele analityczne
18. `profanity_words` - słowa wulgarne do filtrowania
19. `profanity_attempts` - logi prób użycia wulgaryzmów
20. `user_analytics_events` - zdarzenia użytkowników
21. `push_notification_subscriptions` - subskrypcje push
22. `campaigns` - kampanie marketingowe

#### Widoki analityczne (Views)
- `problem_products_view` - produkty z największą liczbą korekt
- `phrase_mapping_view` - mapowanie fraz na produkty
- `phrase_conflicts_view` - konflikty w rozpoznawaniu fraz
- `ai_model_performance` - wydajność modelu AI

#### Funkcje bazy danych
- `smart_product_match` - inteligentne dopasowanie produktów z uczeniem
- `get_learned_product_match` - matching oparty o historię korekt
- `analyze_and_create_phrase_mappings` - auto-analiza wzorców
- `apply_phrase_mapping` - aplikacja mapowań przed matchingiem
- `calculate_auto_order_suggestions` - sugestie zamówień
- `clean_profanity` / `contains_profanity` - filtrowanie wulgaryzmów
- `normalize_spoken_phrase` - normalizacja fraz głosowych

---

## Nowe funkcje w wersji 1.2

### 1. System uczenia się AI
**Lokalizacja kodu:**
- `supabase/migrations/20251015114010_add_voice_learning_system.sql`
- `supabase/migrations/20251015114634_add_phrase_mapping_system.sql`
- `src/components/VoiceOrderScreen.tsx` (linie 976-1116)

**Jak działa:**
1. Użytkownik mówi "karkow" → system sugeruje produkty
2. Użytkownik wybiera "Karkówka extra Rytel"
3. System zapisuje: `spoken_phrase="karkow"` → `selected_product_id=(Karkówka)`
4. Po 3+ korektach system automatycznie tworzy mapowanie
5. Następnym razem "karkow" → automatyczne dopasowanie do "Karkówka"

**Poziomy uczenia:**
- **Per-User:** Każdy użytkownik ma swoje preferencje
- **Global (per-Store):** System uczy się z korekt wszystkich użytkowników sklepu
- **Confidence scoring:** Im więcej korekt, tym wyższy confidence (50-100%)

### 2. Rozbudowane panele analityczne
**Lokalizacja kodu:**
- `src/components/AIMetricsPanel.tsx` - główny panel metryki AI
- `src/components/VoiceLearningPanel.tsx` - panel nauki głosowej
- `supabase/migrations/20251017010313_add_voice_recognition_accuracy_tracking.sql`

**Zakładki w AIMetricsPanel:**
1. **Metryki** - operacje AI, czas wykonania, success rate
2. **Nauka głosowa** - produkty problemowe, mapowania fraz, konflikty
3. **Nierozpoznane próby** - szczegółowe logi błędów z metadanymi
4. **Pamięć podręczna** - zarządzanie embeddingami (384D wektory)

### 3. Pamięć podręczna AI (Embeddings)
**Lokalizacja kodu:**
- `src/lib/embeddingsManager.ts` - manager embeddingów
- IndexedDB: `rodeo-embeddings` (lokalna baza w przeglądarce)

**Funkcje:**
- Generowanie 384-wymiarowych wektorów dla nazw produktów
- Cache w IndexedDB (szybki dostęp, offline support)
- Export/Import cache do JSON (backup, współdzielenie)
- Edycja/usuwanie pojedynczych embeddingów
- Metryki użycia i wydajności

---

## Kluczowe komponenty React

### Ekrany zamówień
1. **VoiceOrderScreen** - zamówienia głosowe z AI
   - Web Speech API
   - Smart product matching (3 poziomy)
   - Automatyczny dobór jednostek
   - Learning system integration

2. **ManualOrderScreen** - tradycyjne zamówienia
3. **AutoOrderScreen** - sugestie oparte o historię
4. **PriceListOrderScreen** - zamówienia z cennika
5. **CopyOrderScreen** - kopiowanie poprzednich zamówień

### Panele administracyjne
6. **AdminPanel** - zarządzanie (użytkownicy, produkty, sklepy)
7. **AnalyticsPanel** - analityka (sesje, rankingi, top produkty)
8. **AIMetricsPanel** - metryki AI (4 zakładki)
9. **VoiceLearningPanel** - analiza nauki systemu

### Zarządzanie danymi
10. **ProductManager** - CRUD produktów
11. **UsersManager** - CRUD użytkowników
12. **StoresManager** - CRUD sklepów
13. **TagsManager** - zarządzanie tagami
14. **PriceListManager** - cenniki i promocje

---

## Instrukcja przywracania backupu

### Krok 1: Rozpakowanie
```bash
tar -xzf rodeo-backup-20251020-105751.tar.gz
cd project
```

### Krok 2: Instalacja zależności
```bash
npm install
```

### Krok 3: Konfiguracja .env
```bash
cp .env.example .env
# Uzupełnij:
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj_anon_key
```

### Krok 4: Przywrócenie bazy danych
**Opcja A - Supabase CLI (zalecane):**
```bash
supabase db push
```

**Opcja B - Ręcznie przez Dashboard:**
1. Zaloguj się do Supabase Dashboard
2. SQL Editor → New Query
3. Wykonaj migracje w kolejności alfabetycznej z folderu `supabase/migrations/`

**UWAGA:** Kolejność migracji jest kluczowa! Nazwy plików zawierają timestamp.

### Krok 5: Deploy Edge Functions
```bash
# Przez Supabase CLI
supabase functions deploy auto-order-suggestion
supabase functions deploy auto-order-refresh-scheduler

# Lub przez Dashboard → Edge Functions → Deploy
```

### Krok 6: Uruchomienie
```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

---

## Checklist przywracania

- [ ] Archiwum rozpakowane
- [ ] Zależności npm zainstalowane
- [ ] Plik .env skonfigurowany
- [ ] Wszystkie 107 migracji wykonane w kolejności
- [ ] Edge Functions wdrożone
- [ ] Aplikacja uruchomiona bez błędów
- [ ] Test logowania (admin@example.com / admin123)
- [ ] Test zamówienia głosowego
- [ ] Sprawdzenie panelu analitycznego
- [ ] Weryfikacja AI Metrics Panel

---

## Weryfikacja po przywróceniu

### 1. Sprawdź połączenie z bazą
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM stores;
```

### 2. Sprawdź funkcje
```sql
SELECT smart_product_match('schab', 'store-uuid', 5);
SELECT * FROM problem_products_view LIMIT 10;
```

### 3. Sprawdź Edge Functions
- Otwórz: Dashboard → Edge Functions
- Status powinien być "Active"

### 4. Test funkcjonalności
1. Zaloguj się (admin@example.com / admin123)
2. Przejdź do zamówień głosowych
3. Nagraj testową frazę: "trzy kg schab"
4. Sprawdź czy system automatycznie dopasował produkt
5. Otwórz AI Metrics Panel → Nauka głosowa
6. Sprawdź czy korekta została zapisana

---

## Rozwiązywanie problemów

### Błąd: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Błąd: "Supabase connection failed"
- Sprawdź .env - czy URL i klucze są poprawne
- Sprawdź czy projekt Supabase jest aktywny
- Sprawdź RLS policies - czy użytkownik ma dostęp

### Błąd: "Migration failed"
- Sprawdź czy migracje były wykonane w kolejności
- Sprawdź logi błędów w Supabase Dashboard
- Reset: usuń wszystkie tabele i uruchom migracje od nowa

### AI nie działa
- Sprawdź konsolę przeglądarki - czy model się załadował
- Sprawdź Network tab - czy pobieranie modelu zakończyło się sukcesem
- Cache może być pusty - AI będzie działać, ale wolniej przy pierwszym użyciu

---

## Kontakt i wsparcie

W razie problemów:
1. Sprawdź logi konsoli przeglądarki (F12)
2. Sprawdź logi Supabase Dashboard
3. Sprawdź Network tab (F12) - czy wszystkie requesty 200 OK
4. Sprawdź RLS policies - czy użytkownik ma odpowiednie uprawnienia

---

## Szczegóły techniczne

**Frontend:**
- React 18.3.1 + TypeScript 5.5.3
- Vite 5.4.2 (build tool)
- Tailwind CSS 3.4.1 (styling)
- Lucide React (ikony)

**AI/ML:**
- @xenova/transformers 2.17.2 (embeddings)
- Model: Xenova/all-MiniLM-L6-v2 (384D vectors)
- Web Speech API (Chrome/Edge)

**Backend:**
- Supabase (PostgreSQL + Edge Functions)
- Row Level Security (RLS) na wszystkich tabelach
- Real-time subscriptions

**PWA:**
- Service Worker (offline support)
- Manifest.json (install prompt)
- Cache strategies

---

**Koniec manifestu backupu v1.2**
