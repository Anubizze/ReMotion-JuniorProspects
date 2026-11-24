# ReMotion frontend

Next.js frontend for the ReMotion home rehabilitation prototype. It connects to the NestJS backend for session lifecycle, saved results, history, and on-demand AI assessment.

## Run locally

1. Start the backend first, following the repository root README.
2. Copy `.env.example` to `.env.local`.
3. Install packages with `npm ci` and start with `npm run dev`.
4. Open `http://localhost:3000/ru`; Kazakh is available at `/kk`.

`NEXT_PUBLIC_API_URL` sets the backend origin. Set `NEXT_PUBLIC_DEMO_MODE=true` to show the explicitly labeled local demo UI. The checked-in environment example enables backend mode.

## Routes

- `/ru` and `/kk` — home.
- `/[locale]/session/prepare` — camera or local video setup.
- `/[locale]/session/active` — session playback, timer, and backend session creation/finish.
- `/[locale]/session/results` — stored result and optional AI assessment.
- `/[locale]/history` — session history from the backend.
- `/[locale]/technology` — ML integration notes and available model metrics.

## Current limits

Camera video and selected files remain in the browser. Pose estimation and repetition counting are not implemented in this frontend yet, so current backend sessions contain duration but no movement metrics. See `FRONTEND_API_CONTRACT.md` for the API schema and integration status.
