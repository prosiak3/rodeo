import { useState, useEffect } from 'react';
import { Tag, Mic, ShoppingBag, Sparkles, Heart, Zap } from 'lucide-react';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Colorful({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
  const [showPromoAlert, setShowPromoAlert] = useState(false);

  useEffect(() => {
    const promoShown = sessionStorage.getItem('promo_alert_colorful_shown');
    if (!promoShown) {
      setShowPromoAlert(true);
      sessionStorage.setItem('promo_alert_colorful_shown', 'true');
    }
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #FEE2E2 0%, #DBEAFE 25%, #E0E7FF 50%, #FCE7F3 75%, #FEF3C7 100%)',
      }}
    >
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-3xl p-1 shadow-xl">
          <div className="bg-white rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
                <span className="text-4xl">🐂</span>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  RODEO
                </h1>
                <p className="text-purple-600 font-bold text-sm flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Weź byka za rogi!
                </p>
              </div>
            </div>
          </div>
        </div>

        {showPromoAlert && (
          <div className="bg-gradient-to-br from-yellow-400 via-red-400 to-pink-500 rounded-3xl p-6 shadow-2xl relative animate-bounce">
            <button
              onClick={() => setShowPromoAlert(false)}
              className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            >
              ×
            </button>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Tag className="w-7 h-7 text-white" />
                </div>
                <div className="w-full">
                  <h3 className="font-black text-2xl mb-4 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                    🎉 Super Promocje!
                  </h3>

                  <div className="space-y-3 mb-4">
                    <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl p-4 border-2 border-red-300">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🔥</span>
                        <span className="font-black text-red-600 text-lg">MEGA RABAT -15%</span>
                      </div>
                      <div className="space-y-2 text-gray-800 font-semibold pl-8">
                        <div className="flex justify-between items-center">
                          <span>Kurczak</span>
                          <span className="text-red-600 font-black">8.49 zł</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Boczek świeży</span>
                          <span className="text-red-600 font-black">24.57 zł</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-300">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🎁</span>
                        <span className="font-black text-purple-600 text-lg">GRATIS 10+1!</span>
                      </div>
                      <div className="space-y-2 text-gray-800 font-semibold pl-8">
                        <div className="flex justify-between items-center">
                          <span>Karkówka extra</span>
                          <span className="text-purple-600 font-black">18.49 zł</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Polędwiczki wp vac</span>
                          <span className="text-purple-600 font-black">23.90 zł</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowPromoAlert(false);
                      onNavigate?.('prices');
                    }}
                    className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 hover:from-yellow-500 hover:via-pink-600 hover:to-purple-600 text-white px-6 py-4 rounded-2xl font-black transition w-full text-base shadow-lg transform hover:scale-105"
                  >
                    🎯 Zobacz wszystkie promocje!
                  </button>
                </div>
              </div>
            </div>
          </div>
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
