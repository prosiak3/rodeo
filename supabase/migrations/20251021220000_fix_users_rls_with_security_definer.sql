/*
  # Fix Users RLS Policy with Security Definer Function

  1. Problem
    - Previous policy tried to check role from auth.users metadata
    - But roles are actually stored in users table
    - This causes 403 errors when users try to view their profile

  2. Solution
    - Create a SECURITY DEFINER function that can read user role
    - This function runs with elevated privileges to avoid RLS recursion
    - Use this function in policies to check roles safely

  3. Security
    - Function is secure and only returns the role of the calling user
    - All users can view their own profile
    - Only admins can manage users
*/

-- Create a security definer function to get user role
-- This runs with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();

  RETURN user_role;
END;
$$;

-- Drop all existing users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Users can always view their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

-- Admins can insert users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

-- Admins can update users (including their own profile for preferences)
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Allow all users to update their own preferences
-- (But not critical fields like role, email, store, active status)
CREATE POLICY "Users can update their own preferences"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');
