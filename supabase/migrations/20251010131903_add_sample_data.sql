/*
  # Dodanie przykładowych danych testowych
  
  ## Nowe dane
  
  ### 1. Sklepy testowe
    - Sklep "Delikatesy Centrum" - kod: SHOP001
    - Sklep "Sklep Mięsny ABC" - kod: SHOP002
    - Sklep "Hurtownia Centrum" - kod: WAREHOUSE001
  
  ### 2. Produkty przykładowe
    - Różne produkty mięsne i wędliny z cenami
    - Kategorie: wieprzowina, wołowina, drób, wędliny
  
  ## Uwagi
  - Dane testowe do celów demonstracyjnych
  - Użytkownicy będą dodani po utworzeniu kont w Auth
*/

-- Dodanie sklepów testowych
INSERT INTO stores (name, code, address, phone, active) VALUES
  ('Delikatesy Centrum', 'SHOP001', 'ul. Główna 15, Warszawa', '+48 123 456 789', true),
  ('Sklep Mięsny ABC', 'SHOP002', 'ul. Rynkowa 8, Kraków', '+48 234 567 890', true),
  ('Hurtownia Centrum', 'WAREHOUSE001', 'ul. Magazynowa 50, Poznań', '+48 345 678 901', true)
ON CONFLICT (code) DO NOTHING;

-- Dodanie produktów testowych
INSERT INTO products (name, code, category, unit, base_price, active) VALUES
  ('Schab wieprzowy', 'MEAT001', 'wieprzowina', 'kg', 28.90, true),
  ('Karkówka wieprzowa', 'MEAT002', 'wieprzowina', 'kg', 24.50, true),
  ('Żeberka wieprzowe', 'MEAT003', 'wieprzowina', 'kg', 18.90, true),
  ('Kiełbasa krakowska', 'SAUS001', 'wędliny', 'kg', 32.00, true),
  ('Kiełbasa śląska', 'SAUS002', 'wędliny', 'kg', 28.00, true),
  ('Szynka gotowana', 'SAUS003', 'wędliny', 'kg', 35.00, true),
  ('Polędwica wołowa', 'BEEF001', 'wołowina', 'kg', 65.00, true),
  ('Rostbef', 'BEEF002', 'wołowina', 'kg', 55.00, true),
  ('Pierś z kurczaka', 'CHIC001', 'drób', 'kg', 22.00, true),
  ('Udko z kurczaka', 'CHIC002', 'drób', 'kg', 16.50, true),
  ('Boczek wędzony', 'SAUS004', 'wędliny', 'kg', 29.00, true),
  ('Kabanosy', 'SAUS005', 'wędliny', 'kg', 45.00, true)
ON CONFLICT (code) DO NOTHING;

-- Dodanie specjalnych cen dla wybranych sklepów
INSERT INTO special_prices (store_id, product_id, special_price, valid_from, valid_to)
SELECT 
  (SELECT id FROM stores WHERE code = 'SHOP001'),
  (SELECT id FROM products WHERE code = 'MEAT001'),
  25.90,
  NOW(),
  NOW() + INTERVAL '30 days'
WHERE NOT EXISTS (
  SELECT 1 FROM special_prices 
  WHERE store_id = (SELECT id FROM stores WHERE code = 'SHOP001')
  AND product_id = (SELECT id FROM products WHERE code = 'MEAT001')
);

INSERT INTO special_prices (store_id, product_id, special_price, valid_from, valid_to)
SELECT 
  (SELECT id FROM stores WHERE code = 'SHOP001'),
  (SELECT id FROM products WHERE code = 'SAUS001'),
  28.00,
  NOW(),
  NOW() + INTERVAL '30 days'
WHERE NOT EXISTS (
  SELECT 1 FROM special_prices 
  WHERE store_id = (SELECT id FROM stores WHERE code = 'SHOP001')
  AND product_id = (SELECT id FROM products WHERE code = 'SAUS001')
);