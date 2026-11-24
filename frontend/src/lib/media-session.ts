let stream: MediaStream | null = null;
let file: File | null = null;
let objectUrl: string | null = null;

export function setCameraStream(next: MediaStream): void { stopMedia(); stream = next; }
export function setVideoFile(next: File): string { stopMedia(); file = next; objectUrl = URL.createObjectURL(next); return objectUrl; }
export function getMedia(): {stream: MediaStream | null; file: File | null; objectUrl: string | null} { return {stream, file, objectUrl}; }
export function stopMedia(): void {
  stream?.getTracks().forEach((track) => track.stop());
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  stream = null; file = null; objectUrl = null;
}
