


let globalAdministrativeData = [];
let globalClientsData = [];

let __reportsAdministrativeAllData = [];
let __reportsAdministrativeAllClients = [];
let __reportsAdministrativeCurrentData = [];
let __reportsAdministrativeCurrentClients = [];
let __reportsAdministrativeLastSearchTerm = '';

function __getReportsAdministrativeDataForAction() {
    try {
        const a = Array.isArray(__reportsAdministrativeCurrentData) ? __reportsAdministrativeCurrentData : [];
        const c = Array.isArray(__reportsAdministrativeCurrentClients) ? __reportsAdministrativeCurrentClients : [];
        if (a.length || c.length) return { administrative: a, clients: c };
    } catch (e) { }
    return {
        administrative: Array.isArray(__reportsAdministrativeAllData) ? __reportsAdministrativeAllData : [],
        clients: Array.isArray(__reportsAdministrativeAllClients) ? __reportsAdministrativeAllClients : []
    };
}

function __applyAdministrativeSearchAndStatus(baseAdministrative, clients, searchTerm, statusFilter) {
    const term = String(searchTerm || '').trim().toLowerCase();

    let data = Array.isArray(baseAdministrative) ? baseAdministrative.slice() : [];
    const cl = Array.isArray(clients) ? clients : [];

    if (term) {
        data = data.filter(work => {
            const client = work.clientId ? cl.find(c => c.id === work.clientId) : null;
            const clientName = client ? String(client.name || '').toLowerCase() : 'عام';
            const task = work.task ? String(work.task).toLowerCase() : '';
            const description = work.description ? String(work.description).toLowerCase() : '';
            const notes = work.notes ? String(work.notes).toLowerCase() : '';
            return clientName.includes(term) || task.includes(term) || description.includes(term) || notes.includes(term);
        });
    }

    if (statusFilter === 'completed') {
        data = data.filter(work => work.completed === true);
    } else if (statusFilter === 'pending') {
        data = data.filter(work => work.completed === false);
    } else if (statusFilter === 'overdue') {
        data = data.filter(work => {
            if (work.completed || !work.dueDate) return false;
            const today = new Date();
            const due = new Date(work.dueDate);
            return due < today;
        });
    }

    return { data, clients: cl };
}

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

function __formatReportsAdministrativeDateForDisplay(dateStr) {
    try {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (!Number.isFinite(d.getTime())) return (dateStr || '-');
        return d.toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || '-');
    }
}


async function updateAdministrativeReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');

    try {

        await __getReportsAdministrativeDateLocaleSetting();

        const administrative = await getAllAdministrative();
        const clients = await getAllClients();


        globalAdministrativeData = administrative;
        globalClientsData = clients;

        __reportsAdministrativeAllData = Array.isArray(administrative) ? administrative : [];
        __reportsAdministrativeAllClients = Array.isArray(clients) ? clients : [];
        __reportsAdministrativeLastSearchTerm = '';
        __reportsAdministrativeCurrentData = __reportsAdministrativeAllData;
        __reportsAdministrativeCurrentClients = __reportsAdministrativeAllClients;

        const colors = { bg: '#6366f1', bgHover: '#4f46e5', bgLight: '#f8fafc', text: '#4f46e5', textLight: '#a5b4fc' };

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
                        <button onclick="toggleAdministrativeSort()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" id="administrative-sort-btn">
                            <i class="ri-time-line"></i>
                            <span>الأحدث</span>
                        </button>
                        <div class="relative">
                            <button onclick="toggleExportMenuAdmin()" id="export-btn-admin" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
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
                        <button onclick="printAdministrativeReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 pt-0 pb-6 pl-0 pr-0 relative flex-1 overflow-y-auto" id="administrative-report-content">
                    ${generateAdministrativeReportHTML(__reportsAdministrativeCurrentData, __reportsAdministrativeCurrentClients)}
                </div>
            </div>
        `;


        document.getElementById('administrative-search').addEventListener('input', function (e) {
            filterAdministrativeReport(e.target.value, administrative, clients);
        });

    } catch (error) {
        console.error('Error loading administrative data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات الأعمال الإدارية</p>
                    </div>
                </div>
            </div>
        `;
    }
}


function generateAdministrativeReportHTML(administrative, clients, sortOrder = 'desc', statusFilter = 'all') {
    if (administrative.length === 0) {
        return `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-briefcase-line text-8xl text-indigo-200"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على أعمال إدارية</p>
            </div>
        `;
    }


    let filteredAdministrative = administrative;
    if (statusFilter === 'completed') {
        filteredAdministrative = administrative.filter(work => work.completed === true);
    } else if (statusFilter === 'pending') {
        filteredAdministrative = administrative.filter(work => work.completed === false);
    } else if (statusFilter === 'overdue') {
        filteredAdministrative = administrative.filter(work => {
            if (work.completed || !work.dueDate) return false;
            const today = new Date();
            const due = new Date(work.dueDate);
            return due < today;
        });
    }


    filteredAdministrative.sort((a, b) => {
        const dateA = new Date(a.dueDate || a.createdAt);
        const dateB = new Date(b.dueDate || b.createdAt);

        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    let tableRows = '';
    filteredAdministrative.forEach((work, i) => {

        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-indigo-50 to-blue-50' : 'bg-white';


        const client = work.clientId ? clients.find(c => c.id === work.clientId) : null;
        const clientName = client ? client.name : 'عام';


        const dueDate = __formatReportsAdministrativeDateForDisplay(work.dueDate);


        const statusIcon = work.completed ?
            '<i class="ri-checkbox-circle-fill text-green-600"></i>' :
            '<i class="ri-time-line text-orange-600"></i>';
        const statusText = work.completed ? 'مكتمل' : 'قيد التنفيذ';
        const statusColor = work.completed ? 'text-green-600' : 'text-orange-600';


        let priorityColor = 'text-gray-600';
        let priorityIcon = 'ri-calendar-line';
        if (work.dueDate && !work.completed) {
            const today = new Date();
            const due = new Date(work.dueDate);
            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                priorityColor = 'text-red-600';
                priorityIcon = 'ri-alarm-warning-line';
            } else if (diffDays <= 3) {
                priorityColor = 'text-orange-600';
                priorityIcon = 'ri-time-line';
            } else if (diffDays <= 7) {
                priorityColor = 'text-yellow-600';
                priorityIcon = 'ri-calendar-check-line';
            } else {
                priorityColor = 'text-green-600';
                priorityIcon = 'ri-calendar-line';
            }
        }


        const taskValue = (work.task && String(work.task).trim()) ? String(work.task).trim() : (work.description || '');
        const parts = [taskValue, work.notes].filter(s => s && String(s).trim());
        const fullTaskText = parts.join(' - ');

        tableRows += `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-indigo-100 hover:to-blue-100 transition-all duration-300 hover:shadow-sm">
                <td class="py-4 px-6 text-center border-l border-gray-200">
                    <div class="font-bold text-base text-gray-800 hover:text-indigo-700 transition-colors duration-200" title="${fullTaskText}">${fullTaskText}</div>
                </td>
                <td class="py-4 px-6 text-center border-l border-gray-200" style="width: 140px;">
                    <div class="flex items-center justify-center gap-2 font-bold text-sm ${statusColor} whitespace-nowrap">
                        ${statusIcon}
                        <span>${statusText}</span>
                    </div>
                </td>
                <td class="py-4 px-6 text-center" style="width: 160px;">
                    <div class="font-medium text-sm text-gray-700 whitespace-nowrap ${priorityColor}">
                        <i class="${priorityIcon}"></i> ${dueDate}
                    </div>
                </td>
            </tr>
        `;
    });


    const totalWorks = __reportsAdministrativeAllData.length;
    const completedWorks = __reportsAdministrativeAllData.filter(work => work.completed === true).length;
    const pendingWorks = __reportsAdministrativeAllData.filter(work => work.completed === false).length;
    const overdueWorks = __reportsAdministrativeAllData.filter(work => {
        if (work.completed || !work.dueDate) return false;
        const today = new Date();
        const due = new Date(work.dueDate);
        return due < today;
    }).length;

    return `
        <div class="administrative-report-container" style="height: 100%; overflow-y: auto; position: relative;">
            <!-- إحصائيات سريعة -->
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
            <div class="administrative-stats-grid mb-6">
                <div onclick="filterAdministrativeByStatus('all')" class="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-status="all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <i class="ri-briefcase-line text-white text-lg"></i>
                        </div>
                        <div>
                            <p class="text-sm text-blue-600 font-medium">إجمالي الأعمال</p>
                            <p class="text-lg font-bold text-blue-700">${totalWorks}</p>
                        </div>
                    </div>
                </div>
                
                <div onclick="filterAdministrativeByStatus('completed')" class="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border-2 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-status="completed">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <i class="ri-checkbox-circle-line text-white text-lg"></i>
                        </div>
                        <div>
                            <p class="text-sm text-green-600 font-medium">مكتملة</p>
                            <p class="text-lg font-bold text-green-700">${completedWorks}</p>
                        </div>
                    </div>
                </div>
                
                <div onclick="filterAdministrativeByStatus('pending')" class="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-xl border-2 border-yellow-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-status="pending">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                            <i class="ri-time-line text-white text-lg"></i>
                        </div>
                        <div>
                            <p class="text-sm text-yellow-600 font-medium">قيد التنفيذ</p>
                            <p class="text-lg font-bold text-yellow-700">${pendingWorks}</p>
                        </div>
                    </div>
                </div>
                
                <div onclick="filterAdministrativeByStatus('overdue')" class="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl border-2 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-status="overdue">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                            <i class="ri-alarm-warning-line text-white text-lg"></i>
                        </div>
                        <div>
                            <p class="text-sm text-red-600 font-medium">متأخرة</p>
                            <p class="text-lg font-bold text-red-700">${overdueWorks}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- جدول الأعمال الإدارية -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100">
                <table class="w-full border-separate" style="border-spacing: 0;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #6366f1 !important;">
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #6366f1 !important; color: white !important; border-color: #4f46e5 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #4f46e5;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-task-line text-sm"></i>
                                    <span>المهمة</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #6366f1 !important; color: white !important; border-color: #4f46e5 !important; white-space: nowrap; width: 140px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #4f46e5;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-checkbox-circle-line text-sm"></i>
                                    <span>الحالة</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #6366f1 !important; color: white !important; white-space: nowrap; width: 160px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-calendar-line text-sm"></i>
                                    <span>تاريخ الإنجاز</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody id="administrative-table-body">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


let currentAdministrativeSortOrder = 'desc';
let currentAdministrativeStatusFilter = 'all';


async function toggleAdministrativeSort() {
    try {

        currentAdministrativeSortOrder = currentAdministrativeSortOrder === 'desc' ? 'asc' : 'desc';


        const { administrative, clients } = __getReportsAdministrativeDataForAction();


        const sortButton = document.querySelector('button[onclick="toggleAdministrativeSort()"]');
        const icon = sortButton.querySelector('i');
        const text = sortButton.querySelector('span');

        icon.className = currentAdministrativeSortOrder === 'desc' ? 'ri-time-line' : 'ri-history-line';
        text.textContent = currentAdministrativeSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';


        const reportContent = document.getElementById('administrative-report-content');
        reportContent.innerHTML = generateAdministrativeReportHTML(administrative, clients, currentAdministrativeSortOrder, currentAdministrativeStatusFilter);

    } catch (error) {
        console.error('Error sorting administrative report:', error);
        showToast('حدث خطأ أثناء فرز التقرير', 'error');
    }
}


function filterAdministrativeReport(searchTerm, administrative, clients) {
    __reportsAdministrativeLastSearchTerm = String(searchTerm || '');
    if (!searchTerm.trim()) {

        const reportContent = document.getElementById('administrative-report-content');
        reportContent.innerHTML = generateAdministrativeReportHTML(administrative, clients, currentAdministrativeSortOrder, currentAdministrativeStatusFilter);
        __reportsAdministrativeCurrentData = Array.isArray(administrative) ? administrative : [];
        __reportsAdministrativeCurrentClients = Array.isArray(clients) ? clients : [];
        return;
    }


    const filteredAdministrative = administrative.filter(work => {
        const client = work.clientId ? clients.find(c => c.id === work.clientId) : null;
        const clientName = client ? client.name.toLowerCase() : 'عام';
        const task = work.task ? work.task.toLowerCase() : '';
        const description = work.description ? work.description.toLowerCase() : '';
        const notes = work.notes ? work.notes.toLowerCase() : '';

        const searchLower = searchTerm.toLowerCase();

        return clientName.includes(searchLower) ||
            task.includes(searchLower) ||
            description.includes(searchLower) ||
            notes.includes(searchLower);
    });

    __reportsAdministrativeCurrentData = filteredAdministrative;
    __reportsAdministrativeCurrentClients = Array.isArray(clients) ? clients : [];
    const reportContent = document.getElementById('administrative-report-content');
    reportContent.innerHTML = generateAdministrativeReportHTML(filteredAdministrative, clients, currentAdministrativeSortOrder, currentAdministrativeStatusFilter);
}


async function filterAdministrativeByStatus(status) {
    try {

        currentAdministrativeStatusFilter = status;


        const administrative = Array.isArray(__reportsAdministrativeAllData) ? __reportsAdministrativeAllData : [];
        const clients = Array.isArray(__reportsAdministrativeAllClients) ? __reportsAdministrativeAllClients : [];


        const res = __applyAdministrativeSearchAndStatus(administrative, clients, __reportsAdministrativeLastSearchTerm, status);
        __reportsAdministrativeCurrentData = res.data;
        __reportsAdministrativeCurrentClients = res.clients;


        document.querySelectorAll('.administrative-stats-grid > div').forEach(card => {
            const cardStatus = card.getAttribute('data-status');
            if (cardStatus === status) {
                card.style.borderWidth = '3px';
                card.style.transform = 'scale(1.05)';
            } else {
                card.style.borderWidth = '2px';
                card.style.transform = 'scale(1)';
            }
        });


        const reportContent = document.getElementById('administrative-report-content');
        reportContent.innerHTML = generateAdministrativeReportHTML(__reportsAdministrativeCurrentData, __reportsAdministrativeCurrentClients, currentAdministrativeSortOrder, status);

    } catch (error) {
        console.error('Error filtering administrative by status:', error);
        showToast('حدث خطأ أثناء التصفية', 'error');
    }
}


async function printAdministrativeReport() {
    try {

        const { administrative } = __getReportsAdministrativeDataForAction();


        let administrativeData = [...administrative];
        if (currentAdministrativeStatusFilter === 'completed') {
            administrativeData = administrativeData.filter(work => work.completed === true);
        } else if (currentAdministrativeStatusFilter === 'pending') {
            administrativeData = administrativeData.filter(work => work.completed === false);
        } else if (currentAdministrativeStatusFilter === 'overdue') {
            administrativeData = administrativeData.filter(work => {
                if (work.completed || !work.dueDate) return false;
                const today = new Date();
                const due = new Date(work.dueDate);
                return due < today;
            });
        }


        administrativeData.sort((a, b) => {
            const dateA = new Date(a.dueDate || a.createdAt);
            const dateB = new Date(b.dueDate || b.createdAt);

            if (currentAdministrativeSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));


        let tableRows = '';
        administrativeData.forEach((work, i) => {
            const parts = [work.description, work.notes].filter(s => s && s.trim());
            const fullTaskText = parts.join(' - ');

            const dueDate = __formatReportsAdministrativeDateForDisplay(work.dueDate);
            const statusText = work.completed ? 'مكتمل ✓' : 'قيد التنفيذ';
            const statusColor = work.completed ? '#16a34a' : '#f59e0b';
            const rowBg = i % 2 === 0 ? '#f8fafc' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${fullTaskText}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; color: ${statusColor}; font-weight: bold; width: 100px; font-size: 16px;">${statusText}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px; width: 110px;">${dueDate}</td>
                </tr>
            `;
        });


        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير الأعمال الإدارية</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAdministrativeDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                    <thead>
                        <tr>
                            <th style="background-color: #6366f1; color: white; padding: 8px 6px; text-align: center; border: 1px solid #4f46e5; font-weight: bold; font-size: 18px;">المهمة</th>
                            <th style="background-color: #6366f1; color: white; padding: 8px 6px; text-align: center; border: 1px solid #4f46e5; font-weight: bold; font-size: 18px; width: 100px;">الحالة</th>
                            <th style="background-color: #6366f1; color: white; padding: 8px 6px; text-align: center; border: 1px solid #4f46e5; font-weight: bold; font-size: 18px; width: 110px;">تاريخ الاستحقاق</th>
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
                <title>تقرير الأعمال الإدارية - ${new Date().toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG')}</title>
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
        console.error('Error printing administrative report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}

async function exportAdministrativeReport() {
    try {
        await __getReportsAdministrativeDateLocaleSetting();
        const { administrative, clients } = __getReportsAdministrativeDataForAction();

        let filteredAdministrative = administrative;
        if (currentAdministrativeStatusFilter === 'completed') {
            filteredAdministrative = administrative.filter(work => work.completed === true);
        } else if (currentAdministrativeStatusFilter === 'pending') {
            filteredAdministrative = administrative.filter(work => work.completed === false);
        } else if (currentAdministrativeStatusFilter === 'overdue') {
            filteredAdministrative = administrative.filter(work => {
                if (work.completed || !work.dueDate) return false;
                const today = new Date();
                const due = new Date(work.dueDate);
                return due < today;
            });
        }

        filteredAdministrative.sort((a, b) => {
            const dateA = new Date(a.dueDate || a.createdAt);
            const dateB = new Date(b.dueDate || b.createdAt);

            if (currentAdministrativeSortOrder === 'desc') {
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
                                <x:Name>تقرير الأعمال الإدارية</x:Name>
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
                        background: #6366f1;
                        background-color: #6366f1;
                        color: #FFFFFF;
                        border: 2px solid #4f46e5;
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
                                        <th style="background-color: #6366f1; color: #FFFFFF; border: 2px solid #4f46e5; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">المهمة</th>
                                        <th style="background-color: #6366f1; color: #FFFFFF; border: 2px solid #4f46e5; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">الحالة</th>
                                        <th style="background-color: #6366f1; color: #FFFFFF; border: 2px solid #4f46e5; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">تاريخ الإنجاز</th>
                                    </tr>
        `;

        filteredAdministrative.forEach((work) => {
            const parts = [work.description, work.notes].filter(s => s && String(s).trim());
            const fullTaskText = parts.length ? parts.join(' - ') : (work.task || '-');
            const status = work.completed ? 'مكتمل' : 'قيد التنفيذ';
            const dueDate = __formatReportsAdministrativeDateForDisplay(work.dueDate);

            excelContent += `
                <tr>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${fullTaskText}</td>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${status}</td>
                    <td style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;">${dueDate}</td>
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
        link.setAttribute('download', `تقرير_الأعمال_الإدارية_${new Date().toISOString().split('T')[0]}.xls`);
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

function __escapeReportsAdministrativeHtml(value) {
    const str = value === null || value === undefined ? '' : String(value);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function __createReportsAdministrativePdfElement({ officeName, tableRows, totalWorks, completedWorks, pendingWorks, overdueWorks }) {
    const element = document.createElement('div');
    element.style.direction = 'rtl';
    element.style.position = 'fixed';
    element.style.left = '-10000px';
    element.style.top = '0';
    element.style.width = '210mm';
    element.style.background = '#ffffff';

    element.innerHTML = `
        <div style="font-family: Tahoma, Arial, sans-serif; direction: rtl; padding: 8px; unicode-bidi: plaintext;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
                <tr>
                    <td style="width: 33%; color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير الأعمال الإدارية</td>
                    <td style="width: 34%; color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsAdministrativeDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsAdministrativeDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style="width: 33%; color: #666; font-size: 7px; text-align: left;">${__escapeReportsAdministrativeHtml(officeName)}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; background: #f8fafc; border: 1px solid #6366f1; border-radius: 3px;">
                <tr>
                    <td style="width: 25%; text-align: center; padding: 4px;">
                        <div style="color: #666; font-size: 7px;">الأعمال</div>
                        <div style="color: #6366f1; font-size: 9px; font-weight: bold;">${totalWorks}</div>
                    </td>
                    <td style="width: 25%; text-align: center; padding: 4px;">
                        <div style="color: #666; font-size: 7px;">مكتمل</div>
                        <div style="color: #6366f1; font-size: 9px; font-weight: bold;">${completedWorks}</div>
                    </td>
                    <td style="width: 25%; text-align: center; padding: 4px;">
                        <div style="color: #666; font-size: 7px;">تنفيذ</div>
                        <div style="color: #6366f1; font-size: 9px; font-weight: bold;">${pendingWorks}</div>
                    </td>
                    <td style="width: 25%; text-align: center; padding: 4px;">
                        <div style="color: #666; font-size: 7px;">متأخر</div>
                        <div style="color: #6366f1; font-size: 9px; font-weight: bold;">${overdueWorks}</div>
                    </td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 4px;">
                <colgroup>
                    <col />
                    <col style="width: 100px;" />
                    <col style="width: 110px;" />
                </colgroup>
                <thead>
                    <tr>
                        <th style="background-color: #6366f1; color: white; padding: 5px 4px; text-align: center; border: 1px solid #4f46e5; font-weight: bold; font-size: 9px;">المهمة</th>
                        <th style="background-color: #6366f1; color: white; padding: 5px 4px; text-align: center; border: 1px solid #4f46e5; font-weight: bold; font-size: 9px;">الحالة</th>
                        <th style="background-color: #6366f1; color: white; padding: 5px 4px; text-align: center; border: 1px solid #4f46e5; font-weight: bold; font-size: 9px;">تاريخ الإنجاز</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;

    document.body.appendChild(element);
    return element;
}

async function exportAdministrativeReportPDF() {
    try {
        await __getReportsAdministrativeDateLocaleSetting();
        const { administrative } = __getReportsAdministrativeDataForAction();

        let administrativeData = [...administrative];
        if (currentAdministrativeStatusFilter === 'completed') {
            administrativeData = administrativeData.filter(work => work.completed === true);
        } else if (currentAdministrativeStatusFilter === 'pending') {
            administrativeData = administrativeData.filter(work => work.completed === false);
        } else if (currentAdministrativeStatusFilter === 'overdue') {
            administrativeData = administrativeData.filter(work => {
                if (work.completed || !work.dueDate) return false;
                const today = new Date();
                const due = new Date(work.dueDate);
                return due < today;
            });
        }


        administrativeData.sort((a, b) => {
            const dateA = new Date(a.dueDate || a.createdAt);
            const dateB = new Date(b.dueDate || b.createdAt);

            if (currentAdministrativeSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        let tableRows = '';
        administrativeData.forEach((work, i) => {
            const parts = [work.description, work.notes].filter(s => s && s.trim());
            const fullTaskTextRaw = parts.length ? parts.join(' - ') : (work.task || '-');
            const fullTaskText = __escapeReportsAdministrativeHtml(fullTaskTextRaw);

            const dueDate = __formatReportsAdministrativeDateForDisplay(work.dueDate);
            const statusText = work.completed ? 'مكتمل ✓' : 'قيد التنفيذ';
            const statusColor = work.completed ? '#16a34a' : '#f59e0b';
            const rowBg = i % 2 === 0 ? '#f8fafc' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 4px 6px; text-align: right; font-size: 8px; white-space: pre-wrap; word-break: break-word;">${fullTaskText}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: ${statusColor}; font-weight: bold; width: 100px; font-size: 8px;">${statusText}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px; width: 110px;">${dueDate}</td>
                </tr>
            `;
        });


        const totalWorks = administrativeData.length;
        const completedWorks = administrativeData.filter(work => work.completed === true).length;
        const pendingWorks = administrativeData.filter(work => work.completed === false).length;
        const overdueWorks = administrativeData.filter(work => {
            if (work.completed || !work.dueDate) return false;
            const today = new Date();
            const due = new Date(work.dueDate);
            return due < today;
        }).length;

        const element = __createReportsAdministrativePdfElement({ officeName, tableRows, totalWorks, completedWorks, pendingWorks, overdueWorks });

        const opt = {
            margin: [8, 10, 8, 10],
            filename: `تقرير_الأعمال_الإدارية_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        try {
            await html2pdf().set(opt).from(element).save();
        } finally {
            try { if (element && element.parentNode) element.parentNode.removeChild(element); } catch (_) { }
        }
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
        const { administrative } = __getReportsAdministrativeDataForAction();
        let administrativeData = [...administrative];
        if (currentAdministrativeStatusFilter === 'completed') administrativeData = administrativeData.filter(w => w.completed === true);
        else if (currentAdministrativeStatusFilter === 'pending') administrativeData = administrativeData.filter(w => w.completed === false);
        else if (currentAdministrativeStatusFilter === 'overdue') administrativeData = administrativeData.filter(w => { if (w.completed || !w.dueDate) return false; return new Date(w.dueDate) < new Date(); });
        administrativeData.sort((a, b) => (currentAdministrativeSortOrder === 'desc' ? new Date(b.dueDate || b.createdAt) - new Date(a.dueDate || a.createdAt) : new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt)));
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        let tableRows = '';
        administrativeData.forEach((work, i) => {
            const parts = [work.description, work.notes].filter(s => s && s.trim());
            const fullTaskTextRaw = parts.length ? parts.join(' - ') : (work.task || '-');
            const fullTaskText = __escapeReportsAdministrativeHtml(fullTaskTextRaw);
            const dueDate = __formatReportsAdministrativeDateForDisplay(work.dueDate);
            const statusText = work.completed ? 'مكتمل ✓' : 'قيد التنفيذ';
            const statusColor = work.completed ? '#16a34a' : '#f59e0b';
            const rowBg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
            tableRows += `<tr style="background: ${rowBg};"><td style="border: 1px solid #ddd; padding: 4px 6px; text-align: right; font-size: 8px; white-space: pre-wrap; word-break: break-word;">${fullTaskText}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; color: ${statusColor}; font-weight: bold; width: 100px; font-size: 8px;">${statusText}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px; width: 110px;">${dueDate}</td></tr>`;
        });
        const totalWorks = administrativeData.length;
        const completedWorks = administrativeData.filter(w => w.completed === true).length;
        const pendingWorks = administrativeData.filter(w => w.completed === false).length;
        const overdueWorks = administrativeData.filter(w => { if (w.completed || !w.dueDate) return false; return new Date(w.dueDate) < new Date(); }).length;
        const element = __createReportsAdministrativePdfElement({ officeName, tableRows, totalWorks, completedWorks, pendingWorks, overdueWorks });
        const opt = { margin: [8, 10, 8, 10], filename: `تقرير_الأعمال_الإدارية_${new Date().toISOString().split('T')[0]}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuAdmin();
        let blob;
        try {
            blob = await html2pdf().set(opt).from(element).outputPdf('blob');
        } finally {
            try { if (element && element.parentNode) element.parentNode.removeChild(element); } catch (_) { }
        }
        if (typeof shareReportPdfAsFile === 'function') await shareReportPdfAsFile(blob, opt.filename);
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = opt.filename; a.click(); URL.revokeObjectURL(a.href); window.open('https://wa.me/?text=' + encodeURIComponent('تقرير PDF مرفق'), '_blank'); showToast('تم تحميل التقرير. يمكنك إرفاقه في واتساب.', 'success'); }
    } catch (error) {
        console.error('Error exporting report to WhatsApp:', error);
        showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}

async function exportAdministrativeReportExcel() {
    return await exportAdministrativeReport();
}


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


document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu-admin');
    const button = document.getElementById('export-btn-admin');

    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
    }
});
