/*
  # Dodanie tabeli pozycji cennika i zmiana nazwy cennika bazowego

  1. Nowe Tabele
    - `price_list_items`
      - `id` (uuid, primary key)
      - `price_list_id` (uuid, foreign key do price_lists)
      - `product_id` (uuid, foreign key do products)
      - `price` (numeric) - cena produktu w tym cenniku
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
  2. Zmiany
    - Zmiana nazwy "Cennik Standardowy" na "Cennik Bazowy"
    - Dodanie wszystkich produktów do cennika bazowego z ich cenami base_price
    
  3. Reguły Biznesowe
    - Każdy cennik może mieć różne ceny dla produktów
    - Jeśli produktu nie ma w cenniku, używana jest cena z cennika bazowego
    - Cennik bazowy zawiera wszystkie produkty
    
  4. Security
    - Enable RLS
    - Wszystkie role mogą czytać pozycje cenników
    - Admin i warehouse mogą zarządzać pozycjami cenników
*/

-- Utwórz tabelę pozycji cennika
CREATE TABLE IF NOT EXISTS price_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unikalność: jeden produkt może być tylko raz w danym cenniku
  CONSTRAINT unique_product_per_price_list UNIQUE (price_list_id, product_id)
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list 
  ON price_list_items(price_list_id);

CREATE INDEX IF NOT EXISTS idx_price_list_items_product 
  ON price_list_items(product_id);

-- Enable RLS
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

-- Polityki RLS
CREATE POLICY "Everyone can read price list items"
  ON price_list_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and warehouse can manage price list items"
  ON price_list_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'warehouse')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'warehouse')
    )
  );

-- Funkcja do automatycznego ustawiania updated_at
CREATE OR REPLACE FUNCTION update_price_list_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_list_items_updated_at
  BEFORE UPDATE ON price_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_price_list_items_updated_at();

-- Zmień nazwę cennika standardowego na bazowy (jeśli istnieje)
UPDATE price_lists 
SET name = 'Cennik Bazowy',
    description = 'Bazowy cennik produktów - podstawa dla innych cenników'
WHERE name = 'Cennik Standardowy'
OR name ILIKE '%standardowy%'
OR name ILIKE '%standard%';

-- Jeśli nie ma cennika bazowego, utwórz go
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM price_lists WHERE name = 'Cennik Bazowy') THEN
    INSERT INTO price_lists (name, description, is_active, valid_from)
    VALUES ('Cennik Bazowy', 'Bazowy cennik produktów - podstawa dla innych cenników', true, now());
  END IF;
END $$;

-- Dodaj wszystkie produkty do cennika bazowego z ich base_price
INSERT INTO price_list_items (price_list_id, product_id, price)
SELECT 
  (SELECT id FROM price_lists WHERE name = 'Cennik Bazowy' LIMIT 1),
  p.id,
  p.base_price
FROM products p
WHERE p.active = true
ON CONFLICT (price_list_id, product_id) 
DO UPDATE SET price = EXCLUDED.price;

-- Funkcja pomocnicza do pobierania ceny produktu z cennika
CREATE OR REPLACE FUNCTION get_product_price_from_list(p_product_id uuid, p_price_list_id uuid)
RETURNS numeric AS $$
DECLARE
  v_price numeric;
  v_base_price_list_id uuid;
BEGIN
  -- Sprawdź czy produkt jest w danym cenniku
  SELECT price INTO v_price
  FROM price_list_items
  WHERE product_id = p_product_id
    AND price_list_id = p_price_list_id;
  
  IF v_price IS NOT NULL THEN
    RETURN v_price;
  END IF;
  
  -- Jeśli nie ma w cenniku, pobierz z cennika bazowego
  SELECT id INTO v_base_price_list_id
  FROM price_lists
  WHERE name = 'Cennik Bazowy'
  LIMIT 1;
  
  SELECT price INTO v_price
  FROM price_list_items
  WHERE product_id = p_product_id
    AND price_list_id = v_base_price_list_id;
  
  IF v_price IS NOT NULL THEN
    RETURN v_price;
  END IF;
  
  -- Jeśli nadal nie ma, zwróć base_price z produktu
  SELECT base_price INTO v_price
  FROM products
  WHERE id = p_product_id;
  
  RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Zaktualizuj funkcję get_price_list_for_store aby używała nazwy "Cennik Bazowy"
CREATE OR REPLACE FUNCTION get_price_list_for_store(p_store_id uuid)
RETURNS uuid AS $$
DECLARE
  v_price_list_id uuid;
  v_priority_order text[] := ARRAY['admin', 'warehouse'];
  v_priority text;
BEGIN
  FOREACH v_priority IN ARRAY v_priority_order
  LOOP
    SELECT pla.price_list_id INTO v_price_list_id
    FROM price_list_assignments pla
    INNER JOIN price_lists pl ON pl.id = pla.price_list_id
    WHERE pla.store_id = p_store_id
      AND pla.priority = v_priority
      AND pl.is_active = true
      AND (pl.valid_from IS NULL OR pl.valid_from <= now())
      AND (pl.valid_to IS NULL OR pl.valid_to >= now())
    ORDER BY pla.created_at DESC
    LIMIT 1;
    
    IF v_price_list_id IS NOT NULL THEN
      RETURN v_price_list_id;
    END IF;
  END LOOP;
  
  FOREACH v_priority IN ARRAY v_priority_order
  LOOP
    SELECT pla.price_list_id INTO v_price_list_id
    FROM price_list_assignments pla
    INNER JOIN price_lists pl ON pl.id = pla.price_list_id
    INNER JOIN store_group_members sgm ON sgm.group_id = pla.store_group_id
    WHERE sgm.store_id = p_store_id
      AND pla.priority = v_priority
      AND pl.is_active = true
      AND (pl.valid_from IS NULL OR pl.valid_from <= now())
      AND (pl.valid_to IS NULL OR pl.valid_to >= now())
    ORDER BY pla.created_at DESC
    LIMIT 1;
    
    IF v_price_list_id IS NOT NULL THEN
      RETURN v_price_list_id;
    END IF;
  END LOOP;
  
  SELECT id INTO v_price_list_id
  FROM price_lists
  WHERE name = 'Cennik Bazowy'
    AND is_active = true
  LIMIT 1;
  
  RETURN v_price_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
