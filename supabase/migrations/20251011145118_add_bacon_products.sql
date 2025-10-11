/*
  # Add bacon products to the catalog

  1. New Products
    - Boczek surowy
    - Boczek wędzony
    - Boczek z żeberkami surowy
    
  2. Details
    - All products in Wieprzowina category
    - Standard pricing, unit: kg
    - Minimum quantity: 1 kg, step: 0.5 kg
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
    'B001',
    'Boczek surowy',
    'Wieprzowina',
    'Wieprzowina',
    'kg',
    32.99,
    'Świeży boczek surowy',
    '5901234500001',
    1,
    0.5,
    true
  ),
  (
    'B002',
    'Boczek wędzony',
    'Wieprzowina',
    'Wieprzowina',
    'kg',
    36.99,
    'Tradycyjnie wędzony boczek',
    '5901234500002',
    1,
    0.5,
    true
  ),
  (
    'B003',
    'Boczek z żeberkami surowy',
    'Wieprzowina',
    'Wieprzowina',
    'kg',
    34.99,
    'Świeży boczek z żeberkami',
    '5901234500003',
    1,
    0.5,
    true
  )
ON CONFLICT (code) DO NOTHING;