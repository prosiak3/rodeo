# Historia zmian RODEO

## [1.7.0] - 2024-11-03

### ✨ Nowe funkcje

#### System Automatycznych Aktualizacji
- **Auto-Update przy starcie aplikacji**
  - Automatyczne wykrywanie nowych wersji 2s po zalogowaniu
  - Instalacja bez interakcji użytkownika (jeśli włączone)
  - Pomijanie aktualizacji przy wolnym połączeniu (2G, slow-2G)
  - Pełne logowanie procesu do bazy danych
  - Hook: `useUpdateChecker.tsx`

- **Okresowe sprawdzanie aktualizacji**
  - Automatyczne sprawdzanie co 15 minut w tle
  - Sprawdzanie po powrocie do aplikacji (visibility change)
  - Sprawdzanie po przywróceniu połączenia (online event)
  - Respektowanie preferencji użytkownika
  - Hook: `usePeriodicUpdateCheck.tsx`

- **Powiadomienia o aktualizacjach**
  - Elegancki modal z informacjami o nowej wersji
  - Wyświetlanie changelog z nowościami
  - Opcje: Zainstaluj / Odłóż 1h / Odłóż 24h
  - Komponent: `UpdateNotification.tsx`

- **Progress Modal**
  - Wizualizacja etapów instalacji
  - Etapy: downloading → installing → activating → completed
  - Pasek postępu z procentami
  - Obsługa błędów z opcją ręcznego odświeżenia
  - Komponent: `UpdateProgressModal.tsx`

- **Aktualizacje krytyczne**
  - Wymuszona instalacja dla krytycznych wersji
  - Countdown 30 sekund przed automatyczną instalacją
  - Brak możliwości odrzucenia
  - Czerwony alert w UI

- **Funkcja odkładania aktualizacji**
  - Możliwość odłożenia na 1 godzinę lub 24 godziny
  - Maksymalnie 3 odrzucenia, potem wymuszenie
  - Śledzenie licznika odrzuceń w bazie danych

- **Preferencje użytkownika**
  - `auto_update_enabled` - włącz/wyłącz auto-update przy starcie
  - `periodic_check_enabled` - włącz/wyłącz sprawdzanie co 15 min
  - Domyślnie oba włączone (true)
  - Tabela: `user_update_preferences`

- **Version Manager**
  - Centralna biblioteka zarządzania wersjami
  - Sprawdzanie dostępności aktualizacji (RPC: `check_for_updates`)
  - Porównywanie wersji semantycznych
  - Wykrywanie typów połączenia
  - Plik: `src/lib/versionManager.ts`

- **Service Worker Integration**
  - Bezpieczna instalacja nowej wersji
  - Zarządzanie cache (`rodeo-v{buildNumber}`)
  - Komunikacja z aplikacją via postMessage
  - Aktywacja z `SKIP_WAITING` message
  - Plik: `public/sw.js`

### 🗄️ Migracje bazy danych

- `20251103140000_add_app_version_management.sql`
  - Tabela `app_versions` - wersje aplikacji z changelog
  - Tabela `user_update_preferences` - preferencje aktualizacji
  - Tabela `user_update_logs` - historia aktualizacji
  - RPC `check_for_updates(current_version, current_build)` - sprawdzanie
  - RPC `get_latest_version()` - pobieranie najnowszej wersji
  - Pełne polityki RLS dla wszystkich tabel

### 📝 Dokumentacja

- **UPDATE_SYSTEM.md** - pełna dokumentacja techniczna systemu aktualizacji
  - Architektura i komponenty
  - Przepływy aktualizacji (scenariusze)
  - Struktura bazy danych
  - Integracja z Service Worker
  - Przewodnik testowania
  - FAQ

- **Komentarze w kodzie**
  - JSDoc dla `useUpdateChecker.tsx`
  - JSDoc dla `usePeriodicUpdateCheck.tsx`
  - JSDoc dla `UpdateNotification.tsx`
  - JSDoc dla `UpdateProgressModal.tsx`
  - JSDoc dla `versionManager.ts`

- **Aktualizacja rodeo.prompt**
  - Dodano sekcję "System Automatycznych Aktualizacji"
  - Zaktualizowano listę komponentów
  - Zaktualizowano listę hooków
  - Zaktualizowano listę bibliotek pomocniczych

### ⚡ Wydajność

- **Smart Connection Detection**
  - Wykrywanie wolnych połączeń (2G, slow-2G)
  - Pomijanie aktualizacji przy wolnym połączeniu
  - Automatyczna próba ponowna gdy połączenie się poprawi

- **Batch Processing**
  - Logowanie aktualizacji nie blokuje UI
  - Asynchroniczne operacje bazodanowe

### 🔒 Bezpieczeństwo

- **RLS Policies**
  - Użytkownicy: pełny dostęp do własnych preferencji i logów
  - Analitycy: read-only do wszystkich logów
  - Admini: pełny dostęp

- **Version Verification**
  - Porównywanie wersji semantycznych
  - Weryfikacja build number
  - Hash plików dla integralności (assets_hash)

### 🧪 Testowanie

- Scenariusze testowe w dokumentacji
- Instrukcje testowania lokalnego
- Testy wolnego połączenia
- Testy aktualizacji krytycznych

---

## [1.1.2] - 2025-10-19 (noc)

### ✨ Nowe funkcje

#### Rozszerzone szczegóły nierozpoznanych prób
- **Przycisk "Pokaż pełne szczegóły"** dla każdej próby rozpoznawania
  - ID próby (UUID)
  - Dokładna data i godzina (rok, miesiąc, dzień, godzina, minuta, sekunda)
  - Pełne dane użytkownika (imię, nazwisko, ID)
  - Fraza oryginalna vs przetworzona
  - Oryginalny tekst vs tekst po konwersji liczb
  - Metoda dopasowania użyta przez system
  - Czy AI było dostępne (Tak/Nie z kolorowymi badge'ami)
  - Czy użyto AI do dopasowania
  - Pewność AI (0-100%)
  - Czy była korekta użytkownika
  - ID początkowego i finalnego produktu
  - **Pełne metadane JSON** w rozwijalnej sekcji dla zaawansowanej diagnostyki

#### Kontrola logowania w System Settings
- **Nowe kolumny w `system_settings`**:
  - `enable_voice_recognition_logging` - włącz/wyłącz logowanie prób rozpoznawania
  - `enable_user_tracking` - włącz/wyłącz tracking sesji użytkowników
  - `enable_ai_metrics_logging` - włącz/wyłącz logowanie metryk AI
  - `enable_learning_corrections` - włącz/wyłącz zapisywanie korekt dla uczenia się
- **Wszystkie domyślnie włączone** (true)
- Możliwość wyłączenia gdy system osiągnie wysoką dokładność
- Zmniejsza obciążenie bazy danych i poprawia wydajność

### 📝 Komentarze w kodzie
- **VoiceOrderScreen.tsx**: Dodano obszerne komentarze dokumentacyjne
  - Opis głównych funkcji i przepływu danych
  - Wyjaśnienie procesu rozpoznawania (smart_match → AI → fallback)
  - Dokumentacja trackingu i analityki
  - Opisy interfejsów (Product, OrderItem)
  - Komentarze do funkcji `startListening()` i `parseTranscript()`

### 🗄️ Migracje bazy danych

- `add_logging_control_settings` - dodanie kontroli logowania do system_settings

---

## [1.1.1] - 2025-10-19 (wieczór)

### ✨ Nowe funkcje

#### Panel "Nierozpoznane próby" w AI Metrics
- **Nowa zakładka w AI Metrics**: Dedykowany widok nierozpoznanych prób głosowych
  - Wyświetla wszystkie próby z `confidence_score = 0` lub `was_corrected = true`
  - Pokazuje oryginalną frazę, sugestie AI i finalne wybory użytkownika
  - Widoczna przyczyna błędu rozpoznawania dla każdej próby
  - Sposób wyboru produktu (sugestia/wyszukiwanie/przeglądarka)
  - Filtrowanie po okresie czasu (1h/24h/7d/30d)
  - **Krytyczne dla analityków** - natychmiastowa widoczność problemów

#### Ulepszone logowanie prób rozpoznawania
- **Tracking wszystkich przypadków nierozpoznania**:
  - `smart_match_failed` - Smart match nie znalazł produktu
  - `no_matches_found` - Brak jakichkolwiek dopasowań (smart_match, AI, fallback)
  - `fallback_no_matches` - Fallback text matching nie znalazł podobnych produktów
  - Szczegółowe metadane: metoda, przyczyna, przetworzony tekst, dostępność AI

### 🔧 Poprawki

- Utworzono brakującą tabelę `user_session_gaps`
- Naprawiono błąd 404 przy próbie zapisu przerw w sesjach użytkowników
- Dodano RLS policies dla `user_session_gaps` (users, analysts, admins)
- Dodano tracking do wszystkich ścieżek nierozpoznania w VoiceOrderScreen

### 🗄️ Migracje bazy danych

- `fix_missing_user_session_gaps_table` - utworzenie tabeli user_session_gaps z RLS

---

## [1.1.0] - 2025-10-19

### ✨ Nowe funkcje

#### Rozpoznawanie głosowe
- **Polskie liczby słownie**: System konwertuje liczby wypowiedziane słownie na cyfry
  - Obsługiwane: 1-30, pół (0.5)
  - Przykład: "trzy karkówki" → "3 karkówki"

- **Automatyczny dobór jednostek**: System pobiera jednostkę z cennika produktu
  - "3 jajka" → rozpoznaje "Jajka L" → używa "szt" (z cennika)
  - Funkcja `smart_product_match` zwraca `product_unit`

- **Zamówienia bez jednostki**: Możliwość dyktowania bez "kg" lub "sztuk"
  - "3 karkówki" → automatycznie kg
  - "5 jajek" → automatycznie szt (jeśli w cenniku)

#### Tracking i analityka
- **Voice recognition attempts**: Śledzenie wszystkich prób rozpoznawania
  - Nieudane dopasowania (confidence: 0)
  - Korekty użytkownika (was_corrected: true)
  - Metoda wyboru (suggestion, inline_search, product_browser)

- **Widoki analityczne**:
  - `problem_products_view` - produkty z najczęstszymi korektami
  - `phrase_mapping_view` - mapowanie fraz na produkty
  - `phrase_conflicts_view` - frazy mapowane do różnych produktów

#### UX/UI
- **Sortowanie w Top Products**: Klikalne nagłówki kolumn
  - Sortowanie: nazwa, kategoria, ilość, wartość, liczba zamówień
  - Wizualne wskaźniki kierunku (↑/↓)
  - Kolorowe etykiety kategorii

### 🔧 Poprawki

- Naprawiono regex patterns dla rozpoznawania głosowego
- Dodano pattern3 dla zamówień bez jawnej jednostki
- Poprawiono dopasowanie polskich końcówek (-ki, -ek, -ów, -y, -i, -e)

### 📝 Dokumentacja

- Zaktualizowano `AI_DOKUMENTACJA.md` (v1.1)
- Zaktualizowano `ANALYTICS_SYSTEM.md` (v1.1)
- Dodano komentarze w `VoiceOrderScreen.tsx`
- Zaktualizowano `BACKUP_INFO.md` z nowymi funkcjami

### 🗄️ Migracje bazy danych

- `20251019000000_add_unit_to_smart_product_match.sql` - dodanie unit do funkcji smart_product_match

---

## [1.0.0] - 2025-10-17

### ✨ Funkcje bazowe

#### System zamówień
- 4 tryby zamawiania: głosowy, manualny, auto-sugestie, z cennika
- Statusy: notatnik, draft, in_progress, completed, rejected
- Auto-sugestie oparte o historię zamówień
- System promocji (10+1, zniżki procentowe)

#### AI & Machine Learning
- Embeddings dla produktów (IndexedDB)
- Similarity search (Transformers.js)
- Phrase mapping i learning corrections
- Inteligentne dopasowywanie produktów

#### Analityka
- Automatyczne zarządzanie sesjami
- Tracking zdarzeń użytkowników
- Path clustering
- Metryki AI
- Przeglądarka sesji
- Top produkty

#### Administracja
- Zarządzanie użytkownikami
- Zarządzanie produktami
- Zarządzanie sklepami
- System tagów i kategorii
- Cenniki i promocje

#### UX/UI
- Dark mode
- PWA support
- Responsywny design
- Bottom navigation
- Automatyczne wylogowanie

### 🔐 Bezpieczeństwo

- Row Level Security (RLS) na wszystkich tabelach
- Role-based access control (user, admin, driver, analyst)
- Automatyczne czyszczenie sesji
- Bezpieczne przechowywanie danych lokalnie

---

## Format wersjonowania

Projekt używa [Semantic Versioning](https://semver.org/):
- **MAJOR** - Niekompatybilne zmiany API
- **MINOR** - Nowe funkcje (backward compatible)
- **PATCH** - Poprawki błędów (backward compatible)

## Kategorie zmian

- ✨ **Nowe funkcje** - Nowa funkcjonalność
- 🔧 **Poprawki** - Naprawy błędów
- 📝 **Dokumentacja** - Zmiany w dokumentacji
- 🗄️ **Migracje** - Zmiany w bazie danych
- 🔐 **Bezpieczeństwo** - Poprawki bezpieczeństwa
- ⚡ **Wydajność** - Optymalizacje wydajności
- ♻️ **Refaktoryzacja** - Zmiany w kodzie bez wpływu na funkcjonalność
