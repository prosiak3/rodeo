import { useState, useEffect } from 'react';
import { ChevronRight, Mic, Package, FileText } from 'lucide-react';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Minimalist({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
  const [showPromoAlert, setShowPromoAlert] = useState(false);

  useEffect(() => {
    const promoShown = sessionStorage.getItem('promo_alert_minimalist_shown');
    if (!promoShown) {
      setShowPromoAlert(true);
      sessionStorage.setItem('promo_alert_minimalist_shown', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-8 space-y-12">
        <header className="border-b border-gray-200 pb-8">
          <h1 className="text-5xl font-light text-gray-900 mb-2 tracking-tight">RODEO</h1>
          <p className="text-gray-500 text-sm tracking-wide uppercase">System Zamówień</p>
        </header>

        {showPromoAlert && (
          <div className="border-l-4 border-black pl-6 py-4 relative">
            <button
              onClick={() => setShowPromoAlert(false)}
              className="absolute -top-2 -right-2 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
            <h3 className="text-xl font-medium text-gray-900 mb-4">Aktywne promocje</h3>

            <div className="space-y-4 text-sm">
              <div>
                <div className="font-medium text-gray-900 mb-2">Rabat 15%</div>
                <div className="space-y-1 text-gray-600 pl-4">
                  <div className="flex justify-between">
                    <span>Kurczak</span>
                    <span className="font-medium text-gray-900">8.49 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Boczek świeży</span>
                    <span className="font-medium text-gray-900">24.57 zł</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="font-medium text-gray-900 mb-2">Promocja 10+1</div>
                <div className="space-y-1 text-gray-600 pl-4">
                  <div className="flex justify-between">
                    <span>Karkówka extra</span>
                    <span className="font-medium text-gray-900">18.49 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Polędwiczki</span>
                    <span className="font-medium text-gray-900">23.90 zł</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPromoAlert(false);
                onNavigate?.('prices');
              }}
              className="mt-6 text-sm text-gray-900 border-b border-gray-900 hover:text-gray-600 hover:border-gray-600 transition inline-flex items-center gap-1"
            >
              Zobacz cennik
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
                  <div className="text-sm text-gray-500">Przeglądaj aktywne</div>
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
