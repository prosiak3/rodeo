import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface AutoLogoutConfig {
  timeoutMinutes?: number;
  enabled?: boolean;
  onBeforeLogout?: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function useAutoLogout({
  timeoutMinutes = 15,
  enabled = true,
  onBeforeLogout,
  onLogout,
}: AutoLogoutConfig) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  const resetTimer = useCallback(() => {
    if (!enabled || isLoggingOutRef.current) return;

    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (isLoggingOutRef.current) return;

      console.log('[AutoLogout] Timeout reached, initiating auto-logout...');
      isLoggingOutRef.current = true;

      try {
        if (onBeforeLogout) {
          console.log('[AutoLogout] Executing pre-logout actions...');
          await onBeforeLogout();
        }

        console.log('[AutoLogout] Logging out...');
        await onLogout();
      } catch (error) {
        console.error('[AutoLogout] Error during auto-logout:', error);
        isLoggingOutRef.current = false;
      }
    }, timeoutMinutes * 60 * 1000);
  }, [enabled, timeoutMinutes, onBeforeLogout, onLogout]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleActivity, resetTimer]);

  const getTimeUntilLogout = useCallback(() => {
    if (!enabled || isLoggingOutRef.current) return 0;
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
    return Math.max(0, Math.floor(remaining / 1000));
  }, [enabled, timeoutMinutes]);

  const extendSession = useCallback(() => {
    if (!enabled) return;
    console.log('[AutoLogout] Session manually extended');
    resetTimer();
  }, [enabled, resetTimer]);

  return {
    resetTimer,
    getTimeUntilLogout,
    extendSession,
  };
}

export async function saveUserLocation(
  userId: string,
  location: {
    activeTab: string;
    orderMode?: string | null;
    selectedOrderId?: string | null;
    editingOrderId?: string | null;
  }
) {
  try {
    await supabase
      .from('users')
      .update({
        last_app_location: location,
        last_location_timestamp: new Date().toISOString(),
      })
      .eq('id', userId);

    console.log('[AutoLogout] Location saved:', location);
  } catch (error) {
    console.error('[AutoLogout] Failed to save location:', error);
  }
}

export async function restoreUserLocation(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('last_app_location, after_auto_logout_return_to')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (data?.after_auto_logout_return_to === 'last_location' && data?.last_app_location) {
      console.log('[AutoLogout] Restoring location:', data.last_app_location);

      await supabase
        .from('users')
        .update({
          last_app_location: null,
          last_location_timestamp: null,
        })
        .eq('id', userId);

      return data.last_app_location;
    }

    if (data?.after_auto_logout_return_to === 'orders') {
      return { activeTab: 'orders' };
    }

    if (data?.after_auto_logout_return_to === 'prices') {
      return { activeTab: 'prices' };
    }

    if (data?.after_auto_logout_return_to === 'home') {
      return { activeTab: 'home' };
    }

    return null;
  } catch (error) {
    console.error('[AutoLogout] Failed to restore location:', error);
    return null;
  }
}

export async function recordSessionGap(userId: string, wasAutoLogout: boolean = false) {
  try {
    const { data: lastSession } = await supabase
      .from('user_sessions')
      .select('id, session_end')
      .eq('user_id', userId)
      .not('session_end', 'is', null)
      .order('session_end', { ascending: false })
      .limit(1)
      .single();

    if (lastSession?.session_end) {
      const now = new Date();
      const lastEnd = new Date(lastSession.session_end);
      const gapMinutes = Math.floor((now.getTime() - lastEnd.getTime()) / 60000);

      if (gapMinutes >= 1 && gapMinutes <= 10080) {
        const { data: newSession } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', userId)
          .order('session_start', { ascending: false })
          .limit(1)
          .single();

        if (newSession) {
          await supabase
            .from('user_session_gaps')
            .insert({
              user_id: userId,
              previous_session_id: lastSession.id,
              previous_session_end: lastSession.session_end,
              next_session_id: newSession.id,
              next_session_start: now.toISOString(),
              gap_duration_minutes: gapMinutes,
              was_auto_logout: wasAutoLogout,
            });

          console.log(`[AutoLogout] Session gap recorded: ${gapMinutes} minutes`);
        }
      }
    }
  } catch (error) {
    console.error('[AutoLogout] Failed to record session gap:', error);
  }
}
