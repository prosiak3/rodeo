/*
  # Fix infinite recursion in users RLS policy

  1. Problem
    - Policy "Admins and analysts can view all users" causes infinite recursion
    - When checking user role, it queries users table, which triggers the same policy again
  
  2. Solution
    - Create a SECURITY DEFINER function that bypasses RLS
    - Use this function in the policy to safely check user role
  
  3. Security
    - Function only returns current user's role, not sensitive data
    - SECURITY DEFINER allows reading own user record without triggering RLS recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins and analysts can view all users" ON users;

-- Create a safe function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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

-- Recreate the policy using the safe function
CREATE POLICY "Admins and analysts can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'analyst')
  );
