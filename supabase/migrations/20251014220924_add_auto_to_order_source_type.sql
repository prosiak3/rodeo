/*
  # Add 'auto' to order source type

  1. Changes
    - Update the source_type column check constraint to include 'auto' value
    - This allows orders to be marked as automatically generated

  2. Notes
    - Non-destructive change
    - Existing data remains valid
*/

-- Drop existing constraint if exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_type_check;

-- Add new constraint with 'auto' included
ALTER TABLE orders ADD CONSTRAINT orders_source_type_check 
  CHECK (source_type IN ('price_list', 'manual', 'voice', 'copy', 'auto'));
