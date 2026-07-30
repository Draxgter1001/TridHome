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
- [ ] **Week 2** — calendario visite (richiesta → conferma → notifica), recensioni ★,
      preferiti, landing con hero video reale, port completo di PropertyForm.
- [ ] **Week 3** — dashboard agenzia, pop-up feedback, upload documenti da UI,
      export feedback, hardening produzione.

## Note

- Hero video: mettere il file in `client/public/media/hero.mp4` (la landing ha già lo slot).
- Palette: due verdi placeholder in `client/tailwind.config.js` (`#1B4332`/`#74C69D`) —
  da sostituire coi valori definitivi.
- Google OAuth: impostare `GOOGLE_OAUTH_CLIENT_ID` (endpoint già pronto su `/api/auth/google/`).
