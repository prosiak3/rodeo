/*
  # Add Price List Display Preferences

  1. Changes
    - Add `show_sort_icons` column to users table (default true)
    - Add `show_price_layout_toggle` column to users table (default true)
  
  2. Notes
    - These preferences control visibility of sorting icons and price layout toggle in the price list view
    - Both default to true to maintain current behavior for existing users
*/

-- Add display preference columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_sort_icons'
  ) THEN
    ALTER TABLE users ADD COLUMN show_sort_icons boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_price_layout_toggle'
  ) THEN
    ALTER TABLE users ADD COLUMN show_price_layout_toggle boolean DEFAULT true;
  END IF;
END $$;