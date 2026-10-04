


let __reportsAccountsDateLocaleCache = null;
async function __getReportsAccountsDateLocaleSetting() {
    if (__reportsAccountsDateLocaleCache) return __reportsAccountsDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsAccountsDateLocaleCache = locale;
    return locale;
}

let __reportsAccountsAllAccounts = [];
let __reportsAccountsAllClients = [];
let __reportsAccountsAllCases = [];
let __reportsAccountsCurrentAccounts = [];
let __reportsAccountsCurrentClients = [];
let __reportsAccountsCurrentCases = [];

function __getReportsAccountsDataForAction() {
    try {
        if (Array.isArray(__reportsAccountsCurrentAccounts)) {
            return {
                accounts: __reportsAccountsCurrentAccounts,
                clients: Array.isArray(__reportsAccountsCurrentClients) ? __reportsAccountsCurrentClients : (Array.isArray(__reportsAccountsAllClients) ? __reportsAccountsAllClients : []),
                cases: Array.isArray(__reportsAccountsCurrentCases) ? __reportsAccountsCurrentCases : (Array.isArray(__reportsAccountsAllCases) ? __reportsAccountsAllCases : [])
            };
        }
    } catch (e) { }
    return {
        accounts: Array.isArray(__reportsAccountsAllAccounts) ? __reportsAccountsAllAccounts : [],
        clients: Array.isArray(__reportsAccountsAllClients) ? __reportsAccountsAllClients : [],
        cases: Array.isArray(__reportsAccountsAllCases) ? __reportsAccountsAllCases : []
    };
}

async function updateAccountsReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');

    try {

        await __getReportsAccountsDateLocaleSetting();

        // تفريغ أي محتوى سابق (مثل قسم القضايا) مباشرة عند فتح قسم الحسابات
        // حتى لا يظهر جزء من القسم السابق خلف مودال كلمة المرور أو بعده
        if (reportContent) {
            reportContent.innerHTML = '';
        }

        const accounts = await getAllAccounts();
        const clients = await getAllClients();
        const cases = (typeof getAllCases === 'function') ? await getAllCases() : [];

        // Update accounts with real calculated paidFees from embedded payments
        const processedAccounts = (Array.isArray(accounts) ? accounts : []).map(acc => {
            const payments = Array.isArray(acc.payments) ? acc.payments : [];
            const calculatedPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            return {
                ...acc,
                paidFees: calculatedPaid
            };
        });

        __reportsAccountsAllAccounts = processedAccounts;
        __reportsAccountsAllClients = Array.isArray(clients) ? clients : [];
        __reportsAccountsAllCases = Array.isArray(cases) ? cases : [];
        __reportsAccountsCurrentAccounts = __reportsAccountsAllAccounts;
        __reportsAccountsCurrentClients = __reportsAccountsAllClients;
        __reportsAccountsCurrentCases = __reportsAccountsAllCases;
        __reportsAccountsStatsExpanded = false;

        const colors = { bg: '#14b8a6', bgHover: '#0d9488', bgLight: '#f0fdfa', text: '#0d9488', textLight: '#7dd3fc' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="accounts-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث في ${reportName}..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <button id="accounts-stats-toggle-btn" onclick="toggleReportsAccountsStats(event)" class="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors text-xs md:text-sm font-semibold">
                            <i class="ri-bar-chart-2-line text-teal-600 text-sm"></i>
                            <span>احصائيات</span>
                            <i id="accounts-stats-toggle-arrow" class="${__reportsAccountsStatsExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-sm text-teal-700"></i>
                        </button>
                        <div class="relative">
                            <button id="accounts-view-menu-btn" onclick="toggleAccountsViewMenu()" class="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-accounts-view-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="accounts-view-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 250px; width: 260px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">ترتيب الحسابات</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 6px;">
                                    <button type="button" data-field-mode="totalFees" onclick="setAccountsSortField('totalFees')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأتعاب</button>
                                    <button type="button" data-field-mode="paidFees" onclick="setAccountsSortField('paidFees')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">المدفوع</button>
                                    <button type="button" data-field-mode="remaining" onclick="setAccountsSortField('remaining')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">المتبقي</button>
                                    <button type="button" data-field-mode="profits" onclick="setAccountsSortField('profits')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">الأرباح</button>
                                </div>
                                <div style="border-top: 1px solid #cbd5e1; margin: 6px 0;"></div>
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">الاتجاه</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-direction-mode="asc" onclick="setAccountsSortDirection('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">تصاعدي</button>
                                    <button type="button" data-direction-mode="desc" onclick="setAccountsSortDirection('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">تنازلي</button>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                            <button onclick="toggleExportMenuAccounts()" id="export-btn-accounts" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-accounts" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportAccountsReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportAccountsReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportAccountsReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>
                        <button onclick="printAccountsReport()" class="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="accounts-report-content">
                    ${generateAccountsReportHTML(__reportsAccountsCurrentAccounts, __reportsAccountsCurrentClients, currentAccountsSortOrder, __reportsAccountsCurrentCases)}
                </div>
            </div>
        `;


        document.getElementById('accounts-search').addEventListener('input', function (e) {
            filterAccountsReport(e.target.value, processedAccounts, clients);
        });

    } catch (error) {
        console.error('Error loading accounts data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات الحسابات</p>
                    </div>
                </div>
            </div>
        `;
    }
}


// -------------------------------------------------------------
// تعريفات الأعمدة المرنة ونظام الإظهار والإخفاء (Dynamic Columns)
// -------------------------------------------------------------
const __reportsAccountsColumnsStorageKey = 'reportsAccountsVisibleColumns';
const __reportsAccountsDefaultVisibleColumns = ['clientName', 'totalFees', 'paidFees', 'remaining', 'expenses', 'profits'];

const __reportsAccountsColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'caseNumber', group: 'accounts', label: 'رقم الدعوى', icon: 'ri-hashtag', cellClass: 'whitespace-normal break-words overflow-hidden font-bold' },
    { key: 'totalFees', group: 'accounts', label: 'الأتعاب', icon: 'ri-money-dollar-circle-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'paidFees', group: 'accounts', label: 'المدفوع', icon: 'ri-hand-coin-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'remaining', group: 'accounts', label: 'المتبقى', icon: 'ri-hourglass-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'expenses', group: 'accounts', label: 'مصروفاتى', icon: 'ri-shopping-cart-line', cellClass: 'whitespace-nowrap overflow-hidden' },
    { key: 'profits', group: 'accounts', label: 'الارباح', icon: 'ri-line-chart-line', cellClass: 'whitespace-nowrap overflow-hidden' }
];

let __reportsAccountsVisibleColumnKeysCache = null;

function __getReportsAccountsVisibleColumnKeys() {
    if (Array.isArray(__reportsAccountsVisibleColumnKeysCache) && __reportsAccountsVisibleColumnKeysCache.length) {
        return [...__reportsAccountsVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsAccountsColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const validKeys = __reportsAccountsColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                __reportsAccountsVisibleColumnKeysCache = filtered;
                return [...__reportsAccountsVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsAccountsVisibleColumnKeysCache = [...__reportsAccountsDefaultVisibleColumns];
    return [...__reportsAccountsVisibleColumnKeysCache];
}

function __setReportsAccountsVisibleColumnKeys(keys) {
    const validKeys = __reportsAccountsColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsAccountsVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsAccountsDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsAccountsColumnsStorageKey, JSON.stringify(__reportsAccountsVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsAccountsVisibleColumns() {
    const visibleKeys = __getReportsAccountsVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsAccountsColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

function __escapeReportsAccountsHtml(val) {
    if (val == null) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// -------------------------------------------------------------
// قوائم التحكم في الأعمدة المنسدلة من الرأس (In-Header Dropdowns)
// -------------------------------------------------------------
function __buildReportsAccountsColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsAccountsVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsAccountsColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsAccountsColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];

    // إتاحة إضافة رقم الدعوى من قائمة الموكل أيضاً إذا لم تكن معروضة لسهولة الوصول
    const extraColumns = [];
    if (currentColumn && currentColumn.group === 'clients' && !visibleSet.has('caseNumber')) {
        const caseCol = __reportsAccountsColumnDefinitions.find(c => c.key === 'caseNumber');
        if (caseCol && !sameGroupColumns.some(c => c.key === caseCol.key)) {
            extraColumns.push(caseCol);
        }
    }
    const allMenuColumns = [...sameGroupColumns, ...extraColumns];

    const items = allMenuColumns.length ? allMenuColumns.map(col => `
        <button type="button" onclick="toggleReportsAccountsColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-teal-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;

    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;

    return `
        <div id="reports-accounts-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-teal-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-teal-50 border-b border-teal-100 text-right shrink-0">
                    <div class="text-xs font-bold text-teal-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsAccountsColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-teal-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-80">${items}</div>
            <div class="border-t border-teal-100 shrink-0"></div>
            <button type="button" onclick="resetReportsAccountsColumns(event)" class="w-full flex items-center gap-2 px-3 py-2.5 text-right text-blue-700 hover:bg-blue-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">إرجاع الافتراضي</span>
            </button>
        </div>
    `;
}

function closeReportsAccountsColumnMenus() {
    document.querySelectorAll('[id^="reports-accounts-column-menu-"]').forEach(menu => {
        try { menu.classList.add('hidden'); } catch (_) { }
    });
}

function __cleanupDetachedAccountsColumnMenus() {
    document.querySelectorAll('body > [id^="reports-accounts-column-menu-"]').forEach(menu => {
        try { menu.remove(); } catch (_) { }
    });
}

function __positionReportsAccountsColumnMenu(menu, anchorEl) {
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

function toggleReportsAccountsColumnMenu(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-accounts-column-menu-${columnKey}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsAccountsColumnMenus();
    if (!shouldOpen) return;

    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsAccountsColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function toggleReportsAccountsColumnVisibility(event, columnKey, anchorColumnKey = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsAccountsColumnMenus();
    const currentKeys = __getReportsAccountsVisibleColumnKeys();
    const currentSet = new Set(currentKeys);
    if (currentSet.has(columnKey) && currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    if (currentSet.has(columnKey)) {
        __setReportsAccountsVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
        __renderReportsAccountsCurrentTable();
        return;
    }
    const nextKeys = [...currentKeys];
    const anchorIndex = anchorColumnKey ? nextKeys.indexOf(anchorColumnKey) : -1;
    if (anchorIndex !== -1) nextKeys.splice(anchorIndex + 1, 0, columnKey);
    else nextKeys.push(columnKey);
    __setReportsAccountsVisibleColumnKeys(nextKeys);
    __renderReportsAccountsCurrentTable();
}

function hideReportsAccountsColumn(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsAccountsColumnMenus();
    const currentKeys = __getReportsAccountsVisibleColumnKeys();
    if (!currentKeys.includes(columnKey)) return;
    if (currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    __setReportsAccountsVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
    __renderReportsAccountsCurrentTable();
}

function resetReportsAccountsColumns(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsAccountsColumnMenus();
    __setReportsAccountsVisibleColumnKeys(__reportsAccountsDefaultVisibleColumns);
    __renderReportsAccountsCurrentTable();
}

function __renderReportsAccountsCurrentTable() {
    const reportContent = document.getElementById('accounts-report-content');
    if (!reportContent) return;
    closeReportsAccountsColumnMenus();
    const { accounts, clients, cases } = __getReportsAccountsDataForAction();
    reportContent.innerHTML = generateAccountsReportHTML(accounts, clients, currentAccountsSortOrder, cases);
}

let __reportsAccountsStatsExpanded = false;

function toggleReportsAccountsStats(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    __reportsAccountsStatsExpanded = !__reportsAccountsStatsExpanded;
    const container = document.getElementById('accounts-stats-collapse-container');
    const arrow = document.getElementById('accounts-stats-toggle-arrow');

    if (container) {
        if (__reportsAccountsStatsExpanded) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }
    if (arrow) {
        arrow.className = __reportsAccountsStatsExpanded ? 'ri-arrow-up-s-line text-sm text-teal-700' : 'ri-arrow-down-s-line text-sm text-teal-700';
    }
}

// -------------------------------------------------------------
// توليد واجهة التقرير وجدول الحسابات (HTML Generator)
// -------------------------------------------------------------
function generateAccountsReportHTML(accounts, clients, sortOrder = 'desc', cases = null) {
    __cleanupDetachedAccountsColumnMenus();
    const accountsList = Array.isArray(accounts) ? accounts : [];
    const clientsList = Array.isArray(clients) ? clients : [];
    const casesList = Array.isArray(cases) ? cases : (Array.isArray(__reportsAccountsAllCases) ? __reportsAccountsAllCases : []);

    if (accountsList.length === 0) {
        return `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-wallet-3-line text-8xl text-teal-200"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على بيانات الحسابات</p>
            </div>
        `;
    }

    const visibleColumns = __getReportsAccountsVisibleColumns();
    const visibleKeys = visibleColumns.map(c => c.key);
    const isDetailedByCase = visibleKeys.includes('caseNumber');

    const clientMap = new Map(clientsList.map(c => [c.id, c]));
    const casesMap = new Map(casesList.map(cs => [cs.id, cs]));

    let rowsData = [];

    if (isDetailedByCase) {
        // نمط تجميعي لكل دعوى (بحيث لا تتكرر الدعوى إطلاقاً)
        const caseGroups = {};

        for (const account of accountsList) {
            const client = account.clientId ? clientMap.get(account.clientId) : null;
            const caseObj = account.caseId ? casesMap.get(account.caseId) : null;

            const groupKey = account.caseId
                ? `case_${account.caseId}`
                : `client_${account.clientId || 'unknown'}_general`;

            if (!caseGroups[groupKey]) {
                let caseNum = '-';
                if (caseObj) {
                    const num = caseObj.caseNumber != null ? String(caseObj.caseNumber).trim() : '';
                    const yr = caseObj.caseYear != null ? String(caseObj.caseYear).trim() : '';
                    if (num && yr) caseNum = `${num} لسنة ${yr}`;
                    else if (num) caseNum = num;
                }

                caseGroups[groupKey] = {
                    client: client,
                    caseObj: caseObj,
                    caseNumber: caseNum,
                    totalFees: 0,
                    paidFees: 0,
                    expenses: 0,
                    sortDate: 0
                };
            }

            const totalFees = parseFloat(account.totalFees || 0) || 0;
            const paidFees = parseFloat(account.paidFees || 0) || 0;
            const expenses = parseFloat(account.expenses || 0) || 0;

            caseGroups[groupKey].totalFees += totalFees;
            caseGroups[groupKey].paidFees += paidFees;
            caseGroups[groupKey].expenses += expenses;

            const accDate = new Date(account.paymentDate || account.updatedAt || account.createdAt || 0).getTime() || 0;
            if (accDate > caseGroups[groupKey].sortDate) {
                caseGroups[groupKey].sortDate = accDate;
            }
        }

        rowsData = Object.values(caseGroups).map(g => {
            const remaining = g.totalFees - g.paidFees;
            const profits = g.paidFees - g.expenses;
            const clientName = g.client ? (g.client.name || 'غير محدد') : 'غير محدد';
            const clientPhone = g.client ? (g.client.phone || g.client.mobile || '-') : '-';
            const sortDate = g.sortDate || (g.client && new Date(g.client.createdAt || 0).getTime()) || 0;

            return {
                raw: g,
                clientName: clientName,
                clientPhone: clientPhone,
                caseNumber: g.caseNumber,
                totalFees: g.totalFees,
                paidFees: g.paidFees,
                remaining: remaining,
                expenses: g.expenses,
                profits: profits,
                __sortDate: sortDate
            };
        });
    } else {
        // نمط تجميعي لكل موكل
        const clientGroups = {};
        for (const account of accountsList) {
            const client = account.clientId ? clientMap.get(account.clientId) : null;
            if (!client) continue;

            if (!clientGroups[client.id]) {
                clientGroups[client.id] = {
                    client: client,
                    totalFees: 0,
                    paidFees: 0,
                    expenses: 0,
                    remaining: 0,
                    createdAt: client.createdAt || client.id
                };
            }

            const totalFees = parseFloat(account.totalFees || 0) || 0;
            const paidFees = parseFloat(account.paidFees || 0) || 0;
            const expenses = parseFloat(account.expenses || 0) || 0;
            const remaining = totalFees - paidFees;

            clientGroups[client.id].totalFees += totalFees;
            clientGroups[client.id].paidFees += paidFees;
            clientGroups[client.id].expenses += expenses;
            clientGroups[client.id].remaining += remaining;
        }

        rowsData = Object.values(clientGroups).map(g => {
            const profits = g.paidFees - g.expenses;
            const sortDate = new Date(g.createdAt || 0).getTime() || 0;
            return {
                raw: g,
                clientName: g.client.name || 'غير محدد',
                clientPhone: g.client.phone || g.client.mobile || '-',
                caseNumber: '-',
                totalFees: g.totalFees,
                paidFees: g.paidFees,
                remaining: g.remaining,
                expenses: g.expenses,
                profits: profits,
                __sortDate: sortDate
            };
        });
    }

    __sortReportsAccountsRowsData(rowsData, currentAccountsSortField, currentAccountsSortDirection);

    const grandTotalFees = rowsData.reduce((sum, r) => sum + r.totalFees, 0);
    const grandTotalPaid = rowsData.reduce((sum, r) => sum + r.paidFees, 0);
    const grandTotalExpenses = rowsData.reduce((sum, r) => sum + r.expenses, 0);
    const grandTotalRemainingOnClient = grandTotalFees - grandTotalPaid;
    const grandTotalProfits = grandTotalPaid - grandTotalExpenses;

    const columnWidth = (100 / Math.max(visibleColumns.length, 1)).toFixed(2);

    let tableRows = '';
    rowsData.forEach((row, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-teal-50 to-cyan-50' : 'bg-white';

        const cellsHtml = visibleColumns.map(col => {
            let cellContent = '';
            if (col.key === 'clientName') {
                const escaped = __escapeReportsAccountsHtml(row.clientName);
                cellContent = `<div class="font-bold text-sm md:text-base text-gray-800 hover:text-teal-700 transition-colors duration-200 ${col.cellClass}" title="${escaped}">${escaped}</div>`;
            } else if (col.key === 'clientPhone') {
                const escaped = __escapeReportsAccountsHtml(row.clientPhone);
                cellContent = `<div class="font-medium text-sm md:text-base text-gray-700 ${col.cellClass}" dir="ltr">${escaped}</div>`;
            } else if (col.key === 'caseNumber') {
                const escaped = __escapeReportsAccountsHtml(row.caseNumber);
                cellContent = `<div class="font-bold text-sm md:text-base text-indigo-700 ${col.cellClass}">${escaped}</div>`;
            } else if (col.key === 'totalFees') {
                cellContent = `<div class="font-bold text-sm md:text-base text-blue-600 hover:text-blue-700 transition-colors duration-200 ${col.cellClass}">${Number(row.totalFees).toLocaleString()}</div>`;
            } else if (col.key === 'paidFees') {
                cellContent = `<div class="font-bold text-sm md:text-base text-emerald-600 hover:text-emerald-700 transition-colors duration-200 ${col.cellClass}">${Number(row.paidFees).toLocaleString()}</div>`;
            } else if (col.key === 'remaining') {
                cellContent = `<div class="font-bold text-sm md:text-base ${row.remaining > 0 ? 'text-amber-700 hover:text-amber-800' : 'text-gray-700 hover:text-gray-800'} transition-colors duration-200 ${col.cellClass}">${Number(row.remaining).toLocaleString()}</div>`;
            } else if (col.key === 'expenses') {
                cellContent = `<div class="font-bold text-sm md:text-base text-red-600 hover:text-red-700 transition-colors duration-200 ${col.cellClass}">${Number(row.expenses).toLocaleString()}</div>`;
            } else if (col.key === 'profits') {
                cellContent = `<div class="font-bold text-sm md:text-base text-green-700 hover:text-green-800 transition-colors duration-200 ${col.cellClass}">${Number(row.profits).toLocaleString()}</div>`;
            }

            return `
                <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-top">
                    ${cellContent}
                </td>
            `;
        }).join('');

        tableRows += `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-teal-100 hover:to-cyan-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    });

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; width: ${columnWidth}%; min-width: 150px; background-color: #14b8a6 !important; color: white !important; border-color: #0d9488 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #0d9488;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsAccountsColumnMenu(event, '${col.key}')" class="reports-accounts-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsAccountsColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    return `
        <div class="accounts-report-container flex-1 min-h-0 flex flex-col p-0" style="height: 100%; position: relative;">
            <!-- إحصائيات سريعة قابلة للطي -->
            <style>
                @media (max-width:768px){
                    #report-content .accounts-stats-grid{
                        display:grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        gap: 8px !important;
                    }
                    #report-content .accounts-stats-grid .accounts-profit-card{
                        grid-column: span 2 / span 2 !important;
                    }
                    #report-content .accounts-stats-grid .accounts-profit-card > div{
                        justify-content: center !important;
                    }
                }
                @media (min-width:769px){
                    #report-content .accounts-stats-grid{
                        display:grid !important;
                        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
                        gap: 12px !important;
                    }
                }
            </style>

            <!-- حاوية الكروت القابلة للطي (مطوية افتراضياً على جميع الأجهزة) -->
            <div id="accounts-stats-collapse-container" class="${__reportsAccountsStatsExpanded ? '' : 'hidden'} p-2 border-b border-gray-100 bg-gray-50/50 transition-all duration-300 shrink-0">
                <div class="accounts-stats-grid">
                    <div class="p-3 rounded-xl border border-blue-200" style="background: linear-gradient(to bottom right, #eff6ff, #dbeafe);">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: #2563eb; color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                <i class="ri-money-dollar-circle-line text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-blue-600 font-medium">الأتعاب</p>
                                <p class="text-lg font-bold text-blue-700">${grandTotalFees.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-3 rounded-xl border border-emerald-200" style="background: linear-gradient(to bottom right, #ecfdf5, #d1fae5);">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: #059669; color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                <i class="ri-hand-coin-line text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-emerald-600 font-medium">المدفوع</p>
                                <p class="text-lg font-bold text-emerald-700">${grandTotalPaid.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-3 rounded-xl border border-amber-200" style="background: linear-gradient(to bottom right, #fffbeb, #fef3c7);">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: #d97706; color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                <i class="ri-hourglass-line text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-amber-700 font-medium">المتبقى</p>
                                <p class="text-lg font-bold text-amber-800">${grandTotalRemainingOnClient.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-3 rounded-xl border border-red-200" style="background: linear-gradient(to bottom right, #fef2f2, #fecaca);">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: #dc2626; color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                <i class="ri-shopping-cart-line text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-red-600 font-medium">مصروفاتى</p>
                                <p class="text-lg font-bold text-red-700">${grandTotalExpenses.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="accounts-profit-card p-3 rounded-xl border border-green-200" style="background: linear-gradient(to bottom right, #f0fdf4, #dcfce7);">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: #16a34a; color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                <i class="ri-line-chart-line text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-green-700 font-medium">الارباح</p>
                                <p class="text-lg font-bold text-green-800">${grandTotalProfits.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- جدول الحسابات -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; table-layout: fixed; min-width: ${visibleColumns.length * 150}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #14b8a6 !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="accounts-table-body">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

let currentAccountsSortField = 'totalFees';
let currentAccountsSortDirection = 'desc';
let currentAccountsSortOrder = 'desc';

function __sortReportsAccountsRowsData(rowsData, field = currentAccountsSortField, direction = currentAccountsSortDirection) {
    if (!Array.isArray(rowsData)) return [];
    const isAsc = direction === 'asc';
    return rowsData.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (field === 'paidFees') {
            valA = parseFloat(a.paidFees || 0) || 0;
            valB = parseFloat(b.paidFees || 0) || 0;
        } else if (field === 'remaining') {
            valA = parseFloat(a.remaining || 0) || 0;
            valB = parseFloat(b.remaining || 0) || 0;
        } else if (field === 'profits') {
            valA = parseFloat(a.profits || 0) || 0;
            valB = parseFloat(b.profits || 0) || 0;
        } else {
            valA = parseFloat(a.totalFees || 0) || 0;
            valB = parseFloat(b.totalFees || 0) || 0;
        }
        return isAsc ? (valA - valB) : (valB - valA);
    });
}

function __reportsAccountsUpdateViewMenuButtonLabel() {
    try {
        const btn = document.getElementById('accounts-view-menu-btn');
        if (!btn) return;
        const textEl = btn.querySelector('[data-accounts-view-label]');
        if (textEl) textEl.textContent = 'فرز';
    } catch (_) { }
}

function __reportsAccountsUpdateActiveTiles() {
    try {
        const fieldButtons = document.querySelectorAll('#accounts-view-menu [data-field-mode]');
        fieldButtons.forEach(btn => {
            const mode = btn.getAttribute('data-field-mode');
            if (mode === currentAccountsSortField) {
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

        const dirButtons = document.querySelectorAll('#accounts-view-menu [data-direction-mode]');
        dirButtons.forEach(btn => {
            const mode = btn.getAttribute('data-direction-mode');
            if (mode === currentAccountsSortDirection) {
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

function toggleAccountsViewMenu() {
    try {
        const menu = document.getElementById('accounts-view-menu');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            __reportsAccountsUpdateActiveTiles();
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    } catch (_) { }
}

function setAccountsSortField(field) {
    currentAccountsSortField = field || 'totalFees';
    __reportsAccountsUpdateActiveTiles();
    __reportsAccountsApplySortAndRender();
    const menu = document.getElementById('accounts-view-menu');
    if (menu) menu.classList.add('hidden');
}

function setAccountsSortDirection(direction) {
    currentAccountsSortDirection = direction || 'desc';
    currentAccountsSortOrder = direction || 'desc';
    __reportsAccountsUpdateActiveTiles();
    __reportsAccountsApplySortAndRender();
    const menu = document.getElementById('accounts-view-menu');
    if (menu) menu.classList.add('hidden');
}

function __reportsAccountsApplySortAndRender() {
    try {
        const { accounts, clients, cases } = __getReportsAccountsDataForAction();
        const reportContent = document.getElementById('accounts-report-content');
        if (reportContent) {
            __cleanupDetachedAccountsColumnMenus();
            reportContent.innerHTML = generateAccountsReportHTML(accounts, clients, currentAccountsSortDirection, cases);
        }
        __reportsAccountsUpdateViewMenuButtonLabel();
    } catch (_) { }
}

async function toggleAccountsSort() {
    setAccountsSortDirection(currentAccountsSortDirection === 'desc' ? 'asc' : 'desc');
}


function filterAccountsReport(searchTerm, accounts, clients) {
    const cases = Array.isArray(__reportsAccountsCurrentCases) ? __reportsAccountsCurrentCases : [];
    if (!searchTerm.trim()) {
        __reportsAccountsCurrentAccounts = Array.isArray(accounts) ? accounts : [];
        __reportsAccountsCurrentClients = Array.isArray(clients) ? clients : [];
        const reportContent = document.getElementById('accounts-report-content');
        if (reportContent) {
            __cleanupDetachedAccountsColumnMenus();
            reportContent.innerHTML = generateAccountsReportHTML(__reportsAccountsCurrentAccounts, __reportsAccountsCurrentClients, currentAccountsSortOrder, cases);
        }
        return;
    }

    const norm = (s) => (window.normalizeDigits ? window.normalizeDigits(s) : String(s || '')).toLowerCase();
    const term = norm(searchTerm.trim());
    const clientMap = new Map((clients || []).map(c => [c.id, c]));
    const casesMap = new Map(cases.map(cs => [cs.id, cs]));

    const filteredAccounts = (accounts || []).filter(account => {
        const client = account.clientId ? clientMap.get(account.clientId) : null;
        const caseObj = account.caseId ? casesMap.get(account.caseId) : null;
        const cName = norm(client && client.name);
        const csNum = norm(caseObj && caseObj.caseNumber);
        const csYr = norm(caseObj && caseObj.caseYear);

        return cName.includes(term) || csNum.includes(term) || csYr.includes(term);
    });

    const clientIdsWithAccounts = new Set(filteredAccounts.map(a => a.clientId));
    const filteredClients = (clients || []).filter(client =>
        clientIdsWithAccounts.has(client.id) || (client.name && String(client.name).toLowerCase().includes(term))
    );

    __reportsAccountsCurrentAccounts = filteredAccounts;
    __reportsAccountsCurrentClients = filteredClients;
    const reportContent = document.getElementById('accounts-report-content');
    if (reportContent) {
        __cleanupDetachedAccountsColumnMenus();
        reportContent.innerHTML = generateAccountsReportHTML(filteredAccounts, filteredClients, currentAccountsSortOrder, cases);
    }
}


function __getReportsAccountsProcessedDataForExport() {
    const { accounts, clients, cases } = __getReportsAccountsDataForAction();
    const accountsList = Array.isArray(accounts) ? accounts : [];
    const clientsList = Array.isArray(clients) ? clients : [];
    const casesList = Array.isArray(cases) ? cases : (Array.isArray(__reportsAccountsAllCases) ? __reportsAccountsAllCases : []);

    const visibleColumns = __getReportsAccountsVisibleColumns();
    const visibleKeys = visibleColumns.map(c => c.key);
    const isDetailedByCase = visibleKeys.includes('caseNumber');

    const clientMap = new Map(clientsList.map(c => [c.id, c]));
    const casesMap = new Map(casesList.map(cs => [cs.id, cs]));

    let rowsData = [];

    if (isDetailedByCase) {
        const caseGroups = {};

        for (const account of accountsList) {
            const client = account.clientId ? clientMap.get(account.clientId) : null;
            const caseObj = account.caseId ? casesMap.get(account.caseId) : null;

            const groupKey = account.caseId
                ? `case_${account.caseId}`
                : `client_${account.clientId || 'unknown'}_general`;

            if (!caseGroups[groupKey]) {
                let caseNum = '-';
                if (caseObj) {
                    const num = caseObj.caseNumber != null ? String(caseObj.caseNumber).trim() : '';
                    const yr = caseObj.caseYear != null ? String(caseObj.caseYear).trim() : '';
                    if (num && yr) caseNum = `${num} لسنة ${yr}`;
                    else if (num) caseNum = num;
                }

                caseGroups[groupKey] = {
                    client: client,
                    caseObj: caseObj,
                    caseNumber: caseNum,
                    totalFees: 0,
                    paidFees: 0,
                    expenses: 0,
                    sortDate: 0
                };
            }

            const totalFees = parseFloat(account.totalFees || 0) || 0;
            const paidFees = parseFloat(account.paidFees || 0) || 0;
            const expenses = parseFloat(account.expenses || 0) || 0;

            caseGroups[groupKey].totalFees += totalFees;
            caseGroups[groupKey].paidFees += paidFees;
            caseGroups[groupKey].expenses += expenses;

            const accDate = new Date(account.paymentDate || account.updatedAt || account.createdAt || 0).getTime() || 0;
            if (accDate > caseGroups[groupKey].sortDate) {
                caseGroups[groupKey].sortDate = accDate;
            }
        }

        rowsData = Object.values(caseGroups).map(g => {
            const remaining = g.totalFees - g.paidFees;
            const profits = g.paidFees - g.expenses;
            const clientName = g.client ? (g.client.name || 'غير محدد') : 'غير محدد';
            const clientPhone = g.client ? (g.client.phone || g.client.mobile || '-') : '-';
            const sortDate = g.sortDate || (g.client && new Date(g.client.createdAt || 0).getTime()) || 0;

            return {
                raw: g,
                clientName: clientName,
                clientPhone: clientPhone,
                caseNumber: g.caseNumber,
                totalFees: g.totalFees,
                paidFees: g.paidFees,
                remaining: remaining,
                expenses: g.expenses,
                profits: profits,
                __sortDate: sortDate
            };
        });
    } else {
        const clientGroups = {};
        for (const account of accountsList) {
            const client = account.clientId ? clientMap.get(account.clientId) : null;
            if (!client) continue;

            if (!clientGroups[client.id]) {
                clientGroups[client.id] = {
                    client: client,
                    totalFees: 0,
                    paidFees: 0,
                    expenses: 0,
                    remaining: 0,
                    createdAt: client.createdAt || client.id
                };
            }

            const totalFees = parseFloat(account.totalFees || 0) || 0;
            const paidFees = parseFloat(account.paidFees || 0) || 0;
            const expenses = parseFloat(account.expenses || 0) || 0;
            const remaining = totalFees - paidFees;

            clientGroups[client.id].totalFees += totalFees;
            clientGroups[client.id].paidFees += paidFees;
            clientGroups[client.id].expenses += expenses;
            clientGroups[client.id].remaining += remaining;
        }

        rowsData = Object.values(clientGroups).map(g => {
            const profits = g.paidFees - g.expenses;
            const sortDate = new Date(g.createdAt || 0).getTime() || 0;
            return {
                raw: g,
                clientName: g.client.name || 'غير محدد',
                clientPhone: g.client.phone || g.client.mobile || '-',
                caseNumber: '-',
                totalFees: g.totalFees,
                paidFees: g.paidFees,
                remaining: g.remaining,
                expenses: g.expenses,
                profits: profits,
                __sortDate: sortDate
            };
        });
    }

    __sortReportsAccountsRowsData(rowsData, currentAccountsSortField, currentAccountsSortDirection);

    const grandTotalFees = rowsData.reduce((sum, r) => sum + r.totalFees, 0);
    const grandTotalPaid = rowsData.reduce((sum, r) => sum + r.paidFees, 0);
    const grandTotalExpenses = rowsData.reduce((sum, r) => sum + r.expenses, 0);
    const grandTotalRemainingOnClient = grandTotalFees - grandTotalPaid;
    const grandTotalProfits = grandTotalPaid - grandTotalExpenses;

    return {
        rowsData,
        visibleColumns,
        visibleKeys,
        isDetailedByCase,
        grandTotals: {
            fees: grandTotalFees,
            paid: grandTotalPaid,
            expenses: grandTotalExpenses,
            remaining: grandTotalRemainingOnClient,
            profits: grandTotalProfits
        }
    };
}

async function printAccountsReport() {
    try {
        await __getReportsAccountsDateLocaleSetting();
        const { rowsData, visibleColumns, grandTotals } = __getReportsAccountsProcessedDataForExport();
        if (!rowsData.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للطباعة', 'info');
            return;
        }
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const ths = visibleColumns.map(col => `
            <th style="background-color: #14b8a6; color: white; padding: 6px 6px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 13px; white-space: nowrap; box-sizing: border-box;">${col.label}</th>
        `).join('');

        const tableRows = rowsData.map((row, i) => {
            const rowBg = i % 2 === 0 ? '#f0fdfa' : '#ffffff';
            const tds = visibleColumns.map(col => {
                let val = '';
                let color = '#333';
                let weight = 'normal';
                let extraCellStyle = '';
                if (col.key === 'clientName') {
                    val = __escapeReportsAccountsHtml(row.clientName);
                    weight = 'bold';
                    extraCellStyle = 'word-break: break-word; line-height: 1.15;';
                } else if (col.key === 'clientPhone') {
                    val = __escapeReportsAccountsHtml(row.clientPhone);
                    extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
                } else if (col.key === 'caseNumber') {
                    val = __escapeReportsAccountsHtml(row.caseNumber);
                    color = '#4338ca';
                    weight = 'bold';
                    extraCellStyle = 'white-space: nowrap;';
                } else if (col.key === 'totalFees') {
                    val = Number(row.totalFees).toLocaleString();
                    color = '#2563eb';
                    weight = 'bold';
                    extraCellStyle = 'white-space: nowrap;';
                } else if (col.key === 'paidFees') {
                    val = Number(row.paidFees).toLocaleString();
                    color = '#059669';
                    weight = 'bold';
                    extraCellStyle = 'white-space: nowrap;';
                } else if (col.key === 'remaining') {
                    val = Number(row.remaining).toLocaleString();
                    color = row.remaining > 0 ? '#b45309' : '#333';
                    weight = 'bold';
                    extraCellStyle = 'white-space: nowrap;';
                } else if (col.key === 'expenses') {
                    val = Number(row.expenses).toLocaleString();
                    color = '#dc2626';
                    weight = 'bold';
                    extraCellStyle = 'white-space: nowrap;';
                } else if (col.key === 'profits') {
                    val = Number(row.profits).toLocaleString();
                    color = '#16a34a';
                    weight = 'bold';
                    extraCellStyle = 'white-space: nowrap;';
                }
                return `<td style="border: 1px solid #cbd5e1; padding: 6px 6px; text-align: center; color: ${color}; font-weight: ${weight}; font-size: 12px; ${extraCellStyle} box-sizing: border-box; overflow: hidden;">${val}</td>`;
            }).join('');
            return `<tr style="background: ${rowBg};">${tds}</tr>`;
        }).join('');

        const tfootTds = visibleColumns.map(col => {
            let val = '-';
            if (col.key === 'clientName') val = 'الإجمالي';
            else if (col.key === 'totalFees') val = Number(grandTotals.fees).toLocaleString();
            else if (col.key === 'paidFees') val = Number(grandTotals.paid).toLocaleString();
            else if (col.key === 'remaining') val = Number(grandTotals.remaining).toLocaleString();
            else if (col.key === 'expenses') val = Number(grandTotals.expenses).toLocaleString();
            else if (col.key === 'profits') val = Number(grandTotals.profits).toLocaleString();
            return `<td style="border: 1px solid #0d9488; padding: 6px 6px; text-align: center; font-weight: bold; font-size: 12px; background: #e6fffa; color: #0d9488; white-space: nowrap;">${val}</td>`;
        }).join('');

        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #0d9488; font-size: 14px; font-weight: bold; text-align: right;">تقرير الحسابات</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsAccountsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAccountsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; direction: rtl; table-layout: auto; box-sizing: border-box;">
                    <thead>
                        <tr>
                            ${ths}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            ${tfootTds}
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير الحسابات - ${new Date().toLocaleDateString(__reportsAccountsDateLocaleCache || 'ar-EG')}</title>
                <style>
                    @page { size: A4 portrait; margin: 10mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 0; padding: 0; }
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
        console.error('Error printing accounts report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}

async function exportAccountsReport() {
    try {
        await __getReportsAccountsDateLocaleSetting();
        const { rowsData, visibleColumns, grandTotals } = __getReportsAccountsProcessedDataForExport();

        const ths = visibleColumns.map(col => `
            <th style="background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; font-size: 18px;">${col.label}</th>
        `).join('');

        let excelRows = '';
        if (rowsData.length === 0) {
            excelRows = `<tr><td colspan="${visibleColumns.length}" style="text-align:center; padding:12px; font-size:16px; border:1px solid #cccccc;">لا توجد بيانات</td></tr>`;
        } else {
            rowsData.forEach(row => {
                const tds = visibleColumns.map(col => {
                    let val = '';
                    if (col.key === 'clientName') val = __escapeReportsAccountsHtml(row.clientName);
                    else if (col.key === 'clientPhone') val = __escapeReportsAccountsHtml(row.clientPhone);
                    else if (col.key === 'caseNumber') val = __escapeReportsAccountsHtml(row.caseNumber);
                    else if (col.key === 'totalFees') val = Number(row.totalFees).toLocaleString();
                    else if (col.key === 'paidFees') val = Number(row.paidFees).toLocaleString();
                    else if (col.key === 'remaining') val = Number(row.remaining).toLocaleString();
                    else if (col.key === 'expenses') val = Number(row.expenses).toLocaleString();
                    else if (col.key === 'profits') val = Number(row.profits).toLocaleString();
                    return `<td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 16px;">${val}</td>`;
                }).join('');
                excelRows += `<tr>${tds}</tr>`;
            });
        }

        const totalTds = visibleColumns.map(col => {
            let val = '-';
            if (col.key === 'clientName') val = 'الإجمالي';
            else if (col.key === 'totalFees') val = Number(grandTotals.fees).toLocaleString();
            else if (col.key === 'paidFees') val = Number(grandTotals.paid).toLocaleString();
            else if (col.key === 'remaining') val = Number(grandTotals.remaining).toLocaleString();
            else if (col.key === 'expenses') val = Number(grandTotals.expenses).toLocaleString();
            else if (col.key === 'profits') val = Number(grandTotals.profits).toLocaleString();
            return `<td style="border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; background-color: #e6fffa; color: #0d9488; font-size: 16px;">${val}</td>`;
        }).join('');

        const excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <style>
                    table { border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 16px; }
                    th { background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; }
                    td { border: 1px solid #cccccc; padding: 8px; text-align: center; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>${ths}</tr>
                    </thead>
                    <tbody>
                        ${excelRows}
                    </tbody>
                    <tfoot>
                        <tr>${totalTds}</tr>
                    </tfoot>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([excelContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_الحسابات_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');
        toggleExportMenuAccounts();

    } catch (error) {
        console.error('Error exporting accounts report:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
}

function __buildReportsAccountsPdfStatsHTML(grandTotals, visibleKeys) {
    const cards = [];
    if (visibleKeys.includes('totalFees')) {
        cards.push(`
            <div style="text-align: center; background: #eff6ff; border: 1px solid #93c5fd; border-radius: 4px; padding: 5px 3px;">
                <div style="color: #1d4ed8; font-size: 8px;">الأتعاب</div>
                <div style="color: #1e40af; font-size: 10px; font-weight: bold;">${Number(grandTotals.fees).toLocaleString()}</div>
            </div>
        `);
    }
    if (visibleKeys.includes('paidFees')) {
        cards.push(`
            <div style="text-align: center; background: #ecfdf5; border: 1px solid #86efac; border-radius: 4px; padding: 5px 3px;">
                <div style="color: #047857; font-size: 8px;">المدفوع</div>
                <div style="color: #065f46; font-size: 10px; font-weight: bold;">${Number(grandTotals.paid).toLocaleString()}</div>
            </div>
        `);
    }
    if (visibleKeys.includes('remaining')) {
        cards.push(`
            <div style="text-align: center; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 5px 3px;">
                <div style="color: #b45309; font-size: 8px;">المتبقى</div>
                <div style="color: #92400e; font-size: 10px; font-weight: bold;">${Number(grandTotals.remaining).toLocaleString()}</div>
            </div>
        `);
    }
    if (visibleKeys.includes('expenses')) {
        cards.push(`
            <div style="text-align: center; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; padding: 5px 3px;">
                <div style="color: #b91c1c; font-size: 8px;">مصروفاتى</div>
                <div style="color: #991b1b; font-size: 10px; font-weight: bold;">${Number(grandTotals.expenses).toLocaleString()}</div>
            </div>
        `);
    }
    if (visibleKeys.includes('profits')) {
        cards.push(`
            <div style="text-align: center; background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; padding: 5px 3px;">
                <div style="color: #15803d; font-size: 8px;">الارباح</div>
                <div style="color: #166534; font-size: 10px; font-weight: bold;">${Number(grandTotals.profits).toLocaleString()}</div>
            </div>
        `);
    }

    if (!cards.length) return '';
    return `
        <div style="display: grid; grid-template-columns: repeat(${cards.length}, 1fr); gap: 6px; margin-bottom: 10px;">
            ${cards.join('')}
        </div>
    `;
}

function __buildReportsAccountsPdfPageTableHTML(pageRows, visibleColumns, grandTotals, includeFooter) {
    const colCount = visibleColumns.length;

    let defaultHeaderFontSize = '12px';
    let defaultCellFontSize = '11px';
    let defaultHeaderPadding = '6px 6px';
    let defaultCellPadding = '5px 5px';

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

    const ths = visibleColumns.map(col => `
        <th style="background-color: #14b8a6; color: white; padding: ${defaultHeaderPadding}; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: ${defaultHeaderFontSize}; white-space: nowrap; box-sizing: border-box;">${col.label}</th>
    `).join('');

    const tableRows = (Array.isArray(pageRows) && pageRows.length) ? pageRows.map((row, i) => {
        const rowBg = i % 2 === 0 ? '#f0fdfa' : '#ffffff';
        const tds = visibleColumns.map(col => {
            let val = '';
            let color = '#333';
            let weight = 'normal';
            let specificCellFontSize = defaultCellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone';
            const isAmountCol = col.key === 'totalFees' || col.key === 'paidFees' || col.key === 'remaining' || col.key === 'expenses' || col.key === 'profits';
            const isCodeCol = col.key === 'caseNumber';

            if (col.key === 'clientName') {
                val = __escapeReportsAccountsHtml(row.clientName);
                weight = 'bold';
                extraCellStyle = 'word-break: break-word; line-height: 1.15;';
            } else if (isPhoneCol) {
                val = __escapeReportsAccountsHtml(row.clientPhone);
                if (colCount >= 6) {
                    specificCellFontSize = (parseFloat(defaultCellFontSize) * 0.95).toFixed(1) + 'px';
                }
                extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
            } else if (isCodeCol) {
                val = __escapeReportsAccountsHtml(row.caseNumber);
                color = '#4338ca';
                weight = 'bold';
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'totalFees') {
                val = Number(row.totalFees).toLocaleString();
                color = '#2563eb';
                weight = 'bold';
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'paidFees') {
                val = Number(row.paidFees).toLocaleString();
                color = '#059669';
                weight = 'bold';
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'remaining') {
                val = Number(row.remaining).toLocaleString();
                color = row.remaining > 0 ? '#b45309' : '#333';
                weight = 'bold';
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'expenses') {
                val = Number(row.expenses).toLocaleString();
                color = '#dc2626';
                weight = 'bold';
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'profits') {
                val = Number(row.profits).toLocaleString();
                color = '#16a34a';
                weight = 'bold';
                extraCellStyle = 'white-space: nowrap;';
            }

            if (typeof val === 'string' && val.includes('/')) {
                val = val.replace(/\//g, ' - ');
            }
            return `<td style="border: 1px solid #cbd5e1; padding: ${defaultCellPadding}; text-align: center; color: ${color}; font-weight: ${weight}; font-size: ${specificCellFontSize}; ${extraCellStyle} box-sizing: border-box; overflow: hidden;">${val}</td>`;
        }).join('');
        return `<tr style="background: ${rowBg};">${tds}</tr>`;
    }).join('') : `
        <tr>
            <td colspan="${visibleColumns.length}" style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; color: #666; font-size: 9px;">لا توجد بيانات</td>
        </tr>
    `;

    let footerHtml = '';
    if (includeFooter) {
        const tfootTds = visibleColumns.map(col => {
            let val = '-';
            if (col.key === 'clientName') val = 'الإجمالي';
            else if (col.key === 'totalFees') val = Number(grandTotals.fees).toLocaleString();
            else if (col.key === 'paidFees') val = Number(grandTotals.paid).toLocaleString();
            else if (col.key === 'remaining') val = Number(grandTotals.remaining).toLocaleString();
            else if (col.key === 'expenses') val = Number(grandTotals.expenses).toLocaleString();
            else if (col.key === 'profits') val = Number(grandTotals.profits).toLocaleString();
            return `<td style="border: 1px solid #0d9488; padding: ${defaultCellPadding}; text-align: center; font-weight: bold; font-size: ${defaultCellFontSize}; background: #e6fffa; color: #0d9488; white-space: nowrap;">${val}</td>`;
        }).join('');

        footerHtml = `
            <tfoot>
                <tr>${tfootTds}</tr>
            </tfoot>
        `;
    }

    return `
        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; direction: rtl; table-layout: auto; box-sizing: border-box;">
            <thead>
                <tr>${ths}</tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
            ${footerHtml}
        </table>
    `;
}

function __buildReportsAccountsPdfTableHTML(rowsData, visibleColumns, grandTotals, officeName) {
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; padding: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #0d9488; font-size: 10px; font-weight: bold; text-align: right;">تقرير الحسابات</div>
                <div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsAccountsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAccountsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>

            ${__buildReportsAccountsPdfStatsHTML(grandTotals, visibleColumns.map(c => c.key))}
            ${__buildReportsAccountsPdfPageTableHTML(rowsData, visibleColumns, grandTotals, true)}
        </div>
    `;
}

// -------------------------------------------------------------
// توليد PDF متعدد الصفحات نظيف ومستقل لتقرير الحسابات
// -------------------------------------------------------------
async function __generateReportsAccountsPDFDocument(rowsData, visibleColumns, grandTotals, officeName, opt) {
    if (!rowsData || rowsData.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    const ROWS_P1 = 14;
    const ROWS_OTHER = 16;
    const pages = [];

    if (rowsData.length <= ROWS_P1) {
        pages.push(rowsData);
    } else {
        pages.push(rowsData.slice(0, ROWS_P1));
        for (let i = ROWS_P1; i < rowsData.length; i += ROWS_OTHER) {
            pages.push(rowsData.slice(i, i + ROWS_OTHER));
        }
    }

    const currentDate = new Date().toLocaleDateString(__reportsAccountsDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsAccountsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;

    // بناء عناصر مستقلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pageRows, pageIdx) => {
        const isFirstPage = (pageIdx === 0);
        const isLastPage = (pageIdx === totalPages - 1);

        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        const statsHTML = isFirstPage ? __buildReportsAccountsPdfStatsHTML(grandTotals, visibleColumns.map(c => c.key)) : '';

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #0d9488; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير الحسابات ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>

            ${statsHTML}

            ${__buildReportsAccountsPdfPageTableHTML(pageRows, visibleColumns, grandTotals, isLastPage)}
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

async function exportAccountsReportPDF() {
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
                toggleExportMenuAccounts();
                return;
            }
        }

        await __getReportsAccountsDateLocaleSetting();
        const { rowsData, visibleColumns, grandTotals } = __getReportsAccountsProcessedDataForExport();
        if (!rowsData.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للتصدير', 'info');
            toggleExportMenuAccounts();
            return;
        }
        const officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_الحسابات_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __generateReportsAccountsPDFDocument(rowsData, visibleColumns, grandTotals, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuAccounts();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportAccountsReportWhatsApp() {
    try {
        await __getReportsAccountsDateLocaleSetting();
        const { rowsData, visibleColumns, grandTotals } = __getReportsAccountsProcessedDataForExport();
        if (!rowsData.length) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات مطابقة للمشاركة', 'info');
            toggleExportMenuAccounts();
            return;
        }
        const officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_الحسابات_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuAccounts();
        const pdf = await __generateReportsAccountsPDFDocument(rowsData, visibleColumns, grandTotals, officeName, opt);
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


async function exportAccountsReportExcel() {
    return await exportAccountsReport();
}


async function toggleExportMenuAccounts() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-accounts');
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


document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu-accounts');
    const button = document.getElementById('export-btn-accounts');
    const target = event.target;
    const clickedInsideColumnMenu = target && typeof target.closest === 'function' ? target.closest('[id^="reports-accounts-column-menu-"]') : null;
    const clickedColumnToggle = target && typeof target.closest === 'function' ? target.closest('.reports-accounts-column-toggle-btn') : null;

    if (menu && button && !menu.contains(target) && !button.contains(target)) {
        menu.classList.add('hidden');
    }

    const viewMenu = document.getElementById('accounts-view-menu');
    const viewBtn = document.getElementById('accounts-view-menu-btn');
    if (viewMenu && viewBtn && !viewMenu.contains(target) && !viewBtn.contains(target)) {
        viewMenu.classList.add('hidden');
    }

    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsAccountsColumnMenus();
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeReportsAccountsColumnMenus();
        const menu = document.getElementById('export-menu-accounts');
        if (menu) menu.classList.add('hidden');
        const viewMenu = document.getElementById('accounts-view-menu');
        if (viewMenu) viewMenu.classList.add('hidden');
    }
});