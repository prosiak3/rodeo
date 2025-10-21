import { useState, useEffect } from 'react';
import { Mic, Package, FileText, Sparkles, ChevronRight } from 'lucide-react';
import { useActiveBanners } from '../../hooks/useActiveBanners';
import OccasionBanner from '../OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Fluent({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-90"></div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl"></div>
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                  <span className="text-3xl">🐂</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-1">RODEO</h1>
                  <p className="text-white/80 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Weź byka za rogi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {currentBanner && !isBannerDismissed && (
          <OccasionBanner
            banner={currentBanner}
            onDismiss={handleBannerDismiss}
            onClick={handleBannerClick}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onVoiceOrder?.()}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl"></div>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl group-hover:bg-white/20 transition"></div>
            <div className="relative p-6 text-white">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Mic className="w-7 h-7" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-xl">Zamówienie głosowe</div>
                  <div className="text-white/80 text-sm">Dyktuj przez mikrofon</div>
                </div>
                <ChevronRight className="w-6 h-6 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('orders')}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white rounded-2xl shadow-lg"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl group-hover:from-blue-100 group-hover:to-purple-100 transition"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-xl text-gray-900">Moje zamówienia</div>
                  <div className="text-gray-600 text-sm">Zobacz aktualne zamówienia</div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('prices')}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white rounded-2xl shadow-lg"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl group-hover:from-green-100 group-hover:to-emerald-100 transition"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-xl text-gray-900">Cennik</div>
                  <div className="text-gray-600 text-sm">Przeglądaj produkty</div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate?.('admin')}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl"></div>
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl group-hover:bg-white/20 transition"></div>
              <div className="relative p-6 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-xl">Panel administracyjny</div>
                    <div className="text-white/80 text-sm">Zarządzaj systemem</div>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-3xl shadow-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-3xl"></div>
          <div className="relative p-6">
            <h3 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              Jak korzystać z aplikacji?
            </h3>
            <div className="space-y-3">
              {[
                { text: 'Kliknij "Nowe" w menu dolnym', color: 'from-blue-500 to-cyan-500' },
                { text: 'Naciśnij przycisk mikrofonu', color: 'from-purple-500 to-pink-500' },
                { text: 'Dyktuj zamówienie głosowo', color: 'from-amber-500 to-orange-500' },
                { text: 'Sprawdź i wyślij zamówienie', color: 'from-green-500 to-emerald-500' },
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition">
                  <div className={`w-10 h-10 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                    {index + 1}
                  </div>
                  <span className="text-gray-800 font-medium">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
