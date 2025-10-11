/*
  # Add order filters preference to users

  1. Changes
    - Add `show_all_order_filters` column to `users` table
      - Boolean field (default: false)
      - Controls whether store managers see all order status filters or just draft/sent
      - When false: only "Szkice" and "Wysłane" filters are shown
      - When true: all order status filters are available
  
  2. Notes
    - This setting is particularly useful for store managers who want to see all order statuses
    - Default is false to keep the simplified interface for most users
    - Setting can be toggled in the Profile screen
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'show_all_order_filters'
  ) THEN
    ALTER TABLE users ADD COLUMN show_all_order_filters boolean DEFAULT false NOT NULL;
  END IF;
END $$;