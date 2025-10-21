/*
  # Add Font Size Preference to Users

  1. Changes
    - Add `font_size_preference` column to users table
      - Type: text with check constraint for valid values
      - Valid values: 'small', 'medium', 'large', 'extra-large'
      - Default: 'medium'
      - Not null
    
  2. Security
    - No RLS changes needed - users table already has proper policies
    - Users can update their own font size preference through existing policies
    
  3. Notes
    - Uses DO block to check if column exists before adding
    - Safe to run multiple times (idempotent)
    - Existing users will automatically get 'medium' as default
*/

-- Add font_size_preference column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'font_size_preference'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN font_size_preference text DEFAULT 'medium' NOT NULL
    CHECK (font_size_preference IN ('small', 'medium', 'large', 'extra-large'));
    
    -- Add comment for documentation
    COMMENT ON COLUMN users.font_size_preference IS 
      'User interface font size preference: small (14px), medium (16px), large (18px), extra-large (20px)';
  END IF;
END $$;