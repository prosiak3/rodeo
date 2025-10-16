/*
  # Add sort buttons preference to users table

  1. Changes
    - Add `show_sort_buttons` column to users table (default: false)
    - This allows users to enable/disable sort buttons in price list

  2. Security
    - Users can update their own preferences via existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_sort_buttons'
  ) THEN
    ALTER TABLE users ADD COLUMN show_sort_buttons boolean DEFAULT false;
  END IF;
END $$;
