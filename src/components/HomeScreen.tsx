import { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { useActiveBanners } from '../hooks/useActiveBanners';
import OccasionBanner from './OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
  const { currentBanner, trackInteraction } = useActiveBanners();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [lastViewedBannerId, setLastViewedBannerId] = useState<string | null>(null);

  useEffect(() => {
    if (currentBanner && currentBanner.id !== lastViewedBannerId) {
      setIsBannerDismissed(false);
      setLastViewedBannerId(currentBanner.id);
      trackInteraction(currentBanner.id, 'view');
    }
  }, [currentBanner?.id]);

  const handleBannerDismiss = () => {
    if (currentBanner) {
      trackInteraction(currentBanner.id, 'dismiss');
      setIsBannerDismissed(true);
    }
  };

  const handleBannerClick = () => {
    if (currentBanner) {
      trackInteraction(currentBanner.id, 'click');
      onNavigate?.('prices');
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        {currentBanner && !isBannerDismissed && (
          <OccasionBanner
            banner={currentBanner}
            onDismiss={handleBannerDismiss}
            onClick={handleBannerClick}
          />
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Szybkie akcje</h3>
          <div className="space-y-3">
            <button
              onClick={() => onVoiceOrder?.()}
              className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition shadow cursor-pointer flex items-center justify-center gap-2 text-base"
            >
              <Mic className="w-5 h-5" />
              Zamówienie głosowe
            </button>
            <button
              onClick={() => onNavigate?.('orders')}
              className="w-full px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition cursor-pointer text-base"
            >
              Pokaż aktualne zamówienia
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => onNavigate?.('admin')}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition shadow cursor-pointer text-base"
              >
                Panel administracyjny
              </button>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Jak korzystać z aplikacji?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>1. Kliknij &quot;Nowe&quot; w menu dolnym</li>
            <li>2. Naciśnij przycisk mikrofonu</li>
            <li>3. Dyktuj zamówienie głosowo</li>
            <li>4. Sprawdź i wyślij zamówienie</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
