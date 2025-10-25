/*
  # Add global default quantity system setting

  1. New Setting
    - Add `default_quantity_on_add` to system_settings table
      - Stores global default quantity for all products
      - Can be overridden per product
      - Options: 1, 3, 5, 7, 10
      - Default: 5

  2. Purpose
    - Admin can set global default quantity in System Settings
    - Individual products can override this value
*/

-- Add default_quantity_on_add column to system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'default_quantity_on_add'
  ) THEN
    ALTER TABLE system_settings 
    ADD COLUMN default_quantity_on_add integer DEFAULT 5 CHECK (default_quantity_on_add IN (1, 3, 5, 7, 10));
  END IF;
END $$;

-- Update existing system_settings record with default value
UPDATE system_settings SET default_quantity_on_add = 5 WHERE default_quantity_on_add IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN system_settings.default_quantity_on_add IS 'Globalna domyślna ilość produktu przy dodawaniu z cennika (1, 3, 5, 7, 10)';