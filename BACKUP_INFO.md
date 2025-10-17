# Backup aplikacji RODEO

## Informacje o backupie

**Data utworzenia:** 2025-10-17
**Wersja:** Produkcyjna z systemem analityki AI i nauki głosowej

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
- Migracje SQL w folderze `supabase/migrations/`
- Wszystkie tabele z RLS policies
- Views analityczne
- Funkcje automatycznych sugestii
- System trackingu sesji użytkowników
- Tabele voice recognition attempts

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
- Embeddings dla produktów (IndexedDB)
- Similarity search (Transformers.js)
- Voice recognition tracking
- Phrase mapping i konflikty
- Problem products analysis

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
