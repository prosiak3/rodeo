/*
  # Dodanie preferencji układu klawiszy trybów zamówień

  1. Zmiany w tabeli users
    - Dodanie kolumny `order_mode_layout` (text) - sposób wyświetlania przycisków: 'list' lub 'grid'
    - Domyślnie 'list' (lista)
    
  2. Bezpieczeństwo
    - Rozszerza istniejące funkcje
    - Domyślna wartość nie zakłóca działania aplikacji
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'order_mode_layout'
  ) THEN
    ALTER TABLE users ADD COLUMN order_mode_layout text DEFAULT 'list' CHECK (order_mode_layout IN ('list', 'grid'));
  END IF;
END $$;

COMMENT ON COLUMN users.order_mode_layout IS 'Sposób wyświetlania przycisków trybów zamówień: list (lista) lub grid (siatka)';