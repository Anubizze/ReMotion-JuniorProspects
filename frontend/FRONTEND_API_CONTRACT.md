# ReMotion frontend API contract (draft)

This document describes the data required by the frontend. Endpoint names and transport are proposals for discussion and are not a final backend contract.

## Environment

- `NEXT_PUBLIC_API_URL` — backend origin, default `http://localhost:8000`.
- `NEXT_PUBLIC_DEMO_MODE` — when `true`, the UI does not present demo values as real analysis.

## Session analysis

The frontend needs a streaming transport (WebSocket, SSE, or an agreed frame polling API) that can be represented by the `AnalysisTransport` interface in `src/lib/api/client.ts`.

Each pose frame should contain:

```json
{
  "timestampMs": 1240,
  "elbowAngle": 142.4,
  "landmarks": [
    {"name": "shoulder", "x": 0.42, "y": 0.31, "confidence": 0.98},
    {"name": "elbow", "x": 0.51, "y": 0.52, "confidence": 0.96},
    {"name": "wrist", "x": 0.68, "y": 0.49, "confidence": 0.95}
  ]
}
```

Coordinates are normalized to the displayed frame (`0..1`). The backend must state whether the source is mirrored so the frontend can align the overlay.

Each completed cycle should contain a stable ID, start and end timestamps, classification (`complete`, `review`, or `unknown`), optional model confidence, and optional peak elbow angle. When confidence is below the agreed threshold, the backend should return `unknown`; the UI will show “Проверьте инструкцию” rather than an error judgment.

## Final summary

The frontend expects a `SessionSummary` with session ID, ISO date, duration in seconds, detected/completed/review cycle counts, individual cycles, and a source marker. No diagnosis, treatment efficacy, or therapy recommendation is accepted by this view.

## Model metrics

Provisional read request: `GET /model/metrics`.

```json
{
  "balancedAccuracy": 0.0,
  "f1Score": 0.0,
  "confusionMatrix": [[0, 0], [0, 0]],
  "baselineBalancedAccuracy": 0.0,
  "splitDescription": "Grouped by volunteer ID"
}
```

Values must come from the approved ML report or backend. Missing metrics remain unavailable in the UI.

## Privacy and errors

The frontend does not upload media in demo mode. If production analysis uploads frames or video, the product must display that fact before the user starts. Errors should contain a machine-readable code and a short safe message. The frontend handles permission denial, no camera, unsupported media, loading, empty data, low confidence, transport disconnect, and server errors as separate states.
