# Historia zmian RODEO

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
