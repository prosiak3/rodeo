/*
  # Dodanie preferencji wyświetlania ikon kosza

  1. Zmiany
    - Dodanie kolumny `show_delete_icons` do tabeli `users`
    - Domyślna wartość: `false` (ikony kosza ukryte, usuwanie przez długie przytrzymanie)

  2. Opis
    - Użytkownicy mogą ustawić w profilu czy chcą widzieć ikony kosza przy pozycjach
    - Gdy wyłączone (domyślnie): usuwanie przez długie przytrzymanie (800ms)
    - Gdy włączone: wyświetlane są ikony kosza, długie przytrzymanie wyłączone
    - Przydatne dla użytkowników na komputerach którzy preferują klikanie w ikonę
*/

-- Dodaj kolumnę show_delete_icons do tabeli users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS show_delete_icons boolean DEFAULT false;

-- Dodaj komentarz do kolumny
COMMENT ON COLUMN users.show_delete_icons IS 'Czy pokazywać ikony kosza przy pozycjach zamiast usuwania przez długie przytrzymanie';
