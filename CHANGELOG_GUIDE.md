# Przewodnik Systemowy - Automatyczne Logowanie Zmian

## Przegląd Systemu

System automatycznie dokumentuje wszystkie wprowadzone zmiany w aplikacji. Każda znacząca modyfikacja jest rejestrowana w bazie danych i wyświetlana w zakładce **Roadmap > Changelog**.

## Jak Działa System

### 1. Automatyczne Dodawanie Wpisów

Po zalogowaniu się admina do aplikacji, system automatycznie:
- Sprawdza listę najnowszych zmian w pliku `src/lib/changelogHelper.ts`
- Weryfikuje czy wpisy już istnieją w bazie danych
- Dodaje tylko nowe wpisy, unikając duplikatów
- Loguje wyniki w konsoli przeglądarki

**Plik:** `src/App.tsx:106-111`
```typescript
useEffect(() => {
  if (user?.role === 'admin') {
    logRecentChanges().catch(console.error);
  }
}, [user?.role]);
```

### 2. Struktura Wpisu Changelog

Każdy wpis zawiera:

```typescript
{
  version: '1.6.1',                    // Numer wersji (semantic versioning)
  title: 'Krótki tytuł zmiany',       // Zwięzły opis (1 linia)
  description: 'Szczegółowy opis...',  // Pełny opis funkcjonalności
  category: 'feature',                 // Kategoria (patrz niżej)
  file_references: [                   // Odnośniki do kodu
    'src/components/Component.tsx:123',
    'src/lib/helper.ts:45-67'
  ]
}
```

### 3. Kategorie Zmian

| Kategoria | Ikona | Kolor | Użycie |
|-----------|-------|-------|---------|
| `feature` | ⚡ | Niebieski | Nowe funkcjonalności |
| `improvement` | 📈 | Zielony | Ulepszenia istniejących funkcji |
| `bugfix` | 🐛 | Żółty | Naprawy błędów |
| `breaking` | ⚠️ | Czerwony | Zmiany łamiące kompatybilność |
| `security` | 🛡️ | Fioletowy | Poprawki bezpieczeństwa |

## Instrukcja Dodawania Nowych Wpisów

### Krok 1: Edytuj changelogHelper.ts

Otwórz plik: `src/lib/changelogHelper.ts`

Znajdź tablicę `entries` w funkcji `logRecentChanges()` i dodaj nowy wpis **na początku** listy:

```typescript
export async function logRecentChanges() {
  const entries: ChangelogEntryInput[] = [
    // ✅ DODAJ TUTAJ NOWY WPIS (zawsze na górze!)
    {
      version: '1.7.0',
      title: 'Nowa funkcja eksportu danych',
      description: 'Dodano możliwość eksportowania zamówień do formatu CSV i Excel. Użytkownik może wybrać zakres dat i filtrować po statusie zamówienia.',
      category: 'feature',
      file_references: [
        'src/components/ExportPanel.tsx',
        'src/lib/exportUtils.ts:15-89',
        'src/components/OrdersList.tsx:234'
      ]
    },
    // ... pozostałe wpisy ...
  ];
}
```

### Krok 2: Określ Wersję

Używaj **Semantic Versioning**:
- `X.0.0` - Główne zmiany (breaking changes)
- `0.X.0` - Nowe funkcjonalności
- `0.0.X` - Poprawki i małe ulepszenia

Przykłady:
- `1.7.0` - Nowa duża funkcja
- `1.6.3` - Poprawka błędu
- `2.0.0` - Zmiana łamiąca kompatybilność

### Krok 3: Dodaj Odnośniki do Kodu

Format odnośników:
```typescript
file_references: [
  'ścieżka/do/pliku.tsx',              // Cały plik
  'ścieżka/do/pliku.tsx:123',          // Konkretna linia
  'ścieżka/do/pliku.tsx:45-67',        // Zakres linii
]
```

**Wskazówki:**
- Zawsze używaj ścieżek względnych od folderu `src/`
- Dla migracji używaj pełnej ścieżki: `supabase/migrations/...`
- Dodaj najważniejsze pliki (max 5-7 odnośników)
- Priorytetyzuj główne komponenty i logikę biznesową

### Krok 4: Napisz Dobry Opis

**Tytuł** (krótki, maksymalnie 60 znaków):
✅ "Automatyczne logowanie zmian do Changelog"
❌ "Dodano nową funkcję która automatycznie dodaje wpisy"

**Opis** (szczegółowy, 2-4 zdania):
✅ "Dodano funkcję automatycznego dodawania wpisów do changelogu po każdym uruchomieniu aplikacji przez admina. System sprawdza czy wpis już istnieje i dodaje tylko nowe wpisy."

❌ "Teraz changelog działa automatycznie"

### Krok 5: Wybierz Kategorię

Wybierz najodpowiedniejszą:

| Zmiana | Kategoria |
|--------|-----------|
| Dodano nowy panel/ekran | `feature` |
| Poprawiono wydajność | `improvement` |
| Naprawiono błąd/crash | `bugfix` |
| Zmieniono API/strukturę danych | `breaking` |
| Naprawa luki bezpieczeństwa | `security` |

### Krok 6: Przetestuj

Po dodaniu wpisu:

1. Zapisz plik
2. Zbuduj projekt: `npm run build`
3. Zaloguj się jako admin
4. Otwórz konsolę przeglądarki
5. Sprawdź komunikat: `✅ Added X new changelog entries`
6. Przejdź do **Roadmap > Changelog**
7. Zweryfikuj czy wpis się pojawił

## Przykłady Kompletnych Wpisów

### Przykład 1: Nowa Funkcja

```typescript
{
  version: '1.8.0',
  title: 'System powiadomień push dla mobilnych',
  description: 'Dodano pełne wsparcie dla powiadomień push na urządzeniach mobilnych. Użytkownicy otrzymują alerty o nowych zamówieniach, zmianach statusu i ważnych ogłoszeniach. Powiadomienia można konfigurować w ustawieniach profilu.',
  category: 'feature',
  file_references: [
    'src/components/PushNotifications.tsx',
    'src/hooks/usePushNotifications.ts',
    'src/components/ProfileScreen.tsx:1500-1550',
    'public/sw.js:120-180'
  ]
}
```

### Przykład 2: Ulepszenie

```typescript
{
  version: '1.7.2',
  title: 'Optymalizacja ładowania cennika',
  description: 'Zoptymalizowano ładowanie cennika produktów poprzez dodanie indeksów bazy danych i cache warstwę. Czas ładowania zmniejszył się z 3s do 0.5s. Dodano lazy loading dla obrazków produktów.',
  category: 'improvement',
  file_references: [
    'src/components/PriceList.tsx:139-175',
    'supabase/migrations/20251028230000_add_product_indexes.sql'
  ]
}
```

### Przykład 3: Poprawka Błędu

```typescript
{
  version: '1.7.1',
  title: 'Naprawa zapisywania draft zamówień offline',
  description: 'Naprawiono błąd który powodował utratę draft zamówień podczas pracy offline. Dodano lepszą synchronizację z IndexedDB i obsługę konfliktów. Implementacja offline-first pattern.',
  category: 'bugfix',
  file_references: [
    'src/hooks/useOfflineSync.tsx:45-89',
    'src/lib/offlineStorage.ts:120-156'
  ]
}
```

## Najlepsze Praktyki

### ✅ DO:
- Dodawaj wpisy zaraz po wprowadzeniu zmian
- Używaj jasnego, konkretnego języka
- Podawaj kluczowe odnośniki do kodu
- Grupuj powiązane zmiany w jedną wersję
- Pisz z perspektywy użytkownika (co zyskują?)

### ❌ DON'T:
- Nie używaj żargonu technicznego w tytule
- Nie pomijaj odnośników do kodu
- Nie dodawaj wpisu dla każdej małej zmiany
- Nie kopiuj komunikatów commitów git
- Nie używaj skrótów i akronimów

## Dostęp do Changelogu

**Dla użytkowników:**
1. Zaloguj się do aplikacji
2. Kliknij **Admin** (dolny pasek)
3. Wybierz **Roadmap**
4. Kliknij zakładkę **Changelog**

**Dla adminów (edycja):**
1. Otwórz Changelog (jak wyżej)
2. Kliknij **Dodaj wpis**
3. Wypełnij formularz
4. Kliknij **Zapisz**

## Struktura Bazy Danych

Tabela: `changelog_entries`

```sql
CREATE TABLE changelog_entries (
  id uuid PRIMARY KEY,
  version text NOT NULL,              -- np. "1.6.0"
  title text NOT NULL,                -- Krótki tytuł
  description text NOT NULL,          -- Szczegółowy opis
  category text NOT NULL,             -- feature/improvement/bugfix/breaking/security
  file_references text[],             -- Tablica odnośników
  release_date timestamptz,           -- Data wydania
  order_index integer,                -- Kolejność w ramach wersji
  created_at timestamptz,
  updated_at timestamptz
);
```

## FAQ

**Q: Czy muszę dodawać wpis dla każdej zmiany?**
A: Nie. Dodawaj tylko znaczące zmiany, które wpływają na funkcjonalność lub UX.

**Q: Jak pogrupować wiele małych zmian?**
A: Połącz je w jeden wpis z opisem "Różne poprawki i ulepszenia" i wylistuj w opisie.

**Q: Czy mogę edytować stare wpisy?**
A: Tak, ale tylko jako admin przez interfejs Changelog. Lepiej dodać nowy wpis z korektą.

**Q: Co jeśli zapomniałem dodać wpisu?**
A: Dodaj go retrospektywnie z prawidłową datą release_date.

**Q: Czy wpisy są widoczne dla wszystkich?**
A: Tak, wszyscy zalogowani użytkownicy mogą czytać changelog.

## Troubleshooting

**Problem:** Wpis nie pojawia się w changelog
- ✓ Sprawdź konsolę przeglądarki
- ✓ Zweryfikuj czy jesteś zalogowany jako admin
- ✓ Upewnij się że wpis nie istnieje już w bazie
- ✓ Sprawdź czy nie ma błędów TypeScript w build

**Problem:** Duplikaty wpisów
- ✓ System automatycznie sprawdza duplikaty po `version` i `title`
- ✓ Jeśli zmienisz tytuł, system doda nowy wpis
- ✓ Usuń duplikaty przez interfejs Changelog

**Problem:** Odnośniki do kodu nie działają
- ✓ Odnośniki są tylko informacyjne (nie są klikalne)
- ✓ Używaj ich jako wskazówki gdzie szukać kodu
- ✓ Możesz skopiować ścieżkę i otworzyć w edytorze

## Rozwój Systemu

Planowane ulepszenia:
- [ ] Automatyczne parsowanie git commitów
- [ ] Integracja z GitHub releases
- [ ] Eksport changelogu do Markdown
- [ ] Klikalne odnośniki do kodu (integracja z VS Code)
- [ ] Automatyczne generowanie release notes
- [ ] RSS feed dla zmian

---

**Ostatnia aktualizacja:** 28.10.2024
**Wersja dokumentu:** 1.0
**Autor:** System Rodeo
