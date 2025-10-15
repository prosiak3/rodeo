import { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  userRole?: string;
}

export default function HomeScreen({ onNavigate, userRole }: HomeScreenProps) {
  const [showPromoAlert, setShowPromoAlert] = useState(false);

  useEffect(() => {
    const promoShown = sessionStorage.getItem('promo_alert_shown');
    if (!promoShown) {
      setShowPromoAlert(true);
      sessionStorage.setItem('promo_alert_shown', 'true');
    }
  }, []);

  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        {showPromoAlert && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-lg p-6 relative animate-pulse">
            <button
              onClick={() => setShowPromoAlert(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
            <div className="flex items-start gap-4">
              <Tag className="w-8 h-8 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h3 className="font-bold text-xl mb-3">Nowe promocje w cenniku!</h3>

                <div className="space-y-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔥</span>
                      <span className="font-bold">PROMOCJA -15%</span>
                    </div>
                    <div className="space-y-1 text-sm pl-7">
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

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎁</span>
                      <span className="font-bold">PROMOCJA 10+1 GRATIS</span>
                    </div>
                    <div className="space-y-1 text-sm pl-7">
                      <div className="flex justify-between items-center">
                        <span>Karkówka extra Rytel</span>
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
                  className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition w-full"
                >
                  Zobacz promocje w cenniku
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Szybkie akcje</h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate?.('new-order')}
              className="w-full p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition shadow cursor-pointer"
            >
              Zamówienie głosowe
            </button>
            <button
              onClick={() => onNavigate?.('orders')}
              className="w-full p-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition cursor-pointer"
            >
              Pokaż aktualne zamówienia
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => onNavigate?.('admin')}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition shadow cursor-pointer"
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
