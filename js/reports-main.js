/**
 * مشاركة تقرير PDF عبر واتساب أو التطبيقات (متوافق مع الجوال والكمبيوتر).
 */
/* قائمة التصدير: أوضح على الهاتف — أزرار أكبر ومنظمة */
(function injectExportMenuStyles() {
    if (document.getElementById('reports-export-menu-styles')) return;
    var style = document.createElement('style');
    style.id = 'reports-export-menu-styles';
    style.textContent = [
        '@media (max-width: 640px) {',
        '  [id^="export-menu-"].reports-export-dropdown { min-width: 240px !important; width: max-content; max-width: calc(100vw - 24px); border-radius: 12px; overflow: hidden; }',
        '  [id^="export-menu-"].reports-export-dropdown button { padding: 14px 16px !important; min-height: 52px !important; font-size: 1rem !important; font-weight: 500; display: flex !important; align-items: center; justify-content: flex-end; gap: 10px; }',
        '  [id^="export-menu-"].reports-export-dropdown button .ri-whatsapp-line, [id^="export-menu-"].reports-export-dropdown button .ri-file-pdf-line, [id^="export-menu-"].reports-export-dropdown button .ri-file-excel-line { font-size: 1.25rem !important; }',
        '}',
        '@keyframes reports-loading-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'
    ].join('\n');
    document.head.appendChild(style);
})();

// -------------------------------------------------------------
// نافذة تحميل موحدة وأنيقة لجميع التقارير (Universal Loading Overlay)
// -------------------------------------------------------------
function showReportsLoadingOverlay(message) {
    try {
        // التأكد من وجود كود التحريك دائماً
        if (!document.getElementById('reports-loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'reports-loading-spinner-style';
            style.textContent = `
                @keyframes reports-loading-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @-webkit-keyframes reports-loading-spin {
                    0% { -webkit-transform: rotate(0deg); }
                    100% { -webkit-transform: rotate(360deg); }
                }
                .reports-loading-circle-spinner,
                html.low-power #reports-loading-overlay .reports-loading-circle-spinner,
                body.low-power #reports-loading-overlay .reports-loading-circle-spinner,
                #reports-loading-overlay .reports-loading-circle-spinner {
                    width: 46px;
                    height: 46px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #2563eb;
                    border-right: 4px solid #0d9488;
                    border-radius: 50%;
                    display: inline-block;
                    box-sizing: border-box;
                    animation: reports-loading-spin 0.8s linear infinite !important;
                    -webkit-animation: reports-loading-spin 0.8s linear infinite !important;
                    will-change: transform;
                    margin: 0 auto 14px;
                }
            `;
            document.head.appendChild(style);
        }

        let overlay = document.getElementById('reports-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'reports-loading-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.45)';
            overlay.style.backdropFilter = 'blur(4px)';
            overlay.style.webkitBackdropFilter = 'blur(4px)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '99999999';
            overlay.style.direction = 'rtl';
            overlay.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

            overlay.innerHTML = `
                <div style="background: #ffffff; border-radius: 20px; padding: 24px 28px; width: 300px; max-width: 90vw; text-align: center; box-shadow: 0 25px 40px -10px rgba(0, 0, 0, 0.3); border: 1px solid #e2e8f0;">
                    <div class="reports-loading-circle-spinner"></div>
                    <div id="reports-loading-overlay-text" style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 6px;">جاري إعداد التقرير...</div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.4;">يرجى الانتظار لحظات لتنسيق الصفحات بدقة</div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        const textEl = document.getElementById('reports-loading-overlay-text');
        if (textEl && message) {
            textEl.textContent = message;
        }
        overlay.style.display = 'flex';
    } catch (_) { }
}

function hideReportsLoadingOverlay() {
    try {
        const overlay = document.getElementById('reports-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    } catch (_) { }
}

// ربط تلقائي ذكي مع إشعارات التصدير في كل التقارير بدون الحاجة لتعديل أي ملف آخر
(function setupAutoReportsLoadingBridge() {
    if (typeof window === 'undefined') return;
    const origShowToast = window.showToast;
    if (typeof origShowToast !== 'function') return;

    window.showToast = function (message, type = 'success', durationMs = 3000, position) {
        try {
            const msg = String(message || '');
            if (msg.includes('جاري إنشاء') || msg.includes('جاري إعداد') || msg.includes('جاري تجهيز')) {
                showReportsLoadingOverlay(msg);
            } else if (type === 'success' || type === 'error' || msg.includes('تم تصدير') || msg.includes('تم تحميل') || msg.includes('حدث خطأ')) {
                hideReportsLoadingOverlay();
            }
        } catch (_) { }
        return origShowToast.apply(this, arguments);
    };
})();

function isElectronApp() {
    return typeof window !== 'undefined' && (window.electronAPI || (window.process && window.process.type === 'renderer') || /electron/i.test(navigator.userAgent || ''));
}

// -------------------------------------------------------------
// إدارة التنسيقات الداخلية المخبأة لمنع استهلاك الإنترنت أثناء تصدير التقارير
// -------------------------------------------------------------
let __inlinedReportsCssBundle = '';
let __preloadCssPromise = null;

function __preloadReportsCss() {
    if (__inlinedReportsCssBundle) return Promise.resolve(__inlinedReportsCssBundle);
    if (__preloadCssPromise) return __preloadCssPromise;

    __preloadCssPromise = (async () => {
        try {
            // جلب ملفات التنسيق محلياً (يتم جلبها فورياً من كاش المتصفح عبر ServiceWorker بدون استهلاك باقة)
            const files = ['css/tailwind.min.css', 'css/style.css', 'css/search-responsive.css'];
            const contents = await Promise.all(
                files.map(url => fetch(url).then(res => res.ok ? res.text() : '').catch(() => ''))
            );
            const joined = contents.filter(Boolean).join('\n');
            if (joined) {
                __inlinedReportsCssBundle = joined;
                return joined;
            }
        } catch (_) { }

        // خطة بديلة فورية متزامنة: قراءة القواعد الجاهزة من الـ CSSOM في ذاكرة المتصفح
        try {
            if (typeof document !== 'undefined' && document.styleSheets) {
                let text = '';
                for (let i = 0; i < document.styleSheets.length; i++) {
                    const sheet = document.styleSheets[i];
                    const href = String(sheet.href || '');
                    if (href.includes('remixicon')) continue; // استبعاد خطوط الأيقونات لمنع أي طلبات شبكة
                    try {
                        const rules = sheet.cssRules || sheet.rules;
                        if (rules) {
                            for (let j = 0; j < rules.length; j++) {
                                text += rules[j].cssText + '\n';
                            }
                        }
                    } catch (_) { }
                }
                if (text) {
                    __inlinedReportsCssBundle = text;
                    return text;
                }
            }
        } catch (_) { }

        return __inlinedReportsCssBundle || '';
    })();

    return __preloadCssPromise;
}

// بدء التجهيز المسبق فوراً في الخلفية بمجرد تحميل الصفحة
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', __preloadReportsCss);
    } else {
        __preloadReportsCss();
    }
}

// -------------------------------------------------------------
// ضبط تلقائي ومركزي لمكتبة html2pdf على الهاتف فقط (لكل التقارير)
// يمنع استهلاك الإنترنت تماماً ويحافظ على سلامة جميع الأعمدة والتنسيقات 100%
// -------------------------------------------------------------
(function setupAutoMobilePdfExportBridge() {
    if (typeof window === 'undefined' || typeof window.html2pdf !== 'function') return;
    const origHtml2Pdf = window.html2pdf;

    function applyOptimizedOptions(opt) {
        if (!opt || typeof opt !== 'object') return;
        opt.html2canvas = opt.html2canvas || {};

        const isMobile = typeof isElectronApp === 'function' ? !isElectronApp() : true;
        if (isMobile && !opt.html2canvas.windowWidth) {
            opt.html2canvas.windowWidth = 1200;
        }

        // إذا كان التطبيق على الهاتف/المتصفح: نمنع استهلاك الإنترنت مع ضمان التنسيقات الكاملة
        if (isMobile) {
            if (opt.html2canvas.__inlinedOptimized) return;
            opt.html2canvas.__inlinedOptimized = true;

            // 1. منع استنساخ وسوم link لتفادي أي طلبات شبكة HTTP داخل الـ iframe
            const prevIgnore = opt.html2canvas.ignoreElements;
            opt.html2canvas.ignoreElements = function (el) {
                if (el && el.tagName === 'LINK') return true;
                if (typeof prevIgnore === 'function') return prevIgnore(el);
                return false;
            };

            // 2. حقن حزمة التنسيق الكاملة مسبقة التجهيز داخل الـ iframe كـ <style> مدمج
            const prevOnClone = opt.html2canvas.onclone;
            opt.html2canvas.onclone = async function (clonedDoc) {
                if (clonedDoc) {
                    try {
                        const links = clonedDoc.querySelectorAll('link[rel="stylesheet"], link');
                        links.forEach(l => l.remove());

                        const cssText = await __preloadReportsCss();
                        if (cssText && !clonedDoc.getElementById('html2pdf-inlined-bundle')) {
                            const styleEl = clonedDoc.createElement('style');
                            styleEl.id = 'html2pdf-inlined-bundle';
                            styleEl.textContent = cssText;
                            const targetHead = clonedDoc.head || clonedDoc.documentElement;
                            if (targetHead) {
                                targetHead.appendChild(styleEl);
                            }
                        }
                    } catch (_) { }
                }
                if (typeof prevOnClone === 'function') {
                    return prevOnClone(clonedDoc);
                }
            };
        }
    }

    window.html2pdf = function (source, options) {
        if (options && typeof options === 'object') {
            applyOptimizedOptions(options);
        }

        const worker = origHtml2Pdf.apply(this, arguments);

        if (worker && typeof worker.set === 'function') {
            const origSet = worker.set;
            worker.set = function (opt) {
                applyOptimizedOptions(opt);
                return origSet.apply(this, arguments);
            };
        }

        return worker;
    };

    // الحفاظ على الخصائص الثابتة للمكتبة إن وُجدت
    try {
        Object.assign(window.html2pdf, origHtml2Pdf);
    } catch (_) { }
})();

// إخفاء أزرار الطباعة في شريط أدوات التقارير إذا لم يكن التطبيق إلكترون (على الهاتف فقط)
(function setupMobileReportsPrintVisibility() {
    if (typeof window === 'undefined') return;
    const isMobile = typeof isElectronApp === 'function' ? !isElectronApp() : true;
    if (!isMobile) return;

    if (document.getElementById('mobile-reports-hide-print-styles')) return;
    const style = document.createElement('style');
    style.id = 'mobile-reports-hide-print-styles';
    style.textContent = `
        /* إخفاء أزرار الطباعة في شريط أدوات التقارير على الهاتف فقط */
        .reports-page button[onclick*="print"],
        .reports-page #print-current-report-btn {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
})();

/** جلب اسم المكتب الحالي من الإعدادات (يُستدعى عند كل تصدير/طباعة لضمان الاسم المحدث). إذا لم يوجد يُرجع "المحامى الرقمى". */
async function getReportsOfficeName() {
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('officeName');
            const s = (v != null ? String(v) : '').trim();
            if (s) return s;
        }
    } catch (e) { }
    try {
        const v = localStorage.getItem('officeName');
        const s = (v != null ? String(v) : '').trim();
        if (s) return s;
    } catch (e) { }
    return 'المحامى الرقمى';
}

async function shareReportPdfAsFile(blob, filename) {
    hideReportsLoadingOverlay();
    if (!blob || !(blob instanceof Blob)) {
        if (typeof showToast === 'function') showToast('لا يوجد ملف للمشاركة', 'error');
        return;
    }
    const cleanFilename = (filename || 'report.pdf').replace(/[\/\\?%*:|"<>]/g, '_');
    const file = new File([blob], cleanFilename, { type: 'application/pdf', lastModified: Date.now() });
    const show = typeof showToast === 'function' ? showToast : function () { };

    const fallbackDownload = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = cleanFilename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        show('تم تحميل التقرير. يمكنك إرفاقه ومشاركته في واتساب.', 'info');
    };

    // التحقق من دعم مشاركة الملفات
    const canShareFiles = (typeof navigator !== 'undefined' && navigator.share && typeof navigator.canShare === 'function')
        ? navigator.canShare({ files: [file] })
        : (typeof navigator !== 'undefined' && !!navigator.share);

    if (canShareFiles) {
        try {
            // محاولة فتح المشاركة فوراً بعد اكتمال التوليد مباشرة
            await navigator.share({
                title: cleanFilename,
                text: 'تقرير المحامى الرقمى',
                files: [file]
            });
            show('تم فتح المشاركة بنجاح', 'success');
            return;
        } catch (err) {
            console.warn('Direct share attempt failed:', err);
            if (err && err.name === 'AbortError') return;

            // إذا اعترض أندرويد بسبب انقضاء وقت اللمسة أثناء التوليد (NotAllowedError)
            // نعرض زراً فورياً بلمسة واحدة طازجة لفتح نافذة المشاركة فوراً
            __showDirectShareButton(file, blob, cleanFilename);
            return;
        }
    }

    fallbackDownload();
}

function __showDirectShareButton(file, blob, filename) {
    const oldPrompt = document.getElementById('direct-share-prompt-overlay');
    if (oldPrompt) oldPrompt.remove();

    const overlay = document.createElement('div');
    overlay.id = 'direct-share-prompt-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999999';
    overlay.style.direction = 'rtl';
    overlay.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

    overlay.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 20px; max-width: 90vw; width: 340px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
            <div style="width: 56px; height: 56px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 28px;">
                📲
            </div>
            <div style="font-weight: bold; font-size: 16px; color: #1e293b; margin-bottom: 6px;">تم تجهيز التقرير بنجاح</div>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 18px;">اضغط أدناه لفتح المشاركة في واتساب:</div>
            
            <button id="direct-share-trigger-btn" type="button" style="width: 100%; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);">
                <span>مشاركة عبر واتساب الآن</span>
            </button>

            <button id="direct-share-cancel-btn" type="button" style="width: 100%; padding: 8px; background: transparent; color: #64748b; border: none; font-size: 13px; cursor: pointer;">
                إلغاء
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    const triggerBtn = document.getElementById('direct-share-trigger-btn');
    const cancelBtn = document.getElementById('direct-share-cancel-btn');

    if (triggerBtn) {
        triggerBtn.onclick = async () => {
            overlay.remove();
            try {
                if (typeof navigator !== 'undefined' && navigator.share) {
                    await navigator.share({
                        title: filename,
                        text: 'تقرير المحامى الرقمى',
                        files: [file]
                    });
                }
            } catch (err) {
                if (err && err.name === 'AbortError') return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => overlay.remove();
    }
}

function displayReportsModal() {
    __reportsHistory = [];
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalContainer = document.getElementById('modal-container');

    if (modalContainer) {
        modalContainer.style.maxWidth = '100%';
        modalContainer.style.width = '100%';
        modalContainer.style.margin = '0';
        modalContainer.style.height = '100vh';
    }
    if (modalContent) {
        modalContent.style.padding = '0';
        modalContent.style.margin = '0';
        modalContent.style.width = '100%';
        modalContent.style.maxWidth = '100%';
        try { modalContent.classList.remove('search-modal-content'); } catch (_) { }
    }

    modalTitle.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                <i class="ri-pie-chart-line text-white text-xl"></i>
            </div>
            <span class="text-2xl font-bold text-gray-800">التقارير</span>
        </div>
    `;

    try {
        const headerEl = document.querySelector('header');
        const headerHRaw = headerEl ? Math.max(0, Math.round(headerEl.getBoundingClientRect().height || 0)) : 0;
        const headerH = headerHRaw || 48;
        try { document.documentElement.style.setProperty('--reports-header-h', headerH + 'px'); } catch (_) { }

        const mainEl = document.querySelector('main');
        if (mainEl) {
            try { mainEl.style.setProperty('padding-top', '0px', 'important'); } catch (_) { }
            try { mainEl.style.setProperty('margin-top', headerH + 'px', 'important'); } catch (_) { }

            try {
                const top = mainEl.getBoundingClientRect().top;
                const vh = window.innerHeight;
                const h = Math.max(240, vh - top);
                mainEl.style.height = h + 'px';
                mainEl.style.maxHeight = h + 'px';
            } catch (_) { }

            mainEl.style.overflowY = 'hidden';
        }

        try {
            const shell = document.querySelector('main > div > div.bg-white');
            if (shell) {
                shell.style.paddingTop = '0px';
                shell.style.paddingBottom = '0px';
            }
        } catch (_) { }

        try {
            if (modalContainer) {
                modalContainer.style.paddingTop = '0px';
                modalContainer.style.paddingBottom = '0px';
            }
        } catch (_) { }

        try {
            document.body.style.overflowY = 'hidden';
            document.documentElement.style.overflowY = 'hidden';
        } catch (_) { }
    } catch (_) { }

    modalContent.innerHTML = `
        <div class="flex h-full min-h-0 gap-0 search-layout">
            <!-- الشريط الجانبي للأزرار -->
            <div id="reports-sidebar" class="w-64 bg-gray-50 border-l border-gray-200 p-3 overflow-y-auto search-left-pane search-left-pane-dark" data-left-pane="reports">
                                
                <!-- لون موحد لجميع الأقسام (لون قسم القضايا) -->
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="client-comprehensive">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-file-user-line text-xl"></i>
                        <span class="text-base font-bold">تقارير الموكلين</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="clients-files">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-folder-user-line text-xl"></i>
                        <span class="text-base font-bold">تقارير التوكيلات</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="sessions">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-calendar-event-line text-xl"></i>
                        <span class="text-base font-bold">تقارير القضايا</span>
                    </div>
                </button>

                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="sessions-agenda">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-calendar-check-line text-xl"></i>
                        <span class="text-base font-bold">تقارير الجلسات</span>
                    </div>
                </button>
            
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="accounts">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-wallet-3-line text-xl"></i>
                        <span class="text-base font-bold">تقارير الحسابات</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="administrative">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-briefcase-line text-xl"></i>
                        <span class="text-base font-bold">تقارير المهام</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="clerk-papers">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-file-paper-line text-xl"></i>
                        <span class="text-base font-bold">تقارير المحضرين</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="expert-sessions">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-team-line text-xl"></i>
                        <span class="text-base font-bold">تقارير الخبراء</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="archive">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-folder-history-line text-xl"></i>
                        <span class="text-base font-bold">تقارير المؤرشف</span>
                    </div>
                </button>
            </div>
            
            <!-- منطقة المحتوى الرئيسي -->
            <div class="flex-1 min-h-0 p-2 md:p-3" id="report-content">
                <div class="flex items-center justify-center h-full">
                    <div class="text-center text-gray-500">
                        <i class="ri-file-chart-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">مرحباً بك في التقارير</h3>
                        <p class="text-gray-400">اختر نوع التقرير المطلوب من القائمة الجانبية</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const reportType = this.dataset.report;
            
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            handleReportClick(reportType);
        });
    });

    // فتح قسم الموكلين افتراضياً في التأثير التالي حتى لا يؤثر على سرعة ظهور النافذة
    setTimeout(function () {
        try {
            handleReportClick('client-comprehensive');
        } catch (_) { }
    }, 0);

    const reportContent = document.getElementById('report-content');
    if (reportContent && !reportContent.dataset.reportRecordSelectBound) {
        reportContent.addEventListener('click', (e) => {
            const rec = e.target.closest('.report-record');
            if (!rec || !reportContent.contains(rec)) return;
            reportContent.querySelectorAll('.report-record.report-record-selected')
                .forEach(el => el.classList.remove('report-record-selected'));
            rec.classList.add('report-record-selected');
        });
        reportContent.dataset.reportRecordSelectBound = '1';
    }

    
    try {
        requestAnimationFrame(() => {
            try { applyReportsSidebarThemeAndHover(); } catch (_) { }
            setupReportsScrollBox();
            setupReportsHoverScrollBehavior();
        });
        window.addEventListener('resize', setupReportsScrollBox);
    } catch (e) {
        console.error(e);
    }
}


let __reportsHistory = [];
let __isNavigatingReportsHistory = false;

window.__reportsNavigateBack = function () {
    try {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle && sidebarToggle.checked) {
            sidebarToggle.checked = false;
            return true;
        }
        if (__reportsHistory.length > 1) {
            __reportsHistory.pop();
            const prevReport = __reportsHistory[__reportsHistory.length - 1];
            __isNavigatingReportsHistory = true;
            handleReportClick(prevReport);
            __isNavigatingReportsHistory = false;
            return true;
        }
    } catch (_) { }
    return false;
};

function handleReportClick(reportType) {
    if (!__isNavigatingReportsHistory) {
        if (__reportsHistory.length === 0 || __reportsHistory[__reportsHistory.length - 1] !== reportType) {
            __reportsHistory.push(reportType);
        }
    }
    const reportNames = {
        'client-comprehensive': 'تقارير الموكلين',
        'clients-files': 'تقارير التوكيلات',
        'sessions': 'تقارير القضايا',
        'sessions-agenda': 'تقارير الجلسات',
        'archive': 'تقارير المؤرشف',
        'accounts': 'تقارير الحسابات',
        'administrative': 'تقارير المهام',
        'clerk-papers': 'تقارير المحضرين',
        'expert-sessions': 'تقارير الخبراء'
    };

    const reportName = reportNames[reportType] || 'تقرير غير معروف';

    
    if (reportType === 'client-comprehensive') {
        updateClientComprehensiveReportContent(reportName, reportType);
    } else if (reportType === 'clients-files') {
        updateClientsFilesReportContent(reportName, reportType);
    } else if (reportType === 'sessions') {
        updateSessionsReportContent(reportName, reportType);
    } else if (reportType === 'sessions-agenda') {
        updateSessionsAgendaReportContent(reportName, reportType);
    } else if (reportType === 'archive') {
        updateArchiveReportContent(reportName, reportType);
    } else if (reportType === 'accounts') {
        updateAccountsReportContent(reportName, reportType);
    } else if (reportType === 'administrative') {
        updateAdministrativeReportContent(reportName, reportType);
    } else if (reportType === 'clerk-papers') {
        updateClerkPapersReportContent(reportName, reportType);
    } else if (reportType === 'expert-sessions') {
        updateExpertSessionsReportContent(reportName, reportType);
    } else {
        updateReportContent(reportName, reportType);
    }

    
    updateButtonStates(reportType);
}


function updateButtonStates(activeReportType) {
    
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-white', 'ring-opacity-50', 'report-selected');
        btn.style.transform = 'scale(1)';
    });

    
    const activeButton = document.querySelector(`[data-report="${activeReportType}"]`);
    if (activeButton) {
        activeButton.classList.add('report-selected');
        activeButton.style.transform = 'scale(1)';
    }
}


function setupReportsScrollBox() {
    try {
        const rightWrapper = document.getElementById('report-content');
        if (!rightWrapper) return;

        const viewportH = window.innerHeight;
        const wrapperTop = rightWrapper.getBoundingClientRect().top;
        const targetH = Math.max(240, viewportH - wrapperTop - 12);

        rightWrapper.style.maxHeight = targetH + 'px';
        rightWrapper.style.height = targetH + 'px';
        rightWrapper.style.overflowY = 'auto';
        rightWrapper.style.overscrollBehavior = 'contain';

        const leftPane = document.getElementById('reports-sidebar');
        if (leftPane) {
            const leftTop = leftPane.getBoundingClientRect().top;
            const leftH = Math.max(240, viewportH - leftTop - 12);
            leftPane.style.maxHeight = leftH + 'px';
            leftPane.style.height = leftH + 'px';
            leftPane.style.minHeight = '0px';
            leftPane.style.overflowY = 'auto';
            leftPane.style.overflowX = 'hidden';
            leftPane.style.overscrollBehavior = 'contain';
        }
    } catch (e) { }
}


function setupReportsHoverScrollBehavior() {
    const leftPane = document.getElementById('reports-sidebar');
    const rightContent = document.getElementById('report-content');
    const mainEl = document.querySelector('main');
    if (!leftPane || !rightContent || !mainEl) return;

    try { mainEl.style.overflowY = 'hidden'; } catch (_) { }
    try {
        document.body.style.overflowY = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
    } catch (_) { }
    try {
        leftPane.style.overscrollBehavior = 'contain';
        rightContent.style.overscrollBehavior = 'contain';
    } catch (_) { }
}

function applyReportsSidebarThemeAndHover() {
    const sidebar = document.getElementById('reports-sidebar');
    const rightContent = document.getElementById('report-content');
    if (sidebar) {
        try { sidebar.classList.add('search-left-pane-dark'); } catch (_) { }
        try { sidebar.style.background = '#111827'; } catch (_) { }
        try { sidebar.style.borderLeft = '2px solid rgba(14, 165, 233, .45)'; } catch (_) { }
        try { sidebar.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
        try {
            sidebar.style.borderBottomLeftRadius = '16px';
            sidebar.style.borderBottomRightRadius = '16px';
        } catch (_) { }
    }

    if (rightContent) {
        try {
            rightContent.style.setProperty('background', '#ffffff', 'important');
            rightContent.style.setProperty('border', '2px solid rgba(14, 165, 233, .45)', 'important');
            rightContent.style.setProperty('border-radius', '14px', 'important');
            rightContent.style.setProperty('box-shadow', '0 10px 22px rgba(15, 23, 42, 0.12)', 'important');
        } catch (_) { }
    }

    const buttons = document.querySelectorAll('.report-btn');
    buttons.forEach((btn) => {
        if (!btn || (btn.dataset && btn.dataset.hoverStyled === '1')) return;
        if (btn.dataset) btn.dataset.hoverStyled = '1';

        const setImp = (node, prop, value) => {
            try { node.style.setProperty(prop, value, 'important'); } catch (_) { }
        };
        const clearImp = (node, prop) => {
            try { node.style.removeProperty(prop); } catch (_) { }
        };

        const base = () => {
            setImp(btn, 'border', '1px solid rgba(255,255,255,0.10)');
            setImp(btn, 'transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease');
            clearImp(btn, 'transform');
            clearImp(btn, 'box-shadow');
            clearImp(btn, 'border-color');
            try { btn.classList.remove('ring-2', 'ring-yellow-400'); } catch (_) { }
        };

        const hover = () => {
            setImp(btn, 'border-color', 'rgba(245, 158, 11, .90)');
            setImp(btn, 'transform', 'translateY(-2px) scale(1.01)');
            setImp(btn, 'box-shadow', '0 14px 26px rgba(245, 158, 11, .14), 0 10px 18px rgba(15, 23, 42, .20)');
        };

        base();
        btn.addEventListener('mouseenter', hover);
        btn.addEventListener('mouseleave', base);
        btn.addEventListener('mousedown', () => { try { setImp(btn, 'transform', 'translateY(-1px)'); } catch (_) { } });
        btn.addEventListener('mouseup', hover);
        btn.addEventListener('blur', base);
    });
}
