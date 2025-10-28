/*
  # Naprawa polityk UPDATE dla zamówień - dodanie WITH CHECK
  
  Polityki UPDATE muszą mieć zarówno USING jak i WITH CHECK, aby umożliwić zmianę statusu zamówienia.
  
  1. Changes
    - Dodanie WITH CHECK do polityk UPDATE dla store managers
    - Umożliwienie zmiany statusu z 'notatnik' na 'draft' (wysłanie do hurtowni)
*/

-- ============================================================
-- Aktualizacja polityki dla store managers
-- ============================================================
DROP POLICY IF EXISTS "Store managers can update their draft orders" ON orders;

CREATE POLICY "Store managers can update their draft orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (status = ANY (ARRAY['draft'::text, 'notatnik'::text]))
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = orders.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = orders.store_id
    )
  );

-- ============================================================
-- Aktualizacja polityki dla salespersons
-- ============================================================
DROP POLICY IF EXISTS "Salespersons can update orders from assigned stores" ON orders;

CREATE POLICY "Salespersons can update orders from assigned stores"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON u.id = ss.salesperson_id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ss.store_id = orders.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON u.id = ss.salesperson_id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ss.store_id = orders.store_id
    )
  );