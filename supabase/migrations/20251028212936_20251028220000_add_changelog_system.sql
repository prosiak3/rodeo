/*
  # Add Changelog System

  1. New Tables
    - `changelog_entries`
      - `id` (uuid, primary key)
      - `version` (text) - Version number (e.g., "1.2.0")
      - `title` (text) - Short title of change
      - `description` (text) - Detailed description
      - `category` (text) - Type: 'feature', 'improvement', 'bugfix', 'breaking'
      - `file_references` (text[]) - Array of file paths referenced
      - `release_date` (timestamptz) - When was this released
      - `order_index` (integer) - For ordering within same version
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `changelog_entries` table
    - All authenticated users can read
    - Only admins can create/update/delete
*/

-- Create changelog_entries table
CREATE TABLE IF NOT EXISTS changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('feature', 'improvement', 'bugfix', 'breaking', 'security')),
  file_references text[] DEFAULT '{}',
  release_date timestamptz DEFAULT now(),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_changelog_version ON changelog_entries(version);
CREATE INDEX IF NOT EXISTS idx_changelog_release_date ON changelog_entries(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_category ON changelog_entries(category);
CREATE INDEX IF NOT EXISTS idx_changelog_order ON changelog_entries(order_index);

-- RLS Policies
CREATE POLICY "Anyone can view changelog entries"
  ON changelog_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert changelog entries"
  ON changelog_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update changelog entries"
  ON changelog_entries
  FOR UPDATE
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

CREATE POLICY "Only admins can delete changelog entries"
  ON changelog_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add some sample changelog entries
INSERT INTO changelog_entries (version, title, description, category, file_references, release_date, order_index) VALUES
  (
    '1.5.0',
    'Zmiana nazwy "Szkic" na "Koszyk"',
    'Zmieniono nazwę statusu zamówienia ze "Szkic" na "Koszyk" w całej aplikacji dla lepszej intuicyjności.',
    'improvement',
    ARRAY['src/components/OrdersList.tsx:16', 'src/components/OrderDetails.tsx:553', 'src/components/ProfileScreen.tsx:885'],
    now() - interval '2 hours',
    1
  ),
  (
    '1.5.0',
    'Komunikat "Dodano do notatnika"',
    'Dodano opcję wyświetlania komunikatu toast po dodaniu produktu do notatnika. Można włączyć/wyłączyć w profilu użytkownika i ustawieniach globalnych.',
    'feature',
    ARRAY['src/components/PriceList.tsx:544', 'src/components/ProfileScreen.tsx:1270', 'src/components/SystemSettings.tsx:456'],
    now() - interval '1 hour',
    2
  ),
  (
    '1.4.0',
    'Service Worker - fix dla dev mode',
    'Naprawiono problem z dynamicznymi importami w trybie deweloperskim poprzez wyłączenie przechwytywania fetch w development.',
    'bugfix',
    ARRAY['public/sw.js:5-36'],
    now() - interval '3 hours',
    1
  ),
  (
    '1.3.0',
    'System Roadmap',
    'Dodano pełny system zarządzania roadmapą projektu z etapami, funkcjami i priorytetami.',
    'feature',
    ARRAY['src/components/RoadmapManager.tsx', 'supabase/migrations/20251028204451_add_roadmap_system.sql'],
    now() - interval '5 hours',
    1
  ),
  (
    '1.2.0',
    'Preferencje zależne od urządzenia',
    'Dodano możliwość zapisywania różnych preferencji dla desktop i mobile (rozmiar czcionki, tryb wyświetlania).',
    'feature',
    ARRAY['src/hooks/useDevicePreferences.tsx', 'src/components/ProfileScreen.tsx:54'],
    now() - interval '1 day',
    1
  );
