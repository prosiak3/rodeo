import { useState, useEffect } from 'react';
import { Mic, Briefcase, FileText, TrendingUp, Shield } from 'lucide-react';
import { useActiveBanners } from '../../hooks/useActiveBanners';
import OccasionBanner from '../OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_Corporate({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
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
                  <div className="text-slate-500 text-sm">Check your orders</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>Zobacz zamówienia</span>
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
