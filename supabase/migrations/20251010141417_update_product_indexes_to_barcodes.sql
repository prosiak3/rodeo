/*
  # Zmiana indeksów produktów na kody kreskowe EAN-13

  1. Zmiany
    - Zmiana typu kolumny `index` z integer na text (varchar)
    - Aktualizacja wszystkich produktów z 13-cyfrowymi kodami kreskowymi EAN-13
    
  2. Bezpieczeństwo
    - Operacja bezpieczna, nie traci danych
*/

-- Zmień typ kolumny index na text
ALTER TABLE products ALTER COLUMN index TYPE text USING index::text;

-- Zaktualizuj produkty z kodami kreskowymi EAN-13
UPDATE products SET index = '5901234123457' WHERE code = 'P001';
UPDATE products SET index = '5901234123464' WHERE code = 'P002';
UPDATE products SET index = '5901234123471' WHERE code = 'P003';
UPDATE products SET index = '5901234123488' WHERE code = 'P004';
UPDATE products SET index = '5901234123495' WHERE code = 'P005';
UPDATE products SET index = '5901234123501' WHERE code = 'P006';
UPDATE products SET index = '5901234123518' WHERE code = 'P007';
UPDATE products SET index = '5901234123525' WHERE code = 'W001';
UPDATE products SET index = '5901234123532' WHERE code = 'W002';
UPDATE products SET index = '5901234123549' WHERE code = 'W003';
UPDATE products SET index = '5901234123556' WHERE code = 'W004';
UPDATE products SET index = '5901234123563' WHERE code = 'W005';
UPDATE products SET index = '5901234123570' WHERE code = 'D001';
UPDATE products SET index = '5901234123587' WHERE code = 'D002';
UPDATE products SET index = '5901234123594' WHERE code = 'D003';
UPDATE products SET index = '5901234123600' WHERE code = 'D004';
UPDATE products SET index = '5901234123617' WHERE code = 'D005';
UPDATE products SET index = '5901234123624' WHERE code = 'D006';
UPDATE products SET index = '5901234123631' WHERE code = 'S001';
UPDATE products SET index = '5901234123648' WHERE code = 'S002';
