/*
  # Restrict User Management to Admin Only

  1. Changes
    - Remove operator from user management permissions
    - Only admin can insert, update, delete users
    - Only admin can view all users
    - Users can still view their own profile

  2. Security
    - Strengthens access control by limiting to admin only
    - Prevents operators from managing user accounts
    - Maintains self-view capability for all users
*/

-- Drop existing policies for users table
DROP POLICY IF EXISTS "Admins and operators can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Users can view their own profile only
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Only admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can insert users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can update users
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_app_meta_data->>'role' = 'admin'
    )
  );
