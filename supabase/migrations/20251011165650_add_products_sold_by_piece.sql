/*
  # Add products sold by piece (szt)

  1. Overview
    - Add products that are sold by piece (sztuka) instead of kg
    - These products will have unit='szt' 
    - Includes items like filet pojedynczy, korpus indyk, etc.
    
  2. New Products
    - Sequential numbering continues from 76
    - All products with unit='szt'
    - Appropriate min_quantity and quantity_step for pieces
    
  3. Data Safety
    - Only inserting new products, no deletions
*/

-- Add products sold by piece
INSERT INTO products (code, name, original_category, display_category, base_price, unit, active, index, min_quantity, quantity_step) VALUES
-- Drób (pieces)
('P076', 'Filet z kurczaka POJEDYNCZY', 'Drób', 'Drób', 10.99, 'szt', true, '76', 1, 1),
('P077', 'Filet drobiowy KULINARNY', 'Drób', 'Drób', 8.50, 'szt', true, '77', 1, 1),

-- Indyk (pieces)
('P078', 'Korpus indyk', 'Indyk', 'Indyk', 12.00, 'szt', true, '78', 1, 1),

-- Mięso wieprzowe (pieces)
('P079', 'Karkówka NIK Pol extra', 'Mięso', 'Mięso', 18.99, 'szt', true, '79', 1, 1),
('P080', 'Boczek łuskany vac extra Łuków', 'Mięso', 'Mięso', 16.50, 'szt', true, '80', 1, 1),

-- Mięso wołowe (pieces)
('P081', 'Łopatka podgrzebniowa', 'Mięso wołowe', 'Mięso wołowe', 45.00, 'szt', true, '81', 1, 1);
