/*
  # Add After Order Sent Behavior Setting

  ## Overview
  Adds a new system setting to control what happens after a user sends an order.
  This allows administrators to configure whether users should be redirected to
  the "Sent Orders" tab, stay in order details, or go back to drafts.

  ## Changes Made

  1. System Settings Table Extension
    - Add `after_order_sent_behavior` column to `system_settings` table
    - Possible values: 'go_to_sent', 'stay_in_details', 'go_to_drafts'
    - Default value: 'go_to_sent' (redirect to sent orders tab)

  2. Security
    - No RLS changes needed (system_settings already has proper RLS)
    - Only admins can modify this setting via the admin panel

  ## Important Notes
  - This setting controls the default behavior for all users
  - Improves UX by ensuring users always see the correct orders after sending
  - Administrators can customize this based on their workflow preferences
*/

-- Add after_order_sent_behavior column to system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'after_order_sent_behavior'
  ) THEN
    ALTER TABLE system_settings
    ADD COLUMN after_order_sent_behavior TEXT
    DEFAULT 'go_to_sent'
    CHECK (after_order_sent_behavior IN ('go_to_sent', 'stay_in_details', 'go_to_drafts'));
  END IF;
END $$;

-- Update existing row with default value if it exists
UPDATE system_settings
SET after_order_sent_behavior = 'go_to_sent'
WHERE after_order_sent_behavior IS NULL;
