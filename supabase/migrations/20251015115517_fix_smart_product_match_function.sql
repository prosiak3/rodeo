/*
  # Fix smart_product_match function

  Products table doesn't have store_id column, so we need to remove that filter
  and match products globally (they are shared across stores with price lists)
*/

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
    WHERE LOWER(p.name) = normalized_phrase
      AND p.active = true
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
    WHERE (
        LOWER(p.name) LIKE normalized_phrase || '%'
        OR LOWER(p.name) LIKE '%' || normalized_phrase || '%'
      )
      AND LENGTH(normalized_phrase) >= 3
      AND p.active = true
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