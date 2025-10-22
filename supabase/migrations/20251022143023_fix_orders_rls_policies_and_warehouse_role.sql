/*
  # Naprawa polityk RLS dla zamówień i roli warehouse

  1. Zmiany
    - Dodanie roli 'warehouse' do polityk zarządzania zamówieniami
    - Zaktualizowanie polityk aby używały salesperson_store_assignments zamiast salesperson_stores
    - Upewnienie się że admin i warehouse widzą wszystkie zamówienia
    
  2. Reguły Biznesowe
    - Admin i warehouse (operator) mogą zarządzać wszystkimi zamówieniami
    - Handlowcy widzą zamówienia tylko ze swoich przypisanych sklepów
    - Store manager widzi tylko zamówienia ze swojego sklepu
*/

-- Usuń starą politykę dla operatorów i adminów
DROP POLICY IF EXISTS "Operators and admins can manage all orders" ON orders;

-- Utwórz nową politykę dla adminów, warehouse i operatorów
CREATE POLICY "Admins, warehouse and operators can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'warehouse', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'warehouse', 'operator')
    )
  );

-- Zaktualizuj politykę handlowców aby używała nowej tabeli
DROP POLICY IF EXISTS "Salespersons can view assigned stores orders" ON orders;

CREATE POLICY "Salespersons can view assigned stores orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salesperson_store_assignments
      WHERE salesperson_store_assignments.salesperson_id = auth.uid() 
      AND salesperson_store_assignments.store_id = orders.store_id
    )
  );

-- Zaktualizuj politykę usuwania przez handlowców
DROP POLICY IF EXISTS "Salespersons can delete draft and notatnik orders from assigned" ON orders;

CREATE POLICY "Salespersons can delete draft and notatnik orders from assigned stores"
  ON orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salesperson_store_assignments
      WHERE salesperson_store_assignments.salesperson_id = auth.uid() 
      AND salesperson_store_assignments.store_id = orders.store_id
    )
    AND status IN ('draft', 'notatnik')
  );

-- Dodaj politykę dla handlowców do tworzenia zamówień w przypisanych sklepach
DROP POLICY IF EXISTS "Salespersons can create orders for assigned stores" ON orders;

CREATE POLICY "Salespersons can create orders for assigned stores"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salesperson_store_assignments
      WHERE salesperson_store_assignments.salesperson_id = auth.uid() 
      AND salesperson_store_assignments.store_id = orders.store_id
    )
  );

-- Dodaj politykę dla handlowców do edycji zamówień w przypisanych sklepach
DROP POLICY IF EXISTS "Salespersons can update orders from assigned stores" ON orders;

CREATE POLICY "Salespersons can update orders from assigned stores"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salesperson_store_assignments
      WHERE salesperson_store_assignments.salesperson_id = auth.uid() 
      AND salesperson_store_assignments.store_id = orders.store_id
    )
    AND status IN ('draft', 'notatnik')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salesperson_store_assignments
      WHERE salesperson_store_assignments.salesperson_id = auth.uid() 
      AND salesperson_store_assignments.store_id = orders.store_id
    )
    AND status IN ('draft', 'sent', 'notatnik')
  );
