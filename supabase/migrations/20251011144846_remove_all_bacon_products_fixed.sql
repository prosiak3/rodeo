/*
  # Remove all bacon products from database

  1. Changes
    - Remove all products with "boczek" in the name
    - Remove related order_items first to prevent constraint violations
    
  2. Safety
    - Deletes order_items that reference bacon products
    - Then deletes the bacon products themselves
*/

-- First, delete order_items that reference bacon products
DELETE FROM order_items
WHERE product_id IN (
  SELECT id FROM products WHERE name ILIKE '%boczek%' OR name ILIKE '%bacon%'
);

-- Now delete all bacon products
DELETE FROM products 
WHERE name ILIKE '%boczek%' OR name ILIKE '%bacon%';