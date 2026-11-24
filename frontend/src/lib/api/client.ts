import {z} from "zod";
import type {AnalysisResult, ModelMetrics} from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

const metricsSchema = z.object({
  balancedAccuracy: z.number().min(0).max(1).optional(),
  f1Score: z.number().min(0).max(1).optional(),
  confusionMatrix: z.array(z.array(z.number())).optional(),
  baselineBalancedAccuracy: z.number().min(0).max(1).optional(),
  splitDescription: z.string().optional()
});

async function request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {headers: {Accept: "application/json"}});
  if (!response.ok) throw new Error(`API ${response.status}`);
  return schema.parse(await response.json());
}

export async function getModelMetrics(): Promise<ModelMetrics | null> {
  if (demoMode) return null;
  return request("/model/metrics", metricsSchema);
}

export interface AnalysisTransport {
  connect(sessionId: string): Promise<void>;
  disconnect(): void;
  onResult(handler: (result: AnalysisResult) => void): () => void;
}
