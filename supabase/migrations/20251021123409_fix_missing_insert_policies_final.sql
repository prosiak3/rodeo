/*
  # Fix Missing INSERT Policies (Final)

  1. Problem
    - Several tables have RLS enabled but no INSERT policy
    - This causes 403 Forbidden errors when trying to insert data

  2. Changes
    - Add INSERT policies to all tables that need them
    - Use correct column names based on actual table structure

  3. Security
    - Store-based tables check user's store_id
    - System tables allow all authenticated users
*/

-- Auto order suggestions - users can create for their store
CREATE POLICY "Users can create auto order suggestions for their store"
  ON auto_order_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.store_id = auto_order_suggestions.store_id
    )
  );

-- Auto order feedback - users can provide for their store
CREATE POLICY "Users can provide feedback for their store"
  ON auto_order_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.store_id = auto_order_feedback.store_id
    )
  );

-- Auto order logs - system tracking (any authenticated user)
CREATE POLICY "System can log auto orders"
  ON auto_order_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Product stats - system can track
CREATE POLICY "System can update product stats"
  ON product_order_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Voice phrase mappings - users can add for their store
CREATE POLICY "Users can add voice phrase mappings for their store"
  ON voice_phrase_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.store_id = voice_phrase_mappings.store_id
    )
  );

-- Profanity logs - users can log their own
CREATE POLICY "Users can log their profanity"
  ON profanity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
