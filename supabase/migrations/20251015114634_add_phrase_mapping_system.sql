/*
  # Voice Phrase Mapping System - Advanced Learning

  1. New Tables
    - `voice_phrase_mappings`
      - Stores automatic mappings between spoken phrases and canonical forms
      - Example: "piers z kurczaka" -> "filet z kurczaka"
      - Built automatically by analyzing user corrections over time

  2. New Functions
    - `analyze_and_create_phrase_mappings()` - analyzes correction patterns and creates mappings
    - `get_phrase_mapping(phrase text)` - returns canonical form for a phrase if mapping exists
    - `apply_phrase_mapping(phrase text, store_id uuid)` - applies mappings before matching

  3. How it works:
    - When users consistently correct "piers" to products containing "filet", system learns the pattern
    - Creates mapping: "piers z kurczaka" -> "filet z kurczaka"
    - Next time someone says "piers z kurczaka", system automatically searches for "filet z kurczaka"
    - This improves matching accuracy for regional variations, synonyms, and alternative names
*/

-- Create phrase mappings table
CREATE TABLE IF NOT EXISTS voice_phrase_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  spoken_phrase text NOT NULL,
  mapped_phrase text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  usage_count integer NOT NULL DEFAULT 0,
  created_from_corrections integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(store_id, spoken_phrase)
);

CREATE INDEX IF NOT EXISTS idx_phrase_mappings_store_phrase
  ON voice_phrase_mappings(store_id, spoken_phrase);
CREATE INDEX IF NOT EXISTS idx_phrase_mappings_confidence
  ON voice_phrase_mappings(confidence DESC) WHERE confidence >= 70;

-- Enable RLS
ALTER TABLE voice_phrase_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view mappings from their store
CREATE POLICY "Users can view phrase mappings from their store"
  ON voice_phrase_mappings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.store_id = voice_phrase_mappings.store_id
    )
  );

-- Function to get phrase mapping
CREATE OR REPLACE FUNCTION get_phrase_mapping(
  phrase text,
  p_store_id uuid
)
RETURNS TABLE (
  original_phrase text,
  mapped_to_phrase text,
  confidence numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    spoken_phrase as original_phrase,
    mapped_phrase as mapped_to_phrase,
    vpm.confidence
  FROM voice_phrase_mappings vpm
  WHERE vpm.store_id = p_store_id
    AND LOWER(TRIM(vpm.spoken_phrase)) = LOWER(TRIM(phrase))
    AND vpm.confidence >= 70
  ORDER BY vpm.confidence DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract keywords from product names
CREATE OR REPLACE FUNCTION extract_product_keywords(product_name text)
RETURNS text[] AS $$
DECLARE
  keywords text[];
  cleaned_name text;
BEGIN
  cleaned_name := LOWER(TRIM(product_name));
  cleaned_name := REGEXP_REPLACE(cleaned_name, '\b(z|w|na|do|od|ze|i|a|the|with|from)\b', ' ', 'g');

  SELECT ARRAY_AGG(word)
  INTO keywords
  FROM (
    SELECT DISTINCT TRIM(word) as word
    FROM REGEXP_SPLIT_TO_TABLE(cleaned_name, '\s+') word
    WHERE LENGTH(TRIM(word)) >= 3
  ) words;

  RETURN keywords;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to analyze corrections and create phrase mappings
CREATE OR REPLACE FUNCTION analyze_and_create_phrase_mappings(
  p_store_id uuid,
  min_occurrences integer DEFAULT 3
)
RETURNS integer AS $$
DECLARE
  mappings_created integer := 0;
  correction_rec RECORD;
  product_keywords text[];
  spoken_keywords text[];
  keyword_match_count integer;
  total_keywords integer;
  confidence_score numeric;
BEGIN
  FOR correction_rec IN
    WITH correction_patterns AS (
      SELECT
        vlc.spoken_phrase,
        p.name as product_name,
        COUNT(*) as correction_count,
        COUNT(DISTINCT vlc.user_id) as user_count
      FROM voice_learning_corrections vlc
      JOIN products p ON p.id = vlc.selected_product_id
      WHERE vlc.store_id = p_store_id
        AND vlc.created_at >= NOW() - INTERVAL '90 days'
      GROUP BY vlc.spoken_phrase, p.name
      HAVING COUNT(*) >= min_occurrences
    ),
    dominant_products AS (
      SELECT DISTINCT ON (spoken_phrase)
        spoken_phrase,
        product_name,
        correction_count,
        user_count
      FROM correction_patterns
      ORDER BY spoken_phrase, correction_count DESC, user_count DESC
    )
    SELECT * FROM dominant_products
    WHERE LOWER(spoken_phrase) != LOWER(product_name)
  LOOP
    spoken_keywords := extract_product_keywords(correction_rec.spoken_phrase);
    product_keywords := extract_product_keywords(correction_rec.product_name);

    SELECT COUNT(*)
    INTO keyword_match_count
    FROM UNNEST(spoken_keywords) sk
    WHERE EXISTS (
      SELECT 1 FROM UNNEST(product_keywords) pk
      WHERE pk LIKE '%' || sk || '%' OR sk LIKE '%' || pk || '%'
    );

    total_keywords := GREATEST(ARRAY_LENGTH(spoken_keywords, 1), 1);

    confidence_score := LEAST(100,
      (correction_rec.correction_count * 15) +
      (correction_rec.user_count * 10) +
      (CASE WHEN keyword_match_count = 0 THEN 20 ELSE 0 END)
    );

    IF confidence_score >= 50 THEN
      INSERT INTO voice_phrase_mappings (
        store_id,
        spoken_phrase,
        mapped_phrase,
        confidence,
        created_from_corrections,
        updated_at
      ) VALUES (
        p_store_id,
        correction_rec.spoken_phrase,
        correction_rec.product_name,
        confidence_score,
        correction_rec.correction_count,
        NOW()
      )
      ON CONFLICT (store_id, spoken_phrase)
      DO UPDATE SET
        mapped_phrase = EXCLUDED.mapped_phrase,
        confidence = EXCLUDED.confidence,
        created_from_corrections = EXCLUDED.created_from_corrections,
        updated_at = NOW();

      mappings_created := mappings_created + 1;
    END IF;
  END LOOP;

  RETURN mappings_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply phrase mappings before matching
CREATE OR REPLACE FUNCTION apply_phrase_mapping(
  phrase text,
  p_store_id uuid
)
RETURNS text AS $$
DECLARE
  mapped_phrase text;
BEGIN
  SELECT mapped_to_phrase
  INTO mapped_phrase
  FROM get_phrase_mapping(phrase, p_store_id);

  IF mapped_phrase IS NOT NULL THEN
    UPDATE voice_phrase_mappings
    SET
      usage_count = usage_count + 1,
      last_used_at = NOW()
    WHERE store_id = p_store_id
      AND LOWER(TRIM(spoken_phrase)) = LOWER(TRIM(phrase));

    RETURN mapped_phrase;
  END IF;

  RETURN phrase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically analyze and create mappings
CREATE OR REPLACE FUNCTION trigger_analyze_mappings()
RETURNS TRIGGER AS $$
DECLARE
  correction_count integer;
BEGIN
  SELECT COUNT(*)
  INTO correction_count
  FROM voice_learning_corrections
  WHERE store_id = NEW.store_id
    AND created_at > (
      SELECT COALESCE(MAX(updated_at), NOW() - INTERVAL '1 day')
      FROM voice_phrase_mappings
      WHERE store_id = NEW.store_id
    );

  IF correction_count >= 10 THEN
    PERFORM analyze_and_create_phrase_mappings(NEW.store_id, 3);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_analyze_phrase_mappings
  AFTER INSERT ON voice_learning_corrections
  FOR EACH ROW
  EXECUTE FUNCTION trigger_analyze_mappings();

-- Create initial mappings for existing corrections
DO $$
DECLARE
  store_record RECORD;
  created_count integer;
BEGIN
  FOR store_record IN SELECT DISTINCT id FROM stores LOOP
    SELECT analyze_and_create_phrase_mappings(store_record.id, 2)
    INTO created_count;

    IF created_count > 0 THEN
      RAISE NOTICE 'Created % phrase mappings for store %', created_count, store_record.id;
    END IF;
  END LOOP;
END $$;