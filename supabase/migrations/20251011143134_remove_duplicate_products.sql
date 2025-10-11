/*
  # Remove duplicate products

  1. Changes
    - Identify and remove duplicate products based on name
    - Keep products that are used in orders
    - If no product is used, keep the oldest one (first created)
    
  2. Safety
    - Does not delete products that are referenced in order_items
    - Preserves data integrity by keeping at least one product per name
*/

-- Delete duplicate products, keeping the ones that are used or the oldest
WITH duplicates AS (
  SELECT name, array_agg(id ORDER BY created_at) as ids
  FROM products 
  GROUP BY name 
  HAVING COUNT(*) > 1
),
products_to_keep AS (
  SELECT DISTINCT ON (d.name)
    d.name,
    COALESCE(
      (SELECT p.id 
       FROM unnest(d.ids) p(id)
       WHERE EXISTS (SELECT 1 FROM order_items WHERE product_id = p.id)
       ORDER BY (SELECT COUNT(*) FROM order_items WHERE product_id = p.id) DESC
       LIMIT 1),
      d.ids[1]
    ) as keep_id
  FROM duplicates d
),
products_to_delete AS (
  SELECT p.id
  FROM products p
  INNER JOIN duplicates d ON p.name = d.name
  LEFT JOIN products_to_keep ptk ON p.id = ptk.keep_id
  WHERE ptk.keep_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM order_items WHERE product_id = p.id)
)
DELETE FROM products
WHERE id IN (SELECT id FROM products_to_delete);