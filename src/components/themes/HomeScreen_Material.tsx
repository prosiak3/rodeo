import { useState, useEffect } from 'react';
import { Mic, ShoppingCart, Receipt } from 'lucide-react';
import { useActiveBanners } from '../../hooks/useActiveBanners';
import OccasionBanner from '../OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Material({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {currentBanner && !isBannerDismissed && (
          <OccasionBanner
            banner={currentBanner}
            onDismiss={handleBannerDismiss}
            onClick={handleBannerClick}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => onVoiceOrder?.()}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all elevation-4 hover:elevation-8 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg elevation-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-gray-900 text-xl">Zamówienie głosowe</div>
                  <div className="text-gray-600">Dyktuj przez mikrofon</div>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700 font-medium">
                Najszybsza metoda zamawiania
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('orders')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all elevation-4 hover:elevation-8 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg elevation-4">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-gray-900 text-xl">Moje zamówienia</div>
                  <div className="text-gray-600">Zobacz aktualne zamówienia</div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 font-medium">
                Śledzenie statusu w czasie rzeczywistym
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('prices')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all elevation-4 hover:elevation-8 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg elevation-4">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-gray-900 text-xl">Cennik</div>
                  <div className="text-gray-600">Przeglądaj produkty</div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700 font-medium">
                Aktualizowany codziennie
              </div>
            </div>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate?.('admin')}
              className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all elevation-4 hover:elevation-8 transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⚙️</span>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-xl">Panel administracyjny</div>
                    <div className="text-purple-100">Zarządzaj systemem</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-sm font-medium">
                  Uprzywilejowany dostęp
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 elevation-4">
          <h3 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              ?
            </span>
            Jak korzystać z aplikacji?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { num: 1, text: 'Kliknij "Nowe" w menu dolnym', color: 'from-purple-500 to-indigo-500' },
              { num: 2, text: 'Naciśnij przycisk mikrofonu', color: 'from-blue-500 to-cyan-500' },
              { num: 3, text: 'Dyktuj zamówienie głosowo', color: 'from-green-500 to-emerald-500' },
              { num: 4, text: 'Sprawdź i wyślij zamówienie', color: 'from-amber-500 to-orange-500' },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {step.num}
                </div>
                <span className="text-gray-700 font-medium">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
