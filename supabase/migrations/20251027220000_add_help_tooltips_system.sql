/*
  # Help Tooltips System

  1. New Tables
    - `help_content`
      - `id` (uuid, primary key)
      - `tooltip_id` (text, unique) - Unique identifier for the tooltip
      - `title` (text, nullable) - Optional title for the tooltip
      - `content` (text) - The help content to display
      - `component_name` (text) - Component where tooltip is used
      - `category` (text) - Category for grouping (e.g., 'orders', 'products', 'settings')
      - `is_active` (boolean) - Whether tooltip is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `help_tooltip_views`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `tooltip_id` (text) - References tooltip_id in help_content
      - `view_count` (integer) - Number of times viewed
      - `first_viewed_at` (timestamptz)
      - `last_viewed_at` (timestamptz)

  2. User Preferences
    - Add `show_help_tooltips` (boolean, default true) to users table

  3. Security
    - Enable RLS on both tables
    - Admins can manage help_content
    - All authenticated users can read active help_content
    - Users can only view/update their own help_tooltip_views
    - Analysts can read all help_tooltip_views for analytics

  4. Indexes
    - Index on help_content.tooltip_id for fast lookups
    - Index on help_content.component_name for filtering
    - Composite index on help_tooltip_views(user_id, tooltip_id) for tracking
*/

-- Add show_help_tooltips preference to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_help_tooltips'
  ) THEN
    ALTER TABLE users ADD COLUMN show_help_tooltips boolean DEFAULT true;
  END IF;
END $$;

-- Create help_content table
CREATE TABLE IF NOT EXISTS help_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tooltip_id text UNIQUE NOT NULL,
  title text,
  content text NOT NULL,
  component_name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create help_tooltip_views table
CREATE TABLE IF NOT EXISTS help_tooltip_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tooltip_id text NOT NULL,
  view_count integer DEFAULT 1,
  first_viewed_at timestamptz DEFAULT now(),
  last_viewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tooltip_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_help_content_tooltip_id ON help_content(tooltip_id);
CREATE INDEX IF NOT EXISTS idx_help_content_component_name ON help_content(component_name);
CREATE INDEX IF NOT EXISTS idx_help_content_category ON help_content(category);
CREATE INDEX IF NOT EXISTS idx_help_content_is_active ON help_content(is_active);
CREATE INDEX IF NOT EXISTS idx_help_tooltip_views_user_id ON help_tooltip_views(user_id);
CREATE INDEX IF NOT EXISTS idx_help_tooltip_views_tooltip_id ON help_tooltip_views(tooltip_id);
CREATE INDEX IF NOT EXISTS idx_help_tooltip_views_composite ON help_tooltip_views(user_id, tooltip_id);

-- Enable RLS
ALTER TABLE help_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_tooltip_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_content

-- Admins can do everything
CREATE POLICY "Admins can manage help content"
  ON help_content
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

-- All authenticated users can read active help content
CREATE POLICY "Users can read active help content"
  ON help_content
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for help_tooltip_views

-- Users can view their own tooltip views
CREATE POLICY "Users can view own tooltip views"
  ON help_tooltip_views
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own tooltip views
CREATE POLICY "Users can insert own tooltip views"
  ON help_tooltip_views
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own tooltip views
CREATE POLICY "Users can update own tooltip views"
  ON help_tooltip_views
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Analysts can read all tooltip views for analytics
CREATE POLICY "Analysts can read all tooltip views"
  ON help_tooltip_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

-- Insert sample help content
INSERT INTO help_content (tooltip_id, title, content, component_name, category) VALUES
  ('voice-order-mic-button', 'Zamówienie głosowe', 'Naciśnij przycisk mikrofonu i dyktuj produkty, które chcesz zamówić. System automatycznie rozpozna nazwy produktów i ilości.', 'VoiceOrderScreen', 'orders'),
  ('voice-order-ai-toggle', 'Rozpoznawanie AI', 'Włączenie AI poprawia dokładność rozpoznawania produktów, ale wymaga pobrania modelu przy pierwszym użyciu (ok. 50MB).', 'VoiceOrderScreen', 'orders'),
  ('promo-10-plus-1', 'Promocja 10+1', 'Kup 10 kg produktu, a otrzymasz 11 kg! System automatycznie doliczy bonus przy zamówieniu 10 kg lub wielokrotności. Płacisz za 10 kg + 0,01 zł.', 'PromotionsOverview', 'promotions'),
  ('pricelist-swipe', 'Swipe dla szybkiego dodawania', 'Przesuń produkt w prawo, aby szybko dodać go do notatnika. Przesuń w lewo, aby zobaczyć więcej opcji.', 'PriceList', 'products'),
  ('order-status-draft', 'Status: Szkic', 'Zamówienie w trybie roboczym. Możesz je edytować i wysłać później.', 'OrderDetails', 'orders'),
  ('order-status-pending', 'Status: Oczekuje', 'Zamówienie wysłane i oczekuje na realizację przez hurtownię.', 'OrderDetails', 'orders'),
  ('order-status-completed', 'Status: Zrealizowane', 'Zamówienie zostało zrealizowane i dostarczone.', 'OrderDetails', 'orders'),
  ('notebook-mode', 'Tryb notatnika', 'Wybierz "jeden notatnik" aby pracować na jednym wspólnym notatniku, lub "wiele notatników" aby tworzyć osobne notatniki dla różnych zamówień.', 'ProfileScreen', 'settings'),
  ('auto-order-analysis', 'Automatyczne zamówienie', 'System analizuje Twoje poprzednie zamówienia i sugeruje produkty do zamówienia na podstawie historii zakupów z wybranego okresu.', 'AutoOrderScreen', 'orders'),
  ('price-layout-toggle', 'Układ cennika', 'Przełączaj między układem poziomym (kompaktowym) a pionowym (pełnym) wyświetlania produktów.', 'PriceList', 'products')
ON CONFLICT (tooltip_id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_help_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_help_content_updated_at_trigger ON help_content;
CREATE TRIGGER update_help_content_updated_at_trigger
  BEFORE UPDATE ON help_content
  FOR EACH ROW
  EXECUTE FUNCTION update_help_content_updated_at();
