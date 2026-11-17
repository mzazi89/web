'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/media.js — turning a camera-roll photo into something a
// chat can hold.
//
// A phone photo is 3–8 MB. The server caps a decoded image at 2.5 MB and the
// platform caps the whole request at ~4.5 MB, so the resizing has to happen here,
// before upload, and it has to happen by drawing pixels rather than by trusting
// the file's own dimensions.
//
// Two paths: a PNG under 900 KB is sent as-is so transparency survives, anything
// else — and every photo — is redrawn to at most 1600 px on its long edge and
// re-encoded as JPEG. That is the difference between a 6 MB upload and a 300 KB
// one, and at chat size nobody can tell.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_EDGE = 1600;
const QUALITY = 0.82;
const KEEP_PNG_UNDER = 900_000;

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not an image we can read'));
    img.src = src;
  });

export async function prepareImage(file) {
  if (!file) throw new Error('No file chosen');
  if (!/^image\//.test(file.type)) throw new Error('Only photos can be attached here');

  const original = await readAsDataUrl(file);

  // Small PNG / WebP: keep the original bytes, transparency included.
  if ((file.type === 'image/png' || file.type === 'image/webp') && file.size <= KEEP_PNG_UNDER) {
    const img = await loadImage(original);
    return { data: original, width: img.naturalWidth, height: img.naturalHeight, mime: file.type };
  }

  const img = await loadImage(original);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  // JPEG has no alpha: painting the photo onto white is what stops every
  // transparent PNG from arriving as a black rectangle.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const data = canvas.toDataURL('image/jpeg', QUALITY);
  return { data, width, height, mime: 'image/jpeg' };
}

/** The best audio container this browser will actually record. */
export function pickAudioMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((type) => {
    try { return MediaRecorder.isTypeSupported(type); } catch { return false; }
  }) || '';
}

export const canRecord = () =>
  typeof navigator !== 'undefined'
  && typeof MediaRecorder !== 'undefined'
  && Boolean(navigator.mediaDevices?.getUserMedia);

/** Recording length limits, mirrored on the server. */
export const MAX_RECORD_MS = 60_000;
