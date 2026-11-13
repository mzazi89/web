'use client';

// MZAZI TECH — profile photo control.
//
// One component, used on the account page and in dashboard settings, because a
// second copy would drift. It owns the whole job:
//
//   pick a file → decode it → square-crop and re-encode to 512 px JPEG → POST
//
// Doing the crop in the browser is not a nicety. A phone camera photo is 4–8 MB
// and arrives rotated by EXIF; sending that up would either be rejected or store
// a sideways 8 MB image. After this step the upload is ~50–90 KB, upright, and
// the same size for everybody, and the request is the same shape from any device.
//
// Failure is always shown in words on the page ("That photo is too large…"), not
// swallowed, and the previous photo stays visible until a new one is accepted.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Icons } from '@/components/ui';

const EDGE = 512; // stored square, so it is sharp at 2× on a 256 px slot
const QUALITY = 0.86;

/** Decodes whatever the picker handed us, honouring EXIF orientation. */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* Safari older than 16 throws here — fall through */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Centre-crops to a square and returns a JPEG data URL. */
function square(source) {
  const w = source.width || source.naturalWidth || 0;
  const h = source.height || source.naturalHeight || 0;
  if (!w || !h) throw new Error('That file is not an image we could open.');

  const side = Math.min(w, h);
  const sx = Math.round((w - side) / 2);
  const sy = Math.round((h - side) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = EDGE;
  canvas.height = EDGE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot resize images.');
  // JPEG has no alpha; paint first so a transparent PNG becomes white rather
  // than the theme colour showing through the photo.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, EDGE, EDGE);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, sx, sy, side, side, 0, 0, EDGE, EDGE);

  return canvas.toDataURL('image/jpeg', QUALITY);
}

export default function AvatarUploader({ src = null, name = '', size = 84 }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(src);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null); // { kind: 'good' | 'bad', text }

  const pick = () => fileRef.current?.click();

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setNote(null);
    try {
      if (file.size > 12 * 1024 * 1024) {
        throw new Error('That file is over 12 MB. Choose a smaller photo.');
      }
      const image = await decode(file);
      const dataUrl = square(image);
      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'We could not save that photo.');
      setPhoto(data.avatarUrl || `${dataUrl}`);
      setNote({ kind: 'good', text: 'Photo updated.' });
      router.refresh();
    } catch (e) {
      setNote({ kind: 'bad', text: e.message || 'We could not use that file.' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = ''; // same file can be re-picked
    }
  };

  const remove = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/account/avatar', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'We could not remove the photo.');
      }
      setPhoto(null);
      setNote({ kind: 'good', text: 'Photo removed — your initials are back.' });
      router.refresh();
    } catch (e) {
      setNote({ kind: 'bad', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="avatar-edit">
      <div style={{ position: 'relative', flex: `0 0 ${size}px` }}>
        <Avatar src={photo || undefined} name={name} size={size} ring />
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-label={photo ? 'Change profile photo' : 'Add profile photo'}
          style={{
            position: 'absolute', right: -4, bottom: -4,
            width: 28, height: 28, borderRadius: '50%',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            border: '1px solid var(--line)', background: 'var(--surface-2, var(--surface))',
            color: 'var(--ink)',
          }}
        >
          <Icons.Pencil size={12} />
        </button>
      </div>

      <div style={{ minWidth: 0, display: 'grid', gap: 6 }}>
        <div className="row-between" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={pick} disabled={busy}>
            {busy ? 'Working…' : photo ? 'Change photo' : 'Add photo'}
          </button>
          {photo && (
            <button type="button" className="dash-mini-link" onClick={remove} disabled={busy} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}>
              Remove
            </button>
          )}
        </div>
        <p className="field-hint" style={{ margin: 0 }}>
          JPG, PNG or WebP. Cropped square and resized on your device before upload.
        </p>
        <p
          className={`form-note ${note?.kind === 'bad' ? 'is-bad' : note ? 'is-good' : ''}`}
          role="status"
          aria-live="polite"
          style={{ margin: 0, display: note ? 'block' : 'none' }}
        >
          {note?.text || ''}
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => upload(e.target.files?.[0])}
        style={{ display: 'none' }}
      />
    </div>
  );
}
