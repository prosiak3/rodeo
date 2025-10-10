/*
  # Naprawa nieskończonej rekurencji w politykach RLS dla tabeli users
  
  ## Problem
  - Polityki RLS dla tabeli users sprawdzają users.role, co powoduje nieskończoną rekurencję
  - Users nie mogą odczytać własnego profilu, bo polityka wymaga odczytu z users
  
  ## Rozwiązanie
  - Usunięcie wszystkich istniejących polityk dla users
  - Stworzenie prostszych polityk opartych tylko na auth.uid()
  - Polityki będą sprawdzać tylko ID użytkownika, nie jego rolę
  
  ## Bezpieczeństwo
  - Użytkownicy mogą odczytać własny profil
  - Użytkownicy mogą utworzyć własny profil podczas rejestracji
  - Administratorzy będą zarządzać użytkownikami przez dedykowane funkcje, nie polityki RLS
*/

-- Usunięcie wszystkich istniejących polityk dla tabeli users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins and operators can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Polityka pozwalająca użytkownikom odczytać własny profil
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Polityka pozwalająca użytkownikom utworzyć własny profil
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Polityka pozwalająca użytkownikom aktualizować własny profil
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);