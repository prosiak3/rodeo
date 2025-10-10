/*
  # RODEO - System Zarządzania Zamówieniami Mięsno-Wędliniarskimi
  
  ## Nowe Tabele
  
  ### 1. `stores` - Sklepy
    - `id` (uuid, primary key)
    - `name` (text) - nazwa sklepu
    - `code` (text, unique) - kod sklepu
    - `address` (text) - adres
    - `phone` (text) - telefon
    - `active` (boolean) - czy sklep jest aktywny
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 2. `users` - Użytkownicy
    - `id` (uuid, primary key, references auth.users)
    - `email` (text, unique)
    - `full_name` (text) - imię i nazwisko
    - `role` (text) - 'store_manager', 'salesperson', 'operator', 'admin'
    - `store_id` (uuid) - przypisany sklep (dla kierowników)
    - `active` (boolean)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 3. `products` - Produkty
    - `id` (uuid, primary key)
    - `name` (text) - nazwa produktu
    - `code` (text, unique) - kod produktu
    - `category` (text) - kategoria (mięso, wędliny, itp.)
    - `unit` (text) - jednostka (kg, szt)
    - `base_price` (decimal) - cena bazowa
    - `active` (boolean)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 4. `special_prices` - Ceny Specjalne
    - `id` (uuid, primary key)
    - `store_id` (uuid) - sklep
    - `product_id` (uuid) - produkt
    - `special_price` (decimal) - cena specjalna
    - `valid_from` (timestamptz) - ważna od
    - `valid_to` (timestamptz) - ważna do
    - `created_at` (timestamptz)
  
  ### 5. `orders` - Zamówienia
    - `id` (uuid, primary key)
    - `order_number` (text, unique) - numer zamówienia
    - `store_id` (uuid) - sklep
    - `created_by` (uuid) - kto utworzył
    - `status` (text) - 'draft', 'sent', 'pending_confirmation', 'confirmed', 'partially_confirmed', 'rejected', 'archived'
    - `requires_confirmation` (boolean) - czy wymaga potwierdzenia
    - `total_amount` (decimal) - kwota całkowita
    - `voice_transcript` (text) - transkrypcja głosowa
    - `notes` (text) - uwagi
    - `sent_at` (timestamptz)
    - `confirmed_at` (timestamptz)
    - `delivery_date` (date)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 6. `order_items` - Pozycje Zamówienia
    - `id` (uuid, primary key)
    - `order_id` (uuid) - zamówienie
    - `product_id` (uuid) - produkt
    - `quantity` (decimal) - ilość zamówiona
    - `unit` (text) - jednostka
    - `unit_price` (decimal) - cena jednostkowa
    - `total_price` (decimal) - cena całkowita
    - `confirmed_quantity` (decimal) - ilość potwierdzona
    - `status` (text) - 'pending', 'confirmed', 'partially_confirmed', 'rejected'
    - `created_at` (timestamptz)
  
  ### 7. `order_history` - Historia Zamówień
    - `id` (uuid, primary key)
    - `order_id` (uuid)
    - `action` (text) - typ akcji
    - `performed_by` (uuid) - kto wykonał
    - `details` (jsonb) - szczegóły zmiany
    - `created_at` (timestamptz)
  
  ### 8. `salesperson_stores` - Przypisania Handlowców do Sklepów
    - `salesperson_id` (uuid)
    - `store_id` (uuid)
    - `created_at` (timestamptz)
    - PRIMARY KEY (salesperson_id, store_id)
  
  ## Zabezpieczenia (RLS)
  
  - Włączenie RLS dla wszystkich tabel
  - Polityki dla kierowników sklepów (dostęp do własnego sklepu)
  - Polityki dla handlowców (dostęp do przypisanych sklepów)
  - Polityki dla operatorów i adminów (pełen dostęp)
*/

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('store_manager', 'salesperson', 'operator', 'admin')),
  store_id uuid REFERENCES stores(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  category text NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Special prices table
CREATE TABLE IF NOT EXISTS special_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  special_price decimal(10,2) NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, product_id, valid_from)
);

ALTER TABLE special_prices ENABLE ROW LEVEL SECURITY;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id),
  created_by uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'pending_confirmation', 'confirmed', 'partially_confirmed', 'rejected', 'archived')),
  requires_confirmation boolean DEFAULT false,
  total_amount decimal(10,2) DEFAULT 0,
  voice_transcript text,
  notes text,
  sent_at timestamptz,
  confirmed_at timestamptz,
  delivery_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity decimal(10,2) NOT NULL,
  unit text NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  confirmed_quantity decimal(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'partially_confirmed', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order history table
CREATE TABLE IF NOT EXISTS order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL REFERENCES users(id),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Salesperson stores mapping
CREATE TABLE IF NOT EXISTS salesperson_stores (
  salesperson_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (salesperson_id, store_id)
);

ALTER TABLE salesperson_stores ENABLE ROW LEVEL SECURITY;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_special_prices_store_product ON special_prices(store_id, product_id);

-- RLS Policies

-- Stores policies
CREATE POLICY "Users can view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins and operators can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Authenticated users can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Special prices policies
CREATE POLICY "Store managers can view their store special prices"
  ON special_prices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.store_id = special_prices.store_id
    )
  );

CREATE POLICY "Salespersons can view assigned stores special prices"
  ON special_prices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salesperson_stores 
      WHERE salesperson_stores.salesperson_id = auth.uid() 
      AND salesperson_stores.store_id = special_prices.store_id
    )
  );

CREATE POLICY "Admins and operators can manage special prices"
  ON special_prices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
    )
  );

-- Orders policies
CREATE POLICY "Store managers can view their store orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.store_id = orders.store_id
    )
  );

CREATE POLICY "Store managers can create orders for their store"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.store_id = orders.store_id
      AND users.role = 'store_manager'
    )
  );

CREATE POLICY "Store managers can update their draft orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.store_id = orders.store_id
    ) AND status = 'draft'
  );

CREATE POLICY "Salespersons can view assigned stores orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salesperson_stores 
      WHERE salesperson_stores.salesperson_id = auth.uid() 
      AND salesperson_stores.store_id = orders.store_id
    )
  );

CREATE POLICY "Operators and admins can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
    )
  );

-- Order items policies
CREATE POLICY "Users can view order items for orders they can see"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.store_id = orders.store_id)
        OR EXISTS (SELECT 1 FROM salesperson_stores WHERE salesperson_stores.salesperson_id = auth.uid() AND salesperson_stores.store_id = orders.store_id)
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator'))
      )
    )
  );

CREATE POLICY "Store managers can manage items for their draft orders"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN users ON users.store_id = orders.store_id 
      WHERE orders.id = order_items.order_id 
      AND users.id = auth.uid() 
      AND orders.status = 'draft'
    )
  );

CREATE POLICY "Operators and admins can manage all order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
    )
  );

-- Order history policies
CREATE POLICY "Users can view history for orders they can see"
  ON order_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_history.order_id 
      AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.store_id = orders.store_id)
        OR EXISTS (SELECT 1 FROM salesperson_stores WHERE salesperson_stores.salesperson_id = auth.uid() AND salesperson_stores.store_id = orders.store_id)
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator'))
      )
    )
  );

CREATE POLICY "Authenticated users can create order history"
  ON order_history FOR INSERT
  TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- Salesperson stores policies
CREATE POLICY "Salespersons can view their assignments"
  ON salesperson_stores FOR SELECT
  TO authenticated
  USING (salesperson_id = auth.uid());

CREATE POLICY "Admins can manage salesperson assignments"
  ON salesperson_stores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
BEGIN
  new_number := 'RO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();