/*
  # Redukcja promocji do 2+2
  
  1. Zmiany
    - Usunięcie promocji -15% ze wszystkich produktów oprócz 2 wybranych
    - Usunięcie flagi promo_10_plus_1 ze wszystkich produktów oprócz 2 wybranych
  
  2. Produkty promocyjne (zostają):
    - **Promocja -15%:**
      - Kurczak: 9.99 → 8.49 (oszczędzasz 1.50)
      - Boczek świeży: 28.90 → 24.57 (oszczędzasz 4.33)
    
    - **Promocja 10+1:**
      - Karkówka extra Rytel: 18.49 / 1kg
      - Polędwiczki wp vac: 23.90 / 1kg
  
  3. Bezpieczeństwo
    - Zachowanie oryginalnych cen bazowych
    - Usunięcie tylko promo_price dla produktów bez promocji
*/

-- 1. Usuń promocje -15% ze wszystkich produktów OPRÓCZ Kurczak i Boczek świeży
UPDATE special_prices 
SET promo_price = NULL
WHERE product_id IN (
  SELECT p.id 
  FROM products p 
  WHERE p.name NOT IN ('Kurczak', 'Boczek świeży')
)
AND promo_price IS NOT NULL;

-- 2. Usuń flagę promo_10_plus_1 ze wszystkich produktów OPRÓCZ Karkówka extra Rytel i Polędwiczki wp vac
UPDATE products 
SET promo_10_plus_1 = false
WHERE name NOT IN ('Karkówka extra Rytel', 'Polędwiczki wp vac')
AND promo_10_plus_1 = true;
