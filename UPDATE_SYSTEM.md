# System Automatycznych Aktualizacji RODEO

**Wersja dokumentacji:** 1.0
**Data utworzenia:** 03.11.2024
**Ostatnia aktualizacja:** 03.11.2024

## Spis treści

1. [Przegląd systemu](#przegląd-systemu)
2. [Architektura](#architektura)
3. [Komponenty](#komponenty)
4. [Przepływ aktualizacji](#przepływ-aktualizacji)
5. [Baza danych](#baza-danych)
6. [Service Worker](#service-worker)
7. [Preferencje użytkownika](#preferencje-użytkownika)
8. [Logowanie i monitoring](#logowanie-i-monitoring)
9. [Testowanie](#testowanie)
10. [FAQ](#faq)

---

## Przegląd systemu

System automatycznych aktualizacji RODEO został zaprojektowany jako w pełni autonomiczny mechanizm zarządzania wersjami aplikacji. Działa na dwóch poziomach:

### 1. Aktualizacje przy starcie (Auto-Update on Startup)
- Automatycznie sprawdza dostępność nowych wersji 2 sekundy po zalogowaniu użytkownika
- Instaluje aktualizacje bez interakcji użytkownika (jeśli włączone w preferencjach)
- Pomija aktualizację przy bardzo wolnym połączeniu (2G)
- Loguje wszystkie etapy procesu do bazy danych

### 2. Okresowe sprawdzanie w tle (Periodic Checks)
- Automatyczne sprawdzanie co 15 minut
- Sprawdzanie po powrocie do aplikacji (visibility change)
- Sprawdzanie po przywróceniu połączenia internetowego
- Wyświetla powiadomienia użytkownikowi o dostępnych aktualizacjach

---

## Architektura

```
┌─────────────────────────────────────────────────────────┐
│                    Aplikacja React                       │
│  ┌──────────────────┐        ┌───────────────────────┐ │
│  │ useUpdateChecker │        │ usePeriodicUpdateCheck│ │
│  │  (przy starcie)  │        │   (co 15 minut)       │ │
│  └────────┬─────────┘        └──────────┬────────────┘ │
│           │                              │              │
│           └──────────┬───────────────────┘              │
│                      │                                  │
│           ┌──────────▼────────────┐                    │
│           │   VersionManager      │                    │
│           │  (logika centralna)   │                    │
│           └──────────┬────────────┘                    │
└──────────────────────┼──────────────────────────────────┘
                       │
           ┌───────────▼────────────┐
           │  Supabase Database     │
           │  - app_versions        │
           │  - user_update_prefs   │
           │  - user_update_logs    │
           └───────────┬────────────┘
                       │
           ┌───────────▼────────────┐
           │   Service Worker       │
           │  - Instalacja wersji   │
           │  - Cache management    │
           │  - Aktywacja           │
           └────────────────────────┘
```

---

## Komponenty

### Frontend Hooks

#### 1. `useUpdateChecker.tsx`
**Ścieżka:** `src/hooks/useUpdateChecker.tsx`

**Odpowiedzialność:**
- Automatyczne sprawdzanie przy starcie aplikacji
- Instalacja aktualizacji bez interakcji użytkownika
- Pomijanie aktualizacji przy wolnym połączeniu
- Logowanie procesu

**Kluczowe funkcje:**
```typescript
// Główny hook
export function useUpdateChecker(): {
  isChecking: boolean;
  updateDetected: boolean;
}

// Proces:
// 1. Czeka 2s po zalogowaniu
// 2. Sprawdza preferencje (auto_update_enabled)
// 3. Wywołuje checkForUpdates()
// 4. Wykrywa typ połączenia
// 5. Loguje rozpoczęcie
// 6. Wywołuje Service Worker update
// 7. Czeka na instalację
// 8. Odświeża aplikację
```

**Kiedy uruchamiane:**
- Przy każdym zalogowaniu użytkownika
- Po opóźnieniu 2 sekund (aby nie blokować UI)

---

#### 2. `usePeriodicUpdateCheck.tsx`
**Ścieżka:** `src/hooks/usePeriodicUpdateCheck.tsx`

**Odpowiedzialność:**
- Okresowe sprawdzanie co 15 minut
- Sprawdzanie przy powrocie do aplikacji
- Sprawdzanie po przywróceniu połączenia
- Wyświetlanie powiadomień użytkownikowi

**Kluczowe funkcje:**
```typescript
export function usePeriodicUpdateCheck(): {
  availableUpdate: UpdateCheckResult | null;
  isChecking: boolean;
  dismissUpdate: () => void;
  postponeUpdate: (duration: number) => Promise<void>;
  acceptUpdate: () => Promise<boolean>;
  checkForUpdate: () => Promise<void>;
}
```

**Triggery:**
- Interwał: 15 minut (900,000 ms)
- Visibility change: `document.hidden` → `visible`
- Online event: po przywróceniu połączenia

---

### Frontend Components

#### 3. `UpdateNotification.tsx`
**Ścieżka:** `src/components/UpdateNotification.tsx`

**Odpowiedzialność:**
- Wyświetlanie modala z informacjami o aktualizacji
- Pokazywanie changelog
- Obsługa aktualizacji krytycznych (countdown 30s)
- Opcje: Zainstaluj / Odłóż na 1h / Odłóż do jutra

**UI Flow:**
```
┌─────────────────────────────────────┐
│  🌟 Dostępna Nowa Wersja            │
│  Wersja 1.2.0                       │
│                                     │
│  📋 Pokaż co nowego ▼               │
│  ┌─────────────────────────────┐   │
│  │ - Nowa funkcja X            │   │
│  │ - Poprawka błędu Y          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Zaktualizuj Teraz]                │
│  [Przypomnij za godzinę]            │
│  [Przypomnij jutro]                 │
│                                     │
│  Po 3 odrzuceniach → auto-install  │
└─────────────────────────────────────┘
```

---

#### 4. `UpdateProgressModal.tsx`
**Ścieżka:** `src/components/UpdateProgressModal.tsx`

**Odpowiedzialność:**
- Pokazywanie postępu instalacji
- Etapy: downloading → installing → activating → completed
- Obsługa błędów z opcją ręcznego odświeżenia

**Etapy:**
1. **Downloading** (0-100%) - pobieranie nowych plików
2. **Installing** (0-100%) - instalacja
3. **Activating** (100%) - aktywacja Service Worker
4. **Completed** - sukces, reload za 1.5s
5. **Error** - błąd, przycisk "Odśwież ręcznie"

---

### Core Logic

#### 5. `versionManager.ts`
**Ścieżka:** `src/lib/versionManager.ts`

**Odpowiedzialność:**
- Centralna logika zarządzania wersjami
- Komunikacja z Supabase
- Zarządzanie preferencjami
- Logowanie aktualizacji

**Kluczowe metody:**

```typescript
class VersionManager {
  // Pobiera aktualną wersję z package.json
  static getCurrentVersion(): string;
  static getCurrentBuild(): number;

  // Sprawdza dostępność aktualizacji w Supabase
  static async checkForUpdates(): Promise<UpdateCheckResult | null>;

  // Zarządzanie preferencjami
  static async getUserPreferences(userId: string): Promise<UpdatePreferences | null>;
  static async updateUserPreferences(userId: string, prefs: Partial<UpdatePreferences>): Promise<boolean>;

  // Odkładanie aktualizacji
  static async postponeUpdate(userId: string, version: string, duration: number): Promise<boolean>;

  // Logowanie
  static async logUpdate(userId: string, log: UpdateLog): Promise<boolean>;
  static async updateLogStatus(userId: string, version: string, status: string): Promise<boolean>;

  // Pomocnicze
  static isSlowConnection(): boolean;
  static shouldForceUpdate(postponeCount: number, isCritical: boolean): boolean;
  static compareVersions(v1: string, v2: string): number;
}
```

---

## Przepływ aktualizacji

### Scenariusz 1: Auto-Update przy starcie (idealny przypadek)

```
1. Użytkownik loguje się do aplikacji
   ↓
2. useUpdateChecker czeka 2 sekundy
   ↓
3. Sprawdza preferencje: auto_update_enabled = true
   ↓
4. Wywołuje VersionManager.checkForUpdates()
   ↓
5. Supabase zwraca: has_update = true, latest_version = "1.2.0"
   ↓
6. Sprawdza połączenie: effectiveType = "4g" ✅
   ↓
7. Loguje do user_update_logs: status = "started"
   ↓
8. Wywołuje navigator.serviceWorker.update()
   ↓
9. Service Worker instaluje nową wersję
   ↓
10. Czeka na registration.waiting
    ↓
11. Wysyła postMessage: { type: 'SKIP_WAITING' }
    ↓
12. Service Worker aktywuje nową wersję
    ↓
13. Loguje: status = "completed"
    ↓
14. Zapisuje do localStorage: version = "1.2.0"
    ↓
15. window.location.reload() ✅
```

### Scenariusz 2: Periodic Check → User Decision

```
1. Aplikacja działa od 15 minut
   ↓
2. usePeriodicUpdateCheck sprawdza aktualizacje
   ↓
3. Wykrywa nową wersję: 1.2.0
   ↓
4. Sprawdza: postponed_until - null lub przeszła data ✅
   ↓
5. Ustawia: availableUpdate = UpdateCheckResult
   ↓
6. Renderuje <UpdateNotification />
   ↓
   ┌─── Użytkownik klika "Zainstaluj" ───┐
   │    - acceptUpdate()                   │
   │    - logUpdate()                      │
   │    - <UpdateProgressModal />          │
   │    - Service Worker update            │
   │    - Reload                           │
   └───────────────────────────────────────┘
   ┌─── Użytkownik klika "Odłóż 1h" ──────┐
   │    - postponeUpdate(3600000)          │
   │    - Zapisuje postponed_until         │
   │    - Zwiększa postpone_count          │
   │    - dismissUpdate()                  │
   └───────────────────────────────────────┘
```

### Scenariusz 3: Wymuszona aktualizacja (krytyczna)

```
1. Periodic check wykrywa: is_critical = true
   ↓
2. UpdateNotification renderuje czerwony alert
   ↓
3. Countdown: 30 sekund
   ↓
4. Użytkownik NIE MOŻE odrzucić (brak przycisku X)
   ↓
5. Po 30s automatycznie: acceptUpdate()
   ↓
6. Instalacja i reload
```

---

## Baza danych

### Tabela: `app_versions`

**Ścieżka migracji:** `supabase/migrations/20251103140000_add_app_version_management.sql`

```sql
CREATE TABLE app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,              -- "1.2.0"
  build_number integer NOT NULL,             -- 42
  release_date timestamptz NOT NULL,         -- 2024-11-03 14:00:00
  changelog jsonb NOT NULL DEFAULT '[]',     -- [{ category, items }]
  is_critical boolean DEFAULT false,         -- Czy wymaga natychmiastowej instalacji
  assets_hash text,                          -- Hash plików dla weryfikacji
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Przykładowy rekord:**
```json
{
  "version": "1.2.0",
  "build_number": 42,
  "release_date": "2024-11-03T14:00:00Z",
  "changelog": [
    {
      "category": "Nowe funkcje",
      "items": [
        "System automatycznych aktualizacji",
        "Powiadomienia o dostępnych wersjach"
      ]
    },
    {
      "category": "Poprawki",
      "items": [
        "Naprawiono błąd synchronizacji"
      ]
    }
  ],
  "is_critical": false,
  "assets_hash": "sha256:abc123..."
}
```

---

### Tabela: `user_update_preferences`

```sql
CREATE TABLE user_update_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  auto_update_enabled boolean DEFAULT true,      -- Auto przy starcie
  periodic_check_enabled boolean DEFAULT true,   -- Sprawdzanie co 15 min
  postponed_version text,                        -- Którą wersję odłożono
  postponed_until timestamptz,                   -- Do kiedy odłożono
  postpone_count integer DEFAULT 0,              -- Ile razy odłożono (max 3)
  last_check_at timestamptz,                     -- Ostatnie sprawdzenie
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Logika wymuszania:**
- `postpone_count >= 3` → aktualizacja wymuszana
- `is_critical = true` → aktualizacja wymuszana
- `postponed_until < NOW()` → można znowu sprawdzać

---

### Tabela: `user_update_logs`

```sql
CREATE TABLE user_update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  from_version text,                                 -- "1.1.0"
  to_version text NOT NULL,                          -- "1.2.0"
  update_type text NOT NULL,                         -- auto_on_startup | periodic_auto | user_accepted | forced
  update_status text NOT NULL,                       -- started | downloading | installing | completed | failed
  postponed_count integer DEFAULT 0,
  device_info text,                                  -- User-Agent
  connection_type text,                              -- 4g | 3g | 2g | slow-2g
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

**Przykładowy log:**
```json
{
  "user_id": "uuid-123",
  "from_version": "1.1.2",
  "to_version": "1.2.0",
  "update_type": "auto_on_startup",
  "update_status": "completed",
  "postponed_count": 0,
  "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
  "connection_type": "4g",
  "error_message": null,
  "created_at": "2024-11-03T14:05:00Z",
  "completed_at": "2024-11-03T14:05:23Z"
}
```

---

## Service Worker

**Ścieżka:** `public/sw.js`

### Rola Service Worker:

1. **Install Event:**
   - Otwiera cache: `rodeo-v{buildNumber}`
   - Dodaje pliki: `/`, `/index.html`, `/manifest.json`, ikony
   - NIE wywołuje `skipWaiting()` automatycznie

2. **Activate Event:**
   - Usuwa stare cache (`rodeo-v*` oprócz aktualnego)
   - Wywołuje `clients.claim()` aby przejąć kontrolę
   - Wysyła postMessage do wszystkich klientów: `SW_ACTIVATED`

3. **Message Event:**
   - Słucha `type: 'SKIP_WAITING'` od aplikacji
   - Wywołuje `self.skipWaiting()` aby aktywować nową wersję

### Przepływ komunikacji:

```
App                           Service Worker
 │                                  │
 │──registration.update()──────────>│
 │                                  │ (instalacja)
 │                                  │
 │<──registration.waiting = true────│
 │                                  │
 │──postMessage({SKIP_WAITING})────>│
 │                                  │
 │                                  │──self.skipWaiting()
 │                                  │
 │<──controllerchange event─────────│
 │                                  │
 │──window.location.reload()────────│
```

---

## Preferencje użytkownika

Użytkownicy mogą zarządzać preferencjami aktualizacji w panelu ustawień (`ProfileScreen` lub `SystemSettings`).

### Dostępne opcje:

1. **Auto-Update przy starcie** (`auto_update_enabled`)
   - Domyślnie: `true`
   - Jeśli wyłączone: użytkownik musi ręcznie akceptować aktualizacje

2. **Okresowe sprawdzanie** (`periodic_check_enabled`)
   - Domyślnie: `true`
   - Jeśli wyłączone: brak powiadomień co 15 minut

### Jak wyłączyć auto-update:

```sql
UPDATE user_update_preferences
SET auto_update_enabled = false,
    periodic_check_enabled = false
WHERE user_id = 'uuid-123';
```

---

## Logowanie i monitoring

### Kluczowe logi (console):

```
[UpdateChecker] Checking for updates on startup...
[UpdateChecker] Update found: 1.2.0
[UpdateChecker] Triggering Service Worker update...
[UpdateChecker] New version installed, activating...
[UpdateChecker] Controller changed, reloading...
[UpdateChecker] Update successful, reloading application...
```

### Monitoring w bazie danych:

```sql
-- Ile aktualizacji zakończyło się sukcesem?
SELECT COUNT(*) FROM user_update_logs
WHERE update_status = 'completed';

-- Ile aktualizacji się nie powiodło?
SELECT COUNT(*) FROM user_update_logs
WHERE update_status = 'failed';

-- Średni czas aktualizacji
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)))
FROM user_update_logs
WHERE update_status = 'completed';

-- Użytkownicy z wyłączonym auto-update
SELECT COUNT(*) FROM user_update_preferences
WHERE auto_update_enabled = false;
```

---

## Testowanie

### Test 1: Auto-Update przy starcie

1. Ustaw w `package.json`: `"version": "1.0.0", "buildNumber": 1`
2. Dodaj nową wersję do `app_versions`: `1.1.0`, build `2`
3. Zaloguj się do aplikacji
4. Obserwuj konsole: update checker powinien wykryć nową wersję
5. Aplikacja powinna się automatycznie odświeżyć po ~20s

### Test 2: Periodic Check → User Decision

1. Zaloguj się i pracuj w aplikacji
2. Po 15 minutach pojawi się powiadomienie
3. Kliknij "Odłóż na 1h"
4. Sprawdź `user_update_preferences`: `postponed_until` powinno być ustawione
5. Poczekaj 1h i sprawdź czy powiadomienie pojawi się ponownie

### Test 3: Krytyczna aktualizacja

1. Ustaw `is_critical = true` w `app_versions`
2. Zaloguj się do aplikacji
3. Modal powinien pokazać czerwony alert
4. Countdown 30s powinien automatycznie zainstalować

### Test 4: Wolne połączenie (2G)

1. W DevTools: Network → Throttling → Slow 2G
2. Zaloguj się
3. Update checker powinien wykryć wolne połączenie i pominąć aktualizację
4. W konsoli: "Slow connection detected, deferring update"

---

## FAQ

### Q: Jak działa automatyczna instalacja?
A: System sprawdza aktualizacje przy każdym logowaniu (po 2s). Jeśli użytkownik ma włączone `auto_update_enabled`, aktualizacja instaluje się automatycznie bez pytania.

### Q: Czy użytkownik może wyłączyć auto-update?
A: Tak, w preferencjach może wyłączyć `auto_update_enabled` i `periodic_check_enabled`.

### Q: Co się stanie jeśli użytkownik odrzuci aktualizację 3 razy?
A: Po 3 odrzuceniach aktualizacja jest automatycznie wymuszana przy następnym sprawdzeniu.

### Q: Jak działa countdown dla aktualizacji krytycznych?
A: Aktualizacje z flagą `is_critical = true` pokazują modal z 30-sekundowym countdown. Użytkownik nie może zamknąć modalu. Po 30s aktualizacja instaluje się automatycznie.

### Q: Co się dzieje przy wolnym połączeniu?
A: System wykrywa połączenia 2G i slow-2G i pomija automatyczną instalację. Aktualizacja zostanie zainstalowana gdy połączenie się poprawi.

### Q: Jak dodać nową wersję do systemu?
A: Dodaj rekord do tabeli `app_versions` z nowym numerem wersji, build number i changelog. System automatycznie wykryje nową wersję.

### Q: Czy mogę przetestować lokalnie?
A: Tak, ustaw `version` i `buildNumber` w `package.json`, dodaj nowszą wersję do `app_versions` i zaloguj się. System powinien automatycznie wykryć aktualizację.

### Q: Co jeśli aktualizacja się nie powiedzie?
A: System loguje błąd do `user_update_logs` ze statusem `failed` i `error_message`. Użytkownik może spróbować ponownie ręcznie odświeżając stronę.

---

## Podsumowanie

System automatycznych aktualizacji RODEO zapewnia:

✅ **Automatyzację** - Zero interakcji użytkownika dla standardowych aktualizacji
✅ **Elastyczność** - Użytkownik może wyłączyć auto-update
✅ **Bezpieczeństwo** - Krytyczne aktualizacje są wymuszane
✅ **Monitoring** - Pełne logowanie w bazie danych
✅ **UX** - Powiadomienia, changelog, opcje odkładania
✅ **Performance** - Wykrywa wolne połączenia i pomija aktualizacje

---

**Kontakt:**
RODEO Development Team
support@rodeo.pl
