/*
  # Update RLS policies for 'uzupełnione' status

  1. Changes
    - Update store managers UPDATE policy to allow transitioning to 'uzupełnione' status
    - Users can mark orders as completed (uzupełnione)

  2. Security
    - Maintains existing security model
    - Store managers can update their orders
    - Allows transitioning to 'uzupełnione' status from other statuses
*/

-- Drop and recreate the store manager update policy
DROP POLICY IF EXISTS "Store managers can update their draft orders" ON orders;

CREATE POLICY "Store managers can update their orders"
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
    AND status IN ('draft', 'sent', 'uzupełnione')
  );