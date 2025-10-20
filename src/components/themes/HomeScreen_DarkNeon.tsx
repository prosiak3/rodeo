import { useState, useEffect } from 'react';
import { Tag, Mic, Database, Code, Zap, Terminal } from 'lucide-react';

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin' | 'prices') => void;
  onVoiceOrder?: () => void;
  userRole?: string;
}

export default function HomeScreen_DarkNeon({ onNavigate, onVoiceOrder, userRole }: HomeScreenProps) {
  const [showPromoAlert, setShowPromoAlert] = useState(false);

  useEffect(() => {
    const promoShown = sessionStorage.getItem('promo_alert_darkneon_shown');
    if (!promoShown) {
      setShowPromoAlert(true);
      sessionStorage.setItem('promo_alert_darkneon_shown', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl top-0 left-0 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl bottom-0 right-0 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000"></div>
      </div>

      <div className="relative p-6 space-y-6">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Terminal className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                RODEO
              </h1>
              <p className="text-cyan-400 text-sm font-mono">{'> system.orders.init()'}</p>
            </div>
          </div>
        </div>

        {showPromoAlert && (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-pink-500/30 shadow-2xl shadow-pink-500/20 relative">
            <button
              onClick={() => setShowPromoAlert(false)}
              className="absolute -top-2 -right-2 bg-slate-800 border border-pink-500/50 text-pink-400 hover:text-pink-300 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-pink-500/20"
            >
              ×
            </button>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/50">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <div className="w-full">
                <h3 className="font-black text-2xl mb-4 bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                  {'// ACTIVE_PROMOTIONS'}
                </h3>

                <div className="space-y-3 mb-4 font-mono">
                  <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-400 font-bold">{'{'}</span>
                      <span className="text-cyan-400">discount:</span>
                      <span className="text-pink-400 font-bold">-15%</span>
                      <span className="text-red-400 font-bold">{'}'}</span>
                    </div>
                    <div className="space-y-2 text-sm pl-4">
                      <div className="flex justify-between items-center text-slate-300">
                        <span><span className="text-purple-400">&quot;</span>Kurczak<span className="text-purple-400">&quot;</span></span>
                        <span className="text-cyan-400 font-bold">8.49</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span><span className="text-purple-400">&quot;</span>Boczek świeży<span className="text-purple-400">&quot;</span></span>
                        <span className="text-cyan-400 font-bold">24.57</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-purple-400 font-bold">{'{'}</span>
                      <span className="text-cyan-400">promo:</span>
                      <span className="text-pink-400 font-bold">&quot;10+1&quot;</span>
                      <span className="text-purple-400 font-bold">{'}'}</span>
                    </div>
                    <div className="space-y-2 text-sm pl-4">
                      <div className="flex justify-between items-center text-slate-300">
                        <span><span className="text-purple-400">&quot;</span>Karkówka<span className="text-purple-400">&quot;</span></span>
                        <span className="text-cyan-400 font-bold">18.49</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span><span className="text-purple-400">&quot;</span>Polędwiczki<span className="text-purple-400">&quot;</span></span>
                        <span className="text-cyan-400 font-bold">23.90</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPromoAlert(false);
                    onNavigate?.('prices');
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 py-4 rounded-xl font-bold transition w-full text-base shadow-lg shadow-purple-500/30 border border-cyan-400/30"
                >
                  {'> VIEW_ALL_PROMOTIONS()'}
                </button>
              </div>
            </div>
          </div>
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
