/*
  # Zaawansowane ustawienia rozpoznawania głosu

  1. Nowe kolumny w system_settings
    - `show_voice_transcript_realtime` (boolean) - kontrola wyświetlania transkrypcji na żywo
    - `voice_minimum_confidence_threshold` (numeric) - minimalny próg pewności AI (0-100)
    - `voice_ignore_low_confidence` (boolean) - czy ignorować rozpoznania poniżej progu

  2. Domyślne wartości
    - show_voice_transcript_realtime = true (pokazuj transkrypcję)
    - voice_minimum_confidence_threshold = 70 (70% pewności minimalnie)
    - voice_ignore_low_confidence = false (nie ignoruj, pokazuj jako sugestie)

  3. Opis
    - Te ustawienia pozwalają administratorom kontrolować jak system przetwarza głos
    - Próg pewności pomaga wyeliminować przypadkowy hałas z otoczenia
    - Ukrycie transkrypcji na żywo uprości interfejs dla użytkowników
*/

-- Dodaj kolumny zaawansowanych ustawień głosowych do system_settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS show_voice_transcript_realtime BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS voice_minimum_confidence_threshold NUMERIC(5,2) DEFAULT 70.0,
ADD COLUMN IF NOT EXISTS voice_ignore_low_confidence BOOLEAN DEFAULT false;

-- Ustaw domyślne wartości dla istniejących rekordów
UPDATE system_settings
SET
  show_voice_transcript_realtime = COALESCE(show_voice_transcript_realtime, true),
  voice_minimum_confidence_threshold = COALESCE(voice_minimum_confidence_threshold, 70.0),
  voice_ignore_low_confidence = COALESCE(voice_ignore_low_confidence, false),
  updated_at = now()
WHERE show_voice_transcript_realtime IS NULL
   OR voice_minimum_confidence_threshold IS NULL
   OR voice_ignore_low_confidence IS NULL;

-- Dodaj ograniczenie dla progu pewności (0-100)
ALTER TABLE system_settings
ADD CONSTRAINT voice_confidence_threshold_range
CHECK (voice_minimum_confidence_threshold >= 0 AND voice_minimum_confidence_threshold <= 100);

-- Dodaj komentarze do kolumn
COMMENT ON COLUMN system_settings.show_voice_transcript_realtime IS
  'Włącz/wyłącz wyświetlanie transkrypcji na żywo podczas składania zamówienia głosowego. Wyłączenie upraszcza interfejs.';

COMMENT ON COLUMN system_settings.voice_minimum_confidence_threshold IS
  'Minimalny próg pewności AI (0-100%) wymagany do automatycznej akceptacji produktu. Rozpoznania poniżej tego progu będą pokazywane jako sugestie lub ignorowane.';

COMMENT ON COLUMN system_settings.voice_ignore_low_confidence IS
  'Jeśli true, system całkowicie zignoruje rozpoznania poniżej progu pewności. Jeśli false, pokaże je jako sugestie wymagające potwierdzenia.';
