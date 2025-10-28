/*
  # Add voice input preference for edit draft screen

  1. Changes
    - Add `show_voice_in_edit_draft` column to users table
    - Default value is true (current behavior)
    - Allows users to hide the voice input section in the edit draft order screen

  2. Notes
    - This gives users control over UI complexity in the edit draft screen
    - When disabled, the "Dodaj głosem" section will be hidden
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_voice_in_edit_draft'
  ) THEN
    ALTER TABLE users ADD COLUMN show_voice_in_edit_draft boolean DEFAULT true;
  END IF;
END $$;