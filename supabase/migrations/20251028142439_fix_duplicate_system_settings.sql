/*
  # Naprawa duplikatów w system_settings
  
  1. Problem
    - Dwa rekordy w system_settings powodują błąd 406 przy użyciu .single()
    
  2. Rozwiązanie
    - Usunięcie duplikatu
    - Zachowanie tylko jednego głównego rekordu
*/

-- Usuń duplikat (zachowaj rekord z pcdoctor03@gmail.com)
DELETE FROM system_settings 
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- Upewnij się że mamy tylko jeden rekord
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM system_settings) = 0 THEN
    INSERT INTO system_settings (
      id, 
      session_timeout_minutes,
      wholesale_emails,
      session_settings_enabled,
      default_quantity_on_add
    ) VALUES (
      gen_random_uuid(),
      720,
      ARRAY['pcdoctor03@gmail.com'],
      true,
      1
    );
  END IF;
END $$;