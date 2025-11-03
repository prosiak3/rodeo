/*
  # App Version Management System

  1. New Tables
    - `app_versions`
      - `id` (uuid, primary key)
      - `version` (text, unique) - Semantic version number (e.g., "1.2.3")
      - `build_number` (integer) - Incremental build number
      - `release_date` (timestamptz) - When this version was released
      - `changelog` (jsonb) - Array of changes with categories
      - `is_critical` (boolean) - Whether this update cannot be postponed
      - `min_required_version` (text) - Minimum version that can update to this
      - `assets_hash` (text) - Hash of assets for cache busting
      - `is_active` (boolean) - Whether this is the current production version
      - `created_at` (timestamptz)
      - `created_by` (uuid) - Admin who published this version

    - `user_update_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `from_version` (text) - Previous version
      - `to_version` (text) - New version
      - `update_type` (text) - 'auto_on_startup', 'periodic_auto', 'user_accepted', 'forced'
      - `update_status` (text) - 'started', 'downloading', 'installing', 'completed', 'failed'
      - `postponed_count` (integer) - How many times user postponed this update
      - `device_info` (text) - Device and browser information
      - `connection_type` (text) - Network connection type
      - `error_message` (text) - Error details if update failed
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `user_update_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users, unique)
      - `auto_update_enabled` (boolean) - Whether to auto-update on startup
      - `periodic_check_enabled` (boolean) - Whether to check every 15 minutes
      - `postponed_version` (text) - Version user postponed
      - `postponed_until` (timestamptz) - When to remind about postponed update
      - `postpone_count` (integer) - Total times user postponed updates
      - `last_check_at` (timestamptz) - Last time we checked for updates
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin-only write access to app_versions
    - Users can read current app_versions
    - Users can insert their own update logs
    - Users can read/update their own preferences

  3. Functions
    - get_latest_version() - Returns the latest active version
    - check_for_updates(current_version) - Checks if update is available
*/

-- Create app_versions table
CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text UNIQUE NOT NULL,
  build_number integer NOT NULL,
  release_date timestamptz DEFAULT now(),
  changelog jsonb DEFAULT '[]'::jsonb,
  is_critical boolean DEFAULT false,
  min_required_version text,
  assets_hash text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Create user_update_logs table
CREATE TABLE IF NOT EXISTS user_update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  from_version text,
  to_version text NOT NULL,
  update_type text NOT NULL CHECK (update_type IN ('auto_on_startup', 'periodic_auto', 'user_accepted', 'forced')),
  update_status text NOT NULL DEFAULT 'started' CHECK (update_status IN ('started', 'downloading', 'installing', 'completed', 'failed')),
  postponed_count integer DEFAULT 0,
  device_info text,
  connection_type text,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_update_preferences table
CREATE TABLE IF NOT EXISTS user_update_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  auto_update_enabled boolean DEFAULT true,
  periodic_check_enabled boolean DEFAULT true,
  postponed_version text,
  postponed_until timestamptz,
  postpone_count integer DEFAULT 0,
  last_check_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_update_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_versions
CREATE POLICY "Anyone can read active app versions"
  ON app_versions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage app versions"
  ON app_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for user_update_logs
CREATE POLICY "Users can read own update logs"
  ON user_update_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own update logs"
  ON user_update_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin and analysts can read all update logs"
  ON user_update_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

-- RLS Policies for user_update_preferences
CREATE POLICY "Users can read own update preferences"
  ON user_update_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own update preferences"
  ON user_update_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own update preferences"
  ON user_update_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_versions_active ON app_versions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_app_versions_version ON app_versions(version);
CREATE INDEX IF NOT EXISTS idx_user_update_logs_user ON user_update_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_update_logs_status ON user_update_logs(update_status);
CREATE INDEX IF NOT EXISTS idx_user_update_preferences_user ON user_update_preferences(user_id);

-- Function to get latest version
CREATE OR REPLACE FUNCTION get_latest_version()
RETURNS TABLE (
  version text,
  build_number integer,
  release_date timestamptz,
  changelog jsonb,
  is_critical boolean,
  assets_hash text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    av.version,
    av.build_number,
    av.release_date,
    av.changelog,
    av.is_critical,
    av.assets_hash
  FROM app_versions av
  WHERE av.is_active = true
  ORDER BY av.build_number DESC
  LIMIT 1;
END;
$$;

-- Function to check for updates
CREATE OR REPLACE FUNCTION check_for_updates(current_version text, current_build integer)
RETURNS TABLE (
  has_update boolean,
  latest_version text,
  build_number integer,
  release_date timestamptz,
  changelog jsonb,
  is_critical boolean,
  assets_hash text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  latest_build integer;
BEGIN
  SELECT av.build_number INTO latest_build
  FROM app_versions av
  WHERE av.is_active = true
  ORDER BY av.build_number DESC
  LIMIT 1;

  RETURN QUERY
  SELECT
    (latest_build > current_build) as has_update,
    av.version,
    av.build_number,
    av.release_date,
    av.changelog,
    av.is_critical,
    av.assets_hash
  FROM app_versions av
  WHERE av.is_active = true
  ORDER BY av.build_number DESC
  LIMIT 1;
END;
$$;

-- Insert initial version
INSERT INTO app_versions (
  version,
  build_number,
  release_date,
  changelog,
  is_critical,
  is_active,
  assets_hash,
  created_by
) VALUES (
  '1.0.0',
  1,
  now(),
  '[
    {"category": "Features", "items": ["Initial release", "Order management system", "Price lists", "Voice ordering", "Analytics dashboard"]},
    {"category": "UI", "items": ["Modern responsive design", "Dark mode support", "Mobile-first interface"]},
    {"category": "Performance", "items": ["PWA support", "Offline functionality", "Fast loading times"]}
  ]'::jsonb,
  false,
  true,
  md5(random()::text),
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);