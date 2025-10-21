import { supabase } from './supabase';

/**
 * Close inactive sessions (sessions with no activity in 30+ minutes)
 * This should be called periodically by admins or analysts
 */
export async function closeInactiveSessions(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('close_inactive_sessions');

    if (error) {
      // Silently ignore "function not found" errors - this means the database migration hasn't been applied yet
      if (error.code === 'PGRST202' || error.code === '42883') {
        return { success: false, error: 'Function not available (migration pending)' };
      }

      console.error('[Session Cleanup] Failed to close inactive sessions:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Session Cleanup] Exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Get count of truly active sessions (activity in last 30 minutes)
 */
export async function getActiveSessions(): Promise<{ count: number; sessions: any[] }> {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        users!inner (
          full_name,
          role,
          store_id
        )
      `)
      .is('session_end', null)
      .gte('session_start', thirtyMinutesAgo);

    if (error) {
      console.error('[Session Cleanup] Failed to get active sessions:', error);
      return { count: 0, sessions: [] };
    }

    return { count: data?.length || 0, sessions: data || [] };
  } catch (err) {
    console.error('[Session Cleanup] Exception:', err);
    return { count: 0, sessions: [] };
  }
}

/**
 * Close all sessions for a specific user
 */
export async function closeUserSessions(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('close_user_sessions', { p_user_id: userId });

    if (error) {
      // Silently ignore "function not found" errors
      if (error.code === 'PGRST202' || error.code === '42883') {
        return { success: false, error: 'Function not available (migration pending)' };
      }

      console.error('[Session Cleanup] Failed to close user sessions:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Session Cleanup] Exception:', message);
    return { success: false, error: message };
  }
}
