/*
  # System audytu i historii zmian w cennikach

  1. Nowe Tabele
    - `price_list_changes_log`
      - `id` (uuid, primary key)
      - `price_list_id` (uuid, foreign key do price_lists)
      - `changed_by` (uuid, foreign key do users) - kto dokonał zmiany
      - `change_type` (text) - typ zmiany: 'created', 'updated', 'activated', 'deactivated', 'deleted'
      - `field_name` (text) - nazwa zmienionego pola (np. 'name', 'valid_from')
      - `old_value` (text) - stara wartość
      - `new_value` (text) - nowa wartość
      - `description` (text) - opis zmiany
      - `created_at` (timestamptz)

    - `price_list_item_changes_log`
      - `id` (uuid, primary key)
      - `price_list_item_id` (uuid, foreign key do price_list_items)
      - `price_list_id` (uuid, foreign key do price_lists)
      - `product_id` (uuid, foreign key do products)
      - `changed_by` (uuid, foreign key do users)
      - `change_type` (text) - 'created', 'price_updated', 'deleted'
      - `old_price` (numeric)
      - `new_price` (numeric)
      - `created_at` (timestamptz)

    - `price_list_assignment_history`
      - `id` (uuid, primary key)
      - `price_list_id` (uuid, foreign key do price_lists)
      - `store_id` (uuid, foreign key do stores)
      - `store_group_id` (uuid, foreign key do store_groups)
      - `assigned_by` (uuid, foreign key do users)
      - `priority` (text)
      - `action` (text) - 'assigned', 'unassigned'
      - `valid_from` (timestamptz) - kiedy przypisanie zaczęło obowiązywać
      - `valid_to` (timestamptz) - kiedy przypisanie przestało obowiązywać
      - `created_at` (timestamptz)

  2. Widoki
    - `price_list_history_summary` - podsumowanie historii zmian dla cenników
    - `price_list_current_assignments` - aktualne przypisania cenników

  3. Security
    - Enable RLS dla wszystkich tabel
    - Wszyscy mogą czytać logi (dla transparentności)
    - Tylko triggery mogą dodawać nowe wpisy
*/

-- Tabela logów zmian w cennikach
CREATE TABLE IF NOT EXISTS price_list_changes_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'activated', 'deactivated', 'deleted', 'name_changed', 'dates_changed')),
  field_name text,
  old_value text,
  new_value text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_price_list_changes_log_price_list
  ON price_list_changes_log(price_list_id);

CREATE INDEX IF NOT EXISTS idx_price_list_changes_log_created_at
  ON price_list_changes_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_list_changes_log_changed_by
  ON price_list_changes_log(changed_by);

-- Tabela logów zmian cen w pozycjach cenników
CREATE TABLE IF NOT EXISTS price_list_item_changes_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_item_id uuid REFERENCES price_list_items(id) ON DELETE SET NULL,
  price_list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN ('created', 'price_updated', 'deleted')),
  old_price numeric(10,2),
  new_price numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_price_list_item_changes_log_price_list
  ON price_list_item_changes_log(price_list_id);

CREATE INDEX IF NOT EXISTS idx_price_list_item_changes_log_product
  ON price_list_item_changes_log(product_id);

CREATE INDEX IF NOT EXISTS idx_price_list_item_changes_log_created_at
  ON price_list_item_changes_log(created_at DESC);

-- Tabela historii przypisań cenników
CREATE TABLE IF NOT EXISTS price_list_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  store_group_id uuid REFERENCES store_groups(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  priority text NOT NULL CHECK (priority IN ('admin', 'warehouse', 'salesperson')),
  action text NOT NULL CHECK (action IN ('assigned', 'unassigned', 'updated')),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT check_assignment_target CHECK (
    (store_id IS NOT NULL AND store_group_id IS NULL) OR
    (store_id IS NULL AND store_group_id IS NOT NULL)
  )
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_price_list_assignment_history_price_list
  ON price_list_assignment_history(price_list_id);

CREATE INDEX IF NOT EXISTS idx_price_list_assignment_history_store
  ON price_list_assignment_history(store_id) WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_list_assignment_history_group
  ON price_list_assignment_history(store_group_id) WHERE store_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_list_assignment_history_dates
  ON price_list_assignment_history(valid_from, valid_to);

-- Enable RLS
ALTER TABLE price_list_changes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_item_changes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_assignment_history ENABLE ROW LEVEL SECURITY;

-- Polityki RLS - wszyscy mogą czytać logi (transparentność)
CREATE POLICY "Everyone can read price list changes log"
  ON price_list_changes_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Everyone can read price list item changes log"
  ON price_list_item_changes_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Everyone can read assignment history"
  ON price_list_assignment_history FOR SELECT
  TO authenticated
  USING (true);

-- Polityki dla wstawiania - tylko przez triggery lub admini/warehouse
CREATE POLICY "System can insert price list changes"
  ON price_list_changes_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse')
    )
  );

CREATE POLICY "System can insert item changes"
  ON price_list_item_changes_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse')
    )
  );

CREATE POLICY "System can insert assignment history"
  ON price_list_assignment_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse')
    )
  );

-- Widok: Podsumowanie historii cenników
CREATE OR REPLACE VIEW price_list_history_summary AS
SELECT
  pl.id as price_list_id,
  pl.name as price_list_name,
  pl.is_active,
  pl.valid_from,
  pl.valid_to,
  pl.created_at as price_list_created_at,
  COUNT(DISTINCT plcl.id) as total_changes,
  COUNT(DISTINCT plicl.id) as total_item_changes,
  COUNT(DISTINCT plah.id) as total_assignments,
  MAX(plcl.created_at) as last_change_date,
  MAX(plicl.created_at) as last_item_change_date,
  (
    SELECT json_agg(json_build_object(
      'store_id', s.id,
      'store_name', s.name,
      'store_code', s.code,
      'assigned_date', plah2.valid_from,
      'priority', plah2.priority
    ))
    FROM price_list_assignment_history plah2
    LEFT JOIN stores s ON s.id = plah2.store_id
    WHERE plah2.price_list_id = pl.id
      AND plah2.action = 'assigned'
      AND plah2.valid_to IS NULL
  ) as current_store_assignments,
  (
    SELECT json_agg(json_build_object(
      'group_id', sg.id,
      'group_name', sg.name,
      'assigned_date', plah3.valid_from,
      'priority', plah3.priority
    ))
    FROM price_list_assignment_history plah3
    LEFT JOIN store_groups sg ON sg.id = plah3.store_group_id
    WHERE plah3.price_list_id = pl.id
      AND plah3.action = 'assigned'
      AND plah3.valid_to IS NULL
  ) as current_group_assignments
FROM price_lists pl
LEFT JOIN price_list_changes_log plcl ON plcl.price_list_id = pl.id
LEFT JOIN price_list_item_changes_log plicl ON plicl.price_list_id = pl.id
LEFT JOIN price_list_assignment_history plah ON plah.price_list_id = pl.id
GROUP BY pl.id, pl.name, pl.is_active, pl.valid_from, pl.valid_to, pl.created_at;

-- Funkcja helper do logowania zmian w cennikach
CREATE OR REPLACE FUNCTION log_price_list_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO price_list_changes_log (
      price_list_id,
      changed_by,
      change_type,
      description
    ) VALUES (
      NEW.id,
      auth.uid(),
      'created',
      'Cennik utworzony: ' || NEW.name
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Loguj zmiany nazwy
    IF OLD.name != NEW.name THEN
      INSERT INTO price_list_changes_log (
        price_list_id,
        changed_by,
        change_type,
        field_name,
        old_value,
        new_value
      ) VALUES (
        NEW.id,
        auth.uid(),
        'name_changed',
        'name',
        OLD.name,
        NEW.name
      );
    END IF;

    -- Loguj zmiany statusu aktywności
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO price_list_changes_log (
        price_list_id,
        changed_by,
        change_type,
        description
      ) VALUES (
        NEW.id,
        auth.uid(),
        CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END,
        CASE WHEN NEW.is_active THEN 'Cennik aktywowany' ELSE 'Cennik dezaktywowany' END
      );
    END IF;

    -- Loguj zmiany dat
    IF OLD.valid_from != NEW.valid_from OR
       (OLD.valid_to IS DISTINCT FROM NEW.valid_to) THEN
      INSERT INTO price_list_changes_log (
        price_list_id,
        changed_by,
        change_type,
        description
      ) VALUES (
        NEW.id,
        auth.uid(),
        'dates_changed',
        'Zmiana dat ważności: ' ||
        COALESCE(NEW.valid_from::text, 'brak') || ' - ' ||
        COALESCE(NEW.valid_to::text, 'brak')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dla logowania zmian w cennikach
DROP TRIGGER IF EXISTS price_list_changes_trigger ON price_lists;
CREATE TRIGGER price_list_changes_trigger
  AFTER INSERT OR UPDATE ON price_lists
  FOR EACH ROW
  EXECUTE FUNCTION log_price_list_change();

-- Funkcja helper do logowania zmian w pozycjach cenników
CREATE OR REPLACE FUNCTION log_price_list_item_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO price_list_item_changes_log (
      price_list_item_id,
      price_list_id,
      product_id,
      changed_by,
      change_type,
      new_price
    ) VALUES (
      NEW.id,
      NEW.price_list_id,
      NEW.product_id,
      auth.uid(),
      'created',
      NEW.price
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.price != NEW.price THEN
      INSERT INTO price_list_item_changes_log (
        price_list_item_id,
        price_list_id,
        product_id,
        changed_by,
        change_type,
        old_price,
        new_price
      ) VALUES (
        NEW.id,
        NEW.price_list_id,
        NEW.product_id,
        auth.uid(),
        'price_updated',
        OLD.price,
        NEW.price
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO price_list_item_changes_log (
      price_list_item_id,
      price_list_id,
      product_id,
      changed_by,
      change_type,
      old_price
    ) VALUES (
      OLD.id,
      OLD.price_list_id,
      OLD.product_id,
      auth.uid(),
      'deleted',
      OLD.price
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dla logowania zmian w pozycjach cenników
DROP TRIGGER IF EXISTS price_list_item_changes_trigger ON price_list_items;
CREATE TRIGGER price_list_item_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON price_list_items
  FOR EACH ROW
  EXECUTE FUNCTION log_price_list_item_change();

-- Funkcja helper do logowania przypisań cenników
CREATE OR REPLACE FUNCTION log_price_list_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO price_list_assignment_history (
      price_list_id,
      store_id,
      store_group_id,
      assigned_by,
      priority,
      action,
      valid_from
    ) VALUES (
      NEW.price_list_id,
      NEW.store_id,
      NEW.store_group_id,
      COALESCE(NEW.assigned_by, auth.uid()),
      NEW.priority,
      'assigned',
      now()
    );
  ELSIF TG_OP = 'DELETE' THEN
    -- Zakończ aktualne przypisanie
    UPDATE price_list_assignment_history
    SET valid_to = now()
    WHERE price_list_id = OLD.price_list_id
      AND (
        (store_id = OLD.store_id AND OLD.store_id IS NOT NULL) OR
        (store_group_id = OLD.store_group_id AND OLD.store_group_id IS NOT NULL)
      )
      AND priority = OLD.priority
      AND valid_to IS NULL;

    -- Dodaj wpis o usunięciu przypisania
    INSERT INTO price_list_assignment_history (
      price_list_id,
      store_id,
      store_group_id,
      assigned_by,
      priority,
      action,
      valid_from,
      valid_to
    ) VALUES (
      OLD.price_list_id,
      OLD.store_id,
      OLD.store_group_id,
      auth.uid(),
      OLD.priority,
      'unassigned',
      now(),
      now()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dla logowania przypisań cenników
DROP TRIGGER IF EXISTS price_list_assignment_log_trigger ON price_list_assignments;
CREATE TRIGGER price_list_assignment_log_trigger
  AFTER INSERT OR DELETE ON price_list_assignments
  FOR EACH ROW
  EXECUTE FUNCTION log_price_list_assignment();
