/*
  # Bardziej zróżnicowane ceny produktów

  1. Zmiany
    - Dodanie większej różnicy między cenami
    - Twoja cena: 5-15% taniej niż normalna
    - Cena promocyjna: 15-30% taniej niż normalna
    
  2. Przykłady
    - Produkty z tylko ceną "Twoja"
    - Produkty z ceną "Twoja" i "Specjalna"
    - Różne poziomy rabatów
*/

-- Usuń istniejące ceny specjalne dla sklepu Delikatesy Centrum
DELETE FROM special_prices WHERE store_id = '5409c92b-76bf-4a32-b8ca-cebd8e34630c';

-- Produkty z ceną "Twoja" (10% taniej)
INSERT INTO special_prices (product_id, store_id, your_price, promo_price, valid_from, valid_to)
SELECT 
  p.id,
  '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
  ROUND((p.base_price * 0.90)::numeric, 2),
  0,
  NOW(),
  NULL
FROM products p
WHERE p.id IN (
  '25b62fab-1ab8-4894-b085-1ef7373cbb8a',
  'b4b875fd-2b2c-4bbf-9f9e-79eca737e81a',
  '527ca8b4-2620-460f-9f68-ac9d8cf59659',
  'cea14b42-e8f6-42ed-b932-b3f913f32684'
);

-- Produkty z ceną "Twoja" (10%) i "Specjalna" (25%)
INSERT INTO special_prices (product_id, store_id, your_price, promo_price, valid_from, valid_to)
SELECT 
  p.id,
  '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
  ROUND((p.base_price * 0.90)::numeric, 2),
  ROUND((p.base_price * 0.75)::numeric, 2),
  NOW(),
  NOW() + INTERVAL '14 days'
FROM products p
WHERE p.id IN (
  '3c01dc2e-fffa-4ce6-b737-528f6cc922fd',
  '411e4173-3557-4624-a20a-686bf3536df0',
  'a3c278a2-5fe6-4e2a-8a82-89507cef455e'
);

-- Produkty z ceną "Twoja" równą normalnej ale "Specjalna" 30% taniej (super promocja)
INSERT INTO special_prices (product_id, store_id, your_price, promo_price, valid_from, valid_to)
SELECT 
  p.id,
  '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
  p.base_price,
  ROUND((p.base_price * 0.70)::numeric, 2),
  NOW(),
  NOW() + INTERVAL '7 days'
FROM products p
WHERE p.id IN (
  '4413ffd2-df63-4328-86a4-e6b0b25ed6a5',
  '68698c1a-dce7-4964-be59-aaac377fa249'
);

-- Produkty z bardzo dobrą ceną "Twoja" (15% taniej)
INSERT INTO special_prices (product_id, store_id, your_price, promo_price, valid_from, valid_to)
SELECT 
  p.id,
  '5409c92b-76bf-4a32-b8ca-cebd8e34630c',
  ROUND((p.base_price * 0.85)::numeric, 2),
  0,
  NOW(),
  NULL
FROM products p
WHERE p.id = '671474fb-161e-4d02-8003-ee688f55923a'
LIMIT 1;
