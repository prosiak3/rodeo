# System Analityki Zachowań Użytkowników

## Przegląd

Został zaimplementowany kompleksowy system do zbierania, analizy i wizualizacji zachowań użytkowników w aplikacji RODEO. System automatycznie śledzi wszystkie akcje użytkowników, grupuje podobne ścieżki nawigacyjne i udostępnia zaawansowane narzędzia analityczne.

## Komponenty Systemu

### 1. Baza Danych

#### Nowe tabele:

- **user_events** - Rejestruje każde zdarzenie użytkownika (kliknięcia, nawigacja, formularze)
- **user_sessions** - Grupuje zdarzenia w sesje użytkownika
- **user_paths** - Przechowuje unikalne ścieżki nawigacyjne z statystykami
- **path_clusters** - Grupy podobnych ścieżek użytkowników
- **path_cluster_members** - Relacja wiele-do-wielu między klastrami a ścieżkami

#### Funkcje bazodanowe:

- `calculate_lcs_similarity()` - Oblicza podobieństwo między ścieżkami
- `cleanup_old_analytics_data()` - Czyści dane starsze niż 90 dni
- `update_session_stats()` - Automatycznie aktualizuje statystyki sesji

### 2. Hook React: useUserTracking

Lokalizacja: `src/hooks/useUserTracking.tsx`

**Funkcjonalność:**
- Automatyczne śledzenie nawigacji między ekranami
- Batch processing zdarzeń (wysyła co 5 sekund lub 20 zdarzeń)
- Zarządzanie sesjami z automatycznym timeoutem (30 minut)
- Minimalizacja wpływu na wydajność (<5ms overhead)

**Dostępne metody:**
```typescript
const { trackClick, trackFormSubmit, trackOrderAction, trackEvent } = useUserTracking(userId, currentScreen);
```

### 3. Algorytm Grupowania Ścieżek

Lokalizacja: `src/lib/pathClustering.ts`

**Funkcje:**
- `extractSessionPaths()` - Wyodrębnia ścieżki z sesji użytkowników
- `calculatePathSimilarity()` - Oblicza podobieństwo używając algorytmu LCS (Longest Common Subsequence)
- `clusterPaths()` - Grupuje podobne ścieżki (domyślny próg: 70% podobieństwa)
- `processRecentSessions()` - Przetwarza ostatnie sesje i aktualizuje statystyki

**Przykład użycia:**
```typescript
// Przetwórz sesje z ostatnich 24 godzin
await processRecentSessions(24);

// Przegrupuj ścieżki z progiem 70%
await clusterPaths(70);
```

### 4. Panel Analityczny

Lokalizacja: `src/components/AnalyticsPanel.tsx`

**Dostępne dla:** Użytkownika z rolą `analyst` (email: analyse@sklep.pl)

**Funkcje:**
- **Dashboard KPI** - Liczba użytkowników, sesji, średni czas, zdarzenia
- **Top Wydarzenia** - Wykres najpopularniejszych akcji
- **Grupy Ścieżek** - Wizualizacja sklasyfikowanych zachowań użytkowników
- **Najczęstsze Ścieżki** - Tabela z metrykami: wystąpienia, skuteczność, czas
- **Ostatnie Sesje** - Lista sesji z możliwością "odtworzenia" zachowań użytkownika
- **Filtry** - Okres (dzisiaj/tydzień/miesiąc/wszystko), rola użytkownika
- **Akcje** - Przetwórz sesje, przegrupuj ścieżki, eksportuj dane (JSON)

## Użytkowanie

### Utworzenie użytkownika analityka

```sql
-- 1. Zarejestruj użytkownika przez interfejs aplikacji:
-- Email: analyse@sklep.pl
-- Hasło: [ustaw własne]

-- 2. Migracja automatycznie ustawi rolę 'analyst'
```

### Dostęp do panelu

1. Zaloguj się jako analyse@sklep.pl
2. System automatycznie przekieruje do panelu analitycznego
3. Panel jest dostępny tylko dla użytkowników z rolą `analyst`

### Interpretacja danych

**Grupy ścieżek** pokazują najczęstsze wzorce zachowań:
- "Order Creation Flow" - Ścieżki prowadzące do utworzenia zamówienia
- "Price List Browse Flow" - Przeglądanie cennika
- "Order Editing Flow" - Edycja istniejących zamówień

**Metryki skuteczności:**
- >80% - Bardzo dobra ścieżka (zielony)
- 50-80% - Średnia ścieżka (żółty)
- <50% - Problematyczna ścieżka (czerwony)

## Bezpieczeństwo i Prywatność

### Row Level Security (RLS)

- **user_events** - Użytkownicy mogą dodawać własne zdarzenia, tylko analitycy mogą je czytać
- **user_sessions** - Użytkownicy zarządzają własnymi sesjami, tylko analitycy widzą wszystkie
- **user_paths** - Tylko analitycy mają dostęp do odczytu
- **path_clusters** - Tylko analitycy mają dostęp do odczytu

### Automatyczne czyszczenie danych

Dane analityczne są automatycznie archiwizowane po 90 dniach poprzez funkcję `cleanup_old_analytics_data()`.

### Minimalizacja wpływu na wydajność

- Batch processing (grupowanie zdarzeń przed wysłaniem)
- Debouncing częstych zdarzeń (scrolling, mouse movement)
- Asynchroniczne wysyłanie danych w tle
- Indeksowanie tabel dla szybkich zapytań

## Ulepszone UX/UI - Standaryzacja Przycisków

Wszystkie przyciski zostały ujednolicone według następujących standardów:

### Przyciski podstawowe
- Padding: `px-6 py-4`
- Tekst: `text-base`
- Zaokrąglenie: `rounded-lg`
- **Minimalna wielkość: 44x44px** (zgodnie z WCAG 2.1 dla urządzeń dotykowych)

### Przyciski małe (w tabelach, kartach)
- Padding: `px-4 py-2`
- Tekst: `text-sm`
- Zaokrąglenie: `rounded-lg`

### Dolna nawigacja (BottomNav)
- Wysokość: Zwiększona z `h-16` do `h-20`
- Ikony: Zwiększone z `w-6 h-6` do `w-7 h-7`
- Tekst: Zwiększony z `text-xs` do `text-sm`

### Poprawione komponenty:
- BottomNav.tsx - Wszystkie ikony i tekst większe
- HomeScreen.tsx - Przyciski szybkich akcji ujednolicone
- ConfirmDialog.tsx - Przyciski dialogów większe i bardziej kliklane

## Przykładowe Zapytania Analityczne

### Top 10 użytkowników według aktywności
```sql
SELECT u.full_name, u.role, COUNT(e.id) as event_count
FROM user_events e
JOIN users u ON u.id = e.user_id
WHERE e.timestamp >= now() - interval '7 days'
GROUP BY u.id, u.full_name, u.role
ORDER BY event_count DESC
LIMIT 10;
```

### Średni czas do utworzenia zamówienia
```sql
SELECT
  AVG(EXTRACT(epoch FROM (session_end - session_start))) / 60 as avg_minutes
FROM user_sessions s
WHERE EXISTS (
  SELECT 1 FROM user_events e
  WHERE e.session_id = s.id
  AND e.event_type = 'form_submit'
  AND e.event_data->>'action' = 'send_order'
);
```

### Ścieżki z najwyższą skutecznością
```sql
SELECT
  path_signature,
  occurrence_count,
  success_rate,
  average_duration
FROM user_paths
WHERE occurrence_count >= 5
ORDER BY success_rate DESC
LIMIT 10;
```

## Dalszy Rozwój

### Planowane funkcje:
- Real-time dashboard z aktualizacją na żywo
- Heatmapy kliknięć dla poszczególnych ekranów
- A/B testing framework
- Predykcja zachowań użytkowników (ML)
- Alerty o anomaliach w zachowaniach
- Integracja z narzędziami zewnętrznymi (Google Analytics, Mixpanel)

### Optymalizacje:
- Partycjonowanie tabel user_events po dacie
- Materialized views dla najczęstszych zapytań
- Kompresja danych ścieżek
- Cache'owanie wyników analitycznych

## Wsparcie

W razie pytań lub problemów:
1. Sprawdź logi przeglądarki (Console) - wszystkie błędy są logowane z prefiksem `[Tracking]`
2. Sprawdź czy użytkownik ma rolę `analyst`
3. Upewnij się, że migracje zostały zastosowane poprawnie
4. Skontaktuj się z zespołem technicznym

---

**Data utworzenia:** 2025-10-16
**Wersja:** 1.0
**Autor:** System RODEO Development Team
