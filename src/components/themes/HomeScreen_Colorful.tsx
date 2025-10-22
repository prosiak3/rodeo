import { useState, useEffect } from 'react';
import { Mic, ShoppingBag, Sparkles, Heart, Zap } from 'lucide-react';
import { useActiveBanners } from '../../hooks/useActiveBanners';
import OccasionBanner from '../OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Colorful({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
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
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #FEE2E2 0%, #DBEAFE 25%, #E0E7FF 50%, #FCE7F3 75%, #FEF3C7 100%)',
      }}
    >
      <div className="p-6 space-y-6">
        {currentBanner && !isBannerDismissed && (
          <OccasionBanner
            banner={currentBanner}
            onDismiss={handleBannerDismiss}
            onClick={handleBannerClick}
          />
        )}

        <div className="space-y-4">
          <button
            onClick={() => onVoiceOrder?.()}
            className="w-full group transform hover:scale-105 transition"
          >
            <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-1 rounded-3xl shadow-xl">
              <div className="bg-white rounded-3xl p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-black text-xl bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                    Zamówienie głosowe
                  </div>
                  <div className="text-gray-600 font-semibold flex items-center gap-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Szybko i wygodnie!
                  </div>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('orders')}
            className="w-full transform hover:scale-105 transition"
          >
            <div className="bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 p-1 rounded-3xl shadow-xl">
              <div className="bg-white rounded-3xl p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-black text-xl bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Moje zamówienia
                  </div>
                  <div className="text-gray-600 font-semibold">Sprawdź status</div>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('prices')}
            className="w-full transform hover:scale-105 transition"
          >
            <div className="bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 p-1 rounded-3xl shadow-xl">
              <div className="bg-white rounded-3xl p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-black text-xl bg-gradient-to-r from-purple-600 to-rose-600 bg-clip-text text-transparent">
                    Cennik produktów
                  </div>
                  <div className="text-gray-600 font-semibold">Przeglądaj ofertę</div>
                </div>
              </div>
            </div>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate?.('admin')}
              className="w-full transform hover:scale-105 transition"
            >
              <div className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 p-1 rounded-3xl shadow-xl">
                <div className="bg-white rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-3xl">⚙️</span>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-black text-xl bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                      Panel Admin
                    </div>
                    <div className="text-gray-600 font-semibold">Zarządzaj systemem</div>
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl p-1 shadow-xl">
          <div className="bg-white rounded-3xl p-6">
            <h3 className="font-black text-2xl mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              📱 Jak to działa?
            </h3>
            <div className="space-y-3">
              {[
                { num: '1', text: 'Kliknij "Nowe" w menu', color: 'from-pink-500 to-rose-500' },
                { num: '2', text: 'Naciśnij mikrofon 🎤', color: 'from-purple-500 to-indigo-500' },
                { num: '3', text: 'Dyktuj zamówienie', color: 'from-blue-500 to-cyan-500' },
                { num: '4', text: 'Potwierdź i wyślij! ✨', color: 'from-green-500 to-emerald-500' },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white font-black shadow-lg`}>
                    {step.num}
                  </div>
                  <span className="text-gray-800 font-bold">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
