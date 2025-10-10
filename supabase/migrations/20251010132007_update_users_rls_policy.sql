/*
  # Aktualizacja polityk RLS dla tabeli users
  
  ## Zmiany
  
  1. Dodanie polityki umożliwiającej tworzenie profilu użytkownika podczas rejestracji
    - Nowy użytkownik może utworzyć swój własny profil w tabeli users
    - Tylko dla swojego własnego ID (auth.uid())
  
  ## Bezpieczeństwo
  - Użytkownik może utworzyć tylko jeden profil (dla swojego ID)
  - Nie może tworzyć profili dla innych użytkowników
*/

-- Usunięcie istniejącej polityki INSERT dla adminów (jeśli istnieje)
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Polityka pozwalająca użytkownikom na utworzenie własnego profilu podczas rejestracji
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Przywrócenie polityki dla adminów (wszystkie operacje)
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );