/*
  # Dodanie preferencji wyświetlania opisów przycisków w notatniku

  1. Zmiany
    - Dodanie kolumny `show_notebook_button_labels` do tabeli `users`
    - Domyślna wartość: `false` (opisy ukryte dla oszczędności miejsca)

  2. Opis
    - Użytkownicy mogą ustawić w profilu czy przyciski "Dodaj" i "Dalej" w zamówieniu notatnikowym
      mają wyświetlać opisy słowne obok ikon
    - Wartość jest przechowywana w tabeli users i wczytywana przy każdym otwarciu szczegółów zamówienia
*/

-- Dodaj kolumnę show_notebook_button_labels do tabeli users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS show_notebook_button_labels boolean DEFAULT false;

-- Dodaj komentarz do kolumny
COMMENT ON COLUMN users.show_notebook_button_labels IS 'Czy przyciski w zamówieniu notatnikowym mają wyświetlać opisy tekstowe';
