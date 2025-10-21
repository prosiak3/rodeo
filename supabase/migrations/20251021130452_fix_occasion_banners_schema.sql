/*
  # Fix Occasion Banners Schema
  
  Drop existing tables if they have wrong schema and recreate them properly.
*/

-- Drop existing tables in correct order (foreign keys first)
DROP TABLE IF EXISTS banner_interactions CASCADE;
DROP TABLE IF EXISTS occasion_banners CASCADE;
DROP TABLE IF EXISTS occasion_types CASCADE;

-- ============================================================================
-- 1. OCCASION TYPES TABLE
-- ============================================================================

CREATE TABLE occasion_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('holiday', 'seasonal', 'weekly', 'special', 'custom')),
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  default_styling jsonb DEFAULT '{
    "gradientFrom": "#f97316",
    "gradientTo": "#fb923c",
    "icon": "Tag",
    "animation": "pulse",
    "textColor": "#ffffff"
  }'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE occasion_types ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. OCCASION BANNERS TABLE
-- ============================================================================

CREATE TABLE occasion_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_type_id uuid REFERENCES occasion_types(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 0,
  styling_override jsonb DEFAULT '{}'::jsonb,
  target_products jsonb DEFAULT '[]'::jsonb,
  promotion_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE occasion_banners ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_occasion_banners_dates ON occasion_banners(start_date, end_date) WHERE enabled = true;
CREATE INDEX idx_occasion_banners_priority ON occasion_banners(priority DESC) WHERE enabled = true;

-- ============================================================================
-- 3. BANNER INTERACTIONS TABLE
-- ============================================================================

CREATE TABLE banner_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES occasion_banners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'click', 'dismiss')),
  timestamp timestamptz DEFAULT now(),
  session_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE banner_interactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_banner_interactions_banner ON banner_interactions(banner_id);
CREATE INDEX idx_banner_interactions_user ON banner_interactions(user_id);
CREATE INDEX idx_banner_interactions_timestamp ON banner_interactions(timestamp DESC);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION is_weekend()
RETURNS boolean AS $$
BEGIN
  RETURN EXTRACT(DOW FROM CURRENT_DATE) IN (4, 5, 6, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION matches_recurrence_rule(rule text, check_date timestamptz DEFAULT now())
RETURNS boolean AS $$
BEGIN
  CASE rule
    WHEN 'weekend' THEN
      RETURN EXTRACT(DOW FROM check_date) IN (4, 5, 6, 0);
    WHEN 'weekday' THEN
      RETURN EXTRACT(DOW FROM check_date) IN (1, 2, 3);
    WHEN 'first_monday' THEN
      RETURN EXTRACT(DOW FROM check_date) = 1 AND EXTRACT(DAY FROM check_date) <= 7;
    WHEN 'last_friday' THEN
      RETURN EXTRACT(DOW FROM check_date) = 5 
        AND EXTRACT(DAY FROM check_date) > (EXTRACT(DAY FROM date_trunc('month', check_date) + interval '1 month' - interval '1 day') - 7);
    WHEN 'daily' THEN
      RETURN true;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_active_banners(check_date timestamptz DEFAULT now())
RETURNS TABLE (
  id uuid,
  occasion_type_id uuid,
  occasion_code text,
  occasion_name text,
  title text,
  message text,
  priority integer,
  styling jsonb,
  target_products jsonb,
  promotion_details jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ob.id,
    ob.occasion_type_id,
    ot.code as occasion_code,
    ot.name as occasion_name,
    ob.title,
    ob.message,
    ob.priority,
    jsonb_build_object(
      'gradientFrom', COALESCE(ob.styling_override->>'gradientFrom', ot.default_styling->>'gradientFrom'),
      'gradientTo', COALESCE(ob.styling_override->>'gradientTo', ot.default_styling->>'gradientTo'),
      'icon', COALESCE(ob.styling_override->>'icon', ot.default_styling->>'icon'),
      'animation', COALESCE(ob.styling_override->>'animation', ot.default_styling->>'animation'),
      'textColor', COALESCE(ob.styling_override->>'textColor', ot.default_styling->>'textColor'),
      'decorations', COALESCE(ob.styling_override->>'decorations', ot.default_styling->>'decorations')
    ) as styling,
    ob.target_products,
    ob.promotion_details
  FROM occasion_banners ob
  JOIN occasion_types ot ON ot.id = ob.occasion_type_id
  WHERE ob.enabled = true
    AND check_date >= ob.start_date
    AND check_date <= ob.end_date
    AND (
      ot.is_recurring = false
      OR
      (ot.is_recurring = true AND matches_recurrence_rule(ot.recurrence_rule, check_date))
    )
  ORDER BY ob.priority DESC, ob.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION is_weekend() TO authenticated;
GRANT EXECUTE ON FUNCTION matches_recurrence_rule(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_banners(timestamptz) TO authenticated;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view occasion types"
  ON occasion_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage occasion types"
  ON occasion_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Anyone can view enabled banners"
  ON occasion_banners FOR SELECT
  TO authenticated
  USING (enabled = true OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator', 'analyst')
  ));

CREATE POLICY "Admins can manage banners"
  ON occasion_banners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Users can track their banner interactions"
  ON banner_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Analysts can view all interactions"
  ON banner_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst', 'operator')
    )
  );

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

CREATE TRIGGER update_occasion_banners_updated_at
  BEFORE UPDATE ON occasion_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. SEED DATA
-- ============================================================================

INSERT INTO occasion_types (code, name, description, category, is_recurring, recurrence_rule, default_styling) VALUES
('christmas', 'Boże Narodzenie', 'Promocje świąteczne', 'holiday', false, null, '{"gradientFrom": "#dc2626", "gradientTo": "#16a34a", "icon": "Gift", "animation": "pulse", "textColor": "#ffffff", "decorations": "snowflakes"}'::jsonb),
('easter', 'Wielkanoc', 'Promocje wielkanocne', 'holiday', false, null, '{"gradientFrom": "#fbbf24", "gradientTo": "#a855f7", "icon": "Sparkles", "animation": "bounce", "textColor": "#ffffff", "decorations": "eggs"}'::jsonb),
('valentines', 'Walentynki', 'Promocje walentynkowe', 'holiday', false, null, '{"gradientFrom": "#ec4899", "gradientTo": "#ef4444", "icon": "Heart", "animation": "pulse", "textColor": "#ffffff", "decorations": "hearts"}'::jsonb),
('halloween', 'Halloween', 'Promocje halloweenowe', 'holiday', false, null, '{"gradientFrom": "#f97316", "gradientTo": "#7c2d12", "icon": "Zap", "animation": "bounce", "textColor": "#ffffff", "decorations": "pumpkins"}'::jsonb),
('mothers_day', 'Dzień Matki', 'Dzień Matki - 26 maja', 'special', false, null, '{"gradientFrom": "#ec4899", "gradientTo": "#f472b6", "icon": "Heart", "animation": "pulse", "textColor": "#ffffff", "decorations": "flowers"}'::jsonb),
('fathers_day', 'Dzień Ojca', 'Dzień Ojca - 23 czerwca', 'special', false, null, '{"gradientFrom": "#3b82f6", "gradientTo": "#1d4ed8", "icon": "Award", "animation": "none", "textColor": "#ffffff"}'::jsonb),
('weekend_promo', 'Promocja Weekendowa', 'Promocje czwartek-niedziela', 'weekly', true, 'weekend', '{"gradientFrom": "#f97316", "gradientTo": "#fb923c", "icon": "Zap", "animation": "pulse", "textColor": "#ffffff"}'::jsonb),
('spring', 'Wiosna', 'Promocje wiosenne', 'seasonal', false, null, '{"gradientFrom": "#10b981", "gradientTo": "#6ee7b7", "icon": "Sparkles", "animation": "none", "textColor": "#ffffff", "decorations": "flowers"}'::jsonb),
('summer', 'Lato', 'Promocje letnie', 'seasonal', false, null, '{"gradientFrom": "#fbbf24", "gradientTo": "#f59e0b", "icon": "Sun", "animation": "none", "textColor": "#ffffff"}'::jsonb),
('autumn', 'Jesień', 'Promocje jesienne', 'seasonal', false, null, '{"gradientFrom": "#d97706", "gradientTo": "#92400e", "icon": "Leaf", "animation": "none", "textColor": "#ffffff", "decorations": "leaves"}'::jsonb),
('winter', 'Zima', 'Promocje zimowe', 'seasonal', false, null, '{"gradientFrom": "#3b82f6", "gradientTo": "#1e40af", "icon": "Snowflake", "animation": "none", "textColor": "#ffffff", "decorations": "snowflakes"}'::jsonb),
('black_friday', 'Black Friday', 'Mega wyprzedaże', 'special', false, null, '{"gradientFrom": "#000000", "gradientTo": "#dc2626", "icon": "Tag", "animation": "pulse", "textColor": "#ffffff"}'::jsonb),
('custom', 'Niestandardowa', 'Dowolna promocja', 'custom', false, null, '{"gradientFrom": "#8b5cf6", "gradientTo": "#6366f1", "icon": "Sparkles", "animation": "none", "textColor": "#ffffff"}'::jsonb);

-- Przykładowy baner weekendowy
INSERT INTO occasion_banners (
  occasion_type_id,
  title,
  message,
  start_date,
  end_date,
  enabled,
  priority,
  promotion_details
) 
SELECT 
  id,
  'Promocja Weekendowa!',
  'Specjalne ceny na wybrane produkty od czwartku do niedzieli!',
  now(),
  now() + interval '3 months',
  true,
  10,
  '{"type": "discount", "percentage": 15}'::jsonb
FROM occasion_types 
WHERE code = 'weekend_promo';
