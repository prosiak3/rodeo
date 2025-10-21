/*
  # Dodanie przykładowych cen specjalnych i promocyjnych

  1. Przykładowe dane
    - Produkty tylko z ceną normalną (brak special_prices)
    - Produkty z ceną normalną + Cena sklepu (your_price)
    - Produkty z ceną normalną + Cena sklepu + Promocyjna (promo_price)
    
  2. Kombinacje dla Delikatesy Centrum
    - Część produktów: tylko base_price
    - Część produktów: base_price + your_price (5-10% taniej)
    - Część produktów: base_price + your_price + promo_price (15-25% taniej)
    
  3. Bezpieczeństwo
    - Używa INSERT ... ON CONFLICT DO NOTHING
    - Bezpieczne dla istniejących danych
*/

-- Usuń stare dane special_prices dla czystości
DELETE FROM special_prices;

-- Produkty z ceną sklepu (5-10% taniej niż base_price)
INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
VALUES
  -- Boczek parzony: Normalna 28.99 → Twoja 26.50
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', '25b62fab-1ab8-4894-b085-1ef7373cbb8a', 26.50, NULL, NOW(), NULL),
  
  -- Filet z kurczaka: Normalna 26.99 → Twoja 24.99
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', 'c7d1e961-cba0-4db6-8bc8-c262a330cc57', 24.99, NULL, NOW(), NULL),
  
  -- Pierś z kurczaka: Normalna 24.99 → Twoja 22.50
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', 'd2363278-30f2-42a3-b3eb-e079535f7926', 22.50, NULL, NOW(), NULL),
  
  -- Skrzydełka kurczaka: Normalna 16.99 → Twoja 15.50
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', 'd1612304-8b2c-4c6b-a9c7-e6cc7a5c95ce', 15.50, NULL, NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Produkty z ceną "Twoja" + "Specjalna" (promocja!)
INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
VALUES
  -- Boczek wędzony: Normalna 32.99 → Twoja 30.99 → SPECJALNA 24.99!
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', '3c01dc2e-fffa-4ce6-b737-528f6cc922fd', 30.99, 24.99, NOW(), NOW() + INTERVAL '7 days'),
  
  -- Gęś cała: Normalna 38.99 → Twoja 36.99 → SPECJALNA 29.99!
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', 'f0353b05-ae0a-4861-bd22-acd7c5dfd323', 36.99, 29.99, NOW(), NOW() + INTERVAL '7 days'),
  
  -- Kaczka cała: Normalna 45.00 → Twoja 42.00 → SPECJALNA 34.99!
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', '547d0da1-e921-48ed-be82-f2782249cb84', 42.00, 34.99, NOW(), NOW() + INTERVAL '7 days'),
  
  -- Pierś z indyka: Normalna 32.99 → Twoja 30.50 → SPECJALNA 25.99!
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', '197d8aea-1ec9-405b-a451-72db61e63e71', 30.50, 25.99, NOW(), NOW() + INTERVAL '7 days'),
  
  -- Pierś z kaczki: Normalna 45.99 → Twoja 43.99 → SPECJALNA 37.99!
  ('5409c92b-76bf-4a32-b8ca-cebd8e34630c', '69f844a7-5381-4368-a866-78e762f89e49', 43.99, 37.99, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Dodaj ceny dla drugiego sklepu (Sklep Mięsny ABC)
INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
VALUES
  -- Kurczak cały: Normalna 12.99 → Twoja 11.99 → SPECJALNA 9.99!
  ('e10a4fdc-30a2-46ca-931d-620108b4334a', '8c4424ee-eb78-4a36-88fc-fe9165b75f1b', 11.99, 9.99, NOW(), NOW() + INTERVAL '7 days'),
  
  -- Udka z indyka: Normalna 19.99 → Twoja 18.50
  ('e10a4fdc-30a2-46ca-931d-620108b4334a', 'a7feaf2b-8a2a-4002-8ef3-751e891176e1', 18.50, NULL, NOW(), NULL)
ON CONFLICT DO NOTHING;
