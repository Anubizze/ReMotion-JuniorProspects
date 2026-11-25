"use client";

import {CheckCircle2, Clock3, Home, RotateCcw, Save, ScanLine, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useState} from "react";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {Link} from "@/i18n/navigation";
import {AngleChart} from "@/components/charts/angle-chart";
import {DemoBanner} from "@/components/ui/demo-banner";
import {demoSummary} from "@/lib/demo-data";
import {saveSummary} from "@/lib/storage/history";
import {analyzeSession, demoMode, getActiveSessionId, getSessionResults, type AiAssessment, type BackendSessionResult} from "@/lib/api/client";
import type {SessionSummary} from "@/types";

function toSummary(result: BackendSessionResult): SessionSummary {
  return {
    id: result.id,
    date: result.finished_at ?? result.started_at,
    durationSeconds: result.duration_seconds,
    detectedCycles: result.repetitions,
    completedCycles: result.repetitions,
    reviewCycles: 0,
    cycles: [],
    source: "api"
  };
}

export function ResultsView() {
  const t = useTranslations("results"); const c = useTranslations("common");
  const [saved, setSaved] = useState(false); const [saveError, setSaveError] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(demoMode ? demoSummary : null);
  const [apiSession, setApiSession] = useState<BackendSessionResult | null>(null);
  const [assessment, setAssessment] = useState<AiAssessment | null>(null);
  const [loading, setLoading] = useState(!demoMode); const [analyzing, setAnalyzing] = useState(false); const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (demoMode) return;
    const id = getActiveSessionId();
    if (!id) {
      const timeout = window.setTimeout(() => { setApiError(t("apiLoadError")); setLoading(false); }, 0);
      return () => window.clearTimeout(timeout);
    }
    let mounted = true;
    getSessionResults(id).then((result) => {
      if (!mounted) return;
      setApiSession(result); setSummary(toSummary(result)); setAssessment(result.ai_assessment ?? null);
    }).catch((error: unknown) => {
      if (mounted) setApiError(error instanceof Error ? error.message : t("apiLoadError"));
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [t]);

  const save = () => {
    if (!summary) return;
    try { saveSummary({...summary, date: new Date().toISOString(), id: crypto.randomUUID()}); setSaved(true); setSaveError(false); }
    catch { setSaveError(true); }
  };

  async function requestAnalysis() {
    const id = getActiveSessionId();
    if (!id) { setApiError(t("apiLoadError")); return; }
    setAnalyzing(true); setApiError("");
    try { const result = await analyzeSession(id); setAssessment(result); }
    catch (error) { setApiError(error instanceof Error ? error.message : t("apiLoadError")); }
    finally { setAnalyzing(false); }
  }

  const classification = assessment?.classification === "Complete" ? t("classificationComplete")
    : assessment?.classification === "Incomplete" ? t("classificationIncomplete")
    : assessment?.classification === "InsufficientData" ? t("classificationInsufficient") : "";
  const reliability = assessment?.reliability === "high" ? t("reliabilityHigh") : assessment?.reliability === "medium" ? t("reliabilityMedium") : t("reliabilityLow");
  const sessionStart = apiSession ? new Date(apiSession.started_at).getTime() : 0;
  const angleSeries = (apiSession?.metrics ?? []).flatMap((metric) => {
    if (metric.elbow_angle === null) return [];
    return [{time: Math.max(0, (new Date(metric.recorded_at).getTime() - sessionStart) / 1000), angle: metric.elbow_angle}];
  });

  return <div className="container"><DemoBanner/><header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("subtitle")}</p></div><div className="buttonRow"><Link className="btn btnSecondary" href="/"><Home size={19}/>{c("backHome")}</Link><Link className="btn btnPrimary" href="/session/prepare"><RotateCcw size={19}/>{c("newSession")}</Link></div></header>
    {loading && <section className="card emptyState" role="status">{c("loading")}</section>}
    {apiError && <p className="errorText" role="alert">{apiError}</p>}
    {summary && <>
      {demoMode ? <section className="metricsGrid"><article className="summaryMetric card"><span>{t("detected")}</span><strong>{summary.detectedCycles}</strong></article><article className="summaryMetric card"><span>{t("completed")}</span><strong>{summary.completedCycles}</strong></article><article className="summaryMetric card"><span>{t("review")}</span><strong>{summary.reviewCycles}</strong></article><article className="summaryMetric card"><span>{t("duration")}</span><strong>{Math.floor(summary.durationSeconds / 60)}:{String(summary.durationSeconds % 60).padStart(2, "0")}</strong></article></section> : <section className="metricsGrid"><article className="summaryMetric card"><span>{t("counterValue")}</span><strong>{summary.detectedCycles}</strong></article><article className="summaryMetric card"><span>{t("assessmentTitle")}</span><strong className="summaryMetricText">{assessment ? classification : t("notAssessed")}</strong></article><article className="summaryMetric card"><span>{t("duration")}</span><strong>{Math.floor(summary.durationSeconds / 60)}:{String(summary.durationSeconds % 60).padStart(2, "0")}</strong></article></section>}
      {demoMode ? <section className="chartCard card"><div className="sectionHead"><div><span className="eyebrow">{c("demo")}</span><h2 style={{marginTop: 12}}>{t("chart")}</h2></div><ScanLine size={28}/></div><AngleChart/></section> : <section className="chartCard card"><div className="sectionHead"><div><span className="eyebrow">{t("duration")}</span><h2 style={{marginTop: 12}}>{t("chart")}</h2></div><ScanLine size={28}/></div>{angleSeries.length > 1 ? <div className="chartWrap" role="img" aria-label={t("chartAria")}><ResponsiveContainer width="100%" height="100%"><LineChart data={angleSeries} margin={{top: 12, right: 12, bottom: 4, left: -12}}><CartesianGrid vertical={false} stroke="#dfe9e5" strokeDasharray="4 5"/><XAxis type="number" dataKey="time" domain={["dataMin", "dataMax"]} tickFormatter={(value: number) => `${Math.round(value)}s`} tickLine={false} axisLine={false} tick={{fill: "#607069", fontSize: 12}}/><YAxis domain={[0, 180]} ticks={[0, 45, 90, 135, 180]} tickLine={false} axisLine={false} tick={{fill: "#607069", fontSize: 12}}/><Tooltip labelFormatter={(value) => `${Number(value).toFixed(1)}s`} formatter={(value) => [`${value}\u00b0`, t("angle")]}/><Line type="monotone" dataKey="angle" stroke="#176b55" strokeWidth={3} dot={false} activeDot={{r: 5, fill: "#176b55"}}/></LineChart></ResponsiveContainer></div> : <p className="muted">{t("chartEmpty")}</p>}<p className="chartNote">{t("cycleDataNote")}</p></section>}
      {!demoMode && <section className="section"><h2>{t("assessmentTitle")}</h2>{assessment ? <article className="card assessmentCard"><div className="assessmentHeading"><Sparkles size={20}/><strong>{classification}</strong><span className="badge">{t("reliability")}: {reliability}</span></div><p>{assessment.summary}</p>{assessment.indicators.length > 0 && <ul>{assessment.indicators.map((item, index) => <li key={index}>{item}</li>)}</ul>}<small>{c("medical")}</small></article> : <article className="card assessmentCard"><p>{t("noCycles")}</p></article>}<button className="btn btnSecondary" onClick={() => void requestAnalysis()} disabled={analyzing || loading || !apiSession}><Sparkles size={18}/>{analyzing ? t("analyzing") : t("analyze")}</button></section>}
      {demoMode && <section className="section"><h2>{t("cycles")}</h2><div className="cycleGrid">{demoSummary.cycles.map((cycle) => <article key={cycle.id} className="cycleCard"><span>{t("cycle")} {cycle.id}</span><strong>{cycle.peakAngle ? `${cycle.peakAngle}°` : "—"}</strong><span className={cycle.status === "complete" ? "statusComplete" : "statusReview"}>{cycle.status === "complete" ? t("completed") : t("review")}</span></article>)}</div></section>}
      <div className="saveNotice"><div className="readyText"><span className="statusIcon">{demoMode ? saved ? <CheckCircle2/> : <Clock3/> : <CheckCircle2/>}</span><div><h3>{demoMode ? saved ? t("saved") : c("privacy") : t("serverSaved")}</h3><p className="muted">{demoMode ? c("demoHint") : c("privacy")}</p>{saveError && <p className="errorText">{t("saveError")}</p>}</div></div>{demoMode && <button className="btn btnPrimary" onClick={save} disabled={saved}><Save size={19}/>{saved ? t("saved") : t("save")}</button>}</div>
    </>}
  </div>;
}
