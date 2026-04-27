const CACHE_NAME = 'lawyer-pwa-v4.0.5';
const CACHE_PREFIX = 'lawyer-pwa-v';

const PRECACHE_URLS = [
  './',
  './accounts.html',
  './administrative.html',
  './archive.html',
  './barcode.html',
  './case-info.html',
  './clerk-papers.html',
  './expert-sessions.html',
  './index.html',
  './legal-library.html',
  './new.html',
  './reports.html',
  './search.html',
  './services.html',
  './session-edit.html',
  './sessions.html',
  './settings.html',
  './setup.html',

  './license_ar.txt',
  './manifest.json',
  
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-mobile.png',
  './icons/icon.ico',

  './css/local-fonts.css',
  './css/remixicon.css',
  './css/remixicon.woff2',
  './css/search-responsive.css',
  './css/style.css',
  './css/tailwind.min.css',

  './css/fonts/cairo-bold.woff2',
  './css/fonts/cairo-regular.woff2',
  './css/fonts/material-symbols.woff2',
  './css/fonts/roboto-bold.woff2',
  './css/fonts/roboto-light.woff2',
  './css/fonts/roboto-medium.woff2',
  './css/fonts/roboto-regular.woff2',

  './audio/barcode.mp3',
  './audio/sessions.mp3',
  './audio/task.mp3',
  './audio/task+sessions.mp3',

  './js/accounts.js',
  './js/administrative.js',
  './js/archive.js',
  './js/autocomplete.js',
  './js/barcode-page.js',
  './js/case_opponent_view.js',
  './js/clerk_papers.js',
  './js/clerk_papers_form.js',
  './js/client_view.js',
  './js/date-picker.js',
  './js/db.js',
  './js/edit_forms.js',
  './js/expert_sessions.js',
  './js/expert_sessions_form.js',
  './js/header.js',
  './js/html2pdf.bundle.min.js',
  './js/inline_edit.js',
  './js/lawyer-card.js',
  './js/legal_library.js',
  './js/main.js',
  './js/modal.js',
  './js/new-page.js',
  './js/notifications-portal.js',
  './js/opponent_navigation.js',
  './js/qr-scanner.js',
  './js/quick-sync.js',
  './js/reports-accounts.js',
  './js/reports-administrative.js',
  './js/reports-archive.js',
  './js/reports-cases.js',
  './js/reports-clerk-papers.js',
  './js/reports-client-comprehensive.js',
  './js/reports-expert-sessions.js',
  './js/reports-main.js',
  './js/reports-poa.js',
  './js/safe-confirm.js',
  './js/search-page.js',
  './js/services.js',
  './js/sessions.js',
  './js/sessions_calendar.js',
  './js/settings-users.js',
  './js/settings.js',
  './js/setup.js',
  './js/state.js',
  './js/test-data.js',
  './js/toast.js',
  './js/trial.js',
  './js/updater.js',

  './js/jsqr.js',
  './js/qrcode.min.js',

  './pwa-register.js',
];

const INSTALL_URLS = [];
const PRECACHE_MAX_ATTEMPTS = 5;
const PRECACHE_FETCH_TIMEOUT_MS = 90000;

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndCacheWithRetry(url, cache, options) {
  const forceRefresh = !!(options && options.forceRefresh);
  for (let attempt = 0; attempt < PRECACHE_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PRECACHE_FETCH_TIMEOUT_MS);
    try {
      const req = new Request(url, { cache: forceRefresh ? 'reload' : 'default' });
      const res = await fetch(req, {
        signal: controller.signal,
        cache: forceRefresh ? 'reload' : 'default'
      });
      clearTimeout(timeoutId);
      if (!res || !res.ok) throw new Error('Fetch failed');
      await cache.put(url, res.clone());

      return true;
    } catch (_) {
      clearTimeout(timeoutId);
    }
  }

  return false;
}

async function postPrecacheMessage(payload, sourceId) {
  try {
    if (sourceId) {
      const client = await clients.get(sourceId);
      if (client) {
        client.postMessage(payload);
        return;
      }
    }

    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    allClients.forEach((client) => client.postMessage(payload));
  } catch (_) { }
}

async function cleanupOldCaches() {
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== CACHE_NAME && String(k || '').indexOf(CACHE_PREFIX) === 0)
        .map((k) => caches.delete(k))
    );
  } catch (_) { }
}

let activePrecacheJob = null;

async function precacheUrls(urls, sourceId, options) {
  const list = Array.from(new Set([...(Array.isArray(urls) ? urls : []), ...INSTALL_URLS].filter(Boolean)));
  const forceRefresh = !!(options && options.forceRefresh);
  const requestKey = JSON.stringify({ list, forceRefresh });

  if (activePrecacheJob && activePrecacheJob.requestKey === requestKey) {
    return activePrecacheJob.promise;
  }

  activePrecacheJob = {
    requestKey,
    promise: (async () => {
      const cache = await caches.open(CACHE_NAME);
      const total = list.length;
      let done = 0;
      const failed = [];
      const batchSize = 2;

      for (let i = 0; i < list.length; i += batchSize) {
        const batch = list.slice(i, i + batchSize);
        await Promise.all(batch.map(async (url) => {
          try {
            const ok = await fetchAndCacheWithRetry(url, cache, { forceRefresh, sourceId });
            if (!ok) {
              failed.push(url);
            }
          } catch (_) {
            failed.push(url);
          } finally {
            done += 1;
            await postPrecacheMessage({ type: 'PRECACHE_PROGRESS', done, total }, sourceId);
          }
        }));
      }

      try {
        if (failed.length === 0) {
          await cleanupOldCaches();
        }
      } catch (_) { }

      return { done, total, failed };
    })().finally(() => {
      activePrecacheJob = null;
    })
  };

  return activePrecacheJob.promise;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener('message', (event) => {
  try {
    const data = event.data || {};
    if (data.type === 'SKIP_WAITING') {
      event.waitUntil(self.skipWaiting());
      return;
    }
    if (data.type !== 'PRECACHE_ALL' && data.type !== 'PRECACHE_URLS') return;

    const sourceId = (event.source && event.source.id) ? event.source.id : null;

    event.waitUntil(
      (async () => {
        const urls = (data.type === 'PRECACHE_URLS' && Array.isArray(data.urls)) ? data.urls : PRECACHE_URLS;
        const result = await precacheUrls(urls, sourceId, { forceRefresh: !!data.forceRefresh });
        await postPrecacheMessage({ type: 'PRECACHE_COMPLETE', done: result.done, total: result.total, failed: result.failed }, sourceId);
      })()
    );
  } catch (_) { }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let isGitHubApi = false;
  try {
    const u = new URL(req.url);
    const host = String(u.host || '').toLowerCase();
    if (host === 'api.github.com' || host === 'raw.githubusercontent.com' || host === 'objects.githubusercontent.com' || host === 'github.com') {
      isGitHubApi = true;
    }
  } catch (_) { }

  if (isGitHubApi) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(new Request(req, { cache: 'no-store' }));
        } catch (_) {
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        }
      })()
    );
    return;
  }

  let isSameOrigin = false;
  try {
    const u = new URL(req.url);
    isSameOrigin = (u.origin === self.location.origin);
  } catch (_) { }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(req, isSameOrigin ? { ignoreSearch: true } : undefined).then((cached) => {
        if (cached) return cached;

        return fetch(req)
          .catch(() => {
            if (req.mode === 'navigate') {
              return cache.match(req, isSameOrigin ? { ignoreSearch: true } : undefined)
                .then((navCached) => {
                  if (navCached) return navCached;

                  try {
                    const u = new URL(req.url);
                    const p = (u && u.pathname) ? String(u.pathname) : '';
                    if (/\/setup\.html$/i.test(p)) {
                      return cache.match('./setup.html') || cache.match('./index.html');
                    }
                  } catch (_) { }

                  return cache.match('./index.html');
                });
            }
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
      });
    })
  );
});
