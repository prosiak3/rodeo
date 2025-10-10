/*
  # Dodanie ograniczeń ilościowych dla produktów

  1. Nowe kolumny
    - `min_quantity` (numeric) - minimalna ilość zamówienia dla produktu
    - `quantity_step` (numeric) - krok zwiększania ilości (np. 1kg, 5kg)
    
  2. Wartości domyślne
    - min_quantity: 1 (minimalna ilość to 1 jednostka)
    - quantity_step: 1 (domyślny krok to 1 jednostka)
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, dodaje nowe kolumny z wartościami domyślnymi
*/

-- Dodaj kolumny dla ograniczeń ilościowych
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS min_quantity numeric DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS quantity_step numeric DEFAULT 1 NOT NULL;

-- Dodaj sprawdzenie, że wartości są dodatnie
ALTER TABLE products 
  ADD CONSTRAINT check_min_quantity_positive CHECK (min_quantity > 0),
  ADD CONSTRAINT check_quantity_step_positive CHECK (quantity_step > 0);

-- Ustaw przykładowe wartości dla różnych kategorii produktów
UPDATE products SET min_quantity = 5, quantity_step = 5 WHERE category = 'Mięso wołowe';
UPDATE products SET min_quantity = 5, quantity_step = 5 WHERE category = 'Mięso wieprzowe';
UPDATE products SET min_quantity = 3, quantity_step = 1 WHERE category = 'Kiełbasy';
UPDATE products SET min_quantity = 2, quantity_step = 1 WHERE category = 'Wędliny';
UPDATE products SET min_quantity = 1, quantity_step = 1 WHERE category = 'Drób';
UPDATE products SET min_quantity = 10, quantity_step = 5 WHERE category = 'Premium';
