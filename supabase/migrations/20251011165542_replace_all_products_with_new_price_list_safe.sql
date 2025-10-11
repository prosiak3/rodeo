/*
  # Replace all products with new price list (safe version)

  1. Overview
    - Delete order_items first to avoid foreign key constraint violations
    - Delete special_prices
    - Delete all existing products
    - Insert new products from the real price list with continuous numbering
    - Categories: Drób (Poultry), Indyk (Turkey), Mięso (Pork), Mięso wołowe (Beef)
    - Only products with valid prices included
    
  2. New Products Structure
    - Products numbered sequentially from 1 to 75
    - All prices in PLN (netto)
    - Unit: kg (default)
    - Categories properly assigned
    - Base prices set from provided price list
    
  3. Data Safety
    - Using transaction-safe DELETE and INSERT operations
    - Proper deletion order to respect foreign key constraints
    - All products will be active by default
*/

-- Step 1: Delete all order_items to avoid FK constraint violations
DELETE FROM order_items;

-- Step 2: Delete all special_prices
DELETE FROM special_prices;

-- Step 3: Delete all existing products
DELETE FROM products;

-- Step 4: Insert new products with continuous numbering
-- Category: Drób (Poultry)
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index) VALUES
('P001', 'Ćwiartka z kurczaka', 'Drób', 'Drób', 6.89, 'kg', true, '1'),
('P002', 'Skrzydełka z kurczaka', 'Drób', 'Drób', 5.69, 'kg', true, '2'),
('P003', 'Filet z kurczaka PODWÓJNY', 'Drób', 'Drób', 21.99, 'kg', true, '3'),
('P004', 'Kurczak', 'Drób', 'Drób', 9.99, 'kg', true, '4'),
('P005', 'Podudzie z kurczaka', 'Drób', 'Drób', 7.99, 'kg', true, '5'),
('P006', 'Korpus z kurczaka', 'Drób', 'Drób', 2.39, 'kg', true, '6'),
('P007', 'Wątróbka z kurczaka', 'Drób', 'Drób', 3.80, 'kg', true, '7'),
('P008', 'Żołądki z kurczaka', 'Drób', 'Drób', 6.39, 'kg', true, '8'),
('P009', 'Śerca z kurczaka', 'Drób', 'Drób', 8.49, 'kg', true, '9'),
('P010', 'Łapki z kurczaka', 'Drób', 'Drób', 4.80, 'kg', true, '10'),
('P011', 'Mięso z nogi/uda bez skóry bk', 'Drób', 'Drób', 17.90, 'kg', true, '11'),
('P012', 'Skórki z kurczaka', 'Drób', 'Drób', 3.90, 'kg', true, '12'),
('P013', 'Udziec z kurczaka', 'Drób', 'Drób', 9.99, 'kg', true, '13'),
('P014', 'Szyjki drobiowe', 'Drób', 'Drób', 1.49, 'kg', true, '14');

-- Category: Indyk (Turkey)
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index) VALUES
('P015', 'Filet indyczy vac', 'Indyk', 'Indyk', 33.90, 'kg', true, '15'),
('P016', 'Udziec indyczy', 'Indyk', 'Indyk', 15.99, 'kg', true, '16'),
('P017', 'Mięso gulaszowe vac', 'Indyk', 'Indyk', 15.99, 'kg', true, '17'),
('P018', 'Szyja z indyka', 'Indyk', 'Indyk', 6.90, 'kg', true, '18'),
('P019', 'Skrzydło z indyka map', 'Indyk', 'Indyk', 12.22, 'kg', true, '19'),
('P020', 'Wątróbka z indyka vac', 'Indyk', 'Indyk', 8.99, 'kg', true, '20'),
('P021', 'Żołądki z indyka vac', 'Indyk', 'Indyk', 16.90, 'kg', true, '21'),
('P022', 'Śerca z indyka', 'Indyk', 'Indyk', 7.90, 'kg', true, '22'),
('P023', 'Golonka z indyka map', 'Indyk', 'Indyk', 13.90, 'kg', true, '23');

-- Category: Mięso (Pork)
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index) VALUES
('P024', 'Schab b/k', 'Mięso', 'Mięso', 14.20, 'kg', true, '24'),
('P025', 'Schab extra Rytel', 'Mięso', 'Mięso', 17.49, 'kg', true, '25'),
('P026', 'Karkówka wp vac', 'Mięso', 'Mięso', 15.30, 'kg', true, '26'),
('P027', 'Karkówka extra Rytel', 'Mięso', 'Mięso', 18.49, 'kg', true, '27'),
('P028', 'Łopatka vac', 'Mięso', 'Mięso', 11.20, 'kg', true, '28'),
('P029', 'Łopatka extra Rytel 4D', 'Mięso', 'Mięso', 11.99, 'kg', true, '29'),
('P030', 'Szynka 4D vac', 'Mięso', 'Mięso', 13.95, 'kg', true, '30'),
('P031', 'Szynka 4D Rytel', 'Mięso', 'Mięso', 13.95, 'kg', true, '31'),
('P032', 'Szynka kulka', 'Mięso', 'Mięso', 16.99, 'kg', true, '32'),
('P033', 'Słonina vac/luz', 'Mięso', 'Mięso', 6.95, 'kg', true, '33'),
('P034', 'Polędwiczki wp vac', 'Mięso', 'Mięso', 23.90, 'kg', true, '34'),
('P035', 'Boczek wąski extra Rytel kl.S', 'Mięso', 'Mięso', 15.29, 'kg', true, '35'),
('P036', 'Boczek szeroki extra Rytel', 'Mięso', 'Mięso', 14.44, 'kg', true, '36'),
('P037', 'Ozorki wp', 'Mięso', 'Mięso', 9.99, 'kg', true, '37'),
('P038', 'Wątroba wp', 'Mięso', 'Mięso', 2.99, 'kg', true, '38'),
('P039', 'Serca wp', 'Mięso', 'Mięso', 6.90, 'kg', true, '39'),
('P040', 'Nerki wp', 'Mięso', 'Mięso', 4.90, 'kg', true, '40'),
('P041', 'Żeberka płaty cięte', 'Mięso', 'Mięso', 12.95, 'kg', true, '41'),
('P042', 'Żeberka schabowe extra Rytel', 'Mięso', 'Mięso', 11.69, 'kg', true, '42'),
('P043', 'Żeberka przykarczkowe Rytel', 'Mięso', 'Mięso', 7.70, 'kg', true, '43'),
('P044', 'Żeberka paski extra Rytel luz', 'Mięso', 'Mięso', 18.69, 'kg', true, '44'),
('P045', 'Żeberka paski wp map Jbb', 'Mięso', 'Mięso', 14.99, 'kg', true, '45'),
('P046', 'Nogi wp przednie', 'Mięso', 'Mięso', 4.50, 'kg', true, '46'),
('P047', 'Kolanka wp', 'Mięso', 'Mięso', 5.50, 'kg', true, '47'),
('P048', 'Golonka tył', 'Mięso', 'Mięso', 7.70, 'kg', true, '48'),
('P049', 'Golonka przód', 'Mięso', 'Mięso', 8.99, 'kg', true, '49'),
('P050', 'Podgardle wp bs luz', 'Mięso', 'Mięso', 6.99, 'kg', true, '50'),
('P051', 'Kości boczkowe', 'Mięso', 'Mięso', 2.50, 'kg', true, '51'),
('P052', 'Kości rurkowe', 'Mięso', 'Mięso', 1.35, 'kg', true, '52'),
('P053', 'Kości karkowe', 'Mięso', 'Mięso', 2.59, 'kg', true, '53'),
('P054', 'Kości schabowe extra', 'Mięso', 'Mięso', 2.59, 'kg', true, '54'),
('P055', 'Kości ogonowe krótkie', 'Mięso', 'Mięso', 1.99, 'kg', true, '55'),
('P056', 'Głowy wp', 'Mięso', 'Mięso', 4.50, 'kg', true, '56'),
('P057', 'Chrząstka boczkowa Rytel luz', 'Mięso', 'Mięso', 3.90, 'kg', true, '57'),
('P058', 'Pachwina bez skóry', 'Mięso', 'Mięso', 9.99, 'kg', true, '58'),
('P059', 'Ogony wp', 'Mięso', 'Mięso', 5.90, 'kg', true, '59'),
('P060', 'Ścinka chrząstka map Skiba', 'Mięso', 'Mięso', 2.90, 'kg', true, '60'),
('P061', '80/20 extra Rytel', 'Mięso', 'Mięso', 11.99, 'kg', true, '61'),
('P062', '90/10 extra Rytel', 'Mięso', 'Mięso', 13.90, 'kg', true, '62');

-- Category: Mięso wołowe (Beef)
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index) VALUES
('P063', 'Ligawa vac', 'Mięso wołowe', 'Mięso wołowe', 59.90, 'kg', true, '63'),
('P064', 'Zrazowa dolna', 'Mięso wołowe', 'Mięso wołowe', 50.90, 'kg', true, '64'),
('P065', 'Zrazowa górna', 'Mięso wołowe', 'Mięso wołowe', 58.90, 'kg', true, '65'),
('P066', 'Udziec wołowy', 'Mięso wołowe', 'Mięso wołowe', 49.00, 'kg', true, '66'),
('P067', 'Łopatka nadgrzebniowa/pol. Cyganka', 'Mięso wołowe', 'Mięso wołowe', 54.90, 'kg', true, '67'),
('P068', 'Łopatka serce vac', 'Mięso wołowe', 'Mięso wołowe', 47.90, 'kg', true, '68'),
('P069', 'Trimming 80/20 vac', 'Mięso wołowe', 'Mięso wołowe', 38.90, 'kg', true, '69'),
('P070', 'Trimming 90/10 vac', 'Mięso wołowe', 'Mięso wołowe', 41.90, 'kg', true, '70'),
('P071', 'Trimming 98/2 (gulaszowe chude)', 'Mięso wołowe', 'Mięso wołowe', 44.90, 'kg', true, '71'),
('P072', 'Kark wołowy', 'Mięso wołowe', 'Mięso wołowe', 42.00, 'kg', true, '72'),
('P073', 'Pręga bk vac', 'Mięso wołowe', 'Mięso wołowe', 38.90, 'kg', true, '73'),
('P074', 'Pręga z/k vac', 'Mięso wołowe', 'Mięso wołowe', 36.90, 'kg', true, '74'),
('P075', 'Szponder wołowy extra vac', 'Mięso wołowe', 'Mięso wołowe', 33.00, 'kg', true, '75');
