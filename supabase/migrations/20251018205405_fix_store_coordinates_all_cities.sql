/*
  # Fix Store Coordinates for All Cities

  1. Changes
    - Update coordinates for all stores based on their actual city locations
    - Use accurate coordinates for Polish cities
  
  2. Notes
    - Each store gets coordinates matching its actual address
    - Coordinates are city centers or specific district locations
*/

-- Rzeszów
UPDATE stores 
SET latitude = 50.0412, longitude = 22.0045 
WHERE name = 'Auchan Rzeszów';

-- Bydgoszcz
UPDATE stores 
SET latitude = 53.1235, longitude = 18.0084 
WHERE name = 'Biedronka Bydgoszcz';

-- Toruń
UPDATE stores 
SET latitude = 53.0138, longitude = 18.5984 
WHERE name = 'Biedronka Toruń';

-- Olsztyn
UPDATE stores 
SET latitude = 53.7784, longitude = 20.4801 
WHERE name = 'Carrefour Olsztyn';

-- Warszawa - various locations (keep existing Warszawa coordinates)
-- Already correct: Biedronka Warszawa Centrum, Delikatesy Centrum

-- Poznań
UPDATE stores 
SET latitude = 52.4064, longitude = 16.9252 
WHERE name = 'Hurtownia Centrum';

-- Kraków
UPDATE stores 
SET latitude = 50.0647, longitude = 19.9450 
WHERE name = 'Sklep Mięsny ABC';

-- Kielce
UPDATE stores 
SET latitude = 50.8661, longitude = 20.6286 
WHERE name = 'Tesco Kielce';
