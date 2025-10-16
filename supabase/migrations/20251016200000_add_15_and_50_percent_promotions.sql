/*
  # Add -15% and -50% promotional prices

  1. Changes
    - Add 2 MORE products with -15% discount (total will be 4 products with -15%)
    - Add 1 product with -50% discount (super promotion)
    - These will be added to special_prices table for all stores

  2. Current promotions (-15%):
    - Kurczak
    - Boczek świeży

  3. New promotions:
    - Schab: -15%
    - Kiełbasa: -15%
    - Polędwica: -50% (MEGA PROMOCJA)

  4. Security
    - Promotions visible with red border in price list
    - Updates existing special_prices if already present
*/

DO $$
DECLARE
  store_rec RECORD;
  product_schab_id uuid;
  product_kielbasa_id uuid;
  product_polendwica_id uuid;
BEGIN
  -- Find products for new promotions
  SELECT id INTO product_schab_id FROM products WHERE name ILIKE '%schab%' AND name NOT ILIKE '%kiełbasa%' AND active = true LIMIT 1;
  SELECT id INTO product_kielbasa_id FROM products WHERE name ILIKE '%kiełbasa%' AND active = true LIMIT 1;
  SELECT id INTO product_polendwica_id FROM products WHERE name ILIKE '%polędwic%' AND active = true LIMIT 1;

  -- Add promotions for all stores
  FOR store_rec IN SELECT id FROM stores WHERE active = true LOOP
    -- First NEW -15% promotion (Schab)
    IF product_schab_id IS NOT NULL THEN
      INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
      SELECT
        store_rec.id,
        product_schab_id,
        base_price,
        ROUND(base_price * 0.85, 2) as promo_price,
        NOW(),
        NOW() + INTERVAL '30 days'
      FROM products WHERE id = product_schab_id
      ON CONFLICT (store_id, product_id)
      DO UPDATE SET
        promo_price = ROUND((SELECT base_price FROM products WHERE id = product_schab_id) * 0.85, 2),
        valid_from = NOW(),
        valid_to = NOW() + INTERVAL '30 days';
    END IF;

    -- Second NEW -15% promotion (Kiełbasa)
    IF product_kielbasa_id IS NOT NULL THEN
      INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
      SELECT
        store_rec.id,
        product_kielbasa_id,
        base_price,
        ROUND(base_price * 0.85, 2) as promo_price,
        NOW(),
        NOW() + INTERVAL '30 days'
      FROM products WHERE id = product_kielbasa_id
      ON CONFLICT (store_id, product_id)
      DO UPDATE SET
        promo_price = ROUND((SELECT base_price FROM products WHERE id = product_kielbasa_id) * 0.85, 2),
        valid_from = NOW(),
        valid_to = NOW() + INTERVAL '30 days';
    END IF;

    -- MEGA -50% promotion (Polędwica)
    IF product_polendwica_id IS NOT NULL THEN
      INSERT INTO special_prices (store_id, product_id, your_price, promo_price, valid_from, valid_to)
      SELECT
        store_rec.id,
        product_polendwica_id,
        base_price,
        ROUND(base_price * 0.50, 2) as promo_price,
        NOW(),
        NOW() + INTERVAL '30 days'
      FROM products WHERE id = product_polendwica_id
      ON CONFLICT (store_id, product_id)
      DO UPDATE SET
        promo_price = ROUND((SELECT base_price FROM products WHERE id = product_polendwica_id) * 0.50, 2),
        valid_from = NOW(),
        valid_to = NOW() + INTERVAL '30 days';
    END IF;
  END LOOP;

  RAISE NOTICE 'Dodano nowe promocje: 2x -15%% i 1x -50%%';
END $$;
