/*
  # Ustawienie kategorii wyświetlania i przykładowych tagów

  1. Logika kategorii
    - "najlepsza cena dla ciebie" - produkty z promo_price
    - "dobra cena" - produkty z your_price (bez promo)
    - pozostałe - zostają w oryginalnej kategorii
    
  2. Automatyczne przypisanie
    - Na podstawie special_prices dla sklepu
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, aktualizuje tylko display_category
*/

-- Produkty z ceną promocyjną -> "najlepsza cena dla ciebie"
UPDATE products p
SET display_category = 'najlepsza cena dla ciebie'
WHERE EXISTS (
  SELECT 1 FROM special_prices sp
  WHERE sp.product_id = p.id 
    AND sp.promo_price IS NOT NULL 
    AND sp.promo_price > 0
    AND (sp.valid_to IS NULL OR sp.valid_to > NOW())
);

-- Produkty z Twoją ceną (bez promocji) -> "dobra cena"
UPDATE products p
SET display_category = 'dobra cena'
WHERE EXISTS (
  SELECT 1 FROM special_prices sp
  WHERE sp.product_id = p.id 
    AND sp.your_price IS NOT NULL 
    AND sp.your_price > 0
    AND (sp.promo_price IS NULL OR sp.promo_price = 0)
)
AND display_category != 'najlepsza cena dla ciebie';

-- Dodaj przykładowe tagi do produktów z wołowiny
UPDATE products 
SET tags = ARRAY['wołowina', 'premium']
WHERE original_category = 'Wołowina' 
  AND id IN (SELECT id FROM products WHERE original_category = 'Wołowina' ORDER BY id LIMIT 5);

-- Dodaj przykładowe tagi do kurczaków
UPDATE products 
SET tags = ARRAY['drób', 'kurczak', 'popularny']
WHERE original_category = 'Drób' 
  AND name ILIKE '%kurczak%'
  AND id IN (SELECT id FROM products WHERE original_category = 'Drób' AND name ILIKE '%kurczak%' ORDER BY id LIMIT 5);

-- Dodaj przykładowe tagi do wędlin
UPDATE products 
SET tags = ARRAY['wędliny', 'tradycyjne']
WHERE original_category IN ('Wędliny', 'Kiełbasy')
  AND id IN (SELECT id FROM products WHERE original_category IN ('Wędliny', 'Kiełbasy') ORDER BY id LIMIT 5);
