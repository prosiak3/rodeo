/*
  # Add UI Theme Preference

  1. Changes
    - Add `ui_theme` column to users table
    - Supports 7 theme styles: glassmorphism, minimalist, colorful, corporate, dark-neon, material, fluent
    - Default theme is NULL (uses original HomeScreen)

  2. Security
    - Users can update their own theme preference
*/

-- Add ui_theme column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ui_theme text
CHECK (ui_theme IN ('glassmorphism', 'minimalist', 'colorful', 'corporate', 'dark-neon', 'material', 'fluent'))
DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_ui_theme ON users(ui_theme);

-- Create comment
COMMENT ON COLUMN users.ui_theme IS 'User preferred UI theme style. NULL = original default theme.';
