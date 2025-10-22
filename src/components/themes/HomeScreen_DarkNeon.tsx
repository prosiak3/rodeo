import { useState, useEffect } from 'react';
import { Mic, Database, Code, Zap, Terminal } from 'lucide-react';
import { useActiveBanners } from '../../hooks/useActiveBanners';
import OccasionBanner from '../OccasionBanner';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_DarkNeon({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl top-0 left-0 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl bottom-0 right-0 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000"></div>
      </div>

      <div className="relative p-6 space-y-6">
        {currentBanner && !isBannerDismissed && (
          <OccasionBanner
            banner={currentBanner}
            onDismiss={handleBannerDismiss}
            onClick={handleBannerClick}
          />
        )}

        <div className="space-y-3">
          <button
            onClick={() => onVoiceOrder?.()}
            className="w-full group"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-cyan-500/50 hover:border-cyan-400 rounded-xl p-5 transition shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-cyan-400 text-lg flex items-center gap-2 font-mono">
                    {'> voice.order'}
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-slate-400 text-sm font-mono">{'// Dictate via microphone'}</div>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('orders')}
            className="w-full"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-purple-500/50 hover:border-purple-400 rounded-xl p-5 transition shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Database className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-purple-400 text-lg font-mono">{'> orders.list()'}</div>
                  <div className="text-slate-400 text-sm font-mono">{'// View active orders'}</div>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('prices')}
            className="w-full"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-pink-500/50 hover:border-pink-400 rounded-xl p-5 transition shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-pink-400 text-lg font-mono">{'> prices.fetch()'}</div>
                  <div className="text-slate-400 text-sm font-mono">{'// Browse products'}</div>
                </div>
              </div>
            </div>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate?.('admin')}
              className="w-full"
            >
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-2 border-red-500/50 hover:border-red-400 rounded-xl p-5 transition shadow-lg shadow-red-500/20 hover:shadow-red-500/40">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/50">
                    <Terminal className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-red-400 text-lg font-mono">{'> admin.access()'}</div>
                    <div className="text-slate-400 text-sm font-mono">{'// System management'}</div>
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 font-mono">
          <div className="text-slate-400 text-sm mb-4">
            {'// QUICK_START_GUIDE'}
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 text-slate-300">
              <span className="text-cyan-400 font-bold">1.</span>
              <span><span className="text-purple-400">Select</span> &quot;Nowe&quot; <span className="text-slate-500">in menu</span></span>
            </div>
            <div className="flex gap-3 text-slate-300">
              <span className="text-cyan-400 font-bold">2.</span>
              <span><span className="text-purple-400">Press</span> microphone <span className="text-pink-400">button</span></span>
            </div>
            <div className="flex gap-3 text-slate-300">
              <span className="text-cyan-400 font-bold">3.</span>
              <span><span className="text-purple-400">Dictate</span> your <span className="text-pink-400">order</span></span>
            </div>
            <div className="flex gap-3 text-slate-300">
              <span className="text-cyan-400 font-bold">4.</span>
              <span><span className="text-purple-400">Confirm</span> <span className="text-slate-500">&amp;&amp;</span> <span className="text-pink-400">submit()</span></span>
            </div>
          </div>
        </div>

        <div className="text-center text-slate-500 text-xs font-mono">
          {'> system.status: '}
          <span className="text-green-400">ONLINE</span>
          {' | uptime: 99.9% | latency: <10ms'}
        </div>
      </div>
    </div>
  );
}
