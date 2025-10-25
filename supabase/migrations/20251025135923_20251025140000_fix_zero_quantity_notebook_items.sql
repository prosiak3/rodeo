/*
  # Fix order items with zero quantity in notebook orders

  1. Changes
    - Updates all existing order_items where quantity is 0
    - Sets quantity to product default_quantity_on_add (or min_quantity as fallback)
    - Recalculates total_price based on new quantity
    - Only affects items in notatnik status orders
  
  2. Purpose
    - Fixes historical data from before default quantity feature was implemented
    - Ensures all notebook items have sensible starting quantities
    - Maintains data consistency
  
  3. Note
    - This migration is idempotent and safe to run multiple times
    - Uses GREATEST to ensure minimum quantity of 1
*/

-- Update any remaining order items with zero quantity
UPDATE order_items
SET 
  quantity = COALESCE(
    CASE 
      WHEN p.default_quantity_on_add > 0 THEN p.default_quantity_on_add
      ELSE GREATEST(p.min_quantity, 1)
    END,
    1
  ),
  total_price = order_items.unit_price * COALESCE(
    CASE 
      WHEN p.default_quantity_on_add > 0 THEN p.default_quantity_on_add
      ELSE GREATEST(p.min_quantity, 1)
    END,
    1
  )
FROM products p, orders o
WHERE order_items.product_id = p.id
  AND order_items.order_id = o.id
  AND order_items.quantity = 0
  AND o.status = 'notatnik';
