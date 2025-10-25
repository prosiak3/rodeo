/*
  # Session Timeout Configuration System

  1. Changes to system_settings table
    - Add `session_inactive_warning_minutes` - Time of inactivity before warning (minutes)
    - Add `session_inactive_disconnect_minutes` - Time of inactivity before disconnect (minutes)
    - Add `session_disconnect_kill_minutes` - Time after disconnect before final kill (minutes)
    - Add `session_max_duration_minutes` - Maximum session duration even if active (minutes)
    - Add `session_settings_enabled` - Whether custom session settings are enabled

  2. Default Values
    - Inactive warning: 5 minutes
    - Inactive disconnect: 15 minutes
    - Disconnect kill: 30 minutes
    - Max duration: 480 minutes (8 hours)
    - Settings enabled: true

  3. Security
    - Only admins can modify these settings via existing RLS policies
*/

-- Add session timeout columns to system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'session_inactive_warning_minutes'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN session_inactive_warning_minutes integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'session_inactive_disconnect_minutes'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN session_inactive_disconnect_minutes integer DEFAULT 15;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'session_disconnect_kill_minutes'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN session_disconnect_kill_minutes integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'session_max_duration_minutes'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN session_max_duration_minutes integer DEFAULT 480;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'session_settings_enabled'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN session_settings_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add columns for tracking session activity in user_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN last_activity_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'warned_at'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN warned_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'manual_keep_alive'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN manual_keep_alive boolean DEFAULT false;
  END IF;
END $$;

-- Update existing settings row with default values
UPDATE system_settings
SET 
  session_inactive_warning_minutes = COALESCE(session_inactive_warning_minutes, 5),
  session_inactive_disconnect_minutes = COALESCE(session_inactive_disconnect_minutes, 15),
  session_disconnect_kill_minutes = COALESCE(session_disconnect_kill_minutes, 30),
  session_max_duration_minutes = COALESCE(session_max_duration_minutes, 480),
  session_settings_enabled = COALESCE(session_settings_enabled, true);

-- Create function to update last activity timestamp
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET last_activity_at = now(),
      warned_at = NULL
  WHERE user_id = auth.uid()
    AND session_end IS NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_session_activity() TO authenticated;

-- Create function to manually keep session alive
CREATE OR REPLACE FUNCTION keep_session_alive()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET manual_keep_alive = true,
      last_activity_at = now(),
      warned_at = NULL
  WHERE user_id = auth.uid()
    AND session_end IS NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION keep_session_alive() TO authenticated;

-- Create index for efficient session cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity 
  ON user_sessions(last_activity_at, session_end) 
  WHERE session_end IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_sessions_warned 
  ON user_sessions(warned_at, session_end) 
  WHERE session_end IS NULL;
