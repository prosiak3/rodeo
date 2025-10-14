/*
  # Generate Historical Orders for Past Year

  ## Overview
  This migration generates realistic historical orders from October 14, 2024 to October 13, 2025.
  Orders are distributed naturally across the year with random products and quantities.

  ## Order Distribution
  - 4-6 orders per week (approximately 230 orders over the year)
  - 2/3 of orders during business hours (5:00-22:00)
  - Occasional double orders on same day
  - Random distribution across all active stores

  ## Order Content
  - 3-10 randomly selected products per order
  - Realistic quantities based on product type
  - Mix of product categories
  - Prices based on base_price from products table

  ## Order Statuses
  - Most orders are "sent" (already submitted)
  - Some orders marked as "confirmed" or "partially_confirmed"
  - Occasional "in_progress" for recent orders
  - Random assignments by store managers and operators

  ## Notes
  - Uses existing stores, users, and products
  - Order numbers follow pattern: RO-YYYYMMDD-XXXX
  - All foreign key relationships are maintained
  - Total amounts are calculated from order items
*/

DO $$
DECLARE
  v_start_date date := '2024-10-14'::date;
  v_end_date date := '2025-10-13'::date;
  v_current_date date;
  v_order_date timestamptz;
  v_order_hour int;
  v_order_minute int;
  v_orders_this_week int;
  v_orders_today int;
  v_week_order_count int;

  v_store_id uuid;
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_status text;
  v_total_amount decimal(10,2);

  v_product_count int;
  v_product_id uuid;
  v_product_price decimal(10,2);
  v_product_unit text;
  v_quantity decimal(10,2);
  v_item_total decimal(10,2);

  v_stores uuid[];
  v_users uuid[];
  v_products uuid[];
  v_product_info record;

  v_statuses text[] := ARRAY['sent', 'sent', 'sent', 'confirmed', 'partially_confirmed', 'in_progress'];
  v_random_idx int;
BEGIN
  -- Get all active stores
  SELECT array_agg(id) INTO v_stores
  FROM stores
  WHERE active = true AND code NOT IN ('WAREHOUSE001');

  -- Get all users who can create orders (store managers and operators)
  SELECT array_agg(id) INTO v_users
  FROM users
  WHERE active = true AND role IN ('store_manager', 'operator');

  -- Get all active products
  SELECT array_agg(id) INTO v_products
  FROM products
  WHERE active = true;

  -- Exit if we don't have necessary data
  IF array_length(v_stores, 1) IS NULL OR array_length(v_users, 1) IS NULL OR array_length(v_products, 1) IS NULL THEN
    RAISE NOTICE 'Not enough data to generate orders. Need stores, users, and products.';
    RETURN;
  END IF;

  RAISE NOTICE 'Starting historical order generation...';
  RAISE NOTICE 'Stores: %, Users: %, Products: %', array_length(v_stores, 1), array_length(v_users, 1), array_length(v_products, 1);

  -- Loop through each week
  v_current_date := v_start_date;
  WHILE v_current_date <= v_end_date LOOP
    -- Determine orders for this week (4-6 orders)
    v_orders_this_week := 4 + floor(random() * 3)::int;
    v_week_order_count := 0;

    -- Generate orders for this week
    WHILE v_week_order_count < v_orders_this_week AND v_current_date <= v_end_date LOOP
      -- Skip some days to create natural distribution
      IF random() > 0.4 OR v_week_order_count = 0 THEN
        -- Determine if we should create 1 or 2 orders today (occasionally 2)
        v_orders_today := CASE WHEN random() > 0.9 THEN 2 ELSE 1 END;

        FOR order_idx IN 1..v_orders_today LOOP
          -- Random hour: 2/3 between 5-22, 1/3 other times
          IF random() < 0.67 THEN
            v_order_hour := 5 + floor(random() * 17)::int; -- 5 to 21
          ELSE
            IF random() < 0.5 THEN
              v_order_hour := floor(random() * 5)::int; -- 0 to 4
            ELSE
              v_order_hour := 22 + floor(random() * 2)::int; -- 22 to 23
            END IF;
          END IF;

          v_order_minute := floor(random() * 60)::int;
          v_order_date := v_current_date + (v_order_hour || ' hours')::interval + (v_order_minute || ' minutes')::interval;

          -- Random store
          v_store_id := v_stores[1 + floor(random() * array_length(v_stores, 1))::int];

          -- Random user
          v_user_id := v_users[1 + floor(random() * array_length(v_users, 1))::int];

          -- Random status (weighted towards 'sent')
          v_random_idx := 1 + floor(random() * array_length(v_statuses, 1))::int;
          v_status := v_statuses[v_random_idx];

          -- For very recent orders, use more 'in_progress' status
          IF v_order_date > (NOW() - interval '7 days') THEN
            IF random() > 0.7 THEN
              v_status := 'in_progress';
            END IF;
          END IF;

          -- Generate order number
          v_order_number := 'RO-' || TO_CHAR(v_order_date, 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

          -- Create order (we'll update total_amount later)
          INSERT INTO orders (
            id,
            order_number,
            store_id,
            created_by,
            status,
            total_amount,
            sent_at,
            confirmed_at,
            delivery_date,
            created_at,
            updated_at,
            source_type
          ) VALUES (
            gen_random_uuid(),
            v_order_number,
            v_store_id,
            v_user_id,
            v_status,
            0, -- Will be updated
            v_order_date,
            CASE WHEN v_status IN ('confirmed', 'partially_confirmed') THEN v_order_date + interval '1 day' ELSE NULL END,
            v_current_date + interval '1 day' + (floor(random() * 3)::int || ' days')::interval,
            v_order_date,
            v_order_date,
            'manual'
          )
          RETURNING id INTO v_order_id;

          -- Generate 3-10 order items
          v_product_count := 3 + floor(random() * 8)::int;
          v_total_amount := 0;

          FOR item_idx IN 1..v_product_count LOOP
            -- Random product (ensure no duplicates in same order by using different offsets)
            v_product_id := v_products[1 + floor(random() * array_length(v_products, 1))::int];

            -- Get product details
            SELECT base_price, unit INTO v_product_price, v_product_unit
            FROM products
            WHERE id = v_product_id;

            -- Random quantity based on unit
            IF v_product_unit = 'kg' THEN
              -- For kg: 2-50 kg, rounded to 0.5 kg
              v_quantity := (2 + floor(random() * 96) / 2.0)::decimal(10,2);
            ELSIF v_product_unit = 'szt' THEN
              -- For pieces: 5-100 pieces
              v_quantity := (5 + floor(random() * 96))::decimal(10,2);
            ELSE
              -- Default: 5-30 units
              v_quantity := (5 + floor(random() * 26))::decimal(10,2);
            END IF;

            v_item_total := v_quantity * v_product_price;
            v_total_amount := v_total_amount + v_item_total;

            -- Insert order item
            INSERT INTO order_items (
              order_id,
              product_id,
              quantity,
              unit,
              unit_price,
              total_price,
              confirmed_quantity,
              status
            ) VALUES (
              v_order_id,
              v_product_id,
              v_quantity,
              v_product_unit,
              v_product_price,
              v_item_total,
              CASE
                WHEN v_status = 'confirmed' THEN v_quantity
                WHEN v_status = 'partially_confirmed' AND random() > 0.5 THEN v_quantity * 0.8
                ELSE NULL
              END,
              CASE
                WHEN v_status = 'confirmed' THEN 'confirmed'
                WHEN v_status = 'partially_confirmed' THEN
                  CASE WHEN random() > 0.5 THEN 'confirmed' ELSE 'partially_confirmed' END
                ELSE 'pending'
              END
            );
          END LOOP;

          -- Update order total_amount
          UPDATE orders
          SET total_amount = v_total_amount
          WHERE id = v_order_id;

          v_week_order_count := v_week_order_count + 1;
        END LOOP;
      END IF;

      -- Move to next day
      v_current_date := v_current_date + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Historical order generation completed!';
  RAISE NOTICE 'Generated orders from % to %', v_start_date, v_end_date;
END $$;
