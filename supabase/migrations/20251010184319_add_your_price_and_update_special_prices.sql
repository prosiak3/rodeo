/*
  # Dodanie ceny "Twojej" i aktualizacja cen specjalnych

  1. Zmiany w tabeli special_prices
    - Zmiana nazwy kolumny `special_price` na `your_price` (cena dla konkretnego sklepu)
    - Dodanie kolumny `promo_price` (cena promocyjna/specjalna - najniższa)
    
  2. Logika cen
    - base_price (products) - cena normalna/bazowa
    - your_price (special_prices) - cena dla Twojego sklepu
    - promo_price (special_prices) - cena specjalna/promocyjna
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, rozszerza istniejące funkcje
*/

-- Dodaj kolumnę promo_price
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'special_prices' AND column_name = 'promo_price'
  ) THEN
    ALTER TABLE special_prices ADD COLUMN promo_price numeric(10,2);
  END IF;
END $$;

-- Zmień nazwę special_price na your_price dla klarowności
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'special_prices' AND column_name = 'special_price'
  ) THEN
    ALTER TABLE special_prices RENAME COLUMN special_price TO your_price;
  END IF;
END $$;

-- Dodaj komentarze do kolumn
COMMENT ON COLUMN special_prices.your_price IS 'Cena dla konkretnego sklepu (Twoja cena)';
COMMENT ON COLUMN special_prices.promo_price IS 'Cena promocyjna/specjalna (najniższa)';
