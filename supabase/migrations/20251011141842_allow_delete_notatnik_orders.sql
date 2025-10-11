/*
  # Allow deleting notatnik orders

  1. Changes
    - Drop existing DELETE policies for orders
    - Create new policies that allow deleting both 'draft' and 'notatnik' status orders
    - Store managers can delete their own draft and notatnik orders
    - Salespersons can delete draft and notatnik orders from assigned stores

  2. Security
    - Maintains same security model - only authorized users can delete their orders
    - Extends support from just 'draft' to include 'notatnik' status
*/

-- Drop existing DELETE policies
DROP POLICY IF EXISTS "Store managers can delete their draft orders" ON orders;
DROP POLICY IF EXISTS "Salespersons can delete draft orders from assigned stores" ON orders;

-- Create new policies that support both draft and notatnik
CREATE POLICY "Store managers can delete their draft and notatnik orders"
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
    AND status IN ('draft', 'notatnik')
  );

CREATE POLICY "Salespersons can delete draft and notatnik orders from assigned stores"
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
    AND status IN ('draft', 'notatnik')
  );