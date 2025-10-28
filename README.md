# Rodeo - System Zarządzania Zamówieniami Hurtowni

## Opis Projektu

Rodeo to zaawansowany system do zarządzania zamówieniami dla hurtowni mięsa. Aplikacja oferuje wielokanałowe składanie zamówień (głosowe, manualne, z cennika), zarządzanie produktami, analitykę sprzedaży i automatyczne sugestie zamówień bazujące na AI.

## Główne Funkcjonalności

### 🛒 Systemy Składania Zamówień
- **Zamówienie głosowe** - rozpoznawanie mowy z uczeniem maszynowym
- **Zamówienie manualne** - ręczne wprowadzanie produktów
- **Zamówienie z cennika** - szybkie dodawanie z listy produktów
- **Auto-zamówienie** - AI generuje sugestie na podstawie historii
- **Kopiowanie zamówień** - duplikacja poprzednich zamówień
- **Notatnik** - przechowywanie produktów do późniejszego zamówienia

### 📊 Analityka i Raporty
- **Panel analityczny** - szczegółowa analiza zachowań użytkowników
- **Analiza sprzedaży** - statystyki zamówień, produktów i sklepów
- **Metryki AI** - śledzenie dokładności rozpoznawania głosu
- **Prognozowanie popytu** - AI przewiduje przyszły popyt
- **Trendy sezonowe** - analiza wzorców zakupowych

### 👥 Zarządzanie Użytkownikami
- **Role**: admin, warehouse, analyst, salesperson, driver
- **Preferencje użytkownika** - personalizacja interfejsu
- **Preferencje zależne od urządzenia** - oddzielne ustawienia dla mobile/desktop
- **Auto-logout** z zapisem lokalizacji
- **Historia sesji** - przeglądanie aktywności

### 💰 Zarządzanie Cenami
- **Cenniki** - różne cenniki dla różnych grup sklepów
- **Promocje** - rabaty procentowe (15%, 50%)
- **Akcje 10+1** - kup 10, dostaniesz 11
- **Ceny specjalne** - indywidualne ceny dla sklepów
- **Historia zmian cen** - audyt wszystkich modyfikacji

### 🗺️ Sklepy i Grupy
- **124 sklepy** w północno-wschodniej Polsce
- **Grupy sklepów** - regionalne i kategorialne grupowanie
- **Mapa sklepów** - wizualizacja lokalizacji z GPS
- **E-maile hurtowe** - powiadomienia dla grup sklepów

### 📦 Produkty
- **400+ produktów** mięsnych
- **Kategorie** - wędliny, mięso, drób, ryby
- **Tagi** - elastyczne tagowanie produktów
- **Średnia waga** - automatyczne przeliczanie dla produktów sztukowych
- **Zdjęcia i opisy** - bogata prezentacja produktowa

### 🔔 Powiadomienia
- **Powiadomienia real-time** - aktualizacje zamówień na żywo
- **Ogłoszenia systemowe** - komunikaty dla wszystkich użytkowników
- **Banery okazjonalne** - promocje i wydarzenia specjalne
- **E-mail notifications** - automatyczne wysyłanie zamówień mailem

### 📈 Roadmap i Changelog
- **Roadmap** - interaktywna mapa rozwoju systemu
- **Changelog** - automatyczne logowanie wszystkich zmian
- **Historia wersji** - pełna dokumentacja modyfikacji
- **Odnośniki do kodu** - śledzenie zmian w plikach

### 🎨 Personalizacja UI
- **Motywy** - 10+ predefiniowanych motywów kolorystycznych
- **Dark mode** - tryb ciemny dla wszystkich ekranów
- **Rozmiar czcionki** - 5 poziomów wielkości tekstu
- **Układy** - lista/kafelki, różne widoki zamówień
- **Dostosowanie przycisków** - pokazuj/ukrywaj elementy UI

### 🔒 Bezpieczeństwo
- **Row Level Security (RLS)** - restrykcyjne polityki dostępu
- **Audyt zmian** - logowanie wszystkich modyfikacji
- **Sesje** - zarządzanie czasem trwania i timeoutami
- **Polityki haseł** - bezpieczna autentykacja

## Technologie

### Frontend
- **React 18** + TypeScript
- **Vite** - szybki build tool
- **Tailwind CSS** - utility-first styling
- **Lucide React** - ikony
- **React Leaflet** - mapy
- **Web Vitals** - monitoring wydajności

### Backend
- **Supabase** - backend-as-a-service
- **PostgreSQL** - relacyjna baza danych
- **Edge Functions** - serverless functions
- **Real-time subscriptions** - live updates

### AI/ML
- **@xenova/transformers** - embeddings i ML w przeglądarce
- **Rozpoznawanie mowy** - Web Speech API
- **Clustering** - grupowanie wzorców zachowań
- **Prognozowanie** - predykcja popytu

## Struktura Projektu

```
rodeo/
├── src/
│   ├── components/          # Komponenty React
│   │   ├── AdminPanel.tsx   # Panel administracyjny
│   │   ├── AnalyticsPanel.tsx  # Analityka zachowań
│   │   ├── AutoOrderScreen.tsx  # Auto-zamówienia AI
│   │   ├── ChangelogPanel.tsx   # Historia zmian
│   │   ├── PriceList.tsx        # Cennik produktów
│   │   ├── VoiceOrderScreen.tsx # Zamówienia głosowe
│   │   └── ...
│   ├── contexts/            # React Contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── FontSizeContext.tsx
│   ├── hooks/               # Custom React Hooks
│   │   ├── useDevicePreferences.tsx
│   │   ├── useAutoLogout.tsx
│   │   ├── useUserTracking.tsx
│   │   └── ...
│   ├── lib/                 # Biblioteki pomocnicze
│   │   ├── supabase.ts      # Klient Supabase
│   │   ├── changelogHelper.ts  # Auto-changelog
│   │   ├── embeddingsManager.ts # AI embeddings
│   │   ├── demandForecasting.ts # Prognozowanie
│   │   └── ...
│   └── types/               # TypeScript types
├── supabase/
│   ├── migrations/          # Migracje bazy danych (140+ plików)
│   └── functions/           # Edge Functions
│       ├── auto-order-suggestion/
│       └── send-order-email/
├── public/                  # Pliki statyczne
├── docs/                    # Dokumentacja
│   ├── CHANGELOG_GUIDE.md   # Przewodnik changelog
│   ├── ANALYTICS_SYSTEM.md  # Dokumentacja analityki
│   └── ...
└── package.json
```

## Instalacja

### Wymagania
- Node.js 18+
- npm lub yarn
- Konto Supabase

### Kroki instalacji

1. **Klonowanie repozytorium**
```bash
git clone <repository-url>
cd rodeo
```

2. **Instalacja zależności**
```bash
npm install
```

3. **Konfiguracja zmiennych środowiskowych**
```bash
cp .env.example .env
```

Wypełnij `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. **Uruchomienie projektu**
```bash
npm run dev
```

Aplikacja dostępna pod `http://localhost:5173`

5. **Build produkcyjny**
```bash
npm run build
npm run preview
```

## Konfiguracja Bazy Danych

### Zastosowanie migracji

Wszystkie migracje znajdują się w `supabase/migrations/`. Supabase automatycznie stosuje nowe migracje przy deploymencie.

### Struktura bazy danych

Główne tabele:
- `users` - użytkownicy systemu
- `stores` - sklepy
- `store_groups` - grupy sklepów
- `products` - produkty
- `orders` - zamówienia
- `order_items` - pozycje zamówień
- `price_lists` - cenniki
- `price_list_items` - produkty w cennikach
- `special_prices` - ceny specjalne
- `promotional_prices` - promocje
- `user_sessions` - sesje użytkowników
- `user_analytics_events` - eventy analityczne
- `ai_model_performance` - metryki AI
- `voice_recognition_corrections` - korekty rozpoznawania
- `changelog_entries` - wpisy changelogu
- `roadmap_stages` - etapy roadmapy
- `roadmap_features` - funkcje w roadmapie
- `system_announcements` - ogłoszenia
- `occasion_banners` - banery okazjonalne

## Użytkowanie

### Role użytkowników

**Admin**
- Pełny dostęp do wszystkich funkcji
- Zarządzanie użytkownikami, produktami, cenami
- Dostęp do analityki i ustawień systemowych

**Warehouse** (Hurtownia)
- Zarządzanie zamówieniami
- Modyfikacja statusów
- Dostęp do cenników

**Analyst**
- Dostęp tylko do odczytu
- Pełna analityka i raporty
- Brak możliwości modyfikacji danych

**Salesperson** (Handlowiec)
- Składanie zamówień
- Dostęp do przypisanych sklepów
- Zarządzanie własnymi zamówieniami

**Driver** (Kierowca)
- Widok zamówień do dostawy
- Zmiana statusu na "dostarczone"
- Trasy dostaw

### Skróty klawiszowe

- `Ctrl/Cmd + K` - Szybka nawigacja
- `Ctrl/Cmd + N` - Nowe zamówienie
- `Ctrl/Cmd + V` - Zamówienie głosowe
- `Ctrl/Cmd + P` - Cennik
- `Ctrl/Cmd + O` - Lista zamówień
- `Ctrl/Cmd + S` - Zapisz (w edycji)
- `ESC` - Anuluj / Zamknij

### Workflow składania zamówienia

1. **Wybierz sklep** - z listy lub wyszukaj
2. **Wybierz metodę** - głos, manual, cennik, auto
3. **Dodaj produkty** - wybierz produkty i ilości
4. **Notatnik** - opcjonalnie zapisz jako notatnik
5. **Wyślij** - finalizuj zamówienie
6. **E-mail** - automatyczne wysłanie na adres sklepu

### Promocje w systemie

#### Promocja -15%
Produkty z rabatem 15%:
- **Kurczak** - 9.99 → 8.49 / 1kg (oszczędzasz 1.50)
- **Boczek świeży** - 28.90 → 24.57 / 1kg (oszczędzasz 4.33)

#### Promocja 10+1 GRATIS
Kup 10 kg, dostaniesz 11 kg:
- **Karkówka extra Rytel** - 18.49 / 1kg
- **Polędwiczki wp vac** - 23.90 / 1kg

**Przykład:**
- Zamówienie: 10 kg Karkówki
- Koszt: 10 × 18.49 + 0.01 = 184.91
- Otrzymujesz: 11 kg (oszczędzasz 18.49!)

## Rozwój i Wkład

### Dodawanie nowych funkcji

1. Utwórz branch: `git checkout -b feature/nazwa-funkcji`
2. Implementuj zmiany
3. Dodaj testy (jeśli dotyczy)
4. **Dodaj wpis do changelogu** w `src/lib/changelogHelper.ts`
5. Commit: `git commit -m "feat: opis funkcji"`
6. Push i utwórz Pull Request

### Konwencje commitów

- `feat:` - nowa funkcjonalność
- `fix:` - naprawa błędu
- `docs:` - zmiany w dokumentacji
- `style:` - formatowanie, brakujące średniki
- `refactor:` - refaktoryzacja kodu
- `test:` - dodanie testów
- `chore:` - zmiany w buildzie, zależnościach

### Automatyczne logowanie zmian

System automatycznie dodaje wpisy do changelogu przy logowaniu admina.

Aby dodać nowy wpis:
1. Edytuj `src/lib/changelogHelper.ts`
2. Dodaj wpis na początku tablicy `entries`
3. Uzupełnij: version, title, description, category, file_references
4. System automatycznie doda wpis przy następnym logowaniu

Szczegóły w: `CHANGELOG_GUIDE.md`

## Deployment

### Supabase

1. Utwórz projekt na supabase.com
2. Skopiuj URL i anon key do `.env`
3. Migracje zostaną zastosowane automatycznie

### Vercel / Netlify

1. Połącz repozytorium
2. Ustaw zmienne środowiskowe
3. Build command: `npm run build`
4. Output directory: `dist`

### Railway

Projekt zawiera `railway.json` z konfiguracją.

## Monitoring i Logi

### Web Vitals
System automatycznie zbiera metryki wydajności:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

Dostępne w panelu Analytics.

### Logi systemowe
- Sesje użytkowników
- Eventy analityczne
- Metryki AI
- Błędy rozpoznawania głosu

Logi można włączać/wyłączać w Ustawieniach Systemowych.

## Troubleshooting

### Problemy z rozpoznawaniem głosu
1. Sprawdź uprawnienia mikrofonu w przeglądarce
2. Użyj HTTPS (wymagane dla Web Speech API)
3. Sprawdź ustawienia językowe (pl-PL)

### Problemy z bazą danych
1. Zweryfikuj połączenie w `.env`
2. Sprawdź czy migracje zostały zastosowane
3. Sprawdź logi RLS policies w Supabase Dashboard

### Problemy z wydajnością
1. Sprawdź Web Vitals w devtools
2. Użyj lazy loading dla ciężkich komponentów
3. Zoptymalizuj obrazy produktów

## Wsparcie

Kontakt:
- Email: support@rodeo.pl
- Issues: GitHub Issues
- Dokumentacja: `/docs`

## Licencja

Proprietary - Wszystkie prawa zastrzeżone

---

**Wersja:** 1.6.1
**Ostatnia aktualizacja:** 28.10.2024
**Status:** Production Ready ✅
