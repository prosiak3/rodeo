/*
  # Add interaction type tracking to user sessions

  1. Changes to user_sessions table
    - Add `interaction_type` column (touch/mouse/mixed)
    - This tracks how user interacts with the application
  
  2. Notes
    - Existing sessions will have NULL interaction_type
    - New sessions will track interaction type from first interaction
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'interaction_type'
  ) THEN
    ALTER TABLE user_sessions 
    ADD COLUMN interaction_type text CHECK (interaction_type IN ('touch', 'mouse', 'mixed'));
  END IF;
END $$;

COMMENT ON COLUMN user_sessions.interaction_type IS 'Type of interaction: touch, mouse, or mixed';