let __reportsExpertSessionsDateLocaleCache = null;
async function __getReportsExpertSessionsDateLocaleSetting() {
    if (__reportsExpertSessionsDateLocaleCache) return __reportsExpertSessionsDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsExpertSessionsDateLocaleCache = locale;
    return locale;
}

function __parseReportsExpertSessionsDateString(dateStr) {
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

function __formatReportsExpertSessionsDateForDisplay(dateStr) {
    try {
        const d = __parseReportsExpertSessionsDateString(dateStr);
        if (!d) return (dateStr || 'غير محدد');
        const locale = __reportsExpertSessionsDateLocaleCache || 'ar-EG';
        return d.toLocaleDateString(locale);
    } catch (_) {
        return (dateStr || 'غير محدد');
    }
}

function __escapeReportsExpertHtml(val) {
    if (val == null) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// -------------------------------------------------------------
// تعريفات الأعمدة المرنة ونظام الإظهار والإخفاء (Dynamic Columns)
// -------------------------------------------------------------
const __reportsExpertColumnsStorageKey = 'reportsExpertVisibleColumns';
const __reportsExpertDefaultVisibleColumns = ['clientName', 'outgoingNumber', 'incomingNumber', 'sessionDate'];

const __reportsExpertColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'outgoingNumber', group: 'sessions', label: 'رقم الصادر', icon: 'ri-file-upload-line', cellClass: 'whitespace-normal break-words overflow-hidden font-bold' },
    { key: 'incomingNumber', group: 'sessions', label: 'رقم الوارد', icon: 'ri-file-download-line', cellClass: 'whitespace-normal break-words overflow-hidden font-bold' },
    { key: 'sessionDate', group: 'sessions', label: 'تاريخ الجلسة', icon: 'ri-calendar-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'sessionTime', group: 'sessions', label: 'وقت الجلسة', icon: 'ri-time-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'expertName', group: 'sessions', label: 'اسم الخبير', icon: 'ri-user-star-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'caseNumber', group: 'sessions', label: 'رقم القضية', icon: 'ri-scales-3-line', cellClass: 'whitespace-normal break-words overflow-hidden font-bold' },
    { key: 'sessionType', group: 'sessions', label: 'نوع الجلسة', icon: 'ri-file-list-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'status', group: 'sessions', label: 'الحالة', icon: 'ri-checkbox-circle-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'notes', group: 'sessions', label: 'الملاحظات', icon: 'ri-sticky-note-line', cellClass: 'whitespace-normal break-words' }
];

let __reportsExpertVisibleColumnKeysCache = null;

function __getReportsExpertVisibleColumnKeys() {
    if (Array.isArray(__reportsExpertVisibleColumnKeysCache) && __reportsExpertVisibleColumnKeysCache.length) {
        return [...__reportsExpertVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsExpertColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const validKeys = __reportsExpertColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                __reportsExpertVisibleColumnKeysCache = filtered;
                return [...__reportsExpertVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsExpertVisibleColumnKeysCache = [...__reportsExpertDefaultVisibleColumns];
    return [...__reportsExpertVisibleColumnKeysCache];
}

function __setReportsExpertVisibleColumnKeys(keys) {
    const validKeys = __reportsExpertColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsExpertVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsExpertDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsExpertColumnsStorageKey, JSON.stringify(__reportsExpertVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsExpertVisibleColumns() {
    const visibleKeys = __getReportsExpertVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsExpertColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

// -------------------------------------------------------------
// تجهيز بيانات الصف (Row Mapping)
// -------------------------------------------------------------
function __getReportsExpertRowData(session, clientMap) {
    const client = session.clientId ? clientMap.get(session.clientId) : null;
    const clientName = client ? client.name : (session.clientName || 'غير محدد');
    const clientPhone = client ? (client.phone || client.mobile || '-') : '-';

    const outgoingNumber = session.outgoingNumber || '-';
    const incomingNumber = session.incomingNumber || '-';
    const sessionDate = __formatReportsExpertSessionsDateForDisplay(session.sessionDate);
    const sessionTime = session.sessionTime || '-';
    const expertName = session.expertName || '-';
    const caseNumber = session.caseNumber || '-';
    const sessionType = session.sessionType || '-';
    const status = session.status || '-';
    const notes = session.notes || '-';

    return {
        rawSession: session,
        clientName,
        clientPhone,
        outgoingNumber,
        incomingNumber,
        sessionDate,
        sessionTime,
        expertName,
        caseNumber,
        sessionType,
        status,
        notes
    };
}

// -------------------------------------------------------------
// قوائم التحكم في الأعمدة المنسدلة من الرأس (In-Header Dropdowns)
// -------------------------------------------------------------
function __buildReportsExpertColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsExpertVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsExpertColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsExpertColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];

    const extraColumns = [];
    if (currentColumn && currentColumn.group === 'clients' && !visibleSet.has('caseNumber')) {
        const caseCol = __reportsExpertColumnDefinitions.find(c => c.key === 'caseNumber');
        if (caseCol && !sameGroupColumns.some(c => c.key === caseCol.key)) {
            extraColumns.push(caseCol);
        }
    }
    const allMenuColumns = [...sameGroupColumns, ...extraColumns];

    const items = allMenuColumns.length ? allMenuColumns.map(col => `
        <button type="button" onclick="toggleReportsExpertColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-pink-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;

    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;

    return `
        <div id="reports-expert-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-pink-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-pink-50 border-b border-pink-100 text-right shrink-0">
                    <div class="text-xs font-bold text-pink-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsExpertColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-pink-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-80">${items}</div>
            <div class="border-t border-pink-100 shrink-0"></div>
            <button type="button" onclick="resetReportsExpertColumns(event)" class="w-full flex items-center gap-2 px-3 py-2.5 text-right text-pink-700 hover:bg-pink-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">إرجاع الافتراضي</span>
            </button>
        </div>
    `;
}

function closeReportsExpertColumnMenus() {
    document.querySelectorAll('[id^="reports-expert-column-menu-"]').forEach(menu => {
        try { menu.classList.add('hidden'); } catch (_) { }
    });
}

function __cleanupDetachedExpertColumnMenus() {
    document.querySelectorAll('body > [id^="reports-expert-column-menu-"]').forEach(menu => {
        try { menu.remove(); } catch (_) { }
    });
}

function __positionReportsExpertColumnMenu(menu, anchorEl) {
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

function toggleReportsExpertColumnMenu(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-expert-column-menu-${columnKey}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsExpertColumnMenus();
    if (!shouldOpen) return;

    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsExpertColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function toggleReportsExpertColumnVisibility(event, columnKey, anchorColumnKey = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsExpertColumnMenus();
    const currentKeys = __getReportsExpertVisibleColumnKeys();
    const currentSet = new Set(currentKeys);
    if (currentSet.has(columnKey) && currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    if (currentSet.has(columnKey)) {
        __setReportsExpertVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
        __renderReportsExpertCurrentTable();
        return;
    }
    const nextKeys = [...currentKeys];
    const anchorIndex = anchorColumnKey ? nextKeys.indexOf(anchorColumnKey) : -1;
    if (anchorIndex !== -1) nextKeys.splice(anchorIndex + 1, 0, columnKey);
    else nextKeys.push(columnKey);
    __setReportsExpertVisibleColumnKeys(nextKeys);
    __renderReportsExpertCurrentTable();
}

function hideReportsExpertColumn(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsExpertColumnMenus();
    const currentKeys = __getReportsExpertVisibleColumnKeys();
    if (!currentKeys.includes(columnKey)) return;
    if (currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    __setReportsExpertVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
    __renderReportsExpertCurrentTable();
}

function resetReportsExpertColumns(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsExpertColumnMenus();
    __setReportsExpertVisibleColumnKeys(__reportsExpertDefaultVisibleColumns);
    __renderReportsExpertCurrentTable();
}

function __renderReportsExpertCurrentTable() {
    const reportContent = document.getElementById('expert-sessions-report-content');
    if (!reportContent) return;
    closeReportsExpertColumnMenus();
    const { sessions, clients } = __getReportsExpertSessionsDataForAction();
    reportContent.innerHTML = generateExpertSessionsReportHTML(sessions, clients, currentExpertSessionsSortOrder);
}

// -------------------------------------------------------------
// البيانات والحالة العامة للتقرير
// -------------------------------------------------------------
let __reportsExpertAllSessions = [];
let __reportsExpertAllClients = [];
let __reportsExpertCurrentSessions = [];
let __reportsExpertCurrentClients = [];
let __reportsExpertChunkTimer = null;
let currentExpertSessionsSortOrder = 'desc';
let __reportsExpertLastSearchTerm = '';

function __getReportsExpertSessionsDataForAction() {
    try {
        const s = Array.isArray(__reportsExpertCurrentSessions) ? __reportsExpertCurrentSessions : [];
        const c = Array.isArray(__reportsExpertCurrentClients) ? __reportsExpertCurrentClients : [];
        if (s.length || c.length) return { sessions: s, clients: c };
    } catch (e) { }
    return {
        sessions: Array.isArray(__reportsExpertAllSessions) ? __reportsExpertAllSessions : [],
        clients: Array.isArray(__reportsExpertAllClients) ? __reportsExpertAllClients : []
    };
}

async function updateExpertSessionsReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');

    try {
        await __getReportsExpertSessionsDateLocaleSetting();

        const expertSessions = await getAllExpertSessions();
        const clients = await getAllClients();

        __reportsExpertAllSessions = Array.isArray(expertSessions) ? expertSessions : [];
        __reportsExpertAllClients = Array.isArray(clients) ? clients : [];
        __reportsExpertCurrentSessions = __reportsExpertAllSessions;
        __reportsExpertCurrentClients = __reportsExpertAllClients;
        __reportsExpertLastSearchTerm = '';

        const colors = { bg: '#ec4899', bgHover: '#db2777', bgLight: '#fdf2f8', text: '#db2777', textLight: '#f9a8d4' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="expert-sessions-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث في ${reportName}..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <div class="relative">
                            <button id="expert-sessions-view-menu-btn" onclick="toggleExpertSessionsViewMenu()" class="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-expert-sessions-view-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="expert-sessions-view-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 230px; width: 240px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">تاريخ الجلسة</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-sort-mode="desc" onclick="setExpertSessionsSortOrder('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأحدث</button>
                                    <button type="button" data-sort-mode="asc" onclick="setExpertSessionsSortOrder('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأقدم</button>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                            <button onclick="toggleExportMenuExperts()" id="export-btn-experts" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-experts" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportExpertSessionsReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportExpertSessionsReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportExpertSessionsReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>
                        <button onclick="printExpertSessionsReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="expert-sessions-report-content">
                    ${generateExpertSessionsReportHTML(__reportsExpertCurrentSessions, __reportsExpertCurrentClients, currentExpertSessionsSortOrder)}
                </div>
            </div>
        `;

        __reportsExpertUpdateActiveTiles();
        __reportsExpertUpdateViewMenuButtonLabel();

        const searchEl = document.getElementById('expert-sessions-search');
        if (searchEl) {
            let debounceT;
            searchEl.addEventListener('input', function (e) {
                clearTimeout(debounceT);
                debounceT = setTimeout(() => {
                    filterExpertSessionsReport(e.target.value);
                }, 150);
            });
        }

    } catch (error) {
        console.error('Error loading expert sessions data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات جلسات الخبراء</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// توليد جدول HTML وعرض جلسات الخبراء
// -------------------------------------------------------------
function generateExpertSessionsReportHTML(expertSessions, clients, sortOrder = 'desc') {
    __cleanupDetachedExpertColumnMenus();
    if (__reportsExpertChunkTimer) {
        cancelAnimationFrame(__reportsExpertChunkTimer);
        __reportsExpertChunkTimer = null;
    }

    if (!expertSessions || expertSessions.length === 0) {
        return `
            <div class="expert-sessions-report-container flex-1 min-h-0 flex flex-col overflow-y-auto p-4" style="height: 100%; position: relative;">
                <div class="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
                    <div class="mb-6">
                        <i class="ri-team-line text-8xl text-pink-200"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                    <p class="text-gray-400 text-lg">لم يتم العثور على بيانات جلسات خبراء مطابقة</p>
                </div>
            </div>
        `;
    }

    const visibleColumns = __getReportsExpertVisibleColumns();
    const columnWidth = (100 / Math.max(visibleColumns.length, 1)).toFixed(2);
    const clientMap = new Map((Array.isArray(clients) ? clients : __reportsExpertAllClients).map(c => [c.id, c]));

    const buildRowHtml = (session, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-pink-50 to-rose-50' : 'bg-white';
        const rowData = __getReportsExpertRowData(session, clientMap);

        const cellsHtml = visibleColumns.map(col => {
            const val = rowData[col.key];
            const escaped = __escapeReportsExpertHtml(val);

            return `
                <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-middle">
                    <div class="font-bold text-sm md:text-base text-gray-800 hover:text-pink-700 transition-colors duration-200 ${col.cellClass}" title="${escaped}">
                        ${escaped}
                    </div>
                </td>
            `;
        }).join('');

        return `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-pink-100 hover:to-rose-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = expertSessions.slice(0, initialBatchSize).map((s, i) => buildRowHtml(s, i)).join('');

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; width: ${columnWidth}%; min-width: 150px; background-color: #db2777 !important; color: white !important; border-color: #be185d !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #be185d;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsExpertColumnMenu(event, '${col.key}')" class="reports-expert-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsExpertColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    if (expertSessions.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('expert-sessions-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, expertSessions.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(expertSessions[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < expertSessions.length) {
                __reportsExpertChunkTimer = requestAnimationFrame(appendNextChunk);
            } else {
                __reportsExpertChunkTimer = null;
            }
        };
        __reportsExpertChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    return `
        <div class="expert-sessions-report-container flex-1 min-h-0 flex flex-col p-2" style="height: 100%; position: relative;">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; table-layout: fixed; min-width: ${visibleColumns.length * 150}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #db2777 !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="expert-sessions-table-body">
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
function __reportsExpertApplyFiltersAndRender() {
    const norm = (t) => {
        const s = window.normalizeDigits ? window.normalizeDigits(t) : String(t || '');
        return s.replace(/[إأآ]/g, 'ا').toLowerCase();
    };
    let filtered = [...__reportsExpertAllSessions];

    const term = norm(__reportsExpertLastSearchTerm);
    if (term) {
        const clientMap = new Map(__reportsExpertAllClients.map(c => [c.id, c]));
        filtered = filtered.filter(session => {
            const rowData = __getReportsExpertRowData(session, clientMap);
            return (
                norm(rowData.clientName).includes(term) ||
                norm(rowData.outgoingNumber).includes(term) ||
                norm(rowData.incomingNumber).includes(term) ||
                norm(rowData.sessionDate).includes(term) ||
                norm(rowData.sessionTime).includes(term) ||
                norm(rowData.expertName).includes(term) ||
                norm(rowData.caseNumber).includes(term) ||
                norm(rowData.sessionType).includes(term) ||
                norm(rowData.status).includes(term) ||
                norm(rowData.notes).includes(term)
            );
        });
    }

    filtered.sort((a, b) => {
        const getTime = (item) => {
            try {
                const d = __parseReportsExpertSessionsDateString(item && item.sessionDate);
                if (d) return d.getTime();
                const dCreated = __parseReportsExpertSessionsDateString(item && item.createdAt);
                if (dCreated) return dCreated.getTime();
                const idNum = Number(item && item.id);
                if (Number.isFinite(idNum)) return idNum;
            } catch (_) { }
            return 0;
        };
        const timeA = getTime(a);
        const timeB = getTime(b);
        return currentExpertSessionsSortOrder === 'desc' ? (timeB - timeA) : (timeA - timeB);
    });

    __reportsExpertCurrentSessions = filtered;
    __renderReportsExpertCurrentTable();
}

function filterExpertSessionsReport(searchTerm) {
    __reportsExpertLastSearchTerm = searchTerm || '';
    __reportsExpertApplyFiltersAndRender();
}

function __reportsExpertUpdateViewMenuButtonLabel() {
    try {
        const btn = document.getElementById('expert-sessions-view-menu-btn');
        if (!btn) return;
        const textEl = btn.querySelector('[data-expert-sessions-view-label]');
        if (textEl) textEl.textContent = 'فرز';
    } catch (_) { }
}

function __reportsExpertUpdateActiveTiles() {
    try {
        const sortButtons = document.querySelectorAll('#expert-sessions-view-menu [data-sort-mode]');
        sortButtons.forEach(btn => {
            const mode = btn.getAttribute('data-sort-mode');
            if (mode === currentExpertSessionsSortOrder) {
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

function toggleExpertSessionsViewMenu() {
    try {
        const menu = document.getElementById('expert-sessions-view-menu');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            __reportsExpertUpdateActiveTiles();
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    } catch (_) { }
}

function setExpertSessionsSortOrder(order) {
    currentExpertSessionsSortOrder = order || 'desc';
    __reportsExpertUpdateActiveTiles();
    __reportsExpertApplyFiltersAndRender();
    const menu = document.getElementById('expert-sessions-view-menu');
    if (menu) menu.classList.add('hidden');
}

async function toggleExpertSessionsSort() {
    setExpertSessionsSortOrder(currentExpertSessionsSortOrder === 'desc' ? 'asc' : 'desc');
}

// -------------------------------------------------------------
// جدول المستندات للطباعة والتصدير (Print & Excel & PDF & WhatsApp)
// -------------------------------------------------------------
function __buildReportsExpertDocumentTable(expertSessionsData, clientsData, options = {}) {
    const visibleColumns = __getReportsExpertVisibleColumns();
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
    const headerCellStyle = `background-color: #db2777; color: white; padding: ${headerPadding}; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: ${headerFontSize}; white-space: nowrap; box-sizing: border-box;`;

    const clientMap = new Map((Array.isArray(clientsData) ? clientsData : []).map(c => [c.id, c]));

    const rowsHtml = (Array.isArray(expertSessionsData) ? expertSessionsData : []).map((session, index) => {
        const rowData = __getReportsExpertRowData(session, clientMap);
        const rowBg = index % 2 === 0 ? '#fdf2f8' : '#ffffff';

        const cellsHtml = visibleColumns.map(col => {
            let val = rowData[col.key];
            if (isPdfExport && val) {
                val = String(val).replace(/\s*\/\s*/g, ' - ');
            }
            const escaped = __escapeReportsExpertHtml(val);

            // تخصيص حجم النص وخصائص العرض بدقة حسب طبيعة الخلية
            let specificCellFontSize = cellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone';
            const isNumberCol = col.key === 'outgoingNumber' || col.key === 'incomingNumber' || col.key === 'caseNumber';
            const isDateCol = col.key === 'sessionDate' || col.key === 'sessionTime' || col.key === 'status';

            if (isPhoneCol) {
                if (colCount >= 6) {
                    specificCellFontSize = (parseFloat(cellFontSize) * 0.95).toFixed(1) + 'px';
                }
                extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
            } else if (isNumberCol || isDateCol) {
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
async function printExpertSessionsReport() {
    try {
        await __getReportsExpertSessionsDateLocaleSetting();
        const { sessions, clients } = __getReportsExpertSessionsDataForAction();
        if (!sessions.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للطباعة', 'info');
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #db2777; font-size: 14px; font-weight: bold; text-align: right;">تقرير جلسات الخبراء</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsExpertSessionsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsExpertSessionsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                ${__buildReportsExpertDocumentTable(sessions, clients, { headerFontSize: '13px', cellFontSize: '12px', headerPadding: '6px 6px', cellPadding: '6px 6px' })}
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير جلسات الخبراء - ${new Date().toLocaleDateString(__reportsExpertSessionsDateLocaleCache || 'ar-EG')}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        direction: rtl;
                        margin: 0;
                        padding: 0;
                    }
                    thead { display: table-header-group; }
                    tr { page-break-inside: auto; }
                </style>
            </head>
            <body>
                ${printHTML}
            </body>
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
async function exportExpertSessionsReport() {
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
                toggleExportMenuExperts();
                return;
            }
        }

        await __getReportsExpertSessionsDateLocaleSetting();
        const { sessions, clients } = __getReportsExpertSessionsDataForAction();

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
                                <x:Name>جلسات الخبراء</x:Name>
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
                ${__buildReportsExpertDocumentTable(sessions, clients, { headerFontSize: '21px', cellFontSize: '18px', headerPadding: '10px', cellPadding: '8px', tableStyle: 'border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 18px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;' })}
            </body>
            </html>
        `;

        const blob = new Blob([excelContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_جلسات_الخبراء_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');
        toggleExportMenuExperts();

    } catch (error) {
        console.error('Error exporting expert sessions report:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
}

async function exportExpertSessionsReportExcel() {
    return await exportExpertSessionsReport();
}

// -------------------------------------------------------------
// تصدير PDF و WhatsApp
// -------------------------------------------------------------
async function exportExpertSessionsReportPDF() {
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
                toggleExportMenuExperts();
                return;
            }
        }

        await __getReportsExpertSessionsDateLocaleSetting();
        const { sessions, clients } = __getReportsExpertSessionsDataForAction();
        if (!sessions.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للتصدير', 'info');
            toggleExportMenuExperts();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_جلسات_الخبراء_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __generateReportsExpertPDFDocument(sessions, clients, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuExperts();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportExpertSessionsReportWhatsApp() {
    try {
        await __getReportsExpertSessionsDateLocaleSetting();
        const { sessions, clients } = __getReportsExpertSessionsDataForAction();
        if (!sessions.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للمشاركة', 'info');
            toggleExportMenuExperts();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_جلسات_الخبراء_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuExperts();
        const pdf = await __generateReportsExpertPDFDocument(sessions, clients, officeName, opt);
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
// توليد PDF متعدد الصفحات نظيف ومستقل لتقرير جلسات الخبراء
// -------------------------------------------------------------
async function __generateReportsExpertPDFDocument(sessions, clients, officeName, opt) {
    if (!sessions || sessions.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    const ROWS_PER_PAGE = 16;
    const pages = [];
    for (let i = 0; i < sessions.length; i += ROWS_PER_PAGE) {
        pages.push(sessions.slice(i, i + ROWS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString(__reportsExpertSessionsDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsExpertSessionsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;

    // بناء عناصر مستقلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pageSessions, pageIdx) => {
        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #db2777; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير جلسات الخبراء ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>
            ${__buildReportsExpertDocumentTable(pageSessions, clients, { isPdfExport: true })}
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
async function toggleExportMenuExperts() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-experts');
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
    const menu = document.getElementById('export-menu-experts');
    const button = document.getElementById('export-btn-experts');
    const target = event.target;
    const clickedInsideColumnMenu = target && typeof target.closest === 'function' ? target.closest('[id^="reports-expert-column-menu-"]') : null;
    const clickedColumnToggle = target && typeof target.closest === 'function' ? target.closest('.reports-expert-column-toggle-btn') : null;

    if (menu && button && !menu.contains(target) && !button.contains(target)) {
        menu.classList.add('hidden');
    }

    const viewMenu = document.getElementById('expert-sessions-view-menu');
    const viewBtn = document.getElementById('expert-sessions-view-menu-btn');
    if (viewMenu && viewBtn && !viewMenu.contains(target) && !viewBtn.contains(target)) {
        viewMenu.classList.add('hidden');
    }

    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsExpertColumnMenus();
    }
});

// إغلاق القوائم عند الضغط على Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeReportsExpertColumnMenus();
        const menu = document.getElementById('export-menu-experts');
        if (menu) menu.classList.add('hidden');
        const viewMenu = document.getElementById('expert-sessions-view-menu');
        if (viewMenu) viewMenu.classList.add('hidden');
    }
});

// إغلاق القوائم عند تغيير أبعاد الشاشة
window.addEventListener('resize', function () {
    closeReportsExpertColumnMenus();
});