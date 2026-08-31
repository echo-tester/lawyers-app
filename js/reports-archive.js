


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

function __formatReportsArchiveDateForDisplay(dateStr, fallback = 'غير محدد') {
    try {
        if (!dateStr) return fallback;
        const d = new Date(dateStr);
        if (!Number.isFinite(d.getTime())) return (dateStr || fallback);
        return d.toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || fallback);
    }
}

let __reportsArchiveAllCases = [];
let __reportsArchiveAllClients = [];
let __reportsArchiveAllOpponents = [];
let __reportsArchiveCurrentCases = [];
let __reportsArchiveCurrentClients = [];
let __reportsArchiveCurrentOpponents = [];

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
        const archivedCases = allCases.filter(c => c.isArchived === true);
        const clients = await getAllClients();
        const opponents = await getAllOpponents();
        __reportsArchiveAllCases = Array.isArray(archivedCases) ? archivedCases : [];
        __reportsArchiveAllClients = Array.isArray(clients) ? clients : [];
        __reportsArchiveAllOpponents = Array.isArray(opponents) ? opponents : [];
        __reportsArchiveCurrentCases = __reportsArchiveAllCases;
        __reportsArchiveCurrentClients = __reportsArchiveAllClients;
        __reportsArchiveCurrentOpponents = __reportsArchiveAllOpponents;

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
                        <button onclick="toggleArchiveSort()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <i class="ri-time-line"></i>
                            <span>الأحدث</span>
                        </button>
                        <div class="relative">
                            <button onclick="toggleExportMenuArchive()" id="export-btn-archive" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
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
                        <button onclick="printArchiveReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 pt-0 pb-6 pl-0 pr-0 relative flex-1 overflow-y-auto overflow-x-auto" id="archive-report-content">
                    ${generateArchiveReportHTML(__reportsArchiveCurrentCases, __reportsArchiveCurrentClients, __reportsArchiveCurrentOpponents)}
                </div>
            </div>
        `;


        document.getElementById('archive-search').addEventListener('input', function (e) {
            filterArchiveReport(e.target.value, archivedCases, clients);
        });

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


function generateArchiveReportHTML(archivedCases, clients, opponents, sortOrder = 'desc') {
    if (archivedCases.length === 0) {
        return `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-folder-history-line text-8xl text-cyan-200"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على قضايا مؤرشفة</p>
            </div>
        `;
    }


    let casesData = [...archivedCases];
    casesData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.id);
        const dateB = new Date(b.createdAt || b.id);

        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    let tableRows = '';
    const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    const opponentsMap = new Map(Array.isArray(opponents) ? opponents.map(o => [o.id, o]) : []);
    casesData.forEach((caseRecord, i) => {

        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-cyan-50 to-blue-50' : 'bg-white';


        const client = clientsMap.get(caseRecord.clientId);
        const clientName = client ? client.name : 'غير محدد';
        const opponent = opponentsMap.get(caseRecord.opponentId);
        const opponentName = opponent ? opponent.name : 'غير محدد';


        const createdDate = __formatReportsArchiveDateForDisplay(caseRecord.createdAt, 'غير محدد');

        tableRows += `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-cyan-100 hover:to-blue-100 transition-all duration-300 hover:shadow-sm">
                <td class="py-4 px-6 text-center border-l border-gray-200">
                    <div class="font-bold text-lg text-gray-800 hover:text-cyan-700 transition-colors duration-200 truncate" title="${clientName}">${clientName}</div>
                </td>
                <td class="py-4 px-6 text-center border-l border-gray-200">
                    <div class="font-bold text-base text-gray-800 hover:text-cyan-700 transition-colors duration-200 truncate" title="${opponentName}">${opponentName}</div>
                </td>
                <td class="py-4 px-6 text-center border-l border-gray-200 whitespace-nowrap" style="width: 170px;">
                    <div class="font-bold text-base text-gray-800 hover:text-cyan-700 transition-colors duration-200 whitespace-nowrap">${caseRecord.caseNumber || 'غير محدد'} لسنة ${caseRecord.caseYear || 'غير محدد'}</div>
                </td>
                <td class="py-4 px-6 text-center whitespace-nowrap" style="width: 140px;">
                    <div class="font-bold text-base text-gray-800 hover:text-cyan-700 transition-colors duration-200 whitespace-nowrap">${caseRecord.caseType || 'غير محدد'}</div>
                </td>
            </tr>
        `;
    });

    return `
        <div class="archive-report-container" style="height: 100%; overflow-y: auto; position: relative;">
            <!-- جدول الأرشيف -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100">
                <table class="w-full border-separate" style="border-spacing: 0;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #0891b2 !important;">
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #0891b2 !important; color: white !important; border-color: #06b6d4 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #06b6d4;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-user-line text-sm"></i>
                                    <span>اسم الموكل</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #0891b2 !important; color: white !important; border-color: #06b6d4 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #06b6d4;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-shield-user-line text-sm"></i>
                                    <span>اسم الخصم</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #0891b2 !important; color: white !important; border-color: #06b6d4 !important; white-space: nowrap; width: 170px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #06b6d4;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-hashtag text-sm"></i>
                                    <span>رقم القضية لسنة</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #0891b2 !important; color: white !important; white-space: nowrap; width: 140px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-file-list-line text-sm"></i>
                                    <span>نوع القضية</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody id="archive-table-body">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


let currentArchiveSortOrder = 'desc';


async function toggleArchiveSort() {
    try {

        currentArchiveSortOrder = currentArchiveSortOrder === 'desc' ? 'asc' : 'desc';


        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();


        const sortButton = document.querySelector('button[onclick="toggleArchiveSort()"]');
        const icon = sortButton.querySelector('i');
        const text = sortButton.querySelector('span');

        icon.className = currentArchiveSortOrder === 'desc' ? 'ri-time-line' : 'ri-history-line';
        text.textContent = currentArchiveSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';


        const reportContent = document.getElementById('archive-report-content');
        reportContent.innerHTML = generateArchiveReportHTML(archivedCases, clients, opponents, currentArchiveSortOrder);

    } catch (error) {
        console.error('Error sorting archive report:', error);
        showToast('حدث خطأ أثناء فرز التقرير', 'error');
    }
}


function filterArchiveReport(searchTerm, archivedCases, clients) {
    if (!searchTerm.trim()) {

        const reportContent = document.getElementById('archive-report-content');
        const opponents = __reportsArchiveAllOpponents || [];
        reportContent.innerHTML = generateArchiveReportHTML(archivedCases, clients, opponents, currentArchiveSortOrder);
        __reportsArchiveCurrentCases = Array.isArray(archivedCases) ? archivedCases : [];
        __reportsArchiveCurrentClients = Array.isArray(clients) ? clients : [];
        __reportsArchiveCurrentOpponents = Array.isArray(opponents) ? opponents : [];
        return;
    }

    const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    const filteredCases = archivedCases.filter(caseRecord => {

        const client = clientsMap.get(caseRecord.clientId);
        const clientName = client ? client.name : '';

        const caseNumber = caseRecord.caseNumber || '';
        const caseYear = caseRecord.caseYear || '';
        const caseType = caseRecord.caseType || '';

        return (
            clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            caseYear.includes(searchTerm) ||
            caseType.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    __reportsArchiveCurrentCases = filteredCases;
    __reportsArchiveCurrentClients = Array.isArray(clients) ? clients : [];
    __reportsArchiveCurrentOpponents = Array.isArray(__reportsArchiveAllOpponents) ? __reportsArchiveAllOpponents : [];
    const reportContent = document.getElementById('archive-report-content');
    reportContent.innerHTML = generateArchiveReportHTML(filteredCases, clients, __reportsArchiveCurrentOpponents, currentArchiveSortOrder);
}


async function printArchiveReport() {
    try {
        await __getReportsArchiveDateLocaleSetting();
        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();

        let casesData = [...archivedCases];
        casesData.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.id);
            const dateB = new Date(b.createdAt || b.id);

            if (currentArchiveSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));


        let tableRows = '';
        const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
        const opponentsMap = new Map(Array.isArray(opponents) ? opponents.map(o => [o.id, o]) : []);
        casesData.forEach((caseRecord, i) => {
            const client = clientsMap.get(caseRecord.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const opponent = opponentsMap.get(caseRecord.opponentId);
            const opponentName = opponent ? opponent.name : 'غير محدد';
            const caseNumber = caseRecord.caseNumber || 'غير محدد';
            const caseYear = caseRecord.caseYear || 'غير محدد';
            const caseType = caseRecord.caseType || 'غير محدد';

            let caseNumberYear = 'غير محدد';
            if (caseRecord.caseNumber && caseRecord.caseYear) {
                caseNumberYear = `<span style="font-weight: bold;">${caseNumber}</span> <span style="color: #999;">-</span> <span style="font-weight: bold;">${caseYear}</span>`;
            } else if (caseRecord.caseNumber || caseRecord.caseYear) {
                caseNumberYear = caseNumber !== 'غير محدد' ? caseNumber : caseYear;
            }

            const rowBg = i % 2 === 0 ? '#ecfeff' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${clientName}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${opponentName}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${caseNumberYear}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${caseType}</td>
                </tr>
            `;
        });


        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير الأرشيف</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsArchiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                    <thead>
                        <tr>
                            <th style="background-color: #0891b2; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 18px;">اسم الموكل</th>
                            <th style="background-color: #0891b2; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 18px;">اسم الخصم</th>
                            <th style="background-color: #0891b2; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 18px;">رقم القضية لسنة</th>
                            <th style="background-color: #0891b2; color: white; padding: 8px 6px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 18px;">نوع القضية</th>
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
            <title>تقرير الأرشيف - ${new Date().toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG')}</title>
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
        console.error('Error printing report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}


async function exportArchiveReportExcel() {
    try {
        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();


        let casesData = [...archivedCases];
        casesData.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.id);
            const dateB = new Date(b.createdAt || b.id);

            if (currentArchiveSortOrder === 'desc') {
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
                        background: #0891b2;
                        background-color: #0891b2;
                        color: #FFFFFF;
                        border: 2px solid #06b6d4;
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
                        <th style="background-color: #0891b2; color: #FFFFFF; border: 2px solid #06b6d4; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">اسم الموكل</th>
                        <th style="background-color: #0891b2; color: #FFFFFF; border: 2px solid #06b6d4; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">اسم الخصم</th>
                        <th style="background-color: #0891b2; color: #FFFFFF; border: 2px solid #06b6d4; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">رقم القضية لسنة</th>
                        <th style="background-color: #0891b2; color: #FFFFFF; border: 2px solid #06b6d4; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">نوع القضية</th>
                    </tr>
        `;


        const clientsMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
        const opponentsMap = new Map(Array.isArray(opponents) ? opponents.map(o => [o.id, o]) : []);
        casesData.forEach((caseRecord) => {
            const client = clientsMap.get(caseRecord.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const opponent = opponentsMap.get(caseRecord.opponentId);
            const opponentName = opponent ? opponent.name : 'غير محدد';
            const caseNumber = caseRecord.caseNumber || 'غير محدد';
            const caseYear = caseRecord.caseYear || 'غير محدد';
            const caseType = caseRecord.caseType || 'غير محدد';
            const caseNumberYear = `${caseNumber} لسنة ${caseYear}`;

            const clientStyle = client ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const caseNumberStyle = (caseRecord.caseNumber || caseRecord.caseYear) ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const caseTypeStyle = caseRecord.caseType ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            excelContent += `
                <tr>
                    <td ${clientStyle}>${clientName}</td>
                    <td ${clientStyle}>${opponentName}</td>
                    <td ${caseNumberStyle}>${caseNumberYear}</td>
                    <td ${caseTypeStyle}>${caseType}</td>
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


async function exportArchiveReportPDF() {
    try {
        await __getReportsArchiveDateLocaleSetting();
        const { cases: archivedCases, clients, opponents } = __getReportsArchiveDataForAction();

        let casesData = [...archivedCases];
        casesData.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.id);
            const dateB = new Date(b.createdAt || b.id);

            if (currentArchiveSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        let tableRows = '';
        casesData.forEach((caseRecord, i) => {
            const client = clients.find(c => c.id === caseRecord.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const opponent = opponents.find(o => o.id === caseRecord.opponentId);
            const opponentName = opponent ? opponent.name : 'غير محدد';
            const caseNumber = caseRecord.caseNumber || 'غير محدد';
            const caseYear = caseRecord.caseYear || 'غير محدد';
            const caseType = caseRecord.caseType || 'غير محدد';

            let caseNumberYear = 'غير محدد';
            if (caseRecord.caseNumber && caseRecord.caseYear) {
                caseNumberYear = `<span style="font-weight: bold;">${caseNumber}</span> <span style="color: #999;">لسنة</span> <span style="font-weight: bold;">${caseYear}</span>`;
            } else if (caseRecord.caseNumber || caseRecord.caseYear) {
                caseNumberYear = caseNumber !== 'غير محدد' ? caseNumber : caseYear;
            }

            const rowBg = i % 2 === 0 ? '#ecfeff' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientName}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${opponentName}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${caseNumberYear}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${caseType}</td>
                </tr>
            `;
        });

        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 10px;">
                    <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير الأرشيف</div>
                    <div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsArchiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <thead>
                        <tr>
                            <th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">اسم الموكل</th>
                            <th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">اسم الخصم</th>
                            <th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">رقم القضية - السنة</th>
                            <th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">نوع القضية</th>
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
            filename: `تقرير_الأرشيف_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        await html2pdf().set(opt).from(element).save();
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
        let casesData = [...archivedCases];
        casesData.sort((a, b) => (currentArchiveSortOrder === 'desc' ? new Date(b.createdAt || b.id) - new Date(a.createdAt || a.id) : new Date(a.createdAt || a.id) - new Date(b.createdAt || b.id)));
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        let tableRows = '';
        casesData.forEach((caseRecord, i) => {
            const client = clients.find(c => c.id === caseRecord.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const opponent = opponents.find(o => o.id === caseRecord.opponentId);
            const opponentName = opponent ? opponent.name : 'غير محدد';
            const caseNumber = caseRecord.caseNumber || 'غير محدد';
            const caseYear = caseRecord.caseYear || 'غير محدد';
            const caseType = caseRecord.caseType || 'غير محدد';
            let caseNumberYear = 'غير محدد';
            if (caseRecord.caseNumber && caseRecord.caseYear) caseNumberYear = `${caseNumber} لسنة ${caseYear}`;
            else if (caseRecord.caseNumber || caseRecord.caseYear) caseNumberYear = caseNumber !== 'غير محدد' ? caseNumber : caseYear;
            const rowBg = i % 2 === 0 ? '#ecfeff' : '#ffffff';
            tableRows += `<tr style="background: ${rowBg};"><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientName}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${opponentName}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${caseNumberYear}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${caseType}</td></tr>`;
        });
        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `<div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;"><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 10px;"><div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير الأرشيف</div><div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsArchiveDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsArchiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div><div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div></div><table style="width: 100%; border-collapse: collapse; margin-top: 4px;"><thead><tr><th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">اسم الموكل</th><th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">اسم الخصم</th><th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">رقم القضية - السنة</th><th style="background-color: #0891b2; color: white; padding: 5px 4px; text-align: center; border: 1px solid #0e7490; font-weight: bold; font-size: 9px;">نوع القضية</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
        const opt = { margin: [8, 10, 8, 10], filename: `تقرير_الأرشيف_${new Date().toISOString().split('T')[0]}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuArchive();
        const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
        if (typeof shareReportPdfAsFile === 'function') await shareReportPdfAsFile(blob, opt.filename);
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = opt.filename; a.click(); URL.revokeObjectURL(a.href); window.open('https://wa.me/?text=' + encodeURIComponent('تقرير PDF مرفق'), '_blank'); showToast('تم تحميل التقرير. يمكنك إرفاقه في واتساب.', 'success'); }
    } catch (error) {
        console.error('Error exporting report to WhatsApp:', error);
        showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}

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


document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu-archive');
    const button = document.getElementById('export-btn-archive');

    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
    }
});