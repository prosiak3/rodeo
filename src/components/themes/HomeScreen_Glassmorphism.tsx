import { useState, useEffect } from 'react';
import { Mic, ShoppingCart, FileText, Sparkles } from 'lucide-react';
import { useActiveBanners } from '../../hooks/useActiveBanners';
import OccasionBanner from '../OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Glassmorphism({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
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
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-pink-300/10 rounded-full blur-3xl top-40 right-0 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-blue-300/10 rounded-full blur-3xl bottom-0 left-1/3 animate-pulse delay-2000"></div>
      </div>

      <div className="relative p-6 space-y-6">
        {currentBanner && !isBannerDismissed && (
          <OccasionBanner
            banner={currentBanner}
            onDismiss={handleBannerDismiss}
            onClick={handleBannerClick}
          />
        )}

        <div
          className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }}
        >
          <h3 className="font-semibold text-xl mb-6 text-white">Szybkie akcje</h3>
          <div className="space-y-4">
            <button
              onClick={() => onVoiceOrder?.()}
              className="w-full group"
            >
              <div className="backdrop-blur-xl bg-gradient-to-r from-amber-400/30 to-orange-500/30 hover:from-amber-400/40 hover:to-orange-500/40 border border-white/30 p-6 rounded-2xl transition shadow-lg flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-white text-lg">Zamówienie głosowe</div>
                  <div className="text-white/80 text-sm">Dyktuj przez mikrofon</div>
                </div>
                <Sparkles className="w-6 h-6 text-white/60 group-hover:text-white transition" />
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('orders')}
              className="w-full"
            >
              <div className="backdrop-blur-xl bg-white/10 hover:bg-white/15 border border-white/30 p-6 rounded-2xl transition shadow-lg flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-white text-lg">Moje zamówienia</div>
                  <div className="text-white/80 text-sm">Sprawdź swoje zamówienia</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('prices')}
              className="w-full"
            >
              <div className="backdrop-blur-xl bg-white/10 hover:bg-white/15 border border-white/30 p-6 rounded-2xl transition shadow-lg flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-white text-lg">Cennik</div>
                  <div className="text-white/80 text-sm">Przeglądaj produkty</div>
                </div>
              </div>
            </button>

            {userRole === 'admin' && (
              <button
                onClick={() => onNavigate?.('admin')}
                className="w-full"
              >
                <div className="backdrop-blur-xl bg-gradient-to-r from-blue-400/30 to-purple-500/30 hover:from-blue-400/40 hover:to-purple-500/40 border border-white/30 p-6 rounded-2xl transition shadow-lg flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-white text-lg">Panel administracyjny</div>
                    <div className="text-white/80 text-sm">Zarządzaj systemem</div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        <div
          className="backdrop-blur-xl bg-blue-500/20 rounded-3xl p-6 border border-blue-300/30 shadow-xl"
        >
          <h3 className="font-semibold text-white mb-4 text-lg">Jak korzystać?</h3>
          <ul className="space-y-3 text-white/90">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span>Kliknij &quot;Nowe&quot; w menu dolnym</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span>Naciśnij przycisk mikrofonu</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span>Dyktuj zamówienie głosowo</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <span>Sprawdź i wyślij zamówienie</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
