"use client";

import {BookOpen, CameraOff, CircleStop, Pause, Play, RotateCcw} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {Link, useRouter} from "@/i18n/navigation";
import {getMedia, stopMedia} from "@/lib/media-session";
import {clearActiveSessionId, demoMode, finishSession, getActiveSessionId, saveSessionMetric, setActiveSessionId, startSession} from "@/lib/api/client";
import {DemoBanner} from "@/components/ui/demo-banner";
import {usePoseDetection} from "@/lib/pose-detection";

function formatTime(value: number) { const minutes = Math.floor(value / 60).toString().padStart(2, "0"); const seconds = (value % 60).toString().padStart(2, "0"); return `${minutes}:${seconds}`; }

export function ActiveSession() {
  const t = useTranslations("active");
  const c = useTranslations("common");
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaCleanupTimerRef = useRef<number | null>(null);
  const startRequestRef = useRef<Promise<string> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const metricSentAtRef = useRef(0);
  const angleSumRef = useRef(0);
  const angleSamplesRef = useRef(0);
  const [media, setMedia] = useState<ReturnType<typeof getMedia> | null>(null);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [apiState, setApiState] = useState<"connecting" | "ready" | "error">("connecting");
  const [apiError, setApiError] = useState("");
  const [finishing, setFinishing] = useState(false);

  useEffect(() => { let mounted = true; queueMicrotask(() => { if (mounted) setMedia(getMedia()); }); return () => { mounted = false; }; }, []);
  useEffect(() => { if (!media || !videoRef.current) return; if (media.stream) videoRef.current.srcObject = media.stream; else if (media.objectUrl) videoRef.current.src = media.objectUrl; void videoRef.current.play().catch(() => undefined); }, [media]);
  useEffect(() => { if (paused || !media) return; const id = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(id); }, [paused, media]);
  useEffect(() => {
    if (mediaCleanupTimerRef.current !== null) {
      window.clearTimeout(mediaCleanupTimerRef.current);
      mediaCleanupTimerRef.current = null;
    }
    return () => {
      mediaCleanupTimerRef.current = window.setTimeout(() => {
        stopMedia();
        mediaCleanupTimerRef.current = null;
      }, 0);
    };
  }, []);

  const hasMedia = Boolean(media?.stream || media?.objectUrl);
  const pose = usePoseDetection(videoRef, canvasRef, hasMedia);

  useEffect(() => {
    if (pose.angle !== null) { angleSumRef.current += pose.angle; angleSamplesRef.current += 1; }
  }, [pose.angle]);

  useEffect(() => {
    if (demoMode || apiState !== "ready" || !sessionIdRef.current || pose.angle === null || Date.now() - metricSentAtRef.current < 500) return;
    metricSentAtRef.current = Date.now();
    void saveSessionMetric(sessionIdRef.current, {repetitions: pose.repetitions, elbow_angle: pose.angle, phase: pose.phase, confidence: pose.confidence}).catch((error) => setApiError(error instanceof Error ? error.message : c("apiUnavailable")));
  }, [pose, apiState, c]);
  useEffect(() => {
    if (!media || !hasMedia || demoMode) return;
    let cancelled = false;
    async function connect() {
      try {
        const existing = getActiveSessionId();
        if (existing) {
          sessionIdRef.current = existing;
          if (!cancelled) setApiState("ready");
          return;
        }
        if (!startRequestRef.current) startRequestRef.current = startSession().then((session) => session.id);
        const id = await startRequestRef.current;
        sessionIdRef.current = id;
        setActiveSessionId(id);
        if (!cancelled) setApiState("ready");
      } catch (error) {
        if (!cancelled) {
          setApiState("error");
          setApiError(error instanceof Error ? error.message : c("apiUnavailable"));
        }
      }
    }
    void connect();
    return () => { cancelled = true; };
  }, [media, hasMedia, c]);

  function togglePause() {
    const next = !paused;
    setPaused(next);
    media?.stream?.getTracks().forEach((track) => {track.enabled = !next;});
    if (videoRef.current) { if (next) videoRef.current.pause(); else void videoRef.current.play(); }
  }

  async function finish() {
    if (!window.confirm(t("finishConfirm"))) return;
    if (!demoMode) {
      setFinishing(true); setApiError("");
      try {
        const id = sessionIdRef.current ?? getActiveSessionId() ?? await startRequestRef.current;
        if (!id) throw new Error(c("apiUnavailable"));
        await finishSession(id, {repetitions: pose.repetitions, duration_seconds: seconds, average_elbow_angle: angleSamplesRef.current ? Math.round(angleSumRef.current / angleSamplesRef.current) : null});
        sessionIdRef.current = id;
        setActiveSessionId(id);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : c("apiUnavailable"));
        setFinishing(false);
        return;
      }
      setFinishing(false);
    } else clearActiveSessionId();
    stopMedia();
    router.push("/session/results");
  }

  const statusText = apiState === "ready" ? c("apiReady") : apiState === "error" ? c("apiUnavailable") : c("apiConnecting");

  return <div className="container">
    {demoMode ? <DemoBanner/> : hasMedia ? <div className="apiBanner" role="status"><span className={`apiStatusDot ${apiState === "error" ? "error" : ""}`}/><span><strong>{statusText}</strong>{t("analysisText")}</span></div> : null}
    <header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1></div><span className="badge">{t("analysisWaiting")}</span></header>
    {!hasMedia ? <section className="emptyState card"><CameraOff size={54}/><h2>{t("noMedia")}</h2><p>{t("noMediaText")}</p><Link className="btn btnPrimary" href="/session/prepare"><RotateCcw size={19}/>{t("toPrepare")}</Link></section> : <>
      <div className="activeGrid">
        <section className="panel card activeReference"><div className="panelTitle"><BookOpen size={22}/><h2>{t("referenceTitle")}</h2></div><div className="referenceStage"><video src="/videos/e02-complete-example.mp4" autoPlay muted loop controls playsInline preload="metadata"/><span className="referenceBadge">{t("referenceComplete")}</span></div><p className="referenceCaption">{t("referenceNote")}</p></section>
        <section className="videoStage card"><video ref={videoRef} muted={Boolean(media?.stream)} controls={Boolean(media?.objectUrl)} playsInline/><canvas ref={canvasRef} className="poseCanvas" aria-hidden="true"/><div className="videoOverlay"><div className="stageTop"><span className="stagePill">{media?.stream ? t("cameraLabel") : t("uploadLabel")}</span><span className="stagePill">{paused ? t("paused") : c("privacy")}</span></div><div className="stageBottom"><span className="stagePill">{pose.modelState === "error" ? t("poseError") : pose.modelState === "loading" ? t("poseLoading") : pose.angle === null ? t("poseWaiting") : t("poseDetected")}</span></div></div></section>
      </div>
      <aside className="activeAside"><article className="metricCard card"><small>{t("cycles")}</small><div className="metricValue">{pose.repetitions}</div><div className="emptyMetric">{pose.angle === null ? t("poseWaiting") : pose.phase === "flexed" ? t("phaseFlexed") : t("phaseExtended")}</div></article><article className="metricCard card"><small>{t("angle")}</small><div className="metricValue">{pose.angle === null ? "?" : `${pose.angle}°`}</div><div className="emptyMetric">{pose.modelState === "error" ? t("poseError") : pose.angle === null ? t("poseLoading") : `${Math.round(pose.confidence * 100)}%`}</div></article><article className="metricCard card"><small>{t("lastResult")}</small><div className="metricValue"><span>{pose.repetitions > 0 ? t("cycleDetected") : t("noData")}</span></div><div className="emptyMetric">{t("cycleRule")}</div></article></aside>
      {apiError && <p className="errorText" role="alert">{apiError}</p>}
      <section className="sessionControls card"><div className="timer"><small>{t("timer")}</small>{formatTime(seconds)}</div><div className="buttonRow"><Link className="btn btnSecondary" href="/session/prepare"><BookOpen size={19}/>{t("instruction")}</Link><button className="btn btnSecondary" onClick={togglePause}>{paused ? <Play size={19}/> : <Pause size={19}/>} {paused ? t("resume") : t("pause")}</button><button className="btn btnPrimary" onClick={() => void finish()} disabled={finishing || (!demoMode && apiState !== "ready")}>{finishing ? c("loading") : <><CircleStop size={19}/>{t("finish")}</>}</button></div></section>
    </>}
  </div>;
}
