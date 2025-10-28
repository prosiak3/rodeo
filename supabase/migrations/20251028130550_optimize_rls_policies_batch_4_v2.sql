/*
  # Optymalizacja polityk RLS - Batch 4 (poprawione)
*/

-- ============================================================
-- AUTO_ORDER_SUGGESTIONS
-- ============================================================
DROP POLICY IF EXISTS "Operators and admins can view all suggestions" ON auto_order_suggestions;
CREATE POLICY "Operators and admins can view all suggestions"
  ON auto_order_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'operator')
    )
  );

DROP POLICY IF EXISTS "Store managers can view their suggestions" ON auto_order_suggestions;
CREATE POLICY "Store managers can view their suggestions"
  ON auto_order_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = auto_order_suggestions.store_id
    )
  );

DROP POLICY IF EXISTS "Users can create auto order suggestions for their store" ON auto_order_suggestions;
CREATE POLICY "Users can create auto order suggestions for their store"
  ON auto_order_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.store_id = auto_order_suggestions.store_id
    )
  );

-- ============================================================
-- AUTO_ORDER_LOGS
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all logs" ON auto_order_logs;
CREATE POLICY "Admins can view all logs"
  ON auto_order_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Store managers can view their store logs" ON auto_order_logs;
CREATE POLICY "Store managers can view their store logs"
  ON auto_order_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'store_manager'
      AND users.store_id = auto_order_logs.store_id
    )
  );

-- ============================================================
-- PATH_CLUSTERS
-- ============================================================
DROP POLICY IF EXISTS "Analysts and admins view all clusters" ON path_clusters;
CREATE POLICY "Analysts and admins view all clusters"
  ON path_clusters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

-- ============================================================
-- USER_PATHS
-- ============================================================
DROP POLICY IF EXISTS "Analysts and admins view all paths" ON user_paths;
CREATE POLICY "Analysts and admins view all paths"
  ON user_paths FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

-- ============================================================
-- PATH_CLUSTER_MEMBERS
-- ============================================================
DROP POLICY IF EXISTS "Analysts and admins view cluster members" ON path_cluster_members;
CREATE POLICY "Analysts and admins view cluster members"
  ON path_cluster_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

-- ============================================================
-- MARKETING_CAMPAIGNS
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage campaigns" ON marketing_campaigns;
CREATE POLICY "Admins can manage campaigns"
  ON marketing_campaigns
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Analysts and admins can view campaigns" ON marketing_campaigns;
CREATE POLICY "Analysts and admins can view campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

-- ============================================================
-- CAMPAIGN_INTERACTIONS
-- ============================================================
DROP POLICY IF EXISTS "Analysts can view all interactions" ON campaign_interactions;
CREATE POLICY "Analysts can view all interactions"
  ON campaign_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Users can insert their own interactions" ON campaign_interactions;
CREATE POLICY "Users can insert their own interactions"
  ON campaign_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- CAMPAIGN_CONVERSIONS
-- ============================================================
DROP POLICY IF EXISTS "Analysts can view all conversions" ON campaign_conversions;
CREATE POLICY "Analysts can view all conversions"
  ON campaign_conversions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'analyst')
    )
  );

-- ============================================================
-- OCCASION_TYPES
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage occasion types" ON occasion_types;
CREATE POLICY "Admins can manage occasion types"
  ON occasion_types
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- ============================================================
-- OCCASION_BANNERS
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage banners" ON occasion_banners;
CREATE POLICY "Admins can manage banners"
  ON occasion_banners
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Anyone can view enabled banners" ON occasion_banners;
CREATE POLICY "Anyone can view enabled banners"
  ON occasion_banners FOR SELECT
  TO authenticated
  USING (enabled = true);