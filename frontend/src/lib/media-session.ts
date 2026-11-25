type MediaSessionState = {stream: MediaStream | null; file: File | null; objectUrl: string | null};

declare global {
  interface Window { __remotionMediaSession?: MediaSessionState }
}

const serverState: MediaSessionState = {stream: null, file: null, objectUrl: null};

function state(): MediaSessionState {
  if (typeof window === "undefined") return serverState;
  return window.__remotionMediaSession ??= {stream: null, file: null, objectUrl: null};
}

export function setCameraStream(next: MediaStream): void { stopMedia(); state().stream = next; }
export function setVideoFile(next: File): string { stopMedia(); const media = state(); media.file = next; media.objectUrl = URL.createObjectURL(next); return media.objectUrl; }
export function getMedia(): MediaSessionState { return {...state()}; }
export function stopMedia(): void {
  const media = state();
  media.stream?.getTracks().forEach((track) => track.stop());
  if (media.objectUrl) URL.revokeObjectURL(media.objectUrl);
  media.stream = null; media.file = null; media.objectUrl = null;
}
