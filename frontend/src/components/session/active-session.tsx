"use client";

import {BookOpen, CameraOff, CircleStop, Pause, Play, RotateCcw} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {Link, useRouter} from "@/i18n/navigation";
import {getMedia, stopMedia} from "@/lib/media-session";

function formatTime(value: number) { const minutes = Math.floor(value / 60).toString().padStart(2, "0"); const seconds = (value % 60).toString().padStart(2, "0"); return `${minutes}:${seconds}`; }

export function ActiveSession() {
  const t = useTranslations("active");
  const c = useTranslations("common");
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [media, setMedia] = useState<ReturnType<typeof getMedia> | null>(null);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { let mounted = true; queueMicrotask(() => { if (mounted) setMedia(getMedia()); }); return () => { mounted = false; }; }, []);
  useEffect(() => { if (!media || !videoRef.current) return; if (media.stream) videoRef.current.srcObject = media.stream; else if (media.objectUrl) videoRef.current.src = media.objectUrl; void videoRef.current.play().catch(() => undefined); }, [media]);
  useEffect(() => { if (paused || !media) return; const id = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(id); }, [paused, media]);
  useEffect(() => () => stopMedia(), []);
  function togglePause() { const next = !paused; setPaused(next); media?.stream?.getTracks().forEach((track) => {track.enabled = !next;}); if (videoRef.current) { if (next) videoRef.current.pause(); else void videoRef.current.play(); } }
  function finish() { if (!window.confirm(t("finishConfirm"))) return; stopMedia(); router.push("/session/results"); }
  const hasMedia = Boolean(media?.stream || media?.objectUrl);
  return <div className="container">
    <div className="demoBanner" role="status"><CameraOff size={20}/><span><strong>{c("demo")}</strong>{c("demoHint")}</span></div>
    <header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1></div><span className="badge">{t("analysisWaiting")}</span></header>
    {!hasMedia ? <section className="emptyState card"><CameraOff size={54}/><h2>{t("noMedia")}</h2><p>{t("noMediaText")}</p><Link className="btn btnPrimary" href="/session/prepare"><RotateCcw size={19}/>{t("toPrepare")}</Link></section> : <>
      <div className="activeGrid"><section className="videoStage card"><video ref={videoRef} muted={Boolean(media?.stream)} controls={Boolean(media?.objectUrl)} playsInline/><div className="videoOverlay"><div className="stageTop"><span className="stagePill">{media?.stream ? t("cameraLabel") : t("uploadLabel")}</span><span className="stagePill">{paused ? t("paused") : c("demo")}</span></div><div className="stageBottom"><span className="stagePill">{t("analysisText")}</span></div></div></section>
        <aside className="activeAside"><article className="metricCard card"><small>{t("cycles")}</small><div className="metricValue">— <span>{t("noData")}</span></div><div className="emptyMetric">{t("analysisText")}</div></article><article className="metricCard card"><small>{t("angle")}</small><div className="metricValue">—°</div><div className="emptyMetric">{t("analysisWaiting")}</div></article><article className="metricCard card"><small>{t("lastResult")}</small><div className="metricValue"><span>{t("noData")}</span></div><div className="emptyMetric">{c("demoHint")}</div></article></aside>
      </div>
      <section className="sessionControls card"><div className="timer"><small>{t("timer")}</small>{formatTime(seconds)}</div><div className="buttonRow"><Link className="btn btnSecondary" href="/session/prepare"><BookOpen size={19}/>{t("instruction")}</Link><button className="btn btnSecondary" onClick={togglePause}>{paused ? <Play size={19}/> : <Pause size={19}/>} {paused ? t("resume") : t("pause")}</button><button className="btn btnPrimary" onClick={finish}><CircleStop size={19}/>{t("finish")}</button></div></section>
    </>}
  </div>;
}
