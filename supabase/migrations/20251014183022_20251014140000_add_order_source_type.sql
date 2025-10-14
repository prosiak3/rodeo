/*
  # Add source_type to orders table

  1. Changes
    - Add `source_type` column to orders table
      - Values: 'price_list', 'manual', 'voice', 'copy'
      - Determines whether prices should be displayed in UI
      - Default: 'manual' for existing orders

  2. Notes
    - Orders from price list and copied orders have full price calculations
    - Manual and voice orders contain only quantities and units (no price display)
    - Prices may still be stored in database for all order types
*/

-- Add source_type column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN source_type text DEFAULT 'manual'
      CHECK (source_type IN ('price_list', 'manual', 'voice', 'copy'));
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_source_type ON orders(source_type);

-- Update existing orders based on their notes/context
UPDATE orders
SET source_type = 'price_list'
WHERE notes LIKE '%cennika%' OR notes LIKE '%price_list%';

UPDATE orders
SET source_type = 'voice'
WHERE voice_transcript IS NOT NULL AND voice_transcript != '';
