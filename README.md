# RODEO - System Zarządzania Zamówieniami Mięsno-Wędliniarskimi

Zaawansowana aplikacja PWA do zarządzania zamówieniami w systemie hurtownia-sklepy z innowacyjnymi funkcjami AI, automatycznymi sugestiami zamówień i zaawansowaną analityką.

## Szybki Start

```bash
# Instalacja zależności
npm install

# Uruchom serwer deweloperski
npm run dev

# Build produkcyjny
npm run build
```

## Funkcje

- 🎤 **Zamówienia głosowe z AI** - Inteligentne rozpoznawanie produktów offline
- 📊 **Panel analityczny** - KPI, ścieżki użytkowników, kampanie marketingowe
- ✨ **Auto-sugestie zamówień** - Predykcja na podstawie historii zakupów
- 👥 **System wielorolowy** - Kierownicy sklepów, handlowcy, operatorzy, kierowcy, analitycy
- 📱 **Progressive Web App** - Działa offline, instalowalna na urządzeniach mobilnych
- 🔐 **Bezpieczeństwo RLS** - Row Level Security na poziomie bazy danych

## Dokumentacja

### Główna dokumentacja techniczna
- 📖 [**Architektura Systemu**](./docs/ARCHITECTURE.md) - Przegląd architektury, stosu technologicznego, wzorców projektowych
- 🗄️ [**Schemat Bazy Danych**](./docs/DATABASE_SCHEMA.md) - Kompletna dokumentacja tabel, relacji, indeksów i RLS
- 🛠️ [**Przewodnik Developera**](./docs/DEVELOPMENT_GUIDE.md) - Standardy kodowania, typowe zadania, best practices

### Dokumentacja funkcji
- 🤖 [**System AI**](./AI_DOKUMENTACJA.md) - Embeddingi, dopasowywanie produktów, voice recognition
- 📈 [**System Analityki**](./ANALYTICS_SYSTEM.md) - User tracking, path clustering, kampanie marketingowe
- 🚀 [**Deployment**](./DEPLOYMENT.md) - Instrukcje wdrożenia na Vercel, Netlify, Railway, Render

### Przykłady
- 🎯 [**Przykłady Trackingu Kampanii**](./CAMPAIGN_TRACKING_EXAMPLES.md) - Implementacja śledzenia promocji

## Role Użytkowników

| Rola | Dostęp | Funkcje |
|------|--------|---------|
| **Kierownik Sklepu** | Własny sklep | Składanie i przeglądanie zamówień |
| **Handlowiec** | Wiele sklepów | Zarządzanie zamówieniami klientów |
| **Operator** | Wszystkie sklepy | Przetwarzanie i potwierdzanie zamówień |
| **Administrator** | Pełny dostęp | Zarządzanie systemem, użytkownikami, produktami |
| **Kierowca** | Aktywne dostawy | Przeglądanie tras, potwierdzanie dostaw |
| **Analityk** | Dane analityczne | Dashboard, raporty, metryki |

## Technologie

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Transformers.js (all-MiniLM-L6-v2, offline embeddings)
- **PWA**: Service Worker, Web Manifest, IndexedDB

## Wymagania

- Node.js 18+
- npm 9+
- Konto Supabase

## Konfiguracja Środowiska

Utwórz plik `.env` w katalogu głównym:

```env
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-key
```

## Skrypty

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Build for production
npm run preview   # Preview production build
npm run typecheck # TypeScript type checking
npm run lint      # ESLint code linting
```

## Struktura Projektu

```
rodeo/
├── docs/              # Dokumentacja techniczna
├── public/            # Statyczne assety (PWA manifest, SW)
├── src/
│   ├── components/    # Komponenty React
│   ├── contexts/      # React Context providers
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Logika biznesowa i utilities
│   └── App.tsx        # Główny komponent
├── supabase/
│   ├── migrations/    # Migracje bazy danych
│   └── functions/     # Edge Functions (Deno)
└── package.json
```

## Deployment

Aplikacja może być wdrożona na:
- **Vercel** (polecane) - Zero-config deployment
- **Netlify** - Drag & drop lub GitHub integration
- **Railway** - Full-stack z backend
- **Render** - Static site hosting

Szczegóły w [DEPLOYMENT.md](./DEPLOYMENT.md)

## Bezpieczeństwo

- ✅ Row Level Security (RLS) na wszystkich tabelach
- ✅ JWT authentication via Supabase Auth
- ✅ AI działa w 100% offline (brak wysyłania danych)
- ✅ Walidacja danych na poziomie TypeScript i PostgreSQL
- ✅ CORS policies dla Edge Functions

## Licencja

Proprietary - © 2024 RODEO Development Team

## Promocje w systemie

### Promocja -15%
2 produkty objęte rabatem 15%:
- **Kurczak** - 9.99 → 8.49 / 1kg (oszczędzasz 1.50)
- **Boczek świeży** - 28.90 → 24.57 / 1kg (oszczędzasz 4.33)

### Promocja 10+1 GRATIS
2 produkty objęte promocją "kup 10 kg, dostaniesz 11 kg":
- **Karkówka extra Rytel** - 18.49 / 1kg
- **Polędwiczki wp vac** - 23.90 / 1kg

**Jak działa promocja 10+1:**
- Zamawiasz: 10 kg produktu
- Płacisz: 10 kg × cena za kg + 0,01
- Otrzymujesz: 11 kg produktu

**Przykład:**
- Karkówka extra Rytel: 18.49 / 1kg
- Zamówienie: 10 kg
- Koszt: 10 × 18.49 + 0.01 = 184.91
- Otrzymujesz: 11 kg (oszczędzasz 18.49!)
