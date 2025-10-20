import { useState, useEffect } from 'react';
import { Tag, Mic, ShoppingCart, FileText, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Glassmorphism({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
  const [showPromoAlert, setShowPromoAlert] = useState(false);

  useEffect(() => {
    const promoShown = sessionStorage.getItem('promo_alert_glassmorphism_shown');
    if (!promoShown) {
      setShowPromoAlert(true);
      sessionStorage.setItem('promo_alert_glassmorphism_shown', 'true');
    }
  }, []);

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
        <div
          className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-lg border border-white/30 flex items-center justify-center">
              <span className="text-3xl">🐂</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">RODEO</h1>
              <p className="text-white/80 text-sm">Weź byka za rogi</p>
            </div>
          </div>
        </div>

        {showPromoAlert && (
          <div
            className="backdrop-blur-xl bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-3xl p-6 border border-white/30 shadow-2xl relative"
            style={{
              boxShadow: '0 8px 32px 0 rgba(255, 107, 107, 0.4)',
            }}
          >
            <button
              onClick={() => setShowPromoAlert(false)}
              className="absolute top-4 right-4 text-white hover:text-white/70 text-2xl font-bold backdrop-blur-sm bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ×
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center flex-shrink-0">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div className="w-full">
                <h3 className="font-bold text-2xl mb-4 text-white drop-shadow-lg">Nowe promocje!</h3>

                <div className="space-y-3 mb-4">
                  <div className="backdrop-blur-lg bg-white/15 rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🔥</span>
                      <span className="font-bold text-white text-lg">PROMOCJA -15%</span>
                    </div>
                    <div className="space-y-2 text-white/90 pl-8">
                      <div className="flex justify-between items-center">
                        <span>Kurczak</span>
                        <span className="font-bold">8.49 / 1kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Boczek świeży</span>
                        <span className="font-bold">24.57 / 1kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="backdrop-blur-lg bg-white/15 rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🎁</span>
                      <span className="font-bold text-white text-lg">10+1 GRATIS</span>
                    </div>
                    <div className="space-y-2 text-white/90 pl-8">
                      <div className="flex justify-between items-center">
                        <span>Karkówka extra</span>
                        <span className="font-bold">18.49 / 1kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Polędwiczki wp vac</span>
                        <span className="font-bold">23.90 / 1kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPromoAlert(false);
                    onNavigate?.('prices');
                  }}
                  className="backdrop-blur-xl bg-white/30 hover:bg-white/40 border border-white/40 text-white px-6 py-4 rounded-2xl font-semibold transition w-full text-base shadow-lg"
                >
                  Zobacz wszystkie promocje
                </button>
              </div>
            </div>
          </div>
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
                  <div className="text-white/80 text-sm">Zobacz aktywne zamówienia</div>
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
