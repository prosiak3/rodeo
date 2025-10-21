/*
  # Rozszerzenie uprawnień do zarządzania produktami

  ## Zmiany

  1. Nowe polityki RLS dla tabeli products
    - Admin, operator i salesperson mogą przeglądać WSZYSTKIE produkty (również nieaktywne)
    - Admin i operator mogą dodawać nowe produkty
    - Admin i operator mogą aktualizować produkty
    - Admin i operator mogą usuwać produkty
    - Salesperson może tylko przeglądać produkty

  2. Rozszerzenie polityk dla special_prices
    - Salesperson może zarządzać cenami dla przypisanych sklepów

  ## Bezpieczeństwo
  - Zachowanie istniejących polityk dla zwykłych użytkowników
  - Tylko użytkownicy z odpowiednimi rolami mają dostęp do zarządzania
*/

-- Usuń starą politykę i dodaj nowe dla przeglądania produktów
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;

-- Zwykli użytkownicy (store_manager) widzą tylko aktywne produkty
CREATE POLICY "Store managers can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'store_manager'
    )
  );

-- Admin, operator i salesperson widzą WSZYSTKIE produkty
CREATE POLICY "Admin, operator and salesperson can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator', 'salesperson')
    )
  );

-- Admin i operator mogą dodawać produkty
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Admin and operator can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

-- Admin i operator mogą aktualizować produkty
CREATE POLICY "Admin and operator can update products"
  ON products FOR UPDATE
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

-- Admin i operator mogą usuwać produkty
CREATE POLICY "Admin and operator can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

-- Rozszerzenie polityk dla special_prices - salesperson może zarządzać cenami dla przypisanych sklepów
CREATE POLICY "Salesperson can manage prices for assigned stores"
  ON special_prices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON ss.salesperson_id = u.id
      WHERE u.id = auth.uid()
      AND u.role = 'salesperson'
      AND ss.store_id = special_prices.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON ss.salesperson_id = u.id
      WHERE u.id = auth.uid()
      AND u.role = 'salesperson'
      AND ss.store_id = special_prices.store_id
    )
  );
