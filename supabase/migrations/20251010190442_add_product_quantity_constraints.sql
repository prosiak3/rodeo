/*
  # Dodanie przykładowych zamówień

  1. Zamówienia
    - Różne statusy (sent, in_progress, confirmed)
    - Dla sklepu Delikatesy Centrum
    
  2. Bezpieczeństwo
    - Bezpieczne wstawienie danych
*/

-- Usuń istniejące przykładowe zamówienia
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE order_number LIKE 'RO-2025-%'
);
DELETE FROM order_history WHERE order_id IN (
  SELECT id FROM orders WHERE order_number LIKE 'RO-2025-%'
);
DELETE FROM orders WHERE order_number LIKE 'RO-2025-%';

-- Zamówienie 1: Wysłane (sent)
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO orders (
    order_number, store_id, created_by, status, requires_confirmation,
    total_amount, notes, created_at
  ) VALUES (
    'RO-2025-001234',
    '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
    '20892575-4c35-4b35-86e3-97d91268d20b',
    'sent', false, 2456.50, 'Zamówienie tygodniowe',
    NOW() - INTERVAL '2 days'
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
  SELECT v_order_id, id, 15, unit, 26.50, 397.50, 'pending' FROM products WHERE id = '25b62fab-1ab8-4894-b085-1ef7373cbb8a'
  UNION ALL
  SELECT v_order_id, id, 20, unit, 24.99, 499.80, 'pending' FROM products WHERE id = '3c01dc2e-fffa-4ce6-b737-528f6cc922fd'
  UNION ALL
  SELECT v_order_id, id, 10, unit, 52.99, 529.90, 'pending' FROM products WHERE id = 'cea14b42-e8f6-42ed-b932-b3f913f32684'
  UNION ALL
  SELECT v_order_id, id, 8, unit, 89.99, 719.92, 'pending' FROM products WHERE id = '411e4173-3557-4624-a20a-686bf3536df0'
  UNION ALL
  SELECT v_order_id, id, 12, unit, 26.99, 323.88, 'pending' FROM products WHERE id = '4413ffd2-df63-4328-86a4-e6b0b25ed6a5';

  INSERT INTO order_history (order_id, action, performed_by, details, created_at)
  VALUES (v_order_id, 'created', '20892575-4c35-4b35-86e3-97d91268d20b', '{"items_count": 5}', NOW() - INTERVAL '2 days');
END $$;

-- Zamówienie 2: W realizacji (in_progress)
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO orders (
    order_number, store_id, created_by, status, requires_confirmation,
    total_amount, notes, created_at
  ) VALUES (
    'RO-2025-001235',
    '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
    '20892575-4c35-4b35-86e3-97d91268d20b',
    'in_progress', false, 1823.75, 'Zamówienie pilne',
    NOW() - INTERVAL '1 day'
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
  SELECT v_order_id, id, 25, unit, 22.99, 574.75, 'pending' FROM products WHERE id = 'b4b875fd-2b2c-4bbf-9f9e-79eca737e81a'
  UNION ALL
  SELECT v_order_id, id, 18, unit, 24.99, 449.82, 'pending' FROM products WHERE id = '527ca8b4-2620-460f-9f68-ac9d8cf59659'
  UNION ALL
  SELECT v_order_id, id, 30, unit, 18.99, 569.70, 'pending' FROM products WHERE id = 'a3c278a2-5fe6-4e2a-8a82-89507cef455e';

  INSERT INTO order_history (order_id, action, performed_by, details, created_at)
  VALUES 
    (v_order_id, 'created', '20892575-4c35-4b35-86e3-97d91268d20b', '{"items_count": 3}', NOW() - INTERVAL '1 day'),
    (v_order_id, 'status_changed', 'e385bc7d-1ebc-4d9e-a820-306a5ca0bc1d', '{"from": "sent", "to": "in_progress"}', NOW() - INTERVAL '12 hours');
END $$;

-- Zamówienie 3: Potwierdzone (confirmed)
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO orders (
    order_number, store_id, created_by, status, requires_confirmation,
    total_amount, notes, created_at
  ) VALUES (
    'RO-2025-001236',
    '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
    '20892575-4c35-4b35-86e3-97d91268d20b',
    'confirmed', false, 3245.80, 'Zamówienie miesięczne',
    NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
  SELECT v_order_id, id, 20, unit, 26.50, 530.00, 'confirmed' FROM products WHERE id = '25b62fab-1ab8-4894-b085-1ef7373cbb8a'
  UNION ALL
  SELECT v_order_id, id, 25, unit, 24.99, 624.75, 'confirmed' FROM products WHERE id = '3c01dc2e-fffa-4ce6-b737-528f6cc922fd'
  UNION ALL
  SELECT v_order_id, id, 15, unit, 89.99, 1349.85, 'confirmed' FROM products WHERE id = '411e4173-3557-4624-a20a-686bf3536df0'
  UNION ALL
  SELECT v_order_id, id, 30, unit, 22.99, 689.70, 'confirmed' FROM products WHERE id = 'b4b875fd-2b2c-4bbf-9f9e-79eca737e81a';

  INSERT INTO order_history (order_id, action, performed_by, details, created_at)
  VALUES 
    (v_order_id, 'created', '20892575-4c35-4b35-86e3-97d91268d20b', '{"items_count": 4}', NOW() - INTERVAL '5 days'),
    (v_order_id, 'status_changed', 'e385bc7d-1ebc-4d9e-a820-306a5ca0bc1d', '{"from": "sent", "to": "in_progress"}', NOW() - INTERVAL '4 days'),
    (v_order_id, 'status_changed', 'a6ef2b25-6ea5-48bf-b529-466d9fb41a49', '{"from": "in_progress", "to": "confirmed"}', NOW() - INTERVAL '3 days');
END $$;
