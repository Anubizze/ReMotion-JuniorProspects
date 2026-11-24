# ReMotion frontend

Next.js frontend for the ReMotion home rehabilitation prototype. The current implementation is frontend-only and keeps all demo analysis clearly labeled.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Install dependencies with `npm install`.
3. Start development mode with `npm run dev`.
4. Open `http://localhost:3000`; the default locale is Russian. Kazakh is available from the header switch.

Production checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Routes

- `/ru` and `/kk` — home.
- `/[locale]/session/prepare` — camera or video setup.
- `/[locale]/session/active` — active session surface and backend-ready analysis states.
- `/[locale]/session/results` — explicitly labeled demo summary and chart.
- `/[locale]/history` — local summary history.
- `/[locale]/technology` — ML integration scheme and metric availability.

## Data and privacy

Camera access starts only after a user action. The app stops media tracks when a session ends or a media source is replaced. Uploaded video uses a browser object URL and is not automatically saved. Session summaries are saved only after the user presses the save button and remain in `localStorage` on that browser.

The provisional integration data is documented in `FRONTEND_API_CONTRACT.md`. API paths and transport must be agreed with the backend developer before production integration.
