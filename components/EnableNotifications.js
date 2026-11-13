'use client';

// MZAZI TECH — turn phone notifications on, for this device.
//
// Four states worth showing, because each one needs a different thing from the
// person: unsupported (nothing to do), blocked (they must change site settings),
// off (one tap), on (offer a test so they can believe it).
//
// On iOS this only works from an installed PWA — Safari does not expose
// PushManager in a normal tab — so the copy says so instead of failing silently.

import { useCallback, useEffect, useState } from 'react';
import { Button, Icons } from '@/components/ui';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

export default function EnableNotifications({ devices = 0 }) {
  const [state, setState] = useState('checking'); // checking | unsupported | blocked | off | on
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [count, setCount] = useState(devices);

  const detect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') { setState('blocked'); return; }
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setState(sub ? 'on' : 'off');
    } catch {
      setState('off');
    }
  }, []);

  useEffect(() => { detect(); }, [detect]);

  const enable = async () => {
    setBusy(true);
    setNote('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        setNote(permission === 'denied' ? 'Notifications are blocked for this site in your browser settings.' : '');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const res = await fetch('/api/notifications/push-key');
      const { key, error } = await res.json();
      if (!res.ok || !key) throw new Error(error || 'Notifications are unavailable.');

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const saved = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const data = await saved.json().catch(() => ({}));
      if (!saved.ok) throw new Error(data.error || 'Could not save this device.');

      setCount(data.devices || count + 1);
      setState('on');
      setNote('This device will now get notifications.');
    } catch (e) {
      setNote(e.message || 'That did not work. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setNote('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('off');
      setCount(Math.max(0, count - 1));
      setNote('Notifications turned off for this device.');
    } catch (e) {
      setNote(e.message || 'Could not turn them off.');
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send the test.');
      setNote(data.message || 'Sent.');
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (state === 'checking') return null;

  return (
    <div className="push-panel">
      <div className="push-copy">
        <strong>
          {state === 'on' ? 'Phone notifications are on'
            : state === 'blocked' ? 'Notifications are blocked'
            : state === 'unsupported' ? 'This browser cannot show them'
            : 'Get them on your phone'}
        </strong>
        <p>
          {state === 'on'
            ? `Payments, plan expiry and receipts arrive with buttons — ${count} device${count === 1 ? '' : 's'} subscribed.`
            : state === 'blocked'
              ? 'Allow notifications for mzazi.shop in your browser or phone settings, then reload this page.'
              : state === 'unsupported'
                ? 'iPhone: add mzazi.shop to your Home Screen and open it from there. Android: use Chrome.'
                : 'Payment confirmations, expiry warnings and receipts — shown even when the app is closed.'}
        </p>
        {note && <p className="push-note" role="status" aria-live="polite">{note}</p>}
      </div>

      <div className="push-actions">
        {state === 'on' ? (
          <>
            <Button size="sm" variant="ghost" onClick={sendTest} loading={busy}>Send a test</Button>
            <Button size="sm" variant="ghost" onClick={disable} icon={<Icons.Bell size={14} />}>Turn off</Button>
          </>
        ) : state === 'off' ? (
          <Button size="sm" onClick={enable} loading={busy} icon={<Icons.Bell size={14} />}>Enable</Button>
        ) : null}
      </div>
    </div>
  );
}
