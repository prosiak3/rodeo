/*
  # Remove 'uzupełnione' order status

  1. Changes
    - Remove 'uzupełnione' from the status check constraint
    - Return to previous valid statuses only

  2. Security
    - Existing RLS policies will continue to apply
*/

-- Drop existing status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add constraint without 'uzupełnione' status
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY[
    'draft'::text, 
    'notatnik'::text, 
    'sent'::text, 
    'in_progress'::text, 
    'pending_confirmation'::text, 
    'partially_confirmed'::text, 
    'confirmed'::text, 
    'rejected'::text
  ]));