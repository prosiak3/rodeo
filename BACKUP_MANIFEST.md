# RODEO - Manifest Backupu v1.4

**Data utworzenia:** 2025-10-25 14:45:00
**Plik archiwum:** `backup-project-20251025.tar.gz`
**Rozmiar skompresowany:** 428 KB
**Liczba plików:** ~300+ (bez node_modules i dist)

---

## Statystyki projektu

### Kod źródłowy
- **React komponenty:** 70+ plików (.tsx)
- **Hooki:** 7 plików (useAutoLogout, useConfirm, useDevicePreferences, useDeviceType, useModal, useUserPreferences, useUserTracking)
- **Context providers:** 3 pliki (AuthContext, FontSizeContext, ThemeContext)
- **Utilities:** 6 plików bibliotecznych
- **Migracje SQL:** 172 pliki
- **Edge Functions:** 3 funkcje Supabase

### Struktura bazy danych

#### Główne tabele
1. `users` - użytkownicy z rolami (user, admin, driver, analyst, warehouse) + preferencje UI + dane kontaktowe
2. `stores` - 124 sklepy z lokalizacjami GPS i wieloma adresami email
3. `store_groups` - grupy sklepów (regionalne, typowe)
4. `store_group_assignments` - przypisania sklepów do grup
5. `products` - produkty z jednostkami, cenami i domyślnymi ilościami
6. `orders` - zamówienia ze statusami i źródłem (manual/voice/auto/copy)
7. `order_items` - pozycje zamówień
8. `price_lists` - cenniki dla sklepów z priorytetami
9. `price_list_assignments` - przypisania cenników do sklepów/grup/handlowców
10. `price_list_items` - pozycje w cennikach (ceny niestandardowe)
11. `price_list_history` - historia zmian cenników
12. `special_prices` - ceny specjalne i promocje
13. `tags` - tagi produktów
14. `occasion_banners` - banery okolicznościowe z harmonogramem
15. `system_announcements` - ogłoszenia systemowe dla użytkowników

#### Tabele sesji i analityki
16. `user_sessions` - sesje użytkowników z trackingiem (device, browser, interaction_type, geolocation)
17. `session_paths` - ścieżki nawigacji w sesjach
18. `user_session_gaps` - przerwy między sesjami
19. `user_analytics_events` - zdarzenia użytkowników (click, view, error, order, etc)
20. `push_notification_subscriptions` - subskrypcje push
21. `campaigns` - kampanie marketingowe
22. `email_notifications` - kolejka i logi wysyłki emaili
23. `device_preferences` - preferencje per urządzenie (layout, sortowanie, widoki)

#### Tabele AI i uczenia maszynowego
24. `voice_learning_corrections` - korekty rozpoznawania głosowego (per-user + global)
25. `voice_phrase_mappings` - automatyczne mapowania fraz (synonimów)
26. `voice_recognition_attempts` - tracking wszystkich prób rozpoznawania z accuracy
27. `ai_metrics` - metryki operacji AI (embeddings, similarity search)
28. `ai_model_performance` - agregacje wydajności modelu
29. `profanity_words` - słowa wulgarne do filtrowania
30. `profanity_attempts` - logi prób użycia wulgaryzmów

#### Widoki analityczne (Views)
- `problem_products_view` - produkty z największą liczbą korekt
- `phrase_mapping_view` - mapowanie fraz na produkty
- `phrase_conflicts_view` - konflikty w rozpoznawaniu fraz
- `ai_model_performance` - wydajność modelu AI

#### Funkcje bazy danych
- `smart_product_match` - inteligentne dopasowanie produktów z uczeniem (zwraca również unit)
- `get_learned_product_match` - matching oparty o historię korekt
- `analyze_and_create_phrase_mappings` - auto-analiza wzorców
- `apply_phrase_mapping` - aplikacja mapowań przed matchingiem
- `calculate_auto_order_suggestions` - sugestie zamówień z konfigurowalnymi okresami
- `clean_profanity` / `contains_profanity` - filtrowanie wulgaryzmów
- `normalize_spoken_phrase` - normalizacja fraz głosowych
- `keep_session_alive` - przedłużanie sesji użytkownika
- `cleanup_inactive_sessions` - automatyczne czyszczenie nieaktywnych sesji

---

## Nowe funkcje w wersji 1.4

### Zmiany od wersji 1.3:
1. **System cenników z priorytetami** - cenniki dla sklepów, grup i handlowców z logiką priorytetową
2. **Historia zmian cenników** - audyt wszystkich zmian w cenach
3. **Multiple email addresses** - wiele adresów email dla sklepów (wholesale_emails jako array)
4. **Preferencje per urządzenie** - różne ustawienia dla desktop/mobile/tablet
5. **System ogłoszeń** - komunikaty dla użytkowników z kontrolą wyświetlania
6. **Zarządzanie sesjami** - konfigurowalne timeouty, automatyczne czyszczenie, przedłużanie
7. **Email notifications** - system kolejkowania i wysyłki emaili z zamówieniami
8. **Dane kontaktowe w emailach** - telefon i email jako klikalne linki (tel:, mailto:)
9. **Profile pictures** - zdjęcia profilowe użytkowników
10. **Domyślne ilości produktów** - globalny i per-produkt default quantity
11. **Naprawiona ikona przedłużenia sesji** - zawsze widoczna, retry logic, lepsze ładowanie
12. **FontSize Context** - zmiana rozmiaru czcionki w całej aplikacji

---

## Funkcje z wersji 1.3

### 1. Grupy sklepów
**Lokalizacja kodu:**
- `supabase/migrations/20251021201056_add_store_groups_system.sql`
- `src/components/StoreGroupsManager.tsx`

**Funkcjonalność:**
- Tworzenie grup regionalnych (np. "Warmia", "Mazury")
- Grupowanie tematyczne (np. "Duże sklepy", "Sieci")
- Przypisywanie sklepów do wielu grup
- Filtrowanie i sortowanie w zarządzaniu

### 2. Mapa sklepów
**Lokalizacja kodu:**
- `src/components/StoresMap.tsx`
- `supabase/migrations/20251022192400_add_gps_coordinates_to_all_stores.sql`

**Funkcjonalność:**
- Interaktywna mapa z React Leaflet
- 124 sklepy z rzeczywistymi współrzędnymi GPS
- Markery z popup'ami (nazwa, kod, adres)
- Klastry dla lepszej wydajności

### 3. Banery okolicznościowe
**Lokalizacja kodu:**
- `src/components/BannersManager.tsx`
- `src/components/OccasionBanner.tsx`
- `supabase/migrations/20251021130452_fix_occasion_banners_schema.sql`

**Funkcjonalność:**
- Harmonogram wyświetlania (start_date, end_date)
- 4 typy animacji: bounce, slide, pulse, none
- 5 kolorów: blue, green, yellow, red, purple
- Priorytet wyświetlania
- CRUD w panelu admina

---

## Funkcje z wersji 1.2

### 1. System uczenia się AI
**Lokalizacja kodu:**
- `supabase/migrations/20251015114010_add_voice_learning_system.sql`
- `supabase/migrations/20251015114634_add_phrase_mapping_system.sql`
- `src/components/VoiceOrderScreen.tsx`

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
- `src/components/AnalyticsPanel.tsx` - analiza sesji
- `src/components/SalesAnalyticsPanel.tsx` - analiza sprzedaży
- `src/components/StoreAnalyticsPanel.tsx` - analiza per sklep

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
6. **EditDraftOrderScreen** - edycja draft/notatnik

### Panele administracyjne
7. **AdminPanel** - zarządzanie (użytkownicy, produkty, sklepy, cenniki)
8. **AnalyticsPanel** - analityka (sesje, rankingi, top produkty, sales, store)
9. **AIMetricsPanel** - metryki AI (4 zakładki)
10. **VoiceLearningPanel** - analiza nauki systemu
11. **AILearningPanel** - clustering ścieżek, similarity analysis
12. **SystemSettings** - ustawienia globalne (timeouty, domyślne wartości, logowanie)

### Zarządzanie danymi
13. **ProductManager** - CRUD produktów + domyślne ilości
14. **UsersManager** - CRUD użytkowników
15. **StoresManager** - CRUD sklepów + multiple emails
16. **StoreGroupsManager** - CRUD grup sklepów
17. **TagsManager** - zarządzanie tagami
18. **PriceListManager** - cenniki i promocje z priorytetami
19. **PriceListAssignments** - przypisywanie cenników
20. **BannersManager** - zarządzanie banerami okolicznościowymi
21. **AnnouncementsManager** - ogłoszenia systemowe
22. **StoreEmailManager** - zarządzanie emailami sklepów

### User Experience
23. **SessionTimer** - timer sesji z przedłużaniem (zawsze widoczny)
24. **SessionCleanupService** - automatyczne czyszczenie sesji
25. **UserNotifications** - powiadomienia dla użytkowników
26. **ProfileScreen** - profil użytkownika z edycją danych kontaktowych
27. **OccasionBanner** - wyświetlanie banerów okolicznościowych

---

## Edge Functions (Supabase)

### 1. send-order-email
**Lokalizacja:** `supabase/functions/send-order-email/index.ts`

**Funkcjonalność:**
- Wysyłka emaili z zamówieniami przez Resend API
- Generowanie HTML z tabelką produktów
- Kody kreskowe (Code128) i QR dla numeru zamówienia
- Załącznik CSV z pełnym zestawieniem
- Dane kontaktowe jako klikalne linki (tel:, mailto:)
- CORS headers dla wszystkich requestów

**Parametry:**
```typescript
{
  to: string | string[],  // email(e) odbiorcy
  subject: string,
  orderData: OrderData,   // pełne dane zamówienia
  test?: boolean         // tryb testowy
}
```

### 2. auto-order-suggestion
**Lokalizacja:** `supabase/functions/auto-order-suggestion/index.ts`

**Funkcjonalność:**
- Generowanie sugestii zamówień na podstawie historii
- Analiza sezonowa i trendów
- Konfigurowalne okresy analizy (30/60/90 dni)
- Kalkulacja średnich ilości

### 3. auto-order-refresh-scheduler
**Lokalizacja:** `supabase/functions/auto-order-refresh-scheduler/index.ts`

**Funkcjonalność:**
- Automatyczne odświeżanie sugestii co 24h
- Scheduler dla batch processing
- Aktualizacja dla wszystkich aktywnych użytkowników

---

## Instrukcja przywracania backupu

### Krok 1: Rozpakowanie
```bash
tar -xzf backup-project-20251025.tar.gz
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
supabase functions deploy send-order-email
supabase functions deploy auto-order-suggestion
supabase functions deploy auto-order-refresh-scheduler

# Lub przez Dashboard → Edge Functions → Deploy
```

### Krok 6: Konfiguracja Resend API
```bash
# W Supabase Dashboard → Project Settings → Edge Functions → Secrets
# Dodaj: RESEND_API_KEY = re_xxxxx
```

### Krok 7: Uruchomienie
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
- [ ] Wszystkie 172 migracje wykonane w kolejności
- [ ] Edge Functions wdrożone
- [ ] RESEND_API_KEY skonfigurowany
- [ ] Aplikacja uruchomiona bez błędów
- [ ] Test logowania (admin@example.com / admin123)
- [ ] Test zamówienia głosowego
- [ ] Test wysyłki emaila z zamówieniem
- [ ] Sprawdzenie panelu analitycznego
- [ ] Weryfikacja AI Metrics Panel
- [ ] Test ikony przedłużenia sesji (mobile)

---

## Weryfikacja po przywróceniu

### 1. Sprawdź połączenie z bazą
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM stores;
SELECT COUNT(*) FROM price_lists;
```

### 2. Sprawdź funkcje
```sql
SELECT smart_product_match('schab', 'store-uuid', 5);
SELECT * FROM problem_products_view LIMIT 10;
SELECT * FROM price_list_history LIMIT 10;
```

### 3. Sprawdź Edge Functions
- Otwórz: Dashboard → Edge Functions
- Status powinien być "Active"
- Test wysyłki emaila z zamówieniem

### 4. Test funkcjonalności
1. Zaloguj się (admin@example.com / admin123)
2. Przejdź do zamówień głosowych
3. Nagraj testową frazę: "trzy kg schab"
4. Sprawdź czy system automatycznie dopasował produkt
5. Wyślij zamówienie emailem
6. Sprawdź czy email dotarł z właściwym formatowaniem
7. Otwórz AI Metrics Panel → Nauka głosowa
8. Sprawdź czy korekta została zapisana
9. Sprawdź ikonę przedłużenia sesji (mobile)

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

### Email nie wysyła się
- Sprawdź RESEND_API_KEY w Edge Functions secrets
- Sprawdź logi Edge Function w Dashboard
- Sprawdź email_notifications table - status "pending" czy "sent"
- Verify Resend API limits (sandbox: 100 emails/day)

### Ikona przedłużenia sesji nie pojawia się
- Sprawdź konsolę - czy są błędy ładowania sesji
- Ikona powinna być ZAWSZE widoczna (nawet bez danych)
- Retry logic ładuje sesję po 2 sekundach
- W razie błędu używa obecnego czasu jako fallback

---

## Kontakt i wsparcie

W razie problemów:
1. Sprawdź logi konsoli przeglądarki (F12)
2. Sprawdź logi Supabase Dashboard
3. Sprawdź Network tab (F12) - czy wszystkie requesty 200 OK
4. Sprawdź RLS policies - czy użytkownik ma odpowiednie uprawnienia
5. Sprawdź Edge Functions logs
6. Sprawdź email_notifications table

---

## Szczegóły techniczne

**Frontend:**
- React 18.3.1 + TypeScript 5.5.3
- Vite 5.4.2 (build tool)
- Tailwind CSS 3.4.1 (styling)
- Lucide React 0.344.0 (ikony)
- React Leaflet 4.2.1 (mapy)
- Leaflet 1.9.4 (core mapy)

**AI/ML:**
- @xenova/transformers 2.17.2 (embeddings)
- Model: Xenova/all-MiniLM-L6-v2 (384D vectors)
- Web Speech API (Chrome/Edge)

**Backend:**
- Supabase (PostgreSQL + Edge Functions + Auth)
- Row Level Security (RLS) na wszystkich tabelach
- Real-time subscriptions
- Resend API (email delivery)

**PWA:**
- Service Worker (offline support)
- Manifest.json (install prompt)
- Cache strategies
- Icons: 192x192, 512x512, apple-touch-icon

**Database:**
- PostgreSQL 15+
- 30+ tables
- 4+ views
- 10+ stored functions
- Full RLS coverage
- Audit trails (price_list_history, order_history)

---

**Koniec manifestu backupu v1.4**
