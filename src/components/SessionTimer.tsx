import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

interface SessionTimerProps {
  onKeepAlive?: () => void;
}

export default function SessionTimer({ onKeepAlive }: SessionTimerProps) {
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
        const elapsedSeconds = Math.floor((now.getTime() - sessionStart.getTime()) / 1000);
        setSessionDuration(elapsedSeconds);
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

      await loadSessionInfo();

      if (onKeepAlive) {
        onKeepAlive();
      }
    } catch (error) {
      console.error('Error keeping session alive:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getButtonColor = (): string => {
    const maxDurationSeconds = maxDuration * 60;
    const percentage = (sessionDuration / maxDurationSeconds) * 100;

    if (percentage < 50) return 'bg-green-600 hover:bg-green-700';
    if (percentage < 75) return 'bg-yellow-600 hover:bg-yellow-700';
    if (percentage < 90) return 'bg-orange-600 hover:bg-orange-700';
    return 'bg-red-600 hover:bg-red-700';
  };

  if (!sessionStart) return null;

  const maxDurationSeconds = maxDuration * 60;
  const remainingTime = Math.max(maxDurationSeconds - sessionDuration, 0);

  return (
    <button
      onClick={handleKeepAlive}
      className={`flex items-center gap-2 px-3 py-1.5 text-white rounded-lg font-medium transition text-sm ${getButtonColor()}`}
      title="Kliknij aby przedłużyć sesję"
    >
      <RefreshCw className="w-4 h-4" />
      <span>{formatTime(remainingTime)}</span>
    </button>
  );
}
