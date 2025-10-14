/*
  # Dodanie preferencji okresu analizy dla automatycznych zamówień

  1. Zmiany w schemacie
    - Dodanie kolumny `auto_order_analysis_days` do tabeli `users`
      - Typ: integer
      - Dozwolone wartości: 90, 180, 270, 365 (dni)
      - Domyślna wartość: 180 (6 miesięcy)
      - Opis: Określa jak daleko wstecz system ma analizować historię zamówień
        przy generowaniu automatycznych propozycji zamówień

  2. Znaczenie wartości
    - 90 dni (3 miesiące): Szybka reakcja na zmiany, mniej danych historycznych
    - 180 dni (6 miesięcy): Zrównoważony okres (domyślny)
    - 270 dni (9 miesięcy): Więcej danych, uwzględnia sezonowość
    - 365 dni (1 rok): Pełny cykl roczny, maksymalny kontekst historyczny

  3. Notatki
    - Użytkownicy mogą zmienić to ustawienie w swoim profilu
    - Wartość jest używana przez funkcję generate_auto_order_suggestion
    - Constraint zapewnia, że tylko dozwolone wartości mogą być zapisane
*/

-- Dodaj kolumnę auto_order_analysis_days do tabeli users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auto_order_analysis_days'
  ) THEN
    ALTER TABLE users
    ADD COLUMN auto_order_analysis_days integer DEFAULT 180
    CHECK (auto_order_analysis_days IN (90, 180, 270, 365));
  END IF;
END $$;

-- Dodaj komentarz do kolumny
COMMENT ON COLUMN users.auto_order_analysis_days IS
'Okres w dniach używany do analizy historii zamówień przy generowaniu automatycznych propozycji. Dozwolone wartości: 90, 180, 270, 365.';
