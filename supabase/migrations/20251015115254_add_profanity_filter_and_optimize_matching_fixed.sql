/*
  # Profanity Filter and Optimized Matching System

  1. New Tables
    - `profanity_words` - lista wulgaryzmów do filtrowania
    - `profanity_logs` - logi wykrytych wulgaryzmów

  2. New Functions
    - `contains_profanity(text)` - sprawdza czy tekst zawiera wulgaryzmy
    - `clean_profanity(text)` - usuwa wulgaryzmy z tekstu
    - `smart_product_match(phrase, store_id)` - inteligentne dopasowanie łączące wszystkie metody

  3. How it works:
    - System filtruje wulgaryzmy przed przetworzeniem
    - Łączy mapowanie fraz + uczenie się + dopasowanie tekstowe
    - Zwraca najlepsze dopasowanie z wysoką pewnością
*/

-- Enable pg_trgm extension first (for fuzzy matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create profanity words table
CREATE TABLE IF NOT EXISTS profanity_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  severity text NOT NULL DEFAULT 'medium',
  replacement text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profanity_words_active 
  ON profanity_words(word) WHERE is_active = true;

-- Enable RLS
ALTER TABLE profanity_words ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active profanity words
CREATE POLICY "Anyone can read active profanity words"
  ON profanity_words
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Only admins can manage profanity words
CREATE POLICY "Only admins can manage profanity words"
  ON profanity_words
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert common Polish profanity words
INSERT INTO profanity_words (word, severity, replacement) VALUES
  ('kurwa', 'high', '[cenzura]'),
  ('kutas', 'high', '[cenzura]'),
  ('chuj', 'high', '[cenzura]'),
  ('pizda', 'high', '[cenzura]'),
  ('jebać', 'high', '[cenzura]'),
  ('jebany', 'high', '[cenzura]'),
  ('pierdolić', 'high', '[cenzura]'),
  ('pierdolony', 'high', '[cenzura]'),
  ('suka', 'medium', '[cenzura]'),
  ('sukinsyn', 'medium', '[cenzura]'),
  ('gówno', 'medium', '[cenzura]'),
  ('srać', 'medium', '[cenzura]'),
  ('dupek', 'medium', '[cenzura]'),
  ('dupa', 'low', null),
  ('cholera', 'low', null)
ON CONFLICT (word) DO NOTHING;

-- Function to check if text contains profanity
CREATE OR REPLACE FUNCTION contains_profanity(input_text text)
RETURNS boolean AS $$
DECLARE
  profanity_found boolean;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 
    FROM profanity_words pw
    WHERE pw.is_active = true
      AND LOWER(input_text) ~ ('\y' || LOWER(pw.word) || '\y')
  ) INTO profanity_found;

  RETURN profanity_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to clean profanity from text
CREATE OR REPLACE FUNCTION clean_profanity(input_text text)
RETURNS text AS $$
DECLARE
  cleaned_text text;
  profanity_rec RECORD;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN input_text;
  END IF;

  cleaned_text := input_text;

  FOR profanity_rec IN 
    SELECT word, replacement, severity
    FROM profanity_words
    WHERE is_active = true
    ORDER BY LENGTH(word) DESC
  LOOP
    IF profanity_rec.severity IN ('high', 'medium') THEN
      cleaned_text := REGEXP_REPLACE(
        cleaned_text,
        '\y' || profanity_rec.word || '\y',
        COALESCE(profanity_rec.replacement, '***'),
        'gi'
      );
    END IF;
  END LOOP;

  RETURN cleaned_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Optimized smart product matching function
CREATE OR REPLACE FUNCTION smart_product_match(
  search_phrase text,
  p_store_id uuid,
  max_results integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  product_index text,
  match_method text,
  confidence numeric,
  match_score integer
) AS $$
DECLARE
  cleaned_phrase text;
  mapped_phrase text;
  normalized_phrase text;
BEGIN
  cleaned_phrase := clean_profanity(search_phrase);
  normalized_phrase := LOWER(TRIM(cleaned_phrase));

  -- Try phrase mapping first
  SELECT vpm.mapped_phrase INTO mapped_phrase
  FROM voice_phrase_mappings vpm
  WHERE vpm.store_id = p_store_id
    AND LOWER(TRIM(vpm.spoken_phrase)) = normalized_phrase
    AND vpm.confidence >= 70
  ORDER BY vpm.confidence DESC
  LIMIT 1;

  IF mapped_phrase IS NOT NULL THEN
    normalized_phrase := LOWER(TRIM(mapped_phrase));
  END IF;

  RETURN QUERY
  WITH learned_matches AS (
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.index as product_index,
      'learned'::text as match_method,
      ROUND((COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 2) as confidence,
      1000 + COUNT(*)::integer as match_score
    FROM voice_learning_corrections vlc
    JOIN products p ON p.id = vlc.selected_product_id
    WHERE vlc.store_id = p_store_id
      AND LOWER(TRIM(vlc.spoken_phrase)) = normalized_phrase
      AND vlc.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY p.id, p.name, p.index
    HAVING COUNT(*) >= 2
  ),
  exact_matches AS (
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.index as product_index,
      'exact'::text as match_method,
      100::numeric as confidence,
      2000::integer as match_score
    FROM products p
    WHERE p.store_id = p_store_id
      AND LOWER(p.name) = normalized_phrase
  ),
  fuzzy_matches AS (
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.index as product_index,
      'fuzzy'::text as match_method,
      CASE 
        WHEN LOWER(p.name) LIKE normalized_phrase || '%' THEN 90::numeric
        WHEN LOWER(p.name) LIKE '%' || normalized_phrase || '%' THEN 70::numeric
        ELSE 50::numeric
      END as confidence,
      CASE 
        WHEN LOWER(p.name) LIKE normalized_phrase || '%' THEN 500
        WHEN LOWER(p.name) LIKE '%' || normalized_phrase || '%' THEN 300
        ELSE 100
      END::integer as match_score
    FROM products p
    WHERE p.store_id = p_store_id
      AND (
        LOWER(p.name) LIKE normalized_phrase || '%'
        OR LOWER(p.name) LIKE '%' || normalized_phrase || '%'
      )
      AND LENGTH(normalized_phrase) >= 3
  ),
  all_matches AS (
    SELECT * FROM learned_matches
    UNION ALL
    SELECT * FROM exact_matches
    UNION ALL
    SELECT * FROM fuzzy_matches
  )
  SELECT DISTINCT ON (am.product_id)
    am.product_id,
    am.product_name,
    am.product_index,
    am.match_method,
    am.confidence,
    am.match_score
  FROM all_matches am
  ORDER BY am.product_id, am.match_score DESC, am.confidence DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes to improve product search
CREATE INDEX IF NOT EXISTS idx_products_name_lower 
  ON products (LOWER(name));

-- Try to create trigram index, but don't fail if it doesn't work
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
    ON products USING gin (LOWER(name) gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create trigram index: %', SQLERRM;
END $$;

-- Profanity logs table
CREATE TABLE IF NOT EXISTS profanity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  original_text text NOT NULL,
  cleaned_text text NOT NULL,
  detected_words text[],
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profanity_logs_created 
  ON profanity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profanity_logs_user 
  ON profanity_logs(user_id);

ALTER TABLE profanity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view profanity logs"
  ON profanity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to log profanity
CREATE OR REPLACE FUNCTION log_profanity_attempt(
  p_user_id uuid,
  p_store_id uuid,
  p_original_text text
)
RETURNS void AS $$
DECLARE
  p_cleaned_text text;
  p_detected_words text[];
BEGIN
  p_cleaned_text := clean_profanity(p_original_text);
  
  SELECT ARRAY_AGG(pw.word)
  INTO p_detected_words
  FROM profanity_words pw
  WHERE pw.is_active = true
    AND LOWER(p_original_text) ~ ('\y' || LOWER(pw.word) || '\y');

  IF p_detected_words IS NOT NULL AND ARRAY_LENGTH(p_detected_words, 1) > 0 THEN
    INSERT INTO profanity_logs (
      user_id,
      store_id,
      original_text,
      cleaned_text,
      detected_words
    ) VALUES (
      p_user_id,
      p_store_id,
      p_original_text,
      p_cleaned_text,
      p_detected_words
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;