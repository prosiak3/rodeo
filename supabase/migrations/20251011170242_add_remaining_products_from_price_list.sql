/*
  # Add remaining products from complete price list

  1. Overview
    - Add all remaining products from the complete price list
    - Products without prices get base_price = 0
    - Includes both kg and szt units
    - Sequential numbering continues from 82
    
  2. Categories
    - Drób (Poultry)
    - Indyk (Turkey)
    - Mięso (Pork)
    - Mięso wołowe (Beef)
    - Wędliny (Cold cuts/Deli)
    
  3. Data Safety
    - Only inserting new products
    - All products active by default
*/

-- Additional Drób products
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index, min_quantity, quantity_step) VALUES
('P082', 'Filet z kurczaka tradycyjny', 'Drób', 'Drób', 0, 'kg', true, '82', 1, 1),
('P083', 'Skrzydła kurczaka całe', 'Drób', 'Drób', 0, 'kg', true, '83', 1, 1);

-- Additional Indyk products
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index, min_quantity, quantity_step) VALUES
('P084', 'Pierś indycza bez kości', 'Indyk', 'Indyk', 0, 'kg', true, '84', 1, 1),
('P085', 'Łopatka indycza', 'Indyk', 'Indyk', 0, 'kg', true, '85', 1, 1);

-- Additional Mięso products
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index, min_quantity, quantity_step) VALUES
('P086', 'Boczek wędzony', 'Mięso', 'Mięso', 0, 'kg', true, '86', 1, 1),
('P087', 'Boczek parżony', 'Mięso', 'Mięso', 0, 'kg', true, '87', 1, 1),
('P088', 'Boczek świeży', 'Mięso', 'Mięso', 0, 'kg', true, '88', 1, 1),
('P089', 'Kiełbasa świeża biała', 'Mięso', 'Mięso', 0, 'kg', true, '89', 1, 1),
('P090', 'Kiełbasa podwawelska', 'Mięso', 'Mięso', 0, 'kg', true, '90', 1, 1),
('P091', 'Kiełbasa krakowska', 'Mięso', 'Mięso', 0, 'kg', true, '91', 1, 1);

-- Additional Mięso wołowe products
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index, min_quantity, quantity_step) VALUES
('P092', 'Antrykot wołowy', 'Mięso wołowe', 'Mięso wołowe', 0, 'kg', true, '92', 1, 1),
('P093', 'Rostbef wołowy', 'Mięso wołowe', 'Mięso wołowe', 0, 'kg', true, '93', 1, 1),
('P094', 'Kości wołowe rosołowe', 'Mięso wołowe', 'Mięso wołowe', 0, 'kg', true, '94', 1, 1);

-- Products sold by piece (szt)
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index, min_quantity, quantity_step) VALUES
('P095', 'Schab cały vac', 'Mięso', 'Mięso', 0, 'szt', true, '95', 1, 1),
('P096', 'Karkówka cała vac', 'Mięso', 'Mięso', 0, 'szt', true, '96', 1, 1),
('P097', 'Łopatka cała vac', 'Mięso', 'Mięso', 0, 'szt', true, '97', 1, 1),
('P098', 'Szynka cała vac', 'Mięso', 'Mięso', 0, 'szt', true, '98', 1, 1),
('P099', 'Kurczak cały', 'Drób', 'Drób', 0, 'szt', true, '99', 1, 1),
('P100', 'Indyk cały', 'Indyk', 'Indyk', 0, 'szt', true, '100', 1, 1);
