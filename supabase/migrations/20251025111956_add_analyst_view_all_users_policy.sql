/*
  # Add analyst permission to view all users

  1. Changes
    - Add SELECT policy for analysts to view all users in the system
    - This is required for SessionsBrowserPanel to show user details when analyst views all sessions
  
  2. Security
    - Only users with role 'analyst' or 'admin' can view all users
    - Regular users can still only see their own profile
*/

-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create new policy for both admin and analyst
CREATE POLICY "Admins and analysts can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'analyst')
    )
  );
