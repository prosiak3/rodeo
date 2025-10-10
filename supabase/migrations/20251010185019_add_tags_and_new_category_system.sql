/*
  # Dodanie tagów i nowego systemu kategorii

  1. Nowe kolumny
    - `tags` (text[]) - tablica tagów dla produktu
    - `display_category` (text) - kategoria wyświetlana: nowości, dobra cena, najlepsza cena dla ciebie
    - `original_category` (text) - oryginalna kategoria produktu (Wołowina, Drób, itp.)
    
  2. Kategorie wyświetlania
    - "nowości" - nowe produkty
    - "dobra cena" - produkty z your_price
    - "najlepsza cena dla ciebie" - produkty z promo_price
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, dodaje nowe kolumny
*/

-- Zmień nazwę category na original_category
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'original_category'
  ) THEN
    ALTER TABLE products RENAME COLUMN category TO original_category;
  END IF;
END $$;

-- Dodaj kolumnę tags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'tags'
  ) THEN
    ALTER TABLE products ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Dodaj kolumnę display_category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'display_category'
  ) THEN
    ALTER TABLE products ADD COLUMN display_category text;
  END IF;
END $$;

-- Ustaw display_category dla istniejących produktów
UPDATE products
SET display_category = original_category
WHERE display_category IS NULL;

-- Dodaj komentarze do kolumn
COMMENT ON COLUMN products.tags IS 'Tablica tagów dla grupowania produktów';
COMMENT ON COLUMN products.display_category IS 'Kategoria wyświetlana w cenniku';
COMMENT ON COLUMN products.original_category IS 'Oryginalna kategoria produktu';
