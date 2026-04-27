let __qrScanStream = null;
let __qrScanLoopRunning = false;

const __QR_HISTORY_KEY = 'qr_opened_links_history_v1';

function __qrReadHistory() {
    try {
        const raw = localStorage.getItem(__QR_HISTORY_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
}

function __qrWriteHistory(arr) {
    try {
        localStorage.setItem(__QR_HISTORY_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
    } catch (_) { }
}

function __qrAddToHistory(url) {
    try {
        const u = String(url || '').trim();
        if (!u) return;
        const now = Date.now();
        const list = __qrReadHistory();
        const filtered = (list || []).filter(x => x && String(x.url || '').trim() && String(x.url || '').trim() !== u);
        filtered.unshift({ url: u, ts: now });
        __qrWriteHistory(filtered.slice(0, 80));
    } catch (_) { }
}

function __qrFormatDate(ts) {
    try {
        const d = new Date(Number(ts || 0));
        if (!d || isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (_) {
        return '';
    }
}

function __qrShowHistory() {
    try {
        const list = __qrReadHistory();
        if (typeof openModalWithView === 'function') {
            openModalWithView(() => {
                const modalTitle = document.getElementById('modal-title');
                const modalContent = document.getElementById('modal-content');
                if (modalTitle) modalTitle.textContent = 'تاريخ الروابط';
                if (!modalContent) return;

                const safe = (s) => String(s || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
                const rows = (Array.isArray(list) ? list : []).slice(0, 80).map((it, i) => {
                    const url = safe(it && it.url ? it.url : '');
                    const when = safe(__qrFormatDate(it && it.ts ? it.ts : 0));
                    if (!url) return '';
                    return `
                        <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                            <div class="text-xs text-gray-500 mb-1">${when}</div>
                            <div class="text-sm text-gray-900 whitespace-pre-wrap break-words" style="direction:ltr;text-align:right;unicode-bidi:plaintext;">${url}</div>
                            <div class="mt-2 flex gap-2">
                                <button data-qr-open="${i}" class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-bold">فتح</button>
                                <button data-qr-copy="${i}" class="px-3 py-2 border border-gray-300 rounded-lg font-bold">نسخ</button>
                            </div>
                        </div>
                    `;
                }).filter(Boolean).join('');

                modalContent.innerHTML = `
                    <div class="max-w-full mx-auto p-3">
                        <div class="space-y-2">
                            ${rows || '<div class="text-center text-gray-600 font-bold p-4">لا يوجد روابط</div>'}
                        </div>
                    </div>
                `;

                const items = Array.isArray(list) ? list : [];
                (modalContent.querySelectorAll('[data-qr-open]') || []).forEach(btn => {
                    btn.addEventListener('click', () => {
                        try {
                            const idx = Number(btn.getAttribute('data-qr-open'));
                            const u = items[idx] && items[idx].url ? String(items[idx].url) : '';
                            if (u) {
                                __showLinkLoadingOverlay('جاري فتح الرابط...');
                                setTimeout(() => {
                                    try { window.location.href = u; } catch (_) { try { window.open(u, '_self'); } catch (e) { } }
                                }, 120);
                                setTimeout(() => { try { __hideLinkLoadingOverlay(); } catch (_) { } }, 12000);
                            }
                        } catch (_) { }
                    });
                });

                (modalContent.querySelectorAll('[data-qr-copy]') || []).forEach(btn => {
                    btn.addEventListener('click', async () => {
                        try {
                            const idx = Number(btn.getAttribute('data-qr-copy'));
                            const u = items[idx] && items[idx].url ? String(items[idx].url) : '';
                            if (!u) return;
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                await navigator.clipboard.writeText(u);
                                if (typeof showToast === 'function') showToast('تم النسخ', 'success');
                            } else {
                                if (typeof showToast === 'function') showToast('النسخ غير مدعوم على هذا الجهاز', 'warning');
                            }
                        } catch (_) {
                            if (typeof showToast === 'function') showToast('تعذر النسخ', 'error');
                        }
                    });
                });
            });
        } else {
            const lines = (Array.isArray(list) ? list : []).slice(0, 20).map(x => `${__qrFormatDate(x && x.ts)}\n${String(x && x.url || '')}`).join('\n\n');
            alert(lines || 'لا يوجد روابط');
        }
    } catch (_) { }
}

function __showLinkLoadingOverlay(message) {
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

            const barWrap = document.createElement('div');
            barWrap.style.cssText = 'width:100%;height:10px;border-radius:9999px;background:#e5e7eb;overflow:hidden;border:1px solid rgba(15,23,42,.10);';

            const bar = document.createElement('div');
            bar.id = 'link-loading-bar';
            bar.style.cssText = 'height:100%;width:40%;background:linear-gradient(90deg,#38bdf8,#6366f1);border-radius:9999px;animation:linkBar 1.0s ease-in-out infinite;';
            barWrap.appendChild(bar);

            const hint = document.createElement('div');
            hint.id = 'link-loading-hint';
            hint.textContent = '';
            hint.style.cssText = 'margin-top:10px;font-size:13px;color:#334155;font-weight:800;';

            if (!document.querySelector('style[data-link-loading-style="1"]')) {
                const style = document.createElement('style');
                style.setAttribute('data-link-loading-style', '1');
                style.textContent = [
                    '@keyframes linkBar{',
                    '0%{transform:translateX(-30%);opacity:.85}',
                    '50%{transform:translateX(80%);opacity:1}',
                    '100%{transform:translateX(-30%);opacity:.85}',
                    '}'
                ].join('');
                (document.head || document.documentElement).appendChild(style);
            }

            box.appendChild(title);
            box.appendChild(barWrap);
            box.appendChild(hint);
            el.appendChild(box);
            (document.body || document.documentElement).appendChild(el);
        }

        const t = document.getElementById('link-loading-title');
        if (t) t.textContent = message || 'جاري الفتح...';
        el.style.display = 'flex';
    } catch (_) { }
}

function __hideLinkLoadingOverlay() {
    try {
        const el = document.getElementById('link-loading-overlay');
        if (!el) return;
        el.style.display = 'none';
    } catch (_) { }
}

function __stopQrScanner() {
    try {
        __qrScanLoopRunning = false;
        const v = document.getElementById('qr-scan-video');
        if (v) {
            try { v.pause(); } catch (_) { }
            try { v.srcObject = null; } catch (_) { }
        }
        if (__qrScanStream) {
            try {
                const tracks = __qrScanStream.getTracks ? __qrScanStream.getTracks() : [];
                (tracks || []).forEach(t => { try { t.stop(); } catch (_) { } });
            } catch (_) { }
            __qrScanStream = null;
        }
    } catch (_) { }
}

function __hideQrScannerUI() {
    try {
        const el = document.getElementById('qr-scan-overlay');
        if (!el) return;
        try { el.style.display = 'none'; } catch (_) { }
        __stopQrScanner();
    } catch (_) { }
}

async function __qrScanFromFile(file) {
    try {
        const f = file || null;
        if (!f) return;
        if (typeof BarcodeDetector === 'undefined') {
            if (typeof showToast === 'function') showToast('فحص الصورة غير مدعوم على هذا الجهاز', 'error');
            return;
        }

        __showLinkLoadingOverlay('جاري فحص الصورة...');
        const detector = new BarcodeDetector({ formats: ['qr_code'] });

        let source = null;
        try {
            if (typeof createImageBitmap === 'function') {
                source = await createImageBitmap(f);
            }
        } catch (_) { source = null; }

        if (!source) {
            source = await new Promise((resolve, reject) => {
                try {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('load error'));
                    const url = URL.createObjectURL(f);
                    img.src = url;
                    img.onload = () => {
                        try { URL.revokeObjectURL(url); } catch (_) { }
                        resolve(img);
                    };
                } catch (e) { reject(e); }
            });
        }

        const barcodes = await detector.detect(source);
        const raw = (Array.isArray(barcodes) && barcodes[0]) ? String((barcodes[0].rawValue || barcodes[0].data) || '').trim() : '';
        __hideLinkLoadingOverlay();

        if (!raw) {
            try {
                const hint = document.getElementById('qr-scan-hint');
                if (hint) hint.textContent = 'لم يتم العثور على باركود في الصورة';
            } catch (_) { }
            if (typeof showToast === 'function') showToast('لم يتم العثور على باركود في الصورة', 'warning');
            return;
        }

        __hideQrScannerUI();
        if (__looksLikeUrl(raw)) {
            const url = __normalizeUrl(raw);
            __qrAddToHistory(url);
            __showLinkLoadingOverlay('جاري فتح الرابط...');
            setTimeout(() => {
                try { window.location.href = url; } catch (_) { try { window.open(url, '_self'); } catch (e) { } }
            }, 120);
            setTimeout(() => { try { __hideLinkLoadingOverlay(); } catch (_) { } }, 12000);
        } else {
            __showQrRawValue(raw);
        }
    } catch (_) {
        try { __hideLinkLoadingOverlay(); } catch (e) { }
        if (typeof showToast === 'function') showToast('تعذر فحص الصورة', 'error');
    }
}

function __ensureQrScannerUI() {
    try {
        if (document.getElementById('qr-scan-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'qr-scan-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(2,6,23,0.92);display:none;flex-direction:column;direction:rtl;';

        const body = document.createElement('div');
        body.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;gap:10px;';

        const frame = document.createElement('div');
        frame.style.cssText = 'width:min(720px, 100%);height:min(72vh, 520px);border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.14);background:#000;position:relative;';

        const video = document.createElement('video');
        video.id = 'qr-scan-video';
        video.setAttribute('playsinline', '');
        video.muted = true;
        video.autoplay = true;
        video.style.cssText = 'width:100%;height:100%;object-fit:cover;';

        const hint = document.createElement('div');
        hint.id = 'qr-scan-hint';
        hint.textContent = 'وجّه الكاميرا ناحية الباركود';
        hint.style.cssText = 'position:absolute;left:12px;right:12px;bottom:12px;background:rgba(15,23,42,0.55);color:#fff;padding:10px 12px;border-radius:14px;text-align:center;font-weight:800;font-size:13px;border:1px solid rgba(255,255,255,0.12);';

        frame.appendChild(video);
        frame.appendChild(hint);
        body.appendChild(frame);


        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'width:min(720px, 100%);display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;';

        const historyBtn = document.createElement('button');
        historyBtn.type = 'button';
        historyBtn.textContent = 'تاريخ الروابط';
        historyBtn.style.cssText = 'padding:12px 10px;border-radius:14px;background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.16);font-weight:900;';
        historyBtn.addEventListener('click', () => { try { __qrShowHistory(); } catch (_) { } });

        const attachBtn = document.createElement('button');
        attachBtn.type = 'button';
        attachBtn.textContent = 'فحص من صورة';
        attachBtn.style.cssText = 'padding:12px 10px;border-radius:14px;background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.16);font-weight:900;';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = 'إغلاق';
        closeBtn.style.cssText = 'padding:12px 10px;border-radius:14px;background:rgba(239,68,68,0.22);color:#fff;border:1px solid rgba(239,68,68,0.35);font-weight:900;';
        closeBtn.addEventListener('click', () => __hideQrScannerUI());

        toolbar.appendChild(historyBtn);
        toolbar.appendChild(attachBtn);
        toolbar.appendChild(closeBtn);


        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.id = 'qr-scan-file-input';
        fileInput.style.cssText = 'display:none;';
        fileInput.addEventListener('change', async () => {
            try {
                const f = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
                fileInput.value = '';
                if (f) await __qrScanFromFile(f);
            } catch (_) { }
        });
        attachBtn.addEventListener('click', () => {
            try {
                if (typeof BarcodeDetector === 'undefined') {
                    if (typeof showToast === 'function') showToast('فحص الصورة غير مدعوم على هذا الجهاز', 'error');
                    return;
                }
                fileInput.click();
            } catch (_) { }
        });


        body.appendChild(toolbar);
        body.appendChild(fileInput);

        overlay.appendChild(body);
        (document.body || document.documentElement).appendChild(overlay);

        window.addEventListener('keydown', (e) => {
            try {
                if (e && e.key === 'Escape') {
                    const el = document.getElementById('qr-scan-overlay');
                    if (el && String(el.style.display || '') !== 'none') __hideQrScannerUI();
                }
            } catch (_) { }
        });
    } catch (_) { }
}

function __looksLikeUrl(raw) {
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

function __normalizeUrl(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    if (/^www\./i.test(s)) return 'https://' + s;
    return s;
}

function __showQrRawValue(raw) {
    try {
        const value = String(raw || '').trim();
        if (!value) return;

        if (typeof openModalWithView === 'function') {
            openModalWithView(() => {
                const modalTitle = document.getElementById('modal-title');
                const modalContent = document.getElementById('modal-content');
                if (modalTitle) modalTitle.textContent = 'محتوى الباركود';
                if (!modalContent) return;
                const safe = value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
                modalContent.innerHTML = `
                    <div class="max-w-full mx-auto p-3">
                        <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                            <div class="text-sm text-gray-900 whitespace-pre-wrap break-words" style="direction:ltr;text-align:left;">${safe}</div>
                            <div class="mt-3 flex gap-2">
                                <button id="qr-copy-btn" class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold">نسخ</button>
                            </div>
                        </div>
                    </div>
                `;
                const btn = document.getElementById('qr-copy-btn');
                if (btn) {
                    btn.addEventListener('click', async () => {
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
                }
            });
        } else {
            alert(value);
        }
    } catch (_) { }
}

async function openQrScanner() {
    try {
        __ensureQrScannerUI();
        const overlay = document.getElementById('qr-scan-overlay');
        const video = document.getElementById('qr-scan-video');
        const hint = document.getElementById('qr-scan-hint');
        if (!(overlay && video)) return;

        try { overlay.style.display = 'flex'; } catch (_) { }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (hint) hint.textContent = 'الكاميرا غير مدعومة على هذا الجهاز';
            if (typeof showToast === 'function') showToast('الكاميرا غير مدعومة على هذا الجهاز', 'error');
            try { __hideQrScannerUI(); } catch (_) { }
            return;
        }
        if (typeof BarcodeDetector === 'undefined') {
            if (hint) hint.textContent = 'قراءة الباركود غير مدعومة على هذا الجهاز';
            if (typeof showToast === 'function') showToast('قراءة الباركود غير مدعومة على هذا الجهاز', 'error');
            try { __hideQrScannerUI(); } catch (_) { }
            return;
        }

        __stopQrScanner();
        __qrScanStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
        });

        video.srcObject = __qrScanStream;
        try { await video.play(); } catch (_) { }

        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        __qrScanLoopRunning = true;

        const loop = async () => {
            if (!__qrScanLoopRunning) return;
            try {
                const barcodes = await detector.detect(video);
                if (Array.isArray(barcodes) && barcodes.length > 0) {
                    const raw = String((barcodes[0] && (barcodes[0].rawValue || barcodes[0].data)) || '').trim();
                    if (raw) {
                        __hideQrScannerUI();
                        if (__looksLikeUrl(raw)) {
                            const url = __normalizeUrl(raw);
                            try {
                                __qrAddToHistory(url);
                                __showLinkLoadingOverlay('جاري فتح الرابط...');
                                setTimeout(() => {
                                    try { window.location.href = url; } catch (_) { try { window.open(url, '_self'); } catch (e) { } }
                                }, 120);
                                setTimeout(() => { try { __hideLinkLoadingOverlay(); } catch (_) { } }, 12000);
                            } catch (_) {
                                try { window.location.href = url; } catch (_) { window.open(url, '_self'); }
                            }
                        } else {
                            __showQrRawValue(raw);
                        }
                        return;
                    }
                }
            } catch (_) { }
            try { requestAnimationFrame(loop); } catch (_) { setTimeout(loop, 250); }
        };

        loop();
    } catch (e) {
        try { __stopQrScanner(); } catch (_) { }
        try {
            const hint = document.getElementById('qr-scan-hint');
            if (hint) hint.textContent = 'تعذر فتح الكاميرا';
        } catch (_) { }
        try { if (typeof showToast === 'function') showToast('تعذر فتح الكاميرا', 'error'); } catch (_) { }
    }
}
