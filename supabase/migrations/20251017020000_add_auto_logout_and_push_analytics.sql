/*
  # Auto-Logout System and Push Notifications Analytics

  1. User Location Tracking
    - Add `after_auto_logout_return_to` enum field to users table
    - Add `last_app_location` JSONB field to store navigation state
    - Add `last_location_timestamp` timestamp field
    - Add `auto_logout_enabled` boolean field (default true)

  2. Push Subscriptions Management
    - Create `push_subscriptions` table
    - Fields: user_id, subscription_data, device_info, browser_info, is_active
    - Track when subscription was created and last used

  3. Push Notifications Tracking
    - Create `push_notifications_sent` table
    - Track all sent notifications with metadata
    - Store notification type, content, target user, and context

  4. Push Interaction Analytics
    - Create `push_notification_interactions` table
    - Track: delivered, clicked, dismissed, closed events
    - Calculate time-to-action metrics
    - Link to sessions if user was logged in

  5. Session Gap Analytics
    - Create `user_session_gaps` table
    - Track time between user sessions
    - Calculate engagement patterns

  6. Orders Enhancement
    - Add `auto_saved` boolean to orders table
    - Mark orders automatically saved before logout

  7. Security
    - Enable RLS on all new tables
    - Appropriate policies for each user role
    - Analytics readable by analysts and admins
*/

-- Add auto-logout fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'after_auto_logout_return_to'
  ) THEN
    ALTER TABLE users ADD COLUMN after_auto_logout_return_to TEXT DEFAULT 'last_location'
      CHECK (after_auto_logout_return_to IN ('last_location', 'orders', 'prices', 'home'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_app_location'
  ) THEN
    ALTER TABLE users ADD COLUMN last_app_location JSONB DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_location_timestamp'
  ) THEN
    ALTER TABLE users ADD COLUMN last_location_timestamp TIMESTAMPTZ DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auto_logout_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN auto_logout_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add auto_saved field to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'auto_saved'
  ) THEN
    ALTER TABLE orders ADD COLUMN auto_saved BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  device_info TEXT,
  browser_info TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subscription_data)
);

-- Create push_notifications_sent table
CREATE TABLE IF NOT EXISTS push_notifications_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  notification_template_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_url TEXT,
  icon_url TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create push_notification_interactions table
CREATE TABLE IF NOT EXISTS push_notification_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES push_notifications_sent(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('delivered', 'clicked', 'dismissed', 'closed')),
  device_info TEXT,
  browser_info TEXT,
  was_logged_in BOOLEAN DEFAULT false,
  time_to_action_seconds INTEGER,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create user_session_gaps table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_user_id ON push_notifications_sent(target_user_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_type ON push_notifications_sent(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_notifications_sent_date ON push_notifications_sent(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_interactions_notification_id ON push_notification_interactions(notification_id);
CREATE INDEX IF NOT EXISTS idx_push_interactions_user_id ON push_notification_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_interactions_action ON push_notification_interactions(action_type);
CREATE INDEX IF NOT EXISTS idx_push_interactions_date ON push_notification_interactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_session_gaps_user_id ON user_session_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_session_gaps_date ON user_session_gaps(next_session_start DESC);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_gaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

-- RLS Policies for push_notifications_sent

CREATE POLICY "Users can view own notifications"
  ON push_notifications_sent FOR SELECT
  TO authenticated
  USING (auth.uid() = target_user_id);

CREATE POLICY "Admins and operators can insert notifications"
  ON push_notifications_sent FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator', 'salesperson')
    )
  );

CREATE POLICY "Admins and analysts can view all notifications"
  ON push_notifications_sent FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst', 'operator')
    )
  );

-- RLS Policies for push_notification_interactions

CREATE POLICY "Users can insert own interactions"
  ON push_notification_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own interactions"
  ON push_notification_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all interactions"
  ON push_notification_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

-- RLS Policies for user_session_gaps

CREATE POLICY "Users can view own session gaps"
  ON user_session_gaps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert session gaps"
  ON user_session_gaps FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Analysts can view all session gaps"
  ON user_session_gaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

-- Create view for push notification analytics
CREATE OR REPLACE VIEW push_notification_stats AS
SELECT
  pns.id,
  pns.notification_type,
  pns.notification_template_id,
  pns.title,
  pns.body,
  pns.priority,
  pns.sent_at,
  pns.target_user_id,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'delivered' THEN pni.id END) as delivered_count,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'clicked' THEN pni.id END) as clicked_count,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'dismissed' THEN pni.id END) as dismissed_count,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'closed' THEN pni.id END) as closed_count,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT CASE WHEN pni.action_type = 'delivered' THEN pni.id END) > 0
      THEN (COUNT(DISTINCT CASE WHEN pni.action_type = 'clicked' THEN pni.id END)::NUMERIC /
            COUNT(DISTINCT CASE WHEN pni.action_type = 'delivered' THEN pni.id END)::NUMERIC) * 100
      ELSE 0
    END, 2
  ) as ctr_percentage,
  AVG(CASE WHEN pni.action_type = 'clicked' THEN pni.time_to_action_seconds END) as avg_time_to_click_seconds
FROM push_notifications_sent pns
LEFT JOIN push_notification_interactions pni ON pns.id = pni.notification_id
GROUP BY pns.id, pns.notification_type, pns.notification_template_id, pns.title, pns.body, pns.priority, pns.sent_at, pns.target_user_id;

-- Create view for push notification type performance
CREATE OR REPLACE VIEW push_notification_type_stats AS
SELECT
  notification_type,
  COUNT(DISTINCT pns.id) as total_sent,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'delivered' THEN pns.id END) as total_delivered,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'clicked' THEN pns.id END) as total_clicked,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'dismissed' THEN pns.id END) as total_dismissed,
  COUNT(DISTINCT CASE WHEN pni.action_type = 'closed' THEN pns.id END) as total_closed,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT CASE WHEN pni.action_type = 'delivered' THEN pns.id END) > 0
      THEN (COUNT(DISTINCT CASE WHEN pni.action_type = 'clicked' THEN pns.id END)::NUMERIC /
            COUNT(DISTINCT CASE WHEN pni.action_type = 'delivered' THEN pns.id END)::NUMERIC) * 100
      ELSE 0
    END, 2
  ) as ctr_percentage,
  AVG(CASE WHEN pni.action_type = 'clicked' THEN pni.time_to_action_seconds END) as avg_time_to_click_seconds
FROM push_notifications_sent pns
LEFT JOIN push_notification_interactions pni ON pns.id = pni.notification_id
GROUP BY notification_type
ORDER BY ctr_percentage DESC;

-- Create function to calculate session gap
CREATE OR REPLACE FUNCTION calculate_session_gap()
RETURNS TRIGGER AS $$
DECLARE
  last_session_record RECORD;
  gap_minutes INTEGER;
BEGIN
  -- Find the last completed session for this user
  SELECT id, session_end, session_start
  INTO last_session_record
  FROM user_sessions
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND session_end IS NOT NULL
  ORDER BY session_end DESC
  LIMIT 1;

  -- If there was a previous session, calculate the gap
  IF last_session_record.id IS NOT NULL THEN
    gap_minutes := EXTRACT(EPOCH FROM (NEW.session_start - last_session_record.session_end)) / 60;

    -- Only record gaps between 1 minute and 7 days
    IF gap_minutes >= 1 AND gap_minutes <= 10080 THEN
      INSERT INTO user_session_gaps (
        user_id,
        previous_session_id,
        previous_session_end,
        next_session_id,
        next_session_start,
        gap_duration_minutes,
        was_auto_logout
      ) VALUES (
        NEW.user_id,
        last_session_record.id,
        last_session_record.session_end,
        NEW.id,
        NEW.session_start,
        gap_minutes,
        false -- Will be updated if we detect auto-logout pattern
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session gap calculation
DROP TRIGGER IF EXISTS trigger_calculate_session_gap ON user_sessions;
CREATE TRIGGER trigger_calculate_session_gap
  AFTER INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_gap();
