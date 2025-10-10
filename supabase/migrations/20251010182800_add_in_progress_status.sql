/*
  # Dodanie statusu "w realizacji" dla zamówień

  1. Zmiany
    - Aktualizacja typu enum dla statusów zamówień
    - Dodanie statusu 'in_progress' (w realizacji)
    
  2. Kolejność statusów
    - draft: szkic
    - sent: wysłane
    - in_progress: w realizacji
    - pending_confirmation: oczekuje potwierdzenia
    - partially_confirmed: częściowo potwierdzone
    - confirmed: potwierdzone
    - rejected: odrzucone
    
  3. Bezpieczeństwo
    - Operacja bezpieczna, rozszerza istniejące wartości
*/

-- Najpierw usuń constraint jeśli istnieje
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
    'sent', 
    'in_progress',
    'pending_confirmation', 
    'partially_confirmed', 
    'confirmed', 
    'rejected'
  ));

-- Dodaj kolumnę dla daty rozpoczęcia realizacji jeśli nie istnieje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'in_progress_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN in_progress_at timestamptz;
  END IF;
END $$;
