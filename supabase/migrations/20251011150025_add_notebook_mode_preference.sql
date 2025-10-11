/*
  # Add notebook mode preference

  1. Changes
    - Add notebook_mode column to users table
    - 'single' = add to one notebook (old behavior)
    - 'multiple' = create new notebook each time (new default)
    
  2. Details
    - Default is 'multiple' for new behavior
    - Users can change this in their profile settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'notebook_mode'
  ) THEN
    ALTER TABLE users ADD COLUMN notebook_mode text DEFAULT 'multiple' CHECK (notebook_mode IN ('single', 'multiple'));
  END IF;
END $$;