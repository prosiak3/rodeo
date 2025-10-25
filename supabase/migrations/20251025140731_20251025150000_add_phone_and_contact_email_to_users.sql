/*
  # Add phone and contact email to users

  1. Changes
    - Adds phone column to users table (optional text field)
    - Adds contact_email column to users table (optional, different from login email)
    - These fields are for contact information in orders and emails
  
  2. Purpose
    - Allows users to provide contact phone number
    - Allows users to set a different email for order notifications
    - Used in order emails to show who sent the order
  
  3. Notes
    - Both fields are optional (NULL allowed)
    - contact_email can be different from the login email
    - No validation constraints on format (flexibility)
*/

-- Add phone number column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone text;

-- Add contact email column (can be different from auth email)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS contact_email text;

-- Add comments for documentation
COMMENT ON COLUMN users.phone IS 'User contact phone number for orders and notifications';
COMMENT ON COLUMN users.contact_email IS 'Contact email for orders (can differ from auth email)';
