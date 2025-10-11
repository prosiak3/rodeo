/*
  # Revert orders update policy

  1. Changes
    - Restore original update policy for store managers
    - Remove references to 'uzupełnione' status

  2. Security
    - Maintains existing security model
*/

-- Drop the modified policy
DROP POLICY IF EXISTS "Store managers can update their orders" ON orders;

-- Recreate the original policy
CREATE POLICY "Store managers can update their draft orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.store_id = orders.store_id
    )
    AND status = 'draft'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.store_id = orders.store_id
    )
    AND status IN ('draft', 'sent')
  );