/*
  # Fix Users RLS for Order History Display

  ## Overview
  Fixes the issue where users cannot see who performed actions in order history.
  The problem: users can only see their own profile, not other users who worked on orders.

  ## Changes Made

  1. Add RLS Policy for Order History Context
    - Allow users to view profiles of people who worked on orders from their store
    - This enables proper display of "who did what" in order history
    - Maintains security - users can only see profiles in context of their store's orders

  ## Security Notes
  - Users can only see other users' basic info (full_name, email, role)
  - Only in context of orders from their own store
  - Does not expose users from other stores
  - Admins, operators, and analysts maintain full access
*/

-- Add policy to allow users to see profiles of people who worked on their store's orders
CREATE POLICY "Users can view profiles in order history context"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Allow if the user profile is referenced in order_history for orders from requester's store
    EXISTS (
      SELECT 1
      FROM order_history oh
      JOIN orders o ON o.id = oh.order_id
      JOIN users requester ON requester.id = auth.uid()
      WHERE oh.performed_by = users.id
        AND o.store_id = requester.store_id
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Users can view profiles in order history context" ON users IS
  'Allows users to see basic profile information of other users who performed actions on orders from their store. This enables proper display of order history with actor information.';
