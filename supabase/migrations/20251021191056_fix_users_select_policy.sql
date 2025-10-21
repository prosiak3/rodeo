/*
  # Fix Users SELECT Policy Circular Dependency

  1. Problem
    - Current policy "Admins and operators can view all users" has circular dependency
    - It queries the users table to check if user is admin/operator
    - This creates infinite recursion preventing admins from viewing users list

  2. Solution
    - Drop the problematic policy
    - Create new policy using auth.jwt() to check role from JWT metadata
    - This avoids recursive query to users table

  3. Security
    - Maintains same access control: only admin/operator can view all users
    - Users can still view their own profile
    - No security reduction, just fixes implementation
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins and operators can view all users" ON users;

-- Create new policy that checks role from JWT metadata or direct comparison
-- This avoids the circular dependency
CREATE POLICY "Admins and operators can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- User can see their own record
    auth.uid() = id
    OR
    -- Or if they have admin/operator role in their JWT metadata
    (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'operator'))
    OR
    -- Or check directly in auth.users metadata (stored in raw_app_metadata)
    (
      EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND au.raw_app_meta_data->>'role' IN ('admin', 'operator')
      )
    )
  );

-- Also ensure the "Users can view their own profile" policy doesn't conflict
-- Keep it simple since it's already covered in the above policy
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Recreate if needed for clarity (though covered by above policy)
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
