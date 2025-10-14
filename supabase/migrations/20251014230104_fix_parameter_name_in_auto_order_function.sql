/*
  # Fix parameter name in auto order function

  ## Problem
  Edge function calls generate_auto_order_suggestion with p_analysis_days
  but function expects p_analysis_period_days

  ## Solution
  Rename parameter to match edge function call: p_analysis_days
*/

-- Drop existing function
DROP FUNCTION IF EXISTS generate_auto_order_suggestion(uuid, integer);

-- Create function with correct parameter name
CREATE OR REPLACE FUNCTION generate_auto_order_suggestion(
  p_store_id uuid,
  p_analysis_days integer DEFAULT 180
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_suggested_products jsonb := '[]'::jsonb;
  v_days_since_last decimal;
  v_threshold_days decimal;
  v_confidence_score integer;
  v_suggested_quantity decimal;
  v_total_orders_analyzed integer;
BEGIN
  -- First, calculate stats for this store with the specified period
  PERFORM calculate_product_order_stats(p_store_id, p_analysis_days);

  -- Count total orders analyzed
  SELECT COUNT(DISTINCT o.id)
  INTO v_total_orders_analyzed
  FROM orders o
  WHERE o.store_id = p_store_id
    AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
    AND o.sent_at IS NOT NULL
    AND o.sent_at >= NOW() - make_interval(days => p_analysis_days);

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
      p.display_category as category,
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

    -- Include product if it's due for reorder
    IF v_days_since_last >= v_threshold_days THEN
      -- Calculate confidence score (0-100)
      v_confidence_score := LEAST(100, GREATEST(0,
        50 + -- Base confidence
        (v_product.total_orders_count * 5) + -- More orders = more confidence
        CASE v_product.trend
          WHEN 'increasing' THEN 15
          WHEN 'stable' THEN 10
          WHEN 'decreasing' THEN -10
          ELSE 0
        END +
        CASE
          WHEN v_days_since_last >= v_product.order_frequency_days THEN 20 -- Overdue
          WHEN v_days_since_last >= v_threshold_days THEN 10 -- Due soon
          ELSE 0
        END
      ));

      -- Suggested quantity with trend adjustment
      v_suggested_quantity := v_product.weighted_avg_quantity *
        CASE v_product.trend
          WHEN 'increasing' THEN 1.15
          WHEN 'decreasing' THEN 0.85
          ELSE 1.0
        END;

      -- Round to reasonable increments based on unit
      IF v_product.unit = 'kg' THEN
        v_suggested_quantity := ROUND(v_suggested_quantity * 2) / 2; -- Round to 0.5 kg
      ELSIF v_product.unit = 'szt' THEN
        v_suggested_quantity := CEIL(v_suggested_quantity); -- Round up to whole pieces
      ELSE
        v_suggested_quantity := ROUND(v_suggested_quantity, 1);
      END IF;

      -- Add to suggestions
      v_suggested_products := v_suggested_products || jsonb_build_object(
        'product_id', v_product.product_id,
        'name', v_product.name,
        'code', v_product.code,
        'category', v_product.category,
        'unit', v_product.unit,
        'suggested_quantity', v_suggested_quantity,
        'base_price', v_product.base_price,
        'confidence_score', v_confidence_score,
        'days_since_last_order', ROUND(v_days_since_last, 1),
        'average_frequency_days', ROUND(v_product.order_frequency_days, 1),
        'trend', v_product.trend,
        'historical_orders_count', v_product.total_orders_count,
        'index', v_product.index,
        'average_weight', v_product.average_weight
      );
    END IF;
  END LOOP;

  -- Return suggestion with metadata
  RETURN jsonb_build_object(
    'products', v_suggested_products,
    'metadata', jsonb_build_object(
      'generated_at', NOW(),
      'store_id', p_store_id,
      'based_on_orders_count', v_total_orders_analyzed,
      'analysis_period_days', p_analysis_days,
      'products_count', jsonb_array_length(v_suggested_products),
      'algorithm_version', '2.0'
    )
  );
END;
$$;