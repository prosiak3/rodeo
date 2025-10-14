# Inteligentne Dopasowywanie Produktów - Dokumentacja AI

## Przegląd

Aplikacja RODEO została rozszerzona o lokalny silnik AI, który znacząco poprawia dopasowywanie nazw produktów podczas dyktowania zamówień głosowych.

## Jak to działa?

### Embeddingi - co to jest?

**Embeddingi** to matematyczna reprezentacja znaczenia słów i nazw produktów. System AI przekształca każdą nazwę produktu w zestaw liczb (384 liczby), które reprezentują jej znaczenie.

#### Przykład:
- "Schab wieprzowy" → `[0.23, -0.15, 0.89, ...]` (384 liczby)
- "Kiełbasa krakowska" → `[0.71, 0.32, -0.45, ...]` (384 liczby)

Gdy ekspedient podyktuje "schab", AI porównuje znaczenie tego słowa ze wszystkimi produktami i znajduje najlepsze dopasowanie.

## Zalety AI w praktyce

### 1. Tolerancja na błędy

**Bez AI:**
- "schaab" → NIE ZNAJDZIE ❌
- "kielbasza" → NIE ZNAJDZIE ❌

**Z AI:**
- "schaab" → "Schab wieprzowy" (90% pewności) ✅
- "kielbasza" → "Kiełbasa krakowska" (88% pewności) ✅

### 2. Różne warianty nazw

**Bez AI:**
- "kiełbaska" → NIE ZNAJDZIE ❌
- "szaszłyki" → NIE ZNAJDZIE ❌

**Z AI:**
- "kiełbaska" → "Kiełbasa" (92% pewności) ✅
- "szaszłyki" → "Szaszłyk wieprzowy" (95% pewności) ✅

### 3. Błędy rozpoznawania mowy

System rozpoznawania mowy nie jest idealny. AI kompensuje te błędy:
- "szab" zamiast "schab" → AI znajdzie "Schab"
- "kielasa" zamiast "kiełbasa" → AI znajdzie "Kiełbasa"

## Technologia

### Model AI
- **Nazwa:** all-MiniLM-L6-v2
- **Rozmiar:** ~23-25 MB (jednorazowe pobranie)
- **Platforma:** Transformers.js (działa offline w przeglądarce)

### Gdzie działa?
- ✅ Chrome (Android, Desktop)
- ✅ Edge (Android, Desktop)
- ✅ Safari (iOS 16+, macOS)
- ✅ Firefox (Desktop)

### Przechowywanie danych

1. **Model AI:** Cache'owany przez Service Worker (automatyczne)
2. **Embeddingi produktów:** IndexedDB (lokalnie na telefonie)
3. **Brak połączenia z internetem:** Wszystko działa offline

## Proces działania

### Pierwsze uruchomienie (jednorazowo):

1. **Ładowanie modelu AI** (~10-20 sekund)
   - Model pobierany z CDN (~25 MB)
   - Cache'owany na zawsze w przeglądarce

2. **Generowanie embeddingów** (~5-10 sekund dla 500 produktów)
   - Dla każdego produktu generowany jest embedding
   - Zapisywane w IndexedDB na telefonie

### Każde kolejne użycie (szybkie):

1. **Ekspedient dyktuje:** "3 kg schab"
2. **AI generuje embedding** (~10ms)
3. **Porównanie z produktami** (~50ms)
4. **Wynik:** "Schab wieprzowy" (95% pewności) ✅

**Całkowity czas:** ~60-100ms (szybciej niż API zdalne!)

## Wskaźniki pewności (confidence)

AI pokazuje procent pewności dopasowania:

- **95-100%** → Bardzo pewne dopasowanie (zazwyczaj automatycznie akceptowane)
- **85-94%** → Pewne dopasowanie (automatycznie akceptowane)
- **70-84%** → Sugestie do wyboru (wymaga potwierdzenia)
- **< 70%** → Słabe dopasowanie (nie pokazywane)

## Interfejs użytkownika

### Wskaźniki w zamówieniach:

1. **Zielony znaczek:** Ręczne dopasowanie (100% pewności)
   ```
   ✓ Dopasowano
   ```

2. **Niebieski znaczek z ikoną AI:** Dopasowanie przez AI
   ```
   ✨ AI 92%
   ```

3. **Żółty znaczek:** Nie znaleziono - zobacz sugestie
   ```
   ⚠️ Nie znaleziono - 78% pewności
   ```

### Status AI:

**Ładowanie:**
```
✨ Ładowanie AI...
Przygotowuję inteligentne dopasowywanie produktów
```

**Gotowy:**
```
✨ AI gotowe - inteligentne dopasowywanie produktów włączone
```

## Zarządzanie pamięcią

### Czyszczenie cache AI

Jeśli AI nie działa prawidłowo:

1. Przejdź do **Profil**
2. Znajdź sekcję **"Inteligentne dopasowywanie AI"**
3. Kliknij **"Wyczyść pamięć podręczną AI"**
4. Potwierdź operację

Model zostanie ponownie pobrany przy następnym użyciu (~25 MB).

### Zużycie pamięci:

- **Model AI:** ~25 MB (w cache przeglądarki)
- **Embeddingi produktów:** ~2-5 MB (w IndexedDB)
- **Razem:** ~30 MB na telefonie

## Fallback (zapasowy system)

Jeśli AI nie jest dostępne (np. stara przeglądarka), aplikacja automatycznie używa klasycznego dopasowania tekstowego.

System sprawdza:
1. Wsparcie dla WebAssembly
2. Dostępność modelu
3. Pamięć telefonu

Jeśli coś nie działa → fallback do klasycznego wyszukiwania.

## Bezpieczeństwo i prywatność

✅ **100% offline** - wszystko działa lokalnie na telefonie
✅ **Zero danych wysyłanych** - żadne dane nie są wysyłane do zewnętrznych serwerów
✅ **Prywatność gwarantowana** - nazwy produktów nigdy nie opuszczają telefonu
✅ **Bez śledzenia** - brak analityki, brak cookies trzecich stron

## Wydajność

### Pierwsze uruchomienie:
- Ładowanie modelu: 10-20 sekund
- Generowanie embeddingów: 5-10 sekund
- **Jednorazowo** - potem działa błyskawicznie

### Codzienne użycie:
- Dopasowanie produktu: < 100 ms
- Szybciej niż API zdalne (brak opóźnienia sieci)

### Zużycie baterii:
- Minimalne - AI używa WebAssembly (bardzo wydajne)
- Model działa lokalnie (brak połączeń sieciowych)

## FAQ

### Q: Czy potrzebuję internetu?
**A:** Nie! Tylko przy pierwszym uruchomieniu (pobranie modelu ~25MB). Później wszystko działa offline.

### Q: Czy AI działa na każdym telefonie?
**A:** Tak, na większości nowoczesnych telefonów (iOS 16+, Android z Chrome/Edge).

### Q: Co jeśli AI się pomyli?
**A:** Zawsze możesz wybrać inny produkt z listy sugestii lub podyktować ponownie.

### Q: Czy AI uczy się z moich wyborów?
**A:** Obecnie nie, ale ta funkcja jest planowana w przyszłości.

### Q: Czy mogę wyłączyć AI?
**A:** Tak, w ustawieniach profilu możesz wyłączyć zamówienia głosowe lub wyczyścić cache AI.

## Wsparcie techniczne

W razie problemów:

1. Sprawdź czy używasz Chrome/Edge
2. Wyczyść cache AI w profilu
3. Odśwież aplikację (F5)
4. Sprawdź wolną pamięć na telefonie (min. 100 MB)

## Przyszłe ulepszenia (planowane)

- 📊 Uczenie się z wyborów użytkowników
- 🔄 Automatyczna aktualizacja embeddingów przy zmianach cennika
- 📈 Dashboard z metrykami dokładności AI
- 🎯 Personalizowane sugestie dla każdego ekspedienta
- 🌐 Synchronizacja "uczenia" między użytkownikami

---

**Wersja dokumentacji:** 1.0
**Data ostatniej aktualizacji:** 2025-10-14
