/*
  # Dodanie kodów kreskowych do produktów bez nich

  1. Aktualizacja
    - Dodanie kolumny index (kod kreskowy) do produktów które jej nie mają
    - Generowanie unikalnych kodów dla kategorii: Boczki, Jagnięcina, Dziczyzna, Pasztety, Szynki
    
  2. Format kodu kreskowego
    - 13 cyfr w formacie EAN-13
    - Każda kategoria ma swój prefiks
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, aktualizuje tylko produkty bez kodu
*/

-- Boczki (prefix 501)
WITH numbered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM products 
  WHERE category = 'Boczki' AND (index IS NULL OR index = '')
)
UPDATE products p
SET index = '501' || LPAD(np.rn::text, 10, '0')
FROM numbered_products np
WHERE p.id = np.id;

-- Jagnięcina (prefix 502)
WITH numbered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM products 
  WHERE category = 'Jagnięcina' AND (index IS NULL OR index = '')
)
UPDATE products p
SET index = '502' || LPAD(np.rn::text, 10, '0')
FROM numbered_products np
WHERE p.id = np.id;

-- Dziczyzna (prefix 503)
WITH numbered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM products 
  WHERE category = 'Dziczyzna' AND (index IS NULL OR index = '')
)
UPDATE products p
SET index = '503' || LPAD(np.rn::text, 10, '0')
FROM numbered_products np
WHERE p.id = np.id;

-- Pasztety (prefix 504)
WITH numbered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM products 
  WHERE category = 'Pasztety' AND (index IS NULL OR index = '')
)
UPDATE products p
SET index = '504' || LPAD(np.rn::text, 10, '0')
FROM numbered_products np
WHERE p.id = np.id;

-- Szynki (prefix 505)
WITH numbered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM products 
  WHERE category = 'Szynki' AND (index IS NULL OR index = '')
)
UPDATE products p
SET index = '505' || LPAD(np.rn::text, 10, '0')
FROM numbered_products np
WHERE p.id = np.id;
