/*
  # Optymalizacja RLS policies - Batch 2 (Orders, Order Items, Order History)
  
  Zamienia auth.uid() na (select auth.uid()) dla lepszej wydajności
*/

-- Orders policies
DROP POLICY IF EXISTS "Admins, warehouse and operators can manage all orders" ON orders;
CREATE POLICY "Admins, warehouse and operators can manage all orders"
  ON orders
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator', 'warehouse')
    )
  );

DROP POLICY IF EXISTS "Analysts can view all orders" ON orders;
CREATE POLICY "Analysts can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'analyst'
    )
  );

DROP POLICY IF EXISTS "Salespersons can create orders for assigned stores" ON orders;
CREATE POLICY "Salespersons can create orders for assigned stores"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON u.id = ss.salesperson_id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ss.store_id = orders.store_id
    )
  );

DROP POLICY IF EXISTS "Salespersons can delete draft and notatnik orders from assigned" ON orders;
CREATE POLICY "Salespersons can delete draft and notatnik orders from assigned"
  ON orders FOR DELETE
  TO authenticated
  USING (
    status IN ('draft', 'notatnik')
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON u.id = ss.salesperson_id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ss.store_id = orders.store_id
    )
  );

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
  );

DROP POLICY IF EXISTS "Salespersons can view assigned stores orders" ON orders;
CREATE POLICY "Salespersons can view assigned stores orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON u.id = ss.salesperson_id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ss.store_id = orders.store_id
    )
  );

DROP POLICY IF EXISTS "Store managers can create orders for their store" ON orders;
CREATE POLICY "Store managers can create orders for their store"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = orders.store_id
    )
  );

DROP POLICY IF EXISTS "Store managers can delete their draft and notatnik orders" ON orders;
CREATE POLICY "Store managers can delete their draft and notatnik orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    status IN ('draft', 'notatnik')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = orders.store_id
    )
  );

DROP POLICY IF EXISTS "Store managers can update their draft orders" ON orders;
CREATE POLICY "Store managers can update their draft orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    status IN ('draft', 'notatnik')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = orders.store_id
    )
  );

DROP POLICY IF EXISTS "Store managers can view their store orders" ON orders;
CREATE POLICY "Store managers can view their store orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = orders.store_id
    )
  );

DROP POLICY IF EXISTS "Users can update draft orders with permission" ON orders;
CREATE POLICY "Users can update draft orders with permission"
  ON orders FOR UPDATE
  TO authenticated
  USING (can_edit_draft_order((select auth.uid()), id))
  WITH CHECK (can_edit_draft_order((select auth.uid()), id));

-- Order Items policies
DROP POLICY IF EXISTS "Operators and admins can manage all order items" ON order_items;
CREATE POLICY "Operators and admins can manage all order items"
  ON order_items
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator', 'warehouse')
    )
  );

DROP POLICY IF EXISTS "Store managers can manage items for their draft and notatnik or" ON order_items;
CREATE POLICY "Store managers can manage items for their draft and notatnik or"
  ON order_items
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN users u ON u.store_id = o.store_id
      WHERE o.id = order_items.order_id
      AND u.id = (select auth.uid())
      AND o.status IN ('draft', 'notatnik')
      AND u.role IN ('store_manager', 'salesperson')
    )
  );

DROP POLICY IF EXISTS "Users can view order items for orders they can see" ON order_items;
CREATE POLICY "Users can view order items for orders they can see"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN users u ON u.id = (select auth.uid())
      LEFT JOIN salesperson_stores ss ON ss.salesperson_id = u.id AND ss.store_id = o.store_id
      WHERE o.id = order_items.order_id
      AND (
        u.role IN ('admin', 'operator', 'warehouse', 'analyst')
        OR (u.role = 'store_manager' AND u.store_id = o.store_id)
        OR (u.role = 'salesperson' AND ss.salesperson_id IS NOT NULL)
      )
    )
  );

-- Order History policies
DROP POLICY IF EXISTS "Authenticated users can create order history" ON order_history;
CREATE POLICY "Authenticated users can create order history"
  ON order_history FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = performed_by);

DROP POLICY IF EXISTS "Users can view history for orders they can see" ON order_history;
CREATE POLICY "Users can view history for orders they can see"
  ON order_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN users u ON u.id = (select auth.uid())
      LEFT JOIN salesperson_stores ss ON ss.salesperson_id = u.id AND ss.store_id = o.store_id
      WHERE o.id = order_history.order_id
      AND (
        u.role IN ('admin', 'operator', 'warehouse', 'analyst')
        OR (u.role = 'store_manager' AND u.store_id = o.store_id)
        OR (u.role = 'salesperson' AND ss.salesperson_id IS NOT NULL)
      )
    )
  );