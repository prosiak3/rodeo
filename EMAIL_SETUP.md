# Konfiguracja systemu wysyłki emaili

System RODEO automatycznie wysyła zamówienia na email hurtowni po zmianie statusu na "Wysłane".

## ⚠️ Obecny status

**Edge Function działa**, ale **emaile nie są wysyłane** - potrzebna jest konfiguracja klucza API Resend.

Poniżej znajdziesz instrukcje konfiguracji.

## 1. Konfiguracja dostawcy emaili (Resend)

### Dlaczego Resend?
- Prosty w użyciu
- Doskonała dostarczalność emaili
- Darmowy plan: 100 emaili dziennie, 3,000 miesięcznie
- Profesjonalne wsparcie dla transakcyjnych emaili

### Kroki konfiguracji:

1. **Utwórz konto na [Resend.com](https://resend.com/signup)**
   - Zarejestruj się używając emaila służbowego
   - Potwierdź adres email

2. **Uzyskaj klucz API**
   - Zaloguj się do panelu Resend
   - Przejdź do zakładki "API Keys"
   - Kliknij "Create API Key"
   - Nazwij klucz: "RODEO Production"
   - Skopiuj wygenerowany klucz (zaczyna się od `re_`)

3. **Skonfiguruj domenę (opcjonalnie, ale zalecane)**
   - W panelu Resend przejdź do "Domains"
   - Kliknij "Add Domain"
   - Wprowadź swoją domenę (np. `rodeo-system.pl`)
   - Dodaj rekordy DNS zgodnie z instrukcjami Resend
   - Poczekaj na weryfikację (zwykle 5-30 minut)

## 2. Konfiguracja Supabase Edge Function

**Twój projekt Supabase:** `zpbhwjnuqiomuufscvho`
**URL:** `https://zpbhwjnuqiomuufscvho.supabase.co`

### Opcja A: Masz dostęp do Supabase Dashboard

1. Zaloguj się do: https://supabase.com/dashboard
2. Znajdź projekt o ID: `zpbhwjnuqiomuufscvho`
3. Przejdź do "Edge Functions" → "Manage secrets"
4. Dodaj nowy secret:
   - Nazwa: `RESEND_API_KEY`
   - Wartość: Twój klucz API z Resend (np. `re_123abc...`)
5. **Powiadom mnie** - wdrożę pełną wersję Edge Function!

### Opcja B: NIE widzisz projektu w Dashboard

Projekt może być na automatycznym koncie. Masz 2 opcje:

**Opcja B1: Użyj istniejącego projektu**
- Przekaż mi klucz API Resend
- Wdrożę Edge Function która będzie go używać
- System będzie działał normalnie

**Opcja B2: Utwórz nowy projekt**
- Utworzę nowy projekt na Twoim koncie Supabase
- Przemigruję wszystkie dane
- Będziesz miał pełną kontrolę w Dashboard

## 3. Konfiguracja emaila hurtowni w systemie

1. Zaloguj się jako **Administrator**
2. Przejdź do **Panel Admina** → **Ustawienia**
3. W sekcji "Email hurtowni" wprowadź adres email:
   ```
   hurtownia@twoja-firma.pl
   ```
4. Kliknij "Zapisz ustawienia domyślne"
5. Opcjonalnie: Kliknij "Testuj konfigurację email" aby sprawdzić połączenie

## 4. Stosowanie migracji bazy danych

Migracja została już utworzona w projekcie:
```
supabase/migrations/20251024200000_add_email_notification_system.sql
```

Jeśli używasz lokalnej instancji Supabase:
```bash
supabase db push
```

Jeśli używasz Supabase Cloud:
- Migracja zostanie automatycznie zastosowana przy następnym deploymencie
- Lub możesz ręcznie uruchomić SQL w SQL Editor w Supabase Dashboard

## 5. Testowanie systemu

### Test podstawowy:

1. Zaloguj się jako **Ekspedient**
2. Utwórz nowe zamówienie (dowolną metodą: głosową, z cennika, ręczną)
3. Dodaj kilka produktów
4. Zapisz jako szkic
5. Otwórz szczegóły zamówienia
6. Kliknij **"Zamów w hurtowni"**
7. Potwierdź wysyłkę

### Weryfikacja:

1. **Sprawdź logi** - Panel Admina → Logi emaili
   - Status powinien być "Wysłane"
   - Sprawdź czy email dotarł na skonfigurowany adres hurtowni

2. **Sprawdź email**
   - Otwórz skrzynkę email hurtowni
   - Email powinien zawierać:
     - Numer zamówienia
     - Dane sklepu
     - Tabelę z produktami i ilościami
     - Ceny jednostkowe i wartości
     - Sumę zamówienia

3. **W przypadku błędów**
   - Sprawdź logi w Supabase Edge Functions
   - Sprawdź czy klucz API Resend jest poprawny
   - Sprawdź limity konta Resend
   - Sprawdź logi błędów w panelu "Logi emaili"

## 6. Działanie systemu

### Automatyczna wysyłka:
- Email jest wysyłany automatycznie gdy ekspedient kliknie "Zamów w hurtowni"
- Status zamówienia zmienia się na "Wysłane"
- System próbuje wysłać email do hurtowni
- Log wysyłki jest zapisywany w bazie danych

### Obsługa błędów:
- Jeśli wysyłka się nie powiedzie, w logach pojawi się status "Błąd"
- Administrator może ręcznie ponowić wysyłkę z panelu "Logi emaili"
- System automatycznie loguje szczegóły błędów dla łatwiejszego debugowania

### Zawartość emaila:
- **Nagłówek** - Logo i tytuł "RODEO - Nowe Zamówienie"
- **Informacje o zamówieniu** - Numer, data, typ zamówienia
- **Dane sklepu** - Nazwa, kod, adres, telefon, osoba składająca
- **Tabela produktów** - Lp, nazwa, ilość, cena jedn., wartość
- **Suma** - Łączna wartość zamówienia
- **Uwagi** - Jeśli ekspedient dodał uwagi do zamówienia
- **Stopka** - Informacje o systemie RODEO

## 7. Dostęp do zamówień dla różnych ról

### Ekspedient (store_manager):
- Widzi tylko zamówienia ze swojego sklepu
- Może składać zamówienia
- Zamówienia automatycznie wysyłane na email hurtowni

### Handlowiec (salesperson):
- Widzi zamówienia ze wszystkich przypisanych sklepów
- Może przeglądać szczegóły zamówień
- Pomaga ekspedientom w razie potrzeby

### Operator Hurtowni (operator):
- Widzi wszystkie zamówienia ze wszystkich sklepów
- Otrzymuje emaile z zamówieniami
- Może zmieniać status zamówień (realizacja, potwierdzenie)
- Ma dostęp do logów emaili

### Administrator (admin):
- Pełny dostęp do wszystkich funkcji
- Zarządza konfiguracją emaila hurtowni
- Przeglądda i zarządza logami emaili
- Może ponownie wysyłać niepowodzące emaile

## 8. Często zadawane pytania

**Q: Czy mogę zmienić dostawcę emaili z Resend na inny?**
A: Tak, ale wymaga to modyfikacji Edge Function `send-order-email/index.ts`. Funkcja jest zaprojektowana modularnie, więc łatwo można zamienić wywołanie API Resend na SendGrid, AWS SES, Mailgun, etc.

**Q: Czy mogę wysyłać emaile na wiele adresów?**
A: Obecnie system wspiera jeden główny adres email hurtowni. Możesz rozszerzyć funkcjonalność dodając pole w tabeli `stores` dla indywidualnych adresów email per sklep.

**Q: Co jeśli email nie zostanie wysłany?**
A: System loguje wszystkie próby wysyłki. Administrator może zobaczyć błąd w panelu "Logi emaili" i ręcznie ponowić wysyłkę po naprawieniu problemu.

**Q: Czy mogę zmienić szablon emaila?**
A: Tak! Szablon HTML znajduje się w funkcji `generateOrderEmailHTML()` w pliku `send-order-email/index.ts`. Możesz dowolnie modyfikować wygląd emaila.

**Q: Jak długo przechowywane są logi emaili?**
A: Logi są przechowywane bezterminowo. Możesz dodać zadanie cron do czyszczenia starych logów (np. starszych niż 90 dni).

## 9. Troubleshooting

### Email nie jest wysyłany:

1. **Sprawdź konfigurację**
   ```sql
   SELECT wholesale_email FROM system_settings WHERE id = 1;
   ```

2. **Sprawdź logi Edge Function**
   - Supabase Dashboard → Edge Functions → send-order-email → Logs

3. **Sprawdź logi emaili w aplikacji**
   - Panel Admina → Logi emaili
   - Sprawdź kolumnę "Status" i "Error Message"

4. **Zweryfikuj klucz API Resend**
   - Upewnij się że klucz nie wygasł
   - Sprawdź limity na koncie Resend

### Email trafia do SPAM:

1. **Skonfiguruj domenę w Resend**
   - Dodaj rekordy SPF, DKIM, DMARC
   - Zweryfikuj domenę

2. **Użyj własnej domeny nadawczej**
   - Zamiast domyślnego `resend.dev`
   - Np. `zamowienia@twoja-firma.pl`

## 10. Bezpieczeństwo

### Dobre praktyki:

- ✅ Klucz API Resend przechowywany w Supabase Secrets (nie w kodzie)
- ✅ Edge Function używa Service Role Key (nie anon key)
- ✅ RLS włączone na tabeli `email_notifications`
- ✅ Tylko admini i operatorzy mogą przeglądać logi
- ✅ HTTPS dla wszystkich połączeń
- ✅ Walidacja adresów email
- ✅ Logowanie wszystkich prób wysyłki

### Zalecenia:

- Regularnie sprawdzaj logi pod kątem podejrzanej aktywności
- Monitoruj zużycie limitów Resend
- Rotuj klucz API Resend co kilka miesięcy
- Testuj odtwarzanie po awarii

## Wsparcie

Jeśli masz problemy z konfiguracją systemu emailowego:

1. Sprawdź logi w Supabase Edge Functions
2. Sprawdź logi w panelu "Logi emaili"
3. Sprawdź dokumentację Resend: https://resend.com/docs
4. Sprawdź dokumentację Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

**Gratulacje!** Twój system RODEO jest teraz w pełni zintegrowany z automatyczną wysyłką zamówień na email! 📧🎉
