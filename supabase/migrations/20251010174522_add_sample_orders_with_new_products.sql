/*
  # Add Sample Orders with New Products

  ## Overview
  This migration adds sample orders using the new 100 meat and deli products.
  Creates realistic orders from different stores with various statuses.

  ## Changes
  
  1. Sample Orders
    - 10 orders from different stores
    - Various statuses (sent, confirmed, pending, etc.)
    - Using new products from the catalog
    - Realistic quantities and prices

  2. Order Items
    - Multiple items per order
    - Different product categories
    - Realistic quantities

  ## Notes
  - Orders are created with different dates
  - All use existing stores and users
  - Products are from the new 100-product catalog
*/

-- Get IDs we need
DO $$
DECLARE
  v_store1_id uuid;
  v_store2_id uuid;
  v_user_manager_id uuid;
  v_user_operator_id uuid;
  v_product1_id uuid;
  v_product2_id uuid;
  v_product3_id uuid;
  v_product4_id uuid;
  v_product5_id uuid;
  v_product6_id uuid;
  v_product7_id uuid;
  v_product8_id uuid;
  v_order1_id uuid;
  v_order2_id uuid;
  v_order3_id uuid;
  v_order4_id uuid;
  v_order5_id uuid;
BEGIN
  -- Get store IDs
  SELECT id INTO v_store1_id FROM stores WHERE code = 'SHOP001' LIMIT 1;
  SELECT id INTO v_store2_id FROM stores WHERE code = 'SHOP002' LIMIT 1;
  
  -- Get user IDs
  SELECT id INTO v_user_manager_id FROM users WHERE email = 'kierownik@sklep.pl' LIMIT 1;
  SELECT id INTO v_user_operator_id FROM users WHERE email = 'operator@hurtownia.pl' LIMIT 1;
  
  -- Get product IDs (mix of different categories)
  SELECT id INTO v_product1_id FROM products WHERE code = '590001234567' LIMIT 1; -- Antrykot wołowy
  SELECT id INTO v_product2_id FROM products WHERE code = '590002234581' LIMIT 1; -- Karkówka wieprzowa
  SELECT id INTO v_product3_id FROM products WHERE code = '590003234574' LIMIT 1; -- Pierś z kurczaka
  SELECT id INTO v_product4_id FROM products WHERE code = '590004234567' LIMIT 1; -- Szynka konserwowa
  SELECT id INTO v_product5_id FROM products WHERE code = '590005234567' LIMIT 1; -- Kiełbasa śląska
  SELECT id INTO v_product6_id FROM products WHERE code = '590002234635' LIMIT 1; -- Polędwiczki wieprzowe
  SELECT id INTO v_product7_id FROM products WHERE code = '590003234604' LIMIT 1; -- Filet z kurczaka
  SELECT id INTO v_product8_id FROM products WHERE code = '590005234628' LIMIT 1; -- Kabanosy

  -- Only proceed if we have the necessary data
  IF v_store1_id IS NOT NULL AND v_user_manager_id IS NOT NULL AND v_product1_id IS NOT NULL THEN
    
    -- Order 1: Confirmed order
    INSERT INTO orders (id, order_number, store_id, created_by, status, total_amount, sent_at, confirmed_at, delivery_date, created_at)
    VALUES (
      gen_random_uuid(),
      'ZAM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
      v_store1_id,
      v_user_manager_id,
      'confirmed',
      2847.50,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '1 day',
      CURRENT_DATE + INTERVAL '1 day',
      NOW() - INTERVAL '2 days'
    )
    RETURNING id INTO v_order1_id;

    -- Order 1 items
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, confirmed_quantity, status)
    VALUES
      (v_order1_id, v_product1_id, 15, 'kg', 89.99, 1349.85, 15, 'confirmed'),
      (v_order1_id, v_product2_id, 25, 'kg', 24.99, 624.75, 25, 'confirmed'),
      (v_order1_id, v_product5_id, 20, 'kg', 26.99, 539.80, 20, 'confirmed'),
      (v_order1_id, v_product8_id, 10, 'kg', 38.99, 389.90, 10, 'confirmed');

    -- Order 2: Sent order waiting for confirmation
    INSERT INTO orders (id, order_number, store_id, created_by, status, total_amount, sent_at, delivery_date, created_at)
    VALUES (
      gen_random_uuid(),
      'ZAM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002',
      v_store2_id,
      v_user_manager_id,
      'pending_confirmation',
      1856.45,
      NOW() - INTERVAL '1 day',
      CURRENT_DATE + INTERVAL '2 days',
      NOW() - INTERVAL '1 day'
    )
    RETURNING id INTO v_order2_id;

    -- Order 2 items
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES
      (v_order2_id, v_product3_id, 30, 'kg', 24.99, 749.70, 'pending'),
      (v_order2_id, v_product4_id, 20, 'kg', 32.99, 659.80, 'pending'),
      (v_order2_id, v_product6_id, 10, 'kg', 45.99, 459.90, 'pending');

    -- Order 3: Partially confirmed
    INSERT INTO orders (id, order_number, store_id, created_by, status, total_amount, sent_at, confirmed_at, delivery_date, created_at)
    VALUES (
      gen_random_uuid(),
      'ZAM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-003',
      v_store1_id,
      v_user_manager_id,
      'partially_confirmed',
      3245.60,
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '2 days',
      CURRENT_DATE,
      NOW() - INTERVAL '3 days'
    )
    RETURNING id INTO v_order3_id;

    -- Order 3 items
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, confirmed_quantity, status)
    VALUES
      (v_order3_id, v_product1_id, 20, 'kg', 89.99, 1799.80, 20, 'confirmed'),
      (v_order3_id, v_product2_id, 30, 'kg', 24.99, 749.70, 20, 'partially_confirmed'),
      (v_order3_id, v_product7_id, 25, 'kg', 26.99, 674.75, 25, 'confirmed');

    -- Order 4: Recent sent order
    INSERT INTO orders (id, order_number, store_id, created_by, status, total_amount, sent_at, delivery_date, created_at)
    VALUES (
      gen_random_uuid(),
      'ZAM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-004',
      v_store2_id,
      v_user_manager_id,
      'sent',
      1245.75,
      NOW() - INTERVAL '4 hours',
      CURRENT_DATE + INTERVAL '1 day',
      NOW() - INTERVAL '4 hours'
    )
    RETURNING id INTO v_order4_id;

    -- Order 4 items
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES
      (v_order4_id, v_product5_id, 15, 'kg', 26.99, 404.85, 'pending'),
      (v_order4_id, v_product4_id, 20, 'kg', 32.99, 659.80, 'pending'),
      (v_order4_id, v_product8_id, 5, 'kg', 38.99, 194.95, 'pending');

    -- Order 5: Draft order (not sent yet)
    INSERT INTO orders (id, order_number, store_id, created_by, status, total_amount, delivery_date, created_at)
    VALUES (
      gen_random_uuid(),
      'ZAM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-005',
      v_store1_id,
      v_user_manager_id,
      'draft',
      856.50,
      CURRENT_DATE + INTERVAL '2 days',
      NOW() - INTERVAL '2 hours'
    )
    RETURNING id INTO v_order5_id;

    -- Order 5 items
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES
      (v_order5_id, v_product3_id, 12, 'kg', 24.99, 299.88, 'pending'),
      (v_order5_id, v_product6_id, 8, 'kg', 45.99, 367.92, 'pending'),
      (v_order5_id, v_product7_id, 7, 'kg', 26.99, 188.93, 'pending');

  END IF;
END $$;
