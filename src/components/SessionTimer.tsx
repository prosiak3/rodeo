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

  // Separate effect for retry logic
  useEffect(() => {
    if (sessionStart || !user?.id) return;

    // Retry loading session info after 2 seconds if it fails
    const retryTimer = setTimeout(() => {
      console.log('🔄 Retry loading session info...');
      loadSessionInfo();
    }, 2000);

    return () => clearTimeout(retryTimer);
  }, [sessionStart, user?.id]);

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
      const { data, error } = await supabase
        .from('user_sessions')
        .select('session_start')
        .eq('user_id', user.id)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading session info:', error);
        return;
      }

      if (data) {
        setSessionStart(new Date(data.session_start));
      } else {
        // Jeśli nie ma aktywnej sesji, użyj aktualnego czasu jako początku
        console.log('⚠️ Brak aktywnej sesji, używam bieżącego czasu');
        setSessionStart(new Date());
      }
    } catch (error) {
      console.error('Error loading session info:', error);
      // W razie błędu, użyj aktualnego czasu
      setSessionStart(new Date());
    }
  };

  const loadSystemSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('session_max_duration_minutes')
        .single();

      if (data?.session_max_duration_minutes) {
        console.log('🟢 SessionTimer: Załadowano max czas sesji:', data.session_max_duration_minutes, 'minut');
        setMaxDuration(data.session_max_duration_minutes);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  // Subscribe to system settings changes
  useEffect(() => {
    const channel = supabase
      .channel('system_settings_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          console.log('🟢 SessionTimer: Wykryto zmianę ustawień systemowych');
          loadSystemSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Always show the button, even if sessionStart is not loaded yet
  let elapsedSeconds = 0;
  let remainingTime = maxDuration * 60; // Default to full duration
  let percentage = 0;

  if (sessionStart) {
    // Calculate elapsed time in seconds
    elapsedSeconds = Math.floor((currentTime.getTime() - sessionStart.getTime()) / 1000);

    // Calculate remaining time
    const maxDurationSeconds = maxDuration * 60;
    remainingTime = Math.max(maxDurationSeconds - elapsedSeconds, 0);

    // Calculate percentage for color
    percentage = (elapsedSeconds / maxDurationSeconds) * 100;
  }

  return (
    <>
      {/* Mobile: okrągła ikona z pulsowaniem - ZAWSZE widoczna */}
      <button
        onClick={handleKeepAlive}
        className={`md:hidden w-9 h-9 flex items-center justify-center text-white rounded-full font-medium transition ${getButtonColor(percentage)} ${percentage > 75 ? 'animate-pulse' : ''}`}
        title="Kliknij aby przedłużyć sesję"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      {/* Desktop: przycisk z czasem - ZAWSZE widoczny */}
      <button
        onClick={handleKeepAlive}
        className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-white rounded-lg font-medium transition text-sm ${getButtonColor(percentage)}`}
        title="Kliknij aby przedłużyć sesję"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="whitespace-nowrap">{sessionStart ? formatTime(remainingTime) : 'Ładowanie...'}</span>
      </button>
    </>
  );
}
