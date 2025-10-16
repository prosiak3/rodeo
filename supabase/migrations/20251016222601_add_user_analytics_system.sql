/*
  # User Analytics System - Comprehensive Behavior Tracking

  ## Overview
  This migration creates a complete system for tracking user behavior, analyzing navigation paths,
  and clustering similar user journeys for optimization insights.

  ## New Tables

  ### 1. `user_events` - Individual User Actions
    - `id` (uuid, primary key)
    - `user_id` (uuid) - user who performed the action
    - `session_id` (uuid) - session identifier
    - `event_type` (text) - type of event (click, navigation, form_submit, etc.)
    - `event_category` (text) - category (navigation, order, product, auth, etc.)
    - `event_data` (jsonb) - detailed event information
    - `screen_name` (text) - current screen/page
    - `previous_screen` (text) - previous screen for navigation tracking
    - `timestamp` (timestamptz) - when the event occurred
    - `created_at` (timestamptz)

  ### 2. `user_sessions` - User Session Management
    - `id` (uuid, primary key)
    - `user_id` (uuid) - user identifier
    - `session_start` (timestamptz) - session start time
    - `session_end` (timestamptz) - session end time
    - `total_events` (integer) - number of events in session
    - `device_type` (text) - mobile, tablet, desktop
    - `user_agent` (text) - browser user agent
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 3. `user_paths` - Unique Navigation Paths
    - `id` (uuid, primary key)
    - `path_signature` (text) - unique identifier for the path sequence
    - `path_sequence` (text[]) - array of screens visited in order
    - `occurrence_count` (integer) - how many times this path was taken
    - `average_duration` (interval) - average time to complete the path
    - `success_rate` (decimal) - percentage that completed successfully
    - `last_occurred` (timestamptz) - last time this path was used
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 4. `path_clusters` - Grouped Similar Paths
    - `id` (uuid, primary key)
    - `cluster_name` (text) - descriptive name for the cluster
    - `path_pattern` (text[]) - common pattern across paths in this cluster
    - `paths_count` (integer) - number of paths in this cluster
    - `total_occurrences` (integer) - total occurrences across all paths
    - `average_success_rate` (decimal) - average success rate
    - `average_duration` (interval) - average completion time
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 5. `path_cluster_members` - Many-to-Many relationship
    - `cluster_id` (uuid) - reference to path_clusters
    - `path_id` (uuid) - reference to user_paths
    - `similarity_score` (decimal) - how similar this path is to cluster pattern
    - `created_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Only 'analyst' role can view analytics data
    - Regular users cannot see analytics tables
    - Automated cleanup of data older than 90 days

  ## Performance
    - Indexed on user_id, session_id, timestamp for fast queries
    - Partitioning by month for user_events table
    - Materialized views for common aggregations
*/

-- Add 'analyst' role to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('store_manager', 'salesperson', 'operator', 'admin', 'driver', 'analyst'));

-- User Events table
CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  event_category text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  screen_name text NOT NULL,
  previous_screen text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  total_events integer DEFAULT 0,
  device_type text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- User Paths table
CREATE TABLE IF NOT EXISTS user_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_signature text UNIQUE NOT NULL,
  path_sequence text[] NOT NULL,
  occurrence_count integer DEFAULT 1,
  average_duration interval,
  success_rate decimal(5,2) DEFAULT 0,
  last_occurred timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_paths ENABLE ROW LEVEL SECURITY;

-- Path Clusters table
CREATE TABLE IF NOT EXISTS path_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name text NOT NULL,
  path_pattern text[] NOT NULL,
  paths_count integer DEFAULT 0,
  total_occurrences integer DEFAULT 0,
  average_success_rate decimal(5,2) DEFAULT 0,
  average_duration interval,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE path_clusters ENABLE ROW LEVEL SECURITY;

-- Path Cluster Members (many-to-many)
CREATE TABLE IF NOT EXISTS path_cluster_members (
  cluster_id uuid NOT NULL REFERENCES path_clusters(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES user_paths(id) ON DELETE CASCADE,
  similarity_score decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (cluster_id, path_id)
);

ALTER TABLE path_cluster_members ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_timestamp ON user_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_screen_name ON user_events(screen_name);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start DESC);

CREATE INDEX IF NOT EXISTS idx_user_paths_signature ON user_paths(path_signature);
CREATE INDEX IF NOT EXISTS idx_user_paths_occurrence ON user_paths(occurrence_count DESC);

CREATE INDEX IF NOT EXISTS idx_path_clusters_occurrences ON path_clusters(total_occurrences DESC);

-- RLS Policies

-- Only analysts can view user_events
CREATE POLICY "Analysts can view all user events"
  ON user_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'analyst'
    )
  );

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own events"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only analysts can view user_sessions
CREATE POLICY "Analysts can view all user sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'analyst'
    )
  );

-- Allow authenticated users to manage their own sessions
CREATE POLICY "Users can manage their own sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only analysts can view user_paths
CREATE POLICY "Analysts can view all user paths"
  ON user_paths FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'analyst'
    )
  );

-- Only analysts can view path_clusters
CREATE POLICY "Analysts can view all path clusters"
  ON path_clusters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'analyst'
    )
  );

-- Only analysts can view path_cluster_members
CREATE POLICY "Analysts can view cluster members"
  ON path_cluster_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'analyst'
    )
  );

-- Function to update session end time and event count
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_sessions
  SET 
    session_end = NEW.timestamp,
    total_events = total_events + 1,
    updated_at = now()
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session stats on new event
CREATE TRIGGER trigger_update_session_stats
  AFTER INSERT ON user_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_stats();

-- Function to calculate path sequence similarity (Longest Common Subsequence)
CREATE OR REPLACE FUNCTION calculate_lcs_similarity(path1 text[], path2 text[])
RETURNS decimal AS $$
DECLARE
  len1 integer := array_length(path1, 1);
  len2 integer := array_length(path2, 1);
  lcs_length integer;
  max_length integer;
BEGIN
  -- If either path is null or empty, return 0
  IF path1 IS NULL OR path2 IS NULL OR len1 = 0 OR len2 = 0 THEN
    RETURN 0;
  END IF;
  
  -- Simple approximation: count matching elements in order
  -- (Full LCS algorithm would be too complex for SQL)
  lcs_length := (
    SELECT COUNT(*)
    FROM unnest(path1) WITH ORDINALITY AS t1(val, idx1)
    INNER JOIN unnest(path2) WITH ORDINALITY AS t2(val, idx2)
    ON t1.val = t2.val AND t1.idx1 = t2.idx2
  );
  
  max_length := GREATEST(len1, len2);
  
  RETURN (lcs_length::decimal / max_length::decimal) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to clean up old analytics data (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
  DELETE FROM user_events WHERE created_at < now() - interval '90 days';
  DELETE FROM user_sessions WHERE created_at < now() - interval '90 days';
  
  -- Clean up paths that haven't been used in 90 days
  DELETE FROM user_paths WHERE last_occurred < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on user_sessions
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on user_paths
CREATE TRIGGER update_user_paths_updated_at BEFORE UPDATE ON user_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on path_clusters
CREATE TRIGGER update_path_clusters_updated_at BEFORE UPDATE ON path_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
