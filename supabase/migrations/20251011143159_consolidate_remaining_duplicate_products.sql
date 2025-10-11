/*
  # Consolidate remaining duplicate products

  1. Changes
    - Merge order_items references to the most used product for each duplicate
    - Delete the less-used duplicate products
    - For Baleron: keep code S005 (oldest, 1 usage)
    - For Boczek surowy: keep code P005 (oldest, 3 usages) 
    - For Boczek wędzony: keep code B001 (oldest, 2 usages)
    
  2. Safety
    - Preserves all order history by updating references
    - Maintains data integrity
*/

-- Update order_items to point to the product we're keeping for Baleron
UPDATE order_items
SET product_id = '671474fb-161e-4d02-8003-ee688f55923a'
WHERE product_id = '4413ffd2-df63-4328-86a4-e6b0b25ed6a5';

-- Update order_items to point to the product we're keeping for Boczek surowy
UPDATE order_items
SET product_id = 'a3c278a2-5fe6-4e2a-8a82-89507cef455e'
WHERE product_id = 'ea6b7509-73cb-405f-b0b3-c166a010ac5c';

-- Update order_items to point to the product we're keeping for Boczek wędzony
UPDATE order_items
SET product_id = '3c01dc2e-fffa-4ce6-b737-528f6cc922fd'
WHERE product_id = '68698c1a-dce7-4964-be59-aaac377fa249';

-- Now delete the duplicate products
DELETE FROM products 
WHERE id IN (
  '4413ffd2-df63-4328-86a4-e6b0b25ed6a5',
  'ea6b7509-73cb-405f-b0b3-c166a010ac5c',
  '68698c1a-dce7-4964-be59-aaac377fa249'
);