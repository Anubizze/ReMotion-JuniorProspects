"use client";

import {CalendarDays, Clock3, FolderOpen, Trash2, X} from "lucide-react";
import {useFormatter, useTranslations} from "next-intl";
import {useEffect, useState} from "react";
import {Link} from "@/i18n/navigation";
import {getHistory, removeSummary} from "@/lib/storage/history";
import {demoMode, getSessionHistory} from "@/lib/api/client";
import type {SessionSummary} from "@/types";

export function HistoryView() {
  const t = useTranslations("history"); const c = useTranslations("common"); const results = useTranslations("results"); const format = useFormatter();
  const [items, setItems] = useState<SessionSummary[]>([]); const [selected, setSelected] = useState<SessionSummary | null>(null); const [pendingDelete, setPendingDelete] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(!demoMode); const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    if (demoMode) { queueMicrotask(() => { if (mounted) setItems(getHistory()); }); return () => { mounted = false; }; }
    getSessionHistory().then((value) => { if (mounted) setItems(value); })
      .catch((reason: unknown) => { if (mounted) setError(reason instanceof Error ? reason.message : "Не удалось загрузить историю."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  const duration = (value: number) => `${Math.floor(value / 60)} ${c("minutes")} ${value % 60} ${c("seconds")}`;
  return <div className="container"><header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("subtitle")}</p></div></header>
    {loading && <section className="emptyState card" role="status">{c("loading")}</section>}{error && <p className="errorText" role="alert">{error}</p>}
    {!loading && !error && items.length === 0 ? <section className="emptyState card"><FolderOpen size={54}/><h2>{t("emptyTitle")}</h2><p>{t("emptyText")}</p><Link className="btn btnPrimary" href="/session/prepare">{t("emptyAction")}</Link></section> : items.length > 0 && <section className="historyList">{items.map((item) => <article className="historyItem card" key={item.id}><div><small>E02</small><h3>{t("details")}</h3><span className="badge">{item.source === "demo" ? c("demo") : "API"}</span></div><div><small>{t("date")}</small><span><CalendarDays size={16}/> {format.dateTime(new Date(item.date), {dateStyle: "medium", timeStyle: "short"})}</span></div><div><small>{t("duration")}</small><span><Clock3 size={16}/> {duration(item.durationSeconds)}</span></div><div className="buttonRow"><button className="btn btnSecondary" onClick={() => setSelected(item)}>{c("view")}</button>{demoMode && <button className="btn btnDanger" aria-label={c("delete")} onClick={() => setPendingDelete(item)}><Trash2 size={19}/></button>}</div></article>)}</section>}
    {selected && <div className="dialogBackdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="dialog card" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title" onMouseDown={(event) => event.stopPropagation()}><button className="btn btnSecondary" style={{float:"right", minHeight:44, padding:10}} aria-label={c("cancel")} onClick={() => setSelected(null)}><X size={19}/></button><h2 id="history-dialog-title">{t("details")}</h2><div className="metricsGrid"><article className="summaryMetric card"><span>{t("cycles")}</span><strong>{selected.detectedCycles}</strong></article><article className="summaryMetric card"><span>{t("duration")}</span><strong>{Math.floor(selected.durationSeconds / 60)}:{String(selected.durationSeconds % 60).padStart(2,"0")}</strong></article></div>{selected.cycles.length > 0 ? <div className="cycleGrid">{selected.cycles.map((cycle) => <div className="cycleCard" key={cycle.id}><span>#{cycle.id}</span><strong>{cycle.peakAngle ? `${cycle.peakAngle}°` : "—"}</strong><span className={cycle.status === "complete" ? "statusComplete" : "statusReview"}>{cycle.status === "complete" ? results("completed") : cycle.status === "review" ? results("review") : results("unknown")}</span></div>)}</div> : <p className="muted">{results("noCycles")}</p>}</section></div>}
    {demoMode && pendingDelete && <div className="dialogBackdrop"><section className="dialog card" role="alertdialog" aria-modal="true"><h2>{t("confirmDelete")}</h2><div className="buttonRow"><button className="btn btnSecondary" onClick={() => setPendingDelete(null)}>{c("cancel")}</button><button className="btn btnDanger" onClick={() => {setItems(removeSummary(pendingDelete.id)); setPendingDelete(null);}}><Trash2 size={19}/>{c("delete")}</button></div></section></div>}
  </div>;
}
