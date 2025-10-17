/*
  # Add Device and Browser Information to User Sessions

  1. Changes to user_sessions table
    - Add device_type (text) - 'mobile', 'tablet', 'desktop', 'unknown'
    - Add os_name (text) - Operating system name
    - Add os_version (text) - Operating system version
    - Add browser_name (text) - Browser name
    - Add browser_version (text) - Browser version
    - Add device_vendor (text) - Device manufacturer
    - Add device_model (text) - Device model
    - Add is_pwa (boolean) - Whether app is running as PWA
    - Add screen_resolution (text) - Screen resolution
    - Add user_agent (text) - Full user agent string

  2. New Views
    - Create view for store login rankings
    - Create view for user login rankings

  3. Notes
    - Existing sessions will have NULL values for new fields
    - New sessions will be populated by frontend tracking
*/

-- Add new columns to user_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN device_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'os_name'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN os_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'os_version'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN os_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'browser_name'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN browser_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'browser_version'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN browser_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'device_vendor'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN device_vendor text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'device_model'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN device_model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'is_pwa'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN is_pwa boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'screen_resolution'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN screen_resolution text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN user_agent text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_type ON user_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_os_name ON user_sessions(os_name);
CREATE INDEX IF NOT EXISTS idx_user_sessions_browser_name ON user_sessions(browser_name);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_pwa ON user_sessions(is_pwa);

-- Create view for store login rankings
CREATE OR REPLACE VIEW store_login_rankings AS
SELECT 
  s.id as store_id,
  s.name as store_name,
  s.address,
  COUNT(DISTINCT us.id) as total_sessions,
  COUNT(DISTINCT us.user_id) as unique_users,
  COUNT(DISTINCT DATE(us.session_start)) as active_days,
  MAX(us.session_start) as last_login,
  MIN(us.session_start) as first_login
FROM stores s
LEFT JOIN users u ON u.store_id = s.id
LEFT JOIN user_sessions us ON us.user_id = u.id
WHERE u.role != 'analyst' OR u.role IS NULL
GROUP BY s.id, s.name, s.address
ORDER BY total_sessions DESC;

-- Create view for user login rankings
CREATE OR REPLACE VIEW user_login_rankings AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.role,
  s.name as store_name,
  s.address as store_address,
  COUNT(us.id) as total_sessions,
  COUNT(DISTINCT DATE(us.session_start)) as active_days,
  MAX(us.session_start) as last_login,
  MIN(us.session_start) as first_login,
  AVG(EXTRACT(EPOCH FROM (us.session_end - us.session_start))) as avg_session_duration_seconds
FROM users u
LEFT JOIN stores s ON u.store_id = s.id
LEFT JOIN user_sessions us ON us.user_id = u.id
WHERE u.role != 'analyst'
GROUP BY u.id, u.full_name, u.role, s.name, s.address
ORDER BY total_sessions DESC;