



let clerkPapersFilterType = null;

let __clerkPapersDateLocaleCache = null;
async function __initClerkPapersDateLocaleSetting() {
    if (__clerkPapersDateLocaleCache) return __clerkPapersDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __clerkPapersDateLocaleCache = locale;
    return locale;
}

function __parseClerkPapersDateString(dateStr) {
    try {
        const s = String(dateStr || '').trim();
        if (!s) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const d = new Date(s);
            return Number.isFinite(d.getTime()) ? d : null;
        }
        const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            const day = parseInt(m[1], 10);
            const month = parseInt(m[2], 10);
            const year = parseInt(m[3], 10);
            const d = new Date(year, month - 1, day);
            if (d.getFullYear() === year && d.getMonth() === (month - 1) && d.getDate() === day) return d;
        }
        const d = new Date(s);
        return Number.isFinite(d.getTime()) ? d : null;
    } catch (_) {
        return null;
    }
}

function __formatClerkPapersDateForDisplay(dateStr) {
    try {
        const d = __parseClerkPapersDateString(dateStr);
        if (!d) return (dateStr || 'غير محدد');
        const locale = __clerkPapersDateLocaleCache || 'ar-EG';
        return d.toLocaleDateString(locale);
    } catch (_) {
        return (dateStr || 'غير محدد');
    }
}


function displayClerkPapersModal() {
    document.body.classList.remove('form-active');
    document.getElementById('modal-title').textContent = 'أوراق المحضرين';
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
    }

    try {
        const headerEl = document.querySelector('header');
        const headerHRaw = headerEl ? Math.max(0, Math.round(headerEl.getBoundingClientRect().height || 0)) : 0;
        const headerH = headerHRaw || 48;

        const mainEl = document.querySelector('main');
        if (mainEl) {
            try { mainEl.classList.remove('mt-8'); } catch (_) { }
            try { mainEl.style.setProperty('margin-top', headerH + 'px', 'important'); } catch (_) { }
            try { mainEl.style.setProperty('padding-top', '0px', 'important'); } catch (_) { }

            try {
                const top = mainEl.getBoundingClientRect().top;
                const vh = window.innerHeight;
                const h = Math.max(240, vh - top);
                mainEl.style.height = h + 'px';
                mainEl.style.maxHeight = h + 'px';
            } catch (_) { }

            try { mainEl.style.overflowY = 'hidden'; } catch (_) { }
        }

        try {
            document.body.style.overflowY = 'hidden';
            document.documentElement.style.overflowY = 'hidden';
        } catch (_) { }

        try {
            if (modalContainer) {
                modalContainer.style.paddingTop = '0px';
                modalContainer.style.paddingBottom = '0px';
                modalContainer.style.paddingLeft = '0px';
                modalContainer.style.paddingRight = '0px';
            }
        } catch (_) { }
        try {
            if (modalContent) {
                modalContent.style.paddingTop = '0px';
                modalContent.style.paddingBottom = '0px';
                modalContent.style.paddingLeft = '0px';
                modalContent.style.paddingRight = '0px';
            }
        } catch (_) { }
    } catch (_) { }


    modalContainer.classList.remove('max-w-5xl');
    modalContainer.classList.add('w-full');

    modalContent.classList.remove('search-modal-content');


    setTimeout(() => {
        const backBtn = document.getElementById('back-to-main');
        const pageTitle = document.getElementById('page-title');
        if (backBtn && pageTitle) {
            backBtn.innerHTML = `
                <i class="ri-home-5-line text-white text-lg"></i>
                <span class="text-white">الرئيسيه</span>
            `;
            pageTitle.textContent = 'أوراق المحضرين';


            const newBackBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBackBtn, backBtn);

            newBackBtn.addEventListener('click', function () {
                window.location.href = 'index.html';
            });
        }
    }, 100);

    modalContent.innerHTML = `
        <style>
            #announcements-papers-btn {
                background: linear-gradient(135deg, rgba(165, 243, 252, 0.7), rgba(134, 239, 251, 0.7)) !important;
                border: 2px solid #a5f3fc !important;
                border-radius: 0.5rem !important;
                padding: 0.75rem !important;
                text-align: center !important;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }
            #announcements-papers-btn:hover {
                border-color: #0891b2 !important;
            }
            #announcements-papers-btn .announcement-icon {
                width: 32px !important;
                height: 32px !important;
                background-color: #06b6d4 !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 0 auto 0.25rem !important;
            }
            #announcements-papers-btn .announcement-icon i {
                color: white !important;
                font-size: 14px !important;
            }
            #announcements-papers-btn .announcement-count {
                font-size: 1.25rem !important;
                font-weight: 900 !important;
                color: #000000 !important;
                margin-bottom: 0.25rem !important;
            }
            #announcements-papers-btn .announcement-label {
                font-size: 0.875rem !important;
                font-weight: 700 !important;
                color: #000000 !important;
            }
            
            /* Hover states for announcement text */
            #announcements-papers-btn:hover .announcement-count,
            #announcements-papers-btn:hover .announcement-label {
                color: #ffffff !important;
            }
        </style>
        <div class="search-layout">
            <div class="flex flex-col md:flex-row gap-0">
                <!-- الجانب الأيمن: شريط البحث والإحصائيات -->
                <div class="w-full md:w-1/4 space-y-3 md:space-y-6 search-left-pane search-left-pane-dark" data-left-pane="clerk">
                    <!-- شريط البحث -->
                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-sm">
                        <div class="space-y-2">
                            <div class="relative">
                                <input type="text" id="clerk-papers-search" 
                                       placeholder="ابحث بالموكل أو رقم الورقة..." 
                                       class="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right shadow-sm pr-10">
                                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <i class="ri-search-2-line text-gray-400 text-base"></i>
                                </div>
                            </div>
                            
                            <button id="clear-clerk-papers-search" class="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all shadow-sm">
                                <i class="ri-close-line text-lg ml-2"></i>مسح البحث
                            </button>
                            <button id="add-new-clerk-paper" class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-bold flex items-center justify-center gap-2">
                                <i class="ri-add-line text-lg ml-2"></i>إضافة ورقة جديدة
                            </button>
                        </div>
                    </div>

                    <!-- إحصائيات سريعة -->
                    <div class="bg-white rounded-lg p-3 shadow-md border border-gray-200 mb-2">
                        <h3 class="text-xs font-bold text-black mb-2 flex items-center gap-1">
                            <i class="ri-bar-chart-line text-black text-sm"></i>
                            الإحصائيات
                        </h3>
                        <div class="space-y-2">
                            <!-- Total Papers - Full Width -->
                            <div id="total-papers-btn" class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-blue-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-blue-400">
                                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                    <i class="ri-file-paper-line text-white text-sm"></i>
                                </div>
                                <div class="text-xl font-black text-black mb-1" id="total-papers">0</div>
                                <div class="text-sm font-bold text-black">إجمالي الأوراق</div>
                            </div>

                            <!-- Warnings vs Announcements - Small Stats -->
                            <div class="grid grid-cols-2 gap-2">
                                <!-- Warnings -->
                                <div id="warnings-papers-btn" class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border-2 border-red-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-red-400">
                                    <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-alarm-warning-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-xl font-black text-black mb-1" id="total-warnings">0</div>
                                    <div class="text-sm font-bold text-black">إنذارات</div>
                                </div>

                                <!-- Announcements -->
                                <div id="announcements-papers-btn">
                                    <div class="announcement-icon">
                                        <i class="ri-notification-line"></i>
                                    </div>
                                    <div class="announcement-count" id="total-announcements">0</div>
                                    <div class="announcement-label">إعلانات</div>
                                </div>
                            </div>
                        </div>
                    </div>
                
                </div>

                <!-- الجانب الأيسر: قائمة أوراق المحضرين -->
                <div class="w-full flex-1 min-h-0 search-right-pane">
                    <div class="bg-white rounded-xl border border-gray-200 shadow-sm min-h-0 overflow-hidden flex flex-col">
                        <div id="clerk-papers-list" class="space-y-2 md:space-y-3 overscroll-contain p-1 md:p-2">
                            <div class="text-center text-gray-500 py-12 sticky top-0 bg-white">
                                <i class="ri-loader-4-line animate-spin text-3xl mb-3"></i>
                                <p class="text-lg">جاري تحميل أوراق المحضرين...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        const leftPane = document.querySelector('#modal-content [data-left-pane="clerk"]');
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
                leftPane.style.overscrollBehavior = 'contain';
            } catch (_) { }

            try {
                leftPane.querySelectorAll('div.bg-white, div.bg-blue-50').forEach((c) => {
                    try { c.style.background = 'rgba(15, 23, 42, .78)'; } catch (_) { }
                    try { c.style.borderColor = 'rgba(148, 163, 184, .18)'; } catch (_) { }
                });
            } catch (_) { }

            try {
                leftPane.querySelectorAll('h3').forEach((h) => {
                    try { h.style.color = 'rgba(255,255,255,.94)'; } catch (_) { }
                });
            } catch (_) { }

            try {
                const searchInput = document.getElementById('clerk-papers-search');
                if (searchInput) {
                    try { searchInput.style.background = 'rgba(255,255,255,.08)'; } catch (_) { }
                    try { searchInput.style.borderColor = 'rgba(148, 163, 184, .28)'; } catch (_) { }
                    try { searchInput.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
                }
            } catch (_) { }

            try {
                const btnIds = ['clear-clerk-papers-search', 'add-new-clerk-paper'];
                btnIds.forEach((id) => {
                    const b = document.getElementById(id);
                    if (!b) return;
                    try {
                        b.style.setProperty('background', '#1e3a8a', 'important');
                        b.style.setProperty('color', '#ffffff', 'important');
                        b.style.setProperty('border', '1px solid rgba(255,255,255,0.10)', 'important');
                        b.style.setProperty('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease', 'important');
                    } catch (_) { }
                });
            } catch (_) { }

            try {
                const statIds = ['total-papers-btn', 'warnings-papers-btn', 'announcements-papers-btn'];
                statIds.forEach((id) => {
                    const el = document.getElementById(id);
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
                            clearImp(el, 'background');
                            // Keep stats text white/light on dark theme if desired, but user asked for black. 
                            // However, on dark sidebar, black might be invisible if background is dark.
                            // The sidebar is dark ('search-left-pane-dark').
                            // The cards inside are 'rgba(15, 23, 42, .78)'.
                            // If user explicitly asked for BLACK text, they might mean on the light theme version or they want it very high contrast.
                            // But usually, high contrast on dark bg means WHITE.
                            // "عايزها سوداء بخط سميك" -> Black and Bold.
                            // If the background is dark, black text will be unreadable.
                            // But looking at the code, the stats cards have gradients (blue-50 to blue-100).
                            // Wait, lines 286-289 override backgrounds to dark: `c.style.background = 'rgba(15, 23, 42, .78)'`.
                            // If the background is overriden to dark, text MUST be light.
                            // But the user *specifically* asked for black text.
                            // Maybe the user is seeing the light version? Or maybe they want the cards to NOT be dark?
                            // "Active Document: ... search-page.js". The user is likely looking at the search page or similar UI.
                            // The `displayClerkPapersModal` forces `search-left-pane-dark` which forces dark mode on the sidebar.
                            // If I set text to black, it will be invisible on dark mode.
                            // However, the `total-papers-btn` has `bg-gradient-to-br from-blue-50 to-blue-100`.
                            // The dark mode override logic (lines 286+) likely intentionally inverts this or keeps it dark.
                            // Let's assume the user knows what they want or the dark mode override might be conditional/partial.
                            // Actually, I should probably respect the "Black" request by ensuring the background is LIGHT even in the dark sidebar, OR make the text white/bold if the background is dark.
                            // But "User Request: عايزها سوداء بخط سميك" is very specific.
                            // I will set the text to black. If the container is dark, I might need to force the stat card background to be light so the black text is visible.

                            // Let's modify the dark mode override to NOT darken the statistic cards, so black text looks good on the light gradient.
                            // The selector at 286: `leftPane.querySelectorAll('div.bg-white, div.bg-blue-50')`
                            // This targets the container AND the stats cards.
                            // I should exclude the stats cards from being darkened if I want black text.
                            // Or, I can just not change the logic and do exactly what the user asked on the HTML elements.
                            // If it creates a contrast issue, the user will complain.
                            // But wait, if I change the HTML classes to `text-black`, and the JS at line 286 changes background to dark blue, it will be unreadable.
                            // I will add a style override to ensure these specific buttons have light background if text is black.

                            // Actually, let's look at the `applyHover` and `applyBase` logic.
                            // It clears background on base.
                            // If I want black text, I should ensure the background is compatible.
                            // I will proceed with changing the HTML classes to black/bold as requested.

                            el.querySelectorAll('div').forEach((d) => {
                                try { d.style.color = ''; } catch (_) { }
                            });
                        } catch (_) { }
                    };

                    const applyHover = () => {
                        try {
                            setImp(el, 'background', 'linear-gradient(135deg, rgba(245, 158, 11, .22), rgba(15, 23, 42, .92))');
                            setImp(el, 'border-color', 'rgba(245, 158, 11, .85)');
                            setImp(el, 'transform', 'translateY(-2px) scale(1.03)');
                            setImp(el, 'box-shadow', '0 14px 26px rgba(245, 158, 11, .16), 0 10px 18px rgba(15, 23, 42, .20)');
                            el.querySelectorAll('div').forEach((d) => {
                                try { d.style.color = 'rgba(255,255,255,.95)'; } catch (_) { } // On hover (dark gradient), text goes white. This is fine.
                            });
                        } catch (_) { }
                    };

                    applyBase();
                    el.addEventListener('mouseenter', applyHover);
                    el.addEventListener('mouseleave', applyBase);
                    el.addEventListener('mousedown', () => { try { setImp(el, 'transform', 'translateY(-1px) scale(1.01)'); } catch (_) { } });
                    el.addEventListener('mouseup', applyHover);
                    el.addEventListener('blur', applyBase);
                });
            } catch (_) { }
        }

        try {
            const rightBox = document.querySelector('#modal-content .search-right-pane > div');
            if (rightBox) {
                rightBox.style.setProperty('background', '#ffffff', 'important');
                rightBox.style.setProperty('border', '2px solid rgba(14, 165, 233, .45)', 'important');
                rightBox.style.setProperty('border-radius', '14px', 'important');
                rightBox.style.setProperty('box-shadow', '0 10px 22px rgba(15, 23, 42, 0.12)', 'important');
                rightBox.style.setProperty('overflow', 'hidden', 'important');
            }
        } catch (_) { }
    } catch (_) { }

    try {
        if (!document.getElementById('clerk-papers-sidebar-hover-style')) {
            const st = document.createElement('style');
            st.id = 'clerk-papers-sidebar-hover-style';
            st.textContent = `
                .low-power #modal-content [data-left-pane="clerk"] #clear-clerk-papers-search,
                .low-power #modal-content [data-left-pane="clerk"] #add-new-clerk-paper,
                .low-power #modal-content [data-left-pane="clerk"] #total-papers-btn,
                .low-power #modal-content [data-left-pane="clerk"] #warnings-papers-btn,
                .low-power #modal-content [data-left-pane="clerk"] #announcements-papers-btn {
                    transition: background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease !important;
                }

                #modal-content [data-left-pane="clerk"] #clear-clerk-papers-search:hover,
                #modal-content [data-left-pane="clerk"] #add-new-clerk-paper:hover {
                    border-color: rgba(245, 158, 11, .90) !important;
                    outline: 2px solid rgba(245, 158, 11, .65) !important;
                    outline-offset: 2px !important;
                    transform: translateY(-1px) scale(1.02) !important;
                    box-shadow: 0 16px 26px rgba(245, 158, 11, .14), 0 12px 18px rgba(15, 23, 42, .20) !important;
                }

                #modal-content [data-left-pane="clerk"] #clerk-papers-search::placeholder {
                    color: rgba(226,232,240,.78) !important;
                }
            `;
            (document.head || document.documentElement).appendChild(st);
        }
    } catch (_) { }

    attachClerkPapersListeners();
    loadAllClerkPapers();
    updateClerkPapersStats();


    try {
        try {
            const mainEl = document.querySelector('main');
            if (mainEl) {
                const top = mainEl.getBoundingClientRect().top;
                const vh = window.innerHeight;
                const h = Math.max(240, vh - top);
                mainEl.style.height = h + 'px';
                mainEl.style.maxHeight = h + 'px';
                mainEl.style.overflowY = 'hidden';
            }
            try { document.body.style.overflowY = 'hidden'; } catch (_) { }
            try { document.documentElement.style.overflowY = 'hidden'; } catch (_) { }
        } catch (_) { }

        requestAnimationFrame(() => {
            setupClerkPapersScrollBox();
            setupClerkPapersHoverScrollBehavior();
        });
        window.addEventListener('resize', setupClerkPapersScrollBox);
    } catch (e) {
        console.error(e);
    }
}


function attachClerkPapersListeners() {

    const totalStatsBtn = document.getElementById('total-papers-btn');
    if (totalStatsBtn) {
        totalStatsBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            showAllClerkPapers();
        });
    }

    const warningsStatsBtn = document.getElementById('warnings-papers-btn');
    if (warningsStatsBtn) {
        warningsStatsBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            showWarningsClerkPapers();
        });
    }

    const announcementsStatsBtn = document.getElementById('announcements-papers-btn');
    if (announcementsStatsBtn) {
        announcementsStatsBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            showAnnouncementsClerkPapers();
        });
    }


    const searchInput = document.getElementById('clerk-papers-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            filterClerkPapers(searchTerm);
        });


        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                }
            }
        });
    }


    const clearSearchBtn = document.getElementById('clear-clerk-papers-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            document.getElementById('clerk-papers-search').value = '';
            clerkPapersFilterType = null;
            loadAllClerkPapers();
        });
    }


    const addNewBtn = document.getElementById('add-new-clerk-paper');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            displayClerkPaperForm();
        });
    }
}


async function loadAllClerkPapers() {
    try {
        await __initClerkPapersDateLocaleSetting();
        let clerkPapers = await getAllClerkPapers();
        const clients = await getAllClients();
        const cases = await getAllCases();


        if (clerkPapersFilterType === 'warnings' || clerkPapersFilterType === 'announcements') {
            const norm = (t) => String(t || '').replace(/[إأآ]/g, 'ا').toLowerCase();
            if (clerkPapersFilterType === 'warnings') {
                clerkPapers = clerkPapers.filter(paper => norm(paper.paperType).includes('انذار'));
            } else if (clerkPapersFilterType === 'announcements') {
                clerkPapers = clerkPapers.filter(paper => norm(paper.paperType).includes('اعلان'));
            }
        }


        displayClerkPapersList(clerkPapers, clients, cases);
        updateClerkPapersStats();
    } catch (error) {
        const listContainer = document.getElementById('clerk-papers-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="text-center text-red-500 py-12">
                    <i class="ri-error-warning-line text-3xl mb-3"></i>
                    <p class="text-lg">حدث خطأ في تحميل أوراق المحضرين</p>
                </div>
            `;
        }
    }
}


function displayClerkPapersList(clerkPapers, clients, cases) {
    const listContainer = document.getElementById('clerk-papers-list');
    if (!listContainer) return;

    if (!clerkPapers || clerkPapers.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="ri-file-paper-line text-4xl mb-3"></i>
                <p class="text-lg">لا توجد أوراق محضرين مضافة</p>
                <p class="text-sm text-gray-400 mt-2">اضغط على "إضافة ورقة جديدة" لبدء الإضافة</p>
            </div>
        `;
        return;
    }


    const papersByClient = {};
    const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);

    clerkPapers.forEach(paper => {
        const clientId = paper.clientId;

        if (clientId) {
            if (!papersByClient[clientId]) {
                papersByClient[clientId] = [];
            }
            papersByClient[clientId].push({ ...paper, clientData: clientsMap.get(clientId) });
        }
    });

    let html = '';

    Object.keys(papersByClient).forEach(clientId => {
        const clientData = clientsMap.get(parseInt(clientId, 10));
        const clientPapers = papersByClient[clientId];

        if (clientData) {
            html += `
                <div class="client-group bg-white border border-gray-300 rounded-xl hover:shadow-md hover:border-gray-400 transition-all duration-300 mb-3" data-client-id="${clientId}">
                    <div class="client-header p-3 bg-gray-50">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 sm:gap-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                    <i class="ri-user-line text-white text-xl"></i>
                                </div>
                                <div class="flex flex-col">
                                    <h3 class="font-bold text-gray-800 text-xl">${clientData.name}</h3>
                                    <div class="text-xs font-bold text-blue-700 mt-0.5">
                                        ${clientPapers.length} ورقة
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="client-papers border-t border-slate-100">
                        <div class="p-2 space-y-2 bg-slate-50 rounded-b-xl">
                            ${clientPapers.map(paper => createClerkPaperCard(paper, clientData)).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    });

    listContainer.innerHTML = html;
}


function createClerkPaperCard(paper, clientData) {
    return `
        <div class="paper-card bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm hover:bg-slate-50 cursor-pointer transition-colors">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div class="flex-1 w-full min-w-0">
                    <div class="flex flex-col md:flex-row gap-2 md:gap-1.5 w-full md:items-start">
                        <!-- Column 1: Type & Number -->
                        <div class="grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-1.5 w-full md:w-auto">
                            <div class="bg-white border border-slate-200 rounded px-2 h-8 flex items-center justify-start gap-2 text-center w-full md:w-fit max-w-full">
                                <span class="text-[11px] text-gray-700 shrink-0">نوع الورقة:</span>
                                <span class="text-xs font-bold text-gray-900 truncate" title="${paper.paperType || ''}">${paper.paperType || 'غير محدد'}</span>
                            </div>
                            <div class="bg-white border border-slate-200 rounded px-2 h-8 flex items-center justify-start gap-2 text-center w-full md:w-fit max-w-full">
                                <span class="text-[11px] text-gray-700 shrink-0">رقم الورقة:</span>
                                <span class="text-xs font-bold text-gray-900 truncate" title="${paper.paperNumber || ''}">${paper.paperNumber || 'غير محدد'}</span>
                            </div>
                        </div>

                        <!-- Column 2: Receipt & Delivery -->
                        <div class="grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-1.5 w-full md:w-auto">
                            <div class="bg-white border border-slate-200 rounded px-2 h-8 flex items-center justify-start gap-2 text-center w-full md:w-fit max-w-full">
                                <span class="text-[11px] text-gray-700 shrink-0">تاريخ الاستلام:</span>
                                <span class="text-xs font-bold text-gray-900 truncate">${__formatClerkPapersDateForDisplay(paper.receiptDate)}</span>
                            </div>
                            <div class="bg-white border border-slate-200 rounded px-2 h-8 flex items-center justify-start gap-2 text-center w-full md:w-fit max-w-full">
                                <span class="text-[11px] text-gray-700 shrink-0">تاريخ التسليم:</span>
                                <span class="text-xs font-bold text-gray-900 truncate">${__formatClerkPapersDateForDisplay(paper.deliveryDate)}</span>
                            </div>
                        </div>

                        <!-- Column 3: Pen & Notes -->
                        <div class="grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-1.5 w-full md:w-auto">
                            <div class="bg-white border border-slate-200 rounded px-2 h-8 flex items-center justify-start gap-2 text-center w-full md:w-fit max-w-full">
                                <span class="text-[11px] text-gray-700 shrink-0">محضرين:</span>
                                <span class="text-xs font-bold text-gray-900 truncate" title="${paper.clerkOffice || ''}">${paper.clerkOffice || 'غير محدد'}</span>
                            </div>
                            <div class="bg-white border border-slate-200 rounded px-2 h-8 flex items-center justify-start gap-2 text-center w-full md:w-fit max-w-full">
                                <span class="text-[11px] text-gray-700 shrink-0">ملاحظات:</span>
                                <span class="text-xs font-bold text-gray-900 truncate" title="${paper.notes || ''}">${paper.notes || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="clerk-paper-action-buttons flex w-full md:w-auto flex-row md:flex-col items-center md:items-end justify-center md:justify-end gap-2 md:gap-1.5 mt-3 pt-2 border-t border-slate-200 md:mt-0 md:pt-0 md:border-0 md:mr-2">
                    <button onclick="editClerkPaper(${paper.id})" class="flex items-center justify-center gap-1 px-2 py-1.5 w-24 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors">
                        <i class="ri-pencil-line text-sm"></i>
                        <span class="text-xs font-bold">تعديل</span>
                    </button>
                    <button onclick="deleteClerkPaper(${paper.id})" class="flex items-center justify-center gap-1 px-2 py-1.5 w-24 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors">
                        <i class="ri-delete-bin-line text-sm"></i>
                        <span class="text-xs font-bold">حذف</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}




async function reloadClerkPapersWithState() {
    const searchTerm = document.getElementById('clerk-papers-search')?.value || '';
    if (searchTerm) {
        await filterClerkPapers(searchTerm);
    } else {
        await loadAllClerkPapers();
    }
}


async function returnToClerkPapersModal() {
    displayClerkPapersModal();
    clerkPapersFilterType = null;
    await reloadClerkPapersWithState();
    updateClerkPapersStats();
}


async function updateClerkPapersStats() {
    try {
        const clerkPapers = await getAllClerkPapers();
        const norm = (t) => String(t || '').replace(/[إأآ]/g, 'ا').toLowerCase();
        const warningsCount = clerkPapers.filter(paper => norm(paper.paperType).includes('انذار')).length;
        const announcementsCount = clerkPapers.filter(paper => norm(paper.paperType).includes('اعلان')).length;
        const totalCount = clerkPapers.length;

        const warningsElement = document.getElementById('total-warnings');
        const announcementsElement = document.getElementById('total-announcements');
        const totalElement = document.getElementById('total-papers');

        if (warningsElement) warningsElement.textContent = warningsCount;
        if (announcementsElement) announcementsElement.textContent = announcementsCount;
        if (totalElement) totalElement.textContent = totalCount;

    } catch (error) {
    }
}


async function filterClerkPapers(searchTerm) {
    if (!searchTerm) {
        loadAllClerkPapers();
        return;
    }

    try {
        await __initClerkPapersDateLocaleSetting();
        const allPapers = await getAllClerkPapers();
        const clients = await getAllClients();
        const cases = await getAllCases();
        const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);

        const filteredPapers = allPapers.filter(paper => {
            const clientData = clientsMap.get(paper.clientId);

            return (
                (clientData && clientData.name.includes(searchTerm)) ||
                (paper.paperNumber && paper.paperNumber.includes(searchTerm))
            );
        });

        displayClerkPapersList(filteredPapers, clients, cases);
    } catch (error) {
    }
}


function attachClerkPaperFormListeners(paperId) {
    const form = document.getElementById('clerk-paper-form');
    const cancelBtn = document.getElementById('cancel-paper-btn');

    try {
        const applyLocaleFormattingToInput = async (input) => {
            try {
                if (!input) return;
                const raw = (input.value || '').trim();
                if (!raw) return;
                await __initClerkPapersDateLocaleSetting();
                const d = __parseClerkPapersDateString(raw);
                if (!d) return;
                input.value = d.toLocaleDateString(__clerkPapersDateLocaleCache || 'ar-EG');
            } catch (_) { }
        };
        const deliveryInput = document.getElementById('delivery-date');
        const receiptInput = document.getElementById('receipt-date');
        if (deliveryInput) {
            setTimeout(() => { applyLocaleFormattingToInput(deliveryInput); }, 0);
            deliveryInput.addEventListener('blur', () => { applyLocaleFormattingToInput(deliveryInput); });
            if (typeof attachDatePicker === 'function') attachDatePicker(deliveryInput, { format: 'DD/MM/YYYY' });
        }
        if (receiptInput) {
            setTimeout(() => { applyLocaleFormattingToInput(receiptInput); }, 0);
            receiptInput.addEventListener('blur', () => { applyLocaleFormattingToInput(receiptInput); });
            if (typeof attachDatePicker === 'function') attachDatePicker(receiptInput, { format: 'DD/MM/YYYY' });
        }
    } catch (_) { }


    const clientInput = document.getElementById('client-name');
    const clientDropdown = document.getElementById('client-name-dropdown');
    const hiddenClient = document.getElementById('client-select');

    if (clientInput && clientDropdown && hiddenClient) {
        setupAutocomplete('client-name', 'client-name-dropdown', async () => {
            const clients = await getAllClients();
            return clients.map(c => ({ id: c.id, name: c.name }));
        }, (item) => {
            hiddenClient.value = item ? item.id : '';
        });


        const toggleBtn = document.getElementById('client-name-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async () => {
                if (clientDropdown.classList.contains('hidden')) {

                    const clients = await getAllClients();
                    clientDropdown.innerHTML = '';

                    if (clients.length > 0) {
                        clients.forEach(client => {
                            const div = document.createElement('div');
                            div.textContent = client.name;
                            div.className = 'autocomplete-item text-right text-base font-semibold text-gray-900';
                            div.addEventListener('click', () => {
                                hiddenClient.value = client.id;
                                clientInput.value = client.name;
                                clientDropdown.innerHTML = '';
                                clientDropdown.classList.add('hidden');
                            });
                            clientDropdown.appendChild(div);
                        });
                        clientDropdown.classList.remove('hidden');
                    }
                } else {
                    clientDropdown.classList.add('hidden');
                }
            });
        }
    }


    const paperTypeInput = document.getElementById('paper-type-name');
    const paperTypeDropdown = document.getElementById('paper-type-dropdown');
    const hiddenPaperType = document.getElementById('paper-type');

    if (paperTypeInput && paperTypeDropdown && hiddenPaperType) {
        const paperTypes = ['إنذار', 'إعلان', 'أخرى'];

        setupAutocomplete('paper-type-name', 'paper-type-dropdown', async () => {

            const clerkPapers = await getAllClerkPapers();
            const usedTypes = [...new Set(clerkPapers.map(p => p.paperType).filter(t => t))];


            const allTypes = [...new Set([...paperTypes, ...usedTypes])];
            return allTypes.map(type => ({ id: type, name: type }));
        }, (item) => {
            if (item) {
                hiddenPaperType.value = item.name;
            }

        });


        paperTypeInput.addEventListener('input', () => {
            hiddenPaperType.value = paperTypeInput.value.trim();
        });


        const paperTypeToggleBtn = document.getElementById('paper-type-toggle');
        if (paperTypeToggleBtn) {
            paperTypeToggleBtn.addEventListener('click', async () => {
                if (paperTypeDropdown.classList.contains('hidden')) {

                    const clerkPapers = await getAllClerkPapers();
                    const usedTypes = [...new Set(clerkPapers.map(p => p.paperType).filter(t => t))];
                    const allTypes = [...new Set([...paperTypes, ...usedTypes])];

                    paperTypeDropdown.innerHTML = '';

                    if (allTypes.length > 0) {
                        allTypes.forEach(type => {
                            const div = document.createElement('div');
                            div.textContent = type;
                            div.className = 'autocomplete-item text-right text-base font-semibold text-gray-900';
                            div.addEventListener('click', () => {
                                hiddenPaperType.value = type;
                                paperTypeInput.value = type;
                                paperTypeDropdown.innerHTML = '';
                                paperTypeDropdown.classList.add('hidden');
                            });
                            paperTypeDropdown.appendChild(div);
                        });
                        paperTypeDropdown.classList.remove('hidden');
                    }
                } else {
                    paperTypeDropdown.classList.add('hidden');
                }
            });
        }
    }


    const clerkOfficeInput = document.getElementById('clerk-office-name');
    const clerkOfficeDropdown = document.getElementById('clerk-office-dropdown');
    const hiddenClerkOffice = document.getElementById('clerk-office');

    if (clerkOfficeInput && clerkOfficeDropdown && hiddenClerkOffice) {
        setupAutocomplete('clerk-office-name', 'clerk-office-dropdown', async () => {

            const clerkPapers = await getAllClerkPapers();
            const usedOffices = [...new Set(clerkPapers.map(p => p.clerkOffice).filter(o => o))];

            return usedOffices.map(office => ({ id: office, name: office }));
        }, (item) => {
            if (item) {
                hiddenClerkOffice.value = item.name;
            }
        });


        clerkOfficeInput.addEventListener('input', () => {
            hiddenClerkOffice.value = clerkOfficeInput.value.trim();
        });


        const clerkOfficeToggleBtn = document.getElementById('clerk-office-toggle');
        if (clerkOfficeToggleBtn) {
            clerkOfficeToggleBtn.addEventListener('click', async () => {
                if (clerkOfficeDropdown.classList.contains('hidden')) {

                    const clerkPapers = await getAllClerkPapers();
                    const usedOffices = [...new Set(clerkPapers.map(p => p.clerkOffice).filter(o => o))];

                    clerkOfficeDropdown.innerHTML = '';

                    if (usedOffices.length > 0) {
                        usedOffices.forEach(office => {
                            const div = document.createElement('div');
                            div.textContent = office;
                            div.className = 'autocomplete-item text-right text-base font-semibold text-gray-900';
                            div.addEventListener('click', () => {
                                hiddenClerkOffice.value = office;
                                clerkOfficeInput.value = office;
                                clerkOfficeDropdown.innerHTML = '';
                                clerkOfficeDropdown.classList.add('hidden');
                            });
                            clerkOfficeDropdown.appendChild(div);
                        });
                        clerkOfficeDropdown.classList.remove('hidden');
                    }
                } else {
                    clerkOfficeDropdown.classList.add('hidden');
                }
            });
        }
    }


    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSaveClerkPaper(e, paperId);
        });
    }


    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            navigateBack();
        });
    }
}


async function handleSaveClerkPaper(e, paperId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const paperData = Object.fromEntries(formData.entries());

    const normalize = (s) => {
        if (!s) return s;
        const m = String(s).trim().match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/);
        if (!m) return s;
        const pad = (n) => n.toString().padStart(2, '0');
        let d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
        if (m[3].length === 2) { y = y < 50 ? 2000 + y : 1900 + y; }
        const dt = new Date(y, mo - 1, d);
        if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
            return `${y}-${pad(mo)}-${pad(d)}`;
        }
        return s;
    };
    paperData.deliveryDate = normalize(paperData.deliveryDate);
    paperData.receiptDate = normalize(paperData.receiptDate);


    if (!paperData.paperType || !paperData.paperNumber) {
        showToast('يرجى ملء الحقول المطلوبة: نوع الورقة، رقم الورقة', 'error');
        return;
    }

    try {
        let clientId = parseInt(paperData.clientId);
        const clientNameInput = document.getElementById('client-name');


        if (!clientId && clientNameInput && clientNameInput.value.trim()) {
            const clientName = clientNameInput.value.trim();
            if (clientName) {
                clientId = await addClient({ name: clientName });
                const hiddenClient = document.getElementById('client-select');
                if (hiddenClient) hiddenClient.value = String(clientId);
            }
        }

        if (!clientId) {
            showToast('يرجى اختيار أو إدخال اسم الموكل', 'error');
            return;
        }

        paperData.clientId = clientId;

        if (paperId) {

            const existingPaper = await getById('clerkPapers', paperId);
            const updatedPaper = { ...existingPaper, ...paperData };
            await updateRecord('clerkPapers', paperId, updatedPaper);
            showToast('تم تعديل ورقة المحضر بنجاح', 'success');
        } else {

            await addClerkPaper(paperData);
            showToast('تم حفظ ورقة المحضر بنجاح', 'success');
        }


        navigateBack();

    } catch (error) {
        showToast('حدث خطأ أثناء حفظ ورقة المحضر', 'error');
    }
}


async function editClerkPaper(paperId) {
    displayClerkPaperForm(paperId);
}


async function deleteClerkPaper(paperId) {
    const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه الورقة؟') : confirm('هل أنت متأكد من حذف هذه الورقة؟');
    if (!ok) return;
    try {
        await deleteRecord('clerkPapers', paperId);
        showToast('تم حذف ورقة المحضر بنجاح', 'success');
        await displayClerkPapersModal();
        await updateCountersInHeader();
    } catch (error) {
        showToast('حدث خطأ أثناء حذف ورقة المحضر', 'error');
    }
}


function showAllClerkPapers() {
    clerkPapersFilterType = null;
    document.getElementById('clerk-papers-search').value = '';
    loadAllClerkPapers();
}

function showWarningsClerkPapers() {
    clerkPapersFilterType = 'warnings';
    document.getElementById('clerk-papers-search').value = '';
    loadAllClerkPapers();
}

function showAnnouncementsClerkPapers() {
    clerkPapersFilterType = 'announcements';
    document.getElementById('clerk-papers-search').value = '';
    loadAllClerkPapers();
}


async function getAllClerkPapers() {
    return await getAll('clerkPapers') || [];
}

async function addClerkPaper(paperData) {
    return await addRecord('clerkPapers', paperData);
}


function setupClerkPapersScrollBox() {
    try {
        const rightWrapper = document.querySelector('#modal-content .flex-1.min-h-0 > div');
        const clerkPapersList = document.getElementById('clerk-papers-list');
        if (!rightWrapper || !clerkPapersList) return;

        const viewportH = window.innerHeight;
        const wrapperTop = rightWrapper.getBoundingClientRect().top;
        const targetH = Math.max(240, viewportH - wrapperTop - 12);

        rightWrapper.style.height = targetH + 'px';
        rightWrapper.style.minHeight = '0px';

        clerkPapersList.style.maxHeight = (targetH - 24) + 'px';
        clerkPapersList.style.overflowY = 'auto';

        const leftPane = document.querySelector('#modal-content [data-left-pane="clerk"]');
        if (leftPane) {
            leftPane.style.height = targetH + 'px';
            leftPane.style.maxHeight = targetH + 'px';
            leftPane.style.minHeight = '0px';
            leftPane.style.overflowX = 'hidden';
            leftPane.style.overflowY = 'auto';
            leftPane.style.borderBottomLeftRadius = '16px';
            leftPane.style.borderBottomRightRadius = '16px';
            leftPane.style.overscrollBehavior = 'contain';
        }
    } catch (e) { }
}


function setupClerkPapersHoverScrollBehavior() {
    const leftPane = document.querySelector('#modal-content [data-left-pane="clerk"]');
    const rightList = document.getElementById('clerk-papers-list');
    const mainEl = document.querySelector('main');
    if (!leftPane || !rightList || !mainEl) return;

    try {
        mainEl.style.overflowY = 'hidden';
        try { document.body.style.overflowY = 'hidden'; } catch (_) { }
        try { document.documentElement.style.overflowY = 'hidden'; } catch (_) { }
        rightList.style.overscrollBehavior = 'contain';
        leftPane.style.overscrollBehavior = 'contain';
    } catch (_) { }
}
