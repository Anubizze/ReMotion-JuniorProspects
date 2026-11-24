# ReMotion frontend ↔ backend contract

The frontend uses `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Set `NEXT_PUBLIC_DEMO_MODE=false` to use the NestJS API instead of local demo summaries. The backend enables CORS for `http://localhost:3000` by default.

## Session lifecycle currently connected

1. `POST /api/sessions/start` with `{ "exercise_id": "elbow-extension" }` when the active session screen opens.
2. `POST /api/sessions/{sessionId}/finish` with the elapsed duration when the user finishes. The session and summary are stored in the backend SQLite database.
3. `GET /api/sessions/{sessionId}/results` to render the saved result.
4. `GET /api/sessions/history` to render sessions from the backend.
5. `POST /api/sessions/{sessionId}/analyze` when the user explicitly requests the AI technical assessment. This request uses `OPENAI_API_KEY` configured on the backend.

`POST /api/sessions/{sessionId}/metrics` accepts `{ "repetitions": 2, "elbow_angle": 150, "phase": "extension", "confidence": 0.9 }`. The frontend does not call it yet because the current frontend branch has camera/video preview but no pose estimation or repetition detector.

## Privacy and current limits

- The camera stream and selected video stay in the browser; media is not uploaded to the backend.
- Sessions are saved even if no pose metrics were produced; their summary will show zero detected repetitions and unavailable angles.
- AI analysis can return `InsufficientData` when no metrics are stored. It is a technical, non-medical result.
- Model evaluation metrics are unavailable until a validated report and API endpoint are supplied; the UI does not substitute example scores.
