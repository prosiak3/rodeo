import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

interface SessionTimerProps {
  onKeepAlive?: () => void;
}

export default function SessionTimer({ onKeepAlive }: SessionTimerProps) {
  const { user } = useAuth();
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [maxDuration, setMaxDuration] = useState(480); // Default 8 hours in minutes
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!user?.id) return;

    loadSessionInfo();
    loadSystemSettings();
  }, [user?.id]);

  // Separate interval for updating current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const getButtonColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-600 hover:bg-green-700';
    if (percentage < 75) return 'bg-yellow-600 hover:bg-yellow-700';
    if (percentage < 90) return 'bg-orange-600 hover:bg-orange-700';
    return 'bg-red-600 hover:bg-red-700';
  };

  if (!sessionStart) return null;

  // Calculate elapsed time in seconds
  const elapsedSeconds = Math.floor((currentTime.getTime() - sessionStart.getTime()) / 1000);

  // Calculate remaining time
  const maxDurationSeconds = maxDuration * 60;
  const remainingTime = Math.max(maxDurationSeconds - elapsedSeconds, 0);

  // Calculate percentage for color
  const percentage = (elapsedSeconds / maxDurationSeconds) * 100;

  return (
    <>
      {/* Mobile: okrągła ikona z pulsowaniem */}
      <button
        onClick={handleKeepAlive}
        className={`md:hidden w-9 h-9 flex items-center justify-center text-white rounded-full font-medium transition ${getButtonColor(percentage)} ${percentage > 75 ? 'animate-pulse' : ''}`}
        title="Kliknij aby przedłużyć sesję"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      {/* Desktop: przycisk z czasem */}
      <button
        onClick={handleKeepAlive}
        className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-white rounded-lg font-medium transition text-sm ${getButtonColor(percentage)}`}
        title="Kliknij aby przedłużyć sesję"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="whitespace-nowrap">{formatTime(remainingTime)}</span>
      </button>
    </>
  );
}
