/*
  # Dodanie wsparcia dla Dark Mode

  1. Zmiany w tabeli users
    - Dodanie kolumny `color_mode` (light/dark/auto)
    - Domyślna wartość: 'light'

  2. Funkcjonalność
    - Użytkownicy mogą wybrać jasny, ciemny lub automatyczny tryb
    - 'auto' używa prefers-color-scheme z systemu
    - Zapisywane w profilu użytkownika
*/

-- Dodaj kolumnę color_mode do tabeli users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'color_mode'
  ) THEN
    ALTER TABLE users
    ADD COLUMN color_mode text DEFAULT 'light' CHECK (color_mode IN ('light', 'dark', 'auto'));
  END IF;
END $$;

-- Dodaj komentarz
COMMENT ON COLUMN users.color_mode IS 'Color mode preference: light, dark, or auto (follows system)';
