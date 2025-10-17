/*
  # Voice Recognition Accuracy Tracking

  1. New Table: voice_recognition_attempts
    - id (uuid, primary key)
    - user_id (uuid, references users)
    - session_id (uuid, references user_sessions)
    - original_phrase (text) - What user said
    - recognized_phrase (text) - What system recognized
    - initial_product_id (uuid, references products) - First AI match
    - final_product_id (uuid, references products) - What user actually selected
    - was_corrected (boolean) - Whether user changed the selection
    - confidence_score (numeric) - AI confidence level
    - timestamp (timestamptz)
    - metadata (jsonb) - Additional context

  2. Views
    - problem_products_view - Products with most corrections
    - phrase_mapping_view - Common phrases mapped to products
    - phrase_conflicts_view - Same phrase mapping to different products

  3. Security
    - Enable RLS
    - Policies for authenticated users and analysts

  4. Indexes
    - For efficient querying and analytics
*/

-- Create voice_recognition_attempts table
CREATE TABLE IF NOT EXISTS voice_recognition_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  session_id uuid REFERENCES user_sessions(id),
  original_phrase text NOT NULL,
  recognized_phrase text,
  initial_product_id uuid REFERENCES products(id),
  final_product_id uuid REFERENCES products(id),
  was_corrected boolean DEFAULT false,
  confidence_score numeric(5,2),
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE voice_recognition_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own attempts"
  ON voice_recognition_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own attempts"
  ON voice_recognition_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all attempts"
  ON voice_recognition_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_attempts_user ON voice_recognition_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_attempts_session ON voice_recognition_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_attempts_timestamp ON voice_recognition_attempts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_voice_attempts_corrected ON voice_recognition_attempts(was_corrected);
CREATE INDEX IF NOT EXISTS idx_voice_attempts_initial_product ON voice_recognition_attempts(initial_product_id);
CREATE INDEX IF NOT EXISTS idx_voice_attempts_final_product ON voice_recognition_attempts(final_product_id);
CREATE INDEX IF NOT EXISTS idx_voice_attempts_phrase ON voice_recognition_attempts(original_phrase);

-- View: Products with most corrections
CREATE OR REPLACE VIEW problem_products_view AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.index as product_index,
  p.display_category as category,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE vra.was_corrected = true) as corrections_count,
  ROUND(
    (COUNT(*) FILTER (WHERE vra.was_corrected = true)::numeric / COUNT(*)::numeric) * 100,
    2
  ) as correction_rate_percent,
  AVG(vra.confidence_score) as avg_confidence,
  COUNT(DISTINCT vra.user_id) as unique_users,
  MAX(vra.timestamp) as last_attempt
FROM voice_recognition_attempts vra
JOIN products p ON p.id = vra.initial_product_id
WHERE vra.initial_product_id IS NOT NULL
GROUP BY p.id, p.name, p.index, p.display_category
HAVING COUNT(*) >= 3
ORDER BY correction_rate_percent DESC, corrections_count DESC;

-- View: Phrase to product mapping
CREATE OR REPLACE VIEW phrase_mapping_view AS
SELECT 
  LOWER(TRIM(vra.original_phrase)) as phrase,
  p.id as product_id,
  p.name as product_name,
  p.index as product_index,
  COUNT(*) as usage_count,
  COUNT(DISTINCT vra.user_id) as unique_users,
  ROUND(AVG(vra.confidence_score), 2) as avg_confidence,
  BOOL_OR(vra.was_corrected) as has_corrections,
  COUNT(*) FILTER (WHERE vra.was_corrected = true) as correction_count,
  MAX(vra.timestamp) as last_used
FROM voice_recognition_attempts vra
JOIN products p ON p.id = vra.final_product_id
WHERE vra.final_product_id IS NOT NULL
  AND LENGTH(TRIM(vra.original_phrase)) > 2
GROUP BY LOWER(TRIM(vra.original_phrase)), p.id, p.name, p.index
ORDER BY usage_count DESC;

-- View: Phrase conflicts (same phrase, different products)
CREATE OR REPLACE VIEW phrase_conflicts_view AS
WITH phrase_stats AS (
  SELECT 
    LOWER(TRIM(vra.original_phrase)) as phrase,
    COUNT(DISTINCT vra.final_product_id) as distinct_products,
    COUNT(*) as total_uses,
    COUNT(DISTINCT vra.user_id) as unique_users
  FROM voice_recognition_attempts vra
  WHERE vra.final_product_id IS NOT NULL
    AND LENGTH(TRIM(vra.original_phrase)) > 2
  GROUP BY LOWER(TRIM(vra.original_phrase))
  HAVING COUNT(DISTINCT vra.final_product_id) > 1
)
SELECT 
  ps.phrase,
  ps.distinct_products,
  ps.total_uses,
  ps.unique_users,
  json_agg(
    json_build_object(
      'product_id', p.id,
      'product_name', p.name,
      'product_index', p.index,
      'usage_count', pmap.usage_count,
      'user_count', pmap.unique_users
    )
    ORDER BY pmap.usage_count DESC
  ) as product_mappings
FROM phrase_stats ps
JOIN phrase_mapping_view pmap ON ps.phrase = pmap.phrase
JOIN products p ON p.id = pmap.product_id
GROUP BY ps.phrase, ps.distinct_products, ps.total_uses, ps.unique_users
ORDER BY ps.distinct_products DESC, ps.total_uses DESC;