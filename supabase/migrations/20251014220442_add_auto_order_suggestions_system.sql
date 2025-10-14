/*
  # Auto Order Suggestions System

  1. New Tables
    - `product_order_stats`
      - Stores aggregated statistics for each product per store
      - `store_id` (uuid, foreign key to stores)
      - `product_id` (uuid, foreign key to products)
      - `avg_quantity` (decimal) - Average quantity ordered
      - `order_frequency_days` (decimal) - Average days between orders
      - `last_ordered_at` (timestamptz) - Last time this product was ordered
      - `total_orders_count` (integer) - Total number of orders containing this product
      - `trend` (text) - Trend indicator: 'increasing', 'stable', 'decreasing'
      - `last_calculated_at` (timestamptz) - When these stats were last calculated

    - `auto_order_suggestions`
      - Stores generated order suggestions (cache)
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores, unique)
      - `suggestion_data` (jsonb) - Complete suggestion with products and metadata
      - `confidence_score` (decimal) - Overall confidence in this suggestion (0-1)
      - `based_on_orders_count` (integer) - Number of orders analyzed
      - `generation_time_ms` (integer) - Time taken to generate (for monitoring)
      - `generated_at` (timestamptz) - When this suggestion was created
      - `valid_until` (timestamptz) - When this cache expires (typically +24h)
      - `manually_triggered` (boolean) - Whether this was manually refreshed

    - `auto_order_logs`
      - Logs all generation attempts for monitoring
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `triggered_by` (uuid, foreign key to users, nullable)
      - `manually_triggered` (boolean) - Manual vs scheduled
      - `success` (boolean) - Whether generation succeeded
      - `execution_time_ms` (integer) - Time taken
      - `error_message` (text, nullable) - Error if failed
      - `products_count` (integer) - Number of products in suggestion
      - `created_at` (timestamptz)

    - `auto_order_feedback`
      - Tracks user modifications to learn and improve
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `product_id` (uuid, foreign key to products)
      - `suggested_qty` (decimal) - What AI suggested
      - `actual_qty` (decimal, nullable) - What user actually ordered
      - `accepted` (boolean) - Whether product was kept in order
      - `was_manually_refreshed` (boolean) - If suggestion was refreshed before ordering
      - `feedback_date` (timestamptz)

  2. Schema Changes
    - Add `last_auto_suggestion_at` to stores table
    - Add `auto_suggestions_enabled` to stores table (default true)

  3. Indexes
    - Index on product_order_stats(store_id, product_id)
    - Index on auto_order_suggestions(store_id, generated_at)
    - Index on auto_order_logs(store_id, created_at)
    - Index on auto_order_feedback(store_id, feedback_date)

  4. Security
    - Enable RLS on all new tables
    - Store managers can read their own store's data
    - Only system/admin can write to these tables
    - Operators can read all stores
*/

-- Create product_order_stats table
CREATE TABLE IF NOT EXISTS product_order_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  avg_quantity decimal(10,2) NOT NULL DEFAULT 0,
  order_frequency_days decimal(10,2),
  last_ordered_at timestamptz,
  total_orders_count integer NOT NULL DEFAULT 0,
  trend text CHECK (trend IN ('increasing', 'stable', 'decreasing', 'unknown')) DEFAULT 'unknown',
  last_calculated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- Create auto_order_suggestions table
CREATE TABLE IF NOT EXISTS auto_order_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  suggestion_data jsonb NOT NULL,
  confidence_score decimal(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  based_on_orders_count integer NOT NULL DEFAULT 0,
  generation_time_ms integer,
  generated_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  manually_triggered boolean DEFAULT false
);

-- Create auto_order_logs table
CREATE TABLE IF NOT EXISTS auto_order_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES users(id) ON DELETE SET NULL,
  manually_triggered boolean DEFAULT false,
  success boolean NOT NULL,
  execution_time_ms integer,
  error_message text,
  products_count integer,
  created_at timestamptz DEFAULT now()
);

-- Create auto_order_feedback table
CREATE TABLE IF NOT EXISTS auto_order_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  suggested_qty decimal(10,2) NOT NULL,
  actual_qty decimal(10,2),
  accepted boolean NOT NULL,
  was_manually_refreshed boolean DEFAULT false,
  feedback_date timestamptz DEFAULT now()
);

-- Add columns to stores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'last_auto_suggestion_at'
  ) THEN
    ALTER TABLE stores ADD COLUMN last_auto_suggestion_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'auto_suggestions_enabled'
  ) THEN
    ALTER TABLE stores ADD COLUMN auto_suggestions_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_order_stats_store_product 
  ON product_order_stats(store_id, product_id);

CREATE INDEX IF NOT EXISTS idx_product_order_stats_last_calculated 
  ON product_order_stats(last_calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_order_suggestions_store 
  ON auto_order_suggestions(store_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_order_suggestions_valid 
  ON auto_order_suggestions(valid_until);

CREATE INDEX IF NOT EXISTS idx_auto_order_logs_store_date 
  ON auto_order_logs(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_order_feedback_store_date 
  ON auto_order_feedback(store_id, feedback_date DESC);

-- Enable Row Level Security
ALTER TABLE product_order_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_order_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_order_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_order_stats
CREATE POLICY "Store managers can view their store stats"
  ON product_order_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.store_id = product_order_stats.store_id
      AND users.role IN ('store_manager', 'salesperson')
    )
  );

CREATE POLICY "Operators and admins can view all stats"
  ON product_order_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('operator', 'admin')
    )
  );

-- RLS Policies for auto_order_suggestions
CREATE POLICY "Store managers can view their suggestions"
  ON auto_order_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.store_id = auto_order_suggestions.store_id
      AND users.role IN ('store_manager', 'salesperson')
    )
  );

CREATE POLICY "Operators and admins can view all suggestions"
  ON auto_order_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('operator', 'admin')
    )
  );

-- RLS Policies for auto_order_logs
CREATE POLICY "Admins can view all logs"
  ON auto_order_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Store managers can view their store logs"
  ON auto_order_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.store_id = auto_order_logs.store_id
      AND users.role IN ('store_manager', 'salesperson')
    )
  );

-- RLS Policies for auto_order_feedback
CREATE POLICY "Admins can view all feedback"
  ON auto_order_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
