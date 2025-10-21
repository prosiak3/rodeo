/*
  # Fix Database Errors and Missing Functions
  
  ## Overview
  This migration fixes several critical database issues causing errors in production:
  1. Missing or improperly configured session cleanup functions
  2. Overly restrictive RLS policies on ai_metrics table
  3. Missing user preference columns causing query failures
  
  ## Changes Made
  
  ### 1. Session Cleanup Functions
  - Ensure close_inactive_sessions() exists and is callable without parameters
  - Ensure close_user_sessions(uuid) exists and is properly configured
  - Add proper permissions for authenticated users to call these functions
  
  ### 2. AI Metrics RLS Policies
  - Update INSERT policy to allow all authenticated users (not just admins)
  - Keep SELECT restricted to analysts/admins only
  - Allow system operations from client-side code
  
  ### 3. User Preference Columns
  - Verify all user preference columns exist
  - Add any missing columns with sensible defaults
  - Ensure no queries will fail due to missing columns
  
  ## Security Notes
  - Session cleanup functions are safe for all authenticated users
  - AI metrics insertions are harmless (just logging)
  - User preferences are personal data protected by existing RLS
*/

-- ============================================================================
-- 1. SESSION CLEANUP FUNCTIONS
-- ============================================================================

-- Recreate close_inactive_sessions function (idempotent)
CREATE OR REPLACE FUNCTION close_inactive_sessions()
RETURNS void AS $$
BEGIN
  -- Close sessions that have no session_end but last activity was >30 minutes ago
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate close_user_sessions function (idempotent)
CREATE OR REPLACE FUNCTION close_user_sessions(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET session_end = now(),
      updated_at = now()
  WHERE user_id = p_user_id
  AND session_end IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION close_inactive_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION close_user_sessions(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION close_inactive_sessions() IS 
  'Closes sessions inactive for 30+ minutes. Safe for all authenticated users to call.';
COMMENT ON FUNCTION close_user_sessions(uuid) IS 
  'Closes all active sessions for a user. Typically called on logout.';

-- ============================================================================
-- 2. AI METRICS RLS POLICIES - FIX PERMISSION ISSUES
-- ============================================================================

-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "System can insert AI metrics" ON ai_metrics;

-- Create new policy that allows ALL authenticated users to insert metrics
CREATE POLICY "Authenticated users can insert AI metrics"
  ON ai_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure SELECT is still restricted to analysts/admins
DROP POLICY IF EXISTS "Admins and analysts can view all AI metrics" ON ai_metrics;

CREATE POLICY "Admins and analysts can view all AI metrics"
  ON ai_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst', 'operator')
    )
  );

-- ============================================================================
-- 3. ENSURE ALL USER PREFERENCE COLUMNS EXIST
-- ============================================================================

-- Add show_delete_icons if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_delete_icons'
  ) THEN
    ALTER TABLE users ADD COLUMN show_delete_icons boolean DEFAULT false;
    COMMENT ON COLUMN users.show_delete_icons IS 
      'Whether to show delete icons instead of long-press to delete';
  END IF;
END $$;

-- Add order_details_status_expanded if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'order_details_status_expanded'
  ) THEN
    ALTER TABLE users ADD COLUMN order_details_status_expanded boolean DEFAULT true;
    COMMENT ON COLUMN users.order_details_status_expanded IS 
      'Whether the status section in order details is expanded by default';
  END IF;
END $$;

-- Add show_notebook_button_labels if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_notebook_button_labels'
  ) THEN
    ALTER TABLE users ADD COLUMN show_notebook_button_labels boolean DEFAULT true;
    COMMENT ON COLUMN users.show_notebook_button_labels IS 
      'Whether to show text labels on notebook mode buttons';
  END IF;
END $$;

-- Add show_sort_buttons if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_sort_buttons'
  ) THEN
    ALTER TABLE users ADD COLUMN show_sort_buttons boolean DEFAULT true;
    COMMENT ON COLUMN users.show_sort_buttons IS 
      'Whether to show sort buttons in order list';
  END IF;
END $$;

-- Add auto_logout_enabled if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auto_logout_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN auto_logout_enabled boolean DEFAULT true;
    COMMENT ON COLUMN users.auto_logout_enabled IS 
      'Whether automatic logout after inactivity is enabled';
  END IF;
END $$;

-- Add ui_theme if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ui_theme'
  ) THEN
    ALTER TABLE users ADD COLUMN ui_theme text;
    COMMENT ON COLUMN users.ui_theme IS 
      'UI theme preference: glassmorphism, minimalist, colorful, corporate, dark-neon, material, fluent';
  END IF;
END $$;

-- ============================================================================
-- 4. VERIFY CRITICAL TABLES EXIST
-- ============================================================================

-- Ensure user_sessions table exists (should already exist)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  device_info jsonb DEFAULT '{}',
  browser_info jsonb DEFAULT '{}',
  interaction_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure user_events table exists (should already exist)
CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. CREATE DATABASE HEALTH CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE (
  component text,
  status text,
  details text
) AS $$
BEGIN
  -- Check if close_inactive_sessions exists
  RETURN QUERY
  SELECT 
    'close_inactive_sessions'::text as component,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'close_inactive_sessions'
    ) THEN 'OK'::text ELSE 'MISSING'::text END as status,
    'Session cleanup function'::text as details;
  
  -- Check if close_user_sessions exists
  RETURN QUERY
  SELECT 
    'close_user_sessions'::text as component,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'close_user_sessions'
    ) THEN 'OK'::text ELSE 'MISSING'::text END as status,
    'User logout session cleanup'::text as details;
  
  -- Check if ai_metrics table exists
  RETURN QUERY
  SELECT 
    'ai_metrics'::text as component,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_metrics'
    ) THEN 'OK'::text ELSE 'MISSING'::text END as status,
    'AI metrics tracking table'::text as details;
  
  -- Check if user preference columns exist
  RETURN QUERY
  SELECT 
    'user_preferences'::text as component,
    CASE WHEN (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('show_delete_icons', 'auto_logout_enabled', 'ui_theme')
    ) = 3 THEN 'OK'::text ELSE 'INCOMPLETE'::text END as status,
    'User preference columns'::text as details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_database_health() TO authenticated;

COMMENT ON FUNCTION check_database_health() IS 
  'Returns status of critical database components. Use to verify system health.';

-- ============================================================================
-- 6. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for user_sessions cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_active_cleanup
  ON user_sessions(session_start)
  WHERE session_end IS NULL;

-- Index for user_events timestamp queries
CREATE INDEX IF NOT EXISTS idx_user_events_session_timestamp
  ON user_events(session_id, timestamp DESC);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Run health check to verify everything is working
DO $$
DECLARE
  health_record RECORD;
  all_ok BOOLEAN := true;
BEGIN
  FOR health_record IN SELECT * FROM check_database_health() LOOP
    RAISE NOTICE 'Component: %, Status: %, Details: %', 
      health_record.component, health_record.status, health_record.details;
    
    IF health_record.status != 'OK' THEN
      all_ok := false;
    END IF;
  END LOOP;
  
  IF all_ok THEN
    RAISE NOTICE '✅ All database components are healthy!';
  ELSE
    RAISE WARNING '⚠️ Some database components need attention';
  END IF;
END $$;
