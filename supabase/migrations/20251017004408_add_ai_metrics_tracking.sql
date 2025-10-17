/*
  # AI Metrics Tracking System
  
  1. New Tables
    - `ai_metrics`
      - `id` (uuid, primary key)
      - `metric_type` (text) - Type of metric: 'embedding_generation', 'clustering_operation', 'similarity_search'
      - `operation_name` (text) - Name of the operation
      - `duration_ms` (integer) - Duration in milliseconds
      - `input_size` (integer) - Size of input data
      - `output_size` (integer) - Size of output data
      - `success` (boolean) - Whether operation succeeded
      - `error_message` (text) - Error message if failed
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz)
      - `user_id` (uuid) - User who triggered the operation
    
    - `ai_model_performance`
      - `id` (uuid, primary key)
      - `model_name` (text) - Name of the AI model
      - `total_operations` (integer) - Total number of operations
      - `successful_operations` (integer) - Number of successful operations
      - `average_duration_ms` (numeric) - Average duration
      - `last_updated` (timestamptz)
    
  2. Security
    - Enable RLS on both tables
    - Admins and analysts can view all metrics
    - System can insert metrics
    
  3. Indexes
    - Index on created_at for time-based queries
    - Index on metric_type for filtering
    - Index on user_id for user-specific metrics
*/

-- Create ai_metrics table
CREATE TABLE IF NOT EXISTS ai_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  operation_name text NOT NULL,
  duration_ms integer NOT NULL,
  input_size integer DEFAULT 0,
  output_size integer DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create ai_model_performance table
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text UNIQUE NOT NULL,
  total_operations integer DEFAULT 0,
  successful_operations integer DEFAULT 0,
  average_duration_ms numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_metrics
CREATE POLICY "Admins and analysts can view all AI metrics"
  ON ai_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "System can insert AI metrics"
  ON ai_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ai_model_performance
CREATE POLICY "Admins and analysts can view model performance"
  ON ai_model_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "System can update model performance"
  ON ai_model_performance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update existing model performance"
  ON ai_model_performance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_metrics_created_at ON ai_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_type ON ai_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_user_id ON ai_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_success ON ai_metrics(success);

-- Function to update model performance
CREATE OR REPLACE FUNCTION update_ai_model_performance()
RETURNS TRIGGER AS $$
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
    last_updated = EXCLUDED.last_updated;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update performance metrics
DROP TRIGGER IF EXISTS update_model_performance_trigger ON ai_metrics;
CREATE TRIGGER update_model_performance_trigger
  AFTER INSERT ON ai_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_model_performance();

-- Insert initial model performance record
INSERT INTO ai_model_performance (model_name, total_operations, successful_operations, average_duration_ms)
VALUES ('transformers-js-embedding', 0, 0, 0)
ON CONFLICT (model_name) DO NOTHING;