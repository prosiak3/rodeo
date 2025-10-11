/*
  # Fix Orders Update Policy for Status Changes

  1. Changes
    - Drop the existing restrictive update policy for store managers
    - Create new policy that allows store managers to update draft orders AND change status from draft to sent
    - This allows the "Zamów w hurtowni" button to work correctly

  2. Security
    - Store managers can still only update orders from their own store
    - They can only update orders that are currently in draft status
    - They can change status from draft to sent (for submitting orders)
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Store managers can update their draft orders" ON orders;

-- Create new policy that allows status changes
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
    AND (status = 'draft' OR status = 'sent')
  );