(function () {
  // Never run PWA install/SW logic inside Electron or file:// pages.
  try {
    if (typeof window !== 'undefined' && window.electronAPI) return;
    if (typeof location !== 'undefined' && location.protocol === 'file:') return;
  } catch (_) {}

  let deferredInstallPrompt = null;
  let lastFailedPrecache = [];
  let precacheInFlight = false;
  let failedPrecacheRetryTimer = null;
  let failedPrecacheRetryAttempt = 0;
  const SERVICE_WORKER_READY_TIMEOUT_MS = 12000;
  const FAILED_PRECACHE_RETRY_DELAYS_MS = [0, 500, 1000, 2000, 4000, 8000, 15000];

  function waitFor(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function clearFailedPrecacheRetryTimer() {
    try {
      if (failedPrecacheRetryTimer) {
        clearTimeout(failedPrecacheRetryTimer);
        failedPrecacheRetryTimer = null;
      }
    } catch (_) {
      failedPrecacheRetryTimer = null;
    }
  }

  function resetFailedPrecacheRetry() {
    clearFailedPrecacheRetryTimer();
    failedPrecacheRetryAttempt = 0;
  }

  function canRetryFailedPrecache() {
    try {
      return Array.isArray(lastFailedPrecache)
        && lastFailedPrecache.length > 0
        && !(lastFailedPrecache.length === 1 && lastFailedPrecache[0] === '__precache_start_failed__');
    } catch (_) {
      return false;
    }
  }

  function scheduleFailedPrecacheRetry() {
    try {
      clearFailedPrecacheRetryTimer();
      if (!canRetryFailedPrecache()) return;

      if (failedPrecacheRetryAttempt >= FAILED_PRECACHE_RETRY_DELAYS_MS.length) {
        // استنفدنا كل المحاولات الصامتة — بنعرض رسالة بأسماء الملفات الفاشلة
        var failedNames = '';
        try {
          failedNames = lastFailedPrecache.map(function (url) {
            try { return url.split('/').pop() || url; } catch (_) { return url; }
          }).join('، ');
        } catch (_) { failedNames = 'بعض الملفات'; }
        showPrecacheError('فشل الحصول على: ' + failedNames + '\nيرجى المحاولة لاحقًا.');
        return;
      }

      // retry صامت — بدون أي رسالة للمستخدم، شريط التقدم فاضل ظاهر
      showPrecacheError('');
      const delayMs = FAILED_PRECACHE_RETRY_DELAYS_MS[failedPrecacheRetryAttempt];
      failedPrecacheRetryTimer = setTimeout(function () {
        try {
          failedPrecacheRetryTimer = null;
          if (precacheInFlight || !canRetryFailedPrecache()) return;
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            scheduleFailedPrecacheRetry();
            return;
          }
          failedPrecacheRetryAttempt += 1;
          requestPrecacheUrls(lastFailedPrecache);
        } catch (_) {}
      }, delayMs);
    } catch (_) {}
  }

  function isStandaloneMode() {
    try {
      if (typeof window === 'undefined') return false;
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone);
    } catch (e) {
      return false;
    }
  }

  function isIOS() {
    try {
      const ua = (navigator && navigator.userAgent) ? String(navigator.userAgent) : '';
      if (/iPad|iPhone|iPod/.test(ua)) return true;

      // iPadOS/iOS "Request Desktop Website" may look like Macintosh in UA.
      const maxTouch = Number((navigator && navigator.maxTouchPoints) || 0) || 0;
      const platform = String((navigator && navigator.platform) || '').toLowerCase();
      const uaLc = ua.toLowerCase();
      if (platform === 'macintel' && maxTouch > 1) return true;
      if (uaLc.indexOf('macintosh') >= 0 && maxTouch > 1) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function isOnSetupPage() {
    try {
      if (typeof location === 'undefined') return false;
      return /\/setup\.html$/i.test(location.pathname || '') || /setup\.html$/i.test(location.href || '');
    } catch (e) {
      return false;
    }
  }

  function canShowInstallPromptNow() {
    try {
      if (!isOnSetupPage()) return false;
      if (isStandaloneMode()) return false;

      const disabled = localStorage.getItem('pwa_install_disabled') === '1';
      if (disabled) return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  function ensureInstallUI() {
    try {
      if (typeof document === 'undefined') return null;
      if (document.getElementById('pwa-install-overlay')) return document.getElementById('pwa-install-overlay');

      const overlay = document.createElement('div');
      overlay.id = 'pwa-install-overlay';
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:rgba(0,0,0,0.6)',
        'z-index:999998',
        'display:none',
        'align-items:center',
        'justify-content:center',
        'padding:16px'
      ].join(';');

      const box = document.createElement('div');
      box.style.cssText = [
        'width:min(520px, 100%)',
        'background:#ffffff',
        'border-radius:14px',
        'padding:16px',
        'box-shadow:0 10px 30px rgba(0,0,0,0.25)',
        'font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial'
      ].join(';');

      const title = document.createElement('div');
      title.textContent = 'إنشاء أيقونة التطبيق';
      title.style.cssText = 'font-weight:800;color:#0f172a;margin-bottom:10px;text-align:center;';

      const msg = document.createElement('div');
      msg.id = 'pwa-install-msg';
      msg.style.cssText = 'display:none;color:#334155;font-size:14px;line-height:1.6;text-align:center;margin-bottom:12px;';

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';

      const installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.type = 'button';
      installBtn.textContent = 'إنشاء أيقونة التطبيق';
      installBtn.style.cssText = 'padding:10px 14px;border-radius:10px;border:0;background:#0EA5E9;color:#fff;font-weight:800;cursor:pointer;';

      const installInfo = document.createElement('button');
      installInfo.id = 'pwa-install-info-install';
      installInfo.type = 'button';
      installInfo.textContent = '؟';
      installInfo.style.cssText = 'width:34px;height:34px;border-radius:9999px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;';

      const neverBtn = document.createElement('button');
      neverBtn.id = 'pwa-install-never-btn';
      neverBtn.type = 'button';
      neverBtn.textContent = 'لا شكرًا';
      neverBtn.style.cssText = 'padding:10px 14px;border-radius:10px;border:1px solid #fecaca;background:#fff;color:#991b1b;font-weight:800;cursor:pointer;';

      const neverInfo = document.createElement('button');
      neverInfo.id = 'pwa-install-info-never';
      neverInfo.type = 'button';
      neverInfo.textContent = '؟';
      neverInfo.style.cssText = 'width:34px;height:34px;border-radius:9999px;border:1px solid #fecaca;background:#fff;color:#991b1b;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;';

      const leftCol = document.createElement('div');
      leftCol.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:center;';
      leftCol.appendChild(installBtn);
      leftCol.appendChild(installInfo);

      const rightCol = document.createElement('div');
      rightCol.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:center;';
      rightCol.appendChild(neverBtn);
      rightCol.appendChild(neverInfo);

      btnRow.appendChild(leftCol);
      btnRow.appendChild(rightCol);

      box.appendChild(title);
      box.appendChild(msg);
      box.appendChild(btnRow);
      overlay.appendChild(box);

      (document.body || document.documentElement).appendChild(overlay);
      return overlay;
    } catch (e) {
      return null;
    }
  }

  function showInstallUI(mode) {
    try {
      if (isStandaloneMode()) return;
      const overlay = ensureInstallUI();
      if (!overlay) return;
      const installBtn = document.getElementById('pwa-install-btn');

      if (installBtn) {
        installBtn.style.display = 'inline-block';
        installBtn.disabled = false;
        installBtn.style.opacity = '1';
        installBtn.style.cursor = 'pointer';
        var isInst = false;
        try { isInst = localStorage.getItem('pwa_installed') === '1'; } catch(e){}
        installBtn.textContent = isInst ? 'إعادة إنشاء الأيقونة' : 'إنشاء أيقونة التطبيق';
      }

      overlay.style.display = 'flex';
    } catch (e) {}
  }

  function updateInstallButtonReady() {
    try {
      const installBtn = document.getElementById('pwa-install-btn');
      if (!installBtn) return;
      installBtn.disabled = false;
      installBtn.style.opacity = '1';
      installBtn.style.cursor = 'pointer';
      var isInst = false;
      try { isInst = localStorage.getItem('pwa_installed') === '1'; } catch(e){}
      installBtn.textContent = isInst ? 'إعادة إنشاء الأيقونة' : 'إنشاء أيقونة التطبيق';
    } catch (e) {}
  }

  function hideInstallUI() {
    try {
      const overlay = document.getElementById('pwa-install-overlay');
      if (overlay) overlay.style.display = 'none';
    } catch (e) {}
  }

  function ensurePrecacheUI() {
    try {
      if (typeof document === 'undefined') return null;
      if (document.getElementById('pwa-precache-overlay')) return document.getElementById('pwa-precache-overlay');

      const overlay = document.createElement('div');
      overlay.id = 'pwa-precache-overlay';
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:rgba(0,0,0,0.6)',
        'z-index:999999',
        'display:none',
        'align-items:center',
        'justify-content:center',
        'padding:16px'
      ].join(';');

      const box = document.createElement('div');
      box.style.cssText = [
        'width:min(520px, 100%)',
        'background:#ffffff',
        'border-radius:14px',
        'padding:16px',
        'box-shadow:0 10px 30px rgba(0,0,0,0.25)',
        'font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial'
      ].join(';');

      const title = document.createElement('div');
      title.textContent = 'جاري تجهيز التطبيق للعمل بدون اتصال';
      title.style.cssText = 'font-weight:700;color:#0f172a;margin-bottom:10px;text-align:center;';

      const barWrap = document.createElement('div');
      barWrap.style.cssText = 'width:100%;height:12px;background:#e5e7eb;border-radius:9999px;overflow:hidden;';

      const bar = document.createElement('div');
      bar.id = 'pwa-precache-bar';
      bar.style.cssText = 'width:0%;height:100%;background:#0EA5E9;transition:width .2s ease;';
      barWrap.appendChild(bar);

      const label = document.createElement('div');
      label.id = 'pwa-precache-label';
      label.textContent = '...';
      label.style.cssText = 'margin-top:10px;font-size:13px;color:#334155;text-align:center;';

      const err = document.createElement('div');
      err.id = 'pwa-precache-error';
      err.style.cssText = 'display:none;margin-top:10px;font-size:13px;color:#b91c1c;text-align:center;';

      const retryRow = document.createElement('div');
      retryRow.id = 'pwa-precache-retry-row';
      retryRow.style.cssText = 'display:none;margin-top:12px;gap:10px;justify-content:center;flex-wrap:wrap;';

      const retryBtn = document.createElement('button');
      retryBtn.id = 'pwa-precache-retry-btn';
      retryBtn.type = 'button';
      retryBtn.textContent = 'إعادة المحاولة';
      retryBtn.style.cssText = 'padding:10px 14px;border-radius:10px;border:0;background:#111827;color:#fff;font-weight:800;cursor:pointer;';

      const closeBtn = document.createElement('button');
      closeBtn.id = 'pwa-precache-close-btn';
      closeBtn.type = 'button';
      closeBtn.textContent = 'إغلاق';
      closeBtn.style.cssText = 'padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:800;cursor:pointer;';

      retryRow.appendChild(retryBtn);
      retryRow.appendChild(closeBtn);

      box.appendChild(title);
      box.appendChild(barWrap);
      box.appendChild(label);
      box.appendChild(err);
      box.appendChild(retryRow);
      overlay.appendChild(box);

      (document.body || document.documentElement).appendChild(overlay);
      return overlay;
    } catch (e) {
      return null;
    }
  }

  function showPrecacheUI() {
    const overlay = ensurePrecacheUI();
    if (overlay) overlay.style.display = 'flex';
  }

  function hidePrecacheUI() {
    try {
      const overlay = document.getElementById('pwa-precache-overlay');
      if (overlay) overlay.style.display = 'none';
    } catch (e) {}
  }

  function showPrecacheError(message) {
    try {
      const err = document.getElementById('pwa-precache-error');
      const row = document.getElementById('pwa-precache-retry-row');
      if (err) {
        err.textContent = message || '';
        err.style.display = message ? 'block' : 'none';
      }
      if (row) row.style.display = message ? 'flex' : 'none';
    } catch (e) {}
  }

  function isOfflineReady() {
    try {
      return localStorage.getItem('pwa_offline_ready') === '1';
    } catch (_) {
      return false;
    }
  }

  function setPrecacheInFlight(nextState) {
    try {
      precacheInFlight = !!nextState;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pwa:precache:state', { detail: { running: precacheInFlight } }));
      }
    } catch (_) {
      precacheInFlight = !!nextState;
    }
  }

  function dispatchPrecacheComplete(done, total, failed) {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pwa:precache:complete', {
          detail: {
            done: Number(done || 0),
            total: Number(total || 0),
            failed: Array.isArray(failed) ? failed : []
          }
        }));
      }
    } catch (_) {}
  }

  function getPrecacheStartErrorMessage(error) {
    try {
      if (error && error.message === 'SW_INSTALL_FAILED') {
        return 'تعذر تجهيز التطبيق للعمل بدون اتصال. بعض الملفات لم تكتمل. ثبّت الإنترنت ثم أعد المحاولة.';
      }
    } catch (_) {}
    return 'تعذر تجهيز التطبيق للعمل بدون اتصال الآن. تأكد من الإنترنت ثم أعد المحاولة.';
  }

  function failPrecacheStart(error) {
    const message = getPrecacheStartErrorMessage(error);
    resetFailedPrecacheRetry();
    setPrecacheInFlight(false);
    showPrecacheUI();
    showPrecacheError(message);
    try { localStorage.removeItem('pwa_offline_ready'); } catch (_) {}
    try { localStorage.removeItem('pwa_force_precache'); } catch (_) {}
    try { lastFailedPrecache = ['__precache_start_failed__']; } catch (_) { lastFailedPrecache = ['__precache_start_failed__']; }
    dispatchPrecacheComplete(0, 0, lastFailedPrecache);
    return false;
  }

  function watchServiceWorkerRegistration(registration) {
    try {
      if (!registration || registration.__pwaInstallWatcherBound) return;
      registration.__pwaInstallWatcherBound = true;

      const bindInstallingWorker = function (worker) {
        try {
          if (!worker || worker.__pwaInstallStateWatcherBound) return;
          worker.__pwaInstallStateWatcherBound = true;
          worker.addEventListener('statechange', function () {
            try {
              if (worker.state === 'redundant' && precacheInFlight) {
                failPrecacheStart(new Error('SW_INSTALL_FAILED'));
              }
            } catch (_) {}
          });
        } catch (_) {}
      };

      bindInstallingWorker(registration.installing);
      registration.addEventListener('updatefound', function () {
        bindInstallingWorker(registration.installing);
      });
    } catch (_) {}
  }

  async function refreshServiceWorkerRegistration(timeoutMs) {
    const startedAt = Date.now();
    let registration = null;
    try {
      registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return null;
      watchServiceWorkerRegistration(registration);
      try {
        await registration.update();
      } catch (_) {}
    } catch (_) {
      return null;
    }

    while ((Date.now() - startedAt) < timeoutMs) {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return null;
        watchServiceWorkerRegistration(registration);

        if (registration.waiting && typeof registration.waiting.postMessage === 'function') {
          try { registration.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (_) {}
        }

        if (registration.installing) {
          await waitFor(250);
          continue;
        }

        if (registration.active) {
          return registration;
        }
      } catch (_) {}

      await waitFor(250);
    }

    return registration;
  }

  async function getServiceWorkerTarget(timeoutMs) {
    const startedAt = Date.now();

    while ((Date.now() - startedAt) < timeoutMs) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          watchServiceWorkerRegistration(registration);
          if (registration.installing && registration.installing.state === 'redundant' && !registration.active && !registration.waiting) {
            throw new Error('SW_INSTALL_FAILED');
          }
          const target = registration.active || registration.waiting || registration.installing;
          if (target) {
            return target;
          }
        }
      } catch (error) {
        if (error && error.message === 'SW_INSTALL_FAILED') {
          throw error;
        }
      }

      await waitFor(250);
    }

    throw new Error('SW_READY_TIMEOUT');
  }

  var __precacheMaxPct = 0;
  function updatePrecacheUI(done, total) {
    try {
      const bar = document.getElementById('pwa-precache-bar');
      const label = document.getElementById('pwa-precache-label');
      if (!bar || !label) return;
      var raw = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
      if (done >= total && total > 0) raw = 100;
      __precacheMaxPct = Math.max(__precacheMaxPct, raw);
      const pct = __precacheMaxPct;
      bar.style.width = pct + '%';
      label.textContent = 'تحميل ملفات التطبيق: ' + done + ' / ' + total + ' (' + pct + '%)';
    } catch (e) {}
  }

  async function requestPrecacheAll(reason, forceDownload) {
    try {
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

      if (precacheInFlight) {
        showPrecacheUI();
        return true;
      }

      if (!forceDownload) {
        const forced = (function () {
          try { return localStorage.getItem('pwa_force_precache') === '1'; } catch (_) { return false; }
        })();
        if (isOfflineReady() && !forced) return false;
      }

      setPrecacheInFlight(true);
      __precacheMaxPct = 0;
      showPrecacheUI();
      updatePrecacheUI(0, 0);
      showPrecacheError('');

      if (forceDownload) {
        try { await refreshServiceWorkerRegistration(SERVICE_WORKER_READY_TIMEOUT_MS); } catch (_) {}
      }

      const target = await getServiceWorkerTarget(SERVICE_WORKER_READY_TIMEOUT_MS);
      if (!target) {
        return failPrecacheStart(new Error('SW_READY_TIMEOUT'));
      }
      target.postMessage({ type: 'PRECACHE_ALL', reason: reason || 'manual', forceRefresh: !!forceDownload });
      return true;
    } catch (e) {
      return failPrecacheStart(e);
    }
  }

  async function requestPrecacheUrls(urls) {
    try {
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
      if (!Array.isArray(urls) || urls.length === 0) return false;
      if (precacheInFlight) {
        showPrecacheUI();
        return true;
      }

      setPrecacheInFlight(true);
      __precacheMaxPct = 0;
      showPrecacheUI();
      updatePrecacheUI(0, urls.length);
      showPrecacheError('');

      const target = await getServiceWorkerTarget(SERVICE_WORKER_READY_TIMEOUT_MS);
      if (!target) {
        return failPrecacheStart(new Error('SW_READY_TIMEOUT'));
      }
      target.postMessage({ type: 'PRECACHE_URLS', urls, forceRefresh: true });
      return true;
    } catch (e) {
      return failPrecacheStart(e);
    }
  }

  try {
    if (typeof document !== 'undefined') {
      const head = document.head || document.getElementsByTagName('head')[0];
      if (head) {
        if (!document.querySelector('link[rel="manifest"]')) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = 'manifest.json';
          head.appendChild(link);
        }

        if (!document.querySelector('meta[name="theme-color"]')) {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = '#0EA5E9';
          head.appendChild(meta);
        }
      }
    }
  } catch (e) {}

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('beforeinstallprompt', function (e) {
        try {
          e.preventDefault();
          deferredInstallPrompt = e;
          try {
            window.dispatchEvent(new CustomEvent('pwa:install:ready'));
            updateInstallButtonReady();
          } catch (_) {}
        } catch (err) {}
      });

      try {
        if (typeof window !== 'undefined') {
          window.pwaAPI = window.pwaAPI || {};
          window.pwaAPI.canPromptInstall = function () {
            try { return !!deferredInstallPrompt; } catch (_) { return false; }
          };
          window.pwaAPI.promptInstall = function () {
            try {
              if (!deferredInstallPrompt) return Promise.resolve(false);
              var p = deferredInstallPrompt;
              p.prompt();
              deferredInstallPrompt = null;
              return Promise.resolve(p.userChoice).then(function (choice) {
                return !!(choice && choice.outcome === 'accepted');
              }).catch(function () {
                return false;
              });
            } catch (_) {
              try { deferredInstallPrompt = null; } catch (_) {}
              return Promise.resolve(false);
            }
          };
        }
      } catch (e) {}

      window.addEventListener('load', function () {
        try {
          navigator.serviceWorker.register('./service-worker.js').then(function (registration) {
            watchServiceWorkerRegistration(registration);
            requestPrecacheAll('page_open', false);
            try {
              if (navigator && navigator.storage && typeof navigator.storage.persist === 'function') {
                navigator.storage.persist().catch(function () { });
              }
            } catch (_) {}
          }).catch(function () {
            failPrecacheStart(new Error('SW_READY_TIMEOUT'));
          });
        } catch (e) {
          failPrecacheStart(e);
        }

      });

      window.addEventListener('online', function () {
        try {
          if (precacheInFlight || !canRetryFailedPrecache()) return;
          clearFailedPrecacheRetryTimer();
          requestPrecacheUrls(lastFailedPrecache);
        } catch (_) {}
      });

      // Progress messages from SW
      navigator.serviceWorker.addEventListener('message', function (event) {
        try {
          const data = event.data || {};
          if (data.type === 'PRECACHE_PROGRESS') {
            setPrecacheInFlight(true);
            showPrecacheUI();
            updatePrecacheUI(Number(data.done || 0), Number(data.total || 0));
            try {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('pwa:precache:progress', { detail: { done: Number(data.done || 0), total: Number(data.total || 0) } }));
              }
            } catch (_) {}
          }
          if (data.type === 'PRECACHE_COMPLETE') {
            setPrecacheInFlight(false);
            updatePrecacheUI(Number(data.done || 0), Number(data.total || 0));
            try { lastFailedPrecache = Array.isArray(data.failed) ? data.failed : []; } catch (_) { lastFailedPrecache = []; }
            if (lastFailedPrecache.length > 0) {
              try { localStorage.removeItem('pwa_offline_ready'); } catch (_) {}
              try { localStorage.removeItem('pwa_force_precache'); } catch (_) {}
              scheduleFailedPrecacheRetry();
              try {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('pwa:precache:complete', { detail: { done: Number(data.done || 0), total: Number(data.total || 0), failed: lastFailedPrecache } }));
                }
              } catch (_) {}
            } else {
              resetFailedPrecacheRetry();
              showPrecacheError('');
              try { localStorage.setItem('pwa_offline_ready', '1'); } catch (_) {}
              try { localStorage.removeItem('pwa_force_precache'); } catch (_) {}
              setTimeout(hidePrecacheUI, 500);
              try {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('pwa:precache:complete', { detail: { done: Number(data.done || 0), total: Number(data.total || 0), failed: [] } }));
                }
              } catch (_) {}
            }
          }
        } catch (e) {}
      });

      // API + زر تحديث ملفات الموقع: نفس شاشة تجهيز الأوفلاين (إجباري)
      try {
        if (typeof window !== 'undefined') {
          window.pwaAPI = window.pwaAPI || {};
          window.pwaAPI.isPrecacheRunning = function () {
            try { return !!precacheInFlight; } catch (_) { return false; }
          };
          window.pwaAPI.isOfflineReady = function () {
            return isOfflineReady();
          };
          window.pwaAPI.forcePrecacheAll = function () {
            try { localStorage.setItem('pwa_force_precache', '1'); } catch (_) {}
            try { localStorage.removeItem('pwa_offline_ready'); } catch (_) {}
            return requestPrecacheAll('install_button', true);
          };
        }
      } catch (e) {}

      try {
        if (typeof document !== 'undefined') {
          document.addEventListener('click', function (ev) {
            try {
              const t = ev && ev.target;
              const clicked = t && t.closest ? t.closest('[id]') : null;
              const id = clicked ? clicked.id : (t && t.id);

              if (clicked && clicked.id === 'pwa-precache-retry-btn') {
              resetFailedPrecacheRetry();
              requestPrecacheUrls(lastFailedPrecache);
              return;
            }
            if (clicked && clicked.id === 'pwa-precache-close-btn') {
              hidePrecacheUI();
              return;
            }
            if (clicked && clicked.id === 'pwa-install-never-btn') {
              try { localStorage.setItem('pwa_install_disabled', '1'); } catch (_) {}
              hideInstallUI();
              return;
            }
            if (clicked && clicked.id === 'pwa-install-info-install') {
              try { alert('إنشاء أيقونة التطبيق يساعدك على فتحه بسرعة والعمل بدون اتصال.'); } catch (_) {}
              return;
            }
            if (clicked && clicked.id === 'pwa-install-info-never') {
              try { alert('لن يتم عرض نافذة إنشاء الأيقونة مرة أخرى على هذا الجهاز.'); } catch (_) {}
              return;
            }
            var installBtnEl = t && t.closest ? t.closest('#pwa-install-btn') : null;
            if (installBtnEl) {
              try {
                installBtnEl.disabled = true;
                installBtnEl.style.opacity = '0.6';
                installBtnEl.style.cursor = 'not-allowed';

                // iOS Safari doesn't support beforeinstallprompt; show manual Add-to-Home-Screen steps.
                if (isIOS()) {
                  try {
                    var msgEl = document.getElementById('pwa-install-msg');
                    if (msgEl) {
                      msgEl.style.display = 'block';
                      msgEl.textContent = 'على iPhone: اضغط زر المشاركة (Share) ثم "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).';
                    } else {
                      try { alert('على iPhone: اضغط زر المشاركة (Share) ثم \"إضافة إلى الشاشة الرئيسية\" (Add to Home Screen).'); } catch (_) {}
                    }
                  } catch (_) {}

                  installBtnEl.disabled = false;
                  installBtnEl.style.opacity = '1';
                  installBtnEl.style.cursor = 'pointer';
                  return;
                }

                var doPromptInstall = function () {
                  try {
                    var msgEl = document.getElementById('pwa-install-msg');
                    if (msgEl) {
                      msgEl.style.display = 'block';
                      msgEl.textContent = 'إذا ظهرت نافذة من المتصفح، فوافق عليها لإنشاء أيقونة التطبيق على الشاشة الرئيسية.';
                    }
                    var promise = (window.pwaAPI && typeof window.pwaAPI.promptInstall === 'function') ? window.pwaAPI.promptInstall() : null;
                    installBtnEl.disabled = false;
                    installBtnEl.style.opacity = '1';
                    installBtnEl.style.cursor = 'pointer';
                    if (!promise || typeof promise.then !== 'function') {
                      installBtnEl.textContent = 'إعادة إنشاء الأيقونة';
                      return;
                    }
                    promise.then(function (accepted) {
                      try {
                        var msgEl = document.getElementById('pwa-install-msg');
                        if (accepted) {
                          if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = 'تم قبول الطلب. انتظر قليلًا حتى ينشئ المتصفح أيقونة التطبيق.'; }
                        } else {
                          if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = 'تم إلغاء العملية. يمكنك المحاولة مرة أخرى.'; }
                        }
                        installBtnEl.textContent = 'إعادة إنشاء الأيقونة';
                      } catch (_) {}
                    }).catch(function () {
                      try {
                        var msgEl = document.getElementById('pwa-install-msg');
                        if (msgEl) { msgEl.style.display = 'none'; msgEl.textContent = ''; }
                        installBtnEl.textContent = 'إعادة إنشاء الأيقونة';
                      } catch (_) {}
                    });
                  } catch (_) {}
                };

                if (window.pwaAPI && typeof window.pwaAPI.forcePrecacheAll === 'function') {
                  var onPrecacheComplete = function (event) {
                    try {
                      var detail = (event && event.detail) ? event.detail : {};
                      var failed = Array.isArray(detail.failed) ? detail.failed : [];
                      if (failed.length > 0) {
                        installBtnEl.disabled = false;
                        installBtnEl.style.opacity = '1';
                        installBtnEl.style.cursor = 'pointer';
                        var msgEl = document.getElementById('pwa-install-msg');
                        if (msgEl) {
                          msgEl.style.display = 'block';
                          msgEl.textContent = 'تعذر تنزيل كل الملفات. لا تفصل الإنترنت وحاول مرة أخرى.';
                        }
                        return;
                      }
                    } catch (_) {}
                    doPromptInstall();
                  };
                  window.addEventListener('pwa:precache:complete', onPrecacheComplete, { once: true });
                  var alreadyRunning = !!(window.pwaAPI && typeof window.pwaAPI.isPrecacheRunning === 'function' && window.pwaAPI.isPrecacheRunning());
                  var msgEl = document.getElementById('pwa-install-msg');
                  if (alreadyRunning) {
                    if (msgEl) {
                      msgEl.style.display = 'block';
                      msgEl.textContent = 'جاري تجهيز التطبيق بالكامل. انتظر اكتمال التحميل ثم ستظهر نافذة إنشاء الأيقونة.';
                    }
                    showPrecacheUI();
                  } else {
                    if (msgEl) {
                      msgEl.style.display = 'block';
                      msgEl.textContent = 'جاري تجهيز التطبيق بالكامل قبل إنشاء الأيقونة...';
                    }
                    window.pwaAPI.forcePrecacheAll();
                  }
                } else {
                  doPromptInstall();
                }
              } catch (_) {}
            }
          } catch (_) {}
        }, true);
      }
    } catch (_) {}

      window.addEventListener('appinstalled', function () {
        try { deferredInstallPrompt = null; } catch (_) {}
        try { localStorage.setItem('pwa_installed', '1'); } catch (_) {}
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pwa:appinstalled'));
          }
        } catch (_) {}
        // Auto-refresh of cache after install is disabled to save bandwidth
        // unless explicitly requested by the user click.
      });


    }
  } catch (e) {}
})();
