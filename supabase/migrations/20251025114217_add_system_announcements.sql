/*
  # System Announcements and User Notifications

  1. New Tables
    - `system_announcements`
      - `id` (uuid, primary key)
      - `title` (text) - Short title of the announcement
      - `message` (text) - Detailed message content
      - `announcement_type` (text) - Type: 'feature', 'update', 'bugfix', 'warning', 'info'
      - `target_roles` (text[]) - Array of roles that should see this (null = all users)
      - `priority` (text) - Priority level: 'low', 'medium', 'high', 'critical'
      - `created_at` (timestamptz) - When announcement was created
      - `created_by` (uuid) - Admin who created the announcement
      - `active_from` (timestamptz) - When to start showing this announcement
      - `active_until` (timestamptz) - When to stop showing (null = indefinite)
      - `is_active` (boolean) - Whether announcement is currently active

    - `user_announcement_views`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User who viewed the announcement
      - `announcement_id` (uuid) - The announcement that was viewed
      - `viewed_at` (timestamptz) - When user dismissed/acknowledged it
      - `device_id` (text) - Optional device identifier for multi-device tracking

  2. Security
    - Enable RLS on both tables
    - Admins can create/edit announcements
    - All authenticated users can read active announcements
    - Users can only mark their own announcements as viewed

  3. Indexes
    - Index on `active_from` and `active_until` for efficient querying
    - Index on `user_id` and `announcement_id` for quick lookup
*/

-- Create system_announcements table
CREATE TABLE IF NOT EXISTS system_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'info' CHECK (announcement_type IN ('feature', 'update', 'bugfix', 'warning', 'info', 'maintenance')),
  target_roles text[] DEFAULT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  active_from timestamptz DEFAULT now(),
  active_until timestamptz DEFAULT NULL,
  is_active boolean DEFAULT true
);

-- Create user_announcement_views table
CREATE TABLE IF NOT EXISTS user_announcement_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES system_announcements(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  device_id text DEFAULT NULL,
  UNIQUE(user_id, announcement_id, device_id)
);

-- Enable RLS
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_announcements

-- Admins can do everything
CREATE POLICY "Admins can manage announcements"
  ON system_announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- All authenticated users can read active announcements
CREATE POLICY "Users can view active announcements"
  ON system_announcements
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND active_from <= now()
    AND (active_until IS NULL OR active_until >= now())
    AND (
      target_roles IS NULL
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = ANY(target_roles)
      )
    )
  );

-- RLS Policies for user_announcement_views

-- Users can insert their own views
CREATE POLICY "Users can mark announcements as viewed"
  ON user_announcement_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own views
CREATE POLICY "Users can view their own announcement history"
  ON user_announcement_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all announcement views for analytics
CREATE POLICY "Admins can view all announcement views"
  ON user_announcement_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_active_dates 
  ON system_announcements(active_from, active_until) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_announcements_created_at 
  ON system_announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_views_user_announcement 
  ON user_announcement_views(user_id, announcement_id);

CREATE INDEX IF NOT EXISTS idx_user_views_announcement 
  ON user_announcement_views(announcement_id);

-- Add some sample announcements
INSERT INTO system_announcements (title, message, announcement_type, priority, target_roles, created_by)
VALUES 
  (
    'Nowa funkcja: Automatyczne odświeżanie sesji',
    'Panel sesji teraz automatycznie odświeża dane co 15 sekund. Nie musisz już ręcznie przeładowywać strony!',
    'feature',
    'medium',
    ARRAY['admin', 'analyst'],
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
  ),
  (
    'Ulepszona kompaktowa wersja emaili',
    'Nagłówki w emailach zamówień zostały zmniejszone do 1/3 rozmiaru dla lepszej czytelności.',
    'update',
    'low',
    NULL,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
  ),
  (
    'System powiadomień o zmianach',
    'Od teraz będziesz otrzymywać powiadomienia o ważnych zmianach w systemie po zalogowaniu. To pierwsza wersja tej funkcji!',
    'feature',
    'high',
    NULL,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
  );
