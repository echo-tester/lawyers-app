(function () {
    const LAWYER_CARD_KEYS = {
        officeName: 'officeName',
        phone: 'lawyerPhone',
        site: 'lawyerWebsite',
        address: 'lawyerAddress',
        registrationType: 'lawyerRegistrationType'
    };

    const lawyerCardState = {
        initialized: false,
        root: null,
        isOpen: false,
        currentData: null,
        qrReady: false
    };

    function lawyerCardIsElectron() {
        try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
    }

    function lawyerCardById(id) {
        return document.getElementById(id);
    }

    function lawyerCardText(value) {
        return String(value || '').trim();
    }

    // "site" is treated as free text (no normalization / assumptions).

    async function lawyerCardLoadData() {
        try {
            const values = await Promise.all([
                typeof getSetting === 'function' ? getSetting(LAWYER_CARD_KEYS.officeName) : '',
                typeof getSetting === 'function' ? getSetting(LAWYER_CARD_KEYS.phone) : '',
                typeof getSetting === 'function' ? getSetting(LAWYER_CARD_KEYS.site) : '',
                typeof getSetting === 'function' ? getSetting(LAWYER_CARD_KEYS.address) : '',
                typeof getSetting === 'function' ? getSetting(LAWYER_CARD_KEYS.registrationType) : ''
            ]);

            return {
                name: lawyerCardText(values[0]),
                phone: lawyerCardText(values[1]),
                site: lawyerCardText(values[2]),
                address: lawyerCardText(values[3]),
                registrationType: lawyerCardText(values[4])
            };
        } catch (_) {
            return {
                name: '',
                phone: '',
                site: '',
                address: '',
                registrationType: ''
            };
        }
    }

    function lawyerCardEscapeVCardValue(value) {
        return lawyerCardQrSafeText(value)
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    }

    function lawyerCardBuildVCard(data) {
        const name = lawyerCardEscapeVCardValue(data.name);
        const phone = lawyerCardEscapeVCardValue(data.phone);
        const address = lawyerCardEscapeVCardValue(data.address);
        const registrationType = lawyerCardEscapeVCardValue(data.registrationType);
        const siteText = lawyerCardEscapeVCardValue(data.site);

        const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
        if (name) lines.push('FN:' + name);
        if (phone) lines.push('TEL:' + phone);
        if (siteText) lines.push('NOTE:' + siteText);
        if (address) lines.push('ADR:;;' + address + ';;;;');
        if (registrationType) lines.push('TITLE:' + registrationType);
        lines.push('END:VCARD');

        return lines.join('\r\n');
    }

    function lawyerCardBuildPayload(data) {
        const name = lawyerCardQrSafeText(data.name);
        const phone = lawyerCardQrSafeText(data.phone);
        const site = lawyerCardQrSafeText(data.site);
        const address = lawyerCardQrSafeText(data.address);
        const registrationType = lawyerCardQrSafeText(data.registrationType);
        const rtl = '\u200F';
        const fields = [];
        if (name) fields.push(rtl + 'الاسم: ' + name);
        if (phone) fields.push(rtl + 'الهاتف: ' + phone);
        if (site) fields.push(rtl + 'الموقع: ' + site);
        if (address) fields.push(rtl + 'العنوان: ' + address);
        if (registrationType) fields.push(rtl + 'الصفة: ' + registrationType);
        return fields.join('\n');
    }

    function lawyerCardQrSafeText(value) {
        try {
            return String(value || '')
                .replace(/[\u0000-\u001F\u007F]+/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim();
        } catch (_) {
            return lawyerCardText(value);
        }
    }

    async function lawyerCardWaitForQrNode(qrBox, maxMs = 900) {
        const started = Date.now();
        while (Date.now() - started < maxMs) {
            const produced = qrBox.querySelector('canvas') || qrBox.querySelector('img') || qrBox.querySelector('table');
            if (produced) return true;
            await new Promise(resolve => setTimeout(resolve, 35));
        }
        return false;
    }

    function lawyerCardSetActionsVisible(hasData) {
        const previewWrap = lawyerCardById('lawyer-card-preview-wrap');
        const frame = lawyerCardById('lawyer-card-qr-frame');
        const downloadBtn = lawyerCardById('lawyer-card-download-btn');
        const regenerateBtn = lawyerCardById('lawyer-card-regenerate-btn');
        const actions = lawyerCardById('lawyer-card-actions');

        if (previewWrap) previewWrap.style.display = hasData ? 'block' : 'none';
        if (frame) frame.style.display = hasData ? 'flex' : 'none';
        if (downloadBtn) downloadBtn.style.display = hasData ? 'flex' : 'none';
        if (regenerateBtn) regenerateBtn.style.display = hasData ? 'flex' : 'none';
        if (actions) actions.style.gridTemplateColumns = hasData ? 'repeat(2,minmax(0,1fr))' : '1fr';
    }

    function lawyerCardSetEmptyStateVisible(visible) {
        const wrap = lawyerCardById('lawyer-card-empty-state');
        if (!wrap) return;
        wrap.style.display = visible ? 'block' : 'none';
    }

    function lawyerCardGetQrDataUrl() {
        const qrBox = lawyerCardById('lawyer-card-qr-box');
        if (!qrBox) return '';

        const img = qrBox.querySelector('img');
        if (img && img.src) return String(img.src);

        const canvas = qrBox.querySelector('canvas');
        if (canvas && typeof canvas.toDataURL === 'function') {
            try {
                return canvas.toDataURL('image/png');
            } catch (_) {
                return '';
            }
        }

        return '';
    }

    function lawyerCardToast(message, type = 'success', durationMs = 3000) {
        try {
            if (typeof showToast === 'function') showToast(message, type, durationMs, 'top-center');
        } catch (_) { }
    }

    function lawyerCardDownloadQr() {
        const dataUrl = lawyerCardGetQrDataUrl();
        if (!dataUrl) return;

        try {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'lawyer-card-qr.png';
            document.body.appendChild(link);
            link.click();
            link.remove();
            lawyerCardToast('تم تحميل صورة الباركود', 'success');
        } catch (_) {
            lawyerCardToast('تعذر تحميل الصورة', 'error');
        }
    }

    function lawyerCardApplyButtonState(button, palette, active) {
        if (!button || !palette) return;
        if (button.disabled) {
            button.style.opacity = '0.65';
            button.style.background = palette.baseBg;
            button.style.borderColor = palette.baseBorder || 'transparent';
            button.style.color = palette.baseColor;
            return;
        }

        button.style.opacity = '1';
        button.style.background = active ? palette.hoverBg : palette.baseBg;
        button.style.borderColor = active ? (palette.hoverBorder || palette.baseBorder || 'transparent') : (palette.baseBorder || 'transparent');
        button.style.color = active ? (palette.hoverColor || palette.baseColor) : palette.baseColor;
    }

    function lawyerCardBindButtonEffects(button, palette) {
        if (!button || !palette || button.dataset.lawyerCardFxBound === '1') return;
        button.dataset.lawyerCardFxBound = '1';
        button.style.borderStyle = 'solid';
        button.style.borderWidth = palette.baseBorder ? '1px' : '0';
        button.style.outline = 'none';
        button.style.webkitTapHighlightColor = 'transparent';
        lawyerCardApplyButtonState(button, palette, false);

        ['mouseenter', 'focus', 'touchstart', 'pointerdown'].forEach((eventName) => {
            button.addEventListener(eventName, () => lawyerCardApplyButtonState(button, palette, true), { passive: true });
        });

        ['mouseleave', 'blur', 'touchend', 'touchcancel', 'pointerup', 'pointercancel'].forEach((eventName) => {
            button.addEventListener(eventName, () => lawyerCardApplyButtonState(button, palette, false), { passive: true });
        });
    }

    function lawyerCardEnsureButtonEffects() {
        lawyerCardBindButtonEffects(lawyerCardById('lawyer-card-close-btn'), {
            baseBg: '#ffffff',
            baseBorder: 'rgba(148,163,184,.22)',
            baseColor: '#0f172a',
            hoverBg: '#e2e8f0',
            hoverBorder: 'rgba(148,163,184,.5)',
            hoverColor: '#020617'
        });
        lawyerCardBindButtonEffects(lawyerCardById('lawyer-card-download-btn'), {
            baseBg: '#1d4ed8',
            baseBorder: 'rgba(29,78,216,.15)',
            baseColor: '#ffffff',
            hoverBg: '#1e40af',
            hoverBorder: 'rgba(30,64,175,.2)',
            hoverColor: '#ffffff'
        });
        lawyerCardBindButtonEffects(lawyerCardById('lawyer-card-regenerate-btn'), {
            baseBg: '#0f172a',
            baseBorder: 'rgba(15,23,42,.12)',
            baseColor: '#ffffff',
            hoverBg: '#1e293b',
            hoverBorder: 'rgba(30,41,59,.2)',
            hoverColor: '#ffffff'
        });
    }

    function lawyerCardEnsureRoot() {
        if (lawyerCardState.root) return lawyerCardState.root;

        const _isElectron = lawyerCardIsElectron();
        const root = document.createElement('div');
        root.id = 'lawyer-card-modal';
        root.style.cssText = (_isElectron ? 'position:absolute;' : 'position:fixed;') + 'inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(15,23,42,.28);';
        root.innerHTML = `
            <div id="lawyer-card-dialog" style="width:min(420px,100%);max-height:${_isElectron ? 'calc(100% - 28px)' : 'min(92vh,760px)'};overflow:auto;background:#ffffff;border-radius:24px;border:1px solid rgba(148,163,184,.18);box-shadow:0 6px 16px rgba(15,23,42,.08);padding:18px;position:relative;">
                <button id="lawyer-card-close-btn" type="button" aria-label="إغلاق" style="position:absolute;top:14px;right:14px;width:42px;height:42px;border:1px solid rgba(148,163,184,.22);border-radius:14px;background:#ffffff;color:#0f172a;font-size:24px;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:pointer;">×</button>
                <div style="text-align:center;padding:8px 40px 0;">
                    <div style="font-size:24px;font-weight:900;color:#0f172a;">كارت المحامى</div>
                </div>
                <div id="lawyer-card-preview-wrap" style="display:none;margin-top:18px;background:#ffffff;border:1px solid rgba(148,163,184,.16);border-radius:20px;padding:16px;text-align:center;">
                    <div id="lawyer-card-qr-frame" style="margin:0 auto;width:min(240px,100%);aspect-ratio:1/1;border-radius:18px;background:#ffffff;border:1px solid rgba(148,163,184,.25);display:none;align-items:center;justify-content:center;padding:10px;overflow:hidden;">
                        <div id="lawyer-card-qr-box" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"></div>
                    </div>
                    <div id="lawyer-card-actions" style="margin-top:12px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
                        <button id="lawyer-card-download-btn" type="button" style="display:none;height:48px;border:none;border-radius:16px;background:#1d4ed8;color:#ffffff;font-size:14px;font-weight:900;cursor:pointer;align-items:center;justify-content:center;gap:8px;">
                            <i class="ri-download-2-line"></i>
                            <span>تحميل</span>
                        </button>
                        <button id="lawyer-card-regenerate-btn" type="button" style="display:none;height:48px;border:none;border-radius:16px;background:#0f172a;color:#ffffff;font-size:14px;font-weight:900;cursor:pointer;align-items:center;justify-content:center;gap:8px;">
                            <i class="ri-refresh-line"></i>
                            <span>إعادة توليد</span>
                        </button>
                    </div>
                </div>
                <div id="lawyer-card-empty-state" style="display:none;margin-top:18px;background:#f8fafc;border:1px solid rgba(148,163,184,.18);border-radius:20px;padding:18px;text-align:center;">
                    <div style="width:62px;height:62px;margin:0 auto 12px;border-radius:18px;background:#e2e8f0;color:#0f172a;display:flex;align-items:center;justify-content:center;font-size:28px;">
                        <i class="ri-building-line"></i>
                    </div>
                    <div style="font-size:17px;font-weight:900;color:#0f172a;">مفيش بيانات محفوظة للكارت</div>
                    <div style="margin-top:8px;font-size:13px;line-height:1.9;color:#475569;">الباركود بيتولد من أي بيانات متاحة، لكن حالياً مفيش أي بيانات مكتب محفوظة.</div>
                </div>
            </div>
        `;

        if (_isElectron) {
            const container = document.getElementById('barcode-camera-card');
            if (container) {
                container.style.position = 'relative';
                container.appendChild(root);
            } else {
                root.style.position = 'fixed';
                document.body.appendChild(root);
            }
        } else {
            document.body.appendChild(root);
        }
        lawyerCardState.root = root;

        let _backdropPointerDownOnRoot = false;
        root.addEventListener('pointerdown', (event) => {
            _backdropPointerDownOnRoot = event.target === root;
        });
        root.addEventListener('click', (event) => {
            if (event.target === root && _backdropPointerDownOnRoot) {
                const focused = document.activeElement;
                const isInputFocused = focused && (
                    focused.tagName === 'INPUT' ||
                    focused.tagName === 'TEXTAREA' ||
                    focused.tagName === 'SELECT'
                );
                if (!isInputFocused) lawyerCardClose();
            }
            _backdropPointerDownOnRoot = false;
        });

        const dialog = lawyerCardById('lawyer-card-dialog');
        if (dialog) {
            dialog.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }

        const closeBtn = lawyerCardById('lawyer-card-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', lawyerCardClose);

        const regenerateBtn = lawyerCardById('lawyer-card-regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', async () => {
                try {
                    const data = await lawyerCardLoadData();
                    const rendered = await lawyerCardRender(data);
                    if (!rendered) {
                        lawyerCardSetEmptyStateVisible(true);
                        lawyerCardToast('تعذر إعادة توليد الباركود', 'warning', 4200);
                    }
                } catch (_) {
                    lawyerCardToast('تعذر إعادة التوليد', 'error');
                }
            });
        }

        const downloadBtn = lawyerCardById('lawyer-card-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', lawyerCardDownloadQr);
        }

        lawyerCardEnsureButtonEffects();
        return root;
    }

    async function lawyerCardRender(data) {
        const qrBox = lawyerCardById('lawyer-card-qr-box');
        if (!qrBox) return false;

        lawyerCardState.currentData = {
            name: lawyerCardText(data.name),
            phone: lawyerCardText(data.phone),
            site: lawyerCardText(data.site),
            address: lawyerCardText(data.address),
            registrationType: lawyerCardText(data.registrationType)
        };
        lawyerCardState.qrReady = false;

        qrBox.innerHTML = '';

        if (!lawyerCardState.currentData.name && !lawyerCardState.currentData.phone && !lawyerCardState.currentData.site && !lawyerCardState.currentData.address && !lawyerCardState.currentData.registrationType) {
            lawyerCardSetActionsVisible(false);
            return false;
        }

        if (typeof QRCode !== 'function') {
            lawyerCardSetActionsVisible(false);
            lawyerCardToast('تعذر تحميل مولد QR', 'error');
            return false;
        }

        lawyerCardSetActionsVisible(true);

        await new Promise(resolve => setTimeout(resolve, 60));

        qrBox.style.width = '220px';
        qrBox.style.height = '220px';

        const d = lawyerCardState.currentData;
        const plainPayload = lawyerCardBuildPayload(d);
        const vcardPayload = lawyerCardBuildVCard(d);
        const payloads = [plainPayload, vcardPayload].filter(Boolean);

        for (const payload of payloads) {
            if (!payload) continue;
            try {
                qrBox.innerHTML = '';
                new QRCode(qrBox, {
                    text: payload,
                    width: 220,
                    height: 220,
                    colorDark: '#111827',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
                const produced = await lawyerCardWaitForQrNode(qrBox, 1000);
                if (!produced) { qrBox.innerHTML = ''; continue; }
                lawyerCardState.qrReady = true;
                return true;
            } catch (_) {
                qrBox.innerHTML = '';
            }
        }

        lawyerCardSetActionsVisible(false);
        return false;
    }

    async function lawyerCardOpen() {
        const root = lawyerCardEnsureRoot();
        if (!root) return;

        const data = await lawyerCardLoadData();
        const hasAnyData = !!lawyerCardText(data.name) || !!lawyerCardText(data.phone) || !!lawyerCardText(data.site) || !!lawyerCardText(data.address) || !!lawyerCardText(data.registrationType);

        root.style.display = 'flex';
        lawyerCardState.isOpen = true;
        lawyerCardSetEmptyStateVisible(false);

        if (hasAnyData) {
            const rendered = await lawyerCardRender(data);
            if (!rendered) {
                lawyerCardSetEmptyStateVisible(true);
                lawyerCardToast('البيانات موجودة لكن الباركود محتاج بيانات أبسط أو أقل', 'warning', 4200);
            }
        } else {
            lawyerCardSetActionsVisible(false);
            lawyerCardSetEmptyStateVisible(true);
        }
    }

    function lawyerCardClose() {
        const root = lawyerCardEnsureRoot();
        if (!root) return;
        root.style.display = 'none';
        lawyerCardState.isOpen = false;
    }

    function lawyerCardHandleKeydown(event) {
        if (event.key === 'Escape' && lawyerCardState.isOpen) {
            lawyerCardClose();
        }
    }

    function initLawyerCardFeature() {
        if (lawyerCardState.initialized) return;
        lawyerCardState.initialized = true;

        lawyerCardEnsureRoot();

        ['barcode-lawyer-card-btn', 'barcode-lawyer-card-desktop-btn'].forEach((id) => {
            const trigger = lawyerCardById(id);
            if (!trigger) return;
            trigger.addEventListener('click', () => {
                lawyerCardOpen();
            });
        });

        document.addEventListener('keydown', lawyerCardHandleKeydown);
    }

    window.initLawyerCardFeature = initLawyerCardFeature;
})();
