# RODEO - Instrukcje Deploymentu

## Vercel (Polecane - Najprostsze)

### Przez GitHub (Automatyczny)

1. **Utwórz repozytorium GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TWOJA_NAZWA/rodeo.git
   git push -u origin main
   ```

2. **Deploy na Vercel:**
   - Wejdź na https://vercel.com
   - Zaloguj się przez GitHub
   - Kliknij "Add New" → "Project"
   - Wybierz swoje repozytorium "rodeo"
   - Kliknij "Import"

3. **Konfiguracja:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Zmienne środowiskowe:**
   - Kliknij "Environment Variables"
   - Dodaj:
     - `VITE_SUPABASE_URL` = twój URL z .env
     - `VITE_SUPABASE_ANON_KEY` = twój klucz z .env
   - Kliknij "Deploy"

5. **Gotowe!**
   - Aplikacja będzie dostępna na: `https://rodeo-xxxx.vercel.app`
   - Każdy push do main = automatyczny redeploy

### Przez CLI

```bash
# Instalacja Vercel CLI
npm i -g vercel

# Deploy
vercel

# Dodaj zmienne środowiskowe
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy produkcyjny
vercel --prod
```

---

## Netlify

### Przez GitHub (Automatyczny)

1. **Utwórz repozytorium GitHub** (jak wyżej)

2. **Deploy na Netlify:**
   - Wejdź na https://netlify.com
   - Zaloguj się przez GitHub
   - Kliknij "Add new site" → "Import an existing project"
   - Wybierz "Deploy with GitHub"
   - Wybierz repozytorium "rodeo"

3. **Konfiguracja:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Kliknij "Show advanced" → "New variable"

4. **Zmienne środowiskowe:**
   - `VITE_SUPABASE_URL` = twój URL
   - `VITE_SUPABASE_ANON_KEY` = twój klucz
   - Kliknij "Deploy site"

5. **Przekierowania (opcjonalne):**
   - Netlify automatycznie używa pliku `dist/_redirects`
   - Jest już skonfigurowany w projekcie

6. **Gotowe!**
   - Aplikacja będzie na: `https://random-name-xxxx.netlify.app`
   - Możesz zmienić nazwę w ustawieniach

### Przez CLI

```bash
# Instalacja Netlify CLI
npm install -g netlify-cli

# Logowanie
netlify login

# Inicjalizacja i deploy
netlify init

# Deploy produkcyjny
netlify deploy --prod
```

### Przez Drag & Drop (Najprostsze!)

1. Zbuduj projekt lokalnie:
   ```bash
   npm run build
   ```

2. Wejdź na https://app.netlify.com/drop

3. Przeciągnij folder `dist` na stronę

4. Po wgraniu kliknij "Site settings" → "Environment variables"

5. Dodaj zmienne środowiskowe i redeploy

---

## Railway

### Przez GitHub

1. **Utwórz repozytorium GitHub** (jak wyżej)

2. **Deploy na Railway:**
   - Wejdź na https://railway.app
   - Zaloguj się przez GitHub
   - Kliknij "New Project"
   - Wybierz "Deploy from GitHub repo"
   - Wybierz repozytorium "rodeo"

3. **Konfiguracja:**
   - Railway automatycznie wykryje Vite
   - Ustaw zmienne środowiskowe:
     - Przejdź do zakładki "Variables"
     - Dodaj:
       - `VITE_SUPABASE_URL`
       - `VITE_SUPABASE_ANON_KEY`

4. **Konfiguracja buildu (automatyczna):**
   - Build Command: `npm run build`
   - Start Command: `npm run preview`

5. **Utwórz plik `railway.json` (opcjonalnie):**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm run build"
     },
     "deploy": {
       "startCommand": "npm run preview",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

6. **Gotowe!**
   - Aplikacja będzie na: `https://rodeo-production.up.railway.app`

### Przez CLI

```bash
# Instalacja Railway CLI
npm i -g @railway/cli

# Logowanie
railway login

# Inicjalizacja
railway init

# Link z projektem
railway link

# Dodaj zmienne
railway variables set VITE_SUPABASE_URL="your-url"
railway variables set VITE_SUPABASE_ANON_KEY="your-key"

# Deploy
railway up
```

---

## Render

### Przez GitHub

1. **Utwórz repozytorium GitHub** (jak wyżej)

2. **Deploy na Render:**
   - Wejdź na https://render.com
   - Zaloguj się przez GitHub
   - Kliknij "New" → "Static Site"
   - Połącz z GitHub i wybierz repozytorium

3. **Konfiguracja:**
   - Name: `rodeo`
   - Build Command: `npm run build`
   - Publish Directory: `dist`

4. **Zmienne środowiskowe:**
   - Kliknij "Environment"
   - Dodaj:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Advanced (opcjonalne):**
   - Auto-Deploy: Yes
   - Branch: main

6. **Gotowe!**
   - Aplikacja będzie na: `https://rodeo.onrender.com`

### Ręczny deploy

```bash
# Zbuduj projekt
npm run build

# Zainstaluj Render CLI
npm install -g @render/cli

# Logowanie
render login

# Deploy
render deploy
```

---

## Porównanie Platform

| Platforma | Darmowy Plan | Custom Domain | Auto Deploy | Szybkość | Łatwość |
|-----------|--------------|---------------|-------------|----------|---------|
| **Vercel** | ✅ Unlimited | ✅ Tak | ✅ Tak | ⚡ Bardzo szybka | ⭐⭐⭐⭐⭐ |
| **Netlify** | ✅ 100GB/mies | ✅ Tak | ✅ Tak | ⚡ Bardzo szybka | ⭐⭐⭐⭐⭐ |
| **Railway** | ✅ $5/mies | ✅ Tak | ✅ Tak | ⚡ Szybka | ⭐⭐⭐⭐ |
| **Render** | ✅ Unlimited | ✅ Tak | ✅ Tak | 🐌 Wolniejsza | ⭐⭐⭐⭐ |

## Zalecenia

### Najlepsze dla produkcji:
- **Vercel** lub **Netlify** - profesjonalne, szybkie, łatwe w konfiguracji

### Najlepsze dla testów:
- **Netlify Drag & Drop** - deploy w 30 sekund bez konta GitHub

### Najlepsze dla full-stack (gdyby były Edge Functions):
- **Vercel** - najlepsza integracja z Serverless Functions

---

## Rozwiązywanie Problemów

### Build się nie udaje

```bash
# Sprawdź lokalnie
npm run build
npm run preview

# Jeśli działa lokalnie, sprawdź:
# 1. Czy zmienne środowiskowe są ustawione na platformie
# 2. Czy używasz Node.js 18+
# 3. Czy package-lock.json jest w repo
```

### Biały ekran po deploy

1. Sprawdź konsole w przeglądarce (F12)
2. Najprawdopodobniej brakuje zmiennych środowiskowych
3. Dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
4. Redeploy aplikacji

### Routing nie działa (404 na refresh)

**Vercel:** Utwórz `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify:** Już jest `dist/_redirects` (nie musisz nic robić)

**Render:** Utwórz `render.yaml`:
```yaml
services:
  - type: web
    name: rodeo
    env: static
    buildCommand: npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### CORS errors

- Sprawdź czy Supabase URL jest poprawny
- Sprawdź czy Supabase anon key jest poprawny
- Upewnij się, że zmienne zaczynają się od `VITE_`

---

## Własna Domena

### Vercel
1. Settings → Domains → Add Domain
2. Wprowadź domenę (np. `rodeo.twojafirma.pl`)
3. Dodaj rekord DNS u swojego providera:
   - Type: `CNAME`
   - Name: `rodeo` (lub `@` dla root)
   - Value: `cname.vercel-dns.com`

### Netlify
1. Domain settings → Add custom domain
2. Wprowadź domenę
3. Dodaj rekord DNS:
   - Type: `CNAME`
   - Name: `rodeo`
   - Value: Twoja nazwa netlify (np. `rodeo.netlify.app`)

### Railway / Render
- Podobnie - w ustawieniach projektu znajdziesz opcję custom domain

---

## Monitoring i Analityka

### Vercel Analytics (Darmowe)
```bash
npm install @vercel/analytics
```

W `src/main.tsx`:
```typescript
import { inject } from '@vercel/analytics';
inject();
```

### Gotowe! 🚀

Wybierz platformę, wykonaj kroki i aplikacja będzie online w kilka minut!
