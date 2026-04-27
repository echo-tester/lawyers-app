const searchOptions = [
    { type: 'client', label: 'بحث باسم الموكل', placeholder: 'ادخل اسم الموكل...', inputs: [{ id: 'search-term', type: 'text' }] },
    { type: 'opponent', label: 'بحث باسم الخصم', placeholder: 'ادخل اسم الخصم...', inputs: [{ id: 'search-term', type: 'text' }] },
    { type: 'caseNumber', label: 'بحث برقم الدعوى', inputs: [{ id: 'search-term-number', type: 'text', placeholder: 'رقم الدعوى' }, { id: 'search-term-year', type: 'text', placeholder: 'سنة الدعوى' }] },
    { type: 'inventoryNumber', label: 'بحث برقم الحصر', inputs: [{ id: 'search-term-number', type: 'text', placeholder: 'رقم الحصر' }, { id: 'search-term-year', type: 'text', placeholder: 'سنة الحصر' }] },
    { type: 'poaNumber', label: 'بحث برقم التوكيل', placeholder: 'ادخل رقم التوكيل...', inputs: [{ id: 'search-term', type: 'text' }] }
];

async function __searchOpenClientsMainFolder() {
    try {
        if (!window.electronAPI || !window.electronAPI.openClientsMainFolder) {
            if (typeof showToast === 'function') {
                showToast('هذه الميزة متاحة فقط في تطبيق سطح المكتب', 'info');
            } else {
                alert('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
            }
            return;
        }

        const openFolder = () => {
            try { window.electronAPI.openClientsMainFolder(); } catch (_) { }
        };

        try {
            if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
                const chk = await window.electronAPI.checkClientsPathOnDesktop();
                if (chk && chk.success === true && chk.isOnDesktop === true) {
                    try {
                        if (typeof window.showDesktopPathSafetyWarning === 'function') {
                            window.showDesktopPathSafetyWarning(
                                { path: chk.path, desktop: chk.desktop },
                                { onContinue: () => { try { openFolder(); } catch (_) { } } }
                            );
                        }
                    } catch (_) { }
                    return;
                }
            }
        } catch (_) { }

        openFolder();
    } catch (_) { }
}

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const isDesktopApp = (function () {
            try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
        })();
        if (isDesktopApp) {
            try { document.body && document.body.classList && document.body.classList.remove('low-power'); } catch (_) { }
        }
    } catch (_) { }

    let dbOk = true;
    try {
        await initDB();
    } catch (error) {
        dbOk = false;
        console.error('initDB failed:', error);
    }
    try {
        loadSearchContent();
        setupBackButton();
        try {
            const cid = parseInt(sessionStorage.getItem('openClientDetailsOnSearch') || '0', 10);
            if (cid) {
                sessionStorage.removeItem('openClientDetailsOnSearch');
                setTimeout(() => { try { displayClientEmbedded(cid); } catch (e) { } }, 0);
            }
        } catch (_) { }
        if (!dbOk && typeof showToast === 'function') {
            showToast('تعذر تهيئة قاعدة البيانات. سيتم عرض الواجهة بدون بيانات.', 'warning');
        }
    } catch (error) {
        console.error('Error initializing search page UI:', error);
        if (typeof showToast === 'function') {
            showToast('حدث خطأ في تهيئة الصفحة', 'error');
        } else {
            alert('حدث خطأ في تهيئة الصفحة: ' + (error?.message || error));
        }
    }
});

function loadSearchContent() {
    const container = document.getElementById('search-content-container');
    if (!container) return;

    // تمديد الحاوية لتملأ الشاشة
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
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
    }

    try {
        const cb = document.getElementById('sidebar-toggle');
        if (cb) {
            cb.removeAttribute('aria-hidden');
            cb.setAttribute('aria-hidden', 'false');
            cb.setAttribute('tabindex', '-1');
            if (document.activeElement === cb) cb.blur();
        }
    } catch (e) { }
    try {
        const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
        if (mobileToggle) mobileToggle.style.display = '';
    } catch (e) { }

    const backMain = document.getElementById('back-to-main');
    if (backMain) {
        backMain.classList.remove('hidden');

        const icon = backMain.querySelector('i');
        const span = backMain.querySelector('span');
        if (icon) icon.className = 'ri-home-5-line text-white text-lg';
        if (span) span.textContent = 'الرئيسيه';
        if (backMain._clientBackHandler) {
            backMain.removeEventListener('click', backMain._clientBackHandler);
            backMain._clientBackHandler = null;
            delete backMain.dataset.boundForClient;
        }
    }

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'قائمة الموكلين';

    container.innerHTML = `
        <div class="flex gap-0 h-full min-h-0">
            <div class="search-left-pane search-left-pane-dark w-1/3 space-y-3">
                <div class="search-sidebar-card p-4 rounded-xl border shadow-sm">
                    <div class="mb-4 flex flex-col items-center text-center">
                        <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                            <i class="ri-search-line text-3xl text-white"></i>
                        </div>
                        <h3 class="search-sidebar-heading text-xl font-bold mb-2">البحث بواسطة</h3>
                        <p class="search-sidebar-muted text-xs">اسم الموكل • اسم الخصم • رقم الدعوى • رقم الحصر • رقم الاستئناف</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="relative flex-1">
                            <input type="text" id="quick-search" 
                                   placeholder="ابحث هنا..." 
                                   class="search-sidebar-input w-full p-3 md:p-3 md:text-base text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right shadow-sm transition-colors">
                        </div>

                        <!-- زر الفرز بنفس حجم زر مجلد الموكلين -->
                        <div class="relative">
                            <button id="cycle-sort" class="w-full px-4 py-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2" style="background:#1e3a8a;color:#ffffff;border:1px solid rgba(255,255,255,0.10);" title="الفرز">
                                <i class="ri-sort-asc text-lg"></i>
                                <span class="text-sm font-semibold">الفرز (الاحدث اولا)</span>
                            </button>
                        </div>

                        <!-- Statistics Grid 2x2 تحت زر الفرز مباشرة -->
                        <div class="grid grid-cols-2 gap-2">
                        <!-- القضايا المؤرشفة -->
                        <div id="filter-archived-cases" class="rounded-lg p-3 border border-white/10 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105" style="background: linear-gradient(135deg, #0ea5e9, #1e3a8a);">
                            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                                <i class="ri-archive-line text-white text-sm"></i>
                            </div>
                            <div class="text-lg font-bold text-white mb-1" id="archived-cases-count">0</div>
                            <div class="text-xs font-medium text-white/90">القضايا المؤرشفة</div>
                        </div>
                        
                        <!-- القضايا المتداولة -->
                        <div id="filter-active-cases" class="rounded-lg p-3 border border-white/10 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105" style="background: linear-gradient(135deg, #0ea5e9, #1e3a8a);">
                            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                                <i class="ri-briefcase-line text-white text-sm"></i>
                            </div>
                            <div class="text-lg font-bold text-white mb-1" id="active-cases-count">0</div>
                            <div class="text-xs font-medium text-white/90">القضايا المتداولة</div>
                        </div>
                        
                        <!-- بدون دعاوى -->
                        <div id="filter-no-cases" class="rounded-lg p-3 border border-white/10 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105" style="background: linear-gradient(135deg, #0ea5e9, #1e3a8a);">
                            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                                <i class="ri-briefcase-line text-white text-sm"></i>
                            </div>
                            <div class="text-lg font-bold text-white mb-1" id="clients-no-cases">0</div>
                            <div class="text-xs font-medium text-white/90">موكل بدون دعوى</div>
                        </div>
                        
                        <!-- بدون جلسات -->
                        <div id="filter-no-sessions" class="rounded-lg p-3 border border-white/10 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105" style="background: linear-gradient(135deg, #0ea5e9, #1e3a8a);">
                            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                                <i class="ri-calendar-close-line text-white text-sm"></i>
                            </div>
                            <div class="text-lg font-bold text-white mb-1" id="clients-no-sessions">0</div>
                            <div class="text-xs font-medium text-white/90">دعوى بدون جلسة</div>
                        </div>
                        </div>
                    </div>
                </div>

                <!-- كارت مستقل لمجلدات الموكلين فقط -->
                <div class="search-sidebar-card rounded-lg p-3 shadow-md border">
                    <button id="open-clients-folder-sidebar" class="w-full px-4 py-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2" style="display:none;background:#1e3a8a;color:#ffffff;">
                        <i class="ri-folder-open-line text-lg"></i>
                        <span>مجلدات الموكلين</span>
                    </button>
                </div>
            </div>

            <div class="flex-1 min-h-0">
                <div class="bg-blue-50 rounded-xl border-2 border-blue-300 shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
                    <div id="clients-list" class="space-y-2 overscroll-contain p-2 md:p-3">
                        <div class="text-center text-gray-500 py-8 sticky top-0 bg-blue-50">
                            <i class="ri-loader-4-line animate-spin text-3xl mb-3"></i>
                            <p class="text-lg">جاري تحميل الموكلين...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        const leftPane = document.querySelector('#search-content-container .search-left-pane');
        if (leftPane) {
            try { leftPane.classList.add('search-left-pane-dark'); } catch (_) { }
            try { leftPane.style.background = '#111827'; } catch (_) { }
            try { leftPane.style.borderLeft = '2px solid rgba(14, 165, 233, .45)'; } catch (_) { }
            try { leftPane.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
            try {
                leftPane.style.borderBottomLeftRadius = '16px';
                leftPane.style.borderBottomRightRadius = '16px';
                leftPane.style.overflowX = 'hidden';
                leftPane.style.overflowY = 'auto';
                leftPane.style.paddingBottom = '10px';
            } catch (_) { }

            try {
                const cards = leftPane.querySelectorAll('.search-sidebar-card');
                cards.forEach((c) => {
                    try { c.style.background = 'rgba(15, 23, 42, .78)'; } catch (_) { }
                    try { c.style.borderColor = 'rgba(148, 163, 184, .18)'; } catch (_) { }
                });
            } catch (_) { }

            try {
                const headings = leftPane.querySelectorAll('.search-sidebar-heading');
                headings.forEach((h) => { try { h.style.color = 'rgba(255,255,255,.94)'; } catch (_) { } });
                const muted = leftPane.querySelectorAll('.search-sidebar-muted');
                muted.forEach((m) => { try { m.style.color = 'rgba(226,232,240,.78)'; } catch (_) { } });
            } catch (_) { }

            try {
                const inputs = leftPane.querySelectorAll('.search-sidebar-input');
                inputs.forEach((inp) => {
                    try { inp.style.background = 'rgba(255,255,255,.08)'; } catch (_) { }
                    try { inp.style.borderColor = 'rgba(148, 163, 184, .28)'; } catch (_) { }
                    try { inp.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
                });
            } catch (_) { }

            try {
                const sortBtn = document.getElementById('cycle-sort');
                if (sortBtn && sortBtn.dataset && sortBtn.dataset.darkStyled !== '1') {
                    sortBtn.dataset.darkStyled = '1';
                    try {
                        sortBtn.style.background = '#1e3a8a';
                        sortBtn.style.color = '#ffffff';
                        sortBtn.style.border = '1px solid rgba(255,255,255,0.10)';
                        sortBtn.style.transition = 'background-color .15s ease, transform .15s ease, box-shadow .15s ease';
                        const baseBg = '#1e3a8a';
                        const hoverBg = '#0f172a';
                        const baseBorder = 'rgba(255,255,255,0.10)';
                        const hoverBorder = 'rgba(245, 158, 11, .85)';
                        const applyBase = () => {
                            try {
                                sortBtn.style.background = baseBg;
                                sortBtn.style.borderColor = baseBorder;
                                sortBtn.style.transform = 'none';
                                sortBtn.style.boxShadow = '0 2px 8px rgba(15,23,42,.10)';
                            } catch (_) { }
                        };
                        const applyHover = () => {
                            try {
                                sortBtn.style.background = hoverBg;
                                sortBtn.style.borderColor = hoverBorder;
                                sortBtn.style.transform = 'translateY(-1px)';
                                sortBtn.style.boxShadow = '0 10px 18px rgba(15,23,42,.14)';
                            } catch (_) { }
                        };
                        applyBase();
                        sortBtn.addEventListener('mouseenter', applyHover);
                        sortBtn.addEventListener('mouseleave', applyBase);
                        sortBtn.addEventListener('mousedown', () => { try { sortBtn.style.transform = 'translateY(0px) scale(.98)'; } catch (_) { } });
                        sortBtn.addEventListener('mouseup', applyHover);
                        sortBtn.addEventListener('blur', applyBase);
                    } catch (_) { }
                }
            } catch (_) { }

            try {
                const folderBtn = document.getElementById('open-clients-folder-sidebar');
                if (folderBtn && folderBtn.dataset && folderBtn.dataset.yellowHoverStyled !== '1') {
                    folderBtn.dataset.yellowHoverStyled = '1';
                    try {
                        folderBtn.style.background = '#1e3a8a';
                        folderBtn.style.color = '#ffffff';
                        folderBtn.style.border = '1px solid rgba(255,255,255,0.10)';
                        folderBtn.style.transition = 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease';
                        const baseBg = '#1e3a8a';
                        const hoverBg = '#0f172a';
                        const baseBorder = 'rgba(255,255,255,0.10)';
                        const hoverBorder = 'rgba(245, 158, 11, .85)';

                        const applyBase = () => {
                            try {
                                folderBtn.style.background = baseBg;
                                folderBtn.style.borderColor = baseBorder;
                                folderBtn.style.transform = 'none';
                                folderBtn.style.boxShadow = '0 2px 8px rgba(15,23,42,.10)';
                            } catch (_) { }
                        };
                        const applyHover = () => {
                            try {
                                folderBtn.style.background = hoverBg;
                                folderBtn.style.borderColor = hoverBorder;
                                folderBtn.style.transform = 'translateY(-1px)';
                                folderBtn.style.boxShadow = '0 10px 18px rgba(15,23,42,.14)';
                            } catch (_) { }
                        };

                        applyBase();
                        folderBtn.addEventListener('mouseenter', applyHover);
                        folderBtn.addEventListener('mouseleave', applyBase);
                        folderBtn.addEventListener('mousedown', () => { try { folderBtn.style.transform = 'translateY(0px) scale(.98)'; } catch (_) { } });
                        folderBtn.addEventListener('mouseup', applyHover);
                        folderBtn.addEventListener('blur', applyBase);
                    } catch (_) { }
                }
            } catch (_) { }

            try {
                const statIds = ['filter-archived-cases', 'filter-active-cases', 'filter-no-cases', 'filter-no-sessions'];
                statIds.forEach((id) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (el.dataset && el.dataset.hoverStyled === '1') return;
                    if (el.dataset) el.dataset.hoverStyled = '1';

                    const applyBase = () => {
                        try {
                            el.style.transition = 'background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease';
                            el.style.transform = '';
                            el.style.boxShadow = '';
                            el.style.borderColor = 'rgba(255,255,255,0.10)';
                            el.style.background = 'linear-gradient(135deg, #0ea5e9, #1e3a8a)';
                            const iconWrap = el.querySelector('div.w-8.h-8');
                            if (iconWrap) {
                                iconWrap.style.background = 'rgba(255, 255, 255, 0.2)';
                                iconWrap.style.boxShadow = 'none';
                            }
                            el.querySelectorAll('div').forEach((d) => {
                                try { d.style.color = '#ffffff'; } catch (_) { }
                            });
                        } catch (_) { }
                    };

                    const applyHover = () => {
                        try {
                            el.style.background = 'linear-gradient(135deg, #38bdf8, #1e40af)';
                            el.style.borderColor = 'rgba(245, 158, 11, .85)';
                            el.style.transform = 'translateY(-2px) scale(1.03)';
                            el.style.boxShadow = '0 14px 26px rgba(15, 23, 42, .30), 0 10px 18px rgba(14, 165, 233, .20)';

                            const iconWrap = el.querySelector('div.w-8.h-8');
                            if (iconWrap) {
                                iconWrap.style.background = 'rgba(255, 255, 255, 0.3)';
                                iconWrap.style.boxShadow = '0 10px 16px rgba(0,0,0,.1)';
                            }

                            el.querySelectorAll('div').forEach((d) => {
                                try {
                                    if (d.classList && d.classList.contains('w-8') && d.classList.contains('h-8')) return;
                                    d.style.color = '#ffffff';
                                } catch (_) { }
                            });
                        } catch (_) { }
                    };

                    applyBase();
                    el.addEventListener('mouseenter', applyHover);
                    el.addEventListener('mouseleave', applyBase);
                    el.addEventListener('mousedown', () => { try { el.style.transform = 'translateY(-1px) scale(1.01)'; } catch (_) { } });
                    el.addEventListener('mouseup', applyHover);
                    el.addEventListener('blur', applyBase);
                });
            } catch (_) { }
        }
    } catch (_) { }

    try {
        if (!document.getElementById('search-sidebar-hover-style')) {
            const st = document.createElement('style');
            st.id = 'search-sidebar-hover-style';
            st.textContent = `
                #search-content-container #cycle-sort:hover,
                #search-content-container #open-clients-folder-sidebar:hover {
                    border-color: rgba(245, 158, 11, .90) !important;
                    outline: 2px solid rgba(245, 158, 11, .65) !important;
                    outline-offset: 2px !important;
                }
            `;
            (document.head || document.documentElement).appendChild(st);
        }
    } catch (_) { }

    try {
        if (!document.getElementById('search-lite-effects-style')) {
            const style = document.createElement('style');
            style.id = 'search-lite-effects-style';
            style.textContent = `
                /* Performance: remove heavy shadows/transforms/transitions without touching hover colors */
                #search-content-container .client-card,
                #search-content-container .client-card:hover {
                    box-shadow: none !important;
                    transform: none !important;
                }
                #search-content-container .client-card * {
                    transition: none !important;
                }
                #search-content-container .client-card:hover * {
                    transform: none !important;
                    filter: none !important;
                }
                #search-content-container .client-card button,
                #search-content-container .client-card button:hover {
                    box-shadow: none !important;
                    transform: none !important;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }
    } catch (_) { }

    attachQuickSearchListener();
    attachStatsFilterListeners();

    try {
        const btn = document.getElementById('open-clients-folder-sidebar');
        const isDesktopApp = (function () {
            try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
        })();
        if (btn && isDesktopApp) {
            btn.style.display = '';
            try {
                btn.style.background = '#1e3a8a';
                btn.style.color = '#ffffff';
                btn.style.border = '1px solid rgba(255,255,255,0.10)';
                btn.style.transition = 'background-color .15s ease, transform .15s ease, box-shadow .15s ease';
                const baseBg = '#1e3a8a';
                const hoverBg = '#0f172a';
                const applyBase = () => {
                    try {
                        btn.style.background = baseBg;
                        btn.style.transform = 'none';
                        btn.style.boxShadow = '0 2px 8px rgba(15,23,42,.10)';
                    } catch (_) { }
                };
                const applyHover = () => {
                    try {
                        btn.style.background = hoverBg;
                        btn.style.transform = 'translateY(-1px)';
                        btn.style.boxShadow = '0 10px 18px rgba(15,23,42,.14)';
                    } catch (_) { }
                };
                applyBase();
                btn.addEventListener('mouseenter', applyHover);
                btn.addEventListener('mouseleave', applyBase);
                btn.addEventListener('mousedown', () => { try { btn.style.transform = 'translateY(0px) scale(.98)'; } catch (_) { } });
                btn.addEventListener('mouseup', applyHover);
                btn.addEventListener('blur', applyBase);
            } catch (_) { }
            btn.addEventListener('click', () => { try { __searchOpenClientsMainFolder(); } catch (_) { } });
        } else if (btn) {
            try { btn.remove(); } catch (_) { try { btn.style.display = 'none'; } catch (e) { } }
        }
    } catch (_) { }

    try {
        const saved = sessionStorage.getItem('search_query') || '';
        const inputEl = document.getElementById('quick-search');
        if (inputEl) {
            inputEl.value = saved;
            const q = saved.trim().toLowerCase();
            if (q.length >= 2) {
                performQuickSearch(q);
            } else {
                loadAllClients();
            }
        } else {
            loadAllClients();
        }
    } catch (_) {
        loadAllClients();
    }

    const mainEl = document.querySelector('main');
    if (mainEl) { mainEl.classList.remove('overflow-hidden'); mainEl.classList.add('overflow-auto'); }
    document.documentElement.style.overflowY = '';
    document.body.style.overflowY = '';
    const wrapperCard = document.getElementById('search-content-container')?.closest('.bg-white');
    if (wrapperCard) { wrapperCard.classList.add('overflow-hidden'); wrapperCard.classList.remove('min-h-screen'); wrapperCard.classList.add('min-h-0'); }
    try {
        requestAnimationFrame(() => {
            setupClientsScrollBox();
            try { setupHoverScrollBehavior(); } catch (_) { }
        });
        window.addEventListener('resize', setupClientsScrollBox);
        setupBackButton();
    } catch (e) { console.error(e); }
    updateQuickStats();
}

function setupBackButton() {
    if (window.__searchBackBtnBound) return;
    window.__searchBackBtnBound = true;
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#back-to-main, #back-to-main-search');
        if (!btn) return;
        e.preventDefault();
        try {
            if (window.tabsManager) {

                window.tabsManager.switchToTab('main');
            } else {
                window.location.href = 'index.html';
            }
        } catch (err) {
            window.location.href = 'index.html';
        }
    });
}

function setupModalClose() {
    const modal = document.getElementById('modal');
    const closeButton = document.getElementById('modal-close-button');

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                navigateBack();
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', navigateBack);
    }
}

function setupClientsScrollBox() {
    try {
        const rightWrapper = document.querySelector('#search-content-container .flex-1.min-h-0 > div');
        const clientsList = document.getElementById('clients-list');
        if (!rightWrapper || !clientsList) return;
        const viewportH = window.innerHeight;
        const wrapperTop = rightWrapper.getBoundingClientRect().top;
        const targetH = Math.max(240, viewportH - wrapperTop - 12);
        rightWrapper.style.height = targetH + 'px';
        rightWrapper.style.minHeight = '0px';
        clientsList.style.maxHeight = (targetH - 24) + 'px';
        clientsList.style.overflowY = 'auto';
        const leftPane = document.querySelector('.search-left-pane');
        if (leftPane) {
            leftPane.style.height = targetH + 'px';
            leftPane.style.maxHeight = targetH + 'px';
            leftPane.style.minHeight = '0px';
            leftPane.style.overflowY = 'auto';
            leftPane.style.overscrollBehavior = 'contain';
            try {
                leftPane.style.borderBottomLeftRadius = '16px';
                leftPane.style.borderBottomRightRadius = '16px';
                leftPane.style.overflowX = 'hidden';
                leftPane.style.overflowY = 'auto';
                leftPane.style.paddingBottom = '10px';
            } catch (_) { }
        }
    } catch (e) { }
}

function setupHoverScrollBehavior() {
    // هذا السلوك كان بيبدّل overflow حسب حركة الماوس وده بيعمل تقطيع (reflow) على الأجهزة الضعيفة.
    // نخليه no-op ونسيب اسكرول القائمة شغال بشكل طبيعي.
    try {
        if (window.__searchHoverScrollDisabled) return;
        window.__searchHoverScrollDisabled = true;
    } catch (_) { }
}

let __quickSearchToken = 0;

function __deferFullyArchivedClientsToBottom(clients, casesByClient) {
    try {
        const list = Array.isArray(clients) ? clients : [];
        const map = casesByClient instanceof Map ? casesByClient : null;
        if (!map) return list;

        const normal = [];
        const fullyArchived = [];
        for (const c of list) {
            const cid = c && c.id != null ? c.id : null;
            const cases = (cid != null) ? (map.get(cid) || []) : [];
            if (!cases || cases.length === 0) {
                normal.push(c);
                continue;
            }
            const allArchived = cases.every(cs => cs && cs.isArchived === true);
            if (allArchived) fullyArchived.push(c);
            else normal.push(c);
        }
        return normal.concat(fullyArchived);
    } catch (_) {
        return Array.isArray(clients) ? clients : [];
    }
}


let activeStatsFilter = null;


function attachStatsFilterListeners() {
    const filterArchivedCases = document.getElementById('filter-archived-cases');
    const filterActiveCases = document.getElementById('filter-active-cases');
    const filterNoCases = document.getElementById('filter-no-cases');
    const filterNoSessions = document.getElementById('filter-no-sessions');

    if (filterArchivedCases) {
        filterArchivedCases.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            toggleStatsFilter('archived-cases', filterArchivedCases);
        });
    }
    if (filterActiveCases) {
        filterActiveCases.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            toggleStatsFilter('active-cases', filterActiveCases);
        });
    }
    if (filterNoCases) {
        filterNoCases.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            toggleStatsFilter('no-cases', filterNoCases);
        });
    }
    if (filterNoSessions) {
        filterNoSessions.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            toggleStatsFilter('no-sessions', filterNoSessions);
        });
    }
    // لم نعد نستخدم فلتر أسماء مكررة هنا
}


function toggleStatsFilter(filterType, element) {

    if (activeStatsFilter === filterType) {
        activeStatsFilter = null;
        removeActiveFilterStyle();
        restoreSortButton();
        loadAllClients();
        showToast('تم إلغاء الفلتر', 'info');
    } else {

        activeStatsFilter = filterType;
        removeActiveFilterStyle();
        addActiveFilterStyle(element);
        // لا نعيد تعيين الفرز - نحتفظ باختيار المستخدم
        // لا نغير زر الفرز - يبقى شغال للفرز
        filterClientsByStats(filterType);
    }
}


function convertSortButtonToCancelFilter() {
    const sortBtn = document.getElementById('cycle-sort');
    if (sortBtn) {
        sortBtn.title = 'الغاء الفرز';
        sortBtn.style.background = '#b91c1c';
        sortBtn.style.color = '#ffffff';
        sortBtn.innerHTML = `
            <span style="display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;font-size:14px;">
                <i class="ri-close-circle-line" style="font-size:16px;"></i>
                <span>الغاء الفرز</span>
            </span>
        `;

        const newBtn = sortBtn.cloneNode(true);
        sortBtn.parentNode.replaceChild(newBtn, sortBtn);

        newBtn.addEventListener('click', () => {
            activeStatsFilter = null;
            removeActiveFilterStyle();
            restoreSortButton();
            loadAllClients();
            showToast('تم إلغاء الفلتر', 'info');
        });
    }
}


function restoreSortButton() {
    const sortBtn = document.getElementById('cycle-sort');
    if (sortBtn) {
        // استعادة الفرز المحفوظ
        const field = sessionStorage.getItem('sort_field') || 'date';
        const dir = sessionStorage.getItem('sort_dir') || 'desc';
        
        const sortOptions = [
            { field: 'name', dir: 'asc', label: 'فرز: الاسم أ-ي', icon: 'ri-sort-asc' },
            { field: 'name', dir: 'desc', label: 'فرز: الاسم ي-أ', icon: 'ri-sort-desc' },
            { field: 'date', dir: 'desc', label: 'فرز: الأحدث أولاً', icon: 'ri-calendar-line' },
            { field: 'date', dir: 'asc', label: 'فرز: الأقدم أولاً', icon: 'ri-calendar-2-line' }
        ];
        
        const getShortSortLabel = (opt) => {
            try {
                if (!opt) return '';
                if (opt.field === 'name' && opt.dir === 'asc') return 'ا-ى';
                if (opt.field === 'name' && opt.dir === 'desc') return 'ى-ا';
                if (opt.field === 'date' && opt.dir === 'desc') return 'الاحدث اولا';
                if (opt.field === 'date' && opt.dir === 'asc') return 'الاقدم اولا';
                return '';
            } catch (_) { return ''; }
        };
        
        const currentOption = sortOptions.find(opt => opt.field === field && opt.dir === dir) || sortOptions[2];
        
        sortBtn.title = currentOption.label;
        sortBtn.style.background = '#1e3a8a';
        sortBtn.style.color = '#ffffff';
        const shortLabel = getShortSortLabel(currentOption);
        sortBtn.innerHTML = shortLabel
            ? `<span style="display:flex;align-items:center;justify-content:center;gap:6px;font-weight:900;font-size:18px;line-height:1;">
                    <i class="${currentOption.icon}" style="font-size:18px;line-height:1;"></i>
                    <span>${shortLabel}</span>
               </span>`
            : `<i class="${currentOption.icon} text-lg"></i>`;

        attachQuickSearchListener();
    }
}


function removeActiveFilterStyle() {
    document.querySelectorAll('[id^="filter-"]').forEach(el => {
        el.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2');
        try { el.style.outline = ''; } catch (_) { }
        try { el.style.outlineOffset = ''; } catch (_) { }
        try { el.style.borderColor = ''; } catch (_) { }
        try { el.style.boxShadow = ''; } catch (_) { }
    });
}


function addActiveFilterStyle(element) {
    element.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2');
    try {
        element.style.outline = '3px solid rgba(245, 158, 11, .95)';
        element.style.outlineOffset = '2px';
        element.style.borderColor = 'rgba(245, 158, 11, .95)';
        element.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, .25), 0 16px 28px rgba(0, 0, 0, .35)';
    } catch (_) { }
}


async function filterClientsByStats(filterType) {
    const clientsList = document.getElementById('clients-list');
    if (!clientsList) return;

    clientsList.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="ri-loader-4-line animate-spin text-3xl mb-3"></i><p class="text-lg">جاري التصفية...</p></div>';

    try {
        const clients = await getAllClients();
        let filteredClients = [];

        const allCases = await getAllCases();
        const allSessions = await getAllSessions();

        const casesByClient = new Map();
        for (const cs of (Array.isArray(allCases) ? allCases : [])) {
            const cid = cs && cs.clientId != null ? cs.clientId : null;
            if (cid == null) continue;
            const arr = casesByClient.get(cid) || [];
            arr.push(cs);
            casesByClient.set(cid, arr);
        }

        const sessionsCountByCase = new Map();
        for (const s of (Array.isArray(allSessions) ? allSessions : [])) {
            sessionsCountByCase.set(s.caseId, (sessionsCountByCase.get(s.caseId) || 0) + 1);
        }

        if (filterType === 'archived-cases' || filterType === 'active-cases') {
            const wantArchived = (filterType === 'archived-cases');
            for (const client of clients) {
                const cid = client && client.id != null ? client.id : null;
                if (cid == null) continue;
                const cases = casesByClient.get(cid) || [];
                if (cases.length === 0) continue;
                const hasMatch = cases.some(cs => {
                    const isArchived = cs && cs.isArchived === true;
                    return wantArchived ? isArchived : !isArchived;
                });
                if (hasMatch) filteredClients.push(client);
            }
        } else if (filterType === 'no-cases') {

            for (const client of clients) {
                const cases = await getFromIndex('cases', 'clientId', client.id);
                if (cases.length === 0) {
                    filteredClients.push(client);
                }
            }
        } else if (filterType === 'no-sessions') {

            for (const client of clients) {
                const cases = casesByClient.get(client.id) || [];
                let totalSessions = 0;
                for (const caseRecord of cases) {
                    totalSessions += (sessionsCountByCase.get(caseRecord.id) || 0);
                }
                if (totalSessions === 0) {
                    filteredClients.push(client);
                }
            }
        }

        filteredClients = __deferFullyArchivedClientsToBottom(filteredClients, casesByClient);


        // استخدام الفرز المحفوظ من sessionStorage
        try {
            const field = sessionStorage.getItem('sort_field') || 'date';
            const dir = sessionStorage.getItem('sort_dir') || 'desc';
            
            if (field === 'name') {
                filteredClients.sort((a, b) => {
                    const aName = (a && a.name) || '';
                    const bName = (b && b.name) || '';
                    return dir === 'asc' 
                        ? aName.localeCompare(bName, 'ar') 
                        : bName.localeCompare(aName, 'ar');
                });
            } else {
                const normalizeDate = (v) => {
                    if (v instanceof Date) return v.getTime();
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') {
                        const t = Date.parse(v);
                        return isNaN(t) ? 0 : t;
                    }
                    return 0;
                };
                const getCreated = (x) => normalizeDate(x?.createdAt ?? x?.created_at ?? x?.created ?? x?.addedAt ?? x?.id ?? 0);
                filteredClients.sort((a, b) => {
                    return dir === 'asc' 
                        ? (getCreated(a) - getCreated(b)) 
                        : (getCreated(b) - getCreated(a));
                });
            }
        } catch (_) { }

        if (filteredClients.length === 0) {
            clientsList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="ri-search-line text-4xl mb-4 text-gray-400"></i>
                    <p class="text-lg font-medium">لا توجد نتائج</p>
                    <p class="text-sm text-gray-400 mt-2">لا يوجد موكلين يطابقون هذا الفلتر</p>
                </div>
            `;
            return;
        }


        const __isElectronEnv = (function () {
            try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
        })();


        let html = '';
        for (const client of filteredClients) {
            const cases = await getFromIndex('cases', 'clientId', client.id);
            const caseOpponentIds = [...new Set(cases.map(c => c.opponentId).filter(id => id))];
            let tempOpponentIds = [];
            const clientOpponentRelations = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}');
            if (clientOpponentRelations[client.id]) {
                tempOpponentIds = clientOpponentRelations[client.id];
            }
            const uniqueOpponentIds = [...new Set([...caseOpponentIds, ...tempOpponentIds])];
            const opponents = [];
            for (const opponentId of uniqueOpponentIds) {
                const opponent = await getById('opponents', opponentId);
                if (opponent) opponents.push(opponent);
            }
            let totalSessions = 0;
            for (const caseRecord of cases) {
                const sessions = await getFromIndex('sessions', 'caseId', caseRecord.id);
                totalSessions += sessions.length;
            }

            let archiveStatus = 'none';
            let archivedCount = 0;
            if (cases.length > 0) {
                archivedCount = cases.filter(c => c.isArchived === true).length;
                if (archivedCount === cases.length) {
                    archiveStatus = 'all';
                } else if (archivedCount > 0) {
                    archiveStatus = 'partial';
                }
            }

            html += __buildClientCardHTML(client, { 
                opponentsCount: opponents.length, 
                casesCount: cases.length, 
                totalSessions, 
                archiveStatus, 
                archivedCount 
            });
        }

        clientsList.innerHTML = html;
        attachClientCardListeners();

        showToast(`تم العثور على ${filteredClients.length} موكل`, 'success');

    } catch (error) {
        console.error('Filter error:', error);
        clientsList.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="ri-error-warning-line text-2xl mb-2"></i>
                <p>خطأ في التصفية</p>
            </div>
        `;
    }
}

// البحث السريع
function attachQuickSearchListener() {
    const quickSearch = document.getElementById('quick-search');

    quickSearch.addEventListener('input', debounce(async (e) => {
        const rawValue = e.target.value;
        try { sessionStorage.setItem('search_query', rawValue); } catch (_) { }
        const query = rawValue.trim().toLowerCase();
        // تصفية تلقائية: إذا كان النص فارغاً، اعرض كل الموكلين
        if (query.length === 0) {
            loadAllClients();
            return;
        }
        // إذا كان النص أقل من حرفين، لا تبحث
        if (query.length < 2) {
            return;
        }
        await performQuickSearch(query);
    }, 200));

    // Close sidebar only when pressing Enter
    quickSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            }
        }
    });

    // نظام الفرز الدوار
    const cycleSortBtn = document.getElementById('cycle-sort');

    // خيارات الفرز بالترتيب
    const sortOptions = [
        { field: 'name', dir: 'asc', label: 'فرز: الاسم أ-ي', icon: 'ri-sort-asc' },
        { field: 'name', dir: 'desc', label: 'فرز: الاسم ي-أ', icon: 'ri-sort-desc' },
        { field: 'date', dir: 'desc', label: 'فرز: الأحدث أولاً', icon: 'ri-calendar-line' },
        { field: 'date', dir: 'asc', label: 'فرز: الأقدم أولاً', icon: 'ri-calendar-2-line' }
    ];

    const getShortSortLabel = (opt) => {
        try {
            if (!opt) return '';
            if (opt.field === 'name' && opt.dir === 'asc') return 'ا-ى';
            if (opt.field === 'name' && opt.dir === 'desc') return 'ى-ا';
            if (opt.field === 'date' && opt.dir === 'desc') return 'الاحدث اولا';
            if (opt.field === 'date' && opt.dir === 'asc') return 'الاقدم اولا';
            return '';
        } catch (_) {
            return '';
        }
    };

    let currentSortIndex = 0;

    // استعادة الفرز المحفوظ
    const getSortState = () => {
        const field = sessionStorage.getItem('sort_field') || 'name';
        const dir = sessionStorage.getItem('sort_dir') || 'asc';
        return { field, dir };
    };

    // حفظ حالة الفرز
    const setSortState = ({ field, dir }) => {
        try {
            sessionStorage.setItem('sort_field', field);
            sessionStorage.setItem('sort_dir', dir);
        } catch (_) { }
    };

    // الفرز الافتراضي لأول مرة فقط: الأحدث أولاً
    try {
        const hasField = (sessionStorage.getItem('sort_field') != null);
        const hasDir = (sessionStorage.getItem('sort_dir') != null);
        if (!hasField && !hasDir) {
            setSortState({ field: 'date', dir: 'desc' });
        }
    } catch (_) { }

    // تحديث زر الفرز
    const updateSortButton = () => {
        const option = sortOptions[currentSortIndex];
        if (cycleSortBtn) {
            cycleSortBtn.title = option.label;
            const shortLabel = getShortSortLabel(option);
            cycleSortBtn.innerHTML = shortLabel
                ? `<span style="display:flex;align-items:center;justify-content:center;gap:6px;font-weight:900;font-size:18px;line-height:1;">
                        <i class="${option.icon}" style="font-size:18px;line-height:1;"></i>
                        <span>${shortLabel}</span>
                   </span>`
                : `<i class="${option.icon} text-lg"></i>`;
        }
    };

    try {
        if (cycleSortBtn && cycleSortBtn.dataset && cycleSortBtn.dataset.hoverFxBound !== '1') {
            cycleSortBtn.dataset.hoverFxBound = '1';
            const applyBase = () => {
                try {
                    if (!cycleSortBtn.dataset.baseBg) {
                        try { cycleSortBtn.dataset.baseBg = window.getComputedStyle(cycleSortBtn).backgroundColor; } catch (_) { }
                        if (!cycleSortBtn.dataset.baseBg) cycleSortBtn.dataset.baseBg = '#2563eb';
                    }
                    cycleSortBtn.style.background = cycleSortBtn.dataset.baseBg;
                    cycleSortBtn.style.transform = 'none';
                    cycleSortBtn.style.boxShadow = '0 2px 8px rgba(15,23,42,.10)';
                } catch (_) { }
            };
            const applyHover = (saveBase) => {
                try {
                    const hoverBg = '#0f172a';
                    if (saveBase) {
                        try { cycleSortBtn.dataset.baseBg = window.getComputedStyle(cycleSortBtn).backgroundColor; } catch (_) { }
                        if (!cycleSortBtn.dataset.baseBg) cycleSortBtn.dataset.baseBg = '#2563eb';
                    }
                    cycleSortBtn.style.background = hoverBg;
                    cycleSortBtn.style.transform = 'translateY(-1px)';
                    cycleSortBtn.style.boxShadow = '0 10px 18px rgba(15,23,42,.14)';
                } catch (_) { }
            };
            try {
                cycleSortBtn.style.transition = 'background-color .15s ease, transform .15s ease, box-shadow .15s ease';
            } catch (_) { }
            applyBase();
            cycleSortBtn.addEventListener('mouseenter', () => applyHover(true));
            cycleSortBtn.addEventListener('mouseleave', applyBase);
            cycleSortBtn.addEventListener('mousedown', () => {
                try { cycleSortBtn.style.transform = 'translateY(0px) scale(.98)'; } catch (_) { }
            });
            cycleSortBtn.addEventListener('mouseup', () => applyHover(false));
            cycleSortBtn.addEventListener('blur', applyBase);
        }
    } catch (_) { }

    // تطبيق الفرز وتحديث العرض
    const applySortAndRefresh = () => {
        const saved = (sessionStorage.getItem('search_query') || '').trim().toLowerCase();
        if (saved.length >= 2) {
            performQuickSearch(saved);
        } else if (activeStatsFilter) {
            // لو فيه فلتر إحصائي شغال، نطبقه تاني مع الفرز الجديد
            filterClientsByStats(activeStatsFilter);
        } else {
            loadAllClients();
        }
    };

    // إيجاد الفهرس الحالي بناءً على الحالة المحفوظة
    const { field, dir } = getSortState();
    currentSortIndex = sortOptions.findIndex(opt => opt.field === field && opt.dir === dir);
    if (currentSortIndex === -1) currentSortIndex = 0;

    updateSortButton();

    // عند الضغط على الزر
    if (cycleSortBtn) {
        cycleSortBtn.addEventListener('click', () => {
            // الانتقال للخيار التالي
            currentSortIndex = (currentSortIndex + 1) % sortOptions.length;
            const option = sortOptions[currentSortIndex];

            // حفظ الحالة الجديدة
            setSortState({ field: option.field, dir: option.dir });

            // تحديث الزر
            updateSortButton();

            // تطبيق الفرز
            applySortAndRefresh();

            // تأثير بصري
            cycleSortBtn.classList.add('scale-95');
            setTimeout(() => cycleSortBtn.classList.remove('scale-95'), 100);
        });
    }
}

// تحميل جميع الموكلين
async function loadAllClients() {
    try {
        const clients = await (typeof getAllClientsCached === 'function' ? getAllClientsCached() : getAllClients());
        const clientsList = document.getElementById('clients-list');
        if (!clientsList) return;

        const compareByNameAsc = (a, b) => (a.name || '').localeCompare(b.name || '', 'ar');
        const compareByNameDesc = (a, b) => (b.name || '').localeCompare(a.name || '', 'ar');
        const normalizeDate = (v) => {
            if (v instanceof Date) return v.getTime();
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
                const t = Date.parse(v);
                return isNaN(t) ? 0 : t;
            }
            return 0;
        };
        const getCreated = (x) => normalizeDate(x?.createdAt ?? x?.created_at ?? x?.created ?? x?.addedAt ?? x?.id ?? 0);
        const compareByCreatedAsc = (a, b) => getCreated(a) - getCreated(b);
        const compareByCreatedDesc = (a, b) => getCreated(b) - getCreated(a);
        const field = sessionStorage.getItem('sort_field') || 'name';
        const dir = sessionStorage.getItem('sort_dir') || 'asc';
        let sortedClients = [...clients];
        if (field === 'name') {
            sortedClients.sort(dir === 'asc' ? compareByNameAsc : compareByNameDesc);
        } else {
            sortedClients.sort(dir === 'asc' ? compareByCreatedAsc : compareByCreatedDesc);
        }

        try {
            const allCases = await getAllCases();
            const casesByClient = new Map();
            for (const cs of (Array.isArray(allCases) ? allCases : [])) {
                const cid = cs && cs.clientId != null ? cs.clientId : null;
                if (cid == null) continue;
                const arr = casesByClient.get(cid) || [];
                arr.push(cs);
                casesByClient.set(cid, arr);
            }
            sortedClients = __deferFullyArchivedClientsToBottom(sortedClients, casesByClient);
        } catch (_) { }

        if (sortedClients.length === 0) {
            clientsList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="ri-user-3-line text-4xl mb-4 text-gray-400"></i>
                    <p class="text-lg font-medium">لا يوجد موكلين مسجلين</p>
                    <p class="text-sm text-gray-400 mt-2">ابدأ بإضافة قضية جديدة من الزر الرئيسي</p>
                </div>
            `;
            return;
        }

        let clientOpponentRelations = {};
        try { clientOpponentRelations = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}'); } catch (_) { clientOpponentRelations = {}; }

        clientsList.innerHTML = '<div class="text-center text-gray-500 py-10"><i class="ri-loader-4-line animate-spin text-3xl mb-3"></i><p class="text-lg">جاري تحميل الموكلين...</p></div>';

        const state = {
            clients: sortedClients,
            index: 0,
            total: sortedClients.length,
            batchSize: 25,
            casesByClient: null,
            sessionsCountByCase: null,
            clientOpponentRelations,
            statsReady: false,
            done: false,
            rendering: false
        };
        __setupClientsIncrementalScroll(state);
        attachClientCardListeners();
        requestAnimationFrame(() => {
            __renderNextClientsBatch();
            setTimeout(() => { try { __renderNextClientsBatch(); } catch (_) { } }, 0);
        });

        // تجهيز أرقام القضايا/الجلسات/الخصوم بعد ظهور القائمة (بدون تعطيل الواجهة)
        __prepareClientStatsAsync(state);

    } catch (error) {
        const el = document.getElementById('clients-list');
        if (el) el.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="ri-error-warning-line text-2xl mb-2"></i>
                <p>خطأ في تحميل الموكلين</p>
            </div>
        `;
    }
}

// مستمعي أحداث كروت الموكلين
function attachClientCardListeners() {
    const clientsList = document.getElementById('clients-list');
    if (!clientsList) return;
    if (clientsList.__delegatedBound) return;
    clientsList.__delegatedBound = true;

    clientsList.addEventListener('click', async (e) => {
        try {
            const attachBtn = e.target.closest('.attach-files-btn');
            if (attachBtn) {
                e.stopPropagation();
                const clientName = attachBtn.dataset.clientName;
                await handleCreateFolderAndUploadForClient(clientName);
                return;
            }
            const openBtn = e.target.closest('.open-folder-btn');
            if (openBtn) {
                e.stopPropagation();
                const clientName = openBtn.dataset.clientName;
                await handleOpenFolderForClient(clientName);
                return;
            }
            const delBtn = e.target.closest('.delete-client-btn');
            if (delBtn) {
                e.stopPropagation();
                const clientId = parseInt(delBtn.dataset.clientId);
                await handleDeleteClient(clientId);
                return;
            }
            const card = e.target.closest('.client-card');
            if (!card) return;
            if (e.target.closest('.edit-client-btn') || e.target.closest('.delete-client-btn') || e.target.closest('.attach-files-btn') || e.target.closest('.open-folder-btn')) return;
            const clientId = parseInt(card.dataset.clientId);
            displayClientEmbedded(clientId);
        } catch (_) { }
    });
}

function __buildClientCardHTML(client, { opponentsCount = 0, casesCount = 0, totalSessions = 0, archiveStatus = 'none', archivedCount = 0, matchesHtml = '' } = {}) {
    const clientId = client && client.id != null ? client.id : '';
    const name = client && client.name ? client.name : '';
    const __isElectronEnv = (function () {
        try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
    })();
    
    let cardClasses = 'client-card bg-gradient-to-r from-white via-blue-50 to-white border border-blue-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer group';
    let casesBadges = '';
    const activeCount = casesCount - archivedCount;
    
    if (archiveStatus === 'all' && casesCount > 0) {
        cardClasses = 'client-card bg-gradient-to-r from-white via-blue-50 to-white border border-blue-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer group';
        casesBadges = `<div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
            <i class="ri-archive-line text-blue-600 text-sm"></i>
            <span class="text-sm font-semibold text-blue-700" data-role="cases-count">${casesCount}</span>
            <span class="text-xs text-blue-600">مؤرشفة</span>
        </div>`;
    } else if (archiveStatus === 'partial') {
        casesBadges = `
            <div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
                <i class="ri-briefcase-line text-blue-600 text-sm"></i>
                <span class="text-sm font-semibold text-blue-700">${activeCount}</span>
                <span class="text-xs text-blue-600">متداولة</span>
            </div>
            <div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
                <i class="ri-archive-line text-blue-600 text-sm"></i>
                <span class="text-sm font-semibold text-blue-700">${archivedCount}</span>
                <span class="text-xs text-blue-600">مؤرشفة</span>
            </div>`;
    } else {
        casesBadges = `<div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
            <i class="ri-briefcase-line text-blue-600 text-sm"></i>
            <span class="text-sm font-semibold text-blue-700" data-role="cases-count">${casesCount}</span>
            <span class="text-xs text-blue-600">متداول</span>
        </div>`;
    }
    
    return `
        <div class="${cardClasses}" data-client-id="${clientId}">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4 flex-1">
                    <div class="relative">
                        <div class="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <i class="ri-user-3-line text-white text-lg"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xl text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">${name}</h4>
                        <div class="flex items-center gap-3">
                            <div class="flex items-center gap-1 bg-red-100 px-3 py-1.5 rounded-full">
                                <i class="ri-shield-user-line text-red-600 text-sm"></i>
                                <span class="text-sm font-semibold text-red-700" data-role="opponents-count">${opponentsCount}</span>
                                <span class="text-xs text-red-600">خصم</span>
                            </div>
                            ${casesBadges}
                            <div class="flex items-center gap-1 bg-green-100 px-3 py-1.5 rounded-full">
                                <i class="ri-calendar-event-line text-green-600 text-sm"></i>
                                <span class="text-sm font-semibold text-green-700" data-role="sessions-count">${totalSessions}</span>
                                <span class="text-xs text-green-600">جلسة</span>
                            </div>
                        </div>
                        ${matchesHtml}
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                     ${__isElectronEnv ? `
                     <div class="flex gap-1">
                        <button class="attach-files-btn bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105" data-client-name="${name}" title="إرفاق ملفات" aria-label="إرفاق ملفات"><i class="ri-attachment-2"></i></button>
                        <button class="open-folder-btn bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105" data-client-name="${name}" title="فتح مجلد الموكل" aria-label="فتح مجلد الموكل"><i class="ri-folder-open-line"></i></button>
                     </div>
                     ` : ''}
                     <button class="delete-client-btn bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105" data-client-id="${clientId}"><i class="ri-delete-bin-6-line"></i>حذف</button>
                 </div>
             </div>
        </div>
    `;
}

async function __prepareClientStatsAsync(state) {
    try {
        if (!state || state.statsReady) return;
        state.statsReady = 'loading';

        const work = async () => {
            try {
                const allCases = await getAllCases();
                const allSessions = await getAllSessions();
                const casesByClient = new Map();
                for (const cs of allCases) {
                    const arr = casesByClient.get(cs.clientId) || [];
                    arr.push(cs);
                    casesByClient.set(cs.clientId, arr);
                }
                const sessionsCountByCase = new Map();
                for (const s of allSessions) {
                    sessionsCountByCase.set(s.caseId, (sessionsCountByCase.get(s.caseId) || 0) + 1);
                }
                state.casesByClient = casesByClient;
                state.sessionsCountByCase = sessionsCountByCase;
                state.statsReady = true;
                __updateRenderedClientStats();
            } catch (_) {
                state.statsReady = true;
            }
        };

        // ادي فرصة للواجهة تظهر الأول
        setTimeout(() => {
            try {
                if (typeof requestIdleCallback === 'function') {
                    requestIdleCallback(() => { work(); }, { timeout: 2500 });
                } else {
                    work();
                }
            } catch (e) {
                work();
            }
        }, 1200);
    } catch (_) { }
}

async function __updateRenderedClientStats() {
    try {
        const clientsList = document.getElementById('clients-list');
        if (!clientsList) return;
        const st = clientsList.__renderState;
        if (!st || !st.casesByClient || !st.sessionsCountByCase) return;

        const allCases = await getAllCases();
        const casesByClient = new Map();
        for (const cs of allCases) {
            const arr = casesByClient.get(cs.clientId) || [];
            arr.push(cs);
            casesByClient.set(cs.clientId, arr);
        }
        st.casesByClient = casesByClient;

        const cards = clientsList.querySelectorAll('.client-card[data-client-id]');
        cards.forEach(card => {
            try {
                const clientId = parseInt(card.getAttribute('data-client-id') || '0', 10);
                if (!clientId) return;
                const cases = st.casesByClient.get(clientId) || [];
                const caseOpponentIds = [...new Set(cases.map(c => c.opponentId).filter(id => id))];
                const tempOpponentIds = (st.clientOpponentRelations && st.clientOpponentRelations[clientId]) ? st.clientOpponentRelations[clientId] : [];
                const opponentsCount = new Set([...caseOpponentIds, ...tempOpponentIds]).size;
                let totalSessions = 0;
                for (const caseRecord of cases) {
                    totalSessions += (st.sessionsCountByCase.get(caseRecord.id) || 0);
                }

                let archiveStatus = 'none';
                let archivedCount = 0;
                if (cases.length > 0) {
                    archivedCount = cases.filter(c => c.isArchived === true).length;
                    if (archivedCount === cases.length) {
                        archiveStatus = 'all';
                    } else if (archivedCount > 0) {
                        archiveStatus = 'partial';
                    }
                }

                const oppEl = card.querySelector('[data-role="opponents-count"]');
                const sessEl = card.querySelector('[data-role="sessions-count"]');
                if (oppEl) oppEl.textContent = String(opponentsCount);
                if (sessEl) sessEl.textContent = String(totalSessions);

                const statsDiv = card.querySelector('.flex.items-center.gap-3');
                if (statsDiv) {
                    const activeCount = cases.length - archivedCount;
                    let casesBadges = '';
                    
                    if (archiveStatus === 'all' && cases.length > 0) {
                        casesBadges = `<div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
                            <i class="ri-archive-line text-blue-600 text-sm"></i>
                            <span class="text-sm font-semibold text-blue-700" data-role="cases-count">${cases.length}</span>
                            <span class="text-xs text-blue-600">مؤرشفة</span>
                        </div>`;
                        card.className = 'client-card bg-gradient-to-r from-white via-blue-50 to-white border border-blue-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer group';
                    } else if (archiveStatus === 'partial') {
                        casesBadges = `
                            <div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
                                <i class="ri-briefcase-line text-blue-600 text-sm"></i>
                                <span class="text-sm font-semibold text-blue-700">${activeCount}</span>
                                <span class="text-xs text-blue-600">متداولة</span>
                            </div>
                            <div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
                                <i class="ri-archive-line text-blue-600 text-sm"></i>
                                <span class="text-sm font-semibold text-blue-700">${archivedCount}</span>
                                <span class="text-xs text-blue-600">مؤرشفة</span>
                            </div>`;
                        card.className = 'client-card bg-gradient-to-r from-white via-blue-50 to-white border border-blue-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer group';
                    } else {
                        casesBadges = `<div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
                            <i class="ri-briefcase-line text-blue-600 text-sm"></i>
                            <span class="text-sm font-semibold text-blue-700" data-role="cases-count">${cases.length}</span>
                            <span class="text-xs text-blue-600">متداولة</span>
                        </div>`;
                        card.className = 'client-card bg-gradient-to-r from-white via-blue-50 to-white border border-blue-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer group';
                    }

                    const opponentBadge = statsDiv.querySelector('.bg-red-100');
                    const sessionBadge = statsDiv.querySelector('.bg-green-100');
                    statsDiv.innerHTML = '';
                    if (opponentBadge) statsDiv.appendChild(opponentBadge);
                    statsDiv.insertAdjacentHTML('beforeend', casesBadges);
                    if (sessionBadge) statsDiv.appendChild(sessionBadge);
                }
            } catch (_) { }
        });
    } catch (_) { }
}

function __setupClientsIncrementalScroll(state) {
    try {
        const clientsList = document.getElementById('clients-list');
        if (!clientsList) return;
        clientsList.__renderState = state;
        if (clientsList.__scrollBound) return;
        clientsList.__scrollBound = true;
        let pending = false;
        clientsList.addEventListener('scroll', () => {
            try {
                if (pending) return;
                pending = true;
                const tick = () => {
                    pending = false;
                    try {
                        const st = clientsList.__renderState;
                        if (!st || st.done || st.rendering) return;
                        const nearBottom = (clientsList.scrollTop + clientsList.clientHeight) >= (clientsList.scrollHeight - 300);
                        if (nearBottom) {
                            __renderNextClientsBatch();
                        }
                    } catch (_) { }
                };
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(tick);
                } else {
                    setTimeout(tick, 50);
                }
            } catch (_) { pending = false; }
        }, { passive: true });
    } catch (_) { }
}

function __renderNextClientsBatch() {
    const clientsList = document.getElementById('clients-list');
    if (!clientsList) return;
    const state = clientsList.__renderState;
    if (!state || state.done || state.rendering) return;
    state.rendering = true;
    try {
        const start = state.index;
        const end = Math.min(state.total, start + state.batchSize);
        let html = '';
        for (let i = start; i < end; i++) {
            const client = state.clients[i];
            let opponentsCount = 0;
            let casesCount = 0;
            let totalSessions = 0;
            let archiveStatus = 'none';
            let archivedCount = 0;
            try {
                if (state.statsReady === true && state.casesByClient && state.sessionsCountByCase) {
                    const cases = state.casesByClient.get(client.id) || [];
                    casesCount = cases.length;
                    const caseOpponentIds = [...new Set(cases.map(c => c.opponentId).filter(id => id))];
                    const tempOpponentIds = (state.clientOpponentRelations && state.clientOpponentRelations[client.id]) ? state.clientOpponentRelations[client.id] : [];
                    opponentsCount = new Set([...caseOpponentIds, ...tempOpponentIds]).size;
                    for (const caseRecord of cases) {
                        totalSessions += (state.sessionsCountByCase.get(caseRecord.id) || 0);
                    }
                    if (cases.length > 0) {
                        archivedCount = cases.filter(c => c.isArchived === true).length;
                        if (archivedCount === cases.length) {
                            archiveStatus = 'all';
                        } else if (archivedCount > 0) {
                            archiveStatus = 'partial';
                        }
                    }
                }
            } catch (_) { }
            html += __buildClientCardHTML(client, { opponentsCount, casesCount, totalSessions, archiveStatus, archivedCount });
        }
        if (start === 0) {
            clientsList.innerHTML = '';
        }
        clientsList.insertAdjacentHTML('beforeend', html);
        state.index = end;
        state.done = (state.index >= state.total);
        attachClientCardListeners();
        if (state.statsReady === true) {
            try { __updateRenderedClientStats(); } catch (_) { }
        }
    } catch (_) {
    } finally {
        state.rendering = false;
    }
}

function restoreSearchLayout({ card, backMain } = {}) {
    try {
        const t = document.getElementById('modal-title-hidden');
        const c = document.getElementById('modal-content-hidden');
        const k = document.getElementById('modal-container-hidden');
        if (t) t.id = 'modal-title';
        if (c) c.id = 'modal-content';
        if (k) k.id = 'modal-container';
    } catch (e) { }
    try {
        if (card) {
            card.classList.remove('p-6', 'h-[75vh]');
            card.classList.add('p-0', 'h-full', 'overflow-hidden');
            card.style.overflowY = '';
            card.style.height = '';
            card.style.minHeight = '';
        }
        const mainEl = document.querySelector('main');
        if (mainEl) { mainEl.style.overflowY = ''; mainEl.style.height = ''; }
        const root = document.getElementById('search-content-container');
        if (root) { root.style.overflowY = ''; root.style.height = ''; }
        document.documentElement.style.overflowY = '';
        document.body.style.overflowY = '';
    } catch (e) { }
}

// عرض بيانات الموكل مضمنة داخل اللوحة اليمنى (بدون نقل عناصر منبثقة)
function displayClientEmbedded(clientId) {
    const root = document.getElementById('search-content-container');
    const modalOverlay = document.getElementById('modal');

    if (!root) return;

    // اخفاء أي نافذة منبثقة
    if (modalOverlay) modalOverlay.classList.add('hidden');
    const sidebarCb = document.getElementById('sidebar-toggle');
    if (sidebarCb) sidebarCb.checked = false;
    const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
    if (mobileToggle) mobileToggle.style.display = 'none';

    // إظهار زر العودة العام أثناء العرض المضمن + تحويله إلى زر رجوع وتحديث العنوان
    const backMain = document.getElementById('back-to-main');
    if (backMain) {
        backMain.classList.remove('hidden');
        const iconEl = backMain.querySelector('i');
        const textEl = backMain.querySelector('span');
        const titleSpan = document.getElementById('page-title');
        // احفظ القيم الأصلية لاسترجاعها عند الرجوع
        if (iconEl && !backMain.dataset.origIcon) backMain.dataset.origIcon = iconEl.className;
        if (textEl && !backMain.dataset.origText) backMain.dataset.origText = textEl.textContent;
        if (titleSpan && !backMain.dataset.origTitle) backMain.dataset.origTitle = titleSpan.textContent;
        // غيّر المظهر إلى زر رجوع وعنوان "تفاصيل الموكل"
        if (iconEl) iconEl.className = 'ri-arrow-right-line text-white text-lg';
        if (textEl) textEl.textContent = 'رجوع';
        if (titleSpan) titleSpan.textContent = 'تفاصيل الموكل';
        // اربط حدث الرجوع للعودة إلى شاشة البحث بدل الرئيسية
        if (!backMain.dataset.boundForClient) {
            const backHandler = function (e) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    if (stateManager?.modalHistory && stateManager.modalHistory.length > 1 && typeof navigateBack === 'function') {
                        navigateBack();
                    } else {
                        if (typeof stateManager?.setModalHistory === 'function') {
                            stateManager.setModalHistory([]);
                        }
                        if (iconEl && backMain.dataset.origIcon) iconEl.className = backMain.dataset.origIcon;
                        if (textEl && backMain.dataset.origText) textEl.textContent = backMain.dataset.origText;
                        if (titleSpan && backMain.dataset.origTitle) titleSpan.textContent = backMain.dataset.origTitle;
                        restoreSearchLayout({ card, backMain });
                        backMain.removeEventListener('click', backHandler);
                        backMain._clientBackHandler = null;
                        delete backMain.dataset.boundForClient;
                        loadSearchContent();
                    }
                } catch (err) {
                    if (iconEl && backMain.dataset.origIcon) iconEl.className = backMain.dataset.origIcon;
                    if (textEl && backMain.dataset.origText) textEl.textContent = backMain.dataset.origText;
                    if (titleSpan && backMain.dataset.origTitle) titleSpan.textContent = backMain.dataset.origTitle;
                    restoreSearchLayout({ card, backMain });
                    backMain.removeEventListener('click', backHandler);
                    backMain._clientBackHandler = null;
                    delete backMain.dataset.boundForClient;
                    loadSearchContent();
                }
            };
            backMain._clientBackHandler = backHandler;
            backMain.addEventListener('click', backHandler);
            backMain.dataset.boundForClient = '1';
        }
    }

    // تكبير كارت المحتوى ليملأ الشاشة
    const card = root.parentElement; // هو الـ div الأبيض الحاوي
    if (card) {
        card.classList.remove('p-6', 'h-[75vh]');
        card.classList.add('p-0');
        card.classList.remove('overflow-hidden');
        card.style.overflowY = 'auto';
        card.style.height = 'auto';
        card.style.minHeight = 'calc(100vh - 56px)';
    }
    const mainEl = document.querySelector('main');
    if (mainEl) { mainEl.style.overflowY = 'auto'; mainEl.style.height = 'auto'; }
    try {
        document.documentElement.style.overflowY = 'auto';
        document.body.style.overflowY = 'auto';
        root.style.overflowY = 'auto';
        root.style.height = 'auto';
    } catch (e) { }

    // أعد تسمية عناصر المودال الأصلية لتجنب تضارب المعرفات
    const origTitleEl = document.querySelector('#modal #modal-title');
    const origContentEl = document.querySelector('#modal #modal-content');
    const origContainerEl = document.querySelector('#modal #modal-container');
    if (origTitleEl) origTitleEl.id = 'modal-title-hidden';
    if (origContentEl) origContentEl.id = 'modal-content-hidden';
    if (origContainerEl) origContainerEl.id = 'modal-container-hidden';

    // واجهة ملء الشاشة بدون القائمة الجانبية
    root.innerHTML = `
        <div class="w-full">
            <div class="px-4 pt-0 pb-4 client-embedded-wrapper">
                <h2 id="modal-title" class="text-lg font-semibold text-gray-800 mb-3"></h2>
                <div id="modal-content"></div>
            </div>
        </div>
    `;

    // تحميل تفاصيل الموكل داخل العرض المضمن مع تفعيل سجل التنقل
    if (typeof navigateTo === 'function' && typeof stateManager?.setModalHistory === 'function') {
        try {
            stateManager.setModalHistory([]);
            navigateTo(displayClientViewForm, clientId);
        } catch (e) {
            console.error(e);
        }
    } else if (typeof displayClientViewForm === 'function') {
        try {
            displayClientViewForm(clientId);
        } catch (e) {
            console.error(e);
        }
    }

    // زر الرجوع: لو فيه تاريخ تنقل ارجع خطوة، غير كده رجّع شاشة البحث
    document.getElementById('back-to-search')?.addEventListener('click', () => {
        try {
            if (stateManager?.modalHistory && stateManager.modalHistory.length > 1 && typeof navigateBack === 'function') {
                navigateBack();
            } else {
                if (typeof stateManager?.setModalHistory === 'function') {
                    stateManager.setModalHistory([]);
                }
                restoreSearchLayout({ card });
                loadSearchContent();
            }
        } catch (e) {
            restoreSearchLayout({ card });
            loadSearchContent();
        }
    });
}

// البحث الشامل
async function performQuickSearch(query) {
    const clientsList = document.getElementById('clients-list');
    if (!clientsList) return;

    const token = ++__quickSearchToken;

    // مسح النتائج الحالية وعرض مؤشر التحميل
    clientsList.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="ri-loader-4-line animate-spin text-3xl mb-3"></i><p class="text-lg">جاري البحث السريع...</p></div>';

    // Normalization helper for Arabic text
    const normalizeArabic = (text) => {
        return (text || '').toString().toLowerCase()
            .replace(/[أإآ]/g, 'ا')
            .replace(/[ة]/g, 'ه')
            .replace(/[ي]/g, 'ى');
    }
    const normalizedQuery = normalizeArabic(query);

    try {
        let allMatchingClients = new Map();

        // مرحلة 1: نتائج سريعة بالاسم فقط (تظهر فورًا)
        const clients = await (typeof getAllClientsCached === 'function' ? getAllClientsCached() : getAllClients());
        if (token !== __quickSearchToken) return;
        const clientsById = new Map((Array.isArray(clients) ? clients : []).map(c => [c.id, c]));

        const nameMatches = (Array.isArray(clients) ? clients : []).filter(c => normalizeArabic(c?.name).includes(normalizedQuery));
        nameMatches.forEach(client => {
            if (!allMatchingClients.has(client.id)) allMatchingClients.set(client.id, []);
            allMatchingClients.get(client.id).push(`الاسم: ${client.name}`);
        });

        // عرض سريع أولي
        try {
            if (nameMatches.length > 0) {
                let htmlFast = '';
                for (const client of nameMatches.slice(0, 30)) {
                    htmlFast += __buildClientCardHTML(client, { opponentsCount: 0, casesCount: 0, totalSessions: 0 });
                }
                clientsList.innerHTML = htmlFast;
                attachClientCardListeners();
            }
        } catch (_) { }

        // مرحلة 2: بحث شامل + تجهيز العدادات (يتعمل في وقت فاضي)
        const doFull = async () => {
            try {
                if (token !== __quickSearchToken) return;

                const opponents = await getAllOpponents();
                if (token !== __quickSearchToken) return;

                const allCases = await getAllCases();
                if (token !== __quickSearchToken) return;

                const allSessions = await getAllSessions();
                if (token !== __quickSearchToken) return;



                const matchingOpponents = (Array.isArray(opponents) ? opponents : []).filter(o => normalizeArabic(o?.name).includes(normalizedQuery));
                const matchingOpponentIds = new Set(matchingOpponents.map(o => o.id));
                const opponentNameById = new Map((Array.isArray(opponents) ? opponents : []).map(o => [o.id, o]));

                // خريطة القضايا لكل موكل + عد الجلسات لكل قضية
                const casesByClient = new Map();
                const clientIdByCaseId = new Map();
                for (const cs of (Array.isArray(allCases) ? allCases : [])) {
                    const arr = casesByClient.get(cs.clientId) || [];
                    arr.push(cs);
                    casesByClient.set(cs.clientId, arr);
                    try {
                        if (cs && cs.id != null && cs.clientId != null) {
                            // Keep both numeric and string keys to avoid type-mismatch issues.
                            clientIdByCaseId.set(cs.id, cs.clientId);
                            clientIdByCaseId.set(String(cs.id), cs.clientId);
                        }
                    } catch (_) { }
                }
                const sessionsCountByCase = new Map();
                for (const s of (Array.isArray(allSessions) ? allSessions : [])) {
                    sessionsCountByCase.set(s.caseId, (sessionsCountByCase.get(s.caseId) || 0) + 1);
                }

                // تطابق الخصوم: أي قضية خصمها مطابق
                for (const cs of (Array.isArray(allCases) ? allCases : [])) {
                    if (!cs || !cs.clientId) continue;
                    if (cs.opponentId && matchingOpponentIds.has(cs.opponentId)) {
                        const opp = opponentNameById.get(cs.opponentId);
                        const oppName = (opp && opp.name) ? opp.name : '';
                        if (!allMatchingClients.has(cs.clientId)) allMatchingClients.set(cs.clientId, []);
                        if (oppName) allMatchingClients.get(cs.clientId).push(`الخصم: ${oppName}`);
                    }
                }

                // تطابق أرقام القضايا (دعوى، استئناف)
                for (const cs of (Array.isArray(allCases) ? allCases : [])) {
                    if (!cs || !cs.clientId) continue;

                    // Case Number
                    const num = (cs.caseNumber != null) ? String(cs.caseNumber) : '';
                    if (num && normalizeArabic(num).includes(normalizedQuery)) {
                        if (!allMatchingClients.has(cs.clientId)) allMatchingClients.set(cs.clientId, []);
                        allMatchingClients.get(cs.clientId).push(`رقم الدعوى: ${cs.caseNumber}`);
                    }

                    // Appeal Number
                    const appNum = (cs.appealNumber != null) ? String(cs.appealNumber) : '';
                    if (appNum && normalizeArabic(appNum).includes(normalizedQuery)) {
                        if (!allMatchingClients.has(cs.clientId)) allMatchingClients.set(cs.clientId, []);
                        allMatchingClients.get(cs.clientId).push(`رقم الاستئناف: ${cs.appealNumber}`);
                    }
                }

                // تطابق رقم الحصر من جدول الجلسات
                for (const s of (Array.isArray(allSessions) ? allSessions : [])) {
                    const inv = (s && s.inventoryNumber != null) ? String(s.inventoryNumber) : '';
                    const invYear = (s && s.inventoryYear != null) ? String(s.inventoryYear) : '';
                    if (!inv) continue;
                    const invNorm = normalizeArabic(inv);
                    const yearNorm = normalizeArabic(invYear);
                    const combo1 = invYear ? normalizeArabic(inv + '/' + invYear) : invNorm;
                    const combo2 = invYear ? normalizeArabic(inv + ' ' + invYear) : invNorm;

                    if (!(invNorm.includes(normalizedQuery) || (invYear && yearNorm.includes(normalizedQuery)) || combo1.includes(normalizedQuery) || combo2.includes(normalizedQuery))) {
                        continue;
                    }

                    // جلساتك بتتسجل على القضية (caseId) مش على الموكل مباشرة (clientId)
                    // فلو clientId مش موجود داخل السجل، بنجيبه من جدول القضايا.
                    const cid = (s && s.clientId != null) ? s.clientId : (clientIdByCaseId.get(s.caseId) ?? clientIdByCaseId.get(String(s.caseId)));
                    if (!cid) continue;
                    if (!allMatchingClients.has(cid)) allMatchingClients.set(cid, []);
                    allMatchingClients.get(cid).push(`رقم الحصر: ${inv}${invYear ? (' / ' + invYear) : ''}`);
                }

                const matchingClientIds = Array.from(allMatchingClients.keys());
                let validMatchingClients = matchingClientIds.map(id => clientsById.get(id)).filter(Boolean);
                if (token !== __quickSearchToken) return;

                const compareByNameAsc = (a, b) => (a.name || '').localeCompare(b.name || '', 'ar');
                const compareByNameDesc = (a, b) => (b.name || '').localeCompare(a.name || '', 'ar');
                const normalizeDate = (v) => {
                    if (v instanceof Date) return v.getTime();
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') {
                        const t = Date.parse(v);
                        return isNaN(t) ? 0 : t;
                    }
                    return 0;
                };
                const getCreated = (x) => normalizeDate(x?.createdAt ?? x?.created_at ?? x?.created ?? x?.addedAt ?? x?.id ?? 0);
                const compareByCreatedAsc = (a, b) => getCreated(a) - getCreated(b);
                const compareByCreatedDesc = (a, b) => getCreated(b) - getCreated(a);
                const field = sessionStorage.getItem('sort_field') || 'name';
                const dir = sessionStorage.getItem('sort_dir') || 'asc';
                if (field === 'name') {
                    validMatchingClients.sort(dir === 'asc' ? compareByNameAsc : compareByNameDesc);
                } else {
                    validMatchingClients.sort(dir === 'asc' ? compareByCreatedAsc : compareByCreatedDesc);
                }

                validMatchingClients = __deferFullyArchivedClientsToBottom(validMatchingClients, casesByClient);

                if (validMatchingClients.length === 0) {
                    clientsList.innerHTML = `
                        <div class="text-center text-gray-500 py-12">
                            <i class="ri-search-line text-4xl mb-4 text-gray-400"></i>
                            <p class="text-lg font-medium">لا توجد نتائج للبحث</p>
                            <p class="text-sm text-gray-400 mt-2">جرب كلمات مفتاحية أخرى</p>
                        </div>
                    `;
                    const displayedResultsElement = document.getElementById('displayed-results');
                    if (displayedResultsElement) displayedResultsElement.textContent = 0;
                    return;
                }

                let clientOpponentRelations = {};
                try { clientOpponentRelations = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}'); } catch (_) { clientOpponentRelations = {}; }

                let html = '';
                for (const client of validMatchingClients) {
                    const cases = casesByClient.get(client.id) || [];
                    const caseOpponentIds = [...new Set(cases.map(c => c.opponentId).filter(id => id))];
                    const tempOpponentIds = (clientOpponentRelations && clientOpponentRelations[client.id]) ? clientOpponentRelations[client.id] : [];
                    const uniqueOpponentIds = [...new Set([...caseOpponentIds, ...tempOpponentIds])];
                    const opponentsCount = uniqueOpponentIds.length;
                    let totalSessions = 0;
                    for (const caseRecord of cases) {
                        totalSessions += (sessionsCountByCase.get(caseRecord.id) || 0);
                    }

                    let archiveStatus = 'none';
                    let archivedCount = 0;
                    if (cases.length > 0) {
                        archivedCount = cases.filter(c => c.isArchived === true).length;
                        if (archivedCount === cases.length) {
                            archiveStatus = 'all';
                        } else if (archivedCount > 0) {
                            archiveStatus = 'partial';
                        }
                    }

                    const matches = allMatchingClients.get(client.id) || [];
                    const matchesHtml = matches.length > 0 ? `
                        <div class="flex items-center gap-2 mt-2">
                            ${matches.slice(0, 3).map(match => {
                        let bgColor = 'bg-purple-100';
                        let textColor = 'text-purple-700';
                        let iconColor = 'text-purple-600';
                        let icon = 'ri-search-eye-line';

                        if (match.includes('الاسم:')) {
                            bgColor = 'bg-blue-100';
                            textColor = 'text-blue-700';
                            iconColor = 'text-blue-600';
                            icon = 'ri-user-3-line';
                        } else if (match.includes('الخصم:')) {
                            bgColor = 'bg-red-100';
                            textColor = 'text-red-700';
                            iconColor = 'text-red-600';
                            icon = 'ri-shield-user-line';
                        } else if (match.includes('رقم الدعوى:') || match.includes('سنة الدعوى:') || match.includes('رقم الاستئناف:')) {
                            bgColor = 'bg-indigo-100';
                            textColor = 'text-indigo-700';
                            iconColor = 'text-indigo-600';
                            icon = 'ri-briefcase-line';
                        } else if (match.includes('رقم الحصر:') || match.includes('سنة الحصر:')) {
                            bgColor = 'bg-purple-100';
                            textColor = 'text-purple-700';
                            iconColor = 'text-purple-600';
                            icon = 'ri-file-list-3-line';
                        } else if (match.includes('رقم التوكيل:')) {
                            bgColor = 'bg-emerald-100';
                            textColor = 'text-emerald-700';
                            iconColor = 'text-emerald-600';
                            icon = 'ri-file-text-line';
                        }

                        return `
                                    <div class="flex items-center gap-1 ${bgColor} px-2 py-1 rounded-full">
                                        <i class="${icon} ${iconColor} text-xs"></i>
                                        <span class="text-xs font-medium ${textColor}">${match}</span>
                                    </div>
                                `;
                    }).join('')}
                            ${matches.length > 3 ? `
                                <div class="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                    <i class="ri-more-line text-gray-600 text-xs"></i>
                                    <span class="text-xs font-medium text-gray-700">+${matches.length - 3}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : '';

                    html += __buildClientCardHTML(client, { 
                        opponentsCount, 
                        casesCount: cases.length, 
                        totalSessions, 
                        archiveStatus, 
                        archivedCount,
                        matchesHtml 
                    });
                }

                if (token !== __quickSearchToken) return;
                clientsList.innerHTML = html;
                attachClientCardListeners();
            } catch (e) {
                // تجاهل
            }
        };

        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(() => { try { doFull(); } catch (_) { } }, { timeout: 1200 });
        } else {
            setTimeout(() => { try { doFull(); } catch (_) { } }, 0);
        }

    } catch (error) {
        console.error('Search error:', error);
        clientsList.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="ri-error-warning-line text-2xl mb-2"></i>
                <p>خطأ في البحث</p>
            </div>
        `;
    }
}


async function updateQuickStats() {
    try {
        const clients = await (typeof getAllClientsCached === 'function' ? getAllClientsCached() : getAllClients());
        const archivedCasesElement = document.getElementById('archived-cases-count');
        const activeCasesElement = document.getElementById('active-cases-count');
        const noCasesElement = document.getElementById('clients-no-cases');
        const noSessionsElement = document.getElementById('clients-no-sessions');

        if (!Array.isArray(clients) || clients.length === 0) {
            if (archivedCasesElement) archivedCasesElement.textContent = '0';
            if (activeCasesElement) activeCasesElement.textContent = '0';
            if (noCasesElement) noCasesElement.textContent = '0';
            if (noSessionsElement) noSessionsElement.textContent = '0';
            return;
        }

        const allCases = await getAllCases();
        const allSessions = await getAllSessions();

        const casesByClient = new Map();
        for (const cs of (Array.isArray(allCases) ? allCases : [])) {
            const arr = casesByClient.get(cs.clientId) || [];
            arr.push(cs);
            casesByClient.set(cs.clientId, arr);
        }

        const sessionsCountByCase = new Map();
        for (const s of (Array.isArray(allSessions) ? allSessions : [])) {
            sessionsCountByCase.set(s.caseId, (sessionsCountByCase.get(s.caseId) || 0) + 1);
        }

        let archivedCasesCount = 0;
        let activeCasesCount = 0;
        let clientsWithoutCases = 0;
        let clientsWithoutSessions = 0;

        for (const cs of (Array.isArray(allCases) ? allCases : [])) {
            if (!cs) continue;
            if (cs.isArchived === true) archivedCasesCount++;
            else activeCasesCount++;
        }

        for (const client of clients) {
            const cid = client && client.id != null ? client.id : null;
            if (cid == null) continue;

            const cases = casesByClient.get(cid) || [];
            if (cases.length === 0) {
                clientsWithoutCases++;
                clientsWithoutSessions++;
                continue;
            }

            let totalSessions = 0;
            for (const caseRecord of cases) {
                totalSessions += (sessionsCountByCase.get(caseRecord.id) || 0);
            }
            if (totalSessions === 0) clientsWithoutSessions++;
        }

        if (archivedCasesElement) archivedCasesElement.textContent = String(archivedCasesCount);
        if (activeCasesElement) activeCasesElement.textContent = String(activeCasesCount);
        if (noCasesElement) noCasesElement.textContent = String(clientsWithoutCases);
        if (noSessionsElement) noSessionsElement.textContent = String(clientsWithoutSessions);
    } catch (error) {
        console.error('خطأ في تحديث الإحصائيات:', error);
    }
}

async function handleDeleteClient(clientId) {
    try {

        const client = await getById('clients', clientId);
        if (!client) {
            showToast('الموكل غير موجود', 'error');
            return;
        }


        const cases = await getFromIndex('cases', 'clientId', clientId);

        const opponentIdsToCheck = new Set();
        try {
            for (const cs of (cases || [])) {
                if (cs && cs.opponentId != null) opponentIdsToCheck.add(cs.opponentId);
            }
        } catch (_) { }
        try {
            const rel = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}');
            const tempOpps = Array.isArray(rel[clientId]) ? rel[clientId] : [];
            tempOpps.forEach(id => { if (id != null) opponentIdsToCheck.add(id); });
        } catch (_) { }


        let confirmMessage = `هل أنت متأكد من حذف الموكل "${client.name}"؟`;
        if (cases.length > 0) {
            confirmMessage += `\n\nتحذير: سيتم حذف ${cases.length} قضية مرتبطة بهذا الموكل وجميع الجلسات المرتبطة بها.`;
        }

        const ok = window.safeConfirm ? await safeConfirm(confirmMessage) : confirm(confirmMessage);
        if (!ok) {
            return;
        }


        try {
            const rel = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}');
            if (rel && Object.prototype.hasOwnProperty.call(rel, clientId)) {
                delete rel[clientId];
                localStorage.setItem('clientOpponentRelations', JSON.stringify(rel));
            }
        } catch (_) { }


        for (const caseRecord of cases) {
            const sessions = await getFromIndex('sessions', 'caseId', caseRecord.id);
            for (const session of sessions) {
                await deleteRecord('sessions', session.id);
            }
        }


        for (const caseRecord of cases) {
            await deleteRecord('cases', caseRecord.id);
        }


        try {
            let rel = {};
            try { rel = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}'); } catch (_) { rel = {}; }
            const relValues = Object.values(rel || {});
            const opponentReferencedInRelations = (opponentId) => {
                try {
                    for (const v of relValues) {
                        if (!Array.isArray(v)) continue;
                        if (v.includes(opponentId)) return true;
                    }
                } catch (_) { }
                return false;
            };

            for (const opponentId of opponentIdsToCheck) {
                try {
                    if (opponentId == null) continue;
                    const otherCases = await getFromIndex('cases', 'opponentId', opponentId);
                    const hasOtherCases = Array.isArray(otherCases) && otherCases.length > 0;
                    if (hasOtherCases) continue;

                    if (opponentReferencedInRelations(opponentId)) continue;

                    await deleteRecord('opponents', opponentId);
                } catch (_) { }
            }
        } catch (_) { }


        await deleteRecord('clients', clientId);


        showToast('تم حذف الموكل وجميع القضايا والجلسات المرتبطة به بنجاح', 'success');


        await loadAllClients();


        await updateQuickStats();


        await updateCountersInHeader();

    } catch (error) {
        console.error('خطأ في حذف الموكل:', error);
        showToast('حدث خطأ أثناء حذف الموكل', 'error');
    }
}


async function handleCreateFolderAndUploadForClient(clientName) {
    if (!clientName) {
        showToast('يجب تحديد اسم الموكل', 'error');
        return;
    }


    if (!window.electronAPI || !window.electronAPI.createClientFolder) {
        showToast('هذه الميزة متاحة فقط في تطبيق سطح المكتب', 'error');
        return;
    }

    const doAttach = async () => {
        try {
            let attachMode = 'copy';
            try {
                const savedMode = await getSetting('attachMode');
                if (savedMode === 'move' || savedMode === 'copy') {
                    attachMode = savedMode;
                }
            } catch (e) {
                attachMode = 'copy';
            }
            const result = await window.electronAPI.createClientFolder(clientName, attachMode);
            if (result.success) {
                if (result.filesCount > 0) {
                    showToast(`✓ تم إرفاق الملفات`, 'success');
                } else {
                    showToast(`✓ تم إنشاء المجلد`, 'success');
                }
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            showToast('حدث خطأ في إنشاء المجلد', 'error');
        }
    };

    try {
        try {
            if (localStorage.getItem('desktop_path_warning_suppressed') === '1') {
                await doAttach();
                return;
            }
        } catch (_) { }

        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning(
                            { path: chk.path, desktop: chk.desktop },
                            { onContinue: () => { try { doAttach(); } catch (_) { } } }
                        );
                    }
                } catch (_) { }
                return;
            }
        }
    } catch (_) { }

    await doAttach();
}


async function handleOpenFolderForClient(clientName) {
    if (!clientName) {
        showToast('يجب تحديد اسم الموكل', 'error');
        return;
    }


    if (!window.electronAPI || !window.electronAPI.openClientFolder) {
        showToast('هذه الميزة متاحة فقط في تطبيق سطح المكتب', 'error');
        return;
    }

    try {
        const result = await window.electronAPI.openClientFolder(clientName);
        if (result.success) {
            showToast('✓ المجلد مفتوح', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error opening folder:', error);
        showToast('حدث خطأ في فتح المجلد', 'error');
    }
}


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
; function syncDeleteBtnLabelToViewport(root = document) { try { const isMobile = window.innerWidth <= 768; root.querySelectorAll('#clients-list .delete-client-btn').forEach(btn => { const iconClass = 'ri-delete-bin-line'; let icon = btn.querySelector('i'); if (isMobile) { if (icon && btn.textContent.trim() === '') return; if (!icon) { btn.innerHTML = '<i class="' + iconClass + ' ml-1"></i>'; return; } btn.innerHTML = icon.outerHTML; } else { const desired = '<i class="' + iconClass + ' ml-1"></i>حذف'; if (btn.innerHTML.trim() === desired) return; if (!icon) { btn.innerHTML = desired; return; } btn.innerHTML = desired; } }) } catch (_) { } }
; document.addEventListener('DOMContentLoaded', function () { try { const init = function () { const target = document.getElementById('clients-list'); if (!target) { setTimeout(init, 60); return } let mo; const apply = function () { try { mo && mo.disconnect() } catch (e) { }; syncDeleteBtnLabelToViewport(); try { mo && mo.observe(target, { childList: true, subtree: true }) } catch (e) { } }; syncDeleteBtnLabelToViewport(); try { mo = new MutationObserver(apply); mo.observe(target, { childList: true, subtree: true }); window.__clientsListMO = mo } catch (e) { } }; init(); window.addEventListener('resize', function () { syncDeleteBtnLabelToViewport() }) } catch (e) { } });
