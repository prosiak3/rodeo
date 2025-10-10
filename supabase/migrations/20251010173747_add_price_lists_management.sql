/*
  # Add Price Lists Management System

  ## Overview
  This migration adds support for multiple price lists that can be managed by the wholesale/admin.
  Each price list can be activated or deactivated, allowing flexible pricing management.

  ## Changes
  
  1. New Tables
    - `price_lists`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the price list (e.g., "Cennik Zimowy 2024")
      - `description` (text) - Optional description
      - `is_active` (boolean) - Whether this price list is currently active
      - `valid_from` (timestamptz) - When this price list becomes valid
      - `valid_to` (timestamptz) - When this price list expires (optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modified Tables
    - Add `price_list_id` to `products` table to link products to specific price lists
    - Keep `base_price` as fallback for products without specific price list

  3. Security
    - Enable RLS on `price_lists` table
    - Only authenticated users can view price lists
    - Only admin/operator roles can create/update price lists

  ## Notes
  - Only ONE price list can be active at a time
  - When a price list is activated, all others are automatically deactivated
  - Products without a price_list_id use the base_price
*/

-- Create price_lists table
CREATE TABLE IF NOT EXISTS price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  valid_from timestamptz DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add price_list_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price_list_id'
  ) THEN
    ALTER TABLE products ADD COLUMN price_list_id uuid REFERENCES price_lists(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_lists
CREATE POLICY "Anyone authenticated can view price lists"
  ON price_lists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin/operator can insert price lists"
  ON price_lists FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Only admin/operator can update price lists"
  ON price_lists FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Only admin/operator can delete price lists"
  ON price_lists FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

-- Function to ensure only one active price list
CREATE OR REPLACE FUNCTION ensure_single_active_price_list()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE price_lists
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single active price list
DROP TRIGGER IF EXISTS ensure_single_active_price_list_trigger ON price_lists;
CREATE TRIGGER ensure_single_active_price_list_trigger
  BEFORE INSERT OR UPDATE ON price_lists
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_price_list();

-- Insert default price list
INSERT INTO price_lists (name, description, is_active)
VALUES ('Cennik Standardowy', 'Podstawowy cennik produktów', true)
ON CONFLICT DO NOTHING;
