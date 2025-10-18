/*
  # Add Analyst Read Access to Order Items

  1. Changes
    - Update SELECT policy for order_items to include analyst role
    
  2. Security
    - Analysts can read all order_items (for analytics)
    - No write/update/delete permissions for analysts
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view order items for orders they can see" ON order_items;

-- Recreate policy with analyst support
CREATE POLICY "Users can view order items for orders they can see"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        -- Store managers can see their store's order items
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.store_id = orders.store_id
        )
        OR
        -- Salespersons can see assigned stores' order items
        EXISTS (
          SELECT 1 FROM salesperson_stores
          WHERE salesperson_stores.salesperson_id = auth.uid()
          AND salesperson_stores.store_id = orders.store_id
        )
        OR
        -- Admins and operators can see all order items
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'operator')
        )
        OR
        -- Analysts can see all order items
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'analyst'
        )
      )
    )
  );
