/*
  # Dodanie wielu adresów email dla sklepów

  ## Zmiany
  
  1. Nowe kolumny w tabeli `stores`
    - `email_addresses` (text[]) - tablica adresów email dla hurtowni
    - Sklep może mieć wiele adresów email, na które będą wysyłane zamówienia
  
  2. Walidacja
    - Każdy adres email w tablicy musi być poprawny
    - Tablica może być pusta (null lub [])
  
  ## Uwagi
  - Umożliwia wysyłanie zamówień na wiele adresów jednocześnie
  - Istniejące sklepy dostaną pustą tablicę
  - Format: ['email1@example.com', 'email2@example.com', 'email3@example.com']
*/

-- Dodaj kolumnę email_addresses jako tablicę tekstów
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS email_addresses text[] DEFAULT '{}';

-- Dodaj komentarz do kolumny
COMMENT ON COLUMN stores.email_addresses IS 'Lista adresów email, na które będą wysyłane zamówienia z tego sklepu';

-- Utwórz indeks GIN dla szybkiego wyszukiwania po emailach
CREATE INDEX IF NOT EXISTS idx_stores_email_addresses ON stores USING GIN(email_addresses);

-- Funkcja walidująca adresy email
CREATE OR REPLACE FUNCTION validate_email_array()
RETURNS trigger AS $$
BEGIN
  -- Sprawdź czy każdy email w tablicy jest poprawny
  IF NEW.email_addresses IS NOT NULL THEN
    PERFORM email 
    FROM unnest(NEW.email_addresses) AS email
    WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    IF FOUND THEN
      RAISE EXCEPTION 'Jeden lub więcej adresów email jest niepoprawnych';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger walidujący przed zapisem
DROP TRIGGER IF EXISTS validate_stores_email_trigger ON stores;
CREATE TRIGGER validate_stores_email_trigger
  BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION validate_email_array();