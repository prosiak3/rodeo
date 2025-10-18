/*
  # Dodanie kontroli logowania do system_settings

  1. Nowe kolumny w system_settings
    - `enable_voice_recognition_logging` (boolean) - włącz/wyłącz logowanie prób rozpoznawania głosowego
    - `enable_user_tracking` (boolean) - włącz/wyłącz tracking sesji użytkowników
    - `enable_ai_metrics_logging` (boolean) - włącz/wyłącz logowanie metryk AI
    - `enable_learning_corrections` (boolean) - włącz/wyłącz zapisywanie korekt dla uczenia się

  2. Domyślne wartości
    - Wszystkie ustawienia domyślnie włączone (true)
    - Można je wyłączyć gdy system osiągnie odpowiedni poziom dokładności

  3. Opis
    - Te ustawienia pozwalają administratorom kontrolować co jest logowane
    - Wyłączenie logowania zmniejsza obciążenie bazy danych i poprawia wydajność
    - Przydatne gdy system AI osiągnie wysoką dokładność i nie wymaga dalszej analizy
*/

-- Dodaj kolumny kontroli logowania do system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS enable_voice_recognition_logging BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_user_tracking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_ai_metrics_logging BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_learning_corrections BOOLEAN DEFAULT true;

-- Ustaw domyślne wartości dla istniejących rekordów
UPDATE system_settings 
SET 
  enable_voice_recognition_logging = COALESCE(enable_voice_recognition_logging, true),
  enable_user_tracking = COALESCE(enable_user_tracking, true),
  enable_ai_metrics_logging = COALESCE(enable_ai_metrics_logging, true),
  enable_learning_corrections = COALESCE(enable_learning_corrections, true),
  updated_at = now()
WHERE enable_voice_recognition_logging IS NULL 
   OR enable_user_tracking IS NULL 
   OR enable_ai_metrics_logging IS NULL 
   OR enable_learning_corrections IS NULL;

-- Dodaj komentarze do kolumn
COMMENT ON COLUMN system_settings.enable_voice_recognition_logging IS 
  'Włącz/wyłącz logowanie prób rozpoznawania głosowego do tabeli voice_recognition_attempts';

COMMENT ON COLUMN system_settings.enable_user_tracking IS 
  'Włącz/wyłącz tracking sesji i zdarzeń użytkowników (user_sessions, user_events)';

COMMENT ON COLUMN system_settings.enable_ai_metrics_logging IS 
  'Włącz/wyłącz logowanie metryk wydajności AI (ai_performance_metrics)';

COMMENT ON COLUMN system_settings.enable_learning_corrections IS 
  'Włącz/wyłącz zapisywanie korekt użytkownika dla uczenia się systemu (voice_learning_corrections)';
