/*
  # Dodanie współrzędnych GPS do wszystkich sklepów

  ## Opis
  Aktualizacja współrzędnych GPS dla 144 sklepów które ich nie mają.
  Współrzędne bazują na rzeczywistych lokalizacjach miast w Polsce północno-wschodniej.

  ## Miasta i współrzędne (centra miast):
  - Białystok: 53.1325, 23.1688 (36 sklepów)
  - Olsztyn: 53.7784, 20.4801 (26 sklepów)
  - Suwałki: 54.1116, 22.9309 (12 sklepów)
  - Łomża: 53.1783, 22.0885 (10 sklepów)
  - Elbląg: 54.1522, 19.4083 (10 sklepów)
  - Radom: 51.4027, 21.1471 (10 sklepów)
  - Ełk: 53.8276, 22.3643 (8 sklepów)
  - Płock: 52.5463, 19.7065 (8 sklepów)
  - Augustów: 53.8433, 22.9801 (8 sklepów)
  - Giżycko: 54.0395, 21.7658 (6 sklepów)
  - Ostrołęka: 53.0841, 21.5650 (6 sklepów)
  - Siedlce: 52.1676, 22.2902 (6 sklepów)

  ## Metodologia
  Dla każdego miasta:
  1. Centrum miasta to punkt bazowy
  2. Każdy sklep dostaje losowe przesunięcie w promieniu ~0.03 stopnia (~3km)
  3. Zapewnia realistyczny rozkład sklepów w mieście
*/

-- =====================================================
-- BIAŁYSTOK (36 sklepów) - 53.1325, 23.1688
-- =====================================================
WITH bialystok_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Białystok%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 53.1325 + (0.015 * COS(2 * PI() * bs.rn / 36.0)) + (RANDOM() * 0.01 - 0.005),
  longitude = 23.1688 + (0.015 * SIN(2 * PI() * bs.rn / 36.0)) + (RANDOM() * 0.01 - 0.005)
FROM bialystok_stores bs
WHERE s.id = bs.id;

-- =====================================================
-- OLSZTYN (26 sklepów) - 53.7784, 20.4801
-- =====================================================
WITH olsztyn_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Olsztyn%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 53.7784 + (0.012 * COS(2 * PI() * os.rn / 26.0)) + (RANDOM() * 0.008 - 0.004),
  longitude = 20.4801 + (0.012 * SIN(2 * PI() * os.rn / 26.0)) + (RANDOM() * 0.008 - 0.004)
FROM olsztyn_stores os
WHERE s.id = os.id;

-- =====================================================
-- SUWAŁKI (12 sklepów) - 54.1116, 22.9309
-- =====================================================
WITH suwalki_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Suwałki%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 54.1116 + (0.008 * COS(2 * PI() * ss.rn / 12.0)) + (RANDOM() * 0.006 - 0.003),
  longitude = 22.9309 + (0.008 * SIN(2 * PI() * ss.rn / 12.0)) + (RANDOM() * 0.006 - 0.003)
FROM suwalki_stores ss
WHERE s.id = ss.id;

-- =====================================================
-- ŁOMŻA (10 sklepów) - 53.1783, 22.0885
-- =====================================================
WITH lomza_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Łomża%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 53.1783 + (0.007 * COS(2 * PI() * ls.rn / 10.0)) + (RANDOM() * 0.005 - 0.0025),
  longitude = 22.0885 + (0.007 * SIN(2 * PI() * ls.rn / 10.0)) + (RANDOM() * 0.005 - 0.0025)
FROM lomza_stores ls
WHERE s.id = ls.id;

-- =====================================================
-- ELBLĄG (10 sklepów) - 54.1522, 19.4083
-- =====================================================
WITH elblag_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Elbląg%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 54.1522 + (0.007 * COS(2 * PI() * es.rn / 10.0)) + (RANDOM() * 0.005 - 0.0025),
  longitude = 19.4083 + (0.007 * SIN(2 * PI() * es.rn / 10.0)) + (RANDOM() * 0.005 - 0.0025)
FROM elblag_stores es
WHERE s.id = es.id;

-- =====================================================
-- RADOM (10 sklepów) - 51.4027, 21.1471
-- =====================================================
WITH radom_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Radom%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 51.4027 + (0.007 * COS(2 * PI() * rs.rn / 10.0)) + (RANDOM() * 0.005 - 0.0025),
  longitude = 21.1471 + (0.007 * SIN(2 * PI() * rs.rn / 10.0)) + (RANDOM() * 0.005 - 0.0025)
FROM radom_stores rs
WHERE s.id = rs.id;

-- =====================================================
-- EŁK (8 sklepów) - 53.8276, 22.3643
-- =====================================================
WITH elk_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Ełk%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 53.8276 + (0.006 * COS(2 * PI() * eks.rn / 8.0)) + (RANDOM() * 0.004 - 0.002),
  longitude = 22.3643 + (0.006 * SIN(2 * PI() * eks.rn / 8.0)) + (RANDOM() * 0.004 - 0.002)
FROM elk_stores eks
WHERE s.id = eks.id;

-- =====================================================
-- PŁOCK (8 sklepów) - 52.5463, 19.7065
-- =====================================================
WITH plock_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Płock%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 52.5463 + (0.006 * COS(2 * PI() * ps.rn / 8.0)) + (RANDOM() * 0.004 - 0.002),
  longitude = 19.7065 + (0.006 * SIN(2 * PI() * ps.rn / 8.0)) + (RANDOM() * 0.004 - 0.002)
FROM plock_stores ps
WHERE s.id = ps.id;

-- =====================================================
-- AUGUSTÓW (8 sklepów) - 53.8433, 22.9801
-- =====================================================
WITH augustow_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Augustów%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 53.8433 + (0.006 * COS(2 * PI() * as2.rn / 8.0)) + (RANDOM() * 0.004 - 0.002),
  longitude = 22.9801 + (0.006 * SIN(2 * PI() * as2.rn / 8.0)) + (RANDOM() * 0.004 - 0.002)
FROM augustow_stores as2
WHERE s.id = as2.id;

-- =====================================================
-- GIŻYCKO (6 sklepów) - 54.0395, 21.7658
-- =====================================================
WITH gizycko_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Giżycko%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 54.0395 + (0.005 * COS(2 * PI() * gs.rn / 6.0)) + (RANDOM() * 0.003 - 0.0015),
  longitude = 21.7658 + (0.005 * SIN(2 * PI() * gs.rn / 6.0)) + (RANDOM() * 0.003 - 0.0015)
FROM gizycko_stores gs
WHERE s.id = gs.id;

-- =====================================================
-- OSTROŁĘKA (6 sklepów) - 53.0841, 21.5650
-- =====================================================
WITH ostroleka_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Ostrołęka%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 53.0841 + (0.005 * COS(2 * PI() * ost.rn / 6.0)) + (RANDOM() * 0.003 - 0.0015),
  longitude = 21.5650 + (0.005 * SIN(2 * PI() * ost.rn / 6.0)) + (RANDOM() * 0.003 - 0.0015)
FROM ostroleka_stores ost
WHERE s.id = ost.id;

-- =====================================================
-- SIEDLCE (6 sklepów) - 52.1676, 22.2902
-- =====================================================
WITH siedlce_stores AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM stores 
  WHERE address LIKE '%Siedlce%' AND latitude IS NULL
)
UPDATE stores s
SET 
  latitude = 52.1676 + (0.005 * COS(2 * PI() * sis.rn / 6.0)) + (RANDOM() * 0.003 - 0.0015),
  longitude = 22.2902 + (0.005 * SIN(2 * PI() * sis.rn / 6.0)) + (RANDOM() * 0.003 - 0.0015)
FROM siedlce_stores sis
WHERE s.id = sis.id;
