/*
  # Dodanie konfigurowalnego timeoutu dla zamówień głosowych

  1. Zmiany w system_settings
    - Dodanie nowej kolumny `voice_order_inactivity_timeout`
    - Typ: integer (liczba sekund)
    - Wartość domyślna: 30 sekund
    - Opis: Maksymalny czas bezczynności podczas zamówienia głosowego (w sekundach)

  2. Bezpieczeństwo
    - Ustawienie jest dostępne tylko dla administratorów
    - Wykorzystuje istniejące RLS policies dla system_settings

  3. Cel
    - Umożliwienie administratorom dostosowania czasu oczekiwania na kolejną wypowiedź użytkownika
    - Możliwe wartości: 30s, 60s (1 minuta), 300s (5 minut)
*/

-- Dodanie nowej kolumny voice_order_inactivity_timeout do system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'voice_order_inactivity_timeout'
  ) THEN
    ALTER TABLE system_settings
    ADD COLUMN voice_order_inactivity_timeout integer DEFAULT 30 NOT NULL;
    
    COMMENT ON COLUMN system_settings.voice_order_inactivity_timeout IS 
    'Maksymalny czas bezczynności podczas zamówienia głosowego (w sekundach). Określa po ilu sekundach ciszy system automatycznie zatrzyma nagrywanie. Domyślnie: 30 sekund.';
  END IF;
END $$;