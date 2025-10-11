/*
  # Allow notatnik to draft conversion

  1. Changes
    - Update orders policy to allow updating orders with status 'notatnik'
    - This allows converting notebook orders to draft orders
    - Store managers can convert their notatnik orders to draft

  2. Security
    - Users can only update orders from their own store
    - Can update orders with status 'notatnik' or 'draft'
    - Can change status to 'draft' or 'sent'
*/

DROP POLICY IF EXISTS "Store managers can update their draft orders" ON orders;

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
    AND (status = 'draft' OR status = 'notatnik')
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