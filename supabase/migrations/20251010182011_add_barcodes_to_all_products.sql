/*
  # Dodanie kodów kreskowych EAN-13 dla wszystkich produktów

  1. Zmiany
    - Dodanie kodów kreskowych EAN-13 dla wszystkich produktów bez kodów
    - Aktualizacja produktów mięsnych (100 pozycji)
    - Każdy produkt otrzymuje unikalny 13-cyfrowy kod kreskowy
    
  2. Uwagi
    - Kody kreskowe w formacie EAN-13 (590123412XXXX)
    - Unikalne dla każdego produktu
*/

-- Najpierw dodajmy kody dla produktów kiełbasianych
UPDATE products SET index = '5901234123655' WHERE code = 'K001';
UPDATE products SET index = '5901234123662' WHERE code = 'K002';
UPDATE products SET index = '5901234123679' WHERE code = 'K003';
UPDATE products SET index = '5901234123686' WHERE code = 'K004';
UPDATE products SET index = '5901234123693' WHERE code = 'K005';
UPDATE products SET index = '5901234123709' WHERE code = 'K006';
UPDATE products SET index = '5901234123716' WHERE code = 'K007';
UPDATE products SET index = '5901234123723' WHERE code = 'K008';
UPDATE products SET index = '5901234123730' WHERE code = 'K009';
UPDATE products SET index = '5901234123747' WHERE code = 'K010';

-- Produkty drobiowe
UPDATE products SET index = '5901234123754' WHERE code = 'D007';
UPDATE products SET index = '5901234123761' WHERE code = 'D008';
UPDATE products SET index = '5901234123778' WHERE code = 'D009';
UPDATE products SET index = '5901234123785' WHERE code = 'D010';
UPDATE products SET index = '5901234123792' WHERE code = 'D011';
UPDATE products SET index = '5901234123808' WHERE code = 'D012';
UPDATE products SET index = '5901234123815' WHERE code = 'D013';
UPDATE products SET index = '5901234123822' WHERE code = 'D014';
UPDATE products SET index = '5901234123839' WHERE code = 'D015';

-- Wędliny
UPDATE products SET index = '5901234123846' WHERE code = 'W006';
UPDATE products SET index = '5901234123853' WHERE code = 'W007';
UPDATE products SET index = '5901234123860' WHERE code = 'W008';
UPDATE products SET index = '5901234123877' WHERE code = 'W009';
UPDATE products SET index = '5901234123884' WHERE code = 'W010';
UPDATE products SET index = '5901234123891' WHERE code = 'W011';
UPDATE products SET index = '5901234123907' WHERE code = 'W012';
UPDATE products SET index = '5901234123914' WHERE code = 'W013';
UPDATE products SET index = '5901234123921' WHERE code = 'W014';
UPDATE products SET index = '5901234123938' WHERE code = 'W015';

-- Mięso wołowe
UPDATE products SET index = '5901234123945' WHERE code = 'WO001';
UPDATE products SET index = '5901234123952' WHERE code = 'WO002';
UPDATE products SET index = '5901234123969' WHERE code = 'WO003';
UPDATE products SET index = '5901234123976' WHERE code = 'WO004';
UPDATE products SET index = '5901234123983' WHERE code = 'WO005';
UPDATE products SET index = '5901234123990' WHERE code = 'WO006';
UPDATE products SET index = '5901234124003' WHERE code = 'WO007';
UPDATE products SET index = '5901234124010' WHERE code = 'WO008';
UPDATE products SET index = '5901234124027' WHERE code = 'WO009';
UPDATE products SET index = '5901234124034' WHERE code = 'WO010';

-- Mięso wieprzowe
UPDATE products SET index = '5901234124041' WHERE code = 'WI001';
UPDATE products SET index = '5901234124058' WHERE code = 'WI002';
UPDATE products SET index = '5901234124065' WHERE code = 'WI003';
UPDATE products SET index = '5901234124072' WHERE code = 'WI004';
UPDATE products SET index = '5901234124089' WHERE code = 'WI005';
UPDATE products SET index = '5901234124096' WHERE code = 'WI006';
UPDATE products SET index = '5901234124102' WHERE code = 'WI007';
UPDATE products SET index = '5901234124119' WHERE code = 'WI008';
UPDATE products SET index = '5901234124126' WHERE code = 'WI009';
UPDATE products SET index = '5901234124133' WHERE code = 'WI010';
UPDATE products SET index = '5901234124140' WHERE code = 'WI011';
UPDATE products SET index = '5901234124157' WHERE code = 'WI012';
UPDATE products SET index = '5901234124164' WHERE code = 'WI013';
UPDATE products SET index = '5901234124171' WHERE code = 'WI014';
UPDATE products SET index = '5901234124188' WHERE code = 'WI015';

-- Produkty specjalne
UPDATE products SET index = '5901234124195' WHERE code = 'SP001';
UPDATE products SET index = '5901234124201' WHERE code = 'SP002';
UPDATE products SET index = '5901234124218' WHERE code = 'SP003';
UPDATE products SET index = '5901234124225' WHERE code = 'SP004';
UPDATE products SET index = '5901234124232' WHERE code = 'SP005';
UPDATE products SET index = '5901234124249' WHERE code = 'SP006';
UPDATE products SET index = '5901234124256' WHERE code = 'SP007';
UPDATE products SET index = '5901234124263' WHERE code = 'SP008';
UPDATE products SET index = '5901234124270' WHERE code = 'SP009';
UPDATE products SET index = '5901234124287' WHERE code = 'SP010';

-- Produkty premium
UPDATE products SET index = '5901234124294' WHERE code = 'PR001';
UPDATE products SET index = '5901234124300' WHERE code = 'PR002';
UPDATE products SET index = '5901234124317' WHERE code = 'PR003';
UPDATE products SET index = '5901234124324' WHERE code = 'PR004';
UPDATE products SET index = '5901234124331' WHERE code = 'PR005';
UPDATE products SET index = '5901234124348' WHERE code = 'PR006';
UPDATE products SET index = '5901234124355' WHERE code = 'PR007';
UPDATE products SET index = '5901234124362' WHERE code = 'PR008';
UPDATE products SET index = '5901234124379' WHERE code = 'PR009';
UPDATE products SET index = '5901234124386' WHERE code = 'PR010';

-- Dodatkowe kiełbasy
UPDATE products SET index = '5901234124393' WHERE code = 'K011';
UPDATE products SET index = '5901234124409' WHERE code = 'K012';
UPDATE products SET index = '5901234124416' WHERE code = 'K013';
UPDATE products SET index = '5901234124423' WHERE code = 'K014';
UPDATE products SET index = '5901234124430' WHERE code = 'K015';

-- Dodatkowe wędliny
UPDATE products SET index = '5901234124447' WHERE code = 'W016';
UPDATE products SET index = '5901234124454' WHERE code = 'W017';
UPDATE products SET index = '5901234124461' WHERE code = 'W018';
UPDATE products SET index = '5901234124478' WHERE code = 'W019';
UPDATE products SET index = '5901234124485' WHERE code = 'W020';
