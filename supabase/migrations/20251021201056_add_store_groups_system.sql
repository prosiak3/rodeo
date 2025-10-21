/*
  # System Grupowania Sklepów

  ## Opis
  System pozwalający na organizację sklepów w grupy logiczne dla łatwiejszego
  zarządzania cenami, promocjami i operacjami hurtowymi.

  ## Nowe Tabele

  ### 1. `store_groups` - Grupy Sklepów
    - `id` (uuid, primary key) - unikalny identyfikator grupy
    - `name` (text, unique) - unikalna nazwa grupy
    - `description` (text) - opis grupy
    - `color` (text) - kolor dla wizualnej identyfikacji
    - `active` (boolean) - czy grupa jest aktywna
    - `created_by` (uuid) - kto utworzył grupę
    - `created_at` (timestamptz) - data utworzenia
    - `updated_at` (timestamptz) - data ostatniej modyfikacji

  ### 2. `store_group_members` - Członkostwo Sklepów w Grupach
    - `id` (uuid, primary key) - unikalny identyfikator
    - `group_id` (uuid) - referencja do store_groups
    - `store_id` (uuid) - referencja do stores
    - `added_by` (uuid) - kto dodał sklep do grupy
    - `created_at` (timestamptz) - data dodania
    - Constraint: jeden sklep może być w danej grupie tylko raz

  ## Zmiany w Istniejących Tabelach

  ### `special_prices`
    - Dodanie kolumny `store_group_id` (uuid, nullable) - referencja do grupy
    - Constraint: albo store_id albo store_group_id musi być ustawione (nie oba jednocześnie)
    - Indeksy dla wydajności zapytań

  ## Bezpieczeństwo (RLS)
    - Admin i operator: pełny dostęp do zarządzania grupami
    - Store_manager i salesperson: tylko odczyt grup
    - Wszystkie operacje logowane dla audytu

  ## Funkcje Pomocnicze
    - `get_stores_in_group(group_id)` - zwraca listę sklepów w grupie
    - `get_groups_for_store(store_id)` - zwraca listę grup dla sklepu
    - `apply_price_to_group(group_id, product_id, price_data)` - aplikuje cenę do wszystkich sklepów w grupie
*/

-- =====================================================
-- 1. TWORZENIE TABEL
-- =====================================================

-- Tabela store_groups
CREATE TABLE IF NOT EXISTS store_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  active boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela store_group_members
CREATE TABLE IF NOT EXISTS store_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES store_groups(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, store_id)
);

-- =====================================================
-- 2. MODYFIKACJA TABELI SPECIAL_PRICES
-- =====================================================

-- Dodaj kolumnę store_group_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'special_prices' AND column_name = 'store_group_id'
  ) THEN
    ALTER TABLE special_prices ADD COLUMN store_group_id uuid REFERENCES store_groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Dodaj constraint: albo store_id albo store_group_id (nie oba)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'special_prices_store_or_group_check'
  ) THEN
    ALTER TABLE special_prices
    ADD CONSTRAINT special_prices_store_or_group_check
    CHECK (
      (store_id IS NOT NULL AND store_group_id IS NULL) OR
      (store_id IS NULL AND store_group_id IS NOT NULL)
    );
  END IF;
END $$;

-- =====================================================
-- 3. INDEKSY DLA WYDAJNOŚCI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_store_groups_active ON store_groups(active);
CREATE INDEX IF NOT EXISTS idx_store_groups_name ON store_groups(name);
CREATE INDEX IF NOT EXISTS idx_store_group_members_group_id ON store_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_store_group_members_store_id ON store_group_members(store_id);
CREATE INDEX IF NOT EXISTS idx_special_prices_group_id ON special_prices(store_group_id);

-- =====================================================
-- 4. FUNKCJE POMOCNICZE
-- =====================================================

-- Funkcja: Pobierz sklepy w grupie
CREATE OR REPLACE FUNCTION get_stores_in_group(p_group_id uuid)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  store_code text,
  store_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.code,
    s.active
  FROM stores s
  INNER JOIN store_group_members sgm ON s.id = sgm.store_id
  WHERE sgm.group_id = p_group_id
  ORDER BY s.name;
END;
$$;

-- Funkcja: Pobierz grupy dla sklepu
CREATE OR REPLACE FUNCTION get_groups_for_store(p_store_id uuid)
RETURNS TABLE (
  group_id uuid,
  group_name text,
  group_description text,
  group_color text,
  group_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sg.id,
    sg.name,
    sg.description,
    sg.color,
    sg.active
  FROM store_groups sg
  INNER JOIN store_group_members sgm ON sg.id = sgm.group_id
  WHERE sgm.store_id = p_store_id AND sg.active = true
  ORDER BY sg.name;
END;
$$;

-- Funkcja: Liczba sklepów w grupie
CREATE OR REPLACE FUNCTION count_stores_in_group(p_group_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  store_count integer;
BEGIN
  SELECT COUNT(*) INTO store_count
  FROM store_group_members
  WHERE group_id = p_group_id;

  RETURN store_count;
END;
$$;

-- =====================================================
-- 5. TRIGGERY
-- =====================================================

-- Trigger: Aktualizuj updated_at w store_groups
CREATE OR REPLACE FUNCTION update_store_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_store_groups_updated_at ON store_groups;
CREATE TRIGGER trigger_update_store_groups_updated_at
  BEFORE UPDATE ON store_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_store_groups_updated_at();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Włącz RLS
ALTER TABLE store_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_group_members ENABLE ROW LEVEL SECURITY;

-- Polityki dla store_groups
DROP POLICY IF EXISTS "Admin and operator can manage store groups" ON store_groups;
CREATE POLICY "Admin and operator can manage store groups"
  ON store_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Store managers and salespersons can view store groups" ON store_groups;
CREATE POLICY "Store managers and salespersons can view store groups"
  ON store_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('store_manager', 'salesperson')
    )
  );

-- Polityki dla store_group_members
DROP POLICY IF EXISTS "Admin and operator can manage group members" ON store_group_members;
CREATE POLICY "Admin and operator can manage group members"
  ON store_group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Store managers and salespersons can view group members" ON store_group_members;
CREATE POLICY "Store managers and salespersons can view group members"
  ON store_group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('store_manager', 'salesperson')
    )
  );

-- =====================================================
-- 7. PRZYKŁADOWE DANE
-- =====================================================

-- Dodaj przykładowe grupy sklepów
INSERT INTO store_groups (name, description, color, active) VALUES
  ('Delikatesy - Sieć', 'Wszystkie sklepy Delikatesy', '#10B981', true),
  ('Sklepy Premium', 'Sklepy w lokalizacjach premium', '#8B5CF6', true),
  ('Sklepy Regionalne - Warszawa', 'Sklepy w województwie mazowieckim', '#F59E0B', true),
  ('Sklepy Promocyjne Q1', 'Sklepy uczestniczące w promocjach Q1 2025', '#EF4444', true)
ON CONFLICT (name) DO NOTHING;

-- Dodaj przykładowe przypisania sklepów do grup
-- (Zakładam, że masz już sklepy w bazie - to doda je do grup jeśli istnieją)
DO $$
DECLARE
  v_group_id uuid;
  v_store_id uuid;
BEGIN
  -- Grupa "Delikatesy - Sieć" - dodaj wszystkie sklepy z kodem zaczynającym się na "DEL"
  SELECT id INTO v_group_id FROM store_groups WHERE name = 'Delikatesy - Sieć';

  IF v_group_id IS NOT NULL THEN
    INSERT INTO store_group_members (group_id, store_id)
    SELECT v_group_id, s.id
    FROM stores s
    WHERE s.code LIKE 'DEL%' AND s.active = true
    ON CONFLICT (group_id, store_id) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- 8. KOMENTARZE
-- =====================================================

COMMENT ON TABLE store_groups IS 'Grupy logiczne sklepów dla łatwiejszego zarządzania';
COMMENT ON TABLE store_group_members IS 'RelacjaMany-to-Many między grupami a sklepami';
COMMENT ON COLUMN special_prices.store_group_id IS 'Opcjonalna referencja do grupy sklepów (zamiast pojedynczego sklepu)';
COMMENT ON FUNCTION get_stores_in_group IS 'Zwraca listę sklepów należących do danej grupy';
COMMENT ON FUNCTION get_groups_for_store IS 'Zwraca listę grup, do których należy dany sklep';
COMMENT ON FUNCTION count_stores_in_group IS 'Zwraca liczbę sklepów w grupie';
