let __reportsClerkPapersDateLocaleCache = null;
async function __getReportsClerkPapersDateLocaleSetting() {
    if (__reportsClerkPapersDateLocaleCache) return __reportsClerkPapersDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsClerkPapersDateLocaleCache = locale;
    return locale;
}

function __formatReportsClerkPapersDateForDisplay(dateStr) {
    try {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (!Number.isFinite(d.getTime())) return (dateStr || '-');
        return d.toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || '-');
    }
}

function __parseReportsClerkPapersDateString(dateStr) {
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

function __escapeReportsClerkHtml(val) {
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
const __reportsClerkColumnsStorageKey = 'reportsClerkVisibleColumns';
const __reportsClerkDefaultVisibleColumns = ['clientName', 'paperType', 'paperNumber', 'deliveryDate', 'receiptDate'];

const __reportsClerkColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'clientAddress', group: 'clients', label: 'عنوان الموكل', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words' },
    { key: 'paperType', group: 'papers', label: 'نوع الورقة', icon: 'ri-file-text-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'paperNumber', group: 'papers', label: 'رقم الورقة', icon: 'ri-hashtag', cellClass: 'whitespace-normal break-words overflow-hidden font-bold' },
    { key: 'deliveryDate', group: 'papers', label: 'تاريخ التسليم', icon: 'ri-calendar-event-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'receiptDate', group: 'papers', label: 'تاريخ الاستلام', icon: 'ri-calendar-check-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'clerkOffice', group: 'papers', label: 'قلم المحضرين', icon: 'ri-building-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'caseNumber', group: 'papers', label: 'رقم القضية', icon: 'ri-scales-3-line', cellClass: 'whitespace-normal break-words overflow-hidden font-bold' },
    { key: 'notes', group: 'papers', label: 'الملاحظات', icon: 'ri-sticky-note-line', cellClass: 'whitespace-normal break-words' }
];

let __reportsClerkVisibleColumnKeysCache = null;

function __getReportsClerkVisibleColumnKeys() {
    if (Array.isArray(__reportsClerkVisibleColumnKeysCache) && __reportsClerkVisibleColumnKeysCache.length) {
        return [...__reportsClerkVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsClerkColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const validKeys = __reportsClerkColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                __reportsClerkVisibleColumnKeysCache = filtered;
                return [...__reportsClerkVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsClerkVisibleColumnKeysCache = [...__reportsClerkDefaultVisibleColumns];
    return [...__reportsClerkVisibleColumnKeysCache];
}

function __setReportsClerkVisibleColumnKeys(keys) {
    const validKeys = __reportsClerkColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsClerkVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsClerkDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsClerkColumnsStorageKey, JSON.stringify(__reportsClerkVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsClerkVisibleColumns() {
    const visibleKeys = __getReportsClerkVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsClerkColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

// -------------------------------------------------------------
// تجهيز صف البيانات (Data Mapping)
// -------------------------------------------------------------
function __getReportsClerkRowData(paper, clientMap, caseMap) {
    const client = paper.clientId ? clientMap.get(paper.clientId) : null;
    const linkedCase = paper.caseId ? caseMap.get(paper.caseId) : null;

    const clientName = client ? client.name : (paper.clientName || 'غير محدد');
    const clientPhone = client ? (client.phone || client.mobile || '-') : (paper.clientPhone || '-');
    const clientAddress = client ? (client.address || '-') : (paper.clientAddress || '-');

    const paperType = paper.paperType || 'غير محدد';
    const paperNumber = paper.paperNumber || '-';
    const clerkOffice = paper.clerkOffice || '-';
    const deliveryDate = __formatReportsClerkPapersDateForDisplay(paper.deliveryDate);
    const receiptDate = __formatReportsClerkPapersDateForDisplay(paper.receiptDate);
    const caseNumber = linkedCase ? (linkedCase.caseNumber || '-') : (paper.caseNumber || '-');
    const notes = paper.notes || '-';

    return {
        rawPaper: paper,
        clientName,
        clientPhone,
        clientAddress,
        paperType,
        paperNumber,
        clerkOffice,
        deliveryDate,
        receiptDate,
        caseNumber,
        notes
    };
}

// -------------------------------------------------------------
// قوائم التحكم في الأعمدة المنسدلة من الرأس (In-Header Dropdowns)
// -------------------------------------------------------------
function __buildReportsClerkColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsClerkVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsClerkColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsClerkColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];

    const extraColumns = [];
    if (currentColumn && currentColumn.group === 'clients' && !visibleSet.has('caseNumber')) {
        const caseCol = __reportsClerkColumnDefinitions.find(c => c.key === 'caseNumber');
        if (caseCol && !sameGroupColumns.some(c => c.key === caseCol.key)) {
            extraColumns.push(caseCol);
        }
    }
    const allMenuColumns = [...sameGroupColumns, ...extraColumns];

    const items = allMenuColumns.length ? allMenuColumns.map(col => `
        <button type="button" onclick="toggleReportsClerkColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-emerald-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;

    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;

    return `
        <div id="reports-clerk-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-emerald-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-emerald-50 border-b border-emerald-100 text-right shrink-0">
                    <div class="text-xs font-bold text-emerald-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsClerkColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-emerald-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-80">${items}</div>
            <div class="border-t border-emerald-100 shrink-0"></div>
            <button type="button" onclick="resetReportsClerkColumns(event)" class="w-full flex items-center gap-2 px-3 py-2.5 text-right text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">إرجاع الافتراضي</span>
            </button>
        </div>
    `;
}

function closeReportsClerkColumnMenus() {
    document.querySelectorAll('[id^="reports-clerk-column-menu-"]').forEach(menu => {
        try { menu.classList.add('hidden'); } catch (_) { }
    });
}

function __cleanupDetachedClerkColumnMenus() {
    document.querySelectorAll('body > [id^="reports-clerk-column-menu-"]').forEach(menu => {
        try { menu.remove(); } catch (_) { }
    });
}

function __positionReportsClerkColumnMenu(menu, anchorEl) {
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

function toggleReportsClerkColumnMenu(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-clerk-column-menu-${columnKey}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsClerkColumnMenus();
    if (!shouldOpen) return;

    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsClerkColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function toggleReportsClerkColumnVisibility(event, columnKey, anchorColumnKey = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsClerkColumnMenus();
    const currentKeys = __getReportsClerkVisibleColumnKeys();
    const currentSet = new Set(currentKeys);
    if (currentSet.has(columnKey) && currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    if (currentSet.has(columnKey)) {
        __setReportsClerkVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
        __renderReportsClerkCurrentTable();
        return;
    }
    const nextKeys = [...currentKeys];
    const anchorIndex = anchorColumnKey ? nextKeys.indexOf(anchorColumnKey) : -1;
    if (anchorIndex !== -1) nextKeys.splice(anchorIndex + 1, 0, columnKey);
    else nextKeys.push(columnKey);
    __setReportsClerkVisibleColumnKeys(nextKeys);
    __renderReportsClerkCurrentTable();
}

function hideReportsClerkColumn(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsClerkColumnMenus();
    const currentKeys = __getReportsClerkVisibleColumnKeys();
    if (!currentKeys.includes(columnKey)) return;
    if (currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    __setReportsClerkVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
    __renderReportsClerkCurrentTable();
}

function resetReportsClerkColumns(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsClerkColumnMenus();
    __setReportsClerkVisibleColumnKeys(__reportsClerkDefaultVisibleColumns);
    __renderReportsClerkCurrentTable();
}

function __renderReportsClerkCurrentTable() {
    const reportContent = document.getElementById('clerk-papers-report-content');
    if (!reportContent) return;
    closeReportsClerkColumnMenus();
    const { papers, clients, cases } = __getReportsClerkPapersDataForAction();
    reportContent.innerHTML = generateClerkPapersReportHTML(papers, clients, currentClerkPapersSortOrder, currentClerkPapersTypeFilter, cases);
}

// -------------------------------------------------------------
// البيانات والحالة العامة للتقرير
// -------------------------------------------------------------
let __reportsClerkAllPapers = [];
let __reportsClerkAllClients = [];
let __reportsClerkAllCases = [];
let __reportsClerkCurrentPapers = [];
let __reportsClerkCurrentClients = [];
let __reportsClerkCurrentCases = [];
let __reportsClerkChunkTimer = null;
let currentClerkPapersSortField = 'deliveryDate';
let currentClerkPapersSortDirection = 'desc';
let currentClerkPapersSortOrder = 'desc';
let currentClerkPapersTypeFilter = 'all';
let __reportsClerkLastSearchTerm = '';
let __reportsClerkStatsExpanded = false;

function toggleReportsClerkStats(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    __reportsClerkStatsExpanded = !__reportsClerkStatsExpanded;
    const container = document.getElementById('clerk-stats-collapse-container');
    const arrow = document.getElementById('clerk-stats-toggle-arrow');

    if (container) {
        if (__reportsClerkStatsExpanded) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }
    if (arrow) {
        arrow.className = __reportsClerkStatsExpanded ? 'ri-arrow-up-s-line text-sm text-green-700' : 'ri-arrow-down-s-line text-sm text-green-700';
    }
}

function __getReportsClerkPapersDataForAction() {
    try {
        const p = Array.isArray(__reportsClerkCurrentPapers) ? __reportsClerkCurrentPapers : [];
        const c = Array.isArray(__reportsClerkCurrentClients) ? __reportsClerkCurrentClients : [];
        const cs = Array.isArray(__reportsClerkCurrentCases) ? __reportsClerkCurrentCases : [];
        if (p.length || c.length) return { papers: p, clients: c, cases: cs };
    } catch (e) { }
    return {
        papers: Array.isArray(__reportsClerkAllPapers) ? __reportsClerkAllPapers : [],
        clients: Array.isArray(__reportsClerkAllClients) ? __reportsClerkAllClients : [],
        cases: Array.isArray(__reportsClerkAllCases) ? __reportsClerkAllCases : []
    };
}

async function updateClerkPapersReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');

    try {
        await __getReportsClerkPapersDateLocaleSetting();

        const clerkPapers = await getAllClerkPapers();
        const clients = await getAllClients();
        let cases = [];
        try {
            if (typeof getAllCases === 'function') {
                cases = await getAllCases();
            }
        } catch (_) { }

        __reportsClerkAllPapers = Array.isArray(clerkPapers) ? clerkPapers : [];
        __reportsClerkAllClients = Array.isArray(clients) ? clients : [];
        __reportsClerkAllCases = Array.isArray(cases) ? cases : [];

        __reportsClerkCurrentPapers = __reportsClerkAllPapers;
        __reportsClerkCurrentClients = __reportsClerkAllClients;
        __reportsClerkCurrentCases = __reportsClerkAllCases;
        __reportsClerkLastSearchTerm = '';
        currentClerkPapersTypeFilter = 'all';
        __reportsClerkStatsExpanded = false;

        const colors = { bg: '#059669', bgHover: '#047857', bgLight: '#f0fdf4', text: '#059669', textLight: '#86efac' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="clerk-papers-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث في ${reportName}..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>
                    
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <!-- زر احصائيات -->
                        <button id="clerk-stats-toggle-btn" onclick="toggleReportsClerkStats(event)" class="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-800 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-xs md:text-sm font-semibold">
                            <i class="ri-bar-chart-2-line text-green-600 text-sm"></i>
                            <span>احصائيات</span>
                            <i id="clerk-stats-toggle-arrow" class="${__reportsClerkStatsExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-sm text-green-700"></i>
                        </button>
                        <div class="relative">
                            <button id="clerk-papers-view-menu-btn" onclick="toggleClerkPapersViewMenu()" class="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-clerk-papers-view-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="clerk-papers-view-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 250px; width: 260px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">فرز الأوراق حسب</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 6px;">
                                    <button type="button" data-field-mode="deliveryDate" onclick="setClerkPapersSortField('deliveryDate')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">التسليم</button>
                                    <button type="button" data-field-mode="receiptDate" onclick="setClerkPapersSortField('receiptDate')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الاستلام</button>
                                </div>
                                <div style="border-top: 1px solid #cbd5e1; margin: 6px 0;"></div>
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">الترتيب</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-sort-mode="desc" onclick="setClerkPapersSortDirection('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأحدث</button>
                                    <button type="button" data-sort-mode="asc" onclick="setClerkPapersSortDirection('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأقدم</button>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                            <button onclick="toggleExportMenuClerk()" id="export-btn-clerk" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-clerk" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportClerkPapersReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportClerkPapersReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportClerkPapersReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>
                        <button onclick="printClerkPapersReport()" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="clerk-papers-report-content">
                    ${generateClerkPapersReportHTML(__reportsClerkCurrentPapers, __reportsClerkCurrentClients, currentClerkPapersSortOrder, currentClerkPapersTypeFilter, __reportsClerkCurrentCases)}
                </div>
            </div>
        `;

        const searchEl = document.getElementById('clerk-papers-search');
        if (searchEl) {
            let debounceT;
            searchEl.addEventListener('input', function (e) {
                clearTimeout(debounceT);
                debounceT = setTimeout(() => {
                    filterClerkPapersReport(e.target.value);
                }, 150);
            });
        }

    } catch (error) {
        console.error('Error loading clerk papers data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات أوراق المحضرين</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// توليد جدول HTML وعرض أوراق المحضرين
// -------------------------------------------------------------
function generateClerkPapersReportHTML(clerkPapers, clients, sortOrder = 'desc', typeFilter = 'all', cases = null) {
    __cleanupDetachedClerkColumnMenus();
    if (__reportsClerkChunkTimer) {
        cancelAnimationFrame(__reportsClerkChunkTimer);
        __reportsClerkChunkTimer = null;
    }

    const norm = (t) => String(t || '').replace(/[إأآ]/g, 'ا').toLowerCase();
    const totalPapers = __reportsClerkAllPapers.length;
    const totalNotifications = __reportsClerkAllPapers.filter(paper => norm(paper.paperType).includes('اعلان')).length;
    const totalWarnings = __reportsClerkAllPapers.filter(paper => norm(paper.paperType).includes('انذار')).length;
    const otherPapers = __reportsClerkAllPapers.filter(paper => {
        const tp = norm(paper.paperType);
        return !tp.includes('اعلان') && !tp.includes('انذار');
    }).length;

    const statsGridHtml = `
        <style>
            @media (max-width:768px){
                #report-content .clerk-papers-stats-grid{
                    display:grid !important;
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    gap: 8px !important;
                }
            }
            @media (min-width:769px){
                #report-content .clerk-papers-stats-grid{
                    display:grid !important;
                    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                    gap: 16px !important;
                }
            }
        </style>
        <div class="clerk-papers-stats-grid mb-2">
            <div onclick="filterClerkPapersByType('all')" class="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${typeFilter === 'all' ? 'border-green-600 shadow-md ring-2 ring-green-300' : 'border-green-200'}" data-type="all">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <i class="ri-file-paper-line text-white text-lg"></i>
                    </div>
                    <div>
                        <div class="text-xs text-green-700 font-bold">إجمالي الأوراق</div>
                        <div class="text-lg font-extrabold text-green-900">${totalPapers}</div>
                    </div>
                </div>
            </div>
            <div onclick="filterClerkPapersByType('إعلان')" class="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${typeFilter === 'إعلان' ? 'border-blue-600 shadow-md ring-2 ring-blue-300' : 'border-blue-200'}" data-type="إعلان">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <i class="ri-notification-line text-white text-lg"></i>
                    </div>
                    <div>
                        <div class="text-xs text-blue-700 font-bold">الإعلانات</div>
                        <div class="text-lg font-extrabold text-blue-900">${totalNotifications}</div>
                    </div>
                </div>
            </div>
            <div onclick="filterClerkPapersByType('إنذار')" class="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${typeFilter === 'إنذار' ? 'border-red-600 shadow-md ring-2 ring-red-300' : 'border-red-200'}" data-type="إنذار">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <i class="ri-alarm-warning-line text-white text-lg"></i>
                    </div>
                    <div>
                        <div class="text-xs text-red-700 font-bold">الإنذارات</div>
                        <div class="text-lg font-extrabold text-red-900">${totalWarnings}</div>
                    </div>
                </div>
            </div>
            <div onclick="filterClerkPapersByType('other')" class="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${typeFilter === 'other' ? 'border-purple-600 shadow-md ring-2 ring-purple-300' : 'border-purple-200'}" data-type="other">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <i class="ri-folder-paper-line text-white text-lg"></i>
                    </div>
                    <div>
                        <div class="text-xs text-purple-700 font-bold">أوراق أخرى</div>
                        <div class="text-lg font-extrabold text-purple-900">${otherPapers}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (!clerkPapers || clerkPapers.length === 0) {
        return `
            <div class="clerk-papers-report-container flex-1 min-h-0 flex flex-col overflow-y-auto p-0" style="height: 100%; position: relative;">
                <div id="clerk-stats-collapse-container" class="${__reportsClerkStatsExpanded ? '' : 'hidden'} p-2 border-b border-gray-100 bg-gray-50/50 transition-all duration-300 shrink-0">
                    ${statsGridHtml}
                </div>
                <div class="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100">
                    <div class="mb-6">
                        <i class="ri-file-paper-line text-8xl text-green-200"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                    <p class="text-gray-400 text-lg">لم يتم العثور على أوراق محضرين مطابقة للتصفية</p>
                </div>
            </div>
        `;
    }

    const visibleColumns = __getReportsClerkVisibleColumns();
    const columnWidth = (100 / Math.max(visibleColumns.length, 1)).toFixed(2);
    const clientMap = new Map((Array.isArray(clients) ? clients : __reportsClerkAllClients).map(c => [c.id, c]));
    const caseMap = new Map((Array.isArray(cases) ? cases : __reportsClerkAllCases).map(c => [c.id, c]));

    const buildRowHtml = (paper, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-green-50 to-emerald-50' : 'bg-white';
        const rowData = __getReportsClerkRowData(paper, clientMap, caseMap);

        const cellsHtml = visibleColumns.map(col => {
            const val = rowData[col.key];
            const escaped = __escapeReportsClerkHtml(val);

            if (col.key === 'paperType') {
                let typeIcon = 'ri-file-paper-line';
                let typeColor = 'text-green-600';
                switch (paper.paperType) {
                    case 'إعلان':
                        typeIcon = 'ri-notification-line';
                        typeColor = 'text-blue-600';
                        break;
                    case 'إنذار':
                    case 'انذار':
                        typeIcon = 'ri-alarm-warning-line';
                        typeColor = 'text-red-600';
                        break;
                    case 'تنفيذ':
                        typeIcon = 'ri-hammer-line';
                        typeColor = 'text-orange-600';
                        break;
                    case 'تبليغ':
                        typeIcon = 'ri-mail-send-line';
                        typeColor = 'text-purple-600';
                        break;
                    case 'حجز':
                        typeIcon = 'ri-lock-line';
                        typeColor = 'text-gray-600';
                        break;
                    default:
                        typeIcon = 'ri-file-paper-line';
                        typeColor = 'text-green-600';
                }

                return `
                    <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-middle">
                        <div class="flex items-center justify-center gap-2 font-medium text-sm md:text-base ${typeColor} whitespace-normal break-words" title="${escaped}">
                            <i class="${typeIcon}"></i>
                            <span>${escaped}</span>
                        </div>
                    </td>
                `;
            }

            return `
                <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-middle">
                    <div class="font-bold text-sm md:text-base text-gray-800 hover:text-green-700 transition-colors duration-200 ${col.cellClass}" title="${escaped}">
                        ${escaped}
                    </div>
                </td>
            `;
        }).join('');

        return `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = clerkPapers.slice(0, initialBatchSize).map((p, i) => buildRowHtml(p, i)).join('');

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; width: ${columnWidth}%; min-width: 150px; background-color: #059669 !important; color: white !important; border-color: #047857 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #047857;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsClerkColumnMenu(event, '${col.key}')" class="reports-clerk-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsClerkColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    if (clerkPapers.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('clerk-papers-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, clerkPapers.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(clerkPapers[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < clerkPapers.length) {
                __reportsClerkChunkTimer = requestAnimationFrame(appendNextChunk);
            } else {
                __reportsClerkChunkTimer = null;
            }
        };
        __reportsClerkChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    return `
        <div class="clerk-papers-report-container flex-1 min-h-0 flex flex-col p-0" style="height: 100%; position: relative;">
            <div id="clerk-stats-collapse-container" class="${__reportsClerkStatsExpanded ? '' : 'hidden'} p-2 border-b border-gray-100 bg-gray-50/50 transition-all duration-300 shrink-0">
                ${statsGridHtml}
            </div>
            
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; table-layout: fixed; min-width: ${visibleColumns.length * 150}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #059669 !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="clerk-papers-table-body">
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
function __reportsClerkApplyFiltersAndRender() {
    const norm = (t) => {
        const s = window.normalizeDigits ? window.normalizeDigits(t) : String(t || '');
        return s.replace(/[إأآ]/g, 'ا').toLowerCase();
    };
    let filtered = [...__reportsClerkAllPapers];

    if (currentClerkPapersTypeFilter === 'إعلان') {
        filtered = filtered.filter(p => norm(p.paperType).includes('اعلان'));
    } else if (currentClerkPapersTypeFilter === 'إنذار') {
        filtered = filtered.filter(p => norm(p.paperType).includes('انذار'));
    } else if (currentClerkPapersTypeFilter === 'other') {
        filtered = filtered.filter(p => {
            const tp = norm(p.paperType);
            return !tp.includes('اعلان') && !tp.includes('انذار');
        });
    }

    const term = norm(__reportsClerkLastSearchTerm);
    if (term) {
        const clientMap = new Map(__reportsClerkAllClients.map(c => [c.id, c]));
        const caseMap = new Map(__reportsClerkAllCases.map(c => [c.id, c]));
        filtered = filtered.filter(paper => {
            const rowData = __getReportsClerkRowData(paper, clientMap, caseMap);
            return (
                norm(rowData.clientName).includes(term) ||
                norm(rowData.paperType).includes(term) ||
                norm(rowData.paperNumber).includes(term) ||
                norm(rowData.clerkOffice).includes(term) ||
                norm(rowData.caseNumber).includes(term) ||
                norm(rowData.notes).includes(term) ||
                norm(rowData.deliveryDate).includes(term) ||
                norm(rowData.receiptDate).includes(term)
            );
        });
    }

    filtered.sort((a, b) => {
        const getKey = (paper) => {
            try {
                let targetDate = null;
                if (currentClerkPapersSortField === 'receiptDate') {
                    targetDate = __parseReportsClerkPapersDateString(paper && paper.receiptDate);
                } else {
                    targetDate = __parseReportsClerkPapersDateString(paper && paper.deliveryDate);
                }
                if (targetDate) return targetDate.getTime();
                const dPaper = __parseReportsClerkPapersDateString(paper && paper.paperDate);
                if (dPaper) return dPaper.getTime();
                const dCreated = __parseReportsClerkPapersDateString(paper && paper.createdAt);
                if (dCreated) return dCreated.getTime();
                const idNum = Number(paper && paper.id);
                if (Number.isFinite(idNum)) return idNum;
            } catch (_) { }
            return 0;
        };
        const keyA = getKey(a);
        const keyB = getKey(b);
        return currentClerkPapersSortDirection === 'desc' ? (keyB - keyA) : (keyA - keyB);
    });

    __reportsClerkCurrentPapers = filtered;
    __renderReportsClerkCurrentTable();
}

function filterClerkPapersByType(type) {
    currentClerkPapersTypeFilter = type;
    __reportsClerkApplyFiltersAndRender();
}

function filterClerkPapersReport(searchTerm) {
    __reportsClerkLastSearchTerm = searchTerm || '';
    __reportsClerkApplyFiltersAndRender();
}

function __reportsClerkUpdateViewMenuButtonLabel() {
    try {
        const btn = document.getElementById('clerk-papers-view-menu-btn');
        if (!btn) return;
        const textEl = btn.querySelector('[data-clerk-papers-view-label]');
        if (textEl) textEl.textContent = 'فرز';
    } catch (_) { }
}

function __reportsClerkUpdateActiveTiles() {
    try {
        const fieldButtons = document.querySelectorAll('#clerk-papers-view-menu [data-field-mode]');
        fieldButtons.forEach(btn => {
            const mode = btn.getAttribute('data-field-mode');
            if (mode === currentClerkPapersSortField) {
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

        const sortButtons = document.querySelectorAll('#clerk-papers-view-menu [data-sort-mode]');
        sortButtons.forEach(btn => {
            const mode = btn.getAttribute('data-sort-mode');
            if (mode === currentClerkPapersSortDirection) {
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

function toggleClerkPapersViewMenu() {
    try {
        const menu = document.getElementById('clerk-papers-view-menu');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            __reportsClerkUpdateActiveTiles();
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    } catch (_) { }
}

function setClerkPapersSortField(field) {
    currentClerkPapersSortField = field || 'deliveryDate';
    __reportsClerkUpdateActiveTiles();
    __reportsClerkApplyFiltersAndRender();
    const menu = document.getElementById('clerk-papers-view-menu');
    if (menu) menu.classList.add('hidden');
}

function setClerkPapersSortDirection(direction) {
    currentClerkPapersSortDirection = direction || 'desc';
    currentClerkPapersSortOrder = direction || 'desc';
    __reportsClerkUpdateActiveTiles();
    __reportsClerkApplyFiltersAndRender();
    const menu = document.getElementById('clerk-papers-view-menu');
    if (menu) menu.classList.add('hidden');
}

async function toggleClerkPapersSort() {
    setClerkPapersSortDirection(currentClerkPapersSortDirection === 'desc' ? 'asc' : 'desc');
}

// -------------------------------------------------------------
// جدول المستندات للطباعة والتصدير (Print & Excel & PDF & WhatsApp)
// -------------------------------------------------------------
function __buildReportsClerkDocumentTable(clerkPapersData, clientsData, casesData, options = {}) {
    const visibleColumns = __getReportsClerkVisibleColumns();
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
    const headerCellStyle = `background-color: #059669; color: white; padding: ${headerPadding}; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: ${headerFontSize}; white-space: nowrap; box-sizing: border-box;`;

    const clientMap = new Map((Array.isArray(clientsData) ? clientsData : []).map(c => [c.id, c]));
    const caseMap = new Map((Array.isArray(casesData) ? casesData : []).map(c => [c.id, c]));

    const rowsHtml = (Array.isArray(clerkPapersData) ? clerkPapersData : []).map((paper, index) => {
        const rowData = __getReportsClerkRowData(paper, clientMap, caseMap);
        const rowBg = index % 2 === 0 ? '#f0fdf4' : '#ffffff';

        const cellsHtml = visibleColumns.map(col => {
            let val = rowData[col.key];
            if (isPdfExport && val) {
                val = String(val).replace(/\s*\/\s*/g, ' - ');
            }
            const escaped = __escapeReportsClerkHtml(val);

            // تخصيص حجم النص وخصائص العرض بدقة حسب طبيعة الخلية
            let specificCellFontSize = cellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone';
            const isNumberCol = col.key === 'paperNumber' || col.key === 'caseNumber';
            const isDateCol = col.key === 'deliveryDate' || col.key === 'receiptDate';

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
async function printClerkPapersReport() {
    try {
        await __getReportsClerkPapersDateLocaleSetting();
        const { papers, clients, cases } = __getReportsClerkPapersDataForAction();
        if (!papers.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للطباعة', 'info');
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #059669; font-size: 14px; font-weight: bold; text-align: right;">تقرير أوراق المحضرين</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsClerkPapersDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                ${__buildReportsClerkDocumentTable(papers, clients, cases, { headerFontSize: '13px', cellFontSize: '12px', headerPadding: '6px 6px', cellPadding: '6px 6px' })}
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير أوراق المحضرين - ${new Date().toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG')}</title>
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
        console.error('Error printing clerk papers report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}

// -------------------------------------------------------------
// تصدير إكسيل (Excel Export)
// -------------------------------------------------------------
async function exportClerkPapersReport() {
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
                toggleExportMenuClerk();
                return;
            }
        }

        await __getReportsClerkPapersDateLocaleSetting();
        const { papers, clients, cases } = __getReportsClerkPapersDataForAction();

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
                                <x:Name>أوراق المحضرين</x:Name>
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
                ${__buildReportsClerkDocumentTable(papers, clients, cases, { headerFontSize: '21px', cellFontSize: '18px', headerPadding: '10px', cellPadding: '8px', tableStyle: 'border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 18px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;' })}
            </body>
            </html>
        `;

        const blob = new Blob([excelContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_أوراق_المحضرين_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');
        toggleExportMenuClerk();

    } catch (error) {
        console.error('Error exporting clerk papers report:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
}

async function exportClerkPapersReportExcel() {
    return await exportClerkPapersReport();
}

// -------------------------------------------------------------
// تصدير PDF و WhatsApp
// -------------------------------------------------------------
async function exportClerkPapersReportPDF() {
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
                toggleExportMenuClerk();
                return;
            }
        }

        await __getReportsClerkPapersDateLocaleSetting();
        const { papers, clients, cases } = __getReportsClerkPapersDataForAction();
        if (!papers.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للتصدير', 'info');
            toggleExportMenuClerk();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_أوراق_المحضرين_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __generateReportsClerkPDFDocument(papers, clients, cases, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuClerk();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportClerkPapersReportWhatsApp() {
    try {
        await __getReportsClerkPapersDateLocaleSetting();
        const { papers, clients, cases } = __getReportsClerkPapersDataForAction();
        if (!papers.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للمشاركة', 'info');
            toggleExportMenuClerk();
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_أوراق_المحضرين_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuClerk();
        const pdf = await __generateReportsClerkPDFDocument(papers, clients, cases, officeName, opt);
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
// توليد PDF متعدد الصفحات نظيف ومستقل لتقرير أوراق المحضرين
// -------------------------------------------------------------
async function __generateReportsClerkPDFDocument(papers, clients, cases, officeName, opt) {
    if (!papers || papers.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    const ROWS_PER_PAGE = 16;
    const pages = [];
    for (let i = 0; i < papers.length; i += ROWS_PER_PAGE) {
        pages.push(papers.slice(i, i + ROWS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsClerkPapersDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;

    // بناء عناصر مستقلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pagePapers, pageIdx) => {
        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #059669; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير أوراق المحضرين ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>
            ${__buildReportsClerkDocumentTable(pagePapers, clients, cases, { isPdfExport: true })}
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
async function toggleExportMenuClerk() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-clerk');
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
    const menu = document.getElementById('export-menu-clerk');
    const button = document.getElementById('export-btn-clerk');
    const target = event.target;
    const clickedInsideColumnMenu = target && typeof target.closest === 'function' ? target.closest('[id^="reports-clerk-column-menu-"]') : null;
    const clickedColumnToggle = target && typeof target.closest === 'function' ? target.closest('.reports-clerk-column-toggle-btn') : null;

    if (menu && button && !menu.contains(target) && !button.contains(target)) {
        menu.classList.add('hidden');
    }

    const viewMenu = document.getElementById('clerk-papers-view-menu');
    const viewBtn = document.getElementById('clerk-papers-view-menu-btn');
    if (viewMenu && viewBtn && !viewMenu.contains(target) && !viewBtn.contains(target)) {
        viewMenu.classList.add('hidden');
    }

    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsClerkColumnMenus();
    }
});

// إغلاق القوائم عند الضغط على Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeReportsClerkColumnMenus();
        const menu = document.getElementById('export-menu-clerk');
        if (menu) menu.classList.add('hidden');
        const viewMenu = document.getElementById('clerk-papers-view-menu');
        if (viewMenu) viewMenu.classList.add('hidden');
    }
});

// إغلاق القوائم عند تغيير أبعاد الشاشة
window.addEventListener('resize', function () {
    closeReportsClerkColumnMenus();
});
