/*
  # Dodanie trackingu Web Vitals

  1. Nowa tabela `web_vitals_metrics`
    - Przechowuje metryki wydajności (LCP, FID, CLS, FCP, TTFB, INP)
    - User ID (opcjonalny - dla zalogowanych użytkowników)
    - Wartości metryki, rating, delta
    - Navigation type

  2. Security
    - RLS enabled
    - Tylko authenticated users mogą dodawać metryki
    - Admin/Analyst może czytać wszystkie
*/

-- Tabela dla Web Vitals metrics
CREATE TABLE IF NOT EXISTS web_vitals_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  metric_name text NOT NULL CHECK (metric_name IN ('LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP')),
  metric_value numeric NOT NULL,
  rating text NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta numeric NOT NULL,
  navigation_type text DEFAULT 'navigate',
  created_at timestamptz DEFAULT now()
);

-- Indexes dla szybkiego query
CREATE INDEX IF NOT EXISTS idx_web_vitals_user_id ON web_vitals_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON web_vitals_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_rating ON web_vitals_metrics(rating);

-- Enable RLS
ALTER TABLE web_vitals_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
-- Authenticated users mogą dodawać swoje metryki
CREATE POLICY "Users can insert own web vitals"
  ON web_vitals_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin i Analyst mogą czytać wszystkie metryki
CREATE POLICY "Admin and Analyst can view all web vitals"
  ON web_vitals_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

-- Users mogą czytać swoje metryki
CREATE POLICY "Users can view own web vitals"
  ON web_vitals_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Komentarze
COMMENT ON TABLE web_vitals_metrics IS 'Core Web Vitals performance metrics (LCP, FID, CLS, etc.)';
COMMENT ON COLUMN web_vitals_metrics.metric_name IS 'Name of the metric: LCP, FID, CLS, FCP, TTFB, INP';
COMMENT ON COLUMN web_vitals_metrics.metric_value IS 'Value of the metric in milliseconds (or score for CLS)';
COMMENT ON COLUMN web_vitals_metrics.rating IS 'Performance rating: good, needs-improvement, poor';
COMMENT ON COLUMN web_vitals_metrics.delta IS 'Change in value since last report';
