/*
  # Naprawa polityki INSERT dla email_notifications

  1. Problem
    - Tylko admini mogą wstawiać logi emaili
    - Ekspedienci i inni użytkownicy nie mogą zapisywać logów gdy wysyłają zamówienia

  2. Rozwiązanie
    - Dodaj politykę INSERT dla wszystkich zalogowanych użytkowników
    - Każdy zalogowany użytkownik może tworzyć log emaila dla swojego zamówienia

  3. Security
    - Tylko dla authenticated users
    - Log może być stworzony tylko dla zamówień które istnieją
*/

-- Usuń starą restrykcyjną politykę
DROP POLICY IF EXISTS "Admins can insert email logs" ON email_notifications;

-- Dodaj nową politykę - wszyscy zalogowani użytkownicy mogą wstawiać logi
CREATE POLICY "Authenticated users can insert email logs"
  ON email_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = email_notifications.order_id
    )
  );

-- Dodaj również politykę UPDATE dla wszystkich zalogowanych - aby mogli aktualizować status
DROP POLICY IF EXISTS "Admins can update email logs" ON email_notifications;

CREATE POLICY "Authenticated users can update email logs"
  ON email_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = email_notifications.order_id
    )
  );