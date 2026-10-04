/**
 * تقارير الجلسات (Sessions Agenda Report)
 * قسم مخصص لأجندة ورول الجلسات بتصميم متناسق 100% مع باقي أقسام التقارير
 * يدعم الفلترة الزمنية، البحث الذكي، الأعمدة الديناميكية، والتصدير والطباعة
 */

let __reportsSessionsAgendaDateLocaleCache = null;
async function __getReportsSessionsAgendaDateLocaleSetting() {
    if (__reportsSessionsAgendaDateLocaleCache) return __reportsSessionsAgendaDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsSessionsAgendaDateLocaleCache = locale;
    return locale;
}

function __parseReportsSessionsAgendaDateString(dateStr) {
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

function __formatReportsSessionsAgendaDateForDisplay(dateStr) {
    try {
        const d = __parseReportsSessionsAgendaDateString(dateStr);
        if (!d) return (dateStr || 'غير محدد');
        return d.toLocaleDateString(__reportsSessionsAgendaDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || 'غير محدد');
    }
}

let __reportsSessionsAgendaAllSessions = [];
let __reportsSessionsAgendaCurrentSessions = [];
let __reportsSessionsAgendaVisibleColumnKeysCache = null;
const __reportsSessionsAgendaColumnsStorageKey = 'reportsSessionsAgendaVisibleColumns';

// الأعمدة الافتراضية الـ 5 المعتمدة بالترتيب المنطقي المتفق عليه
const __reportsSessionsAgendaDefaultVisibleColumns = [
    'clientName',   // 1. اسم الموكل
    'caseNumber',   // 2. رقم القضية
    'sessionDate',  // 3. تاريخ الجلسة
    'roll',         // 4. الرول
    'decision'      // 5. القرار
];

let __reportsSessionsAgendaTimeFilterMode = 'all'; // all | today | tomorrow | week | month
let __reportsSessionsAgendaSearchTerm = '';
let currentSessionsAgendaSortOrder = 'desc';

// تعريفات جميع الأعمدة المتاحة
const __reportsSessionsAgendaColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden font-bold text-blue-900', minWidth: '165px' },
    { key: 'caseNumber', group: 'cases', label: 'رقم القضية', icon: 'ri-hashtag', cellClass: 'whitespace-normal break-words overflow-hidden font-bold', minWidth: '135px' },
    { key: 'sessionDate', group: 'sessions', label: 'تاريخ الجلسة', icon: 'ri-calendar-line', cellClass: 'whitespace-nowrap overflow-hidden font-bold text-orange-700', minWidth: '115px' },
    { key: 'roll', group: 'sessions', label: 'الرول', icon: 'ri-list-check', cellClass: 'whitespace-nowrap overflow-hidden font-bold', minWidth: '80px' },
    { key: 'decision', group: 'sessions', label: 'القرار', icon: 'ri-gavel-line', cellClass: 'break-words', minWidth: '185px' },
    { key: 'requests', group: 'sessions', label: 'الطلبات', icon: 'ri-question-answer-line', cellClass: 'break-words', minWidth: '165px' },
    { key: 'court', group: 'cases', label: 'المحكمة', icon: 'ri-building-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'circuitNumber', group: 'cases', label: 'رقم الدائرة', icon: 'ri-layout-grid-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '95px' },
    { key: 'opponentName', group: 'opponents', label: 'اسم الخصم', icon: 'ri-user-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '155px' },
    { key: 'inventoryNumber', group: 'sessions', label: 'رقم الحصر', icon: 'ri-file-list-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'inventoryYear', group: 'sessions', label: 'سنة الحصر', icon: 'ri-calendar-2-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '90px' },
    { key: 'caseType', group: 'cases', label: 'نوع القضية', icon: 'ri-file-list-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '115px' },
    { key: 'subject', group: 'cases', label: 'موضوع القضية', icon: 'ri-article-line', cellClass: 'whitespace-normal break-words', minWidth: '165px' },
    { key: 'fileNumber', group: 'cases', label: 'رقم الملف', icon: 'ri-folder-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '90px' },
    { key: 'poaNumber', group: 'cases', label: 'رقم التوكيل', icon: 'ri-file-paper-2-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'clientCapacity', group: 'clients', label: 'صفة الموكل', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'clientAddress', group: 'clients', label: 'عنوان الموكل', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words', minWidth: '155px' },
    { key: 'opponentPhone', group: 'opponents', label: 'هاتف الخصم', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'opponentCapacity', group: 'opponents', label: 'صفة الخصم', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'opponentAddress', group: 'opponents', label: 'عنوان الخصم', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words', minWidth: '155px' },
    { key: 'appealLabel', group: 'cases', label: 'الاستئناف', icon: 'ri-file-copy-2-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'cassationLabel', group: 'cases', label: 'النقض', icon: 'ri-file-copy-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'caseStatus', group: 'cases', label: 'حالة القضية', icon: 'ri-scales-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' }
];

function __escapeReportsSessionsAgendaHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function __normalizeReportsSessionsAgendaCellValue(value, fallback = 'غير محدد') {
    const text = String(value == null ? '' : value).trim();
    return text !== '' ? text : fallback;
}

function __formatReportsSessionsAgendaNumberYear(numberValue, yearValue) {
    const n = String(numberValue == null ? '' : numberValue).trim();
    const y = String(yearValue == null ? '' : yearValue).trim();
    if (n && y) return `${n} لسنة ${y}`;
    return n || y || 'غير محدد';
}

function __getReportsSessionsAgendaVisibleColumnKeys() {
    if (Array.isArray(__reportsSessionsAgendaVisibleColumnKeysCache) && __reportsSessionsAgendaVisibleColumnKeysCache.length) {
        return [...__reportsSessionsAgendaVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsSessionsAgendaColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed) && parsed.length) {
            const validKeys = __reportsSessionsAgendaColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                __reportsSessionsAgendaVisibleColumnKeysCache = filtered;
                return [...__reportsSessionsAgendaVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsSessionsAgendaVisibleColumnKeysCache = [...__reportsSessionsAgendaDefaultVisibleColumns];
    return [...__reportsSessionsAgendaVisibleColumnKeysCache];
}

function __setReportsSessionsAgendaVisibleColumnKeys(keys) {
    const validKeys = __reportsSessionsAgendaColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsSessionsAgendaVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsSessionsAgendaDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsSessionsAgendaColumnsStorageKey, JSON.stringify(__reportsSessionsAgendaVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsSessionsAgendaVisibleColumns() {
    const visibleKeys = __getReportsSessionsAgendaVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsSessionsAgendaColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

// تخزين علاقات البيانات في الذاكرة لتسريع الأداء ومنع استدعاءات قاعدة البيانات المتكررة
let __reportsSessionsAgendaRelationsCache = null;

async function __getReportsSessionsAgendaRelationsData() {
    if (__reportsSessionsAgendaRelationsCache) return __reportsSessionsAgendaRelationsCache;
    try {
        const [cases, clients, opponents] = await Promise.all([
            typeof getAllCasesCached === 'function' ? getAllCasesCached() : (typeof getAllCases === 'function' ? getAllCases() : []),
            typeof getAllClientsCached === 'function' ? getAllClientsCached() : (typeof getAllClients === 'function' ? getAllClients() : []),
            typeof getAllOpponentsCached === 'function' ? getAllOpponentsCached() : (typeof getAllOpponents === 'function' ? getAllOpponents() : [])
        ]);

        const caseMap = new Map();
        (Array.isArray(cases) ? cases : []).forEach(c => { if (c && c.id != null) caseMap.set(String(c.id), c); });

        const clientMap = new Map();
        (Array.isArray(clients) ? clients : []).forEach(cl => { if (cl && cl.id != null) clientMap.set(String(cl.id), cl); });

        const opponentMap = new Map();
        (Array.isArray(opponents) ? opponents : []).forEach(op => { if (op && op.id != null) opponentMap.set(String(op.id), op); });

        __reportsSessionsAgendaRelationsCache = { caseMap, clientMap, opponentMap };
        return __reportsSessionsAgendaRelationsCache;
    } catch (e) {
        console.error('Error loading sessions relations:', e);
        return { caseMap: new Map(), clientMap: new Map(), opponentMap: new Map() };
    }
}

function __getReportsSessionsAgendaRowData(session, relations) {
    const { caseMap, clientMap, opponentMap } = relations || { caseMap: new Map(), clientMap: new Map(), opponentMap: new Map() };
    const caseIdKey = String(session && session.caseId != null ? session.caseId : '');
    const caseObj = caseMap.get(caseIdKey) || null;

    const clientIdKey = caseObj && caseObj.clientId != null ? String(caseObj.clientId) : '';
    const clientObj = clientMap.get(clientIdKey) || null;

    const opponentIdKey = caseObj && caseObj.opponentId != null ? String(caseObj.opponentId) : '';
    const opponentObj = opponentMap.get(opponentIdKey) || null;

    const clientNameVal = (clientObj && clientObj.name) || (caseObj && caseObj.clientName) || (session && session.clientName) || '';
    const caseNumberVal = session && session.caseNumber != null ? session.caseNumber : (caseObj ? caseObj.caseNumber : '');
    const caseYearVal = session && session.caseYear != null ? session.caseYear : (caseObj ? caseObj.caseYear : '');
    const sessionDateVal = session && session.sessionDate ? __formatReportsSessionsAgendaDateForDisplay(session.sessionDate) : '';

    const appealNumberVal = caseObj ? caseObj.appealNumber : '';
    const appealYearVal = caseObj ? caseObj.appealYear : '';
    const cassationNumberVal = caseObj ? caseObj.cassationNumber : '';
    const cassationYearVal = caseObj ? caseObj.cassationYear : '';

    return {
        clientName: __normalizeReportsSessionsAgendaCellValue(clientNameVal),
        caseNumber: __formatReportsSessionsAgendaNumberYear(caseNumberVal, caseYearVal),
        sessionDate: __normalizeReportsSessionsAgendaCellValue(sessionDateVal),
        roll: __normalizeReportsSessionsAgendaCellValue(session && session.roll),
        decision: __normalizeReportsSessionsAgendaCellValue(session && session.decision),
        requests: __normalizeReportsSessionsAgendaCellValue(session && session.requests),
        court: __normalizeReportsSessionsAgendaCellValue((session && session.court) || (caseObj && caseObj.court)),
        circuitNumber: __normalizeReportsSessionsAgendaCellValue((session && session.circuitNumber) || (caseObj && caseObj.circuitNumber)),
        opponentName: __normalizeReportsSessionsAgendaCellValue((opponentObj && opponentObj.name) || (caseObj && caseObj.opponentName) || (session && session.opponentName)),
        inventoryNumber: __normalizeReportsSessionsAgendaCellValue(session && session.inventoryNumber),
        inventoryYear: __normalizeReportsSessionsAgendaCellValue(session && session.inventoryYear),
        caseType: __normalizeReportsSessionsAgendaCellValue((session && session.caseType) || (caseObj && caseObj.caseType)),
        subject: __normalizeReportsSessionsAgendaCellValue(caseObj && caseObj.subject),
        fileNumber: __normalizeReportsSessionsAgendaCellValue(session && session.fileNumber != null ? session.fileNumber : (caseObj ? caseObj.fileNumber : '')),
        poaNumber: __normalizeReportsSessionsAgendaCellValue(caseObj && caseObj.poaNumber),
        clientPhone: __normalizeReportsSessionsAgendaCellValue(clientObj && clientObj.phone),
        clientCapacity: __normalizeReportsSessionsAgendaCellValue((caseObj && caseObj.clientCapacity) || (clientObj && clientObj.capacity)),
        clientAddress: __normalizeReportsSessionsAgendaCellValue(clientObj && clientObj.address),
        opponentPhone: __normalizeReportsSessionsAgendaCellValue(opponentObj && opponentObj.phone),
        opponentCapacity: __normalizeReportsSessionsAgendaCellValue((caseObj && caseObj.opponentCapacity) || (opponentObj && opponentObj.capacity)),
        opponentAddress: __normalizeReportsSessionsAgendaCellValue(opponentObj && opponentObj.address),
        appealLabel: __formatReportsSessionsAgendaNumberYear(appealNumberVal, appealYearVal),
        cassationLabel: __formatReportsSessionsAgendaNumberYear(cassationNumberVal, cassationYearVal),
        caseStatus: __normalizeReportsSessionsAgendaCellValue(caseObj && caseObj.caseStatus)
    };
}

function __sortReportsSessionsAgendaSessions(sessions, sortOrder = 'desc') {
    const list = Array.isArray(sessions) ? [...sessions] : [];
    return list.sort((a, b) => {
        const da = __parseReportsSessionsAgendaDateString(a && a.sessionDate);
        const db = __parseReportsSessionsAgendaDateString(b && b.sessionDate);
        const ta = da ? da.getTime() : 0;
        const tb = db ? db.getTime() : 0;
        return sortOrder === 'asc' ? (ta - tb) : (tb - ta);
    });
}

function __filterReportsSessionsAgendaByTime(sessions, mode) {
    if (!mode || mode === 'all') return sessions;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // في المحاكم المصرية يبدأ الأسبوع القضائي يوم السبت (Saturday = 6) وينتهي الجمعة
    const getSaturdayOfWeek = (refDate) => {
        const d = new Date(refDate);
        const day = d.getDay();
        const diff = (day === 6) ? 0 : (day + 1);
        d.setDate(d.getDate() - diff);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    const satCurrent = getSaturdayOfWeek(today);
    const friCurrent = new Date(satCurrent);
    friCurrent.setDate(friCurrent.getDate() + 6);

    const satNext = new Date(satCurrent);
    satNext.setDate(satNext.getDate() + 7);
    const friNext = new Date(satNext);
    friNext.setDate(friNext.getDate() + 6);

    const satLast = new Date(satCurrent);
    satLast.setDate(satLast.getDate() - 7);
    const friLast = new Date(satLast);
    friLast.setDate(friLast.getDate() + 6);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return (sessions || []).filter(s => {
        const d = __parseReportsSessionsAgendaDateString(s && s.sessionDate);
        if (!d) return false;
        const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const targetTime = target.getTime();

        if (mode === 'today') {
            return targetTime === today.getTime();
        }
        if (mode === 'tomorrow') {
            return targetTime === tomorrow.getTime();
        }
        if (mode === 'yesterday') {
            return targetTime === yesterday.getTime();
        }
        if (mode === 'current-week' || mode === 'week') {
            return target >= satCurrent && target <= friCurrent;
        }
        if (mode === 'next-week') {
            return target >= satNext && target <= friNext;
        }
        if (mode === 'last-week') {
            return target >= satLast && target <= friLast;
        }
        if (mode === 'month') {
            return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
        }
        if (mode === 'next-month') {
            const nextMonthYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
            const nextMonth = (today.getMonth() + 1) % 12;
            return target.getFullYear() === nextMonthYear && target.getMonth() === nextMonth;
        }
        return true;
    });
}

function __reportsSessionsAgendaNormalizeSearchValue(value) {
    const s = typeof window !== 'undefined' && window.normalizeDigits ? window.normalizeDigits(value) : String(value || '');
    return s
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ')
        .trim();
}

function __filterReportsSessionsAgendaBySearch(sessions, searchTerm, relations) {
    const termClean = __reportsSessionsAgendaNormalizeSearchValue(searchTerm);
    if (!termClean) return sessions;

    return (sessions || []).filter(s => {
        const row = __getReportsSessionsAgendaRowData(s, relations);
        return Object.values(row).some(v => __reportsSessionsAgendaNormalizeSearchValue(v).includes(termClean));
    });
}

function __getReportsSessionsAgendaSessionsForAction() {
    const relations = __reportsSessionsAgendaRelationsCache || { caseMap: new Map(), clientMap: new Map(), opponentMap: new Map() };
    let filtered = __filterReportsSessionsAgendaByTime(__reportsSessionsAgendaAllSessions, __reportsSessionsAgendaTimeFilterMode);
    filtered = __filterReportsSessionsAgendaBySearch(filtered, __reportsSessionsAgendaSearchTerm, relations);
    return __sortReportsSessionsAgendaSessions(filtered, currentSessionsAgendaSortOrder);
}

// -------------------------------------------------------------
// واجهة المستخدم وبناء عناصر الـ DOM للتقرير
// -------------------------------------------------------------
async function updateSessionsAgendaReportContent(reportName = 'تقارير الجلسات', reportType = 'sessions-agenda') {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    try {
        await __getReportsSessionsAgendaDateLocaleSetting();
        const relations = await __getReportsSessionsAgendaRelationsData();

        const rawSessions = typeof getAllSessionsCached === 'function'
            ? await getAllSessionsCached()
            : (typeof getAllSessions === 'function' ? await getAllSessions() : []);

        __reportsSessionsAgendaAllSessions = Array.isArray(rawSessions) ? rawSessions : [];
        __reportsSessionsAgendaCurrentSessions = __reportsSessionsAgendaAllSessions;

        const colors = { bg: '#f97316', bgHover: '#ea580c', bgLight: '#fff7ed', text: '#ea580c', textLight: '#fdba74' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- شريط الأدوات العلوي المتطابق مع باقي الأقسام -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث السريع -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="sessions-agenda-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث برقم القضية، الموكل، الخصم، الرول، القرار..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>

                    <!-- أزرار الفلترة والتصدير والطباعة -->
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <!-- قائمة الفلترة الزمنية والفرز -->
                        <div class="relative">
                            <button id="sessions-agenda-view-menu-btn" onclick="toggleSessionsAgendaViewMenu()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-sessions-agenda-view-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="sessions-agenda-view-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 250px; width: 260px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">فلترة الجلسات</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 6px;">
                                    <button type="button" data-time-mode="all" onclick="setSessionsAgendaTimeFilterMode('all')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; grid-column: span 2; background-color: #ffffff;">كل الجلسات</button>
                                    <button type="button" data-time-mode="today" onclick="setSessionsAgendaTimeFilterMode('today')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">اليوم</button>
                                    <button type="button" data-time-mode="tomorrow" onclick="setSessionsAgendaTimeFilterMode('tomorrow')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الغد</button>
                                    <button type="button" data-time-mode="current-week" onclick="setSessionsAgendaTimeFilterMode('current-week')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأسبوع الحالي</button>
                                    <button type="button" data-time-mode="next-week" onclick="setSessionsAgendaTimeFilterMode('next-week')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأسبوع القادم</button>
                                    <button type="button" data-time-mode="month" onclick="setSessionsAgendaTimeFilterMode('month')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الشهر الحالي</button>
                                    <button type="button" data-time-mode="next-month" onclick="setSessionsAgendaTimeFilterMode('next-month')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الشهر القادم</button>
                                </div>
                                <div style="border-top: 1px solid #cbd5e1; margin: 6px 0;"></div>
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">ترتيب الجلسات</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-sort-mode="desc" onclick="setSessionsAgendaSortOrder('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأحدث</button>
                                    <button type="button" data-sort-mode="asc" onclick="setSessionsAgendaSortOrder('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأقدم</button>
                                </div>
                            </div>
                        </div>

                        <!-- قائمة التصدير -->
                        <div class="relative">
                            <button onclick="toggleExportMenuSessionsAgenda()" id="export-btn-sessions-agenda" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-sessions-agenda" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportSessionsAgendaReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportSessionsAgendaReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportSessionsAgendaReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>

                        <!-- زر الطباعة المباشرة -->
                        <button onclick="printSessionsAgendaReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>

                <!-- حاوية الجدول الرئيسي -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="sessions-agenda-report-content">
                    <div class="flex items-center justify-center py-12 text-gray-400">
                        <i class="ri-loader-4-line animate-spin text-3xl ml-2"></i>
                        <span>جاري إعداد تقرير الجلسات...</span>
                    </div>
                </div>
            </div>
        `;

        __reportsSessionsAgendaTimeFilterMode = 'all';
        __reportsSessionsAgendaSearchTerm = '';
        currentSessionsAgendaSortOrder = 'desc';
        __reportsSessionsAgendaUpdateViewMenuButtonLabel();
        __renderReportsSessionsAgendaCurrentTable();

        const searchEl = document.getElementById('sessions-agenda-search');
        if (searchEl) {
            let debounceTimer;
            searchEl.addEventListener('input', function (e) {
                clearTimeout(debounceTimer);
                const val = e.target.value;
                debounceTimer = setTimeout(() => {
                    __reportsSessionsAgendaSearchTerm = val;
                    __renderReportsSessionsAgendaCurrentTable();
                }, 150);
            });
        }

    } catch (error) {
        console.error('Error loading sessions agenda report:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل تقرير الجلسات</p>
                    </div>
                </div>
            </div>
        `;
    }
}

let __reportsSessionsAgendaChunkTimer = null;

function generateSessionsAgendaReportHTML(sessions, sortOrder = 'desc') {
    if (__reportsSessionsAgendaChunkTimer) {
        cancelAnimationFrame(__reportsSessionsAgendaChunkTimer);
        __reportsSessionsAgendaChunkTimer = null;
    }
    try {
        document.querySelectorAll('body > [id^="reports-sessions-agenda-column-menu-"]').forEach(m => m.remove());
    } catch (_) { }
    if (!sessions || sessions.length === 0) {
        return `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-calendar-event-line text-8xl text-orange-200"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد جلسات</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على أي جلسات مطابقة للفترة أو البحث المحدد</p>
            </div>
        `;
    }

    const relations = __reportsSessionsAgendaRelationsCache || { caseMap: new Map(), clientMap: new Map(), opponentMap: new Map() };
    const visibleColumns = __getReportsSessionsAgendaVisibleColumns();
    const totalTableMinWidth = visibleColumns.reduce((sum, col) => sum + (parseInt(col.minWidth || '120', 10)), 0);

    const buildRowHtml = (session, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-orange-50 to-amber-50' : 'bg-white';
        const rowData = __getReportsSessionsAgendaRowData(session, relations);
        const cellsHtml = visibleColumns.map(col => {
            const value = __escapeReportsSessionsAgendaHtml(rowData[col.key]);
            return `
                <td class="py-2 px-3 md:py-3 md:px-5 text-center border-l border-gray-200 align-top" style="min-width: ${col.minWidth || '120px'};">
                    <div class="text-sm md:text-base text-gray-800 hover:text-orange-700 transition-colors duration-200 ${col.cellClass}" title="${value}">${value}</div>
                </td>
            `;
        }).join('');
        return `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-orange-100 hover:to-amber-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = sessions.slice(0, initialBatchSize).map((s, i) => buildRowHtml(s, i)).join('');

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; min-width: ${col.minWidth || '120px'}; background-color: #ea580c !important; color: white !important; border-color: #f97316 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #f97316;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsSessionsAgendaColumnMenu(event, '${col.key}')" class="reports-sessions-agenda-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsSessionsAgendaColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    if (sessions.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('sessions-agenda-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, sessions.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(sessions[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < sessions.length) {
                __reportsSessionsAgendaChunkTimer = requestAnimationFrame(appendNextChunk);
            } else {
                __reportsSessionsAgendaChunkTimer = null;
            }
        };
        __reportsSessionsAgendaChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    return `
        <div class="sessions-agenda-report-container flex-1 min-h-0 flex flex-col" style="height: 100%; position: relative;">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; min-width: ${Math.max(totalTableMinWidth, 600)}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #ea580c !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="sessions-agenda-table-body">
                        ${initialRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function __renderReportsSessionsAgendaCurrentTable() {
    const container = document.getElementById('sessions-agenda-report-content');
    if (!container) return;
    const sessions = __getReportsSessionsAgendaSessionsForAction();
    container.innerHTML = generateSessionsAgendaReportHTML(sessions, currentSessionsAgendaSortOrder);
}

// -------------------------------------------------------------
// إدارة القوائم المنبثقة للأعمدة والفلترة
// -------------------------------------------------------------
function __buildReportsSessionsAgendaColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsSessionsAgendaVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsSessionsAgendaColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsSessionsAgendaColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];

    const items = sameGroupColumns.length ? sameGroupColumns.map(col => `
        <button type="button" onclick="toggleReportsSessionsAgendaColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-orange-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;

    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;

    return `
        <div id="reports-sessions-agenda-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-orange-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-orange-50 border-b border-orange-100 text-right shrink-0">
                    <div class="text-xs font-bold text-orange-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsSessionsAgendaColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-orange-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-60">${items}</div>
            <div class="border-t border-orange-100 shrink-0"></div>
            <button type="button" onclick="resetReportsSessionsAgendaColumns(event)" class="w-full flex items-center gap-2 px-3 py-2 text-right text-blue-700 hover:bg-blue-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">استعادة الأعمدة الـ 5 الافتراضية</span>
            </button>
        </div>
    `;
}

function __positionReportsSessionsAgendaColumnMenu(menu, anchorEl) {
    try {
        if (!menu || !anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return;
        const rect = anchorEl.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;

        menu.style.position = 'fixed';
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
        menu.style.marginTop = '0px';
        menu.style.zIndex = '999999';

        const menuW = Math.max(220, Math.round(menu.offsetWidth || 0) || 0);

        let left = Math.round(rect.right - menuW);
        let top = Math.round(rect.bottom + 6);

        const pad = 8;
        if (left < pad) left = pad;
        if (left + menuW > vw - pad) left = Math.max(pad, vw - pad - menuW);

        if (top < pad) top = pad;
        const availableHeight = Math.max(140, Math.floor(vh - top - pad));
        menu.style.maxHeight = availableHeight + 'px';

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    } catch (_) { }
}

function toggleReportsSessionsAgendaColumnMenu(event, key) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-sessions-agenda-column-menu-${key}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsSessionsAgendaColumnMenus();
    if (!shouldOpen) return;

    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsSessionsAgendaColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function closeReportsSessionsAgendaColumnMenus() {
    document.querySelectorAll('[id^="reports-sessions-agenda-column-menu-"]').forEach(m => {
        try { m.classList.add('hidden'); } catch (_) { }
    });
}

// إغلاق القائمة تلقائياً عند النقر في أي مكان خارجها
if (!window.__reportsSessionsAgendaGlobalMenuClickBound) {
    window.__reportsSessionsAgendaGlobalMenuClickBound = true;
    document.addEventListener('click', function (e) {
        if (!e.target.closest('[id^="reports-sessions-agenda-column-menu-"]') && !e.target.closest('.reports-sessions-agenda-column-toggle-btn')) {
            closeReportsSessionsAgendaColumnMenus();
        }
    });
}

function hideReportsSessionsAgendaColumn(event, key) {
    if (event) event.stopPropagation();
    const current = __getReportsSessionsAgendaVisibleColumnKeys();
    if (current.length <= 1) {
        if (typeof showToast === 'function') showToast('يجب الإبقاء على عمود واحد على الأقل', 'warning');
        return;
    }
    const updated = current.filter(k => k !== key);
    __setReportsSessionsAgendaVisibleColumnKeys(updated);
    closeReportsSessionsAgendaColumnMenus();
    __renderReportsSessionsAgendaCurrentTable();
}

function toggleReportsSessionsAgendaColumnVisibility(event, key, anchorKey) {
    if (event) event.stopPropagation();
    const current = __getReportsSessionsAgendaVisibleColumnKeys();
    const idx = current.indexOf(key);
    if (idx !== -1) {
        if (current.length <= 1) return;
        current.splice(idx, 1);
    } else {
        const anchorIdx = anchorKey ? current.indexOf(anchorKey) : -1;
        if (anchorIdx !== -1) {
            current.splice(anchorIdx + 1, 0, key);
        } else {
            current.push(key);
        }
    }
    __setReportsSessionsAgendaVisibleColumnKeys(current);
    closeReportsSessionsAgendaColumnMenus();
    __renderReportsSessionsAgendaCurrentTable();
}

function resetReportsSessionsAgendaColumns(event) {
    if (event) event.stopPropagation();
    __setReportsSessionsAgendaVisibleColumnKeys(__reportsSessionsAgendaDefaultVisibleColumns);
    closeReportsSessionsAgendaColumnMenus();
    __renderReportsSessionsAgendaCurrentTable();
    if (typeof showToast === 'function') showToast('تمت استعادة الأعمدة الافتراضية بنجاح', 'success');
}

// -------------------------------------------------------------
// الفلترة والترتيب والقائمة المنسدلة
// -------------------------------------------------------------
function __reportsSessionsAgendaUpdateActiveTiles() {
    try {
        const timeButtons = document.querySelectorAll('#sessions-agenda-view-menu [data-time-mode]');
        timeButtons.forEach(btn => {
            const mode = btn.getAttribute('data-time-mode');
            if (mode === __reportsSessionsAgendaTimeFilterMode) {
                btn.style.backgroundColor = '#dbeafe';
                btn.style.borderColor = '#3b82f6';
                btn.style.color = '#1d4ed8';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.backgroundColor = '#ffffff';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#334155';
                btn.style.fontWeight = 'normal';
            }
        });

        const sortButtons = document.querySelectorAll('#sessions-agenda-view-menu [data-sort-mode]');
        sortButtons.forEach(btn => {
            const mode = btn.getAttribute('data-sort-mode');
            if (mode === currentSessionsAgendaSortOrder) {
                btn.style.backgroundColor = '#dbeafe';
                btn.style.borderColor = '#3b82f6';
                btn.style.color = '#1d4ed8';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.backgroundColor = '#ffffff';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#334155';
                btn.style.fontWeight = 'normal';
            }
        });
    } catch (_) { }
}

function toggleSessionsAgendaViewMenu() {
    const menu = document.getElementById('sessions-agenda-view-menu');
    if (!menu) return;
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
        __reportsSessionsAgendaUpdateActiveTiles();
        menu.classList.remove('hidden');
    } else {
        menu.classList.add('hidden');
    }
}

function closeSessionsAgendaViewMenu() {
    const menu = document.getElementById('sessions-agenda-view-menu');
    if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
    }
}

function setSessionsAgendaTimeFilterMode(mode) {
    __reportsSessionsAgendaTimeFilterMode = mode || 'all';
    __reportsSessionsAgendaUpdateViewMenuButtonLabel();
    __reportsSessionsAgendaUpdateActiveTiles();
    closeSessionsAgendaViewMenu();
    __renderReportsSessionsAgendaCurrentTable();
}

function setSessionsAgendaSortOrder(order) {
    currentSessionsAgendaSortOrder = order || 'desc';
    __reportsSessionsAgendaUpdateViewMenuButtonLabel();
    __reportsSessionsAgendaUpdateActiveTiles();
    closeSessionsAgendaViewMenu();
    __renderReportsSessionsAgendaCurrentTable();
}

function __reportsSessionsAgendaGetActiveFilterTitle() {
    const modeTitles = {
        'today': 'جلسات اليوم',
        'tomorrow': 'جلسات الغد',
        'yesterday': 'جلسات البارحة',
        'current-week': 'جلسات الأسبوع الحالي',
        'next-week': 'جلسات الأسبوع القادم',
        'last-week': 'جلسات الأسبوع السابق',
        'month': 'جلسات الشهر الحالي',
        'next-month': 'جلسات الشهر القادم',
        'all': 'كل الجلسات'
    };
    return modeTitles[__reportsSessionsAgendaTimeFilterMode] || 'تقرير أجندة الجلسات';
}

function __reportsSessionsAgendaUpdateViewMenuButtonLabel() {
    const labelEl = document.querySelector('[data-sessions-agenda-view-label]');
    if (!labelEl) return;
    labelEl.textContent = 'فرز';
}

async function toggleExportMenuSessionsAgenda() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-sessions-agenda');
        if (menu) menu.classList.toggle('hidden');
    };

    try {
        if (localStorage.getItem('desktop_path_warning_suppressed') === '1') {
            openMenu();
            return;
        }
    } catch (_) { }

    try {
        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning({}, { onContinue: () => { try { openMenu(); } catch (_) { } } });
                    }
                } catch (_) { }
                return;
            }
        }
    } catch (_) { }

    openMenu();
}

function closeExportMenuSessionsAgenda() {
    const menu = document.getElementById('export-menu-sessions-agenda');
    if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
    }
}

// إغلاق القوائم المنبثقة عند النقر في أي مكان خارجها
document.addEventListener('click', function (e) {
    if (!e.target.closest('#sessions-agenda-view-menu') && !e.target.closest('#sessions-agenda-view-menu-btn')) {
        closeSessionsAgendaViewMenu();
    }
    if (!e.target.closest('#export-menu-sessions-agenda') && !e.target.closest('#export-btn-sessions-agenda')) {
        closeExportMenuSessionsAgenda();
    }
    const clickedInsideColumnMenu = e.target && typeof e.target.closest === 'function' ? e.target.closest('[id^="reports-sessions-agenda-column-menu-"]') : null;
    const clickedColumnToggle = e.target && typeof e.target.closest === 'function' ? e.target.closest('.reports-sessions-agenda-column-toggle-btn') : null;
    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsSessionsAgendaColumnMenus();
    }
});

window.addEventListener('resize', closeReportsSessionsAgendaColumnMenus);

// -------------------------------------------------------------
// منظومة الطباعة والتصدير (Print, Excel, PDF, WhatsApp)
// -------------------------------------------------------------
async function printSessionsAgendaReport() {
    try {
        closeExportMenuSessionsAgenda();
        const sessions = __getReportsSessionsAgendaSessionsForAction();
        if (!sessions || sessions.length === 0) {
            if (typeof showToast === 'function') showToast('لا توجد جلسات للطباعة', 'error');
            return;
        }

        await __getReportsSessionsAgendaDateLocaleSetting();
        const relations = __reportsSessionsAgendaRelationsCache || await __getReportsSessionsAgendaRelationsData();
        const visibleColumns = __getReportsSessionsAgendaVisibleColumns();
        const officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        const currentDate = new Date().toLocaleDateString(__reportsSessionsAgendaDateLocaleCache || 'ar-EG');
        const currentTime = new Date().toLocaleTimeString(__reportsSessionsAgendaDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });

        const tableHeaders = visibleColumns.map(col => `
            <th style="background-color: #ea580c; color: white; padding: 6px 4px; text-align: center; border: 1px solid #c2410c; font-size: 12px; font-weight: bold;">
                ${col.label}
            </th>
        `).join('');

        const tableRows = sessions.map((session, i) => {
            const rowBg = i % 2 === 0 ? '#fff7ed' : '#ffffff';
            const rowData = __getReportsSessionsAgendaRowData(session, relations);
            const cells = visibleColumns.map(col => `
                <td style="border: 1px solid #cbd5e1; padding: 5px 4px; text-align: center; font-size: 11px; word-break: break-word;">
                    ${rowData[col.key] || '-'}
                </td>
            `).join('');
            return `<tr style="background: ${rowBg}; page-break-inside: avoid;">${cells}</tr>`;
        }).join('');

        const filterTitle = __reportsSessionsAgendaGetActiveFilterTitle();
        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 12px;">
                    <div style="color: #ea580c; font-size: 14px; font-weight: bold; text-align: right;">${filterTitle} (${sessions.length})</div>
                    <div style="color: #666; font-size: 12px; text-align: center;">${currentDate} | ${currentTime}</div>
                    <div style="color: #666; font-size: 12px; text-align: left;">${officeName}</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <thead><tr>${tableHeaders}</tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            if (typeof showToast === 'function') showToast('يرجى السماح بالنوافذ المنبثقة للطباعة', 'error');
            return;
        }
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير الجلسات - ${currentDate}</title>
                <style>
                    @page { size: A4 landscape; margin: 8mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 0; padding: 0; }
                    thead { display: table-header-group; }
                    tr { page-break-inside: avoid; }
                </style>
            </head>
            <body>${printHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 400);

    } catch (e) {
        console.error('Error printing sessions agenda:', e);
        if (typeof showToast === 'function') showToast('حدث خطأ أثناء الطباعة', 'error');
    }
}

async function exportSessionsAgendaReportExcel() {
    try {
        closeExportMenuSessionsAgenda();
        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning({ path: chk.path, desktop: chk.desktop }, { onContinue: null });
                    }
                } catch (_) { }
                return;
            }
        }

        const sessions = __getReportsSessionsAgendaSessionsForAction();
        if (!sessions || sessions.length === 0) {
            if (typeof showToast === 'function') showToast('لا توجد جلسات للتصدير', 'error');
            return;
        }

        await __getReportsSessionsAgendaDateLocaleSetting();
        const relations = __reportsSessionsAgendaRelationsCache || await __getReportsSessionsAgendaRelationsData();
        const visibleColumns = __getReportsSessionsAgendaVisibleColumns();
        const officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        const currentDate = new Date().toLocaleDateString(__reportsSessionsAgendaDateLocaleCache || 'ar-EG');

        let excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <meta name="ProgId" content="Excel.Sheet">
                <meta name="Generator" content="Microsoft Excel 15">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>تقرير الجلسات</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                    <x:Print>
                                        <x:ValidPrinterInfo/>
                                        <x:PaperSizeIndex>9</x:PaperSizeIndex>
                                    </x:Print>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    table { border-collapse: collapse; width: 100%; direction: rtl; }
                    th, td { border: 1px solid #c2410c; padding: 6px; text-align: center; font-size: 12px; }
                    th { background-color: #ea580c; color: white; font-weight: bold; }
                    tr:nth-child(even) { background-color: #fff7ed; }
                </style>
            </head>
            <body>
                <h2 style="text-align: center; color: #ea580c;">${__reportsSessionsAgendaGetActiveFilterTitle()} - ${officeName}</h2>
                <p style="text-align: center; font-size: 11px; color: #64748b;">التاريخ: ${currentDate} | إجمالي الجلسات: ${sessions.length}</p>
                <table>
                    <thead>
                        <tr>
                            ${visibleColumns.map(c => `<th>${c.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${sessions.map(s => {
                            const r = __getReportsSessionsAgendaRowData(s, relations);
                            return `<tr>${visibleColumns.map(c => `<td>${r[c.key] || ''}</td>`).join('')}</tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_الجلسات_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (typeof showToast === 'function') showToast('تم تصدير ملف Excel بنجاح', 'success');
    } catch (e) {
        console.error('Error exporting sessions agenda Excel:', e);
        if (typeof showToast === 'function') showToast('حدث خطأ أثناء تصدير Excel', 'error');
    }
}

async function exportSessionsAgendaReportPDF(forShare = false) {
    try {
        closeExportMenuSessionsAgenda();
        if (!forShare && window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning({ path: chk.path, desktop: chk.desktop }, { onContinue: null });
                    }
                } catch (_) { }
                return null;
            }
        }

        const sessions = __getReportsSessionsAgendaSessionsForAction();
        if (!sessions || sessions.length === 0) {
            if (typeof showToast === 'function') showToast('لا توجد جلسات للتصدير', 'error');
            return null;
        }

        if (typeof showReportsLoadingOverlay === 'function') {
            showReportsLoadingOverlay('جاري إنشاء ملف PDF لتقرير الجلسات...');
        }
        await new Promise(r => setTimeout(r, 60));

        await __getReportsSessionsAgendaDateLocaleSetting();
        const relations = __reportsSessionsAgendaRelationsCache || await __getReportsSessionsAgendaRelationsData();
        const visibleColumns = __getReportsSessionsAgendaVisibleColumns();
        const officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        const currentDate = new Date().toLocaleDateString(__reportsSessionsAgendaDateLocaleCache || 'ar-EG');
        const currentTime = new Date().toLocaleTimeString(__reportsSessionsAgendaDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });

        const ROWS_PER_PAGE = 18;
        const pages = [];
        for (let i = 0; i < sessions.length; i += ROWS_PER_PAGE) {
            pages.push(sessions.slice(i, i + ROWS_PER_PAGE));
        }

        const totalPages = pages.length;

        const pageElements = pages.map((pageRows, pageIdx) => {
            const div = document.createElement('div');
            div.style.direction = 'rtl';
            div.style.boxSizing = 'border-box';
            div.style.padding = '4px 6px';
            div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

            const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

            const tableHeadersHtml = visibleColumns.map(col => `
                <th style="background-color: #ea580c; color: white; padding: 4px 3px; text-align: center; border: 1px solid #c2410c; font-size: 8.5px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">
                    ${col.label}
                </th>
            `).join('');

            const rowsHtml = pageRows.map((s, idx) => {
                const r = __getReportsSessionsAgendaRowData(s, relations);
                const rowBg = idx % 2 === 0 ? '#fff7ed' : '#ffffff';
                const cells = visibleColumns.map(col => `
                    <td style="border: 1px solid #cbd5e1; padding: 3.5px 3px; text-align: center; font-size: 8px; line-height: 1.2; word-break: break-word; box-sizing: border-box;">
                        ${r[col.key] || '-'}
                    </td>
                `).join('');
                return `<tr style="background: ${rowBg};">${cells}</tr>`;
            }).join('');

            div.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 6px;">
                    <div style="color: #ea580c; font-size: 11px; font-weight: bold; text-align: right;">
                        ${__reportsSessionsAgendaGetActiveFilterTitle()} (${sessions.length}) ${pageNumberLabel}
                    </div>
                    <div style="color: #666; font-size: 8px; text-align: center;">${currentDate} | ${currentTime}</div>
                    <div style="color: #666; font-size: 8px; text-align: left;">${officeName}</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px; direction: rtl; table-layout: auto; box-sizing: border-box;">
                    <thead><tr>${tableHeadersHtml}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
            return div;
        });

        const opt = {
            margin: [6, 4, 6, 4],
            filename: `تقرير_الجلسات_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const firstWorker = html2pdf().set(opt).from(pageElements[0]);
        await firstWorker.toPdf();
        const pdf = await firstWorker.get('pdf');
        const pageSize = await firstWorker.get('pageSize');

        for (let i = 1; i < pageElements.length; i++) {
            const pageCanvas = await html2pdf().set(opt).from(pageElements[i]).toCanvas().get('canvas');
            pdf.addPage();
            const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pageSize.inner.width;
            const imgHeight = pageCanvas.height * imgWidth / pageCanvas.width;
            pdf.addImage(imgData, 'JPEG', opt.margin[1], opt.margin[0], imgWidth, imgHeight);
        }

        if (forShare) {
            const blob = pdf.output('blob');
            return { blob, filename: opt.filename };
        }

        pdf.save(opt.filename);
        if (typeof showToast === 'function') showToast('تم تصدير ملف PDF بنجاح', 'success');
        return null;

    } catch (e) {
        console.error('Error exporting sessions agenda PDF:', e);
        if (typeof showToast === 'function') showToast('حدث خطأ أثناء تصدير PDF', 'error');
        return null;
    } finally {
        if (typeof hideReportsLoadingOverlay === 'function') {
            hideReportsLoadingOverlay();
        }
    }
}

async function exportSessionsAgendaReportWhatsApp() {
    try {
        if (typeof showToast === 'function') showToast('جاري تجهيز تقرير الجلسات للمشاركة...', 'info');
        const res = await exportSessionsAgendaReportPDF(true);
        if (res && res.blob && typeof shareReportPdfAsFile === 'function') {
            await shareReportPdfAsFile(res.blob, res.filename);
        }
    } catch (e) {
        console.error('Error sharing sessions agenda via WhatsApp:', e);
        if (typeof showToast === 'function') showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}
