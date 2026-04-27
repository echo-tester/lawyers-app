
const menuItemsDesktop = [
    { id: 'new', label: 'قضية جديدة', icon: 'person_add', color: 'blue', description: 'إضافة قضية جديدة' },
    { id: 'search', label: 'قضايا الموكلين', icon: 'search', color: 'indigo', description: 'البحث في القضايا' },

    { id: 'sessions', label: 'الجلسات', icon: 'event', color: 'teal', description: 'إدارة الجلسات' },
    { id: 'administrative', label: 'المهام', icon: 'assignment', color: 'amber', description: 'المهام الإدارية' },
    { id: 'clerk-papers', label: 'المحضرين', icon: 'description', color: 'sky', description: 'أوراق المحضرين' },
    { id: 'accounts', label: 'الحسابات', icon: 'account_balance', color: 'rose', description: 'إدارة الحسابات' },

    { id: 'expert-sessions', label: 'الخبراء', icon: 'groups', color: 'orange', description: 'جلسات الخبراء' },
    { id: 'services', label: 'الخدمات', icon: 'public', color: 'fuchsia', description: 'الخدمات الالكترونية' },
    { id: 'legal-library', label: 'المكتبة', icon: 'local_library', color: 'lime', description: 'المراجع القانونية' },
    { id: 'reports', label: 'التقارير', icon: 'bar_chart', color: 'slate', description: 'تقارير شاملة' },

    { id: 'open-clients-folder', label: 'المجلدات', icon: 'folder_shared', color: 'cyan', description: 'عرض مجلدات موكليك' }
];


const menuItemsMobile = menuItemsDesktop.slice();

try {
    const isDesktopApp = (function () {
        try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
    })();
    if (!isDesktopApp) {
        const qrItem = {
            id: 'qr-scan',
            label: 'الباركود',
            icon: 'qr_code_scanner',
            color: 'cyan',
            description: 'فتح رابط الباركود'
        };

        const idx = menuItemsMobile.findIndex(x => x && x.id === 'open-clients-folder');
        const alreadyQrIndex = menuItemsMobile.findIndex(x => x && x.id === 'qr-scan');

        if (alreadyQrIndex !== -1) {
            menuItemsMobile.splice(alreadyQrIndex, 1);
        }
        if (idx !== -1) {
            menuItemsMobile.splice(idx, 1, qrItem);
        } else {
            menuItemsMobile.push(qrItem);
        }
    } else {
        const qrItemDesktop = {
            id: 'qr-scan',
            label: 'الباركود',
            icon: 'qr_code_scanner',
            color: 'cyan',
            description: 'مسح الباركود'
        };

        const applyReplace = (arr) => {
            try {
                const a = Array.isArray(arr) ? arr : [];
                const idx = a.findIndex(x => x && x.id === 'open-clients-folder');
                const alreadyQrIndex = a.findIndex(x => x && x.id === 'qr-scan');
                if (alreadyQrIndex !== -1) {
                    a.splice(alreadyQrIndex, 1);
                }
                if (idx !== -1) {
                    a.splice(idx, 1, qrItemDesktop);
                } else {
                    a.push(qrItemDesktop);
                }
            } catch (_) { }
        };

        applyReplace(menuItemsDesktop);
        applyReplace(menuItemsMobile);
    }
} catch (_) { }

function generateMenuItems() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;
    menuGrid.innerHTML = '';

    const rootFrag = document.createDocumentFragment();


    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    const items = isMobile ? menuItemsMobile : menuItemsDesktop;


    const firstRowContainer = document.createElement('div');
    firstRowContainer.id = 'first-row';
    firstRowContainer.className = isMobile
        ? 'col-span-full grid grid-cols-2 gap-1'
        : 'col-span-full grid grid-cols-2 gap-3 md:gap-4';
    rootFrag.appendChild(firstRowContainer);


    const iconColors = [
        { bg: '#E0F2FE', icon: '#0284C7' }, // درجات الأزرق المريحة للعين
        { bg: '#DBEAFE', icon: '#1D4ED8' },
        { bg: '#D1FAE5', icon: '#0EA5E9' },
        { bg: '#E0F2FE', icon: '#0369A1' }
    ];

    // Mobile (الهاتف): تطبيق "الربيع المشرق" على أزرار الشاشة الرئيسية فقط
    const springMobileGradients = [
        { from: '#a7f3d0', to: '#bae6fd' }, // mint -> sky
        { from: '#bbf7d0', to: '#fde68a' }, // green -> lemon
        { from: '#bae6fd', to: '#ddd6fe' }, // sky -> lilac
        { from: '#a7f3d0', to: '#fed7aa' }, // mint -> peach
        { from: '#fef9c3', to: '#bae6fd' }, // soft yellow -> sky
        { from: '#ddd6fe', to: '#a7f3d0' }  // lilac -> mint
    ];

    const mobileCardThemeById = {
        'search': {
            bg: 'linear-gradient(135deg, #8fd6d7 0%, #4aaab8 100%)',
            text: '#0F172A',
            iconBg: 'rgba(255,255,255,0.85)',
            icon: '#0d9488' // Teal
        },
        'new': {
            bg: 'linear-gradient(135deg, #79bde3 0%, #3b82c4 100%)',
            text: '#0F172A',
            iconBg: 'rgba(255,255,255,0.85)',
            icon: '#2563eb' // Blue
        },
        'clerk-papers': { from: '#86D7DF', to: '#73C9D2', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#0891b2' }, // Cyan
        'administrative': {
            bg: 'linear-gradient(135deg, #86b7da 0%, #5a8fbd 100%)',
            text: '#0F172A',
            iconBg: 'rgba(255,255,255,0.85)',
            icon: '#1e40af' // Dark Blue
        },
        'sessions': { from: '#B9F0DE', to: '#A2E7D2', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#059669' }, // Green
        'services': { from: '#4DB7C6', to: '#3DA8B8', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#0e7490' }, // Cyan
        'expert-sessions': { from: '#A7CFE8', to: '#93BFE0', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#3b82f6' }, // Light Blue
        'accounts': { from: '#A9C3E2', to: '#8FB2D8', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#4f46e5' }, // Indigo
        'legal-library': { from: '#79D2C2', to: '#66C7B6', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#0d9488' }, // Teal
        'reports': {
            bg: 'linear-gradient(135deg, #7fc6e3 0%, #3e93c8 100%)',
            text: '#0F172A',
            iconBg: 'rgba(255,255,255,0.85)',
            icon: '#2563eb' // Blue
        },
        'open-clients-folder': { from: '#7CC4D3', to: '#67B7C8', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#0891b2' },
        'qr-scan': { from: '#7CC4D3', to: '#67B7C8', text: '#0F172A', iconBg: 'rgba(255,255,255,0.85)', icon: '#0891b2' }
    };

    items.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        try { btn.setAttribute('data-menu-id', String(item && item.id ? item.id : '')); } catch (_) { }

        btn.className = isMobile
            ? 'menu-card md-elevation-1 rounded-3xl hover:md-elevation-2 flex flex-col items-center justify-center text-center group p-2'
            : 'menu-card md-elevation-1 rounded-3xl hover:md-elevation-2 flex flex-col items-center justify-center text-center md:min-h-[160px] group p-4 md:p-6';
        btn.style.backgroundColor = '#374151';
        btn.style.color = '#FFFFFF';

        const themed = mobileCardThemeById[item.id] || null;

        if (isMobile) {

            const colors = iconColors[index % iconColors.length];
            if (themed) {
                const g = springMobileGradients[index % springMobileGradients.length];
                btn.style.backgroundImage = `linear-gradient(135deg, ${g.from}, ${g.to})`;
                btn.style.backgroundColor = 'transparent';
                btn.style.color = themed.text;
                btn.style.border = '1px solid rgba(15, 23, 42, 0.14)';
                btn.innerHTML = `
                    <div class="menu-icon-bg w-9 h-9 rounded-xl flex items-center justify-center mb-1" style="background-color: ${themed.iconBg};">
                        <span class="material-symbols-outlined text-xl" style="color: ${themed.icon};">${item.icon}</span>
                    </div>
                    <h3 class="font-bold text-xs leading-tight">${item.label}</h3>
                `;
            } else {
                const g = springMobileGradients[index % springMobileGradients.length];
                btn.style.backgroundImage = `linear-gradient(135deg, ${g.from}, ${g.to})`;
                btn.style.backgroundColor = 'transparent';
                btn.style.color = '#0F172A';
                btn.style.border = '1px solid rgba(15, 23, 42, 0.14)';
                btn.innerHTML = `
                    <div class="menu-icon-bg w-9 h-9 rounded-xl flex items-center justify-center mb-1" style="background-color: ${colors.bg};">
                        <span class="material-symbols-outlined text-xl" style="color: ${colors.icon};">${item.icon}</span>
                    </div>
                    <h3 class="font-bold text-xs leading-tight">${item.label}</h3>
                `;
            }
        } else {
            // نسخة الكمبيوتر
            const colors = iconColors[index % iconColors.length];
            if (themed) {
                // تدرج سماوى غامق لفاتح لكل الزراير فى الكمبيوتر
                btn.style.backgroundImage = 'linear-gradient(to left, #0369a1, #0ea5e9)';
                
                btn.style.backgroundColor = 'transparent';
                btn.style.color = '#FFFFFF';
                btn.style.border = 'none';
                btn.style.outline = 'none';

                const desktopIconColor = (themed && themed.icon) ? themed.icon : '#FFFFFF';
                const desktopIconBg = (themed && themed.iconBg) ? themed.iconBg : 'rgba(255, 255, 255, 0.25)';

                btn.innerHTML = `
                    <div class="menu-icon-bg w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background-color: ${desktopIconBg};">
                        <span class="material-symbols-outlined text-3xl" style="color: ${desktopIconColor}; font-variation-settings: 'FILL' 1, 'wght' 700;">${item.icon}</span>
                    </div>
                    <h3 class="font-black text-lg leading-tight mb-1" style="color: #000000;">${item.label}</h3>
                    <p class="text-sm" style="color: #000000;">${item.description || ''}</p>
                `;
            } else {
                btn.innerHTML = `
                    <div class="menu-icon-bg w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background-color: ${colors.bg};">
                        <span class="material-symbols-outlined text-xl" style="color: ${colors.icon};">${item.icon}</span>
                    </div>
                    <h3 class="font-bold text-base leading-tight mb-1">${item.label}</h3>
                    <p class="text-xs text-gray-200">${item.description || ''}</p>
                `;
            }
        }

        btn.addEventListener('click', () => handleCardClick(item.id));

        if (index < 2) {
            firstRowContainer.appendChild(btn);
        } else {
            rootFrag.appendChild(btn);
        }

    });

    menuGrid.appendChild(rootFrag);
}

function getFeatureLabelById(id) {
    try {
        const fid = String(id || '').trim();
        const all = (Array.isArray(menuItemsDesktop) ? menuItemsDesktop : []).concat(Array.isArray(menuItemsMobile) ? menuItemsMobile : []);
        const it = all.find(x => x && String(x.id) === fid);
        if (it && it.label) return String(it.label);
        if (fid === 'settings') return 'الإعدادات';
        if (fid === 'sync') return 'المزامنة';
        return fid;
    } catch (e) {
        return String(id || '');
    }
}

async function handleCardClick(id) {
    try {
        if (typeof guardFeatureAccess === 'function') {
            const ok = await guardFeatureAccess(String(id || ''), getFeatureLabelById(id));
            if (!ok) return;
        }
    } catch (e) { }

    try {
        if (id === 'settings') {
            const isAdmin = (sessionStorage.getItem('current_is_admin') === '1');
            if (!isAdmin) {
                try {
                    if (typeof showToast === 'function') {
                        showToast('غير مسموح لك بفتح الإعدادات', 'error');
                    } else {
                        alert('غير مسموح لك بفتح الإعدادات');
                    }
                } catch (e) { }
                return;
            }
        }
    } catch (e) { }
    if (id === 'new') {
        try {
            // قفل بسيط: لو الجهاز مش مُفعّل ووصل لحد الموكلين (20)، امنع فتح "قضية جديدة"
            // الهدف أقل تعديل ممكن بدون ما نلمس باقي الشاشات.
            if (typeof initDB === 'function') {
                try { await initDB(); } catch (_) { }
            }

            let licensed = false;
            try {
                const v = (typeof getSetting === 'function') ? await getSetting('licensed') : null;
                licensed = (v === true || v === '1' || v === 1);
            } catch (_) { licensed = false; }

            if (!licensed) {
                const LIMIT_CLIENTS = 20;
                let clientsCount = 0;
                try {
                    const c = (typeof getCount === 'function') ? await getCount('clients') : 0;
                    clientsCount = Number(c) || 0;
                } catch (_) { clientsCount = 0; }

                if (clientsCount >= LIMIT_CLIENTS) {
                    try {
                        if (typeof window !== 'undefined' && typeof window.__LAWYER_SHOW_ACTIVATION_OVERLAY === 'function') {
                            window.__LAWYER_SHOW_ACTIVATION_OVERLAY();
                            return;
                        }
                    } catch (_) { }

                    try {
                        if (typeof showToast === 'function') showToast('وصلت للحد الأقصى من الاستخدام. يرجى تفعيل النسخة للمتابعة.', 'warning');
                        else alert('وصلت للحد الأقصى من الاستخدام. يرجى تفعيل النسخة للمتابعة.');
                    } catch (_) { }
                    return;
                }
            }
        } catch (_) { }

        stateManager.resetCaseState();
        try {
            sessionStorage.setItem('newEntryMode', 'freshClient');
            sessionStorage.removeItem('returnToPage');
            sessionStorage.removeItem('returnToClientId');
            sessionStorage.removeItem('openClientDetailsOnSearch');
            sessionStorage.removeItem('clientViewSelectedClientId');
            sessionStorage.removeItem('clientViewSelectedCaseId');
            sessionStorage.removeItem('clientViewSelectedCaseIndex');
            sessionStorage.removeItem('new_draft_case_flow');
            sessionStorage.removeItem('new_open_case_details');
            sessionStorage.removeItem('new_open_case_id');
            sessionStorage.removeItem('currentCaseId');
        } catch (e) { }
        window.location.href = 'new.html';
    } else if (id === 'search') {
        window.location.href = 'search.html';
    } else if (id === 'sessions') {
        window.location.href = 'sessions.html';
    } else if (id === 'accounts') {
        window.location.href = 'accounts.html';
    } else if (id === 'administrative') {
        window.location.href = 'administrative.html';
    } else if (id === 'clerk-papers') {
        window.location.href = 'clerk-papers.html';
    } else if (id === 'expert-sessions') {
        window.location.href = 'expert-sessions.html';
    } else if (id === 'services') {
        window.location.href = 'services.html';
    } else if (id === 'legal-library') {
        window.location.href = 'legal-library.html';
    } else if (id === 'qr-scan') {
        const isDesktopApp = (function () {
            try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
        })();
        if (!isDesktopApp) {
            window.location.href = 'barcode.html';
        } else {
            window.location.href = 'barcode.html';
        }
    } else if (id === 'open-clients-folder') {
        if (window.electronAPI && window.electronAPI.openClientsMainFolder) {
            const openFolder = () => {
                try { window.electronAPI.openClientsMainFolder(); } catch (_) { }
            };

            try {
                if (localStorage.getItem('desktop_path_warning_suppressed') === '1') {
                    openFolder();
                    return;
                }
            } catch (_) { }

            try {
                if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
                    const chk = await window.electronAPI.checkClientsPathOnDesktop();
                    if (chk && chk.success === true && chk.isOnDesktop === true) {
                        try {
                            if (typeof window.showDesktopPathSafetyWarning === 'function') {
                                window.showDesktopPathSafetyWarning({}, { onContinue: () => { try { openFolder(); } catch (_) { } } });
                            }
                        } catch (_) { }
                        return;
                    }
                }
            } catch (_) { }

            openFolder();
        } else {
            if (typeof showToast === 'function') {
                showToast('هذه الميزة متاحة فقط في تطبيق سطح المكتب', 'info');
            } else {
                alert('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
            }
        }
    } else if (id === 'reports') {
        window.location.href = 'reports.html';
    } else if (id === 'settings') {
        window.location.href = 'settings.html';
    } else {
        openModalWithView((id) => {
            const modalTitle = document.getElementById('modal-title');
            const modalContent = document.getElementById('modal-content');
            modalTitle.textContent = "قيد التطوير";
            modalContent.innerHTML = '<p class="text-center p-8">هذه الميزة لا تزال قيد التطوير.</p>';
        }, id);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const isDesktopApp = (function () {
        try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
    })();

    function ensureHomeLoadingOverlay() {
        try {
            if (!isDesktopApp) return;
            if (document.getElementById('app-loading-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'app-loading-overlay';
            overlay.setAttribute('data-app-loading', '1');
            overlay.style.cssText = [
                'position:fixed',
                'inset:0',
                'background:rgba(255,255,255,0.92)',
                'z-index:2147483646',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'padding:16px',
                'direction:rtl'
            ].join(';');

            const box = document.createElement('div');
            box.style.cssText = [
                'width:min(520px, 100%)',
                'background:#ffffff',
                'border:1px solid rgba(15,23,42,.12)',
                'border-radius:16px',
                'padding:16px',
                'box-shadow:0 16px 40px rgba(15,23,42,.14)',
                'font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial',
                'text-align:center'
            ].join(';');

            const title = document.createElement('div');
            title.textContent = 'جاري التحميل';
            title.style.cssText = 'font-weight:900;color:#0f172a;font-size:16px;margin-bottom:12px;';

            const pulseWrap = document.createElement('div');
            pulseWrap.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:10px 0;';

            const pulse = document.createElement('div');
            pulse.id = 'app-loading-pulse';
            pulse.style.cssText = [
                'width:54px',
                'height:54px',
                'border-radius:9999px',
                'background:#0EA5E9',
                'box-shadow:0 0 0 0 rgba(14,165,233,.55)',
                'animation:appPulse 1.05s ease-in-out infinite'
            ].join(';');
            pulseWrap.appendChild(pulse);

            const hint = document.createElement('div');
            hint.textContent = 'الرجاء الانتظار...';
            hint.style.cssText = 'margin-top:10px;font-size:13px;color:#334155;';

            if (!document.querySelector('style[data-app-loading-style="1"]')) {
                const style = document.createElement('style');
                style.setAttribute('data-app-loading-style', '1');
                style.textContent = [
                    '@keyframes appPulse{',
                    '0%{transform:scale(.92);box-shadow:0 0 0 0 rgba(14,165,233,.55);opacity:.95}',
                    '70%{transform:scale(1);box-shadow:0 0 0 18px rgba(14,165,233,0);opacity:1}',
                    '100%{transform:scale(.92);box-shadow:0 0 0 0 rgba(14,165,233,0);opacity:.95}',
                    '}'
                ].join('');
                (document.head || document.documentElement).appendChild(style);
            }

            box.appendChild(title);
            box.appendChild(pulseWrap);
            box.appendChild(hint);
            overlay.appendChild(box);
            (document.body || document.documentElement).appendChild(overlay);
        } catch (e) { }
    }

    function hideHomeLoadingOverlay() {
        try {
            const el = document.getElementById('app-loading-overlay');
            if (!el) return;
            el.style.transition = 'opacity .25s ease';
            el.style.opacity = '0';
            setTimeout(() => {
                try { el.remove(); } catch (_) {
                    try { if (el.parentNode) el.parentNode.removeChild(el); } catch (_) { }
                }
            }, 280);
        } catch (e) { }
    }

    ensureHomeLoadingOverlay();
    try {
        // ابدأ برسم القائمة في أقرب إطار لتقليل التقطيع على الأجهزة الضعيفة
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                try { generateMenuItems(); } catch (e) { }
                try { hideHomeLoadingOverlay(); } catch (e) { }
            });
        } else {
            generateMenuItems();
            try { hideHomeLoadingOverlay(); } catch (e) { }
        }
    } catch (e) { }


    try {
        await initDB();

        try {
            const customPath = await getSetting('customClientsPath');
            if (customPath && window.electronAPI && window.electronAPI.setCustomClientsPath) {
                await window.electronAPI.setCustomClientsPath(customPath);
            }
        } catch (e) { }

        const setupRunBefore = localStorage.getItem('lawyer_app_setup_completed');
        if (!setupRunBefore) {
            if (!/setup\.html$/.test(window.location.pathname)) {
                window.location.href = 'setup.html';
                return;
            }
        }
    } catch (e) { }


    let __dateFormatter = null;
    try {
        __dateFormatter = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        __dateFormatter = null;
    }

    function updateCurrentDateTime() {
        const dateLine = document.getElementById('current-date-line');
        const timeEl = document.getElementById('current-time');
        if (!dateLine || !timeEl) return;
        const now = new Date();


        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayName = days[now.getDay()];


        if (__dateFormatter) {
            try {
                dateLine.textContent = `${dayName} - ${__dateFormatter.format(now)}`;
            } catch (e) {
                dateLine.textContent = `${dayName} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
            }
        } else {
            dateLine.textContent = `${dayName} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
        }


        const pad = (n) => String(n).padStart(2, '0');
        let h24 = now.getHours();
        const suffix = h24 >= 12 ? 'م' : 'ص';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        const hh = pad(h12);
        const mm = pad(now.getMinutes());
        timeEl.textContent = `${hh}:${mm} ${suffix}`;
    }
    updateCurrentDateTime();
    try { if (window.__clockTimer) { clearInterval(window.__clockTimer); } } catch (e) { }
    window.__clockTimer = setInterval(updateCurrentDateTime, 60000);
    window.addEventListener('blur', () => {
        try { if (window.__clockTimer) { clearInterval(window.__clockTimer); window.__clockTimer = null; } } catch (e) { }
    });
    window.addEventListener('focus', () => {
        try { if (!window.__clockTimer) { updateCurrentDateTime(); window.__clockTimer = setInterval(updateCurrentDateTime, 60000); } } catch (e) { }
    });

    try {
        // تحديث العدادات ممكن يبقى تقيل، فبنأخره سنة صغيرة بعد ما الصفحة تبان
        await new Promise((r) => setTimeout(r, 1000));

        const runCounters = async () => {
            try { await updateCountersInHeader(); } catch (e) { }
        };

        if (typeof requestIdleCallback === 'function') {
            await new Promise((resolve) => {
                try {
                    requestIdleCallback(async () => {
                        try { await runCounters(); } finally { resolve(); }
                    }, { timeout: 1500 });
                } catch (e) {
                    runCounters().finally(resolve);
                }
            });
        } else {
            await runCounters();
        }

        try {
            const name = await getSetting('officeName');
            const officeCardEl = document.getElementById('office-name-card');
            const mobileOfficeCardEl = document.getElementById('mobile-office-name-card');
            if (officeCardEl) {
                officeCardEl.textContent = name || 'أحمد';
            }
            if (mobileOfficeCardEl) {
                mobileOfficeCardEl.textContent = name || 'أحمد';
            }
        } catch (e) { }

        try {
            sessionStorage.removeItem('openClientDetailsOnSearch');
            sessionStorage.removeItem('returnToClientId');
            sessionStorage.removeItem('returnToPage');
        } catch (e) { }
    } catch (error) {
    }


    try { await refreshSidebarVersionLabel(); } catch (e) { }


    addStatsCardsClickHandlers();
});


function addStatsCardsClickHandlers() {
}

async function refreshSidebarVersionLabel() {
    try {
        const el = document.getElementById('sidebar-version-label');
        if (!el) return;

        const normalize = (v) => {
            const m = String(v || '').trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
            if (!m) return (String(v || '').trim() || '—');
            return 'v.' + m[1] + '.' + (m[2] || '0') + '.' + (m[3] || '0');
        };

        let vStr = '';

        try {
            if (window.electronAPI && typeof window.electronAPI.getAppVersion === 'function') {
                const res = await window.electronAPI.getAppVersion();
                if (res && res.success && res.version) vStr = String(res.version);
            }
        } catch (e) { }

        try {
            if (!vStr && typeof window.APP_CURRENT_VERSION !== 'undefined') {
                vStr = String(window.APP_CURRENT_VERSION || '').trim();
            }
        } catch (e) { }

        try {
            if (!vStr && typeof UPDATE_CONFIG !== 'undefined' && UPDATE_CONFIG.currentVersion) {
                vStr = String(UPDATE_CONFIG.currentVersion || '').trim();
            }
        } catch (e) { }

        el.textContent = 'الإصدار: ' + normalize(vStr);
    } catch (e) { }
}


function showStatsMessage(title, message) {

    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    popup.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform animate-scale-in">
            <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-blue-600 text-2xl">info</span>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">${title}</h3>
                <p class="text-gray-600 text-sm leading-relaxed mb-6">${message}</p>
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors" onclick="this.closest('.fixed').remove()">
                    موافق
                </button>
            </div>
        </div>
    `;


    if (!document.querySelector('#stats-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'stats-popup-styles';
        style.textContent = `
            @keyframes scale-in {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .animate-scale-in {
                animation: scale-in 0.2s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(popup);


    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.remove();
        }
    });


    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}
