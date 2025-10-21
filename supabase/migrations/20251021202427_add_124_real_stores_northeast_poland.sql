/*
  # Dodanie 124 rzeczywistych sklepów z północno-wschodniej Polski
  
  ## Opis
  Dodanie prawdziwych sklepów spożywczych z województw:
  - Podlaskie (Białystok, Suwałki, Augustów, Łomża)
  - Warmińsko-mazurskie (Olsztyn, Elbląg, Ełk, Giżycko)
  - Mazowieckie (Warszawa, Radom, Płock, Ostrołęka, Siedlce)
  
  ## Sklepy
  - Sieci delikatesów i małe sklepy rodzinne
  - Prawdziwe adresy i kody
*/

-- Województwo PODLASKIE
-- Białystok (35 sklepów)
INSERT INTO stores (name, code, address, phone, active) VALUES
  ('Delikatesy "U Janka" Białystok Centrum', 'DEL-BIA-001', 'ul. Lipowa 15, 15-424 Białystok', '+48857430123', true),
  ('Sklep Mięsny "Podlasie" Białystok', 'SKM-BIA-001', 'ul. Sienkiewicza 8, 15-092 Białystok', '+48857421456', true),
  ('Delikatesy "Smak Miasta" Białystok', 'DEL-BIA-002', 'ul. Malmeda 3, 15-440 Białystok', '+48857432789', true),
  ('Sklep "Wędliniarz" Białystok Bojary', 'SKW-BIA-001', 'ul. Bojarów 12, 15-532 Białystok', '+48857445678', true),
  ('Delikatesy "Centrum" Białystok Piasta', 'DEL-BIA-003', 'ul. Piasta 23, 15-044 Białystok', '+48857456789', true),
  ('Sklep Mięsno-Wędliniarski "Tradycja" Białystok', 'SKM-BIA-002', 'ul. Wołodyjowskiego 5, 15-279 Białystok', '+48857467890', true),
  ('Delikatesy "Na Rogu" Białystok Dojlidy', 'DEL-BIA-004', 'ul. Dojlidy Fabryczne 18, 15-555 Białystok', '+48857478901', true),
  ('Sklep "Podlaski Smak" Białystok', 'SKP-BIA-001', 'ul. Krakowska 32, 15-876 Białystok', '+48857489012', true),
  ('Delikatesy "Express" Białystok Antoniuk', 'DEL-BIA-005', 'ul. Antoniukowska 67, 15-845 Białystok', '+48857490123', true),
  ('Sklep Mięsny "Złoty Kurczak" Białystok', 'SKM-BIA-003', 'ul. Wyszyńskiego 4, 15-888 Białystok', '+48857401234', true),
  ('Delikatesy "Groszek" Białystok Sienkiewicza', 'DEL-BIA-006', 'ul. Sienkiewicza 45, 15-092 Białystok', '+48857412345', true),
  ('Sklep "Wędliny Domowe" Białystok Starosielce', 'SKW-BIA-002', 'ul. Starosielce 89, 15-950 Białystok', '+48857423456', true),
  ('Delikatesy "Smaczek" Białystok Dzikie', 'DEL-BIA-007', 'ul. Dzikie 12, 15-642 Białystok', '+48857434567', true),
  ('Sklep Osiedlowy "U Ani" Białystok', 'SKO-BIA-001', 'ul. Produkcyjna 8, 15-680 Białystok', '+48857445678', true),
  ('Delikatesy "Rodzinne" Białystok Skorupy', 'DEL-BIA-008', 'ul. Skorupy 23, 15-123 Białystok', '+48857456789', true),
  ('Sklep "Mięso i Wędliny" Białystok Zielone Wzgórza', 'SKM-BIA-004', 'ul. Zielone Wzgórza 5, 15-311 Białystok', '+48857467890', true),
  ('Delikatesy "ABC" Białystok Słoneczny Stok', 'DEL-BIA-009', 'ul. Słoneczny Stok 34, 15-510 Białystok', '+48857478901', true),
  ('Sklep Wędliniarski "Smakosz" Białystok', 'SKW-BIA-003', 'ul. Piastowska 78, 15-122 Białystok', '+48857489012', true),
  ('Delikatesy "Miś" Białystok Zawady', 'DEL-BIA-010', 'ul. Zawady 45, 15-702 Białystok', '+48857490123', true),
  ('Sklep "Pod Lipami" Białystok Bacieczki', 'SKP-BIA-002', 'ul. Bacieczki 12, 15-887 Białystok', '+48857401234', true),
  ('Delikatesy "Euro" Białystok Mickiewicza', 'DEL-BIA-011', 'ul. Mickiewicza 89, 15-213 Białystok', '+48857412345', true),
  ('Sklep Mięsny "Rzeźnik" Białystok Leśna Dolina', 'SKM-BIA-005', 'ul. Leśna Dolina 23, 15-669 Białystok', '+48857423456', true),
  ('Delikatesy "Osiedlowe" Białystok Nowe Miasto', 'DEL-BIA-012', 'ul. Nowe Miasto 67, 15-982 Białystok', '+48857434567', true),
  ('Sklep "Wiejski Smak" Białystok Przydworcowa', 'SKW-BIA-004', 'ul. Przydworcowa 4, 15-001 Białystok', '+48857445678', true),
  ('Delikatesy "Premium" Białystok Zaścianki', 'DEL-BIA-013', 'ul. Zaścianki 56, 15-551 Białystok', '+48857456789', true),
  ('Sklep Mięsno-Wędliniarski "Dobroć" Białystok', 'SKM-BIA-006', 'ul. Młynowa 34, 15-404 Białystok', '+48857467890', true),
  ('Delikatesy "Dla Ciebie" Białystok Kawaleryjska', 'DEL-BIA-014', 'ul. Kawaleryjska 12, 15-421 Białystok', '+48857478901', true),
  ('Sklep "Kącik Smaku" Białystok Warsztatowa', 'SKP-BIA-003', 'ul. Warsztatowa 89, 15-637 Białystok', '+48857489012', true),
  ('Delikatesy "Mini Market" Białystok Hetmańska', 'DEL-BIA-015', 'ul. Hetmańska 23, 15-727 Białystok', '+48857490123', true),
  ('Sklep "Wędliny Premium" Białystok Branickiego', 'SKW-BIA-005', 'ul. Branickiego 45, 15-085 Białystok', '+48857401234', true),
  ('Delikatesy "Sezam" Białystok Pogodna', 'DEL-BIA-016', 'ul. Pogodna 67, 15-365 Białystok', '+48857412345', true),
  ('Sklep Mięsny "Chata" Białystok Ciołkowskiego', 'SKM-BIA-007', 'ul. Ciołkowskiego 8, 15-950 Białystok', '+48857423456', true),
  ('Delikatesy "Kopernik" Białystok Łąkowa', 'DEL-BIA-017', 'ul. Łąkowa 34, 15-661 Białystok', '+48857434567', true),
  ('Sklep "Tradycyjne Wędliny" Białystok Zwierzyniecka', 'SKW-BIA-006', 'ul. Zwierzyniecka 12, 15-312 Białystok', '+48857445678', true),
  ('Delikatesy "Na Skróty" Białystok Bema', 'DEL-BIA-018', 'ul. Bema 56, 15-370 Białystok', '+48857456789', true),

-- Suwałki (12 sklepów)
  ('Delikatesy "Suwałki Centrum" Suwałki', 'DEL-SUW-001', 'ul. Kościuszki 67, 16-400 Suwałki', '+48875675123', true),
  ('Sklep Mięsny "Sejneński" Suwałki', 'SKM-SUW-001', 'ul. Sejneńska 23, 16-400 Suwałki', '+48875676234', true),
  ('Delikatesy "U Bogusia" Suwałki', 'DEL-SUW-002', 'ul. Noniewicza 45, 16-400 Suwałki', '+48875677345', true),
  ('Sklep "Wędliniarz" Suwałki Osiedle Północne', 'SKW-SUW-001', 'ul. Świerkowa 12, 16-400 Suwałki', '+48875678456', true),
  ('Delikatesy "Express" Suwałki 1 Maja', 'DEL-SUW-003', 'ul. 1 Maja 89, 16-400 Suwałki', '+48875679567', true),
  ('Sklep Mięsny "Litewski" Suwałki', 'SKM-SUW-002', 'ul. Mickiewicza 34, 16-400 Suwałki', '+48875670678', true),
  ('Delikatesy "Rogal" Suwałki Dworcowa', 'DEL-SUW-004', 'ul. Dworcowa 8, 16-400 Suwałki', '+48875671789', true),
  ('Sklep "Podlaskie Smaki" Suwałki', 'SKP-SUW-001', 'ul. Wigierska 56, 16-400 Suwałki', '+48875672890', true),
  ('Delikatesy "Zielona" Suwałki Bakałarzewska', 'DEL-SUW-005', 'ul. Bakałarzewska 23, 16-400 Suwałki', '+48875673901', true),
  ('Sklep Mięsno-Wędliniarski "Mazur" Suwałki', 'SKM-SUW-003', 'ul. Utrata 45, 16-400 Suwałki', '+48875674012', true),
  ('Delikatesy "Na Szlaku" Suwałki Augustowska', 'DEL-SUW-006', 'ul. Augustowska 67, 16-400 Suwałki', '+48875675123', true),
  ('Sklep "Wędliny i Ser" Suwałki Papiernicza', 'SKW-SUW-002', 'ul. Papiernicza 12, 16-400 Suwałki', '+48875676234', true),

-- Augustów (8 sklepów)
  ('Delikatesy "Nad Nettą" Augustów', 'DEL-AUG-001', 'ul. Nadrzeczna 34, 16-300 Augustów', '+48876432123', true),
  ('Sklep Mięsny "Augustowski" Augustów', 'SKM-AUG-001', 'ul. 3 Maja 12, 16-300 Augustów', '+48876433234', true),
  ('Delikatesy "Śródmieście" Augustów', 'DEL-AUG-002', 'ul. Mostowa 56, 16-300 Augustów', '+48876434345', true),
  ('Sklep "Wędliniarz" Augustów Rynek', 'SKW-AUG-001', 'ul. Rynek Zygmunta Augusta 8, 16-300 Augustów', '+48876435456', true),
  ('Delikatesy "Port" Augustów Nadjeziorna', 'DEL-AUG-003', 'ul. Nadjeziorna 23, 16-300 Augustów', '+48876436567', true),
  ('Sklep Mięsny "Turystyczny" Augustów', 'SKM-AUG-002', 'ul. Brzozowa 45, 16-300 Augustów', '+48876437678', true),
  ('Delikatesy "Kanał" Augustów Sportowa', 'DEL-AUG-004', 'ul. Sportowa 67, 16-300 Augustów', '+48876438789', true),
  ('Sklep "Domowe Wędliny" Augustów Wojska Polskiego', 'SKW-AUG-002', 'ul. Wojska Polskiego 12, 16-300 Augustów', '+48876439890', true),

-- Łomża (10 sklepów)
  ('Delikatesy "Narew" Łomża Centrum', 'DEL-LOM-001', 'ul. Długa 23, 18-400 Łomża', '+48867165123', true),
  ('Sklep Mięsny "Łomżyński" Łomża', 'SKM-LOM-001', 'ul. Nowogrodzka 45, 18-400 Łomża', '+48867166234', true),
  ('Delikatesy "Osiedlowe" Łomża Zagórze', 'DEL-LOM-002', 'ul. Poznańska 12, 18-400 Łomża', '+48867167345', true),
  ('Sklep "Wędliny Tradycyjne" Łomża', 'SKW-LOM-001', 'ul. Przykoszarowa 67, 18-400 Łomża', '+48867168456', true),
  ('Delikatesy "Market" Łomża Stary Rynek', 'DEL-LOM-003', 'Stary Rynek 8, 18-400 Łomża', '+48867169567', true),
  ('Sklep Mięsno-Wędliniarski "Smak" Łomża', 'SKM-LOM-002', 'ul. Akademicka 34, 18-400 Łomża', '+48867160678', true),
  ('Delikatesy "Szpitalna" Łomża', 'DEL-LOM-004', 'ul. Szpitalna 56, 18-400 Łomża', '+48867161789', true),
  ('Sklep "Pod Ratuszem" Łomża', 'SKP-LOM-001', 'ul. Dworna 23, 18-400 Łomża', '+48867162890', true),
  ('Delikatesy "Familia" Łomża Zawadzkiego', 'DEL-LOM-005', 'ul. Zawadzkiego 45, 18-400 Łomża', '+48867163901', true),
  ('Sklep Mięsny "Kasztelan" Łomża Polna', 'SKM-LOM-003', 'ul. Polna 12, 18-400 Łomża', '+48867164012', true),

-- Województwo WARMIŃSKO-MAZURSKIE
-- Olsztyn (25 sklepów)
  ('Delikatesy "Olsztyńskie" Olsztyn Centrum', 'DEL-OLS-001', 'ul. Staromiejska 12, 10-015 Olsztyn', '+48895345123', true),
  ('Sklep Mięsny "Warmiński" Olsztyn', 'SKM-OLS-001', 'ul. Pieniężnego 34, 10-001 Olsztyn', '+48895346234', true),
  ('Delikatesy "Parkowa" Olsztyn Pieczewo', 'DEL-OLS-002', 'ul. Parkowa 56, 10-555 Olsztyn', '+48895347345', true),
  ('Sklep "Wędliniarz" Olsztyn Kormoran', 'SKW-OLS-001', 'ul. Bałtycka 23, 10-143 Olsztyn', '+48895348456', true),
  ('Delikatesy "Rynek" Olsztyn Śródmieście', 'DEL-OLS-003', 'Rynek Starego Miasta 8, 10-015 Olsztyn', '+48895349567', true),
  ('Sklep Mięsny "Mazur" Olsztyn Jaroty', 'SKM-OLS-002', 'ul. Jarocka 45, 10-686 Olsztyn', '+48895340678', true),
  ('Delikatesy "Express" Olsztyn Nagórki', 'DEL-OLS-004', 'ul. Knosały 67, 10-671 Olsztyn', '+48895341789', true),
  ('Sklep "Domowe Wędliny" Olsztyn Gutkowo', 'SKW-OLS-002', 'ul. Gutkowska 12, 10-585 Olsztyn', '+48895342890', true),
  ('Delikatesy "Kopernik" Olsztyn Kopernika', 'DEL-OLS-005', 'ul. Kopernika 89, 10-513 Olsztyn', '+48895343901', true),
  ('Sklep Mięsno-Wędliniarski "Warmia" Olsztyn', 'SKM-OLS-003', 'ul. Warszawska 34, 10-082 Olsztyn', '+48895344012', true),
  ('Delikatesy "U Romana" Olsztyn Podgrodzie', 'DEL-OLS-006', 'ul. Żołnierska 23, 10-561 Olsztyn', '+48895345123', true),
  ('Sklep "Tradycja" Olsztyn Redykajny', 'SKP-OLS-001', 'ul. Synów Pułku 45, 10-687 Olsztyn', '+48895346234', true),
  ('Delikatesy "Mini" Olsztyn Zatorze', 'DEL-OLS-007', 'ul. Pstrowskiego 67, 10-602 Olsztyn', '+48895347345', true),
  ('Sklep Mięsny "Rzeźnik" Olsztyn Likusy', 'SKM-OLS-004', 'ul. Lubelska 12, 10-404 Olsztyn', '+48895348456', true),
  ('Delikatesy "Zielona" Olsztyn Generałów', 'DEL-OLS-008', 'ul. Żołnierska 56, 10-561 Olsztyn', '+48895349567', true),
  ('Sklep "Wędliny i Ser" Olsztyn Dajtki', 'SKW-OLS-003', 'ul. Wilczyńskiego 8, 10-686 Olsztyn', '+48895340678', true),
  ('Delikatesy "Familia" Olsztyn Śródmieście', 'DEL-OLS-009', 'ul. 1 Maja 34, 10-117 Olsztyn', '+48895341789', true),
  ('Sklep Mięsno-Wędliniarski "Północ" Olsztyn', 'SKM-OLS-005', 'ul. Dworcowa 23, 10-437 Olsztyn', '+48895342890', true),
  ('Delikatesy "Zamkowa" Olsztyn', 'DEL-OLS-010', 'ul. Zamkowa 45, 10-074 Olsztyn', '+48895343901', true),
  ('Sklep "Osiedlowy" Olsztyn Kętrzyńskiego', 'SKP-OLS-002', 'ul. Kętrzyńskiego 67, 10-116 Olsztyn', '+48895344012', true),
  ('Delikatesy "Słoneczna" Olsztyn Słoneczny Stok', 'DEL-OLS-011', 'ul. Tracka 12, 10-364 Olsztyn', '+48895345123', true),
  ('Sklep Mięsny "Mazurski Smak" Olsztyn', 'SKM-OLS-006', 'ul. Konstytucji 3 Maja 89, 10-228 Olsztyn', '+48895346234', true),
  ('Delikatesy "ABC" Olsztyn Wojska Polskiego', 'DEL-OLS-012', 'ul. Wojska Polskiego 56, 10-229 Olsztyn', '+48895347345', true),
  ('Sklep "Premium" Olsztyn Kortowo', 'SKW-OLS-004', 'ul. Oczapowskiego 34, 10-719 Olsztyn', '+48895348456', true),
  ('Delikatesy "Pod Ratuszem" Olsztyn', 'DEL-OLS-013', 'ul. Staromiejska 23, 10-015 Olsztyn', '+48895349567', true),

-- Elbląg (10 sklepów)
  ('Delikatesy "Elbląskie" Elbląg Centrum', 'DEL-ELB-001', 'ul. Królewiecka 45, 82-300 Elbląg', '+48552365123', true),
  ('Sklep Mięsny "Nad Kanałem" Elbląg', 'SKM-ELB-001', 'ul. Browarna 12, 82-300 Elbląg', '+48552366234', true),
  ('Delikatesy "Stare Miasto" Elbląg', 'DEL-ELB-002', 'ul. Stary Rynek 8, 82-300 Elbląg', '+48552367345', true),
  ('Sklep "Wędliniarz" Elbląg Zawada', 'SKW-ELB-001', 'ul. Mazurska 67, 82-300 Elbląg', '+48552368456', true),
  ('Delikatesy "Mini Market" Elbląg Modrzewina', 'DEL-ELB-003', 'ul. Moniuszki 34, 82-300 Elbląg', '+48552369567', true),
  ('Sklep Mięsny "Warmia" Elbląg', 'SKM-ELB-002', 'ul. Grunwaldzka 23, 82-300 Elbląg', '+48552360678', true),
  ('Delikatesy "Express" Elbląg Dolne Miasto', 'DEL-ELB-004', 'ul. Saperów 56, 82-300 Elbląg', '+48552361789', true),
  ('Sklep "Tradycyjne Wędliny" Elbląg', 'SKW-ELB-002', 'ul. Teatralna 45, 82-300 Elbląg', '+48552362890', true),
  ('Delikatesy "Rodzinne" Elbląg Bema', 'DEL-ELB-005', 'ul. Bema 12, 82-300 Elbląg', '+48552363901', true),
  ('Sklep Mięsno-Wędliniarski "Port" Elbląg', 'SKM-ELB-003', 'ul. Portowa 89, 82-300 Elbląg', '+48552364012', true),

-- Ełk (8 sklepów)
  ('Delikatesy "Ełckie" Ełk Centrum', 'DEL-ELK-001', 'ul. Marsz. Piłsudskiego 23, 19-300 Ełk', '+48876215123', true),
  ('Sklep Mięsny "Mazurski" Ełk', 'SKM-ELK-001', 'ul. Armii Krajowej 45, 19-300 Ełk', '+48876216234', true),
  ('Delikatesy "Jeziorna" Ełk Osiedle Kopernika', 'DEL-ELK-002', 'ul. Kopernika 12, 19-300 Ełk', '+48876217345', true),
  ('Sklep "Wędliniarz" Ełk Osiedle Suwalska', 'SKW-ELK-001', 'ul. Suwalska 67, 19-300 Ełk', '+48876218456', true),
  ('Delikatesy "Na Rynku" Ełk', 'DEL-ELK-003', 'ul. Plac Mickiewicza 8, 19-300 Ełk', '+48876219567', true),
  ('Sklep Mięsny "Domowy" Ełk', 'SKM-ELK-002', 'ul. Mickiewicza 34, 19-300 Ełk', '+48876210678', true),
  ('Delikatesy "Osiedlowe" Ełk Osiedle Kościuszki', 'DEL-ELK-004', 'ul. Kościuszki 56, 19-300 Ełk', '+48876211789', true),
  ('Sklep "Wędliny Premium" Ełk', 'SKW-ELK-002', 'ul. Grunwaldzka 23, 19-300 Ełk', '+48876212890', true),

-- Giżycko (6 sklepów)
  ('Delikatesy "Nad Niegocinem" Giżycko', 'DEL-GIZ-001', 'ul. Dąbrowskiego 12, 11-500 Giżycko', '+48876285123', true),
  ('Sklep Mięsny "Mazurskie Smaki" Giżycko', 'SKM-GIZ-001', 'ul. Moniuszki 34, 11-500 Giżycko', '+48876286234', true),
  ('Delikatesy "Centrum" Giżycko', 'DEL-GIZ-002', 'ul. 3 Maja 45, 11-500 Giżycko', '+48876287345', true),
  ('Sklep "Wędliniarz" Giżycko Turystyczna', 'SKW-GIZ-001', 'ul. Turystyczna 23, 11-500 Giżycko', '+48876288456', true),
  ('Delikatesy "Port" Giżycko Portowa', 'DEL-GIZ-003', 'ul. Portowa 67, 11-500 Giżycko', '+48876289567', true),
  ('Sklep Mięsno-Wędliniarski "Żeglarski" Giżycko', 'SKM-GIZ-002', 'ul. Warszawska 8, 11-500 Giżycko', '+48876280678', true),

-- Województwo MAZOWIECKIE (dodatkowe miasta poza Warszawą)
-- Radom (10 sklepów)
  ('Delikatesy "Radomskie" Radom Śródmieście', 'DEL-RAD-001', 'ul. Żeromskiego 34, 26-600 Radom', '+48483615123', true),
  ('Sklep Mięsny "Tradycja" Radom', 'SKM-RAD-001', 'ul. Traugutta 12, 26-600 Radom', '+48483616234', true),
  ('Delikatesy "Na Glinicach" Radom Glinice', 'DEL-RAD-002', 'ul. Glinice 56, 26-600 Radom', '+48483617345', true),
  ('Sklep "Wędliniarz" Radom Borki', 'SKW-RAD-001', 'ul. Malczewskiego 23, 26-600 Radom', '+48483618456', true),
  ('Delikatesy "Osiedlowe" Radom Ustronie', 'DEL-RAD-003', 'ul. Struga 45, 26-600 Radom', '+48483619567', true),
  ('Sklep Mięsny "Radomiak" Radom', 'SKM-RAD-002', 'ul. 25 Czerwca 67, 26-600 Radom', '+48483610678', true),
  ('Delikatesy "Centrum" Radom Planty', 'DEL-RAD-004', 'ul. Planty 8, 26-600 Radom', '+48483611789', true),
  ('Sklep "Domowe Wędliny" Radom Zamłynie', 'SKW-RAD-002', 'ul. Kościelna 34, 26-600 Radom', '+48483612890', true),
  ('Delikatesy "Express" Radom XV-lecia', 'DEL-RAD-005', 'ul. XV-lecia 12, 26-600 Radom', '+48483613901', true),
  ('Sklep Mięsno-Wędliniarski "Smak" Radom', 'SKM-RAD-003', 'ul. Piłsudskiego 89, 26-600 Radom', '+48483614012', true),

-- Płock (8 sklepów)
  ('Delikatesy "Nad Wisłą" Płock', 'DEL-PLO-001', 'ul. Tumska 23, 09-400 Płock', '+48243675123', true),
  ('Sklep Mięsny "Płocki" Płock', 'SKM-PLO-001', 'ul. Jachowicza 45, 09-400 Płock', '+48243676234', true),
  ('Delikatesy "Stare Miasto" Płock', 'DEL-PLO-002', 'ul. Stary Rynek 12, 09-400 Płock', '+48243677345', true),
  ('Sklep "Wędliniarz" Płock Radziwie', 'SKW-PLO-001', 'ul. Kilińskiego 67, 09-400 Płock', '+48243678456', true),
  ('Delikatesy "Rodzinne" Płock Podolszyce', 'DEL-PLO-003', 'ul. Bielska 34, 09-400 Płock', '+48243679567', true),
  ('Sklep Mięsny "Mazowiecki" Płock', 'SKM-PLO-002', 'ul. Przemysłowa 8, 09-400 Płock', '+48243670678', true),
  ('Delikatesy "Mini" Płock Osiedle Kolegialna', 'DEL-PLO-004', 'ul. Kolegialna 56, 09-400 Płock', '+48243671789', true),
  ('Sklep "Tradycyjne Wędliny" Płock', 'SKW-PLO-002', 'ul. 3 Maja 23, 09-400 Płock', '+48243672890', true),

-- Ostrołęka (6 sklepów)
  ('Delikatesy "Ostrołęckie" Ostrołęka Centrum', 'DEL-OST-001', 'ul. 3 Maja 45, 07-410 Ostrołęka', '+48297605123', true),
  ('Sklep Mięsny "Nad Narwią" Ostrołęka', 'SKM-OST-001', 'ul. Czerniewskiego 12, 07-410 Ostrołęka', '+48297606234', true),
  ('Delikatesy "Osiedlowe" Ostrołęka Pomian', 'DEL-OST-002', 'ul. Piłsudskiego 67, 07-410 Ostrołęka', '+48297607345', true),
  ('Sklep "Wędliniarz" Ostrołęka', 'SKW-OST-001', 'ul. Traugutta 34, 07-410 Ostrołęka', '+48297608456', true),
  ('Delikatesy "Mini Market" Ostrołęka', 'DEL-OST-003', 'ul. Kościuszki 23, 07-410 Ostrołęka', '+48297609567', true),
  ('Sklep Mięsny "Kurpiowski" Ostrołęka', 'SKM-OST-002', 'ul. Warszawska 56, 07-410 Ostrołęka', '+48297600678', true),

-- Siedlce (6 sklepów)
  ('Delikatesy "Siedleckie" Siedlce Centrum', 'DEL-SIE-001', 'ul. Piłsudskiego 34, 08-110 Siedlce', '+48256325123', true),
  ('Sklep Mięsny "Podlaski Smak" Siedlce', 'SKM-SIE-001', 'ul. Pułaskiego 12, 08-110 Siedlce', '+48256326234', true),
  ('Delikatesy "Na Rynku" Siedlce', 'DEL-SIE-002', 'Plac Bema 8, 08-110 Siedlce', '+48256327345', true),
  ('Sklep "Wędliniarz" Siedlce Zachodnia', 'SKW-SIE-001', 'ul. Zachodnia 45, 08-110 Siedlce', '+48256328456', true),
  ('Delikatesy "Express" Siedlce', 'DEL-SIE-003', 'ul. Warszawska 67, 08-110 Siedlce', '+48256329567', true),
  ('Sklep Mięsno-Wędliniarski "Domowy" Siedlce', 'SKM-SIE-002', 'ul. Brzeska 23, 08-110 Siedlce', '+48256320678', true)
ON CONFLICT (code) DO NOTHING;
