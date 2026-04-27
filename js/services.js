let __servicesUiState = { query: '', sort: 'added_oldest' };
let __servicesLastSites = null;
let __servicesLastViewType = 'grid';

function __servicesGetAddedTs(site) {
    try {
        const id = site && site.id != null ? String(site.id) : '';
        const m = id.match(/^(\d{10,})/);
        if (m && m[1]) return Number(m[1]) || 0;
        const n = Number(id);
        return Number.isFinite(n) ? n : 0;
    } catch (_) {
        return 0;
    }
}

function __servicesApplyFilterAndSort(sites) {
    const arr = Array.isArray(sites) ? sites.slice() : [];

    const q = String((__servicesUiState && __servicesUiState.query) || '').trim().toLowerCase();
    const filtered = q
        ? arr.filter((s) => {
            try {
                const name = String(s && s.name || '').toLowerCase();
                const url = String(s && s.url || '').toLowerCase();
                const domain = String(__servicesGetDomainLabel(s && s.url) || '').toLowerCase();
                return name.includes(q) || url.includes(q) || domain.includes(q);
            } catch (_) {
                return false;
            }
        })
        : arr;

    const sortMode = String((__servicesUiState && __servicesUiState.sort) || 'added_oldest');
    if (sortMode === 'name_asc') {
        filtered.sort((a, b) => {
            try {
                return String(a && a.name || '').localeCompare(String(b && b.name || ''), 'ar');
            } catch (_) {
                return 0;
            }
        });
    } else if (sortMode === 'added_newest') {
        filtered.sort((a, b) => (__servicesGetAddedTs(b) - __servicesGetAddedTs(a)));
    } else if (sortMode === 'added_oldest') {
        filtered.sort((a, b) => (__servicesGetAddedTs(a) - __servicesGetAddedTs(b)));
    }

    return filtered;
}

function __servicesRenderSites(viewType) {
    try {
        if (typeof viewType === 'string' && viewType) {
            __servicesLastViewType = viewType;
        }
        const raw = Array.isArray(__servicesLastSites) ? __servicesLastSites : [];
        const processed = __servicesApplyFilterAndSort(raw);
        displaySites(processed, __servicesLastViewType);
    } catch (_) { }
}

function displayServicesModal() {
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
        try { modalContent.style.background = '#ffffff'; } catch (_) { }
    }

    if (!modalContent) return;

    modalContent.innerHTML = `
        <div class="services-container h-full min-h-0 flex gap-0">
            <div id="services-sidebar" class="w-72 lg:w-80 border-l flex flex-col" style="background:#111827;border-left-color:rgba(14,165,233,.45);">
                <div class="px-3 py-3 border-b services-sidebar-divider" style="border-color: rgba(148,163,184,.16);">
                    <div class="services-sidebar-card rounded-lg p-3 border" style="border-color: rgba(148,163,184,.18);">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="ri-add-circle-line text-green-400 text-lg"></i>
                            <h3 class="services-sidebar-heading font-semibold text-sm">إضافة موقع</h3>
                        </div>
                        <div class="space-y-3">
                            <input type="text" id="service-site-name" placeholder="اسم الموقع..." class="services-sidebar-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-right text-sm transition-all">
                            <input type="text" id="service-site-url" placeholder="الرابط..." class="services-sidebar-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-right text-sm transition-all" dir="ltr">
                            <button id="add-site-btn" class="services-add-btn w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-sm">
                                <i class="ri-add-line"></i>
                                إضافة
                            </button>
                        </div>
                    </div>
                </div>

                <div class="px-3 pb-3 border-b services-sidebar-divider" style="border-color: rgba(148,163,184,.16); order: 99;">
                    <div class="services-sidebar-card rounded-lg p-3 border" style="border-color: rgba(148,163,184,.18);">
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <div class="flex items-center gap-2">
                                <i class="ri-file-word-2-line text-sky-300 text-lg opacity-90"></i>
                                <h3 class="services-sidebar-heading font-semibold text-sm">قالب المكتب</h3>
                            </div>
                            <button id="document-template-settings-btn" type="button" class="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 flex items-center justify-center" title="إعدادات القالب">
                                <i class="ri-settings-3-line text-base"></i>
                            </button>
                        </div>
                        <button id="create-word-template-btn" class="services-add-btn w-full px-4 py-2 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-sm" style="border: 1px solid rgba(255,255,255,0.10);">
                            <i class="ri-file-copy-line"></i>
                            إنشاء مستند
                        </button>
                    </div>
                </div>

                <div class="px-3 py-3 border-b services-sidebar-divider" style="border-color: rgba(148,163,184,.16); order: -1;">
                    <div class="services-sidebar-card rounded-lg p-3 border" style="border-color: rgba(148,163,184,.18);">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="ri-search-line text-sky-300 text-lg"></i>
                            <h3 class="services-sidebar-heading font-semibold text-sm">بحث وفرز</h3>
                        </div>
                        <div class="space-y-3">
                            <input type="text" id="services-search-input" placeholder="ابحث باسم الموقع أو الرابط..." class="services-sidebar-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300 text-right text-sm transition-all">
                            <select id="services-sort-select" class="services-sidebar-select w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300 text-right text-sm transition-all">
                                <option value="added_oldest">الأقدم أولاً</option>
                                <option value="added_newest">الأحدث أولاً</option>
                                <option value="name_asc">بالاسم</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-1 bg-white flex flex-col">
                <div id="services-list" class="flex-1 p-1 sm:p-3 overflow-y-auto">
                    <div class="text-center text-gray-500 py-20">
                        <i class="ri-loader-4-line animate-spin text-3xl mb-3 text-gray-300"></i>
                        <p class="text-lg">جاري تحميل البيانات...</p>
                    </div>
                </div>

                <div id="site-viewer" class="hidden flex-1 min-h-0 flex flex-col">
                    <div class="px-2 py-1 bg-white/90 backdrop-blur border-b border-gray-200 flex items-center gap-2 sticky top-0 z-10">
                        <button id="toggle-viewer-full" class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-800 text-white hover:bg-gray-700"><i class="ri-fullscreen-fill text-sm"></i><span>تكبير</span></button>
                        <div id="site-tabs" class="flex-1 flex items-center gap-1 overflow-x-auto"></div>
                    </div>
                    <div id="webviews-container" class="flex-1 relative w-full h-full"></div>
                </div>
            </div>
        </div>
    `;

    try {
        const sidebar = document.getElementById('services-sidebar');
        if (sidebar) {
            try { sidebar.style.background = '#111827'; } catch (_) { }
            try { sidebar.style.borderLeft = '2px solid rgba(14, 165, 233, .45)'; } catch (_) { }
            try { sidebar.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
            try {
                sidebar.style.borderBottomLeftRadius = '16px';
                sidebar.style.borderBottomRightRadius = '16px';
                sidebar.style.overflowX = 'hidden';
                sidebar.style.overflowY = 'auto';
                sidebar.style.overscrollBehavior = 'contain';
                sidebar.style.paddingBottom = '10px';
            } catch (_) { }
        }

        try {
            const rightFrame = document.querySelector('#modal-content .services-container > div.flex-1');
            if (rightFrame) {
                const isMobile = __servicesIsMobile();
                rightFrame.style.setProperty('background', '#ffffff', 'important');
                rightFrame.style.setProperty('border', isMobile ? '0' : '2px solid rgba(14, 165, 233, .45)', 'important');
                rightFrame.style.setProperty('border-radius', isMobile ? '0' : '14px', 'important');
                rightFrame.style.setProperty('box-shadow', isMobile ? 'none' : '0 10px 22px rgba(15, 23, 42, 0.12)', 'important');
                rightFrame.style.setProperty('overflow', 'hidden', 'important');
            }
        } catch (_) { }

        try {
            const primaryBtns = [
                document.getElementById('add-site-btn'),
                document.getElementById('create-word-template-btn')
            ].filter(Boolean);

            const stylePrimary = (btn) => {
                if (!btn) return;
                if (btn.dataset && btn.dataset.servicesPrimaryStyled === '1') return;
                if (btn.dataset) btn.dataset.servicesPrimaryStyled = '1';

                const baseBg = '#1e3a8a';
                const hoverBg = '#000000';
                const activeBg = '#0b1220';

                const setImp = (prop, value) => { try { btn.style.setProperty(prop, value, 'important'); } catch (_) { } };
                const clearImp = (prop) => { try { btn.style.removeProperty(prop); } catch (_) { } };

                const applyBase = () => {
                    setImp('background', baseBg);
                    setImp('color', '#ffffff');
                    setImp('border', '1px solid rgba(255,255,255,0.22)');
                    setImp('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease');
                    clearImp('transform');
                    clearImp('box-shadow');
                };

                const applyHover = () => {
                    setImp('background', hoverBg);
                    setImp('border-color', 'rgba(245, 158, 11, .85)');
                    setImp('transform', 'translateY(-1px)');
                    setImp('box-shadow', '0 12px 22px rgba(0,0,0,.22)');
                };

                const applyActive = () => {
                    setImp('background', activeBg);
                    setImp('border-color', 'rgba(245, 158, 11, .90)');
                    setImp('transform', 'translateY(0px)');
                    setImp('box-shadow', '0 10px 16px rgba(0,0,0,.18)');
                };

                applyBase();
                btn.addEventListener('mouseenter', applyHover);
                btn.addEventListener('mouseleave', applyBase);
                btn.addEventListener('mousedown', applyActive);
                btn.addEventListener('mouseup', applyHover);
                btn.addEventListener('blur', applyBase);
            };

            primaryBtns.forEach(stylePrimary);

            const styleSettingsBtn = (btn) => {
                if (!btn) return;
                if (btn.dataset && btn.dataset.servicesGearStyled === '1') return;
                if (btn.dataset) btn.dataset.servicesGearStyled = '1';

                const baseBg = 'rgba(255,255,255,.06)';
                const hoverBg = '#000000';
                const activeBg = '#0b1220';

                const setImp = (prop, value) => { try { btn.style.setProperty(prop, value, 'important'); } catch (_) { } };
                const clearImp = (prop) => { try { btn.style.removeProperty(prop); } catch (_) { } };

                const applyBase = () => {
                    setImp('background', baseBg);
                    setImp('color', 'rgba(255,255,255,.92)');
                    setImp('border', '1px solid rgba(255,255,255,0.18)');
                    setImp('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease');
                    clearImp('transform');
                    clearImp('box-shadow');
                };

                const applyHover = () => {
                    setImp('background', hoverBg);
                    setImp('border-color', 'rgba(245, 158, 11, .85)');
                    setImp('transform', 'translateY(-1px)');
                    setImp('box-shadow', '0 12px 22px rgba(0,0,0,.22)');
                };

                const applyActive = () => {
                    setImp('background', activeBg);
                    setImp('border-color', 'rgba(245, 158, 11, .90)');
                    setImp('transform', 'translateY(0px)');
                    setImp('box-shadow', '0 10px 16px rgba(0,0,0,.18)');
                };

                applyBase();
                btn.addEventListener('mouseenter', applyHover);
                btn.addEventListener('mouseleave', applyBase);
                btn.addEventListener('mousedown', applyActive);
                btn.addEventListener('mouseup', applyHover);
                btn.addEventListener('blur', applyBase);
            };

            styleSettingsBtn(document.getElementById('document-template-settings-btn'));
        } catch (_) { }

        try {
            const cards = document.querySelectorAll('#services-sidebar .services-sidebar-card');
            cards.forEach((el) => {
                if (!el) return;
                if (el.dataset && el.dataset.hoverStyled === '1') return;
                if (el.dataset) el.dataset.hoverStyled = '1';

                const setImp = (node, prop, value) => {
                    try { node.style.setProperty(prop, value, 'important'); } catch (_) { }
                };
                const clearImp = (node, prop) => {
                    try { node.style.removeProperty(prop); } catch (_) { }
                };

                const applyBase = () => {
                    try {
                        setImp(el, 'transition', 'background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease');
                        clearImp(el, 'transform');
                        clearImp(el, 'box-shadow');
                        clearImp(el, 'border-color');
                    } catch (_) { }
                };
                const applyHover = () => {
                    try {
                        setImp(el, 'border-color', 'rgba(245, 158, 11, .85)');
                        setImp(el, 'transform', 'translateY(-2px)');
                        setImp(el, 'box-shadow', '0 14px 26px rgba(245, 158, 11, .14), 0 10px 18px rgba(15, 23, 42, .20)');
                    } catch (_) { }
                };

                applyBase();
                el.addEventListener('mouseenter', applyHover);
                el.addEventListener('mouseleave', applyBase);
                el.addEventListener('mousedown', () => { try { setImp(el, 'transform', 'translateY(-1px)'); } catch (_) { } });
                el.addEventListener('mouseup', applyHover);
                el.addEventListener('blur', applyBase);
            });
        } catch (_) { }
    } catch (_) { }

    try {
        if (!document.getElementById('services-sidebar-hover-style')) {
            const st = document.createElement('style');
            st.id = 'services-sidebar-hover-style';
            st.textContent = `
                .low-power #modal-content #services-sidebar #add-site-btn,
                .low-power #modal-content #services-sidebar .services-sidebar-card {
                    transition: background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease !important;
                }

                #modal-content #services-sidebar #add-site-btn:hover {
                    border-color: rgba(245, 158, 11, .90) !important;
                    outline: 2px solid rgba(245, 158, 11, .65) !important;
                    outline-offset: 2px !important;
                    transform: translateY(-1px) scale(1.02) !important;
                    box-shadow: 0 16px 26px rgba(245, 158, 11, .14), 0 12px 18px rgba(15, 23, 42, .20) !important;
                }
            `;
            (document.head || document.documentElement).appendChild(st);
        }
    } catch (_) { }

    try {
        const mainEl = document.querySelector('main');
        if (mainEl) {
            try {
                const headerEl = document.querySelector('header');
                const headerH = headerEl ? Math.max(0, Math.round(headerEl.getBoundingClientRect().height || 0)) : 0;
                try { mainEl.classList.remove('pt-8'); } catch (_) { }
                if (headerH) {
                    mainEl.style.marginTop = headerH + 'px';
                    mainEl.style.paddingTop = '0px';
                }
            } catch (_) { }

            const top = mainEl.getBoundingClientRect().top;
            const vh = window.innerHeight;
            const h = Math.max(240, vh - top);
            mainEl.style.height = h + 'px';
            mainEl.style.maxHeight = h + 'px';
            mainEl.style.overflowY = 'hidden';
        }

        try { document.body.style.overflowY = 'hidden'; } catch (_) { }
        try { document.documentElement.style.overflowY = 'hidden'; } catch (_) { }

        if (!window.__servicesMainOffsetBound) {
            window.__servicesMainOffsetBound = true;
            window.addEventListener('resize', () => {
                try {
                    const mainEl2 = document.querySelector('main');
                    if (!mainEl2) return;
                    const headerEl2 = document.querySelector('header');
                    const headerH2 = headerEl2 ? Math.max(0, Math.round(headerEl2.getBoundingClientRect().height || 0)) : 0;
                    if (headerH2) {
                        mainEl2.style.marginTop = headerH2 + 'px';
                        mainEl2.style.paddingTop = '0px';
                    }
                } catch (_) { }
            });
        }
    } catch (_) { }

    attachServicesListeners();

    try {
        const viewType = __servicesIsMobile() ? 'list' : 'grid';
        __servicesLastViewType = viewType;
        loadExistingSites(viewType);
    } catch (_) { }
}

function __servicesIsMobile() {
    try {
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    } catch (_) {
        return false;
    }
}

function __servicesIsDesktopApp() {
    try {
        return !!(typeof window !== 'undefined' && window.electronAPI);
    } catch (_) {
        return false;
    }
}

function __servicesNormalizeUrl(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';

    if (s.includes('||')) {
        return s
            .split('||')
            .map(part => __servicesNormalizeUrl(part))
            .filter(Boolean)
            .join('||');
    }

    // If a scheme is already present, keep it as-is (http/https/mailto/etc.).
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) || /^[a-z][a-z0-9+.-]*:/i.test(s)) return s;

    // Protocol-relative URLs.
    if (s.startsWith('//')) return 'https:' + s;

    // Common inputs: "www.example.com" OR "example.com" (no scheme).
    if (/^www\./i.test(s)) return 'https://' + s;

    // Heuristic: looks like a host or host/path and contains no spaces.
    // Examples: "moj.gov.eg", "moj.gov.eg/Services", "portal.example.com?x=1"
    if (!/[\s]/.test(s) && !s.startsWith('/') && s.includes('.')) {
        return 'https://' + s;
    }

    return s;
}

function __servicesIsAiSite(site) {
    const id = String(site && site.id != null ? site.id : '').trim();
    const name = String(site && site.name ? site.name : '').trim();
    return id === '3' || name === 'الذكاء الاصطناعي';
}

function __servicesGetSiteSubtitle(site) {
    if (__servicesIsAiSite(site)) return 'ذكاء اصطناعي يتعلم من بياناتك ويقترح لك الحل الأنسب';
    return __servicesGetDomainLabel(site && site.url ? site.url : '');
}

function __servicesSplitMultiUrl(url) {
    try {
        const s = String(url || '').trim();
        if (!s) return [];
        if (!s.includes('||')) return [__servicesNormalizeUrl(s)].filter(Boolean);
        return s
            .split('||')
            .map(x => __servicesNormalizeUrl(x))
            .filter(Boolean);
    } catch (_) {
        return [];
    }
}

function __servicesGetDomainLabel(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';

    try {
        if (raw.includes('||')) return 'موقعين';
    } catch (_) { }

    const tryParse = (u) => {
        try { return new URL(u); } catch (_) { return null; }
    };

    const normalized = __servicesNormalizeUrl(raw);
    const parsed = tryParse(raw) || tryParse(normalized) || tryParse('https://' + raw.replace(/^\/\//, ''));
    if (!parsed) return raw;

    const host = String(parsed.hostname || raw).replace(/^www\./i, '');
    return host || raw;
}

async function __servicesShouldUseExternalBrowser() {
    try {
        if (typeof getSetting !== 'function') return false;
        const saved = await getSetting('useExternalBrowser');
        if (saved === null || saved === undefined || saved === '') return false;
        return saved === true || saved === 'true';
    } catch (_) {
        return false;
    }
}

function __servicesGetDefaultSites() {
    return [
        { id: '3', name: 'الذكاء الاصطناعي', url: 'https://gemini.google.com', icon: 'ri-robot-line', gradientStyle: 'linear-gradient(135deg, #a855f7, #7c3aed)', bgColor: 'bg-purple-50', textColor: 'text-purple-800' },
        { id: '4', name: 'وزارة العدل', url: 'https://www.moj.gov.eg', icon: 'ri-government-line', gradientStyle: 'linear-gradient(135deg, #ef4444, #dc2626)', bgColor: 'bg-red-50', textColor: 'text-red-800' },
        { id: '5', name: 'مصر الرقمية', url: 'https://digital.gov.eg/categories', icon: 'ri-smartphone-line', gradientStyle: 'linear-gradient(135deg, #6366f1, #4f46e5)', bgColor: 'bg-indigo-50', textColor: 'text-indigo-800' },
        { id: '6', name: 'النيابة العامة', url: 'https://www.ppo.gov.eg', icon: 'ri-scales-line', gradientStyle: 'linear-gradient(135deg, #22c55e, #16a34a)', bgColor: 'bg-green-50', textColor: 'text-green-800' },

        // روابط الخدمات الحكومية المطلوبة
        { id: '7', name: 'خدمات المحليات', url: 'https://lgs.gov.eg/#/home', icon: 'ri-building-2-line', gradientStyle: 'linear-gradient(135deg, #0ea5e9, #0369a1)', bgColor: 'bg-sky-50', textColor: 'text-sky-800' },
        { id: '8', name: 'مجلس الدولة', url: 'https://esc.gov.eg/', icon: 'ri-bank-line', gradientStyle: 'linear-gradient(135deg, #22c55e, #15803d)', bgColor: 'bg-emerald-50', textColor: 'text-emerald-800' },
        { id: '9', name: 'نقابة المحامين', url: 'https://egyls.com/', icon: 'ri-team-line', gradientStyle: 'linear-gradient(135deg, #f97316, #c2410c)', bgColor: 'bg-orange-50', textColor: 'text-orange-800' },
        { id: '10', name: 'المحاكم الاقتصاديه', url: 'https://elec.eecourts.gov.eg/', icon: 'ri-bar-chart-box-line', gradientStyle: 'linear-gradient(135deg, #14b8a6, #0f766e)', bgColor: 'bg-teal-50', textColor: 'text-teal-800' },
        { id: '11', name: 'الشكاوى الحكوميه', url: 'https://www.shakwa.eg/', icon: 'ri-feedback-line', gradientStyle: 'linear-gradient(135deg, #facc15, #ca8a04)', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' },
        { id: '12', name: 'التأمين الاجتماعى', url: 'https://www.nosi.gov.eg/', icon: 'ri-shield-check-line', gradientStyle: 'linear-gradient(135deg, #6366f1, #4f46e5)', bgColor: 'bg-indigo-50', textColor: 'text-indigo-800' },

        // روابط إضافية
        { id: '13', name: 'مصلحة الضرائب', url: 'https://eta.gov.eg', icon: 'ri-file-text-line', gradientStyle: 'linear-gradient(135deg, #f97316, #b45309)', bgColor: 'bg-amber-50', textColor: 'text-amber-800' },
        { id: '14', name: 'السجل التجارى', url: 'https://gafi.gov.eg', icon: 'ri-building-line', gradientStyle: 'linear-gradient(135deg, #22c55e, #15803d)', bgColor: 'bg-green-50', textColor: 'text-green-800' }
    ];
}

function __servicesGetSiteIconAndColor(site) {
    try {
        const icon = String(site && site.icon ? site.icon : '').trim();
        const gradientStyle = String(site && site.gradientStyle ? site.gradientStyle : '').trim();
        const bgColor = String(site && site.bgColor ? site.bgColor : '').trim();
        const textColor = String(site && site.textColor ? site.textColor : '').trim();
        return {
            icon: icon || 'ri-global-line',
            gradientStyle: gradientStyle || 'linear-gradient(135deg, #2563eb, #1e40af)',
            bgColor: bgColor || 'bg-blue-50',
            textColor: textColor || 'text-indigo-800'
        };
    } catch (_) {
        return {
            icon: 'ri-global-line',
            gradientStyle: 'linear-gradient(135deg, #2563eb, #1e40af)',
            bgColor: 'bg-blue-50',
            textColor: 'text-indigo-800'
        };
    }
}

async function __servicesLoadSitesRaw() {
    try {
        let raw = null;
        try {
            if (typeof getSetting === 'function') raw = await getSetting('servicesSites');
        } catch (_) { }

        if (!raw) {
            try {
                const ls = localStorage.getItem('servicesSites');
                if (ls) raw = ls;
            } catch (_) { }
        }

        let sites = null;
        if (Array.isArray(raw)) {
            sites = raw;
        } else if (typeof raw === 'string') {
            try { sites = JSON.parse(raw); } catch (_) { sites = null; }
        } else if (raw && typeof raw === 'object') {
            sites = raw;
        }

        if (!Array.isArray(sites) || sites.length === 0) {
            const defaults = __servicesGetDefaultSites();
            try { await __servicesSaveSites(defaults); } catch (_) { }
            return defaults;
        }

        const normalized = sites.map((s) => {
            const id = (s && s.id != null) ? String(s.id) : (String(Date.now()) + Math.random().toString(16).slice(2));
            const isAiSite = id === '3' || String(s && s.name != null ? s.name : '').trim() === 'الذكاء الاصطناعي';
            const name = isAiSite ? 'الذكاء الاصطناعي' : ((s && s.name != null) ? String(s.name) : '');
            const url = isAiSite ? 'https://gemini.google.com' : __servicesNormalizeUrl(s && s.url != null ? String(s.url) : '');
            const icon = (s && s.icon != null) ? String(s.icon) : '';
            const gradientStyle = (s && s.gradientStyle != null) ? String(s.gradientStyle) : '';
            const bgColor = (s && s.bgColor != null) ? String(s.bgColor) : '';
            const textColor = (s && s.textColor != null) ? String(s.textColor) : '';
            return { id, name, url, icon, gradientStyle, bgColor, textColor };
        }).filter(s => s && s.name && s.url);

        // Backfill icons/colors for known default services (so each button icon is distinct)
        // AND تأكد من إضافة المواقع الحكومية الجديدة تلقائياً لو كانت غير موجودة فى البيانات القديمة.
        try {
            const defaults = __servicesGetDefaultSites();
            const byUrl = new Map(defaults.map(d => [String(__servicesNormalizeUrl(d.url || '')).trim(), d]));

            // 1) تكملة بيانات الأزرار الموجودة فعلاً بحسب الإعدادات الافتراضية
            for (let i = 0; i < normalized.length; i += 1) {
                const cur = normalized[i];
                const def = byUrl.get(String(cur.url || '').trim());
                if (!def) continue;
                normalized[i] = {
                    ...cur,
                    icon: String(cur.icon || '').trim() ? cur.icon : def.icon,
                    gradientStyle: String(cur.gradientStyle || '').trim() ? cur.gradientStyle : def.gradientStyle,
                    bgColor: String(cur.bgColor || '').trim() ? cur.bgColor : def.bgColor,
                    textColor: String(cur.textColor || '').trim() ? cur.textColor : def.textColor
                };
            }

            // 2) إضافة أى مواقع افتراضية ناقصة (مثل روابط المحليات / مجلس الدولة / ... إلخ)
            const existingUrls = new Set(
                normalized.map(s => String(__servicesNormalizeUrl(s.url || '')).trim()).filter(Boolean)
            );
            const toAppend = [];
            for (const def of defaults) {
                const defUrl = String(__servicesNormalizeUrl(def.url || '')).trim();
                if (!defUrl) continue;
                if (existingUrls.has(defUrl)) continue;
                // لو العنوان نفسه موجود برابط مختلف، نتجنب التكرار باسمين متشابهين
                const hasSameName = normalized.some(s => String(s.name || '').trim() === String(def.name || '').trim());
                if (hasSameName) continue;
                toAppend.push({ ...def });
            }
            if (toAppend.length) {
                normalized.push(...toAppend);
                await __servicesSaveSites(normalized);
            }
        } catch (_) { }

        // Remove books button if it exists (moved to Legal Library sidebar).
        try {
            const combinedUrl = __servicesNormalizeUrl('https://foulabook.com/ar/books/%D9%82%D8%A7%D9%86%D9%88%D9%86?page=1||https://books-library.net/c-Books-Egyption-Law-best-download');
            const beforeLen = normalized.length;
            const filtered = normalized.filter(x => String(x.url || '').trim() !== combinedUrl);
            if (filtered.length !== beforeLen) {
                await __servicesSaveSites(filtered);
                return filtered;
            }
        } catch (_) { }

        try {
            const hasVaried = normalized.some(x => String(x.name || '').includes('كتب متنوعة') || String(x.url || '').includes('foulabook.com/ar/books'));
            const hasOther = normalized.some(x => String(x.name || '').includes('كتب أخرى') || String(x.url || '').includes('books-library.net/c-Books-Egyption-Law-best-download'));
            if (hasVaried && hasOther) {
                const combinedUrl = __servicesNormalizeUrl('https://foulabook.com/ar/books/%D9%82%D8%A7%D9%86%D9%88%D9%86?page=1||https://books-library.net/c-Books-Egyption-Law-best-download');
                const merged = normalized.filter(x => {
                    const n = String(x.name || '');
                    const u = String(x.url || '');
                    if (n.includes('كتب متنوعة') || u.includes('foulabook.com/ar/books')) return false;
                    if (n.includes('كتب أخرى') || u.includes('books-library.net/c-Books-Egyption-Law-best-download')) return false;
                    return true;
                });
                await __servicesSaveSites(merged);
                return merged;
            }
        } catch (_) { }

        // Ensure requested order for the default buttons (الافتراضية + الروابط الحكومية)
        try {
            const desired = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
            const byId = new Map(normalized.map(x => [String(x.id), x]));
            const hasAny = desired.some(id => byId.has(id));
            if (hasAny) {
                const ordered = [];
                for (const id of desired) {
                    if (byId.has(id)) ordered.push(byId.get(id));
                }
                for (const x of normalized) {
                    if (!desired.includes(String(x.id))) ordered.push(x);
                }
                await __servicesSaveSites(ordered);
                return ordered;
            }
        } catch (_) { }

        if (normalized.length === 0) {
            const defaults = __servicesGetDefaultSites();
            try { await __servicesSaveSites(defaults); } catch (_) { }
            return defaults;
        }

        return normalized;
    } catch (_) {
        const defaults = __servicesGetDefaultSites();
        try { await __servicesSaveSites(defaults); } catch (_) { }
        return defaults;
    }
}

async function __servicesSaveSites(sites) {
    try {
        const v = JSON.stringify(Array.isArray(sites) ? sites : []);
        try { localStorage.setItem('servicesSites', v); } catch (_) { }
        try {
            if (typeof setSetting === 'function') {
                await setSetting('servicesSites', v);
            }
        } catch (_) { }
    } catch (_) { }
}

async function loadExistingSites(viewType = 'grid') {
    const list = document.getElementById('services-list');
    if (!list) return;

    try {
        const sites = await __servicesLoadSitesRaw();
        __servicesLastSites = sites;
        __servicesRenderSites(viewType);
    } catch (e) {
        list.innerHTML = `
            <div class="text-center text-red-500 py-12">
                <i class="ri-error-warning-line text-4xl mb-4"></i>
                <p class="text-lg font-medium">حدث خطأ في تحميل المواقع</p>
                <p class="text-sm mt-2">${(e && e.message) ? e.message : ''}</p>
            </div>
        `;
    }
}

function displaySites(sites, viewType = 'grid') {
    const list = document.getElementById('services-list');
    if (!list) return;

    const isMobile = __servicesIsMobile();
    const vt = isMobile ? 'grid' : (viewType || 'grid');

    if (!Array.isArray(sites) || sites.length === 0) {
        list.innerHTML = `
            <div class="text-center text-gray-500 py-16">
                <i class="ri-global-line text-5xl mb-4 text-gray-300"></i>
                <p class="text-lg font-medium text-gray-400">لا توجد مواقع بعد</p>
                <p class="text-sm text-gray-400 mt-2">ابدأ بإضافة موقع من الشريط الجانبي</p>
            </div>
        `;
        return;
    }

    let html = '';

    if (vt === 'grid') {
        const gridWrapClass = isMobile ? 'grid grid-cols-2 gap-1' : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';
        const gridActionWrapClass = isMobile
            ? 'flex justify-center gap-1 mt-2 opacity-100'
            : 'flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200';
        const renderedSites = isMobile
            ? sites.slice().sort((a, b) => Number(__servicesIsAiSite(b)) - Number(__servicesIsAiSite(a)))
            : sites;
        html = `<div class="${gridWrapClass}">`;
        renderedSites.forEach(site => {
            const st = __servicesGetSiteIconAndColor(site);
            const isAiSite = __servicesIsAiSite(site);
            const subtitle = __servicesGetSiteSubtitle(site);
            const subtitleClass = isAiSite ? 'site-url text-[11px] sm:text-xs text-sky-700 leading-4 line-clamp-2' : 'site-url text-xs text-gray-500 truncate';
            const gridCardStyle = isMobile
                ? 'border-color: rgba(2,132,199,.35); background: rgba(14,165,233,.08);'
                : '';
            const gridItemClass = isMobile && isAiSite
                ? 'site-item services-site-card col-span-2 border-2 border-gray-200 rounded-lg p-2 sm:p-3 cursor-pointer transition-all duration-300 hover:shadow-lg group shadow-sm'
                : 'site-item services-site-card border-2 border-gray-200 rounded-lg p-1 sm:p-3 cursor-pointer transition-all duration-300 hover:shadow-lg group shadow-sm';
            html += `
                <div class="${gridItemClass}" data-site-id="${site.id}" style="${gridCardStyle}">
                    <div class="site-content text-center">
                        <div class="services-site-icon w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 mx-auto mb-1 sm:mb-2" style="background:${st.gradientStyle || '#1f2937'};">
                            <i class="${st.icon} text-white text-base sm:text-lg"></i>
                        </div>
                        <h4 class="site-title text-xs sm:text-sm font-bold text-indigo-800 mb-0.5 sm:mb-1 line-clamp-2">${site.name}</h4>
                        ${subtitle ? `<p class="site-subtitle ${isAiSite ? 'site-subtitle-ai' : ''} ${subtitleClass}" ${isAiSite ? '' : `dir="ltr" title="${site.url}"`}>${subtitle}</p>` : ''}
                        ${isAiSite ? `
                        <p class="ai-card-status hidden text-[10px] sm:text-xs text-sky-700 mt-1 flex items-center justify-center gap-1">
                            <i class="ri-loader-4-line animate-spin"></i>
                            <span>انتظر قليلاً...</span>
                        </p>
                        ` : ''}
                    </div>
                    ${isAiSite ? '' : `
                    <div class="${gridActionWrapClass}">
                        ${isMobile ? '' : `
                        <button class="open-site-btn w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="فتح" data-site-id="${site.id}">
                            <i class="ri-external-link-line text-xs"></i>
                        </button>
                        `}
                        <button class="edit-site-btn w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="تعديل" data-site-id="${site.id}">
                            <i class="ri-edit-line text-xs"></i>
                        </button>
                        <button class="delete-site-btn w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="حذف" data-site-id="${site.id}">
                            <i class="ri-delete-bin-line text-xs"></i>
                        </button>
                    </div>
                    `}
                </div>
            `;
        });
        html += '</div>';
    } else {
        const actionWrapClass = isMobile
            ? 'flex flex-col gap-2 opacity-100'
            : 'flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200';
        html = '<div class="space-y-3">';
        sites.forEach(site => {
            const st = __servicesGetSiteIconAndColor(site);
            const isAiSite = __servicesIsAiSite(site);
            const subtitle = __servicesGetSiteSubtitle(site);
            const mobileCardStyle = isMobile
                ? 'border-color: rgba(2,132,199,.35); background: rgba(14,165,233,.08);'
                : 'border-color: rgba(2,132,199,.22);';
            html += `
                <div class="site-item services-site-card border-2 border-gray-200 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg group flex items-start gap-3 shadow-sm" data-site-id="${site.id}" dir="ltr" style="${mobileCardStyle}">
                    ${isAiSite ? '' : `
                    <div class="${actionWrapClass}">
                        <button class="edit-site-btn w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md" title="تعديل" data-site-id="${site.id}">
                            <i class="ri-edit-line text-base"></i>
                        </button>
                        <button class="delete-site-btn w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md" title="حذف" data-site-id="${site.id}">
                            <i class="ri-delete-bin-line text-base"></i>
                        </button>
                    </div>
                    `}

                    <div class="flex items-center gap-3 site-content flex-1 min-w-0" dir="rtl">
                        <div class="services-site-icon w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300" style="background:${st.gradientStyle || '#1f2937'};">
                            <i class="${st.icon} text-white text-xl"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="site-title text-base font-bold text-indigo-800 mb-1">${site.name}</h4>
                            ${subtitle ? `<p class="site-subtitle ${isAiSite ? 'site-subtitle-ai ' : ''}text-xs ${isAiSite ? 'text-sky-700' : 'text-gray-500'} line-clamp-2">${subtitle}</p>` : ''}
                            ${isAiSite ? `
                            <p class="ai-card-status hidden text-[11px] text-sky-700 mt-2 flex items-center gap-2">
                                <i class="ri-loader-4-line animate-spin"></i>
                                <span>انتظر قليلاً...</span>
                            </p>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    list.innerHTML = html;

    attachSiteItemListeners(sites);

    try { setupServicesScrollBox(); } catch (_) { }
}

function attachServicesListeners() {
    const addBtn = document.getElementById('add-site-btn');
    const nameInput = document.getElementById('service-site-name');
    const urlInput = document.getElementById('service-site-url');
    const searchInput = document.getElementById('services-search-input');
    const sortSelect = document.getElementById('services-sort-select');
    const createWordBtn = document.getElementById('create-word-template-btn');
    const templateSettingsBtn = document.getElementById('document-template-settings-btn');

    const openTemplateSettingsDialog = async () => {
        try {
            if (!__servicesIsDesktopApp() || !window.electronAPI) {
                try { if (typeof showToast === 'function') showToast('الميزة متاحة على نسخة الكمبيوتر فقط', 'info'); } catch (_) { }
                return;
            }
            if (typeof window.electronAPI.getDocumentTemplateStatus !== 'function'
                || typeof window.electronAPI.selectDocumentTemplateDocx !== 'function'
                || typeof window.electronAPI.resetDocumentTemplateDocx !== 'function') {
                try { if (typeof showToast === 'function') showToast('تعذر فتح إعدادات القالب', 'error'); } catch (_) { }
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-5 max-w-md w-full mx-4 shadow-2xl">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-bold text-gray-800">إعدادات القالب</h3>
                        <button id="tpl-close" class="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center" title="إغلاق">
                            <i class="ri-close-line text-xl"></i>
                        </button>
                    </div>
                    <p id="tpl-status" class="text-sm text-gray-600 mb-4">جاري التحميل...</p>
                    <div class="flex flex-col gap-2">
                        <button id="tpl-select" class="w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm" style="background:#1e3a8a;color:#fff;border:1px solid rgba(15,23,42,.12);">
                            <i class="ri-upload-2-line"></i>
                            تعيين قالب افتراضي
                        </button>
                        <button id="tpl-reset" class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium flex items-center justify-center gap-2 text-sm border border-gray-200">
                            <i class="ri-refresh-line"></i>
                            إرجاع القالب الأصلي
                        </button>
                    </div>
                </div>
            `;

            const close = () => { try { document.body.removeChild(modal); } catch (_) { } };
            document.body.appendChild(modal);

            const statusEl = modal.querySelector('#tpl-status');
            const setStatus = (isCustom) => {
                if (!statusEl) return;
                statusEl.textContent = isCustom ? 'القالب الحالي: مخصص' : 'القالب الحالي: افتراضي';
            };

            try {
                const st = await window.electronAPI.getDocumentTemplateStatus();
                setStatus(!!(st && st.success && st.isCustom));
            } catch (_) {
                if (statusEl) statusEl.textContent = 'تعذر قراءة حالة القالب';
            }

            const closeBtn = modal.querySelector('#tpl-close');
            if (closeBtn) closeBtn.addEventListener('click', close);
            modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

            const selectBtn = modal.querySelector('#tpl-select');
            if (selectBtn) {
                try {
                    const baseBg = '#1e3a8a';
                    const hoverBg = '#1d4ed8';
                    selectBtn.addEventListener('mouseenter', () => { try { selectBtn.style.background = hoverBg; } catch (_) { } });
                    selectBtn.addEventListener('mouseleave', () => { try { selectBtn.style.background = baseBg; } catch (_) { } });
                } catch (_) { }
                selectBtn.addEventListener('click', async () => {
                    try {
                        const res = await window.electronAPI.selectDocumentTemplateDocx();
                        if (res && res.success) {
                            setStatus(true);
                            try { if (typeof showToast === 'function') showToast('تم تعيين القالب الافتراضي', 'success'); } catch (_) { }
                        } else if (res && res.canceled) {
                            return;
                        } else {
                            try { if (typeof showToast === 'function') showToast('تعذر تعيين القالب', 'error'); } catch (_) { }
                        }
                    } catch (_) {
                        try { if (typeof showToast === 'function') showToast('تعذر تعيين القالب', 'error'); } catch (_) { }
                    }
                });
            }

            const resetBtn = modal.querySelector('#tpl-reset');
            if (resetBtn) {
                resetBtn.addEventListener('click', async () => {
                    try {
                        const res = await window.electronAPI.resetDocumentTemplateDocx();
                        if (res && res.success) {
                            setStatus(false);
                            try { if (typeof showToast === 'function') showToast('تم إرجاع القالب الأصلي', 'success'); } catch (_) { }
                        } else {
                            try { if (typeof showToast === 'function') showToast('تعذر إرجاع القالب', 'error'); } catch (_) { }
                        }
                    } catch (_) {
                        try { if (typeof showToast === 'function') showToast('تعذر إرجاع القالب', 'error'); } catch (_) { }
                    }
                });
            }
        } catch (_) { }
    };

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const name = String(nameInput ? nameInput.value : '').trim();
            const urlRaw = String(urlInput ? urlInput.value : '').trim();
            const url = __servicesNormalizeUrl(urlRaw);

            if (!name) {
                try { if (typeof showToast === 'function') showToast('يرجى إدخال اسم الموقع', 'error'); } catch (_) { }
                try { if (nameInput) nameInput.focus(); } catch (_) { }
                return;
            }
            if (!url) {
                try { if (typeof showToast === 'function') showToast('يرجى إدخال الرابط', 'error'); } catch (_) { }
                try { if (urlInput) urlInput.focus(); } catch (_) { }
                return;
            }

            const sites = await __servicesLoadSitesRaw();
            const id = String(Date.now()) + Math.random().toString(16).slice(2);
            sites.push({ id, name, url });
            await __servicesSaveSites(sites);

            try {
                if (nameInput) nameInput.value = '';
                if (urlInput) urlInput.value = '';
            } catch (_) { }

            try {
                const viewType = __servicesIsMobile() ? 'list' : 'grid';
                __servicesLastSites = sites;
                __servicesRenderSites(viewType);
            } catch (_) { }

            try {
                if (typeof showToast === 'function') showToast('تمت الإضافة', 'success');
            } catch (_) { }

            try {
                const sidebarToggle = document.getElementById('sidebar-toggle');
                if (sidebarToggle && __servicesIsMobile()) sidebarToggle.checked = false;
            } catch (_) { }
        });
    }

    if (createWordBtn) {
        createWordBtn.addEventListener('click', async () => {
            try {
                if (!__servicesIsDesktopApp() || !window.electronAPI || typeof window.electronAPI.copyTemplateDocxToDesktop !== 'function') {
                    try { if (typeof showToast === 'function') showToast('الميزة متاحة على نسخة الكمبيوتر فقط', 'info'); } catch (_) { }
                    return;
                }

                const result = await window.electronAPI.copyTemplateDocxToDesktop();
                if (result && result.success) {
                    try { if (typeof showToast === 'function') showToast('تم إنشاء المستند على سطح المكتب', 'success'); } catch (_) { }
                } else {
                    try { if (typeof showToast === 'function') showToast('تعذر إنشاء المستند', 'error'); } catch (_) { }
                }
            } catch (_) {
                try { if (typeof showToast === 'function') showToast('تعذر إنشاء المستند', 'error'); } catch (_) { }
            }
        });
    }

    if (templateSettingsBtn) {
        templateSettingsBtn.addEventListener('click', openTemplateSettingsDialog);
    }

    try {
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    try { if (urlInput) urlInput.focus(); } catch (_) { }
                }
            });
        }
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    try { if (addBtn) addBtn.click(); } catch (_) { }
                }
            });
        }
    } catch (_) { }

    try {
        if (searchInput) {
            searchInput.value = String((__servicesUiState && __servicesUiState.query) || '');
            searchInput.addEventListener('input', () => {
                try { __servicesUiState.query = String(searchInput.value || ''); } catch (_) { }
                try { __servicesRenderSites(); } catch (_) { }
            });
        }
        if (sortSelect) {
            sortSelect.value = String((__servicesUiState && __servicesUiState.sort) || 'added_oldest');
            sortSelect.addEventListener('change', () => {
                try { __servicesUiState.sort = String(sortSelect.value || 'added_oldest'); } catch (_) { }
                try { __servicesRenderSites(); } catch (_) { }
            });
        }
    } catch (_) { }

    try {
        const toggleBtn = document.getElementById('toggle-viewer-full');
        const sidebarEl = document.getElementById('services-sidebar');
        if (toggleBtn && sidebarEl) {
            toggleBtn.addEventListener('click', async () => {
                const enteringFull = !document.fullscreenElement;
                try {
                    if (enteringFull) {
                        await enterServicesFullscreen();
                    } else {
                        await exitServicesFullscreen();
                    }
                } catch (_) { }
                try { updateServicesToggleViewerButton(); } catch (_) { }
                try { setupServicesScrollBox(); } catch (_) { }
                const activeWv = document.querySelector('#webviews-container webview:not(.hidden)');
                if (activeWv) { try { fitServicesWebviewToWidth(activeWv); } catch (_) { } }
            });
        }
    } catch (_) { }

    try {
        requestAnimationFrame(() => {
            try { setupServicesScrollBox(); } catch (_) { }
            const activeWv = document.querySelector('#webviews-container webview:not(.hidden)');
            if (activeWv) { try { fitServicesWebviewToWidth(activeWv); } catch (_) { } }
            try { updateServicesToggleViewerButton(); } catch (_) { }
        });
        window.addEventListener('resize', setupServicesScrollBox);
    } catch (_) { }
}

let __servicesAiExportInProgress = false;

const __servicesAiExportStores = [
    'clients',
    'opponents',
    'cases',
    'sessions',
    'administrative',
    'clerkPapers',
    'expertSessions'
];

const __servicesAiRelationHints = [
    'cases.clientId -> clients.id',
    'cases.opponentId -> opponents.id',
    'sessions.caseId -> cases.id',
    'administrative.clientId -> clients.id',
    'clerkPapers.clientId -> clients.id',
    'clerkPapers.caseId -> cases.id',
    'expertSessions.clientId -> clients.id'
];

function __servicesAiCompactValue(value) {
    try {
        if (value === null || value === undefined || value === '') return undefined;
        if (typeof value === 'string') {
            const cleaned = value.replace(/\s+/g, ' ').trim();
            return cleaned || undefined;
        }
        if (Array.isArray(value)) {
            const arr = value.map(__servicesAiCompactValue).filter((item) => item !== undefined);
            return arr.length ? arr : undefined;
        }
        if (typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach((key) => {
                const compacted = __servicesAiCompactValue(value[key]);
                if (compacted !== undefined) out[key] = compacted;
            });
            return Object.keys(out).length ? out : undefined;
        }
        return value;
    } catch (_) {
        return value;
    }
}

function __servicesAiToColumnarTable(inputRows) {
    const rows = Array.isArray(inputRows) ? inputRows : [];
    const columnsSet = new Set();

    for (const row of rows) {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
            for (const key of Object.keys(row)) columnsSet.add(key);
        } else {
            columnsSet.add('_value');
        }
    }

    const columns = Array.from(columnsSet);
    const toGroup = (key) => {
        const k = String(key || '');
        if (k === 'id') return 0;
        if (/Id$/i.test(k)) return 1;
        return 2;
    };
    columns.sort((a, b) => {
        const ga = toGroup(a);
        const gb = toGroup(b);
        if (ga !== gb) return ga - gb;
        return String(a).localeCompare(String(b));
    });

    const outRows = rows.map((row) => {
        const obj = (row && typeof row === 'object' && !Array.isArray(row)) ? row : { _value: row };
        return columns.map((col) => {
            const v = obj[col];
            return v === undefined ? null : v;
        });
    });

    return { columns, rows: outRows };
}

function __servicesSetAiCardLoading(isLoading, statusText) {
    try {
        const cards = document.querySelectorAll('.site-item[data-site-id="3"]');
        cards.forEach((card) => {
            try {
                card.classList.toggle('opacity-80', !!isLoading);
                card.classList.toggle('pointer-events-none', !!isLoading);
            } catch (_) { }

            const hint = card.querySelector('.ai-card-hint');
            const status = card.querySelector('.ai-card-status');
            if (hint) hint.classList.toggle('hidden', !!isLoading);
            if (status) status.classList.toggle('hidden', !isLoading);
            const label = status ? status.querySelector('span') : null;
            if (label) label.textContent = String(statusText || 'انتظر قليلاً...');
        });
    } catch (_) { }
}

async function __servicesBuildAiExportPayload() {
    try {
        if (typeof initDB === 'function') {
            await initDB();
        }
    } catch (_) { }

    const counts = {};
    const data = {};

    // Keep tables in dependency-friendly order to help models follow relations.
    const exportStores = __servicesAiExportStores.slice();
    const storeOrder = new Map(exportStores.map((name, idx) => [name, idx]));
    const desiredTableOrder = [
        'clients',
        'opponents',
        'cases',
        'sessions',
        'administrative',
        'clerkPapers',
        'expertSessions'
    ];
    desiredTableOrder.forEach((name, idx) => {
        if (storeOrder.has(name)) storeOrder.set(name, idx);
    });
    exportStores.sort((a, b) => (storeOrder.get(a) ?? 999) - (storeOrder.get(b) ?? 999));

    for (const storeName of exportStores) {
        let rows = [];
        try {
            rows = typeof getAll === 'function' ? await getAll(storeName) : [];
        } catch (_) {
            rows = [];
        }

        const rawRows = Array.isArray(rows) ? rows : [];
        data[storeName] = __servicesAiToColumnarTable(rawRows);
        counts[storeName] = rawRows.length;
    }

    const instructions = [
        'Use the provided tables and relation hints only.',
        'Tables are columnar: rows[i][j] matches columns[j].',
        'If a fact is not present in the data, say it is unavailable.',
        'Link records through ids before making legal summaries.',
        'Relations : clients -> opponents -> cases -> sessions -> administrative -> clerkPapers -> expertSessions',
        '',
        'المطلوب الآن:',
        '- هذه المحادثة خاصة ببيانات مكتبي " بيانات المحامى الرقمى " ولاتذكر كلمة LawyerAppDB  .',
        '- اعطني ملخصًا منظمًا ومختصر جدا للملف الحالي وفقا للاتى :',
        '(عدد الموكلين/عدد القضايا المتداولة /عدد القضايا المؤرشفة/انواع القضايا وعدد كل منها /عدد الجلسات السابقه /عدد الجلسات القادمة/،بدون تفصيل)',
        '- لاتظهر للمستخدم فى الاحصائيات الحاليه انه تم استبعاد شئ او ان النتيجة وفقا لتعليمات مخصصة او شئ من هذا القبيل لان الرد يجب ان يكون نظيف .',
        '',
        '- المطلوب عند كتابة الدعاوى والمذكرات والاستئنافات …، عندما يطلب منك المستخدم الكتابة والصياغه.',
        ' إلتزم بالقوانين المصرية الحديثه الحاليه وفقا للتاريخ والوقت الحالى فى كتابة الدعاوى والمذكرات وغيرها من المستندات الرسمية عند الحاجه لها او عند الاستشهاد بها فى الدعاوى والمذكرات والاستئنافات واذكر رابط/اسم المصدر الخاص بالمادة القانونيه او النص القانونى المستخدم او حكم النقض عند الحاجه لها او عند الاستشهاد بها ايضا ولا تكذب او تخترع مواد قانونيه غير موجوده .',
        'نهاية التعليمات.'
    ];

    return {
        prompt: instructions.join('\n'),
        instructions,
        exportType: 'lawyer-app-ai-context',
        tablesFormat: 'columnar-v1',
        generatedAt: new Date().toISOString(),
        database: 'LawyerAppDB',
        includedStores: exportStores.slice(),
        excludedStores: ['accounts', 'settings', 'users'],
        relationHints: __servicesAiRelationHints.slice(),
        counts,
        data
    };
}

async function __servicesDownloadAiDataFile(jsonString) {
    try {
        // نسخة الكمبيوتر: ما نحفظوش على سطح المكتب. نخليه في مجلد البرنامج الداخلي عشان زر "قاعدة بيانات المكتب" يسحبه.
        if (__servicesIsDesktopApp() && window.electronAPI && typeof window.electronAPI.saveJsonToAiCache === 'function') {
            const result = await window.electronAPI.saveJsonToAiCache(jsonString, 'gemini.json');
            return {
                success: !!(result && result.success),
                path: result && result.path ? result.path : '',
                bytes: result && result.bytes ? Number(result.bytes) || 0 : 0
            };
        }

        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'gemini.json';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            try { URL.revokeObjectURL(blobUrl); } catch (_) { }
            try { link.remove(); } catch (_) { }
        }, 1200);
        return { success: true, path: '', bytes: blob.size || 0 };
    } catch (_) {
        return { success: false, path: '', bytes: 0 };
    }
}

async function __servicesOpenGeminiUrl() {
    const geminiUrl = 'https://gemini.google.com';
    const isElectron = __servicesIsDesktopApp() || (navigator.userAgent && navigator.userAgent.includes('Electron'));

    if (isElectron && window.electronAPI && typeof window.electronAPI.openInternalUrl === 'function') {
        try {
            const result = await window.electronAPI.openInternalUrl(geminiUrl, 'Gemini - المساعد الذكي');
            if (result && result.success) return;
        } catch (_) { }

        // داخل Electron: ممنوع نقلب صفحة الخدمات لرابط خارجي (بيعمل شاشة بيضاء خصوصاً وقت الأوفلاين)
        try { if (typeof showToast === 'function') showToast('تعذر فتح Gemini حالياً. تأكد من الإنترنت.', 'error'); } catch (_) { }
        return;
    }

    try {
        window.location.href = geminiUrl;
    } catch (_) {
        try { window.open(geminiUrl, '_blank'); } catch (_) { }
    }
}

async function __servicesStartAiAssistantFlow() {
    if (__servicesAiExportInProgress) return;

    __servicesAiExportInProgress = true;
    __servicesSetAiCardLoading(true, 'انتظر قليلاً...');

    try {
        const payload = await __servicesBuildAiExportPayload();
        const jsonString = JSON.stringify(payload);
        const saveResult = await __servicesDownloadAiDataFile(jsonString);
        if (!saveResult || !saveResult.success) throw new Error('download_failed');

        try { if (typeof showToast === 'function') showToast('تم حفظ قاعدة البيانات.. جاري فتح المساعد الذكي', 'success'); } catch (_) { }

        __servicesSetAiCardLoading(true, 'جارٍ الفتح...');
        await new Promise((resolve) => setTimeout(resolve, __servicesIsDesktopApp() ? 800 : 950));
        await __servicesOpenGeminiUrl();
    } catch (_) {
        try {
            alert('تعذر فتح المساعد الذكي.');
        } catch (_) { }
    } finally {
        __servicesAiExportInProgress = false;
        __servicesSetAiCardLoading(false);
    }
}

let __aiWidgetIframe = null;
async function openAiChatWidget() {
    return __servicesStartAiAssistantFlow();
    try {
        if (typeof showToast === 'function') {
            showToast('ستتوفر هذه الميزة بمجرد الانتهاء من تطويرها', 'info');
        } else {
            alert('ستتوفر هذه الميزة بمجرد الانتهاء من تطويرها');
        }
    } catch (_) { }
    return;

    // مسار Gemini الحالي متساب مؤقتًا لحد ما يكتمل التطوير
    const geminiUrl = 'https://gemini.google.com';
    const isElectron = __servicesIsDesktopApp() || (navigator.userAgent && navigator.userAgent.includes('Electron'));
    
    if (isElectron && window.electronAPI && typeof window.electronAPI.openInternalUrl === 'function') {
        try {
            const result = await window.electronAPI.openInternalUrl(geminiUrl, 'Gemini - المساعد الذكي');
            if (result && result.success) return;
        } catch (_) { }
    }
    
    try {
        window.open(geminiUrl, '_blank');
    } catch (_) {
        try { window.location.href = geminiUrl; } catch (_) { }
    }
}

function attachSiteItemListeners(sites) {
    const byId = (id) => {
        try { return (sites || []).find(s => String(s.id) === String(id)); } catch (_) { return null; }
    };

    document.querySelectorAll('.site-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('button') : null;
            if (btn && (btn.classList.contains('open-site-btn') || btn.classList.contains('delete-site-btn') || btn.classList.contains('edit-site-btn'))) return;
            const id = item.getAttribute('data-site-id');
            const site = byId(id);
            if (!site) return;
            // زر الذكاء الاصطناعي → فتح الشات كنافذة منبثقة
            if (String(site.id) === '3') {
                openAiChatWidget();
                return;
            }
            await openServiceUrl(site.url, site.name);
        });
    });

    document.querySelectorAll('.open-site-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-site-id');
            const site = byId(id);
            if (!site) return;
            if (String(site.id) === '3') {
                openAiChatWidget();
                return;
            }
            await openServiceUrl(site.url, site.name);
        });
    });

    document.querySelectorAll('.delete-site-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-site-id');
            const site = byId(id);
            if (!site) return;
            showDeleteSiteDialog(site);
        });
    });

    document.querySelectorAll('.edit-site-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-site-id');
            const site = byId(id);
            if (!site) return;
            showEditSiteDialog(site);
        });
    });
}

async function __servicesOpenInternalWindow(url, title) {
    try {
        if (!window.electronAPI || typeof window.electronAPI.openInternalUrl !== 'function') return false;
        const result = await window.electronAPI.openInternalUrl(url, title);
        return !!(result && result.success);
    } catch (_) {
        return false;
    }
}

async function openServiceUrl(url, title) {
    const urls = __servicesSplitMultiUrl(url);
    if (!urls.length) return;

    const isElectron = __servicesIsDesktopApp() || (navigator.userAgent && navigator.userAgent.includes('Electron'));
    const useExternal = await __servicesShouldUseExternalBrowser();

    // Multi-url entries are always opened in external browser.
    const forceExternal = urls.length > 1;

    // Desktop app: always open in the internal "Digital Lawyer" browser window.
    // Stop here so we never fall back to window.open (which can show a small blank popup when offline).
    if (isElectron) {
        let anyOpened = false;
        for (const u of urls) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await __servicesOpenInternalWindow(u, String(title || u));
            if (ok) anyOpened = true;
        }
        if (!anyOpened) {
            try { if (typeof showToast === 'function') showToast('تعذر فتح الرابط داخل المتصفح الداخلي.', 'error'); } catch (_) { }
        }
        return;
    }

    if (!isElectron && (useExternal || forceExternal)) {
        for (const u of urls) {
            try { window.open(u, '_blank'); } catch (_) { }
        }
        return;
    }

    if (!isElectron && !useExternal && !forceExternal) {
        try { window.location.href = urls[0]; } catch (_) { }
        return;
    }

    if (isElectron && (useExternal || forceExternal)) {
        if (window.electronAPI && window.electronAPI.openExternalUrl) {
            for (const u of urls) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await window.electronAPI.openExternalUrl(u);
                } catch (_) {
                    try { window.open(u, '_blank'); } catch (_) { }
                }
            }
            try { if (typeof showToast === 'function') showToast('تم فتح الرابط في المتصفح الخارجي', 'success'); } catch (_) { }
        } else {
            for (const u of urls) {
                try { window.open(u, '_blank'); } catch (_) { }
            }
        }
        return;
    }

    if (isElectron && !forceExternal) {
        if (await __servicesOpenInternalWindow(urls[0], String(title || urls[0]))) {
            return;
        }
        try { if (typeof showToast === 'function') showToast('تعذر فتح الرابط داخل النافذة الداخلية', 'error'); } catch (_) { }
    }

    try { window.open(urls[0], '_blank'); } catch (_) { }
}

function showDeleteSiteDialog(site) {
    if (__servicesIsAiSite(site)) {
        try { if (typeof showToast === 'function') showToast('زر الذكاء الاصطناعي ثابت ومش بيتحذف', 'info'); } catch (_) { }
        return;
    }
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div class="text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="ri-delete-bin-line text-red-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
                <p class="text-gray-600 mb-6">هل أنت متأكد من حذف الموقع "<strong>${String(site.name || '')}</strong>"؟</p>
                <div class="flex gap-3 justify-center">
                    <button id="confirm-delete" class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all">حذف</button>
                    <button id="cancel-delete" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold transition-all">إلغاء</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#confirm-delete').addEventListener('click', async () => {
        const sites = await __servicesLoadSitesRaw();
        const next = sites.filter(s => String(s.id) !== String(site.id));
        await __servicesSaveSites(next);
        const viewType = __servicesIsMobile() ? 'list' : 'grid';
        __servicesLastSites = next;
        __servicesRenderSites(viewType);
        document.body.removeChild(modal);
        try { if (typeof showToast === 'function') showToast('تم الحذف', 'success'); } catch (_) { }
    });

    modal.querySelector('#cancel-delete').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    });
}

function showEditSiteDialog(site) {
    if (__servicesIsAiSite(site)) {
        try { if (typeof showToast === 'function') showToast('زر الذكاء الاصطناعي الداخلي مش رابط خارجي للتعديل', 'info'); } catch (_) { }
        return;
    }
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="ri-edit-line text-blue-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">تعديل الموقع</h3>
                <input type="text" id="edit-site-name" value="${String(site.name || '').replace(/"/g, '&quot;')}" class="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right mb-3" placeholder="الاسم">
                <input type="text" id="edit-site-url" value="${String(site.url || '').replace(/"/g, '&quot;')}" class="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right mb-4" placeholder="الرابط" dir="ltr">
                <div class="flex gap-3 justify-center">
                    <button id="confirm-edit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all">حفظ</button>
                    <button id="cancel-edit" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold transition-all">إلغاء</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector('#edit-site-name');
    const urlInput = modal.querySelector('#edit-site-url');

    try { nameInput.focus(); nameInput.select(); } catch (_) { }

    const save = async () => {
        const newName = String(nameInput ? nameInput.value : '').trim();
        const newUrl = __servicesNormalizeUrl(String(urlInput ? urlInput.value : '').trim());
        if (!newName) {
            try { if (typeof showToast === 'function') showToast('يرجى إدخال الاسم', 'error'); } catch (_) { }
            try { nameInput.focus(); } catch (_) { }
            return;
        }
        if (!newUrl) {
            try { if (typeof showToast === 'function') showToast('يرجى إدخال الرابط', 'error'); } catch (_) { }
            try { urlInput.focus(); } catch (_) { }
            return;
        }

        const sites = await __servicesLoadSitesRaw();
        const next = sites.map(s => {
            if (String(s.id) === String(site.id)) return { id: s.id, name: newName, url: newUrl };
            return s;
        });
        await __servicesSaveSites(next);
        const viewType = __servicesIsMobile() ? 'list' : 'grid';
        __servicesLastSites = next;
        __servicesRenderSites(viewType);
        document.body.removeChild(modal);
        try { if (typeof showToast === 'function') showToast('تم الحفظ', 'success'); } catch (_) { }
    };

    modal.querySelector('#confirm-edit').addEventListener('click', save);
    modal.querySelector('#cancel-edit').addEventListener('click', () => document.body.removeChild(modal));

    try {
        nameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { try { urlInput.focus(); } catch (_) { } } });
        urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') save(); });
    } catch (_) { }

    modal.addEventListener('click', (e) => { if (e.target === modal) document.body.removeChild(modal); });
}

function setupServicesScrollBox() {
    try {
        const viewportH = window.innerHeight;

        const sidebar = document.getElementById('services-sidebar');
        if (sidebar) {
            const topS = sidebar.getBoundingClientRect().top;
            const targetHS = Math.max(240, viewportH - topS - 12);
            sidebar.style.height = targetHS + 'px';
            sidebar.style.maxHeight = targetHS + 'px';
            sidebar.style.overflowY = 'auto';
            sidebar.style.overscrollBehavior = 'contain';
            sidebar.style.overflowX = 'hidden';
            sidebar.style.borderBottomLeftRadius = '16px';
            sidebar.style.borderBottomRightRadius = '16px';
        }

        const list = document.getElementById('services-list');
        if (list) {
            const top = list.getBoundingClientRect().top;
            const targetH = Math.max(240, viewportH - top - 12);
            list.style.height = targetH + 'px';
            list.style.maxHeight = targetH + 'px';
            list.style.overflowY = 'auto';
        }
        const viewer = document.getElementById('site-viewer');
        if (viewer) {
            const top2 = viewer.getBoundingClientRect().top;
            const targetH2 = Math.max(240, viewportH - top2 - 12);
            viewer.style.height = targetH2 + 'px';
            viewer.style.maxHeight = targetH2 + 'px';
            const header = viewer.querySelector(':scope > div');
            const toolbarH = header ? header.offsetHeight : 0;
            const contentH = targetH2 - toolbarH;
            const wrap = document.getElementById('webviews-container');
            if (wrap) {
                wrap.style.height = (contentH > 0 ? contentH : targetH2) + 'px';
                const webviews = wrap.querySelectorAll('webview');
                webviews.forEach(wv => { wv.style.height = (contentH > 0 ? contentH : targetH2) + 'px'; });
            }
        }
    } catch (_) { }
}

function createServicesTab(title, url) {
    // Desktop app: افتح دايمًا في "متصفح المحامي الرقمي" (نافذة Electron الداخلية)، من غير تبويبات webview جوه صفحة الخدمات
    try {
        if (__servicesIsDesktopApp() && window.electronAPI && typeof window.electronAPI.openInternalUrl === 'function') {
            Promise.resolve(__servicesOpenInternalWindow(url, title)).catch(() => { });
            return;
        }
    } catch (_) { }

    const tabsEl = document.getElementById('site-tabs');
    const wrap = document.getElementById('webviews-container');
    if (!tabsEl || !wrap) return;

    const tabId = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const isTabStillOpen = () => {
        try {
            return !!document.querySelector(`#site-tabs [data-tab-id="${tabId}"]`) && !!wv && !!wv.isConnected && wv.__servicesClosed !== true;
        } catch (_) {
            return false;
        }
    };
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'tab-pill inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50';
    tabBtn.dataset.tabId = tabId;
    tabBtn.innerHTML = `<span class="truncate max-w-[160px]">${String(title || url)}</span><i class="ri-close-line text-xs"></i>`;
    tabBtn.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('ri-close-line')) {
            e.stopPropagation();
            try { closeServicesTab(tabId); } catch (_) { }
            return;
        }
        activateServicesTab(tabId);
    });
    tabsEl.appendChild(tabBtn);

    const wv = document.createElement('webview');
    wv.className = 'site-webview absolute inset-0 w-full h-full hidden';
    wv.setAttribute('allowpopups', '');
    wv.dataset.tabId = tabId;
    wv.__servicesClosed = false;
    wv.__servicesRetryTimer = null;
    wv.src = url;

    wv.addEventListener('did-fail-load', async (e) => {
        try {
            if (!isTabStillOpen()) return;
            const code = (e && typeof e.errorCode === 'number') ? e.errorCode : 0;
            if (code === -101 || code === -105 || code === -137) {
                const attempt = parseInt(wv.getAttribute('data-retry') || '0', 10) || 0;
                if (attempt < 2) {
                    wv.setAttribute('data-retry', String(attempt + 1));
                    try { if (wv.__servicesRetryTimer) clearTimeout(wv.__servicesRetryTimer); } catch (_) { }
                    wv.__servicesRetryTimer = setTimeout(() => {
                        try {
                            if (!isTabStillOpen()) return;
                            wv.reload();
                        } catch (_) { }
                    }, 400);
                } else {
                    const openedInsideWindow = await __servicesOpenInternalWindow(url, title);
                    if (!isTabStillOpen()) return;
                    if (openedInsideWindow) {
                        try { closeServicesTab(tabId); } catch (_) { }
                    } else {
                        try { if (typeof showToast === 'function') showToast('تعذر تحميل الموقع داخل التطبيق. حاول لاحقاً.', 'error'); } catch (_) { }
                    }
                }
            }
        } catch (_) { }
    });

    const onDomReady = () => {
        try {
            wv.insertCSS(`
                html, body { width: 100% !important; max-width: 100vw !important; min-width: 0 !important; overflow-x: hidden !important; }
                *, *::before, *::after { box-sizing: border-box !important; }
                img, video, canvas, svg, iframe { max-width: 100% !important; height: auto !important; }
                table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
                td, th { word-wrap: break-word !important; overflow-wrap: anywhere !important; }
                pre { white-space: pre-wrap !important; }
                [class*="container"], [class*="content"], [class*="wrapper"] { max-width: 100% !important; min-width: 0 !important; overflow-x: hidden !important; }
                @media (max-width: 1024px) {
                    [class*="sidebar" i] { position: static !important; width: 100% !important; }
                    [style*="position:fixed" i] { max-width: 100vw !important; }
                }
            `);
        } catch (_) { }
        try {
            wv.executeJavaScript(`(function(){ try { var m = document.querySelector('meta[name="viewport"]') || document.createElement('meta'); m.name = 'viewport'; m.content = 'width=device-width, initial-scale=1, maximum-scale=1'; if (!m.parentNode) document.head.appendChild(m); } catch(e){} })();`, false);
        } catch (_) { }
    };

    const onDidFrameFinish = () => { try { fitServicesWebviewToWidth(wv); } catch (_) { } };
    const onDidNavigate = () => { try { fitServicesWebviewToWidth(wv); } catch (_) { } };
    const onDidNavigateInPage = () => { try { fitServicesWebviewToWidth(wv); } catch (_) { } };

    wv.addEventListener('dom-ready', onDomReady, { once: true });
    wv.addEventListener('did-frame-finish-load', onDidFrameFinish);
    wv.addEventListener('did-navigate', onDidNavigate);
    wv.addEventListener('did-navigate-in-page', onDidNavigateInPage);

    wrap.appendChild(wv);
    activateServicesTab(tabId);
}

function fitServicesWebviewToWidth(wv) {
    try {
        const apply = () => {
            try {
                wv.executeJavaScript(`(function(){
                    try {
                        var sw = Math.max(document.documentElement.scrollWidth || 0, (document.body && document.body.scrollWidth) || 0);
                        var vw = window.innerWidth || document.documentElement.clientWidth || 0;
                        var factor = 1;
                        if (sw > vw && sw > 0) {
                            factor = Math.max(0.5, Math.min(1, vw / sw));
                        }
                        factor;
                    } catch(e) { return 1; }
                })();`, true).then(function (factor) {
                    if (typeof factor === 'number' && !isNaN(factor)) {
                        try { wv.setZoomFactor(factor); } catch (e) { }
                    }
                }).catch(function () { });
            } catch (_) { }
        };
        apply();
        setTimeout(apply, 300);
        setTimeout(apply, 1000);
    } catch (_) { }
}

function activateServicesTab(tabId) {
    const tabsEl = document.getElementById('site-tabs');
    const wrap = document.getElementById('webviews-container');
    if (!tabsEl || !wrap) return;

    Array.from(tabsEl.children).forEach(btn => {
        if (btn.dataset.tabId === tabId) {
            btn.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-indigo-600', 'text-white', 'border-transparent', 'shadow');
            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
        } else {
            btn.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-indigo-600', 'text-white', 'border-transparent', 'shadow');
            btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        }
    });

    const webviews = wrap.querySelectorAll('webview');
    webviews.forEach(wv => {
        if (wv.dataset.tabId === tabId) wv.classList.remove('hidden');
        else wv.classList.add('hidden');
    });
}

function closeServicesTab(tabId) {
    const tabsEl = document.getElementById('site-tabs');
    const wrap = document.getElementById('webviews-container');
    const list = document.getElementById('services-list');
    const viewer = document.getElementById('site-viewer');
    if (!tabsEl || !wrap) return;

    const btn = Array.from(tabsEl.children).find(b => b.dataset.tabId === tabId);
    if (btn) tabsEl.removeChild(btn);

    const wv = wrap.querySelector(`webview[data-tab-id="${tabId}"]`);
    if (wv) {
        try { wv.__servicesClosed = true; } catch (_) { }
        try {
            if (wv.__servicesRetryTimer) {
                clearTimeout(wv.__servicesRetryTimer);
                wv.__servicesRetryTimer = null;
            }
        } catch (_) { }
        try { wv.replaceWith(wv.cloneNode(true)); } catch (_) { }
        const toRemove = wrap.querySelector(`webview[data-tab-id="${tabId}"]`);
        if (toRemove) wrap.removeChild(toRemove);
    }

    const remaining = Array.from(tabsEl.children);
    if (remaining.length === 0) {
        if (viewer && list) {
            viewer.classList.add('hidden');
            list.classList.remove('hidden');
            setupServicesScrollBox();
        }
        try { exitServicesFullscreen(); } catch (_) { }
        try { document.body.style.overflow = ''; } catch (_) { }
    } else {
        const hasActive = Array.from(wrap.querySelectorAll('webview')).some(el => !el.classList.contains('hidden'));
        if (!hasActive) {
            const next = remaining[remaining.length - 1];
            if (next) activateServicesTab(next.dataset.tabId);
        }
    }
}

async function enterServicesFullscreen() {
    try {
        const viewer = document.getElementById('site-viewer');
        const header = document.querySelector('header');
        const sidebar = document.getElementById('services-sidebar');
        const wrap = document.getElementById('webviews-container');
        if (header) header.classList.add('hidden');
        if (sidebar) sidebar.classList.add('hidden');
        if (viewer) viewer.style.height = '100vh';
        if (wrap) wrap.style.height = '100vh';
        const activeWv = document.querySelector('#webviews-container webview:not(.hidden)');
        if (activeWv) activeWv.style.height = '100vh';
        try { document.documentElement.requestFullscreen(); } catch (_) { }
    } catch (_) { }
}

async function exitServicesFullscreen() {
    try {
        const header = document.querySelector('header');
        const sidebar = document.getElementById('services-sidebar');
        if (header) header.classList.remove('hidden');
        if (sidebar) sidebar.classList.remove('hidden');
        try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (_) { }
        setupServicesScrollBox();
    } catch (_) { }
}

['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(function (evt) {
    document.addEventListener(evt, function () {
        const isFull = !!document.fullscreenElement;
        if (!isFull) { try { exitServicesFullscreen(); } catch (_) { } }
        try { updateServicesToggleViewerButton(); } catch (_) { }
    });
});

function updateServicesToggleViewerButton() {
    try {
        const toggleBtn = document.getElementById('toggle-viewer-full');
        if (!toggleBtn) return;
        const iconEl = toggleBtn.querySelector('i');
        const textEl = toggleBtn.querySelector('span');
        const isFull = !!document.fullscreenElement;
        if (isFull) {
            if (iconEl) iconEl.className = 'ri-fullscreen-exit-line text-sm';
            if (textEl) textEl.textContent = 'تصغير';
        } else {
            if (iconEl) iconEl.className = 'ri-fullscreen-fill text-sm';
            if (textEl) textEl.textContent = 'تكبير';
        }
    } catch (_) { }
}
