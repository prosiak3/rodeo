/*
  # Create Analyst Test User

  1. Purpose
    - Creates a test analyst user account for analytics panel access
    - Email: analyse@sklep.pl
    - Password: test123
    - Role: analyst
  
  2. Details
    - Creates auth user with secure password hash
    - Inserts corresponding user record in users table
    - Sets active status to true
    - No store assignment (analyst role doesn't require store)
*/

-- Create analyst user in auth.users
-- Password: test123 (hashed with bcrypt)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'analyse@sklep.pl',
  crypt('test123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Analityk Systemu"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'analyse@sklep.pl'
);

-- Create user record in public.users table
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  store_id,
  active
)
SELECT
  '00000000-0000-0000-0000-000000000006'::uuid,
  'analyse@sklep.pl',
  'Analityk Systemu',
  'analyst',
  NULL,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'analyse@sklep.pl'
);
