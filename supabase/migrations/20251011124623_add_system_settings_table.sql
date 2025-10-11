/*
  # Add System Settings Table

  ## Overview
  Creates a table for storing global system settings that administrators can modify.
  These settings serve as defaults for new users and can be applied to existing users.

  ## Changes Made

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `default_order_mode` (text) - Default ordering mode ('quantity' or 'list')
      - `default_show_all_filters` (boolean) - Default filter view for store managers
      - `default_allow_collaboration` (boolean) - Default collaboration setting
      - `created_at` (timestamptz) - When settings were created
      - `updated_at` (timestamptz) - When settings were last updated

  2. Security
    - Enable RLS on `system_settings` table
    - Only admin users can read settings
    - Only admin users can update settings
    - Settings can be read by authenticated users for reference

  ## Important Notes
  - Only one row should exist in this table (singleton pattern)
  - Administrators can modify these settings via the admin panel
  - These settings define defaults for new user accounts
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_order_mode text DEFAULT 'quantity' CHECK (default_order_mode IN ('quantity', 'list')),
  default_show_all_filters boolean DEFAULT false,
  default_allow_collaboration boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read settings
CREATE POLICY "Authenticated users can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert settings
CREATE POLICY "Only admins can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update settings
CREATE POLICY "Only admins can update system settings"
  ON system_settings FOR UPDATE
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

-- Insert default settings
INSERT INTO system_settings (default_order_mode, default_show_all_filters, default_allow_collaboration)
VALUES ('quantity', false, true)
ON CONFLICT (id) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();