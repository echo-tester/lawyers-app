


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

let __reportsClerkAllPapers = [];
let __reportsClerkAllClients = [];
let __reportsClerkCurrentPapers = [];
let __reportsClerkCurrentClients = [];

function __getReportsClerkPapersDataForAction() {
    try {
        const p = Array.isArray(__reportsClerkCurrentPapers) ? __reportsClerkCurrentPapers : [];
        const c = Array.isArray(__reportsClerkCurrentClients) ? __reportsClerkCurrentClients : [];
        if (p.length || c.length) return { papers: p, clients: c };
    } catch (e) { }
    return {
        papers: Array.isArray(__reportsClerkAllPapers) ? __reportsClerkAllPapers : [],
        clients: Array.isArray(__reportsClerkAllClients) ? __reportsClerkAllClients : []
    };
}

async function updateClerkPapersReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');

    try {

        await __getReportsClerkPapersDateLocaleSetting();

        const clerkPapers = await getAllClerkPapers();
        const clients = await getAllClients();

        __reportsClerkAllPapers = Array.isArray(clerkPapers) ? clerkPapers : [];
        __reportsClerkAllClients = Array.isArray(clients) ? clients : [];
        __reportsClerkCurrentPapers = __reportsClerkAllPapers;
        __reportsClerkCurrentClients = __reportsClerkAllClients;

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
                        <button onclick="toggleClerkPapersSort()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" id="clerk-papers-sort-btn">
                            <i class="ri-time-line"></i>
                            <span>الأحدث</span>
                        </button>
                        <div class="relative">
                            <button onclick="toggleExportMenuClerk()" id="export-btn-clerk" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
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
                        <button onclick="printClerkPapersReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 pt-0 pb-6 pl-0 pr-0 relative flex-1 overflow-y-auto overflow-x-auto" id="clerk-papers-report-content">
                    ${generateClerkPapersReportHTML(__reportsClerkCurrentPapers, __reportsClerkCurrentClients)}
                </div>
            </div>
        `;


        document.getElementById('clerk-papers-search').addEventListener('input', function (e) {
            filterClerkPapersReport(e.target.value, clerkPapers, clients);
        });

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


function generateClerkPapersReportHTML(clerkPapers, clients, sortOrder = 'desc', typeFilter = 'all') {
    if (clerkPapers.length === 0) {
        return `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-file-paper-line text-8xl text-green-200"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على أوراق محضرين</p>
            </div>
        `;
    }


    let filteredPapers = clerkPapers;
    const norm = (t) => String(t || '').replace(/[إأآ]/g, 'ا').toLowerCase();
    if (typeFilter === 'إعلان') {
        filteredPapers = clerkPapers.filter(paper => norm(paper.paperType).includes('اعلان'));
    } else if (typeFilter === 'إنذار') {
        filteredPapers = clerkPapers.filter(paper => norm(paper.paperType).includes('انذار'));
    } else if (typeFilter === 'other') {
        filteredPapers = clerkPapers.filter(paper => {
            const tp = norm(paper.paperType);
            return !tp.includes('اعلان') && !tp.includes('انذار');
        });
    }


    filteredPapers.sort((a, b) => {
        const getKey = (paper) => {
            try {
                const dDelivery = __parseReportsClerkPapersDateString(paper && paper.deliveryDate);
                if (dDelivery) return dDelivery.getTime();
                const dReceipt = __parseReportsClerkPapersDateString(paper && paper.receiptDate);
                if (dReceipt) return dReceipt.getTime();
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
        return sortOrder === 'desc' ? (keyB - keyA) : (keyA - keyB);
    });

    const clientMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    
    const buildRowHtml = (paper, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-green-50 to-emerald-50' : 'bg-white';
        const client = paper.clientId ? clientMap.get(paper.clientId) : null;
        const clientName = client ? client.name : 'غير محدد';
        const paperDate = __formatReportsClerkPapersDateForDisplay(paper.paperDate);
        const receiptDate = __formatReportsClerkPapersDateForDisplay(paper.receiptDate);
        const deliveryDate = __formatReportsClerkPapersDateForDisplay(paper.deliveryDate);

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
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:shadow-sm">
                <td class="py-4 px-4 text-center border-l border-gray-200 min-w-[180px]">
                    <div class="font-bold text-base text-gray-800 hover:text-green-700 transition-colors duration-200 truncate min-w-0" title="${clientName}">${clientName}</div>
                </td>
                <td class="py-4 px-4 text-center border-l border-gray-200 whitespace-nowrap min-w-[140px]" style="width: 140px;">
                    <div class="flex items-center justify-center gap-2 font-medium text-sm ${typeColor} whitespace-nowrap min-w-0" title="${paper.paperType || '-'}">
                        <i class="${typeIcon}"></i>
                        <span class="truncate">${paper.paperType || '-'}</span>
                    </div>
                </td>
                <td class="py-4 px-4 text-center border-l border-gray-200 whitespace-nowrap min-w-[130px]" style="width: 130px;">
                    <div class="font-bold text-sm text-gray-700 whitespace-nowrap truncate min-w-0" title="${paper.paperNumber || '-'}">${paper.paperNumber || '-'}</div>
                </td>
                <td class="py-4 px-4 text-center border-l border-gray-200 whitespace-nowrap min-w-[120px]" style="width: 120px;">
                    <div class="font-medium text-sm text-gray-700 whitespace-nowrap" title="${deliveryDate}">${deliveryDate}</div>
                </td>
                <td class="py-4 px-4 text-center border-l border-gray-200 whitespace-nowrap min-w-[120px]" style="width: 120px;">
                    <div class="font-medium text-sm text-gray-700 whitespace-nowrap" title="${receiptDate}">${receiptDate}</div>
                </td>
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = filteredPapers.slice(0, initialBatchSize).map((p, i) => buildRowHtml(p, i)).join('');

    if (filteredPapers.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('clerk-papers-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, filteredPapers.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(filteredPapers[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < filteredPapers.length) {
                __reportsClerkChunkTimer = requestAnimationFrame(appendNextChunk);
            }
        };
        __reportsClerkChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    const totalPapers = __reportsClerkAllPapers.length;
    const totalNotifications = __reportsClerkAllPapers.filter(paper => norm(paper.paperType).includes('اعلان')).length;
    const totalWarnings = __reportsClerkAllPapers.filter(paper => norm(paper.paperType).includes('انذار')).length;
    const otherPapers = __reportsClerkAllPapers.filter(paper => {
        const tp = norm(paper.paperType);
        return !tp.includes('اعلان') && !tp.includes('انذار');
    }).length;

    return `
        <div class="clerk-papers-report-container" style="height: 100%; overflow-y: auto; overflow-x: auto; position: relative;">
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
            <div class="clerk-papers-stats-grid mb-6">
                <div onclick="filterClerkPapersByType('all')" class="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border-2 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-type="all">
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
                <div onclick="filterClerkPapersByType('إعلان')" class="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-type="إعلان">
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
                <div onclick="filterClerkPapersByType('إنذار')" class="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl border-2 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-type="إنذار">
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
                <div onclick="filterClerkPapersByType('other')" class="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl border-2 border-purple-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" data-type="other">
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
            
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-x-auto">
                <table class="w-full border-separate min-w-[650px]" style="border-spacing: 0; table-layout: auto;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #059669 !important;">
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #059669 !important; color: white !important; border-color: #047857 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #047857; min-width: 180px;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-user-line text-sm"></i>
                                    <span>اسم الموكل</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #059669 !important; color: white !important; border-color: #047857 !important; white-space: nowrap; width: 140px; min-width: 140px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #047857;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-file-text-line text-sm"></i>
                                    <span>نوع الورقة</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #059669 !important; color: white !important; white-space: nowrap; width: 130px; min-width: 130px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #047857;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-hashtag text-sm"></i>
                                    <span>رقم الورقة</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #059669 !important; color: white !important; border-color: #047857 !important; white-space: nowrap; width: 120px; min-width: 120px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #047857;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-calendar-event-line text-sm"></i>
                                    <span>تاريخ التسليم</span>
                                </div>
                            </th>
                            <th style="position: sticky; top: 0; z-index: 20; background-color: #059669 !important; color: white !important; border-color: #047857 !important; white-space: nowrap; width: 120px; min-width: 120px; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #047857;">
                                <div class="flex items-center justify-center gap-2">
                                    <i class="ri-calendar-check-line text-sm"></i>
                                    <span>تاريخ الاستلام</span>
                                </div>
                            </th>
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

let currentClerkPapersSortOrder = 'desc';
let currentClerkPapersTypeFilter = 'all';

async function toggleClerkPapersSort() {
    try {
        currentClerkPapersSortOrder = currentClerkPapersSortOrder === 'desc' ? 'asc' : 'desc';
        const { papers: clerkPapers, clients } = __getReportsClerkPapersDataForAction();
        const sortButton = document.querySelector('button[onclick="toggleClerkPapersSort()"]');
        if (sortButton) {
            const icon = sortButton.querySelector('i');
            const text = sortButton.querySelector('span');
            if (icon) icon.className = currentClerkPapersSortOrder === 'desc' ? 'ri-time-line' : 'ri-history-line';
            if (text) text.textContent = currentClerkPapersSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';
        }
        const reportContent = document.getElementById('clerk-papers-report-content');
        if (reportContent) {
            reportContent.innerHTML = generateClerkPapersReportHTML(clerkPapers, clients, currentClerkPapersSortOrder, currentClerkPapersTypeFilter);
        }
    } catch (error) {
        console.error('Error sorting clerk papers report:', error);
    }
}

function filterClerkPapersReport(searchTerm, clerkPapers, clients) {
    if (!searchTerm || !searchTerm.trim()) {
        const reportContent = document.getElementById('clerk-papers-report-content');
        if (reportContent) reportContent.innerHTML = generateClerkPapersReportHTML(clerkPapers, clients, currentClerkPapersSortOrder, currentClerkPapersTypeFilter);
        return;
    }
    const clientMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
    const searchLower = searchTerm.toLowerCase();
    const filteredPapers = (clerkPapers || []).filter(paper => {
        const client = paper.clientId ? clientMap.get(paper.clientId) : null;
        const clientName = client ? String(client.name || '').toLowerCase() : '';
        const paperType = paper.paperType ? String(paper.paperType).toLowerCase() : '';
        const paperNumber = paper.paperNumber ? String(paper.paperNumber).toLowerCase() : '';
        const clerkOffice = paper.clerkOffice ? String(paper.clerkOffice).toLowerCase() : '';
        const notes = paper.notes ? String(paper.notes).toLowerCase() : '';
        return clientName.includes(searchLower) || paperType.includes(searchLower) || paperNumber.includes(searchLower) || clerkOffice.includes(searchLower) || notes.includes(searchLower);
    });
    const reportContent = document.getElementById('clerk-papers-report-content');
    if (reportContent) reportContent.innerHTML = generateClerkPapersReportHTML(filteredPapers, clients, currentClerkPapersSortOrder, currentClerkPapersTypeFilter);
}

async function printClerkPapersReport() {
    try {
        const { papers: clerkPapers, clients } = __getReportsClerkPapersDataForAction();
        let clerkPapersData = [...clerkPapers];
        const norm = (t) => String(t || '').replace(/[إأآ]/g, 'ا').toLowerCase();
        if (currentClerkPapersTypeFilter === 'إعلان') {
            clerkPapersData = clerkPapersData.filter(paper => norm(paper.paperType).includes('اعلان'));
        } else if (currentClerkPapersTypeFilter === 'إنذار') {
            clerkPapersData = clerkPapersData.filter(paper => norm(paper.paperType).includes('انذار'));
        } else if (currentClerkPapersTypeFilter === 'other') {
            clerkPapersData = clerkPapersData.filter(paper => {
                const tp = norm(paper.paperType);
                return tp && !tp.includes('اعلان') && !tp.includes('انذار');
            });
        }
        clerkPapersData.sort((a, b) => {
            const dateA = new Date(a.paperDate || a.createdAt);
            const dateB = new Date(b.paperDate || b.createdAt);
            return currentClerkPapersSortOrder === 'desc' ? (dateB - dateA) : (dateA - dateB);
        });
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        const clientMap = new Map(Array.isArray(clients) ? clients.map(c => [c.id, c]) : []);
        let tableRows = '';
        clerkPapersData.forEach((paper, i) => {
            const client = paper.clientId ? clientMap.get(paper.clientId) : null;
            const clientName = client ? client.name : 'غير محدد';
            const paperType = paper.paperType || 'غير محدد';
            const paperNumber = paper.paperNumber || '-';
            const receiptDate = __formatReportsClerkPapersDateForDisplay(paper.receiptDate);
            const deliveryDate = __formatReportsClerkPapersDateForDisplay(paper.deliveryDate);
            const rowBg = i % 2 === 0 ? '#f0fdf4' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${clientName}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${paperType}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${paperNumber}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${deliveryDate}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 6px; text-align: center; font-size: 16px;">${receiptDate}</td>
                </tr>
            `;
        });


        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير أوراق المحضرين</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsClerkPapersDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                    <thead>
                        <tr>
                            <th style="background-color: #059669; color: white; padding: 8px 6px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 18px;">الموكل</th>
                            <th style="background-color: #059669; color: white; padding: 8px 6px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 18px;">نوع الورقة</th>
                            <th style="background-color: #059669; color: white; padding: 8px 6px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 18px;">رقم الورقة</th>
                            <th style="background-color: #059669; color: white; padding: 8px 6px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 18px;">تاريخ التسليم</th>
                            <th style="background-color: #059669; color: white; padding: 8px 6px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 18px;">تاريخ الاستلام</th>
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
                <title>تقرير أوراق المحضرين - ${new Date().toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG')}</title>
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
        console.error('Error printing clerk papers report:', error);
        showToast('حدث خطأ أثناء طباعة التقرير', 'error');
    }
}


async function exportClerkPapersReport() {
    try {
        const { papers: clerkPapers, clients } = __getReportsClerkPapersDataForAction();


        let filteredPapers = clerkPapers;
        const norm = (t) => String(t || '').replace(/[إأآ]/g, 'ا').toLowerCase();
        if (currentClerkPapersTypeFilter === 'إعلان') {
            filteredPapers = clerkPapers.filter(paper => norm(paper.paperType).includes('اعلان'));
        } else if (currentClerkPapersTypeFilter === 'إنذار') {
            filteredPapers = clerkPapers.filter(paper => norm(paper.paperType).includes('انذار'));
        } else if (currentClerkPapersTypeFilter === 'other') {
            filteredPapers = clerkPapers.filter(paper => {
                const tp = norm(paper.paperType);
                return tp && !tp.includes('اعلان') && !tp.includes('انذار');
            });
        }


        filteredPapers.sort((a, b) => {
            const dateA = new Date(a.paperDate || a.createdAt);
            const dateB = new Date(b.paperDate || b.createdAt);

            if (currentClerkPapersSortOrder === 'desc') {
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
                                <x:Name>تقرير أوراق المحضرين</x:Name>
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
                        background: #059669;
                        background-color: #059669;
                        color: #FFFFFF;
                        border: 2px solid #047857;
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
                        <th style="background-color: #059669; color: #FFFFFF; border: 2px solid #047857; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">الموكل</th>
                        <th style="background-color: #059669; color: #FFFFFF; border: 2px solid #047857; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">نوع الورقة</th>
                        <th style="background-color: #059669; color: #FFFFFF; border: 2px solid #047857; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">رقم الورقة</th>
                        <th style="background-color: #059669; color: #FFFFFF; border: 2px solid #047857; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">تاريخ التسليم</th>
                        <th style="background-color: #059669; color: #FFFFFF; border: 2px solid #047857; padding: 10px; text-align: center; font-weight: bold; font-size: 21px;">تاريخ الاستلام</th>
                    </tr>
        `;


        filteredPapers.forEach((paper) => {
            const client = paper.clientId ? clients.find(c => c.id === paper.clientId) : null;
            const clientName = client ? client.name : 'غير محدد';
            const paperType = paper.paperType || 'غير محدد';
            const paperNumber = paper.paperNumber || 'غير محدد';
            const receiptDate = __formatReportsClerkPapersDateForDisplay(paper.receiptDate);
            const deliveryDate = __formatReportsClerkPapersDateForDisplay(paper.deliveryDate);

            const clientStyle = client ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const typeStyle = paper.paperType ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const numberStyle = paper.paperNumber ?
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"' :
                'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #F8F8F8; color: #999999; font-style: italic; font-size: 18px;"';

            const dateStyle = 'style="border: 1px solid #cccccc; padding: 8px; text-align: center; background-color: #FFFFFF; font-size: 18px;"';

            excelContent += `
                <tr>
                    <td ${clientStyle}>${clientName}</td>
                    <td ${typeStyle}>${paperType}</td>
                    <td ${numberStyle}>${paperNumber}</td>
                    <td ${dateStyle}>${deliveryDate}</td>
                    <td ${dateStyle}>${receiptDate}</td>
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


async function exportClerkPapersReportPDF() {
    try {
        const { papers: clerkPapers, clients } = __getReportsClerkPapersDataForAction();


        let clerkPapersData = [...clerkPapers];
        if (currentClerkPapersTypeFilter === 'إعلان') {
            clerkPapersData = clerkPapersData.filter(paper => paper.paperType === 'إعلان');
        } else if (currentClerkPapersTypeFilter === 'إنذار') {
            clerkPapersData = clerkPapersData.filter(paper => paper.paperType === 'إنذار' || paper.paperType === 'انذار');
        } else if (currentClerkPapersTypeFilter === 'other') {
            clerkPapersData = clerkPapersData.filter(paper =>
                paper.paperType !== 'إعلان' &&
                paper.paperType !== 'إنذار' &&
                paper.paperType !== 'انذار'
            );
        }


        clerkPapersData.sort((a, b) => {
            const dateA = new Date(a.paperDate || a.createdAt);
            const dateB = new Date(b.paperDate || b.createdAt);

            if (currentClerkPapersSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        let tableRows = '';
        clerkPapersData.forEach((paper, i) => {
            const client = paper.clientId ? clients.find(c => c.id === paper.clientId) : null;
            const clientName = client ? client.name : 'غير محدد';
            const paperType = paper.paperType || 'غير محدد';
            const paperNumber = paper.paperNumber || '-';
            const receiptDate = __formatReportsClerkPapersDateForDisplay(paper.receiptDate);
            const deliveryDate = __formatReportsClerkPapersDateForDisplay(paper.deliveryDate);
            const rowBg = i % 2 === 0 ? '#f0fdf4' : '#ffffff';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientName}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${paperType}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${paperNumber}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${deliveryDate}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${receiptDate}</td>
                </tr>
            `;
        });


        const totalPapers = clerkPapersData.length;
        const totalNotifications = clerkPapersData.filter(paper => paper.paperType === 'إعلان').length;
        const totalWarnings = clerkPapersData.filter(paper => paper.paperType === 'إنذار' || paper.paperType === 'انذار').length;
        const otherPapers = clerkPapersData.filter(paper =>
            paper.paperType !== 'إعلان' &&
            paper.paperType !== 'إنذار' &&
            paper.paperType !== 'انذار'
        ).length;

        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                    <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير أوراق المحضرين</div>
                    <div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsClerkPapersDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 8px; background: #f0fdf4; padding: 4px; border: 1px solid #059669; border-radius: 3px;">
                    <div style="text-align: center;"><div style="color: #666; font-size: 7px;">الأوراق</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${totalPapers}</div></div>
                    <div style="text-align: center;"><div style="color: #666; font-size: 7px;">إعلانات</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${totalNotifications}</div></div>
                    <div style="text-align: center;"><div style="color: #666; font-size: 7px;">إنذارات</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${totalWarnings}</div></div>
                    <div style="text-align: center;"><div style="color: #666; font-size: 7px;">أخرى</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${otherPapers}</div></div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <thead>
                        <tr>
                            <th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">الموكل</th>
                            <th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">نوع الورقة</th>
                            <th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">رقم الورقة</th>
                            <th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">تاريخ التسليم</th>
                            <th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">تاريخ الاستلام</th>
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
            filename: `تقرير_أوراق_المحضرين_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        await html2pdf().set(opt).from(element).save();
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuClerk();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportClerkPapersReportWhatsApp() {
    try {
        const { papers: clerkPapers, clients } = __getReportsClerkPapersDataForAction();
        let clerkPapersData = [...clerkPapers];
        if (currentClerkPapersTypeFilter === 'إعلان') clerkPapersData = clerkPapersData.filter(p => p.paperType === 'إعلان');
        else if (currentClerkPapersTypeFilter === 'إنذار') clerkPapersData = clerkPapersData.filter(p => p.paperType === 'إنذار' || p.paperType === 'انذار');
        else if (currentClerkPapersTypeFilter === 'other') clerkPapersData = clerkPapersData.filter(p => p.paperType !== 'إعلان' && p.paperType !== 'إنذار' && p.paperType !== 'انذار');
        clerkPapersData.sort((a, b) => (currentClerkPapersSortOrder === 'desc' ? new Date(b.paperDate || b.createdAt) - new Date(a.paperDate || a.createdAt) : new Date(a.paperDate || a.createdAt) - new Date(b.paperDate || b.createdAt)));
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));
        let tableRows = '';
        clerkPapersData.forEach((paper, i) => {
            const client = paper.clientId ? clients.find(c => c.id === paper.clientId) : null;
            const clientName = client ? client.name : 'غير محدد';
            const paperType = paper.paperType || 'غير محدد';
            const paperNumber = paper.paperNumber || '-';
            const receiptDate = __formatReportsClerkPapersDateForDisplay(paper.receiptDate);
            const deliveryDate = __formatReportsClerkPapersDateForDisplay(paper.deliveryDate);
            const rowBg = i % 2 === 0 ? '#f0fdf4' : '#ffffff';
            tableRows += `<tr style="background: ${rowBg};"><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${clientName}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${paperType}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${paperNumber}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${deliveryDate}</td><td style="border: 1px solid #ddd; padding: 4px 4px; text-align: center; font-size: 8px;">${receiptDate}</td></tr>`;
        });
        const totalPapers = clerkPapersData.length;
        const totalNotifications = clerkPapersData.filter(p => p.paperType === 'إعلان').length;
        const totalWarnings = clerkPapersData.filter(p => p.paperType === 'إنذار' || p.paperType === 'انذار').length;
        const otherPapers = clerkPapersData.filter(p => p.paperType !== 'إعلان' && p.paperType !== 'إنذار' && p.paperType !== 'انذار').length;
        const element = document.createElement('div');
        element.style.direction = 'rtl';
        element.innerHTML = `<div style="font-family: Arial, sans-serif; direction: rtl; padding: 8px;"><div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;"><div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">تقرير أوراق المحضرين</div><div style="color: #666; font-size: 7px; text-align: center;">${new Date().toLocaleDateString(__reportsClerkPapersDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsClerkPapersDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div><div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div></div><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 8px; background: #f0fdf4; padding: 4px; border: 1px solid #059669; border-radius: 3px;"><div style="text-align: center;"><div style="color: #666; font-size: 7px;">الأوراق</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${totalPapers}</div></div><div style="text-align: center;"><div style="color: #666; font-size: 7px;">إعلانات</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${totalNotifications}</div></div><div style="text-align: center;"><div style="color: #666; font-size: 7px;">إنذارات</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${totalWarnings}</div></div><div style="text-align: center;"><div style="color: #666; font-size: 7px;">أخرى</div><div style="color: #059669; font-size: 9px; font-weight: bold;">${otherPapers}</div></div></div><table style="width: 100%; border-collapse: collapse; margin-top: 4px;"><thead><tr><th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">الموكل</th><th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">نوع الورقة</th><th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">رقم الورقة</th><th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">تاريخ التسليم</th><th style="background-color: #059669; color: white; padding: 5px 4px; text-align: center; border: 1px solid #047857; font-weight: bold; font-size: 9px;">تاريخ الاستلام</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
        const opt = { margin: [8, 10, 8, 10], filename: `تقرير_أوراق_المحضرين_${new Date().toISOString().split('T')[0]}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuClerk();
        const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
        if (typeof shareReportPdfAsFile === 'function') await shareReportPdfAsFile(blob, opt.filename);
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = opt.filename; a.click(); URL.revokeObjectURL(a.href); window.open('https://wa.me/?text=' + encodeURIComponent('تقرير PDF مرفق'), '_blank'); showToast('تم تحميل التقرير. يمكنك إرفاقه في واتساب.', 'success'); }
    } catch (error) {
        console.error('Error exporting report to WhatsApp:', error);
        showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}

async function exportClerkPapersReportExcel() {
    return await exportClerkPapersReport();
}


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


document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu-clerk');
    const button = document.getElementById('export-btn-clerk');

    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
    }
});
