/*
  # Dodaj indeks do produktów w cenniku

  1. Zmiany
    - Dodaj kolumnę `index` do tabeli `products` - unikalny numer pozycji w cenniku
    - Zaktualizuj istniejące produkty numerami indeksów
    
  2. Bezpieczeństwo
    - Dodanie kolumny jest bezpieczne, nie wpływa na istniejące dane
*/

-- Dodaj kolumnę index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'index'
  ) THEN
    ALTER TABLE products ADD COLUMN index integer;
  END IF;
END $$;

-- Zaktualizuj istniejące produkty z indeksami
UPDATE products SET index = 1 WHERE code = 'P001';
UPDATE products SET index = 2 WHERE code = 'P002';
UPDATE products SET index = 3 WHERE code = 'P003';
UPDATE products SET index = 4 WHERE code = 'P004';
UPDATE products SET index = 5 WHERE code = 'P005';
UPDATE products SET index = 6 WHERE code = 'P006';
UPDATE products SET index = 7 WHERE code = 'P007';
UPDATE products SET index = 8 WHERE code = 'W001';
UPDATE products SET index = 9 WHERE code = 'W002';
UPDATE products SET index = 10 WHERE code = 'W003';
UPDATE products SET index = 11 WHERE code = 'W004';
UPDATE products SET index = 12 WHERE code = 'W005';
UPDATE products SET index = 13 WHERE code = 'D001';
UPDATE products SET index = 14 WHERE code = 'D002';
UPDATE products SET index = 15 WHERE code = 'D003';
UPDATE products SET index = 16 WHERE code = 'D004';
UPDATE products SET index = 17 WHERE code = 'D005';
UPDATE products SET index = 18 WHERE code = 'D006';
UPDATE products SET index = 19 WHERE code = 'S001';
UPDATE products SET index = 20 WHERE code = 'S002';
