/*
  # Dodanie przykładowych zamówień w różnych statusach

  1. Zmiany
    - Dodanie 8 zamówień w różnych statusach (draft, sent, confirmed, partially_confirmed)
    - Zamówienia dla różnych sklepów
    - Różne kategorie produktów w zamówieniach
    - Historia dla każdego zamówienia
    
  2. Statusy zamówień
    - draft: szkic zamówienia (nowe)
    - sent: wysłane do realizacji
    - confirmed: potwierdzone
    - partially_confirmed: częściowo potwierdzone
*/

DO $$
DECLARE
  v_store_manager_id uuid;
  v_salesperson_id uuid;
  v_operator_id uuid;
  v_shop001_id uuid;
  v_shop002_id uuid;
  v_order_id uuid;
  v_product_ids uuid[];
BEGIN
  SELECT id INTO v_store_manager_id FROM users WHERE email = 'kierownik@sklep.pl' LIMIT 1;
  SELECT id INTO v_salesperson_id FROM users WHERE email = 'handlowiec@hurtownia.pl' LIMIT 1;
  SELECT id INTO v_operator_id FROM users WHERE email = 'operator@hurtownia.pl' LIMIT 1;
  
  SELECT id INTO v_shop001_id FROM stores WHERE code = 'SHOP001' LIMIT 1;
  SELECT id INTO v_shop002_id FROM stores WHERE code = 'SHOP002' LIMIT 1;
  
  SELECT ARRAY_AGG(id) INTO v_product_ids FROM products WHERE active = true LIMIT 20;
  
  IF v_store_manager_id IS NULL OR v_shop001_id IS NULL THEN
    RAISE NOTICE 'Required data not found, skipping sample orders creation';
    RETURN;
  END IF;
  
  INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at)
  VALUES ('RO-2025-001', v_shop001_id, v_store_manager_id, 'draft', false, 450.00, 'Zamówienie na weekend - do sprawdzenia', NOW() - INTERVAL '2 hours')
  RETURNING id INTO v_order_id;
  
  IF v_product_ids[1] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[1], 10, 'kg', 25.00, 250.00, 'pending');
  END IF;
  
  IF v_product_ids[2] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[2], 5, 'kg', 40.00, 200.00, 'pending');
  END IF;
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'created', v_store_manager_id, '{"items_count": 2, "source": "manual"}');
  
  INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at)
  VALUES ('RO-2025-002', v_shop002_id, v_store_manager_id, 'draft', false, 620.00, 'Wstępne zamówienie - do uzupełnienia', NOW() - INTERVAL '5 hours')
  RETURNING id INTO v_order_id;
  
  IF v_product_ids[3] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[3], 15, 'kg', 22.00, 330.00, 'pending');
  END IF;
  
  IF v_product_ids[4] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[4], 10, 'kg', 29.00, 290.00, 'pending');
  END IF;
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'created', v_store_manager_id, '{"items_count": 2}');
  
  INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at, sent_at)
  VALUES ('RO-2025-003', v_shop001_id, v_store_manager_id, 'sent', true, 1250.00, 'Pilne zamówienie na promocję', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
  RETURNING id INTO v_order_id;
  
  IF v_product_ids[5] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[5], 20, 'kg', 35.00, 700.00, 'pending');
  END IF;
  
  IF v_product_ids[6] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[6], 15, 'kg', 30.00, 450.00, 'pending');
  END IF;
  
  IF v_product_ids[7] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[7], 5, 'szt', 20.00, 100.00, 'pending');
  END IF;
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'created', v_store_manager_id, '{"items_count": 3}');
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'sent', v_store_manager_id, '{"note": "Wysłano do realizacji"}');
  
  IF v_salesperson_id IS NOT NULL AND v_shop002_id IS NOT NULL THEN
    INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at, sent_at, confirmed_at, delivery_date)
    VALUES ('RO-2025-004', v_shop002_id, v_salesperson_id, 'confirmed', false, 890.50, 'Standardowe zamówienie tygodniowe', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day')
    RETURNING id INTO v_order_id;
    
    IF v_product_ids[8] IS NOT NULL THEN
      INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
      VALUES (v_order_id, v_product_ids[8], 12, 'kg', 28.50, 342.00, 'confirmed');
    END IF;
    
    IF v_product_ids[9] IS NOT NULL THEN
      INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
      VALUES (v_order_id, v_product_ids[9], 18, 'kg', 30.50, 549.00, 'confirmed');
    END IF;
    
    INSERT INTO order_history (order_id, action, performed_by, details)
    VALUES (v_order_id, 'created', v_salesperson_id, '{"items_count": 2, "source": "price_list"}');
    
    INSERT INTO order_history (order_id, action, performed_by, details)
    VALUES (v_order_id, 'sent', v_salesperson_id, '{}');
    
    IF v_operator_id IS NOT NULL THEN
      INSERT INTO order_history (order_id, action, performed_by, details)
      VALUES (v_order_id, 'confirmed', v_operator_id, '{"delivery_date": "jutro"}');
    END IF;
  END IF;
  
  INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at, sent_at, confirmed_at)
  VALUES ('RO-2025-005', v_shop001_id, v_store_manager_id, 'partially_confirmed', true, 1580.00, 'Część produktów niedostępna', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
  RETURNING id INTO v_order_id;
  
  IF v_product_ids[10] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[10], 25, 'kg', 32.00, 800.00, 'confirmed');
  END IF;
  
  IF v_product_ids[11] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[11], 20, 'kg', 28.00, 560.00, 'partially_confirmed');
  END IF;
  
  IF v_product_ids[12] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[12], 10, 'kg', 22.00, 220.00, 'rejected');
  END IF;
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'created', v_store_manager_id, '{"items_count": 3}');
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'sent', v_store_manager_id, '{}');
  
  IF v_operator_id IS NOT NULL THEN
    INSERT INTO order_history (order_id, action, performed_by, details)
    VALUES (v_order_id, 'partially_confirmed', v_operator_id, '{"reason": "Brak wystarczającej ilości niektórych produktów"}');
  END IF;
  
  IF v_salesperson_id IS NOT NULL THEN
    INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at)
    VALUES ('RO-2025-006', v_shop001_id, v_salesperson_id, 'draft', false, 340.00, 'Zamówienie na poniedziałek', NOW() - INTERVAL '6 hours')
    RETURNING id INTO v_order_id;
    
    IF v_product_ids[13] IS NOT NULL THEN
      INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
      VALUES (v_order_id, v_product_ids[13], 8, 'kg', 42.50, 340.00, 'pending');
    END IF;
    
    INSERT INTO order_history (order_id, action, performed_by, details)
    VALUES (v_order_id, 'created', v_salesperson_id, '{"items_count": 1}');
  END IF;
  
  INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at, sent_at)
  VALUES ('RO-2025-007', v_shop002_id, v_store_manager_id, 'sent', false, 2150.00, 'Duże zamówienie na weekend', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '10 hours')
  RETURNING id INTO v_order_id;
  
  IF v_product_ids[14] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[14], 30, 'kg', 25.00, 750.00, 'pending');
  END IF;
  
  IF v_product_ids[15] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[15], 25, 'kg', 28.00, 700.00, 'pending');
  END IF;
  
  IF v_product_ids[16] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[16], 20, 'kg', 35.00, 700.00, 'pending');
  END IF;
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'created', v_store_manager_id, '{"items_count": 3, "source": "voice"}');
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'sent', v_store_manager_id, '{}');
  
  INSERT INTO orders (order_number, store_id, created_by, status, requires_confirmation, total_amount, notes, created_at, sent_at, confirmed_at, delivery_date)
  VALUES ('RO-2025-008', v_shop001_id, v_store_manager_id, 'confirmed', false, 1890.00, 'Zamówienie zrealizowane', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', CURRENT_DATE - INTERVAL '3 days')
  RETURNING id INTO v_order_id;
  
  IF v_product_ids[17] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[17], 35, 'kg', 27.00, 945.00, 'confirmed');
  END IF;
  
  IF v_product_ids[18] IS NOT NULL THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
    VALUES (v_order_id, v_product_ids[18], 35, 'kg', 27.00, 945.00, 'confirmed');
  END IF;
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'created', v_store_manager_id, '{"items_count": 2}');
  
  INSERT INTO order_history (order_id, action, performed_by, details)
  VALUES (v_order_id, 'sent', v_store_manager_id, '{}');
  
  IF v_operator_id IS NOT NULL THEN
    INSERT INTO order_history (order_id, action, performed_by, details)
    VALUES (v_order_id, 'confirmed', v_operator_id, '{}');
  END IF;

END $$;
