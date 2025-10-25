/*
  # Update Session Cleanup Functions to Use System Settings

  1. Updates
    - Modify `close_inactive_sessions` function to use configurable timeouts from system_settings
    - Add new function to clean up disconnected sessions after kill timeout
    - Add new function to enforce maximum session duration

  2. Changes
    - Replace hardcoded 30-minute timeout with dynamic value from system_settings
    - Implement three-stage cleanup: warning -> disconnect -> kill
    - Respect manual_keep_alive flag to prevent auto-disconnect
*/

-- Drop existing function to recreate with new logic
DROP FUNCTION IF EXISTS close_inactive_sessions();

-- Create updated close_inactive_sessions function
CREATE OR REPLACE FUNCTION close_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_inactive_threshold INTERVAL;
  v_max_duration INTERVAL;
  v_kill_threshold INTERVAL;
BEGIN
  -- Get system settings
  SELECT 
    session_inactive_disconnect_minutes,
    session_max_duration_minutes,
    session_disconnect_kill_minutes,
    session_settings_enabled
  INTO v_settings
  FROM system_settings
  LIMIT 1;

  -- If settings not enabled or not found, use defaults
  IF v_settings IS NULL OR v_settings.session_settings_enabled = FALSE THEN
    v_inactive_threshold := INTERVAL '30 minutes';
    v_max_duration := INTERVAL '8 hours';
    v_kill_threshold := INTERVAL '30 minutes';
  ELSE
    v_inactive_threshold := (v_settings.session_inactive_disconnect_minutes || ' minutes')::INTERVAL;
    v_max_duration := (v_settings.session_max_duration_minutes || ' minutes')::INTERVAL;
    v_kill_threshold := (v_settings.session_disconnect_kill_minutes || ' minutes')::INTERVAL;
  END IF;

  -- 1. Close sessions that exceeded max duration (even if active)
  UPDATE user_sessions
  SET 
    session_end = now(),
    disconnected_by = 'system',
    disconnect_reason = 'Maximum session duration exceeded',
    can_reconnect = false
  WHERE session_end IS NULL
    AND manual_keep_alive = false
    AND (now() - session_start) > v_max_duration;

  -- 2. Close sessions inactive beyond threshold
  UPDATE user_sessions
  SET 
    session_end = now(),
    disconnected_by = 'system',
    disconnect_reason = 'Inactive session timeout',
    can_reconnect = true
  WHERE session_end IS NULL
    AND manual_keep_alive = false
    AND (now() - COALESCE(last_activity_at, session_start)) > v_inactive_threshold;

  -- 3. Permanently kill disconnected sessions after kill threshold
  UPDATE user_sessions
  SET 
    can_reconnect = false,
    disconnect_reason = COALESCE(disconnect_reason, 'Session timeout') || ' (permanently closed)'
  WHERE session_end IS NOT NULL
    AND can_reconnect = true
    AND (now() - session_end) > v_kill_threshold;

END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION close_inactive_sessions() TO authenticated;

-- Create function to update activity timestamp (called on user interaction)
CREATE OR REPLACE FUNCTION track_user_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET 
    last_activity_at = now(),
    manual_keep_alive = false
  WHERE user_id = auth.uid()
    AND session_end IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION track_user_activity() TO authenticated;
