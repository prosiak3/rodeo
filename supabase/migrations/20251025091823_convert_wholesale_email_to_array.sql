/*
  # Zmiana pojedynczego adresu email hurtowni na tablicę adresów

  ## Zmiany
  
  1. Modyfikacje w tabeli `system_settings`
    - Usuwa kolumnę `wholesale_email` (text)
    - Dodaje kolumnę `wholesale_emails` (text[]) - tablica adresów email
    - Przenosi istniejący adres email do nowej tablicy
  
  ## Uwagi
  - Umożliwia wysyłanie zamówień na wiele adresów email hurtowni
  - Zachowuje istniejące dane (przenosi pojedynczy email do tablicy)
  - Format: ['email1@example.com', 'email2@example.com']
*/

-- Dodaj nową kolumnę jako tablicę tekstów
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS wholesale_emails text[] DEFAULT '{}';

-- Przenieś istniejący email do nowej tablicy (jeśli istnieje)
DO $$
BEGIN
  -- Zaktualizuj rekordy, gdzie wholesale_email nie jest pusty
  UPDATE system_settings
  SET wholesale_emails = ARRAY[wholesale_email]
  WHERE wholesale_email IS NOT NULL AND wholesale_email != '';
END $$;

-- Usuń starą kolumnę
ALTER TABLE system_settings 
DROP COLUMN IF EXISTS wholesale_email;

-- Dodaj komentarz do kolumny
COMMENT ON COLUMN system_settings.wholesale_emails IS 'Lista domyślnych adresów email hurtowni, na które będą wysyłane zamówienia';