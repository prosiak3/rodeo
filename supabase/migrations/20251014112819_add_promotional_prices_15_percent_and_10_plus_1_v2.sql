/*
  # Dodaj ceny promocyjne -15% i promocje 10+1
  
  1. Zmiany
    - Dodanie cen promocyjnych -15% dla 10 losowych produktów
    - Dodanie promocji "10+1" dla 5 różnych produktów
    - Promocje ważne przez 30 dni od dzisiaj
  
  2. Szczegóły
    - Promocja -15%: your_price = cena bazowa, promo_price = cena bazowa - 15%
    - Promocja 10+1: nowy produkt z nazwą "... 10+1" i ceną = 10 * cena_bazowa + 0.01 PLN
    - Wszystkie promocje są widoczne w cennikach sklepów
    
  3. Przykłady
    - Schab 20 PLN → promo_price 17.00 PLN (-15%)
    - Kiełbasa 15 PLN → produkt "Kiełbasa 10+1" za 150.01 PLN (11 sztuk)
*/

-- 1. Dodaj ceny promocyjne -15% dla 10 losowych produktów
WITH random_products AS (
  SELECT id, base_price
  FROM products
  WHERE active = true
  AND name NOT LIKE '%10+1%'
  ORDER BY RANDOM()
  LIMIT 10
),
all_stores AS (
  SELECT id FROM stores
)
INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
SELECT 
  s.id,
  p.id,
  p.base_price as your_price,
  ROUND(p.base_price * 0.85, 2) as promo_price,
  NOW() as valid_from,
  NOW() + INTERVAL '30 days' as valid_to
FROM random_products p
CROSS JOIN all_stores s;

-- 2. Dodaj promocje 10+1 dla 5 różnych produktów
-- Najpierw dodajemy nowe produkty z sufiksem "10+1"
WITH promo_products AS (
  SELECT 
    id, 
    name, 
    index, 
    base_price, 
    original_category, 
    display_category, 
    unit, 
    quantity_step, 
    code
  FROM products
  WHERE active = true
  AND name NOT LIKE '%10+1%'
  AND id NOT IN (
    SELECT p2.id 
    FROM products p2 
    INNER JOIN products p3 ON p3.name = p2.name || ' 10+1'
  )
  ORDER BY RANDOM()
  LIMIT 5
),
new_promo_products AS (
  INSERT INTO products (
    name, 
    index, 
    base_price, 
    original_category, 
    display_category, 
    unit, 
    quantity_step, 
    min_quantity,
    code, 
    active, 
    created_at
  )
  SELECT 
    name || ' 10+1' as name,
    index || '-PROMO' as index,
    ROUND(base_price * 10 + 0.01, 2) as base_price,
    original_category,
    display_category,
    'opakowanie' as unit,
    1 as quantity_step,
    1 as min_quantity,
    code || '-10+1' as code,
    true as active,
    NOW() as created_at
  FROM promo_products
  RETURNING id, base_price
),
all_stores AS (
  SELECT id FROM stores
)
INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
SELECT 
  s.id,
  p.id,
  p.base_price as your_price,
  p.base_price as promo_price,
  NOW() as valid_from,
  NOW() + INTERVAL '30 days' as valid_to
FROM new_promo_products p
CROSS JOIN all_stores s;
