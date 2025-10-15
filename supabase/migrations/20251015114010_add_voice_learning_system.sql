/*
  # Voice Order Learning System

  1. New Tables
    - `voice_learning_corrections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users) - kto dokonał korekty
      - `store_id` (uuid, references stores) - w jakim sklepie
      - `spoken_phrase` (text) - co użytkownik podyktował (np. "karkow", "karkowka")
      - `selected_product_id` (uuid, references products) - jaki produkt ostatecznie wybrał
      - `created_at` (timestamp)
      - Indexes on spoken_phrase and store_id for fast lookups
  
  2. Functions
    - `get_learned_product_match(phrase text, store_id uuid)` - zwraca najczęściej wybierany produkt dla danej frazy
    - Returns product_id and confidence score based on frequency
  
  3. Security
    - Enable RLS on `voice_learning_corrections` table
    - Add policies for authenticated users to insert their own corrections
    - Add policies for authenticated users to read corrections from their store

  ## How it works
  When a user dictates "karkow" and then selects "Karkówka extra Rytel", the system:
  1. Records: spoken_phrase="karkow" -> selected_product_id=(ID of Karkówka extra Rytel)
  2. Next time someone dictates "karkow", the function checks history
  3. If "Karkówka extra Rytel" was selected 80% of the time, it gets higher confidence
  4. System uses this to auto-match or rank suggestions
*/

-- Create the voice learning corrections table
CREATE TABLE IF NOT EXISTS voice_learning_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  spoken_phrase text NOT NULL,
  selected_product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_voice_learning_spoken_phrase 
  ON voice_learning_corrections(spoken_phrase);
CREATE INDEX IF NOT EXISTS idx_voice_learning_store_phrase 
  ON voice_learning_corrections(store_id, spoken_phrase);
CREATE INDEX IF NOT EXISTS idx_voice_learning_created 
  ON voice_learning_corrections(created_at DESC);

-- Enable RLS
ALTER TABLE voice_learning_corrections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own corrections
CREATE POLICY "Users can record their own voice corrections"
  ON voice_learning_corrections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view corrections from their store
CREATE POLICY "Users can view corrections from their store"
  ON voice_learning_corrections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.store_id = voice_learning_corrections.store_id
    )
  );

-- Function to get the most likely product match based on learning history
CREATE OR REPLACE FUNCTION get_learned_product_match(
  phrase text,
  p_store_id uuid
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  product_index text,
  confidence numeric,
  selection_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.index as product_index,
    -- Calculate confidence: (selections for this product / total selections for this phrase) * 100
    ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 2) as confidence,
    COUNT(*) as selection_count
  FROM voice_learning_corrections vlc
  JOIN products p ON p.id = vlc.selected_product_id
  WHERE vlc.store_id = p_store_id
    AND LOWER(TRIM(vlc.spoken_phrase)) = LOWER(TRIM(phrase))
  GROUP BY p.id, p.name, p.index
  ORDER BY selection_count DESC, p.name
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to normalize spoken phrases (remove common variations)
CREATE OR REPLACE FUNCTION normalize_spoken_phrase(phrase text)
RETURNS text AS $$
BEGIN
  -- Convert to lowercase and trim
  phrase := LOWER(TRIM(phrase));
  
  -- Remove common endings/plurals
  phrase := REGEXP_REPLACE(phrase, 'ek$', '', 'g');
  phrase := REGEXP_REPLACE(phrase, 'ka$', '', 'g');
  phrase := REGEXP_REPLACE(phrase, 'ki$', '', 'g');
  phrase := REGEXP_REPLACE(phrase, 'y$', '', 'g');
  
  RETURN phrase;
END;
$$ LANGUAGE plpgsql IMMUTABLE;