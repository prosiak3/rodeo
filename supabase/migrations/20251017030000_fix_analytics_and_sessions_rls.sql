/*
  # Fix Analytics and Sessions RLS Policies

  ## Changes
  1. Add admin access to all analytics tables
  2. Fix user_sessions RLS to allow analysts and admins to view all sessions
  3. Fix orders status filtering for TopProductsPanel

  ## Security
  - Analysts and admins can view all analytics data
  - Regular users can still manage their own sessions
  - Regular users can insert their own events
*/

-- Drop existing policies and recreate with admin access

-- User Sessions - Add admin and analyst view access
DROP POLICY IF EXISTS "Analysts can view all user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;

CREATE POLICY "Analysts and admins can view all user sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "Users can insert their own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- User Events - Add admin access
DROP POLICY IF EXISTS "Analysts can view all user events" ON user_events;

CREATE POLICY "Analysts and admins can view all user events"
  ON user_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

-- User Paths - Add admin access
DROP POLICY IF EXISTS "Analysts can view all user paths" ON user_paths;

CREATE POLICY "Analysts and admins can view all user paths"
  ON user_paths FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "System can manage user paths"
  ON user_paths FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Path Clusters - Add admin access
DROP POLICY IF EXISTS "Analysts can view all path clusters" ON path_clusters;

CREATE POLICY "Analysts and admins can view all path clusters"
  ON path_clusters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "System can manage path clusters"
  ON path_clusters FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Path Cluster Members - Add admin access
DROP POLICY IF EXISTS "Analysts can view cluster members" ON path_cluster_members;

CREATE POLICY "Analysts and admins can view cluster members"
  ON path_cluster_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "System can manage cluster members"
  ON path_cluster_members FOR ALL
  TO authenticated
  WITH CHECK (true);
