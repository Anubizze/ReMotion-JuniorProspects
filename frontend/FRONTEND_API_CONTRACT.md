# ReMotion frontend ↔ backend contract

The frontend uses `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Set `NEXT_PUBLIC_DEMO_MODE=false` to use the NestJS API instead of local demo summaries. The backend enables CORS for `http://localhost:3000` by default.

## Session lifecycle currently connected

1. `POST /api/sessions/start` with `{ "exercise_id": "elbow-extension" }` when the active session screen opens.
2. `POST /api/sessions/{sessionId}/metrics` while a session is active with repetitions, elbow angle, movement phase, and pose confidence from local MediaPipe inference.
3. `POST /api/sessions/{sessionId}/finish` with the elapsed duration and final repetition count when the user finishes. The session and summary are stored in the backend SQLite database.
4. `GET /api/sessions/{sessionId}/results` to render the saved result.
5. `GET /api/sessions/history` to render sessions from the backend.
6. `POST /api/sessions/{sessionId}/analyze` when the user explicitly requests the AI technical assessment. This request uses `OPENAI_API_KEY` configured on the backend.

`POST /api/sessions/{sessionId}/metrics` accepts `{ "repetitions": 2, "elbow_angle": 150, "phase": "extension", "confidence": 0.9 }`. MediaPipe inference and threshold-based repetition counting run locally in the browser; video frames are not sent to the API. The dataset-trained `Complete` / `Incomplete` classifier is not yet part of this session contract.

## Privacy and current limits

- The camera stream and selected video stay in the browser; media is not uploaded to the backend.
- Sessions can still be saved if pose inference fails; in that case their summary may have zero detected repetitions and no elbow-angle measurements.
- AI analysis can return `InsufficientData` when no metrics are stored. It is a technical, non-medical result.
- Classifier evaluation metrics are unavailable until the E02 dataset pipeline has been run; the UI does not substitute example scores.
