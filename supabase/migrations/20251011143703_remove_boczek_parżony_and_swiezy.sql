/*
  # Remove unwanted bacon products

  1. Changes
    - Remove 'Boczek parżony' product
    - Remove 'Boczek świeży' product
    
  2. Safety
    - Only removes if not used in existing orders
*/

-- Delete the products only if they're not used in orders
DELETE FROM products 
WHERE id IN ('e331dd6e-b0ba-4be3-bddc-7013dc9a3bc9', 'b4b875fd-2b2c-4bbf-9f9e-79eca737e81a')
  AND NOT EXISTS (
    SELECT 1 FROM order_items WHERE product_id IN ('e331dd6e-b0ba-4be3-bddc-7013dc9a3bc9', 'b4b875fd-2b2c-4bbf-9f9e-79eca737e81a')
  );