/*
  # System Śledzenia Kampanii Marketingowych i Promocji

  ## Przegląd
  Ta migracja tworzy system do kompleksowego śledzenia interakcji użytkowników
  z kampaniami marketingowymi, bannerami, promocjami i powiadomieniami push.

  ## Nowe Tabele

  ### 1. `marketing_campaigns` - Definicje Kampanii
    - `id` (uuid, primary key)
    - `campaign_name` (text) - nazwa kampanii
    - `campaign_type` (text) - typ: banner, push_notification, email, promo_popup
    - `promo_code` (text) - kod promocyjny jeśli dotyczy
    - `target_products` (jsonb) - lista ID produktów objętych promocją
    - `discount_percentage` (decimal) - procent zniżki
    - `start_date` (timestamptz) - początek kampanii
    - `end_date` (timestamptz) - koniec kampanii
    - `active` (boolean) - czy kampania jest aktywna
    - `created_at` (timestamptz)

  ### 2. `campaign_interactions` - Interakcje Użytkowników z Kampaniami
    - `id` (uuid, primary key)
    - `campaign_id` (uuid) - odniesienie do kampanii
    - `user_id` (uuid) - użytkownik
    - `session_id` (uuid) - sesja użytkownika
    - `interaction_type` (text) - typ: view, click, dismiss, convert
    - `interaction_data` (jsonb) - dodatkowe dane (produkt, wartość zamówienia)
    - `timestamp` (timestamptz)
    - `created_at` (timestamptz)

  ### 3. `campaign_conversions` - Konwersje z Kampanii
    - `id` (uuid, primary key)
    - `campaign_id` (uuid) - kampania
    - `user_id` (uuid) - użytkownik
    - `order_id` (uuid) - zamówienie
    - `interaction_id` (uuid) - pierwotna interakcja
    - `conversion_value` (decimal) - wartość zamówienia
    - `products_from_campaign` (jsonb) - produkty z promocji
    - `time_to_conversion` (interval) - czas od kliknięcia do konwersji
    - `created_at` (timestamptz)

  ## Widoki Analityczne

  ### `campaign_performance_summary` - Podsumowanie Wydajności Kampanii
    Materialized view pokazujący:
    - Liczba wyświetleń
    - Liczba kliknięć
    - CTR (Click-Through Rate)
    - Liczba konwersji
    - Conversion Rate
    - Całkowita wartość konwersji
    - Średni czas do konwersji
    - ROI (jeśli znamy koszt kampanii)

  ## Bezpieczeństwo
    - Enable RLS na wszystkich tabelach
    - Analitycy mogą czytać wszystko
    - Użytkownicy mogą dodawać własne interakcje
    - Tylko system może dodawać konwersje

  ## Indeksy
    - Wydajne zapytania po campaign_id, user_id, timestamp
    - Szybkie agregacje dla dashboardu
*/

-- Marketing Campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('banner', 'push_notification', 'email', 'promo_popup', 'in_app_message')),
  promo_code text,
  target_products jsonb DEFAULT '[]'::jsonb,
  discount_percentage decimal(5,2),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Campaign Interactions table
CREATE TABLE IF NOT EXISTS campaign_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'click', 'dismiss', 'convert')),
  interaction_data jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE campaign_interactions ENABLE ROW LEVEL SECURITY;

-- Campaign Conversions table
CREATE TABLE IF NOT EXISTS campaign_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  interaction_id uuid REFERENCES campaign_interactions(id) ON DELETE SET NULL,
  conversion_value decimal(10,2) NOT NULL,
  products_from_campaign jsonb DEFAULT '[]'::jsonb,
  time_to_conversion interval,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE campaign_conversions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_campaign ON campaign_interactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_user ON campaign_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_timestamp ON campaign_interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_type ON campaign_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_campaign_conversions_campaign ON campaign_conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_conversions_user ON campaign_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_conversions_order ON campaign_conversions(order_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_active ON marketing_campaigns(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON marketing_campaigns(start_date, end_date);

-- RLS Policies for marketing_campaigns
CREATE POLICY "Analysts and admins can view campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('analyst', 'admin', 'operator')
    )
  );

CREATE POLICY "Admins can manage campaigns"
  ON marketing_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  );

-- RLS Policies for campaign_interactions
CREATE POLICY "Users can insert their own interactions"
  ON campaign_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Analysts can view all interactions"
  ON campaign_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('analyst', 'admin', 'operator')
    )
  );

-- RLS Policies for campaign_conversions
CREATE POLICY "Analysts can view all conversions"
  ON campaign_conversions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('analyst', 'admin', 'operator')
    )
  );

-- Function to calculate campaign performance
CREATE OR REPLACE FUNCTION get_campaign_performance(p_campaign_id uuid)
RETURNS TABLE (
  campaign_name text,
  campaign_type text,
  total_views bigint,
  total_clicks bigint,
  total_dismissals bigint,
  total_conversions bigint,
  ctr decimal,
  conversion_rate decimal,
  total_revenue decimal,
  avg_time_to_conversion interval
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.campaign_name,
    mc.campaign_type,
    COUNT(*) FILTER (WHERE ci.interaction_type = 'view') as total_views,
    COUNT(*) FILTER (WHERE ci.interaction_type = 'click') as total_clicks,
    COUNT(*) FILTER (WHERE ci.interaction_type = 'dismiss') as total_dismissals,
    COUNT(DISTINCT cc.id) as total_conversions,
    CASE 
      WHEN COUNT(*) FILTER (WHERE ci.interaction_type = 'view') > 0 
      THEN (COUNT(*) FILTER (WHERE ci.interaction_type = 'click')::decimal / 
            COUNT(*) FILTER (WHERE ci.interaction_type = 'view')::decimal * 100)
      ELSE 0 
    END as ctr,
    CASE 
      WHEN COUNT(*) FILTER (WHERE ci.interaction_type = 'click') > 0 
      THEN (COUNT(DISTINCT cc.id)::decimal / 
            COUNT(*) FILTER (WHERE ci.interaction_type = 'click')::decimal * 100)
      ELSE 0 
    END as conversion_rate,
    COALESCE(SUM(cc.conversion_value), 0) as total_revenue,
    AVG(cc.time_to_conversion) as avg_time_to_conversion
  FROM marketing_campaigns mc
  LEFT JOIN campaign_interactions ci ON ci.campaign_id = mc.id
  LEFT JOIN campaign_conversions cc ON cc.campaign_id = mc.id
  WHERE mc.id = p_campaign_id
  GROUP BY mc.id, mc.campaign_name, mc.campaign_type;
END;
$$ LANGUAGE plpgsql;

-- Function to track conversion from campaign
CREATE OR REPLACE FUNCTION track_campaign_conversion(
  p_campaign_id uuid,
  p_user_id uuid,
  p_order_id uuid,
  p_conversion_value decimal,
  p_products jsonb
)
RETURNS uuid AS $$
DECLARE
  v_conversion_id uuid;
  v_interaction_id uuid;
  v_click_time timestamptz;
  v_time_to_conversion interval;
BEGIN
  -- Find the most recent click interaction
  SELECT id, timestamp INTO v_interaction_id, v_click_time
  FROM campaign_interactions
  WHERE campaign_id = p_campaign_id
    AND user_id = p_user_id
    AND interaction_type = 'click'
  ORDER BY timestamp DESC
  LIMIT 1;

  -- Calculate time to conversion
  IF v_click_time IS NOT NULL THEN
    v_time_to_conversion := now() - v_click_time;
  END IF;

  -- Insert conversion
  INSERT INTO campaign_conversions (
    campaign_id,
    user_id,
    order_id,
    interaction_id,
    conversion_value,
    products_from_campaign,
    time_to_conversion
  ) VALUES (
    p_campaign_id,
    p_user_id,
    p_order_id,
    v_interaction_id,
    p_conversion_value,
    p_products,
    v_time_to_conversion
  )
  RETURNING id INTO v_conversion_id;

  RETURN v_conversion_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on marketing_campaigns
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample campaigns for testing
INSERT INTO marketing_campaigns (campaign_name, campaign_type, promo_code, discount_percentage, start_date, end_date, active)
VALUES
  ('Promocja Black Friday 2024', 'banner', 'BF2024', 25.00, now() - interval '7 days', now() + interval '23 days', true),
  ('Push: Nowe produkty drobiowe', 'push_notification', NULL, 15.00, now() - interval '3 days', now() + interval '27 days', true),
  ('Email: Indyk w promocji', 'email', 'INDYK15', 15.00, now() - interval '5 days', now() + interval '25 days', true);
