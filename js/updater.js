// [UPDATE_CONFIG]
const UPDATE_CONFIG = {
    owner: 'echo-tester',
    repo: 'lawyers-app',
    currentVersion: '4.0.5',
    stableTag: 'stable'
};
// [/UPDATE_CONFIG]


try {
    if (typeof window !== 'undefined') {
        window.APP_CURRENT_VERSION = UPDATE_CONFIG.currentVersion;
    }
} catch (_) { }

let updateInfo = null;
let isCheckingForUpdates = false;
let isDownloadingUpdate = false;
let __electronArch = '';

async function refreshWebAppToLatest() {
    try {
        try { updateUpdateStatus('جاري تحديث الموقع...', 'checking'); } catch (_) { }

        const timeoutMs = 6500;
        const withAbortTimeout = async (promiseFactory) => {
            let ctrl = null;
            let t = null;
            try {
                ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
                const p = Promise.resolve().then(() => promiseFactory(ctrl ? ctrl.signal : undefined));
                const tp = new Promise((_, rej) => {
                    t = setTimeout(() => {
                        try { if (ctrl) ctrl.abort(); } catch (_) { }
                        rej(new Error('timeout'));
                    }, timeoutMs);
                });
                return await Promise.race([p, tp]);
            } finally {
                try { if (t) clearTimeout(t); } catch (_) { }
            }
        };

        // تحقق من توفر الشبكة/الموقع فعليًا قبل محاولة "تحديث" حتى لا نعتمد على الكاش.
        try {
            if (navigator && navigator.onLine === false) {
                showToast('لا يوجد اتصال بالإنترنت. لا يمكن تحديث التطبيق الآن.', 'error');
                try { updateUpdateStatus('لا يوجد اتصال بالإنترنت', 'error'); } catch (_) { }
                return;
            }
        } catch (_) { }

        // 1) إذا كان هناك Service Worker: registration.update() يجبر فحص الشبكة (أفضل من fetch الذي قد يخدم من الكاش)
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker) {
                const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
                if (reg && typeof reg.update === 'function') {
                    await withAbortTimeout(() => reg.update());
                }
            }
        } catch (e) {
            try { updateUpdateStatus('حدث خطأ غير متوقع', 'error'); } catch (_) { }
            try { showToast('حدث خطأ غير متوقع حاول مرة اخرى لاحقا', 'error'); } catch (_) { }
            return;
        }

        // 2) فحص إضافي: طلب شبكة صريح مع cache-busting
        try {
            const pingUrl = location.origin + location.pathname + '?ping=' + Date.now();
            const resp = await withAbortTimeout((signal) => fetch(pingUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, max-age=0',
                    'Pragma': 'no-cache'
                },
                signal
            }));
            if (!resp || !resp.ok) {
                try { updateUpdateStatus('حدث خطأ غير متوقع', 'error'); } catch (_) { }
                try { showToast('حدث خطأ غير متوقع حاول مرة اخرى لاحقا', 'error'); } catch (_) { }
                return;
            }
        } catch (e) {
            try { updateUpdateStatus('حدث خطأ غير متوقع', 'error'); } catch (_) { }
            try { showToast('حدث خطأ غير متوقع حاول مرة اخرى لاحقا', 'error'); } catch (_) { }
            return;
        }

        const shouldResetOfflineCache = (function () {
            try {
                return String(localStorage.getItem('offline_cache_prepared') || '') === '1';
            } catch (_) {
                return false;
            }
        })();

        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('law_app_last_refresh_reason', shouldResetOfflineCache ? 'offline_reset' : 'reload_only');
            }
        } catch (_) { }

        // IMPORTANT: Do not disrupt normal browser users.
        // Only reset SW/cache if the user explicitly prepared offline files before.
        if (shouldResetOfflineCache) {
            try {
                if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.allSettled((regs || []).map(r => r.unregister()));
                }
            } catch (_) { }

            try {
                if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
                    const keys = await caches.keys();
                    await Promise.allSettled((keys || []).map(k => caches.delete(k)));
                }
            } catch (_) { }

            try { localStorage.removeItem('offline_cache_prepared'); } catch (_) { }
        }

        try {
            try { updateUpdateStatus('جاري إعادة تحميل الصفحة...', 'checking'); } catch (_) { }
            try {
                if (typeof showToast === 'function') {
                    showToast('جاري إعادة تحميل الصفحة لتطبيق آخر تحديث...', 'info');
                }
            } catch (_) { }
            const sep = (location.search && location.search.length > 0) ? '&' : '?';
            location.replace(location.pathname + location.search + sep + 'reloaded=' + Date.now() + location.hash);
        } catch (_) {
            try { location.reload(); } catch (_) { }
        }
    } catch (_) {
        try { showToast('حدث خطأ غير متوقع حاول مرة اخرى لاحقا', 'error'); } catch (__) { }
    }
}

function __notifyWebReloadResultIfAny() {
    try {
        if (typeof location === 'undefined') return;
        const url = new URL(location.href);
        const reloaded = url.searchParams.get('reloaded');
        if (!reloaded) return;

        let reason = '';
        try {
            reason = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('law_app_last_refresh_reason') || '') : '';
        } catch (_) { }

        const msg = (reason === 'offline_reset')
            ? 'تم تحديث ملفات الأوفلاين. افتح الصفحة من جديد للتأكد.'
            : 'تم تحديث الصفحة.';

        try {
            if (typeof updateUpdateStatus === 'function') {
                updateUpdateStatus(msg, 'up-to-date');
            }
        } catch (_) { }

        try {
            if (typeof showToast === 'function') {
                showToast(msg, 'success');
            }
        } catch (_) { }

        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('law_app_last_refresh_reason');
            }
        } catch (_) { }

        // Clean the URL so the message doesn't repeat.
        try {
            url.searchParams.delete('reloaded');
            history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
        } catch (_) { }
    } catch (_) { }
}


function initUpdater() {
    if (!window.electronAPI) {
        return;
    }


    window.electronAPI.onUpdateChecking(() => {
        updateUpdateStatus('جاري فحص التحديثات...', 'checking');
    });

    window.electronAPI.onUpdateAvailable((event, info) => {
        if (!isDownloadingUpdate) return;
        updateUpdateStatus(`تحديث متاح: الإصدار ${String((info && info.version) || '').trim()}`, 'available');
    });

    window.electronAPI.onUpdateNotAvailable(() => {
        if (!isCheckingForUpdates) return;
        updateInfo = null;
        updateUpdateStatus('التطبيق محدث لأحدث إصدار', 'up-to-date');
        hideUpdateInfo();
        hideInstallButton();
    });
    window.electronAPI.onUpdateDownloadProgress((event, progress) => {
        updateUpdateStatus(`جاري التحميل: ${progress.percent}%`, 'downloading');
        updateProgressBar(progress.percent);
    });

    window.electronAPI.onUpdateDownloaded(() => {
        updateUpdateStatus('تم تحميل التحديث - سيتم التثبيت وإعادة التشغيل', 'downloaded');
        hideProgressBar();
    });

    window.electronAPI.onUpdateError((event, error) => {
        updateUpdateStatus(`خطأ في التحديث: ${error}`, 'error');
        hideProgressBar();
        hideInstallButton();
        isCheckingForUpdates = false;
        isDownloadingUpdate = false;
    });
}


function extractSimpleVersionNumber(s) {
    try {
        const m = String(s || '').match(/v?(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
    } catch (_) { return 0; }
}

function formatSimpleVersion(num) { return num > 0 ? ('v' + num + '.0') : ''; }


function __extractSemverParts(text) {
    try {
        const s = String(text || '').trim();
        // Accept: v3.2.0, 3.2.0, v3.2, 3.2, v4, 4
        const m = s.match(/(?:^|[^\d])v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
        if (!m) return null;
        const major = parseInt(m[1] || '0', 10);
        const minor = parseInt(m[2] || '0', 10);
        const patch = parseInt(m[3] || '0', 10);
        if (!Number.isFinite(major)) return null;
        return { major, minor, patch };
    } catch (_) {
        return null;
    }
}

function __semverKey(parts) {
    try {
        if (!parts) return 0;
        const a = Number(parts.major || 0);
        const b = Number(parts.minor || 0);
        const c = Number(parts.patch || 0);
        // Big enough weights to preserve ordering.
        return (a * 1000000) + (b * 1000) + c;
    } catch (_) {
        return 0;
    }
}

function __formatSemverLabel(parts, fallback) {
    try {
        if (!parts) return String(fallback || '').trim();
        return `${Number(parts.major || 0)}.${Number(parts.minor || 0)}.${Number(parts.patch || 0)}`;
    } catch (_) {
        return String(fallback || '').trim();
    }
}

function pickExeAsset(assets, arch) {
    try {
        if (!Array.isArray(assets) || assets.length === 0) return null;

        const isInstallerAsset = (a) => {
            if (!a || typeof a.name !== 'string') return false;
            const n = a.name.trim();
            return /\.exe$/i.test(n) || /setup|install|lawyer/i.test(n);
        };

        const exeAssets = assets.filter(a => isInstallerAsset(a));
        if (exeAssets.length === 0) return null;

        const want = String(arch || '').trim().toLowerCase();
        const looksLikeArchMatch = (name) => {
            const n = String(name || '').toLowerCase();
            if (!want) return true;
            if (want === 'x64' || want === 'amd64') {
                return /\bx64\b/.test(n) || /win64/.test(n) || /amd64/.test(n);
            }
            if (want === 'ia32' || want === 'x86') {
                return /\bia32\b/.test(n) || /\bx86\b/.test(n) || /win32-ia32/.test(n);
            }
            if (want === 'arm64') {
                return /\barm64\b/.test(n);
            }
            return true;
        };

        const archFiltered = (() => {
            try {
                const candidates = exeAssets.filter(a => looksLikeArchMatch(a && a.name));
                return candidates.length ? candidates : exeAssets;
            } catch (_) {
                return exeAssets;
            }
        })();

        // Prefer assets that look like vX.Y.Z.exe then pick the highest version.
        const scored = archFiltered.map(a => {
            const name = String(a.name || '').trim();
            const parts = __extractSemverParts(name);
            const key = __semverKey(parts);
            const ts = Date.parse(a.updated_at || a.created_at || '') || 0;
            const looksVersioned = /\d+(?:\.\d+){1,2}/.test(name);
            return { a, key, ts, looksVersioned };
        });

        // First: versioned names with a parsed key.
        const withKey = scored.filter(x => x.looksVersioned && x.key > 0);
        if (withKey.length > 0) {
            withKey.sort((x, y) => (y.key - x.key) || (y.ts - x.ts));
            return withKey[0].a;
        }

        // Second: any installer asset, pick the newest by GitHub timestamp if available.
        scored.sort((x, y) => (y.ts - x.ts) || (String(y.a?.name || '').localeCompare(String(x.a?.name || ''))));
        return scored[0].a || null;
    } catch (_) {
        return null;
    }
}


function __getElectronInstalledAssetName() {
    try {
        if (!window.electronAPI) return '';
        return String(localStorage.getItem('electron_installed_update_asset_name') || '');
    } catch (_) {
        return '';
    }
}

function __setElectronInstalledAssetName(name) {
    try {
        if (!window.electronAPI) return;
        const v = String(name || '').trim();
        if (!v) return;
        localStorage.setItem('electron_installed_update_asset_name', v);
    } catch (_) { }
}


async function checkForUpdatesFromGitHubStable(arch) {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'LawyerApp',
            'Cache-Control': 'no-cache, no-store, max-age=0',
            'Pragma': 'no-cache'
        };

        const tag = String(UPDATE_CONFIG.stableTag || 'stable').trim() || 'stable';
        const ts = Date.now();
        const urls = [
            `https://api.github.com/repos/${UPDATE_CONFIG.owner}/${UPDATE_CONFIG.repo}/releases/tags/${encodeURIComponent(tag)}?_=${ts}`,
            `https://api.github.com/repos/${UPDATE_CONFIG.owner}/${UPDATE_CONFIG.repo}/releases/latest?_=${ts}`
        ];

        let rel = null;
        let lastError = null;
        for (const url of urls) {
            try {
                const resp = await fetch(url, { headers, cache: 'no-store' });
                if (!resp.ok) {
                    lastError = new Error(`HTTP ${resp.status}: ${resp.statusText}`);
                    continue;
                }
                rel = await resp.json();
                if (rel) break;
            } catch (error) {
                lastError = error;
            }
        }
        if (!rel) throw (lastError || new Error('release_not_found'));

        const asset = pickExeAsset(rel && rel.assets ? rel.assets : [], arch);
        const assetName = asset ? String(asset.name || '').trim() : '';
        const downloadUrl = asset ? String(asset.browser_download_url || '').trim() : '';

        const currentSemver = UPDATE_CONFIG.currentVersion || '0';
        const currentParts = __extractSemverParts(currentSemver);
        const assetParts = __extractSemverParts(assetName || (rel && rel.tag_name) || '');
        const currentKey = __semverKey(currentParts);
        const assetKey = __semverKey(assetParts);

        const hasUpdate = (assetKey > currentKey);
        const versionLabel = __formatSemverLabel(assetParts, assetName || (rel && (rel.name || rel.tag_name)) || '');

        if (!assetName || !downloadUrl) {
            return {
                hasUpdate: false,
                version: versionLabel || String(rel && (rel.tag_name || rel.name) ? (rel.tag_name || rel.name) : ''),
                versionNum: assetKey,
                releaseNotes: (rel && rel.body) ? rel.body : '',
                releaseDate: (rel && (rel.published_at || rel.created_at)) ? (rel.published_at || rel.created_at) : '',
                downloadUrl: '',
                assetName: '',
                mandatory: false
            };
        }

        return {
            hasUpdate: !!hasUpdate,
            version: versionLabel || assetName,
            versionNum: assetKey,
            releaseNotes: (rel && rel.body) ? rel.body : 'تحديثات وتحسينات عامة',
            releaseDate: (rel && (rel.published_at || rel.created_at)) ? (rel.published_at || rel.created_at) : '',
            downloadUrl,
            assetName,
            mandatory: false
        };
    } catch (error) {
        throw error;
    }
}


async function checkForUpdatesFromGitHub() {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'LawyerApp',
            'Cache-Control': 'no-cache, no-store, max-age=0',
            'Pragma': 'no-cache'
        };
        const ts = Date.now();
        const allUrl = `https://api.github.com/repos/${UPDATE_CONFIG.owner}/${UPDATE_CONFIG.repo}/releases?per_page=10&_=${ts}`;
        const respAll = await fetch(allUrl, { headers, cache: 'no-store' });
        if (!respAll.ok) throw new Error(`HTTP ${respAll.status}: ${respAll.statusText}`);
        const list = await respAll.json();

        const currentSemver = UPDATE_CONFIG.currentVersion || '0';
        const currentNum = extractSimpleVersionNumber(currentSemver);


        const mapped = (Array.isArray(list) ? list : []).filter(r => r && !r.draft && !r.prerelease).map(r => {
            let num = extractSimpleVersionNumber(r.tag_name);
            if (!num && Array.isArray(r.assets)) {
                for (const a of r.assets) {
                    const n = extractSimpleVersionNumber(a?.name || '');
                    if (n > num) num = n;
                }
            }
            return { rel: r, num };
        }).filter(x => x.num > 0);

        if (mapped.length === 0) {
            return { hasUpdate: false, version: formatSimpleVersion(currentNum), releaseNotes: '', releaseDate: '', downloadUrl: '', mandatory: false };
        }

        mapped.sort((a, b) => b.num - a.num);
        const best = mapped[0];
        const latestNum = best.num;
        const candidate = best.rel;

        const isNewer = latestNum > currentNum;
        const asset = pickExeAsset(candidate.assets || []);
        const downloadUrl = asset ? asset.browser_download_url : '';

        const effectiveHasUpdate = isNewer && !!downloadUrl;

        return {
            hasUpdate: effectiveHasUpdate,
            version: formatSimpleVersion(latestNum) || String(latestNum),
            versionNum: latestNum,
            releaseNotes: (candidate.body || 'تحديثات وتحسينات عامة'),
            releaseDate: candidate.published_at || candidate.created_at || '',
            downloadUrl,
            mandatory: false
        };
    } catch (error) {
        throw error;
    }
}


function compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;

        if (v1part > v2part) return 1;
        if (v1part < v2part) return -1;
    }

    return 0;
}


async function checkForUpdates() {
    if (isCheckingForUpdates) {
        showToast('جاري فحص التحديثات بالفعل...', 'info');
        return;
    }

    try {
        isCheckingForUpdates = true;
        updateUpdateStatus('جاري فحص التحديثات...', 'checking');
        updateInfo = null;
        hideInstallButton();
        hideUpdateInfo();

        try {
            const ver = await getCurrentVersion();
            if (ver) UPDATE_CONFIG.currentVersion = ver;
        } catch (e) { }
        try {
            if (window.electronAPI && typeof window.electronAPI.getProcessArch === 'function') {
                const ares = await window.electronAPI.getProcessArch();
                if (ares && ares.success && ares.arch) __electronArch = String(ares.arch || '').trim();
            }
        } catch (_) { }

        if (!window.electronAPI) {
            await refreshWebAppToLatest();
            return;
        }

        const githubResult = await checkForUpdatesFromGitHubStable(__electronArch);
        if (githubResult.hasUpdate) {
            updateInfo = {
                source: 'github-exe',
                version: githubResult.version,
                versionNum: githubResult.versionNum,
                releaseNotes: githubResult.releaseNotes,
                releaseDate: githubResult.releaseDate,
                downloadUrl: githubResult.downloadUrl,
                assetName: githubResult.assetName,
                mandatory: githubResult.mandatory
            };
            updateUpdateStatus(`تحديث متاح: الإصدار ${updateInfo.version}`, 'available');
            showUpdateInfo(updateInfo);
            showInstallButton();
            showToast(`تم العثور على تحديث جديد: الإصدار ${updateInfo.version}`, 'success');
        } else {
            updateUpdateStatus('التطبيق محدث لأحدث إصدار', 'up-to-date');
            hideInstallButton();
            hideUpdateInfo();
            showToast('التطبيق محدث لأحدث إصدار', 'success');
        }
    } catch (error) {
        console.error('خطأ في فحص التحديثات:', error);
        updateUpdateStatus('فشل في فحص التحديثات', 'error');
        hideInstallButton();
        hideUpdateInfo();
        showToast('فشل في فحص التحديثات: ' + error.message, 'error');
    } finally {
        isCheckingForUpdates = false;
    }
}

async function downloadAndInstallUpdate() {
    if (isDownloadingUpdate) {
        showToast('جاري تحميل التحديث بالفعل...', 'info');
        return;
    }

    if (!updateInfo || !updateInfo.version || !updateInfo.downloadUrl) {
        showToast('لا يوجد تحديث متاح للتثبيت', 'warning');
        return;
    }
    const confirmMsg = 'هل تريد تحميل وتثبيت الإصدار ' + updateInfo.version + ' الآن؟\n\nسيتم تنزيل ملف التحديث ثم فتح المُثبّت أمامك لإكمال التحديث. سيتم إغلاق البرنامج أثناء التثبيت.';
    const confirmed = window.safeConfirm ? await safeConfirm(confirmMsg) : confirm(confirmMsg);
    if (!confirmed) return;

    try {
        isDownloadingUpdate = true;
        updateUpdateStatus('جاري تحميل التحديث...', 'downloading');
        showProgressBar();
        hideInstallButton();

        if (!window.electronAPI || typeof window.electronAPI.downloadAndInstallFromGitHub !== 'function') {
            hideProgressBar();
            throw new Error('خدمة تثبيت التحديث غير متوفرة');
        }

        let suggested = '';
        try {
            suggested = String(updateInfo.assetName || '').trim();
            if (!suggested) {
                const pathFromUrl = new URL(updateInfo.downloadUrl).pathname || '';
                const base = pathFromUrl ? pathFromUrl.split('/').pop() : '';
                if (base) suggested = base;
            }
        } catch (_) { }

        const result = await window.electronAPI.downloadAndInstallFromGitHub(updateInfo.downloadUrl, suggested || undefined);
        if (!result || !result.success) {
            throw new Error(result && result.error ? result.error : 'فشل تحميل أو تثبيت التحديث');
        }

        updateUpdateStatus('جارِ فتح المُثبّت لإكمال التحديث...', 'installing');
    } catch (error) {
        console.error('خطأ في تحميل التحديث:', error);
        updateUpdateStatus('فشل في تحميل التحديث', 'error');
        hideProgressBar();
        showInstallButton();
        showToast('فشل في تحميل التحديث: ' + error.message, 'error');
    } finally {
        isDownloadingUpdate = false;
    }
}

function updateUpdateStatus(message, status) {
    const statusElement = document.getElementById('update-status-text');
    if (!statusElement) return;

    const icons = {
        'checking': 'ri-refresh-line animate-spin',
        'available': 'ri-download-cloud-2-line text-green-600',
        'up-to-date': 'ri-check-double-line text-green-600',
        'downloading': 'ri-download-line animate-pulse text-blue-600',
        'downloaded': 'ri-check-line text-green-600',
        'installing': 'ri-settings-3-line animate-spin text-blue-600',
        'error': 'ri-error-warning-line text-red-600'
    };

    const colors = {
        'checking': 'text-blue-600',
        'available': 'text-green-600',
        'up-to-date': 'text-green-600',
        'downloading': 'text-blue-600',
        'downloaded': 'text-green-600',
        'installing': 'text-blue-600',
        'error': 'text-red-600'
    };

    const icon = icons[status] || 'ri-question-line';
    const color = colors[status] || 'text-gray-600';

    statusElement.innerHTML = `<i class="${icon}"></i> <span class="${color}">${message}</span>`;
}


function showUpdateInfo(info) {
    const updateInfoElement = document.getElementById('update-info');
    const versionElement = document.getElementById('update-version');
    const notesElement = document.getElementById('update-notes');

    if (!(updateInfoElement && versionElement && notesElement)) return;

    versionElement.textContent = `الإصدار الجديد: ${info.version}`;

    const raw = (info.releaseNotes || '').trim();

    const escapeHTML = (s) => s.replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));

    const formatLines = (text) => {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return '<span class="text-gray-600">تحديثات وتحسينات عامة</span>';
        const items = lines.map(l => l.replace(/^[-*•]\s+/, '').replace(/^\d+\.[\s]+/, ''));
        return '<ul class="list-disc pr-5 space-y-1">' + items.map(it => '<li>' + escapeHTML(it) + '</li>').join('') + '</ul>';
    };

    notesElement.innerHTML = formatLines(raw);
    updateInfoElement.classList.remove('hidden');
}

// إخفاء معلومات التحديث
function hideUpdateInfo() {
    const updateInfoElement = document.getElementById('update-info');
    if (updateInfoElement) {
        updateInfoElement.classList.add('hidden');
    }
}

// إظهار زر التثبيت
function showInstallButton() {
    const installButton = document.getElementById('install-update-btn');
    if (installButton) {
        installButton.classList.remove('hidden');
    }
}

// إخفاء زر التثبيت
function hideInstallButton() {
    const installButton = document.getElementById('install-update-btn');
    if (installButton) {
        installButton.classList.add('hidden');
    }
}

// إظهار شريط ال��قدم
function showProgressBar() {
    const progressContainer = document.getElementById('update-progress-container');
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }
}

// إخفاء شريط التقدم
function hideProgressBar() {
    const progressContainer = document.getElementById('update-progress-container');
    if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
}

// تحديث شريط التقدم
function updateProgressBar(percent) {
    const progressBar = document.getElementById('update-progress-bar');
    const progressText = document.getElementById('update-progress-text');

    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }

    if (progressText) {
        progressText.textContent = `${percent}%`;
    }
}

// الحصول على الإصدار الحالي
async function getCurrentVersion() {
    try {
        if (window.electronAPI && window.electronAPI.getAppVersion) {
            const res = await window.electronAPI.getAppVersion();
            if (res && res.success && res.version) {
                try { window.APP_CURRENT_VERSION = res.version; } catch (_) { }
                return res.version;
            }
        }
    } catch (e) { }
    return UPDATE_CONFIG.currentVersion || '0.0';
}

// تهيئة التحديثات عند تحميل الصفحة
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try { __notifyWebReloadResultIfAny(); } catch (_) { }
            initUpdater();
        });
    } else {
        try { __notifyWebReloadResultIfAny(); } catch (_) { }
        initUpdater();
    }
}

// تصدير الدوال للاستخدام العام
if (typeof window !== 'undefined') {
    window.updaterAPI = {
        checkForUpdates,
        downloadAndInstallUpdate,
        getCurrentVersion
    };
}


