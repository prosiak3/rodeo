/*
  # Add notatnik status support to order_items RLS policies

  1. Changes
    - Drop existing "Store managers can manage items for their draft orders" policy
    - Create new policy that allows managing items for both 'draft' and 'notatnik' status orders
    - This allows users to add items to notebook orders via swipe gesture

  2. Security
    - Maintains same security model - only store managers can manage their own orders
    - Extends support from just 'draft' to include 'notatnik' status
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Store managers can manage items for their draft orders" ON order_items;

-- Create new policy that supports both draft and notatnik
CREATE POLICY "Store managers can manage items for their draft and notatnik orders"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders
      JOIN users ON users.store_id = orders.store_id
      WHERE orders.id = order_items.order_id
        AND users.id = auth.uid()
        AND orders.status IN ('draft', 'notatnik')
    )
  );