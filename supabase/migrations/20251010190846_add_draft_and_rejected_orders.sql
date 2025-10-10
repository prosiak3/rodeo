/*
  # Dodanie zamówień ze statusami draft i rejected

  1. Nowe zamówienia
    - Szkice (draft) - zamówienia w przygotowaniu
    - Odrzucone (rejected) - zamówienia odrzucone przez hurtownię
    
  2. Bezpieczeństwo
    - Bezpieczne wstawienie danych
*/

-- Zamówienie 4: Szkic (draft)
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO orders (
    order_number, store_id, created_by, status, requires_confirmation,
    total_amount, notes, created_at
  ) VALUES (
    'RO-2025-001237',
    '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
    '20892575-4c35-4b35-86e3-97d91268d20b',
    'draft', false, 1245.30, 'Zamówienie w przygotowaniu',
    NOW() - INTERVAL '3 hours'
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
  SELECT v_order_id, id, 10, unit, 32.99, 329.90, 'pending' FROM products WHERE id = '3c01dc2e-fffa-4ce6-b737-528f6cc922fd'
  UNION ALL
  SELECT v_order_id, id, 15, unit, 26.99, 404.85, 'pending' FROM products WHERE id = '4413ffd2-df63-4328-86a4-e6b0b25ed6a5'
  UNION ALL
  SELECT v_order_id, id, 20, unit, 22.99, 459.80, 'pending' FROM products WHERE id = 'b4b875fd-2b2c-4bbf-9f9e-79eca737e81a';

  INSERT INTO order_history (order_id, action, performed_by, details, created_at)
  VALUES (v_order_id, 'created', '20892575-4c35-4b35-86e3-97d91268d20b', '{"items_count": 3, "source": "draft"}', NOW() - INTERVAL '3 hours');
END $$;

-- Zamówienie 5: Kolejny szkic (draft)
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO orders (
    order_number, store_id, created_by, status, requires_confirmation,
    total_amount, notes, created_at
  ) VALUES (
    'RO-2025-001238',
    '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
    '20892575-4c35-4b35-86e3-97d91268d20b',
    'draft', false, 892.45, 'Zamówienie testowe',
    NOW() - INTERVAL '1 hour'
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
  SELECT v_order_id, id, 12, unit, 26.50, 318.00, 'pending' FROM products WHERE id = '25b62fab-1ab8-4894-b085-1ef7373cbb8a'
  UNION ALL
  SELECT v_order_id, id, 8, unit, 52.99, 423.92, 'pending' FROM products WHERE id = 'cea14b42-e8f6-42ed-b932-b3f913f32684';

  INSERT INTO order_history (order_id, action, performed_by, details, created_at)
  VALUES (v_order_id, 'created', '20892575-4c35-4b35-86e3-97d91268d20b', '{"items_count": 2, "source": "draft"}', NOW() - INTERVAL '1 hour');
END $$;

-- Zamówienie 6: Odrzucone (rejected)
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO orders (
    order_number, store_id, created_by, status, requires_confirmation,
    total_amount, notes, created_at
  ) VALUES (
    'RO-2025-001239',
    '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
    '20892575-4c35-4b35-86e3-97d91268d20b',
    'rejected', false, 2134.75, 'Brak dostępności produktów',
    NOW() - INTERVAL '4 days'
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
  SELECT v_order_id, id, 25, unit, 89.99, 2249.75, 'rejected' FROM products WHERE id = '411e4173-3557-4624-a20a-686bf3536df0'
  UNION ALL
  SELECT v_order_id, id, 30, unit, 18.99, 569.70, 'rejected' FROM products WHERE id = 'a3c278a2-5fe6-4e2a-8a82-89507cef455e';

  INSERT INTO order_history (order_id, action, performed_by, details, created_at)
  VALUES 
    (v_order_id, 'created', '20892575-4c35-4b35-86e3-97d91268d20b', '{"items_count": 2}', NOW() - INTERVAL '4 days'),
    (v_order_id, 'status_changed', 'e385bc7d-1ebc-4d9e-a820-306a5ca0bc1d', '{"from": "sent", "to": "rejected", "reason": "Brak dostępności"}', NOW() - INTERVAL '3 days 12 hours');
END $$;

-- Zamówienie 7: Kolejne odrzucone (rejected)
DO $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO orders (
    order_number, store_id, created_by, status, requires_confirmation,
    total_amount, notes, created_at
  ) VALUES (
    'RO-2025-001240',
    '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
    '20892575-4c35-4b35-86e3-97d91268d20b',
    'rejected', false, 1567.80, 'Przekroczony limit kredytowy',
    NOW() - INTERVAL '6 days'
  ) RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit, unit_price, total_price, status)
  SELECT v_order_id, id, 20, unit, 28.99, 579.80, 'rejected' FROM products WHERE id = '68698c1a-dce7-4964-be59-aaac377fa249'
  UNION ALL
  SELECT v_order_id, id, 18, unit, 24.99, 449.82, 'rejected' FROM products WHERE id = '527ca8b4-2620-460f-9f68-ac9d8cf59659'
  UNION ALL
  SELECT v_order_id, id, 15, unit, 26.99, 404.85, 'rejected' FROM products WHERE id = '671474fb-161e-4d02-8003-ee688f55923a';

  INSERT INTO order_history (order_id, action, performed_by, details, created_at)
  VALUES 
    (v_order_id, 'created', '20892575-4c35-4b35-86e3-97d91268d20b', '{"items_count": 3}', NOW() - INTERVAL '6 days'),
    (v_order_id, 'status_changed', 'a6ef2b25-6ea5-48bf-b529-466d9fb41a49', '{"from": "sent", "to": "rejected", "reason": "Limit kredytowy"}', NOW() - INTERVAL '5 days 18 hours');
END $$;
