let __reportsArchiveDateLocaleCache = null;
async function __getReportsArchiveDateLocaleSetting() {
    if (__reportsArchiveDateLocaleCache) return __reportsArchiveDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsArchiveDateLocaleCache = locale;
    return locale;
}

function __parseReportsArchiveDateString(dateStr) {
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

function __formatReportsArchiveDateForDisplay(dateStr, fallback = 'غير محدد') {
    try {
        if (!dateStr) return fallback;
        const d = __parseReportsArchiveDateString(dateStr);
        if (!d) return (dateStr || fallback);
        return d.toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || fallback);
    }
}

function __escapeReportsArchiveHtml(val) {
    if (val == null) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function __formatReportsArchiveCaseNumberYear(numberValue, yearValue) {
    const numberText = String(numberValue == null ? '' : numberValue).trim();
    const yearText = String(yearValue == null ? '' : yearValue).trim();
    if (numberText && yearText) return `${numberText} لسنة ${yearText}`;
    return numberText || yearText || 'غير محدد';
}

// -------------------------------------------------------------
// تعريفات الأعمدة المرنة ونظام الإظهار والإخفاء (Dynamic Columns)
// -------------------------------------------------------------
const __reportsArchiveColumnsStorageKey = 'reportsArchiveVisibleColumns';
const __reportsArchiveDefaultVisibleColumns = ['clientName', 'opponentName', 'caseNumber', 'caseType'];

const __reportsArchiveColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'clientCapacity', group: 'clients', label: 'صفة الموكل', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'clientAddress', group: 'clients', label: 'عنوان الموكل', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words' },
    { key: 'opponentName', group: 'opponents', label: 'اسم الخصم', icon: 'ri-user-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'opponentPhone', group: 'opponents', label: 'هاتف الخصم', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'opponentCapacity', group: 'opponents', label: 'صفة الخصم', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'opponentAddress', group: 'opponents', label: 'عنوان الخصم', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words' },
    { key: 'caseNumber', group: 'cases', label: 'رقم القضية لسنة', icon: 'ri-hashtag', cellClass: 'whitespace-normal break-words overflow-hidden font-bold' },
    { key: 'caseType', group: 'cases', label: 'نوع القضية', icon: 'ri-file-list-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'court', group: 'cases', label: 'المحكمة', icon: 'ri-building-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'circuitNumber', group: 'cases', label: 'رقم الدائرة', icon: 'ri-layout-grid-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'fileNumber', group: 'cases', label: 'رقم الملف', icon: 'ri-folder-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'subject', group: 'cases', label: 'موضوع القضية', icon: 'ri-article-line', cellClass: 'whitespace-normal break-words' },
    { key: 'caseStatus', group: 'cases', label: 'حالة القضية', icon: 'ri-scales-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'poaNumber', group: 'cases', label: 'رقم التوكيل', icon: 'ri-file-paper-2-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'archivedDate', group: 'cases', label: 'تاريخ الأرشفة', icon: 'ri-calendar-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'notes', group: 'cases', label: 'الملاحظات', icon: 'ri-sticky-note-line', cellClass: 'whitespace-normal break-words' }
];

let __reportsArchiveVisibleColumnKeysCache = null;

function __getReportsArchiveVisibleColumnKeys() {
    if (Array.isArray(__reportsArchiveVisibleColumnKeysCache) && __reportsArchiveVisibleColumnKeysCache.length) {
        return [...__reportsArchiveVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsArchiveColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const validKeys = __reportsArchiveColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                __reportsArchiveVisibleColumnKeysCache = filtered;
                return [...__reportsArchiveVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsArchiveVisibleColumnKeysCache = [...__reportsArchiveDefaultVisibleColumns];
    return [...__reportsArchiveVisibleColumnKeysCache];
}

function __setReportsArchiveVisibleColumnKeys(keys) {
    const validKeys = __reportsArchiveColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsArchiveVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsArchiveDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsArchiveColumnsStorageKey, JSON.stringify(__reportsArchiveVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsArchiveVisibleColumns() {
    const visibleKeys = __getReportsArchiveVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsArchiveColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

// -------------------------------------------------------------
// تجهيز بيانات صف القضية المؤرشفة
// -------------------------------------------------------------
function __getReportsArchiveRowData(caseRecord, clientsMap, opponentsMap) {
    const client = clientsMap.get(caseRecord.clientId);
    const opponent = opponentsMap.get(caseRecord.opponentId);

    const clientName = client ? client.name : (caseRecord.clientName || 'غير محدد');
    const clientPhone = client ? (client.phone || client.mobile || '-') : '-';
    const clientCapacity = client ? (client.capacity || '-') : '-';
    const clientAddress = client ? (client.address || '-') : '-';

    const opponentName = opponent ? opponent.name : (caseRecord.opponentName || 'غير محدد');
    const opponentPhone = opponent ? (opponent.phone || '-') : '-';
    const opponentCapacity = opponent ? (opponent.capacity || '-') : '-';
    const opponentAddress = opponent ? (opponent.address || '-') : '-';

    const caseNumber = __formatReportsArchiveCaseNumberYear(caseRecord.caseNumber, caseRecord.caseYear);
    const caseType = caseRecord.caseType || 'غير محدد';
    const court = caseRecord.court || '-';
    const circuitNumber = caseRecord.circuitNumber || '-';
    const fileNumber = caseRecord.fileNumber || '-';
    const subject = caseRecord.subject || '-';
    const caseStatus = caseRecord.caseStatus || '-';
    const poaNumber = caseRecord.poaNumber || '-';
    const archivedDate = __formatReportsArchiveDateForDisplay(caseRecord.archivedAt || caseRecord.updatedAt || caseRecord.createdAt, '-');
    const notes = caseRecord.notes || '-';

    return {
        rawCase: caseRecord,
        clientName,
        clientPhone,
        clientCapacity,
        clientAddress,
        opponentName,
        opponentPhone,
        opponentCapacity,
        opponentAddress,
        caseNumber,
        caseType,
        court,
        circuitNumber,
        fileNumber,
        subject,
        caseStatus,
        poaNumber,
        archivedDate,
        notes
    };
}

// -------------------------------------------------------------
// قوائم التحكم في الأعمدة المنسدلة من الرأس (In-Header Dropdowns)
// -------------------------------------------------------------
function __buildReportsArchiveColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsArchiveVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsArchiveColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsArchiveColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];

    const extraColumns = [];
    if (currentColumn && (currentColumn.group === 'clients' || currentColumn.group === 'opponents') && !visibleSet.has('caseNumber')) {
        const caseCol = __reportsArchiveColumnDefinitions.find(c => c.key === 'caseNumber');
        if (caseCol && !sameGroupColumns.some(c => c.key === caseCol.key)) {
            extraColumns.push(caseCol);
        }
    }
    const allMenuColumns = [...sameGroupColumns, ...extraColumns];

    const items = allMenuColumns.length ? allMenuColumns.map(col => `
        <button type="button" onclick="toggleReportsArchiveColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-cyan-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;

    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;

    return `
        <div id="reports-archive-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-cyan-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-cyan-50 border-b border-cyan-100 text-right shrink-0">
                    <div class="text-xs font-bold text-cyan-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsArchiveColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-cyan-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-80">${items}</div>
            <div class="border-t border-cyan-100 shrink-0"></div>
            <button type="button" onclick="resetReportsArchiveColumns(event)" class="w-full flex items-center gap-2 px-3 py-2.5 text-right text-cyan-700 hover:bg-cyan-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">إرجاع الافتراضي</span>
            </button>
        </div>
    `;
}

function closeReportsArchiveColumnMenus() {
    document.querySelectorAll('[id^="reports-archive-column-menu-"]').forEach(menu => {
        try { menu.classList.add('hidden'); } catch (_) { }
    });
}

function __cleanupDetachedArchiveColumnMenus() {
    document.querySelectorAll('body > [id^="reports-archive-column-menu-"]').forEach(menu => {
        try { menu.remove(); } catch (_) { }
    });
}

function __positionReportsArchiveColumnMenu(menu, anchorEl) {
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

function toggleReportsArchiveColumnMenu(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-archive-column-menu-${columnKey}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsArchiveColumnMenus();
    if (!shouldOpen) return;

    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsArchiveColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function toggleReportsArchiveColumnVisibility(event, columnKey, anchorColumnKey = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsArchiveColumnMenus();
    const currentKeys = __getReportsArchiveVisibleColumnKeys();
    const currentSet = new Set(currentKeys);
    if (currentSet.has(columnKey) && currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    if (currentSet.has(columnKey)) {
        __setReportsArchiveVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
        __renderReportsArchiveCurrentTable();
        return;
    }
    const nextKeys = [...currentKeys];
    const anchorIndex = anchorColumnKey ? nextKeys.indexOf(anchorColumnKey) : -1;
    if (anchorIndex !== -1) nextKeys.splice(anchorIndex + 1, 0, columnKey);
    else nextKeys.push(columnKey);
    __setReportsArchiveVisibleColumnKeys(nextKeys);
    __renderReportsArchiveCurrentTable();
}

function hideReportsArchiveColumn(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsArchiveColumnMenus();
    const currentKeys = __getReportsArchiveVisibleColumnKeys();
    if (!currentKeys.includes(columnKey)) return;
    if (currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    __setReportsArchiveVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
    __renderReportsArchiveCurrentTable();
}

function resetReportsArchiveColumns(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsArchiveColumnMenus();
    __setReportsArchiveVisibleColumnKeys(__reportsArchiveDefaultVisibleColumns);
    __renderReportsArchiveCurrentTable();
}

function __renderReportsArchiveCurrentTable() {
    const reportContent = document.getElementById('archive-report-content');
    if (!reportContent) return;
    closeReportsArchiveColumnMenus();
    const { cases, clients, opponents } = __getReportsArchiveDataForAction();
    reportContent.innerHTML = generateArchiveReportHTML(cases, clients, opponents, currentArchiveSortOrder);
}

// -------------------------------------------------------------
// البيانات والحالة العامة للتقرير
// -------------------------------------------------------------
let __reportsArchiveAllCases = [];
let __reportsArchiveAllClients = [];
let __reportsArchiveAllOpponents = [];
let __reportsArchiveCurrentCases = [];
let __reportsArchiveCurrentClients = [];
let __reportsArchiveCurrentOpponents = [];
let __reportsArchiveChunkTimer = null;
let currentArchiveSortOrder = 'desc';
let __reportsArchiveLastSearchTerm = '';

function __getReportsArchiveDataForAction() {
    try {
        const cases = Array.isArray(__reportsArchiveCurrentCases) ? __reportsArchiveCurrentCases : [];
        const clients = Array.isArray(__reportsArchiveCurrentClients) ? __reportsArchiveCurrentClients : [];
        const opponents = Array.isArray(__reportsArchiveCurrentOpponents) ? __reportsArchiveCurrentOpponents : [];
        if (cases.length || clients.length || opponents.length) return { cases, clients, opponents };
    } catch (e) { }
    return {
        cases: Array.isArray(__reportsArchiveAllCases) ? __reportsArchiveAllCases : [],
        clients: Array.isArray(__reportsArchiveAllClients) ? __reportsArchiveAllClients : [],
        opponents: Array.isArray(__reportsArchiveAllOpponents) ? __reportsArchiveAllOpponents : []
    };
}

async function updateArchiveReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');

    try {
        await __getReportsArchiveDateLocaleSetting();

        const allCases = await getAllCases();
        const archivedCases = (Array.isArray(allCases) ? allCases : []).filter(c => c.isArchived === true);
        const clients = await getAllClients();
        const opponents = await getAllOpponents();

        __reportsArchiveAllCases = archivedCases;
        __reportsArchiveAllClients = Array.isArray(clients) ? clients : [];
        __reportsArchiveAllOpponents = Array.isArray(opponents) ? opponents : [];

        __reportsArchiveCurrentCases = __reportsArchiveAllCases;
        __reportsArchiveCurrentClients = __reportsArchiveAllClients;
        __reportsArchiveCurrentOpponents = __reportsArchiveAllOpponents;
        __reportsArchiveLastSearchTerm = '';

        const colors = { bg: '#06b6d4', bgHover: '#0891b2', bgLight: '#ecfeff', text: '#0891b2', textLight: '#67e8f9' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="archive-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث في ${reportName}..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <div class="relative">
                            <button id="archive-view-menu-btn" onclick="toggleArchiveViewMenu()" class="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-archive-view-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="archive-view-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 230px; width: 240px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">تاريخ الأرشفة</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-sort-mode="desc" onclick="setArchiveSortOrder('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأحدث</button>
                                    <button type="button" data-sort-mode="asc" onclick="setArchiveSortOrder('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأقدم</button>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                            <button onclick="toggleExportMenuArchive()" id="export-btn-archive" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-archive" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportArchiveReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportArchiveReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportArchiveReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>
                        <button onclick="printArchiveReport()" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="archive-report-content">
                    ${generateArchiveReportHTML(__reportsArchiveCurrentCases, __reportsArchiveCurrentClients, __reportsArchiveCurrentOpponents, currentArchiveSortOrder)}
                </div>
            </div>
        `;

        __reportsArchiveUpdateActiveTiles();
        __reportsArchiveUpdateViewMenuButtonLabel();

        const searchEl = document.getElementById('archive-search');
        if (searchEl) {
            let debounceT;
            searchEl.addEventListener('input', function (e) {
                clearTimeout(debounceT);
                debounceT = setTimeout(() => {
                    filterArchiveReport(e.target.value);
                }, 150);
            });
        }

    } catch (error) {
        console.error('Error loading archive data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات الأرشيف</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// توليد جدول HTML وعرض قضايا الأرشيف
// -------------------------------------------------------------
function generateArchiveReportHTML(archivedCases, clients, opponents, sortOrder = 'desc') {
    __cleanupDetachedArchiveColumnMenus();
    if (__reportsArchiveChunkTimer) {
        cancelAnimationFrame(__reportsArchiveChunkTimer);
        __reportsArchiveChunkTimer = null;
    }

    if (!archivedCases || archivedCases.length === 0) {
        return `
            <div class="archive-report-container flex-1 min-h-0 flex flex-col overflow-y-auto p-4" style="height: 100%; position: relative;">
                <div class="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
                    <div class="mb-6">
                        <i class="ri-folder-history-line text-8xl text-cyan-200"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                    <p class="text-gray-400 text-lg">لم يتم العثور على قضايا مؤرشفة مطابقة</p>
                </div>
            </div>
        `;
    }

    const visibleColumns = __getReportsArchiveVisibleColumns();
    const columnWidth = (100 / Math.max(visibleColumns.length, 1)).toFixed(2);
    const clientsMap = new Map((Array.isArray(clients) ? clients : __reportsArchiveAllClients).map(c => [c.id, c]));
    const opponentsMap = new Map((Array.isArray(opponents) ? opponents : __reportsArchiveAllOpponents).map(o => [o.id, o]));

    const buildRowHtml = (caseRecord, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-cyan-50 to-blue-50' : 'bg-white';
        const rowData = __getReportsArchiveRowData(caseRecord, clientsMap, opponentsMap);

        const cellsHtml = visibleColumns.map(col => {
            const val = rowData[col.key];
            const escaped = __escapeReportsArchiveHtml(val);

            return `
                <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-middle">
                    <div class="font-bold text-sm md:text-base text-gray-800 hover:text-cyan-700 transition-colors duration-200 ${col.cellClass}" title="${escaped}">
                        ${escaped}
                    </div>
                </td>
            `;
        }).join('');

        return `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-cyan-100 hover:to-blue-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = archivedCases.slice(0, initialBatchSize).map((c, i) => buildRowHtml(c, i)).join('');

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; width: ${columnWidth}%; min-width: 150px; background-color: #0891b2 !important; color: white !important; border-color: #06b6d4 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #06b6d4;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsArchiveColumnMenu(event, '${col.key}')" class="reports-archive-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsArchiveColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    if (archivedCases.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('archive-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, archivedCases.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(archivedCases[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < archivedCases.length) {
                __reportsArchiveChunkTimer = requestAnimationFrame(appendNextChunk);
            } else {
                __reportsArchiveChunkTimer = null;
            }
        };
        __reportsArchiveChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    return `
        <div class="archive-report-container flex-1 min-h-0 flex flex-col p-2" style="height: 100%; position: relative;">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; table-layout: fixed; min-width: ${visibleColumns.length * 150}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #0891b2 !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="archive-table-body">
                        ${initialRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// -------------------------------------------------------------
// الفلترة والترتيب والبحث
// -------------------------------------------------------------
function __reportsArchiveApplyFiltersAndRender() {
    const norm = (t) => {
        const s = window.normalizeDigits ? window.normalizeDigits(t) : String(t || '');
        return s.replace(/[إأآ]/g, 'ا').toLowerCase();
    };
    let filtered = [...__reportsArchiveAllCases];

    const term = norm(__reportsArchiveLastSearchTerm);
    if (term) {
        const clientsMap = new Map(__reportsArchiveAllClients.map(c => [c.id, c]));
        const opponentsMap = new Map(__reportsArchiveAllOpponents.map(o => [o.id, o]));
        filtered = filtered.filter(caseRecord => {
            const rowData = __getReportsArchiveRowData(caseRecord, clientsMap, opponentsMap);
            return (
                norm(rowData.clientName).includes(term) ||
                norm(rowData.opponentName).includes(term) ||
                norm(rowData.caseNumber).includes(term) ||
                norm(rowData.caseType).includes(term) ||
                norm(rowData.court).includes(term) ||
                norm(rowData.circuitNumber).includes(term) ||
                norm(rowData.fileNumber).includes(term) ||
                norm(rowData.subject).includes(term) ||
                norm(rowData.caseStatus).includes(term) ||
                norm(rowData.poaNumber).includes(term) ||
                norm(rowData.archivedDate).includes(term) ||
                norm(rowData.notes).includes(term)
            );
        });
    }

    filtered.sort((a, b) => {
        const getTime = (item) => {
            try {
                const dateVal = item && (item.archivedAt || item.updatedAt || item.createdAt);
                const d = __parseReportsArchiveDateString(dateVal);
                if (d) return d.getTime();
                const idNum = Number(item && item.id);
                if (Number.isFinite(idNum)) return idNum;
            } catch (_) { }
            return 0;
        };
        const timeA = getTime(a);
        const timeB = getTime(b);
        return currentArchiveSortOrder === 'desc' ? (timeB - timeA) : (timeA - timeB);
    });

    __reportsArchiveCurrentCases = filtered;
    __renderReportsArchiveCurrentTable();
}

function filterArchiveReport(searchTerm) {
    __reportsArchiveLastSearchTerm = searchTerm || '';
    __reportsArchiveApplyFiltersAndRender();
}

function __reportsArchiveUpdateViewMenuButtonLabel() {
    try {
        const btn = document.getElementById('archive-view-menu-btn');
        if (!btn) return;
        const textEl = btn.querySelector('[data-archive-view-label]');
        if (textEl) textEl.textContent = 'فرز';
    } catch (_) { }
}

function __reportsArchiveUpdateActiveTiles() {
    try {
        const sortButtons = document.querySelectorAll('#archive-view-menu [data-sort-mode]');
        sortButtons.forEach(btn => {
            const mode = btn.getAttribute('data-sort-mode');
            if (mode === currentArchiveSortOrder) {
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

function toggleArchiveViewMenu() {
    try {
        const menu = document.getElementById('archive-view-menu');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            __reportsArchiveUpdateActiveTiles();
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    } catch (_) { }
}

function setArchiveSortOrder(order) {
    currentArchiveSortOrder = order || 'desc';
    __reportsArchiveUpdateActiveTiles();
    __reportsArchiveApplyFiltersAndRender();
    const menu = document.getElementById('archive-view-menu');
    if (menu) menu.classList.add('hidden');
}

async function toggleArchiveSort() {
    setArchiveSortOrder(currentArchiveSortOrder === 'desc' ? 'asc' : 'desc');
}

// -------------------------------------------------------------
// جدول المستندات للطباعة والتصدير (Print & Excel & PDF & WhatsApp)
// -------------------------------------------------------------
function __buildReportsArchiveDocumentTable(archivedCasesData, clientsData, opponentsData, options = {}) {
    const visibleColumns = __getReportsArchiveVisibleColumns();
    const colCount = visibleColumns.length;
    const isPdfExport = options.isPdfExport === true;

    // تحديد مقاس الخط والحواشي ديناميكياً وفقاً لعدد الأعمدة ليتناسب حجم النص مع حجم الخلية
    let defaultHeaderFontSize = '12px';
    let defaultCellFontSize = '11px';
    let defaultHeaderPadding = '6px 6px';
    let defaultCellPadding = '5px 5px';

    if (isPdfExport) {
        if (colCount >= 7) {
            defaultHeaderFontSize = '7.5px';
            defaultCellFontSize = '7px';
            defaultHeaderPadding = '4px 2px';
            defaultCellPadding = '3px 2px';
        } else if (colCount === 6) {
            defaultHeaderFontSize = '8.5px';
            defaultCellFontSize = '8px';
            defaultHeaderPadding = '4px 3px';
            defaultCellPadding = '4px 3px';
        } else {
            defaultHeaderFontSize = '9.5px';
            defaultCellFontSize = '8.5px';
            defaultHeaderPadding = '5px 4px';
            defaultCellPadding = '4px 3px';
        }
    }

    const headerFontSize = options.headerFontSize || defaultHeaderFontSize;
    const cellFontSize = options.cellFontSize || defaultCellFontSize;
    const headerPadding = options.headerPadding || defaultHeaderPadding;
    const cellPadding = options.cellPadding || defaultCellPadding;
    const tableStyle = options.tableStyle || 'width: 100%; border-collapse: collapse; margin-top: 8px; direction: rtl; table-layout: auto; box-sizing: border-box;';
    const headerCellStyle = `background-color: #0891b2; color: white; padding: ${headerPadding}; text-align: center; border: 1px solid #06b6d4; font-weight: bold; font-size: ${headerFontSize}; white-space: nowrap; box-sizing: border-box;`;

    const clientsMap = new Map((Array.isArray(clientsData) ? clientsData : []).map(c => [c.id, c]));
    const opponentsMap = new Map((Array.isArray(opponentsData) ? opponentsData : []).map(o => [o.id, o]));

    const rowsHtml = (Array.isArray(archivedCasesData) ? archivedCasesData : []).map((caseRecord, index) => {
        const rowData = __getReportsArchiveRowData(caseRecord, clientsMap, opponentsMap);
        const rowBg = index % 2 === 0 ? '#ecfeff' : '#ffffff';

        const cellsHtml = visibleColumns.map(col => {
            let val = rowData[col.key];
            if (isPdfExport && val) {
                val = String(val).replace(/\s*\/\s*/g, ' - ');
            }
            const escaped = __escapeReportsArchiveHtml(val);

            // تخصيص حجم النص وخصائص العرض بدقة حسب طبيعة الخلية
            let specificCellFontSize = cellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone' || col.key === 'opponentPhone';
            const isCodeOrDateCol = col.key === 'caseNumber' || col.key === 'fileNumber' || col.key === 'circuitNumber' || col.key === 'poaNumber' || col.key === 'archivedDate';

            if (isPhoneCol) {
                if (colCount >= 6) {
                    specificCellFontSize = (parseFloat(cellFontSize) * 0.95).toFixed(1) + 'px';
                }
                extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
            } else if (isCodeOrDateCol) {
                extraCellStyle = 'white-space: nowrap;';
            } else {
                extraCellStyle = 'word-break: break-word; line-height: 1.15;';
            }

            return `<td style="border: 1px solid #cbd5e1; padding: ${cellPadding}; text-align: center; font-size: ${specificCellFontSize}; ${extraCellStyle} box-sizing: border-box; overflow: hidden;">${escaped}</td>`;
        }).join('');

        return `<tr style="background: ${rowBg};">${cellsHtml}</tr>`;
    }).join('');

    const headerHtml = visibleColumns.map(col => `<th style="${headerCellStyle}">${col.label}</th>`).join('');

    return `
        <table style="${tableStyle}">
            <thead>
                <tr>${headerHtml}</tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;
}

// -------------------------------------------------------------
// الطباعة (Print)
// -------------------------------------------------------------
async function printArchiveReport() {
    try {
        await __getReportsArchiveDateLocaleSetting();
        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();
        if (!archivedCases.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للطباعة', 'info');
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #0891b2; font-size: 14px; font-weight: bold; text-align: right;">تقرير الأرشيف</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsArchiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                ${__buildReportsArchiveDocumentTable(archivedCases, clients, opponents, { headerFontSize: '13px', cellFontSize: '12px', headerPadding: '6px 6px', cellPadding: '6px 6px' })}
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير الأرشيف - ${new Date().toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG')}</title>
                <style>
                    @page { size: A4 portrait; margin: 10mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 0; padding: 0; }
                    thead { display: table-header-group; }
                    tr { page-break-inside: auto; }
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
        }, 500);

    } catch (error) {
        console.error('Error printing report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}

// -------------------------------------------------------------
// تصدير إكسيل (Excel Export)
// -------------------------------------------------------------
async function exportArchiveReportExcel() {
    try {
        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning(
                            { path: chk.path, desktop: chk.desktop },
                            { onContinue: null }
                        );
                    }
                } catch (_) { }
                toggleExportMenuArchive();
                return;
            }
        }

        await __getReportsArchiveDateLocaleSetting();
        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();

        const excelContent = `
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
                                <x:Name>تقرير الأرشيف</x:Name>
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
            </head>
            <body>
                ${__buildReportsArchiveDocumentTable(archivedCases, clients, opponents, { headerFontSize: '21px', cellFontSize: '18px', headerPadding: '10px', cellPadding: '8px', tableStyle: 'border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 18px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;' })}
            </body>
            </html>
        `;

        const blob = new Blob([excelContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_الأرشيف_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');
        toggleExportMenuArchive();

    } catch (error) {
        console.error('Error exporting archive report:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
}

// -------------------------------------------------------------
// تصدير PDF و WhatsApp
// -------------------------------------------------------------
async function exportArchiveReportPDF() {
    try {
        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning(
                            { path: chk.path, desktop: chk.desktop },
                            { onContinue: null }
                        );
                    }
                } catch (_) { }
                toggleExportMenuArchive();
                return;
            }
        }

        await __getReportsArchiveDateLocaleSetting();
        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();
        if (!archivedCases.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للتصدير', 'info');
            toggleExportMenuArchive();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_الأرشيف_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __generateReportsArchivePDFDocument(archivedCases, clients, opponents, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuArchive();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportArchiveReportWhatsApp() {
    try {
        await __getReportsArchiveDateLocaleSetting();
        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();
        if (!archivedCases.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للمشاركة', 'info');
            toggleExportMenuArchive();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_الأرشيف_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuArchive();
        const pdf = await __generateReportsArchivePDFDocument(archivedCases, clients, opponents, officeName, opt);
        const blob = pdf.output('blob');
        if (typeof shareReportPdfAsFile === 'function') {
            await shareReportPdfAsFile(blob, opt.filename);
        } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = opt.filename;
            a.click();
            URL.revokeObjectURL(a.href);
            window.open('https://wa.me/?text=' + encodeURIComponent('تقرير PDF مرفق'), '_blank');
            showToast('تم تحميل التقرير. يمكنك إرفاقه في واتساب.', 'success');
        }
    } catch (error) {
        console.error('Error exporting report to WhatsApp:', error);
        showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}

// -------------------------------------------------------------
// توليد PDF متعدد الصفحات نظيف ومستقل لتقرير الأرشيف
// -------------------------------------------------------------
async function __generateReportsArchivePDFDocument(archivedCases, clients, opponents, officeName, opt) {
    if (!archivedCases || archivedCases.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    const ROWS_PER_PAGE = 16;
    const pages = [];
    for (let i = 0; i < archivedCases.length; i += ROWS_PER_PAGE) {
        pages.push(archivedCases.slice(i, i + ROWS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsArchiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;

    // بناء عناصر مستقلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pageCases, pageIdx) => {
        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #0891b2; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير الأرشيف ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>
            ${__buildReportsArchiveDocumentTable(pageCases, clients, opponents, { isPdfExport: true })}
        `;
        return div;
    });

    // رسم كل صفحة كـ Canvas مستقل وإضافته لـ jsPDF
    const firstWorker = html2pdf().set(opt).from(pageElements[0]);
    await firstWorker.toPdf();
    const pdf = await firstWorker.get('pdf');
    const pageSize = await firstWorker.get('pageSize');

    for (let i = 1; i < pageElements.length; i++) {
        const pageCanvas = await html2pdf().set(opt).from(pageElements[i]).toCanvas().get('canvas');
        pdf.addPage();
        const imgData = pageCanvas.toDataURL('image/' + (opt.image?.type || 'jpeg'), opt.image?.quality || 0.95);
        const imgWidth = pageSize.inner.width;
        const imgHeight = pageCanvas.height * imgWidth / pageCanvas.width;
        pdf.addImage(imgData, (opt.image?.type || 'jpeg').toUpperCase(), opt.margin[1], opt.margin[0], imgWidth, imgHeight);
    }

    return pdf;
}

// -------------------------------------------------------------
// إدارة قائمة التصدير
// -------------------------------------------------------------
async function toggleExportMenuArchive() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-archive');
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

// مستمع النقر العام لإغلاق القوائم المنسدلة عند النقر بالخارج
document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu-archive');
    const button = document.getElementById('export-btn-archive');
    const target = event.target;
    const clickedInsideColumnMenu = target && typeof target.closest === 'function' ? target.closest('[id^="reports-archive-column-menu-"]') : null;
    const clickedColumnToggle = target && typeof target.closest === 'function' ? target.closest('.reports-archive-column-toggle-btn') : null;

    if (menu && button && !menu.contains(target) && !button.contains(target)) {
        menu.classList.add('hidden');
    }

    const viewMenu = document.getElementById('archive-view-menu');
    const viewBtn = document.getElementById('archive-view-menu-btn');
    if (viewMenu && viewBtn && !viewMenu.contains(target) && !viewBtn.contains(target)) {
        viewMenu.classList.add('hidden');
    }

    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsArchiveColumnMenus();
    }
});

// إغلاق القوائم عند الضغط على Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeReportsArchiveColumnMenus();
        const menu = document.getElementById('export-menu-archive');
        if (menu) menu.classList.add('hidden');
        const viewMenu = document.getElementById('archive-view-menu');
        if (viewMenu) viewMenu.classList.add('hidden');
    }
});

// إغلاق القوائم عند تغيير أبعاد الشاشة
window.addEventListener('resize', function () {
    closeReportsArchiveColumnMenus();
});