/*
  # Add Profile Pictures for Users

  ## Overview
  Adds profile picture support for all users in the system.
  Users can upload their own profile pictures or use default avatars.

  ## Changes Made

  1. Schema Changes
    - Add `profile_picture_url` column to `users` table
      - Stores URL to user's profile picture
      - Can be external URL or relative path to uploaded image
      - Nullable (users without pictures will show default avatar)

  2. Security
    - No RLS changes needed (profile pictures are part of users table)
    - Pictures are publicly accessible via URL

  ## Important Notes
  - Profile pictures should be optimized before upload (max 500KB recommended)
  - Supported formats: JPG, PNG, WebP
  - For production, consider using Supabase Storage for image hosting
*/

-- Add profile_picture_url column to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- Update existing users with default profile pictures from UI Avatars API
-- This generates avatar images with user initials
UPDATE users 
SET profile_picture_url = 'https://ui-avatars.com/api/?name=' || 
  COALESCE(
    REPLACE(full_name, ' ', '+'),
    SPLIT_PART(email, '@', 1)
  ) || '&size=200&background=f59e0b&color=fff&bold=true'
WHERE profile_picture_url IS NULL;
