/*
  # Zmiana systemu promocji 10+1
  
  1. Zmiany
    - Dodanie flagi `promo_10_plus_1` do tabeli products
    - Usunięcie zduplikowanych produktów z sufiksem "10+1"
    - Oznaczenie produktów bazowych flagą promocji
  
  2. Szczegóły
    - Promocja 10+1 teraz działa na produkcie bazowym
    - Przy zamówieniu 10 kg → klient dostaje 11 kg w cenie 10kg + 0.01 PLN
    - Cena pozostaje za kg, nie za opakowanie
    - Produkty z flagą `promo_10_plus_1 = true` będą wyświetlane z badge'm
  
  3. Bezpieczeństwo
    - Usunięcie niepotrzebnych duplikatów produktów
    - Zachowanie oryginalnych produktów
*/

-- 1. Dodaj kolumnę promo_10_plus_1 do tabeli products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_10_plus_1 boolean DEFAULT false;

-- 2. Znajdź produkty bazowe dla promocji 10+1 i ustaw flagę
UPDATE products 
SET promo_10_plus_1 = true
WHERE name IN (
  SELECT REPLACE(name, ' 10+1', '')
  FROM products
  WHERE name LIKE '%10+1%'
)
AND name NOT LIKE '%10+1%';

-- 3. Usuń wszystkie produkty ze sufiksem "10+1"
DELETE FROM products 
WHERE name LIKE '%10+1%';

-- 4. Usuń ceny specjalne dla usuniętych produktów (zostały kaskadowo usunięte przez foreign key)
-- (to działa automatycznie dzięki ON DELETE CASCADE)
