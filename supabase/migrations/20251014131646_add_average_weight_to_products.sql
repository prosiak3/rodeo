/*
  # Add average weight to products for estimated pricing

  1. Overview
    - Add average_weight column to products table for items sold by piece
    - This enables estimated pricing when ordering by piece (szt)
    - Example: 1 schab ≈ 3.4 kg, so 2 szt × 3.4 kg × price/kg = estimated total
    
  2. Changes
    - Add `average_weight` column to products (nullable decimal)
    - Set realistic average weights for common products sold by piece
    - Products sold by kg don't need average_weight (will be null)
    
  3. Business Logic
    - When ordering by szt: quantity × average_weight × unit_price = estimated total
    - When ordering by kg: quantity × unit_price = actual total
    - Final invoice from warehouse will have actual weights (outside this system)
    
  4. Data Safety
    - Column is nullable - no data loss
    - Only adds functionality, doesn't change existing behavior
*/

-- Add average_weight column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS average_weight numeric(10,2) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN products.average_weight IS 'Average weight in kg for one piece - used for estimated pricing when selling by szt';

-- Set average weights for common meat products sold by piece
-- These are realistic average weights based on typical product sizes

-- Schaby (pork loins)
UPDATE products SET average_weight = 3.4 WHERE name ILIKE '%schab%' AND unit = 'szt';

-- Polędwice (tenderloins)
UPDATE products SET average_weight = 2.8 WHERE name ILIKE '%polędwica%' AND unit = 'szt';
UPDATE products SET average_weight = 2.5 WHERE name ILIKE '%polędwiczka%' AND unit = 'szt';

-- Boczki (bacon/pork belly)
UPDATE products SET average_weight = 1.5 WHERE name ILIKE '%boczek%' AND unit = 'szt';

-- Baleron (ham)
UPDATE products SET average_weight = 2.0 WHERE name ILIKE '%baleron%' AND unit = 'szt';

-- Karkówka (pork neck)
UPDATE products SET average_weight = 3.2 WHERE name ILIKE '%karkówka%' AND unit = 'szt';

-- Drób (poultry)
UPDATE products SET average_weight = 1.2 WHERE name ILIKE '%filet%' AND name ILIKE '%kurczak%' AND unit = 'szt';
UPDATE products SET average_weight = 5.0 WHERE name ILIKE '%korpus%' AND name ILIKE '%indyk%' AND unit = 'szt';

-- Łopatka (shoulder)
UPDATE products SET average_weight = 4.5 WHERE name ILIKE '%łopatka%' AND unit = 'szt';

-- Log the migration
INSERT INTO order_history (order_id, action, performed_by, details, created_at)
SELECT 
  (SELECT id FROM orders LIMIT 1),
  'system_migration',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  jsonb_build_object(
    'migration', 'add_average_weight_to_products',
    'description', 'Added average_weight column for estimated pricing'
  ),
  now()
WHERE EXISTS (SELECT 1 FROM orders LIMIT 1) AND EXISTS (SELECT 1 FROM users WHERE role = 'admin' LIMIT 1);
