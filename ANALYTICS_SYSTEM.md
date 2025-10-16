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
const {
  trackClick,             // Śledzenie kliknięć w przyciski/elementy
  trackFormSubmit,        // Śledzenie wysyłania formularzy
  trackOrderAction,       // Śledzenie akcji zamówień
  trackProductAction,     // Śledzenie akcji produktów (nowe!)
  trackListModification,  // Śledzenie modyfikacji list/zamówień (nowe!)
  trackSearch,            // Śledzenie wyszukiwania (nowe!)
  trackEvent              // Uniwersalne śledzenie zdarzeń
} = useUserTracking(userId, currentScreen);
```

**Nowe metody do śledzenia produktów i list:**

```typescript
// Śledzenie akcji na produktach
trackProductAction(
  'add_to_list' | 'remove_from_list' | 'update_quantity' | 'view_details',
  productId: string,
  productName: string,
  data?: Record<string, any>
);

// Śledzenie modyfikacji list (zamówień, notatników)
trackListModification(
  listType: 'order' | 'notebook' | 'draft',
  action: 'add_item' | 'remove_item' | 'update_item' | 'clear_list',
  itemDetails: {
    productId: string;
    productName: string;
    quantity?: number;
    previousQuantity?: number;  // Dla update_item
  }
);

// Śledzenie wyszukiwania
trackSearch(
  searchTerm: string,
  resultsCount: number,
  filters?: Record<string, any>
);
```

**Zaimplementowane komponenty z trackingiem:**
- ✅ **ProductCard** - Śledzenie kliknięć w produkty (view_details)
- ✅ **EditDraftOrderScreen** - Pełne śledzenie dodawania/usuwania/modyfikacji produktów + wyszukiwanie
- ✅ **PriceList** - Śledzenie dodawania do notatnika + wyszukiwanie z filtrem kategorii
- ✅ Automatyczne nawigacja między ekranami (wszystkie komponenty)

**Przykłady użycia:**

```typescript
// W EditDraftOrderScreen
trackListModification('draft', 'add_item', {
  productId: product.id,
  productName: product.name,
  quantity: 1,
});

// W PriceList przy dodawaniu do notatnika
trackListModification('notebook', 'add_item', {
  productId: product.id,
  productName: product.name,
  quantity: 0,
});

// Przy aktualizacji ilości
trackListModification('draft', 'update_item', {
  productId: item.product_id,
  productName: item.products?.name || 'Unknown',
  quantity: newQuantity,
  previousQuantity: item.quantity,
});

// Przy wyszukiwaniu
trackSearch('kurczak', 15, { category: 'Drób' });
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

## System Śledzenia Kampanii Marketingowych

### Dodatkowe Tabele:

- **marketing_campaigns** - Definicje kampanii i promocji
- **campaign_interactions** - Wszystkie interakcje użytkowników z kampaniami
- **campaign_conversions** - Konwersje przypisane do kampanii

### Nowe Metody Trackingowe:

```typescript
const { trackCampaignInteraction, trackCampaignConversion } = useUserTracking(userId, currentScreen);

// Śledzenie wyświetlenia bannera/promocji
trackCampaignInteraction(
  campaignId,
  'Promocja Black Friday 2024',
  'view',
  { banner_position: 'home_top' }
);

// Śledzenie kliknięcia w banner
trackCampaignInteraction(
  campaignId,
  'Promocja Black Friday 2024',
  'click',
  { banner_position: 'home_top', product_clicked: productId }
);

// Śledzenie odrzucenia (zamknięcie bez kliknięcia)
trackCampaignInteraction(
  campaignId,
  'Push: Nowe produkty drobiowe',
  'dismiss'
);

// Śledzenie konwersji (zamówienie z produktami z promocji)
trackCampaignConversion(
  campaignId,
  orderId,
  totalOrderValue,
  [
    { productId: 'uuid1', productName: 'Kurczak', quantity: 10 },
    { productId: 'uuid2', productName: 'Indyk', quantity: 5 }
  ]
);
```

### Panel Analityczny dla Kampanii

Nowa zakładka "Kampanie" w panelu analitycznym pokazuje:

**Metryki dla każdej kampanii:**
- 👁️ **Wyświetlenia** - ile razy banner/promocja została wyświetlona
- 🖱️ **Kliknięcia** - ile osób kliknęło
- ❌ **Odrzucenia** - ile osób zamknęło bez kliknięcia
- 🛒 **Konwersje** - ile osób złożyło zamówienie

**Wskaźniki skuteczności:**
- **CTR (Click-Through Rate)** - % osób które kliknęły po wyświetleniu
- **Conversion Rate** - % osób które złożyły zamówienie po kliknięciu
- **Całkowity przychód** - suma wartości zamówień z kampanii
- **Średni czas do konwersji** - ile czasu zajmuje od kliknięcia do złożenia zamówienia

**Szczegółowe interakcje:**
- Lista ostatnich 50 interakcji z imiennym określeniem użytkownika
- Typ akcji (wyświetlenie/kliknięcie/odrzucenie/konwersja)
- Timestamp każdej akcji

### Przykładowe Zapytania Analityczne:

**Które promocje są najbardziej efektywne?**
```sql
SELECT * FROM get_campaign_performance('campaign-uuid');
```

**Kto kliknął ale nie skorzystał z promocji?**
```sql
SELECT DISTINCT
  u.full_name,
  u.role,
  ci.timestamp as clicked_at
FROM campaign_interactions ci
JOIN users u ON u.id = ci.user_id
LEFT JOIN campaign_conversions cc ON cc.user_id = ci.user_id AND cc.campaign_id = ci.campaign_id
WHERE ci.campaign_id = 'campaign-uuid'
  AND ci.interaction_type = 'click'
  AND cc.id IS NULL
ORDER BY ci.timestamp DESC;
```

**Średni czas od kliknięcia do zakupu:**
```sql
SELECT
  mc.campaign_name,
  AVG(cc.time_to_conversion) as avg_time
FROM campaign_conversions cc
JOIN marketing_campaigns mc ON mc.id = cc.campaign_id
GROUP BY mc.campaign_name;
```

## Dalszy Rozwój

### Planowane funkcje:
- Real-time dashboard z aktualizacją na żywo
- Heatmapy kliknięć dla poszczególnych ekranów
- A/B testing framework dla kampanii
- Predykcja zachowań użytkowników (ML)
- Alerty o anomaliach w zachowaniach
- Automatyczne rekomendacje promocji na podstawie historii
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
