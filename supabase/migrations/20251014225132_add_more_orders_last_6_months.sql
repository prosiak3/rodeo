/*
  # Dodanie większej liczby zamówień z ostatnich 6 miesięcy

  ## Cel
  Zwiększenie gęstości zamówień w ostatnich 6 miesiącach do 5-6 zamówień tygodniowo
  na sklep, aby system Auto Order miał więcej danych do analizy.

  ## Zakres
  - Okres: ostatnie 180 dni (od dzisiaj wstecz)
  - Częstotliwość: 5-6 zamówień tygodniowo na każdy sklep
  - Razem: około 26 tygodni × 5.5 zamówień × liczba sklepów
  - Statusy: głównie 'sent' i 'confirmed'

  ## Zawartość zamówień
  - 4-12 produktów na zamówienie (zróżnicowane)
  - Realistyczne ilości według typu produktu
  - Mix kategorii produktów
  - Ceny według base_price z produktów

  ## Rozkład czasowy
  - 70% zamówień w godzinach roboczych (6:00-18:00)
  - 30% zamówień w godzinach wieczornych (18:00-22:00)
  - Losowy rozkład dni tygodnia (więcej w poniedziałki-środy)
*/

DO $$
DECLARE
  v_start_date date := CURRENT_DATE - INTERVAL '180 days';
  v_end_date date := CURRENT_DATE;
  v_current_date date;
  v_order_date timestamptz;
  v_order_hour int;
  v_order_minute int;
  v_orders_this_week int;
  v_orders_today int;
  v_week_order_count int;
  v_day_order_count int;

  v_store record;
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

  v_users uuid[];
  v_products uuid[];
  v_average_weight decimal(10,2);

  v_statuses text[] := ARRAY['sent', 'sent', 'sent', 'sent', 'confirmed', 'confirmed', 'partially_confirmed'];
  v_random_idx int;
  v_skip_days int;
  v_total_generated int := 0;
BEGIN
  RAISE NOTICE '=== Generating historical orders for last 6 months ===';
  RAISE NOTICE 'Period: % to %', v_start_date, v_end_date;

  -- Get all users who can create orders
  SELECT array_agg(id) INTO v_users
  FROM users
  WHERE active = true AND role IN ('store_manager', 'operator');

  -- Get all active products
  SELECT array_agg(id) INTO v_products
  FROM products
  WHERE active = true;

  IF array_length(v_users, 1) IS NULL OR array_length(v_products, 1) IS NULL THEN
    RAISE NOTICE 'Not enough data. Need users and products.';
    RETURN;
  END IF;

  RAISE NOTICE 'Users available: %, Products available: %', array_length(v_users, 1), array_length(v_products, 1);

  -- Loop through each active store
  FOR v_store IN
    SELECT id, name, code
    FROM stores
    WHERE active = true AND code NOT IN ('WAREHOUSE001')
  LOOP
    RAISE NOTICE 'Processing store: % (%)', v_store.name, v_store.code;
    v_store_id := v_store.id;

    -- Loop through each week in the period
    v_current_date := v_start_date;
    WHILE v_current_date <= v_end_date LOOP
      -- 5-6 orders per week per store
      v_orders_this_week := 5 + floor(random() * 2)::int;
      v_week_order_count := 0;

      -- Generate orders for this week
      WHILE v_week_order_count < v_orders_this_week AND v_current_date <= v_end_date LOOP
        -- Skip 0-1 days for natural distribution
        v_skip_days := floor(random() * 2)::int;
        v_current_date := v_current_date + (v_skip_days || ' days')::interval;

        IF v_current_date > v_end_date THEN
          EXIT;
        END IF;

        -- 1-2 orders per day
        v_day_order_count := 1 + floor(random() * 2)::int;

        FOR i IN 1..v_day_order_count LOOP
          IF v_week_order_count >= v_orders_this_week THEN
            EXIT;
          END IF;

          -- Generate order time (70% business hours 6-18, 30% evening 18-22)
          IF random() < 0.7 THEN
            v_order_hour := 6 + floor(random() * 12)::int;
          ELSE
            v_order_hour := 18 + floor(random() * 4)::int;
          END IF;
          v_order_minute := floor(random() * 60)::int;

          v_order_date := v_current_date +
            make_interval(hours => v_order_hour, mins => v_order_minute);

          -- Random user from the pool
          v_user_id := v_users[1 + floor(random() * array_length(v_users, 1))::int];

          -- Generate order number
          v_order_number := 'RO-' ||
            to_char(v_order_date, 'YYYYMMDD') || '-' ||
            LPAD(floor(random() * 10000)::text, 4, '0');

          -- Check if order number already exists
          WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = v_order_number) LOOP
            v_order_number := 'RO-' ||
              to_char(v_order_date, 'YYYYMMDD') || '-' ||
              LPAD(floor(random() * 10000)::text, 4, '0');
          END LOOP;

          -- Random status (mostly sent/confirmed)
          v_status := v_statuses[1 + floor(random() * array_length(v_statuses, 1))::int];

          -- Create order
          INSERT INTO orders (
            order_number,
            store_id,
            created_by,
            status,
            requires_confirmation,
            total_amount,
            sent_at,
            confirmed_at,
            delivery_date,
            created_at,
            updated_at,
            source_type
          ) VALUES (
            v_order_number,
            v_store_id,
            v_user_id,
            v_status,
            false,
            0,
            v_order_date,
            CASE
              WHEN v_status IN ('confirmed', 'partially_confirmed')
              THEN v_order_date + INTERVAL '1 hour'
              ELSE NULL
            END,
            v_current_date + INTERVAL '1 day',
            v_order_date - INTERVAL '5 minutes',
            v_order_date,
            CASE
              WHEN random() < 0.7 THEN 'price_list'
              WHEN random() < 0.5 THEN 'manual'
              ELSE 'voice'
            END
          ) RETURNING id INTO v_order_id;

          -- Add 4-12 random products to order
          v_product_count := 4 + floor(random() * 9)::int;
          v_total_amount := 0;

          FOR j IN 1..v_product_count LOOP
            -- Random product
            v_product_id := v_products[1 + floor(random() * array_length(v_products, 1))::int];

            -- Get product info
            SELECT base_price, unit, average_weight
            INTO v_product_price, v_product_unit, v_average_weight
            FROM products
            WHERE id = v_product_id;

            -- Generate realistic quantity based on unit
            IF v_product_unit = 'kg' THEN
              v_quantity := (1 + floor(random() * 20)::int) * 0.5; -- 0.5 to 10 kg
            ELSIF v_product_unit = 'szt' THEN
              v_quantity := 1 + floor(random() * 50)::int; -- 1 to 50 pieces
            ELSE
              v_quantity := 1 + floor(random() * 10)::int; -- generic
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
              status,
              created_at
            ) VALUES (
              v_order_id,
              v_product_id,
              v_quantity,
              v_product_unit,
              v_product_price,
              v_item_total,
              CASE
                WHEN v_status IN ('confirmed', 'partially_confirmed')
                THEN v_quantity
                ELSE NULL
              END,
              CASE
                WHEN v_status = 'confirmed' THEN 'confirmed'
                WHEN v_status = 'partially_confirmed' THEN 'partially_confirmed'
                ELSE 'pending'
              END,
              v_order_date - INTERVAL '3 minutes'
            );
          END LOOP;

          -- Update order total
          UPDATE orders
          SET total_amount = v_total_amount
          WHERE id = v_order_id;

          v_week_order_count := v_week_order_count + 1;
          v_total_generated := v_total_generated + 1;
        END LOOP;

        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;

      -- Move to next week
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    RAISE NOTICE 'Store % complete. Generated orders for this store.', v_store.code;
  END LOOP;

  RAISE NOTICE '=== Order generation complete ===';
  RAISE NOTICE 'Total orders generated: %', v_total_generated;
END $$;