(function () {

    // تم إلغاء نظام الأيام التجريبي بالكامل.

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const stripMarks = (s) => {
        try { return String(s || '').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\uFEFF]/g, ''); } catch (_) { return String(s || ''); }
    };
    const toLatinDigits = (s) => {
        try {
            return String(s || '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
        } catch (_) {
            return String(s || '');
        }
    };

    const REMOTE_RUNTIME_CONFIG_CONTENTS_API = 'https://api.github.com/repos/echo-tester/lawyers-app/contents';
    const REMOTE_RUNTIME_CONFIG_CACHE_KEY = 'lawyer_remote_runtime_config_v1';
    const REMOTE_RUNTIME_CONFIG_TOKEN_PREFIX = 'Z2l0aHVi';
    const GITHUB_CONFIG = (() => {
        try {
            if (typeof window !== 'undefined' && window.__LAWYER_APP_GITHUB_CONFIG && typeof window.__LAWYER_APP_GITHUB_CONFIG === 'object') {
                return window.__LAWYER_APP_GITHUB_CONFIG;
            }
        } catch (_) { }
        const cfg = { owner: 'echo-tester', repo: 'lawyers-data', token: '' };
        try {
            if (typeof window !== 'undefined') {
                window.__LAWYER_APP_GITHUB_CONFIG = cfg;
            }
        } catch (_) { }
        return cfg;
    })();

    function normalizeRemoteRuntimeConfig(raw) {
        try {
            const data = raw && typeof raw === 'object' ? raw : null;
            const githubToken = String(
                typeof raw === 'string'
                    ? raw
                    : (data && (data.githubToken || data.token)) || ''
            ).trim();
            return { githubToken };
        } catch (_) {
            return { githubToken: '' };
        }
    }

    function extractGithubTokenFromText(rawText) {
        return ''; // Disabled as per user request to use filename only
    }

    function extractGithubTokenFromEncodedFileName(rawName) {
        try {
            const cleanName = String(rawName || '').trim();
            if (!cleanName || cleanName.indexOf(REMOTE_RUNTIME_CONFIG_TOKEN_PREFIX) !== 0) return '';
            let decoded = '';
            try { decoded = atob(cleanName); } catch (_) { decoded = ''; }
            decoded = String(decoded || '').trim();
            if (/^(gh[pousr]_[A-Za-z0-9_]+)$/i.test(decoded)) return decoded;
            if (/^(github_pat_[A-Za-z0-9_]+)$/i.test(decoded)) return decoded;
        } catch (_) { }
        return '';
    }

    function debugRemoteRuntimeConfig(step, payload) {
        void step;
        void payload;
    }

    function extractRemoteRuntimeConfigFromContentsData(contentsData) {
        try {
            const items = Array.isArray(contentsData) ? contentsData : [];
            for (const item of items) {
                const token = extractGithubTokenFromEncodedFileName(item && item.name);
                if (token) return { githubToken: token, source: 'contents.name' };
            }
        } catch (_) { }
        return { githubToken: '' };
    }

    function readRemoteRuntimeConfigCache() {
        try {
            if (typeof localStorage === 'undefined') return null;
            const raw = localStorage.getItem(REMOTE_RUNTIME_CONFIG_CACHE_KEY);
            if (!raw) return null;
            return normalizeRemoteRuntimeConfig(JSON.parse(raw));
        } catch (_) {
            return null;
        }
    }

    function writeRemoteRuntimeConfigCache(config) {
        try {
            if (typeof localStorage === 'undefined') return;
            const data = Object.assign({}, normalizeRemoteRuntimeConfig(config), { _cachedAt: Date.now() });
            localStorage.setItem(REMOTE_RUNTIME_CONFIG_CACHE_KEY, JSON.stringify(data));
        } catch (_) { }
    }

    function applyRemoteRuntimeConfig(config) {
        const normalized = normalizeRemoteRuntimeConfig(config);
        try {
            if (typeof window !== 'undefined') {
                window.__LAWYER_REMOTE_RUNTIME_CONFIG = normalized;
                window.__LAWYER_APP_GITHUB_CONFIG = GITHUB_CONFIG;
                window.__LAWYER_LOAD_REMOTE_RUNTIME_CONFIG = loadRemoteRuntimeConfig;
                window.__LAWYER_ENSURE_GITHUB_CONFIG_READY = ensureGitHubConfigReady;
            }
        } catch (_) { }
        const nextToken = String(normalized && normalized.githubToken || '').trim();
        if (nextToken) {
            GITHUB_CONFIG.token = nextToken;
            const currentResult = getRemoteRuntimeConfigLastResult();
            if (currentResult && currentResult.ok === true && currentResult.reason && currentResult.reason !== 'unknown') {
                setRemoteRuntimeConfigLastResult(Object.assign({}, currentResult, { tokenLength: nextToken.length }));
            } else {
                setRemoteRuntimeConfigLastResult({ ok: true, reason: 'success', tokenLength: nextToken.length });
            }
        } else {
            const currentResult = getRemoteRuntimeConfigLastResult();
            if (!currentResult || currentResult.ok === true || !currentResult.reason || currentResult.reason === 'unknown') {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'missing_token' });
            }
        }
        return normalized;
    }

    function shouldSkipRemoteRuntimeConfigFetch() {
        try {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
        } catch (_) { }
        return false;
    }

    function setRemoteRuntimeConfigLastResult(result) {
        try {
            if (typeof window !== 'undefined') {
                window.__LAWYER_REMOTE_RUNTIME_CONFIG_LAST_RESULT = Object.assign({ ok: false, reason: 'unknown' }, result || {});
            }
        } catch (_) { }
    }

    function getRemoteRuntimeConfigLastResult() {
        try {
            if (typeof window !== 'undefined' && window.__LAWYER_REMOTE_RUNTIME_CONFIG_LAST_RESULT) {
                return window.__LAWYER_REMOTE_RUNTIME_CONFIG_LAST_RESULT;
            }
        } catch (_) { }
        return { ok: false, reason: 'unknown' };
    }

    function getRemoteConfigFailureMessage(details) {
        const info = details || getRemoteRuntimeConfigLastResult();
        const status = Number(info && info.status || 0);
        if (info && info.reason === 'offline') return 'لا يوجد اتصال بالإنترنت حالياً';
        if (info && info.reason === 'local_not_found') return 'تعذر العثور على ملفات التفعيل';
        if (info && info.reason === 'asset_not_found') return 'تعذر الوصول إلى خدمة التفعيل';
        if (info && info.reason === 'http_status') {
            if (status === 404) return 'تعذر الوصول إلى خدمة التفعيل';
            if (status === 401 || status === 403) return 'تعذر الاتصال بخدمة التفعيل';
            if (status === 429) return 'GitHub رفض الطلب مؤقتاً بسبب كثرة المحاولات';
            if (status >= 500) return 'خادم GitHub غير متاح حالياً';
        }
        if (info && info.reason === 'empty') return 'بيانات التفعيل غير متاحة';
        if (info && info.reason === 'missing_token') return 'تعذر قراءة بيانات التفعيل';
        if (info && info.reason === 'network_error') return 'تعذر الوصول إلى خدمة التفعيل';
        if (info && info.reason === 'aborted') return 'انتهت مهلة الاتصال بخدمة التفعيل';
        return 'تعذر تحميل بيانات التفعيل';
    }

    function getActivationFolderFailureMessage(lastError) {
        const reason = typeof lastError === 'string' ? lastError : '';
        if (!GITHUB_CONFIG.token) {
            return getRemoteConfigFailureMessage();
        }
        try {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                return 'لا يوجد اتصال بالإنترنت حالياً';
            }
        } catch (_) { }
        if (reason === 'offline') return 'لا يوجد اتصال بالإنترنت حالياً';
        if (reason === 'missing_license_id') return 'معرف الترخيص غير موجود';
        if (reason === 'missing_token') return getRemoteConfigFailureMessage();
        if (reason === 'missing_log_txt') return 'سجل التفعيل غير موجود على الخادم';
        if (typeof lastError === 'number') {
            if (lastError === 401 || lastError === 403) return 'تعذر الاتصال بخدمة التفعيل';
            if (lastError === 429) return 'GitHub رفض الطلب مؤقتاً بسبب كثرة المحاولات';
            if (lastError >= 500) return 'خادم GitHub غير متاح حالياً';
            return `تعذر التحقق من المعرف من GitHub (HTTP ${lastError})`;
        }
        if (lastError && lastError.name === 'AbortError') return 'انتهت مهلة التحقق من GitHub';
        return 'تعذر الوصول إلى خادم التفعيل';
    }

    function getEnsureActivationFailureMessage(res) {
        const reason = String(res && res.error || '');
        if (reason === 'offline') return 'لا يوجد اتصال بالإنترنت حالياً';
        if (reason === 'missing_license_id') return 'معرف الترخيص غير موجود';
        if (reason === 'activation_folder_missing') return 'معرف الترخيص غير موجود على الخادم';
        if (reason === 'create_log_put_failed_401' || reason === 'create_log_put_failed_403') return 'تعذر إنشاء سجل التفعيل';
        if (reason === 'ensure_put_failed_401' || reason === 'ensure_put_failed_403') return 'تعذر تحديث بيانات التفعيل';
        if (reason === 'create_log_put_failed_404') return 'تعذر الوصول لمسار سجل التفعيل على GitHub';
        if (reason.indexOf('create_log_put_failed_') === 0) return 'تعذر إنشاء سجل التفعيل على GitHub';
        if (reason.indexOf('log_put_failed_') === 0) return 'تعذر تحديث سجل التفعيل على GitHub';
        return 'تعذر تجهيز سجل التفعيل';
    }

    async function readGitHubErrorDetails(response) {
        const details = {
            status: response ? Number(response.status || 0) : 0,
            statusText: response ? String(response.statusText || '') : '',
            message: '',
            documentationUrl: '',
            raw: '',
            acceptedPermissions: '',
            oauthScopes: '',
            ratelimitRemaining: '',
            requestId: ''
        };
        try {
            if (!response) return details;
            try {
                if (response.headers && response.headers.get) {
                    details.acceptedPermissions = String(response.headers.get('x-accepted-github-permissions') || '').trim();
                    details.oauthScopes = String(response.headers.get('x-oauth-scopes') || '').trim();
                    details.ratelimitRemaining = String(response.headers.get('x-ratelimit-remaining') || '').trim();
                    details.requestId = String(response.headers.get('x-github-request-id') || '').trim();
                }
            } catch (_) { }
            const raw = await response.text();
            details.raw = String(raw || '');
            try {
                const parsed = JSON.parse(details.raw || '{}');
                details.message = String(parsed && parsed.message || '').trim();
                details.documentationUrl = String(parsed && parsed.documentation_url || '').trim();
            } catch (_) {
                details.message = String(details.raw || '').trim();
            }
        } catch (_) { }
        return details;
    }

    function getActivationLogWriteFailureMessage(result) {
        const reason = String(result && result.error || '');
        const details = result && result.details ? result.details : null;
        const status = Number(details && details.status || 0);
        const githubMessage = String(details && details.message || '').trim();

        if (status === 401) return 'تعذر التحقق من بيانات التفعيل';
        if (status === 403) {
            if (/resource not accessible by personal access token/i.test(githubMessage)) {
                return 'تعذر تحديث سجل التفعيل';
            }
            if (/write access to repository not granted/i.test(githubMessage)) {
                return 'تعذر تحديث سجل التفعيل';
            }
            if (/not authorized/i.test(githubMessage) || /forbidden/i.test(githubMessage)) {
                return 'تعذر تحديث سجل التفعيل';
            }
            return 'تعذر تحديث سجل التفعيل';
        }
        if (status === 404) return 'مسار سجل التفعيل غير موجود على GitHub';
        if (status === 409) return 'حدث تعارض أثناء تحديث سجل التفعيل';
        if (status === 422) return 'GitHub رفض محتوى سجل التفعيل';
        if (reason.indexOf('log_put_failed_') === 0) return 'تعذر تحديث سجل التفعيل على GitHub';
        return 'تعذر تسجيل التفعيل على GitHub';
    }

    function shouldRetryActivationLogWrite(result) {
        const reason = String(result && result.error || '');
        const details = result && result.details ? result.details : null;
        const status = Number(details && details.status || 0);
        if (status === 401 || status === 403 || status === 404 || status === 422) return false;
        if (reason === 'limit_reached') return false;
        return true;
    }

    async function loadRemoteRuntimeConfig(options) {
        const forceRefresh = !!(options && options.forceRefresh);
        let windowCachedConfig = null;
        let localStorageCachedConfig = null;
        debugRemoteRuntimeConfig('load:start', {
            forceRefresh,
            hasWindowConfig: !!(typeof window !== 'undefined' && window.__LAWYER_REMOTE_RUNTIME_CONFIG && window.__LAWYER_REMOTE_RUNTIME_CONFIG.githubToken),
            hasTokenInMemory: !!GITHUB_CONFIG.token
        });

        if (!forceRefresh) {
            try {
                if (typeof window !== 'undefined' && window.__LAWYER_REMOTE_RUNTIME_CONFIG && window.__LAWYER_REMOTE_RUNTIME_CONFIG.githubToken) {
                    windowCachedConfig = window.__LAWYER_REMOTE_RUNTIME_CONFIG;
                }
            } catch (_) { }

                async function syncVersionToLog(licenseId) {
                    try {
                        await ensureGitHubConfigReady();
                        if (!licenseId) return;
                        try { if (navigator && navigator.onLine === false) return; } catch (e) { }
                        const folderCheck = await activationFolderExists(licenseId);
                        if (!folderCheck.exists) return;
                        let lastActivationDateTime = '';
                        try { lastActivationDateTime = String(await getSetting('lastActivationDateTime') || '').trim(); } catch (e) { return; }
                        if (!lastActivationDateTime) return;

                        const res = await readActivationLogFromGitHub(licenseId);
                        if (!res || !res.ok || !res.sha) return;
                        const stats = normalizeActivationStats(licenseId, res.data || {});
                        const activations = (stats.activations || []).map(a => ({ ...a }));
                        const maxCount = stats.max || 4;
                        const idx = activations.findIndex(a => String((a && a.activatedAt) || '').trim() === lastActivationDateTime);
                        if (idx < 0) return;
                        const currentVersion = getAppVersion();
                        if (String(activations[idx].version || '').trim() === String(currentVersion || '').trim()) return;
                        activations[idx].version = String(currentVersion || '').trim() || getAppVersion();

                        const textContent = buildActivationLogText(licenseId, maxCount, activations);
                        const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;
                        const putRes = await fetch(`${baseUrl}/log.txt?t=${Date.now()}`, {
                            method: 'PUT', cache: 'no-store',
                            headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ message: 'تحديث نسخة التطبيق في سجل التفعيل', content: btoa(unescape(encodeURIComponent(textContent))), sha: res.sha })
                        });
                        if (!putRes || !putRes.ok) return;
                        try { await renderActivationStats(licenseId); } catch (_) { }
                    } catch (_) { }
                }

                try {
                    if (typeof window !== 'undefined') {
                        window.__syncVersionToActivationLog = syncVersionToLog;
                    }
                } catch (_) { }

            localStorageCachedConfig = readRemoteRuntimeConfigCache();
        }

        if (shouldSkipRemoteRuntimeConfigFetch()) {
            const cached = localStorageCachedConfig || readRemoteRuntimeConfigCache() || windowCachedConfig;
            if (cached && cached.githubToken) {
                setRemoteRuntimeConfigLastResult({ ok: true, reason: 'cache', source: 'cache' });
                return applyRemoteRuntimeConfig(cached);
            }
            setRemoteRuntimeConfigLastResult({ ok: false, reason: 'offline' });
            return applyRemoteRuntimeConfig({ githubToken: '' });
        }

        if (forceRefresh) {
            try {
                if (typeof window !== 'undefined') window.__LAWYER_REMOTE_RUNTIME_CONFIG_PROMISE = null;
            } catch (_) { }
        }

        try {
            if (typeof window !== 'undefined' && window.__LAWYER_REMOTE_RUNTIME_CONFIG_PROMISE) {
                return await window.__LAWYER_REMOTE_RUNTIME_CONFIG_PROMISE;
            }
        } catch (_) { }

        const loader = (async () => {
            let fetchError = null;
            const tryContentsMetadataToken = async () => {
                const ctrl = new AbortController();
                const tid = setTimeout(() => { try { ctrl.abort(); } catch (_) { } }, 10000);
                try {
                    debugRemoteRuntimeConfig('fetch:contents_api:start', { url: REMOTE_RUNTIME_CONFIG_CONTENTS_API });
                    const contentsRes = await fetch(`${REMOTE_RUNTIME_CONFIG_CONTENTS_API}?t=${Date.now()}`, {
                        cache: 'no-store',
                        signal: ctrl.signal,
                        headers: { 'Accept': 'application/vnd.github.v3+json' }
                    });
                    if (!contentsRes || !contentsRes.ok) {
                        const err = new Error('contents_not_ok');
                        err.code = 'http_status';
                        err.status = contentsRes ? contentsRes.status : 0;
                        if (err.status === 404) err.code = 'local_not_found';
                        throw err;
                    }
                    debugRemoteRuntimeConfig('fetch:contents_api:ok', {
                        status: contentsRes.status,
                        contentType: String(contentsRes.headers && contentsRes.headers.get ? (contentsRes.headers.get('content-type') || '') : '')
                    });
                    const contentsData = await contentsRes.json();
                    debugRemoteRuntimeConfig('fetch:contents_api:data', {
                        itemsCount: Array.isArray(contentsData) ? contentsData.length : 0,
                        itemNames: Array.isArray(contentsData)
                            ? contentsData.map((item) => ({
                                name: String(item && item.name || ''),
                                type: String(item && item.type || '')
                            }))
                            : []
                    });
                    const extracted = extractRemoteRuntimeConfigFromContentsData(contentsData);
                    debugRemoteRuntimeConfig('fetch:contents_api:extracted', {
                        source: extracted && extracted.source ? extracted.source : 'none',
                        hasToken: !!(extracted && extracted.githubToken),
                        tokenLength: String(extracted && extracted.githubToken || '').length
                    });
                    const parsed = normalizeRemoteRuntimeConfig(extracted);
                    if (!parsed || !parsed.githubToken) {
                        const err = new Error('no_token');
                        err.code = 'missing_token';
                        throw err;
                    }
                    return parsed;
                } finally {
                    clearTimeout(tid);
                }
            };

            let fetchedConfig = null;
            try {
                fetchedConfig = await tryContentsMetadataToken().catch((err) => {
                    fetchError = err || null;
                    debugRemoteRuntimeConfig('fetch:contents_api:failed', {
                        code: String(err && err.code || ''),
                        status: Number(err && err.status || 0),
                        name: String(err && err.name || ''),
                        message: String(err && err.message || '')
                    });
                    return null;
                });
            } catch (err) {
                fetchError = err || null;
                debugRemoteRuntimeConfig('fetch:config:exception', {
                    code: String(err && err.code || ''),
                    status: Number(err && err.status || 0),
                    name: String(err && err.name || ''),
                    message: String(err && err.message || '')
                });
            }

            if (fetchedConfig) {
                writeRemoteRuntimeConfigCache(fetchedConfig);
                setRemoteRuntimeConfigLastResult({
                    ok: true,
                    reason: 'remote',
                    source: REMOTE_RUNTIME_CONFIG_CONTENTS_API
                });
                debugRemoteRuntimeConfig('load:remote_success', {
                    source: 'contents.name',
                    tokenLength: String(fetchedConfig.githubToken || '').length
                });
                return applyRemoteRuntimeConfig(fetchedConfig);
            }

            const fallbackCache = localStorageCachedConfig || readRemoteRuntimeConfigCache() || windowCachedConfig;
            if (fallbackCache && fallbackCache.githubToken) {
                setRemoteRuntimeConfigLastResult({ ok: true, reason: 'cache_fallback', source: 'cache', warning: fetchError ? String(fetchError.code || fetchError.message || '') : '' });
                debugRemoteRuntimeConfig('load:cache_fallback', {
                    tokenLength: String(fallbackCache.githubToken || '').length,
                    warning: fetchError ? String(fetchError.code || fetchError.message || '') : ''
                });
                return applyRemoteRuntimeConfig(fallbackCache);
            }

            if (fetchError && fetchError.name === 'AbortError') {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'aborted' });
            } else if (fetchError && fetchError.code === 'local_not_found') {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'local_not_found' });
            } else if (fetchError && fetchError.code === 'asset_not_found') {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'asset_not_found' });
            } else if (fetchError && fetchError.code === 'http_status') {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'http_status', status: Number(fetchError.status || 0) });
            } else if (fetchError && fetchError.code === 'empty') {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'empty' });
            } else if (fetchError && fetchError.code === 'missing_token') {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'missing_token' });
            } else if (shouldSkipRemoteRuntimeConfigFetch()) {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'offline' });
            } else {
                setRemoteRuntimeConfigLastResult({ ok: false, reason: 'network_error' });
            }
            debugRemoteRuntimeConfig('load:failed', getRemoteRuntimeConfigLastResult());
            return applyRemoteRuntimeConfig({ githubToken: '' });
        })();

        try {
            if (typeof window !== 'undefined') {
                window.__LAWYER_REMOTE_RUNTIME_CONFIG_PROMISE = loader;
            }
        } catch (_) { }

        try {
            return await loader;
        } finally {
            try {
                if (typeof window !== 'undefined' && window.__LAWYER_REMOTE_RUNTIME_CONFIG_PROMISE === loader) {
                    window.__LAWYER_REMOTE_RUNTIME_CONFIG_PROMISE = null;
                }
            } catch (_) { }
        }
    }

    async function ensureGitHubConfigReady() {
        try {
            if (GITHUB_CONFIG.token) return GITHUB_CONFIG;
            await loadRemoteRuntimeConfig();
            return GITHUB_CONFIG;
        } catch (_) {
            return GITHUB_CONFIG;
        }
    }

    function __buildGitHubHeaders(extra) {
        const h = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (GITHUB_CONFIG.token) h['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
        return extra ? Object.assign(h, extra) : h;
    }

    async function refreshLicenseRuntimeData(licenseId) {
        const remoteConfig = await loadRemoteRuntimeConfig({ forceRefresh: true });
        const effectiveLicenseId = String(licenseId || '').trim();
        if (!effectiveLicenseId) {
            return { ok: true, refreshed: true, hasLicenseId: false, remoteConfig };
        }

        try { await verifyAndSyncActivationLogInSettings(effectiveLicenseId); } catch (_) { }
        try { await syncOfficeNameToLog(effectiveLicenseId); } catch (_) { }
        try { await renderActivationStats(effectiveLicenseId); } catch (_) { }
        try { await refreshActivationTableBody(effectiveLicenseId); } catch (_) { }
        try { await updateCurrentOfficeNameInTable(); } catch (_) { }

        return { ok: true, refreshed: true, hasLicenseId: true, remoteConfig };
    }

    async function activationFolderExists(licenseId) {
        try {
            if (!licenseId) return { exists: false, offline: false, networkError: false };
            try { if (navigator && navigator.onLine === false) return { exists: false, offline: true, networkError: false }; } catch (_) { }
            await ensureGitHubConfigReady();
            const timestamp = Date.now();
            const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;
            const folderRes = await fetch(`${baseUrl}?t=${timestamp}`, {
                cache: 'no-store',
                headers: __buildGitHubHeaders()
            });
            if (folderRes && folderRes.status === 404) return { exists: false, offline: false, networkError: false };
            if (!folderRes || !folderRes.ok) return { exists: false, offline: false, networkError: true };
            const folderData = await folderRes.json().catch(() => null);
            const found = Array.isArray(folderData) && folderData.length > 0;
            return { exists: found, offline: false, networkError: false };
        } catch (_) {
            return { exists: false, offline: false, networkError: true };
        }
    }

    /** عدد إعادة المحاولات عند التحقق من وجود مجلد المعرف (لتجاوز فشل الطلب أو الشبكة) */
    const ACTIVATION_FOLDER_RETRIES = 5;

    /** عداد لفشل التحقق من الرخصة قبل تسجيل الخروج التلقائي */
    let __licenseFailureCount = 0;
    const MAX_LICENSE_FAILURE_THRESHOLD = 5;

    /** رقم إصدار التطبيق للكتابة في log.txt (من النافذة أو قيمة افتراضية) */
    function getAppVersion() {
        try {
            if (typeof window !== 'undefined' && window.APP_CURRENT_VERSION) return String(window.APP_CURRENT_VERSION);
        } catch (_) { }
    return '4.0.7';
    }

    /** إزالة رقم إصدار المتصفح (مثل 140 / كروميوم) من اسم الجهاز */
    function stripBrowserVersionFromDeviceName(s) {
        try {
            let t = String(s || '').trim();
            t = t.replace(/\s*\/\s*\d{2,4}(\.\d+)?/g, '');
            t = t.replace(/\s+\d{2,4}(\.\d+)?(?=\s|$)/g, '');
            t = t.replace(/\s+/g, ' ').trim();
            return t || s;
        } catch (_) { return String(s || ''); }
    }

    /** استخراج اسم المتصفح ديناميكياً من UA بدون أسماء ثابتة */
    function detectBrowserName(ua) {
        try {
            const skipPattern = /^(mozilla|applewebkit|gecko|mobile|khtml|like|compatible|version|linux|android|iphone|ipad|darwin)$/i;
            const tokens = String(ua || '').match(/([A-Za-z][\w]*)\/([\d.]+)/g) || [];
            for (let i = tokens.length - 1; i >= 0; i--) {
                const tokenName = tokens[i].split('/')[0];
                if (!skipPattern.test(tokenName)) return tokenName;
            }
        } catch (_) { }
        return '';
    }

    /** اسم الجهاز: إلكترون = hostname، متصفح/موبايل = userAgent/platform وغيرها. لا يعطل التطبيق عند الفشل. */
    async function getDeviceName() {
        const fallback = 'غير معروف';
        try {
            if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.getDeviceName === 'function') {
                const res = await Promise.race([
                    window.electronAPI.getDeviceName(),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))
                ]).catch(() => null);
                if (res && res.success && res.deviceName && String(res.deviceName).trim()) {
                    const electronName = String(res.deviceName).trim();
                    try {
                        const ua = String(navigator.userAgent || '');
                        const uaMatch = ua.match(/\((?:Windows NT|Linux|Mac OS X)[^)]*\)/);
                        const uaName = uaMatch ? uaMatch[0].replace(/^\(|\)$/g, '').trim() : '';
                        if (uaName && uaName !== electronName) return `${electronName} | ${uaName}`;
                    } catch (_) { }
                    return electronName;
                }
            }
        } catch (_) { }
        try {
            if (typeof navigator === 'undefined') return fallback;
            
            // المحاولة الأولى: استخدام UserAgentData الحديث (دقيق جداً للأندرويد في المتصفحات الحديثة)
            if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
                try {
                    const vals = await navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
                    if (vals.model && String(vals.model).trim()) {
                        let p = vals.platform || 'Android';
                        let v = vals.platformVersion ? ` ${vals.platformVersion}` : '';
                        return `${vals.model} (${p}${v})`.trim();
                    }
                } catch (_) { }
            }

            let name = '';
            const ua = String(navigator.userAgent);
            
            if (ua.includes('Android')) {
                // محاولة استخراج الموديل من الـ UA للأندرويد
                const verMatch = ua.match(/Android\s+([^\s;)]+)/);
                const verStr = verMatch ? ` (Android ${verMatch[1]})` : '';
                
                // البحث عن الموديل قبل كلمة Build أو في نهاية القوس
                let modelMatch = ua.match(/;\s+([^;)]+)\s+Build/);
                if (!modelMatch) modelMatch = ua.match(/Android\s+[^\s;)]+;\s+([^;)]+)/);
                
                const model = modelMatch ? modelMatch[1].trim() : 'Android Device';
                const browser = detectBrowserName(ua);
                name = model + verStr + (browser ? ' - ' + browser : '');
            } else if (ua.includes('iPhone') || ua.includes('iPad')) {
                const verMatch = ua.match(/OS\s+([^\s;)]+)\s+like\s+Mac/);
                const verStr = verMatch ? ` (iOS ${verMatch[1].replace(/_/g, '.')})` : '';
                const model = ua.includes('iPhone') ? 'iPhone' : 'iPad';
                const browser = detectBrowserName(ua);
                name = model + verStr + (browser ? ' - ' + browser : '');
            }

            if (!name) {
                const m = ua.match(/\((?:Windows NT|Linux|Mac OS X)[^)]*\)/);
                if (m && m[0]) {
                    name = m[0].replace(/^\(|\)$/g, '').trim();
                } else if (ua.length > 60) {
                    name = ua.substring(0, 60).trim() + '…';
                } else {
                    name = ua.trim();
                }
            }

            if (name && name.length > 80) name = name.substring(0, 80).trim() + '…';
            return stripBrowserVersionFromDeviceName(name) || fallback;
        } catch (_) {
            return fallback;
        }
    }

    /** تنسيق تاريخ ووقت سهل القراءة للتسجيل في اللوج */
    function formatActivationDateTime(date) {
        try {
            const d = date instanceof Date ? date : new Date(date);
            if (isNaN(d.getTime())) return '';
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            const sec = String(d.getSeconds()).padStart(2, '0');
            return `${y}-${m}-${day} ${h}:${min}:${sec}`;
        } catch (_) { return ''; }
    }

    /** بناء محتوى نص log.txt من قائمة التفعيلات (كل سجل قد يحتوي signed out في نفس الكتلة؛ لا قسم خروج منفصل) */
    function buildActivationLogText(licenseId, maxCount, activations) {
        const lines = [];
        lines.push(`MAX: ${String(maxCount || 4)}`);
        lines.push(`ID:${String(licenseId || '')}`);
        lines.push('______________________');
        for (const a of (activations || [])) {
            const name = String(a.officeName || '').trim();
            if (!name) continue;
            const at = String(a.activatedAt || '').trim();
            const dev = String(a.deviceName || '').trim();
            const ver = String(a.version || '').trim();
            const so = String(a.signedOutAt || '').trim();
            lines.push(`OFFICE:${name}`);
            lines.push(`activated in : ${at || ''}`);
            lines.push(`DEVICE:${dev || 'غير معروف'}`);
            lines.push(`VERSION:${ver || getAppVersion()}`);
            if (so) lines.push(`signed out : ${so}`);
            lines.push('');
            lines.push('');
        }
        return lines.join('\n').replace(/\n{3,}$/g, '\n\n') + '\n';
    }

    function showLicenseSkeleton() {
        try {
            if (!/settings\.html$/.test(window.location.pathname)) return;

            const container = document.querySelector('#settings-section-license')
                || document.querySelector('#modal-content .grid');
            if (!container) {
                setTimeout(showLicenseSkeleton, 50);
                return;
            }

            let licenseCard = document.getElementById('license-settings-card');
            if (!licenseCard) {
                licenseCard = document.createElement('div');
                licenseCard.id = 'license-settings-card';
                licenseCard.className = 'bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 shadow-sm transition-all h-fit';
                try { container.appendChild(licenseCard); } catch (_) { }
            }

            if (!licenseCard) return;
            if (licenseCard.getAttribute('data-skeleton') === '1') return;
            if ((licenseCard.innerHTML || '').trim().length > 0) return;

            licenseCard.setAttribute('data-skeleton', '1');
            licenseCard.innerHTML = `
                <div class="text-center mb-2 px-1 pt-1 sm:px-0 sm:pt-0">
                    <div class="w-10 h-10 bg-slate-300 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm animate-pulse"></div>
                    <h3 class="text-base font-bold text-slate-700 mb-1">حالة الترخيص</h3>
                    <p class="text-sm text-gray-600">جاري التحميل...</p>
                </div>
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 mx-1 sm:mx-0">
                    <div class="h-3 bg-slate-200 rounded w-2/3 mx-auto animate-pulse"></div>
                    <div class="h-3 bg-slate-200 rounded w-1/2 mx-auto mt-2 animate-pulse"></div>
                </div>
            `;
        } catch (_) { }
    }

    async function initLicenseSystem() {
        // ارسم placeholder سريعًا لقسم الترخيص داخل الإعدادات (حتى لا يبدو الزر بطيئًا).
        try { showLicenseSkeleton(); } catch (_) { }

        try {
            await initDB();
        } catch (e) { }

        // لا ننتظر الشبكة هنا حتى لا يتأخر ظهور واجهة "الترخيص" داخل الإعدادات.
        try { loadRemoteRuntimeConfig().catch(() => { }); } catch (e) { }

        let isLicensed = await getSetting("licensed");
        isLicensed = isLicensed === true || isLicensed === "true";

        let licenseId = await getSetting("licenseId");

        const fastKickCheck = async () => {
            try {
                if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
                const savedLicenseId = String((await getSetting('licenseId')) || '').trim();
                if (!savedLicenseId) return;
                const savedActivationDate = String(await getSetting('lastActivationDateTime') || '').trim();
                if (!savedActivationDate) return;
                if (!GITHUB_CONFIG.token) { try { await loadRemoteRuntimeConfig(); } catch (_) { } }
                if (!GITHUB_CONFIG.token) return;
                const res = await readActivationLogFromGitHub(savedLicenseId);
                if (!res || !res.ok) return;
                const stats = normalizeActivationStats(savedLicenseId, res.data || {});
                const kickedRecord = (stats.activations || []).find(a =>
                    String(a.activatedAt || '').trim() === savedActivationDate &&
                    String(a.signedOutAt || '').trim()
                );
                if (kickedRecord) {
                    try { await setSetting('licensed', false); } catch (_) { }
                    try { await setSetting('licenseId', ''); } catch (_) { }
                    try { await setSetting('lastActivationDateTime', ''); } catch (_) { }
                    try { await setSetting('syncClientId', ''); } catch (_) { }
                    if (typeof showKickOverlay === 'function') {
                        showKickOverlay(kickedRecord.officeName, kickedRecord.deviceName);
                    } else {
                        alert('تم إلغاء ترخيص هذا الجهاز.');
                        window.location.reload();
                    }
                }
            } catch (_) { }
        };

        const silentRefreshLicenseCard = async (lid) => {
            try {
                const box = document.getElementById('activation-stats-box');
                if (!box) return;
                if (!GITHUB_CONFIG.token) { try { await loadRemoteRuntimeConfig(); } catch (_) { } }
                if (!GITHUB_CONFIG.token) return;
                const res = await readActivationLogFromGitHub(lid);
                if (!res || !res.ok) return;
                const stats = normalizeActivationStats(lid, res.data || {});
                let lastActivationDateTime = '';
                try { lastActivationDateTime = String(await getSetting('lastActivationDateTime') || '').trim(); } catch (_) { }
                let currentDeviceName = '';
                try {
                    if (window.__activationCardDeviceName && (Date.now() - window.__activationCardDeviceNameTs) < 30000) {
                        currentDeviceName = String(window.__activationCardDeviceName || '').trim();
                    } else {
                        currentDeviceName = String(await getDeviceName() || '').trim();
                        window.__activationCardDeviceName = currentDeviceName;
                        window.__activationCardDeviceNameTs = Date.now();
                    }
                } catch (_) { }
                const offices = (stats.activations || [])
                    .filter(a => !String((a && a.signedOutAt) || '').trim())
                    .map(a => ({
                        officeName: String(a.officeName || '').trim(),
                        activatedAt: String(a.activatedAt || '').trim(),
                        deviceName: String(a.deviceName || '').trim(),
                        version: String(a.version || '').trim()
                    }))
                    .filter(a => a.officeName);
                const tbodyHtml = offices.length
                    ? offices.map((a, idx) => {
                        const isCurrent = lastActivationDateTime && String(a.activatedAt || '').trim() === lastActivationDateTime;
                        const badge = isCurrent ? ' <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">مكتبك</span>' : '';
                        const dt = a.activatedAt ? a.activatedAt : '—';
                        const dev = (typeof stripBrowserVersionFromDeviceName === 'function' ? stripBrowserVersionFromDeviceName(a.deviceName) : a.deviceName) || '—';
                        const kickBtn = isCurrent ? '' : `<button onclick="window.__kickDeviceFromLicense('${lid}', '${a.activatedAt}', '${a.deviceName.replace(/'/g, "\\'")}')" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-200 shadow-sm active:scale-95" title="طرد الجهاز"><i class="ri-delete-bin-line text-sm"></i> <span class="text-[10px] font-bold">طرد</span></button>`;
                        return `<tr class="border-b border-blue-50 bg-white/70"><td class="py-1 px-1 font-semibold text-gray-800">${idx + 1}) ${a.officeName}${badge}</td><td class="py-1 px-1 text-gray-600">${dt}</td><td class="py-1 px-1 text-gray-600 max-w-[140px] break-words whitespace-normal" style="word-wrap:break-word;word-break:break-word;">${dev}</td><td class="py-1 px-1 text-center flex justify-center items-center h-full pt-2">${kickBtn}</td></tr>`;
                    }).join('')
                    : '';
                const tbody = box.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = tbodyHtml;
                } else {
                    try { await renderActivationStats(lid); } catch (_) { }
                    return;
                }
                const countEl = document.getElementById('activation-stats-count');
                if (countEl) countEl.textContent = stats.count;
                const maxEl = document.getElementById('activation-stats-max');
                if (maxEl) maxEl.textContent = stats.max;
            } catch (_) { }
        };

        window.__startLicenseIntervals = (lid) => {
            if (window.__activationLogSyncInterval) clearInterval(window.__activationLogSyncInterval);
            if (window.__activationKickCheckInterval) clearInterval(window.__activationKickCheckInterval);
            if (window.__licenseUiRefreshInterval) clearInterval(window.__licenseUiRefreshInterval);
            window.__activationLogSyncInterval = setInterval(() => {
                verifyAndSyncActivationLogInSettings(lid).catch(() => { });
            }, 30000);
            window.__activationKickCheckInterval = setInterval(() => {
                fastKickCheck().catch(() => { });
            }, 5000);
            window.__licenseUiRefreshInterval = setInterval(() => {
                silentRefreshLicenseCard(lid).catch(() => { });
            }, 3000);
        };

        try {
            if (isLicensed && licenseId) {
                setTimeout(() => {
                    (async () => {
                        try { await ensureActivationLogExists(licenseId); } catch (e) { }
                        try { await syncVersionToLog(licenseId); } catch (_) { }
                    })();
                }, 0);
                window.__startLicenseIntervals(licenseId);
            }
        } catch (e) { }


        // تم إلغاء نظام الفترة التجريبية (الأيام) بناءً على طلبك.
        // الترخيص موجود، لكن مفيش "أيام" ولا انتهاء صلاحية بالوقت.
        const trialInfo = null;

        showLicenseInterface(isLicensed, licenseId, trialInfo);
    }
    function showLicenseInterface(isLicensed, licenseId, trialInfo) {
        void trialInfo;

        if (!/settings\.html$/.test(window.location.pathname)) return;

        const container = document.querySelector('#settings-section-license')
            || document.querySelector('#modal-content .grid');
        if (!container) {
            setTimeout(() => showLicenseInterface(isLicensed, licenseId, trialInfo), 50);
            return;
        }

        let licenseCard = document.getElementById('license-settings-card');
        if (!licenseCard) {
            licenseCard = document.createElement('div');
            licenseCard.id = 'license-settings-card';
            licenseCard.className = 'bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 shadow-sm transition-all h-fit';

            try {
                container.appendChild(licenseCard);
            } catch (e) {
                try {
                    // fallback in case container is a grid wrapper and not accepting direct append
                    const fallbackGrid = document.querySelector('#modal-content .grid');
                    if (fallbackGrid) fallbackGrid.appendChild(licenseCard);
                } catch (e2) { }
            }
        }

        try { if (licenseCard) licenseCard.removeAttribute('data-skeleton'); } catch (_) { }

        let status, color, icon;

        if (isLicensed) {
            status = 'مرخّص';
            color = 'green';
            icon = 'ri-shield-check-line';
        } else {
            status = 'غير مفعّل';
            color = 'blue';
            icon = 'ri-key-line';
        }

        let html = '';
        html += '<div class="relative">';
        html += '<button id="refresh-license-runtime-btn" title="تنشيط" aria-label="تنشيط" class="absolute flex items-center justify-center text-white shadow-md active:scale-95 transition-all duration-200" style="top:4px;left:4px;width:30px;height:30px;min-width:30px;min-height:30px;border-radius:50%;background:linear-gradient(135deg,#4ade80,#16a34a);flex-shrink:0;">';
        html += '<i class="ri-refresh-line text-sm"></i>';
        html += '</button>';
        html += '<div class="text-center mb-4 px-1 pt-1 sm:px-0 sm:pt-0">';
        html += `<div class="w-10 h-10 bg-${color}-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">`;
        html += `<i class="${icon} text-white text-lg"></i>`;
        html += '</div>';
        html += `<h3 class="text-base font-bold text-${color}-700 mb-1">حالة الترخيص</h3>`;
        html += `<p class="text-sm text-gray-600">${status}</p>`;
        html += '</div>';

        if (isLicensed) {
            html += '<div class="text-sm space-y-2 mb-4 px-1 sm:px-0">';
            html += '<div class="flex items-center justify-between">';
            html += '<span class="text-gray-600">المعرف:</span>';
            html += `<span class="text-gray-800 font-semibold">${licenseId || 'غير محدد'}</span>`;
            html += '</div>';
            html += '<div class="flex items-center justify-between">';
            html += '<span class="text-gray-600">الحالة:</span>';
            html += '<span class="text-green-600 font-semibold">✅ مفعّل</span>';
            html += '</div>';
            html += '</div>';

            html += '<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 mx-1 sm:mx-0">';
            html += '<div class="mb-2"><span class="text-sm font-bold text-blue-800">بيانات التفعيل</span></div>';
            html += '<div id="activation-stats-box" class="text-xs text-gray-700">جاري التحميل...</div>';
            html += '</div>';

            html += '<div class="mt-3 mx-1 sm:mx-0">';
            html += '<button id="sign-out-license-btn" class="w-full px-3 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border border-gray-300">';
            html += '<i class="ri-logout-box-r-line text-lg"></i> تسجيل الخروج';
            html += '</button>';
            html += '</div>';
        } else {
            html += '<div class="space-y-3 px-1 pb-1 sm:px-0 sm:pb-0">';
            html += '<div class="flex gap-2 items-center">';
            html += '<input type="text" id="license-id-input" placeholder="اكتب كود التفعيل هنا" ';
            html += 'class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-center text-sm bg-white transition-all shadow-sm" style="min-height: auto; font-size: 14px;">';
            html += '</div>';
            html += '<div class="text-xs text-center text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">';
            html += '<span class="font-bold text-gray-900">كود التفعيل:</span> هو رقم عملية التحويل بعد الدفع.';
            html += '</div>';
            html += '<div class="grid grid-cols-1 gap-2">';
            html += '<button id="verify-license-btn" class="w-full px-1 sm:px-4 py-3 bg-blue-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-md">';
            html += '<i class="ri-shield-check-line text-lg"></i>';
            html += 'تحقق من الترخيص';
            html += '</button>';
            html += '</div>';
            html += '<div id="license-status" class="text-xs text-center text-gray-600"></div>';
            html += '</div>';
        }

        html += '</div>';

        licenseCard.innerHTML = html;

        try {
            const refreshBtn = document.getElementById('refresh-license-runtime-btn');
            if (refreshBtn) {
                const refreshBtnDefaultHtml = '<i class="ri-refresh-line text-base"></i>';
                refreshBtn.addEventListener('click', async () => {
                    const statusEl = document.getElementById('license-status');
                    const licenseInput = document.getElementById('license-id-input');
                    const currentLicenseId = String(
                        licenseId
                        || (licenseInput ? licenseInput.value : '')
                        || (await getSetting('licenseId'))
                        || ''
                    ).trim();

                    refreshBtn.disabled = true;
                    refreshBtn.innerHTML = '<i class="ri-loader-4-line text-base animate-spin"></i>';
                    if (statusEl) {
                        statusEl.textContent = 'جاري التحديث...';
                        statusEl.className = 'text-xs text-center text-blue-600';
                    }

                    let configOk = false;
                    let statsOk = false;
                    let failureMessage = '';
                    let successMessage = 'تم تحديث بيانات التفعيل';
                    const previousRuntimeValue = String(GITHUB_CONFIG.token || '').trim();
                    let runtimeResult = { ok: false, reason: 'unknown' };

                    try {
                        await loadRemoteRuntimeConfig({ forceRefresh: true });
                    } catch (_) { }

                    runtimeResult = getRemoteRuntimeConfigLastResult();
                    const refreshedRuntimeValue = String(GITHUB_CONFIG.token || '').trim();
                    const fetchedFromServer = !!(runtimeResult && runtimeResult.ok && runtimeResult.reason === 'remote' && refreshedRuntimeValue);
                    const runtimeValueChanged = refreshedRuntimeValue !== previousRuntimeValue;

                    configOk = fetchedFromServer;
                    successMessage = runtimeValueChanged ? 'تم تحديث بيانات التفعيل' : 'بيانات التفعيل محدثة بالفعل';

                    if (!configOk) {
                        if (runtimeResult && (runtimeResult.reason === 'cache' || runtimeResult.reason === 'cache_fallback')) {
                            failureMessage = 'تعذر الاتصال بخدمة التفعيل';
                        } else {
                            failureMessage = getRemoteConfigFailureMessage(runtimeResult);
                        }
                    }

                    if (currentLicenseId && configOk) {
                        try {
                            const statsRes = await readActivationLogFromGitHub(currentLicenseId);
                            if (statsRes && statsRes.ok) {
                                await renderActivationStats(currentLicenseId);
                                try { await refreshActivationTableBody(currentLicenseId); } catch (_) { }
                                statsOk = true;
                            } else {
                                failureMessage = getActivationFolderFailureMessage(statsRes ? statsRes.error : '');
                            }
                        } catch (err) {
                            failureMessage = getActivationFolderFailureMessage(err);
                        }
                    }

                    if (configOk && statsOk) {
                        if (statusEl) {
                            statusEl.textContent = successMessage;
                            statusEl.className = 'text-xs text-center text-green-600';
                        }
                        if (typeof showToast === 'function') {
                            try { showToast(successMessage, 'success'); } catch (_) { }
                        }
                        refreshBtn.disabled = false;
                        refreshBtn.innerHTML = refreshBtnDefaultHtml;
                        return;
                    }

                    if (configOk && !currentLicenseId) {
                        if (statusEl) {
                            statusEl.textContent = successMessage;
                            statusEl.className = 'text-xs text-center text-green-600';
                        }
                        if (typeof showToast === 'function') {
                            try { showToast(successMessage, 'success'); } catch (_) { }
                        }
                        refreshBtn.disabled = false;
                        refreshBtn.innerHTML = refreshBtnDefaultHtml;
                        return;
                    }

                    if (false && configOk && statsOk) {
                        if (statusEl) {
                            statusEl.textContent = '✅ تم تحديث بيانات الترخيص';
                            statusEl.className = 'text-xs text-center text-green-600';
                        }
                        if (typeof showToast === 'function') {
                            try { showToast('تم تحديث بيانات الترخيص', 'success'); } catch (_) { }
                        }
                    } else if (false && configOk && !currentLicenseId) {
                        if (statusEl) {
                            statusEl.textContent = successMessage;
                            statusEl.className = 'text-xs text-center text-green-600';
                        }
                    } else {
                        if (!failureMessage) failureMessage = 'تعذر تحديث بيانات الترخيص الآن';
                        if (statusEl) {
                            statusEl.textContent = `❌ ${failureMessage}`;
                            statusEl.className = 'text-xs text-center text-red-600';
                        }
                        if (typeof showToast === 'function') {
                            try { showToast(failureMessage, 'error'); } catch (_) { }
                        }
                    }

                    refreshBtn.disabled = false;
                    refreshBtn.innerHTML = refreshBtnDefaultHtml;
                });
            }
        } catch (_) { }

        if (isLicensed) {
            try {
                const signOutBtn = document.getElementById('sign-out-license-btn');
                const signOutBtnDefaultHtml = '<i class="ri-logout-box-r-line text-lg"></i> تسجيل الخروج';
                if (signOutBtn) {
                    signOutBtn.addEventListener('click', async () => {
                        let confirmed = false;
                        try {
                            confirmed = typeof window.safeConfirm === 'function'
                                ? await window.safeConfirm('هل أنت متأكد أنك تريد تسجيل الخروج من هذا الجهاز؟')
                                : window.confirm('هل أنت متأكد أنك تريد تسجيل الخروج من هذا الجهاز؟');
                        } catch (_) {
                            confirmed = true;
                        }
                        if (!confirmed) {
                            return;
                        }

                        signOutBtn.disabled = true;
                        signOutBtn.innerHTML = '<i class="ri-loader-4-line text-lg animate-spin"></i> جاري تسجيل الخروج...';
                        try {
                            if (window.__activationLogSyncInterval) {
                                clearInterval(window.__activationLogSyncInterval);
                                window.__activationLogSyncInterval = null;
                            }
                            if (window.__activationKickCheckInterval) {
                                clearInterval(window.__activationKickCheckInterval);
                                window.__activationKickCheckInterval = null;
                            }
                            if (window.__licenseUiRefreshInterval) {
                                clearInterval(window.__licenseUiRefreshInterval);
                                window.__licenseUiRefreshInterval = null;
                            }
                        } catch (e) { }
                        let result = null;
                        for (let attempt = 1; attempt <= 5; attempt++) {
                            try {
                                result = await signOutFromDevice(licenseId);
                                if (result && result.ok) break;
                            } catch (_) { }
                            if (attempt < 5) {
                                signOutBtn.innerHTML = `<i class="ri-loader-4-line text-lg animate-spin"></i> إعادة المحاولة (${attempt}/5)...`;
                                await new Promise(r => setTimeout(r, 3000));
                            }
                        }
                        if (result && result.ok) {
                            if (typeof showToast === 'function') try { showToast('تم تسجيل الخروج بنجاح.', 'success'); } catch (_) { }
                            window.location.reload();
                        } else {
                            signOutBtn.disabled = false;
                            signOutBtn.innerHTML = signOutBtnDefaultHtml;
                            const reason = (result && result.error) ? String(result.error) : '';
                            let msg = 'فشل تسجيل الخروج، حاول مرة ثانية.';

                            if (reason === 'offline') {
                                msg = 'لابد من وجود إنترنت لتسجيل الخروج.';
                            } else if (reason === 'activation_folder_missing') {
                                msg = 'مجلد التفعيل غير موجود على خادم البيانات.';
                            } else if (reason === 'no_activation_date') {
                                msg = 'لم يتم العثور على بيانات تفعيل محلية.';
                            }

                            if (typeof showToast === 'function') try { showToast(msg, 'error'); } catch (_) { }
                        }
                    });
                }
                setTimeout(() => { try { renderActivationStats(licenseId); } catch (e) { } }, 0);
            } catch (e) { }
        }


        if (!isLicensed) {
            const verifyBtn = document.getElementById('verify-license-btn');
            const licenseInput = document.getElementById('license-id-input');

            if (verifyBtn) {
                verifyBtn.addEventListener('click', () => verifyLicense());
            }

            if (licenseInput) {
                licenseInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        verifyLicense();
                    }
                });
            }
        }
    }


    async function readActivationLogFromGitHub(licenseId) {
        try {
            await ensureGitHubConfigReady();
            if (!licenseId) return { ok: false, error: 'missing_license_id' };
            try {
                if (navigator && navigator.onLine === false) return { ok: false, error: 'offline' };
            } catch (e) { }
            const timestamp = new Date().getTime();

            const readFile = async (fileName) => {
                const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}/${fileName}?t=${timestamp}`;
                const response = await fetch(url, {
                    cache: 'no-store',
                    headers: __buildGitHubHeaders()
                });
                if (response.status === 404) return { exists: false };
                if (!response.ok) return { exists: true, ok: false, status: response.status };
                const data = await response.json();
                if (Array.isArray(data)) return { exists: false };
                if (!data || typeof data.content !== 'string') return { exists: true, ok: false, status: response.status };
                const content = decodeURIComponent(escape(atob(data.content)));
                return { exists: true, ok: true, sha: data.sha, content };
            };

            const parsedTextToData = (licenseId, text) => {
                const cleaned = stripMarks(String(text || '')).replace(/\r/g, '');
                const lines = cleaned.split('\n');
                let max = 4;
                const t = cleaned;
                const maxMatchAr = t.match(/الحد\s*الأقصى\s*للتفعيل\s*[:：=]\s*([0-9٠-٩]+)/);
                const maxMatchEn = t.match(/^(?:MAX|LIMIT|MAX_ACTIVATIONS)\s*[:=]\s*([0-9٠-٩]+)\s*$/mi);
                const maxMatch = maxMatchEn || maxMatchAr;
                if (maxMatch) max = parseInt(toLatinDigits(maxMatch[1]), 10) || 4;
                const offices = [];

                /* تنسيق الكتلة: OFFICE، activated in، DEVICE، VERSION، واختياري signed out : تاريخ في نفس الكتلة */
                let currentOffice = null;
                let currentAt = '';
                let currentDevice = '';
                let currentVersion = '';
                let currentSignedOutAt = '';
                let sawOfficeBlocks = false;

                const pushCurrent = () => {
                    if (!currentOffice) return;
                    offices.push({
                        officeName: currentOffice,
                        activatedAt: String(currentAt || '').trim(),
                        deviceName: String(currentDevice || '').trim(),
                        version: String(currentVersion || '').trim(),
                        signedOutAt: String(currentSignedOutAt || '').trim()
                    });
                    currentOffice = null;
                    currentAt = '';
                    currentDevice = '';
                    currentVersion = '';
                    currentSignedOutAt = '';
                };

                for (const raw of lines) {
                    const trimmed = stripMarks(String(raw || '')).trim();

                    if (!trimmed) {
                        pushCurrent();
                        continue;
                    }

                    if (/^_{5,}$/.test(trimmed)) continue;

                    const officeMatch = trimmed.match(/^OFFICE\s*[:=]\s*(.+)$/i);
                    if (officeMatch) {
                        sawOfficeBlocks = true;
                        pushCurrent();
                        currentOffice = String(officeMatch[1] || '').trim();
                        currentAt = '';
                        currentDevice = '';
                        currentVersion = '';
                        currentSignedOutAt = '';
                        continue;
                    }

                    const activatedMatch = trimmed.match(/^(?:actavited|activated)\b.*?[:：]\s*(.+)$/i);
                    if (activatedMatch && currentOffice) {
                        currentAt = String(activatedMatch[1] || '').trim();
                        continue;
                    }

                    const deviceMatch = trimmed.match(/^DEVICE\s*[:=]\s*(.+)$/i);
                    if (deviceMatch && currentOffice) {
                        currentDevice = String(deviceMatch[1] || '').trim();
                        continue;
                    }

                    const versionMatch = trimmed.match(/^VERSION\s*[:=]\s*(.+)$/i);
                    if (versionMatch && currentOffice) {
                        currentVersion = String(versionMatch[1] || '').trim();
                        continue;
                    }

                    const signedOutMatch = trimmed.match(/^signed\s*out\s*[:：]\s*(.+)$/i);
                    if (signedOutMatch && currentOffice) {
                        currentSignedOutAt = String(signedOutMatch[1] || '').trim();
                        continue;
                    }
                }

                pushCurrent();

                // Old formats (English OFFICES: list or Arabic المكاتب: list)
                if (!sawOfficeBlocks) {
                    let inList = false;
                    for (const raw of lines) {
                        const line = stripMarks(String(raw || '')).trim();
                        if (!line) continue;
                        if (line === 'المكاتب:' || line === 'المكاتب') { inList = true; continue; }
                        if (/^(?:OFFICES|ACTIVATIONS)\s*:?$/i.test(line)) { inList = true; continue; }
                        if (!inList) continue;
                        const m = line.match(/^[-\u2022\s]*([^|]+?)(\s*\|\s*(.+))?$/);
                        if (m) {
                            const officeName = String(m[1] || '').trim();
                            const activatedAt = String(m[3] || '').trim();
                            if (officeName) offices.push({ officeName, activatedAt, deviceName: '', version: '' });
                        }
                    }
                }

                if (offices.length === 0) {
                    try {
                        const re = /OFFICE\s*[:=]\s*(.+)$/gmi;
                        let m;
                        while ((m = re.exec(t))) {
                            const name = String(m[1] || '').trim();
                            if (name) offices.push({ officeName: name, activatedAt: '', deviceName: '', version: '' });
                        }
                    } catch (_) { }
                }

                return { licenseId: String(licenseId || ''), max, activations: offices };
            };

            const textRes = await readFile('log.txt');
            if (textRes.exists && textRes.ok) {
                const data = parsedTextToData(licenseId, textRes.content);
                return { ok: true, data, sha: textRes.sha };
            }
            if (textRes.exists && textRes.ok === false) {
                return { ok: false, error: `http_${textRes.status}` };
            }
            return { ok: false, error: 'missing_log_txt' };
        } catch (e) {
            return { ok: false, error: 'exception' };
        }
    }

    /**
     * التأكد من وجود ملف log.txt داخل مجلد المعرف فقط (لا يُنشئ مجلد المعرف أبداً؛ الشركة تنشئ المجلدات يدوياً).
     * يُستدعى فقط بعد التحقق من وجود المجلد. إذا كان log.txt غير موجود يُنشئ الملف فقط.
     */
    async function ensureActivationLogExists(licenseId) {
        try {
            await ensureGitHubConfigReady();
            if (!licenseId) return { ok: false, error: 'missing_license_id' };
            try {
                if (navigator && navigator.onLine === false) return { ok: false, error: 'offline' };
            } catch (e) { }
            const timestamp = new Date().getTime();
            const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;

            /* لا تُنشئ مجلد المعرف أبداً: لا ننشئ log.txt إلا إذا كان مجلد المعرف موجوداً بالفعل (أي يحتوي على أي ملف) */
            try {
                const folderUrl = `${baseUrl}?t=${timestamp}`;
                const folderRes = await fetch(folderUrl, {
                    cache: 'no-store',
                    headers: __buildGitHubHeaders()
                });
                if (folderRes && folderRes.status === 404) {
                    return { ok: false, error: 'activation_folder_missing' };
                }
                if (!folderRes || !folderRes.ok) {
                    const st = folderRes ? folderRes.status : 0;
                    return { ok: false, error: 'activation_folder_check_failed_' + st };
                }
                try {
                    const folderData = await folderRes.json();
                    if (!Array.isArray(folderData) || folderData.length === 0) {
                        return { ok: false, error: 'activation_folder_missing' };
                    }
                } catch (e) {
                    return { ok: false, error: 'activation_folder_check_failed_parse' };
                }
            } catch (e) {
                return { ok: false, error: 'activation_folder_check_failed_exception' };
            }

            const readFile = async (fileName) => {
                const url = `${baseUrl}/${fileName}?t=${timestamp}`;
                const response = await fetch(url, {
                    cache: 'no-store',
                    headers: __buildGitHubHeaders()
                });
                if (response.status === 404) return { exists: false };
                if (!response.ok) return { exists: true, ok: false, status: response.status };
                const data = await response.json();
                if (Array.isArray(data)) return { exists: false };
                if (!data || typeof data.sha !== 'string') return { exists: true, ok: false, status: response.status };
                return { exists: true, ok: true, sha: data.sha };
            };

            const txtRes = await readFile('log.txt');
            if (txtRes.exists && txtRes.ok !== false) return { ok: true, exists: true };

            /* إذا كان اللوج محذوفاً والجهاز الحالي مفعّل بنفس المعرف: نملأ اللوج ببيانات هذا الجهاز كما عند التفعيل */
            let initialActivations = [];
            let initialContent;
            try {
                const isLicensed = await getSetting('licensed');
                const storedLicenseId = String(await getSetting('licenseId') || '').trim();
                if ((isLicensed === true || isLicensed === 'true') && storedLicenseId && storedLicenseId === String(licenseId || '').trim()) {
                    let officeName = 'غير محدد';
                    try {
                        const saved = await getSetting('officeName');
                        if (saved && String(saved).trim()) officeName = String(saved).trim();
                    } catch (_) { }
                    let deviceName = 'غير معروف';
                    try { deviceName = await getDeviceName(); if (!deviceName || !String(deviceName).trim()) deviceName = 'غير معروف'; } catch (_) { }
                    const version = getAppVersion();
                    const nowSimple = formatActivationDateTime(new Date());
                    initialActivations = [{ officeName, activatedAt: nowSimple, deviceName: String(deviceName || '').trim() || 'غير معروف', version: String(version || '').trim() || '0.0.0' }];
                    try { await setSetting('lastActivationDateTime', nowSimple); } catch (_) { }
                }
            } catch (_) { }
            initialContent = buildActivationLogText(licenseId, 4, initialActivations);
            const textPayload = {
                message: initialActivations.length ? 'إنشاء سجل التفعيل مع تسجيل الجهاز الحالي' : 'إنشاء سجل التفعيل',
                content: btoa(unescape(encodeURIComponent(initialContent)))
            };

            const textUrl = `${baseUrl}/log.txt?t=${timestamp}`;
            const putRes = await fetch(textUrl, {
                method: 'PUT',
                cache: 'no-store',
                headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(textPayload)
            });

            if (!putRes || !putRes.ok) {
                const st = putRes ? putRes.status : 0;
                const details = await readGitHubErrorDetails(putRes);
                return { ok: false, error: 'ensure_put_failed_' + st, details };
            }

            for (const d of [250, 650, 1200]) {
                try { await sleep(d); } catch (e) { }
                try {
                    const chk = await readFile('log.txt');
                    if (chk && chk.exists && chk.ok) return { ok: true, created: true };
                } catch (e) { }
            }

            return { ok: false, error: 'log_not_visible' };
        } catch (e) {
            return { ok: false, error: 'exception' };
        }
    }

    function normalizeActivationStats(licenseId, logData) {
        try {
            const max = parseInt(logData && logData.max, 10) || 4;
            let activations = [];
            const hasActivationsArray = Array.isArray(logData && logData.activations);
            if (Array.isArray(logData && logData.activations)) {
                activations = logData.activations
                    .map(a => ({
                        officeName: String((a && a.officeName) || '').trim(),
                        activatedAt: String((a && a.activatedAt) || '').trim(),
                        deviceName: String((a && a.deviceName) || '').trim(),
                        version: String((a && a.version) || '').trim(),
                        signedOutAt: String((a && a.signedOutAt) || '').trim()
                    }))
                    .filter(a => a.officeName);
            } else {
                const officeName = String((logData && logData.officeName) || '').trim();
                if (officeName) activations = [{ officeName, activatedAt: '', deviceName: '', version: '', signedOutAt: '' }];
            }

            /* العدد = الأجهزة النشطة فقط (التي ليس لها signed out)؛ المسجّل خروجاً لا يُحسب ضمن الحد */
            const activeCount = (activations || []).filter(a => !String(a.signedOutAt || '').trim()).length;
            let count = activeCount;
            if (!hasActivationsArray && activations.length === 0) count = parseInt(logData && logData.count, 10) || 0;

            return {
                licenseId: String(licenseId || ''),
                count,
                max,
                activations
            };
        } catch (e) {
            return { licenseId: String(licenseId || ''), count: 0, max: 4, activations: [] };
        }
    }

    async function renderActivationStats(licenseId) {
        const box = document.getElementById('activation-stats-box');
        if (!box) return;
        box.textContent = 'جاري التحميل...';

        const res = await readActivationLogFromGitHub(licenseId);
        if (!res || !res.ok) {
            box.innerHTML = '<div class="text-red-600">تعذر تحميل بيانات التفعيل الآن</div>';
            return;
        }

        const stats = normalizeActivationStats(licenseId, res.data || {});

        let officeName = '';
        try {
            const savedOfficeName = await getSetting('officeName');
            if (savedOfficeName) officeName = String(savedOfficeName).trim();
        } catch (e) { }

        let lastActivationDateTime = '';
        try {
            lastActivationDateTime = String(await getSetting('lastActivationDateTime') || '').trim();
        } catch (e) { }

        let currentDeviceName = '';
        try {
            if (window.__activationCardDeviceName && (Date.now() - window.__activationCardDeviceNameTs) < 30000) {
                currentDeviceName = String(window.__activationCardDeviceName || '').trim();
            } else {
                currentDeviceName = String(await getDeviceName() || '').trim();
                window.__activationCardDeviceName = currentDeviceName;
                window.__activationCardDeviceNameTs = Date.now();
            }
        } catch (_) { currentDeviceName = ''; }

        const offices = (stats.activations || [])
            .filter(a => !String((a && a.signedOutAt) || '').trim())
            .map(a => ({
                officeName: String(a.officeName || '').trim(),
                activatedAt: String(a.activatedAt || '').trim(),
                deviceName: String(a.deviceName || '').trim(),
                version: String(a.version || '').trim()
            }))
            .filter(a => a.officeName);

        const listHtml = offices.length
            ? `<div class="mt-2 space-y-1 overflow-x-auto"><table class="w-full text-[10px] sm:text-xs border-collapse"><thead><tr class="border-b border-blue-200 text-blue-900 font-bold"><th class="text-right py-1 px-1">اسم المكتب</th><th class="text-right py-1 px-1">تاريخ التفعيل</th><th class="text-right py-1 px-1">نوع الجهاز</th><th class="text-center py-1 px-1">إجراء</th></tr></thead><tbody>${offices.map((a, idx) => {
                const isCurrent = lastActivationDateTime && String(a.activatedAt || '').trim() === lastActivationDateTime;
                const badge = isCurrent ? ' <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">مكتبك</span>' : '';
                const dt = a.activatedAt ? a.activatedAt : '—';
                const dev = stripBrowserVersionFromDeviceName(a.deviceName) || '—';
                const kickBtn = isCurrent ? '' : `<button onclick="window.__kickDeviceFromLicense('${licenseId}', '${a.activatedAt}', '${a.deviceName.replace(/'/g, "\\'")}')" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-200 shadow-sm active:scale-95" title="طرد الجهاز"><i class="ri-delete-bin-line text-sm"></i> <span class="text-[10px] font-bold">طرد</span></button>`;
                return `<tr class="border-b border-blue-50 bg-white/70"><td class="py-1 px-1 font-semibold text-gray-800">${idx + 1}) ${a.officeName}${badge}</td><td class="py-1 px-1 text-gray-600">${dt}</td><td class="py-1 px-1 text-gray-600 max-w-[140px] break-words whitespace-normal" style="word-wrap:break-word;word-break:break-word;">${dev}</td><td class="py-1 px-1 text-center flex justify-center items-center h-full pt-2">${kickBtn}</td></tr>`;
            }).join('')}</tbody></table></div>`
            : '<div class="mt-2 text-gray-600">لا توجد بيانات متاحة حالياً</div>';

        box.innerHTML = `
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-white/70 border border-blue-100 rounded-md p-2 text-center">
                    <div class="text-[10px] text-gray-500">المستخدم</div>
                    <div id="activation-stats-count" class="text-sm font-bold text-gray-900">${stats.count}</div>
                </div>
                <div class="bg-white/70 border border-blue-100 rounded-md p-2 text-center">
                    <div class="text-[10px] text-gray-500">الحد الأقصى</div>
                    <div id="activation-stats-max" class="text-sm font-bold text-gray-900">${stats.max}</div>
                </div>
            </div>
            <div class="mt-2">
                <div class="text-xs font-bold text-blue-900">المكاتب التي استخدمت المعرف</div>
                ${listHtml}
            </div>
        `;
    }

    /** تحديث قائمة الأجهزة والعدد فقط (بدون إعادة رسم الكارت) لظهور الأجهزة الجديدة على الموبايل دون إعادة تحميل الصفحة */
    async function refreshActivationTableBody(licenseId) {
        try {
            const box = document.getElementById('activation-stats-box');
            if (!box) return;
            const res = await readActivationLogFromGitHub(licenseId);
            if (!res || !res.ok) return;
            const stats = normalizeActivationStats(licenseId, res.data || {});
            let officeName = '';
            try { officeName = String(await getSetting('officeName') || '').trim(); } catch (_) { }

            let lastActivationDateTime = '';
            try { lastActivationDateTime = String(await getSetting('lastActivationDateTime') || '').trim(); } catch (_) { }

            let currentDeviceName = '';
            try {
                if (window.__activationCardDeviceName && (Date.now() - window.__activationCardDeviceNameTs) < 30000) {
                    currentDeviceName = String(window.__activationCardDeviceName || '').trim();
                } else {
                    currentDeviceName = String(await getDeviceName() || '').trim();
                    window.__activationCardDeviceName = currentDeviceName;
                    window.__activationCardDeviceNameTs = Date.now();
                }
            } catch (_) { currentDeviceName = ''; }

            const offices = (stats.activations || [])
                .filter(a => !String((a && a.signedOutAt) || '').trim())
                .map(a => ({
                    officeName: String(a.officeName || '').trim(),
                    activatedAt: String(a.activatedAt || '').trim(),
                    deviceName: String(a.deviceName || '').trim(),
                    version: String(a.version || '').trim()
                }))
                .filter(a => a.officeName);
            const tbodyHtml = offices.length
                ? offices.map((a, idx) => {
                    const isCurrent = lastActivationDateTime && String(a.activatedAt || '').trim() === lastActivationDateTime;
                    const badge = isCurrent ? ' <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">مكتبك</span>' : '';
                    const dt = a.activatedAt ? a.activatedAt : '—';
                    const dev = stripBrowserVersionFromDeviceName(a.deviceName) || '—';
                    const kickBtn = isCurrent ? '' : `<button onclick="window.__kickDeviceFromLicense('${licenseId}', '${a.activatedAt}', '${a.deviceName.replace(/'/g, "\\'")}')" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-200 shadow-sm active:scale-95" title="طرد الجهاز"><i class="ri-delete-bin-line text-sm"></i> <span class="text-[10px] font-bold">طرد</span></button>`;
                    return `<tr class="border-b border-blue-50 bg-white/70"><td class="py-1 px-1 font-semibold text-gray-800">${idx + 1}) ${a.officeName}${badge}</td><td class="py-1 px-1 text-gray-600">${dt}</td><td class="py-1 px-1 text-gray-600 max-w-[140px] break-words whitespace-normal" style="word-wrap:break-word;word-break:break-word;">${dev}</td><td class="py-1 px-1 text-center flex justify-center items-center h-full pt-2">${kickBtn}</td></tr>`;
                }).join('')
                : '';
            const tbody = box.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = tbodyHtml;
            } else if (offices.length > 0) {
                try { await renderActivationStats(licenseId); } catch (_) { }
                return;
            }
            const countEl = document.getElementById('activation-stats-count');
            if (countEl) countEl.textContent = stats.count;
            const maxEl = document.getElementById('activation-stats-max');
            if (maxEl) maxEl.textContent = stats.max;
        } catch (_) { }
    }

    async function verifyAndSyncActivationLogInSettings(licenseId) {
        try {
            if (!licenseId) return { ok: false, skipped: 'missing_license_id' };
            if (window.__activationLogVerifyInProgress) return { ok: false, skipped: 'busy' };
            try {
                if (navigator && navigator.onLine === false) return { ok: false, skipped: 'offline' };
            } catch (_) { }

            window.__activationLogVerifyInProgress = true;

            const folderCheck = await activationFolderExists(licenseId);
            if (!folderCheck.exists) return { ok: false, skipped: 'activation_folder_missing' };

            let res = await readActivationLogFromGitHub(licenseId);
            if (!res || !res.ok) {
                // إذا كان الملف غير موجود نحاول إنشاؤه فقط (بدون إنشاء مجلد) ثم نعيد القراءة
                if (res && res.error === 'missing_log_txt') {
                    try {
                        const ensured = await ensureActivationLogExists(licenseId);
                        if (ensured && ensured.ok) {
                            res = await readActivationLogFromGitHub(licenseId);
                        }
                    } catch (_) { }
                }
            }
            if (!res || !res.ok) return { ok: false, skipped: 'cannot_read_log' };

            const stats = normalizeActivationStats(licenseId, res.data || {});
            const maxCount = stats.max || 4;
            const activations = Array.isArray(stats.activations) ? stats.activations : [];
            const activeCount = (activations || []).filter(a => !String((a && a.signedOutAt) || '').trim()).length;

            let currentDeviceName = 'غير معروف';
            try {
                if (window.__activationCardDeviceName && (Date.now() - window.__activationCardDeviceNameTs) < 30000) {
                    currentDeviceName = String(window.__activationCardDeviceName || '').trim();
                } else {
                    currentDeviceName = await getDeviceName();
                    if (!currentDeviceName || !String(currentDeviceName).trim()) currentDeviceName = 'غير معروف';
                    currentDeviceName = String(currentDeviceName).trim();
                    window.__activationCardDeviceName = currentDeviceName;
                    window.__activationCardDeviceNameTs = Date.now();
                }
            } catch (_) { currentDeviceName = 'غير معروف'; }

            // Do not attempt to match/sync by office name when the device name is unknown.
            // This avoids accidentally treating other devices as the current device on mobile/PWA.
            if (!currentDeviceName || String(currentDeviceName).trim() === 'غير معروف') {
                return { ok: false, skipped: 'unknown_device_name' };
            }

            let currentOfficeName = '';
            try { currentOfficeName = String(await getSetting('officeName') || '').trim(); } catch (_) { }
            if (!currentOfficeName) currentOfficeName = 'غير محدد';

            let lastActivationDateTime = '';
            try { lastActivationDateTime = String(await getSetting('lastActivationDateTime') || '').trim(); } catch (_) { }

            const isSameDevice = (a) => {
                try {
                    if (!lastActivationDateTime) return false;
                    return String((a && a.activatedAt) || '').trim() === lastActivationDateTime;
                } catch (_) { return false; }
            };

            const hasAny = activations.some(a => String((a && a.officeName) || '').trim());
            
            // تحقق مما إذا كان هذا الجهاز (الجلسة الحالية) قد تم طرده صراحة
            const kickedRecord = activations.find(a => isSameDevice(a) && String(a.signedOutAt || '').trim());

            if (kickedRecord) {
                try {
                    await setSetting('licensed', false);
                    await setSetting('licenseId', '');
                    await setSetting('lastActivationDateTime', '');
                    try { await setSetting('syncClientId', ''); } catch (_) { }
                    
                    if (typeof showKickOverlay === 'function') {
                        showKickOverlay(kickedRecord.officeName, kickedRecord.deviceName);
                    } else {
                        alert('تم إلغاء ترخيص هذا الجهاز بواسطة المسؤول.');
                        window.location.reload();
                    }
                } catch (_) { }
                return { ok: false, error: 'kicked' };
            }

            const hasCurrentActive = activations
                .filter(a => !String((a && a.signedOutAt) || '').trim())
                .some(a => {
                    return isSameDevice(a);
                });

            const nowSimple = formatActivationDateTime(new Date());
            const version = getAppVersion();

            const writeLogWithRetry = async (maxToWrite, nextActivations) => {
                const timestamp = Date.now();
                const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;

                const readSha = async () => {
                    const url = `${baseUrl}/log.txt?t=${timestamp}`;
                    const response = await fetch(url, {
                        cache: 'no-store',
                        headers: __buildGitHubHeaders()
                    });
                    if (!response || !response.ok) return { ok: false, status: response ? response.status : 0 };
                    const data = await response.json().catch(() => null);
                    if (!data || typeof data.sha !== 'string') return { ok: false, status: response.status };
                    return { ok: true, sha: data.sha };
                };

                const putText = async (sha) => {
                    const textContent = buildActivationLogText(licenseId, maxToWrite || 4, nextActivations);
                    const url = `${baseUrl}/log.txt?t=${Date.now()}`;
                    const body = {
                        message: 'تحديث سجل التفعيل',
                        content: btoa(unescape(encodeURIComponent(textContent))),
                        sha
                    };
                    const putRes = await fetch(url, {
                        method: 'PUT',
                        cache: 'no-store',
                        headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify(body)
                    });
                    return putRes ? putRes.status : 0;
                };

                let lastStatus = 0;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    const shaRes = await readSha();
                    if (!shaRes || !shaRes.ok) return { ok: false, status: shaRes ? shaRes.status : 0 };
                    lastStatus = await putText(shaRes.sha);
                    if (lastStatus >= 200 && lastStatus < 300) return { ok: true };
                    if (lastStatus !== 409) break;
                    try { await sleep(350); } catch (_) { }
                }
                return { ok: false, status: lastStatus };
            };

            if (!hasAny) {
                const next = [{
                    officeName: currentOfficeName,
                    activatedAt: nowSimple,
                    deviceName: currentDeviceName,
                    version: String(version || '').trim() || '0.0.0'
                }];
                const w = await writeLogWithRetry(4, next);
                if (w && w.ok) {
                    try { await setSetting('lastActivationDateTime', nowSimple); } catch (_) { }
                    try {
                        const box = document.getElementById('activation-stats-box');
                        if (box) await renderActivationStats(licenseId);
                    } catch (_) { }
                    return { ok: true, action: 'initialized' };
                }
                return { ok: false, skipped: 'write_failed_' + String((w && w.status) || 0) };
            }

            if (!hasCurrentActive) {
                if (activeCount >= maxCount) {
                    __licenseFailureCount++;
                    if (__licenseFailureCount < MAX_LICENSE_FAILURE_THRESHOLD) {
                        return { ok: false, skipped: 'failure_count_not_reached', count: __licenseFailureCount };
                    }

                    try {
                        await setSetting('licensed', false);
                        await setSetting('licenseId', '');
                        await setSetting('lastActivationDateTime', '');
                        try { await setSetting('syncClientId', ''); } catch (_) { }
                    } catch (_) { }
                    try {
                        const statusEl = document.getElementById('license-status');
                        if (statusEl) {
                            statusEl.textContent = `❌ وصلت للحد الأقصى من الأجهزة (${maxCount})`;
                            statusEl.className = 'text-xs text-center mt-2 text-red-600';
                        }
                    } catch (_) { }
                    if (typeof showToast === 'function') {
                        try { showToast(`لا يمكن التفعيل - وصلت للحد الأقصى (${maxCount} أجهزة)`, 'error'); } catch (_) { }
                    }
                    return { ok: false, error: 'limit_reached', max: maxCount };
                }

                const next = activations.slice();
                next.push({
                    officeName: currentOfficeName,
                    activatedAt: nowSimple,
                    deviceName: currentDeviceName,
                    version: String(version || '').trim() || '0.0.0'
                });
                const w = await writeLogWithRetry(maxCount, next);
                if (w && w.ok) {
                    try { await setSetting('lastActivationDateTime', nowSimple); } catch (_) { }
                    try {
                        const box = document.getElementById('activation-stats-box');
                        if (box) await renderActivationStats(licenseId);
                    } catch (_) { }
                    return { ok: true, action: 'added_current_device' };
                }
                return { ok: false, skipped: 'write_failed_' + String((w && w.status) || 0) };
            }

            if (hasCurrentActive) {
                __licenseFailureCount = 0;
            }

            return { ok: true, action: 'noop' };
        } catch (_) {
            return { ok: false, skipped: 'exception' };
        } finally {
            try { window.__activationLogVerifyInProgress = false; } catch (_) { }
        }
    }

    try {
        if (typeof window !== 'undefined') {
            window.__verifyAndSyncActivationLogInSettings = verifyAndSyncActivationLogInSettings;
        }
    } catch (_) { }

    try {
        if (typeof window !== 'undefined') {
            window.__syncOfficeNameToActivationLog = syncOfficeNameToLog;
        }
    } catch (_) { }

    /** تحديث اسم المكتب الحالي في الجدول فقط (بدون إعادة رسم الكارت) ليعمل التحديث كل 3 ثوانٍ دون إغلاق أو وميض */
    async function updateCurrentOfficeNameInTable() {
        try {
            const box = document.getElementById('activation-stats-box');
            if (!box) return;
            return;
        } catch (_) { }
    }

    async function checkActivationLimit(licenseId) {
        try {
            const res = await readActivationLogFromGitHub(licenseId);
            if (!res || !res.ok) {
                // لا نسمح بالتفعيل بدون القدرة على قراءة سجل التفعيل
                return { allowed: false, error: true, reason: 'cannot_verify' };
            }
            const stats = normalizeActivationStats(licenseId, res.data || {});
            if (stats.count >= stats.max) {
                return { allowed: false, count: stats.count, max: stats.max };
            }
            return { allowed: true, count: stats.count, max: stats.max };

        } catch (error) {
            // لا نسمح بالتفعيل بدون القدرة على التحقق من السجل
            return { allowed: false, error: true, reason: 'cannot_verify' };
        }
    }


    async function updateActivationLog(licenseId) {
        try {
            await ensureGitHubConfigReady();
            try {
                if (navigator && navigator.onLine === false) return { ok: false, error: 'offline' };
            } catch (e) { }
            const folderCheck = await activationFolderExists(licenseId);
            if (!folderCheck.exists) return { ok: false, error: 'activation_folder_missing' };
            // قراءة اسم المكتب من الإعدادات (اسم هذا الجهاز فقط)
            let officeName = 'غير محدد';
            try {
                const savedOfficeName = await getSetting('officeName');
                if (savedOfficeName && String(savedOfficeName).trim()) {
                    officeName = String(savedOfficeName).trim();
                }
            } catch (e) { }

            const timestamp = new Date().getTime();
            const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;

            const readFile = async (fileName) => {
                const url = `${baseUrl}/${fileName}?t=${timestamp}`;
                const response = await fetch(url, {
                    cache: 'no-store',
                    headers: __buildGitHubHeaders()
                });
                if (response.status === 404) return { exists: false };
                if (!response.ok) return { exists: true, ok: false, status: response.status };
                const data = await response.json();
                if (Array.isArray(data)) return { exists: false };
                if (!data || typeof data.content !== 'string') return { exists: true, ok: false, status: response.status };
                const content = decodeURIComponent(escape(atob(data.content)));
                return { exists: true, ok: true, sha: data.sha, content };
            };

            let logTxtSha = null;
            let maxCount = 4;
            let activations = [];

            const ensured = await ensureActivationLogExists(licenseId);
            if (!ensured || !ensured.ok) {
                return { ok: false, error: 'missing_log_txt' };
            }

            const txtRes = await readFile('log.txt');
            if (txtRes.exists && txtRes.ok) {
                logTxtSha = txtRes.sha;
                const res2 = await readActivationLogFromGitHub(licenseId);
                if (res2 && res2.ok) {
                    const stats2 = normalizeActivationStats(licenseId, res2.data || {});
                    maxCount = stats2.max || 4;
                    activations = Array.isArray(stats2.activations) ? stats2.activations : [];
                }
            } else {
                return { ok: false, error: 'missing_log_txt' };
            }

            // كل تفعيل = سجل جديد (جهاز جديد). تاريخ ووقت التفعيل يُسجّل لكل جهاز لتمييزه.
            const dt = new Date();
            const nowSimple = formatActivationDateTime(dt);
            let deviceName = 'غير معروف';
            try {
                deviceName = await getDeviceName();
                if (!deviceName || !String(deviceName).trim()) deviceName = 'غير معروف';
            } catch (_) { }
            const version = getAppVersion();
            const activeCount = activations.filter(a => !String(a.signedOutAt || '').trim()).length;
            if (activeCount >= maxCount) {
                return { ok: false, error: 'limit_reached', max: maxCount, count: activeCount };
            }

            if (!officeName || officeName === 'غير محدد') {
                try {
                    const inferred = activations
                        .filter(a => String((a && a.deviceName) || '').trim() && String((a && a.officeName) || '').trim())
                        .slice()
                        .reverse()
                        .find(a => String(a.deviceName || '').trim() === String(deviceName || '').trim());
                    if (inferred && inferred.officeName) officeName = String(inferred.officeName || '').trim();
                } catch (_) { }
            }
            activations.push({
                officeName,
                activatedAt: nowSimple,
                deviceName: String(deviceName || '').trim() || 'غير معروف',
                version: String(version || '').trim() || '0.0.0'
            });
            const newCount = activations.length;

            const textContent = buildActivationLogText(licenseId, maxCount, activations);
            const textPayload = {
                message: `تحديث سجل التفعيل: ${newCount}/${maxCount}`,
                content: btoa(unescape(encodeURIComponent(textContent)))
            };
            if (logTxtSha) textPayload.sha = logTxtSha;
            const textUrl = `${baseUrl}/log.txt?t=${timestamp}`;
            const putRes = await fetch(textUrl, {
                method: 'PUT',
                cache: 'no-store',
                headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(textPayload)
            });

            if (!putRes || !putRes.ok) {
                const st = putRes ? putRes.status : 0;
                const details = await readGitHubErrorDetails(putRes);
                const err = new Error('log_put_failed_' + st);
                err.details = details;
                throw err;
            }

            try { await setSetting('lastActivationDateTime', nowSimple); } catch (_) { }

            for (const d of [220, 600]) {
                try { await sleep(d); } catch (e) { }
                try {
                    const chk = await readFile('log.txt');
                    if (chk && chk.exists && chk.ok) break;
                } catch (e) { }
            }

            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: (error && error.message) ? error.message : String(error || ''),
                details: error && error.details ? error.details : null
            };
        }
    }

    /** مزامنة اسم المكتب الحالي مع سجل التفعيل (يُستدعى كل 3 ثوانٍ عند فتح نافذة الإعدادات فقط) */
    async function syncOfficeNameToLog(licenseId) {
        try {
            await ensureGitHubConfigReady();
            if (!licenseId) return;
            try { if (navigator && navigator.onLine === false) return; } catch (e) { }
            const folderCheck = await activationFolderExists(licenseId);
            if (!folderCheck.exists) return;
            let currentOfficeName = '';
            let lastActivationDateTime = '';
            try {
                currentOfficeName = String(await getSetting('officeName') || '').trim();
                lastActivationDateTime = String(await getSetting('lastActivationDateTime') || '').trim();
            } catch (e) { return; }
            if (!lastActivationDateTime) return;

            let currentDeviceName = '';
            try {
                if (window.__activationCardDeviceName && (Date.now() - window.__activationCardDeviceNameTs) < 30000) {
                    currentDeviceName = String(window.__activationCardDeviceName || '').trim();
                } else {
                    currentDeviceName = String(await getDeviceName() || '').trim();
                    window.__activationCardDeviceName = currentDeviceName;
                    window.__activationCardDeviceNameTs = Date.now();
                }
            } catch (_) { currentDeviceName = ''; }
            if (!currentDeviceName || currentDeviceName === 'غير معروف') return;

            const res = await readActivationLogFromGitHub(licenseId);
            if (!res || !res.ok || !res.sha) return;
            const stats = normalizeActivationStats(licenseId, res.data || {});
            const activations = (stats.activations || []).map(a => ({ ...a }));
            const maxCount = stats.max || 4;
            const idx = activations.findIndex(a =>
                String(a.activatedAt || '').trim() === lastActivationDateTime
            );
            if (idx < 0) return;
            if (String(activations[idx].officeName || '').trim() === currentOfficeName) return;
            activations[idx].officeName = currentOfficeName;
            const textContent = buildActivationLogText(licenseId, maxCount, activations);
            const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;
            const putRes = await fetch(`${baseUrl}/log.txt?t=${Date.now()}`, {
                method: 'PUT',
                cache: 'no-store',
                headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    message: 'تحديث اسم المكتب في سجل التفعيل',
                    content: btoa(unescape(encodeURIComponent(textContent))),
                    sha: res.sha
                })
            });
            if (!putRes || !putRes.ok) return;
        } catch (_) { }
    }

    /** طرد جهاز من السجل أونلاين: يضيف signed out للجهاز المختار */
    async function kickDeviceFromLicense(licenseId, activatedAt, deviceName) {
        try {
            await ensureGitHubConfigReady();
            if (!licenseId) return { ok: false, error: 'missing_license_id' };
            try { if (navigator && navigator.onLine === false) return { ok: false, error: 'offline' }; } catch (e) { }

            const confirmMsg = "سيتم الغاء الترخيص من هذا الجهاز هل تريد الاستمرار";
            if (typeof safeConfirm === 'function') {
                const confirmed = await safeConfirm(confirmMsg);
                if (!confirmed) return { ok: false, error: 'cancelled' };
            } else {
                if (!confirm(confirmMsg)) return { ok: false, error: 'cancelled' };
            }

            if (typeof showToast === 'function') try { showToast('جاري طرد الجهاز...', 'info'); } catch (_) { }

            const res = await readActivationLogFromGitHub(licenseId);
            if (!res || !res.ok || !res.sha) return { ok: false, error: 'cannot_read_log' };

            const stats = normalizeActivationStats(licenseId, res.data || {});
            const activations = (stats.activations || []).map(a => ({ ...a }));
            const maxCount = stats.max || 4;

            const idx = activations.findIndex(a =>
                String(a.activatedAt || '').trim() === String(activatedAt || '').trim() &&
                String(a.deviceName || '').trim() === String(deviceName || '').trim() &&
                !String(a.signedOutAt || '').trim()
            );

            if (idx < 0) return { ok: false, error: 'device_not_found_active' };

            activations[idx].signedOutAt = formatActivationDateTime(new Date());

            const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;
            let kickOk = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                const freshRes = attempt === 1 ? res : await readActivationLogFromGitHub(licenseId);
                if (!freshRes || !freshRes.ok || !freshRes.sha) break;
                if (attempt > 1) {
                    const freshStats = normalizeActivationStats(licenseId, freshRes.data || {});
                    const freshActivations = (freshStats.activations || []).map(a => ({ ...a }));
                    const freshIdx = freshActivations.findIndex(a =>
                        String(a.activatedAt || '').trim() === String(activatedAt || '').trim() &&
                        String(a.deviceName || '').trim() === String(deviceName || '').trim() &&
                        !String(a.signedOutAt || '').trim()
                    );
                    if (freshIdx < 0) { kickOk = true; break; }
                    freshActivations[freshIdx].signedOutAt = formatActivationDateTime(new Date());
                    const tc = buildActivationLogText(licenseId, freshStats.max || 4, freshActivations);
                    const pr = await fetch(`${baseUrl}/log.txt?t=${Date.now()}`, {
                        method: 'PUT', cache: 'no-store',
                        headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ message: `طرد جهاز: ${deviceName}`, content: btoa(unescape(encodeURIComponent(tc))), sha: freshRes.sha })
                    });
                    if (pr && pr.ok) { kickOk = true; break; }
                    if (!pr || pr.status !== 409) break;
                    try { await sleep(450); } catch (_) { }
                    continue;
                }
                const textContent = buildActivationLogText(licenseId, maxCount, activations);
                const putRes = await fetch(`${baseUrl}/log.txt?t=${Date.now()}`, {
                    method: 'PUT', cache: 'no-store',
                    headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ message: `طرد جهاز: ${deviceName}`, content: btoa(unescape(encodeURIComponent(textContent))), sha: res.sha })
                });
                if (putRes && putRes.ok) { kickOk = true; break; }
                if (!putRes || putRes.status !== 409) break;
                try { await sleep(450); } catch (_) { }
            }
            if (!kickOk) throw new Error('kick_put_failed');

            if (typeof showToast === 'function') try { showToast('تم طرد الجهاز بنجاح.', 'success'); } catch (_) { }
            try { await renderActivationStats(licenseId); } catch (_) { }

            return { ok: true };
        } catch (error) {
            if (typeof showToast === 'function') try { showToast('فشل طرد الجهاز. تأكد من الإنترنت.', 'error'); } catch (_) { }
            return { ok: false, error: 'exception' };
        }
    }

    try {
        if (typeof window !== 'undefined') {
            window.__kickDeviceFromLicense = kickDeviceFromLicense;
        }
    } catch (_) { }

    /** تسجيل خروج من هذا الجهاز فقط: إضافة signed out في نفس الكتلة دون زيادة الحد الأقصى */
    async function signOutFromDevice(licenseId) {
        try {
            await ensureGitHubConfigReady();
            if (!licenseId) return { ok: false, error: 'missing_license_id' };
            try { if (navigator && navigator.onLine === false) return { ok: false, error: 'offline' }; } catch (e) { }
            const folderCheck = await activationFolderExists(licenseId);
            // لو مفيش نت أو خطأ شبكة → ميسجلش خروج نهائى لأنه لازم يتأكد من وجود المجلد الأول
            if (folderCheck.offline || folderCheck.networkError) return { ok: false, error: 'offline' };
            // لو المجلد مش موجود فعلاً (والنت شغال واتأكدنا) → يسجل خروج محلى وخلاص
            if (!folderCheck.exists) {
                try {
                    await setSetting('licensed', false);
                    await setSetting('licenseId', '');
                    await setSetting('lastActivationDateTime', '');
                    await setSetting('trialStartMs', '');
                    await setSetting('trialEndMs', '');
                    try { await setSetting('syncClientId', ''); } catch (_) { }
                } catch (e) { return { ok: false, error: 'local_clear_failed' }; }
                return { ok: true, remote: false, note: 'folder_not_found_local_signout' };
            }
            let lastActivationDateTime = '';
            try { lastActivationDateTime = String(await getSetting('lastActivationDateTime') || '').trim(); } catch (_) { }
            if (!lastActivationDateTime) return { ok: false, error: 'no_activation_date' };

            let lastPutStatus = 0;
            for (let attempt = 1; attempt <= 3; attempt += 1) {
                const res = await readActivationLogFromGitHub(licenseId);
                if (!res || !res.ok || !res.sha) return { ok: false, error: 'cannot_read_log' };
                const stats = normalizeActivationStats(licenseId, res.data || {});
                const activations = (stats.activations || []).map(a => ({ ...a }));
                const maxCount = stats.max || 4;
                const idx = activations.findIndex(a =>
                    String(a.activatedAt || '').trim() === lastActivationDateTime
                );
                if (idx < 0) {
                    try {
                        await setSetting('licensed', false);
                        await setSetting('licenseId', '');
                        await setSetting('lastActivationDateTime', '');
                        await setSetting('trialStartMs', '');
                        await setSetting('trialEndMs', '');
                        try { await setSetting('syncClientId', ''); } catch (_) { }
                    } catch (e) { return { ok: false, error: 'local_clear_failed' }; }
                    return { ok: true, remote: false, note: 'record_not_found' };
                }
                const nowSimple = formatActivationDateTime(new Date());
                activations[idx].signedOutAt = nowSimple;
                const textContent = buildActivationLogText(licenseId, maxCount, activations);
                const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;
                const putRes = await fetch(`${baseUrl}/log.txt?t=${Date.now()}`, {
                    method: 'PUT',
                    cache: 'no-store',
                    headers: __buildGitHubHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        message: 'تسجيل خروج من جهاز',
                        content: btoa(unescape(encodeURIComponent(textContent))),
                        sha: res.sha
                    })
                });
                lastPutStatus = putRes ? putRes.status : 0;
                if (putRes && putRes.ok) {
                    lastPutStatus = 0;
                    break;
                }
                if (lastPutStatus !== 409) break;
                try { await sleep(450); } catch (_) { }
            }
            if (lastPutStatus) return { ok: false, error: 'log_put_failed_' + String(lastPutStatus || 0) };
            try {
                await setSetting('licensed', false);
                await setSetting('licenseId', '');
                await setSetting('lastActivationDateTime', '');
                await setSetting('trialStartMs', '');
                await setSetting('trialEndMs', '');
                try { await setSetting('syncClientId', ''); } catch (_) { }
            } catch (e) { return { ok: false, error: 'local_clear_failed' }; }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: (e && e.message) ? e.message : 'exception' };
        }
    }

    async function verifyLicense() {
        const licenseInput = document.getElementById('license-id-input');
        const verifyBtn = document.getElementById('verify-license-btn');
        const statusEl = document.getElementById('license-status');

        if (!licenseInput || !verifyBtn || !statusEl) return;

        const licenseId = licenseInput.value.trim();

        if (!licenseId) {
            setLicenseStatus('يرجى إدخال معرف الترخيص', 'text-red-600');
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="ri-loader-4-line text-lg animate-spin"></i>جاري التحقق...';
        licenseInput.disabled = true;
        setLicenseStatus('جاري التحقق من المعرف...', 'text-blue-600');

        try {
            if (!GITHUB_CONFIG.token) {
                try { await loadRemoteRuntimeConfig({ forceRefresh: true }); } catch (_) { }
            }
            if (!GITHUB_CONFIG.token) {
                const configFailure = getRemoteConfigFailureMessage();
                setLicenseStatus(`❌ ${configFailure}`, 'text-red-600');
                if (typeof showToast === 'function') {
                    try { showToast(configFailure, 'error'); } catch (_) { }
                }
                return;
            }

            // التحقق من وجود المجلد فقط (لا ننشئ المجلد؛ الشركة تنشئه يدوياً). إعادة محاولة حتى 5 مرات لتفادي فشل الطلب/الشبكة.
            const folderUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;
            let response = null;
            let data = null;
            let lastError = null;

            for (let attempt = 1; attempt <= ACTIVATION_FOLDER_RETRIES; attempt++) {
                if (attempt > 1) {
                    verifyBtn.innerHTML = `<i class="ri-loader-4-line text-lg animate-spin"></i>جاري إعادة المحاولة (${attempt}/${ACTIVATION_FOLDER_RETRIES})...`;
                    setLicenseStatus(`جاري إعادة المحاولة (${attempt}/${ACTIVATION_FOLDER_RETRIES})...`, 'text-blue-600');
                    try { await sleep(attempt === 2 ? 600 : 1000); } catch (e) { }
                }
                try {
                    response = await fetch(folderUrl, {
                        cache: 'no-store',
                        headers: __buildGitHubHeaders()
                    });
                    if (response.status === 404) {
                        setLicenseStatus('❌ معرف الترخيص غير صحيح', 'text-red-600');
                        return;
                    }
                    if (!response.ok) {
                        lastError = response.status;
                        continue;
                    }
                    data = await response.json();
                    if (!Array.isArray(data)) {
                        setLicenseStatus('❌ معرف الترخيص غير صحيح (ليس مجلد)', 'text-red-600');
                        return;
                    }
                    lastError = null;
                    break;
                } catch (err) {
                    lastError = err;
                }
            }

            if (lastError !== null || !data || !Array.isArray(data)) {
                const failureMessage = getActivationFolderFailureMessage(lastError);
                setLicenseStatus(`❌ ${failureMessage}`, 'text-red-600');
                if (typeof showToast === 'function') {
                    try { showToast(failureMessage, 'error'); } catch (_) { }
                }
                return;
            }

            setLicenseStatus('جاري التحقق...', 'text-blue-600');
            const ensureRes = await ensureActivationLogExists(licenseId);
            if (!ensureRes || !ensureRes.ok) {
                const failureMessage = getEnsureActivationFailureMessage(ensureRes);
                setLicenseStatus(`❌ ${failureMessage}`, 'text-red-600');
                if (typeof showToast === "function") {
                    try { showToast(failureMessage, 'error'); } catch (_) { }
                }
                return;
            }


            setLicenseStatus('جاري التحقق من حد التفعيلات...', 'text-blue-600');
            const limitCheck = await checkActivationLimit(licenseId);

            if (!limitCheck.allowed) {
                const maxDevices = limitCheck.max || 4;
                if (limitCheck && limitCheck.reason === 'cannot_verify') {
                    setLicenseStatus('❌ لا يمكن التفعيل الآن: تعذر التحقق من سجل التفعيل. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.', 'text-red-600');
                } else {
                    setLicenseStatus(`❌ وصلت للحد الأقصى من الأجهزة (${maxDevices})`, 'text-red-600');
                }
                if (typeof showToast === "function") {
                    try {
                        if (limitCheck && limitCheck.reason === 'cannot_verify') {
                            showToast('لا يمكن التفعيل الآن - تعذر التحقق من سجل التفعيل. اتصل بالإنترنت ثم أعد المحاولة.', "error");
                        } else {
                            showToast(`لا يمكن التفعيل - وصلت للحد الأقصى (${maxDevices} أجهزة)`, "error");
                        }
                    } catch (_) { }
                }
                return;
            }


            // تحديث سجل التفعيل (تسجيل اسم المكتب ورقم الإصدار في log.txt). إعادة المحاولة حتى 5 مرات لتفادي فشل الشبكة/الكاش في PWA.
            setLicenseStatus('جاري تسجيل التفعيل...', 'text-blue-600');
            let logRes = null;
            for (let attempt = 1; attempt <= 5; attempt += 1) {
                try {
                    logRes = await updateActivationLog(licenseId);
                } catch (e) {
                    logRes = null;
                }
                if (logRes && logRes.ok) break;
                if (logRes && !shouldRetryActivationLogWrite(logRes)) break;
                if (attempt < 5) {
                    setLicenseStatus(`جاري إعادة تسجيل التفعيل (${attempt + 1}/5)...`, 'text-blue-600');
                    try { await sleep(attempt === 1 ? 700 : 1200); } catch (e) { }
                }
            }
            if (!logRes || !logRes.ok) {
                if (logRes && logRes.error === 'limit_reached') {
                    const maxDevices = logRes.max || 4;
                    setLicenseStatus(`❌ وصلت للحد الأقصى من الأجهزة (${maxDevices})`, 'text-red-600');
                    if (typeof showToast === "function") {
                        try { showToast(`لا يمكن التفعيل - وصلت للحد الأقصى (${maxDevices} أجهزة)`, "error"); } catch (_) { }
                    }
                    return;
                }
                const failureMessage = getActivationLogWriteFailureMessage(logRes);
                setLicenseStatus(`❌ ${failureMessage}`, 'text-red-600');
                if (typeof showToast === "function") {
                    try {
                        showToast(failureMessage, 'error');
                    } catch (_) { }
                }
                return;
            }

            // لا نحفظ التفعيل محلياً إلا بعد نجاح تسجيله في اللوج
            await setSetting("licensed", true);
            await setSetting("licenseId", licenseId);
            try { await setSetting("syncClientId", licenseId); } catch (e) { }

            setLicenseStatus('✅ تم التفعيل بنجاح!', 'text-green-600');

            if (typeof showToast === "function") {
                try {
                    showToast("تم تفعيل التطبيق بنجاح!", "success");
                } catch (_) { }
            }


            setTimeout(() => {
                showLicenseInterface(true, licenseId, null);
                if (typeof window.__startLicenseIntervals === 'function') {
                    window.__startLicenseIntervals(licenseId);
                }
            }, 1500);

        } catch (error) {
            setLicenseStatus('❌ فشل في التحقق من الترخيص', 'text-red-600');

            if (typeof showToast === "function") {
                try {
                    showToast("فشل في التحقق من الترخيص", "error");
                } catch (_) { }
            }
        } finally {

            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="ri-shield-check-line text-lg"></i>تحقق من الترخيص';
            licenseInput.disabled = false;
        }
    }

    function setLicenseStatus(message, className) {
        const statusEl = document.getElementById('license-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `text-xs text-center mt-2 ${className}`;
        }
    }


    function showTrialExpiredOverlay() {
        let overlay = document.getElementById("trial-expired-overlay");
        if (overlay) return;

        overlay = document.createElement("div");
        overlay.id = "trial-expired-overlay";
        overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/90";
        overlay.innerHTML = `
        <div class="w-[95vw] max-w-md bg-white rounded-xl p-6 flex flex-col items-center gap-4 shadow-2xl">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                <i class="ri-key-2-line text-white text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 text-center">وصلت للحد الأقصى من الاستخدام</h3>
            <p class="text-gray-600 text-center text-sm leading-relaxed">
                لقد انتهت الفترة التجريبية للبرنامج. يرجى تفعيل النسخة للمتابعة والتمتع بكافة المميزات.
            </p>
            <div class="w-full space-y-3">
                <input type="text" id="overlay-license-input" placeholder="اكتب كود التفعيل هنا" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500">
                <button id="overlay-verify-btn" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                    <i class="ri-shield-check-line text-lg"></i>تفعيل الآن
                </button>
                <button id="overlay-not-now-btn" class="w-full py-3 bg-blue-900 hover:bg-black text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md">
                    <i class="ri-close-line text-lg"></i>ليس الان
                </button>
            </div>
            <div id="overlay-status" class="text-xs text-center text-gray-600"></div>
        </div>
    `;

        try {
            document.body.appendChild(overlay);
            document.body.style.overflow = "hidden";


            const verifyBtn = document.getElementById("overlay-verify-btn");
            const notNowBtn = document.getElementById("overlay-not-now-btn");
            const licenseInput = document.getElementById("overlay-license-input");

            if (verifyBtn) {
                verifyBtn.addEventListener("click", () => verifyLicenseFromOverlay());
            }

            if (notNowBtn) {
                notNowBtn.addEventListener('click', () => {
                    try {
                        const ov = document.getElementById('trial-expired-overlay');
                        if (ov) ov.remove();
                        document.body.style.overflow = "";
                    } catch (_) { }
                });
            }

            if (licenseInput) {
                licenseInput.addEventListener("keypress", (e) => {
                    if (e.key === 'Enter') {
                        verifyLicenseFromOverlay();
                    }
                });
            }
        } catch (e) { }
    }

    // إتاحة النافذة المنبثقة لباقي الملفات (مثلاً الشاشة الرئيسية) بدون ما ننشئ نافذة جديدة.
    try { window.__LAWYER_SHOW_ACTIVATION_OVERLAY = showTrialExpiredOverlay; } catch (_) { }


    async function verifyLicenseFromOverlay() {
        const licenseInput = document.getElementById('overlay-license-input');
        const verifyBtn = document.getElementById('overlay-verify-btn');
        const statusEl = document.getElementById('overlay-status');

        if (!licenseInput || !verifyBtn || !statusEl) return;

        const licenseId = licenseInput.value.trim();

        if (!licenseId) {
            statusEl.textContent = 'يرجى إدخال معرف الترخيص';
            statusEl.className = 'text-xs text-center text-red-600';
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="ri-loader-4-line text-lg animate-spin"></i>جاري التحقق...';
        licenseInput.disabled = true;
        statusEl.textContent = 'جاري التحقق من المعرف...';
        statusEl.className = 'text-xs text-center text-blue-600';

        try {
            if (!GITHUB_CONFIG.token) {
                try { await loadRemoteRuntimeConfig({ forceRefresh: true }); } catch (_) { }
            }
            if (!GITHUB_CONFIG.token) {
                const configFailure = getRemoteConfigFailureMessage();
                statusEl.textContent = `❌ ${configFailure}`;
                statusEl.className = 'text-xs text-center text-red-600';
                if (typeof showToast === 'function') {
                    try { showToast(configFailure, 'error'); } catch (_) { }
                }
                return;
            }

            // التحقق من وجود المجلد فقط (لا ننشئ المجلد). إعادة محاولة حتى 5 مرات.
            const folderUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${encodeURIComponent(licenseId)}`;
            let response = null;
            let data = null;
            let lastError = null;

            for (let attempt = 1; attempt <= ACTIVATION_FOLDER_RETRIES; attempt++) {
                if (attempt > 1) {
                    verifyBtn.innerHTML = `<i class="ri-loader-4-line text-lg animate-spin"></i>جاري إعادة المحاولة (${attempt}/${ACTIVATION_FOLDER_RETRIES})...`;
                    statusEl.textContent = `جاري إعادة المحاولة (${attempt}/${ACTIVATION_FOLDER_RETRIES})...`;
                    statusEl.className = 'text-xs text-center text-blue-600';
                    try { await sleep(attempt === 2 ? 600 : 1000); } catch (e) { }
                }
                try {
                    response = await fetch(folderUrl, {
                        cache: 'no-store',
                        headers: __buildGitHubHeaders()
                    });
                    if (response.status === 404) {
                        statusEl.textContent = '❌ معرف الترخيص غير صحيح';
                        statusEl.className = 'text-xs text-center text-red-600';
                        return;
                    }
                    if (!response.ok) {
                        lastError = response.status;
                        continue;
                    }
                    data = await response.json();
                    if (!Array.isArray(data)) {
                        statusEl.textContent = '❌ معرف الترخيص غير صحيح (ليس مجلد)';
                        statusEl.className = 'text-xs text-center text-red-600';
                        return;
                    }
                    lastError = null;
                    break;
                } catch (err) {
                    lastError = err;
                }
            }

            if (lastError !== null || !data || !Array.isArray(data)) {
                const failureMessage = getActivationFolderFailureMessage(lastError);
                statusEl.textContent = `❌ ${failureMessage}`;
                statusEl.className = 'text-xs text-center text-red-600';
                if (typeof showToast === 'function') {
                    try { showToast(failureMessage, 'error'); } catch (_) { }
                }
                return;
            }

            statusEl.textContent = 'جاري التحقق...';
            statusEl.className = 'text-xs text-center text-blue-600';
            const ensureRes = await ensureActivationLogExists(licenseId);
            if (!ensureRes || !ensureRes.ok) {
                const failureMessage = getEnsureActivationFailureMessage(ensureRes);
                statusEl.textContent = `❌ ${failureMessage}`;
                statusEl.className = 'text-xs text-center text-red-600';
                if (typeof showToast === "function") {
                    try { showToast(failureMessage, 'error'); } catch (_) { }
                }
                return;
            }


            statusEl.textContent = 'جاري التحقق من حد التفعيلات...';
            statusEl.className = 'text-xs text-center text-blue-600';
            const limitCheck = await checkActivationLimit(licenseId);

            if (!limitCheck.allowed) {
                const maxDevices = limitCheck.max || 4;
                if (limitCheck && limitCheck.reason === 'cannot_verify') {
                    statusEl.textContent = '❌ لا يمكن التفعيل الآن: تعذر التحقق من سجل التفعيل. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.';
                    statusEl.className = 'text-xs text-center text-red-600';
                } else {
                    statusEl.textContent = `❌ وصلت للحد الأقصى من الأجهزة (${maxDevices})`;
                    statusEl.className = 'text-xs text-center text-red-600';
                }
                if (typeof showToast === "function") {
                    try {
                        if (limitCheck && limitCheck.reason === 'cannot_verify') {
                            showToast('لا يمكن التفعيل الآن - تعذر التحقق من سجل التفعيل. اتصل بالإنترنت ثم أعد المحاولة.', "error");
                        } else {
                            showToast(`لا يمكن التفعيل - وصلت للحد الأقصى (${maxDevices} أجهزة)`, "error");
                        }
                    } catch (_) { }
                }
                return;
            }

            // تحديث سجل التفعيل (تسجيل اسم المكتب ورقم الإصدار). إعادة المحاولة حتى 5 مرات.
            statusEl.textContent = 'جاري تسجيل التفعيل...';
            statusEl.className = 'text-xs text-center text-blue-600';
            let logRes = null;
            for (let attempt = 1; attempt <= 5; attempt += 1) {
                try {
                    logRes = await updateActivationLog(licenseId);
                } catch (e) {
                    logRes = null;
                }
                if (logRes && logRes.ok) break;
                if (logRes && !shouldRetryActivationLogWrite(logRes)) break;
                if (attempt < 5) {
                    statusEl.textContent = `جاري إعادة تسجيل التفعيل (${attempt + 1}/5)...`;
                    statusEl.className = 'text-xs text-center text-blue-600';
                    try { await sleep(attempt === 1 ? 700 : 1200); } catch (e) { }
                }
            }
            if (!logRes || !logRes.ok) {
                if (logRes && logRes.error === 'limit_reached') {
                    const maxDevices = logRes.max || 4;
                    statusEl.textContent = `❌ وصلت للحد الأقصى من الأجهزة (${maxDevices})`;
                    statusEl.className = 'text-xs text-center text-red-600';
                    if (typeof showToast === "function") {
                        try { showToast('لا يمكن التفعيل - وصلت للحد الأقصى (' + maxDevices + ' أجهزة)', "error"); } catch (_) { }
                    }
                    return;
                }
                const failureMessage = getActivationLogWriteFailureMessage(logRes);
                statusEl.textContent = `❌ ${failureMessage}`;
                statusEl.className = 'text-xs text-center text-red-600';
                if (typeof showToast === "function") {
                    try {
                        showToast(failureMessage, 'error');
                    } catch (_) { }
                }
                return;
            }

            // لا نحفظ التفعيل محلياً إلا بعد نجاح تسجيله في اللوج
            await setSetting("licensed", true);
            await setSetting("licenseId", licenseId);
            try { await setSetting("syncClientId", licenseId); } catch (e) { }

            statusEl.textContent = '✅ تم التفعيل بنجاح!';
            statusEl.className = 'text-xs text-center text-green-600';

            if (typeof showToast === "function") {
                try {
                    showToast("تم تفعيل التطبيق بنجاح!", "success");
                } catch (_) { }
            }


            setTimeout(() => {
                const overlay = document.getElementById("trial-expired-overlay");
                if (overlay) {
                    try {
                        overlay.remove();
                        document.body.style.overflow = "";
                    } catch (_) { }
                }

                window.location.reload();
            }, 1500);

        } catch (error) {
            statusEl.textContent = '❌ فشل في التحقق من الترخيص';
            statusEl.className = 'text-xs text-center text-red-600';

            if (typeof showToast === "function") {
                try {
                    showToast("فشل في التحقق من الترخيص", "error");
                } catch (_) { }
            }
        } finally {

            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="ri-shield-check-line text-lg"></i>تفعيل الآن';
            licenseInput.disabled = false;
        }
    }

    function showKickOverlay(officeName, deviceName) {
        let overlay = document.getElementById("device-kicked-overlay");
        if (overlay) return;

        overlay = document.createElement("div");
        overlay.id = "device-kicked-overlay";
        overlay.className = "fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm";
        overlay.innerHTML = `
        <div class="w-[95vw] max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in duration-300">
            <div class="bg-red-600 p-6 flex flex-col items-center gap-3">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
                    <i class="ri-error-warning-fill text-white text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white text-center">تنبيه أمني: إنهاء الترخيص</h3>
            </div>
            <div class="p-6 flex flex-col items-center gap-5">
                <div class="bg-red-50 border border-red-100 rounded-xl p-4 w-full">
                    <p class="text-gray-800 text-center text-sm leading-relaxed font-bold">
                        تم إلغاء ترخيص هذا الجهاز من البرنامج بواسطة المسؤول.
                    </p>
                    <p class="text-gray-600 text-center text-xs mt-2">
                        تم إلغاء ترخيص هذا الجهاز بواسطة المسؤول.
                    </p>
                </div>
                
                <p class="text-xs text-gray-500 text-center">
                    يرجى التواصل مع الإدارة إذا كنت تعتقد أن هذا الإجراء تم بالخطأ.
                </p>

                <button id="kick-understand-btn" class="w-full py-3.5 bg-blue-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                    <i class="ri-check-double-line text-lg"></i>
                    <span>اتفهم ذلك</span>
                </button>
            </div>
        </div>
    `;

        try {
            document.body.appendChild(overlay);
            document.body.style.overflow = "hidden";

            const understandBtn = document.getElementById("kick-understand-btn");
            if (understandBtn) {
                understandBtn.addEventListener("click", () => {
                    try {
                        overlay.remove();
                        document.body.style.overflow = "";
                        window.location.reload();
                    } catch (_) { }
                });
            }
        } catch (e) { }
    }


    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLicenseSystem);
    } else {
        initLicenseSystem();
    }
})();
