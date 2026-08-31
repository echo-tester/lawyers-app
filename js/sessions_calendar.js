
class SessionsCalendar {
    constructor() {
        this.currentDate = new Date();
        this.sessions = [];
        this.selectedDate = null;
        this.viewMode = this.getDefaultViewMode();
        this.filteredDate = null;
        this.filterType = null;
        this.sortOrder = 'desc';
        this.lastToastDate = null;

        this.dateLocale = 'ar-EG';


        this.savedState = {
            viewMode: this.viewMode,
            sortOrder: 'desc',
            filteredDate: null,
            filterType: null,
            selectedDate: null
        };

        this.listBatchSize = 30;
        this.__currentList = [];
        this.__renderedCount = 0;
        this.__isAppending = false;
        this.__filterFn = null;
        this.__baseList = null;
        this.__scanIndex = 0;
    }

    scheduleUpdateStatistics() {
        const now = Date.now();
        if (!this.__nextStatsAt || now >= this.__nextStatsAt) {
            this.__nextStatsAt = now + 500; // مهلة بسيطة لمنع التكرار السريع
            setTimeout(() => {
                this.updateStatistics();
            }, 0);
        }
    }

    async init() {
        try {
            try {
                if (typeof getSetting === 'function') {
                    const v = await getSetting('dateLocale');
                    if (v === 'ar-EG' || v === 'en-GB') this.dateLocale = v;
                }
            } catch (_) { }
            await this.loadAllSessions();
            this.restoreState();

            // افتراضيًا: حدد تاريخ اليوم عند فتح التقويم (إلا لو فيه فلترة محفوظة)
            try {
                if (!this.filteredDate && !this.filterType) {
                    const t = this.getNow();
                    const yyyy = t.getFullYear();
                    const mm = String(t.getMonth() + 1).padStart(2, '0');
                    const dd = String(t.getDate()).padStart(2, '0');
                    this.selectedDate = `${yyyy}-${mm}-${dd}`;
                }
            } catch (_) { }


            this.render();
        } catch (error) {
            showToast('حدث خطأ في تحميل الجلسات', 'error');
        }
    }

    formatDateForDisplay(dateStr) {
        try {
            const s = String(dateStr || '').trim();
            if (!s) return 'غير محدد';
            const d = new Date(s);
            if (!Number.isFinite(d.getTime())) return s;
            return d.toLocaleDateString(this.dateLocale || 'ar-EG');
        } catch (_) {
            return (dateStr || 'غير محدد');
        }
    }


    saveState() {
        this.savedState = {
            viewMode: this.viewMode,

            filteredDate: this.filteredDate,
            filterType: this.filterType,
            selectedDate: this.selectedDate
        };


        localStorage.setItem('sessionsCalendarState', JSON.stringify(this.savedState));
    }


    restoreState() {
        try {
            const savedStateStr = localStorage.getItem('sessionsCalendarState');
            if (savedStateStr) {
                const savedState = JSON.parse(savedStateStr);
                this.viewMode = savedState.viewMode || this.getDefaultViewMode();

                this.sortOrder = 'desc';
                this.filteredDate = savedState.filteredDate || null;
                this.filterType = savedState.filterType || null;
                this.selectedDate = savedState.selectedDate || null;
                this.savedState = savedState;
            } else {
                this.viewMode = this.getDefaultViewMode();
            }
        } catch (error) {
        }
    }

    getDefaultViewMode() {
        try {
            const mq = (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(max-width: 768px)') : null;
            const isMobile = (mq && mq.matches) || (typeof window !== 'undefined' && window.innerWidth && window.innerWidth <= 768);
            return isMobile ? 'list' : 'calendar';
        } catch (_) {
            return 'calendar';
        }
    }


    clearSavedState() {
        localStorage.removeItem('sessionsCalendarState');
    }

    async loadAllSessions() {
        try {
            this.sessions = await (typeof getAllSessionsCached === 'function' ? getAllSessionsCached() : getAllSessions());
            try {
                const cases = await (typeof getAllCasesCached === 'function' ? getAllCasesCached() : getAllCases());
                this.caseMap = new Map(cases.map(c => [c.id, c]));

                const clients = await (typeof getAllClientsCached === 'function' ? getAllClientsCached() : getAllClients());
                const opponents = await (typeof getAllOpponentsCached === 'function' ? getAllOpponentsCached() : getAllOpponents());
                this.clientMap = new Map(clients.map(c => [Number(c.id), c.name]));
                this.opponentMap = new Map(opponents.map(o => [Number(o.id), o.name]));
            } catch (e) {
                this.caseMap = new Map();
                this.clientMap = new Map();
                this.opponentMap = new Map();
            }

            // حقول مشتقة لتسريع الفلترة والفرز
            try {
                const parseTs = (s) => {
                    if (!s || typeof s !== 'string') return null;
                    // صيغة YYYY-MM-DD تسمح بالمقارنة السريعة
                    const ms = Date.parse(s);
                    return isNaN(ms) ? null : ms;
                };
                for (const s of this.sessions) {
                    if (s && typeof s === 'object') {
                        s.__ts = parseTs(s.sessionDate);
                        s.__hasDecision = !!(s.decision && s.decision.trim() && s.decision !== 'لا يوجد قرار');
                    }
                }
                // إنشاء قوائم مهيّأة مسبقًا للفرز الشائع لتقليل زمن الترتيب عند كل عرض
                const byDateDesc = [...this.sessions].sort((a, b) => {
                    const ta = (typeof a.__ts === 'number') ? a.__ts : -Infinity;
                    const tb = (typeof b.__ts === 'number') ? b.__ts : -Infinity;
                    return tb - ta;
                });
                this.__sortedDesc = byDateDesc;
                this.__sortedAsc = [...byDateDesc].reverse();
                this.__sortedDecisions = [...this.sessions].sort((a, b) => {
                    if (!a.__hasDecision && b.__hasDecision) return -1;
                    if (a.__hasDecision && !b.__hasDecision) return 1;
                    const ta = (typeof a.__ts === 'number') ? a.__ts : -Infinity;
                    const tb = (typeof b.__ts === 'number') ? b.__ts : -Infinity;
                    return tb - ta;
                });
            } catch (_) { }

        } catch (error) {
            this.sessions = [];
        }
    }

    render() {
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const modalContainer = document.getElementById('modal-container');

        if (modalContainer) {
            modalContainer.style.maxWidth = '100%';
            modalContainer.style.width = '100%';
            modalContainer.style.margin = '0';
            try {
                const isSessionsPage = !!(document.body && document.body.classList && document.body.classList.contains('sessions-page'));
                modalContainer.style.height = isSessionsPage ? '100%' : '100vh';
            } catch (_) {
                modalContainer.style.height = '100vh';
            }
        }
        if (modalContent) {
            modalContent.style.padding = '0';
            modalContent.style.margin = '0';
            modalContent.style.width = '100%';
        }

        if (modalTitle) modalTitle.textContent = 'إدارة الجلسات';
        modalContent.classList.remove('search-modal-content');
        modalContent.classList.remove('px-4');
        modalContent.classList.add('px-0');


        modalContainer.classList.remove('max-w-5xl', 'max-w-7xl', 'mx-4');
        modalContainer.classList.add('w-full');

        modalContent.innerHTML = `
            <div class="sessions-calendar-container search-layout">
                <!-- Main Layout: Right Sidebar + Content -->
                <div class="flex gap-0">
                    <!-- Right Sidebar -->
                    <div class="w-80 lg:w-72 xl:w-72 2xl:w-80 flex-shrink-0 space-y-3 search-left-pane search-left-pane-dark">
                        <!-- View Toggle Buttons -->
                        <div class="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="ri-eye-line text-blue-500"></i>
                                طرق العرض
                            </h3>
                            <div class="flex gap-2 bg-gray-100 rounded-lg p-1 w-full">
                                <button id="calendar-view-btn" class="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'calendar' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}">
                                    <i class="ri-calendar-line ml-1"></i>
                                    تقويم
                                </button>
                                <button id="list-view-btn" class="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'list' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}">
                                    <i class="ri-list-check ml-1"></i>
                                    قائمة
                                </button>
                            </div>
                        </div>

                        <!-- Date Search Box -->
                        <div class="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="ri-search-line text-blue-500"></i>
                                البحث بالتاريخ
                            </h3>
                            <div class="flex gap-2">
                                <input type="text" id="date-search"
                                    class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                                    value="${this.filteredDate || ''}" placeholder="29/9/2026">
                                <button type="button" id="date-search-btn" class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center" title="بحث">
                                    <i class="ri-search-line text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Statistics -->
                        <div class="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                            <!-- Statistics Grid 2x3 -->
                            <div class="grid grid-cols-2 gap-2">
                                <!-- Today's Sessions -->
                                <div id="today-stats-btn" class="bg-gradient-to-br from-pink-50 to-red-100 rounded-lg p-3 border-2 border-red-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-red-400 hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200">
                                    <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-calendar-2-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-red-600 mb-1" id="stats-today">0</div>
                                    <div class="text-xs font-medium text-red-800">جلسات اليوم</div>
                                </div>

                                <!-- Tomorrow's Sessions -->
                                <div id="tomorrow-stats-btn" class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border-2 border-yellow-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-yellow-400 hover:bg-gradient-to-br hover:from-yellow-100 hover:to-yellow-200">
                                    <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-calendar-check-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-yellow-600 mb-1" id="stats-tomorrow">0</div>
                                    <div class="text-xs font-medium text-yellow-800">جلسات الغد</div>
                                </div>

                                <!-- This Week's Sessions -->
                                <div id="week-stats-btn" class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border-2 border-green-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-green-400 hover:bg-gradient-to-br hover:from-green-100 hover:to-green-200">
                                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-calendar-2-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-green-600 mb-1" id="stats-week">0</div>
                                    <div class="text-xs font-medium text-green-800">الأسبوع الحالي</div>
                                </div>

                                <!-- This Month's Sessions -->
                                <div id="month-stats-btn" class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-blue-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-calendar-2-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-blue-600 mb-1" id="stats-month">0</div>
                                    <div class="text-xs font-medium text-blue-800">الشهر الحالي</div>
                                </div>

                                <!-- Sessions Without Decisions -->
                                <div id="no-decisions-stats-btn" class="col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border-2 border-purple-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-100 hover:to-purple-200">
                                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-file-text-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-purple-600 mb-1" id="stats-no-decisions">0</div>
                                    <div class="text-xs font-medium text-purple-800">بدون قرارات</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Main Content Area -->
                    <div class="flex-1">
                        <div id="calendar-content" class="min-h-[calc(100vh-140px)]">
                            ${this.viewMode === 'calendar' ? this.renderCalendar() : this.renderSessionsList()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            const leftPane = document.querySelector('.sessions-calendar-container .search-left-pane');
            if (leftPane) {
                try { leftPane.classList.add('search-left-pane-dark'); } catch (_) { }
                try { leftPane.style.background = '#111827'; } catch (_) { }
                try { leftPane.style.borderLeft = '2px solid rgba(14, 165, 233, .45)'; } catch (_) { }
                try { leftPane.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
                try {
                    leftPane.style.borderBottomLeftRadius = '16px';
                    leftPane.style.borderBottomRightRadius = '16px';
                    leftPane.style.overflow = 'hidden';
                    leftPane.style.paddingBottom = '10px';
                } catch (_) { }

                try {
                    const applySidebarHeight = () => {
                        try {
                            const lp = document.querySelector('.sessions-calendar-container .search-left-pane');
                            if (!lp) return;
                            const rect = lp.getBoundingClientRect();
                            const vh = (window.innerHeight || 0);
                            const available = Math.max(0, vh - rect.top - 8);
                            if (available > 0) {
                                lp.style.height = available + 'px';
                                lp.style.maxHeight = available + 'px';
                                lp.style.overflowY = 'auto';
                                lp.style.overscrollBehavior = 'contain';
                            }
                        } catch (_) { }
                    };

                    this.__applySessionsSidebarHeight = applySidebarHeight;
                    applySidebarHeight();
                    if (typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(applySidebarHeight);
                    }
                    setTimeout(applySidebarHeight, 50);

                    if (!this.__sessionsSidebarResizeBound) {
                        this.__sessionsSidebarResizeBound = true;
                        window.addEventListener('resize', () => {
                            try { this.__applySessionsSidebarHeight && this.__applySessionsSidebarHeight(); } catch (_) { }
                        });
                    }
                } catch (_) { }

                try {
                    const cards = leftPane.querySelectorAll('div.bg-white');
                    cards.forEach((c) => {
                        try { c.style.background = 'rgba(15, 23, 42, .78)'; } catch (_) { }
                        try { c.style.borderColor = 'rgba(148, 163, 184, .18)'; } catch (_) { }
                    });
                } catch (_) { }

                try {
                    const headings = leftPane.querySelectorAll('h3');
                    headings.forEach((h) => { try { h.style.color = 'rgba(255,255,255,.94)'; } catch (_) { } });
                } catch (_) { }

                try {
                    const wrappers = leftPane.querySelectorAll('div.bg-gray-100');
                    wrappers.forEach((w) => {
                        try { w.style.background = 'rgba(255,255,255,.08)'; } catch (_) { }
                    });
                } catch (_) { }

                try {
                    const setImp = (node, prop, value) => {
                        try { node.style.setProperty(prop, value, 'important'); } catch (_) { }
                    };

                    const toggleIds = ['calendar-view-btn', 'list-view-btn'];
                    toggleIds.forEach((id) => {
                        const b = document.getElementById(id);
                        if (!b) return;
                        if (b.dataset && b.dataset.sbToggleStyled === '1') return;
                        if (b.dataset) b.dataset.sbToggleStyled = '1';

                        const isActive = () => b.classList && b.classList.contains('bg-blue-500');

                        const applyBase = () => {
                            try {
                                setImp(b, 'transition', 'background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease, outline-color .15s ease');
                                setImp(b, 'color', 'rgba(255,255,255,.92)');
                                setImp(b, 'outline', 'none');
                                setImp(b, 'outline-offset', '2px');
                                setImp(b, 'border', '1px solid rgba(148, 163, 184, .20)');
                                if (!isActive()) {
                                    setImp(b, 'background', 'rgba(255,255,255,.06)');
                                    b.classList.remove('hover:text-gray-800');
                                }
                            } catch (_) { }
                        };

                        const applyHover = () => {
                            try {
                                setImp(b, 'background', 'linear-gradient(135deg, rgba(245, 158, 11, .22), rgba(15, 23, 42, .92))');
                                setImp(b, 'border-color', 'rgba(245, 158, 11, .90)');
                                setImp(b, 'outline', '2px solid rgba(245, 158, 11, .55)');
                                setImp(b, 'transform', 'translateY(-1px) scale(1.02)');
                                setImp(b, 'box-shadow', '0 14px 24px rgba(245, 158, 11, .14), 0 10px 16px rgba(15, 23, 42, .20)');
                                setImp(b, 'color', 'rgba(255,255,255,.96)');
                            } catch (_) { }
                        };

                        applyBase();
                        b.addEventListener('mouseenter', applyHover);
                        b.addEventListener('mouseleave', () => {
                            try {
                                b.style.removeProperty('transform');
                                b.style.removeProperty('box-shadow');
                                b.style.removeProperty('border-color');
                                b.style.removeProperty('outline');
                                b.style.removeProperty('background');
                            } catch (_) { }
                            applyBase();
                        });
                        b.addEventListener('mousedown', () => { try { setImp(b, 'transform', 'translateY(0px) scale(1.01)'); } catch (_) { } });
                        b.addEventListener('mouseup', applyHover);
                        b.addEventListener('blur', applyBase);
                    });
                } catch (_) { }

                try {
                    const dateInput = document.getElementById('date-search');
                    if (dateInput) {
                        try { dateInput.style.background = 'rgba(255,255,255,.08)'; } catch (_) { }
                        try { dateInput.style.borderColor = 'rgba(148, 163, 184, .28)'; } catch (_) { }
                        try { dateInput.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
                    }
                } catch (_) { }

                try {
                    const btn = document.getElementById('sort-btn');
                    if (btn) {
                        try {
                            btn.style.setProperty('background', '#1e3a8a', 'important');
                            btn.style.setProperty('color', '#ffffff', 'important');
                            btn.style.setProperty('border', '1px solid rgba(255,255,255,0.10)', 'important');
                            btn.style.setProperty('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease', 'important');
                        } catch (_) { }
                        try {
                            const icon = btn.querySelector('i');
                            if (icon) icon.style.setProperty('color', 'rgba(255,255,255,.92)', 'important');
                        } catch (_) { }
                    }
                } catch (_) { }

                try {
                    const dateBtn = document.getElementById('date-search-btn');
                    if (dateBtn) {
                        try { dateBtn.style.setProperty('background', '#1e3a8a', 'important'); } catch (_) { }
                        try { dateBtn.style.setProperty('border', '1px solid rgba(255,255,255,0.10)', 'important'); } catch (_) { }
                        try { dateBtn.style.setProperty('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease', 'important'); } catch (_) { }
                    }
                } catch (_) { }

                try {
                    const statIds = ['today-stats-btn', 'tomorrow-stats-btn', 'week-stats-btn', 'month-stats-btn', 'no-decisions-stats-btn'];
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
        } catch (_) { }

        try {
            if (!document.getElementById('sessions-sidebar-hover-style')) {
                const st = document.createElement('style');
                st.id = 'sessions-sidebar-hover-style';
                st.textContent = `
                    .low-power .sessions-calendar-container .search-left-pane #sort-btn,
                    .low-power .sessions-calendar-container .search-left-pane #date-search-btn,
                    .low-power .sessions-calendar-container .search-left-pane #today-stats-btn,
                    .low-power .sessions-calendar-container .search-left-pane #tomorrow-stats-btn,
                    .low-power .sessions-calendar-container .search-left-pane #week-stats-btn,
                    .low-power .sessions-calendar-container .search-left-pane #month-stats-btn,
                    .low-power .sessions-calendar-container .search-left-pane #no-decisions-stats-btn {
                        transition: background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease !important;
                    }

                    .sessions-calendar-container #sort-btn:hover,
                    .sessions-calendar-container #date-search-btn:hover {
                        border-color: rgba(245, 158, 11, .90) !important;
                        outline: 2px solid rgba(245, 158, 11, .65) !important;
                        outline-offset: 2px !important;
                        transform: translateY(-1px) scale(1.02) !important;
                        box-shadow: 0 16px 26px rgba(245, 158, 11, .14), 0 12px 18px rgba(15, 23, 42, .20) !important;
                    }

                    .sessions-calendar-container .search-left-pane #today-stats-btn:hover,
                    .sessions-calendar-container .search-left-pane #tomorrow-stats-btn:hover,
                    .sessions-calendar-container .search-left-pane #week-stats-btn:hover,
                    .sessions-calendar-container .search-left-pane #month-stats-btn:hover,
                    .sessions-calendar-container .search-left-pane #no-decisions-stats-btn:hover {
                        background: linear-gradient(135deg, rgba(245, 158, 11, .22), rgba(15, 23, 42, .92)) !important;
                        border-color: rgba(245, 158, 11, .85) !important;
                        transform: translateY(-2px) scale(1.03) !important;
                        box-shadow: 0 14px 26px rgba(245, 158, 11, .16), 0 10px 18px rgba(15, 23, 42, .20) !important;
                    }

                    .sessions-calendar-container .search-left-pane #today-stats-btn:hover .w-8.h-8,
                    .sessions-calendar-container .search-left-pane #tomorrow-stats-btn:hover .w-8.h-8,
                    .sessions-calendar-container .search-left-pane #week-stats-btn:hover .w-8.h-8,
                    .sessions-calendar-container .search-left-pane #month-stats-btn:hover .w-8.h-8,
                    .sessions-calendar-container .search-left-pane #no-decisions-stats-btn:hover .w-8.h-8 {
                        background: #f59e0b !important;
                        box-shadow: 0 10px 16px rgba(245,158,11,.22) !important;
                    }

                    .sessions-calendar-container .search-left-pane #today-stats-btn:hover *:not(.w-8):not(.h-8),
                    .sessions-calendar-container .search-left-pane #tomorrow-stats-btn:hover *:not(.w-8):not(.h-8),
                    .sessions-calendar-container .search-left-pane #week-stats-btn:hover *:not(.w-8):not(.h-8),
                    .sessions-calendar-container .search-left-pane #month-stats-btn:hover *:not(.w-8):not(.h-8),
                    .sessions-calendar-container .search-left-pane #no-decisions-stats-btn:hover *:not(.w-8):not(.h-8) {
                        color: rgba(255,255,255,.95) !important;
                    }

                    .sessions-calendar-container #date-search::placeholder {
                        color: rgba(226,232,240,.78) !important;
                    }
                `;
                (document.head || document.documentElement).appendChild(st);
            }
        } catch (_) { }

        this.updateStatistics();
        const detailsPanel = document.getElementById('session-details');
        if (detailsPanel) { detailsPanel.remove(); }
        this.attachEventListeners();

        try {
            if (this.viewMode === 'calendar') {
                this.setupSessionsCalendarScrollBox?.();
            }
        } catch (_) { }


        if (this.viewMode === 'list') {
            setTimeout(() => {
                this.setupSessionsListScrollBox?.();
                if (this.__filterFn) this.computeFilteredCountAsync?.(this.__baseList, this.__filterFn);
                this.initIncrementalList?.();
            }, 10);
        }
    }

    updateStatistics() {
        const today = this.getNow();
        const yyyy = today.getFullYear();
        const mm = (today.getMonth() + 1).toString().padStart(2, '0');
        const dd = today.getDate().toString().padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const monthPrefix = `${yyyy}-${mm}`;

        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const daysFromSaturday = (dayOfWeek + 1) % 7;
        startOfWeek.setDate(today.getDate() - daysFromSaturday);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const startMs = startOfWeek.getTime();
        const endMs = endOfWeek.getTime();

        let monthSessions = 0;
        let weekSessions = 0;
        let todaySessions = 0;
        let tomorrowSessions = 0;
        let noDecisionSessions = 0;

        const dTomorrow = new Date(today);
        dTomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = `${dTomorrow.getFullYear()}-${(dTomorrow.getMonth() + 1).toString().padStart(2, '0')}-${dTomorrow.getDate().toString().padStart(2, '0')}`;

        const items = this.sessions || [];
        for (let i = 0; i < items.length; i++) {
            const s = items[i];
            const sd = s.sessionDate;
            if (sd && typeof sd === 'string') {
                if (sd.slice(0, 7) === monthPrefix) monthSessions++;
                if (sd === todayStr) todaySessions++;
                if (sd === tomorrowStr) tomorrowSessions++;
            }
            const ts = s.__ts;
            if (typeof ts === 'number' && ts >= startMs && ts <= endMs) weekSessions++;
            if (!s.__hasDecision) noDecisionSessions++;
        }

        const monthElement = document.getElementById('stats-month');
        const weekElement = document.getElementById('stats-week');
        const todayElement = document.getElementById('stats-today');
        const tomorrowElement = document.getElementById('stats-tomorrow');
        const noDecisionElement = document.getElementById('stats-no-decisions');

        if (monthElement) monthElement.textContent = monthSessions;
        if (weekElement) weekElement.textContent = weekSessions;
        if (todayElement) todayElement.textContent = todaySessions;
        if (tomorrowElement) tomorrowElement.textContent = tomorrowSessions;
        if (noDecisionElement) noDecisionElement.textContent = noDecisionSessions;
    }


    getNow() {
        try {
            const raw = localStorage.getItem('onlineTimeOffsetMs');
            const offset = raw ? parseInt(raw, 10) : 0;
            if (!isNaN(offset)) {
                return new Date(Date.now() + offset);
            }
        } catch (e) { }
        return new Date();
    }

    async syncTimeOffset() {


        const endpoints = [
            'http://worldclockapi.com/api/json/utc/now',
            'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
            'https://worldtimeapi.org/api/timezone/UTC',
            'https://api.github.com',
            'https://httpbin.org/get'
        ];
        for (const url of endpoints) {
            try {
                const t0 = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const res = await fetch(url, {
                    cache: 'no-store',
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const t1 = Date.now();

                let serverMs = null;
                try {
                    const ct = res.headers.get('date');
                    if (ct) serverMs = new Date(ct).getTime();
                } catch (e) { }
                if (!serverMs && !url.includes('github.com') && !url.includes('httpbin.org')) {
                    try {
                        const text = await res.text();
                        const data = JSON.parse(text);
                        if (data.currentDateTime) serverMs = new Date(data.currentDateTime).getTime();
                        else if (data.utc_datetime) serverMs = new Date(data.utc_datetime).getTime();
                        else if (data.dateTime) serverMs = new Date(data.dateTime).getTime();
                        else if (data.datetime) serverMs = new Date(data.datetime).getTime();
                    } catch (e) { }
                }
                if (serverMs) {

                    const rtt = (t1 - t0) / 2;
                    const approxNow = serverMs + rtt;
                    const localNow = Date.now();
                    const offset = approxNow - localNow;
                    try { localStorage.setItem('onlineTimeOffsetMs', String(offset)); } catch (e) { }
                    return offset;
                }
            } catch (e) {

            }
        }
        return null;
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = this.getNow();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());


        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        const monthOptions = monthNames.map((m, idx) => `<option value="${idx}" ${idx === month ? 'selected' : ''}>${m}</option>`).join('');
        const yearStart = 2000;
        const yearEnd = 2050;
        let yearOptions = '';
        for (let y = yearStart; y <= yearEnd; y++) {
            yearOptions += `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`;
        }


        const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];


        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // أول يوم في الأسبوع = الأحد (getDay: 0=أحد، 6=سبت)
        const startingDayOfWeek = firstDay.getDay();

        let calendarHTML = `
            <div class="calendar-container bg-white rounded-lg shadow-md border border-gray-200 w-full relative">
                <!-- Calendar Header -->
                <div class="calendar-header bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-t-lg relative">
                    <button id="sync-time-btn" class="absolute left-2 top-2 w-7 h-7 rounded-full bg-green-400 hover:bg-green-500 text-white flex items-center justify-center shadow" title="مزامنة">
                        <i class="ri-refresh-line text-sm"></i>
                    </button>
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                        <div class="flex items-center gap-2">
                            <button id="next-month" class="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors" title="الشهر التالي">
                                <i class="ri-arrow-right-s-line text-lg"></i>
                            </button>
                            <button id="prev-month" class="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors" title="الشهر السابق">
                                <i class="ri-arrow-left-s-line text-lg"></i>
                            </button>
                        </div>
                        <button id="open-month-year-picker" type="button" class="text-lg font-bold px-2 py-1 rounded-md transition-colors border border-white/60 bg-white/10 hover:bg-white/20 hover:border-white/80 shadow-sm">${monthNames[month]} ${year}</button>
                        <div class="w-6"></div>
                    </div>
                </div>

                <div id="month-year-picker" class="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-[260px]">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <div class="text-xs font-bold text-gray-700 mb-1">الشهر</div>
                            <select id="picker-month" class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm">${monthOptions}</select>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-gray-700 mb-1">السنة</div>
                            <select id="picker-year" class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm">${yearOptions}</select>
                        </div>
                    </div>
                    <div class="mt-3 flex justify-between gap-2">
                        <button id="picker-cancel" type="button" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-bold">إلغاء</button>
                        <button id="picker-go" type="button" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold">عرض</button>
                    </div>
                </div>

                <!-- Days of Week Header -->
                <div class="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        `;


        dayNames.forEach(day => {
            calendarHTML += `
                <div class="p-2 text-center text-xs font-semibold text-gray-600 border-l border-gray-200 last:border-l-0">
                    ${day}
                </div>
            `;
        });

        calendarHTML += `</div><div class="grid grid-cols-7 gap-0">`;


        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += `<div class="h-20 border-l border-b border-gray-200 bg-gray-50"></div>`;
        }


        for (let day = 1; day <= daysInMonth; day++) {
            const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const sessionsForDay = this.getSessionsForDate(currentDateStr);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = this.selectedDate === currentDateStr;
            const dayDateObj = new Date(year, month, day);
            const isPast = dayDateObj.getTime() < todayMidnight.getTime();
            const hasSessions = sessionsForDay.length > 0;

            let dayClasses = 'h-20 border-l border-b border-gray-200 p-1.5 cursor-pointer transition-all duration-200 relative overflow-hidden';
            let dayContent = '';
            let dayNumberStyle = 'text-xs font-medium text-gray-800 mb-1';

            if (isPast && hasSessions) {
                dayClasses += ' bg-gray-200 border-gray-400 hover:bg-gray-300 hover:border-gray-500';
                dayNumberStyle = 'text-xs font-bold text-gray-800 mb-1';
            } else if (isToday) {
                dayClasses += ' bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300';
                dayNumberStyle = 'text-xs font-bold text-blue-800 mb-1';
            } else {
                dayClasses += ' hover:bg-blue-50 hover:border-blue-300';
            }

            if (isSelected) {
                if (isPast && hasSessions) {
                    dayClasses += ' ring-1 ring-gray-500 bg-gray-200';
                    dayNumberStyle = 'text-xs font-bold text-gray-800 mb-1';
                } else {
                    dayClasses += ' ring-1 ring-blue-500 bg-gradient-to-br from-blue-200 to-blue-300';
                    dayNumberStyle = 'text-xs font-bold text-blue-900 mb-1';
                }
            }

            if (hasSessions) {

                if (!isPast) {
                    dayClasses += ' bg-gradient-to-br from-green-100 to-green-200 border-green-300';
                    dayNumberStyle = 'text-xs font-bold text-green-800 mb-1';
                }


                dayContent = `
                    <div class="flex items-center justify-center h-full">
                        <div class="bg-white bg-opacity-90 rounded-lg px-2 py-1 shadow-md border">
                            <div class="text-sm font-bold text-gray-800 text-center flex items-center justify-center gap-1">
                                <i class="ri-calendar-event-fill text-sm"></i>
                                <span>${sessionsForDay.length}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            calendarHTML += `
                <div class="${dayClasses}" data-date="${currentDateStr}">
                    <div class="${dayNumberStyle}">${day}</div>
                    ${dayContent}
                </div>
            `;
        }

        calendarHTML += `</div></div>`;

        return calendarHTML;
    }

    getSortButtonText() {
        switch (this.sortOrder) {
            case 'desc': return 'الأحدث أولاً';
            case 'asc': return 'الأقدم أولاً';
            case 'decisions': return 'بدون قرار أولاً';
            default: return 'الأحدث أولاً';
        }
    }

    getSortButtonIcon() {
        switch (this.sortOrder) {
            case 'desc': return 'ri-arrow-down-line';
            case 'asc': return 'ri-arrow-up-line';
            case 'decisions': return 'ri-file-text-line';
            default: return 'ri-arrow-down-line';
        }
    }

    renderSessionsList() {
        // اختيار قائمة مهيأة حسب ترتيب الفرز الحالي
        let baseList = this.__sortedDesc || this.sessions;
        if (this.sortOrder === 'asc') baseList = this.__sortedAsc || baseList;
        else if (this.sortOrder === 'decisions') baseList = this.__sortedDecisions || baseList;

        let sessionsToShow = baseList;
        let titleText = 'الجلسات';
        let clearFilterButton = '';
        let filterFn = null;

        let titleClass = 'text-sm md:text-lg';

        if (this.filteredDate) {
            const eqDate = this.filteredDate;
            filterFn = (session) => session.sessionDate === eqDate;
            titleText = `جلسات يوم ${this.filteredDate}`;
            titleClass = 'text-sm md:text-base';
            clearFilterButton = `
                <button id="clear-filter-btn" class="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                    <i class="ri-close-line ml-1"></i>إلغاء الفلترة
                </button>
            `;
        } else if (this.filterType) {
            const today = this.getNow();

            if (this.filterType === 'week') {
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay();
                const daysFromSaturday = (dayOfWeek + 1) % 7;
                startOfWeek.setDate(today.getDate() - daysFromSaturday);
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

                const startMs = startOfWeek.getTime();
                const endMs = endOfWeek.getTime();
                filterFn = (session) => {
                    const ts = session.__ts;
                    return typeof ts === 'number' && ts >= startMs && ts <= endMs;
                };
                titleText = 'جلسات الأسبوع الحالي';
                titleClass = 'text-sm md:text-base';

            } else if (this.filterType === 'month') {
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                const ym = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
                filterFn = (session) => {
                    const sd = session.sessionDate;
                    return !!sd && typeof sd === 'string' && sd.slice(0, 7) === ym;
                };
                titleText = 'جلسات الشهر الحالي';
                titleClass = 'text-sm md:text-base';

            } else if (this.filterType === 'no-decisions') {
                filterFn = (session) => !session.__hasDecision;
                titleText = 'الجلسات بدون قرارات';
                titleClass = 'text-sm md:text-base';
            }

            clearFilterButton = `
                <button id="clear-filter-btn" class="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                    <i class="ri-close-line ml-1"></i>إلغاء الفلترة
                </button>
            `;
        }

        // لا نقوم بفلترة كاملة فورًا لتجنب حظر واجهة المستخدم عند وجود آلاف العناصر
        if (filterFn) {
            sessionsToShow = [];
        }

        if (!filterFn && sessionsToShow.length === 0) {
            return `
                <div class="text-center py-12">
                    <i class="ri-calendar-line text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">${this.filteredDate ? 'لا توجد جلسات في هذا التاريخ' : 'لا توجد جلسات مضافة بعد'}</p>
                    <p class="text-gray-400 text-sm mt-2">يمكنك إضافة الجلسات من خلال القضايا أو الموكلين</p>
                    ${clearFilterButton}
                </div>
            `;
        }

        // إعداد مصادر العرض التدريجي
        this.__filterFn = filterFn;
        if (filterFn) {
            this.__baseList = baseList;
            this.__currentList = null;
            this.__scanIndex = 0;
        } else {
            this.__baseList = null;
            this.__currentList = sessionsToShow;
        }
        this.__renderedCount = 0;

        const listHTML = `
            <div class="w-full">
                <div id="sessions-list-wrapper" class="bg-blue-50 rounded-xl border-2 border-blue-300 shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
                    <div class="sessions-list-header flex justify-between items-center p-3 border-b border-blue-200/60 bg-blue-50">
                        <div class="flex items-center gap-3">
                            <h3 class="${titleClass} font-bold text-gray-800">${titleText} (<span id="sessions-total">${filterFn ? '...' : String(sessionsToShow.length)}</span>)</h3>
                            ${clearFilterButton}
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="sort-btn" class="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md">
                                <span>${this.getSortButtonText()}</span>
                                <i class="${this.getSortButtonIcon()} text-gray-600"></i>
                            </button>
                        </div>
                    </div>
                    <div id="sessions-list" class="space-y-2 md:space-y-3 overscroll-contain p-2 md:p-3">
                        <div id="sessions-list-sentinel" class="hidden"></div>
                    </div>
                </div>
            </div>`;
        return listHTML;
    }

    getSessionsForDate(dateStr) {
        return this.sessions.filter(session => session.sessionDate === dateStr);
    }

    attachEventListeners() {

        document.getElementById('calendar-view-btn')?.addEventListener('click', () => {
            if (this.viewMode !== 'calendar') {
                this.viewMode = 'calendar';

                this.filteredDate = null;
                document.getElementById('date-search').value = '';
                this.saveState();
                this.updateContent();
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            }
        });

        document.getElementById('list-view-btn')?.addEventListener('click', () => {
            if (this.viewMode !== 'list') {
                this.viewMode = 'list';


                this.saveState();
                this.updateContent();
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            }
        });


        document.getElementById('next-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.saveState();
            this.updateContent();
        });

        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.saveState();
            this.updateContent();
        });


        const openPickerBtn = document.getElementById('open-month-year-picker');
        if (openPickerBtn) {
            openPickerBtn.replaceWith(openPickerBtn.cloneNode(true));
            const newOpenPickerBtn = document.getElementById('open-month-year-picker');
            newOpenPickerBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const panel = document.getElementById('month-year-picker');
                if (panel) panel.classList.toggle('hidden');
            });
        }

        const cancelBtn = document.getElementById('picker-cancel');
        if (cancelBtn) {
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            const newCancelBtn = document.getElementById('picker-cancel');
            newCancelBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const panel = document.getElementById('month-year-picker');
                if (panel) panel.classList.add('hidden');
            });
        }

        const goBtn = document.getElementById('picker-go');
        if (goBtn) {
            goBtn.replaceWith(goBtn.cloneNode(true));
            const newGoBtn = document.getElementById('picker-go');
            newGoBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const monthSel = document.getElementById('picker-month');
                const yearSel = document.getElementById('picker-year');
                const panel = document.getElementById('month-year-picker');
                const m = monthSel ? parseInt(monthSel.value, 10) : NaN;
                const y = yearSel ? parseInt(yearSel.value, 10) : NaN;
                if (!isNaN(m) && !isNaN(y)) {
                    this.currentDate = new Date(y, m, 1);
                    this.saveState();
                    this.updateContent();
                }
                if (panel) panel.classList.add('hidden');
            });
        }

        const panelEl = document.getElementById('month-year-picker');
        if (panelEl && !panelEl.__outsideBound) {
            panelEl.__outsideBound = true;
            document.addEventListener('click', (e) => {
                try {
                    const panel = document.getElementById('month-year-picker');
                    const btn = document.getElementById('open-month-year-picker');
                    if (!panel || panel.classList.contains('hidden')) return;
                    if (panel.contains(e.target)) return;
                    if (btn && btn.contains(e.target)) return;
                    panel.classList.add('hidden');
                } catch (_) { }
            });
        }


        document.getElementById('sync-time-btn')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const icon = btn.querySelector('i');
            btn.disabled = true;
            btn.classList.add('opacity-80', 'cursor-not-allowed');
            const oldIcon = icon.className;
            icon.classList.add('animate-spin');
            showToast('جارٍ تحديث التقويم...', 'info');
            try {
                const offset = await this.syncTimeOffset();
                if (typeof offset === 'number') {
                    showToast('تمت مزامنة الوقت بنجاح', 'success');
                    this.updateStatistics();
                    this.updateContent();
                } else {
                    showToast('تعذر المزامنة حالياً', 'error');
                }
            } catch (e) {
                showToast('تعذر المزامنة حالياً', 'error');
            } finally {
                icon.classList.remove('animate-spin');
                btn.disabled = false;
                btn.classList.remove('opacity-80', 'cursor-not-allowed');
            }
        });


        const dateSearch = document.getElementById('date-search');
        const dateSearchBtn = document.getElementById('date-search-btn');
        const self = this;
        if (dateSearch) {
            dateSearch.replaceWith(dateSearch.cloneNode(true));
            const newDateSearch = document.getElementById('date-search');
            const normalize = (s) => {
                const normalizeDigitsOnly = (v) => {
                    try {
                        let out = (v == null) ? '' : String(v);
                        out = out.replace(/[\u200E\u200F\u061C]/g, '');
                        const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
                        const easternArabicIndic = '۰۱۲۳۴۵۶۷۸۹';
                        out = out.replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)));
                        out = out.replace(/[۰-۹]/g, (d) => String(easternArabicIndic.indexOf(d)));
                        return out;
                    } catch (e) {
                        return (v == null) ? '' : String(v);
                    }
                };
                const t = s && s.trim() ? normalizeDigitsOnly(s).trim() : '';
                const m = t.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/);
                if (m) {
                    let d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
                    if (m[3].length === 2) { y = y < 50 ? 2000 + y : 1900 + y; }
                    const dt = new Date(y, mo - 1, d);
                    if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
                        const p = n => n.toString().padStart(2, '0');
                        return `${y}-${p(mo)}-${p(d)}`;
                    }
                }
                return s;
            };
            const handle = () => {
                const raw = newDateSearch.value;
                const norm = normalize(raw);
                if (norm) {
                    newDateSearch.value = norm;
                    if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                    self.searchByDate(norm, { silent: true });
                }
            };
            newDateSearch.addEventListener('change', handle);
            newDateSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handle(); } });


            if (dateSearchBtn) {
                dateSearchBtn.addEventListener('click', handle);
            }
            if (newDateSearch && typeof attachDatePicker === 'function') attachDatePicker(newDateSearch, { format: 'DD/MM/YYYY' });
        }


        const clearBtn = document.getElementById('clear-filter-btn');
        if (clearBtn) {
            clearBtn.replaceWith(clearBtn.cloneNode(true));
            const newClearBtn = document.getElementById('clear-filter-btn');
            newClearBtn.addEventListener('click', () => {
                this.clearFilter();
            });
        }



        const sortBtn = document.getElementById('sort-btn');
        if (sortBtn) {

            sortBtn.replaceWith(sortBtn.cloneNode(true));
            const newSortBtn = document.getElementById('sort-btn');
            newSortBtn.addEventListener('click', () => {
                this.toggleSort();
            });
        }


        const todayStatsBtn = document.getElementById('today-stats-btn');
        if (todayStatsBtn) {
            const newBtn = todayStatsBtn.cloneNode(true);
            todayStatsBtn.parentNode.replaceChild(newBtn, todayStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showTodaySessions();
            });
        }

        const tomorrowStatsBtn = document.getElementById('tomorrow-stats-btn');
        if (tomorrowStatsBtn) {
            const newBtn = tomorrowStatsBtn.cloneNode(true);
            tomorrowStatsBtn.parentNode.replaceChild(newBtn, tomorrowStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showTomorrowSessions();
            });
        }

        const weekStatsBtn = document.getElementById('week-stats-btn');
        if (weekStatsBtn) {
            const newBtn = weekStatsBtn.cloneNode(true);
            weekStatsBtn.parentNode.replaceChild(newBtn, weekStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showWeekSessions();
            });
        }

        const monthStatsBtn = document.getElementById('month-stats-btn');
        if (monthStatsBtn) {
            const newBtn = monthStatsBtn.cloneNode(true);
            monthStatsBtn.parentNode.replaceChild(newBtn, monthStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showMonthSessions();
            });
        }

        const noDecisionsStatsBtn = document.getElementById('no-decisions-stats-btn');
        if (noDecisionsStatsBtn) {
            const newBtn = noDecisionsStatsBtn.cloneNode(true);
            noDecisionsStatsBtn.parentNode.replaceChild(newBtn, noDecisionsStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showNoDecisionsSessions();
            });
        }


        document.querySelectorAll('[data-date]').forEach(dayElement => {
            dayElement.addEventListener('click', (e) => {
                const date = e.currentTarget.dataset.date;

                const dateInput = document.getElementById('date-search');
                if (dateInput) dateInput.value = date;
                this.selectDate(date);
            });
        });


        if (this.viewMode === 'list') {
            const listEl = document.getElementById('sessions-list');
            if (listEl && !listEl.__delegatedBound) {
                listEl.__delegatedBound = true;
                listEl.addEventListener('click', (e) => {
                    const viewBtn = e.target.closest('.view-case-btn');
                    if (viewBtn) {
                        const sessionId = parseInt(viewBtn.dataset.sessionId, 10);
                        this.saveState();
                        window.location.href = `case-info.html?sessionId=${sessionId}`;
                        return;
                    }
                    const editBtn = e.target.closest('.edit-session-btn');
                    if (editBtn) {
                        const sessionId = parseInt(editBtn.dataset.sessionId, 10);
                        this.saveState();
                        window.location.href = `session-edit.html?sessionId=${sessionId}`;
                        return;
                    }
                    const delBtn = e.target.closest('.delete-session-btn');
                    if (delBtn) {
                        const sessionId = parseInt(delBtn.dataset.sessionId, 10);
                        this.deleteSession(sessionId);
                        return;
                    }
                });
            }
        }
    }

    updateContent() {
        const contentContainer = document.getElementById('calendar-content');
        if (contentContainer) {
            try {
                contentContainer.style.maxHeight = '';
                contentContainer.style.overflowY = '';
            } catch (_) { }

            contentContainer.innerHTML = this.viewMode === 'calendar' ? this.renderCalendar() : this.renderSessionsList();
            this.attachEventListeners();
            if (this.viewMode === 'list') {

                setTimeout(() => {
                    this.setupSessionsListScrollBox?.();
                    if (this.__filterFn) this.computeFilteredCountAsync?.(this.__baseList, this.__filterFn);
                    this.initIncrementalList?.();
                }, 10);
            } else {
                this.setupSessionsCalendarScrollBox?.();
            }
        }

        try {
            const mainEl = document.querySelector('main');
            if (mainEl) {
                if (this.viewMode === 'calendar') mainEl.style.overflowY = 'hidden';
                else mainEl.style.overflowY = 'auto';
            }
        } catch (_) { }

        try {
            if (this.__applySessionsSidebarHeight) {
                this.__applySessionsSidebarHeight();
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(() => {
                        try { this.__applySessionsSidebarHeight(); } catch (_) { }
                    });
                }
                setTimeout(() => {
                    try { this.__applySessionsSidebarHeight(); } catch (_) { }
                }, 50);
            }
        } catch (_) { }

        this.scheduleUpdateStatistics?.();


        const calendarBtn = document.getElementById('calendar-view-btn');
        const listBtn = document.getElementById('list-view-btn');

        if (calendarBtn && listBtn) {
            calendarBtn.className = `flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'calendar' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`;
            listBtn.className = `flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'list' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`;
        }


        const detailsPanel = document.getElementById('session-details');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }


    }

    setupSessionsCalendarScrollBox() {
        try {
            const contentContainer = document.getElementById('calendar-content');
            if (!contentContainer) return;

            const mainEl = document.querySelector('main');
            const viewportH = window.innerHeight;
            const top = contentContainer.getBoundingClientRect().top;
            const targetH = Math.max(240, viewportH - top - 12);

            contentContainer.style.maxHeight = targetH + 'px';
            contentContainer.style.overflowY = 'auto';
            contentContainer.style.overscrollBehavior = 'contain';

            if (mainEl) {
                mainEl.style.overflowY = 'hidden';
            }
        } catch (_) { }

        if (!this.__sessionsCalendarResizeBound) {
            this.__sessionsCalendarResizeBound = true;
            window.addEventListener('resize', () => {
                try { this.setupSessionsCalendarScrollBox(); } catch (_) { }
            });
        }
    }

    searchByDate(dateStr, options = {}) {
        const { silent = false } = options;

        const isNewSearch = this.lastToastDate !== dateStr;

        const sessionsForDate = this.getSessionsForDate(dateStr);


        this.filteredDate = dateStr;
        this.filterType = null;


        this.viewMode = 'list';
        this.selectedDate = dateStr;
        this.saveState();
        this.updateContent();


        if (!silent && isNewSearch) {
            this.lastToastDate = dateStr;


        }
    }

    clearFilter() {
        this.filteredDate = null;
        this.filterType = null;
        this.selectedDate = null;
        this.lastToastDate = null;
        document.getElementById('date-search').value = '';
        this.saveState();
        this.updateContent();

    }

    showTodaySessions() {

        const today = this.getNow();
        const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;


        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = todayStr;
        }


        this.filterType = null;


        this.searchByDate(todayStr, { silent: true });
    }

    showTomorrowSessions() {

        const today = this.getNow();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;


        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = tomorrowStr;
        }


        this.filterType = null;


        this.searchByDate(tomorrowStr, { silent: true });
    }

    showWeekSessions() {

        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = '';
        }


        this.filteredDate = null;
        this.viewMode = 'list';
        this.selectedDate = null;
        this.filterType = 'week';
        this.saveState();
        this.updateContent();
    }

    showMonthSessions() {

        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = '';
        }


        this.filteredDate = null;
        this.viewMode = 'list';
        this.selectedDate = null;
        this.filterType = 'month';
        this.saveState();
        this.updateContent();
    }

    showNoDecisionsSessions() {

        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = '';
        }


        this.filteredDate = null;
        this.viewMode = 'list';
        this.selectedDate = null;
        this.filterType = 'no-decisions';
        this.saveState();
        this.updateContent();
    }


    toggleSort() {

        if (this.sortOrder === 'desc') {
            this.sortOrder = 'asc';
        } else if (this.sortOrder === 'asc') {
            this.sortOrder = 'decisions';
        } else {
            this.sortOrder = 'desc';
        }


        const sortBtn = document.getElementById('sort-btn');
        if (sortBtn) {
            const span = sortBtn.querySelector('span');
            const icon = sortBtn.querySelector('i');
            if (span) span.textContent = this.getSortButtonText();
            if (icon) icon.className = `${this.getSortButtonIcon()} text-gray-600`;
        }


        if (this.viewMode === 'list') {
            const contentContainer = document.getElementById('calendar-content');
            if (contentContainer) {
                contentContainer.innerHTML = this.renderSessionsList();
                this.attachEventListeners();
                setTimeout(() => {
                    this.setupSessionsListScrollBox?.();
                    if (this.__filterFn) this.computeFilteredCountAsync?.(this.__baseList, this.__filterFn);
                    this.initIncrementalList?.();
                }, 10);
            }
        }


    }

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        const sessionsForDate = this.getSessionsForDate(dateStr);
        if (this.viewMode === 'calendar') {
            if (sessionsForDate.length > 0) {
                this.filteredDate = dateStr;
                this.viewMode = 'list';
                this.updateContent();
            } else {
                this.updateContent();
            }
        } else {
            this.filteredDate = dateStr;
            this.updateContent();
        }
    }

    showSessionDetails(sessions) {
        const detailsContainer = document.getElementById('session-details');
        if (!detailsContainer) return;
        detailsContainer.classList.add('hidden');
    }

    clearSessionDetails() {
        const detailsContainer = document.getElementById('session-details');
        if (detailsContainer) {
            detailsContainer.classList.add('hidden');
        }
    }

    attachDetailEventListeners() {
        document.querySelectorAll('#session-details .view-case-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const sessionId = parseInt(e.currentTarget.dataset.sessionId, 10);
                await this.viewCaseData(sessionId);
            });
        });

        document.querySelectorAll('#session-details .edit-session-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const sessionId = parseInt(e.currentTarget.dataset.sessionId, 10);
                const sessionData = await getById('sessions', sessionId);
                this.editSession(sessionId, sessionData);
            });
        });

        document.querySelectorAll('#session-details .delete-session-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sessionId = parseInt(e.currentTarget.dataset.sessionId, 10);
                this.deleteSession(sessionId);
            });
        });
    }


    setupSessionsListScrollBox() {
        try {
            const wrapper = document.getElementById('sessions-list-wrapper');
            const list = document.getElementById('sessions-list');
            if (!wrapper || !list) return;

            const mainEl = document.querySelector('main');
            const viewportH = window.innerHeight;
            const top = wrapper.getBoundingClientRect().top;
            const targetH = Math.max(240, viewportH - top - 12);

            wrapper.style.height = targetH + 'px';
            wrapper.style.minHeight = '0px';
            list.style.maxHeight = (targetH - 48) + 'px';
            list.style.overflowY = 'auto';

            if (mainEl) {
                mainEl.style.overflowY = 'hidden';
            }
        } catch (e) { }


        if (!this.__sessionsListResizeBound) {
            this.__sessionsListResizeBound = true;
            window.addEventListener('resize', () => this.setupSessionsListScrollBox());
        }
    }

    buildSessionCardHTML(session) {
        const sessionDate = this.formatDateForDisplay(session.sessionDate);
        const roll = session.roll || '-';
        const inventoryNumber = session.inventoryNumber || '-';
        const decision = session.decision || 'لا يوجد قرار';

        const caseRecord = this.caseMap ? this.caseMap.get(session.caseId) : null;
        const caseNo = caseRecord ? `${caseRecord.caseNumber || '-'}` : '-';
        const caseYear = caseRecord ? `${caseRecord.caseYear || '-'}` : '-';
        const invCombo = `${inventoryNumber} لسنة ${session.inventoryYear || '-'}`;

        const clientId = caseRecord?.clientId;
        const opponentId = caseRecord?.opponentId;
        const clientKey = (clientId != null && clientId !== '') ? Number(clientId) : null;
        const opponentKey = (opponentId != null && opponentId !== '') ? Number(opponentId) : null;
        const clientName = (clientKey != null && this.clientMap) ? (this.clientMap.get(clientKey) || 'غير محدد') : 'غير محدد';
        const opponentName = (opponentKey != null && this.opponentMap) ? (this.opponentMap.get(opponentKey) || 'غير محدد') : 'غير محدد';

        return `
            <div class="session-card bg-white border border-gray-300 rounded-lg p-2 md:p-3 shadow-sm hover:shadow-md hover:border-blue-400 transition-all">
                <div class="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-3">
                    <div class="flex-1 w-full">
                        <!-- Mobile layout (keep current) -->
                        <div class="md:hidden space-y-1.5">
                            <div class="text-center">
                                <div class="session-client-name text-xl font-bold text-blue-700 leading-normal truncate" title="${clientName}">${clientName}</div>
                                <div class="session-opponent-name mt-0.5 text-xl font-bold text-red-600 leading-normal truncate pb-0.5" title="${opponentName}">${opponentName}</div>
                            </div>
                            <div class="session-meta text-gray-700">
                                <div class="grid grid-cols-2 gap-x-3 gap-y-1">
                                    <div class="inline-flex items-center min-w-0"><i class="ri-briefcase-line text-gray-500 ml-1"></i><span>القضية:</span>&nbsp;<strong>${caseNo} لسنة ${caseYear}</strong></div>
                                    <div class="inline-flex items-center min-w-0"><i class="ri-archive-line text-gray-500 ml-1"></i><span>الحصر:</span>&nbsp;<strong>${invCombo}</strong></div>
                                    <div class="inline-flex items-center min-w-0"><i class="ri-calendar-event-line text-gray-500 ml-1"></i><span>التاريخ:</span>&nbsp;<strong>${sessionDate}</strong></div>
                                    <div class="inline-flex items-center min-w-0"><i class="ri-list-ordered text-gray-500 ml-1"></i><span>الرول:</span>&nbsp;<strong>${roll}</strong></div>
                                </div>
                                <div class="mt-1 inline-flex items-start min-w-0 leading-tight"><i class="ri-file-text-line text-gray-500 ml-1 mt-0.5"></i><span>القرار:</span>&nbsp;<strong class="min-w-0 break-words">${decision}</strong></div>
                            </div>
                        </div>

                        <!-- Desktop layout (old) -->
                        <div class="hidden md:block space-y-2">
                            <div class="flex items-center flex-nowrap gap-2">
                                <div class="flex items-center gap-2 shrink-0">
                                    <i class="ri-user-3-line text-blue-600 text-lg"></i>
                                    <span class="text-base font-bold text-blue-700">${clientName}</span>
                                </div>
                                <span class="text-sm text-gray-500 font-semibold whitespace-nowrap shrink-0">ضد</span>
                                <div class="flex items-center gap-2 shrink-0">
                                    <span class="text-base font-bold text-red-600">${opponentName}</span>
                                </div>
                            </div>
                            <div class="flex flex-wrap items-center text-sm text-gray-700 gap-1">
                                <span class="inline-flex items-center min-w-0 min-w-[140px]"><i class="ri-briefcase-line text-gray-500 ml-1"></i>القضية: <strong>${caseNo} لسنة ${caseYear}</strong></span>
                                <span class="text-gray-300 mx-2">|</span>
                                <span class="inline-flex items-center"><i class="ri-archive-line text-gray-500 ml-1"></i>الحصر: <strong>${invCombo}</strong></span>
                            </div>
                            <div class="flex flex-wrap items-center text-sm text-gray-700 gap-1">
                                <span class="inline-flex items-center min-w-0 min-w-[140px]"><i class="ri-calendar-event-line text-gray-500 ml-1"></i>التاريخ: <strong>${sessionDate}</strong></span>
                                <span class="text-gray-300 mx-2">|</span>
                                <span class="inline-flex items-center"><i class="ri-list-ordered text-gray-500 ml-1"></i>الرول: <strong>${roll}</strong></span>
                            </div>
                            <div class="flex flex-wrap items-center text-sm text-gray-700">
                                <span class="inline-flex items-center min-w-0 min-w-[140px]"><i class="ri-file-text-line text-gray-500 ml-1"></i>القرار: <strong>${decision}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div class="flex w-full md:w-auto flex-row md:flex-col gap-1.5 order-last md:order-none mt-2 md:mt-0 justify-end">
                        <button class="view-case-btn flex items-center gap-2 px-2 py-1 md:px-5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" data-session-id="${session.id}" title="عرض بيانات القضية">
                            <i class="ri-eye-line text-xs md:text-xl"></i>
                            <span class="text-[11px] leading-none md:hidden whitespace-nowrap">اطلاع</span>
                            <span class="hidden md:inline text-sm font-bold">عرض</span>
                        </button>
                        <button class="edit-session-btn flex items-center gap-2 px-2 py-1 md:px-5 md:py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors" data-session-id="${session.id}" title="تعديل الجلسة">
                            <i class="ri-pencil-line text-xs md:text-xl"></i>
                            <span class="text-[11px] leading-none md:hidden whitespace-nowrap">تعديل</span>
                            <span class="hidden md:inline text-sm font-bold">تعديل</span>
                        </button>
                        <button class="delete-session-btn flex items-center gap-2 px-2 py-1 md:px-5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" data-session-id="${session.id}" title="حذف الجلسة">
                            <i class="ri-delete-bin-line text-xs md:text-xl"></i>
                            <span class="text-[11px] leading-none md:hidden whitespace-nowrap">حذف</span>
                            <span class="hidden md:inline text-sm font-bold">حذف</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    initIncrementalList() {
        try {
            const listEl = document.getElementById('sessions-list');
            if (!listEl) return;
            listEl.innerHTML = '';
            this.__renderedCount = 0;
            const firstBatch = Math.min(15, this.listBatchSize);
            this.appendNextBatch(firstBatch);

            if (!listEl.__scrollHandlerBound) {
                listEl.__scrollHandlerBound = true;
                listEl.addEventListener('scroll', () => {
                    if (this.__isAppending) return;
                    const nearBottom = (listEl.scrollTop + listEl.clientHeight) >= (listEl.scrollHeight - 200);
                    if (nearBottom) {
                        this.appendNextBatch();
                    }
                });
            }
        } catch (_) { }
    }

    appendNextBatch(batchOverride) {
        if (this.__isAppending) return;
        // حالتان: قائمة جاهزة مسبقًا أو مسح تدريجي للقائمة الأساسية مع فلترة
        const hasPrelist = Array.isArray(this.__currentList);
        if (hasPrelist && this.__renderedCount >= this.__currentList.length) return;
        if (!hasPrelist && (!Array.isArray(this.__baseList) || this.__scanIndex >= this.__baseList.length)) return;
        this.__isAppending = true;
        try {
            const listEl = document.getElementById('sessions-list');
            if (!listEl) return;
            let chunk = '';
            if (hasPrelist) {
                const batchSize = batchOverride || this.listBatchSize;
                const end = Math.min(this.__renderedCount + batchSize, this.__currentList.length);
                for (let i = this.__renderedCount; i < end; i++) {
                    chunk += this.buildSessionCardHTML(this.__currentList[i]);
                }
                if (chunk) {
                    const html = chunk;
                    requestAnimationFrame(() => {
                        listEl.insertAdjacentHTML('beforeend', html);
                    });

                    this.__renderedCount = end;
                }
            } else {
                const batchSize = batchOverride || this.listBatchSize;
                let added = 0;
                const total = this.__baseList.length;
                // Limit per-call scanning to prevent long blocking when matches are sparse
                const scanCap = Math.min(total, this.__scanIndex + Math.max(batchSize * 10, 800));
                for (; this.__scanIndex < scanCap && added < batchSize; this.__scanIndex++) {
                    const itm = this.__baseList[this.__scanIndex];
                    if (this.__filterFn(itm)) {
                        chunk += this.buildSessionCardHTML(itm);
                        added++;
                    }
                }
                if (chunk) {
                    const html = chunk;
                    requestAnimationFrame(() => {
                        listEl.insertAdjacentHTML('beforeend', html);
                    });
                    this.__renderedCount += added;
                }
                // If we didn't fill the batch and there is more to scan, continue asynchronously
                if (added < batchSize && this.__scanIndex < total) {
                    setTimeout(() => this.appendNextBatch(batchSize - added), 0);
                } else if (this.__scanIndex >= total && this.__renderedCount === 0 && !chunk) {
                    // لا توجد نتائج للفلتر الحالي: اعرض رسالة فارغة بدون إلغاء الفلترة
                    try {
                        const totalEl = document.getElementById('sessions-total');
                        if (totalEl) totalEl.textContent = '0';
                    } catch (_) { }
                    try {
                        listEl.innerHTML = `
                            <div class="text-center py-10">
                                <i class="ri-calendar-line text-5xl text-gray-300 mb-3"></i>
                                <p class="text-gray-500 text-base">${this.filteredDate ? 'لا توجد جلسات في هذا التاريخ' : 'لا توجد جلسات'}</p>
                            </div>
                        `;
                    } catch (_) { }
                }
            }
        } finally {
            this.__isAppending = false;
        }
    }

    computeFilteredCountAsync(baseList, filterFn) {
        try {
            const totalEl = document.getElementById('sessions-total');
            if (!Array.isArray(baseList) || !totalEl) return;
            let i = 0, count = 0;
            const step = 2000;
            const loop = () => {
                const end = Math.min(i + step, baseList.length);
                for (; i < end; i++) { if (filterFn(baseList[i])) count++; }
                if (i < baseList.length) {
                    setTimeout(loop, 0);
                } else {
                    totalEl.textContent = String(count);
                }
            };
            setTimeout(loop, 0);
        } catch (_) { }
    }



    async viewCaseData(sessionId) {
        try {

            const sessionData = await getById('sessions', sessionId);
            if (!sessionData || !sessionData.caseId) {
                showToast('لم يتم العثور على بيانات القضية', 'error');
                return;
            }


            const caseData = await getById('cases', sessionData.caseId);
            if (!caseData || !caseData.clientId) {
                showToast('لم يتم العثور على بيانات القضية أو الموكل', 'error');
                return;
            }


            const clientData = await getById('clients', caseData.clientId);
            if (!clientData) {
                showToast('لم يتم العثور على بيانات الموكل', 'error');
                return;
            }


            navigateTo(displayClientViewForm, caseData.clientId);

        } catch (error) {
            console.error('Error viewing case data:', error);
            showToast('حدث خطأ في عرض بيانات القضية', 'error');
        }
    }

    editSession(sessionId, sessionData) {

        this.saveState();
        try {
            window.location.href = `session-edit.html?sessionId=${sessionId}`;
        } catch (e) { }
    }

    async deleteSession(sessionId) {
        const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه الجلسة؟') : confirm('هل أنت متأكد من حذف هذه الجلسة؟');
        if (!ok) return;
        try {
            await deleteRecord('sessions', sessionId);
            await this.loadAllSessions();
            this.render();
            showToast('تم حذف الجلسة بنجاح', 'success');
        } catch (error) {
            showToast('حدث خطأ أثناء حذف الجلسة', 'error');
        }
    }
}


let globalSessionsCalendar = null;


async function displaySessionsCalendar() {
    if (!globalSessionsCalendar) {
        globalSessionsCalendar = new SessionsCalendar();
    }
    await globalSessionsCalendar.init();
}


document.addEventListener('sessionSaved', async () => {

    const modalTitle = document.getElementById('modal-title');
    if (modalTitle && modalTitle.textContent === 'إدارة الجلسات' && globalSessionsCalendar) {
        await globalSessionsCalendar.loadAllSessions();
        globalSessionsCalendar.updateContent();
    }
});