/*
  # Add 'uzupełnione' order status

  1. Changes
    - Add 'uzupełnione' as a new valid order status in the check constraint
    - This status represents completed/fulfilled orders
    - Orders with this status cannot be deleted (only draft and notatnik can be deleted)

  2. Security
    - Existing RLS policies will apply
    - Delete policies remain unchanged - only draft and notatnik orders can be deleted
*/

-- Drop existing status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with 'uzupełnione' status included
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY[
    'draft'::text, 
    'notatnik'::text, 
    'sent'::text, 
    'in_progress'::text, 
    'pending_confirmation'::text, 
    'partially_confirmed'::text, 
    'confirmed'::text, 
    'rejected'::text, 
    'uzupełnione'::text
  ]));