/*
  # Add Delete Policy for Draft Orders

  1. Changes
    - Add policy allowing store managers to delete their own draft orders
    - Add policy allowing salespersons to delete draft orders from their assigned stores

  2. Security
    - Only draft orders can be deleted
    - Store managers can only delete orders from their store
    - Salespersons can only delete orders from stores they manage
*/

-- Store managers can delete their draft orders
CREATE POLICY "Store managers can delete their draft orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.store_id = orders.store_id
        AND users.role = 'store_manager'
    )
    AND status = 'draft'
  );

-- Salespersons can delete draft orders from assigned stores
CREATE POLICY "Salespersons can delete draft orders from assigned stores"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM salesperson_stores
      WHERE salesperson_stores.salesperson_id = auth.uid()
        AND salesperson_stores.store_id = orders.store_id
    )
    AND status = 'draft'
  );