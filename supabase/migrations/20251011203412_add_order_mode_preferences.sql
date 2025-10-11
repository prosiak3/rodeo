/*
  # Dodanie preferencji trybów zamówień

  1. Zmiany w tabeli users
    - Dodanie kolumny `enable_voice_orders` (boolean) - czy włączyć zamówienia głosowe
    - Dodanie kolumny `enable_pricelist_orders` (boolean) - czy włączyć zamówienia z cennika
    - Dodanie kolumny `enable_copy_orders` (boolean) - czy włączyć kopiowanie zamówień
    - Dodanie kolumny `enable_manual_orders` (boolean) - czy włączyć zamówienia ręczne
    - Wszystkie domyślnie TRUE (włączone)
    
  2. Bezpieczeństwo
    - Rozszerza istniejące funkcje
    - Domyślne wartości nie zakłócają działania aplikacji
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'enable_voice_orders'
  ) THEN
    ALTER TABLE users ADD COLUMN enable_voice_orders boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'enable_pricelist_orders'
  ) THEN
    ALTER TABLE users ADD COLUMN enable_pricelist_orders boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'enable_copy_orders'
  ) THEN
    ALTER TABLE users ADD COLUMN enable_copy_orders boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'enable_manual_orders'
  ) THEN
    ALTER TABLE users ADD COLUMN enable_manual_orders boolean DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN users.enable_voice_orders IS 'Czy użytkownik ma włączone zamówienia głosowe';
COMMENT ON COLUMN users.enable_pricelist_orders IS 'Czy użytkownik ma włączone zamówienia z cennika';
COMMENT ON COLUMN users.enable_copy_orders IS 'Czy użytkownik ma włączone kopiowanie zamówień';
COMMENT ON COLUMN users.enable_manual_orders IS 'Czy użytkownik ma włączone zamówienia ręczne';