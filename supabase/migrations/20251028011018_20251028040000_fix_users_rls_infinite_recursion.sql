/*
  # Fix Infinite Recursion in Users RLS

  ## Overview
  Removes the problematic policy that caused infinite recursion and replaces it with
  a safer approach using a security definer function.

  ## Problem
  The previous policy "Users can view profiles in order history context" caused
  infinite recursion because it joined to the users table within the users table policy.

  ## Solution
  1. Drop the problematic policy
  2. Create a security definer function that bypasses RLS
  3. Add a simpler policy that allows users from the same store to see each other

  ## Security
  - Users can only see profiles of users from the same store
  - This is safe and matches business logic
  - Maintains full security while fixing the recursion issue
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in order history context" ON users;

-- Create a function to get current user's store_id (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_current_user_store_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT store_id FROM users WHERE id = auth.uid();
$$;

-- Create a function to check if user is salesperson for a store (bypasses RLS)
CREATE OR REPLACE FUNCTION is_salesperson_for_store(check_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM salesperson_stores
    WHERE salesperson_id = auth.uid()
      AND store_id = check_store_id
  );
$$;

-- Create a simpler, safer policy using the security definer functions
CREATE POLICY "Users can view profiles from same store"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Same store as current user
    users.store_id = get_current_user_store_id()
    OR
    -- Or current user is salesperson assigned to this user's store
    is_salesperson_for_store(users.store_id)
  );

-- Add comment
COMMENT ON POLICY "Users can view profiles from same store" ON users IS
  'Allows users to see profiles of other users from the same store or stores they are assigned to as salesperson. Uses SECURITY DEFINER functions to avoid infinite recursion.';
