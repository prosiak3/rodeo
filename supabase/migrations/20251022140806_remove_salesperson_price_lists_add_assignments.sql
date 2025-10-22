/*
  # Usunięcie cenników handlowca i dodanie przypisań sklepów do handlowców

  1. Zmiany
    - Usunięcie możliwości tworzenia cenników przez handlowców
    - Zaktualizowanie priorytetów cenników (tylko admin i warehouse)
    - Dodanie tabeli przypisań sklepów do handlowców
    
  2. Nowe Tabele
    - `salesperson_store_assignments`
      - `id` (uuid, primary key)
      - `salesperson_id` (uuid, foreign key do users) - handlowiec
      - `store_id` (uuid, foreign key do stores) - sklep
      - `assigned_by` (uuid, foreign key do users) - kto przypisał
      - `created_at` (timestamptz)
    
  3. Reguły Biznesowe
    - Handlowiec może mieć przypisanych wiele sklepów
    - Sklep może być przypisany do wielu handlowców
    - Handlowiec może modyfikować zamówienia tylko ze swoich sklepów
    - Można przypisywać sklepy grupowo (całe grupy sklepów naraz)
    
  4. Security
    - Enable RLS
    - Admini i hurtownie mogą zarządzać przypisaniami
    - Handlowcy mogą tylko przeglądać swoje przypisania
*/

-- Usuń stare przypisania cenników handlowców
DELETE FROM price_list_assignments WHERE priority = 'salesperson';

-- ZaktualizujConstrainty
ALTER TABLE price_list_assignments 
  DROP CONSTRAINT IF EXISTS price_list_assignments_priority_check;

ALTER TABLE price_list_assignments 
  ADD CONSTRAINT price_list_assignments_priority_check 
  CHECK (priority IN ('admin', 'warehouse'));

-- Zaktualizuj funkcję get_price_list_for_store
CREATE OR REPLACE FUNCTION get_price_list_for_store(p_store_id uuid)
RETURNS uuid AS $$
DECLARE
  v_price_list_id uuid;
  v_priority_order text[] := ARRAY['admin', 'warehouse'];
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

-- Utwórz tabelę przypisań sklepów do handlowców
CREATE TABLE IF NOT EXISTS salesperson_store_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  
  -- Unikalność: jeden handlowiec może być przypisany tylko raz do danego sklepu
  CONSTRAINT unique_salesperson_store UNIQUE (salesperson_id, store_id)
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_salesperson_store_assignments_salesperson 
  ON salesperson_store_assignments(salesperson_id);

CREATE INDEX IF NOT EXISTS idx_salesperson_store_assignments_store 
  ON salesperson_store_assignments(store_id);

-- Enable RLS
ALTER TABLE salesperson_store_assignments ENABLE ROW LEVEL SECURITY;

-- Polityki RLS
CREATE POLICY "Admin and warehouse can manage all salesperson assignments"
  ON salesperson_store_assignments FOR ALL
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

CREATE POLICY "Salesperson can view their own assignments"
  ON salesperson_store_assignments FOR SELECT
  TO authenticated
  USING (
    salesperson_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'warehouse')
    )
  );

-- Funkcja pomocnicza do sprawdzenia czy handlowiec ma dostęp do sklepu
CREATE OR REPLACE FUNCTION salesperson_has_access_to_store(p_salesperson_id uuid, p_store_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM salesperson_store_assignments 
    WHERE salesperson_id = p_salesperson_id 
    AND store_id = p_store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
