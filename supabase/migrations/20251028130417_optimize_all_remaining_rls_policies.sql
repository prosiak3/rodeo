/*
  # Optymalizacja pozostałych polityk RLS
  
  Zamienia auth.uid() na (select auth.uid()) dla wszystkich pozostałych tabel
*/

-- ============================================================
-- SALESPERSON_STORES
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage salesperson assignments" ON salesperson_stores;
CREATE POLICY "Admins can manage salesperson assignments"
  ON salesperson_stores
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Salespersons can view their assignments" ON salesperson_stores;
CREATE POLICY "Salespersons can view their assignments"
  ON salesperson_stores FOR SELECT
  TO authenticated
  USING (salesperson_id = (select auth.uid()));

-- ============================================================
-- AUTO_ORDER_FEEDBACK
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all feedback" ON auto_order_feedback;
CREATE POLICY "Admins can view all feedback"
  ON auto_order_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can provide feedback for their store" ON auto_order_feedback;
CREATE POLICY "Users can provide feedback for their store"
  ON auto_order_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.store_id = auto_order_feedback.store_id
    )
  );

-- ============================================================
-- VOICE_LEARNING_CORRECTIONS
-- ============================================================
DROP POLICY IF EXISTS "Users can record their own voice corrections" ON voice_learning_corrections;
CREATE POLICY "Users can record their own voice corrections"
  ON voice_learning_corrections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view corrections from their store" ON voice_learning_corrections;
CREATE POLICY "Users can view corrections from their store"
  ON voice_learning_corrections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.store_id = voice_learning_corrections.store_id
    )
  );

-- ============================================================
-- USER_EVENTS
-- ============================================================
DROP POLICY IF EXISTS "Analysts and admins view all events" ON user_events;
CREATE POLICY "Analysts and admins view all events"
  ON user_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users insert own events" ON user_events;
CREATE POLICY "Users insert own events"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- OCCASION_INTERACTIONS
-- ============================================================
DROP POLICY IF EXISTS "Analysts can view all interactions" ON occasion_interactions;
CREATE POLICY "Analysts can view all interactions"
  ON occasion_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users can insert their own interactions" ON occasion_interactions;
CREATE POLICY "Users can insert their own interactions"
  ON occasion_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- STORE_GROUPS
-- ============================================================
DROP POLICY IF EXISTS "Admin and operator can manage store groups" ON store_groups;
CREATE POLICY "Admin and operator can manage store groups"
  ON store_groups
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Store managers and salespersons can view store groups" ON store_groups;
CREATE POLICY "Store managers and salespersons can view store groups"
  ON store_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('store_manager', 'salesperson')
    )
  );

-- ============================================================
-- STORE_GROUP_MEMBERS
-- ============================================================
DROP POLICY IF EXISTS "Admin and operator can manage group members" ON store_group_members;
CREATE POLICY "Admin and operator can manage group members"
  ON store_group_members
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Store managers and salespersons can view group members" ON store_group_members;
CREATE POLICY "Store managers and salespersons can view group members"
  ON store_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('store_manager', 'salesperson')
    )
  );

-- ============================================================
-- PROFANITY_WORDS
-- ============================================================
DROP POLICY IF EXISTS "Only admins can manage profanity words" ON profanity_words;
CREATE POLICY "Only admins can manage profanity words"
  ON profanity_words
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- ============================================================
-- VOICE_PHRASE_MAPPINGS
-- ============================================================
DROP POLICY IF EXISTS "Users can add voice phrase mappings for their store" ON voice_phrase_mappings;
CREATE POLICY "Users can add voice phrase mappings for their store"
  ON voice_phrase_mappings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.store_id = voice_phrase_mappings.store_id
    )
  );

DROP POLICY IF EXISTS "Users can view phrase mappings from their store" ON voice_phrase_mappings;
CREATE POLICY "Users can view phrase mappings from their store"
  ON voice_phrase_mappings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.store_id = voice_phrase_mappings.store_id
    )
  );

-- ============================================================
-- PROFANITY_LOGS
-- ============================================================
DROP POLICY IF EXISTS "Only admins can view profanity logs" ON profanity_logs;
CREATE POLICY "Only admins can view profanity logs"
  ON profanity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can log their profanity" ON profanity_logs;
CREATE POLICY "Users can log their profanity"
  ON profanity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));