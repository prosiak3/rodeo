/*
  # Zmiana animacji banerów z bounce na pulse

  1. Zmiany
    - Aktualizacja domyślnych stylów w `occasion_types`
    - Zmiana animacji `bounce` na `pulse` dla:
      - Wielkanoc (easter)
      - Halloween (halloween)

  2. Powód
    - Animacja `bounce` (skakanie) jest zbyt ruchliwa i rozpraszająca
    - Animacja `pulse` (mruganie) jest subtelniejsza i bardziej profesjonalna

  3. Bezpieczeństwo
    - Używa UPDATE z WHERE clause dla bezpieczeństwa
    - Modyfikuje tylko pole `animation` w jsonb
*/

-- Zmień animację z bounce na pulse dla Wielkanocy
UPDATE occasion_types
SET default_styling = jsonb_set(default_styling, '{animation}', '"pulse"')
WHERE code = 'easter'
  AND default_styling->>'animation' = 'bounce';

-- Zmień animację z bounce na pulse dla Halloween
UPDATE occasion_types
SET default_styling = jsonb_set(default_styling, '{animation}', '"pulse"')
WHERE code = 'halloween'
  AND default_styling->>'animation' = 'bounce';
