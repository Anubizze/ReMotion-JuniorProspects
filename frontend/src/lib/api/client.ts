import {z} from "zod";
import type {AnalysisResult, ModelMetrics, SessionSummary} from "@/types";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
export const ACTIVE_SESSION_KEY = "remotion:active-session-id:v1";

const modelMetricsSchema = z.object({
  balancedAccuracy: z.number().min(0).max(1).optional(),
  f1Score: z.number().min(0).max(1).optional(),
  confusionMatrix: z.array(z.array(z.number())).optional(),
  baselineBalancedAccuracy: z.number().min(0).max(1).optional(),
  splitDescription: z.string().optional()
});

const aiAssessmentSchema = z.object({
  classification: z.enum(["Complete", "Incomplete", "InsufficientData"]),
  summary: z.string(),
  indicators: z.array(z.string()),
  reliability: z.enum(["low", "medium", "high"]),
  technical_only: z.literal(true),
  provider: z.string(),
  model: z.string(),
  generated_at: z.string(),
  cached: z.boolean().optional()
});

const metricSchema = z.object({
  repetitions: z.number(),
  elbow_angle: z.number().nullable(),
  phase: z.string(),
  confidence: z.number(),
  recorded_at: z.string()
});

const sessionSchema = z.object({
  id: z.string(), exercise_id: z.string(), status: z.enum(["active", "completed"]),
  repetitions: z.number(), duration_seconds: z.number(), average_elbow_angle: z.number().nullable(),
  ai_assessment: aiAssessmentSchema.nullable().optional(), started_at: z.string(), finished_at: z.string().nullable()
});

const sessionResultSchema = sessionSchema.extend({metrics: z.array(metricSchema).optional()});
const startedSessionSchema = z.object({id: z.string(), exercise_id: z.string(), status: z.string(), started_at: z.string()});
const finishedSessionSchema = sessionSchema;
const metricSavedSchema = z.object({id: z.string(), session_id: z.string()});

export type AiAssessment = z.infer<typeof aiAssessmentSchema>;
export type BackendSessionResult = z.infer<typeof sessionResultSchema>;

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {Accept: "application/json", ...(init.body ? {"Content-Type": "application/json"} : {}), ...init.headers}
    });
  } catch {
    throw new Error("Backend недоступен. Убедитесь, что API запущен на localhost:8000.");
  }
  if (!response.ok) {
    let message = `API ${response.status}`;
    try {
      const body = await response.json() as {message?: string | string[]};
      if (body.message) message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    } catch { /* Keep the HTTP status if the response is not JSON. */ }
    throw new Error(message);
  }
  return schema.parse(await response.json());
}

export async function getModelMetrics(): Promise<ModelMetrics | null> {
  // This backend has no approved model evaluation report yet.
  return null;
}

export async function startSession(exerciseId = "elbow-extension") {
  return request("/api/sessions/start", startedSessionSchema, {
    method: "POST", body: JSON.stringify({exercise_id: exerciseId})
  });
}

export async function finishSession(sessionId: string, values: {repetitions: number; duration_seconds: number; average_elbow_angle: number | null}) {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/finish`, finishedSessionSchema, {
    method: "POST", body: JSON.stringify(values)
  });
}

export async function saveSessionMetric(sessionId: string, values: {repetitions: number; elbow_angle: number | null; phase: string; confidence: number}) {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/metrics`, metricSchema.extend({id: z.string(), session_id: z.string()}), {
    method: "POST", body: JSON.stringify(values)
  });
}

export async function getSessionResults(sessionId: string) {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/results`, sessionResultSchema);
}

export async function analyzeSession(sessionId: string) {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/analyze`, aiAssessmentSchema, {method: "POST"});
}

export async function getSessionHistory(): Promise<SessionSummary[]> {
  const rows = await request("/api/sessions/history", z.array(sessionSchema));
  return rows.map((row) => ({
    id: row.id,
    date: row.finished_at ?? row.started_at,
    durationSeconds: row.duration_seconds,
    detectedCycles: row.repetitions,
    completedCycles: row.repetitions,
    reviewCycles: 0,
    cycles: [],
    source: "api"
  }));
}

export function setActiveSessionId(id: string) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACTIVE_SESSION_KEY);
}

export function clearActiveSessionId() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(ACTIVE_SESSION_KEY);
}

export interface AnalysisTransport {
  connect(sessionId: string): Promise<void>;
  disconnect(): void;
  onResult(handler: (result: AnalysisResult) => void): () => void;
}
