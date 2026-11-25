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

- Sessions, duration, results, and history are stored by the backend. In connected mode the frontend also sends elbow-angle, phase, pose-confidence, and repetition metrics.
- Camera and uploaded video stay in the browser. MediaPipe Pose Landmarker tracks the elbow angle locally; the live repetition counter uses fixed angle thresholds.
- The `Complete` / `Incomplete` sequence classifier is not yet connected to the live session flow. See [ml/README.md](ml/README.md) for the dataset training and held-out evaluation pipeline.
- AI assessment uses saved motion metrics only. It is a technical prototype, not a medical assessment or validated classifier.
- See [frontend API contract](frontend/FRONTEND_API_CONTRACT.md) for the connected endpoints and remaining integration work.

## E02 dataset evaluation

The supplied `An upper limb stroke rehabilitation exercise video` dataset can be used to evaluate the elbow-extension exercise. Setup and reproducible training/evaluation commands are in [ml/README.md](ml/README.md). The report compares the angle-threshold cycle baseline with a sequence-based classifier on the dataset's held-out `Test` videos.
