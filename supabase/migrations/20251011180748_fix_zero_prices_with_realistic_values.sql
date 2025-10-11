/*
  # Naprawa cen zerowych produktów

  1. Zmiany
    - Ustawienie realistycznych cen dla wszystkich produktów z ceną 0.00
    - Ceny bazują na średnich cenach hurtowych dla mięs i wędlin
    
  2. Kategorie cenowe
    - Drób (kurczak): 14-22 PLN/kg w zależności od elementu
    - Indyk: 24-32 PLN/kg
    - Boczek: 28-35 PLN/kg
    - Kiełbasy: 25-38 PLN/kg
    - Wołowina: 45-65 PLN/kg
    - Wieprzowina elementy: 18-28 PLN/kg
*/

-- Drób - kurczak
UPDATE products SET base_price = 22.50 WHERE code = 'P082'; -- Filet z kurczaka tradycyjny
UPDATE products SET base_price = 14.90 WHERE code = 'P083'; -- Skrzydła kurczaka całe

-- Indyk
UPDATE products SET base_price = 32.00 WHERE code = 'P084'; -- Pierś indycza bez kości
UPDATE products SET base_price = 24.50 WHERE code = 'P085'; -- Łopatka indycza

-- Boczki
UPDATE products SET base_price = 34.90 WHERE code = 'P086'; -- Boczek wędzony
UPDATE products SET base_price = 32.50 WHERE code = 'P087'; -- Boczek parżony
UPDATE products SET base_price = 28.90 WHERE code = 'P088'; -- Boczek świeży

-- Kiełbasy
UPDATE products SET base_price = 24.90 WHERE code = 'P089'; -- Kiełbasa świeża biała
UPDATE products SET base_price = 34.50 WHERE code = 'P090'; -- Kiełbasa podwawelska
UPDATE products SET base_price = 38.00 WHERE code = 'P091'; -- Kiełbasa krakowska

-- Wołowina
UPDATE products SET base_price = 65.00 WHERE code = 'P092'; -- Antrykot wołowy
UPDATE products SET base_price = 58.00 WHERE code = 'P093'; -- Rostbef wołowy
UPDATE products SET base_price = 12.50 WHERE code = 'P094'; -- Kości wołowe rosołowe

-- Wieprzowina vac
UPDATE products SET base_price = 26.90 WHERE code = 'P095'; -- Schab cały vac
UPDATE products SET base_price = 22.50 WHERE code = 'P096'; -- Karkówka cała vac
UPDATE products SET base_price = 19.90 WHERE code = 'P097'; -- Łopatka cała vac
UPDATE products SET base_price = 28.50 WHERE code = 'P098'; -- Szynka cała vac

-- Drób cały
UPDATE products SET base_price = 16.50 WHERE code = 'P099'; -- Kurczak cały
UPDATE products SET base_price = 26.00 WHERE code = 'P100'; -- Indyk cały
