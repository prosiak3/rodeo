/*
  # Przydzielenie sklepów do grup regionalnych
  
  ## Opis
  Utworzenie grup regionalnych według województw i przydzielenie wszystkich sklepów
  do odpowiednich grup na podstawie lokalizacji.
  
  ## Nowe Grupy
  1. Województwo Podlaskie - wszystkie sklepy z Białegostoku, Suwałk, Augustowa, Łomży
  2. Województwo Warmińsko-Mazurskie - sklepy z Olsztyna, Elbląga, Ełku, Giżycka
  3. Województwo Mazowieckie - Radom, Płock, Ostrołęka, Siedlce
  4. Sklepy typu "Delikatesy" - wszystkie z kodem zaczynającym się na "DEL"
  5. Sklepy Mięsne - wszystkie z kodem zaczynającym się na "SKM"
  6. Sklepy Wędliniarskie - wszystkie z kodem "SKW"
  
  ## Akcje
  - Tworzenie nowych grup regionalnych i typowych
  - Przypisanie wszystkich sklepów do odpowiednich grup
  - Sklepy mogą należeć do wielu grup jednocześnie
*/

-- =====================================================
-- 1. TWORZENIE NOWYCH GRUP
-- =====================================================

-- Grupy regionalne
INSERT INTO store_groups (name, description, color, active) VALUES
  ('Województwo Podlaskie', 'Wszystkie sklepy w województwie podlaskim (Białystok, Suwałki, Augustów, Łomża)', '#22C55E', true),
  ('Województwo Warmińsko-Mazurskie', 'Wszystkie sklepy w województwie warmińsko-mazurskim (Olsztyn, Elbląg, Ełk, Giżycko)', '#3B82F6', true),
  ('Województwo Mazowieckie - Inne Miasta', 'Sklepy w miastach mazowieckich poza Warszawą (Radom, Płock, Ostrołęka, Siedlce)', '#F59E0B', true)
ON CONFLICT (name) DO NOTHING;

-- Grupy według typu sklepu
INSERT INTO store_groups (name, description, color, active) VALUES
  ('Wszystkie Delikatesy', 'Wszystkie sklepy typu Delikatesy w całej sieci', '#10B981', true),
  ('Sklepy Mięsne', 'Wszystkie sklepy mięsno-wędliniarskie', '#EF4444', true),
  ('Sklepy Wędliniarskie', 'Sklepy specjalizujące się w wędlinach', '#F97316', true),
  ('Sklepy Osiedlowe', 'Małe sklepy osiedlowe i rodzinne', '#8B5CF6', true)
ON CONFLICT (name) DO NOTHING;

-- Grupy według miast - Podlaskie
INSERT INTO store_groups (name, description, color, active) VALUES
  ('Białystok', 'Sklepy w Białymstoku', '#84CC16', true),
  ('Suwałki', 'Sklepy w Suwałkach', '#14B8A6', true),
  ('Augustów', 'Sklepy w Augustowie', '#06B6D4', true),
  ('Łomża', 'Sklepy w Łomży', '#0EA5E9', true)
ON CONFLICT (name) DO NOTHING;

-- Grupy według miast - Warmińsko-Mazurskie
INSERT INTO store_groups (name, description, color, active) VALUES
  ('Olsztyn', 'Sklepy w Olsztynie', '#3B82F6', true),
  ('Elbląg', 'Sklepy w Elblągu', '#6366F1', true),
  ('Ełk', 'Sklepy w Ełku', '#8B5CF6', true),
  ('Giżycko', 'Sklepy w Giżycku', '#A855F7', true)
ON CONFLICT (name) DO NOTHING;

-- Grupy według miast - Mazowieckie
INSERT INTO store_groups (name, description, color, active) VALUES
  ('Radom', 'Sklepy w Radomiu', '#F59E0B', true),
  ('Płock', 'Sklepy w Płocku', '#F97316', true),
  ('Ostrołęka', 'Sklepy w Ostrołęce', '#EF4444', true),
  ('Siedlce', 'Sklepy w Siedlcach', '#EC4899', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. PRZYPISANIE SKLEPÓW DO GRUP WOJEWÓDZKICH
-- =====================================================

-- Województwo Podlaskie
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Województwo Podlaskie'),
  s.id
FROM stores s
WHERE s.address LIKE '%Białystok%' 
   OR s.address LIKE '%Suwałki%' 
   OR s.address LIKE '%Augustów%' 
   OR s.address LIKE '%Łomża%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Województwo Warmińsko-Mazurskie
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Województwo Warmińsko-Mazurskie'),
  s.id
FROM stores s
WHERE s.address LIKE '%Olsztyn%' 
   OR s.address LIKE '%Elbląg%' 
   OR s.address LIKE '%Ełk%' 
   OR s.address LIKE '%Giżycko%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Województwo Mazowieckie - Inne Miasta
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Województwo Mazowieckie - Inne Miasta'),
  s.id
FROM stores s
WHERE s.address LIKE '%Radom%' 
   OR s.address LIKE '%Płock%' 
   OR s.address LIKE '%Ostrołęka%' 
   OR s.address LIKE '%Siedlce%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- =====================================================
-- 3. PRZYPISANIE SKLEPÓW DO GRUP WEDŁUG TYPU
-- =====================================================

-- Wszystkie Delikatesy (kod zaczyna się na "DEL")
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Wszystkie Delikatesy'),
  s.id
FROM stores s
WHERE s.code LIKE 'DEL-%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Sklepy Mięsne (kod zaczyna się na "SKM")
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Sklepy Mięsne'),
  s.id
FROM stores s
WHERE s.code LIKE 'SKM-%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Sklepy Wędliniarskie (kod zaczyna się na "SKW")
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Sklepy Wędliniarskie'),
  s.id
FROM stores s
WHERE s.code LIKE 'SKW-%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Sklepy Osiedlowe (kod zaczyna się na "SKO" lub "SKP")
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Sklepy Osiedlowe'),
  s.id
FROM stores s
WHERE s.code LIKE 'SKO-%' OR s.code LIKE 'SKP-%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- =====================================================
-- 4. PRZYPISANIE SKLEPÓW DO GRUP WEDŁUG MIAST
-- =====================================================

-- Białystok
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Białystok'),
  s.id
FROM stores s
WHERE s.address LIKE '%Białystok%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Suwałki
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Suwałki'),
  s.id
FROM stores s
WHERE s.address LIKE '%Suwałki%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Augustów
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Augustów'),
  s.id
FROM stores s
WHERE s.address LIKE '%Augustów%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Łomża
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Łomża'),
  s.id
FROM stores s
WHERE s.address LIKE '%Łomża%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Olsztyn
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Olsztyn'),
  s.id
FROM stores s
WHERE s.address LIKE '%Olsztyn%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Elbląg
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Elbląg'),
  s.id
FROM stores s
WHERE s.address LIKE '%Elbląg%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Ełk
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Ełk'),
  s.id
FROM stores s
WHERE s.address LIKE '%Ełk%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Giżycko
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Giżycko'),
  s.id
FROM stores s
WHERE s.address LIKE '%Giżycko%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Radom
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Radom'),
  s.id
FROM stores s
WHERE s.address LIKE '%Radom%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Płock
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Płock'),
  s.id
FROM stores s
WHERE s.address LIKE '%Płock%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Ostrołęka
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Ostrołęka'),
  s.id
FROM stores s
WHERE s.address LIKE '%Ostrołęka%'
ON CONFLICT (group_id, store_id) DO NOTHING;

-- Siedlce
INSERT INTO store_group_members (group_id, store_id)
SELECT 
  (SELECT id FROM store_groups WHERE name = 'Siedlce'),
  s.id
FROM stores s
WHERE s.address LIKE '%Siedlce%'
ON CONFLICT (group_id, store_id) DO NOTHING;
