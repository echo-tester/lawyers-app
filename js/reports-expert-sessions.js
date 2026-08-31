


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

let __reportsExpertAllSessions = [];
let __reportsExpertAllClients = [];
let __reportsExpertCurrentSessions = [];
let __reportsExpertCurrentClients = [];

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
                        <button onclick="toggleExpertSessionsSort()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <i class="ri-time-line"></i>
                            <span>الأحدث</span>
                        </button>
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
                <div class="bg-white rounded-lg border border-gray-200 pt-0 pb-6 pl-0 pr-0 relative flex-1 overflow-y-auto overflow-x-auto" id="expert-sessions-report-content">
                    ${generateExpertSessionsReportHTML(__reportsExpertCurrentSessions, __reportsExpertCurrentClients)}
                </div>
            </div>
        `;


        document.getElementById('expert-sessions-search').addEventListener('input', function (e) {
            filterExpertSessionsReport(e.target.value, expertSessions, clients);
        });

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


function generateExpertSessionsReportHTML(expertSessions, clients, sortOrder = 'desc') {
    if (expertSessions.length === 0) {
        return `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-team-line text-8xl text-pink-200"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على بيانات جلسات الخبراء</p>
            </div>
        `;
    }


    let sessionsData = [...expertSessions];
    sessionsData.sort((a, b) => {
        const dateA = new Date(a.sessionDate || a.createdAt || a.id);
        const dateB = new Date(b.sessionDate || b.createdAt || b.id);

        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    const clientMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    let tableRows = '';
    sessionsData.forEach((session, i) => {

        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-pink-50 to-rose-50' : 'bg-white';


        const client = session.clientId ? clientMap.get(session.clientId) : null;
        const clientName = client ? client.name : 'غير محدد';


        const sessionDate = __formatReportsExpertSessionsDateForDisplay(session.sessionDate);

        tableRows += `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-pink-100 hover:to-rose-100 transition-all duration-300 hover:shadow-sm">
                <td class="py-4 px-4 text-center border-l border-gray-200 min-w-[180px]">
                    <div class="font-bold text-base text-gray-800 hover:text-pink-700 transition-colors duration-200 truncate min-w-0" title="${clientName}">${clientName}</div>
                </td>
                <td class="py-4 px-4 text-center border-l border-gray-200 whitespace-nowrap min-w-[130px]" style="width: 130px;">
                    <div class="font-bold text-base text-gray-800 hover:text-pink-700 transition-colors duration-200 truncate min-w-0" title="${session.outgoingNumber || 'غير محدد'}">${session.outgoingNumber || 'غير محدد'}</div>
                </td>
                <td class="py-4 px-4 text-center border-l border-gray-200 whitespace-nowrap min-w-[130px]" style="width: 130px;">
                    <div class="font-bold text-base text-gray-800 hover:text-pink-700 transition-colors duration-200 truncate min-w-0" title="${session.incomingNumber || 'غير محدد'}">${session.incomingNumber || 'غير محدد'}</div>
                </td>
                <td class="py-4 px-4 text-center whitespace-nowrap min-w-[130px]" style="width: 130px;">
                    <div class="font-bold text-base text-gray-800 hover:text-pink-700 transition-colors duration-200 whitespace-nowrap" title="${sessionDate}">${sessionDate}</div>
                </td>
            </tr>
        `;
    });

    return `
        <div class="expert-sessions-report-container" style="height: 100%; overflow-y: auto; overflow-x: auto; position: relative;">
            <!-- جدول جلسات الخبراء -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-x-auto">
                <table class="w-full border-separate min-w-[600px]" style="border-spacing: 0; table-layout: auto;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #db2777 !important;">
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #db2777 !important; color: white !important; border-color: #ec4899 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #ec4899; min-width: 180px;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-user-line text-sm"></i>
                                    <span>اسم الموكل</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #db2777 !important; color: white !important; border-color: #ec4899 !important; white-space: nowrap; width: 130px; min-width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #ec4899;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-file-upload-line text-sm"></i>
                                    <span>رقم الصادر</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #db2777 !important; color: white !important; border-color: #ec4899 !important; white-space: nowrap; width: 130px; min-width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #ec4899;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-file-download-line text-sm"></i>
                                    <span>رقم الوارد</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #db2777 !important; color: white !important; white-space: nowrap; width: 130px; min-width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-calendar-line text-sm"></i>
                                    <span>تاريخ الجلسة</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody id="expert-sessions-table-body">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


let currentExpertSessionsSortOrder = 'desc';


async function toggleExpertSessionsSort() {
    try {

        currentExpertSessionsSortOrder = currentExpertSessionsSortOrder === 'desc' ? 'asc' : 'desc';


        const { sessions: expertSessions, clients } = __getReportsExpertSessionsDataForAction();


        const sortButton = document.querySelector('button[onclick="toggleExpertSessionsSort()"]');
        const icon = sortButton.querySelector('i');
        const text = sortButton.querySelector('span');

        icon.className = currentExpertSessionsSortOrder === 'desc' ? 'ri-time-line' : 'ri-history-line';
        text.textContent = currentExpertSessionsSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';


        const reportContent = document.getElementById('expert-sessions-report-content');
        reportContent.innerHTML = generateExpertSessionsReportHTML(expertSessions, clients, currentExpertSessionsSortOrder);

    } catch (error) {
        console.error('Error sorting expert sessions report:', error);
        showToast('حدث خطأ أثناء فرز التقرير', 'error');
    }
}


function filterExpertSessionsReport(searchTerm, expertSessions, clients) {
    if (!searchTerm.trim()) {

        const reportContent = document.getElementById('expert-sessions-report-content');
        reportContent.innerHTML = generateExpertSessionsReportHTML(expertSessions, clients, currentExpertSessionsSortOrder);
        __reportsExpertCurrentSessions = Array.isArray(expertSessions) ? expertSessions : [];
        __reportsExpertCurrentClients = Array.isArray(clients) ? clients : [];
        return;
    }

    const clientMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    const searchLower = searchTerm.toLowerCase();

    const filteredSessions = expertSessions.filter(session => {

        const client = session.clientId ? clientMap.get(session.clientId) : null;
        const clientName = client ? client.name : '';

        const sessionDate = session.sessionDate || '';
        const outgoingNumber = session.outgoingNumber || '';
        const incomingNumber = session.incomingNumber || '';

        return (
            clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sessionDate.includes(searchTerm) ||
            outgoingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incomingNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const reportContent = document.getElementById('expert-sessions-report-content');
    __reportsExpertCurrentSessions = filteredSessions;
    __reportsExpertCurrentClients = Array.isArray(clients) ? clients : [];
    reportContent.innerHTML = generateExpertSessionsReportHTML(filteredSessions, clients, currentExpertSessionsSortOrder);
}


async function printExpertSessionsReport() {
    try {
        const { sessions: expertSessions, clients } = __getReportsExpertSessionsDataForAction();

        let sessionsData = [...expertSessions];
        sessionsData.sort((a, b) => {
            const dateA = new Date(a.sessionDate || a.id);
            const dateB = new Date(b.sessionDate || b.id);

            if (currentExpertSessionsSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));


        let tableRows = '';
        sessionsData.forEach((session, i) => {
            const client = clients.find(c => c.id === session.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const outgoingNumber = session.outgoingNumber || 'غير محدد';
            const incomingNumber = session.incomingNumber || 'غير محدد';
            const sessionDate = session.sessionDate || 'غير محدد';

            const rowBg = i % 2 === 0 ? '#fdf2f8' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${clientName}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${outgoingNumber}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${incomingNumber}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${sessionDate}</td>
                </tr>
            `;
        });


        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير جلسات الخبراء</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsExpertSessionsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsExpertSessionsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                    <thead>
                        <tr>
                            <th style="background-color: #db2777; color: white; padding: 8px 6px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 18px;">اسم الموكل</th>
                            <th style="background-color: #db2777; color: white; padding: 8px 6px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 18px;">رقم الصادر</th>
                            <th style="background-color: #db2777; color: white; padding: 8px 6px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 18px;">رقم الوارد</th>
                            <th style="background-color: #db2777; color: white; padding: 8px 6px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 18px;">تاريخ الجلسة</th>
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
            <title>تقرير جلسات الخبراء - ${new Date().toLocaleDateString(__reportsExpertSessionsDateLocaleCache || 'ar-EG')}</title>
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


async function exportExpertSessionsReportExcel() {
    try {
        const { sessions: expertSessions, clients } = __getReportsExpertSessionsDataForAction();


        let sessionsData = [...expertSessions];
        sessionsData.sort((a, b) => {
            const dateA = new Date(a.sessionDate || a.createdAt || a.id);
            const dateB = new Date(b.sessionDate || b.createdAt || b.id);

            if (currentExpertSessionsSortOrder === 'desc') {
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
                                <x:Name>تقرير جلسات الخبراء</x:Name>
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
                        background: #db2777;
                        background-color: #db2777;
                        color: #FFFFFF;
                        border: 2px solid #ec4899;
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
                        <th style="background-color: #db2777; color: #FFFFFF; border: 2px solid #ec4899; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">اسم الموكل</th>
                        <th style="background-color: #db2777; color: #FFFFFF; border: 2px solid #ec4899; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">رقم الصادر</th>
                        <th style="background-color: #db2777; color: #FFFFFF; border: 2px solid #ec4899; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">رقم الوارد</th>
                        <th style="background-color: #db2777; color: #FFFFFF; border: 2px solid #ec4899; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">تاريخ الجلسة</th>
                    </tr>
        `;


        sessionsData.forEach((session) => {
            const client = clients.find(c => c.id === session.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const outgoingNumber = session.outgoingNumber || 'غير محدد';
            const incomingNumber = session.incomingNumber || 'غير محدد';
            const sessionDate = session.sessionDate || 'غير محدد';

            const clientStyle = client ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const outgoingStyle = session.outgoingNumber ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const incomingStyle = session.incomingNumber ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const dateStyle = session.sessionDate ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            excelContent += `
                <tr>
                    <td ${clientStyle}>${clientName}</td>
                    <td ${outgoingStyle}>${outgoingNumber}</td>
                    <td ${incomingStyle}>${incomingNumber}</td>
                    <td ${dateStyle}>${sessionDate}</td>
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


async function exportExpertSessionsReportPDF() {
    try {
        const { sessions: expertSessions, clients } = __getReportsExpertSessionsDataForAction();

        let sessionsData = [...expertSessions];
        sessionsData.sort((a, b) => {
            const dateA = new Date(a.sessionDate || a.id);
            const dateB = new Date(b.sessionDate || b.id);

            if (currentExpertSessionsSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        let tableRows = '';
        sessionsData.forEach((session, i) => {
            const client = clients.find(c => c.id === session.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const outgoingNumber = session.outgoingNumber || 'غير محدد';
            const incomingNumber = session.incomingNumber || 'غير محدد';
            const sessionDate = session.sessionDate || 'غير محدد';

            const rowBg = i % 2 === 0 ? '#fdf2f8' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientName}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${outgoingNumber}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${incomingNumber}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${sessionDate}</td>
                </tr>
            `;
        });

        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 10px;">
                    <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير جلسات الخبراء</div>
                    <div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsExpertSessionsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsExpertSessionsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <thead>
                        <tr>
                            <th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">اسم الموكل</th>
                            <th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">رقم الصادر</th>
                            <th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">رقم الوارد</th>
                            <th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">تاريخ الجلسة</th>
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
            filename: `تقرير_جلسات_الخبراء_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        await html2pdf().set(opt).from(element).save();
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuExperts();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportExpertSessionsReportWhatsApp() {
    try {
        const { sessions: expertSessions, clients } = __getReportsExpertSessionsDataForAction();
        let sessionsData = [...expertSessions];
        sessionsData.sort((a, b) => (currentExpertSessionsSortOrder === 'desc' ? new Date(b.sessionDate || b.id) - new Date(a.sessionDate || a.id) : new Date(a.sessionDate || a.id) - new Date(b.sessionDate || b.id)));
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        let tableRows = '';
        sessionsData.forEach((session, i) => {
            const client = clients.find(c => c.id === session.clientId);
            const clientName = client ? client.name : 'غير محدد';
            const outgoingNumber = session.outgoingNumber || 'غير محدد';
            const incomingNumber = session.incomingNumber || 'غير محدد';
            const sessionDate = session.sessionDate || 'غير محدد';
            const rowBg = i % 2 === 0 ? '#fdf2f8' : '#ffffff';
            tableRows += `<tr style="background: ${rowBg};"><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientName}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${outgoingNumber}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${incomingNumber}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${sessionDate}</td></tr>`;
        });
        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `<div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;"><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 10px;"><div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير جلسات الخبراء</div><div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsExpertSessionsDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsExpertSessionsDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div><div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div></div><table style="width: 100%; border-collapse: collapse; margin-top: 4px;"><thead><tr><th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">اسم الموكل</th><th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">رقم الصادر</th><th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">رقم الوارد</th><th style="background-color: #db2777; color: white; padding: 5px 4px; text-align: center; border: 1px solid #be185d; font-weight: bold; font-size: 9px;">تاريخ الجلسة</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
        const opt = { margin: [8, 10, 8, 10], filename: `تقرير_جلسات_الخبراء_${new Date().toISOString().split('T')[0]}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuExperts();
        const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
        if (typeof shareReportPdfAsFile === 'function') await shareReportPdfAsFile(blob, opt.filename);
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = opt.filename; a.click(); URL.revokeObjectURL(a.href); window.open('https://wa.me/?text=' + encodeURIComponent('تقرير PDF مرفق'), '_blank'); showToast('تم تحميل التقرير. يمكنك إرفاقه في واتساب.', 'success'); }
    } catch (error) {
        console.error('Error exporting report to WhatsApp:', error);
        showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}

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


document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu-experts');
    const button = document.getElementById('export-btn-experts');

    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
    }
});