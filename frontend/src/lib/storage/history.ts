import type {SessionSummary} from "@/types";

const KEY = "remotion:session-history:v1";

export function getHistory(): SessionSummary[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SessionSummary[]; } catch { return []; }
}

export function saveSummary(summary: SessionSummary): void {
  const current = getHistory().filter((item) => item.id !== summary.id);
  localStorage.setItem(KEY, JSON.stringify([summary, ...current]));
}

export function removeSummary(id: string): SessionSummary[] {
  const next = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
