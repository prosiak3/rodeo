/*
  # System przypisywania cenników z priorytetami

  1. Nowe Tabele
    - `price_list_assignments`
      - `id` (uuid, primary key)
      - `price_list_id` (uuid, foreign key do price_lists)
      - `store_id` (uuid, nullable, foreign key do stores) - dla pojedynczych sklepów
      - `store_group_id` (uuid, nullable, foreign key do store_groups) - dla grup sklepów
      - `assigned_by` (uuid, foreign key do users) - kto przypisał
      - `priority` (text) - 'admin', 'warehouse', 'salesperson'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
  2. Zmiany
    - Dodanie pola `created_by` do price_lists (kto stworzył cennik)
    - Dodanie pola `role_priority` do price_lists - automatyczny priorytet na podstawie roli twórcy
    
  3. Reguły Biznesowe
    - Priorytet cenników: Admin > Hurtownia > Handlowiec
    - Cennik może być przypisany do grupy sklepów LUB pojedynczych sklepów
    - Indywidualne przypisanie do sklepu nadpisuje przypisanie grupowe
    - Przy wyborze cennika dla sklepu sprawdzamy w kolejności:
      1. Czy jest indywidualne przypisanie dla tego sklepu
      2. Czy jest przypisanie dla grupy, do której należy sklep
      3. W ramach tego samego poziomu (sklep/grupa) bierzemy cennik o wyższym priorytecie
    
  4. Security
    - Enable RLS
    - Admini mogą wszystko
    - Hurtownie mogą zarządzać swoimi cennikami i cennikami handlowców
    - Handlowcy mogą zarządzać tylko swoimi cennikami
*/

-- Dodaj pole created_by do price_lists
ALTER TABLE price_lists 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS role_priority text CHECK (role_priority IN ('admin', 'warehouse', 'salesperson'));

-- Utwórz tabelę przypisań cenników
CREATE TABLE IF NOT EXISTS price_list_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  store_group_id uuid REFERENCES store_groups(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id),
  priority text NOT NULL CHECK (priority IN ('admin', 'warehouse', 'salesperson')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Walidacja: musi być albo store_id albo store_group_id, ale nie oba
  CONSTRAINT check_assignment_target CHECK (
    (store_id IS NOT NULL AND store_group_id IS NULL) OR
    (store_id IS NULL AND store_group_id IS NOT NULL)
  ),
  
  -- Unikalność: jeden cennik o danym priorytecie na sklep/grupę
  CONSTRAINT unique_price_list_per_target_priority UNIQUE (price_list_id, store_id, store_group_id, priority)
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_price_list_assignments_store 
  ON price_list_assignments(store_id) WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_list_assignments_group 
  ON price_list_assignments(store_group_id) WHERE store_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_list_assignments_priority 
  ON price_list_assignments(priority);

-- Enable RLS
ALTER TABLE price_list_assignments ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla price_list_assignments
CREATE POLICY "Admin can do everything with assignments"
  ON price_list_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Warehouse can view all assignments"
  ON price_list_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('warehouse', 'salesperson')
    )
  );

CREATE POLICY "Warehouse can manage warehouse and salesperson assignments"
  ON price_list_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'warehouse'
    )
    AND priority IN ('warehouse', 'salesperson')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'warehouse'
    )
    AND priority IN ('warehouse', 'salesperson')
  );

CREATE POLICY "Salesperson can manage only their assignments"
  ON price_list_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'salesperson'
    )
    AND priority = 'salesperson'
    AND assigned_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'salesperson'
    )
    AND priority = 'salesperson'
    AND assigned_by = auth.uid()
  );

-- Funkcja do automatycznego ustawiania updated_at
CREATE OR REPLACE FUNCTION update_price_list_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_list_assignments_updated_at
  BEFORE UPDATE ON price_list_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_price_list_assignments_updated_at();

-- Funkcja do pobierania właściwego cennika dla sklepu
CREATE OR REPLACE FUNCTION get_price_list_for_store(p_store_id uuid)
RETURNS uuid AS $$
DECLARE
  v_price_list_id uuid;
  v_priority_order text[] := ARRAY['admin', 'warehouse', 'salesperson'];
  v_priority text;
BEGIN
  -- Najpierw sprawdź indywidualne przypisanie do sklepu (w kolejności priorytetów)
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
  
  -- Jeśli nie ma indywidualnego, sprawdź przypisanie grupowe
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
  
  -- Jeśli nic nie znaleziono, zwróć domyślny cennik
  SELECT id INTO v_price_list_id
  FROM price_lists
  WHERE name = 'Cennik Standardowy'
    AND is_active = true
  LIMIT 1;
  
  RETURN v_price_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
