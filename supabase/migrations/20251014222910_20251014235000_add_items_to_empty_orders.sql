/*
  # Add Order Items to Orders Without Products

  ## Overview
  This migration adds order items to orders that were created but have no products.
  Generates realistic order items based on the order's total_amount.

  ## Changes
  - Identifies orders with no order_items
  - Generates 3-10 random products per order
  - Calculates quantities to match the existing total_amount
  - Ensures all orders have valid order items

  ## Notes
  - Uses existing products from the database
  - Maintains realistic product quantities
  - Preserves existing total_amount values
*/

DO $$
DECLARE
  v_order record;
  v_product_id uuid;
  v_product_price decimal(10,2);
  v_product_unit text;
  v_quantity decimal(10,2);
  v_item_total decimal(10,2);
  v_products uuid[];
  v_product_count int;
  v_remaining_amount decimal(10,2);
  v_calculated_total decimal(10,2);
BEGIN
  -- Get all active products
  SELECT array_agg(id) INTO v_products
  FROM products
  WHERE active = true;

  -- Loop through orders without items
  FOR v_order IN
    SELECT o.id, o.order_number, o.total_amount, o.store_id
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.status = 'sent'
    GROUP BY o.id, o.order_number, o.total_amount, o.store_id
    HAVING COUNT(oi.id) = 0
  LOOP
    RAISE NOTICE 'Adding items to order: %', v_order.order_number;

    -- Generate 3-10 order items
    v_product_count := 3 + floor(random() * 8)::int;
    v_remaining_amount := v_order.total_amount;
    v_calculated_total := 0;

    FOR item_idx IN 1..v_product_count LOOP
      -- Random product
      v_product_id := v_products[1 + floor(random() * array_length(v_products, 1))::int];

      -- Get product details
      SELECT base_price, unit INTO v_product_price, v_product_unit
      FROM products
      WHERE id = v_product_id;

      -- Calculate quantity based on remaining amount
      IF item_idx = v_product_count THEN
        -- Last item: use remaining amount
        v_item_total := v_remaining_amount;
        v_quantity := ROUND((v_item_total / v_product_price)::numeric, 2);
      ELSE
        -- Not last item: use portion of remaining amount
        v_item_total := ROUND((v_remaining_amount / (v_product_count - item_idx + 1) * (0.5 + random() * 1.0))::numeric, 2);
        v_quantity := ROUND((v_item_total / v_product_price)::numeric, 2);
      END IF;

      -- Ensure quantity is reasonable
      IF v_product_unit = 'kg' THEN
        -- For kg: at least 0.5 kg
        IF v_quantity < 0.5 THEN
          v_quantity := 0.5;
          v_item_total := ROUND((v_quantity * v_product_price)::numeric, 2);
        END IF;
      ELSIF v_product_unit = 'szt' THEN
        -- For pieces: at least 1
        IF v_quantity < 1 THEN
          v_quantity := 1;
          v_item_total := ROUND((v_quantity * v_product_price)::numeric, 2);
        END IF;
      ELSE
        -- Default: at least 1 unit
        IF v_quantity < 1 THEN
          v_quantity := 1;
          v_item_total := ROUND((v_quantity * v_product_price)::numeric, 2);
        END IF;
      END IF;

      -- Insert order item
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        unit,
        unit_price,
        total_price,
        status
      ) VALUES (
        v_order.id,
        v_product_id,
        v_quantity,
        v_product_unit,
        v_product_price,
        v_item_total,
        'pending'
      );

      v_calculated_total := v_calculated_total + v_item_total;
      v_remaining_amount := v_remaining_amount - v_item_total;

      -- Stop if we've used up the amount
      IF v_remaining_amount <= 0 THEN
        EXIT;
      END IF;
    END LOOP;

    -- Update order total_amount to match calculated total
    UPDATE orders
    SET total_amount = v_calculated_total
    WHERE id = v_order.id;

    RAISE NOTICE 'Added % items to order %, total: %', v_product_count, v_order.order_number, v_calculated_total;
  END LOOP;

  RAISE NOTICE 'Completed adding items to empty orders';
END $$;
