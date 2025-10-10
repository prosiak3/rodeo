/*
  # System dostaw i rola kierowcy

  1. Rozszerzenie ról
    - Dodanie 'driver' do constraint
    
  2. Tabela deliveries
    - Śledzenie dostaw zamówień
    
  3. Bezpieczeństwo
    - RLS dla kierowców
*/

-- Rozszerz constraint na role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['store_manager'::text, 'salesperson'::text, 'operator'::text, 'admin'::text, 'driver'::text]));

-- Tabela deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  loaded_at timestamptz DEFAULT NOW() NOT NULL,
  delivered_at timestamptz,
  status text DEFAULT 'loaded' NOT NULL CHECK (status IN ('loaded', 'in_transit', 'delivered')),
  notes text,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL,
  UNIQUE(order_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant deliveries"
  ON deliveries FOR SELECT TO authenticated
  USING (
    auth.uid() = driver_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('operator', 'admin', 'salesperson'))
  );

CREATE POLICY "Drivers can update own deliveries"
  ON deliveries FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Staff can create deliveries"
  ON deliveries FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('operator', 'admin', 'salesperson'))
  );

CREATE POLICY "Operators can delete deliveries"
  ON deliveries FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('operator', 'admin'))
  );
