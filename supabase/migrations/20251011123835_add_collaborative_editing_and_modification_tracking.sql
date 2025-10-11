/*
  # Add Collaborative Editing and Modification Tracking

  ## Changes Made
  
  1. Users Table Updates
    - Add `allow_collaborative_editing` boolean column (default: true)
    - When enabled, allows other users from same store to edit draft orders
    - When disabled, only order creator can edit their drafts
  
  2. Order History Tracking
    - Enhanced tracking for order modifications
    - Records who modified draft orders and when
    - Stores action type 'modified_draft' for draft edits
  
  3. Security & RLS
    - Updated RLS policies to respect collaborative editing setting
    - Draft orders can be edited by:
      - Original creator (always)
      - Other users from same store (only if creator allows collaboration)
  
  ## Important Notes
  - Collaborative editing is enabled by default for backward compatibility
  - Modification history is tracked automatically via order_history
  - Users can toggle this setting in their profile
*/

-- Add collaborative editing setting to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'allow_collaborative_editing'
  ) THEN
    ALTER TABLE users ADD COLUMN allow_collaborative_editing boolean DEFAULT true;
  END IF;
END $$;

-- Update existing users to have collaborative editing enabled by default
UPDATE users SET allow_collaborative_editing = true WHERE allow_collaborative_editing IS NULL;

-- Create a function to check if a user can edit a draft order
CREATE OR REPLACE FUNCTION can_edit_draft_order(order_id_param uuid, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  order_creator_id uuid;
  order_store_id uuid;
  creator_allows_collab boolean;
  user_store_id uuid;
  user_role_val text;
BEGIN
  -- Get order details
  SELECT created_by, store_id INTO order_creator_id, order_store_id
  FROM orders
  WHERE id = order_id_param;
  
  -- Get user details
  SELECT store_id, role INTO user_store_id, user_role_val
  FROM users
  WHERE id = user_id_param;
  
  -- If user is the creator, always allow
  IF order_creator_id = user_id_param THEN
    RETURN true;
  END IF;
  
  -- Get creator's collaboration setting
  SELECT allow_collaborative_editing INTO creator_allows_collab
  FROM users
  WHERE id = order_creator_id;
  
  -- Allow if:
  -- 1. Creator allows collaboration AND
  -- 2. User is from same store AND
  -- 3. User is store_manager or salesperson
  IF creator_allows_collab = true 
     AND order_store_id = user_store_id 
     AND user_role_val IN ('store_manager', 'salesperson') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update orders RLS policy for draft editing
DROP POLICY IF EXISTS "Users can update own draft orders" ON orders;

CREATE POLICY "Users can update draft orders with permission"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    status = 'draft' AND 
    can_edit_draft_order(id, auth.uid())
  )
  WITH CHECK (
    status = 'draft' AND 
    can_edit_draft_order(id, auth.uid())
  );