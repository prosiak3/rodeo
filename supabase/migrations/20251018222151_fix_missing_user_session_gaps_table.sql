/*
  # Create missing user_session_gaps table

  1. New Tables
    - `user_session_gaps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `previous_session_id` (uuid, references user_sessions)
      - `previous_session_end` (timestamptz)
      - `next_session_id` (uuid, references user_sessions)
      - `next_session_start` (timestamptz)
      - `gap_duration_minutes` (integer)
      - `was_auto_logout` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_session_gaps` table
    - Add policies for users to view own gaps
    - Add policies for analysts and admins to view all gaps

  3. Indexes
    - Index on user_id for fast lookups
    - Index on next_session_start for date filtering
*/

CREATE TABLE IF NOT EXISTS user_session_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  previous_session_end TIMESTAMPTZ NOT NULL,
  next_session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  next_session_start TIMESTAMPTZ NOT NULL,
  gap_duration_minutes INTEGER NOT NULL,
  was_auto_logout BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_gaps_user_id ON user_session_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_session_gaps_date ON user_session_gaps(next_session_start DESC);

ALTER TABLE user_session_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session gaps"
  ON user_session_gaps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all session gaps"
  ON user_session_gaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('analyst', 'admin')
    )
  );

CREATE POLICY "Users can insert own session gaps"
  ON user_session_gaps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
