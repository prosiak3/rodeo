/*
  # Add Seasonal Trends Analysis Function

  1. New Functions
    - `get_seasonal_trends` - Returns monthly trends for categories and products
    - Analyzes last N months of data for a specific store
    - Returns category quantities by month for visualization

  2. Purpose
    - Support seasonal analysis in analytics panel
    - Identify trends like "more meat in summer for grilling"
    - Help with automatic order suggestions
*/

CREATE OR REPLACE FUNCTION get_seasonal_trends(
  p_store_id uuid,
  p_months integer DEFAULT 12
)
RETURNS TABLE (
  month integer,
  month_name text,
  category text,
  total_quantity numeric,
  order_count bigint,
  avg_quantity_per_order numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(MONTH FROM o.created_at)::integer as month,
    TO_CHAR(o.created_at, 'Month') as month_name,
    COALESCE(p.display_category, p.original_category, 'Inne') as category,
    SUM(oi.quantity) as total_quantity,
    COUNT(DISTINCT o.id) as order_count,
    ROUND(SUM(oi.quantity) / COUNT(DISTINCT o.id), 2) as avg_quantity_per_order
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  WHERE o.store_id = p_store_id
    AND o.status IN ('sent', 'confirmed', 'partially_confirmed')
    AND o.created_at >= NOW() - (p_months || ' months')::interval
  GROUP BY 
    EXTRACT(MONTH FROM o.created_at),
    TO_CHAR(o.created_at, 'Month'),
    COALESCE(p.display_category, p.original_category, 'Inne')
  ORDER BY 
    EXTRACT(MONTH FROM o.created_at),
    SUM(oi.quantity) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;