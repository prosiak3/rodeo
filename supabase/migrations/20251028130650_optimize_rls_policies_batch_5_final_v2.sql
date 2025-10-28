/*
  # Optymalizacja polityk RLS - Batch 5 (ostatnia, poprawiona)
*/

-- ============================================================
-- AI_METRICS
-- ============================================================
DROP POLICY IF EXISTS "Admins and analysts can view all AI metrics" ON ai_metrics;
CREATE POLICY "Admins and analysts can view all AI metrics"
  ON ai_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert AI metrics" ON ai_metrics;
CREATE POLICY "Authenticated users can insert AI metrics"
  ON ai_metrics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- AI_MODEL_PERFORMANCE
-- ============================================================
DROP POLICY IF EXISTS "Admins and analysts can view model performance" ON ai_model_performance;
CREATE POLICY "Admins and analysts can view model performance"
  ON ai_model_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

-- ============================================================
-- VOICE_RECOGNITION_ATTEMPTS
-- ============================================================
DROP POLICY IF EXISTS "Analysts can view all attempts" ON voice_recognition_attempts;
CREATE POLICY "Analysts can view all attempts"
  ON voice_recognition_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users can insert their own attempts" ON voice_recognition_attempts;
CREATE POLICY "Users can insert their own attempts"
  ON voice_recognition_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own attempts" ON voice_recognition_attempts;
CREATE POLICY "Users can view own attempts"
  ON voice_recognition_attempts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- BANNER_INTERACTIONS
-- ============================================================
DROP POLICY IF EXISTS "Analysts can view all interactions" ON banner_interactions;
CREATE POLICY "Analysts can view all interactions"
  ON banner_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users can track their banner interactions" ON banner_interactions;
CREATE POLICY "Users can track their banner interactions"
  ON banner_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- USER_SESSION_GAPS
-- ============================================================
DROP POLICY IF EXISTS "Analysts can view all session gaps" ON user_session_gaps;
CREATE POLICY "Analysts can view all session gaps"
  ON user_session_gaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users can insert own session gaps" ON user_session_gaps;
CREATE POLICY "Users can insert own session gaps"
  ON user_session_gaps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own session gaps" ON user_session_gaps;
CREATE POLICY "Users can view own session gaps"
  ON user_session_gaps FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- PRICE_LIST_ITEMS
-- ============================================================
DROP POLICY IF EXISTS "Admin and warehouse can manage price list items" ON price_list_items;
CREATE POLICY "Admin and warehouse can manage price list items"
  ON price_list_items
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'warehouse')
    )
  );

-- ============================================================
-- EMAIL_NOTIFICATIONS
-- ============================================================
DROP POLICY IF EXISTS "Admins and operators can view all email logs" ON email_notifications;
CREATE POLICY "Admins and operators can view all email logs"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Analysts can view email logs" ON email_notifications;
CREATE POLICY "Analysts can view email logs"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'analyst'
    )
  );

-- ============================================================
-- SYSTEM_ANNOUNCEMENTS
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage announcements" ON system_announcements;
CREATE POLICY "Admins can manage announcements"
  ON system_announcements
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view active announcements" ON system_announcements;
CREATE POLICY "Users can view active announcements"
  ON system_announcements FOR SELECT
  TO authenticated
  USING (is_active = true AND now() BETWEEN active_from AND active_until);

-- ============================================================
-- USER_ANNOUNCEMENT_VIEWS
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all announcement views" ON user_announcement_views;
CREATE POLICY "Admins can view all announcement views"
  ON user_announcement_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can mark announcements as viewed" ON user_announcement_views;
CREATE POLICY "Users can mark announcements as viewed"
  ON user_announcement_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own announcement history" ON user_announcement_views;
CREATE POLICY "Users can view their own announcement history"
  ON user_announcement_views FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- SYSTEM_SETTINGS
-- ============================================================
DROP POLICY IF EXISTS "Only admins can insert system settings" ON system_settings;
CREATE POLICY "Only admins can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can update system settings" ON system_settings;
CREATE POLICY "Only admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- ============================================================
-- USER_SESSIONS
-- ============================================================
DROP POLICY IF EXISTS "Admins and analysts can disconnect sessions" ON user_sessions;
CREATE POLICY "Admins and analysts can disconnect sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Analysts and admins view all sessions" ON user_sessions;
CREATE POLICY "Analysts and admins view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users manage own sessions" ON user_sessions;
CREATE POLICY "Users manage own sessions"
  ON user_sessions
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- HELP_TOOLTIP_VIEWS
-- ============================================================
DROP POLICY IF EXISTS "Analysts can read all tooltip views" ON help_tooltip_views;
CREATE POLICY "Analysts can read all tooltip views"
  ON help_tooltip_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users can insert own tooltip views" ON help_tooltip_views;
CREATE POLICY "Users can insert own tooltip views"
  ON help_tooltip_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own tooltip views" ON help_tooltip_views;
CREATE POLICY "Users can update own tooltip views"
  ON help_tooltip_views FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own tooltip views" ON help_tooltip_views;
CREATE POLICY "Users can view own tooltip views"
  ON help_tooltip_views FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- HELP_CONTENT
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage help content" ON help_content;
CREATE POLICY "Admins can manage help content"
  ON help_content
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );