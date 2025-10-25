/*
  # Add default quantity on add to products

  1. Changes
    - Add `default_quantity_on_add` column to `products` table
      - Type: integer
      - Default: 5
      - Constraint: must be one of [1, 3, 5, 7, 10]
    - Update existing products to have default value of 5

  2. Purpose
    - When adding product from price list, automatically set quantity to this value
    - Admin can configure per-product what default quantity should be used
*/

-- Add default_quantity_on_add column to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'default_quantity_on_add'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN default_quantity_on_add integer DEFAULT 5 CHECK (default_quantity_on_add IN (1, 3, 5, 7, 10));
  END IF;
END $$;

-- Update existing products to have default value of 5
UPDATE products SET default_quantity_on_add = 5 WHERE default_quantity_on_add IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.default_quantity_on_add IS 'Default quantity to add when product is selected from price list. Must be 1, 3, 5, 7, or 10.';