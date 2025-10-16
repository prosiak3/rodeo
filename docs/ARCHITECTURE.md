# RODEO - Architektura Systemu

## Przegląd Projektu

RODEO to zaawansowana aplikacja webowa typu PWA (Progressive Web App) do zarządzania zamówieniami mięsa w systemie hurtownia-sklepy. System obsługuje wiele ról użytkowników i oferuje innowacyjne funkcje takie jak zamówienia głosowe z AI, automatyczne sugestie zamówień oraz zaawansowaną analitykę.

## Stos Technologiczny

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Język**: TypeScript 5.5.3
- **Stylizacja**: Tailwind CSS 3.4.1
- **Ikony**: Lucide React 0.344.0
- **PWA**: Service Worker + Web Manifest

### Backend & Database
- **BaaS**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Autentykacja**: Supabase Auth (email/password)
- **API**: Supabase Client (@supabase/supabase-js 2.57.4)
- **Edge Functions**: Deno runtime dla serverless functions

### AI & Machine Learning
- **Model**: all-MiniLM-L6-v2 (sentence embeddings)
- **Library**: Transformers.js (@xenova/transformers 2.17.2)
- **Wykonanie**: WebAssembly w przeglądarce (offline)
- **Storage**: IndexedDB dla cache embeddingów

## Architektura Aplikacji

### Struktura Katalogów

```
project/
├── src/
│   ├── components/          # Komponenty React UI
│   │   ├── screens/         # Główne ekrany aplikacji
│   │   ├── panels/          # Panele administracyjne
│   │   └── shared/          # Współdzielone komponenty
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx  # Zarządzanie autentykacją
│   │   └── ThemeContext.tsx # Zarządzanie motywem
│   ├── hooks/               # Custom React hooks
│   │   ├── useUserTracking.tsx  # Hook do analytics
│   │   ├── useModal.tsx     # Zarządzanie modalami
│   │   └── useConfirm.tsx   # Dialogi potwierdzenia
│   ├── lib/                 # Logika biznesowa i utilities
│   │   ├── supabase.ts      # Klient Supabase + typy
│   │   ├── embeddingsManager.ts  # AI embeddings
│   │   ├── priceCalculations.ts  # Logika cenowa
│   │   ├── pathClustering.ts     # Algorytm grupowania
│   │   └── alerts.ts        # System powiadomień
│   ├── App.tsx              # Główny komponent aplikacji
│   ├── main.tsx             # Entry point
│   └── index.css            # Style globalne
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js               # Service Worker
├── supabase/
│   ├── migrations/          # Migracje SQL bazy danych
│   └── functions/          # Edge Functions (Deno)
└── docs/                   # Dokumentacja techniczna
```

### Role Użytkowników

System obsługuje 6 różnych ról z dedykowanymi interfejsami:

| Rola | Kod | Dostęp | Główne Funkcje |
|------|-----|--------|----------------|
| **Kierownik Sklepu** | `store_manager` | Tylko własny sklep | Składanie zamówień, przeglądanie historii |
| **Handlowiec** | `salesperson` | Wiele sklepów | Zarządzanie zamówieniami klientów |
| **Operator** | `operator` | Wszystkie sklepy | Przetwarzanie zamówień, częściowe potwierdzenia |
| **Administrator** | `admin` | Pełny dostęp | Zarządzanie systemem, użytkownikami, produktami |
| **Kierowca** | `driver` | Aktywne dostawy | Przeglądanie tras, potwierdzanie dostaw |
| **Analityk** | `analyst` | Dane analityczne | Dashboard KPI, raporty, kampanie marketingowe |

### Flow Danych

```
User (Browser)
    ↓
React App (PWA)
    ↓
Supabase Client
    ↓
    ├─→ Supabase Auth (JWT)
    ├─→ PostgreSQL Database (RLS)
    ├─→ Edge Functions (Serverless)
    └─→ Realtime Subscriptions (opcjonalnie)
```

### Zarządzanie Stanem

1. **Global State**: React Context API
   - `AuthContext` - sesja użytkownika, profil, uprawnienia
   - `ThemeContext` - motyw jasny/ciemny

2. **Local State**: useState + useEffect
   - Stan komponentów (formularze, filtry, modals)
   - Cache danych (produkty, zamówienia)

3. **Server State**: Supabase Client
   - Zapytania SQL poprzez `.from()` API
   - Realtime subscriptions dla live updates
   - Optimistic updates dla lepszego UX

4. **Persistent State**:
   - IndexedDB (embeddingi AI, ~30MB)
   - LocalStorage (preferencje użytkownika)
   - Service Worker Cache (assets, API responses)

## Kluczowe Systemy

### 1. System Zamówień

**Lifecycle zamówienia:**
```
draft → notatnik → sent → in_progress → confirmed → archived
                 ↓
              rejected
```

**Typy źródła zamówienia:**
- `voice` - Zamówienie głosowe (AI)
- `manual` - Ręczne wprowadzenie
- `copy` - Skopiowane z historii
- `price_list` - Z cennika
- `auto` - Automatycznie wygenerowane

**Kalkulacja cen:**
- Cena bazowa produktu
- Ceny specjalne dla sklepu (valid_from/valid_to)
- Promocje: -15%, -50%, 10+1 gratis
- Zaokrąglenia do 0.01 PLN

### 2. AI Voice Orders (Offline-First)

**Architektura:**
```
Speech Recognition (Web API)
    ↓
Text Transcript
    ↓
AI Embeddings (all-MiniLM-L6-v2)
    ↓
Similarity Search (Cosine)
    ↓
Product Matching (>70% confidence)
```

**Preloading Strategy:**
- Model AI (~25MB) ładowany w tle po zalogowaniu
- Embeddingi generowane dla wszystkich produktów
- Cache w IndexedDB + Service Worker
- Fallback do klasycznego wyszukiwania tekstowego

**Performance:**
- Inicjalizacja: 10-20s (jednorazowo)
- Generowanie embeddingu: ~10ms
- Wyszukiwanie podobieństw: ~50ms
- **Łącznie: <100ms na zapytanie**

### 3. Auto-Order System

**Algorytm sugestii:**
1. Analiza zamówień z ostatnich N dni (konfigurowalny)
2. Grupowanie według kategorii produktów
3. Obliczanie średnich ilości + odchylenie standardowe
4. Wykrywanie wzorców sezonowych (opcjonalnie)
5. Generowanie draft order z sugestiami

**Edge Function**: `auto-order-suggestion`
- Uruchamiana on-demand lub przez scheduler
- Zwraca JSON z sugerowanymi produktami i ilościami
- Uwzględnia aktywne promocje

### 4. Analytics & Tracking

**Zbierane dane:**
- User events (clicks, navigation, forms)
- User sessions (start, end, duration)
- User paths (sekwencje ekranów)
- Campaign interactions (views, clicks, conversions)

**Algorytm grupowania ścieżek:**
- LCS (Longest Common Subsequence) similarity
- Threshold: 70% podobieństwa
- Automatyczne klastry: "Order Creation Flow", "Browse Flow", etc.

**Privacy:**
- Dane przechowywane 90 dni (auto cleanup)
- RLS na poziomie bazy danych
- Batch processing (co 5s lub 20 zdarzeń)
- Brak wysyłania PII do zewnętrznych serwisów

## Bezpieczeństwo

### Row Level Security (RLS)

Wszystkie tabele mają włączone RLS policies:

```sql
-- Przykład: Użytkownicy widzą tylko swoje zamówienia
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    store_id IN (SELECT store_id FROM users WHERE id = auth.uid())
  );
```

### Autentykacja

- JWT tokens zarządzane przez Supabase Auth
- Sesje 7-dniowe z automatycznym odświeżaniem
- Role przechowywane w tabeli `users`
- RLS wykorzystuje `auth.uid()` do weryfikacji

### Validation

- Frontend: TypeScript types + React form validation
- Backend: PostgreSQL constraints + CHECK constraints
- Quantity: MIN/MAX/STEP dla każdego produktu
- Prices: NOT NULL, >= 0, precision (10,2)

## Deployment & DevOps

### Build Process

```bash
npm run build        # Vite build → dist/
npm run preview      # Local production test
npm run typecheck    # TypeScript validation
```

### Deployment Targets

- **Vercel** (polecane) - zero config, auto deploy
- **Netlify** - drag & drop lub GitHub integration
- **Railway** - full-stack z własnym backendem
- **Render** - static site hosting

### Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Performance Optimization

- Code splitting: React.lazy() dla dużych komponentów
- Tree shaking: Vite automatycznie usuwa nieużywany kod
- Image optimization: WebP + lazy loading
- Bundle size: ~500KB gzipped (bez AI modelu)
- Service Worker: Cache-first strategy dla assets

## Rozszerzalność

### Dodawanie Nowej Roli

1. Dodaj typ w `src/lib/supabase.ts`:
```typescript
export type UserRole = 'store_manager' | 'new_role' | ...;
```

2. Utwórz RLS policies w migracji SQL:
```sql
CREATE POLICY "New role policy" ON table_name
  FOR SELECT TO authenticated
  USING (/* conditions */);
```

3. Dodaj UI w `App.tsx`:
```typescript
if (user.role === 'new_role') {
  return <NewRoleScreen />;
}
```

### Dodawanie Nowego Typu Zamówienia

1. Rozszerz typ `OrderSourceType`
2. Utwórz dedykowany komponent (np. `NewOrderTypeScreen.tsx`)
3. Dodaj opcję w menu "Nowe zamówienie"
4. Implementuj logikę zapisu do bazy

### Dodawanie Nowych Metryk Analytics

1. Dodaj metodę w `useUserTracking.tsx`:
```typescript
const trackNewMetric = useCallback((data) => {
  trackEvent('new_metric', { ...data });
}, [trackEvent]);
```

2. Użyj w komponencie:
```typescript
const { trackNewMetric } = useUserTracking(userId, screen);
trackNewMetric({ custom: 'data' });
```

3. Utwórz widok w `AnalyticsPanel.tsx`

## Wzorce Projektowe

### Component Structure

```typescript
/**
 * Brief description of component purpose
 * @component
 */
interface Props {
  /** Description of prop */
  propName: Type;
}

export default function ComponentName({ propName }: Props) {
  // Hooks at top
  const [state, setState] = useState();

  // Event handlers
  const handleEvent = () => {};

  // Effects
  useEffect(() => {}, []);

  // Render
  return <div>...</div>;
}
```

### Error Handling

```typescript
try {
  const { data, error } = await supabase.from('table').select();

  if (error) throw error;

  // Process data
} catch (error) {
  console.error('Operation failed:', error);
  showAlert('error', 'Wystąpił błąd');
}
```

### Loading States

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

if (loading) return <LoadingSpinner />;
return <Content />;
```

## Troubleshooting

### Common Issues

1. **AI nie działa**: Wyczyść cache w profilu użytkownika
2. **Build fails**: Sprawdź `npm run typecheck`
3. **RLS errors**: Weryfikuj policies w Supabase Dashboard
4. **Slow queries**: Dodaj indexy na często używane kolumny

### Debug Tools

- React DevTools (components, props, state)
- Browser Console (wszystkie logi z prefiksem `[AI]`, `[Tracking]`)
- Supabase Dashboard (logs, SQL editor, RLS simulator)
- Network tab (API calls, timing)

## Roadmap

### Planowane Funkcje

- [ ] Real-time collaboration na zamówieniach
- [ ] Notyfikacje push (Web Push API)
- [ ] Eksport raportów do PDF/Excel
- [ ] Integracja z systemami ERP
- [ ] Mobile apps (React Native)
- [ ] Multi-language support (i18n)

### Optymalizacje

- [ ] React Query dla cache'owania
- [ ] Virtual scrolling dla długich list
- [ ] WebWorkers dla heavy computations
- [ ] GraphQL zamiast REST (opcjonalnie)

---

**Ostatnia aktualizacja**: 2025-10-16
**Wersja**: 2.0
**Maintainer**: RODEO Development Team
