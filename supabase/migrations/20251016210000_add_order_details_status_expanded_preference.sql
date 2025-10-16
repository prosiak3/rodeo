/*
  # Dodanie preferencji domyślnego stanu sekcji statusu w szczegółach zamówienia

  1. Zmiany
    - Dodanie kolumny `order_details_status_expanded` do tabeli `users`
    - Domyślna wartość: `false` (sekcja zwinięta)

  2. Opis
    - Użytkownicy mogą ustawić w profilu czy sekcja "Status i uczestnicy" w szczegółach zamówienia
      ma być domyślnie rozwinięta czy zwinięta
    - Wartość jest przechowywana w tabeli users i wczytywana przy każdym otwarciu szczegółów zamówienia
*/

-- Dodaj kolumnę order_details_status_expanded do tabeli users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS order_details_status_expanded boolean DEFAULT false;

-- Dodaj komentarz do kolumny
COMMENT ON COLUMN users.order_details_status_expanded IS 'Czy sekcja statusu i uczestników w szczegółach zamówienia ma być domyślnie rozwinięta';
