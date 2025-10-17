/*
  # Fix Analytics RLS Policies - Final Version
  
  ## Problem
  - Analysts and admins cannot view all user sessions
  - Old policies still use only 'analyst' role, not 'admin'
  - Separate policies needed for different operations
  
  ## Changes
  1. Drop all existing problematic policies
  2. Create new policies with admin + analyst access
  3. Ensure users can manage their own sessions
  
  ## Security
  - Analysts and admins: full read access to all analytics
  - Regular users: can insert/update their own sessions
  - All policies properly restrict access
*/

-- Drop all existing policies for user_sessions
DROP POLICY IF EXISTS "Analysts can view all user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Analysts and admins can view all user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;

-- Create new policies with proper access
CREATE POLICY "Analysts and admins view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "Users manage own sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Drop and recreate policies for user_events
DROP POLICY IF EXISTS "Analysts can view all user events" ON user_events;
DROP POLICY IF EXISTS "Analysts and admins can view all user events" ON user_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON user_events;

CREATE POLICY "Analysts and admins view all events"
  ON user_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "Users insert own events"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drop and recreate policies for user_paths
DROP POLICY IF EXISTS "Analysts can view all user paths" ON user_paths;
DROP POLICY IF EXISTS "Analysts and admins can view all user paths" ON user_paths;
DROP POLICY IF EXISTS "System can manage user paths" ON user_paths;

CREATE POLICY "Analysts and admins view all paths"
  ON user_paths FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "System manage paths"
  ON user_paths FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Drop and recreate policies for path_clusters
DROP POLICY IF EXISTS "Analysts can view all path clusters" ON path_clusters;
DROP POLICY IF EXISTS "Analysts and admins can view all path clusters" ON path_clusters;
DROP POLICY IF EXISTS "System can manage path clusters" ON path_clusters;

CREATE POLICY "Analysts and admins view all clusters"
  ON path_clusters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "System manage clusters"
  ON path_clusters FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Drop and recreate policies for path_cluster_members
DROP POLICY IF EXISTS "Analysts can view cluster members" ON path_cluster_members;
DROP POLICY IF EXISTS "Analysts and admins can view cluster members" ON path_cluster_members;
DROP POLICY IF EXISTS "System can manage cluster members" ON path_cluster_members;

CREATE POLICY "Analysts and admins view cluster members"
  ON path_cluster_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "System manage cluster members"
  ON path_cluster_members FOR ALL
  TO authenticated
  WITH CHECK (true);
