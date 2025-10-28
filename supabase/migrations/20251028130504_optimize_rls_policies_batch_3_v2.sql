/*
  # Optymalizacja polityk RLS - Batch 3 (poprawione)
*/

-- ============================================================
-- DELIVERIES
-- ============================================================
DROP POLICY IF EXISTS "Drivers can update own deliveries" ON deliveries;
CREATE POLICY "Drivers can update own deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (
    driver_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'driver'
    )
  );

DROP POLICY IF EXISTS "Operators can delete deliveries" ON deliveries;
CREATE POLICY "Operators can delete deliveries"
  ON deliveries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Staff can create deliveries" ON deliveries;
CREATE POLICY "Staff can create deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Users can view relevant deliveries" ON deliveries;
CREATE POLICY "Users can view relevant deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND (
        u.role IN ('admin', 'operator')
        OR (u.role = 'driver' AND deliveries.driver_id = u.id)
        OR (u.role = 'store_manager' AND EXISTS (
          SELECT 1 FROM orders o
          WHERE o.id = deliveries.order_id
          AND o.store_id = u.store_id
        ))
      )
    )
  );

-- ============================================================
-- PRICE_LISTS
-- ============================================================
DROP POLICY IF EXISTS "Only admin/operator can delete price lists" ON price_lists;
CREATE POLICY "Only admin/operator can delete price lists"
  ON price_lists FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Only admin/operator can insert price lists" ON price_lists;
CREATE POLICY "Only admin/operator can insert price lists"
  ON price_lists FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Only admin/operator can update price lists" ON price_lists;
CREATE POLICY "Only admin/operator can update price lists"
  ON price_lists FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

-- ============================================================
-- PRICE_LIST_ASSIGNMENTS
-- ============================================================
DROP POLICY IF EXISTS "Admin can do everything with assignments" ON price_list_assignments;
CREATE POLICY "Admin can do everything with assignments"
  ON price_list_assignments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Salesperson can manage only their assignments" ON price_list_assignments;
CREATE POLICY "Salesperson can manage only their assignments"
  ON price_list_assignments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_store_assignments ssa ON ssa.salesperson_id = u.id
      WHERE u.id = (select auth.uid())
      AND u.role = 'salesperson'
      AND ssa.store_id = price_list_assignments.store_id
    )
  );

DROP POLICY IF EXISTS "Warehouse can manage warehouse and salesperson assignments" ON price_list_assignments;
CREATE POLICY "Warehouse can manage warehouse and salesperson assignments"
  ON price_list_assignments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'warehouse'
    )
  );

DROP POLICY IF EXISTS "Warehouse can view all assignments" ON price_list_assignments;
CREATE POLICY "Warehouse can view all assignments"
  ON price_list_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'warehouse'
    )
  );

-- ============================================================
-- SALESPERSON_STORE_ASSIGNMENTS
-- ============================================================
DROP POLICY IF EXISTS "Admin and warehouse can manage all salesperson assignments" ON salesperson_store_assignments;
CREATE POLICY "Admin and warehouse can manage all salesperson assignments"
  ON salesperson_store_assignments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'warehouse')
    )
  );

DROP POLICY IF EXISTS "Salesperson can view their own assignments" ON salesperson_store_assignments;
CREATE POLICY "Salesperson can view their own assignments"
  ON salesperson_store_assignments FOR SELECT
  TO authenticated
  USING (salesperson_id = (select auth.uid()));

-- ============================================================
-- PRODUCT_ORDER_STATS
-- ============================================================
DROP POLICY IF EXISTS "Operators and admins can view all stats" ON product_order_stats;
CREATE POLICY "Operators and admins can view all stats"
  ON product_order_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Store managers can view their store stats" ON product_order_stats;
CREATE POLICY "Store managers can view their store stats"
  ON product_order_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = product_order_stats.store_id
    )
  );