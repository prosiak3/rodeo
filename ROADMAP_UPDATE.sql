-- Aktualizacja Roadmap: Dodanie funkcji systemu automatycznych aktualizacji
-- Data: 03.11.2024
-- Wersja: 1.7.0

-- Sprawdź czy etap "Infrastruktura i Wydajność" istnieje, jeśli nie - utwórz
DO $$
DECLARE
  stage_id uuid;
BEGIN
  -- Szukaj istniejącego etapu
  SELECT id INTO stage_id
  FROM roadmap_stages
  WHERE name = 'Infrastruktura i Wydajność'
  LIMIT 1;

  -- Jeśli nie istnieje, utwórz
  IF stage_id IS NULL THEN
    INSERT INTO roadmap_stages (name, description, display_order, status)
    VALUES (
      'Infrastruktura i Wydajność',
      'Optymalizacja infrastruktury, automatyzacja procesów i poprawa wydajności aplikacji',
      4,
      'in_progress'
    )
    RETURNING id INTO stage_id;

    RAISE NOTICE 'Utworzono nowy etap: Infrastruktura i Wydajność (ID: %)', stage_id;
  ELSE
    RAISE NOTICE 'Etap już istnieje (ID: %)', stage_id;
  END IF;

  -- Dodaj funkcję: System Automatycznych Aktualizacji
  INSERT INTO roadmap_features (
    stage_id,
    name,
    description,
    status,
    priority,
    estimated_hours,
    actual_hours,
    assigned_to,
    started_at,
    completed_at
  )
  VALUES (
    stage_id,
    'System Automatycznych Aktualizacji',
    'Pełna automatyzacja procesu aktualizacji aplikacji z wykrywaniem nowych wersji, smart connection detection, user preferences, progress tracking i Service Worker integration.',
    'completed',
    'high',
    24,
    20,
    'RODEO Dev Team',
    '2024-11-01 00:00:00+00',
    '2024-11-03 14:00:00+00'
  )
  ON CONFLICT (stage_id, name) DO UPDATE
  SET
    status = 'completed',
    actual_hours = 20,
    completed_at = '2024-11-03 14:00:00+00',
    description = 'Pełna automatyzacja procesu aktualizacji aplikacji z wykrywaniem nowych wersji, smart connection detection, user preferences, progress tracking i Service Worker integration.';

  RAISE NOTICE 'Dodano/zaktualizowano funkcję: System Automatycznych Aktualizacji';
END $$;

-- Informacja o zakończeniu
DO $$
BEGIN
  RAISE NOTICE '✅ Roadmap został zaktualizowany pomyślnie!';
  RAISE NOTICE 'Funkcja "System Automatycznych Aktualizacji" oznaczona jako completed';
END $$;
