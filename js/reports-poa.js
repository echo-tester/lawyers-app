/**
 * تقارير التوكيلات (ملفات الموكلين) - بنظام الأعمدة المرنة والديناميكية
 * متطابقة 100% مع معمارية تقارير القضايا والمهام سواء لنسخة الكمبيوتر أو الموبايل.
 */

let __reportsPoaDateLocaleCache = null;

async function __getReportsPoaDateLocaleSetting() {
    if (__reportsPoaDateLocaleCache) return __reportsPoaDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsPoaDateLocaleCache = locale;
    return locale;
}

function __parseReportsPoaDateString(dateStr) {
    try {
        const s = String(dateStr || '').trim();
        if (!s) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const parts = s.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month - 1, day);
            return (d.getFullYear() === year && d.getMonth() === (month - 1) && d.getDate() === day) ? d : null;
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

function __formatReportsPoaDateForDisplay(dateStr) {
    try {
        if (!dateStr) return '-';
        const d = __parseReportsPoaDateString(dateStr);
        if (!d) return (dateStr || '-');
        return d.toLocaleDateString(__reportsPoaDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || '-');
    }
}

function __escapeReportsPoaHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function __normalizeReportsPoaCellValue(value, fallback = '-') {
    const text = String(value == null ? '' : value).trim();
    return text !== '' ? text : fallback;
}

function __reportsPoaNormalizeSearchValue(value) {
    const s = window.normalizeDigits ? window.normalizeDigits(value) : String(value || '');
    return s
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\/\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// -------------------------------------------------------------
// تعريفات الأعمدة المرنة ونظام الإظهار والإخفاء (Dynamic Columns)
// -------------------------------------------------------------
const __reportsPoaColumnsStorageKey = 'reportsPoaVisibleColumns';
const __reportsPoaLegacyDefaultVisibleColumns = ['clientName', 'poaNumber', 'fileNumber', 'caseNumber'];
const __reportsPoaDefaultVisibleColumns = ['clientName', 'opponentName', 'poaNumber', 'fileNumber', 'caseNumber'];

const __reportsPoaColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '175px' },
    { key: 'poaNumber', group: 'cases', label: 'رقم التوكيل', icon: 'ri-file-paper-2-line', cellClass: 'whitespace-normal break-words overflow-hidden font-bold', minWidth: '115px' },
    { key: 'fileNumber', group: 'cases', label: 'رقم الملف', icon: 'ri-folder-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '85px' },
    { key: 'caseNumber', group: 'cases', label: 'رقم القضية', icon: 'ri-hashtag', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'clientCapacity', group: 'clients', label: 'صفة الموكل', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'clientAddress', group: 'clients', label: 'عنوان الموكل', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words', minWidth: '155px' },
    { key: 'opponentName', group: 'opponents', label: 'اسم الخصم', icon: 'ri-user-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '175px' },
    { key: 'opponentPhone', group: 'opponents', label: 'هاتف الخصم', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'opponentCapacity', group: 'opponents', label: 'صفة الخصم', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'opponentAddress', group: 'opponents', label: 'عنوان الخصم', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words', minWidth: '155px' },
    { key: 'court', group: 'cases', label: 'المحكمة', icon: 'ri-building-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '115px' },
    { key: 'caseType', group: 'cases', label: 'نوع القضية', icon: 'ri-file-list-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '115px' },
    { key: 'circuitNumber', group: 'cases', label: 'رقم الدائرة', icon: 'ri-layout-grid-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '90px' },
    { key: 'subject', group: 'cases', label: 'موضوع الدعوى', icon: 'ri-article-line', cellClass: 'whitespace-normal break-words', minWidth: '165px' },
    { key: 'caseStatus', group: 'cases', label: 'حالة القضية', icon: 'ri-scales-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'appealLabel', group: 'cases', label: 'الاستئناف', icon: 'ri-file-copy-2-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'cassationLabel', group: 'cases', label: 'النقض', icon: 'ri-file-copy-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'notes', group: 'cases', label: 'الملاحظات', icon: 'ri-sticky-note-line', cellClass: 'whitespace-normal break-words', minWidth: '145px' }
];

let __reportsPoaVisibleColumnKeysCache = null;

function __getReportsPoaVisibleColumnKeys() {
    if (Array.isArray(__reportsPoaVisibleColumnKeysCache) && __reportsPoaVisibleColumnKeysCache.length) {
        return [...__reportsPoaVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsPoaColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const validKeys = __reportsPoaColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                const isLegacyDefault = filtered.length === __reportsPoaLegacyDefaultVisibleColumns.length
                    && filtered.every((key, index) => key === __reportsPoaLegacyDefaultVisibleColumns[index]);
                if (isLegacyDefault) {
                    __reportsPoaVisibleColumnKeysCache = [...__reportsPoaDefaultVisibleColumns];
                    try {
                        localStorage.setItem(__reportsPoaColumnsStorageKey, JSON.stringify(__reportsPoaVisibleColumnKeysCache));
                    } catch (_) { }
                    return [...__reportsPoaVisibleColumnKeysCache];
                }
                __reportsPoaVisibleColumnKeysCache = filtered;
                return [...__reportsPoaVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsPoaVisibleColumnKeysCache = [...__reportsPoaDefaultVisibleColumns];
    return [...__reportsPoaVisibleColumnKeysCache];
}

function __setReportsPoaVisibleColumnKeys(keys) {
    const validKeys = __reportsPoaColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsPoaVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsPoaDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsPoaColumnsStorageKey, JSON.stringify(__reportsPoaVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsPoaVisibleColumns() {
    const visibleKeys = __getReportsPoaVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsPoaColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

// -------------------------------------------------------------
// إدارة البيانات والحالة
// -------------------------------------------------------------
let __reportsPoaAllClients = [];
let __reportsPoaAllCases = [];
let __reportsPoaAllOpponents = [];
let __reportsPoaPreparedRows = [];
let __reportsPoaFilteredRows = [];
let __reportsPoaLastSearchTerm = '';
let currentClientsFilesSortOrder = 'desc'; // desc | asc | alpha
let __reportsPoaChunkTimer = null;

function __prepareReportsPoaRows(cases, clients, opponents) {
    const clientsById = {};
    const clientsByName = {};
    (Array.isArray(clients) ? clients : []).forEach(c => {
        if (c && c.id != null) clientsById[String(c.id)] = c;
        if (c && c.name) {
            const trimmed = String(c.name).trim();
            if (trimmed) clientsByName[trimmed] = c;
        }
    });

    const opponentsById = {};
    const opponentsByName = {};
    (Array.isArray(opponents) ? opponents : []).forEach(op => {
        if (op && op.id != null) opponentsById[String(op.id)] = op;
        if (op && op.name) {
            const trimmed = String(op.name).trim();
            if (trimmed) opponentsByName[trimmed] = op;
        }
    });

    const rows = [];
    const casesList = Array.isArray(cases) ? cases : [];

    casesList.forEach(caseItem => {
        if (!caseItem) return;
        const poaNum = (caseItem.poaNumber && String(caseItem.poaNumber).trim()) ? String(caseItem.poaNumber).trim() : '';
        if (!poaNum) return; // حصر التقرير بالتوكيلات المسجلة فقط

        let client = null;
        if (caseItem.clientId != null) client = clientsById[String(caseItem.clientId)];
        if (!client && caseItem.clientName) client = clientsByName[String(caseItem.clientName).trim()];

        let opponent = null;
        if (caseItem.opponentId != null) opponent = opponentsById[String(caseItem.opponentId)];
        if (!opponent && caseItem.opponentName) opponent = opponentsByName[String(caseItem.opponentName).trim()];

        const clientNameVal = (client && client.name) || caseItem.clientName || 'غير محدد';
        const clientPhoneVal = (client && (client.phone || client.mobile)) || caseItem.clientPhone || caseItem.phone || '';
        const clientCapacityVal = (caseItem && caseItem.clientCapacity) || (client && client.capacity) || '-';
        const clientAddressVal = (caseItem && caseItem.clientAddress) || (client && client.address) || '-';

        const opponentNameVal = (opponent && opponent.name) || caseItem.opponentName || '-';
        const opponentPhoneVal = (caseItem && caseItem.opponentPhone) || (opponent && opponent.phone) || '';
        const opponentCapacityVal = (caseItem && caseItem.opponentCapacity) || (opponent && opponent.capacity) || '-';
        const opponentAddressVal = (caseItem && caseItem.opponentAddress) || (opponent && opponent.address) || '-';

        const caseNum = (caseItem.caseNumber && caseItem.caseYear)
            ? `${caseItem.caseNumber} لسنة ${caseItem.caseYear}`
            : (caseItem.caseNumber || caseItem.caseYear || '-');

        const appealNum = (caseItem.appealNumber && caseItem.appealYear)
            ? `${caseItem.appealNumber} لسنة ${caseItem.appealYear}`
            : (caseItem.appealNumber || caseItem.appealYear || '-');

        const cassationNum = (caseItem.cassationNumber && caseItem.cassationYear)
            ? `${caseItem.cassationNumber} لسنة ${caseItem.cassationYear}`
            : (caseItem.cassationNumber || caseItem.cassationYear || '-');

        // تحديد الطابع الزمني للفرز
        let sortTime = 0;
        if (caseItem.createdAt || caseItem.created_at || caseItem.createdDate || caseItem.created_date) {
            const d = new Date(caseItem.createdAt || caseItem.created_at || caseItem.createdDate || caseItem.created_date);
            if (Number.isFinite(d.getTime())) sortTime = d.getTime();
        }
        if (!sortTime) {
            const idNum = Number(caseItem.id);
            if (Number.isFinite(idNum)) sortTime = idNum;
        }

        rows.push({
            raw: caseItem,
            clientName: __normalizeReportsPoaCellValue(clientNameVal, 'غير محدد'),
            poaNumber: poaNum || '-',
            fileNumber: __normalizeReportsPoaCellValue(caseItem.fileNumber, '-'),
            caseNumber: __normalizeReportsPoaCellValue(caseNum, '-'),
            clientPhone: __normalizeReportsPoaCellValue(clientPhoneVal, '-'),
            clientCapacity: __normalizeReportsPoaCellValue(clientCapacityVal, '-'),
            clientAddress: __normalizeReportsPoaCellValue(clientAddressVal, '-'),
            opponentName: __normalizeReportsPoaCellValue(opponentNameVal, '-'),
            opponentPhone: __normalizeReportsPoaCellValue(opponentPhoneVal, '-'),
            opponentCapacity: __normalizeReportsPoaCellValue(opponentCapacityVal, '-'),
            opponentAddress: __normalizeReportsPoaCellValue(opponentAddressVal, '-'),
            court: __normalizeReportsPoaCellValue(caseItem.court, '-'),
            caseType: __normalizeReportsPoaCellValue(caseItem.caseType, '-'),
            circuitNumber: __normalizeReportsPoaCellValue(caseItem.circuitNumber, '-'),
            subject: __normalizeReportsPoaCellValue(caseItem.subject, '-'),
            caseStatus: __normalizeReportsPoaCellValue(caseItem.caseStatus, '-'),
            appealLabel: __normalizeReportsPoaCellValue(appealNum, '-'),
            cassationLabel: __normalizeReportsPoaCellValue(cassationNum, '-'),
            notes: __normalizeReportsPoaCellValue(caseItem.notes || caseItem.caseNotes, '-'),
            __sortTime: sortTime
        });
    });

    return rows;
}

function __sortReportsPoaRows(rows, sortOrder) {
    const list = [...rows];
    if (sortOrder === 'alpha-asc') {
        list.sort((a, b) => String(a.clientName).localeCompare(String(b.clientName), 'ar'));
    } else if (sortOrder === 'alpha-desc') {
        list.sort((a, b) => String(b.clientName).localeCompare(String(a.clientName), 'ar'));
    } else if (sortOrder === 'asc') {
        list.sort((a, b) => (a.__sortTime - b.__sortTime));
    } else {
        // desc (الأحدث)
        list.sort((a, b) => (b.__sortTime - a.__sortTime));
    }
    return list;
}

function __applyReportsPoaFiltersAndRender() {
    let filtered = [...__reportsPoaPreparedRows];

    const term = __reportsPoaNormalizeSearchValue(__reportsPoaLastSearchTerm);
    if (term) {
        const visibleCols = __getReportsPoaVisibleColumns();
        const visibleKeys = visibleCols.map(c => c.key);
        filtered = filtered.filter(row => {
            const inVisible = visibleKeys.some(key => __reportsPoaNormalizeSearchValue(row[key]).includes(term));
            if (inVisible) return true;
            // بحث إضافي في الحقول الأساسية
            const extra = [row.clientName, row.poaNumber, row.fileNumber, row.caseNumber, row.opponentName, row.court, row.clientAddress, row.opponentAddress, row.subject, row.caseStatus, row.appealLabel, row.cassationLabel, row.notes, row.clientCapacity, row.opponentCapacity];
            return extra.some(v => __reportsPoaNormalizeSearchValue(v).includes(term));
        });
    }

    filtered = __sortReportsPoaRows(filtered, currentClientsFilesSortOrder);
    __reportsPoaFilteredRows = filtered;

    const reportContent = document.getElementById('clients-files-report-content');
    if (reportContent) {
        __cleanupDetachedPoaColumnMenus();
        reportContent.innerHTML = generateClientsFilesReportHTML(filtered);
    }
}

// -------------------------------------------------------------
// قوائم التحكم في الأعمدة المنسدلة من الرأس (In-Header Dropdowns)
// -------------------------------------------------------------
function __buildReportsPoaColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsPoaVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsPoaColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsPoaColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];

    const items = sameGroupColumns.length ? sameGroupColumns.map(col => `
        <button type="button" onclick="toggleReportsPoaColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-blue-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;

    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;

    return `
        <div id="reports-poa-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-blue-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-blue-50 border-b border-blue-100 text-right shrink-0">
                    <div class="text-xs font-bold text-blue-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsPoaColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-blue-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-80">${items}</div>
            <div class="border-t border-blue-100 shrink-0"></div>
            <button type="button" onclick="resetReportsPoaColumns(event)" class="w-full flex items-center gap-2 px-3 py-2.5 text-right text-blue-700 hover:bg-blue-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">إرجاع الافتراضي</span>
            </button>
        </div>
    `;
}

function closeReportsPoaColumnMenus() {
    document.querySelectorAll('[id^="reports-poa-column-menu-"]').forEach(menu => {
        try { menu.classList.add('hidden'); } catch (_) { }
    });
}

function __cleanupDetachedPoaColumnMenus() {
    document.querySelectorAll('body > [id^="reports-poa-column-menu-"]').forEach(menu => {
        try { menu.remove(); } catch (_) { }
    });
}

// إغلاق القائمة تلقائياً عند النقر في أي مكان خارجها
if (!window.__reportsPoaGlobalMenuClickBound) {
    window.__reportsPoaGlobalMenuClickBound = true;
    document.addEventListener('click', function (e) {
        if (!e.target.closest('[id^="reports-poa-column-menu-"]') && !e.target.closest('.reports-poa-column-toggle-btn')) {
            closeReportsPoaColumnMenus();
        }
    });
}

function __positionReportsPoaColumnMenu(menu, anchorEl) {
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

        // Always keep menu below header button and limit height to visible viewport
        if (top < pad) top = pad;
        const availableHeight = Math.max(140, Math.floor(vh - top - pad));
        menu.style.maxHeight = availableHeight + 'px';

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    } catch (_) { }
}

function toggleReportsPoaColumnMenu(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-poa-column-menu-${columnKey}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsPoaColumnMenus();
    if (!shouldOpen) return;

    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsPoaColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function toggleReportsPoaColumnVisibility(event, columnKey, anchorColumnKey = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsPoaColumnMenus();
    const currentKeys = __getReportsPoaVisibleColumnKeys();
    const currentSet = new Set(currentKeys);
    if (currentSet.has(columnKey) && currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    if (currentSet.has(columnKey)) {
        __setReportsPoaVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
        __renderReportsPoaCurrentTable();
        return;
    }
    const nextKeys = [...currentKeys];
    const anchorIndex = anchorColumnKey ? nextKeys.indexOf(anchorColumnKey) : -1;
    if (anchorIndex !== -1) nextKeys.splice(anchorIndex + 1, 0, columnKey);
    else nextKeys.push(columnKey);
    __setReportsPoaVisibleColumnKeys(nextKeys);
    __renderReportsPoaCurrentTable();
}

function hideReportsPoaColumn(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsPoaColumnMenus();
    const currentKeys = __getReportsPoaVisibleColumnKeys();
    if (!currentKeys.includes(columnKey)) return;
    if (currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    __setReportsPoaVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
    __renderReportsPoaCurrentTable();
}

function resetReportsPoaColumns(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsPoaColumnMenus();
    __setReportsPoaVisibleColumnKeys(__reportsPoaDefaultVisibleColumns);
    __renderReportsPoaCurrentTable();
}

function __renderReportsPoaCurrentTable() {
    const reportContent = document.getElementById('clients-files-report-content');
    if (!reportContent) return;
    __cleanupDetachedPoaColumnMenus();
    reportContent.innerHTML = generateClientsFilesReportHTML(__reportsPoaFilteredRows);
}

// -------------------------------------------------------------
// تهيئة وعرض تقرير التوكيلات
// -------------------------------------------------------------
async function updateClientsFilesReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    try {
        await __getReportsPoaDateLocaleSetting();

        const [clients, cases, opponents] = await Promise.all([
            typeof getAllClientsCached === 'function' ? getAllClientsCached() : getAllClients(),
            typeof getAllCasesCached === 'function' ? getAllCasesCached() : getAllCases(),
            typeof getAllOpponentsCached === 'function' ? getAllOpponentsCached() : (typeof getAllOpponents === 'function' ? getAllOpponents() : [])
        ]);

        __reportsPoaAllClients = Array.isArray(clients) ? clients : [];
        __reportsPoaAllCases = Array.isArray(cases) ? cases : [];
        __reportsPoaAllOpponents = Array.isArray(opponents) ? opponents : [];

        __reportsPoaPreparedRows = __prepareReportsPoaRows(__reportsPoaAllCases, __reportsPoaAllClients, __reportsPoaAllOpponents);
        __reportsPoaLastSearchTerm = '';
        currentClientsFilesSortOrder = 'desc';
        __reportsPoaFilteredRows = __sortReportsPoaRows(__reportsPoaPreparedRows, currentClientsFilesSortOrder);

        const colors = { bg: '#2563eb', bgHover: '#1d4ed8', bgLight: '#eff6ff', text: '#2563eb', textLight: '#93c5fd' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="clients-files-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث في ${reportName} (بالموكل، رقم التوكيل، القضية، الملف)..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <!-- قائمة الفرز والترتيب -->
                        <div class="relative">
                            <button id="poa-sort-menu-btn" onclick="togglePoaSortMenu()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-poa-sort-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="poa-sort-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 250px; width: 260px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">ترتيب التوكيلات</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-sort-mode="desc" onclick="setPoaSortOrder('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأحدث</button>
                                    <button type="button" data-sort-mode="asc" onclick="setPoaSortOrder('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأقدم</button>
                                    <button type="button" data-sort-mode="alpha-asc" onclick="setPoaSortOrder('alpha-asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">أبجدي (أ - ي)</button>
                                    <button type="button" data-sort-mode="alpha-desc" onclick="setPoaSortOrder('alpha-desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">أبجدي (ي - أ)</button>
                                </div>
                            </div>
                        </div>

                        <!-- قائمة التصدير -->
                        <div class="relative">
                            <button onclick="toggleExportMenuPoa()" id="export-btn-poa" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-poa" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportClientsFilesReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportClientsFilesReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportClientsFilesReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>

                        <!-- زر الطباعة -->
                        <button onclick="printClientsFilesReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="clients-files-report-content">
                    ${generateClientsFilesReportHTML(__reportsPoaFilteredRows)}
                </div>
            </div>
        `;

        const searchEl = document.getElementById('clients-files-search');
        if (searchEl) {
            let debounceT;
            searchEl.addEventListener('input', function (e) {
                clearTimeout(debounceT);
                debounceT = setTimeout(() => {
                    __reportsPoaLastSearchTerm = e.target.value;
                    __applyReportsPoaFiltersAndRender();
                }, 150);
            });
        }

    } catch (error) {
        console.error('Error loading clients files data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات التوكيلات</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// توليد واجهة التقرير وجدول التوكيلات (HTML Generator)
// -------------------------------------------------------------
function generateClientsFilesReportHTML(rows) {
    __cleanupDetachedPoaColumnMenus();
    if (__reportsPoaChunkTimer) {
        cancelAnimationFrame(__reportsPoaChunkTimer);
        __reportsPoaChunkTimer = null;
    }

    const rowsData = Array.isArray(rows) ? rows : [];

    if (rowsData.length === 0) {
        return `
            <div class="clients-files-report-container p-2" style="height: 100%; overflow-y: auto; position: relative;">
                <div class="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
                    <div class="mb-4">
                        <i class="ri-file-paper-line text-7xl text-blue-200"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2 text-gray-700">لا توجد توكيلات مسجلة</h3>
                    <p class="text-gray-400 text-sm">لم يتم العثور على توكيلات مطابقة لشروط البحث أو التصفية</p>
                </div>
            </div>
        `;
    }

    const visibleColumns = __getReportsPoaVisibleColumns();
    const totalTableMinWidth = visibleColumns.reduce((sum, col) => sum + (parseInt(col.minWidth || '130', 10)), 0);

    const buildRowHtml = (row, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-blue-50/50 to-indigo-50/30' : 'bg-white';

        const cellsHtml = visibleColumns.map(col => {
            const value = row[col.key];
            const escaped = __escapeReportsPoaHtml(value);
            return `
                <td class="py-2 px-3 md:py-3 md:px-4 text-center border-l border-gray-200 align-middle" style="min-width: ${col.minWidth || '120px'};">
                    <div class="font-bold text-sm md:text-base text-gray-800 hover:text-blue-700 transition-colors duration-200 ${col.cellClass}" title="${escaped}">
                        ${escaped}
                    </div>
                </td>
            `;
        }).join('');

        return `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = rowsData.slice(0, initialBatchSize).map((r, i) => buildRowHtml(r, i)).join('');

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; min-width: ${col.minWidth || '120px'}; background-color: #2563eb !important; color: white !important; border-color: #1d4ed8 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #1d4ed8;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsPoaColumnMenu(event, '${col.key}')" class="reports-poa-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsPoaColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    if (rowsData.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('clients-files-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, rowsData.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(rowsData[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < rowsData.length) {
                __reportsPoaChunkTimer = requestAnimationFrame(appendNextChunk);
            } else {
                __reportsPoaChunkTimer = null;
            }
        };
        __reportsPoaChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    return `
        <div class="clients-files-report-container flex-1 min-h-0 flex flex-col" style="height: 100%; position: relative;">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; min-width: ${Math.max(totalTableMinWidth, 600)}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #2563eb !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="clients-files-table-body">
                        ${initialRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// -------------------------------------------------------------
// التحكم في الترتيب والفرز
// -------------------------------------------------------------
function __reportsPoaUpdateActiveTiles() {
    try {
        const sortButtons = document.querySelectorAll('#poa-sort-menu [data-sort-mode]');
        sortButtons.forEach(btn => {
            const mode = btn.getAttribute('data-sort-mode');
            if (mode === currentClientsFilesSortOrder) {
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

function togglePoaSortMenu() {
    try {
        const menu = document.getElementById('poa-sort-menu');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            __reportsPoaUpdateActiveTiles();
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    } catch (_) { }
}

function setPoaSortOrder(mode) {
    currentClientsFilesSortOrder = mode || 'desc';
    try {
        const btn = document.getElementById('poa-sort-menu-btn');
        if (btn) {
            const textEl = btn.querySelector('[data-poa-sort-label]');
            if (textEl) {
                textEl.textContent = 'فرز';
            }
        }
        __reportsPoaUpdateActiveTiles();
        const menu = document.getElementById('poa-sort-menu');
        if (menu) menu.classList.add('hidden');
    } catch (_) { }
    __applyReportsPoaFiltersAndRender();
}

function __getReportsPoaDataForAction() {
    try {
        if (Array.isArray(__reportsPoaFilteredRows)) {
            return __reportsPoaFilteredRows;
        }
    } catch (e) { }
    return Array.isArray(__reportsPoaPreparedRows) ? __reportsPoaPreparedRows : [];
}

async function toggleClientsFilesSort() {
    if (currentClientsFilesSortOrder === 'desc') currentClientsFilesSortOrder = 'asc';
    else if (currentClientsFilesSortOrder === 'asc') currentClientsFilesSortOrder = 'alpha-asc';
    else currentClientsFilesSortOrder = 'desc';
    setPoaSortOrder(currentClientsFilesSortOrder);
}

function filterClientsFilesReport(searchTerm) {
    __reportsPoaLastSearchTerm = String(searchTerm || '');
    __applyReportsPoaFiltersAndRender();
}

// -------------------------------------------------------------
// جدول المستندات للطباعة والتصدير (Excel & PDF & Print)
// -------------------------------------------------------------
function __buildReportsPoaDocumentTable(rowsData, options = {}) {
    const visibleColumns = __getReportsPoaVisibleColumns();
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
    const headerCellStyle = `background-color: #2563eb; color: white; padding: ${headerPadding}; text-align: center; border: 1px solid #1d4ed8; font-weight: bold; font-size: ${headerFontSize}; white-space: nowrap; box-sizing: border-box;`;

    const rowsHtml = (Array.isArray(rowsData) ? rowsData : []).map((row, index) => {
        const rowBg = index % 2 === 0 ? '#eff6ff' : '#ffffff';
        const cellsHtml = visibleColumns.map(col => {
            let val = row[col.key];
            if (isPdfExport && val) {
                val = String(val).replace(/\s*\/\s*/g, ' - ');
            }
            const escaped = __escapeReportsPoaHtml(val);

            // تخصيص حجم النص وخصائص العرض بدقة حسب طبيعة الخلية
            let specificCellFontSize = cellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone' || col.key === 'opponentPhone';
            const isNumberCol = col.key === 'fileNumber' || col.key === 'circuitNumber';
            const isCodeCol = col.key === 'poaNumber' || col.key === 'caseNumber';

            if (isPhoneCol) {
                if (colCount >= 6) {
                    specificCellFontSize = (parseFloat(cellFontSize) * 0.95).toFixed(1) + 'px';
                }
                extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
            } else if (isNumberCol) {
                extraCellStyle = 'white-space: nowrap;';
            } else if (isCodeCol) {
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'court') {
                extraCellStyle = 'word-break: break-word; line-height: 1.15;';
            } else {
                extraCellStyle = 'word-break: break-word; line-height: 1.2;';
            }

            return `<td style="border: 1px solid #cbd5e1; padding: ${cellPadding}; text-align: center; font-size: ${specificCellFontSize}; ${extraCellStyle} box-sizing: border-box; overflow: hidden;">${escaped}</td>`;
        }).join('');

        return `<tr style="background: ${rowBg};">${cellsHtml}</tr>`;
    }).join('');

    const headerHtml = visibleColumns.map(col => {
        let colW = '';
        if (col.key === 'fileNumber' || col.key === 'circuitNumber') {
            colW = 'width: 1%; white-space: nowrap;';
        } else if (col.key === 'poaNumber' || col.key === 'caseNumber' || col.key === 'clientPhone' || col.key === 'opponentPhone') {
            colW = 'width: 1%; white-space: nowrap;';
        } else {
            colW = 'white-space: nowrap;';
        }
        return `<th style="${headerCellStyle} ${colW}">${col.label}</th>`;
    }).join('');

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
async function printClientsFilesReport() {
    try {
        await __getReportsPoaDateLocaleSetting();
        const rowsData = __getReportsPoaDataForAction();
        if (!rowsData.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للطباعة', 'info');
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير التوكيلات</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsPoaDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsPoaDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                ${__buildReportsPoaDocumentTable(rowsData, { headerFontSize: '13px', cellFontSize: '12px', headerPadding: '6px 6px', cellPadding: '6px 6px' })}
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير التوكيلات - ${new Date().toLocaleDateString(__reportsPoaDateLocaleCache || 'ar-EG')}</title>
                <style>
                    @page { size: A4 portrait; margin: 10mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 0; padding: 0; }
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
        console.error('Error printing poa report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}

// -------------------------------------------------------------
// تصدير إكسيل (Excel Export)
// -------------------------------------------------------------
async function exportClientsFilesReportExcel() {
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
                toggleExportMenuPoa();
                return;
            }
        }

        await __getReportsPoaDateLocaleSetting();
        const rowsData = __getReportsPoaDataForAction();
        if (!rowsData.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للتصدير', 'info');
            toggleExportMenuPoa();
            return;
        }

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
                                <x:Name>التوكيلات</x:Name>
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
                ${__buildReportsPoaDocumentTable(rowsData, { headerFontSize: '21px', cellFontSize: '18px', headerPadding: '10px', cellPadding: '8px', tableStyle: 'border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 18px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;' })}
            </body>
            </html>
        `;

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_التوكيلات_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');
        toggleExportMenuPoa();

    } catch (error) {
        console.error('Error exporting poa report to Excel:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
}

// -------------------------------------------------------------
// تصدير PDF و WhatsApp
// -------------------------------------------------------------
async function exportClientsFilesReportPDF() {
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
                toggleExportMenuPoa();
                return;
            }
        }

        await __getReportsPoaDateLocaleSetting();
        const rowsData = __getReportsPoaDataForAction();
        if (!rowsData.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للتصدير', 'info');
            toggleExportMenuPoa();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_التوكيلات_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __generateReportsPoaPDFDocument(rowsData, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuPoa();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportClientsFilesReportWhatsApp() {
    try {
        await __getReportsPoaDateLocaleSetting();
        const rowsData = __getReportsPoaDataForAction();
        if (!rowsData.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للمشاركة', 'info');
            toggleExportMenuPoa();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_التوكيلات_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuPoa();
        const pdf = await __generateReportsPoaPDFDocument(rowsData, officeName, opt);
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
// توليد PDF متعدد الصفحات نظيف ومستقل لتقرير التوكيلات
// -------------------------------------------------------------
async function __generateReportsPoaPDFDocument(rowsData, officeName, opt) {
    if (!rowsData || rowsData.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    const ROWS_PER_PAGE = 16;
    const pages = [];
    for (let i = 0; i < rowsData.length; i += ROWS_PER_PAGE) {
        pages.push(rowsData.slice(i, i + ROWS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString(__reportsPoaDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsPoaDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;

    // بناء عناصر مستقلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pageRows, pageIdx) => {
        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير التوكيلات ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>
            ${__buildReportsPoaDocumentTable(pageRows, { isPdfExport: true })}
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
async function toggleExportMenuPoa() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-poa');
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
    const menu = document.getElementById('export-menu-poa');
    const button = document.getElementById('export-btn-poa');
    const sortMenu = document.getElementById('poa-sort-menu');
    const sortBtn = document.getElementById('poa-sort-menu-btn');
    const target = event.target;
    const clickedInsideColumnMenu = target && typeof target.closest === 'function' ? target.closest('[id^="reports-poa-column-menu-"]') : null;
    const clickedColumnToggle = target && typeof target.closest === 'function' ? target.closest('.reports-poa-column-toggle-btn') : null;
    const clickedInsideSortMenu = target && typeof target.closest === 'function' ? target.closest('#poa-sort-menu') : null;

    if (menu && button && !menu.contains(target) && !button.contains(target)) {
        menu.classList.add('hidden');
    }

    if (sortMenu && sortBtn && !clickedInsideSortMenu && !sortBtn.contains(target)) {
        sortMenu.classList.add('hidden');
    }

    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsPoaColumnMenus();
    }
});

// إغلاق القوائم عند الضغط على Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeReportsPoaColumnMenus();
        const menu = document.getElementById('export-menu-poa');
        if (menu) menu.classList.add('hidden');
        const sortMenu = document.getElementById('poa-sort-menu');
        if (sortMenu) sortMenu.classList.add('hidden');
    }
});

// إغلاق القوائم عند تغيير أبعاد الشاشة
window.addEventListener('resize', function () {
    closeReportsPoaColumnMenus();
});

// توافقية عامة مع أي استدعاءات سابقة
if (typeof window !== 'undefined') {
    window.toggleExportMenuPoa = toggleExportMenuPoa;
    window.toggleExportMenu = toggleExportMenuPoa;
    window.exportClientsFilesReport = exportClientsFilesReportExcel;
    window.exportClientsFilesReportExcel = exportClientsFilesReportExcel;
    window.exportClientsFilesReportPDF = exportClientsFilesReportPDF;
    window.exportClientsFilesReportWhatsApp = exportClientsFilesReportWhatsApp;
    window.printClientsFilesReport = printClientsFilesReport;
    window.updateClientsFilesReportContent = updateClientsFilesReportContent;
    window.toggleClientsFilesSort = toggleClientsFilesSort;
    window.filterClientsFilesReport = filterClientsFilesReport;
    window.setPoaSortOrder = setPoaSortOrder;
    window.togglePoaSortMenu = togglePoaSortMenu;
}

