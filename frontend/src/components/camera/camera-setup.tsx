"use client";

import {Camera, CheckCircle2, FileVideo, PlayCircle, UploadCloud, VideoOff} from "lucide-react";
import {useTranslations} from "next-intl";
import {DragEvent, ChangeEvent, useEffect, useRef, useState} from "react";
import {useRouter} from "@/i18n/navigation";
import {setCameraStream, setVideoFile, stopMedia} from "@/lib/media-session";
import {clearActiveSessionId} from "@/lib/api/client";

type Mode = "camera" | "upload";
type CameraError = "denied" | "missing" | "unsupported" | null;

export function CameraSetup() {
  const t = useTranslations("prepare");
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transferringRef = useRef(false);
  const [mode, setMode] = useState<Mode>("camera");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState<CameraError>(null);
  const [fileError, setFileError] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { if (videoRef.current && stream) { videoRef.current.srcObject = stream; void videoRef.current.play(); } }, [stream]);
  useEffect(() => { if (videoRef.current && videoUrl) { videoRef.current.srcObject = null; videoRef.current.src = videoUrl; } }, [videoUrl]);
  useEffect(() => () => { if (!transferringRef.current) stopMedia(); }, []);

  async function startCamera(selected?: string) {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) { setError("unsupported"); return; }
    try {
      stream?.getTracks().forEach((track) => track.stop());
      const next = await navigator.mediaDevices.getUserMedia({video: selected ? {deviceId: {exact: selected}} : {facingMode: "user"}, audio: false});
      setStream(next); setCameraStream(next);
      const all = await navigator.mediaDevices.enumerateDevices();
      const cameras = all.filter((item) => item.kind === "videoinput");
      setDevices(cameras); setDeviceId(next.getVideoTracks()[0]?.getSettings().deviceId ?? "");
    } catch (reason) {
      const name = reason instanceof DOMException ? reason.name : "";
      setError(name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "denied");
    }
  }

  function acceptFile(file?: File) {
    if (!file || !["video/mp4", "video/webm", "video/quicktime"].includes(file.type) || file.size > 250 * 1024 * 1024) { setFileError(true); return; }
    setFileError(false); setStream(null); setVideoUrl(setVideoFile(file));
  }
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); };
  const ready = mode === "camera" ? Boolean(stream) : Boolean(videoUrl);
  const changeMode = (next: Mode) => { if (next === mode) return; stopMedia(); setStream(null); setVideoUrl(null); setMode(next); setFileError(false); setError(null); };

  return <>
    <div className="prepareGrid">
      <section className="panel card"><div className="panelTitle"><PlayCircle size={24}/><h2>{t("instruction")}</h2></div><div className="instructionPlaceholder"><div><VideoOff size={48}/><p>{t("instructionUnavailable")}</p></div></div></section>
      <section className="panel card"><div className="panelTitle"><Camera size={24}/><h2>{t("modeTitle")}</h2></div><div className="modeTabs"><button className={mode === "camera" ? "active" : ""} onClick={() => changeMode("camera")}>{t("camera")}</button><button className={mode === "upload" ? "active" : ""} onClick={() => changeMode("upload")}>{t("upload")}</button></div>
        {mode === "camera" ? <><div className="mediaWell">{stream ? <><video ref={videoRef} muted playsInline/><div className="mediaStatus"><span><CheckCircle2 size={17}/> {t("cameraReady")}</span><span>{t("serverNotice")}</span></div></> : <div className="mediaEmpty"><Camera size={46}/><h3>{t("cameraText")}</h3><button className="btn btnPrimary" onClick={() => void startCamera()}>{error ? t("retryCamera") : t("allowCamera")}</button></div>}</div>
          {devices.length > 1 && <div className="selectRow"><label htmlFor="camera-select">{t("selectCamera")}</label><select id="camera-select" value={deviceId} onChange={(event) => { setDeviceId(event.target.value); void startCamera(event.target.value); }}>{devices.map((item, index) => <option key={item.deviceId} value={item.deviceId}>{item.label || `${t("camera")} ${index + 1}`}</option>)}</select></div>}
          {error && <p className="errorText" role="alert">{t(error === "denied" ? "cameraDenied" : error === "missing" ? "cameraMissing" : "cameraUnsupported")}</p>}
        </> : <><div className={`dropZone ${dragging ? "dragging" : ""}`} onDragOver={(event) => {event.preventDefault(); setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>{videoUrl ? <><video ref={videoRef} controls playsInline/><button className="btn btnSecondary" onClick={() => inputRef.current?.click()}>{t("replace")}</button></> : <><UploadCloud size={48}/><h3>{t("drop")}</h3><p className="muted">{t("uploadText")}</p><button className="btn btnPrimary" onClick={() => inputRef.current?.click()}><FileVideo size={19}/>{t("choose")}</button></>}<input className="fileInput" ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFile}/></div>{fileError && <p className="errorText" role="alert">{t("invalidFile")}</p>}</>}
      </section>
    </div>
    <section className="readyBar card"><div className="readyText"><span className="statusIcon">{ready ? <CheckCircle2/> : <VideoOff/>}</span><div><h3>{ready ? t("ready") : t("notReady")}</h3><p className="muted">{t("serverNotice")}</p></div></div><button className="btn btnPrimary" disabled={!ready} onClick={() => {clearActiveSessionId(); transferringRef.current = true; router.push("/session/active");}}>{t("begin")}<PlayCircle size={20}/></button></section>
  </>;
}
