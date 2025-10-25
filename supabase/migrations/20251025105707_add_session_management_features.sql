/*
  # Zaawansowane zarządzanie sesjami użytkowników

  1. Zmiany w tabeli user_sessions
    - Dodanie kolumny `ip_address` (varchar) - adres IP użytkownika
    - Dodanie kolumny `disconnected_by` (uuid) - kto rozłączył sesję
    - Dodanie kolumny `disconnect_reason` (text) - powód rozłączenia
    - Dodanie kolumny `can_reconnect` (boolean) - czy można powrócić do sesji
    
  2. Nowe funkcje
    - `disconnect_session(session_id, admin_user_id, reason)` - rozłącz sesję
    - `disconnect_multiple_sessions(session_ids[], admin_user_id, reason)` - rozłącz wiele sesji
    - `kill_session(session_id, admin_user_id)` - zabij sesję bez możliwości powrotu
    
  3. Bezpieczeństwo
    - Tylko admin i analyst mogą rozłączać sesje
*/

-- Dodaj nowe kolumny do user_sessions
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS ip_address varchar(45),
ADD COLUMN IF NOT EXISTS disconnected_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS disconnect_reason text,
ADD COLUMN IF NOT EXISTS can_reconnect boolean DEFAULT true;

-- Dodaj indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(session_end) WHERE session_end IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_can_reconnect ON user_sessions(can_reconnect);

-- Funkcja do rozłączania pojedynczej sesji
CREATE OR REPLACE FUNCTION disconnect_session(
  p_session_id uuid,
  p_admin_user_id uuid,
  p_reason text DEFAULT 'Ręczne rozłączenie przez administratora'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Sprawdź czy użytkownik ma uprawnienia
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_admin_user_id;
  
  IF v_user_role NOT IN ('admin', 'analyst') THEN
    RAISE EXCEPTION 'Brak uprawnień do rozłączania sesji';
  END IF;
  
  -- Rozłącz sesję
  UPDATE user_sessions
  SET 
    session_end = COALESCE(session_end, NOW()),
    disconnected_by = p_admin_user_id,
    disconnect_reason = p_reason,
    can_reconnect = true
  WHERE id = p_session_id
    AND (session_end IS NULL OR session_end > NOW() - INTERVAL '1 hour');
  
  RETURN FOUND;
END;
$$;

-- Funkcja do zabijania sesji (bez możliwości powrotu)
CREATE OR REPLACE FUNCTION kill_session(
  p_session_id uuid,
  p_admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Sprawdź czy użytkownik ma uprawnienia
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_admin_user_id;
  
  IF v_user_role NOT IN ('admin', 'analyst') THEN
    RAISE EXCEPTION 'Brak uprawnień do zabijania sesji';
  END IF;
  
  -- Zabij sesję
  UPDATE user_sessions
  SET 
    session_end = COALESCE(session_end, NOW()),
    disconnected_by = p_admin_user_id,
    disconnect_reason = 'Sesja zabita przez administratora - brak możliwości powrotu',
    can_reconnect = false
  WHERE id = p_session_id
    AND (session_end IS NULL OR session_end > NOW() - INTERVAL '1 hour');
  
  RETURN FOUND;
END;
$$;

-- Funkcja do masowego rozłączania sesji
CREATE OR REPLACE FUNCTION disconnect_multiple_sessions(
  p_session_ids uuid[],
  p_admin_user_id uuid,
  p_reason text DEFAULT 'Masowe rozłączenie przez administratora'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
  v_count integer;
BEGIN
  -- Sprawdź czy użytkownik ma uprawnienia
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_admin_user_id;
  
  IF v_user_role NOT IN ('admin', 'analyst') THEN
    RAISE EXCEPTION 'Brak uprawnień do rozłączania sesji';
  END IF;
  
  -- Rozłącz wszystkie sesje
  UPDATE user_sessions
  SET 
    session_end = COALESCE(session_end, NOW()),
    disconnected_by = p_admin_user_id,
    disconnect_reason = p_reason,
    can_reconnect = true
  WHERE id = ANY(p_session_ids)
    AND (session_end IS NULL OR session_end > NOW() - INTERVAL '1 hour');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Dodaj polityki RLS dla nowych kolumn
CREATE POLICY "Admins and analysts can disconnect sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'analyst')
    )
  );

-- Komentarze
COMMENT ON COLUMN user_sessions.ip_address IS 'Adres IP użytkownika podczas sesji';
COMMENT ON COLUMN user_sessions.disconnected_by IS 'ID administratora który rozłączył sesję';
COMMENT ON COLUMN user_sessions.disconnect_reason IS 'Powód ręcznego rozłączenia sesji';
COMMENT ON COLUMN user_sessions.can_reconnect IS 'Czy użytkownik może powrócić do rozłączonej sesji';

COMMENT ON FUNCTION disconnect_session IS 'Rozłącza pojedynczą sesję (użytkownik może powrócić)';
COMMENT ON FUNCTION kill_session IS 'Zabija sesję bez możliwości powrotu';
COMMENT ON FUNCTION disconnect_multiple_sessions IS 'Masowo rozłącza wiele sesji';
