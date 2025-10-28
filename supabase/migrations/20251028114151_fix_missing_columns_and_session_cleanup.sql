/*
  # Naprawa brakujących kolumn i funkcji

  1. Dodanie brakujących kolumn
    - `color_mode` do tabeli `users` (light/dark/auto mode)
    - `session_timeout_minutes` do tabeli `system_settings`

  2. Naprawa funkcji `close_inactive_sessions`
    - Usunięcie wywołania przez RPC z parametrem "system"
    - Funkcja działa bez parametrów
*/

-- 1. Dodaj kolumnę color_mode do users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'color_mode'
  ) THEN
    ALTER TABLE users
    ADD COLUMN color_mode text DEFAULT 'light'
    CHECK (color_mode IN ('light', 'dark', 'auto'));
  END IF;
END $$;

COMMENT ON COLUMN users.color_mode IS
'Tryb kolorów interfejsu: light (jasny), dark (ciemny), auto (automatyczny na podstawie preferencji systemowych)';

-- 2. Dodaj kolumnę session_timeout_minutes do system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'session_timeout_minutes'
  ) THEN
    ALTER TABLE system_settings
    ADD COLUMN session_timeout_minutes integer DEFAULT 720;
  END IF;
END $$;

COMMENT ON COLUMN system_settings.session_timeout_minutes IS
'Maksymalny czas trwania sesji w minutach (domyślnie 720 = 12 godzin)';

-- 3. Zaktualizuj istniejący rekord system_settings (jeśli istnieje)
UPDATE system_settings 
SET session_timeout_minutes = 720
WHERE session_timeout_minutes IS NULL;