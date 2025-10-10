/*
  # Dodanie trybu zamawiania dla użytkowników

  1. Nowa kolumna
    - `order_mode` - tryb zamawiania z cennika ('quantity' lub 'list')
    
  2. Wartość domyślna
    - 'quantity' - tryb z podawaniem ilości od razu (obecny sposób)
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, dodaje nową kolumnę z wartością domyślną
*/

-- Dodaj kolumnę dla trybu zamawiania
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'order_mode'
  ) THEN
    ALTER TABLE users ADD COLUMN order_mode text DEFAULT 'quantity' NOT NULL;
  END IF;
END $$;

-- Dodaj constraint sprawdzający wartości
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_order_mode_check'
  ) THEN
    ALTER TABLE users 
      ADD CONSTRAINT users_order_mode_check 
      CHECK (order_mode IN ('quantity', 'list'));
  END IF;
END $$;
