/*
  # Optymalizacja RLS policies - Batch 1 (Users, Products, Stores, Special Prices)
  
  1. Problem
    - Polityki RLS wywołują auth.uid() wielokrotnie dla każdego wiersza
    - Kolumna 'is_active' nie istnieje, poprawna nazwa to 'active'
    
  2. Rozwiązanie
    - Zamień auth.uid() na (select auth.uid())
    - Poprawa nazw kolumn
*/

-- Users table policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON users;
CREATE POLICY "Users can update their own preferences"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Products table policies
DROP POLICY IF EXISTS "Admin and operator can delete products" ON products;
CREATE POLICY "Admin and operator can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Admin and operator can insert products" ON products;
CREATE POLICY "Admin and operator can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Admin and operator can update products" ON products;
CREATE POLICY "Admin and operator can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Admin, operator and salesperson can view all products" ON products;
CREATE POLICY "Admin, operator and salesperson can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator', 'salesperson')
    )
  );

DROP POLICY IF EXISTS "Store managers can view active products" ON products;
CREATE POLICY "Store managers can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
    )
  );

-- Stores table policies
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
CREATE POLICY "Admins can manage stores"
  ON stores
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- Special prices policies
DROP POLICY IF EXISTS "Admins and operators can manage special prices" ON special_prices;
CREATE POLICY "Admins and operators can manage special prices"
  ON special_prices
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Salesperson can manage prices for assigned stores" ON special_prices;
CREATE POLICY "Salesperson can manage prices for assigned stores"
  ON special_prices
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON u.id = ss.salesperson_id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ss.store_id = special_prices.store_id
    )
  );

DROP POLICY IF EXISTS "Salespersons can view assigned stores special prices" ON special_prices;
CREATE POLICY "Salespersons can view assigned stores special prices"
  ON special_prices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON u.id = ss.salesperson_id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ss.store_id = special_prices.store_id
    )
  );

DROP POLICY IF EXISTS "Store managers can view their store special prices" ON special_prices;
CREATE POLICY "Store managers can view their store special prices"
  ON special_prices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = special_prices.store_id
    )
  );