export type CycleStatus = "complete" | "review" | "unknown";

export interface PoseLandmark { name: "shoulder" | "elbow" | "wrist"; x: number; y: number; confidence: number }
export interface PoseFrame { timestampMs: number; elbowAngle?: number; landmarks: PoseLandmark[] }
export interface ExerciseCycle { id: string; startedAtMs: number; endedAtMs: number; status: CycleStatus; confidence?: number; peakAngle?: number }
export interface AnalysisResult { sessionId: string; frames: PoseFrame[]; cycles: ExerciseCycle[]; source: "api" | "demo" }
export interface SessionSummary { id: string; date: string; durationSeconds: number; detectedCycles: number; completedCycles: number; reviewCycles: number; cycles: ExerciseCycle[]; source: "api" | "demo" }
export interface ModelMetrics { balancedAccuracy?: number; f1Score?: number; confusionMatrix?: number[][]; baselineBalancedAccuracy?: number; splitDescription?: string }
export interface ApiError { code: string; message: string; status?: number }
