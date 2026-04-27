let __barcodeStream = null;
let __barcodeLoopRunning = false;
let __barcodeCameraNonce = 0;
let __barcodeStartInFlight = false;

let __barcodeLastSeenMap = Object.create(null);
let __barcodeIgnoreUntil = 0;
const __BARCODE_REPEAT_SUPPRESS_MS = 2500;
const __BARCODE_POST_SCAN_COOLDOWN_MS = 550;

let __barcodeScanAudio = null;
let __barcodeScanAudioUnlocked = false;

let __barcodeUserWantsCamera = false;
let __barcodeResumeTimer = 0;

const __BARCODE_HISTORY_KEY = 'qr_opened_links_history_v1';

function __barcodeIsMobileOnly() {
    try {
        return !window.electronAPI;
    } catch (_) {
        return true;
    }
}

function __barcodeUrlSiteName(rawUrl) {
    try {
        const s = String(rawUrl || '').trim();
        if (!s) return '';
        if (/^mailto:/i.test(s)) return 'البريد';
        if (/^tel:/i.test(s)) return 'اتصال';
        if (/^sms:/i.test(s)) return 'رسالة';
        if (/^whatsapp:/i.test(s)) return 'واتساب';
        if (/^tg:/i.test(s)) return 'تيليجرام';

        const normalized = __barcodeNormalizeUrl(s);
        const u = new URL(normalized);
        const host = String(u.hostname || '').replace(/^www\./i, '').trim();
        return host || normalized;
    } catch (_) {
        return String(rawUrl || '').trim();
    }
}

function __barcodeShouldSuppress(rawValue) {
    try {
        const v = String(rawValue || '').trim();
        if (!v) return true;
        const now = Date.now();

        if (now < __barcodeIgnoreUntil) return true;

        const last = __barcodeLastSeenMap[v] ? Number(__barcodeLastSeenMap[v]) : 0;
        if (last && now - last < __BARCODE_REPEAT_SUPPRESS_MS) return true;

        __barcodeLastSeenMap[v] = now;
        __barcodeIgnoreUntil = now + __BARCODE_POST_SCAN_COOLDOWN_MS;

        try {
            const keys = Object.keys(__barcodeLastSeenMap || {});
            if (keys.length > 240) __barcodeLastSeenMap = Object.create(null);
        } catch (_) { }

        return false;
    } catch (_) {
        return false;
    }
}

function __barcodeTryUnlockAudioOnce() {
    try {
        if (__barcodeScanAudioUnlocked) return;
        if (!__barcodeScanAudio) __barcodeScanAudio = new Audio('audio/barcode.mp3');
        try { __barcodeScanAudio.preload = 'auto'; } catch (_) { }
        __barcodeScanAudio.muted = true;
        __barcodeScanAudio.currentTime = 0;
        const p = __barcodeScanAudio.play();
        if (p && typeof p.then === 'function') {
            p.then(() => {
                try { __barcodeScanAudio.pause(); } catch (_) { }
                try { __barcodeScanAudio.currentTime = 0; } catch (_) { }
                try { __barcodeScanAudio.muted = false; } catch (_) { }
                __barcodeScanAudioUnlocked = true;
            }).catch(() => { });
        }
    } catch (_) { }
}

function __barcodeEnsureCameraActive() {
    try {
        if (document.hidden) return;

        const v = document.getElementById('barcode-video');
        const stream = __barcodeStream;
        const tracks = stream && stream.getTracks ? stream.getTracks() : [];
        const hasLiveTrack = (tracks || []).some(t => t && t.readyState === 'live');

        if (__barcodeLoopRunning) {
            try {
                if (v && v.srcObject && v.paused) {
                    const p = v.play();
                    if (p && typeof p.catch === 'function') p.catch(() => { });
                }
            } catch (_) { }

            if (!stream || !hasLiveTrack) {
                try { __barcodeStopCamera(); } catch (_) { }
                if (__barcodeUserWantsCamera) {
                    setTimeout(() => { try { __barcodeStartCamera(); } catch (_) { } }, 220);
                }
            }
            return;
        }

        if (__barcodeUserWantsCamera) {
            try { __barcodeStartCamera(); } catch (_) { }
        }
    } catch (_) { }
}

function __barcodeScheduleEnsureCameraActive(delayMs) {
    try {
        const d = Math.max(0, Number(delayMs || 0));
        if (__barcodeResumeTimer) {
            try { clearTimeout(__barcodeResumeTimer); } catch (_) { }
        }
        __barcodeResumeTimer = setTimeout(() => {
            __barcodeResumeTimer = 0;
            try { __barcodeEnsureCameraActive(); } catch (_) { }
        }, d);
    } catch (_) { }
}

function __barcodeIsDesktopApp() {
    try {
        return !!(typeof window !== 'undefined' && window.electronAPI);
    } catch (_) {
        return false;
    }
}

function __barcodeSetStartOverlayVisible(visible) {
    try {
        const el = document.getElementById('barcode-desktop-start-overlay');
        if (el) el.style.display = visible ? 'flex' : 'none';

        if (__barcodeIsMobileOnly()) {
            const b = document.body;
            if (b && b.classList) b.classList.toggle('barcode-start-overlay-visible', !!visible);
        }
    } catch (_) { }
}

function __barcodeEnsureHistoryModal() {
    try {
        if (__barcodeIsDesktopApp()) return null;

        let root = document.getElementById('barcode-history-modal');
        if (root) return root;

        root = document.createElement('div');
        root.id = 'barcode-history-modal';
        root.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,0.86);display:none;align-items:center;justify-content:center;padding:0;direction:rtl;';

        const box = document.createElement('div');
        box.id = 'barcode-history-modal-box';
        box.style.cssText = 'width:100%;height:100%;background:#ffffff;border:0;border-radius:0;display:flex;flex-direction:column;';

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 12px;border-bottom:1px solid rgba(15,23,42,.10);background:#ffffff;';

        const title = document.createElement('div');
        title.textContent = 'السجل';
        title.style.cssText = 'font-weight:900;color:#0f172a;font-size:16px;';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.id = 'barcode-history-modal-close';
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'width:42px;height:42px;border-radius:14px;border:1px solid rgba(15,23,42,.15);font-size:22px;font-weight:900;line-height:1;background:#ffffff;color:#0f172a;';

        const content = document.createElement('div');
        content.id = 'barcode-history-modal-content';
        content.style.cssText = 'flex:1;min-height:0;overflow:auto;padding:12px;background:#f8fafc;';

        const list = document.createElement('div');
        list.id = 'barcode-history-modal-list';
        list.className = 'space-y-2';

        content.appendChild(list);
        header.appendChild(title);
        header.appendChild(closeBtn);
        box.appendChild(header);
        box.appendChild(content);
        root.appendChild(box);
        (document.body || document.documentElement).appendChild(root);

        const close = () => { try { root.style.display = 'none'; } catch (_) { } };
        closeBtn.addEventListener('click', close);
        root.addEventListener('click', (e) => { try { if (e && e.target === root) close(); } catch (_) { } });

        return root;
    } catch (_) {
        return null;
    }
}

function __barcodePlayScanSound() {
    try {
        if (!__barcodeScanAudio) __barcodeScanAudio = new Audio('audio/barcode.mp3');
        try { __barcodeScanAudio.preload = 'auto'; } catch (_) { }
        __barcodeScanAudio.volume = 1;
        try { __barcodeScanAudio.currentTime = 0; } catch (_) { }
        const p = __barcodeScanAudio.play();
        if (p && typeof p.catch === 'function') {
            p.catch(() => {
                try {
                    if (!__barcodeScanAudioUnlocked) __barcodeTryUnlockAudioOnce();
                    setTimeout(() => {
                        try {
                            if (!__barcodeScanAudio) return;
                            try { __barcodeScanAudio.currentTime = 0; } catch (_) { }
                            const p2 = __barcodeScanAudio.play();
                            if (p2 && typeof p2.catch === 'function') p2.catch(() => { });
                        } catch (_) { }
                    }, 90);
                } catch (_) { }
            });
        }
    } catch (_) { }
}

function __barcodeShowLinkLoadingOverlay(message) {
    try {
        let el = document.getElementById('link-loading-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'link-loading-overlay';
            el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,0.86);display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl;';

            const box = document.createElement('div');
            box.style.cssText = 'width:min(520px, 100%);background:#ffffff;border:1px solid rgba(15,23,42,.12);border-radius:18px;padding:16px;box-shadow:0 16px 40px rgba(15,23,42,.18);text-align:center;';

            const title = document.createElement('div');
            title.id = 'link-loading-title';
            title.textContent = 'جاري الفتح...';
            title.style.cssText = 'font-weight:900;color:#0f172a;font-size:16px;margin-bottom:10px;';

            const pulse = document.createElement('div');
            pulse.id = 'link-loading-pulse';
            pulse.style.cssText = 'width:56px;height:56px;border-radius:9999px;margin:0 auto 6px auto;background:conic-gradient(from 0deg,#22d3ee,#38bdf8,#6366f1,#a855f7,#22d3ee);box-shadow:0 10px 26px rgba(56,189,248,.25), 0 0 0 6px rgba(56,189,248,.10);animation:linkPulse 0.95s ease-in-out infinite, linkHue 2.2s linear infinite;';

            const hint = document.createElement('div');
            hint.id = 'link-loading-hint';
            hint.textContent = '';
            hint.style.cssText = 'margin-top:10px;font-size:13px;color:#334155;font-weight:800;';

            if (!document.querySelector('style[data-link-loading-style="1"]')) {
                const style = document.createElement('style');
                style.setAttribute('data-link-loading-style', '1');
                style.textContent = [
                    '@keyframes linkPulse{',
                    '0%{transform:scale(.88);opacity:.78;box-shadow:0 10px 26px rgba(56,189,248,.18)}',
                    '55%{transform:scale(1);opacity:1;box-shadow:0 14px 34px rgba(99,102,241,.26)}',
                    '100%{transform:scale(.88);opacity:.78;box-shadow:0 10px 26px rgba(56,189,248,.18)}',
                    '}',
                    '@keyframes linkHue{',
                    '0%{filter:hue-rotate(0deg)}',
                    '100%{filter:hue-rotate(360deg)}',
                    '}'
                ].join('');
                (document.head || document.documentElement).appendChild(style);
            }

            box.appendChild(title);
            box.appendChild(pulse);
            box.appendChild(hint);
            el.appendChild(box);
            (document.body || document.documentElement).appendChild(el);
        }

        const t = document.getElementById('link-loading-title');
        if (t) t.textContent = message || 'جاري الفتح...';
        el.style.display = 'flex';
    } catch (_) { }
}

function __barcodeHideLinkLoadingOverlay() {
    try {
        const el = document.getElementById('link-loading-overlay');
        if (!el) return;
        el.style.display = 'none';
    } catch (_) { }
}

function __barcodeIsWifiPayload(raw) {
    try {
        return /^WIFI:/i.test(String(raw || '').trim());
    } catch (_) {
        return false;
    }
}

function __barcodeUnescapeWifiValue(s) {
    try {
        return String(s || '').replace(/\\([\\;:,])/g, '$1');
    } catch (_) {
        return String(s || '');
    }
}

function __barcodeParseWifiPayload(raw) {
    try {
        const text = String(raw || '').trim();
        const body = text.replace(/^WIFI:/i, '');

        const parts = [];
        let cur = '';
        let esc = false;
        for (let i = 0; i < body.length; i++) {
            const ch = body[i];
            if (esc) {
                cur += ch;
                esc = false;
                continue;
            }
            if (ch === '\\') {
                cur += ch;
                esc = true;
                continue;
            }
            if (ch === ';') {
                parts.push(cur);
                cur = '';
                continue;
            }
            cur += ch;
        }
        if (cur) parts.push(cur);

        const map = {};
        parts.forEach(p => {
            const idx = p.indexOf(':');
            if (idx <= 0) return;
            const k = p.slice(0, idx).trim().toUpperCase();
            const v = __barcodeUnescapeWifiValue(p.slice(idx + 1));
            if (!k) return;
            map[k] = v;
        });

        const ssid = map.S || '';
        const pass = map.P || '';
        const type = map.T || '';
        const hidden = String(map.H || '').toLowerCase();
        return {
            ssid,
            password: pass,
            security: type,
            hidden: hidden === 'true' || hidden === '1' || hidden === 'yes'
        };
    } catch (_) {
        return { ssid: '', password: '', security: '', hidden: false };
    }
}

function __barcodeEnsureValueModal() {
    try {
        let root = document.getElementById('barcode-value-modal');
        if (root) return root;

        root = document.createElement('div');
        root.id = 'barcode-value-modal';
        root.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,0.86);display:none;align-items:center;justify-content:center;padding:16px;direction:rtl;';

        const box = document.createElement('div');
        box.id = 'barcode-value-modal-box';
        box.style.cssText = 'width:min(700px, 100%);background:#ffffff;border:1px solid rgba(15,23,42,.12);border-radius:18px;padding:14px;box-shadow:0 16px 40px rgba(15,23,42,.18);';

        const header = document.createElement('div');
        header.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;';

        const title = document.createElement('div');
        title.id = 'barcode-value-modal-title';
        title.textContent = 'محتوى الباركود';
        title.style.cssText = 'font-weight:900;color:#0f172a;font-size:16px;';

        const closeBtn = document.createElement('button');
        closeBtn.id = 'barcode-value-modal-close';
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'position:absolute;right:0;top:0;width:38px;height:38px;border-radius:12px;border:1px solid rgba(15,23,42,.15);font-size:22px;font-weight:900;line-height:1;background:#ffffff;color:#0f172a;';

        const content = document.createElement('div');
        content.id = 'barcode-value-modal-content';
        content.style.cssText = 'max-height:60vh;overflow:auto;border:1px solid rgba(15,23,42,.10);border-radius:14px;padding:12px;background:#f8fafc;text-align:right;';

        const actions = document.createElement('div');
        actions.id = 'barcode-value-modal-actions';
        actions.style.cssText = 'display:flex;gap:10px;margin-top:12px;';

        header.appendChild(title);
        header.appendChild(closeBtn);
        box.appendChild(header);
        box.appendChild(content);
        box.appendChild(actions);
        root.appendChild(box);
        (document.body || document.documentElement).appendChild(root);

        closeBtn.addEventListener('click', () => {
            try { root.style.display = 'none'; } catch (_) { }
            try {
                __barcodeUserWantsCamera = false;
                __barcodeSetStartOverlayVisible(true);
            } catch (_) { }
        });

        root.addEventListener('click', (e) => {
            try {
                if (e && e.target === root) {
                    root.style.display = 'none';
                    try {
                        __barcodeUserWantsCamera = false;
                        __barcodeSetStartOverlayVisible(true);
                    } catch (_) { }
                }
            } catch (_) { }
        });

        return root;
    } catch (_) {
        return null;
    }
}

function __barcodeOpenValueModal(rawValue) {
    try {
        try { __barcodeHideResult(); } catch (_) { }
        const root = __barcodeEnsureValueModal();
        if (!root) return;
        const value = String(rawValue || '').trim();

        const titleEl = document.getElementById('barcode-value-modal-title');
        const contentEl = document.getElementById('barcode-value-modal-content');
        const actionsEl = document.getElementById('barcode-value-modal-actions');
        if (!contentEl || !actionsEl) return;

        const safe = (s) => String(s || '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

        actionsEl.innerHTML = '';

        const btnCopy = document.createElement('button');
        btnCopy.type = 'button';
        btnCopy.textContent = 'نسخ';
        btnCopy.style.cssText = 'flex:1;padding:12px 14px;border-radius:14px;background:#2563eb;color:#fff;font-weight:900;border:0;';

        btnCopy.addEventListener('click', async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(value);
                    if (typeof showToast === 'function') showToast('تم النسخ', 'success');
                } else {
                    if (typeof showToast === 'function') showToast('النسخ غير مدعوم على هذا الجهاز', 'warning');
                }
            } catch (_) {
                if (typeof showToast === 'function') showToast('تعذر النسخ', 'error');
            }
        });

        if (__barcodeIsWifiPayload(value)) {
            const wifi = __barcodeParseWifiPayload(value);
            if (titleEl) titleEl.textContent = 'بيانات واي فاي';
            contentEl.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr;gap:10px;">
                    <div style="background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:12px;padding:10px;">
                        <div style="font-weight:900;color:#0f172a;margin-bottom:6px;">اسم الشبكة</div>
                        <div style="direction:ltr;text-align:right;font-weight:800;color:#111827;word-break:break-word;">${safe(wifi.ssid || '') || '-'}</div>
                    </div>
                    <div style="background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:12px;padding:10px;">
                        <div style="font-weight:900;color:#0f172a;margin-bottom:6px;">كلمة السر</div>
                        <div style="direction:ltr;text-align:right;font-weight:800;color:#111827;word-break:break-word;">${safe(wifi.password || '') || '-'}</div>
                    </div>
                    <div style="background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:12px;padding:10px;">
                        <div style="font-weight:900;color:#0f172a;margin-bottom:6px;">الحماية</div>
                        <div style="direction:ltr;text-align:right;font-weight:800;color:#111827;word-break:break-word;">${safe(wifi.security || '') || '-'}</div>
                    </div>
                    <div style="background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:12px;padding:10px;">
                        <div style="font-weight:900;color:#0f172a;margin-bottom:6px;">مخفي</div>
                        <div style="font-weight:800;color:#111827;">${wifi.hidden ? 'نعم' : 'لا'}</div>
                    </div>
                </div>
            `;

            if (wifi.password) {
                const btnCopyPass = document.createElement('button');
                btnCopyPass.type = 'button';
                btnCopyPass.textContent = 'نسخ كلمة السر';
                btnCopyPass.style.cssText = 'flex:1;padding:12px 14px;border-radius:14px;background:#0ea5e9;color:#fff;font-weight:900;border:0;';
                btnCopyPass.addEventListener('click', async () => {
                    try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(String(wifi.password || ''));
                            if (typeof showToast === 'function') showToast('تم النسخ', 'success');
                        } else {
                            if (typeof showToast === 'function') showToast('النسخ غير مدعوم على هذا الجهاز', 'warning');
                        }
                    } catch (_) {
                        if (typeof showToast === 'function') showToast('تعذر النسخ', 'error');
                    }
                });
                actionsEl.appendChild(btnCopyPass);
            } else {
                actionsEl.appendChild(btnCopy);
            }
        } else {
            if (titleEl) titleEl.textContent = 'محتوى الباركود';
            contentEl.innerHTML = `
                <div style="direction:ltr;text-align:right;white-space:pre-wrap;word-break:break-word;font-weight:800;color:#111827;unicode-bidi:plaintext;">${safe(value)}</div>
            `;
            actionsEl.appendChild(btnCopy);
        }

        root.style.display = 'flex';
    } catch (_) { }
}

function __barcodeReadHistory() {
    try {
        const raw = localStorage.getItem(__BARCODE_HISTORY_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        const list = Array.isArray(arr) ? arr : [];
        return list.map(x => {
            if (!x) return null;
            if (typeof x === 'string') {
                return { value: x, ts: 0 };
            }
            if (x && typeof x === 'object') {
                if (typeof x.value === 'string') {
                    return { value: x.value, ts: Number(x.ts || 0) };
                }
                if (typeof x.url === 'string') {
                    return { value: x.url, ts: Number(x.ts || 0) };
                }
            }
            return null;
        }).filter(Boolean);
    } catch (_) {
        return [];
    }
}

function __barcodeHistoryLabel(rawValue) {
    try {
        const v = String(rawValue || '').trim();
        if (__barcodeIsWifiPayload(v)) {
            const wifi = __barcodeParseWifiPayload(v);
            const ssid = String(wifi && wifi.ssid ? wifi.ssid : '').trim();
            return ssid ? `WiFi: ${ssid}` : 'WiFi';
        }
        if (__barcodeLooksLikeUrl(v)) {
            return __barcodeUrlSiteName(v);
        }
        return v;
    } catch (_) {
        return String(rawValue || '');
    }
}

function __barcodeWriteHistory(arr) {
    try {
        const list = Array.isArray(arr) ? arr : [];
        const normalized = list.map(x => {
            if (!x) return null;
            if (typeof x === 'string') return { value: x, ts: 0 };
            if (x && typeof x === 'object') {
                const v = typeof x.value === 'string' ? x.value : (typeof x.url === 'string' ? x.url : '');
                return { value: v, ts: Number(x.ts || 0) };
            }
            return null;
        }).filter(x => x && String(x.value || '').trim());
        localStorage.setItem(__BARCODE_HISTORY_KEY, JSON.stringify(normalized));
    } catch (_) { }
}

function __barcodeRemoveHistoryAt(index) {
    try {
        const idx = Number(index);
        if (!isFinite(idx) || idx < 0) return;
        const list = __barcodeReadHistory();
        if (!Array.isArray(list) || idx >= list.length) return;
        list.splice(idx, 1);
        __barcodeWriteHistory(list);
    } catch (_) { }
}

function __barcodeAddToHistory(rawValue) {
    try {
        const v = String(rawValue || '').trim();
        if (!v) return;
        const now = Date.now();
        const list = __barcodeReadHistory();
        const filtered = (list || []).filter(x => x && String(x.value || '').trim() && String(x.value || '').trim() !== v);
        filtered.unshift({ value: v, ts: now });
        __barcodeWriteHistory(filtered.slice(0, 80));
    } catch (_) { }
}

function __barcodeCreateDetector() {
    try {
        return new BarcodeDetector({ formats: ['qr_code'] });
    } catch (_) {
        try {
            return new BarcodeDetector();
        } catch (e) {
            return null;
        }
    }
}

let __barcodeScratchCanvas = null;
function __barcodeGetScratchCanvas() {
    try {
        if (__barcodeScratchCanvas) return __barcodeScratchCanvas;
        __barcodeScratchCanvas = document.createElement('canvas');
        return __barcodeScratchCanvas;
    } catch (_) {
        return null;
    }
}

async function __barcodeDetectWithJsQR(source, opts) {
    try {
        if (typeof jsQR !== 'function') return '';
        if (!source) return '';
        const canvas = __barcodeGetScratchCanvas();
        if (!canvas) return '';
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return '';

        const maxDim = (opts && Number(opts.maxDim)) ? Number(opts.maxDim) : 1024;

        let sw = 0;
        let sh = 0;
        try {
            if (source && typeof source.videoWidth === 'number' && typeof source.videoHeight === 'number') {
                sw = source.videoWidth;
                sh = source.videoHeight;
            } else if (source && typeof source.naturalWidth === 'number' && typeof source.naturalHeight === 'number') {
                sw = source.naturalWidth;
                sh = source.naturalHeight;
            } else if (source && typeof source.width === 'number' && typeof source.height === 'number') {
                sw = source.width;
                sh = source.height;
            }
        } catch (_) { }

        if (!sw || !sh) return '';

        const scale = Math.min(1, maxDim / Math.max(sw, sh));
        const dw = Math.max(1, Math.round(sw * scale));
        const dh = Math.max(1, Math.round(sh * scale));

        canvas.width = dw;
        canvas.height = dh;
        ctx.clearRect(0, 0, dw, dh);
        ctx.drawImage(source, 0, 0, dw, dh);

        const imgData = ctx.getImageData(0, 0, dw, dh);
        const code = jsQR(imgData.data, dw, dh, { inversionAttempts: 'attemptBoth' });
        const raw = code && code.data ? String(code.data).trim() : '';
        return raw || '';
    } catch (_) {
        return '';
    }
}

async function __barcodeDetectWithCanvasFallback(detector, source, opts) {
    try {
        const d = detector || null;
        if (!d || !source) return '';

        const detectOnce = async (input) => {
            try {
                const res = await d.detect(input);
                return (Array.isArray(res) && res[0]) ? String((res[0].rawValue || res[0].data) || '').trim() : '';
            } catch (_) {
                return '';
            }
        };

        let raw = await detectOnce(source);
        if (raw) return raw;

        const canvas = __barcodeGetScratchCanvas();
        if (!canvas) return '';
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return '';

        const maxDim = (opts && Number(opts.maxDim)) ? Number(opts.maxDim) : 1024;

        let sw = 0;
        let sh = 0;
        try {
            if (source && typeof source.videoWidth === 'number' && typeof source.videoHeight === 'number') {
                sw = source.videoWidth;
                sh = source.videoHeight;
            } else if (source && typeof source.naturalWidth === 'number' && typeof source.naturalHeight === 'number') {
                sw = source.naturalWidth;
                sh = source.naturalHeight;
            } else if (source && typeof source.width === 'number' && typeof source.height === 'number') {
                sw = source.width;
                sh = source.height;
            }
        } catch (_) { }

        if (!sw || !sh) return '';

        let dw = sw;
        let dh = sh;
        try {
            const scale = Math.min(1, maxDim / Math.max(sw, sh));
            dw = Math.max(1, Math.round(sw * scale));
            dh = Math.max(1, Math.round(sh * scale));
        } catch (_) { }

        try {
            canvas.width = dw;
            canvas.height = dh;
            ctx.clearRect(0, 0, dw, dh);
            ctx.drawImage(source, 0, 0, dw, dh);
        } catch (_) {
            return '';
        }

        raw = await detectOnce(canvas);
        if (raw) return raw;

        try {
            const imgData = ctx.getImageData(0, 0, dw, dh);
            raw = await detectOnce(imgData);
            if (raw) return raw;
        } catch (_) { }

        return '';
    } catch (_) {
        return '';
    }
}

function __barcodeFormatDate(ts) {
    try {
        const d = new Date(Number(ts || 0));
        if (!d || isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (_) {
        return '';
    }
}

function __barcodeLooksLikeUrl(raw) {
    try {
        const s = String(raw || '').trim();
        if (!s) return false;
        if (/^(https?:\/\/)/i.test(s)) return true;
        if (/^(whatsapp:|tg:|mailto:|tel:|sms:)/i.test(s)) return true;
        if (/^www\./i.test(s)) return true;
        return false;
    } catch (_) {
        return false;
    }
}

function __barcodeNormalizeUrl(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    if (/^www\./i.test(s)) return 'https://' + s;
    return s;
}

async function __barcodeShouldUseExternalBrowser() {
    try {
        if (typeof getSetting !== 'function') return false;
        const saved = await getSetting('useExternalBrowser');
        if (saved === null || saved === undefined || saved === '') return false;
        return saved === true || saved === 'true';
    } catch (_) {
        return false;
    }
}

async function __barcodeOpenUrl(url) {
    try {
        const u = String(url || '').trim();
        if (!u) return;

        try {
            __barcodeUserWantsCamera = false;
            __barcodeStopCamera();
            __barcodeSetToggleText(false);
        } catch (_) { }

        const isDesktopApp = __barcodeIsDesktopApp();
        const useExternal = await __barcodeShouldUseExternalBrowser();

        if (isDesktopApp && useExternal && window.electronAPI && typeof window.electronAPI.openExternalUrl === 'function') {
            Promise.resolve(window.electronAPI.openExternalUrl(u)).then(() => {
                try { __barcodeHideLinkLoadingOverlay(); } catch (_) { }
                try { if (typeof showToast === 'function') showToast('تم فتح الرابط', 'success'); } catch (_) { }
            }).catch(() => {
                try { __barcodeHideLinkLoadingOverlay(); } catch (_) { }
                try { if (typeof showToast === 'function') showToast('تعذر فتح الرابط', 'error'); } catch (_) { }
            });
            return;
        }

        if (!isDesktopApp && useExternal) {
            try {
                const w = window.open(u, '_blank');
                if (w) return;
            } catch (_) { }
        }

        try {
            window.location.href = u;
        } catch (_) {
            try { window.open(u, '_self'); } catch (e) { }
        }
    } catch (_) { }
}

function __barcodeStopCamera() {
    try {
        __barcodeCameraNonce++;
        __barcodeLoopRunning = false;
        if (__barcodeResumeTimer) {
            try { clearTimeout(__barcodeResumeTimer); } catch (_) { }
            __barcodeResumeTimer = 0;
        }
        const v = document.getElementById('barcode-video');
        if (v) {
            try { v.pause(); } catch (_) { }
            try { v.srcObject = null; } catch (_) { }
            try { if (typeof v.load === 'function') v.load(); } catch (_) { }
        }
        if (__barcodeStream) {
            try {
                const tracks = __barcodeStream.getTracks ? __barcodeStream.getTracks() : [];
                (tracks || []).forEach(t => { try { t.stop(); } catch (_) { } });
            } catch (_) { }
            __barcodeStream = null;
        }

        try {
            if (!__barcodeUserWantsCamera) {
                __barcodeSetStartOverlayVisible(true);
            }
        } catch (_) { }
    } catch (_) { }
}

function __barcodeSetHint(text) {
    try {
        const el = document.getElementById('barcode-hint');
        if (!el) return;
        const t = String(text || '');
        el.textContent = t;
        try {
            el.style.display = t.trim() ? 'block' : 'none';
        } catch (_) { }
    } catch (_) { }
}

function __barcodeSetToggleText(isRunning) {
    try {
        const btn = document.getElementById('barcode-toggle-btn');
        if (!btn) return;
        btn.textContent = isRunning ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا';
        if (isRunning) {
            btn.style.background = 'rgba(239,68,68,0.22)';
            btn.style.borderColor = 'rgba(239,68,68,0.35)';
        } else {
            btn.style.background = 'rgba(14,165,233,0.9)';
            btn.style.borderColor = 'rgba(14,165,233,0.4)';
        }
    } catch (_) { }
}

function __barcodeShowResult(raw) {
    try {
        const box = document.getElementById('barcode-result');
        const text = document.getElementById('barcode-result-text');
        if (box) box.classList.remove('hidden');
        if (text) text.textContent = String(raw || '');
    } catch (_) { }
}

function __barcodeHideResult() {
    try {
        const box = document.getElementById('barcode-result');
        if (box) box.classList.add('hidden');
        const text = document.getElementById('barcode-result-text');
        if (text) text.textContent = '';
    } catch (_) { }
}

function __barcodeShowHistory() {
    try {
        const list = __barcodeReadHistory();
        const container = document.getElementById('barcode-history-list');
        const modalContainer = document.getElementById('barcode-history-modal-list');
        if (!container && !modalContainer) return;

        const safe = (s) => String(s || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

        const items = Array.isArray(list) ? list : [];
        const html = items.slice(0, 80).map((it, i) => {
            const rawValue = String(it && it.value ? it.value : '');
            const value = safe(__barcodeHistoryLabel(rawValue));
            const when = safe(__barcodeFormatDate(it && it.ts ? it.ts : 0));
            if (!value) return '';
            return `
                <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <div class="text-xs text-gray-500 mb-1">${when}</div>
                    <div class="text-sm text-gray-900 whitespace-pre-wrap break-words" style="direction:ltr;text-align:right;unicode-bidi:plaintext;">${value}</div>
                    <div class="mt-2 grid grid-cols-3 gap-2">
                        <button data-barcode-open="${i}" class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg font-bold">فتح</button>
                        <button data-barcode-copy="${i}" class="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold">نسخ</button>
                        <button data-barcode-del="${i}" class="w-full px-3 py-2 border border-red-300 text-red-700 rounded-lg font-bold">حذف</button>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');

        const emptyHtml = '<div class="text-center text-gray-600 font-bold p-4">لا يوجد سجل بعد</div>';
        const historyCard = document.getElementById('barcode-history');
        if (historyCard) historyCard.classList.remove('hidden');
        if (container) container.innerHTML = html || emptyHtml;
        if (modalContainer) modalContainer.innerHTML = html || emptyHtml;

        const bind = (rootEl) => {
            try {
                if (!rootEl) return;

                (rootEl.querySelectorAll('[data-barcode-open]') || []).forEach(btn => {
                    btn.addEventListener('click', () => {
                        try {
                            const idx = Number(btn.getAttribute('data-barcode-open'));
                            const uRaw = items[idx] && items[idx].value ? String(items[idx].value) : '';
                            if (!uRaw) return;
                            if (__barcodeLooksLikeUrl(uRaw)) {
                                const u = __barcodeNormalizeUrl(uRaw);
                                if (u) {
                                    __barcodeShowLinkLoadingOverlay('جاري فتح الرابط...');
                                    setTimeout(() => {
                                        try { __barcodeOpenUrl(u); } catch (_) { }
                                    }, 120);
                                    setTimeout(() => { try { __barcodeHideLinkLoadingOverlay(); } catch (_) { } }, 12000);
                                }
                            } else {
                                __barcodeOpenValueModal(uRaw);
                            }
                        } catch (_) { }
                    });
                });

                (rootEl.querySelectorAll('[data-barcode-copy]') || []).forEach(btn => {
                    btn.addEventListener('click', async () => {
                        try {
                            const idx = Number(btn.getAttribute('data-barcode-copy'));
                            const v = items[idx] && items[idx].value ? String(items[idx].value) : '';
                            if (!v) return;
                            __barcodeSetMobileSidebarOpen(false);
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                await navigator.clipboard.writeText(v);
                                if (typeof showToast === 'function') showToast('تم النسخ', 'success');
                            } else {
                                if (typeof showToast === 'function') showToast('النسخ غير مدعوم على هذا الجهاز', 'warning');
                            }
                        } catch (_) {
                            if (typeof showToast === 'function') showToast('تعذر النسخ', 'error');
                        }
                    });
                });

                (rootEl.querySelectorAll('[data-barcode-del]') || []).forEach(btn => {
                    btn.addEventListener('click', () => {
                        try {
                            const idx = Number(btn.getAttribute('data-barcode-del'));
                            __barcodeRemoveHistoryAt(idx);
                            __barcodeShowHistory();
                            __barcodeSetMobileSidebarOpen(false);
                            if (typeof showToast === 'function') showToast('تم الحذف', 'success');
                        } catch (_) { }
                    });
                });
            } catch (_) { }
        };

        bind(container);
        bind(modalContainer);
    } catch (_) { }
}

function __barcodeHideHistory() {
    try {
        const hist = document.getElementById('barcode-history');
        if (hist) hist.classList.add('hidden');
        const container = document.getElementById('barcode-history-list');
        if (container) container.innerHTML = '';
    } catch (_) { }
}

function __barcodeSetMobileSidebarOpen(open) {
    try {
        const shouldOpen = !!open && __barcodeIsMobileOnly();
        const sidebarCheckbox = document.getElementById('sidebar-toggle');
        if (sidebarCheckbox) sidebarCheckbox.checked = shouldOpen;

        const body = document.body;
        if (body) body.classList.toggle('barcode-history-open', shouldOpen);

        const pane = document.getElementById('barcode-history-pane');
        if (pane) {
            pane.classList.toggle('barcode-history-pane-open', shouldOpen);
            pane.style.display = 'block';
            pane.style.opacity = '1';
            pane.style.visibility = 'visible';
            pane.style.background = '#f8fafc';
            pane.style.padding = '0';
            pane.style.zIndex = shouldOpen ? '80' : '60';
            if (__barcodeIsMobileOnly()) {
                pane.style.position = 'fixed';
                pane.style.top = '48px';
                pane.style.bottom = '0';
                pane.style.width = 'min(90vw, 360px)';
                pane.style.maxWidth = '100vw';
                pane.style.right = shouldOpen ? '0' : '-105%';
                pane.style.boxShadow = shouldOpen ? '-8px 0 24px rgba(15,23,42,.18)' : 'none';
                pane.style.borderLeft = shouldOpen ? '1px solid rgba(148,163,184,.32)' : '0';
            } else {
                pane.style.position = '';
                pane.style.top = '';
                pane.style.bottom = '';
                pane.style.width = '';
                pane.style.maxWidth = '';
                pane.style.right = '';
                pane.style.boxShadow = '';
                pane.style.borderLeft = '';
            }
        }

        const hist = document.getElementById('barcode-history');
        if (hist) {
            hist.classList.remove('hidden');
            hist.style.display = 'block';
            hist.style.opacity = '1';
            hist.style.visibility = 'visible';
            hist.style.background = '#ffffff';
            hist.style.minHeight = '100%';
        }

        const videoWrap = document.getElementById('barcode-video-wrap');
        if (videoWrap) videoWrap.style.display = shouldOpen ? 'none' : '';

        const mainPane = document.getElementById('barcode-main-pane');
        if (mainPane) {
            mainPane.style.pointerEvents = shouldOpen ? 'none' : '';
            mainPane.style.visibility = shouldOpen ? 'hidden' : '';
        }
    } catch (_) { }
}

async function __barcodeScanFromFile(file) {
    let source = null;
    let objectUrl = '';
    try {
        const f = file || null;
        if (!f) return;
        const scanNonce = __barcodeCameraNonce;

        const detector = __barcodeCreateDetector();
        if (!detector && typeof jsQR !== 'function') {
            if (typeof showToast === 'function') showToast('فحص الصورة غير مدعوم على هذا الجهاز', 'error');
            return;
        }

        try {
            if (typeof createImageBitmap === 'function') {
                source = await createImageBitmap(f);
            }
        } catch (_) { source = null; }

        if (scanNonce !== __barcodeCameraNonce) {
            try { if (source && typeof source.close === 'function') source.close(); } catch (_) { }
            return;
        }

        if (!source) {
            source = await new Promise((resolve, reject) => {
                try {
                    const img = new Image();
                    let done = false;
                    const cleanup = () => {
                        if (done) return;
                        done = true;
                        try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch (_) { }
                        objectUrl = '';
                    };
                    img.onerror = () => { cleanup(); reject(new Error('load error')); };
                    objectUrl = URL.createObjectURL(f);
                    const url = objectUrl;
                    img.onload = () => {
                        cleanup();
                        resolve(img);
                    };
                    img.src = url;
                } catch (e) { reject(e); }
            });
        }

        if (scanNonce !== __barcodeCameraNonce) {
            try { if (source && typeof source.close === 'function') source.close(); } catch (_) { }
            try { if (source && typeof source.src === 'string') source.src = ''; } catch (_) { }
            return;
        }

        let raw = '';
        if (detector) {
            raw = await __barcodeDetectWithCanvasFallback(detector, source, { maxDim: 1400 });
        }
        if (!raw) {
            raw = await __barcodeDetectWithJsQR(source, { maxDim: 1400 });
        }

        if (!raw) {
            __barcodeSetHint('لم يتم العثور على باركود في الصورة');
            if (typeof showToast === 'function') showToast('لم يتم العثور على باركود في الصورة', 'warning');
            return;
        }

        try { __barcodePlayScanSound(); } catch (_) { }

        __barcodeHandleRaw(raw, { source: 'file' });
    } catch (_) {
        if (typeof showToast === 'function') showToast('تعذر فحص الصورة', 'error');
    }

    try { if (source && typeof source.close === 'function') source.close(); } catch (_) { }
    try { if (source && typeof source.src === 'string') source.src = ''; } catch (_) { }
    try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch (_) { }
}

function __barcodeHandleRaw(raw, opts) {
    try {
        const value = String(raw || '').trim();
        if (!value) return;

        const source = opts && opts.source ? String(opts.source) : '';
        const fromCamera = source === 'camera';

        if (fromCamera) {
            if (__barcodeShouldSuppress(value)) return;
            if (!__barcodeIsMobileOnly()) {
                try { __barcodePlayScanSound(); } catch (_) { }
            }
        }

        if (fromCamera && __barcodeIsMobileOnly()) {
            try { __barcodePlayScanSound(); } catch (_) { }

            __barcodeUserWantsCamera = false;
            __barcodeStopCamera();
            __barcodeSetToggleText(false);

            __barcodeAddToHistory(value);
            try { __barcodeShowHistory(); } catch (_) { }

            if (__barcodeLooksLikeUrl(value)) {
                const url = __barcodeNormalizeUrl(value);
                const site = __barcodeUrlSiteName(url);
                __barcodeShowLinkLoadingOverlay(site ? `جاري فتح ${site}...` : 'جاري فتح الرابط...');
                setTimeout(() => {
                    try { __barcodeOpenUrl(url); } catch (_) { }
                }, 120);
                setTimeout(() => { try { __barcodeHideLinkLoadingOverlay(); } catch (_) { } }, 12000);
                return;
            }

            __barcodeOpenValueModal(value);
            return;
        }

        if (fromCamera) {
            __barcodeUserWantsCamera = false;
        }

        __barcodeStopCamera();
        __barcodeSetToggleText(false);

        __barcodeAddToHistory(value);
        try { __barcodeShowHistory(); } catch (_) { }

        if (__barcodeLooksLikeUrl(value)) {
            const url = __barcodeNormalizeUrl(value);
            const site = __barcodeUrlSiteName(url);
            __barcodeShowLinkLoadingOverlay(site ? `جاري فتح ${site}...` : 'جاري فتح الرابط...');
            setTimeout(() => {
                try { __barcodeOpenUrl(url); } catch (_) { }
            }, 120);
            setTimeout(() => { try { __barcodeHideLinkLoadingOverlay(); } catch (_) { } }, 12000);
            return;
        }

        __barcodeOpenValueModal(value);
    } catch (_) { }
}

async function __barcodeStartCamera() {
    try {
        const isDesktopApp = __barcodeIsDesktopApp();

        if (__barcodeStartInFlight) return;
        __barcodeStartInFlight = true;

        __barcodeUserWantsCamera = true;
        __barcodeSetStartOverlayVisible(false);

        __barcodeHideResult();

        const v = document.getElementById('barcode-video');
        if (!v) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            __barcodeSetHint(isDesktopApp ? 'لا توجد كاميرا. يمكنك فحص صورة.' : 'الكاميرا غير مدعومة على هذا الجهاز');
            if (!isDesktopApp && typeof showToast === 'function') showToast('الكاميرا غير مدعومة على هذا الجهاز', 'error');
            return;
        }

        __barcodeStopCamera();
        const startNonce = __barcodeCameraNonce;
        __barcodeSetHint('');

        try {
            let lastErr = null;
            const tryGet = async (constraints) => {
                try {
                    return await navigator.mediaDevices.getUserMedia(constraints);
                } catch (e) {
                    lastErr = e;
                    return null;
                }
            };

            let stream = await tryGet({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            if (!stream) {
                stream = await tryGet({
                    video: {
                        facingMode: { ideal: 'environment' }
                    },
                    audio: false
                });
            }

            if (!stream) {
                stream = await tryGet({ video: true, audio: false });
            }

            if (!stream && isDesktopApp) {
                try { await new Promise(r => setTimeout(r, 420)); } catch (_) { }
                stream = await tryGet({ video: true, audio: false });
            }

            if (!stream) {
                throw lastErr || new Error('getUserMedia failed');
            }

            if (startNonce !== __barcodeCameraNonce || !__barcodeUserWantsCamera) {
                try {
                    const tracks = stream.getTracks ? stream.getTracks() : [];
                    (tracks || []).forEach(t => { try { t.stop(); } catch (_) { } });
                } catch (_) { }
                return;
            }

            __barcodeStream = stream;
        } catch (e) {
            __barcodeStopCamera();
            __barcodeSetToggleText(false);
            __barcodeSetHint(isDesktopApp ? 'تعذر فتح الكاميرا. يمكنك فحص صورة.' : 'تعذر فتح الكاميرا');
            if (!isDesktopApp && typeof showToast === 'function') showToast('تعذر فتح الكاميرا', 'error');
            if (isDesktopApp) {
                __barcodeUserWantsCamera = false;
                __barcodeSetStartOverlayVisible(true);
            } else {
                __barcodeUserWantsCamera = false;
                __barcodeSetStartOverlayVisible(true);
            }
            return;
        }

        if (startNonce !== __barcodeCameraNonce || !__barcodeUserWantsCamera) {
            __barcodeStopCamera();
            return;
        }

        v.srcObject = __barcodeStream;
        try { await v.play(); } catch (_) { }

        if (startNonce !== __barcodeCameraNonce || !__barcodeUserWantsCamera) {
            __barcodeStopCamera();
            return;
        }

        const detector = __barcodeCreateDetector();
        if (!detector && typeof jsQR !== 'function') {
            __barcodeSetHint('قراءة الباركود غير مدعومة على هذا الجهاز');
            if (!isDesktopApp && typeof showToast === 'function') showToast('قراءة الباركود غير مدعومة على هذا الجهاز', 'error');
            return;
        }
        __barcodeLoopRunning = true;
        __barcodeSetToggleText(true);

        let __detectInFlight = false;
        let __lastCanvasTry = 0;
        let __lastJsqrTry = 0;

        const loop = async () => {
            if (!__barcodeLoopRunning) return;
            if (__detectInFlight) {
                try { requestAnimationFrame(loop); } catch (_) { setTimeout(loop, 80); }
                return;
            }
            __detectInFlight = true;
            try {
                let raw = '';
                if (detector) {
                    try {
                        const barcodes = await detector.detect(v);
                        raw = (Array.isArray(barcodes) && barcodes[0]) ? String((barcodes[0].rawValue || barcodes[0].data) || '').trim() : '';
                    } catch (_) { raw = ''; }
                }

                if (!raw) {
                    const now = Date.now();
                    if (now - __lastCanvasTry > 220) {
                        __lastCanvasTry = now;
                        if (detector) raw = await __barcodeDetectWithCanvasFallback(detector, v, { maxDim: 1280 });
                    }
                }

                if (!raw) {
                    const now = Date.now();
                    if (now - __lastJsqrTry > 260) {
                        __lastJsqrTry = now;
                        raw = await __barcodeDetectWithJsQR(v, { maxDim: 1280 });
                    }
                }

                if (raw) __barcodeHandleRaw(raw, { source: 'camera' });
            } catch (_) { }
            finally { __detectInFlight = false; }
            try { requestAnimationFrame(loop); } catch (_) { setTimeout(loop, 250); }
        };

        loop();
    } catch (_) {
        __barcodeStopCamera();
        __barcodeSetToggleText(false);
        __barcodeSetHint('تعذر فتح الكاميرا');
        try {
            const isDesktopApp = (function () {
                try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
            })();
            if (!isDesktopApp && typeof showToast === 'function') showToast('تعذر فتح الكاميرا', 'error');
        } catch (_) { }
    } finally {
        __barcodeStartInFlight = false;
    }
}

function __barcodeToggleCamera() {
    try {
        if (__barcodeLoopRunning) {
            __barcodeUserWantsCamera = false;
            __barcodeStopCamera();
            __barcodeSetToggleText(false);
            __barcodeSetHint('تم إيقاف الكاميرا');
        } else {
            __barcodeUserWantsCamera = true;
            __barcodeStartCamera();
        }
    } catch (_) { }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        try {
            const isDesktopApp = __barcodeIsDesktopApp();
            if (isDesktopApp) {
                const b = document.body;
                if (b && b.classList) b.classList.add('barcode-desktop');
            } else {
                const b = document.body;
                if (b && b.classList) b.classList.add('barcode-mobile');
            }
        } catch (_) { }

        try {
            __barcodeUserWantsCamera = false;
            __barcodeSetStartOverlayVisible(true);
            try { __barcodeSetHint(''); } catch (_) { }
        } catch (_) { }

        try {
            document.addEventListener('pointerdown', __barcodeTryUnlockAudioOnce, { once: true, passive: true });
            document.addEventListener('keydown', __barcodeTryUnlockAudioOnce, { once: true, passive: true });
        } catch (_) { }

        try {
            const tc = document.getElementById('toast-container');
            if (tc) {
                const isMobile = !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
                tc.style.position = 'fixed';
                tc.style.top = isMobile ? '60px' : '20px';
                tc.style.left = '50%';
                tc.style.right = 'auto';
                tc.style.bottom = 'auto';
                tc.style.transform = 'translateX(-50%)';
                tc.style.maxWidth = '92vw';
                tc.style.width = 'min(92vw, 420px)';
                tc.style.display = 'flex';
                tc.style.flexDirection = 'column';
                tc.style.alignItems = 'center';
                tc.style.gap = '10px';
                tc.style.zIndex = '999999';
            }
        } catch (_) { }

        const backBtn = document.getElementById('back-to-main');
        if (backBtn) backBtn.addEventListener('click', () => {
            try { __barcodeStopCamera(); } catch (_) { }
            try { __barcodeUserWantsCamera = false; } catch (_) { }
            window.location.href = 'index.html';
        });

        const imageBtn = document.getElementById('barcode-image-btn');
        const fileInput = document.getElementById('barcode-file-input');
        if (imageBtn && fileInput) {
            imageBtn.addEventListener('click', () => {
                try {
                    try { fileInput.value = ''; } catch (_) { }
                    fileInput.click();
                } catch (_) { }
            });
            fileInput.addEventListener('change', async () => {
                try {
                    const f = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
                    fileInput.value = '';
                    if (f) await __barcodeScanFromFile(f);
                } catch (_) { }
            });
        }

        try {
            const pickBtn = document.getElementById('barcode-desktop-pick-btn');
            if (pickBtn && fileInput) pickBtn.addEventListener('click', () => {
                try {
                    try { fileInput.value = ''; } catch (_) { }
                    fileInput.click();
                } catch (_) { }
            });
        } catch (_) { }

        const copyBtn = document.getElementById('barcode-copy-btn');
        if (copyBtn) copyBtn.addEventListener('click', async () => {
            try {
                const t = document.getElementById('barcode-result-text');
                const value = t ? String(t.textContent || '') : '';
                if (!value) return;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(value);
                    if (typeof showToast === 'function') showToast('تم النسخ', 'success');
                } else {
                    if (typeof showToast === 'function') showToast('النسخ غير مدعوم على هذا الجهاز', 'warning');
                }
            } catch (_) {
                if (typeof showToast === 'function') showToast('تعذر النسخ', 'error');
            }
        });

        const resumeBtn = document.getElementById('barcode-resume-btn');
        if (resumeBtn) resumeBtn.addEventListener('click', () => {
            try { __barcodeHideResult(); } catch (_) { }
            try { __barcodeStartCamera(); } catch (_) { }
        });

        try {
            const startBtn = document.getElementById('barcode-desktop-start-btn');
            if (startBtn) startBtn.addEventListener('click', () => {
                try {
                    __barcodeUserWantsCamera = true;
                    __barcodeSetStartOverlayVisible(false);
                    __barcodeStartCamera();
                } catch (_) { }
            });
        } catch (_) { }

        try {
            const histBtn = document.getElementById('barcode-history-btn');
            if (histBtn) histBtn.addEventListener('click', () => {
                try {
                    if (__barcodeIsMobileOnly()) {
                        const sidebarCheckbox = document.getElementById('sidebar-toggle');
                        const nextOpen = !(sidebarCheckbox && sidebarCheckbox.checked);
                        if (nextOpen) {
                            __barcodeUserWantsCamera = false;
                            __barcodeStopCamera();
                            __barcodeSetToggleText(false);
                            __barcodeSetMobileSidebarOpen(true);
                            __barcodeShowHistory();
                        } else {
                            __barcodeSetMobileSidebarOpen(false);
                        }
                        return;
                    }
                    if (__barcodeIsDesktopApp()) return;

                    try {
                        __barcodeUserWantsCamera = false;
                        __barcodeStopCamera();
                        __barcodeSetToggleText(false);
                    } catch (_) { }

                    const root = __barcodeEnsureHistoryModal();
                    if (!root) return;
                    root.style.display = 'flex';
                    try { __barcodeShowHistory(); } catch (_) { }
                } catch (_) { }
            });
        } catch (_) { }

        try {
            const mobileSidebarToggle = document.querySelector('.mobile-sidebar-toggle');
            if (mobileSidebarToggle) {
                mobileSidebarToggle.addEventListener('click', (event) => {
                    try {
                        if (!__barcodeIsMobileOnly()) return;
                        event.preventDefault();
                        const sidebarCheckbox = document.getElementById('sidebar-toggle');
                        const nextOpen = !(sidebarCheckbox && sidebarCheckbox.checked);
                        if (nextOpen) {
                            __barcodeUserWantsCamera = false;
                            __barcodeStopCamera();
                            __barcodeSetToggleText(false);
                            __barcodeSetMobileSidebarOpen(true);
                            __barcodeShowHistory();
                        } else {
                            __barcodeSetMobileSidebarOpen(false);
                        }
                    } catch (_) { }
                });
            }
        } catch (_) { }

        try {
            const sidebarCheckbox = document.getElementById('sidebar-toggle');
            if (sidebarCheckbox) {
                sidebarCheckbox.addEventListener('change', () => {
                    try {
                        if (!__barcodeIsMobileOnly()) return;
                        __barcodeSetMobileSidebarOpen(!!sidebarCheckbox.checked);
                        if (!sidebarCheckbox.checked) return;
                        __barcodeUserWantsCamera = false;
                        __barcodeStopCamera();
                        __barcodeSetToggleText(false);
                        __barcodeShowHistory();
                    } catch (_) { }
                });
            }
        } catch (_) { }

        try {
            if (typeof window.initLawyerCardFeature === 'function') {
                window.initLawyerCardFeature();
            }
        } catch (_) { }

        __barcodeSetToggleText(false);
        try { __barcodeShowHistory(); } catch (_) { }
        if (__barcodeIsMobileOnly()) {
            __barcodeUserWantsCamera = false;
            __barcodeSetStartOverlayVisible(true);
        }
    } catch (_) { }
});

window.addEventListener('beforeunload', () => {
    try { __barcodeStopCamera(); } catch (_) { }
});

window.addEventListener('unload', () => {
    try { __barcodeStopCamera(); } catch (_) { }
});

window.addEventListener('pagehide', () => {
    try { __barcodeStopCamera(); } catch (_) { }
});

document.addEventListener('visibilitychange', () => {
    try {
        if (document.hidden) {
            try { __barcodeStopCamera(); } catch (_) { }
            return;
        }
        __barcodeScheduleEnsureCameraActive(320);
    } catch (_) { }
});

window.addEventListener('blur', () => {
    try {
        if (__barcodeIsMobileOnly()) {
            __barcodeStopCamera();
        }
    } catch (_) { }
});

window.addEventListener('focus', () => {
    try {
        __barcodeScheduleEnsureCameraActive(280);
    } catch (_) { }
});
