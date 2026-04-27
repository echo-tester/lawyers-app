



let openExpertClientIds = new Set(); 
let expertSessionsFilterType = null; 
let expertSessionsDayFilter = null;
let expertSessionsSortOrder = 'newest'; 

let __expertSessionsDateLocaleCache = null;
async function __getExpertSessionsDateLocaleSetting() {
    if (__expertSessionsDateLocaleCache) return __expertSessionsDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __expertSessionsDateLocaleCache = locale;
    return locale;
}

function __parseExpertSessionDateString(dateStr) {
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

function __getExpertNow() {
    try {
        const raw = localStorage.getItem('onlineTimeOffsetMs');
        const offset = raw ? parseInt(raw, 10) : 0;
        if (!isNaN(offset)) return new Date(Date.now() + offset);
    } catch (_) { }
    return new Date();
}

function __getDayRangeTs(dayKey) {
    try {
        const now = __getExpertNow();
        const d = new Date(now);
        if (dayKey === 'tomorrow') d.setDate(d.getDate() + 1);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        return { start, end };
    } catch (_) {
        return { start: -Infinity, end: Infinity };
    }
}

function __applyDayFilter(list) {
    try {
        if (!expertSessionsDayFilter) return list;
        if (expertSessionsDayFilter !== 'today' && expertSessionsDayFilter !== 'tomorrow') return list;
        const { start, end } = __getDayRangeTs(expertSessionsDayFilter);
        return (Array.isArray(list) ? list : []).filter((s) => {
            const d = __parseExpertSessionDateString((s || {}).sessionDate);
            if (!d) return false;
            const ts = d.getTime();
            return ts >= start && ts <= end;
        });
    } catch (_) {
        return list;
    }
}

function __formatExpertSessionDateForDisplay(dateStr) {
    try {
        const d = __parseExpertSessionDateString(dateStr);
        if (!d) return (dateStr || 'غير محدد');
        const locale = __expertSessionsDateLocaleCache || 'ar-EG';
        return d.toLocaleDateString(locale);
    } catch (_) {
        return (dateStr || 'غير محدد');
    }
}


function displayExpertSessionsModal() {
    
    document.body.classList.remove('form-active');

    // فلترة من الرابط/الإشعارات
    try {
        let f = '';
        try {
            const params = (typeof URLSearchParams !== 'undefined') ? new URLSearchParams(window.location.search || '') : null;
            if (params) f = String(params.get('filter') || '').trim().toLowerCase();
        } catch (_) { }
        if (!f) {
            try { f = String(sessionStorage.getItem('expert_sessions_open_filter') || '').trim().toLowerCase(); } catch (_) { }
        }
        if (f === 'today' || f === 'tomorrow') {
            expertSessionsDayFilter = f;
            try { sessionStorage.removeItem('expert_sessions_open_filter'); } catch (_) { }
        } else {
            expertSessionsDayFilter = null;
        }
    } catch (_) { }

    document.getElementById('modal-title').textContent = 'جلسات الخبراء';
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
        const backBtn = document.getElementById('back-to-main');
        const pageTitle = document.getElementById('page-title');
        if (backBtn && pageTitle) {
            backBtn.innerHTML = `
                <i class="ri-home-5-line text-white text-lg"></i>
                <span class="text-white">الرئيسيه</span>
            `;
            pageTitle.textContent = 'جلسات الخبراء';

            const newBackBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBackBtn, backBtn);

            newBackBtn.addEventListener('click', function () {
                window.location.href = 'index.html';
            });
        }
    } catch (_) { }

    modalContent.innerHTML = `
        <div class="search-layout">
            <div class="flex gap-0 h-full min-h-0">
                <!-- الجانب الأيمن: شريط البحث والإحصائيات -->
                <div class="w-1/4 space-y-6 search-left-pane search-left-pane-dark" data-left-pane="expert">
                    <!-- شريط البحث -->
                    <div class="bg-purple-50 p-3 rounded-xl border border-purple-200 shadow-sm">
                        <div class="space-y-2">
                            <div class="relative">
                                <input type="text" id="expert-sessions-search" 
                                       placeholder="ابحث بالموكل أو رقم القضية..." 
                                       class="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right shadow-sm pr-10">
                                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <i class="ri-search-2-line text-gray-400 text-base"></i>
                                </div>
                            </div>
                            
                            <button id="sort-expert-sessions" class="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2">
                                <i class="ri-sort-desc text-lg"></i>
                                <span>فرز: الأحدث</span>
                            </button>
                            <button id="add-new-expert-session" class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm text-sm font-bold flex items-center justify-center gap-2">
                                <i class="ri-add-line text-lg ml-2"></i>إضافة جلسة جديدة
                            </button>
                        </div>
                    </div>

                    <!-- إحصائيات سريعة -->
                    <div class="bg-white rounded-lg p-3 shadow-md border border-gray-200 mb-2">
                        <h3 class="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                            <i class="ri-bar-chart-line text-purple-500 text-sm"></i>
                            الإحصائيات
                        </h3>
                        <div class="space-y-2">
                            <!-- Total Sessions - Full Width -->
                            <div id="total-stats-btn" class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border-2 border-purple-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-purple-400">
                                <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                    <i class="ri-team-line text-white text-sm"></i>
                                </div>
                                <div class="text-lg font-bold text-purple-600 mb-1" id="total-sessions">0</div>
                                <div class="text-xs font-medium text-purple-800">إجمالي الجلسات</div>
                            </div>

                            <!-- Completed vs Scheduled Sessions - Small Stats -->
                            <div class="grid grid-cols-2 gap-2">
                                <!-- Completed Sessions -->
                                <div id="completed-stats-btn" class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border-2 border-green-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-green-400">
                                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-check-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-green-600 mb-1" id="completed-sessions">0</div>
                                    <div class="text-xs font-medium text-green-800">تمت</div>
                                </div>

                                <!-- Scheduled Sessions -->
                                <div id="scheduled-stats-btn" class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-blue-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-blue-400">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-calendar-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-blue-600 mb-1" id="scheduled-sessions">0</div>
                                    <div class="text-xs font-medium text-blue-800">مجدولة</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- الجانب الأيسر: قائمة جلسات الخبراء -->
                <div class="flex-1 min-h-0 search-right-pane">
                    <div class="bg-white rounded-xl border border-gray-200 shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
                        <div id="expert-sessions-list" class="space-y-4 overscroll-contain p-2 md:p-3">
                            <div class="text-center text-gray-500 py-12 sticky top-0 bg-white">
                                <i class="ri-loader-4-line animate-spin text-3xl mb-3"></i>
                                <p class="text-lg">جاري تحميل جلسات الخبراء...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        const leftPane = document.querySelector('#modal-content [data-left-pane="expert"]');
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
                leftPane.querySelectorAll('div.bg-white, div.bg-purple-50').forEach((c) => {
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
                const searchInput = document.getElementById('expert-sessions-search');
                if (searchInput) {
                    try { searchInput.style.background = 'rgba(255,255,255,.08)'; } catch (_) { }
                    try { searchInput.style.borderColor = 'rgba(148, 163, 184, .28)'; } catch (_) { }
                    try { searchInput.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
                }
            } catch (_) { }

            try {
                const btnIds = ['sort-expert-sessions', 'add-new-expert-session'];
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
                const statIds = ['total-stats-btn', 'completed-stats-btn', 'scheduled-stats-btn'];
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

                            const iconWrap = el.querySelector('div.w-8.h-8');
                            if (iconWrap) {
                                clearImp(iconWrap, 'background');
                                clearImp(iconWrap, 'box-shadow');
                            }

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

                            const iconWrap = el.querySelector('div.w-8.h-8');
                            if (iconWrap) {
                                setImp(iconWrap, 'background', '#f59e0b');
                                setImp(iconWrap, 'box-shadow', '0 10px 16px rgba(245,158,11,.22)');
                            }

                            el.querySelectorAll('div').forEach((d) => {
                                try {
                                    if (d.classList && d.classList.contains('w-8') && d.classList.contains('h-8')) return;
                                    d.style.color = 'rgba(255,255,255,.95)';
                                } catch (_) { }
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
        if (!document.getElementById('expert-sessions-sidebar-hover-style')) {
            const st = document.createElement('style');
            st.id = 'expert-sessions-sidebar-hover-style';
            st.textContent = `
                .low-power #modal-content [data-left-pane="expert"] #sort-expert-sessions,
                .low-power #modal-content [data-left-pane="expert"] #add-new-expert-session,
                .low-power #modal-content [data-left-pane="expert"] #total-stats-btn,
                .low-power #modal-content [data-left-pane="expert"] #completed-stats-btn,
                .low-power #modal-content [data-left-pane="expert"] #scheduled-stats-btn {
                    transition: background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease !important;
                }

                #modal-content [data-left-pane="expert"] #sort-expert-sessions:hover,
                #modal-content [data-left-pane="expert"] #add-new-expert-session:hover {
                    border-color: rgba(245, 158, 11, .90) !important;
                    outline: 2px solid rgba(245, 158, 11, .65) !important;
                    outline-offset: 2px !important;
                    transform: translateY(-1px) scale(1.02) !important;
                    box-shadow: 0 16px 26px rgba(245, 158, 11, .14), 0 12px 18px rgba(15, 23, 42, .20) !important;
                }

                #modal-content [data-left-pane="expert"] #expert-sessions-search::placeholder {
                    color: rgba(226,232,240,.78) !important;
                }
            `;
            (document.head || document.documentElement).appendChild(st);
        }
    } catch (_) { }

    try { __updateExpertSessionsSortButtonText(); } catch (_) { }
    attachExpertSessionsListeners();
    loadAllExpertSessions();
    updateExpertSessionsStats();

    
    try {
        try {
            const mainEl = document.querySelector('main');
            if (mainEl) {
                try {
                    const headerEl = document.querySelector('header');
                    const headerH = headerEl ? Math.max(0, Math.round(headerEl.getBoundingClientRect().height || 0)) : 0;
                    try { mainEl.classList.remove('mt-10'); } catch (_) { }
                    if (headerH) {
                        mainEl.style.marginTop = headerH + 'px';
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
        } catch (_) { }

        if (!window.__expertSessionsMainOffsetBound) {
            window.__expertSessionsMainOffsetBound = true;
            window.addEventListener('resize', () => {
                try {
                    const mainEl = document.querySelector('main');
                    if (!mainEl) return;
                    const headerEl = document.querySelector('header');
                    const headerH = headerEl ? Math.max(0, Math.round(headerEl.getBoundingClientRect().height || 0)) : 0;
                    if (headerH) mainEl.style.marginTop = headerH + 'px';
                } catch (_) { }
            });
        }

        requestAnimationFrame(() => {
            setupExpertSessionsScrollBox();
            setupExpertSessionsHoverScrollBehavior();
        });
        window.addEventListener('resize', setupExpertSessionsScrollBox);
    } catch (e) {
        console.error(e);
    }
}


function attachExpertSessionsListeners() {
    
    const totalStatsBtn = document.getElementById('total-stats-btn');
    if (totalStatsBtn) {
        totalStatsBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar(); 
            showAllExpertSessions();
        });
    }

    const completedStatsBtn = document.getElementById('completed-stats-btn');
    if (completedStatsBtn) {
        completedStatsBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar(); 
            showCompletedExpertSessions();
        });
    }

    const scheduledStatsBtn = document.getElementById('scheduled-stats-btn');
    if (scheduledStatsBtn) {
        scheduledStatsBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar(); 
            showScheduledExpertSessions();
        });
    }

    
    const searchInput = document.getElementById('expert-sessions-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            filterExpertSessions(searchTerm);
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

    
    const sortBtn = document.getElementById('sort-expert-sessions');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            toggleExpertSessionsSort();
        });
    }

    
    const addNewBtn = document.getElementById('add-new-expert-session');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            displayExpertSessionForm();
        });
    }
}


async function loadAllExpertSessions() {
    try {
        await __getExpertSessionsDateLocaleSetting();
        let expertSessions = await getAllExpertSessions();
        const clients = await getAllClients();
        const cases = await getAllCases();

        
        if (expertSessionsFilterType === 'completed') {
            expertSessions = expertSessions.filter(session => session.status === 'تمت');
        } else if (expertSessionsFilterType === 'scheduled') {
            expertSessions = expertSessions.filter(session => session.status === 'مجدولة');
        }

        try {
            expertSessions = __applyDayFilter(expertSessions);
        } catch (_) { }
        

        
        expertSessions = sortExpertSessionsByDate(expertSessions);

        displayExpertSessionsList(expertSessions, clients, cases);
        updateExpertSessionsStats();
    } catch (error) {
        const listContainer = document.getElementById('expert-sessions-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="text-center text-red-500 py-12">
                    <i class="ri-error-warning-line text-3xl mb-3"></i>
                    <p class="text-lg">حدث خطأ في تحميل جلسات الخبراء</p>
                </div>
            `;
        }
    }
}


function displayExpertSessionsList(expertSessions, clients, cases) {
    const listContainer = document.getElementById('expert-sessions-list');
    if (!listContainer) return;

    if (!expertSessions || expertSessions.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="ri-team-line text-4xl mb-3"></i>
                <p class="text-lg">لا توجد جلسات خبراء مضافة</p>
                <p class="text-sm text-gray-400 mt-2">اضغط على "إضافة جلسة جديدة" لبدء الإضافة</p>
            </div>
        `;
        return;
    }

    
    let html = '';
    const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    expertSessions.forEach(session => {
        const clientData = clientsMap.get(session.clientId);

        if (clientData) {
            html += `
                <div class="session-item bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-300 transition-all duration-300 mb-3">
                    <div class="p-3">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                    <i class="ri-user-line text-white text-lg"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-gray-800 text-lg">${clientData.name}</h3>
                                    <p class="text-xs text-gray-500">الموكل</p>
                                </div>
                            </div>
                        </div>
                        ${createExpertSessionCard(session, clientData)}
                    </div>
                </div>
            `;
        }
    });

    listContainer.innerHTML = html;
}


function createExpertSessionCard(session, clientData) {
    
    let statusColor = 'purple';
    if (session.status === 'تمت') {
        statusColor = 'green';
    } else if (session.status === 'مجدولة') {
        statusColor = 'blue';
    } else if (session.status === 'ملغية') {
        statusColor = 'red';
    }

    return `
        <div class="session-card bg-white border border-gray-200 rounded-md p-2 hover:shadow-sm hover:border-purple-300 cursor-pointer">
            <!-- Mobile layout -->
            <div class="md:hidden">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                        <i class="ri-team-line text-sm"></i>
                    </div>
                    <div class="flex-1 space-y-1">
                        <div class="grid grid-cols-2 gap-2 items-stretch">
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">النوع</span>
                                <span class="text-sm font-bold text-gray-900">${session.sessionType || 'غير محدد'}</span>
                            </div>
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">الحالة</span>
                                <span class="text-sm font-bold text-gray-900">${session.status || 'غير محدد'}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 items-stretch">
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">التاريخ</span>
                                <span class="text-sm font-bold text-gray-900">${__formatExpertSessionDateForDisplay(session.sessionDate)}</span>
                            </div>
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">الوقت</span>
                                <span class="text-sm font-bold text-gray-900">${session.sessionTime || 'غير محدد'}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 gap-2 items-stretch">
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">رقم القضية</span>
                                <span class="text-sm font-bold text-gray-900">${session.caseNumber ? session.caseNumber.replace('/', ' لسنه ') : 'غير محدد'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-center gap-2">
                    <button onclick="editExpertSession(${session.id})" class="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-xs font-semibold">
                        <i class="ri-pencil-line text-xs"></i>
                        <span>تعديل</span>
                    </button>
                    <button onclick="deleteExpertSession(${session.id})" class="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-semibold">
                        <i class="ri-delete-bin-line text-xs"></i>
                        <span>حذف</span>
                    </button>
                </div>
            </div>

            <!-- Desktop layout -->
            <div class="hidden md:flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <i class="ri-team-line text-sm"></i>
                    </div>
                    <div class="space-y-1">
                        <div class="grid grid-cols-2 gap-2 items-stretch">
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">النوع</span>
                                <span class="text-sm font-bold text-gray-900">${session.sessionType || 'غير محدد'}</span>
                            </div>
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">الحالة</span>
                                <span class="text-sm font-bold text-gray-900">${session.status || 'غير محدد'}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 items-stretch">
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">التاريخ</span>
                                <span class="text-sm font-bold text-gray-900">${__formatExpertSessionDateForDisplay(session.sessionDate)}</span>
                            </div>
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">الوقت</span>
                                <span class="text-sm font-bold text-gray-900">${session.sessionTime || 'غير محدد'}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 gap-2 items-stretch">
                            <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; height: 32px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center;">
                                <span class="text-xs text-gray-600">رقم القضية</span>
                                <span class="text-sm font-bold text-gray-900">${session.caseNumber ? session.caseNumber.replace('/', ' لسنه ') : 'غير محدد'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <button onclick="editExpertSession(${session.id})" class="flex items-center gap-1 px-2 py-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-xs font-semibold">
                        <i class="ri-pencil-line text-xs"></i>
                        <span>تعديل</span>
                    </button>
                    <button onclick="deleteExpertSession(${session.id})" class="flex items-center gap-1 px-2 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-semibold">
                        <i class="ri-delete-bin-line text-xs"></i>
                        <span>حذف</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}



async function reloadExpertSessionsWithState() {
    const searchTerm = document.getElementById('expert-sessions-search')?.value || '';
    if (searchTerm) {
        await filterExpertSessions(searchTerm);
    } else {
        await loadAllExpertSessions();
    }
}


async function returnToExpertSessionsModal() {
    displayExpertSessionsModal();
    await reloadExpertSessionsWithState();
    updateExpertSessionsStats();
}


async function updateExpertSessionsStats() {
    try {
        const expertSessions = await getAllExpertSessions();

        const completedSessions = expertSessions.filter(session => session.status === 'تمت').length;
        const scheduledSessions = expertSessions.filter(session => session.status === 'مجدولة').length;
        const totalSessions = expertSessions.length;

        const completedElement = document.getElementById('completed-sessions');
        const scheduledElement = document.getElementById('scheduled-sessions');
        const totalElement = document.getElementById('total-sessions');

        if (completedElement) completedElement.textContent = completedSessions;
        if (scheduledElement) scheduledElement.textContent = scheduledSessions;
        if (totalElement) totalElement.textContent = totalSessions;

    } catch (error) {
    }
}


async function filterExpertSessions(searchTerm) {
    if (!searchTerm) {
        loadAllExpertSessions();
        return;
    }

    try {
        await __getExpertSessionsDateLocaleSetting();
        const allSessions = await getAllExpertSessions();
        const clients = await getAllClients();
        const cases = await getAllCases();
        const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);

        let filteredSessions = allSessions.filter(session => {
            const clientData = clientsMap.get(session.clientId);

            
            const matchesClient = clientData && clientData.name.includes(searchTerm);

            
            const matchesCaseNumber = session.caseNumber && session.caseNumber.includes(searchTerm);

            return matchesClient || matchesCaseNumber;
        });

        
        filteredSessions = sortExpertSessionsByDate(filteredSessions);

        displayExpertSessionsList(filteredSessions, clients, cases);
    } catch (error) {
    }
}


function attachExpertSessionFormListeners(sessionId) {
    const form = document.getElementById('expert-session-form');
    const cancelBtn = document.getElementById('cancel-session-btn');

    try {
        const dateInput = document.getElementById('session-date');
        const applyLocaleFormattingToInput = async () => {
            try {
                if (!dateInput) return;
                const raw = (dateInput.value || '').trim();
                if (!raw) return;
                const d = __parseExpertSessionDateString(raw);
                if (!d) return;
                const locale = await __getExpertSessionsDateLocaleSetting();
                dateInput.value = d.toLocaleDateString(locale);
            } catch (_) { }
        };
        if (dateInput) {
            setTimeout(() => { applyLocaleFormattingToInput(); }, 0);
            dateInput.addEventListener('blur', () => { applyLocaleFormattingToInput(); });
            if (typeof attachDatePicker === 'function') attachDatePicker(dateInput, { format: 'DD/MM/YYYY' });
        }
    } catch (_) { }

    const clientInput = document.getElementById('client-name');
    const clientDropdown = document.getElementById('client-name-dropdown');
    const hiddenClient = document.getElementById('client-select');
    if (clientInput && clientDropdown && hiddenClient) {
        setupAutocomplete('client-name', 'client-name-dropdown', async () => {
            const clients = await getAllClients();
            return clients.map(c => ({ id: c.id, name: c.name }));
        }, async (item) => {
            hiddenClient.value = item ? item.id : '';
            const cid = item ? parseInt(item.id, 10) : 0;
            await updateCaseNumberOptions(cid);
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
                                updateCaseNumberOptions(parseInt(client.id, 10));
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

    const caseNumDisplay = document.getElementById('case-number-display');
    const caseNumDropdown = document.getElementById('case-number-dropdown');
    const caseNumHidden = document.getElementById('case-number');
    const caseNumToggle = document.getElementById('case-number-toggle');
    let currentClientCases = [];

    async function updateCaseNumberOptions(clientId) {
        if (!caseNumDropdown) return;
        if (!clientId) {
            currentClientCases = [];
            caseNumDropdown.innerHTML = '';
            caseNumDropdown.classList.add('hidden');
            return;
        }
        try {
            const list = await getFromIndex('cases', 'clientId', clientId);
            currentClientCases = Array.isArray(list) ? list : [];
        } catch (_) {
            currentClientCases = [];
        }
        renderCaseNumberDropdown();
        caseNumDropdown.classList.add('hidden');
    }

    function caseLabel(cs) {
        const num = cs && cs.caseNumber ? String(cs.caseNumber) : '';
        const yr = cs && cs.caseYear ? String(cs.caseYear) : '';
        if (num && yr) return num + ' لسنة ' + yr;
        return num || yr || '';
    }

    function renderCaseNumberDropdown(filter = '') {
        if (!caseNumDropdown) return;
        const q = (filter || '').toLowerCase();
        const items = currentClientCases.filter(cs => (caseLabel(cs) || '').toLowerCase().includes(q));
        caseNumDropdown.innerHTML = items.map((cs, idx) => `<div class="autocomplete-item text-right text-base font-semibold text-gray-900" data-index="${idx}">${caseLabel(cs) || ''}</div>`).join('');
    }

    if (caseNumDisplay && caseNumDropdown) {
        caseNumDisplay.addEventListener('input', () => {
            if (caseNumHidden) caseNumHidden.value = caseNumDisplay.value.trim();
            if (!caseNumDropdown.classList.contains('hidden')) {
                renderCaseNumberDropdown(caseNumDisplay.value || '');
            }
        });
        caseNumDropdown.addEventListener('click', (e) => {
            const el = e.target.closest('.autocomplete-item');
            if (!el) return;
            const idx = parseInt(el.getAttribute('data-index'), 10);
            const picked = currentClientCases[idx];
            const label = caseLabel(picked) || '';
            caseNumDisplay.value = label;
            if (caseNumHidden) caseNumHidden.value = label;
            caseNumDropdown.classList.add('hidden');
        });
        if (caseNumToggle) {
            caseNumToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (caseNumDropdown.classList.contains('hidden')) {
                    renderCaseNumberDropdown(caseNumDisplay.value || '');
                    caseNumDropdown.classList.remove('hidden');
                } else {
                    caseNumDropdown.classList.add('hidden');
                }
            });
        }
        document.addEventListener('click', (e) => {
            if (!caseNumDropdown.closest('.relative')?.contains(e.target)) {
                caseNumDropdown.classList.add('hidden');
            }
        });
        const initialClientId = parseInt(hiddenClient?.value || '0', 10);
        if (initialClientId) {
            updateCaseNumberOptions(initialClientId);
        }
    }

    const expertNameInput = document.getElementById('expert-name-display');
    const expertNameDropdown = document.getElementById('expert-name-dropdown');
    const hiddenExpertName = document.getElementById('expert-name');
    if (expertNameInput && expertNameDropdown && hiddenExpertName) {
        setupAutocomplete('expert-name-display', 'expert-name-dropdown', async () => {
            const sessions = await getAllExpertSessions();
            const names = [...new Set((sessions || []).map(s => s.expertName).filter(Boolean))];
            return names.map(n => ({ id: n, name: n }));
        }, (item) => {
            if (item) hiddenExpertName.value = item.name; else hiddenExpertName.value = '';
        });
        expertNameInput.addEventListener('input', () => {
            hiddenExpertName.value = expertNameInput.value.trim();
        });
        const expertToggle = document.getElementById('expert-name-toggle');
        if (expertToggle) {
            expertToggle.addEventListener('click', async () => {
                if (expertNameDropdown.classList.contains('hidden')) {
                    const sessions = await getAllExpertSessions();
                    const names = [...new Set((sessions || []).map(s => s.expertName).filter(Boolean))];
                    expertNameDropdown.innerHTML = '';
                    names.forEach(n => {
                        const div = document.createElement('div');
                        div.textContent = n;
                        div.className = 'autocomplete-item text-right text-base font-semibold text-gray-900';
                        div.addEventListener('click', () => {
                            hiddenExpertName.value = n;
                            expertNameInput.value = n;
                            expertNameDropdown.innerHTML = '';
                            expertNameDropdown.classList.add('hidden');
                        });
                        expertNameDropdown.appendChild(div);
                    });
                    if (names.length > 0) expertNameDropdown.classList.remove('hidden');
                } else {
                    expertNameDropdown.classList.add('hidden');
                }
            });
        }
    }

    const sessionTypeInput = document.getElementById('session-type-display');
    const sessionTypeDropdown = document.getElementById('session-type-dropdown');
    const hiddenSessionType = document.getElementById('session-type');
    if (sessionTypeInput && sessionTypeDropdown && hiddenSessionType) {
        const defaultTypes = ['معاينة', 'تقديم مستندات', 'مناقشة', 'تقرير خبير', 'أخرى'];
        setupAutocomplete('session-type-display', 'session-type-dropdown', async () => {
            const [expertSessions, normalSessions] = await Promise.all([
                getAllExpertSessions(),
                getAllSessions()
            ]);
            const usedExpert = [...new Set((expertSessions || []).map(s => s.sessionType).filter(Boolean))];
            const usedNormal = [...new Set((normalSessions || []).map(s => s.sessionType).filter(Boolean))];
            const all = [...new Set([...defaultTypes, ...usedExpert, ...usedNormal])];
            return all.map(n => ({ id: n, name: n }));
        }, (item) => {
            hiddenSessionType.value = item ? item.name : '';
        });
        sessionTypeInput.addEventListener('input', () => {
            hiddenSessionType.value = sessionTypeInput.value.trim();
        });
        const stToggle = document.getElementById('session-type-toggle');
        if (stToggle) {
            stToggle.addEventListener('click', async () => {
                if (sessionTypeDropdown.classList.contains('hidden')) {
                    const [expertSessions, normalSessions] = await Promise.all([
                        getAllExpertSessions(),
                        getAllSessions()
                    ]);
                    const usedExpert = [...new Set((expertSessions || []).map(s => s.sessionType).filter(Boolean))];
                    const usedNormal = [...new Set((normalSessions || []).map(s => s.sessionType).filter(Boolean))];
                    const all = [...new Set([...defaultTypes, ...usedExpert, ...usedNormal])];
                    sessionTypeDropdown.innerHTML = '';
                    all.forEach(n => {
                        const div = document.createElement('div');
                        div.textContent = n;
                        div.className = 'autocomplete-item text-right text-base font-semibold text-gray-900';
                        div.addEventListener('click', () => {
                            hiddenSessionType.value = n;
                            sessionTypeInput.value = n;
                            sessionTypeDropdown.innerHTML = '';
                            sessionTypeDropdown.classList.add('hidden');
                        });
                        sessionTypeDropdown.appendChild(div);
                    });
                    if (all.length > 0) sessionTypeDropdown.classList.remove('hidden');
                } else {
                    sessionTypeDropdown.classList.add('hidden');
                }
            });
        }
    }

    const statusInput = document.getElementById('status-display');
    const statusDropdown = document.getElementById('status-dropdown');
    const hiddenStatus = document.getElementById('status');
    if (statusInput && statusDropdown && hiddenStatus) {
        const defaultStatuses = ['مجدولة', 'تمت', 'ملغية'];
        setupAutocomplete('status-display', 'status-dropdown', async () => {
            const sessions = await getAllExpertSessions();
            const used = [...new Set((sessions || []).map(s => s.status).filter(Boolean))];
            const all = [...new Set([...defaultStatuses, ...used])];
            return all.map(n => ({ id: n, name: n }));
        }, (item) => {
            hiddenStatus.value = item ? item.name : '';
        });
        statusInput.addEventListener('input', () => {
            hiddenStatus.value = statusInput.value.trim();
        });
        const stToggle2 = document.getElementById('status-toggle');
        if (stToggle2) {
            stToggle2.addEventListener('click', async () => {
                if (statusDropdown.classList.contains('hidden')) {
                    const sessions = await getAllExpertSessions();
                    const used = [...new Set((sessions || []).map(s => s.status).filter(Boolean))];
                    const all = [...new Set([...defaultStatuses, ...used])];
                    statusDropdown.innerHTML = '';
                    all.forEach(n => {
                        const div = document.createElement('div');
                        div.textContent = n;
                        div.className = 'autocomplete-item text-right text-base font-semibold text-gray-900';
                        div.addEventListener('click', () => {
                            hiddenStatus.value = n;
                            statusInput.value = n;
                            statusDropdown.innerHTML = '';
                            statusDropdown.classList.add('hidden');
                        });
                        statusDropdown.appendChild(div);
                    });
                    if (all.length > 0) statusDropdown.classList.remove('hidden');
                } else {
                    statusDropdown.classList.add('hidden');
                }
            });
        }
    }

    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSaveExpertSession(e, sessionId);
        });
    }

    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            navigateBack();
        });
    }
}


async function handleSaveExpertSession(e, sessionId) {
    e.preventDefault();
    const form = e.target;
    const expertNameDisplay = document.getElementById('expert-name-display');
    const hiddenExpertName = document.getElementById('expert-name');
    if (expertNameDisplay && hiddenExpertName) hiddenExpertName.value = expertNameDisplay.value.trim();
    const sessionTypeDisplay = document.getElementById('session-type-display');
    const hiddenSessionType = document.getElementById('session-type');
    if (sessionTypeDisplay && hiddenSessionType) hiddenSessionType.value = sessionTypeDisplay.value.trim();
    const statusDisplay = document.getElementById('status-display');
    const hiddenStatus = document.getElementById('status');
    if (statusDisplay && hiddenStatus) hiddenStatus.value = statusDisplay.value.trim();
    
    try {
        const caseNumDisplayEl = document.getElementById('case-number-display');
        const caseNumHiddenEl = document.getElementById('case-number');
        if (caseNumDisplayEl && caseNumHiddenEl) {
            caseNumHiddenEl.value = (caseNumDisplayEl.value || '').trim();
        }
    } catch (_) { }
    const formData = new FormData(form);
    const sessionData = Object.fromEntries(formData.entries());
    
    if (sessionData.sessionDate) {
        const s = sessionData.sessionDate.trim();
        const m = s.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/);
        if (m) {
            const pad = (n) => n.toString().padStart(2, '0');
            let d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
            if (m[3].length === 2) { y = y < 50 ? 2000 + y : 1900 + y; }
            const dt = new Date(y, mo - 1, d);
            if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
                sessionData.sessionDate = `${y}-${pad(mo)}-${pad(d)}`;
            }
        }
    }

    let clientId = parseInt(sessionData.clientId);
    if (!clientId) {
        const clientNameInput = document.getElementById('client-name');
        if (clientNameInput && clientNameInput.value.trim()) {
            const clientName = clientNameInput.value.trim();
            clientId = await addClient({ name: clientName });
            const hiddenClient = document.getElementById('client-select');
            if (hiddenClient) hiddenClient.value = String(clientId);
        }
    }
    if (!clientId || !sessionData.sessionType) {
        showToast('يرجى ملء الحقول المطلوبة: الموكل، نوع الجلسة', 'error');
        return;
    }
    sessionData.clientId = clientId;

    try {
        if (sessionId) {
            
            const existingSession = await getById('expertSessions', sessionId);
            const updatedSession = { ...existingSession, ...sessionData };
            await updateRecord('expertSessions', sessionId, updatedSession);
            showToast('تم تعديل جلسة الخبير بنجاح', 'success');
        } else {
            
            await addExpertSession(sessionData);
            showToast('تم حفظ جلسة الخبير بنجاح', 'success');
        }

        
        navigateBack();

    } catch (error) {
        showToast('حدث خطأ أثناء حفظ جلسة الخبير', 'error');
    }
}


async function editExpertSession(sessionId) {
    displayExpertSessionForm(sessionId);
}


async function deleteExpertSession(sessionId) {
    const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه الجلسة؟') : confirm('هل أنت متأكد من حذف هذه الجلسة؟');
    if (!ok) return;
    try {
        await deleteRecord('expertSessions', sessionId);
        showToast('تم حذف جلسة الخبير بنجاح', 'success');
        await reloadExpertSessionsWithState();
        updateExpertSessionsStats();
    } catch (error) {
        showToast('حدث خطأ أثناء حذف جلسة الخبير', 'error');
    }
}


async function getAllExpertSessions() {
    return await getAll('expertSessions') || [];
}

async function addExpertSession(sessionData) {
    return await addRecord('expertSessions', sessionData);
}


function sortExpertSessionsByDate(sessions) {
    if (!sessions || sessions.length === 0) return sessions;

    return sessions.sort((a, b) => {
        
        const dateA = parseArabicDate(a.sessionDate);
        const dateB = parseArabicDate(b.sessionDate);

        if (expertSessionsSortOrder === 'newest') {
            
            return dateB - dateA;
        } else {
            
            return dateA - dateB;
        }
    });
}


function parseArabicDate(dateStr) {
    if (!dateStr) return new Date(0); 

    
    const parts = dateStr.split(/[/-]/);

    if (parts.length === 3) {
        
        if (parts[0].length <= 2) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; 
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        
        else {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
    }

    return new Date(0); 
}


function toggleExpertSessionsSort() {
    
    // لو الصفحة اتفتحت من الإشعار بفلتر اليوم/الغد: الزر يبقى "إلغاء الفرز" ويقوم بإلغاء الفلتر
    try {
        if (expertSessionsDayFilter === 'today' || expertSessionsDayFilter === 'tomorrow') {
            expertSessionsDayFilter = null;
            try { __updateExpertSessionsSortButtonText(); } catch (_) { }
            loadAllExpertSessions();
            return;
        }
    } catch (_) { }

    expertSessionsSortOrder = expertSessionsSortOrder === 'newest' ? 'oldest' : 'newest';

    try { __updateExpertSessionsSortButtonText(); } catch (_) { }

    loadAllExpertSessions();
}

function __updateExpertSessionsSortButtonText() {
    const sortBtn = document.getElementById('sort-expert-sessions');
    if (!sortBtn) return;
    const icon = sortBtn.querySelector('i');
    const span = sortBtn.querySelector('span');
    if (!span) return;

    if (expertSessionsDayFilter === 'today' || expertSessionsDayFilter === 'tomorrow') {
        if (icon) icon.className = 'ri-close-line text-lg';
        span.textContent = 'إلغاء الفرز';
        return;
    }

    if (expertSessionsSortOrder === 'newest') {
        if (icon) icon.className = 'ri-sort-desc text-lg';
        span.textContent = 'فرز: الأحدث';
    } else {
        if (icon) icon.className = 'ri-sort-asc text-lg';
        span.textContent = 'فرز: الأقدم';
    }
}


function showAllExpertSessions() {
    expertSessionsFilterType = null;
    document.getElementById('expert-sessions-search').value = '';
    loadAllExpertSessions();
    showToast('عرض جميع جلسات الخبراء', 'purple');
}

function showCompletedExpertSessions() {
    expertSessionsFilterType = 'completed';
    document.getElementById('expert-sessions-search').value = '';
    loadAllExpertSessions();
    showToast('عرض الجلسات المكتملة فقط', 'success');
}

function showScheduledExpertSessions() {
    expertSessionsFilterType = 'scheduled';
    document.getElementById('expert-sessions-search').value = '';
    loadAllExpertSessions();
    showToast('عرض الجلسات المجدولة فقط', 'info');
}


function setupExpertSessionsScrollBox() {
    try {
        const rightWrapper = document.querySelector('#modal-content .flex-1.min-h-0 > div');
        const expertSessionsList = document.getElementById('expert-sessions-list');
        if (!rightWrapper || !expertSessionsList) return;

        const viewportH = window.innerHeight;
        const wrapperTop = rightWrapper.getBoundingClientRect().top;
        const targetH = Math.max(240, viewportH - wrapperTop - 12);

        rightWrapper.style.height = targetH + 'px';
        rightWrapper.style.minHeight = '0px';

        expertSessionsList.style.maxHeight = (targetH - 24) + 'px';
        expertSessionsList.style.overflowY = 'auto';

        const leftPane = document.querySelector('#modal-content [data-left-pane="expert"]');
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


function setupExpertSessionsHoverScrollBehavior() {
    const leftPane = document.querySelector('#modal-content [data-left-pane="expert"]');
    const rightList = document.getElementById('expert-sessions-list');
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
// Auto-open expert session from notification
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const xId = sessionStorage.getItem('temp_open_expert_id');
        if (xId) {
            sessionStorage.removeItem('temp_open_expert_id');
            if (typeof initDB === 'function') await initDB();

            // لا تفتح شاشة التعديل من الإشعار. افتح القائمة فقط (مصفّاة إن لزم)
            try {
                if (!expertSessionsDayFilter) {
                    expertSessionsDayFilter = 'tomorrow';
                }
            } catch (_) { }
            try {
                if (typeof reloadExpertSessionsWithState === 'function') {
                    setTimeout(() => { reloadExpertSessionsWithState(); }, 200);
                }
            } catch (_) { }
        }
    } catch (e) { console.error(e); }
});
