/*
  # Fix product quantity step to minimum 1kg

  1. Changes
    - Update all products with quantity_step < 1 to have quantity_step = 1
    - Ensures no product can be ordered in increments smaller than 1kg
    
  2. Safety
    - Only updates products where quantity_step is less than 1
*/

UPDATE products
SET quantity_step = 1
WHERE quantity_step < 1;