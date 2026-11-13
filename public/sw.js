// MZAZI TECH — service worker
// Minimal PWA worker: caches static build assets for offline-capable installs.
const CACHE = 'mzazi-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin GET requests; skip API calls and non-static assets
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for pages (always fresh), cache-first for static assets
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname === '/icon.png' || url.pathname === '/apple-icon.png') {
    e.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then(res => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then(c => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  } else {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
    );
  }
});

// ─── Push notifications ──────────────────────────────────────────────────────
// The point of this worker is the notification a phone shows when the app is
// closed: icon, title, one line, and buttons that do something. Android only
// renders `actions` on notifications shown *from* a service worker, which is why
// this lives here and not in page code.
//
// Action titles are the only thing the Notification API understands; the URL for
// each button travels in `data.urls` and is resolved on click.

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'MZAZI TECH', body: event.data ? event.data.text() : '' };
  }

  const actions = [];
  const urls = {};
  for (const a of payload.actions || []) {
    if (!a || !a.action || !a.title) continue;
    actions.push({ action: a.action, title: a.title });
    if (a.url) urls[a.action] = a.url;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'MZAZI TECH', {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-192.png',
      tag: payload.tag || undefined,
      renotify: Boolean(payload.tag),
      vibrate: [90, 50, 90],
      data: { url: payload.url || '/dashboard', urls },
      actions,
    })
  );
});

// Tapping the body opens the app; tapping a button opens that button's page.
// An existing tab is reused (and navigated) rather than piling up new ones.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  const target = (data.urls && data.urls[event.action]) || data.url || '/dashboard';

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      try {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        if ('navigate' in client) await client.navigate(target);
        return;
      } catch { /* keep looking */ }
    }
    await self.clients.openWindow(target);
  })());
});
