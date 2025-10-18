/*
  # Add Auto-Logout Location Tracking

  1. Changes
    - Add `last_app_location` (jsonb) - stores last known app location/state
    - Add `last_location_timestamp` (timestamptz) - when location was last saved
    - Add `after_auto_logout_return_to` (text) - where to redirect after auto-logout
      Options: 'home' (default), 'last_location'
  
  2. Purpose
    - Track user's last location in the app
    - Allow restoration of state after auto-logout
    - Configurable return behavior per user
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_app_location'
  ) THEN
    ALTER TABLE users ADD COLUMN last_app_location jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_location_timestamp'
  ) THEN
    ALTER TABLE users ADD COLUMN last_location_timestamp timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'after_auto_logout_return_to'
  ) THEN
    ALTER TABLE users ADD COLUMN after_auto_logout_return_to text DEFAULT 'home';
  END IF;
END $$;
