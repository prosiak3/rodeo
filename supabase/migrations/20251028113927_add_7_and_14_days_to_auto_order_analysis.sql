/*
  # Dodanie przedziałów 7 i 14 dni do okresu analizy automatycznych zamówień

  1. Zmiany
    - Aktualizacja constraint dla kolumny `auto_order_analysis_days`
    - Nowe dozwolone wartości: 7, 14, 90, 180, 270, 365
*/

-- Usuń stary constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auto_order_analysis_days_check;

-- Dodaj nowy constraint z rozszerzoną listą wartości
ALTER TABLE users
ADD CONSTRAINT users_auto_order_analysis_days_check
CHECK (auto_order_analysis_days IN (7, 14, 90, 180, 270, 365));

-- Zaktualizuj komentarz
COMMENT ON COLUMN users.auto_order_analysis_days IS
'Okres w dniach używany do analizy historii zamówień przy generowaniu automatycznych propozycji. Dozwolone wartości: 7, 14, 90, 180, 270, 365.';