/*
  # Add theme preference to users table

  1. Changes
    - Add `theme` column to users table to store selected theme
    - Default theme is 'amber' (current theme)
    - Available themes: amber, blue, green, red, purple

  2. Security
    - Users can update their own theme preference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'theme'
  ) THEN
    ALTER TABLE users ADD COLUMN theme text DEFAULT 'amber' CHECK (theme IN ('amber', 'blue', 'green', 'red', 'purple'));
  END IF;
END $$;
