"use client";

import {CheckCircle2, Clock3, Home, RotateCcw, Save, ScanLine} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {Link} from "@/i18n/navigation";
import {AngleChart} from "@/components/charts/angle-chart";
import {DemoBanner} from "@/components/ui/demo-banner";
import {demoSummary} from "@/lib/demo-data";
import {saveSummary} from "@/lib/storage/history";

export function ResultsView() {
  const t = useTranslations("results"); const c = useTranslations("common");
  const [saved, setSaved] = useState(false); const [error, setError] = useState(false);
  const save = () => { try { saveSummary({...demoSummary, date: new Date().toISOString(), id: crypto.randomUUID()}); setSaved(true); setError(false); } catch { setError(true); } };
  return <div className="container"><DemoBanner/><header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("subtitle")}</p></div><div className="buttonRow"><Link className="btn btnSecondary" href="/"><Home size={19}/>{c("backHome")}</Link><Link className="btn btnPrimary" href="/session/prepare"><RotateCcw size={19}/>{c("newSession")}</Link></div></header>
    <section className="metricsGrid"><article className="summaryMetric card"><span>{t("detected")}</span><strong>{demoSummary.detectedCycles}</strong></article><article className="summaryMetric card"><span>{t("completed")}</span><strong>{demoSummary.completedCycles}</strong></article><article className="summaryMetric card"><span>{t("review")}</span><strong>{demoSummary.reviewCycles}</strong></article><article className="summaryMetric card"><span>{t("duration")}</span><strong>{Math.floor(demoSummary.durationSeconds / 60)}:{String(demoSummary.durationSeconds % 60).padStart(2, "0")}</strong></article></section>
    <section className="chartCard card"><div className="sectionHead"><div><span className="eyebrow">{c("demo")}</span><h2 style={{marginTop: 12}}>{t("chart")}</h2></div><ScanLine size={28}/></div><AngleChart/></section>
    <section className="section"><h2>{t("cycles")}</h2><div className="cycleGrid">{demoSummary.cycles.map((cycle) => <article key={cycle.id} className="cycleCard"><span>{t("cycle")} {cycle.id}</span><strong>{cycle.peakAngle ? `${cycle.peakAngle}°` : "—"}</strong><span className={cycle.status === "complete" ? "statusComplete" : "statusReview"}>{cycle.status === "complete" ? t("completed") : t("review")}</span></article>)}</div></section>
    <div className="saveNotice"><div className="readyText"><span className="statusIcon">{saved ? <CheckCircle2/> : <Clock3/>}</span><div><h3>{saved ? t("saved") : c("privacy")}</h3><p className="muted">{c("demoHint")}</p>{error && <p className="errorText">{t("saveError")}</p>}</div></div><button className="btn btnPrimary" onClick={save} disabled={saved}><Save size={19}/>{saved ? t("saved") : t("save")}</button></div>
  </div>;
}
