import { useState, useEffect } from 'react';
import { Tag, Mic, Briefcase, FileText, TrendingUp, Shield } from 'lucide-react';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Corporate({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
  const [showPromoAlert, setShowPromoAlert] = useState(false);

  useEffect(() => {
    const promoShown = sessionStorage.getItem('promo_alert_corporate_shown');
    if (!promoShown) {
      setShowPromoAlert(true);
      sessionStorage.setItem('promo_alert_corporate_shown', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">RODEO</h1>
                <p className="text-blue-200 text-sm font-medium">Enterprise Order Management</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm font-medium">Trusted Partner</div>
              <div className="text-white text-xl font-bold">Since 2024</div>
            </div>
          </div>
        </div>

        {showPromoAlert && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-6 h-6 text-white" />
                <h3 className="font-bold text-white text-lg">Current Promotions</h3>
              </div>
              <button
                onClick={() => setShowPromoAlert(false)}
                className="text-white hover:text-white/80 text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Special Offer</span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">-15%</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Kurczak</span>
                    <span className="font-bold text-slate-900">8.49 PLN / kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Boczek świeży</span>
                    <span className="font-bold text-slate-900">24.57 PLN / kg</span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Volume Discount</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">10+1 Free</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Karkówka extra Rytel</span>
                    <span className="font-bold text-slate-900">18.49 PLN / kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Polędwiczki wp vac</span>
                    <span className="font-bold text-slate-900">23.90 PLN / kg</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowPromoAlert(false);
                  onNavigate?.('prices');
                }}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg"
              >
                View Full Price List
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => onVoiceOrder?.()}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition group"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-lg">Voice Orders</div>
                  <div className="text-slate-500 text-sm">Dictate via microphone</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Most efficient method</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('orders')}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition group"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-lg">My Orders</div>
                  <div className="text-slate-500 text-sm">Track order status</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>Real-time updates</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('prices')}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition group"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-lg">Price List</div>
                  <div className="text-slate-500 text-sm">Browse products</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>Updated daily</span>
              </div>
            </div>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate?.('admin')}
              className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-lg hover:shadow-xl transition group"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white text-lg">Administration</div>
                    <div className="text-blue-200 text-sm">System management</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
                  <span>Privileged access</span>
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-6 text-lg">Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: '01', text: 'Select "New" in menu' },
              { num: '02', text: 'Press microphone button' },
              { num: '03', text: 'Dictate your order' },
              { num: '04', text: 'Review and submit' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {step.num}
                </div>
                <div className="text-sm text-slate-600 font-medium">{step.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-center">
          <div className="text-slate-400 text-sm font-medium mb-2">Secured by</div>
          <div className="text-white font-bold text-xl">Enterprise-Grade Security</div>
        </div>
      </div>
    </div>
  );
}
