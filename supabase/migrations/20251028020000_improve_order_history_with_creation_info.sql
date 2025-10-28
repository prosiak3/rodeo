/*
  # Improve Order History with Creation Information

  ## Overview
  Extends the order history system to track order creation with detailed source information.
  Fixes the display of history entries to show who performed actions and how orders were created.

  ## Changes Made

  1. Extend source_type Values
    - Add 'auto' to source_type enum for auto-generated orders
    - Existing values: 'price_list', 'manual', 'voice', 'copy'
    - New value: 'auto'

  2. Order History Enhancement
    - History will now include 'order_created' action with details about source_type
    - This provides better tracking of order origins
    - Helps users understand how each order was created

  ## Important Notes
  - This migration updates the CHECK constraint on source_type
  - Existing orders are not affected
  - New orders should always log creation to order_history
*/

-- Drop the old CHECK constraint and add a new one with 'auto'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_type_check;

  -- Add new constraint with all values including 'auto'
  ALTER TABLE orders ADD CONSTRAINT orders_source_type_check
    CHECK (source_type IN ('price_list', 'manual', 'voice', 'copy', 'auto'));
END $$;

-- Create a helper function to get user-friendly source type labels
CREATE OR REPLACE FUNCTION get_source_type_label(source_type text)
RETURNS text AS $$
BEGIN
  RETURN CASE source_type
    WHEN 'price_list' THEN 'Z cennika'
    WHEN 'manual' THEN 'Ręcznie'
    WHEN 'voice' THEN 'Głosowo'
    WHEN 'copy' THEN 'Kopiowanie'
    WHEN 'auto' THEN 'Auto-zamówienie'
    ELSE source_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a helper function to get user-friendly action labels
CREATE OR REPLACE FUNCTION get_action_label(action text)
RETURNS text AS $$
BEGIN
  RETURN CASE action
    WHEN 'order_created' THEN 'Utworzono zamówienie'
    WHEN 'converted_to_draft' THEN 'Przekształcono notatnik na szkic'
    WHEN 'sent' THEN 'Wysłano do hurtowni'
    WHEN 'confirmed' THEN 'Potwierdzono całkowicie'
    WHEN 'partially_confirmed' THEN 'Potwierdzono częściowo'
    WHEN 'rejected' THEN 'Odrzucono'
    WHEN 'modified_draft' THEN 'Zmodyfikowano szkic'
    WHEN 'item_added' THEN 'Dodano produkt'
    WHEN 'item_removed' THEN 'Usunięto produkt'
    WHEN 'quantity_updated' THEN 'Zaktualizowano ilość'
    ELSE action
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
