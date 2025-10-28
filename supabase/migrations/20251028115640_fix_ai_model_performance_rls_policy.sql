/*
  # Naprawa RLS policy dla ai_model_performance

  1. Problem
    - Trigger automatycznie wstawia dane do ai_model_performance
    - Obecna polityka INSERT wymaga uwierzytelnienia ale trigger działa w kontekście użytkownika
    - To powoduje błąd: new row violates row-level security policy

  2. Rozwiązanie
    - Zmień funkcję triggera na SECURITY DEFINER
    - Lub usuń politykę RLS i pozwól wszystkim authenticated użytkownikom na INSERT
*/

-- Najpierw usuń istniejące polityki
DROP POLICY IF EXISTS "System can update model performance" ON ai_model_performance;
DROP POLICY IF EXISTS "System can update existing model performance" ON ai_model_performance;

-- Dodaj nowe polityki które pozwalają wszystkim authenticated użytkownikom
CREATE POLICY "Authenticated users can insert model performance"
  ON ai_model_performance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update model performance"
  ON ai_model_performance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Upewnij się że funkcja triggera ma SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_ai_model_performance()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO ai_model_performance (
    model_name,
    total_operations,
    successful_operations,
    average_duration_ms,
    last_updated
  )
  SELECT
    'transformers-js-embedding',
    COUNT(*),
    SUM(CASE WHEN success THEN 1 ELSE 0 END),
    AVG(duration_ms),
    now()
  FROM ai_metrics
  WHERE metric_type = 'embedding_generation'
  ON CONFLICT (model_name)
  DO UPDATE SET
    total_operations = EXCLUDED.total_operations,
    successful_operations = EXCLUDED.successful_operations,
    average_duration_ms = EXCLUDED.average_duration_ms,
    last_updated = now();

  RETURN NEW;
END;
$$;