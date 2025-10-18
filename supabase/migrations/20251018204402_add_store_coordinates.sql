/*
  # Add Geographic Coordinates to Stores

  1. Changes
    - Add `latitude` column to stores table (decimal, nullable)
    - Add `longitude` column to stores table (decimal, nullable)
    - Update existing stores with sample coordinates for Polish cities
  
  2. Notes
    - Coordinates allow stores to be displayed on interactive maps
    - Nullable to allow stores without location data
    - Sample data uses real Polish city coordinates
*/

-- Add latitude and longitude columns
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing stores with sample coordinates (Polish cities)
-- These are approximate city center coordinates

UPDATE stores SET latitude = 52.2297, longitude = 21.0122 WHERE name LIKE '%Warszawa%';
UPDATE stores SET latitude = 50.0647, longitude = 19.9450 WHERE name LIKE '%Kraków%';
UPDATE stores SET latitude = 51.1079, longitude = 17.0385 WHERE name LIKE '%Wrocław%';
UPDATE stores SET latitude = 54.3520, longitude = 18.6466 WHERE name LIKE '%Gdańsk%';
UPDATE stores SET latitude = 53.4285, longitude = 14.5528 WHERE name LIKE '%Szczecin%';
UPDATE stores SET latitude = 51.2465, longitude = 22.5684 WHERE name LIKE '%Lublin%';
UPDATE stores SET latitude = 50.2649, longitude = 19.0238 WHERE name LIKE '%Katowice%';
UPDATE stores SET latitude = 53.1325, longitude = 23.1688 WHERE name LIKE '%Białystok%';
UPDATE stores SET latitude = 51.7592, longitude = 19.4560 WHERE name LIKE '%Łódź%';
UPDATE stores SET latitude = 52.4064, longitude = 16.9252 WHERE name LIKE '%Poznań%';

-- For any remaining stores without coordinates, set Warsaw coordinates as default
UPDATE stores 
SET latitude = 52.2297, longitude = 21.0122 
WHERE latitude IS NULL AND longitude IS NULL;
