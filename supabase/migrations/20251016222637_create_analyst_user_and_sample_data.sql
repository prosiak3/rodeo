/*
  # Create Analyst User and Initial Analytics Data

  ## Overview
  This migration creates the special analyst user (analyse@sklep.pl) and adds
  some sample analytics data for testing purposes.

  ## Changes
    1. Creates analyst user entry in users table
    2. Adds sample user events and sessions for testing
    3. Adds initial path patterns

  ## Important Notes
    - The auth.users entry must be created manually via signup
    - This migration only creates the users table entry
    - Password for analyse@sklep.pl should be set during signup
*/

-- Insert analyst user into users table (auth.users entry must be created via signup)
DO $$
DECLARE
  analyst_user_id uuid;
BEGIN
  -- Check if analyst user already exists in auth.users
  SELECT id INTO analyst_user_id FROM auth.users WHERE email = 'analyse@sklep.pl';
  
  -- If the auth user exists, create or update the users table entry
  IF analyst_user_id IS NOT NULL THEN
    INSERT INTO users (
      id,
      email,
      full_name,
      role,
      store_id,
      active
    ) VALUES (
      analyst_user_id,
      'analyse@sklep.pl',
      'Analityk Systemu',
      'analyst',
      NULL,
      true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'analyst',
      full_name = 'Analityk Systemu',
      active = true;
  END IF;
END $$;

-- Create sample session for testing (using existing user)
DO $$
DECLARE
  sample_user_id uuid;
  sample_session_id uuid;
BEGIN
  -- Get first store manager user
  SELECT id INTO sample_user_id 
  FROM users 
  WHERE role = 'store_manager' 
  LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Create a sample session
    INSERT INTO user_sessions (
      id,
      user_id,
      session_start,
      session_end,
      total_events,
      device_type,
      user_agent
    ) VALUES (
      gen_random_uuid(),
      sample_user_id,
      now() - interval '2 hours',
      now() - interval '1 hour 45 minutes',
      15,
      'mobile',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    )
    RETURNING id INTO sample_session_id;
    
    -- Add sample events for this session
    INSERT INTO user_events (user_id, session_id, event_type, event_category, screen_name, previous_screen, timestamp, event_data)
    VALUES
      (sample_user_id, sample_session_id, 'navigation', 'navigation', 'home', 'login', now() - interval '2 hours', '{"action": "login_success"}'),
      (sample_user_id, sample_session_id, 'click', 'navigation', 'home', 'home', now() - interval '1 hour 58 minutes', '{"element": "voice_order_button"}'),
      (sample_user_id, sample_session_id, 'navigation', 'navigation', 'new-order', 'home', now() - interval '1 hour 57 minutes', '{"mode": "voice"}'),
      (sample_user_id, sample_session_id, 'click', 'order', 'new-order', 'new-order', now() - interval '1 hour 56 minutes', '{"action": "start_recording"}'),
      (sample_user_id, sample_session_id, 'form_submit', 'order', 'new-order', 'new-order', now() - interval '1 hour 55 minutes', '{"action": "voice_recorded", "duration": 45}'),
      (sample_user_id, sample_session_id, 'navigation', 'navigation', 'edit-draft', 'new-order', now() - interval '1 hour 54 minutes', '{"order_id": "sample"}'),
      (sample_user_id, sample_session_id, 'click', 'order', 'edit-draft', 'edit-draft', now() - interval '1 hour 52 minutes', '{"action": "add_product"}'),
      (sample_user_id, sample_session_id, 'click', 'order', 'edit-draft', 'edit-draft', now() - interval '1 hour 50 minutes', '{"action": "update_quantity"}'),
      (sample_user_id, sample_session_id, 'click', 'order', 'edit-draft', 'edit-draft', now() - interval '1 hour 48 minutes', '{"action": "send_order"}'),
      (sample_user_id, sample_session_id, 'navigation', 'navigation', 'orders', 'edit-draft', now() - interval '1 hour 47 minutes', '{"filter": "sent"}'),
      (sample_user_id, sample_session_id, 'click', 'order', 'orders', 'orders', now() - interval '1 hour 46 minutes', '{"action": "view_order"}'),
      (sample_user_id, sample_session_id, 'navigation', 'navigation', 'order-details', 'orders', now() - interval '1 hour 45 minutes 30 seconds', '{"order_id": "sample"}'),
      (sample_user_id, sample_session_id, 'navigation', 'navigation', 'orders', 'order-details', now() - interval '1 hour 45 minutes 15 seconds', '{}'),
      (sample_user_id, sample_session_id, 'navigation', 'navigation', 'home', 'orders', now() - interval '1 hour 45 minutes', '{}');
  END IF;
END $$;

-- Create sample path patterns
INSERT INTO user_paths (path_signature, path_sequence, occurrence_count, average_duration, success_rate, last_occurred)
VALUES
  ('home->new-order->voice->edit-draft->orders', 
   ARRAY['home', 'new-order', 'voice', 'edit-draft', 'orders'],
   15,
   interval '12 minutes',
   93.33,
   now() - interval '1 hour'),
  
  ('home->prices->product->orders', 
   ARRAY['home', 'prices', 'product', 'orders'],
   8,
   interval '8 minutes',
   87.50,
   now() - interval '3 hours'),
  
  ('home->new-order->copy->edit-draft->orders', 
   ARRAY['home', 'new-order', 'copy', 'edit-draft', 'orders'],
   12,
   interval '6 minutes',
   100.00,
   now() - interval '2 hours'),
  
  ('home->orders->order-details->edit->orders', 
   ARRAY['home', 'orders', 'order-details', 'edit', 'orders'],
   5,
   interval '9 minutes',
   80.00,
   now() - interval '4 hours');

-- Create sample clusters
INSERT INTO path_clusters (cluster_name, path_pattern, paths_count, total_occurrences, average_success_rate, average_duration)
VALUES
  ('Quick Voice Order Flow',
   ARRAY['home', 'new-order', 'voice', 'edit-draft', 'orders'],
   1,
   15,
   93.33,
   interval '12 minutes'),
  
  ('Price List Browse and Order',
   ARRAY['home', 'prices', 'product', 'orders'],
   1,
   8,
   87.50,
   interval '8 minutes'),
  
  ('Copy Previous Order',
   ARRAY['home', 'new-order', 'copy', 'edit-draft', 'orders'],
   1,
   12,
   100.00,
   interval '6 minutes');
