import { useState, useEffect } from 'react';
import { ChevronRight, Mic, Package, FileText } from 'lucide-react';
import { useActiveBanners } from '../../hooks/useActiveBanners';
import OccasionBanner from '../OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Minimalist({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
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
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-8 space-y-12">
        {currentBanner && !isBannerDismissed && (
          <OccasionBanner
            banner={currentBanner}
            onDismiss={handleBannerDismiss}
            onClick={handleBannerClick}
          />
        )}

        <section>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-6">Akcje</h2>
          <div className="space-y-1">
            <button
              onClick={() => onVoiceOrder?.()}
              className="w-full text-left py-6 border-b border-gray-200 hover:bg-gray-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <Mic className="w-5 h-5 text-gray-900" />
                <div>
                  <div className="font-medium text-gray-900">Zamówienie głosowe</div>
                  <div className="text-sm text-gray-500">Dyktuj przez mikrofon</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition" />
            </button>

            <button
              onClick={() => onNavigate?.('orders')}
              className="w-full text-left py-6 border-b border-gray-200 hover:bg-gray-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <Package className="w-5 h-5 text-gray-900" />
                <div>
                  <div className="font-medium text-gray-900">Moje zamówienia</div>
                  <div className="text-sm text-gray-500">Sprawdź swoje zamówienia</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition" />
            </button>

            <button
              onClick={() => onNavigate?.('prices')}
              className="w-full text-left py-6 border-b border-gray-200 hover:bg-gray-50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <FileText className="w-5 h-5 text-gray-900" />
                <div>
                  <div className="font-medium text-gray-900">Cennik</div>
                  <div className="text-sm text-gray-500">Przeglądaj produkty</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition" />
            </button>

            {userRole === 'admin' && (
              <button
                onClick={() => onNavigate?.('admin')}
                className="w-full text-left py-6 border-b border-gray-200 hover:bg-gray-50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-lg">⚙</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Administracja</div>
                    <div className="text-sm text-gray-500">Panel zarządzania</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition" />
              </button>
            )}
          </div>
        </section>

        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-6">Instrukcja</h2>
          <ol className="space-y-4 text-sm text-gray-600">
            <li className="flex gap-4">
              <span className="font-medium text-gray-900 w-8">01</span>
              <span>Wybierz &quot;Nowe&quot; w menu</span>
            </li>
            <li className="flex gap-4">
              <span className="font-medium text-gray-900 w-8">02</span>
              <span>Naciśnij przycisk mikrofonu</span>
            </li>
            <li className="flex gap-4">
              <span className="font-medium text-gray-900 w-8">03</span>
              <span>Dyktuj zamówienie głosowo</span>
            </li>
            <li className="flex gap-4">
              <span className="font-medium text-gray-900 w-8">04</span>
              <span>Potwierdź i wyślij</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
