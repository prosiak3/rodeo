/*
  # Add Roadmap System

  1. New Tables
    - `roadmap_stages`
      - `id` (uuid, primary key)
      - `name` (text) - Stage name (e.g., "Etap 1: Podstawy systemu")
      - `description` (text) - Stage description
      - `order_index` (integer) - Display order
      - `status` (text) - 'completed', 'in_progress', 'planned'
      - `completion_percentage` (integer) - 0-100
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `roadmap_features`
      - `id` (uuid, primary key)
      - `stage_id` (uuid, foreign key to roadmap_stages)
      - `title` (text) - Feature title
      - `description` (text) - Detailed description
      - `status` (text) - 'completed', 'in_progress', 'planned', 'future'
      - `priority` (text) - 'high', 'medium', 'low'
      - `order_index` (integer) - Display order within stage
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admin can manage all roadmap items
    - All authenticated users can view roadmap

  3. Notes
    - This system tracks development progress and future plans
    - Interactive visualization shows current implementation status
    - Stages are numbered and ordered
*/

-- Create roadmap_stages table
CREATE TABLE IF NOT EXISTS roadmap_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('completed', 'in_progress', 'planned')),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create roadmap_features table
CREATE TABLE IF NOT EXISTS roadmap_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES roadmap_stages(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('completed', 'in_progress', 'planned', 'future')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  order_index integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_stages_order ON roadmap_stages(order_index);
CREATE INDEX IF NOT EXISTS idx_roadmap_features_stage ON roadmap_features(stage_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_features_order ON roadmap_features(stage_id, order_index);

-- Enable RLS
ALTER TABLE roadmap_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roadmap_stages
CREATE POLICY "Anyone can view roadmap stages"
  ON roadmap_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage roadmap stages"
  ON roadmap_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for roadmap_features
CREATE POLICY "Anyone can view roadmap features"
  ON roadmap_features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage roadmap features"
  ON roadmap_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert initial roadmap data
INSERT INTO roadmap_stages (name, description, order_index, status, completion_percentage) VALUES
('Etap 1: Podstawy systemu', 'Fundamentalne funkcje systemu zamówień i zarządzania użytkownikami', 1, 'completed', 100),
('Etap 2: Cenniki i promocje', 'Zaawansowany system cenników, promocji i rabatów', 2, 'completed', 100),
('Etap 3: Inteligentne zamówienia', 'AI i automatyzacja procesu składania zamówień', 3, 'in_progress', 85),
('Etap 4: Analityka i raporty', 'Zaawansowana analityka biznesowa i śledzenie metryk', 4, 'in_progress', 70),
('Etap 5: Komunikacja', 'System powiadomień email i komunikacji ze sklepami', 5, 'completed', 100),
('Etap 6: Optymalizacja i personalizacja', 'Dostosowanie interfejsu i optymalizacja wydajności', 6, 'in_progress', 80),
('Etap 7: Przyszłość', 'Planowane funkcje i innowacje', 7, 'planned', 0);

-- Insert features for Stage 1
INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'System logowania i autoryzacji', 'Bezpieczne logowanie użytkowników z różnymi rolami (admin, handlowiec, ekspedient, kierowca, hurtownia)', 'completed', 'high', 1, now() - interval '6 months'
FROM roadmap_stages WHERE order_index = 1;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Zarządzanie sklepami i grupami', 'System zarządzania 124+ sklepami z możliwością grupowania i przypisywania handlowców', 'completed', 'high', 2, now() - interval '5 months'
FROM roadmap_stages WHERE order_index = 1;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Podstawowe składanie zamówień', 'Możliwość ręcznego składania zamówień przez ekspedientów i handlowców', 'completed', 'high', 3, now() - interval '6 months'
FROM roadmap_stages WHERE order_index = 1;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Statusy zamówień', 'System statusów: szkic, wysłane, w realizacji, potwierdzone, odrzucone, archiwum', 'completed', 'high', 4, now() - interval '5 months'
FROM roadmap_stages WHERE order_index = 1;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Zarządzanie produktami', 'Katalog 100+ produktów mięsnych z kodami kreskowymi, opisami i zdjęciami', 'completed', 'high', 5, now() - interval '6 months'
FROM roadmap_stages WHERE order_index = 1;

-- Insert features for Stage 2
INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'System cenników', 'Wielopoziomowe cenniki z możliwością przypisywania do sklepów i grup', 'completed', 'high', 1, now() - interval '3 months'
FROM roadmap_stages WHERE order_index = 2;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Ceny promocyjne', 'Promocje -7%, -10%, -15%, -20%, -50% z datami ważności', 'completed', 'high', 2, now() - interval '3 months'
FROM roadmap_stages WHERE order_index = 2;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Akcje 10+1', 'System akcji promocyjnych typu kup 10 otrzymaj 11', 'completed', 'medium', 3, now() - interval '3 months'
FROM roadmap_stages WHERE order_index = 2;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Ceny specjalne', 'Indywidualne ceny dla wybranych sklepów na konkretne produkty', 'completed', 'medium', 4, now() - interval '2 months'
FROM roadmap_stages WHERE order_index = 2;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Historia cenników', 'Audyt zmian cenników z informacją kto i kiedy wprowadził zmiany', 'completed', 'low', 5, now() - interval '2 months'
FROM roadmap_stages WHERE order_index = 2;

-- Insert features for Stage 3
INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Zamówienia głosowe', 'Rozpoznawanie mowy i automatyczne dodawanie produktów głosem', 'completed', 'high', 1, now() - interval '1 month'
FROM roadmap_stages WHERE order_index = 3;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'AI learning system', 'Uczenie się AI z poprawek użytkowników dla lepszego rozpoznawania', 'completed', 'high', 2, now() - interval '1 month'
FROM roadmap_stages WHERE order_index = 3;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Auto-zamówienia', 'Automatyczne propozycje zamówień na podstawie historii (7, 14, 90, 180, 270, 365 dni)', 'completed', 'high', 3, now() - interval '2 weeks'
FROM roadmap_stages WHERE order_index = 3;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Prognozowanie popytu', 'AI przewiduje zapotrzebowanie na podstawie trendów sezonowych', 'in_progress', 'medium', 4
FROM roadmap_stages WHERE order_index = 3;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Kopiowanie zamówień', 'Szybkie kopiowanie poprzednich zamówień z możliwością edycji', 'completed', 'medium', 5
FROM roadmap_stages WHERE order_index = 3;

-- Insert features for Stage 4
INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Analityka sprzedaży', 'Raporty sprzedaży z podziałem na produkty, sklepy i okresy', 'completed', 'high', 1, now() - interval '3 weeks'
FROM roadmap_stages WHERE order_index = 4;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Statystyki AI', 'Monitoring dokładności AI i skuteczności rozpoznawania głosu', 'completed', 'medium', 2, now() - interval '3 weeks'
FROM roadmap_stages WHERE order_index = 4;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Tracking użytkowników', 'Śledzenie aktywności użytkowników, sesji i logowań', 'completed', 'medium', 3, now() - interval '3 weeks'
FROM roadmap_stages WHERE order_index = 4;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Web Vitals', 'Monitoring wydajności aplikacji i metryk UX', 'completed', 'low', 4, now() - interval '1 week'
FROM roadmap_stages WHERE order_index = 4;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Ranking logowań', 'Tabela najczęściej logujących się użytkowników', 'completed', 'low', 5
FROM roadmap_stages WHERE order_index = 4;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Mapa sklepów', 'Interaktywna mapa z lokalizacją wszystkich sklepów', 'completed', 'low', 6
FROM roadmap_stages WHERE order_index = 4;

-- Insert features for Stage 5
INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'System email', 'Automatyczne wysyłanie zamówień mailem do hurtowni', 'completed', 'high', 1, now() - interval '1 week'
FROM roadmap_stages WHERE order_index = 5;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Logi wysyłek', 'Historia wszystkich wysłanych emaili z zamówieniami', 'completed', 'medium', 2, now() - interval '1 week'
FROM roadmap_stages WHERE order_index = 5;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Wiele adresów email', 'Możliwość przypisania wielu adresów email do sklepu', 'completed', 'medium', 3, now() - interval '1 week'
FROM roadmap_stages WHERE order_index = 5;

-- Insert features for Stage 6
INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, '7 stylów interfejsu', 'Wybór spośród 7 różnych stylów wizualnych aplikacji', 'completed', 'medium', 1, now() - interval '2 weeks'
FROM roadmap_stages WHERE order_index = 6;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Dostosowanie rozmiaru', 'Skalowanie interfejsu: mały, średni, duży, bardzo duży', 'completed', 'medium', 2, now() - interval '2 weeks'
FROM roadmap_stages WHERE order_index = 6;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Preferencje urządzenia', 'Osobne ustawienia dla telefonu, tabletu i komputera', 'completed', 'medium', 3, now() - interval '1 week'
FROM roadmap_stages WHERE order_index = 6;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Optymalizacja RLS', 'Poprawa wydajności polityk bezpieczeństwa bazy danych', 'completed', 'high', 4, now() - interval '3 days'
FROM roadmap_stages WHERE order_index = 6;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Zarządzanie sesjami', 'Automatyczne czyszczenie nieaktywnych sesji', 'completed', 'medium', 5, now() - interval '1 week'
FROM roadmap_stages WHERE order_index = 6;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Auto-wylogowanie', 'Automatyczne wylogowanie po 15 min bezczynności', 'completed', 'medium', 6, now() - interval '2 weeks'
FROM roadmap_stages WHERE order_index = 6;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index, completed_at) 
SELECT id, 'Ogłoszenia systemowe', 'Bannery z informacjami dla wszystkich użytkowników', 'completed', 'low', 7, now() - interval '1 week'
FROM roadmap_stages WHERE order_index = 6;

-- Insert features for Stage 7 (Future)
INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Aplikacja mobilna native', 'Dedykowana aplikacja iOS i Android', 'future', 'high', 1
FROM roadmap_stages WHERE order_index = 7;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Integracja z systemami magazynowymi', 'Synchronizacja stanów magazynowych w czasie rzeczywistym', 'future', 'high', 2
FROM roadmap_stages WHERE order_index = 7;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Chatbot AI', 'Asystent AI do obsługi pytań i składania zamówień', 'future', 'medium', 3
FROM roadmap_stages WHERE order_index = 7;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Rozszerzony system raportów', 'Generowanie raportów PDF/Excel z analizą rentowności', 'future', 'medium', 4
FROM roadmap_stages WHERE order_index = 7;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'System fakturowania', 'Automatyczne generowanie faktur i dokumentów księgowych', 'future', 'medium', 5
FROM roadmap_stages WHERE order_index = 7;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Moduł logistyki', 'Planowanie tras dostaw i optymalizacja przewozów', 'future', 'low', 6
FROM roadmap_stages WHERE order_index = 7;

INSERT INTO roadmap_features (stage_id, title, description, status, priority, order_index) 
SELECT id, 'Portal samoobsługowy dla sklepów', 'Dedykowany portal gdzie sklepy mogą samodzielnie zarządzać danymi', 'future', 'low', 7
FROM roadmap_stages WHERE order_index = 7;