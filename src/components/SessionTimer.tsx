import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, RefreshCw } from 'lucide-react';

export default function SessionTimer() {
  const { user } = useAuth();
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [maxDuration, setMaxDuration] = useState(480); // Default 8 hours

  useEffect(() => {
    if (!user?.id) return;

    loadSessionInfo();
    loadSystemSettings();

    // Update timer every second
    const interval = setInterval(() => {
      if (sessionStart) {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000 / 60);
        setSessionDuration(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.id, sessionStart]);

  const loadSessionInfo = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('user_sessions')
        .select('session_start')
        .eq('user_id', user.id)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setSessionStart(new Date(data.session_start));
      }
    } catch (error) {
      console.error('Error loading session info:', error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('session_max_duration_minutes')
        .single();

      if (data?.session_max_duration_minutes) {
        setMaxDuration(data.session_max_duration_minutes);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const handleKeepAlive = async () => {
    try {
      const { error } = await supabase.rpc('keep_session_alive');

      if (error) throw error;

      // Reload session to reset timer
      await loadSessionInfo();

      alert('Sesja została przedłużona! Licznik został zresetowany.');
    } catch (error) {
      console.error('Error keeping session alive:', error);
      alert('Błąd przedłużania sesji');
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressColor = (): string => {
    const percentage = (sessionDuration / maxDuration) * 100;

    if (percentage < 50) return 'bg-green-500';
    if (percentage < 75) return 'bg-yellow-500';
    if (percentage < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = (): string => {
    const percentage = (sessionDuration / maxDuration) * 100;

    if (percentage < 50) return 'text-green-700';
    if (percentage < 75) return 'text-yellow-700';
    if (percentage < 90) return 'text-orange-700';
    return 'text-red-700';
  };

  if (!sessionStart) return null;

  const percentage = Math.min((sessionDuration / maxDuration) * 100, 100);
  const remainingTime = Math.max(maxDuration - sessionDuration, 0);

  return (
    <div className="fixed bottom-24 right-4 bg-white rounded-lg shadow-lg p-4 w-72 border-2 border-gray-200 z-40">
      <div className="flex items-center gap-2 mb-3">
        <Clock className={`w-5 h-5 ${getTextColor()}`} />
        <h3 className="font-semibold text-gray-800">Czas sesji</h3>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Aktywna:</span>
            <span className={`font-semibold ${getTextColor()}`}>
              {formatTime(sessionDuration)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>Pozostało:</span>
          <span className="font-medium">{formatTime(remainingTime)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Maksymalny czas:</span>
          <span>{formatTime(maxDuration)}</span>
        </div>

        {percentage > 75 && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Sesja zbliża się do limitu czasu. Kliknij przycisk poniżej aby przedłużyć.
          </div>
        )}

        <button
          onClick={handleKeepAlive}
          className="w-full py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center justify-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Przedłuż sesję
        </button>

        <div className="text-xs text-gray-500 text-center">
          Kliknij aby zresetować licznik i przedłużyć sesję
        </div>
      </div>
    </div>
  );
}
