/*
  # Add user display preferences

  1. Changes
    - Add show_product_description column to users table
    - Add show_product_index column to users table
    - Set default values (both true for backward compatibility)
    
  2. Notes
    - These preferences control what is shown in the price list
    - Users can toggle these in their profile settings
*/

-- Add display preference columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_product_description'
  ) THEN
    ALTER TABLE users ADD COLUMN show_product_description boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_product_index'
  ) THEN
    ALTER TABLE users ADD COLUMN show_product_index boolean DEFAULT true;
  END IF;
END $$;