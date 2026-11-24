# SerIQ API (NestJS)

Backend-only REST API for the SerIQ home rehabilitation module. Built with NestJS, TypeORM and SQLite; it has no dependency on the frontend or an authentication provider. Pose detection and camera processing can remain in the browser, while the client submits session metrics here.

## Run locally

Requirements: Node.js 20+ and npm.

```powershell
cd backend
Copy-Item .env.example .env
# Add your OpenAI API key to backend/.env as OPENAI_API_KEY=...
npm install
npm run start:dev
```

The API listens on `http://localhost:8000`; Swagger documentation is available at `http://localhost:8000/docs`. SQLite database defaults to `backend/seriq.sqlite`. Set `DATABASE_PATH` to change it. Configure allowed frontend origins in `CORS_ORIGINS` as a comma-separated list.

For a production build, run `npm run build` then `npm run start:prod` from `backend`.

## API

All routes are prefixed with `/api`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API status |
| GET | `/api/exercises` | List supported exercises |
| GET | `/api/exercises/:exerciseId` | Exercise details |
| GET | `/api/lessons/:lessonId` | Lesson metadata |
| POST | `/api/sessions/start` | Create a session (`{"exercise_id":"elbow-extension"}`) |
| POST | `/api/sessions/:sessionId/metrics` | Save current reps, elbow angle, phase and confidence |
| POST | `/api/sessions/:sessionId/finish` | Finish and store summary |
| POST | `/api/sessions/:sessionId/analyze` | Classify a completed session with AI (`Complete`, `Incomplete` or `InsufficientData`) |
| GET | `/api/sessions/:sessionId/results` | Summary with recorded metrics |
| GET | `/api/sessions/history?limit=20` | Recent session summaries |

Swagger at `/docs` includes request schemas. DTO validation rejects unknown fields and out-of-range numeric values. CORS defaults to localhost ports 3000.

## Current scope

- Exercise metadata is supplied from a small in-code catalog; the first item is `elbow-extension`.
- No instructor media is bundled. The lesson endpoint returns `available: false` and `video_url: null` until a real video is configured.
- Session analysis uses the OpenAI Responses API. Configure `OPENAI_API_KEY` in the backend `.env`; `OPENAI_MODEL` can select another model. The key stays on the server. AI receives saved motion metrics only, not camera frames.
- The AI result is an experimental technical classification based on the available metrics, not a medical assessment or a clinically validated model. Sparse samples are returned as `InsufficientData` where the model can determine that.
- Repetition quality is not diagnosed by this API. Store only the browser's measured metrics; these are technical indicators, not medical assessment.
- TypeORM schema synchronization is enabled for the local MVP. For deployment, replace it with migrations and set a persistent database path or PostgreSQL connection.
