/*
  # Naprawa funkcji close_inactive_sessions - usunięcie foreign key i zmiana typu

  1. Problem
    - Kolumna `disconnected_by` jest typu UUID z foreign key do users
    - Funkcja próbuje zapisać string 'system' zamiast UUID
    - To powoduje błąd: invalid input syntax for type uuid: "system"

  2. Rozwiązanie
    - Usuń foreign key constraint
    - Zmień typ kolumny `disconnected_by` z UUID na TEXT
    - Zaktualizuj funkcję aby działała poprawnie
*/

-- 1. Usuń foreign key constraint
ALTER TABLE user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_disconnected_by_fkey;

-- 2. Zmień typ kolumny disconnected_by z UUID na TEXT
ALTER TABLE user_sessions 
ALTER COLUMN disconnected_by TYPE text USING disconnected_by::text;

-- 3. Zaktualizuj komentarz do kolumny
COMMENT ON COLUMN user_sessions.disconnected_by IS
'ID użytkownika (UUID) który zakończył sesję lub "system" jeśli automatycznie';

-- 4. Odtwórz funkcję close_inactive_sessions z poprawioną logiką
DROP FUNCTION IF EXISTS close_inactive_sessions();

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
    COALESCE(session_inactive_disconnect_minutes, 30) as session_inactive_disconnect_minutes,
    COALESCE(session_max_duration_minutes, 720) as session_max_duration_minutes,
    COALESCE(session_disconnect_kill_minutes, 30) as session_disconnect_kill_minutes,
    COALESCE(session_settings_enabled, true) as session_settings_enabled
  INTO v_settings
  FROM system_settings
  LIMIT 1;

  -- If settings not found, use defaults
  IF v_settings IS NULL THEN
    v_inactive_threshold := INTERVAL '30 minutes';
    v_max_duration := INTERVAL '720 minutes';
    v_kill_threshold := INTERVAL '30 minutes';
  ELSIF v_settings.session_settings_enabled = FALSE THEN
    v_inactive_threshold := INTERVAL '30 minutes';
    v_max_duration := INTERVAL '720 minutes';
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
    AND COALESCE(manual_keep_alive, false) = false
    AND (now() - session_start) > v_max_duration;

  -- 2. Close sessions inactive beyond threshold
  UPDATE user_sessions
  SET 
    session_end = now(),
    disconnected_by = 'system',
    disconnect_reason = 'Inactive session timeout',
    can_reconnect = true
  WHERE session_end IS NULL
    AND COALESCE(manual_keep_alive, false) = false
    AND (now() - COALESCE(last_activity_at, session_start)) > v_inactive_threshold;

  -- 3. Permanently kill disconnected sessions after kill threshold
  UPDATE user_sessions
  SET 
    can_reconnect = false,
    disconnect_reason = COALESCE(disconnect_reason, 'Session timeout') || ' (permanently closed)'
  WHERE session_end IS NOT NULL
    AND COALESCE(can_reconnect, true) = true
    AND (now() - session_end) > v_kill_threshold;

END;
$$;

GRANT EXECUTE ON FUNCTION close_inactive_sessions() TO authenticated;