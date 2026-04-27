
if (!document.getElementById('administrative-custom-css')) {
    const style = document.createElement('style');
    style.id = 'administrative-custom-css';
    style.textContent = `
        /* تخصيص محاذاة تاريخ الإنجاز */
        #due-date {
            text-align: right !important;
            direction: rtl;
        }
        
        /* تحسين عرض التاريخ في المتصفحات المختلفة */
        #due-date::-webkit-calendar-picker-indicator {
            margin-left: 0;
            margin-right: auto;
        }
        
        #due-date::-webkit-inner-spin-button,
        #due-date::-webkit-outer-spin-button {
            margin-left: 0;
            margin-right: auto;
        }
        #administrative-list .work-card span,
        #administrative-list .work-card i {
            line-height: 1.1 !important;
        }

        /* توحيد ارتفاع الملصقات والخانات في نافذة التعديل */
        #administrative-form .flex.items-stretch label {
            min-height: 100%;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            line-height: 1.2 !important;
            font-size: 15px !important; /* خط أوضح في الكمبيوتر */
            font-weight: 800 !important; /* سمك أكبر */
        }
        
        @media (max-width: 640px) {
            #administrative-form .flex.items-stretch label {
                font-size: 13px !important; /* خط أوضح في الموبايل */
                padding-left: 2px !important;
                padding-right: 2px !important;
                font-weight: 900 !important; /* أقصى سمك */
            }
            #administrative-form input {
                font-size: 14px !important;
            }
        }
    `;
    document.head.appendChild(style);
}


class AdministrativeManager {
    constructor() {
        this.currentDate = new Date();
        this.administrative = [];
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
        this.__sortedDesc = null;
        this.__sortedAsc = null;
        this.__currentList = null;
        this.__filterFn = null;
        this.__baseList = null;
        this.__scanIndex = 0;
        this.__renderedCount = 0;
        this.__nextStatsAt = 0;
    }

    async init() {
        try {
            try {
                if (typeof getSetting === 'function') {
                    const v = await getSetting('dateLocale');
                    if (v === 'ar-EG' || v === 'en-GB') this.dateLocale = v;
                }
            } catch (_) { }
            await this.loadAllAdministrative();
            this.restoreState();

            // فلترة من الرابط (مطلوب لإشعارات الغد)
            try {
                const params = (typeof URLSearchParams !== 'undefined') ? new URLSearchParams(window.location.search || '') : null;
                const filter = params ? String(params.get('filter') || '').trim().toLowerCase() : '';
                const directDate = params ? String(params.get('date') || '').trim() : '';

                const toYmd = (d) => {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                };

                let targetYmd = '';
                if (/^\d{4}-\d{2}-\d{2}$/.test(directDate)) {
                    targetYmd = directDate;
                } else if (filter === 'today' || filter === 'tomorrow') {
                    const now = this.getNow();
                    const d = new Date(now);
                    if (filter === 'tomorrow') d.setDate(d.getDate() + 1);
                    targetYmd = toYmd(d);
                }

                if (targetYmd) {
                    this.filteredDate = targetYmd;
                    this.filterType = null;
                    this.selectedDate = targetYmd;
                    this.viewMode = 'list';
                }
            } catch (_) { }

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
            showToast('حدث خطأ في تحميل الأعمال الإدارية', 'error');
        }
    }

    parseDueDateString(dateStr) {
        try {
            const s = String(dateStr || '').trim();
            if (!s) return null;
            // yyyy-mm-dd
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                const d = new Date(s);
                return Number.isFinite(d.getTime()) ? d : null;
            }
            // dd/mm/yyyy
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

    formatDueDateForDisplay(dateStr) {
        try {
            const d = this.parseDueDateString(dateStr);
            if (!d) return (dateStr || 'غير محدد');
            return d.toLocaleDateString(this.dateLocale || 'ar-EG');
        } catch (_) {
            return (dateStr || 'غير محدد');
        }
    }


    saveState() {
        this.savedState = {
            viewMode: this.viewMode,
            sortOrder: this.sortOrder,
            filteredDate: this.filteredDate,
            filterType: this.filterType,
            selectedDate: this.selectedDate
        };


        localStorage.setItem('administrativeState', JSON.stringify(this.savedState));
    }


    restoreState() {
        try {
            const savedStateStr = localStorage.getItem('administrativeState');
            if (savedStateStr) {
                const savedState = JSON.parse(savedStateStr);
                this.viewMode = savedState.viewMode || this.getDefaultViewMode();
                this.sortOrder = savedState.sortOrder || 'desc';
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
        localStorage.removeItem('administrativeState');
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

    async loadAllAdministrative() {
        try {
            this.administrative = await getAllAdministrative();
            try {
                const parseTs = (s) => {
                    if (!s || typeof s !== 'string') return null;
                    const t = s.trim();
                    // Fast path: YYYY-MM-DD
                    const m1 = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                    if (m1) {
                        const y = parseInt(m1[1], 10), mo = parseInt(m1[2], 10), d = parseInt(m1[3], 10);
                        const dt = new Date(y, mo - 1, d);
                        if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) return dt.getTime();
                        return null;
                    }
                    // Support DD/MM/YYYY or D/M/YY
                    const m2 = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
                    if (m2) {
                        let d = parseInt(m2[1], 10), mo = parseInt(m2[2], 10), y = parseInt(m2[3], 10);
                        if (m2[3].length === 2) y = y < 50 ? 2000 + y : 1900 + y;
                        const dt = new Date(y, mo - 1, d);
                        if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) return dt.getTime();
                        return null;
                    }
                    // Fallback to Date.parse for any other formats
                    const ms = Date.parse(t);
                    return isNaN(ms) ? null : ms;
                };
                for (const w of this.administrative) {
                    if (w && typeof w === 'object') {
                        w.__ts = parseTs(w.dueDate);
                        const c = w.completed;
                        w.__completed = (c === true || c === 1 || c === '1' || c === 'true');
                    }
                }
                const byDateDesc = [...this.administrative].sort((a, b) => {
                    const ta = (typeof a.__ts === 'number') ? a.__ts : -Infinity;
                    const tb = (typeof b.__ts === 'number') ? b.__ts : -Infinity;
                    return tb - ta;
                });
                this.__sortedDesc = byDateDesc;
                this.__sortedAsc = [...byDateDesc].reverse();
            } catch (_) { }
        } catch (error) {
            this.administrative = [];
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
            modalContainer.style.height = '100vh';
        }
        if (modalContent) {
            modalContent.style.padding = '0';
            modalContent.style.margin = '0';
            modalContent.style.width = '100%';
        }

        modalTitle.textContent = 'إدارة الأعمال الإدارية';

        const bodyEl = document.body;
        if (bodyEl) bodyEl.classList.remove('hide-sidebar-toggle');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) sidebarToggle.checked = false;

        modalContent.classList.remove('search-modal-content', 'p-6', 'h-full', 'overflow-y-auto');
        modalContent.classList.remove('px-4');
        modalContent.classList.add('px-0');


        const backBtn = document.getElementById('back-to-main');
        const pageTitle = document.getElementById('page-title');
        if (backBtn && pageTitle) {
            backBtn.innerHTML = `
                <i class="ri-home-5-line text-white text-lg"></i>
                <span class="text-white">الرئيسيه</span>
            `;
            pageTitle.textContent = 'إدارة الأعمال الإدارية';


            const newBackBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBackBtn, backBtn);

            newBackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                window.location.href = 'index.html';
            });
        }


        modalContainer.classList.remove('max-w-5xl', 'max-w-7xl', 'mx-4');
        modalContainer.classList.add('w-full');
        modalContent.classList.remove('search-modal-content');

        modalContent.innerHTML = `
            <div class="administrative-manager-container search-layout" id="administrative-root">
                <!-- Main Layout: Right Sidebar + Content -->
                <div class="flex gap-0">
                    <!-- Right Sidebar -->
                    <div class="w-80 lg:w-72 xl:w-72 2xl:w-80 flex-shrink-0 space-y-3 search-left-pane search-left-pane-dark">
                        <!-- View Toggle Buttons -->
                        <div class="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="ri-eye-line text-indigo-500"></i>
                                طرق العرض
                            </h3>
                            <div class="flex gap-2 bg-gray-100 rounded-lg p-1 w-full">
                                <button id="calendar-view-btn" class="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'calendar' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}">
                                    <i class="ri-calendar-line ml-1"></i>
                                    تقويم
                                </button>
                                <button id="list-view-btn" class="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'list' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}">
                                    <i class="ri-list-check ml-1"></i>
                                    قائمة
                                </button>
                            </div>
                        </div>

                        <!-- Date Search Box -->
                        <div class="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="ri-search-line text-indigo-500"></i>
                                البحث بالتاريخ
                            </h3>
                            <div class="flex gap-2">
                                <input type="text" id="date-search" 
                                    class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                                    value="${this.filteredDate || ''}" placeholder="12/9/2026">
                                <button type="button" id="date-search-btn" class="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center" title="بحث">
                                    <i class="ri-search-line text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Add New Work Button -->
                        <div class="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                            <button id="add-new-work-btn" class="w-full px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
                                <i class="ri-add-line text-base"></i>
                                إضافة عمل جديد
                            </button>
                        </div>

                        <!-- Statistics -->
                        <div class="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <i class="ri-bar-chart-line text-indigo-500"></i>
                                الإحصائيات
                            </h3>
                            <!-- Statistics Grid 2x2 -->
                            <div class="grid grid-cols-2 gap-2">
                                <!-- Today's Works -->
                                <div id="today-stats-btn" class="bg-gradient-to-br from-pink-50 to-red-100 rounded-lg p-3 border-2 border-red-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-red-400 hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200">
                                    <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-calendar-2-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-red-600 mb-1" id="stats-today">0</div>
                                    <div class="text-xs font-medium text-red-800">أعمال اليوم</div>
                                </div>

                                <!-- Tomorrow's Works -->
                                <div id="tomorrow-stats-btn" class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-blue-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-calendar-2-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-blue-600 mb-1" id="stats-tomorrow">0</div>
                                    <div class="text-xs font-medium text-blue-800">أعمال الغد</div>
                                </div>

                                <!-- Completed Works -->
                                <div id="completed-stats-btn" class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border-2 border-green-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-green-400 hover:bg-gradient-to-br hover:from-green-100 hover:to-green-200">
                                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-check-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-green-600 mb-1" id="stats-completed">0</div>
                                    <div class="text-xs font-medium text-green-800">منجز</div>
                                </div>

                                <!-- Pending Works -->
                                <div id="pending-stats-btn" class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border-2 border-purple-200 text-center shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-100 hover:to-purple-200">
                                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <i class="ri-time-line text-white text-sm"></i>
                                    </div>
                                    <div class="text-lg font-bold text-purple-600 mb-1" id="stats-pending">0</div>
                                    <div class="text-xs font-medium text-purple-800">متبقي</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div class="flex-1">
                        <div id="calendar-content" class="min-h-[calc(100vh-140px)]">
                            ${this.viewMode === 'calendar' ? this.renderCalendar() : this.renderWorksList()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            const leftPane = document.querySelector('.administrative-manager-container .search-left-pane');
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
                    const applySidebarHeight = () => {
                        try {
                            const lp = document.querySelector('.administrative-manager-container .search-left-pane');
                            if (!lp) return;
                            const rect = lp.getBoundingClientRect();
                            const vh = (window.innerHeight || 0);
                            const available = Math.max(0, vh - rect.top - 8);
                            if (available > 0) {
                                lp.style.height = available + 'px';
                                lp.style.maxHeight = available + 'px';
                                lp.style.minHeight = '0px';
                                lp.style.overflowY = 'auto';
                                lp.style.overscrollBehavior = 'contain';
                            }
                        } catch (_) { }
                    };
                    this.__applyAdministrativeSidebarHeight = applySidebarHeight;
                    applySidebarHeight();
                    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(applySidebarHeight);
                    setTimeout(applySidebarHeight, 50);

                    if (!this.__administrativeSidebarResizeBound) {
                        this.__administrativeSidebarResizeBound = true;
                        window.addEventListener('resize', () => {
                            try { this.__applyAdministrativeSidebarHeight && this.__applyAdministrativeSidebarHeight(); } catch (_) { }
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
                    const dateInput = document.getElementById('date-search');
                    if (dateInput) {
                        try { dateInput.style.background = 'rgba(255,255,255,.08)'; } catch (_) { }
                        try { dateInput.style.borderColor = 'rgba(148, 163, 184, .28)'; } catch (_) { }
                        try { dateInput.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
                    }
                } catch (_) { }

                try {
                    const toggleIds = ['calendar-view-btn', 'list-view-btn'];
                    toggleIds.forEach((id) => {
                        const b = document.getElementById(id);
                        if (!b) return;
                        try {
                            b.style.setProperty('transition', 'background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease, outline-color .15s ease', 'important');
                            b.style.setProperty('outline-offset', '2px', 'important');
                            b.style.setProperty('font-weight', '700', 'important');

                            // Check if active based on ID and current viewMode
                            const isActive = (id === 'calendar-view-btn' && this.viewMode === 'calendar') ||
                                (id === 'list-view-btn' && this.viewMode === 'list');

                            if (isActive) {
                                b.style.setProperty('background', '#1e3a8a', 'important');
                                b.style.setProperty('color', '#ffffff', 'important');
                                b.style.setProperty('border', '1px solid rgba(255,255,255,0.2)', 'important');
                            } else {
                                b.style.setProperty('background', 'rgba(255,255,255,.06)', 'important');
                                b.style.setProperty('color', 'rgba(255,255,255,.92)', 'important');
                                b.style.setProperty('border', '1px solid rgba(148, 163, 184, .20)', 'important');
                            }
                        } catch (_) { }
                    });
                } catch (_) { }

                try {
                    const sortBtn = document.getElementById('sort-btn');
                    if (sortBtn) {
                        try {
                            sortBtn.style.setProperty('background', '#1e3a8a', 'important');
                            sortBtn.style.setProperty('color', '#ffffff', 'important');
                            sortBtn.style.setProperty('border', '1px solid rgba(255,255,255,0.10)', 'important');
                            sortBtn.style.setProperty('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease', 'important');
                        } catch (_) { }
                        try {
                            const icon = sortBtn.querySelector('i');
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
                    const addBtn = document.getElementById('add-new-work-btn');
                    if (addBtn) {
                        try { addBtn.style.setProperty('background', '#1e3a8a', 'important'); } catch (_) { }
                        try { addBtn.style.setProperty('border', '1px solid rgba(255,255,255,0.10)', 'important'); } catch (_) { }
                        try { addBtn.style.setProperty('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease', 'important'); } catch (_) { }
                    }
                } catch (_) { }

                try {
                    const statIds = ['today-stats-btn', 'tomorrow-stats-btn', 'completed-stats-btn', 'pending-stats-btn'];
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
            if (!document.getElementById('administrative-sidebar-hover-style')) {
                const st = document.createElement('style');
                st.id = 'administrative-sidebar-hover-style';
                st.textContent = `
                    .low-power .administrative-manager-container .search-left-pane #sort-btn,
                    .low-power .administrative-manager-container .search-left-pane #date-search-btn,
                    .low-power .administrative-manager-container .search-left-pane #add-new-work-btn,
                    .low-power .administrative-manager-container .search-left-pane #calendar-view-btn,
                    .low-power .administrative-manager-container .search-left-pane #list-view-btn,
                    .low-power .administrative-manager-container .search-left-pane #today-stats-btn,
                    .low-power .administrative-manager-container .search-left-pane #tomorrow-stats-btn,
                    .low-power .administrative-manager-container .search-left-pane #completed-stats-btn,
                    .low-power .administrative-manager-container .search-left-pane #pending-stats-btn {
                        transition: background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease !important;
                    }

                    .administrative-manager-container #sort-btn:hover,
                    .administrative-manager-container #date-search-btn:hover,
                    .administrative-manager-container #add-new-work-btn:hover,
                    .administrative-manager-container #calendar-view-btn:hover,
                    .administrative-manager-container #list-view-btn:hover {
                        border-color: rgba(245, 158, 11, .90) !important;
                        outline: 2px solid rgba(245, 158, 11, .65) !important;
                        outline-offset: 2px !important;
                        transform: translateY(-1px) scale(1.02) !important;
                        box-shadow: 0 16px 26px rgba(245, 158, 11, .14), 0 12px 18px rgba(15, 23, 42, .20) !important;
                    }

                    .administrative-manager-container .search-left-pane #today-stats-btn:hover,
                    .administrative-manager-container .search-left-pane #tomorrow-stats-btn:hover,
                    .administrative-manager-container .search-left-pane #completed-stats-btn:hover,
                    .administrative-manager-container .search-left-pane #pending-stats-btn:hover {
                        background: linear-gradient(135deg, rgba(245, 158, 11, .22), rgba(15, 23, 42, .92)) !important;
                        border-color: rgba(245, 158, 11, .85) !important;
                        transform: translateY(-2px) scale(1.03) !important;
                        box-shadow: 0 14px 26px rgba(245, 158, 11, .16), 0 10px 18px rgba(15, 23, 42, .20) !important;
                    }

                    .administrative-manager-container .search-left-pane #today-stats-btn:hover .w-8.h-8,
                    .administrative-manager-container .search-left-pane #tomorrow-stats-btn:hover .w-8.h-8,
                    .administrative-manager-container .search-left-pane #completed-stats-btn:hover .w-8.h-8,
                    .administrative-manager-container .search-left-pane #pending-stats-btn:hover .w-8.h-8 {
                        background: #f59e0b !important;
                        box-shadow: 0 10px 16px rgba(245,158,11,.22) !important;
                    }

                    .administrative-manager-container #date-search::placeholder {
                        color: rgba(226,232,240,.78) !important;
                    }
                `;
                (document.head || document.documentElement).appendChild(st);
            }
        } catch (_) { }

        this.scheduleUpdateStatistics?.();
        const detailsPanel = document.getElementById('work-details');
        if (detailsPanel) { detailsPanel.remove(); }
        this.attachEventListeners();

        try {
            if (this.viewMode === 'calendar') {
                this.setupAdministrativeCalendarScrollBox?.();
            }
        } catch (_) { }


        if (this.viewMode === 'list') {
            setTimeout(() => {
                this.setupAdministrativeListScrollBox?.();
                this.initIncrementalList?.();
            }, 10);
        }
    }

    scheduleUpdateStatistics() {
        const now = Date.now();
        if (!this.__nextStatsAt || now >= this.__nextStatsAt) {
            this.__nextStatsAt = now + 500;
            setTimeout(() => {
                this.updateStatistics();
            }, 0);
        }
    }

    updateStatistics() {
        const today = this.getNow();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).getTime();
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
        const dTomorrow = new Date(today);
        dTomorrow.setDate(today.getDate() + 1);
        const startOfTomorrow = new Date(dTomorrow.getFullYear(), dTomorrow.getMonth(), dTomorrow.getDate(), 0, 0, 0, 0).getTime();
        const endOfTomorrow = new Date(dTomorrow.getFullYear(), dTomorrow.getMonth(), dTomorrow.getDate(), 23, 59, 59, 999).getTime();

        let todayWorks = 0;
        let tomorrowWorks = 0;
        let completedWorks = 0;
        const items = Array.isArray(this.administrative) ? this.administrative : [];
        for (let i = 0; i < items.length; i++) {
            const w = items[i];
            const ts = (w && typeof w.__ts === 'number') ? w.__ts : (w && w.dueDate ? Date.parse(w.dueDate) : NaN);
            if (!isNaN(ts)) {
                if (ts >= startOfToday && ts <= endOfToday) todayWorks++;
                if (ts >= startOfTomorrow && ts <= endOfTomorrow) tomorrowWorks++;
            }
            if (w && w.__completed === true) completedWorks++;
        }
        const pendingWorks = items.length - completedWorks;

        const todayElement = document.getElementById('stats-today');
        const tomorrowElement = document.getElementById('stats-tomorrow');
        const completedElement = document.getElementById('stats-completed');
        const pendingElement = document.getElementById('stats-pending');

        if (todayElement) todayElement.textContent = String(todayWorks);
        if (tomorrowElement) tomorrowElement.textContent = String(tomorrowWorks);
        if (completedElement) completedElement.textContent = String(completedWorks);
        if (pendingElement) pendingElement.textContent = String(Math.max(0, pendingWorks));
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
                <div class="calendar-header bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-3 rounded-t-lg relative">
                    <button id="sync-time-btn" class="absolute left-2 top-2 w-7 h-7 rounded-full bg-green-400 hover:bg-green-500 text-white flex items-center justify-center shadow" title="مزامنة">
                        <i class="ri-refresh-line text-sm"></i>
                    </button>
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                        <div class="flex items-center gap-2">
                            <button id="prev-month" class="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors">
                                <i class="ri-arrow-right-s-line text-lg"></i>
                            </button>
                            <button id="next-month" class="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors">
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
                        <button id="picker-go" type="button" class="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold">عرض</button>
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
            const worksForDay = this.getWorksForDate(currentDateStr);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = this.selectedDate === currentDateStr;
            const dayDateObj = new Date(year, month, day);
            const isPast = dayDateObj.getTime() < todayMidnight.getTime();
            const hasWorks = worksForDay.length > 0;

            let dayClasses = 'h-20 border-l border-b border-gray-200 p-1.5 cursor-pointer transition-all duration-200 relative overflow-hidden';
            let dayContent = '';
            let dayNumberStyle = 'text-xs font-medium text-gray-800 mb-1';


            if (isPast && hasWorks) {
                dayClasses += ' bg-gray-200 border-gray-400 hover:bg-gray-300 hover:border-gray-500';
                dayNumberStyle = 'text-xs font-bold text-gray-800 mb-1';
            } else if (hasWorks) {
                dayClasses += ' bg-gradient-to-br from-green-100 to-green-200 border-green-300';
                dayNumberStyle = 'text-xs font-bold text-green-800 mb-1';
            } else if (isToday) {
                dayClasses += ' bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300';
                dayNumberStyle = 'text-xs font-bold text-indigo-800 mb-1';
            } else {
                dayClasses += ' hover:bg-indigo-50 hover:border-indigo-300';
            }


            if (worksForDay.length > 0) {
                dayContent = `
                    <div class="flex items-center justify-center h-full">
                        <div class="bg-white bg-opacity-90 rounded-lg px-2 py-1 shadow-md border">
                            <div class="text-sm font-bold text-gray-800 text-center flex items-center justify-center gap-1">
                                <i class="ri-briefcase-fill text-sm"></i>
                                <span>${worksForDay.length}</span>
                            </div>
                        </div>
                    </div>
                `;
            }


            if (isSelected) {
                if (isPast && hasWorks) {
                    dayClasses += ' ring-1 ring-gray-500 bg-gray-200';
                    dayNumberStyle = 'text-xs font-bold text-gray-800 mb-1';
                } else if (hasWorks) {
                    dayClasses += ' ring-2 ring-green-500';
                } else {
                    dayClasses += ' ring-1 ring-indigo-500 bg-gradient-to-br from-indigo-200 to-indigo-300';
                    dayNumberStyle = 'text-xs font-bold text-indigo-900 mb-1';
                }
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

    renderWorksList() {
        let baseList = this.__sortedDesc || this.administrative;
        if (this.sortOrder === 'asc') baseList = this.__sortedAsc || baseList;

        let titleText = 'المهام';
        let clearFilterButton = '';
        let filterFn = null;

        if (this.filteredDate) {
            titleText = `أعمال يوم ${this.filteredDate}`;
            clearFilterButton = `
                <button id="clear-filter-btn" class="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                    <i class="ri-close-line ml-1"></i>إلغاء الفلترة
                </button>
            `;
            const dateStr = this.filteredDate;
            // Use day boundaries for filtering to support various date formats in stored data
            const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (m) {
                const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
                const start = new Date(y, mo - 1, d, 0, 0, 0, 0).getTime();
                const end = new Date(y, mo - 1, d, 23, 59, 59, 999).getTime();
                filterFn = (w) => {
                    const ts = (w && typeof w.__ts === 'number') ? w.__ts : (w && w.dueDate ? Date.parse(w.dueDate) : NaN);
                    return !isNaN(ts) && ts >= start && ts <= end;
                };
            } else {
                // Fallback: string equality if date format unknown
                filterFn = (w) => (w && w.dueDate === dateStr);
            }
        } else if (this.filterType) {
            if (this.filterType === 'completed') {
                titleText = 'الأعمال المنجزة';
                filterFn = (w) => !!(w && w.__completed);
            } else if (this.filterType === 'pending') {
                titleText = 'الأعمال المتبقية';
                filterFn = (w) => !(w && w.__completed);
            }
            clearFilterButton = `
                <button id="clear-filter-btn" class="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                    <i class="ri-close-line ml-1"></i>إلغاء الفلترة
                </button>
            `;
        }

        this.__filterFn = filterFn;
        if (filterFn) {
            this.__baseList = baseList;
            this.__currentList = null;
            this.__scanIndex = 0;
        } else {
            this.__baseList = null;
            this.__currentList = baseList;
        }
        this.__renderedCount = 0;

        const listHTML = `
            <div class="w-full">
                <div id="administrative-list-wrapper" class="bg-indigo-50 rounded-xl border-2 border-indigo-300 shadow-sm h-full min-h-0 overflow-hidden flex flex-col">
                    <div class="administrative-list-header flex justify-between items-center p-3 border-b border-indigo-200/60 bg-indigo-50">
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg font-bold text-gray-800">${titleText} (<span id="administrative-total">${filterFn ? '...' : String(this.__currentList ? this.__currentList.length : 0)}</span>)</h3>
                            ${clearFilterButton}
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="sort-btn" class="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md">
                                <span>${this.sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
                                <i class="ri-arrow-${this.sortOrder === 'desc' ? 'down' : 'up'}-line text-gray-600"></i>
                            </button>
                        </div>
                    </div>
                    <div id="administrative-list" class="space-y-2 md:space-y-3 overscroll-contain p-2 md:p-3"></div>
                </div>
            </div>`;
        return listHTML;
    }

    getWorksForDate(dateStr) {
        // dateStr expected as YYYY-MM-DD (from calendar/search). Use timestamp range for robustness.
        if (!dateStr) return [];
        const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!m) {
            // Fallback to string equality if unknown format
            return this.administrative.filter(work => work.dueDate === dateStr);
        }
        const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
        const start = new Date(y, mo - 1, d, 0, 0, 0, 0).getTime();
        const end = new Date(y, mo - 1, d, 23, 59, 59, 999).getTime();
        return this.administrative.filter(w => {
            const ts = (w && typeof w.__ts === 'number') ? w.__ts : (w && w.dueDate ? Date.parse(w.dueDate) : NaN);
            return !isNaN(ts) && ts >= start && ts <= end;
        });
    }

    attachEventListeners() {

        const todayStatsBtn = document.getElementById('today-stats-btn');
        if (todayStatsBtn) {
            const newBtn = todayStatsBtn.cloneNode(true);
            todayStatsBtn.parentNode.replaceChild(newBtn, todayStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showTodayWorks();
            });
        }

        const tomorrowStatsBtn = document.getElementById('tomorrow-stats-btn');
        if (tomorrowStatsBtn) {
            const newBtn = tomorrowStatsBtn.cloneNode(true);
            tomorrowStatsBtn.parentNode.replaceChild(newBtn, tomorrowStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showTomorrowWorks();
            });
        }

        const completedStatsBtn = document.getElementById('completed-stats-btn');
        if (completedStatsBtn) {
            const newBtn = completedStatsBtn.cloneNode(true);
            completedStatsBtn.parentNode.replaceChild(newBtn, completedStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showCompletedWorks();
            });
        }

        const pendingStatsBtn = document.getElementById('pending-stats-btn');
        if (pendingStatsBtn) {
            const newBtn = pendingStatsBtn.cloneNode(true);
            pendingStatsBtn.parentNode.replaceChild(newBtn, pendingStatsBtn);
            newBtn.addEventListener('click', () => {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                this.showPendingWorks();
            });
        }


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


        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.saveState();
            this.updateContent();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
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
        if (dateSearch) {
            dateSearch.replaceWith(dateSearch.cloneNode(true));
            const newDateSearch = document.getElementById('date-search');
            const normalize = (s) => {
                const m = s && s.trim().match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/);
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
                if (!raw || !raw.trim()) {
                    this.clearFilter();
                    return;
                }
                const norm = normalize(raw);
                if (norm) {
                    newDateSearch.value = norm;
                    if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
                    this.searchByDate(norm, { silent: true });
                }
            };
            newDateSearch.addEventListener('change', handle);
            newDateSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handle(); } });
            newDateSearch.setAttribute('placeholder', '12/9/2026');


            if (dateSearchBtn) {
                dateSearchBtn.addEventListener('click', handle);
            }
            if (typeof attachDatePicker === 'function') attachDatePicker(newDateSearch, { format: 'DD/MM/YYYY' });
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


        document.querySelectorAll('[data-date]').forEach(dayElement => {
            dayElement.addEventListener('click', (e) => {
                const date = e.currentTarget.dataset.date;
                const dateInput = document.getElementById('date-search');
                if (dateInput) dateInput.value = date;
                this.selectDate(date);
            });
        });


        document.getElementById('add-new-work-btn')?.addEventListener('click', () => {
            this.saveState();
            navigateTo(displayAdministrativeForm);
        });


        const listEl = document.getElementById('administrative-list');
        if (listEl) {
            listEl.addEventListener('click', (e) => {
                const editBtn = e.target.closest && e.target.closest('.edit-work-btn');
                if (editBtn) {
                    const workId = parseInt(editBtn.dataset.workId, 10);
                    this.saveState();
                    navigateTo(displayAdministrativeForm, workId);
                    return;
                }
                const delBtn = e.target.closest && e.target.closest('.delete-work-btn');
                if (delBtn) {
                    const workId = parseInt(delBtn.dataset.workId, 10);
                    this.deleteWork(workId);
                    return;
                }
            });
        }
    }

    updateContent() {
        const contentContainer = document.getElementById('calendar-content');
        if (contentContainer) {
            contentContainer.innerHTML = this.viewMode === 'calendar' ? this.renderCalendar() : this.renderWorksList();
            this.attachEventListeners();
            if (this.viewMode === 'list') {
                setTimeout(() => {
                    this.setupAdministrativeListScrollBox?.();
                    this.initIncrementalList?.();
                }, 10);
            } else {
                this.setupAdministrativeCalendarScrollBox?.();
            }
        }

        try {
            const mainEl = document.querySelector('main');
            if (mainEl) {
                if (this.viewMode === 'calendar') mainEl.style.overflowY = 'hidden';
                else mainEl.style.overflowY = 'auto';
            }
        } catch (_) { }


        this.scheduleUpdateStatistics?.();


        const calendarBtn = document.getElementById('calendar-view-btn');
        const listBtn = document.getElementById('list-view-btn');

        if (calendarBtn && listBtn) {
            calendarBtn.className = `flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'calendar' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`;
            listBtn.className = `flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${this.viewMode === 'list' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`;

            const setBtnStyle = (btn, active) => {
                if (active) {
                    btn.style.setProperty('background', '#1e3a8a', 'important');
                    btn.style.setProperty('color', '#ffffff', 'important');
                    btn.style.setProperty('border', '1px solid rgba(255,255,255,0.2)', 'important');
                } else {
                    btn.style.setProperty('background', 'rgba(255,255,255,.06)', 'important');
                    btn.style.setProperty('color', 'rgba(255,255,255,.92)', 'important');
                    btn.style.setProperty('border', '1px solid rgba(148, 163, 184, .20)', 'important');
                }
            };
            setBtnStyle(calendarBtn, this.viewMode === 'calendar');
            setBtnStyle(listBtn, this.viewMode === 'list');
        }


        const detailsPanel = document.getElementById('work-details');
        if (detailsPanel) {
            detailsPanel.classList.add('hidden');
        }
    }

    setupAdministrativeCalendarScrollBox() {
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

        if (!this.__administrativeCalendarResizeBound) {
            this.__administrativeCalendarResizeBound = true;
            window.addEventListener('resize', () => {
                try { this.setupAdministrativeCalendarScrollBox(); } catch (_) { }
            });
        }
    }

    searchByDate(dateStr, options = {}) {
        const { silent = false } = options;
        const isNewSearch = this.lastToastDate !== dateStr;

        const worksForDate = this.getWorksForDate(dateStr);


        this.filteredDate = dateStr;


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

    showTodayWorks() {

        const today = this.getNow();
        const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;


        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = todayStr;
        }


        this.filterType = null;


        this.searchByDate(todayStr, { silent: true });
    }

    showTomorrowWorks() {

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

    showCompletedWorks() {

        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = '';
        }


        this.filteredDate = null;
        this.viewMode = 'list';
        this.selectedDate = null;
        this.filterType = 'completed';
        this.saveState();
        this.updateContent();
    }

    showPendingWorks() {

        const dateInput = document.getElementById('date-search');
        if (dateInput) {
            dateInput.value = '';
        }


        this.filteredDate = null;
        this.viewMode = 'list';
        this.selectedDate = null;
        this.filterType = 'pending';
        this.saveState();
        this.updateContent();
    }


    toggleSort() {
        this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';


        const sortBtn = document.getElementById('sort-btn');
        if (sortBtn) {
            const span = sortBtn.querySelector('span');
            const icon = sortBtn.querySelector('i');
            if (span) span.textContent = this.sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً';
            if (icon) icon.className = `ri-arrow-${this.sortOrder === 'desc' ? 'down' : 'up'}-line text-gray-600`;
        }


        if (this.viewMode === 'list') {
            const contentContainer = document.getElementById('calendar-content');
            if (contentContainer) {
                contentContainer.innerHTML = this.renderWorksList();
                this.attachEventListeners();
                setTimeout(() => {
                    this.setupAdministrativeListScrollBox?.();
                    this.initIncrementalList?.();
                }, 10);
            }
        }
    }

    buildWorkCardHtml(work) {
        const dueDate = this.formatDueDateForDisplay(work.dueDate);
        const task = work.task || 'غير محدد';
        const location = work.location || 'غير محدد';
        const completed = work.completed ? 'منجز' : 'متبقي';
        const completedClass = work.completed ? 'text-green-600' : 'text-red-600';
        const completedIcon = work.completed ? 'ri-check-line' : 'ri-time-line';
        return `
            <div class="work-card bg-white border border-gray-200 rounded-lg p-2 md:p-3 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200">
                <div class="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-3">
                    <div class="flex-1 w-full space-y-0.5 md:space-y-1">
                        <div class="flex flex-wrap items-center leading-tight gap-1 md:gap-1" style="order:1">
                            <i class="${completedIcon} ${work.completed ? 'text-green-600' : 'text-red-600'} text-sm md:text-base ml-1"></i>
                            <span class="text-xs md:text-sm text-gray-500 font-semibold">الحالة</span>
                            <span class="text-sm md:text-sm font-bold ${completedClass}">${completed}</span>
                        </div>
                        <div class="flex flex-wrap items-center leading-tight gap-1 md:gap-1" style="order:2">
                            <i class="ri-map-pin-line text-indigo-500 text-sm md:text-base ml-1"></i>
                            <span class="text-xs md:text-sm text-gray-500 font-semibold">مكان العمل</span>
                            <span class="text-sm md:text-sm text-gray-900 font-semibold break-words">${location}</span>
                        </div>
                        <div class="flex flex-wrap items-center leading-tight gap-1 md:gap-1" style="order:3">
                            <i class="ri-calendar-event-line text-indigo-500 text-sm md:text-base ml-1"></i>
                            <span class="text-xs md:text-sm text-gray-500 font-semibold">تاريخ الإنجاز</span>
                            <span class="text-sm md:text-sm text-gray-900 font-bold">${dueDate}</span>
                        </div>
                        <div class="flex items-start leading-tight gap-1 md:gap-1" style="order:4">
                            <i class="ri-list-check text-indigo-500 text-sm md:text-base ml-1"></i>
                            <span class="text-xs md:text-sm text-gray-500 font-semibold shrink-0">العمل المطلوب</span>
                            <span class="text-sm md:text-sm text-gray-900 font-bold flex-1 min-w-0 break-words">${task}</span>
                        </div>
                    </div>
                    <div class="flex w-full md:w-auto flex-row md:flex-col gap-1.5 order-last md:order-none mt-2 md:mt-0 justify-center md:justify-end">
                        <button class="edit-work-btn flex items-center gap-2 px-2 py-1 md:px-5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" data-work-id="${work.id}" title="تعديل العمل">
                            <i class="ri-pencil-line text-xs md:text-xl"></i>
                            <span class="text-[11px] leading-none md:hidden whitespace-nowrap">تعديل</span>
                            <span class="hidden md:inline text-sm font-bold">تعديل</span>
                        </button>
                        <button class="delete-work-btn flex items-center gap-2 px-2 py-1 md:px-5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" data-work-id="${work.id}" title="حذف العمل">
                            <i class="ri-delete-bin-line text-xs md:text-xl"></i>
                            <span class="text-[11px] leading-none md:hidden whitespace-nowrap">حذف</span>
                            <span class="hidden md:inline text-sm font-bold">حذف</span>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    initIncrementalList() {
        try {
            const list = document.getElementById('administrative-list');
            if (!list) return;
            list.innerHTML = '';
            const initial = Math.max(10, Math.min(15, this.listBatchSize / 2));
            this.appendNextBatch(initial);
            if (this.__filterFn) this.computeFilteredCountAsync();

            if (this.__boundScroll) {
                list.removeEventListener('scroll', this.__boundScroll);
            }
            this.__boundScroll = () => {
                if (list.scrollTop + list.clientHeight >= list.scrollHeight - 50) {
                    this.appendNextBatch();
                }
            };
            list.addEventListener('scroll', this.__boundScroll);
        } catch (_) { }
    }

    appendNextBatch(batchOverride) {
        try {
            const list = document.getElementById('administrative-list');
            if (!list) return;
            const batch = Math.max(10, batchOverride || this.listBatchSize);

            if (this.__filterFn) {
                const base = this.__baseList || [];
                let added = 0;
                const end = Math.min(base.length, this.__scanIndex + batch * 2);
                const frag = document.createDocumentFragment();
                for (; this.__scanIndex < end; this.__scanIndex++) {
                    const w = base[this.__scanIndex];
                    if (!w) continue;
                    if (this.__filterFn(w)) {
                        const div = document.createElement('div');
                        div.innerHTML = this.buildWorkCardHtml(w);
                        frag.appendChild(div.firstElementChild);
                        added++;
                        this.__renderedCount++;
                        if (added >= batch) break;
                    }
                }
                if (added > 0) list.appendChild(frag);
                // لو خلصنا المسح ومفيش أي نتيجة: اعرض رسالة "لا توجد مهام لهذا اليوم"
                if (added === 0 && this.__scanIndex >= base.length && this.__renderedCount === 0) {
                    try {
                        const totalEl = document.getElementById('administrative-total');
                        if (totalEl) totalEl.textContent = '0';
                    } catch (_) { }
                    try {
                        list.innerHTML = `
                            <div class="text-center py-10">
                                <i class="ri-file-list-3-line text-5xl text-gray-300 mb-3"></i>
                                <p class="text-gray-500 text-base">${this.filteredDate ? 'لا توجد مهام لهذا اليوم' : 'لا توجد مهام'}</p>
                            </div>
                        `;
                    } catch (_) { }
                }
            } else {
                const arr = this.__currentList || [];
                if (this.__renderedCount >= arr.length) return;
                const end = Math.min(arr.length, this.__renderedCount + batch);
                const frag = document.createDocumentFragment();
                for (let i = this.__renderedCount; i < end; i++) {
                    const w = arr[i];
                    const div = document.createElement('div');
                    div.innerHTML = this.buildWorkCardHtml(w);
                    frag.appendChild(div.firstElementChild);
                }
                this.__renderedCount = end;
                if (frag.childNodes.length) list.appendChild(frag);
            }
        } catch (_) { }
    }

    computeFilteredCountAsync() {
        try {
            const totalEl = document.getElementById('administrative-total');
            if (!totalEl || !this.__filterFn) return;
            const base = this.__baseList || [];
            let i = 0, cnt = 0;
            const step = () => {
                const slice = 800;
                const end = Math.min(base.length, i + slice);
                for (; i < end; i++) {
                    const w = base[i];
                    if (this.__filterFn(w)) cnt++;
                }
                if (i < base.length) {
                    setTimeout(step, 0);
                } else {
                    totalEl.textContent = String(cnt);
                }
            };
            totalEl.textContent = '...';
            setTimeout(step, 0);
        } catch (_) { }
    }

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        const worksForDate = this.getWorksForDate(dateStr);
        if (this.viewMode === 'calendar') {
            if (worksForDate.length > 0) {
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

    async deleteWork(workId) {
        const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذا العمل؟') : confirm('هل أنت متأكد من حذف هذا العمل؟');
        if (!ok) return;
        try {
            await deleteById('administrative', workId);
            await this.loadAllAdministrative();
            this.updateContent();
            await updateCountersInHeader();
            if (typeof showToast === 'function') showToast('تم حذف العمل بنجاح');
        } catch (error) {
            if (typeof showToast === 'function') showToast('حدث خطأ أثناء حذف العمل', 'error');
        }
    }

    setupAdministrativeListScrollBox() {
        try {
            const wrapper = document.getElementById('administrative-list-wrapper');
            const list = document.getElementById('administrative-list');
            const contentContainer = document.getElementById('calendar-content');
            if (!wrapper || !list) return;

            const mainEl = document.querySelector('main');
            const viewportH = window.innerHeight;
            const top = wrapper.getBoundingClientRect().top;
            const targetH = Math.max(240, viewportH - top - 12);

            wrapper.style.height = targetH + 'px';
            wrapper.style.minHeight = '0px';
            list.style.maxHeight = (targetH - 48) + 'px';
            list.style.overflowY = 'auto';

            // إصلاح overflow على الموبايل: تطبيق نفس الـ styles على contentContainer زي sessions
            if (contentContainer) {
                contentContainer.style.maxHeight = targetH + 'px';
                contentContainer.style.overflowY = 'auto';
                contentContainer.style.overscrollBehavior = 'contain';
            }

            if (mainEl) {
                mainEl.style.overflowY = 'hidden';
            }
        } catch (e) { }

        if (!this.__administrativeListResizeBound) {
            this.__administrativeListResizeBound = true;
            window.addEventListener('resize', () => this.setupAdministrativeListScrollBox());
        }
    }
}


let globalAdministrativeManager = null;


async function displayAdministrativeModal() {
    if (!globalAdministrativeManager) {
        globalAdministrativeManager = new AdministrativeManager();
    }
    await globalAdministrativeManager.init();
}


async function displayAdministrativeForm(workId = null) {
    try {
        const isEdit = workId !== null;
        let work = null;

        if (isEdit) {
            work = await getById('administrative', workId);
            if (!work) {
                showToast('لم يتم العثور على العمل', 'error');
                return;
            }
        }


        const clients = await getAllClients();
        const prefillClientName = work ? (work.clientName || (work.clientId ? (clients.find(c => c.id === work.clientId)?.name || '') : '')) : '';

        document.getElementById('modal-title').textContent = isEdit ? 'تعديل العمل الإداري' : 'إضافة عمل إداري جديد';
        const modalContent = document.getElementById('modal-content');
        const modalContainer = document.getElementById('modal-container');


        modalContainer.classList.remove('max-w-5xl', 'max-w-7xl', 'mx-4', 'w-full');
        modalContainer.classList.add('w-full', 'h-screen');
        modalContent.classList.remove('px-4', 'pb-4');
        modalContent.classList.add('p-6', 'h-full', 'overflow-y-auto');

        modalContent.innerHTML = `
            <div class="w-full h-full p-4">
                <div class="w-full h-full mx-auto">
                    <form id="administrative-form" class="space-y-4 flex flex-col min-h-full">
                        <!-- حالة العمل أعلى الشاشة -->
                        <div class="w-full flex justify-center">
                            <div class="bg-white border-2 border-gray-300 rounded-xl p-4 shadow-sm max-w-md w-full">
                                <label class="block text-base font-bold text-gray-700 mb-2 text-center">حالة العمل</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <label class="flex items-center justify-center gap-1 cursor-pointer bg-gray-50 p-3 rounded-lg border border-red-200 hover:border-red-400 hover:bg-red-50 transition-all ${!work || !work.completed ? 'ring-2 ring-red-400 bg-red-50' : ''}">
                                        <input type="radio" name="completed" value="false" class="w-4 h-4 text-red-600 focus:ring-red-500" 
                                               ${!work || !work.completed ? 'checked' : ''}>
                                        <i class="ri-time-line text-red-600"></i>
                                        <span class="text-red-600 font-bold text-sm">غير منجز</span>
                                    </label>
                                    <label class="flex items-center justify-center gap-1 cursor-pointer bg-gray-50 p-3 rounded-lg border border-green-200 hover:border-green-400 hover:bg-green-50 transition-all ${work && work.completed ? 'ring-2 ring-green-400 bg-green-50' : ''}">
                                        <input type="radio" name="completed" value="true" class="w-4 h-4 text-green-600 focus:ring-green-500" 
                                               ${work && work.completed ? 'checked' : ''}>
                                        <i class="ri-check-line text-green-600"></i>
                                        <span class="text-green-600 font-bold text-sm">منجز</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <!-- السطر الأول: العمل المطلوب ومكان العمل -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- العمل المطلوب -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="task" class="flex items-center justify-center px-3 py-3 border-2 border-indigo-300 bg-indigo-50 text-xs md:text-sm font-bold text-indigo-800 shrink-0 w-24 md:w-32 text-center rounded-r-lg">العمل المطلوب</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="task" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-indigo-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold" value="${work ? work.task || '' : ''}" placeholder="مثال: تجهيز عريضة اللائحة" required>
                                        <button type="button" id="task-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                            <i class="ri-arrow-down-s-line"></i>
                                        </button>
                                        <div id="task-dropdown" class="autocomplete-results hidden"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- مكان العمل -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="location" class="flex items-center justify-center px-3 py-3 border-2 border-gray-300 bg-gray-100 text-xs md:text-sm font-bold text-gray-700 shrink-0 w-24 md:w-32 text-center rounded-r-lg">مكان العمل</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="location" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold" value="${work ? work.location || '' : ''}" placeholder="مثال: الجهة الإدارية">
                                        <button type="button" id="location-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                            <i class="ri-arrow-down-s-line"></i>
                                        </button>
                                        <div id="location-dropdown" class="autocomplete-results hidden"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الثاني: الموكل والمكلف بالعمل -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- الموكل -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="client-name" class="flex items-center justify-center px-3 py-3 border-2 border-gray-300 bg-gray-100 text-xs md:text-sm font-bold text-gray-700 shrink-0 w-24 md:w-32 text-center rounded-r-lg">الموكل</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="client-name" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold" value="${prefillClientName}" placeholder="اسم الموكل (اختياري)">
                                        <button type="button" id="client-name-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                            <i class="ri-arrow-down-s-line"></i>
                                        </button>
                                        <div id="client-name-dropdown" class="autocomplete-results hidden"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- المكلف بالعمل -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="assigned-to" class="flex items-center justify-center px-3 py-3 border-2 border-gray-300 bg-gray-100 text-xs md:text-sm font-bold text-gray-700 shrink-0 w-24 md:w-32 text-center rounded-r-lg">المكلف بالعمل</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="assigned-to" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold" value="${work ? work.assignedTo || '' : ''}" placeholder="مثال: أحمد علي">
                                        <button type="button" id="assigned-to-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                            <i class="ri-arrow-down-s-line"></i>
                                        </button>
                                        <div id="assigned-to-dropdown" class="autocomplete-results hidden"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الثالث: تاريخ الإنجاز والملاحظات -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- تاريخ الإنجاز -->
                            <div>
                                <div class="flex items-stretch relative">
                                    <label for="due-date" class="flex items-center justify-center px-3 py-3 border-2 border-gray-300 bg-gray-100 text-xs md:text-sm font-bold text-gray-700 shrink-0 w-24 md:w-32 text-center rounded-r-lg">تاريخ الإنجاز</label>
                                    <input type="text" id="due-date" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 -mr-px font-bold" value="${work ? work.dueDate || '' : ''}" placeholder="مثال: 20/12/2025" required>
                                </div>
                            </div>
                            
                            <!-- الملاحظات -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="notes" class="flex items-center justify-center px-3 py-3 border-2 border-gray-300 bg-gray-100 text-xs md:text-sm font-bold text-gray-700 shrink-0 w-24 md:w-32 text-center rounded-r-lg">ملاحظات</label>
                                    <input type="text" id="notes" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 -mr-px font-bold" 
                                           value="${work ? work.notes || '' : ''}" placeholder="اكتب ملاحظاتك هنا...">
                                </div>
                            </div>
                        </div>
                        
                        <!-- أزرار الحفظ والإلغاء -->
                        <div class="mt-auto pt-4">
                            <div class="sticky bottom-0 left-0 right-0 z-10 bg-gray-50 border-t border-gray-200 py-3">
                                <div class="flex justify-center">
                                    <div class="bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm flex items-center gap-2">
                                        <button type="submit" class="w-auto px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-md font-semibold shadow-sm flex items-center justify-center gap-1">
                                            <i class="ri-save-line text-base"></i>
                                            ${isEdit ? 'تحديث العمل' : 'حفظ العمل'}
                                        </button>
                                        <button type="button" id="cancel-administrative-btn" class="w-auto px-4 py-2 text-sm bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-md font-semibold shadow-sm flex items-center justify-center gap-1">
                                            <i class="ri-close-line text-base"></i>
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;


        setTimeout(() => {
            const backBtn = document.getElementById('back-to-main');
            const pageTitle = document.getElementById('page-title');
            const bodyEl = document.body;
            const sidebarToggle = document.getElementById('sidebar-toggle');
            if (sidebarToggle) sidebarToggle.checked = false;
            if (bodyEl) bodyEl.classList.add('hide-sidebar-toggle');
            if (backBtn && pageTitle) {
                backBtn.innerHTML = `
                    <i class="ri-arrow-right-line text-white text-lg"></i>
                    <span class="text-white">رجوع</span>
                `;
                pageTitle.textContent = isEdit ? 'تعديل العمل الإداري' : 'إضافة عمل إداري جديد';

                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                newBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateBack();
                });
            }
        }, 100);

        try {
            const dateInput = document.getElementById('due-date');
            const applyLocaleFormattingToInput = async () => {
                try {
                    if (!dateInput) return;
                    const raw = (dateInput.value || '').trim();
                    if (!raw) return;
                    let locale = 'ar-EG';
                    try {
                        if (typeof getSetting === 'function') {
                            const v = await getSetting('dateLocale');
                            if (v === 'ar-EG' || v === 'en-GB') locale = v;
                        }
                    } catch (_) { }

                    const parseLocal = (s) => {
                        try {
                            const t = String(s || '').trim();
                            if (!t) return null;
                            if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
                                const d = new Date(t);
                                return Number.isFinite(d.getTime()) ? d : null;
                            }
                            const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                            if (m) {
                                const day = parseInt(m[1], 10);
                                const month = parseInt(m[2], 10);
                                const year = parseInt(m[3], 10);
                                const d = new Date(year, month - 1, day);
                                if (d.getFullYear() === year && d.getMonth() === (month - 1) && d.getDate() === day) return d;
                            }
                            const d = new Date(t);
                            return Number.isFinite(d.getTime()) ? d : null;
                        } catch (_) { return null; }
                    };

                    const d = parseLocal(raw);
                    if (!d) return;
                    dateInput.value = d.toLocaleDateString(locale);
                } catch (_) { }
            };
            if (dateInput) {
                setTimeout(() => { applyLocaleFormattingToInput(); }, 0);
                dateInput.addEventListener('blur', () => { applyLocaleFormattingToInput(); });
                if (typeof attachDatePicker === 'function') attachDatePicker(dateInput, { format: 'DD/MM/YYYY' });
            }
        } catch (_) { }




        document.getElementById('administrative-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveAdministrative(workId);
        });

        document.getElementById('cancel-administrative-btn').addEventListener('click', () => {
            sessionStorage.setItem('expandedAdministrativeClientId', 'general');
            navigateBack();
        });
        try {
            const input = document.getElementById('client-name');
            const dropdown = document.getElementById('client-name-dropdown');
            const toggle = document.getElementById('client-name-toggle');
            if (input && dropdown) {
                setupAutocomplete('client-name', 'client-name-dropdown', async () => await getAllClients(), () => { });
                if (toggle) {
                    toggle.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!dropdown.classList.contains('hidden')) { dropdown.classList.add('hidden'); return; }
                        const items = await getAllClients();
                        const list = (items || []).map(i => i.name).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar'));
                        dropdown.innerHTML = list.map(v => `<div class="autocomplete-item">${v}</div>`).join('');
                        dropdown.classList.remove('hidden');
                    });
                }
                dropdown.addEventListener('click', (e) => {
                    const item = e.target.closest('.autocomplete-item');
                    if (!item) return;
                    input.value = item.textContent || '';
                    dropdown.classList.add('hidden');
                });
                document.addEventListener('click', (e) => {
                    if (e.target === input || e.target === toggle || (e.target.closest && e.target.closest('#client-name-dropdown'))) return;
                    dropdown.classList.add('hidden');
                });
            }
        } catch (_) { }
        try {
            const adminList = await getAllAdministrative();
            const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
            const tasksList = uniq(adminList.map(x => x.task));
            const locsList = uniq(adminList.map(x => x.location));
            const assignedToList = uniq(adminList.map(x => x.assignedTo));
            const setupCombo = (inputId, dropdownId, toggleId, items) => {
                const input = document.getElementById(inputId);
                const dropdown = document.getElementById(dropdownId);
                const toggle = document.getElementById(toggleId);
                if (!input || !dropdown) return;
                const objects = (items || []).map(v => ({ name: String(v) }));
                setupAutocomplete(inputId, dropdownId, async () => objects, () => { });
                if (toggle) {
                    toggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!dropdown.classList.contains('hidden')) { dropdown.classList.add('hidden'); return; }
                        const list = (items || []).map(v => String(v)).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar'));
                        dropdown.innerHTML = list.map(v => `<div class="autocomplete-item">${v}</div>`).join('');
                        dropdown.classList.remove('hidden');
                    });
                }
                dropdown.addEventListener('click', (e) => {
                    const item = e.target.closest('.autocomplete-item');
                    if (!item) return;
                    input.value = item.textContent || '';
                    dropdown.classList.add('hidden');
                });
                document.addEventListener('click', (e) => {
                    if (e.target === input || e.target === toggle || (e.target.closest && e.target.closest(`#${dropdownId}`))) return;
                    dropdown.classList.add('hidden');
                });
            };
            setupCombo('task', 'task-dropdown', 'task-toggle', tasksList);
            setupCombo('location', 'location-dropdown', 'location-toggle', locsList);
            setupCombo('assigned-to', 'assigned-to-dropdown', 'assigned-to-toggle', assignedToList);
        } catch (_) { }

    } catch (error) {
        showToast('حدث خطأ في عرض النموذج', 'error');
    }
}


async function saveAdministrative(workId = null) {
    try {
        const clientName = document.getElementById('client-name').value.trim();
        const task = document.getElementById('task').value.trim();
        const dueDate = (function (s) {
            const m = s && s.trim().match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/);
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
        })(document.getElementById('due-date').value);
        const location = document.getElementById('location').value.trim();
        const assignedTo = document.getElementById('assigned-to').value.trim();
        const completed = document.querySelector('input[name="completed"]:checked').value === 'true';
        const notes = document.getElementById('notes').value.trim();

        if (!task || !dueDate) {
            showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const workData = {
            clientId: null,
            clientName: clientName || null,
            task,
            dueDate,
            location: location || null,
            assignedTo: assignedTo || null,
            completed,
            notes: notes || null,
            createdAt: workId ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (workId) {
            await updateById('administrative', workId, workData);
            showToast('تم تحديث العمل بنجاح', 'success');

            sessionStorage.setItem('expandedAdministrativeClientId', 'general');
        } else {
            await addToStore('administrative', workData);
            showToast('تم حفظ العمل الإداري بنجاح', 'success');
        }

        navigateBack();

    } catch (error) {
        showToast('حدث خطأ في حفظ العمل', 'error');
    }
}


async function getAllAdministrative() {
    return await getAll('administrative');
}


document.addEventListener('administrativeSaved', async () => {
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle && modalTitle.textContent === 'إدارة الأعمال الإدارية' && globalAdministrativeManager) {
        await globalAdministrativeManager.loadAllAdministrative();
        globalAdministrativeManager.updateContent();
    }
});
// Auto-open admin work from notification
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const aId = sessionStorage.getItem('temp_open_admin_id');
        if (aId) {
            sessionStorage.removeItem('temp_open_admin_id');
            if (typeof initDB === 'function') await initDB();

            setTimeout(async () => {
                try {
                    const wid = parseInt(aId, 10);
                    const work = await getById('administrative', wid);
                    if (work) {
                        if (typeof displayAdministrativeForm === 'function') {
                            displayAdministrativeForm(wid);
                        } else if (typeof editAdministrativeWork === 'function') {
                            editAdministrativeWork(wid);
                        } else if (typeof globalAdministrativeManager !== 'undefined') {
                            globalAdministrativeManager.viewMode = 'calendar';
                            globalAdministrativeManager.selectedDate = work.dueDate;
                            globalAdministrativeManager.currentDate = new Date(work.dueDate);
                            globalAdministrativeManager.updateContent();
                            setTimeout(() => {
                                const dayEl = document.querySelector(`div[data-date="${work.dueDate}"]`);
                                if (dayEl) dayEl.click();
                            }, 500);
                        }
                    }
                } catch (e) { console.error(e); }
            }, 800);
        }
    } catch (e) { console.error(e); }
});
