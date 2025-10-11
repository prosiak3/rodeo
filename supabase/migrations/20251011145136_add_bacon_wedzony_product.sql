/*
  # Add smoked bacon product

  1. New Product
    - Boczek wędzony (code B004 since B002 is taken)
    
  2. Details
    - Category: Wieprzowina
    - Standard pricing, unit: kg
*/

INSERT INTO products (
  code,
  name,
  original_category,
  display_category,
  unit,
  base_price,
  description,
  index,
  min_quantity,
  quantity_step,
  active
) VALUES
  (
    'B004',
    'Boczek wędzony',
    'Wieprzowina',
    'Wieprzowina',
    'kg',
    36.99,
    'Tradycyjnie wędzony boczek',
    '5901234500004',
    1,
    0.5,
    true
  )
ON CONFLICT (code) DO NOTHING;