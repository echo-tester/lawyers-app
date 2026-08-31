


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
let __reportsAccountsCurrentAccounts = [];
let __reportsAccountsCurrentClients = [];

function __getReportsAccountsDataForAction() {
    try {
        const a = Array.isArray(__reportsAccountsCurrentAccounts) ? __reportsAccountsCurrentAccounts : [];
        const c = Array.isArray(__reportsAccountsCurrentClients) ? __reportsAccountsCurrentClients : [];
        if (a.length || c.length) {
            return { accounts: a, clients: c };
        }
    } catch (e) { }
    return {
        accounts: Array.isArray(__reportsAccountsAllAccounts) ? __reportsAccountsAllAccounts : [],
        clients: Array.isArray(__reportsAccountsAllClients) ? __reportsAccountsAllClients : []
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

        // Update accounts with real calculated paidFees from embedded payments
        const processedAccounts = (Array.isArray(accounts) ? accounts : []).map(acc => {
            const payments = Array.isArray(acc.payments) ? acc.payments : [];
            const calculatedPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            // If the account has a separate paidFees value from migration/legacy that is higher/different,
            // we might want to respect it, but for accuracy with the new system, we should rely on payments.
            // However, to be safe during transition, if no payments exist but paidFees is set (legacy), keep it?
            // The user wanted "unified" structure. Let's stick to calculating from payments if payments exist,
            // otherwise fallback to existing paidFees if it's not 0 (legacy data compatibility).
            // Actually, the request implies simpler is better.
            // Let's rely on the calculated value if payments array is present.

            return {
                ...acc,
                paidFees: calculatedPaid
            };
        });

        __reportsAccountsAllAccounts = processedAccounts;
        __reportsAccountsAllClients = Array.isArray(clients) ? clients : [];
        __reportsAccountsCurrentAccounts = __reportsAccountsAllAccounts;
        __reportsAccountsCurrentClients = __reportsAccountsAllClients;

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
                        <button onclick="toggleAccountsSort()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <i class="ri-time-line"></i>
                            <span>الأحدث</span>
                        </button>
                        <div class="relative">
                            <button onclick="toggleExportMenuAccounts()" id="export-btn-accounts" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
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
                        <button onclick="printAccountsReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 pt-0 pb-6 pl-0 pr-0 relative flex-1 overflow-y-auto overflow-x-auto" id="accounts-report-content">
                    ${generateAccountsReportHTML(__reportsAccountsCurrentAccounts, __reportsAccountsCurrentClients)}
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


function generateAccountsReportHTML(accounts, clients, sortOrder = 'desc') {
    if (accounts.length === 0) {
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


    const clientMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    const clientGroups = {};

    for (const account of (accounts || [])) {
        const client = account.clientId ? clientMap.get(account.clientId) : null;

        if (!client) continue;

        if (!clientGroups[client.id]) {
            clientGroups[client.id] = {
                client: client,
                totalFees: 0,
                totalPaid: 0,
                totalExpenses: 0,
                totalRemaining: 0
            };
        }

        clientGroups[client.id].totalFees += account.totalFees || 0;
        clientGroups[client.id].totalPaid += account.paidFees || 0;
        clientGroups[client.id].totalExpenses += account.expenses || 0;
        clientGroups[client.id].totalRemaining += account.remaining || 0;
    }


    let clientsData = Object.values(clientGroups);
    clientsData.sort((a, b) => {
        const dateA = new Date(a.client.createdAt || a.client.id);
        const dateB = new Date(b.client.createdAt || b.client.id);

        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    let tableRows = '';
    clientsData.forEach((clientData, i) => {

        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-teal-50 to-cyan-50' : 'bg-white';


        const remainingOnClient = clientData.totalFees - clientData.totalPaid;
        const profits = clientData.totalPaid - clientData.totalExpenses;

        tableRows += `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-teal-100 hover:to-cyan-100 transition-all duration-300 hover:shadow-sm">
                <td class="py-4 px-4 text-center border-l border-gray-200 min-w-[160px]">
                    <div class="font-bold text-base text-gray-800 hover:text-teal-700 transition-colors duration-200 truncate min-w-0" title="${clientData.client.name}">${clientData.client.name}</div>
                </td>
                <td class="py-4 px-3 text-center border-l border-gray-200 min-w-[100px] whitespace-nowrap">
                    <div class="font-bold text-base text-blue-600 hover:text-blue-700 transition-colors duration-200">${clientData.totalFees.toLocaleString()}</div>
                </td>
                <td class="py-4 px-3 text-center border-l border-gray-200 min-w-[100px] whitespace-nowrap">
                    <div class="font-bold text-base text-emerald-600 hover:text-emerald-700 transition-colors duration-200">${clientData.totalPaid.toLocaleString()}</div>
                </td>
                <td class="py-4 px-3 text-center border-l border-gray-200 min-w-[100px] whitespace-nowrap">
                    <div class="font-bold text-base ${remainingOnClient > 0 ? 'text-amber-700 hover:text-amber-800' : 'text-gray-700 hover:text-gray-800'} transition-colors duration-200">${remainingOnClient.toLocaleString()}</div>
                </td>
                <td class="py-4 px-3 text-center border-l border-gray-200 min-w-[100px] whitespace-nowrap">
                    <div class="font-bold text-base text-red-600 hover:text-red-700 transition-colors duration-200">${clientData.totalExpenses.toLocaleString()}</div>
                </td>
                <td class="py-4 px-3 text-center border-l border-gray-200 min-w-[100px] whitespace-nowrap">
                    <div class="font-bold text-base text-green-700 hover:text-green-800 transition-colors duration-200">${profits.toLocaleString()}</div>
                </td>
            </tr>
        `;
    });


    const grandTotalFees = clientsData.reduce((sum, client) => sum + client.totalFees, 0);
    const grandTotalPaid = clientsData.reduce((sum, client) => sum + client.totalPaid, 0);
    const grandTotalExpenses = clientsData.reduce((sum, client) => sum + client.totalExpenses, 0);
    const grandTotalRemainingOnClient = grandTotalFees - grandTotalPaid;
    const grandTotalProfits = grandTotalPaid - grandTotalExpenses;

    return `
        <div class="accounts-report-container" style="height: 100%; overflow-y: auto; position: relative;">
            <!-- إحصائيات سريعة -->
            <style>
                @media (max-width:768px){
                    #report-content .accounts-stats-grid{
                        display:grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        gap: 8px !important;
                    }
                }
                @media (min-width:769px){
                    #report-content .accounts-stats-grid{
                        display:grid !important;
                        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
                        gap: 16px !important;
                    }
                }
            </style>
            <div class="accounts-stats-grid mb-6">
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

                <div class="p-3 rounded-xl border border-green-200" style="background: linear-gradient(to bottom right, #f0fdf4, #dcfce7);">
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
            
            <!-- جدول الحسابات -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100">
                <table class="w-full border-separate" style="border-spacing: 0;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #14b8a6 !important;">
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #14b8a6 !important; color: white !important; border-color: #0d9488 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #0d9488;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-user-heart-line text-sm"></i>
                                    <span>اسم الموكل</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #14b8a6 !important; color: white !important; border-color: #0d9488 !important; white-space: nowrap; width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #0d9488;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-money-dollar-circle-line text-sm"></i>
                                    <span>الأتعاب</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #14b8a6 !important; color: white !important; border-color: #0d9488 !important; white-space: nowrap; width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #0d9488;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-hand-coin-line text-sm"></i>
                                    <span>المدفوع</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #14b8a6 !important; color: white !important; border-color: #0d9488 !important; white-space: nowrap; width: 150px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #0d9488;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-hourglass-line text-sm"></i>
                                    <span>المتبقى</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #14b8a6 !important; color: white !important; border-color: #0d9488 !important; white-space: nowrap; width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #0d9488;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-shopping-cart-line text-sm"></i>
                                    <span>مصروفاتى</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #14b8a6 !important; color: white !important; border-color: #0d9488 !important; white-space: nowrap; width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #0d9488;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-line-chart-line text-sm"></i>
                                    <span>الارباح</span>
                                </div>
                            </th>
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


let currentAccountsSortOrder = 'desc';


async function toggleAccountsSort() {
    try {

        currentAccountsSortOrder = currentAccountsSortOrder === 'desc' ? 'asc' : 'desc';


        const { accounts, clients } = __getReportsAccountsDataForAction();


        const sortButton = document.querySelector('button[onclick="toggleAccountsSort()"]');
        const icon = sortButton.querySelector('i');
        const text = sortButton.querySelector('span');

        icon.className = currentAccountsSortOrder === 'desc' ? 'ri-time-line' : 'ri-history-line';
        text.textContent = currentAccountsSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';


        const reportContent = document.getElementById('accounts-report-content');
        reportContent.innerHTML = generateAccountsReportHTML(accounts, clients, currentAccountsSortOrder);

    } catch (error) {
        console.error('Error sorting accounts report:', error);
        showToast('حدث خطأ أثناء فرز التقرير', 'error');
    }
}


function filterAccountsReport(searchTerm, accounts, clients) {
    if (!searchTerm.trim()) {

        const reportContent = document.getElementById('accounts-report-content');
        reportContent.innerHTML = generateAccountsReportHTML(accounts, clients, currentAccountsSortOrder);
        __reportsAccountsCurrentAccounts = Array.isArray(accounts) ? accounts : [];
        __reportsAccountsCurrentClients = Array.isArray(clients) ? clients : [];
        return;
    }


    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const filteredAccounts = accounts.filter(account =>
        filteredClients.some(client => client.id === account.clientId)
    );

    __reportsAccountsCurrentAccounts = filteredAccounts;
    __reportsAccountsCurrentClients = filteredClients;
    const reportContent = document.getElementById('accounts-report-content');
    reportContent.innerHTML = generateAccountsReportHTML(filteredAccounts, filteredClients, currentAccountsSortOrder);
}


async function printAccountsReport() {
    try {
        await __getReportsAccountsDateLocaleSetting();
        const { accounts, clients } = __getReportsAccountsDataForAction();


        const clientGroups = {};

        for (const account of accounts) {
            const client = clients.find(c => c.id === account.clientId);

            if (!client) continue;

            if (!clientGroups[client.id]) {
                clientGroups[client.id] = {
                    client: client,
                    totalFees: 0,
                    totalPaid: 0,
                    totalExpenses: 0,
                    totalRemaining: 0
                };
            }

            clientGroups[client.id].totalFees += account.totalFees || 0;
            clientGroups[client.id].totalPaid += account.paidFees || 0;
            clientGroups[client.id].totalExpenses += account.expenses || 0;
            clientGroups[client.id].totalRemaining += account.remaining || 0;
        }

        const clientsData = Object.values(clientGroups);


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        let tableRows = '';
        clientsData.forEach((clientData, i) => {
            const remainingOnClient = clientData.totalFees - clientData.totalPaid;
            const profits = clientData.totalPaid - clientData.totalExpenses;
            const rowBg = i % 2 === 0 ? '#f0fdfa' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${clientData.client.name}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; color: #2563eb; font-weight: bold; font-size: 16px;">${clientData.totalFees.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; color: #059669; font-weight: bold; font-size: 16px;">${clientData.totalPaid.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; color: #b45309; font-weight: bold; font-size: 16px;">${remainingOnClient.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; color: #dc2626; font-weight: bold; font-size: 16px;">${clientData.totalExpenses.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; color: #16a34a; font-weight: bold; font-size: 16px;">${profits.toLocaleString()}</td>
                </tr>
            `;
        });


        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير الحسابات</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsAccountsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAccountsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                    <thead>
                        <tr>
                            <th style="background-color: #14b8a6; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 18px;">اسم الموكل</th>
                            <th style="background-color: #14b8a6; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 18px;">الأتعاب</th>
                            <th style="background-color: #14b8a6; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 18px;">المدفوع</th>
                            <th style="background-color: #14b8a6; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 18px;">المتبقى</th>
                            <th style="background-color: #14b8a6; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 18px;">مصروفاتى</th>
                            <th style="background-color: #14b8a6; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 18px;">الارباح</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
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
                    @page {
                        size: A4;
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
        const { accounts, clients } = __getReportsAccountsDataForAction();


        const clientGroups = {};

        for (const account of accounts) {
            const client = clients.find(c => c.id === account.clientId);

            if (!client) continue;

            if (!clientGroups[client.id]) {
                clientGroups[client.id] = {
                    client: client,
                    totalFees: 0,
                    totalPaid: 0,
                    totalExpenses: 0,
                    totalRemaining: 0
                };
            }

            clientGroups[client.id].totalFees += account.totalFees || 0;
            clientGroups[client.id].totalPaid += account.paidFees || 0;
            clientGroups[client.id].totalExpenses += account.expenses || 0;
            clientGroups[client.id].totalRemaining += account.remaining || 0;
        }


        let clientsData = Object.values(clientGroups);
        clientsData.sort((a, b) => {
            const dateA = new Date(a.client.createdAt || a.client.id);
            const dateB = new Date(b.client.createdAt || b.client.id);

            if (currentAccountsSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


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
                                <x:Name>تقرير الحسابات</x:Name>
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
                    table {
                        border-collapse: collapse;
                        direction: rtl;
                        font-family: Arial, sans-serif;
                        font-size: 18px;
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                    }
                    th {
                        background: #14b8a6;
                        background-color: #14b8a6;
                        color: #FFFFFF;
                        border: 2px solid #0d9488;
                        padding: 10px;
                        text-align: center;
                        font-weight: bold;
                        font-size: 21px;
                        width: auto;
                        mso-background-source: auto;
                    }
                    td {
                        border: 1px solid #cccccc;
                        padding: 8px;
                        text-align: center;
                        vertical-align: middle;
                        width: auto;
                        background: #FFFFFF;
                        background-color: #FFFFFF;
                    }
                    .empty-cell {
                        color: #999999;
                        font-style: italic;
                        text-align: center;
                        background: #F8F8F8;
                        background-color: #F8F8F8;
                    }
                </style>
            </head>
            <body>
                <table>
                    <tr>
                        <th style="background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">اسم الموكل</th>
                        <th style="background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">الأتعاب</th>
                        <th style="background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">المدفوع</th>
                        <th style="background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">المتبقى</th>
                        <th style="background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">مصروفاتى</th>
                        <th style="background-color: #14b8a6; color: #FFFFFF; border: 2px solid #0d9488; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">الارباح</th>
                    </tr>
        `;


        clientsData.forEach((clientData) => {
            const clientName = clientData.client.name;
            const totalFees = clientData.totalFees.toLocaleString();
            const totalPaid = clientData.totalPaid.toLocaleString();
            const remainingOnClient = (clientData.totalFees - clientData.totalPaid).toLocaleString();
            const totalExpenses = clientData.totalExpenses.toLocaleString();
            const profits = (clientData.totalPaid - clientData.totalExpenses).toLocaleString();

            excelContent += `
                <tr>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${clientName}</td>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${totalFees}</td>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${totalPaid}</td>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${remainingOnClient}</td>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${totalExpenses}</td>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${profits}</td>
                </tr>
            `;
        });

        excelContent += `
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


async function exportAccountsReportPDF() {
    try {
        const { accounts, clients } = __getReportsAccountsDataForAction();


        const clientGroups = {};
        for (const account of accounts) {
            const client = clients.find(c => c.id === account.clientId);
            if (!client) continue;

            if (!clientGroups[client.id]) {
                clientGroups[client.id] = {
                    client: client,
                    totalFees: 0,
                    totalPaid: 0,
                    totalExpenses: 0,
                    totalRemaining: 0
                };
            }

            clientGroups[client.id].totalFees += account.totalFees || 0;
            clientGroups[client.id].totalPaid += account.paidFees || 0;
            clientGroups[client.id].totalExpenses += account.expenses || 0;
            clientGroups[client.id].totalRemaining += account.remaining || 0;
        }


        let clientsData = Object.values(clientGroups);
        clientsData.sort((a, b) => {
            const dateA = new Date(a.client.createdAt || a.client.id);
            const dateB = new Date(b.client.createdAt || b.client.id);

            if (currentAccountsSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        let tableRows = '';
        clientsData.forEach((clientData, i) => {
            const remainingOnClient = clientData.totalFees - clientData.totalPaid;
            const profits = clientData.totalPaid - clientData.totalExpenses;
            const rowBg = i % 2 === 0 ? '#f0fdfa' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientData.client.name}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #2563eb; font-weight: bold; font-size: 8px;">${clientData.totalFees.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #059669; font-weight: bold; font-size: 8px;">${clientData.totalPaid.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #b45309; font-weight: bold; font-size: 8px;">${remainingOnClient.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #dc2626; font-weight: bold; font-size: 8px;">${clientData.totalExpenses.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #16a34a; font-weight: bold; font-size: 8px;">${profits.toLocaleString()}</td>
                </tr>
            `;
        });


        const grandTotalFees = clientsData.reduce((sum, client) => sum + client.totalFees, 0);
        const grandTotalPaid = clientsData.reduce((sum, client) => sum + client.totalPaid, 0);
        const grandTotalExpenses = clientsData.reduce((sum, client) => sum + client.totalExpenses, 0);
        const grandTotalRemainingOnClient = grandTotalFees - grandTotalPaid;
        const grandTotalProfits = grandTotalPaid - grandTotalExpenses;

        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                    <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير الحسابات</div>
                    <div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsAccountsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAccountsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
                </div>
                
                <!-- الإحصائيات -->
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 8px; padding: 4px; border-radius: 3px;">
                    <div style="text-align: center; background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #0369a1; font-size: 7px;">الأتعاب</div>
                        <div style="color: #0c4a6e; font-size: 9px; font-weight: bold;">${grandTotalFees.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #dcfce7; border: 1px solid #22c55e; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #166534; font-size: 7px;">المدفوع</div>
                        <div style="color: #14532d; font-size: 9px; font-weight: bold;">${grandTotalPaid.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #fffbeb; border: 1px solid #f59e0b; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #b45309; font-size: 7px;">المتبقى</div>
                        <div style="color: #92400e; font-size: 9px; font-weight: bold;">${grandTotalRemainingOnClient.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #fee2e2; border: 1px solid #ef4444; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #b91c1c; font-size: 7px;">مصروفاتى</div>
                        <div style="color: #991b1b; font-size: 9px; font-weight: bold;">${grandTotalExpenses.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #f0fdf4; border: 1px solid #22c55e; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #166534; font-size: 7px;">الارباح</div>
                        <div style="color: #14532d; font-size: 9px; font-weight: bold;">${grandTotalProfits.toLocaleString()}</div>
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <thead>
                        <tr>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">اسم الموكل</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">الأتعاب</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">المدفوع</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">المتبقى</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">مصروفاتى</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">الارباح</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;

        const opt = {
            margin: [8, 10, 8, 10],
            filename: `تقرير_الحسابات_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        await html2pdf().set(opt).from(element).save();
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
        const { accounts, clients } = __getReportsAccountsDataForAction();

        const clientGroups = {};
        for (const account of accounts) {
            const client = clients.find(c => c.id === account.clientId);
            if (!client) continue;

            if (!clientGroups[client.id]) {
                clientGroups[client.id] = { client: client, totalFees: 0, totalPaid: 0, totalExpenses: 0, totalRemaining: 0 };
            }
            clientGroups[client.id].totalFees += account.totalFees || 0;
            clientGroups[client.id].totalPaid += account.paidFees || 0;
            clientGroups[client.id].totalExpenses += account.expenses || 0;
            clientGroups[client.id].totalRemaining += account.remaining || 0;
        }

        let clientsData = Object.values(clientGroups);
        clientsData.sort((a, b) => {
            const dateA = new Date(a.client.createdAt || a.client.id);
            const dateB = new Date(b.client.createdAt || b.client.id);
            return currentAccountsSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        let tableRows = '';
        clientsData.forEach((clientData, i) => {
            const remainingOnClient = clientData.totalFees - clientData.totalPaid;
            const profits = clientData.totalPaid - clientData.totalExpenses;
            const rowBg = i % 2 === 0 ? '#f0fdfa' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientData.client.name}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #2563eb; font-weight: bold; font-size: 8px;">${clientData.totalFees.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #059669; font-weight: bold; font-size: 8px;">${clientData.totalPaid.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #b45309; font-weight: bold; font-size: 8px;">${remainingOnClient.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #dc2626; font-weight: bold; font-size: 8px;">${clientData.totalExpenses.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: #16a34a; font-weight: bold; font-size: 8px;">${profits.toLocaleString()}</td>
                </tr>
            `;
        });

        const grandTotalFees = clientsData.reduce((sum, c) => sum + c.totalFees, 0);
        const grandTotalPaid = clientsData.reduce((sum, c) => sum + c.totalPaid, 0);
        const grandTotalExpenses = clientsData.reduce((sum, c) => sum + c.totalExpenses, 0);
        const grandTotalRemainingOnClient = grandTotalFees - grandTotalPaid;
        const grandTotalProfits = grandTotalPaid - grandTotalExpenses;

        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                    <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير الحسابات</div>
                    <div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsAccountsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAccountsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 8px; padding: 4px;">
                    <div style="text-align: center; background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #0369a1; font-size: 7px;">الأتعاب</div>
                        <div style="color: #0c4a6e; font-size: 9px; font-weight: bold;">${grandTotalFees.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #dcfce7; border: 1px solid #22c55e; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #166534; font-size: 7px;">المدفوع</div>
                        <div style="color: #14532d; font-size: 9px; font-weight: bold;">${grandTotalPaid.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #fffbeb; border: 1px solid #f59e0b; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #b45309; font-size: 7px;">المتبقى</div>
                        <div style="color: #92400e; font-size: 9px; font-weight: bold;">${grandTotalRemainingOnClient.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #fee2e2; border: 1px solid #ef4444; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #b91c1c; font-size: 7px;">مصروفاتى</div>
                        <div style="color: #991b1b; font-size: 9px; font-weight: bold;">${grandTotalExpenses.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center; background: #f0fdf4; border: 1px solid #22c55e; border-radius: 4px; padding: 6px 4px;">
                        <div style="color: #166534; font-size: 7px;">الارباح</div>
                        <div style="color: #14532d; font-size: 9px; font-weight: bold;">${grandTotalProfits.toLocaleString()}</div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <thead>
                        <tr>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">اسم الموكل</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">الأتعاب</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">المدفوع</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">المتبقى</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">مصروفاتى</th>
                            <th style="background-color: #14b8a6; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0d9488; font-weight: bold; font-size: 9px;">الارباح</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;

        const opt = {
            margin: [8, 10, 8, 10],
            filename: `تقرير_الحسابات_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuAccounts();
        const blob = await html2pdf().set(opt).from(element).outputPdf('blob');

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

    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
    }
});