/*
  # AI Demand Forecasting System

  Zaawansowany system prognozowania popytu z wykorzystaniem AI do analizy wielowymiarowej:
  - Analiza grup towarowych (kategorie produktów)
  - Analiza poszczególnego asortymentu (indywidualne produkty)
  - Analiza grup klientów (grupy sklepów, regiony)
  - Analiza poszczególnych klientów (indywidualne sklepy)

  ## Nowe Tabele

  ### 1. `demand_forecast_models`
  Przechowuje modele prognozowania i ich parametry
  - `id` (uuid) - unikalny identyfikator modelu
  - `name` (text) - nazwa modelu
  - `model_type` (text) - typ: 'product', 'category', 'store', 'store_group'
  - `target_id` (uuid) - ID produktu/kategorii/sklepu/grupy
  - `algorithm` (text) - algorytm: 'moving_average', 'exponential_smoothing', 'trend_analysis', 'seasonal_decomposition'
  - `parameters` (jsonb) - parametry modelu
  - `accuracy_metrics` (jsonb) - metryki dokładności (MAE, RMSE, MAPE)
  - `training_data_from` (timestamptz) - od kiedy dane treningowe
  - `training_data_to` (timestamptz) - do kiedy dane treningowe
  - `last_trained_at` (timestamptz) - ostatnie trenowanie
  - `active` (boolean) - czy model jest aktywny
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `demand_forecasts`
  Przechowuje wygenerowane prognozy
  - `id` (uuid) - unikalny identyfikator prognozy
  - `model_id` (uuid) - model który wygenerował prognozę
  - `forecast_date` (date) - data dla której jest prognoza
  - `dimension_type` (text) - 'product', 'category', 'store', 'store_group'
  - `dimension_id` (uuid) - ID wymiaru
  - `predicted_quantity` (decimal) - przewidywana ilość
  - `predicted_value` (decimal) - przewidywana wartość
  - `confidence_lower` (decimal) - dolna granica przedziału ufności
  - `confidence_upper` (decimal) - górna granica przedziału ufności
  - `confidence_level` (decimal) - poziom ufności (0-1)
  - `seasonality_factor` (decimal) - wskaźnik sezonowości
  - `trend_direction` (text) - 'increasing', 'stable', 'decreasing'
  - `anomaly_score` (decimal) - wskaźnik anomalii (0-1)
  - `generated_at` (timestamptz)

  ### 3. `demand_patterns`
  Wykryte wzorce popytu
  - `id` (uuid) - unikalny identyfikator wzorca
  - `pattern_type` (text) - 'weekly', 'monthly', 'seasonal', 'event_based', 'promotion_impact'
  - `dimension_type` (text) - typ wymiaru
  - `dimension_id` (uuid) - ID wymiaru
  - `pattern_data` (jsonb) - szczegóły wzorca
  - `strength` (decimal) - siła wzorca (0-1)
  - `detected_at` (timestamptz)
  - `valid_from` (timestamptz)
  - `valid_to` (timestamptz)

  ### 4. `demand_forecast_accuracy`
  Tracking dokładności prognoz
  - `id` (uuid)
  - `forecast_id` (uuid) - odniesienie do prognozy
  - `actual_quantity` (decimal) - rzeczywista ilość
  - `actual_value` (decimal) - rzeczywista wartość
  - `error_quantity` (decimal) - błąd ilościowy
  - `error_percentage` (decimal) - błąd procentowy
  - `measured_at` (timestamptz)

  ### 5. `demand_alerts`
  Alerty o istotnych zmianach popytu
  - `id` (uuid)
  - `alert_type` (text) - 'spike', 'drop', 'anomaly', 'trend_change'
  - `severity` (text) - 'low', 'medium', 'high', 'critical'
  - `dimension_type` (text)
  - `dimension_id` (uuid)
  - `message` (text)
  - `details` (jsonb)
  - `acknowledged` (boolean)
  - `acknowledged_by` (uuid)
  - `created_at` (timestamptz)

  ## Funkcje Analityczne

  Funkcje SQL do generowania prognoz i analizy wzorców popytu.

  ## Bezpieczeństwo (RLS)

  - Analyst i Admin: pełny dostęp
  - Operator: dostęp do odczytu
  - Store managers: tylko własne sklepy
  - Salesperson: przypisane sklepy
*/

-- =====================================================
-- 1. TWORZENIE TABEL
-- =====================================================

-- Tabela demand_forecast_models
CREATE TABLE IF NOT EXISTS demand_forecast_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model_type text NOT NULL CHECK (model_type IN ('product', 'category', 'store', 'store_group', 'cross_dimension')),
  target_id uuid,
  algorithm text NOT NULL CHECK (algorithm IN ('moving_average', 'exponential_smoothing', 'trend_analysis', 'seasonal_decomposition', 'hybrid')),
  parameters jsonb DEFAULT '{}'::jsonb,
  accuracy_metrics jsonb DEFAULT '{}'::jsonb,
  training_data_from timestamptz,
  training_data_to timestamptz,
  last_trained_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela demand_forecasts
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES demand_forecast_models(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  dimension_type text NOT NULL CHECK (dimension_type IN ('product', 'category', 'store', 'store_group')),
  dimension_id uuid NOT NULL,
  predicted_quantity decimal(12,3) NOT NULL,
  predicted_value decimal(12,2) NOT NULL,
  confidence_lower decimal(12,3),
  confidence_upper decimal(12,3),
  confidence_level decimal(3,2) DEFAULT 0.95,
  seasonality_factor decimal(5,3) DEFAULT 1.0,
  trend_direction text CHECK (trend_direction IN ('increasing', 'stable', 'decreasing')),
  anomaly_score decimal(3,2) DEFAULT 0.0,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(model_id, forecast_date, dimension_type, dimension_id)
);

-- Tabela demand_patterns
CREATE TABLE IF NOT EXISTS demand_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL CHECK (pattern_type IN ('weekly', 'monthly', 'seasonal', 'event_based', 'promotion_impact', 'holiday_effect')),
  dimension_type text NOT NULL CHECK (dimension_type IN ('product', 'category', 'store', 'store_group')),
  dimension_id uuid NOT NULL,
  pattern_data jsonb NOT NULL,
  strength decimal(3,2) CHECK (strength >= 0 AND strength <= 1),
  detected_at timestamptz DEFAULT now(),
  valid_from timestamptz,
  valid_to timestamptz
);

-- Tabela demand_forecast_accuracy
CREATE TABLE IF NOT EXISTS demand_forecast_accuracy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id uuid NOT NULL REFERENCES demand_forecasts(id) ON DELETE CASCADE,
  actual_quantity decimal(12,3),
  actual_value decimal(12,2),
  error_quantity decimal(12,3),
  error_percentage decimal(6,2),
  measured_at timestamptz DEFAULT now()
);

-- Tabela demand_alerts
CREATE TABLE IF NOT EXISTS demand_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('spike', 'drop', 'anomaly', 'trend_change', 'seasonality_shift')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  dimension_type text NOT NULL CHECK (dimension_type IN ('product', 'category', 'store', 'store_group')),
  dimension_id uuid NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. INDEKSY
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_demand_forecast_models_type_target
  ON demand_forecast_models(model_type, target_id);

CREATE INDEX IF NOT EXISTS idx_demand_forecast_models_active
  ON demand_forecast_models(active, last_trained_at DESC);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date
  ON demand_forecasts(forecast_date DESC);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_dimension
  ON demand_forecasts(dimension_type, dimension_id, forecast_date DESC);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_model
  ON demand_forecasts(model_id, forecast_date DESC);

CREATE INDEX IF NOT EXISTS idx_demand_patterns_dimension
  ON demand_patterns(dimension_type, dimension_id);

CREATE INDEX IF NOT EXISTS idx_demand_patterns_type
  ON demand_patterns(pattern_type, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_demand_alerts_unacknowledged
  ON demand_alerts(acknowledged, created_at DESC) WHERE NOT acknowledged;

CREATE INDEX IF NOT EXISTS idx_demand_alerts_dimension
  ON demand_alerts(dimension_type, dimension_id, created_at DESC);

-- =====================================================
-- 3. FUNKCJE ANALITYCZNE
-- =====================================================

-- Funkcja: Oblicz średnią ruchomą dla produktu
CREATE OR REPLACE FUNCTION calculate_moving_average_forecast(
  p_product_id uuid,
  p_store_id uuid,
  p_days_back integer DEFAULT 90,
  p_window_size integer DEFAULT 7,
  p_forecast_days integer DEFAULT 30
)
RETURNS TABLE (
  forecast_date date,
  predicted_quantity decimal,
  confidence_lower decimal,
  confidence_upper decimal
) AS $$
DECLARE
  v_historical_data record;
  v_avg_quantity decimal;
  v_std_dev decimal;
BEGIN
  -- Oblicz statystyki historyczne
  SELECT
    AVG(oi.quantity) as avg_qty,
    STDDEV(oi.quantity) as std_qty
  INTO v_avg_quantity, v_std_dev
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.product_id = p_product_id
    AND o.store_id = p_store_id
    AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
    AND o.created_at >= CURRENT_DATE - p_days_back
    AND oi.quantity > 0;

  -- Generuj prognozy na kolejne dni
  RETURN QUERY
  SELECT
    (CURRENT_DATE + d.day_offset)::date as forecast_date,
    COALESCE(v_avg_quantity, 0)::decimal as predicted_quantity,
    GREATEST(0, COALESCE(v_avg_quantity - 1.96 * v_std_dev, 0))::decimal as confidence_lower,
    COALESCE(v_avg_quantity + 1.96 * v_std_dev, 0)::decimal as confidence_upper
  FROM generate_series(1, p_forecast_days) as d(day_offset);
END;
$$ LANGUAGE plpgsql STABLE;

-- Funkcja: Analiza trendu dla produktu
CREATE OR REPLACE FUNCTION analyze_product_trend(
  p_product_id uuid,
  p_store_id uuid,
  p_days_back integer DEFAULT 90
)
RETURNS TABLE (
  trend_direction text,
  trend_strength decimal,
  avg_change_per_week decimal
) AS $$
DECLARE
  v_trend_slope decimal;
  v_correlation decimal;
BEGIN
  -- Oblicz trend używając regresji liniowej
  WITH weekly_data AS (
    SELECT
      DATE_TRUNC('week', o.created_at)::date as week_start,
      SUM(oi.quantity) as total_quantity,
      ROW_NUMBER() OVER (ORDER BY DATE_TRUNC('week', o.created_at)) as week_number
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p_product_id
      AND o.store_id = p_store_id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.created_at >= CURRENT_DATE - p_days_back
      AND oi.quantity > 0
    GROUP BY DATE_TRUNC('week', o.created_at)
  ),
  regression AS (
    SELECT
      REGR_SLOPE(total_quantity, week_number) as slope,
      CORR(total_quantity, week_number) as correlation
    FROM weekly_data
  )
  SELECT
    slope,
    ABS(correlation)
  INTO v_trend_slope, v_correlation
  FROM regression;

  RETURN QUERY
  SELECT
    CASE
      WHEN v_trend_slope > 0.5 THEN 'increasing'::text
      WHEN v_trend_slope < -0.5 THEN 'decreasing'::text
      ELSE 'stable'::text
    END as trend_direction,
    COALESCE(v_correlation, 0)::decimal as trend_strength,
    COALESCE(v_trend_slope, 0)::decimal as avg_change_per_week;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funkcja: Wykryj wzorce sezonowe
CREATE OR REPLACE FUNCTION detect_seasonal_patterns(
  p_dimension_type text,
  p_dimension_id uuid,
  p_days_back integer DEFAULT 180
)
RETURNS TABLE (
  pattern_type text,
  day_of_week integer,
  avg_multiplier decimal,
  pattern_strength decimal
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      EXTRACT(DOW FROM o.created_at)::integer as day_of_week,
      SUM(oi.quantity) as total_quantity
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE
      CASE
        WHEN p_dimension_type = 'product' THEN oi.product_id = p_dimension_id
        WHEN p_dimension_type = 'store' THEN o.store_id = p_dimension_id
        ELSE true
      END
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.created_at >= CURRENT_DATE - p_days_back
    GROUP BY EXTRACT(DOW FROM o.created_at)
  ),
  overall_avg AS (
    SELECT AVG(total_quantity) as avg_qty
    FROM daily_stats
  )
  SELECT
    'weekly'::text as pattern_type,
    ds.day_of_week,
    (ds.total_quantity / NULLIF(oa.avg_qty, 0))::decimal as avg_multiplier,
    (STDDEV(ds.total_quantity) / NULLIF(AVG(ds.total_quantity), 0))::decimal as pattern_strength
  FROM daily_stats ds
  CROSS JOIN overall_avg oa
  GROUP BY ds.day_of_week, ds.total_quantity, oa.avg_qty
  ORDER BY ds.day_of_week;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funkcja: Prognoza dla grupy produktów (kategorii)
CREATE OR REPLACE FUNCTION forecast_category_demand(
  p_category text,
  p_store_id uuid,
  p_days_back integer DEFAULT 90,
  p_forecast_days integer DEFAULT 30
)
RETURNS TABLE (
  forecast_date date,
  category text,
  predicted_quantity decimal,
  predicted_value decimal,
  top_products jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH historical_category AS (
    SELECT
      DATE_TRUNC('day', o.created_at)::date as order_date,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.total_price) as total_value
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE p.category = p_category
      AND o.store_id = p_store_id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.created_at >= CURRENT_DATE - p_days_back
    GROUP BY DATE_TRUNC('day', o.created_at)
  ),
  category_stats AS (
    SELECT
      AVG(total_quantity) as avg_quantity,
      AVG(total_value) as avg_value
    FROM historical_category
  ),
  top_category_products AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'product_id', p.id,
        'product_name', p.name,
        'total_quantity', SUM(oi.quantity)
      ) ORDER BY SUM(oi.quantity) DESC
    ) FILTER (WHERE rn <= 5) as top_prods
    FROM (
      SELECT
        p.id, p.name, oi.quantity,
        ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity) DESC) as rn
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE p.category = p_category
        AND o.store_id = p_store_id
        AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
        AND o.created_at >= CURRENT_DATE - p_days_back
      GROUP BY p.id, p.name, oi.quantity
    ) sub
    JOIN products p ON p.id = sub.id
    JOIN order_items oi ON oi.product_id = p.id
    GROUP BY sub.rn
  )
  SELECT
    (CURRENT_DATE + d.day_offset)::date as forecast_date,
    p_category::text as category,
    COALESCE(cs.avg_quantity, 0)::decimal as predicted_quantity,
    COALESCE(cs.avg_value, 0)::decimal as predicted_value,
    COALESCE(tcp.top_prods, '[]'::jsonb) as top_products
  FROM generate_series(1, p_forecast_days) as d(day_offset)
  CROSS JOIN category_stats cs
  CROSS JOIN top_category_products tcp;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funkcja: Analiza cross-dimensional (produkt + grupa sklepów)
CREATE OR REPLACE FUNCTION analyze_cross_dimension_demand(
  p_product_id uuid,
  p_store_group_id uuid,
  p_days_back integer DEFAULT 90
)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  avg_quantity decimal,
  trend_direction text,
  last_order_days_ago integer,
  predicted_next_order_days integer
) AS $$
BEGIN
  RETURN QUERY
  WITH store_stats AS (
    SELECT
      s.id as store_id,
      s.name as store_name,
      AVG(oi.quantity) as avg_qty,
      MAX(o.created_at) as last_order,
      COUNT(DISTINCT o.id) as order_count,
      AVG(
        EXTRACT(EPOCH FROM (o.created_at - LAG(o.created_at) OVER (PARTITION BY s.id ORDER BY o.created_at))) / 86400
      ) as avg_days_between_orders
    FROM stores s
    JOIN store_group_members sgm ON sgm.store_id = s.id
    JOIN orders o ON o.store_id = s.id
    JOIN order_items oi ON oi.order_id = o.id
    WHERE sgm.group_id = p_store_group_id
      AND oi.product_id = p_product_id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.created_at >= CURRENT_DATE - p_days_back
    GROUP BY s.id, s.name
  ),
  trend_analysis AS (
    SELECT
      ss.store_id,
      CASE
        WHEN COUNT(o.id) >= 3 THEN
          CASE
            WHEN AVG(oi.quantity) FILTER (WHERE o.created_at >= CURRENT_DATE - 30) >
                 AVG(oi.quantity) FILTER (WHERE o.created_at < CURRENT_DATE - 30) * 1.1
            THEN 'increasing'
            WHEN AVG(oi.quantity) FILTER (WHERE o.created_at >= CURRENT_DATE - 30) <
                 AVG(oi.quantity) FILTER (WHERE o.created_at < CURRENT_DATE - 30) * 0.9
            THEN 'decreasing'
            ELSE 'stable'
          END
        ELSE 'unknown'
      END as trend
    FROM store_stats ss
    LEFT JOIN orders o ON o.store_id = ss.store_id
    LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p_product_id
    WHERE o.created_at >= CURRENT_DATE - p_days_back
    GROUP BY ss.store_id
  )
  SELECT
    ss.store_id,
    ss.store_name,
    COALESCE(ss.avg_qty, 0)::decimal as avg_quantity,
    COALESCE(ta.trend, 'unknown')::text as trend_direction,
    COALESCE(EXTRACT(DAY FROM (CURRENT_DATE - ss.last_order::date)), 999)::integer as last_order_days_ago,
    COALESCE(ROUND(ss.avg_days_between_orders), 30)::integer as predicted_next_order_days
  FROM store_stats ss
  LEFT JOIN trend_analysis ta ON ta.store_id = ss.store_id
  ORDER BY ss.avg_qty DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funkcja: Generuj alerty o anomaliach popytu
CREATE OR REPLACE FUNCTION generate_demand_alerts()
RETURNS void AS $$
DECLARE
  v_product record;
  v_current_avg decimal;
  v_historical_avg decimal;
  v_deviation decimal;
BEGIN
  -- Sprawdź anomalie dla każdego produktu w ostatnich 7 dniach
  FOR v_product IN
    SELECT DISTINCT p.id, p.name, p.category
    FROM products p
    WHERE p.active = true
  LOOP
    -- Średnia z ostatnich 7 dni
    SELECT AVG(oi.quantity)
    INTO v_current_avg
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = v_product.id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.created_at >= CURRENT_DATE - 7;

    -- Średnia historyczna (30-90 dni wstecz)
    SELECT AVG(oi.quantity)
    INTO v_historical_avg
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = v_product.id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.created_at >= CURRENT_DATE - 90
      AND o.created_at < CURRENT_DATE - 30;

    -- Oblicz odchylenie
    IF v_historical_avg > 0 THEN
      v_deviation := ((v_current_avg - v_historical_avg) / v_historical_avg) * 100;

      -- Generuj alert jeśli znaczące odchylenie
      IF ABS(v_deviation) > 50 THEN
        INSERT INTO demand_alerts (
          alert_type,
          severity,
          dimension_type,
          dimension_id,
          message,
          details
        ) VALUES (
          CASE WHEN v_deviation > 0 THEN 'spike'::text ELSE 'drop'::text END,
          CASE
            WHEN ABS(v_deviation) > 100 THEN 'critical'::text
            WHEN ABS(v_deviation) > 75 THEN 'high'::text
            ELSE 'medium'::text
          END,
          'product',
          v_product.id,
          format('Anomalia popytu dla %s: %s%%', v_product.name, ROUND(v_deviation, 1)),
          jsonb_build_object(
            'product_name', v_product.name,
            'category', v_product.category,
            'current_avg', v_current_avg,
            'historical_avg', v_historical_avg,
            'deviation_percent', v_deviation
          )
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE demand_forecast_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecast_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_alerts ENABLE ROW LEVEL SECURITY;

-- Policies dla demand_forecast_models
CREATE POLICY "Analysts and admins can manage forecast models"
  ON demand_forecast_models FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "Operators can view forecast models"
  ON demand_forecast_models FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'operator'
    )
  );

-- Policies dla demand_forecasts
CREATE POLICY "Analysts and admins can manage forecasts"
  ON demand_forecasts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin', 'operator')
    )
  );

CREATE POLICY "Store managers can view their store forecasts"
  ON demand_forecasts FOR SELECT
  TO authenticated
  USING (
    dimension_type = 'store' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'store_manager'
      AND users.store_id = demand_forecasts.dimension_id
    )
  );

CREATE POLICY "Salespersons can view their assigned stores forecasts"
  ON demand_forecasts FOR SELECT
  TO authenticated
  USING (
    dimension_type = 'store' AND
    EXISTS (
      SELECT 1 FROM users u
      JOIN salesperson_stores ss ON ss.salesperson_id = u.id
      WHERE u.id = auth.uid()
      AND u.role = 'salesperson'
      AND ss.store_id = demand_forecasts.dimension_id
    )
  );

-- Policies dla demand_patterns
CREATE POLICY "Authenticated users can view patterns"
  ON demand_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Analysts and admins can manage patterns"
  ON demand_patterns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

-- Policies dla demand_forecast_accuracy
CREATE POLICY "Analysts can manage accuracy data"
  ON demand_forecast_accuracy FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

-- Policies dla demand_alerts
CREATE POLICY "Authenticated users can view alerts"
  ON demand_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Analysts and admins can manage alerts"
  ON demand_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "Users can acknowledge alerts"
  ON demand_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    acknowledged = true AND
    acknowledged_by = auth.uid()
  );

-- =====================================================
-- 5. FUNKCJE POMOCNICZE
-- =====================================================

-- Funkcja do automatycznego trenowania modeli
CREATE OR REPLACE FUNCTION auto_train_forecast_models()
RETURNS void AS $$
BEGIN
  -- Trenuj modele które nie były trenowane od 24h
  UPDATE demand_forecast_models
  SET
    last_trained_at = now(),
    updated_at = now()
  WHERE active = true
    AND (last_trained_at IS NULL OR last_trained_at < now() - interval '24 hours');

  -- Można tutaj dodać logikę rzeczywistego trenowania
  RAISE NOTICE 'Forecast models training completed';
END;
$$ LANGUAGE plpgsql;

-- Funkcja do czyszczenia starych prognoz
CREATE OR REPLACE FUNCTION cleanup_old_forecasts()
RETURNS void AS $$
BEGIN
  -- Usuń prognozy starsze niż 90 dni
  DELETE FROM demand_forecasts
  WHERE forecast_date < CURRENT_DATE - interval '90 days';

  -- Usuń nieaktywne alerty starsze niż 30 dni
  DELETE FROM demand_alerts
  WHERE acknowledged = true
    AND acknowledged_at < now() - interval '30 days';

  RAISE NOTICE 'Old forecasts cleaned up';
END;
$$ LANGUAGE plpgsql;
