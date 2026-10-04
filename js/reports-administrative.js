/**
 * تقارير المهام (الأعمال الإدارية) - بنظام الأعمدة المرنة والديناميكية
 * متطابقة 100% مع معمارية تقارير القضايا (reports-cases.js) سواء لنسخة الكمبيوتر أو الموبايل.
 */

let globalAdministrativeData = [];
let globalClientsData = [];

let __reportsAdministrativeAllData = [];
let __reportsAdministrativeAllClients = [];
let __reportsAdministrativeCurrentData = [];
let __reportsAdministrativeCurrentClients = [];
let __reportsAdministrativeLastSearchTerm = '';
let __reportsAdministrativeTimeFilterMode = 'all'; // all | today | week | month
let currentAdministrativeSortOrder = 'desc'; // desc | asc
let currentAdministrativeStatusFilter = 'all'; // all | completed | pending | overdue

let __reportsAdministrativeChunkTimer = null;
let __reportsAdministrativeDateLocaleCache = null;

async function __getReportsAdministrativeDateLocaleSetting() {
    if (__reportsAdministrativeDateLocaleCache) return __reportsAdministrativeDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsAdministrativeDateLocaleCache = locale;
    return locale;
}

function __parseReportsAdministrativeDateString(dateStr) {
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

function __formatReportsAdministrativeDateForDisplay(dateStr) {
    try {
        if (!dateStr) return '-';
        const d = __parseReportsAdministrativeDateString(dateStr);
        if (!d) return (dateStr || '-');
        return d.toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || '-');
    }
}

function __escapeReportsAdministrativeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function __normalizeReportsAdministrativeCellValue(value, fallback = '-') {
    const text = String(value == null ? '' : value).trim();
    return text !== '' ? text : fallback;
}

function __reportsAdministrativeNormalizeSearchValue(value) {
    const s = window.normalizeDigits ? window.normalizeDigits(value) : String(value || '');
    return s
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ')
        .trim();
}

function __isAdministrativeCompleted(work) {
    if (!work) return false;
    const c = work.completed;
    return c === true || c === 1 || c === '1' || c === 'true';
}

function __getReportsAdministrativeWorkTimestamp(work) {
    if (!work) return 0;
    const d = __parseReportsAdministrativeDateString(work.dueDate || work.createdAt);
    if (d) return d.getTime();
    if (work.createdAt) {
        const t = new Date(work.createdAt).getTime();
        if (Number.isFinite(t)) return t;
    }
    const idNum = Number(work.id);
    return Number.isFinite(idNum) ? idNum : 0;
}

// -------------------------------------------------------------
// تعريفات الأعمدة المرنة ونظام الإظهار والإخفاء (Dynamic Columns)
// -------------------------------------------------------------
const __reportsAdministrativeColumnsStorageKey = 'reportsAdministrativeVisibleColumns';
const __reportsAdministrativeDefaultVisibleColumns = ['clientName', 'task', 'status', 'dueDate', 'assignedTo'];

const __reportsAdministrativeColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'task', group: 'tasks', label: 'المهمة', icon: 'ri-task-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'status', group: 'tasks', label: 'الحالة', icon: 'ri-checkbox-circle-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'dueDate', group: 'tasks', label: 'تاريخ الإنجاز', icon: 'ri-calendar-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'assignedTo', group: 'tasks', label: 'المكلف بالعمل', icon: 'ri-user-star-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'location', group: 'tasks', label: 'مكان التنفيذ', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'notes', group: 'tasks', label: 'الملاحظات', icon: 'ri-sticky-note-line', cellClass: 'whitespace-normal break-words' }
];

let __reportsAdministrativeVisibleColumnKeysCache = null;

function __getReportsAdministrativeVisibleColumnKeys() {
    if (Array.isArray(__reportsAdministrativeVisibleColumnKeysCache) && __reportsAdministrativeVisibleColumnKeysCache.length) {
        return [...__reportsAdministrativeVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsAdministrativeColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const validKeys = __reportsAdministrativeColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                __reportsAdministrativeVisibleColumnKeysCache = filtered;
                return [...__reportsAdministrativeVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsAdministrativeVisibleColumnKeysCache = [...__reportsAdministrativeDefaultVisibleColumns];
    return [...__reportsAdministrativeVisibleColumnKeysCache];
}

function __setReportsAdministrativeVisibleColumnKeys(keys) {
    const validKeys = __reportsAdministrativeColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsAdministrativeVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsAdministrativeDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsAdministrativeColumnsStorageKey, JSON.stringify(__reportsAdministrativeVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsAdministrativeVisibleColumns() {
    const visibleKeys = __getReportsAdministrativeVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsAdministrativeColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

function __getReportsAdministrativeClientsMap() {
    const clients = Array.isArray(__reportsAdministrativeAllClients) ? __reportsAdministrativeAllClients : [];
    const byId = new Map();
    const byName = new Map();
    clients.forEach(c => {
        if (c && c.id != null) byId.set(c.id, c);
        if (c && c.name) byName.set(String(c.name).trim(), c);
    });
    return { byId, byName };
}

function __getReportsAdministrativeRowData(work, clientsMaps) {
    const maps = clientsMaps || __getReportsAdministrativeClientsMap();
    let client = work.clientId ? maps.byId?.get(work.clientId) : null;
    if (!client && work.clientName) {
        client = maps.byName?.get(String(work.clientName).trim()) || null;
    }
    const clientNameVal = (client && client.name) || work.clientName || (work.clientId ? 'غير محدد' : 'عام');
    const clientPhoneVal = (client && (client.phone || client.mobile)) || (work.clientPhone || '');

    // تحديد الحالة
    let statusLabel = 'قيد التنفيذ';
    let isCompleted = __isAdministrativeCompleted(work);
    let isOverdue = false;

    if (isCompleted) {
        statusLabel = 'مكتمل';
    } else if (work.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = __parseReportsAdministrativeDateString(work.dueDate);
        if (due && due < today) {
            statusLabel = 'متأخر';
            isOverdue = true;
        }
    }

    const taskVal = (work.task && String(work.task).trim()) ? String(work.task).trim() : (work.title || work.description || '');
    const dueDateVal = work.dueDate ? __formatReportsAdministrativeDateForDisplay(work.dueDate) : '-';

    return {
        rawWork: work,
        clientName: __normalizeReportsAdministrativeCellValue(clientNameVal, 'عام'),
        clientPhone: __normalizeReportsAdministrativeCellValue(clientPhoneVal, '-'),
        task: __normalizeReportsAdministrativeCellValue(taskVal, '-'),
        status: statusLabel,
        isCompleted: isCompleted,
        isOverdue: isOverdue,
        dueDate: dueDateVal,
        assignedTo: __normalizeReportsAdministrativeCellValue(work.assignedTo || work.lawyer, '-'),
        location: __normalizeReportsAdministrativeCellValue(work.location, '-'),
        notes: __normalizeReportsAdministrativeCellValue(work.notes, '-')
    };
}

// -------------------------------------------------------------
// قوائم التحكم في الأعمدة المنسدلة من الرأس (In-Header Dropdowns)
// -------------------------------------------------------------
function __buildReportsAdministrativeColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsAdministrativeVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsAdministrativeColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsAdministrativeColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];

    const items = sameGroupColumns.length ? sameGroupColumns.map(col => `
        <button type="button" onclick="toggleReportsAdministrativeColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-indigo-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;

    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;

    return `
        <div id="reports-admin-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-indigo-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-indigo-50 border-b border-indigo-100 text-right shrink-0">
                    <div class="text-xs font-bold text-indigo-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsAdministrativeColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-indigo-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-80">${items}</div>
            <div class="border-t border-indigo-100 shrink-0"></div>
            <button type="button" onclick="resetReportsAdministrativeColumns(event)" class="w-full flex items-center gap-2 px-3 py-2.5 text-right text-indigo-700 hover:bg-indigo-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">إرجاع الافتراضي</span>
            </button>
        </div>
    `;
}

function closeReportsAdministrativeColumnMenus() {
    document.querySelectorAll('[id^="reports-admin-column-menu-"]').forEach(menu => {
        try { menu.classList.add('hidden'); } catch (_) { }
    });
}

function __cleanupDetachedAdministrativeColumnMenus() {
    document.querySelectorAll('body > [id^="reports-admin-column-menu-"]').forEach(menu => {
        try { menu.remove(); } catch (_) { }
    });
}

function __positionReportsAdministrativeColumnMenu(menu, anchorEl) {
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

function toggleReportsAdministrativeColumnMenu(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-admin-column-menu-${columnKey}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsAdministrativeColumnMenus();
    if (!shouldOpen) return;

    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsAdministrativeColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function toggleReportsAdministrativeColumnVisibility(event, columnKey, anchorColumnKey = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsAdministrativeColumnMenus();
    const currentKeys = __getReportsAdministrativeVisibleColumnKeys();
    const currentSet = new Set(currentKeys);
    if (currentSet.has(columnKey) && currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    if (currentSet.has(columnKey)) {
        __setReportsAdministrativeVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
        __renderReportsAdministrativeCurrentTable();
        return;
    }
    const nextKeys = [...currentKeys];
    const anchorIndex = anchorColumnKey ? nextKeys.indexOf(anchorColumnKey) : -1;
    if (anchorIndex !== -1) nextKeys.splice(anchorIndex + 1, 0, columnKey);
    else nextKeys.push(columnKey);
    __setReportsAdministrativeVisibleColumnKeys(nextKeys);
    __renderReportsAdministrativeCurrentTable();
}

function hideReportsAdministrativeColumn(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsAdministrativeColumnMenus();
    const currentKeys = __getReportsAdministrativeVisibleColumnKeys();
    if (!currentKeys.includes(columnKey)) return;
    if (currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    __setReportsAdministrativeVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
    __renderReportsAdministrativeCurrentTable();
}

function resetReportsAdministrativeColumns(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsAdministrativeColumnMenus();
    __setReportsAdministrativeVisibleColumnKeys(__reportsAdministrativeDefaultVisibleColumns);
    __renderReportsAdministrativeCurrentTable();
}

let __reportsAdministrativeStatsExpanded = false;

function toggleReportsAdministrativeStats(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    __reportsAdministrativeStatsExpanded = !__reportsAdministrativeStatsExpanded;
    const container = document.getElementById('admin-stats-collapse-container');
    const arrow = document.getElementById('admin-stats-toggle-arrow');

    if (container) {
        if (__reportsAdministrativeStatsExpanded) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }
    if (arrow) {
        arrow.className = __reportsAdministrativeStatsExpanded ? 'ri-arrow-up-s-line text-sm text-indigo-700' : 'ri-arrow-down-s-line text-sm text-indigo-700';
    }
}

function __renderReportsAdministrativeCurrentTable() {
    const reportContent = document.getElementById('administrative-report-content');
    if (!reportContent) return;
    closeReportsAdministrativeColumnMenus();
    const { administrative, clients } = __getReportsAdministrativeDataForAction();
    reportContent.innerHTML = generateAdministrativeReportHTML(administrative, clients, currentAdministrativeSortOrder, currentAdministrativeStatusFilter);
}

// -------------------------------------------------------------
// جلب البيانات والتهيئة الرئيسية
// -------------------------------------------------------------
function __getReportsAdministrativeDataForAction() {
    try {
        if (Array.isArray(__reportsAdministrativeCurrentData)) {
            return {
                administrative: __reportsAdministrativeCurrentData,
                clients: Array.isArray(__reportsAdministrativeCurrentClients) ? __reportsAdministrativeCurrentClients : __reportsAdministrativeAllClients
            };
        }
    } catch (e) { }
    return {
        administrative: Array.isArray(__reportsAdministrativeAllData) ? __reportsAdministrativeAllData : [],
        clients: Array.isArray(__reportsAdministrativeAllClients) ? __reportsAdministrativeAllClients : []
    };
}

function __reportsAdministrativeIsInTimeFilter(work) {
    if (__reportsAdministrativeTimeFilterMode === 'all') return true;

    const dateStr = work.dueDate || work.createdAt;
    const d = __parseReportsAdministrativeDateString(dateStr);
    if (!d) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sd = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (__reportsAdministrativeTimeFilterMode === 'today') {
        return sd.getFullYear() === today.getFullYear() && sd.getMonth() === today.getMonth() && sd.getDate() === today.getDate();
    }

    if (__reportsAdministrativeTimeFilterMode === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return sd.getFullYear() === tomorrow.getFullYear() && sd.getMonth() === tomorrow.getMonth() && sd.getDate() === tomorrow.getDate();
    }

    if (__reportsAdministrativeTimeFilterMode === 'week' || __reportsAdministrativeTimeFilterMode === 'current-week') {
        const day = today.getDay(); // 0 is Sun, 6 is Sat
        const diff = (day === 6) ? 0 : (day + 1);
        const satCurrent = new Date(today);
        satCurrent.setDate(today.getDate() - diff);
        const friCurrent = new Date(satCurrent);
        friCurrent.setDate(satCurrent.getDate() + 6);
        return sd >= satCurrent && sd <= friCurrent;
    }

    if (__reportsAdministrativeTimeFilterMode === 'month') {
        return sd.getFullYear() === today.getFullYear() && sd.getMonth() === today.getMonth();
    }

    return true;
}

function __reportsAdministrativeGetViewModeLabel() {
    if (__reportsAdministrativeTimeFilterMode === 'today') return 'اليوم';
    if (__reportsAdministrativeTimeFilterMode === 'tomorrow') return 'الغد';
    if (__reportsAdministrativeTimeFilterMode === 'week' || __reportsAdministrativeTimeFilterMode === 'current-week') return 'الأسبوع الحالي';
    if (__reportsAdministrativeTimeFilterMode === 'month') return 'الشهر الحالي';
    return 'كل المهام';
}

function __reportsAdministrativeGetSortLabel() {
    return currentAdministrativeSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';
}

function __updateAdminViewMenuButtonLabel() {
    try {
        const btn = document.getElementById('admin-view-menu-btn');
        if (!btn) return;
        const textEl = btn.querySelector('[data-admin-view-label]');
        if (!textEl) return;
        textEl.textContent = 'فرز';
    } catch (_) { }
}

function __reportsAdministrativeApplyFiltersAndRender() {
    const base = Array.isArray(__reportsAdministrativeAllData) ? __reportsAdministrativeAllData : [];
    const clients = Array.isArray(__reportsAdministrativeAllClients) ? __reportsAdministrativeAllClients : [];
    const clientMaps = __getReportsAdministrativeClientsMap();

    // 1. فلترة الحالة (Status)
    let filtered = base;
    if (currentAdministrativeStatusFilter === 'completed') {
        filtered = filtered.filter(w => __isAdministrativeCompleted(w));
    } else if (currentAdministrativeStatusFilter === 'pending') {
        filtered = filtered.filter(w => !__isAdministrativeCompleted(w));
    } else if (currentAdministrativeStatusFilter === 'overdue') {
        filtered = filtered.filter(w => {
            if (__isAdministrativeCompleted(w) || !w.dueDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = __parseReportsAdministrativeDateString(w.dueDate);
            return due && due < today;
        });
    }

    // 2. فلترة الوقت (Time filter)
    filtered = filtered.filter(__reportsAdministrativeIsInTimeFilter);

    // 3. فلترة البحث (Search Term)
    const term = __reportsAdministrativeNormalizeSearchValue(__reportsAdministrativeLastSearchTerm);
    if (term) {
        const visibleCols = __getReportsAdministrativeVisibleColumns();
        const visibleKeys = visibleCols.map(c => c.key);
        filtered = filtered.filter(work => {
            const rowData = __getReportsAdministrativeRowData(work, clientMaps);
            const inVisible = visibleKeys.some(key => __reportsAdministrativeNormalizeSearchValue(rowData[key]).includes(term));
            if (inVisible) return true;
            // بحث إضافي في الحقول الجوهرية (المهمة، الموكل، الملاحظات) لراحة المستخدم
            const extra = [rowData.clientName, rowData.task, rowData.notes, rowData.location, rowData.assignedTo];
            return extra.some(v => __reportsAdministrativeNormalizeSearchValue(v).includes(term));
        });
    }

    // 4. الترتيب (Sorting)
    filtered.sort((a, b) => {
        const timeA = __getReportsAdministrativeWorkTimestamp(a);
        const timeB = __getReportsAdministrativeWorkTimestamp(b);
        return currentAdministrativeSortOrder === 'desc' ? (timeB - timeA) : (timeA - timeB);
    });

    __reportsAdministrativeCurrentData = filtered;
    __reportsAdministrativeCurrentClients = clients;

    // تحديث كروت احصائيات النشطة
    document.querySelectorAll('.administrative-stats-grid > div').forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        if (cardStatus === currentAdministrativeStatusFilter) {
            card.style.borderWidth = '3px';
            card.style.transform = 'scale(1.03)';
        } else {
            card.style.borderWidth = '2px';
            card.style.transform = 'scale(1)';
        }
    });

    const reportContent = document.getElementById('administrative-report-content');
    if (reportContent) {
        __cleanupDetachedAdministrativeColumnMenus();
        reportContent.innerHTML = generateAdministrativeReportHTML(filtered, clients, currentAdministrativeSortOrder, currentAdministrativeStatusFilter);
    }

    try {
        if (__reportsAdministrativeTimeFilterMode !== 'all' && typeof showToast === 'function') {
            showToast(`عرض ${filtered.length} مهمة (${__reportsAdministrativeGetViewModeLabel()})`, 'info');
        }
    } catch (_) { }
}

async function updateAdministrativeReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    try {
        await __getReportsAdministrativeDateLocaleSetting();

        const [administrative, clients] = await Promise.all([
            typeof getAllAdministrative === 'function' ? getAllAdministrative() : getAll('administrative'),
            typeof getAllClients === 'function' ? getAllClients() : getAll('clients')
        ]);

        globalAdministrativeData = administrative || [];
        globalClientsData = clients || [];

        __reportsAdministrativeAllData = Array.isArray(administrative) ? administrative : [];
        __reportsAdministrativeAllClients = Array.isArray(clients) ? clients : [];
        __reportsAdministrativeLastSearchTerm = '';
        currentAdministrativeStatusFilter = 'all';
        __reportsAdministrativeTimeFilterMode = 'all';
        currentAdministrativeSortOrder = 'desc';

        __reportsAdministrativeCurrentData = [...__reportsAdministrativeAllData];
        __reportsAdministrativeCurrentClients = [...__reportsAdministrativeAllClients];
        __reportsAdministrativeStatsExpanded = false;

        const colors = { bg: '#6366f1', bgHover: '#4f46e5', bgLight: '#f5f3ff', text: '#6366f1', textLight: '#a5b4fc' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="administrative-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث في ${reportName}..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <!-- زر احصائيات -->
                        <button id="admin-stats-toggle-btn" onclick="toggleReportsAdministrativeStats(event)" class="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-xs md:text-sm font-semibold">
                            <i class="ri-bar-chart-2-line text-indigo-600 text-sm"></i>
                            <span>احصائيات</span>
                            <i id="admin-stats-toggle-arrow" class="${__reportsAdministrativeStatsExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-sm text-indigo-700"></i>
                        </button>
                        <!-- قائمة الفلترة والترتيب -->
                        <div class="relative">
                            <button id="admin-view-menu-btn" onclick="toggleAdminViewMenu()" class="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-admin-view-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="admin-view-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 250px; width: 260px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">فلترة المهام</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 6px;">
                                    <button type="button" data-time-mode="all" onclick="setAdminTimeFilterMode('all')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; grid-column: span 2; background-color: #ffffff;">كل المهام</button>
                                    <button type="button" data-time-mode="today" onclick="setAdminTimeFilterMode('today')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">اليوم</button>
                                    <button type="button" data-time-mode="tomorrow" onclick="setAdminTimeFilterMode('tomorrow')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الغد</button>
                                    <button type="button" data-time-mode="current-week" onclick="setAdminTimeFilterMode('current-week')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأسبوع الحالي</button>
                                    <button type="button" data-time-mode="month" onclick="setAdminTimeFilterMode('month')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الشهر الحالي</button>
                                </div>
                                <div style="border-top: 1px solid #cbd5e1; margin: 6px 0;"></div>
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">الترتيب</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-sort-mode="desc" onclick="setAdminSortOrder('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأحدث</button>
                                    <button type="button" data-sort-mode="asc" onclick="setAdminSortOrder('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأقدم</button>
                                </div>
                            </div>
                        </div>

                        <!-- قائمة التصدير -->
                        <div class="relative">
                            <button onclick="toggleExportMenuAdmin()" id="export-btn-admin" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-admin" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportAdministrativeReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportAdministrativeReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportAdministrativeReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>

                        <!-- زر الطباعة -->
                        <button onclick="printAdministrativeReport()" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="administrative-report-content">
                    ${generateAdministrativeReportHTML(__reportsAdministrativeCurrentData, __reportsAdministrativeCurrentClients, currentAdministrativeSortOrder, currentAdministrativeStatusFilter)}
                </div>
            </div>
        `;

        const searchEl = document.getElementById('administrative-search');
        if (searchEl) {
            let debounceT;
            searchEl.addEventListener('input', function (e) {
                clearTimeout(debounceT);
                debounceT = setTimeout(() => {
                    __reportsAdministrativeLastSearchTerm = e.target.value;
                    __reportsAdministrativeApplyFiltersAndRender();
                }, 150);
            });
        }

    } catch (error) {
        console.error('Error loading administrative data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات المهام</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// توليد واجهة التقرير وجدول المهام (HTML Generator)
// -------------------------------------------------------------
function generateAdministrativeReportHTML(administrative, clients, sortOrder = 'desc', statusFilter = 'all') {
    __cleanupDetachedAdministrativeColumnMenus();
    if (__reportsAdministrativeChunkTimer) {
        cancelAnimationFrame(__reportsAdministrativeChunkTimer);
        __reportsAdministrativeChunkTimer = null;
    }

    const totalWorks = __reportsAdministrativeAllData.length;
    const completedWorks = __reportsAdministrativeAllData.filter(work => __isAdministrativeCompleted(work)).length;
    const pendingWorks = __reportsAdministrativeAllData.filter(work => !__isAdministrativeCompleted(work)).length;
    const overdueWorks = __reportsAdministrativeAllData.filter(work => {
        if (__isAdministrativeCompleted(work) || !work.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = __parseReportsAdministrativeDateString(work.dueDate);
        return due && due < today;
    }).length;

    const statsGridHtml = `
        <style>
            @media (max-width:768px){
                #report-content .administrative-stats-grid{
                    display:grid !important;
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    gap: 8px !important;
                }
            }
            @media (min-width:769px){
                #report-content .administrative-stats-grid{
                    display:grid !important;
                    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                    gap: 16px !important;
                }
            }
        </style>
        <div class="administrative-stats-grid mb-4">
            <div onclick="filterAdministrativeByStatus('all')" class="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-xl border-2 border-indigo-200 cursor-pointer hover:shadow-lg transition-all duration-200 ${statusFilter === 'all' ? 'border-indigo-600 scale-[1.02]' : ''}" data-status="all">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <i class="ri-briefcase-line text-white text-lg"></i>
                    </div>
                    <div>
                        <p class="text-xs text-indigo-600 font-medium">إجمالي الأعمال</p>
                        <p class="text-lg font-bold text-indigo-800">${totalWorks}</p>
                    </div>
                </div>
            </div>
            
            <div onclick="filterAdministrativeByStatus('completed')" class="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border-2 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200 ${statusFilter === 'completed' ? 'border-green-600 scale-[1.02]' : ''}" data-status="completed">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                        <i class="ri-checkbox-circle-line text-white text-lg"></i>
                    </div>
                    <div>
                        <p class="text-xs text-green-600 font-medium">مكتملة</p>
                        <p class="text-lg font-bold text-green-800">${completedWorks}</p>
                    </div>
                </div>
            </div>
            
            <div onclick="filterAdministrativeByStatus('pending')" class="bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-xl border-2 border-amber-200 cursor-pointer hover:shadow-lg transition-all duration-200 ${statusFilter === 'pending' ? 'border-amber-500 scale-[1.02]' : ''}" data-status="pending">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                        <i class="ri-time-line text-white text-lg"></i>
                    </div>
                    <div>
                        <p class="text-xs text-amber-600 font-medium">قيد التنفيذ</p>
                        <p class="text-lg font-bold text-amber-800">${pendingWorks}</p>
                    </div>
                </div>
            </div>
            
            <div onclick="filterAdministrativeByStatus('overdue')" class="bg-gradient-to-br from-red-50 to-rose-50 p-3 rounded-xl border-2 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-200 ${statusFilter === 'overdue' ? 'border-red-600 scale-[1.02]' : ''}" data-status="overdue">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-md">
                        <i class="ri-alarm-warning-line text-white text-lg"></i>
                    </div>
                    <div>
                        <p class="text-xs text-red-600 font-medium">متأخرة</p>
                        <p class="text-lg font-bold text-red-800">${overdueWorks}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (!administrative || administrative.length === 0) {
        return `
            <div class="administrative-report-container flex-1 min-h-0 flex flex-col overflow-y-auto p-0" style="height: 100%; position: relative;">
                <div id="admin-stats-collapse-container" class="${__reportsAdministrativeStatsExpanded ? '' : 'hidden'} p-2 border-b border-gray-100 bg-gray-50/50 transition-all duration-300 shrink-0">
                    ${statsGridHtml}
                </div>
                <div class="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
                    <div class="mb-4">
                        <i class="ri-briefcase-line text-7xl text-indigo-200"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2 text-gray-700">لا توجد بيانات</h3>
                    <p class="text-gray-400 text-sm">لم يتم العثور على أعمال إدارية مطابقة للتصفية</p>
                </div>
            </div>
        `;
    }

    const visibleColumns = __getReportsAdministrativeVisibleColumns();
    const columnWidth = (100 / Math.max(visibleColumns.length, 1)).toFixed(2);
    const clientMaps = __getReportsAdministrativeClientsMap();

    const buildRowHtml = (work, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-indigo-50/50 to-blue-50/30' : 'bg-white';
        const rowData = __getReportsAdministrativeRowData(work, clientMaps);

        const cellsHtml = visibleColumns.map(col => {
            const value = rowData[col.key];

            if (col.key === 'status') {
                let statusIcon = '<i class="ri-time-line text-amber-500"></i>';
                let statusClass = 'text-amber-700 bg-amber-50 border-amber-200';
                if (rowData.isCompleted) {
                    statusIcon = '<i class="ri-checkbox-circle-fill text-green-600"></i>';
                    statusClass = 'text-green-700 bg-green-50 border-green-200';
                } else if (rowData.isOverdue) {
                    statusIcon = '<i class="ri-alarm-warning-fill text-red-600"></i>';
                    statusClass = 'text-red-700 bg-red-50 border-red-200';
                }
                return `
                    <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-middle">
                        <div class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border text-xs md:text-sm font-bold ${statusClass}">
                            ${statusIcon}
                            <span>${value}</span>
                        </div>
                    </td>
                `;
            }

            const escaped = __escapeReportsAdministrativeHtml(value);
            return `
                <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-middle">
                    <div class="font-bold text-sm md:text-base text-gray-800 hover:text-indigo-700 transition-colors duration-200 ${col.cellClass}" title="${escaped}">
                        ${escaped}
                    </div>
                </td>
            `;
        }).join('');

        return `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-indigo-100 hover:to-blue-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = administrative.slice(0, initialBatchSize).map((w, i) => buildRowHtml(w, i)).join('');

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; width: ${columnWidth}%; min-width: 150px; background-color: #6366f1 !important; color: white !important; border-color: #4f46e5 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #4f46e5;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsAdministrativeColumnMenu(event, '${col.key}')" class="reports-admin-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsAdministrativeColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    if (administrative.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('administrative-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, administrative.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(administrative[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < administrative.length) {
                __reportsAdministrativeChunkTimer = requestAnimationFrame(appendNextChunk);
            } else {
                __reportsAdministrativeChunkTimer = null;
            }
        };
        __reportsAdministrativeChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    return `
        <div class="administrative-report-container flex-1 min-h-0 flex flex-col p-0" style="height: 100%; position: relative;">
            <div id="admin-stats-collapse-container" class="${__reportsAdministrativeStatsExpanded ? '' : 'hidden'} p-2 border-b border-gray-100 bg-gray-50/50 transition-all duration-300 shrink-0">
                ${statsGridHtml}
            </div>
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; table-layout: fixed; min-width: ${visibleColumns.length * 150}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #6366f1 !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="administrative-table-body">
                        ${initialRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// -------------------------------------------------------------
// التحكم في الفرز والفلترة من القوائم العلوية
// -------------------------------------------------------------
function __reportsAdministrativeUpdateActiveTiles() {
    try {
        const timeButtons = document.querySelectorAll('#admin-view-menu [data-time-mode]');
        timeButtons.forEach(btn => {
            const mode = btn.getAttribute('data-time-mode');
            const isActive = (mode === __reportsAdministrativeTimeFilterMode) ||
                (mode === 'current-week' && __reportsAdministrativeTimeFilterMode === 'week') ||
                (mode === 'week' && __reportsAdministrativeTimeFilterMode === 'current-week');
            if (isActive) {
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

        const sortButtons = document.querySelectorAll('#admin-view-menu [data-sort-mode]');
        sortButtons.forEach(btn => {
            const mode = btn.getAttribute('data-sort-mode');
            if (mode === currentAdministrativeSortOrder) {
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

function toggleAdminViewMenu() {
    try {
        const menu = document.getElementById('admin-view-menu');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            __reportsAdministrativeUpdateActiveTiles();
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    } catch (_) { }
}

function setAdminTimeFilterMode(mode) {
    const m = String(mode || '').trim();
    __reportsAdministrativeTimeFilterMode = (m === 'today' || m === 'tomorrow' || m === 'week' || m === 'current-week' || m === 'month') ? m : 'all';
    __updateAdminViewMenuButtonLabel();
    __reportsAdministrativeUpdateActiveTiles();
    __reportsAdministrativeApplyFiltersAndRender();
    const menu = document.getElementById('admin-view-menu');
    if (menu) menu.classList.add('hidden');
}

function setAdminSortOrder(mode) {
    const m = String(mode || '').trim();
    currentAdministrativeSortOrder = (m === 'asc') ? 'asc' : 'desc';
    __updateAdminViewMenuButtonLabel();
    __reportsAdministrativeUpdateActiveTiles();
    __reportsAdministrativeApplyFiltersAndRender();
    const menu = document.getElementById('admin-view-menu');
    if (menu) menu.classList.add('hidden');
}

async function toggleAdministrativeSort() {
    currentAdministrativeSortOrder = currentAdministrativeSortOrder === 'desc' ? 'asc' : 'desc';
    __updateAdminViewMenuButtonLabel();
    __reportsAdministrativeApplyFiltersAndRender();
}

function filterAdministrativeReport(searchTerm, administrative, clients) {
    __reportsAdministrativeLastSearchTerm = String(searchTerm || '');
    __reportsAdministrativeApplyFiltersAndRender();
}

async function filterAdministrativeByStatus(status) {
    if (currentAdministrativeStatusFilter === status && status !== 'all') {
        currentAdministrativeStatusFilter = 'all';
    } else {
        currentAdministrativeStatusFilter = status;
    }
    __reportsAdministrativeApplyFiltersAndRender();
}

// -------------------------------------------------------------
// جدول المستندات للطباعة والتصدير (Excel & PDF & Print)
// -------------------------------------------------------------
function __buildReportsAdministrativeDocumentTable(administrativeData, clientsData, options = {}) {
    const visibleColumns = __getReportsAdministrativeVisibleColumns();
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
    const headerCellStyle = `background-color: #6366f1; color: white; padding: ${headerPadding}; text-align: center; border: 1px solid #4f46e5; font-weight: bold; font-size: ${headerFontSize}; white-space: nowrap; box-sizing: border-box;`;

    const clientsList = Array.isArray(clientsData) ? clientsData : [];
    const clientMaps = {
        byId: new Map(clientsList.map(c => [c.id, c])),
        byName: new Map()
    };
    clientsList.forEach(c => {
        if (c && c.name) clientMaps.byName.set(String(c.name).trim(), c);
    });

    const rowsHtml = (Array.isArray(administrativeData) ? administrativeData : []).map((work, index) => {
        const rowData = __getReportsAdministrativeRowData(work, clientMaps);
        const rowBg = index % 2 === 0 ? '#f5f3ff' : '#ffffff';

        const cellsHtml = visibleColumns.map(col => {
            let val = rowData[col.key];
            if (isPdfExport && val) {
                val = String(val).replace(/\s*\/\s*/g, ' - ');
            }
            const escaped = __escapeReportsAdministrativeHtml(val);

            // تخصيص حجم النص وخصائص العرض بدقة حسب طبيعة الخلية
            let specificCellFontSize = cellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone';
            const isDateCol = col.key === 'dueDate' || col.key === 'status';

            if (isPhoneCol) {
                if (colCount >= 6) {
                    specificCellFontSize = (parseFloat(cellFontSize) * 0.95).toFixed(1) + 'px';
                }
                extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
            } else if (isDateCol) {
                extraCellStyle = 'white-space: nowrap;';
            } else {
                extraCellStyle = 'word-break: break-word; line-height: 1.15;';
            }

            if (col.key === 'status') {
                const color = rowData.isCompleted ? '#16a34a' : (rowData.isOverdue ? '#dc2626' : '#d97706');
                return `<td style="border: 1px solid #cbd5e1; padding: ${cellPadding}; text-align: center; font-size: ${specificCellFontSize}; ${extraCellStyle} color: ${color}; font-weight: bold; box-sizing: border-box; overflow: hidden;">${escaped}</td>`;
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
async function printAdministrativeReport() {
    try {
        await __getReportsAdministrativeDateLocaleSetting();
        const { administrative, clients } = __getReportsAdministrativeDataForAction();
        if (!administrative.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للطباعة', 'info');
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #4338ca; font-size: 14px; font-weight: bold; text-align: right;">تقرير المهام</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAdministrativeDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                ${__buildReportsAdministrativeDocumentTable(administrative, clients, { headerFontSize: '13px', cellFontSize: '12px', headerPadding: '6px 6px', cellPadding: '6px 6px' })}
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير المهام - ${new Date().toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG')}</title>
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
        console.error('Error printing administrative report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}

// -------------------------------------------------------------
// تصدير إكسيل (Excel Export)
// -------------------------------------------------------------
async function exportAdministrativeReport() {
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
                toggleExportMenuAdmin();
                return;
            }
        }

        await __getReportsAdministrativeDateLocaleSetting();
        const { administrative, clients } = __getReportsAdministrativeDataForAction();

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
                                <x:Name>المهام</x:Name>
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
                ${__buildReportsAdministrativeDocumentTable(administrative, clients, { headerFontSize: '21px', cellFontSize: '18px', headerPadding: '10px', cellPadding: '8px', tableStyle: 'border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 18px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;' })}
            </body>
            </html>
        `;

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_المهام_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');
        toggleExportMenuAdmin();

    } catch (error) {
        console.error('Error exporting administrative report:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
}

async function exportAdministrativeReportExcel() {
    return await exportAdministrativeReport();
}

// -------------------------------------------------------------
// تصدير PDF و WhatsApp
// -------------------------------------------------------------
async function exportAdministrativeReportPDF() {
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
                toggleExportMenuAdmin();
                return;
            }
        }

        await __getReportsAdministrativeDateLocaleSetting();
        const { administrative, clients } = __getReportsAdministrativeDataForAction();
        if (!administrative.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للتصدير', 'info');
            toggleExportMenuAdmin();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_المهام_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __generateReportsAdministrativePDFDocument(administrative, clients, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuAdmin();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportAdministrativeReportWhatsApp() {
    try {
        await __getReportsAdministrativeDateLocaleSetting();
        const { administrative, clients } = __getReportsAdministrativeDataForAction();
        if (!administrative.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للمشاركة', 'info');
            toggleExportMenuAdmin();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_المهام_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuAdmin();
        const pdf = await __generateReportsAdministrativePDFDocument(administrative, clients, officeName, opt);
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
// توليد PDF متعدد الصفحات نظيف ومستقل لتقرير الأعمال الإدارية والمهام
// -------------------------------------------------------------
async function __generateReportsAdministrativePDFDocument(administrative, clients, officeName, opt) {
    if (!administrative || administrative.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    const ROWS_PER_PAGE = 16;
    const pages = [];
    for (let i = 0; i < administrative.length; i += ROWS_PER_PAGE) {
        pages.push(administrative.slice(i, i + ROWS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsAdministrativeDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;

    // بناء عناصر مستقلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pageAdmin, pageIdx) => {
        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #4338ca; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير المهام ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>
            ${__buildReportsAdministrativeDocumentTable(pageAdmin, clients, { isPdfExport: true })}
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
async function toggleExportMenuAdmin() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-admin');
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

// مستمع النقر العام لإغلاق القوائم المنسدلة عند النقر بالخارج (مطابق لـ reports-cases.js)
document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu-admin');
    const button = document.getElementById('export-btn-admin');
    const viewMenu = document.getElementById('admin-view-menu');
    const viewBtn = document.getElementById('admin-view-menu-btn');
    const target = event.target;
    const clickedInsideColumnMenu = target && typeof target.closest === 'function' ? target.closest('[id^="reports-admin-column-menu-"]') : null;
    const clickedColumnToggle = target && typeof target.closest === 'function' ? target.closest('.reports-admin-column-toggle-btn') : null;
    const clickedInsideViewMenu = target && typeof target.closest === 'function' ? target.closest('#admin-view-menu') : null;

    if (menu && button && !menu.contains(target) && !button.contains(target)) {
        menu.classList.add('hidden');
    }

    if (viewMenu && viewBtn && !clickedInsideViewMenu && !viewBtn.contains(target)) {
        viewMenu.classList.add('hidden');
    }

    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsAdministrativeColumnMenus();
    }
});

// إغلاق القوائم عند الضغط على Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeReportsAdministrativeColumnMenus();
        const menu = document.getElementById('export-menu-admin');
        if (menu) menu.classList.add('hidden');
        const viewMenu = document.getElementById('admin-view-menu');
        if (viewMenu) viewMenu.classList.add('hidden');
    }
});

// إغلاق القوائم عند تغيير أبعاد الشاشة لمنع التموضع الخاطئ
window.addEventListener('resize', function () {
    closeReportsAdministrativeColumnMenus();
});
