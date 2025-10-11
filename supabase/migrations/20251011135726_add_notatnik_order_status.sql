/*
  # Dodanie statusu "notatnik" dla zamówień
  
  1. Zmiany
    - Aktualizacja typu enum dla statusów zamówień
    - Dodanie statusu 'notatnik' (lista produktów bez ilości)
    
  2. Kolejność statusów
    - draft: szkic
    - notatnik: lista produktów bez ilości
    - sent: wysłane
    - in_progress: w realizacji
    - pending_confirmation: oczekuje potwierdzenia
    - partially_confirmed: częściowo potwierdzone
    - confirmed: potwierdzone
    - rejected: odrzucone
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, rozszerza istniejące wartości
*/

-- Usuń stary constraint jeśli istnieje
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

-- Dodaj nowy constraint z rozszerzonym zestawem statusów
ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'draft', 
    'notatnik',
    'sent', 
    'in_progress',
    'pending_confirmation', 
    'partially_confirmed', 
    'confirmed', 
    'rejected'
  ));
