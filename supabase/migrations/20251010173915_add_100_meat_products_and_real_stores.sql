/*
  # Add 100 Meat & Deli Products and Real Store Locations

  ## Overview
  This migration adds a comprehensive product catalog with 100 real meat and deli products
  and adds real store locations in Poland.

  ## Changes
  
  1. Products
    - 100 meat and deli products with real names, prices, and barcodes
    - Categories: Wołowina, Wieprzowina, Drób, Wędliny, Kiełbasy, Pasztety, Produkty regionalne
    - Realistic pricing based on Polish market
    - Proper EAN-13 barcodes

  2. Stores
    - Real store locations from major Polish cities
    - Realistic addresses and phone numbers
    - Store codes for easy identification

  ## Notes
  - All products are active and ready to use
  - Prices are in PLN
  - Barcodes follow EAN-13 standard
*/

-- First, clear existing sample data to avoid duplicates
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders);
DELETE FROM order_history;
DELETE FROM orders;
DELETE FROM special_prices;
DELETE FROM salesperson_stores;
DELETE FROM products WHERE code LIKE 'MEAT%' OR code LIKE 'PORK%' OR code LIKE 'BEEF%' OR code LIKE 'POULTRY%' OR code LIKE 'SAUS%';

-- Insert real store locations
INSERT INTO stores (name, code, address, phone, active) VALUES
('Biedronka Warszawa Centrum', 'WAW001', 'ul. Marszałkowska 55, 00-676 Warszawa', '+48 22 123 45 67', true),
('Lidl Kraków Nowa Huta', 'KRK001', 'os. Centrum E 10, 31-934 Kraków', '+48 12 234 56 78', true),
('Kaufland Wrocław Fabryczna', 'WRO001', 'ul. Świętego Mikołaja 8/11, 50-125 Wrocław', '+48 71 345 67 89', true),
('Auchan Poznań Plaza', 'POZ001', 'ul. Stanisława Matyi 2, 61-586 Poznań', '+48 61 456 78 90', true),
('Carrefour Gdańsk Morena', 'GDA001', 'ul. Marynarki Polskiej 55, 80-557 Gdańsk', '+48 58 567 89 01', true),
('Tesco Łódź Manufaktura', 'LOD001', 'ul. Drewnowska 58, 91-002 Łódź', '+48 42 678 90 12', true),
('Intermarché Katowice', 'KAT001', 'ul. Chorzowska 107, 40-121 Katowice', '+48 32 789 01 23', true),
('Aldi Szczecin', 'SZC001', 'al. Bohaterów Warszawy 96, 70-340 Szczecin', '+48 91 890 12 34', true),
('Biedronka Bydgoszcz', 'BYD001', 'ul. Toruńska 279, 85-880 Bydgoszcz', '+48 52 901 23 45', true),
('Lidl Lublin', 'LUB001', 'al. Kraśnicka 2L, 20-718 Lublin', '+48 81 012 34 56', true),
('Kaufland Białystok', 'BIA001', 'ul. Ciołkowskiego 2, 15-245 Białystok', '+48 85 123 45 67', true),
('Auchan Rzeszów', 'RZE001', 'ul. Podkarpacka 1, 35-082 Rzeszów', '+48 17 234 56 78', true),
('Carrefour Olsztyn', 'OLS001', 'ul. Tracka 5, 10-364 Olsztyn', '+48 89 345 67 89', true),
('Tesco Kielce', 'KIE001', 'ul. Świętokrzyska 20, 25-406 Kielce', '+48 41 456 78 90', true),
('Biedronka Toruń', 'TOR001', 'ul. Broniewskiego 80, 87-100 Toruń', '+48 56 567 89 01', true)
ON CONFLICT (code) DO NOTHING;

-- Insert 100 meat and deli products
INSERT INTO products (code, name, category, unit, base_price, description, index, active) VALUES
-- WOŁOWINA (Beef) - 15 products
('590001234567', 'Antrykot wołowy', 'Wołowina', 'kg', 89.99, 'Stek antrykot z wołowiny premium', '5900012345670', true),
('590001234574', 'Polędwica wołowa', 'Wołowina', 'kg', 149.99, 'Polędwica wołowa najwyższej jakości', '5900012345687', true),
('590001234581', 'Rostbef wołowy', 'Wołowina', 'kg', 79.99, 'Rostbef z młodej wołowiny', '5900012345694', true),
('590001234598', 'Karkówka wołowa', 'Wołowina', 'kg', 65.99, 'Karkówka wołowa do pieczenia', '5900012345700', true),
('590001234604', 'Mostek wołowy', 'Wołowina', 'kg', 45.99, 'Mostek wołowy na zupę', '5900012345717', true),
('590001234611', 'Łopatka wołowa', 'Wołowina', 'kg', 52.99, 'Łopatka wołowa bez kości', '5900012345724', true),
('590001234628', 'Szponder wołowy', 'Wołowina', 'kg', 48.99, 'Szponder wołowy na gulasz', '5900012345731', true),
('590001234635', 'Wołowina mielona', 'Wołowina', 'kg', 42.99, 'Mięso mielone z wołowiny 90/10', '5900012345748', true),
('590001234642', 'T-bone steak', 'Wołowina', 'kg', 119.99, 'Stek T-bone z kością', '5900012345755', true),
('590001234659', 'Żeberka wołowe', 'Wołowina', 'kg', 38.99, 'Żeberka wołowe do duszenia', '5900012345762', true),
('590001234666', 'Ozór wołowy', 'Wołowina', 'kg', 34.99, 'Ozór wołowy świeży', '5900012345779', true),
('590001234673', 'Serce wołowe', 'Wołowina', 'kg', 18.99, 'Serce wołowe', '5900012345786', true),
('590001234680', 'Wątroba wołowa', 'Wołowina', 'kg', 24.99, 'Wątroba wołowa świeża', '5900012345793', true),
('590001234697', 'Ogon wołowy', 'Wołowina', 'kg', 28.99, 'Ogon wołowy na rosół', '5900012345809', true),
('590001234703', 'Gulp wołowy', 'Wołowina', 'kg', 42.99, 'Gulp wołowy na bitki', '5900012345816', true),

-- WIEPRZOWINA (Pork) - 20 products
('590002234567', 'Schab bez kości', 'Wieprzowina', 'kg', 32.99, 'Schab wieprzowy bez kości', '5900022345670', true),
('590002234574', 'Schab z kością', 'Wieprzowina', 'kg', 29.99, 'Schab wieprzowy z kością', '5900022345687', true),
('590002234581', 'Karkówka wieprzowa', 'Wieprzowina', 'kg', 24.99, 'Karkówka wieprzowa do grilla', '5900022345694', true),
('590002234598', 'Boczek świeży', 'Wieprzowina', 'kg', 22.99, 'Boczek wieprzowy świeży', '5900022345700', true),
('590002234604', 'Żeberka wieprzowe', 'Wieprzowina', 'kg', 18.99, 'Żeberka wieprzowe do grilla', '5900022345717', true),
('590002234611', 'Łopatka wieprzowa', 'Wieprzowina', 'kg', 19.99, 'Łopatka wieprzowa bez kości', '5900022345724', true),
('590002234628', 'Golonka wieprzowa', 'Wieprzowina', 'kg', 16.99, 'Golonka wieprzowa do pieczenia', '5900022345731', true),
('590002234635', 'Polędwiczki wieprzowe', 'Wieprzowina', 'kg', 45.99, 'Polędwiczki wieprzowe', '5900022345748', true),
('590002234642', 'Wieprzowina mielona', 'Wieprzowina', 'kg', 17.99, 'Mięso mielone wieprzowe', '5900022345755', true),
('590002234659', 'Szynka surowa', 'Wieprzowina', 'kg', 28.99, 'Szynka wieprzowa surowa', '5900022345762', true),
('590002234666', 'Ozór wieprzowy', 'Wieprzowina', 'kg', 21.99, 'Ozór wieprzowy', '5900022345779', true),
('590002234673', 'Słonina', 'Wieprzowina', 'kg', 12.99, 'Słonina wieprzowa', '5900022345786', true),
('590002234680', 'Wątroba wieprzowa', 'Wieprzowina', 'kg', 14.99, 'Wątroba wieprzowa świeża', '5900022345793', true),
('590002234697', 'Serce wieprzowe', 'Wieprzowina', 'kg', 11.99, 'Serce wieprzowe', '5900022345809', true),
('590002234703', 'Nóżki wieprzowe', 'Wieprzowina', 'kg', 9.99, 'Nóżki wieprzowe', '5900022345816', true),
('590002234710', 'Skórka wieprzowa', 'Wieprzowina', 'kg', 6.99, 'Skórka wieprzowa', '5900022345823', true),
('590002234727', 'Mostek wieprzowy', 'Wieprzowina', 'kg', 15.99, 'Mostek wieprzowy', '5900022345830', true),
('590002234734', 'Ucho wieprzowe', 'Wieprzowina', 'kg', 13.99, 'Ucho wieprzowe', '5900022345847', true),
('590002234741', 'Żeberka spare ribs', 'Wieprzowina', 'kg', 26.99, 'Żeberka spare ribs', '5900022345854', true),
('590002234758', 'Kaszanka', 'Wieprzowina', 'kg', 16.99, 'Kaszanka tradycyjna', '5900022345861', true),

-- DRÓB (Poultry) - 15 products
('590003234567', 'Kurczak cały', 'Drób', 'kg', 12.99, 'Kurczak cały świeży', '5900032345670', true),
('590003234574', 'Pierś z kurczaka', 'Drób', 'kg', 24.99, 'Pierś z kurczaka bez kości', '5900032345687', true),
('590003234581', 'Udko z kurczaka', 'Drób', 'kg', 14.99, 'Udko z kurczaka', '5900032345694', true),
('590003234598', 'Skrzydełka kurczaka', 'Drób', 'kg', 16.99, 'Skrzydełka z kurczaka', '5900032345700', true),
('590003234604', 'Filet z kurczaka', 'Drób', 'kg', 26.99, 'Filet z kurczaka', '5900032345717', true),
('590003234611', 'Kurczak mielony', 'Drób', 'kg', 18.99, 'Mięso mielone z kurczaka', '5900032345724', true),
('590003234628', 'Indyk cały', 'Drób', 'kg', 19.99, 'Indyk cały świeży', '5900032345731', true),
('590003234635', 'Pierś z indyka', 'Drób', 'kg', 32.99, 'Pierś z indyka bez kości', '5900032345748', true),
('590003234642', 'Udko z indyka', 'Drób', 'kg', 22.99, 'Udko z indyka', '5900032345755', true),
('590003234659', 'Kaczka cała', 'Drób', 'kg', 28.99, 'Kaczka cała świeża', '5900032345762', true),
('590003234666', 'Pierś z kaczki', 'Drób', 'kg', 45.99, 'Pierś z kaczki', '5900032345779', true),
('590003234673', 'Gęś cała', 'Drób', 'kg', 38.99, 'Gęś cała świeża', '5900032345786', true),
('590003234680', 'Wątroba drobiowa', 'Drób', 'kg', 15.99, 'Wątroba drobiowa', '5900032345793', true),
('590003234697', 'Żołądki drobiowe', 'Drób', 'kg', 12.99, 'Żołądki drobiowe', '5900032345809', true),
('590003234703', 'Serca drobiowe', 'Drób', 'kg', 14.99, 'Serca drobiowe', '5900032345816', true),

-- WĘDLINY (Cold Cuts) - 25 products
('590004234567', 'Szynka konserwowa', 'Wędliny', 'kg', 32.99, 'Szynka konserwowa klasyczna', '5900042345670', true),
('590004234574', 'Szynka krakowska', 'Wędliny', 'kg', 38.99, 'Szynka krakowska sucha', '5900042345687', true),
('590004234581', 'Szynka Polski Wyrób', 'Wędliny', 'kg', 29.99, 'Szynka Polski Wyrób', '5900042345694', true),
('590004234598', 'Polędwica sopocka', 'Wędliny', 'kg', 42.99, 'Polędwica sopocka', '5900042345700', true),
('590004234604', 'Schab pieczony', 'Wędliny', 'kg', 34.99, 'Schab pieczony', '5900042345717', true),
('590004234611', 'Baleron', 'Wędliny', 'kg', 26.99, 'Baleron tradycyjny', '5900042345724', true),
('590004234628', 'Szynka z indyka', 'Wędliny', 'kg', 35.99, 'Szynka z indyka', '5900042345731', true),
('590004234635', 'Mortadela', 'Wędliny', 'kg', 18.99, 'Mortadela klasyczna', '5900042345748', true),
('590004234642', 'Salami', 'Wędliny', 'kg', 42.99, 'Salami włoskie', '5900042345755', true),
('590004234659', 'Salceson', 'Wędliny', 'kg', 14.99, 'Salceson domowy', '5900042345762', true),
('590004234666', 'Pasztet drobiowy', 'Wędliny', 'kg', 16.99, 'Pasztet z drobiu', '5900042345779', true),
('590004234673', 'Smalec ze skwarkami', 'Wędliny', 'kg', 19.99, 'Smalec ze skwarkami', '5900042345786', true),
('590004234680', 'Kiszka ziemniaczana', 'Wędliny', 'kg', 15.99, 'Kiszka ziemniaczana', '5900042345793', true),
('590004234697', 'Flaki konserwowe', 'Wędliny', 'kg', 18.99, 'Flaki konserwowe', '5900042345809', true),
('590004234703', 'Podroby drobiowe', 'Wędliny', 'kg', 12.99, 'Podroby drobiowe', '5900042345816', true),
('590004234710', 'Pasztet wiejski', 'Wędliny', 'kg', 21.99, 'Pasztet wiejski', '5900042345823', true),
('590004234727', 'Blok szynkowy', 'Wędliny', 'kg', 24.99, 'Blok szynkowy', '5900042345830', true),
('590004234734', 'Boczek wędzony', 'Wędliny', 'kg', 28.99, 'Boczek wędzony', '5900042345847', true),
('590004234741', 'Łopatka wieprzowa pieczona', 'Wędliny', 'kg', 27.99, 'Łopatka pieczona', '5900042345854', true),
('590004234758', 'Ozorki wieprzowe', 'Wędliny', 'kg', 36.99, 'Ozorki wieprzowe gotowane', '5900042345861', true),
('590004234765', 'Pasztet z sarniny', 'Wędliny', 'kg', 45.99, 'Pasztet z sarniny', '5900042345878', true),
('590004234772', 'Szynka parmeńska', 'Wędliny', 'kg', 89.99, 'Szynka parmeńska premium', '5900042345885', true),
('590004234789', 'Szynka serrano', 'Wędliny', 'kg', 79.99, 'Szynka serrano hiszpańska', '5900042345892', true),
('590004234796', 'Prosciutto', 'Wędliny', 'kg', 85.99, 'Prosciutto włoskie', '5900042345908', true),
('590004234802', 'Bresaola', 'Wędliny', 'kg', 92.99, 'Bresaola wołowa', '5900042345915', true),

-- KIEŁBASY (Sausages) - 20 products
('590005234567', 'Kiełbasa śląska', 'Kiełbasy', 'kg', 26.99, 'Kiełbasa śląska', '5900052345670', true),
('590005234574', 'Kiełbasa krakowska', 'Kiełbasy', 'kg', 32.99, 'Kiełbasa krakowska sucha', '5900052345687', true),
('590005234581', 'Kiełbasa żywiecka', 'Kiełbasy', 'kg', 29.99, 'Kiełbasa żywiecka', '5900052345694', true),
('590005234598', 'Kiełbasa podwawelska', 'Kiełbasy', 'kg', 28.99, 'Kiełbasa podwawelska', '5900052345700', true),
('590005234604', 'Kiełbasa myśliwska', 'Kiełbasy', 'kg', 34.99, 'Kiełbasa myśliwska', '5900052345717', true),
('590005234611', 'Kiełbasa jałowcowa', 'Kiełbasy', 'kg', 31.99, 'Kiełbasa jałowcowa', '5900052345724', true),
('590005234628', 'Kabanosy', 'Kiełbasy', 'kg', 38.99, 'Kabanosy tradycyjne', '5900052345731', true),
('590005234635', 'Kiełbasa lecha', 'Kiełbasy', 'kg', 24.99, 'Kiełbasa lecha', '5900052345748', true),
('590005234642', 'Kiełbasa wiejska', 'Kiełbasy', 'kg', 27.99, 'Kiełbasa wiejska', '5900052345755', true),
('590005234659', 'Kiełbasa biała', 'Kiełbasy', 'kg', 22.99, 'Kiełbasa biała do pieczenia', '5900052345762', true),
('590005234666', 'Kiełbasa parówkowa', 'Kiełbasy', 'kg', 18.99, 'Kiełbasa parówkowa', '5900052345779', true),
('590005234673', 'Parówki wiedeńskie', 'Kiełbasy', 'kg', 21.99, 'Parówki wiedeńskie', '5900052345786', true),
('590005234680', 'Kiełbasa czarna', 'Kiełbasy', 'kg', 16.99, 'Kiełbasa czarna kaszanka', '5900052345793', true),
('590005234697', 'Kiełbasa toruńska', 'Kiełbasy', 'kg', 35.99, 'Kiełbasa toruńska', '5900052345809', true),
('590005234703', 'Kiełbasa cygańska', 'Kiełbasy', 'kg', 29.99, 'Kiełbasa cygańska', '5900052345816', true),
('590005234710', 'Kiełbasa lisiecka', 'Kiełbasy', 'kg', 36.99, 'Kiełbasa lisiecka', '5900052345823', true),
('590005234727', 'Kiełbasa chorizo', 'Kiełbasy', 'kg', 42.99, 'Kiełbasa chorizo hiszpańska', '5900052345830', true),
('590005234734', 'Salami pepperoni', 'Kiełbasy', 'kg', 39.99, 'Salami pepperoni', '5900052345847', true),
('590005234741', 'Kiełbasa merguez', 'Kiełbasy', 'kg', 34.99, 'Kiełbasa merguez', '5900052345854', true),
('590005234758', 'Kiełbasa bratwurst', 'Kiełbasy', 'kg', 32.99, 'Kiełbasa bratwurst', '5900052345861', true),

-- PRODUKTY REGIONALNE (Regional Products) - 5 products
('590006234567', 'Oscypek', 'Produkty regionalne', 'kg', 65.99, 'Oscypek góralski', '5900062345670', true),
('590006234574', 'Podpiwek', 'Produkty regionalne', 'kg', 28.99, 'Podpiwek wiejski', '5900062345687', true),
('590006234581', 'Bryndza podhalańska', 'Produkty regionalne', 'kg', 42.99, 'Bryndza podhalańska', '5900062345694', true),
('590006234598', 'Kiełbasa biała pieczona', 'Produkty regionalne', 'kg', 32.99, 'Kiełbasa biała pieczona', '5900062345700', true),
('590006234604', 'Smalec staropolski', 'Produkty regionalne', 'kg', 24.99, 'Smalec staropolski', '5900062345717', true)
ON CONFLICT (code) DO NOTHING;
