/*
  # Add Analyst Read Access to Orders

  1. Changes
    - Add SELECT policy for analyst role to read all orders
    
  2. Security
    - Analysts can only read (SELECT) orders, not modify them
    - Policy checks user role is 'analyst'
*/

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Analysts can view all orders" ON orders;

-- Allow analysts to read all orders
CREATE POLICY "Analysts can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );
