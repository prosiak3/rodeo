# Przykłady Użycia Systemu Śledzenia Kampanii

## Przykład 1: Banner Promocyjny na Stronie Głównej

```typescript
// HomeScreen.tsx
import { useUserTracking } from '../hooks/useUserTracking';
import { useAuth } from '../contexts/AuthContext';

function HomeScreen() {
  const { user } = useAuth();
  const { trackCampaignInteraction } = useUserTracking(user?.id || null, 'home');

  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const CAMPAIGN_ID = 'bf2024-banner-home'; // ID kampanii Black Friday

  // Śledzenie wyświetlenia bannera
  useEffect(() => {
    if (showPromoBanner) {
      trackCampaignInteraction(
        CAMPAIGN_ID,
        'Promocja Black Friday 2024',
        'view',
        { banner_position: 'home_top', banner_size: 'full_width' }
      );
    }
  }, [showPromoBanner]);

  const handleBannerClick = () => {
    // Śledzenie kliknięcia
    trackCampaignInteraction(
      CAMPAIGN_ID,
      'Promocja Black Friday 2024',
      'click',
      { banner_position: 'home_top', action: 'navigate_to_promo' }
    );

    // Przekierowanie do cennika z promocjami
    navigate('/prices?promo=bf2024');
  };

  const handleBannerDismiss = () => {
    // Śledzenie zamknięcia
    trackCampaignInteraction(
      CAMPAIGN_ID,
      'Promocja Black Friday 2024',
      'dismiss',
      { banner_position: 'home_top', time_visible_seconds: calculateTimeVisible() }
    );

    setShowPromoBanner(false);
  };

  return (
    <div>
      {showPromoBanner && (
        <div className="promo-banner">
          <h2>Black Friday! 25% zniżki na wszystkie produkty!</h2>
          <button onClick={handleBannerClick}>Zobacz ofertę</button>
          <button onClick={handleBannerDismiss}>×</button>
        </div>
      )}
      {/* Reszta contentu... */}
    </div>
  );
}
```

## Przykład 2: Push Notification o Nowych Produktach

```typescript
// NotificationService.tsx
import { supabase } from '../lib/supabase';

async function sendPushNotification(userId: string) {
  const CAMPAIGN_ID = 'new-products-push-2024';

  // Wysłanie powiadomienia (np. przez service worker)
  await navigator.serviceWorker.ready.then(registration => {
    registration.showNotification('Nowe produkty drobiowe!', {
      body: '15% zniżki na całą gamę kurczaków i indyków',
      data: { campaignId: CAMPAIGN_ID }
    });
  });

  // Automatyczne śledzenie wyświetlenia
  await supabase.from('campaign_interactions').insert({
    campaign_id: CAMPAIGN_ID,
    user_id: userId,
    interaction_type: 'view',
    interaction_data: { type: 'push_notification', sent_at: new Date().toISOString() }
  });
}

// W komponencie obsługującym kliknięcie w powiadomienie
function handleNotificationClick(campaignId: string) {
  const { trackCampaignInteraction } = useUserTracking(user?.id || null, 'notification');

  trackCampaignInteraction(
    campaignId,
    'Push: Nowe produkty drobiowe',
    'click',
    { notification_type: 'push', clicked_from: 'system_tray' }
  );

  // Przekierowanie do cennika
  navigate('/prices?category=Drób&promo=new-products');
}
```

## Przykład 3: Popup Promocyjny z Kodem Zniżkowym

```typescript
// PromoPopup.tsx
import { useState, useEffect } from 'react';
import { useUserTracking } from '../hooks/useUserTracking';
import { useAuth } from '../contexts/AuthContext';

function PromoPopup() {
  const { user } = useAuth();
  const { trackCampaignInteraction } = useUserTracking(user?.id || null, 'promo-popup');
  const [isOpen, setIsOpen] = useState(false);

  const CAMPAIGN_ID = 'indyk-promo-email';
  const PROMO_CODE = 'INDYK15';

  useEffect(() => {
    // Wyświetl popup po 5 sekundach
    const timer = setTimeout(() => {
      setIsOpen(true);

      // Track wyświetlenia
      trackCampaignInteraction(
        CAMPAIGN_ID,
        'Email: Indyk w promocji',
        'view',
        { popup_trigger: 'timer', delay_seconds: 5 }
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleUsePromo = () => {
    // Skopiuj kod do schowka
    navigator.clipboard.writeText(PROMO_CODE);

    // Track kliknięcia
    trackCampaignInteraction(
      CAMPAIGN_ID,
      'Email: Indyk w promocji',
      'click',
      { action: 'copy_code', promo_code: PROMO_CODE }
    );

    // Przekierowanie
    navigate('/prices?category=Indyk&promo=indyk15');
    setIsOpen(false);
  };

  const handleDismiss = () => {
    trackCampaignInteraction(
      CAMPAIGN_ID,
      'Email: Indyk w promocji',
      'dismiss',
      { time_visible_seconds: calculateTimeVisible() }
    );

    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="promo-popup">
        <h2>Specjalna oferta!</h2>
        <p>15% zniżki na wszystkie produkty indycze</p>
        <div className="promo-code">{PROMO_CODE}</div>
        <button onClick={handleUsePromo}>Użyj kodu</button>
        <button onClick={handleDismiss}>Nie, dziękuję</button>
      </div>
    </div>
  );
}
```

## Przykład 4: Śledzenie Konwersji przy Składaniu Zamówienia

```typescript
// OrderConfirmationScreen.tsx
import { useUserTracking } from '../hooks/useUserTracking';
import { useAuth } from '../contexts/AuthContext';

function OrderConfirmationScreen({ order }) {
  const { user } = useAuth();
  const { trackCampaignConversion } = useUserTracking(user?.id || null, 'order-confirmation');

  useEffect(() => {
    // Sprawdź czy zamówienie zawiera produkty z aktywnej kampanii
    checkAndTrackCampaignConversion();
  }, [order]);

  const checkAndTrackCampaignConversion = async () => {
    // Pobierz aktywne kampanie
    const { data: campaigns } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('active', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString());

    if (!campaigns) return;

    // Sprawdź każdą kampanię
    for (const campaign of campaigns) {
      // Sprawdź czy użytkownik kliknął w tę kampanię
      const { data: interaction } = await supabase
        .from('campaign_interactions')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('user_id', user.id)
        .eq('interaction_type', 'click')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!interaction) continue;

      // Sprawdź które produkty z zamówienia są objęte promocją
      const targetProducts = campaign.target_products || [];
      const productsFromCampaign = order.items
        .filter(item => targetProducts.includes(item.product_id))
        .map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity
        }));

      if (productsFromCampaign.length > 0) {
        // Track konwersji
        await trackCampaignConversion(
          campaign.id,
          order.id,
          order.total_amount,
          productsFromCampaign
        );

        console.log(`✅ Konwersja z kampanii "${campaign.campaign_name}" została zarejestrowana!`);
      }
    }
  };

  return (
    <div>
      <h1>Dziękujemy za zamówienie!</h1>
      <p>Numer zamówienia: {order.order_number}</p>
      {/* Reszta contentu... */}
    </div>
  );
}
```

## Przykład 5: Banner z Produktami Promocyjnymi w Cenniku

```typescript
// PriceList.tsx
import { useState, useEffect } from 'react';
import { useUserTracking } from '../hooks/useUserTracking';

function PriceList() {
  const { user } = useAuth();
  const { trackCampaignInteraction } = useUserTracking(user?.id || null, 'prices');
  const [promoCampaign, setPromoCampaign] = useState(null);

  useEffect(() => {
    loadActivePromo();
  }, []);

  const loadActivePromo = async () => {
    const { data } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('active', true)
      .eq('campaign_type', 'banner')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .maybeSingle();

    if (data) {
      setPromoCampaign(data);

      // Track wyświetlenia
      trackCampaignInteraction(
        data.id,
        data.campaign_name,
        'view',
        { location: 'price_list_top', campaign_type: 'banner' }
      );
    }
  };

  const handlePromoProductClick = (product) => {
    if (promoCampaign) {
      trackCampaignInteraction(
        promoCampaign.id,
        promoCampaign.campaign_name,
        'click',
        {
          product_id: product.id,
          product_name: product.name,
          location: 'price_list_product',
          has_discount: true
        }
      );
    }

    // Dodaj produkt do zamówienia...
    addToOrder(product);
  };

  return (
    <div>
      {promoCampaign && (
        <div className="promo-banner-in-prices">
          <h3>{promoCampaign.campaign_name}</h3>
          <p>{promoCampaign.discount_percentage}% zniżki na wybrane produkty!</p>
        </div>
      )}

      {/* Lista produktów z zaznaczeniem promocyjnych */}
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => handlePromoProductClick(product)}
          isPromo={promoCampaign?.target_products?.includes(product.id)}
        />
      ))}
    </div>
  );
}
```

## Analiza Wyników w Panelu Analitycznym

Po wdrożeniu powyższych przykładów, w panelu analitycznym (zakładka "Kampanie") zobaczysz:

### Dla kampanii "Promocja Black Friday 2024":
- **Wyświetlenia**: 1,234 (ile razy banner się pokazał)
- **Kliknięcia**: 567 (CTR: 45.9%)
- **Odrzucenia**: 345 (28.0% użytkowników zamknęło banner)
- **Konwersje**: 89 (Conversion Rate: 15.7%)
- **Przychód**: 45,678 zł
- **Średni czas do konwersji**: 12m 34s

### Szczegółowe interakcje pokażą:
- Jan Kowalski (store_manager) - Kliknięcie - 2024-10-16 14:23:45
- Anna Nowak (salesperson) - Wyświetlenie - 2024-10-16 14:22:10
- Piotr Wiśniewski (store_manager) - Konwersja - 2024-10-16 14:25:30

### Na podstawie tych danych możesz:
1. **Zidentyfikować najskuteczniejsze kampanie** - które generują najwięcej konwersji
2. **Optymalizować timing** - o której porze użytkownicy najchętniej klikają
3. **A/B testować** - różne wersje bannerów i komunikatów
4. **Personalizować** - pokazywać różne promocje różnym rolom użytkowników
5. **Prognozować ROI** - porównać koszt kampanii z wygenerowanym przychodem
