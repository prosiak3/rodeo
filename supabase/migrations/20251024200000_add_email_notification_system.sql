/*
  # System powiadomień email dla zamówień

  1. Nowe kolumny w tabeli system_settings
    - `wholesale_email` - główny adres email hurtowni do wysyłki zamówień

  2. Nowa tabela `email_notifications`
    - `id` (uuid, primary key)
    - `order_id` (uuid) - odniesienie do zamówienia
    - `recipient_email` (text) - adres odbiorcy
    - `subject` (text) - temat emaila
    - `status` (text) - 'pending', 'sent', 'failed'
    - `sent_at` (timestamptz) - kiedy wysłano
    - `error_message` (text) - komunikat błędu jeśli niepowodzenie
    - `retry_count` (integer) - liczba prób wysyłki
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  3. Security
    - Enable RLS na `email_notifications`
    - Polityki dla adminów i operatorów do przeglądania logów
    - Polityki dla Edge Function do zapisywania logów

  4. Important Notes
    - Wszystkie zamówienia wysyłane na jeden adres email hurtowni
    - Email wysyłany automatycznie gdy zamówienie zmienia status na 'sent'
    - Logi emaili dostępne dla administratorów i operatorów
*/

-- Dodaj kolumnę wholesale_email do system_settings jeśli nie istnieje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'wholesale_email'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN wholesale_email text;
    COMMENT ON COLUMN system_settings.wholesale_email IS
      'Email address of the wholesale warehouse for order notifications';
  END IF;
END $$;

-- Ustaw domyślny email hurtowni
UPDATE system_settings
SET wholesale_email = 'hurtownia@rodeo-system.pl'
WHERE id = 1 AND wholesale_email IS NULL;

-- Tabela email_notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_email_notifications_order_id ON email_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla email_notifications

-- Administratorzy i operatorzy mogą przeglądać wszystkie logi
CREATE POLICY "Admins and operators can view all email logs"
  ON email_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

-- Administratorzy mogą wstawiać logi (dla testów)
CREATE POLICY "Admins can insert email logs"
  ON email_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Administratorzy mogą aktualizować logi (ponowna wysyłka)
CREATE POLICY "Admins can update email logs"
  ON email_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Analitycy mogą przeglądać logi
CREATE POLICY "Analysts can view email logs"
  ON email_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

-- Service role (dla Edge Functions) może wszystko
CREATE POLICY "Service role full access"
  ON email_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Dodaj trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_email_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notifications_updated_at();

-- Dodaj komentarze do tabeli
COMMENT ON TABLE email_notifications IS 'Log of email notifications sent for orders';
COMMENT ON COLUMN email_notifications.order_id IS 'Reference to the order';
COMMENT ON COLUMN email_notifications.recipient_email IS 'Email address where notification was sent';
COMMENT ON COLUMN email_notifications.subject IS 'Email subject line';
COMMENT ON COLUMN email_notifications.status IS 'Status of email: pending, sent, or failed';
COMMENT ON COLUMN email_notifications.sent_at IS 'Timestamp when email was successfully sent';
COMMENT ON COLUMN email_notifications.error_message IS 'Error message if sending failed';
COMMENT ON COLUMN email_notifications.retry_count IS 'Number of retry attempts';
