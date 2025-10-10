/*
  # Dodanie zdjęć i opisów produktów
  
  ## Zmiany
  1. Dodanie kolumny `image_url` do tabeli products
     - Przechowuje URL do zdjęcia produktu
     - Opcjonalna kolumna (może być NULL)
  
  2. Dodanie kolumny `description` do tabeli products
     - Przechowuje opis produktu
     - Opcjonalna kolumna (może być NULL)
  
  ## Bezpieczeństwo
  - Nie wymaga zmian w RLS - kolumny są częścią istniejącej tabeli
*/

-- Dodanie kolumny image_url do products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;

-- Dodanie kolumny description do products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE products ADD COLUMN description text;
  END IF;
END $$;