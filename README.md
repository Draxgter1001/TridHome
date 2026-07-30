# TridHome — Alpha

Piattaforma immobiliare: acquirenti, venditori privati e agenzie verificate.
Monorepo: `client/` (React + Vite + Tailwind) · `server/` (Django + DRF).
Piano completo: `docs/MIGRATION_PLAN.md`.

## Demo con Docker (per la presentazione)

```bash
docker compose up --build
```

- Sito: http://localhost:8080 — già popolato con 10 annunci demo su Roma
- Admin: http://localhost:8080/admin/ (crea prima un superuser, sotto)
- Account demo: `agenzia@tridhome.demo` / `demo1234` (agenzia verificata),
  `privato1@tridhome.demo` / `demo1234`

Superuser per l'admin (approvazione documenti "Verificato"):

```bash
docker compose exec server python manage.py createsuperuser
```

## Sviluppo locale (senza Docker)

Backend:
```bash
cd server
pip install -r requirements/base.txt
python manage.py migrate && python manage.py seed_demo
python manage.py runserver          # http://localhost:8000
```

Frontend:
```bash
cd client
npm install
npm run dev                          # http://localhost:5173 (proxy /api → :8000)
```

## Stato Alpha (week-by-week)

- [x] **Week 1** — scaffold pulito, custom User (privato/agenzia), AgencyProfile,
      VerificationDocument + approvazione da admin, Listing unificato
      (ex Property+Advert), filtri/ricerca, auth JWT + registrazione con ruolo,
      seed demo, Docker.
- [x] **Week 2** — calendario visite completo (disponibilità del venditore →
      richiesta con messaggio → conferma/rifiuto con un click → notifica in-app),
      recensioni ★ su privati e agenzie con media sul profilo, preferiti
      (case + agenzie) con pagina dedicata, campanella notifiche, sell flow
      a 4 passaggi (port di PropertyForm), pagina "Le mie visite".
- [x] **Week 3** — **Trid, l'agente AI, funzionante** (vedi sotto), dashboard
      profilo/agenzia, pop-up feedback + `manage.py export_feedback`, upload
      documenti di verifica da UI, upload foto reali negli annunci,
      rate limiting sulle API pubbliche.

## Trid — l'agente AI (il cuore del prodotto)

Trid è il bottone in basso a **sinistra** su ogni pagina. Cerca casa in linguaggio
naturale e risponde con **annunci reali dal database**, mostrati come schede
cliccabili che portano dritte al calendario visite.

**Tre motori, selezione automatica** (`TRID_AI_PROVIDER=auto` sceglie in base
alla chiave presente; puoi forzare con `gemini` / `anthropic` / `fallback`):

1. **Google Gemini — GRATIS per la demo.** Crea una chiave su
   https://aistudio.google.com (nessuna carta di credito richiesta), mettila in
   un file `.env` accanto a `docker-compose.yml`:
   ```
   GEMINI_API_KEY=AIza...
   ```
   e rilancia `docker compose up`. Modello di default `gemini-3.5-flash`
   (piano gratuito). Google ritira i modelli Gemini di frequente: se ricevi un
   404 sul modello, scopri quelli disponibili per la tua chiave con
   `docker compose exec server python manage.py trid_test --list-models`
   e imposta `TRID_AI_MODEL=<nome>` nel `.env`. Trid usa il function calling
   di Gemini: il modello decide
   quando chiamare `search_listings`, che interroga il DB vero. Nota: il piano
   gratuito ha limiti di richieste al minuto — più che sufficienti per una
   presentazione dal vivo.
2. **Claude (Anthropic)** — a pagamento, qualità di conversazione superiore
   quando vorrete passare in produzione. `ANTHROPIC_API_KEY=sk-ant-...`,
   modello di default `claude-haiku-4-5` (economico), oppure
   `TRID_AI_MODEL=claude-sonnet-4-6`. Chiavi: https://platform.claude.com
3. **Fallback deterministico** — senza alcuna chiave, un parser in italiano
   estrae contratto, zona, budget, locali e categoria dalla frase e cerca nel
   DB. La demo funziona quindi anche a costo zero e offline.

**Robustezza:** se il provider configurato fallisce (chiave scaduta, limite
raggiunto, rete assente), Trid degrada automaticamente al fallback nella stessa
richiesta — la demo non si rompe mai. Le API di Trid sono inoltre rate-limited
lato nostro (15 req/min per IP anonimo), così nessuno può bruciare la quota.

Prompt da usare davanti agli investitori:
- "Un trilocale in affitto a Trastevere sotto i 1.500€" → 1 risultato reale
- "Vorrei comprare una villa vicino Roma" → schede cliccabili
- poi clic sulla scheda → calendario → prenota la visita. Cerchio chiuso.

### Demo flow consigliato per gli investitori (2 minuti)

1. Login come `privato1@tridhome.demo` → cerca casa → cuore su un annuncio →
   apri l'annuncio → prenota una visita con messaggio.
2. Logout, login come `agenzia@tridhome.demo` → campanella: nuova richiesta →
   "Le mie visite" → **Conferma** con un click.
3. Logout, login di nuovo come privato → campanella: **Visita confermata**.
   Fine: nessuna telefonata, come da promessa della landing.
4. Bonus: apri **Trid** (in basso a sinistra) e chiedi
   "un trilocale in affitto a Trastevere sotto i 1.500€" → scheda reale →
   clic → prenoti. L'AI che vende il prodotto da sola.

Esporta i feedback del pop-up:
```bash
docker compose exec server python manage.py export_feedback
```

## Note

- Hero video: mettere il file in `client/public/media/hero.mp4` (la landing ha già lo slot).
- Palette: due verdi placeholder in `client/tailwind.config.js` (`#1B4332`/`#74C69D`) —
  da sostituire coi valori definitivi.
- Google OAuth: impostare `GOOGLE_OAUTH_CLIENT_ID` (endpoint già pronto su `/api/auth/google/`).
