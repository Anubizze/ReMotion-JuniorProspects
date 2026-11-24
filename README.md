# ReMotion / SerIQ rehabilitation prototype

The repository contains a Next.js frontend and an independent NestJS API. The frontend uses the API for starting and finishing training sessions, results, session history, and optional AI assessment.

## Run locally

Requirements: Node.js 20+ and npm. Run the API and frontend in separate terminals.

### Backend

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run start:dev
```

The API is at `http://localhost:8000`; Swagger is at `http://localhost:8000/docs`. To enable AI assessment, put an OpenAI API key in `backend/.env` as `OPENAI_API_KEY=...`. Keep this file local; it is ignored by Git.

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000/ru` (Kazakh is available at `/kk`). The frontend connects to the API using `NEXT_PUBLIC_API_URL`; `NEXT_PUBLIC_DEMO_MODE=false` enables the connected flow.

## Current integration limits

- Sessions, duration, results, and history are stored by the backend.
- Camera and uploaded video stay in the browser. The current frontend does not yet run pose estimation or count repetitions, so it sends zero repetitions and no angles. Session analysis will return `InsufficientData` until pose metrics are produced and posted.
- AI assessment uses saved motion metrics only. It is a technical prototype, not a medical assessment or validated classifier.
- See [frontend API contract](frontend/FRONTEND_API_CONTRACT.md) for the connected endpoints and remaining pose-estimation work.
