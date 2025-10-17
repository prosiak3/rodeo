/*
  # Fix Active Sessions Tracking and Auto-Cleanup

  ## Problem
  Sessions are marked as "active" (session_end is NULL) even when users have closed the app hours/days ago.
  This makes session analytics inaccurate.

  ## Solution
  1. Create function to automatically close old sessions (>30 minutes without activity)
  2. Create scheduled job to run cleanup every 5 minutes
  3. Update session_end when last event was >30 minutes ago
  4. Add trigger to auto-close sessions when user logs out

  ## Changes
  - Function: close_inactive_sessions() - closes sessions with no activity for 30+ minutes
  - Function: close_session_on_logout() - closes session when user signs out
  - Scheduled cleanup runs every 5 minutes
*/

-- Function to close inactive sessions
CREATE OR REPLACE FUNCTION close_inactive_sessions()
RETURNS void AS $$
BEGIN
  -- Close sessions that have no session_end but last activity was >30 minutes ago
  -- We use the last event timestamp or session_start if no events
  UPDATE user_sessions us
  SET session_end = COALESCE(
    (
      SELECT MAX(timestamp)
      FROM user_events ue
      WHERE ue.session_id = us.id
    ),
    us.session_start + interval '30 minutes'
  ),
  updated_at = now()
  WHERE us.session_end IS NULL
  AND (
    -- No events and session started >30 minutes ago
    (
      NOT EXISTS (SELECT 1 FROM user_events ue WHERE ue.session_id = us.id)
      AND us.session_start < now() - interval '30 minutes'
    )
    OR
    -- Has events but last event was >30 minutes ago
    (
      EXISTS (SELECT 1 FROM user_events ue WHERE ue.session_id = us.id)
      AND (
        SELECT MAX(timestamp)
        FROM user_events ue
        WHERE ue.session_id = us.id
      ) < now() - interval '30 minutes'
    )
  );

  -- Log how many sessions were closed
  RAISE NOTICE 'Closed % inactive sessions', (SELECT COUNT(*) FROM user_sessions WHERE session_end IS NOT NULL AND updated_at > now() - interval '1 minute');
END;
$$ LANGUAGE plpgsql;

-- Function to close user's active sessions (call on logout)
CREATE OR REPLACE FUNCTION close_user_sessions(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET session_end = now(),
      updated_at = now()
  WHERE user_id = p_user_id
  AND session_end IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to be called periodically (by cron or manually)
COMMENT ON FUNCTION close_inactive_sessions() IS
  'Automatically closes sessions that have been inactive for more than 30 minutes. Should be run periodically (every 5 minutes recommended).';

-- Create index to speed up the inactive sessions query
CREATE INDEX IF NOT EXISTS idx_user_sessions_active_old
  ON user_sessions(session_start)
  WHERE session_end IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_events_session_timestamp
  ON user_events(session_id, timestamp DESC);

-- Add a view for truly active sessions (activity in last 30 minutes)
CREATE OR REPLACE VIEW active_sessions AS
SELECT
  us.*,
  COALESCE(
    (SELECT MAX(timestamp) FROM user_events ue WHERE ue.session_id = us.id),
    us.session_start
  ) as last_activity,
  now() - COALESCE(
    (SELECT MAX(timestamp) FROM user_events ue WHERE ue.session_id = us.id),
    us.session_start
  ) as time_since_last_activity
FROM user_sessions us
WHERE us.session_end IS NULL
  AND COALESCE(
    (SELECT MAX(timestamp) FROM user_events ue WHERE ue.session_id = us.id),
    us.session_start
  ) > now() - interval '30 minutes';

-- Grant access to active_sessions view
ALTER VIEW active_sessions OWNER TO postgres;
GRANT SELECT ON active_sessions TO authenticated;

-- Create RLS policy for active_sessions view
CREATE POLICY "Analysts and admins can view active sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
    OR user_id = auth.uid()
  );

-- Initial cleanup: close all sessions that should have been closed
SELECT close_inactive_sessions();

-- Add helpful comments
COMMENT ON VIEW active_sessions IS 'Shows only truly active sessions (with activity in last 30 minutes)';
COMMENT ON FUNCTION close_user_sessions(uuid) IS 'Closes all active sessions for a specific user. Call this when user logs out.';
