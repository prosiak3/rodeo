/*
  # Add show notebook toast message preference

  1. Changes to `users` table
    - Add `show_notebook_toast` boolean column (default: true)
    - Controls whether to show "Dodano do notatnika" message when adding products

  2. Changes to `system_settings` table
    - Add `show_notebook_toast_default` boolean setting
    - Controls the global default for new users

  3. Security
    - No RLS changes needed (existing policies cover new columns)
*/

-- Add preference to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_notebook_toast'
  ) THEN
    ALTER TABLE users ADD COLUMN show_notebook_toast boolean DEFAULT true;
  END IF;
END $$;

-- Add global default setting
INSERT INTO system_settings (key, value, description, category)
VALUES (
  'show_notebook_toast_default',
  'true',
  'Domyślne ustawienie wyświetlania komunikatu "Dodano do notatnika" dla nowych użytkowników',
  'ui'
)
ON CONFLICT (key) DO NOTHING;

-- Update existing users to have the default value
UPDATE users
SET show_notebook_toast = true
WHERE show_notebook_toast IS NULL;
