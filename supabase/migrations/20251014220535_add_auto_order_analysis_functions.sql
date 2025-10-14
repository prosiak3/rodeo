/*
  # Auto Order Analysis Functions

  1. Functions
    - `calculate_product_order_stats(p_store_id uuid)` 
      - Analyzes order history and updates product_order_stats table
      - Calculates average quantities, frequency, trends
      
    - `generate_auto_order_suggestion(p_store_id uuid)`
      - Generates complete order suggestion based on stats
      - Returns JSONB with products, quantities, confidence scores
      - Uses burn rate algorithm to predict needs

  2. Algorithm Details
    - Analyzes last 180 days of orders with status: sent, confirmed, partially_confirmed
    - Weights: last 30 days (50%), 30-90 days (30%), 90-180 days (20%)
    - Burn rate: average days between orders for each product
    - Includes product if: days_since_last_order >= 80% of average_cycle
    - Trend detection: compare last 30 days vs previous 60 days

  3. Notes
    - Ignores delivery_date (assumes delivery at sent_at)
    - Minimum 3 historical orders required per product
    - Products ordered < once per 60 days get lower priority
*/

-- Function to calculate product order statistics for a store
CREATE OR REPLACE FUNCTION calculate_product_order_stats(p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_order_dates timestamptz[];
  v_quantities decimal[];
  v_avg_quantity decimal;
  v_frequency_days decimal;
  v_last_ordered timestamptz;
  v_total_count integer;
  v_trend text;
  v_recent_avg decimal;
  v_older_avg decimal;
BEGIN
  -- Loop through all products that have been ordered by this store
  FOR v_product IN
    SELECT DISTINCT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = p_store_id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.sent_at IS NOT NULL
      AND o.sent_at >= NOW() - INTERVAL '180 days'
  LOOP
    -- Get all order dates and quantities for this product (last 180 days)
    SELECT 
      array_agg(o.sent_at ORDER BY o.sent_at),
      array_agg(oi.quantity ORDER BY o.sent_at)
    INTO v_order_dates, v_quantities
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = p_store_id
      AND oi.product_id = v_product.product_id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.sent_at IS NOT NULL
      AND o.sent_at >= NOW() - INTERVAL '180 days'
    ORDER BY o.sent_at;

    v_total_count := array_length(v_order_dates, 1);
    
    -- Skip if less than 2 orders
    IF v_total_count < 2 THEN
      CONTINUE;
    END IF;

    -- Calculate weighted average quantity
    -- Last 30 days: 50%, 30-90 days: 30%, 90-180 days: 20%
    WITH weighted_quantities AS (
      SELECT 
        CASE 
          WHEN o.sent_at >= NOW() - INTERVAL '30 days' THEN oi.quantity * 0.5
          WHEN o.sent_at >= NOW() - INTERVAL '90 days' THEN oi.quantity * 0.3
          ELSE oi.quantity * 0.2
        END as weighted_qty,
        CASE 
          WHEN o.sent_at >= NOW() - INTERVAL '30 days' THEN 0.5
          WHEN o.sent_at >= NOW() - INTERVAL '90 days' THEN 0.3
          ELSE 0.2
        END as weight
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.store_id = p_store_id
        AND oi.product_id = v_product.product_id
        AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
        AND o.sent_at IS NOT NULL
        AND o.sent_at >= NOW() - INTERVAL '180 days'
    )
    SELECT 
      COALESCE(SUM(weighted_qty) / NULLIF(SUM(weight), 0), 0)
    INTO v_avg_quantity
    FROM weighted_quantities;

    -- Calculate average frequency (days between orders)
    WITH order_intervals AS (
      SELECT 
        o.sent_at,
        LAG(o.sent_at) OVER (ORDER BY o.sent_at) as prev_sent_at
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.store_id = p_store_id
        AND oi.product_id = v_product.product_id
        AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
        AND o.sent_at IS NOT NULL
        AND o.sent_at >= NOW() - INTERVAL '180 days'
    )
    SELECT AVG(EXTRACT(EPOCH FROM (sent_at - prev_sent_at)) / 86400)
    INTO v_frequency_days
    FROM order_intervals
    WHERE prev_sent_at IS NOT NULL;

    -- Get last order date
    v_last_ordered := v_order_dates[array_length(v_order_dates, 1)];

    -- Calculate trend (compare last 30 days vs 30-90 days ago)
    SELECT AVG(oi.quantity)
    INTO v_recent_avg
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = p_store_id
      AND oi.product_id = v_product.product_id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.sent_at IS NOT NULL
      AND o.sent_at >= NOW() - INTERVAL '30 days';

    SELECT AVG(oi.quantity)
    INTO v_older_avg
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = p_store_id
      AND oi.product_id = v_product.product_id
      AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
      AND o.sent_at IS NOT NULL
      AND o.sent_at >= NOW() - INTERVAL '90 days'
      AND o.sent_at < NOW() - INTERVAL '30 days';

    -- Determine trend
    IF v_recent_avg IS NULL OR v_older_avg IS NULL THEN
      v_trend := 'unknown';
    ELSIF v_recent_avg > v_older_avg * 1.15 THEN
      v_trend := 'increasing';
    ELSIF v_recent_avg < v_older_avg * 0.85 THEN
      v_trend := 'decreasing';
    ELSE
      v_trend := 'stable';
    END IF;

    -- Insert or update stats
    INSERT INTO product_order_stats (
      store_id,
      product_id,
      avg_quantity,
      order_frequency_days,
      last_ordered_at,
      total_orders_count,
      trend,
      last_calculated_at
    ) VALUES (
      p_store_id,
      v_product.product_id,
      v_avg_quantity,
      v_frequency_days,
      v_last_ordered,
      v_total_count,
      v_trend,
      NOW()
    )
    ON CONFLICT (store_id, product_id)
    DO UPDATE SET
      avg_quantity = EXCLUDED.avg_quantity,
      order_frequency_days = EXCLUDED.order_frequency_days,
      last_ordered_at = EXCLUDED.last_ordered_at,
      total_orders_count = EXCLUDED.total_orders_count,
      trend = EXCLUDED.trend,
      last_calculated_at = EXCLUDED.last_calculated_at;
  END LOOP;
END;
$$;

-- Function to generate auto order suggestion
CREATE OR REPLACE FUNCTION generate_auto_order_suggestion(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suggestion jsonb;
  v_products jsonb := '[]'::jsonb;
  v_product RECORD;
  v_days_since_last decimal;
  v_threshold_days decimal;
  v_suggested_qty decimal;
  v_priority text;
  v_confidence decimal;
  v_total_orders_analyzed integer;
  v_product_count integer := 0;
BEGIN
  -- First, refresh statistics
  PERFORM calculate_product_order_stats(p_store_id);

  -- Count total orders analyzed
  SELECT COUNT(DISTINCT o.id)
  INTO v_total_orders_analyzed
  FROM orders o
  WHERE o.store_id = p_store_id
    AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
    AND o.sent_at IS NOT NULL
    AND o.sent_at >= NOW() - INTERVAL '180 days';

  -- Return early if insufficient data
  IF v_total_orders_analyzed < 5 THEN
    RETURN jsonb_build_object(
      'error', 'insufficient_data',
      'message', 'Potrzeba minimum 5 historycznych zamówień',
      'orders_analyzed', v_total_orders_analyzed
    );
  END IF;

  -- Loop through products and determine which should be in suggestion
  FOR v_product IN
    SELECT 
      pos.*,
      p.name,
      p.code,
      p.category,
      p.unit,
      p.base_price,
      p.index,
      p.average_weight
    FROM product_order_stats pos
    JOIN products p ON p.id = pos.product_id
    WHERE pos.store_id = p_store_id
      AND pos.total_orders_count >= 3
      AND pos.order_frequency_days IS NOT NULL
      AND pos.last_ordered_at IS NOT NULL
      AND p.active = true
    ORDER BY pos.last_ordered_at ASC
  LOOP
    -- Calculate days since last order
    v_days_since_last := EXTRACT(EPOCH FROM (NOW() - v_product.last_ordered_at)) / 86400;
    
    -- Calculate threshold (80% of average cycle)
    v_threshold_days := v_product.order_frequency_days * 0.8;
    
    -- Skip products with very long cycles (> 60 days)
    IF v_product.order_frequency_days > 60 THEN
      CONTINUE;
    END IF;

    -- Include product if we're at or past 80% of the cycle
    IF v_days_since_last >= v_threshold_days THEN
      -- Calculate suggested quantity with trend adjustment
      v_suggested_qty := v_product.avg_quantity;
      
      IF v_product.trend = 'increasing' THEN
        v_suggested_qty := v_suggested_qty * 1.10; -- +10% for growing trend
      ELSIF v_product.trend = 'decreasing' THEN
        v_suggested_qty := v_suggested_qty * 0.95; -- -5% for declining trend
      END IF;

      -- Round to reasonable precision based on unit
      v_suggested_qty := ROUND(v_suggested_qty, 2);

      -- Determine priority
      IF v_days_since_last >= v_product.order_frequency_days * 1.2 THEN
        v_priority := 'urgent';
        v_confidence := 0.95;
      ELSIF v_days_since_last >= v_product.order_frequency_days THEN
        v_priority := 'high';
        v_confidence := 0.85;
      ELSIF v_days_since_last >= v_threshold_days THEN
        v_priority := 'medium';
        v_confidence := 0.70;
      ELSE
        v_priority := 'low';
        v_confidence := 0.50;
      END IF;

      -- Add product to suggestion
      v_products := v_products || jsonb_build_object(
        'product_id', v_product.product_id,
        'name', v_product.name,
        'code', v_product.code,
        'category', v_product.category,
        'unit', v_product.unit,
        'base_price', v_product.base_price,
        'index', v_product.index,
        'average_weight', v_product.average_weight,
        'suggested_quantity', v_suggested_qty,
        'last_ordered_days_ago', ROUND(v_days_since_last, 1),
        'avg_cycle_days', ROUND(v_product.order_frequency_days, 1),
        'trend', v_product.trend,
        'priority', v_priority,
        'confidence', v_confidence,
        'total_orders_count', v_product.total_orders_count
      );

      v_product_count := v_product_count + 1;
    END IF;
  END LOOP;

  -- Build final suggestion
  v_suggestion := jsonb_build_object(
    'store_id', p_store_id,
    'products', v_products,
    'metadata', jsonb_build_object(
      'generated_at', NOW(),
      'based_on_orders_count', v_total_orders_analyzed,
      'analysis_period_days', 180,
      'products_count', v_product_count,
      'algorithm_version', '1.0'
    )
  );

  RETURN v_suggestion;
END;
$$;
