/*
  # Naprawa błędów w systemie emaili i cennikach
  
  1. Problemy
    - Brak kolumny 'active' w price_list_assignments
    - Polityka INSERT dla email_notifications zwraca 403
    - Kod próbuje użyć id=1 zamiast UUID w system_settings
  
  2. Rozwiązania
    - Dodanie kolumny 'active' do price_list_assignments
    - Naprawa polityk RLS dla email_notifications
    - Zapewnienie że system_settings ma prosty dostęp
*/

-- ============================================================
-- 1. Dodanie kolumny 'active' do price_list_assignments
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_list_assignments' 
    AND column_name = 'active'
  ) THEN
    ALTER TABLE price_list_assignments 
    ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Ustaw wszystkie istniejące przypisania jako aktywne
UPDATE price_list_assignments SET active = true WHERE active IS NULL;

-- ============================================================
-- 2. Naprawa polityk dla email_notifications
-- ============================================================

-- Usuń starą politykę INSERT
DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON email_notifications;

-- Nowa polityka - wszyscy zalogowani mogą dodawać logi emaili
CREATE POLICY "Authenticated users can insert email notifications"
  ON email_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Upewnij się że polityka SELECT działa
DROP POLICY IF EXISTS "Authenticated users can view their email logs" ON email_notifications;

CREATE POLICY "Users can view email notifications"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 3. Zapewnienie dostępu do system_settings
-- ============================================================

-- Upewnij się że jest jeden rekord ustawień systemowych
INSERT INTO system_settings (id, wholesale_emails)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  ARRAY['hurtownia@example.com']
)
ON CONFLICT (id) DO NOTHING;

-- Polityka SELECT dla wszystkich zalogowanych
DROP POLICY IF EXISTS "Anyone can read system settings" ON system_settings;

CREATE POLICY "Anyone can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);