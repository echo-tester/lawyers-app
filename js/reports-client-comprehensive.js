


let __reportsClientComprehensiveDateLocaleCache = null;
async function __getReportsClientComprehensiveDateLocaleSetting() {
    if (__reportsClientComprehensiveDateLocaleCache) return __reportsClientComprehensiveDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsClientComprehensiveDateLocaleCache = locale;
    return locale;
}

function __parseReportsClientComprehensiveDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const s = dateStr.trim();
    if (!s) return null;

    // ISO date (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(s);
        return Number.isFinite(d.getTime()) ? d : null;
    }

    // Common local date (DD/MM/YYYY or DD-MM-YYYY)
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const year = parseInt(m[3], 10);
        const d = new Date(year, month - 1, day);
        return Number.isFinite(d.getTime()) ? d : null;
    }

    // Fallback: try native parsing
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d : null;
}

function __formatReportsClientComprehensiveDateForDisplay(dateStr, fallback = 'غير محدد') {
    try {
        if (!dateStr) return fallback;
        const d = __parseReportsClientComprehensiveDateString(String(dateStr));
        if (!d) return String(dateStr) || fallback;
        return d.toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG');
    } catch (_) {
        return String(dateStr) || fallback;
    }
}

function __matchesReportsClientCase(caseItem, term) {
    if (!caseItem || !term) return false;
    const clean = (s) => (window.normalizeDigits ? window.normalizeDigits(s) : String(s || '')).toLowerCase().replace(/[إأآ]/g, 'ا').trim();
    const t = clean(term);
    if (!t) return true;

    const fields = [
        caseItem.caseNumber,
        caseItem.caseYear,
        `${caseItem.caseNumber}/${caseItem.caseYear}`,
        `${caseItem.caseNumber} لسنة ${caseItem.caseYear}`,
        caseItem.subject,
        caseItem.court,
        caseItem.circuitNumber,
        caseItem.caseType,
        caseItem.fileNumber,
        caseItem.poaNumber,
        caseItem.appealNumber,
        caseItem.appealYear,
        caseItem.cassationNumber,
        caseItem.cassationYear,
        caseItem.caseStatus,
        caseItem.notes
    ];

    return fields.some(f => clean(f).includes(t));
}

function __filterClientCasesBySelection(clientCases) {
    if (!currentSelectedClient) return clientCases;
    if (currentSelectedClient.targetCaseId) {
        const filtered = (clientCases || []).filter(c => c.id === currentSelectedClient.targetCaseId);
        if (filtered.length) return filtered;
    }
    if (currentSelectedClient.searchTerm && typeof currentSelectedClient.searchTerm === 'string') {
        const term = currentSelectedClient.searchTerm.trim();
        if (term) {
            const filtered = (clientCases || []).filter(c => __matchesReportsClientCase(c, term));
            if (filtered.length) return filtered;
        }
    }
    return clientCases || [];
}

function backToClientsList() {
    currentSelectedClient = null;
    const searchInput = document.getElementById('client-comprehensive-search');
    if (searchInput) {
        searchInput.value = '';
        searchInput.placeholder = 'البحث باسم الموكل، الخصم، أو رقم الدعوى...';
    }
    updateClientComprehensiveReportContent('تقارير الموكلين', 'client-comprehensive');
}

function showAllCasesForCurrentClient() {
    if (!currentSelectedClient || !currentSelectedClient.id) return;
    const searchInput = document.getElementById('client-comprehensive-search');
    if (searchInput) searchInput.value = '';
    displayClientComprehensiveReport(currentSelectedClient.id, currentSelectedClient.name, null, '');
}

function filterCasesInsideClientReport(term) {
    if (!currentSelectedClient || !currentSelectedClient.id) return;
    displayClientComprehensiveReport(currentSelectedClient.id, currentSelectedClient.name, null, term);
}

async function updateClientComprehensiveReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');
    currentSelectedClient = null;

    try {

        await __getReportsClientComprehensiveDateLocaleSetting();

        const clients = await getAllClients();
        const clientsSorted = Array.isArray(clients)
            ? clients.slice().sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'ar', { sensitivity: 'base' }))
            : [];
        const allCases = await getAllCases();
        const allOpponents = await getAllOpponents();
        const opponentsMap = new Map(Array.isArray(allOpponents) ? allOpponents.map(o => [o.id, o]) : []);
        const casesByClientId = new Map();
        for (const cs of allCases) {
            const arr = casesByClientId.get(cs.clientId) || [];
            arr.push(cs);
            casesByClientId.set(cs.clientId, arr);
        }

        const colors = { bg: '#f59e0b', bgHover: '#d97706', bgLight: '#fffbeb', text: '#d97706', textLight: '#fcd34d' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="client-comprehensive-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث باسم الموكل، الخصم، أو رقم الدعوى..." onfocus="this.style.boxShadow='0 0 0 2px #3b82f640'" onblur="this.style.boxShadow='none'">
                    </div>
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <button id="export-current-report-btn" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                            <i class="ri-download-line"></i>
                            <span>تصدير</span>
                        </button>
                        ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button id="whatsapp-current-report-btn" class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium border border-gray-200"><i class="ri-whatsapp-line text-green-600"></i><span>واتساب</span></button>` : ''}
                        <button id="print-current-report-btn" class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 pt-2 pb-6 pl-4 pr-4 relative flex-1 overflow-y-auto overflow-x-auto" id="client-comprehensive-content">
                    ${clientsSorted.length > 0 ? `
                        <div class="space-y-3">
                            ${clientsSorted.map(client => {

            const clientCases = casesByClientId.get(client.id) || [];

            const opponentNames = getClientOpponentNames(client.id, clientCases, opponentsMap);

            return `
                                <div onclick="displayClientComprehensiveReport(${client.id}, '${client.name.replace(/'/g, "\\'")}')" class="report-client-card flex items-center justify-between p-4 bg-gradient-to-l from-blue-50 to-white rounded-lg border border-blue-200 hover:shadow-md hover:border-blue-400 hover:from-blue-100 transition-all duration-300 cursor-pointer">
                                    <div class="flex items-center gap-4 flex-1">
                                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <i class="ri-user-3-fill text-blue-600 text-xl"></i>
                                        </div>
                                        <div class="flex-1">
                                            <h3 class="font-bold text-gray-800 text-lg">${client.name}</h3>
                                            ${opponentNames.length > 0 ? `
                                                <div class="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                                    <span class="text-red-600 font-semibold">ضد:</span>
                                                    <span class="text-red-700 font-medium">${opponentNames.join(' - ')}</span>
                                                </div>
                                            ` : `
                                                <div class="text-sm text-gray-400 mt-1 italic">لا يوجد خصوم مسجلين</div>
                                            `}
                                        </div>
                                    </div>
                                    ${(typeof isElectronApp === 'function' && isElectronApp()) ? `
                                        <button onclick="event.stopPropagation(); printClientFromCard(${client.id}, '${client.name.replace(/'/g, "\\'")}')" class="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold border-2 border-green-600 hover:border-green-700">
                                            <i class="ri-printer-line text-lg"></i>
                                            <span>طباعة</span>
                                        </button>
                                    ` : `
                                        <button onclick="event.stopPropagation(); shareClientFromCard(${client.id}, '${client.name.replace(/'/g, "\\'")}')" class="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-gray-800 rounded-lg transition-colors font-medium border border-green-200 shadow-sm cursor-pointer">
                                            <i class="ri-whatsapp-line text-green-600"></i>
                                            <span>واتساب</span>
                                        </button>
                                    `}
                                </div>
                                `;
        }).join('')}
                        </div>
                    ` : `
                        <div class="text-center text-gray-500 py-16">
                            <div class="mb-6">
                                <i class="ri-user-unfollow-line text-8xl text-gray-300"></i>
                            </div>
                            <h3 class="text-2xl font-bold mb-3 text-gray-700">لا يوجد موكلين</h3>
                            <p class="text-gray-400 text-lg">لم يتم إضافة أي موكلين بعد</p>
                        </div>
                    `}
                </div>
            </div>
        `;


        const searchInput = document.getElementById('client-comprehensive-search');
        if (searchInput) {
            let __ccTimer;
            searchInput.addEventListener('input', function (e) {
                clearTimeout(__ccTimer);
                const val = e.target.value;
                __ccTimer = setTimeout(() => {
                    if (currentSelectedClient && currentSelectedClient.id) {
                        filterCasesInsideClientReport(val);
                    } else {
                        filterClientComprehensiveReport(val, clientsSorted, allCases, allOpponents);
                    }
                }, 150);
            });
        }


        const exportBtn = document.getElementById('export-current-report-btn');
        const printBtn = document.getElementById('print-current-report-btn');
        const whatsappBtn = document.getElementById('whatsapp-current-report-btn');

        if (exportBtn) {
            exportBtn.onclick = async () => {
                const doExport = () => exportClientsListPDF(clientsSorted, allCases, allOpponents);

                try {
                    if (localStorage.getItem('desktop_path_warning_suppressed') === '1') {
                        return doExport();
                    }
                } catch (_) { }

                try {
                    if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
                        const chk = await window.electronAPI.checkClientsPathOnDesktop();
                        if (chk && chk.success === true && chk.isOnDesktop === true) {
                            try {
                                if (typeof window.showDesktopPathSafetyWarning === 'function') {
                                    window.showDesktopPathSafetyWarning({}, { onContinue: () => { try { doExport(); } catch (_) { } } });
                                }
                            } catch (_) { }
                            return;
                        }
                    }
                } catch (_) { }

                return doExport();
            };
        }
        if (whatsappBtn) {
            whatsappBtn.onclick = async () => {
                try {
                    showToast('جاري إنشاء التقرير للمشاركة...', 'info');
                    const { blob, filename } = await exportClientsListPDFAsBlob(clientsSorted, allCases, allOpponents);
                    if (blob && typeof shareReportPdfAsFile === 'function') await shareReportPdfAsFile(blob, filename);
                } catch (e) {
                    console.error(e);
                    showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
                }
            };
        }
        if (printBtn) {
            printBtn.onclick = () => printClientsList(clientsSorted, allCases, allOpponents);
        }

    } catch (error) {
        console.error('Error loading client comprehensive report:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل التقرير الشامل</p>
                    </div>
                </div>
            </div>
        `;
    }
}


function getClientOpponentNames(clientId, clientCases, opponentsMap) {
    try {
        const caseOpponentIds = [...new Set((clientCases || [])
            .map(c => c && c.opponentId)
            .filter(id => id)
        )];

        let tempOpponentIds = [];
        try {
            const clientOpponentRelations = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}');
            tempOpponentIds = clientOpponentRelations[clientId] || [];
        } catch (_) { }

        const uniqueOpponentIds = [...new Set([...caseOpponentIds, ...tempOpponentIds])];
        return uniqueOpponentIds
            .map(id => opponentsMap.get(id))
            .filter(o => o)
            .map(o => o.name)
            .filter(Boolean);
    } catch (_) {
        return [];
    }
}


let currentSelectedClient = null;


async function displayClientComprehensiveReport(clientId, clientName = null, targetCaseId = null, caseSearchTerm = '') {
    const container = document.getElementById('client-comprehensive-content');
    if (!container) return;

    try {
        await __getReportsClientComprehensiveDateLocaleSetting();

        const client = await getById('clients', clientId);
        if (!client) {
            container.innerHTML = `
                <div class="text-center text-red-500 py-12">
                    <i class="ri-error-warning-line text-6xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">خطأ</h3>
                    <p class="text-gray-400">لم يتم العثور على بيانات الموكل</p>
                </div>
            `;
            return;
        }

        const safeName = String(clientName || client.name || '').replace(/'/g, "\\'");

        currentSelectedClient = {
            id: client.id,
            name: clientName || client.name,
            targetCaseId: targetCaseId || null,
            searchTerm: caseSearchTerm || ''
        };

        const searchInput = document.getElementById('client-comprehensive-search');
        if (searchInput) {
            searchInput.placeholder = `البحث برقم الدعوى، المحكمة، أو الموضوع في قضايا ${client.name}...`;
            if (caseSearchTerm) {
                searchInput.value = caseSearchTerm;
            }
        }

        const exportBtn = document.getElementById('export-current-report-btn');
        const printBtn = document.getElementById('print-current-report-btn');
        const whatsappBtnSingle = document.getElementById('whatsapp-current-report-btn');
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            exportBtn.onclick = async () => {
                const doExport = () => exportClientComprehensiveReportPDF();
                try {
                    if (localStorage.getItem('desktop_path_warning_suppressed') === '1') {
                        return doExport();
                    }
                } catch (_) { }

                try {
                    if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
                        const chk = await window.electronAPI.checkClientsPathOnDesktop();
                        if (chk && chk.success === true && chk.isOnDesktop === true) {
                            try {
                                if (typeof window.showDesktopPathSafetyWarning === 'function') {
                                    window.showDesktopPathSafetyWarning({}, { onContinue: () => { try { doExport(); } catch (_) { } } });
                                }
                            } catch (_) { }
                            return;
                        }
                    }
                } catch (_) { }

                return doExport();
            };
        }
        if (whatsappBtnSingle) {
            whatsappBtnSingle.onclick = async () => {
                try {
                    showToast('جاري إنشاء التقرير للمشاركة...', 'info');
                    const result = await exportClientComprehensiveReportPDFForShare();
                    if (result && result.blob && typeof shareReportPdfAsFile === 'function') await shareReportPdfAsFile(result.blob, result.filename);
                } catch (e) {
                    console.error(e);
                    showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
                }
            };
        }
        if (printBtn) {
            printBtn.disabled = false;
            printBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            printBtn.onclick = printClientComprehensiveReport;
        }

        const allCases = await getAllCases();
        const clientCases = allCases.filter(c => c.clientId === clientId);
        const allOpponents = await getAllOpponents();
        const opponentsMap = new Map(Array.isArray(allOpponents) ? allOpponents.map(o => [o.id, o]) : []);
        const allSessions = await getAllSessions();
        const sessionsByCaseId = new Map();
        for (const s of allSessions) {
            const arr = sessionsByCaseId.get(s.caseId) || [];
            arr.push(s);
            sessionsByCaseId.set(s.caseId, arr);
        }

        if (clientCases.length === 0) {
            container.innerHTML = `
                <div class="mb-4 bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 md:p-4 shadow-sm flex items-center justify-between">
                    <button type="button" onclick="backToClientsList()" class="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-100 text-blue-700 border border-blue-300 rounded-lg font-bold text-sm shadow-sm transition-all cursor-pointer">
                        <i class="ri-arrow-right-line text-base"></i>
                        <span>رجوع لكافة الموكلين</span>
                    </button>
                    <div class="text-sm text-gray-700 font-bold">تقرير الموكل: <span class="text-blue-900">${client.name}</span></div>
                </div>
                <div class="text-center text-gray-500 py-12 bg-white rounded-xl border border-gray-100">
                    <i class="ri-file-warning-line text-6xl mb-4 text-gray-300"></i>
                    <h3 class="text-xl font-bold mb-2">لا توجد قضايا</h3>
                    <p class="text-gray-400">لا توجد قضايا مسجلة لهذا الموكل</p>
                </div>
            `;
            return;
        }

        let displayedCases = clientCases;
        let activeFilterDesc = '';

        if (targetCaseId) {
            const matching = clientCases.filter(c => c.id === targetCaseId);
            if (matching.length > 0) {
                displayedCases = matching;
                const cs = matching[0];
                activeFilterDesc = `عرض الدعوى رقم ${cs.caseNumber || 'غير محدد'} لسنة ${cs.caseYear || ''} بجلساتها فقط`;
            }
        } else if (caseSearchTerm && caseSearchTerm.trim()) {
            displayedCases = clientCases.filter(c => __matchesReportsClientCase(c, caseSearchTerm));
            activeFilterDesc = `نتائج البحث عن: "${caseSearchTerm}" (${displayedCases.length} دعوى)`;
        }

        // Header Navigation Bar
        let headerNavHtml = `
            <div class="mb-4 bg-gradient-to-l from-blue-50 via-white to-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <button type="button" onclick="backToClientsList()" class="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-100 text-blue-700 border border-blue-300 rounded-lg font-bold text-sm shadow-sm transition-all cursor-pointer">
                            <i class="ri-arrow-right-line text-base"></i>
                            <span>رجوع لكافة الموكلين</span>
                        </button>
                        <div>
                            <span class="text-xs text-blue-600 font-bold block">تقرير الموكل الشامل</span>
                            <h2 class="text-lg md:text-xl font-black text-gray-800">${client.name}</h2>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        ${displayedCases.length < clientCases.length ? `
                            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg text-xs md:text-sm font-bold text-amber-900 shadow-sm">
                                <i class="ri-filter-3-fill text-amber-600"></i>
                                <span>${activeFilterDesc || `معروض: ${displayedCases.length} دعوى بجلساتها`}</span>
                                <button type="button" onclick="showAllCasesForCurrentClient()" class="mr-2 text-blue-700 hover:text-blue-900 underline font-extrabold cursor-pointer">
                                    إظهار كافة دعاوى الموكل (${clientCases.length})
                                </button>
                            </div>
                        ` : `
                            <span class="text-xs md:text-sm font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                إجمالي الدعاوى: <strong class="text-blue-700 font-bold">${clientCases.length}</strong>
                            </span>
                        `}
                    </div>
                </div>
            </div>
        `;

        if (displayedCases.length === 0) {
            container.innerHTML = `
                ${headerNavHtml}
                <div class="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <i class="ri-file-search-line text-6xl mb-3 text-amber-500 block"></i>
                    <h3 class="text-xl font-bold mb-2 text-gray-800">لا توجد دعوى مطابقة لبحثك</h3>
                    <p class="text-gray-500 text-sm mb-4">لم يتم العثور على أي دعوى تطابق البحث في ملف هذا الموكل</p>
                    <button type="button" onclick="showAllCasesForCurrentClient()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow cursor-pointer">
                        إظهار كافة دعاوى الموكل (${clientCases.length})
                    </button>
                </div>
            `;
            return;
        }

        let html = headerNavHtml;

        for (const caseItem of displayedCases) {
            const opponent = caseItem.opponentId ? (opponentsMap.get(caseItem.opponentId) || null) : null;
            const sessions = (sessionsByCaseId.get(caseItem.id) || []).slice();
            sessions.sort((a, b) => {
                if (!a.sessionDate) return 1;
                if (!b.sessionDate) return -1;
                const da = __parseReportsClientComprehensiveDateString(String(a.sessionDate));
                const db = __parseReportsClientComprehensiveDateString(String(b.sessionDate));
                if (!da) return 1;
                if (!db) return -1;
                return da - db;
            });

            html += generateCaseReportHTML(client, opponent, caseItem, sessions);
        }

        container.innerHTML = html;

    } catch (error) {
        console.error('Error displaying client comprehensive report:', error);
        container.innerHTML = `
            <div class="text-center text-red-500 py-12">
                <i class="ri-error-warning-line text-6xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">خطأ</h3>
                <p class="text-gray-400">حدث خطأ أثناء عرض التقرير</p>
            </div>
        `;
    }
}


function generateCaseReportHTML(client, opponent, caseItem, sessions) {
    return `
        <div class="case-report-section mb-8 pb-8 border-b-4 border-gray-200 last:border-b-0">
            <!-- بيانات الأطراف -->
            <div class="mb-6 parties-section">
                <div class="flex flex-col md:flex-row items-stretch gap-6">
                    <!-- بيانات الموكل -->
                    <div class="flex-1 p-4 md:p-6 border-2 border-blue-300 rounded-xl bg-blue-100 shadow-sm">
                        <h3 class="text-lg font-bold text-blue-700 mb-4 pb-2 border-b-2 border-blue-200 flex items-center gap-2">
                            <i class="ri-user-3-line"></i>
                            <span>بيانات الموكل</span>
                        </h3>
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-blue-700">اسم الموكل:</div>
                                <div class="text-gray-800 font-semibold text-base">${client.name || 'غير محدد'}</div>
                            </div>
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-blue-700">صفته:</div>
                                <div class="text-gray-800 font-semibold text-base">${(caseItem && caseItem.clientCapacity) ? caseItem.clientCapacity : (client.capacity || 'غير محدد')}</div>
                            </div>
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-blue-700">عنوانه:</div>
                                <div class="text-gray-800 font-semibold text-base">${client.address || 'غير محدد'}</div>
                            </div>
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-blue-700">الهاتف:</div>
                                <div class="text-gray-800 font-semibold text-base">${client.phone || 'غير محدد'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- كلمة ضد -->
                    <div class="flex items-center justify-center py-2 md:py-0">
                        <span class="text-sm md:text-base font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">ضد</span>
                    </div>
                    
                    <!-- بيانات الخصم -->
                    <div class="flex-1 p-4 md:p-6 border-2 border-red-300 rounded-xl bg-red-50 shadow-sm">
                        <h3 class="text-lg font-bold text-red-700 mb-4 pb-2 border-b-2 border-red-200 flex items-center gap-2">
                            <i class="ri-shield-user-line"></i>
                            <span>بيانات الخصم</span>
                        </h3>
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-red-700">اسم الخصم:</div>
                                <div class="text-gray-800 font-semibold text-base">${opponent ? opponent.name : 'غير محدد'}</div>
                            </div>
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-red-700">صفته:</div>
                                <div class="text-gray-800 font-semibold text-base">${(caseItem && caseItem.opponentCapacity) ? caseItem.opponentCapacity : (opponent ? opponent.capacity : 'غير محدد')}</div>
                            </div>
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-red-700">عنوانه:</div>
                                <div class="text-gray-800 font-semibold text-base">${opponent ? opponent.address : 'غير محدد'}</div>
                            </div>
                            <div class="flex items-center gap-2 py-2">
                                <div class="text-base font-bold text-red-700">الهاتف:</div>
                                <div class="text-gray-800 font-semibold text-base">${opponent ? opponent.phone : 'غير محدد'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- سهم يوضح الترابط -->
            <div class="flex justify-center -mt-3 mb-3">
                <div class="flex flex-col items-center bg-white rounded-full p-2 shadow-md">
                    <i class="ri-arrow-down-line text-3xl text-blue-600 animate-bounce"></i>
                </div>
            </div>
            
            <!-- بيانات القضية -->
            <div class="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 shadow-md case-details-section">
                <h3 class="text-lg font-bold text-blue-700 mb-4 pb-2 border-b-2 border-blue-200 flex items-center gap-2">
                    <i class="ri-file-list-3-line"></i>
                    <span>بيانات القضية</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">المحكمة:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.court || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">رقم الدائرة:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.circuitNumber || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">نوع الدعوى:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.caseType || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">موضوع الدعوى:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.subject || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">رقم الدعوى:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.caseNumber || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">سنة الدعوى:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.caseYear || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">رقم الاستئناف:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.appealNumber || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">سنة الاستئناف:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.appealYear || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">رقم النقض:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.cassationNumber || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">سنة النقض:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.cassationYear || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">رقم الملف:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.fileNumber || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">رقم التوكيل:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.poaNumber || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">حالة القضية:</div>
                        <div class="text-gray-800 font-bold text-base">${caseItem.caseStatus || 'غير محدد'}</div>
                    </div>
                    <div class="flex items-center gap-2 py-2">
                        <div class="text-base font-bold text-blue-700">ملاحظات:</div>
                        <div class="text-gray-800 font-semibold text-base">${caseItem.notes || 'لا توجد ملاحظات'}</div>
                    </div>
                </div>
            </div>
            
            <!-- سهم يوضح الترابط -->
            <div class="flex justify-center -mt-3 mb-3">
                <div class="flex flex-col items-center bg-white rounded-full p-2 shadow-md">
                    <i class="ri-arrow-down-line text-3xl text-green-600 animate-bounce"></i>
                </div>
            </div>
            
            <!-- بيانات الجلسات -->
            <div class="mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-4 md:p-6 shadow-md border-2 border-green-200${sessions.length > 0 ? ' sessions-section' : ''}">
                <h3 class="text-lg font-bold text-green-700 mb-4 pb-2 border-b-2 border-green-200 flex items-center gap-2">
                    <i class="ri-calendar-event-line"></i>
                    <span>الجلسات (${sessions.length})</span>
                </h3>
                ${sessions.length > 0 ? `
                    <div>
                        ${sessions.map((session, index) => `
                            <div class="bg-green-50 rounded-lg p-4 shadow-sm mb-3 session-card border border-green-200">
                                <div class="flex items-center mb-3 pb-2 border-b border-green-200">
                                    <div class="font-bold text-green-700 text-base flex items-center gap-2">
                                        <span class="bg-green-600 text-white text-xs px-2 py-1 rounded-full">${index + 1}</span>
                                        <span>جلسة</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                    <div class="flex items-center gap-2 py-2">
                                        <i class="ri-calendar-line text-blue-600"></i>
                                        <div class="text-base font-bold text-green-700">تاريخ الجلسة:</div>
                                        <div class="text-gray-800 font-semibold text-base">${__formatReportsClientComprehensiveDateForDisplay(session.sessionDate)}</div>
                                    </div>
                                    <div class="flex items-center gap-2 py-2">
                                        <i class="ri-list-check text-green-600"></i>
                                        <div class="text-base font-bold text-green-700">الرول:</div>
                                        <div class="text-gray-800 font-semibold text-base">${session.roll || 'غير محدد'}</div>
                                    </div>
                                    <div class="flex items-center gap-2 py-2">
                                        <i class="ri-hashtag text-purple-600"></i>
                                        <div class="text-base font-bold text-green-700">رقم الحصر:</div>
                                        <div class="text-gray-800 font-semibold text-base">${session.inventoryNumber || 'غير محدد'}</div>
                                    </div>
                                    <div class="flex items-center gap-2 py-2">
                                        <i class="ri-calendar-2-line text-orange-600"></i>
                                        <div class="text-base font-bold text-green-700">سنة الحصر:</div>
                                        <div class="text-gray-800 font-semibold text-base">${session.inventoryYear || 'غير محدد'}</div>
                                    </div>
                                    ${session.decision ? `
                                        <div class="md:col-span-2 flex items-start gap-2 py-2 border-t border-gray-200 mt-2 pt-3">
                                            <i class="ri-file-text-line text-indigo-600 mt-1"></i>
                                            <div class="text-base font-bold text-green-700 mt-0.5">القرار:</div>
                                            <div class="text-gray-800 font-semibold text-base whitespace-pre-wrap">${session.decision}</div>
                                        </div>
                                    ` : ''}
                                    ${session.requests ? `
                                        <div class="md:col-span-2 flex items-start gap-2 py-2 border-t border-gray-200 mt-2 pt-3">
                                            <i class="ri-question-answer-line text-indigo-600 mt-1"></i>
                                            <div class="text-base font-bold text-green-700 mt-0.5">الطلبات:</div>
                                            <div class="text-gray-800 font-semibold text-base whitespace-pre-wrap">${session.requests}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            ${index < sessions.length - 1 ? `
                                <div class="flex justify-center my-2">
                                    <div class="bg-white rounded-full p-1 shadow-sm">
                                        <i class="ri-arrow-down-s-line text-xl text-green-600"></i>
                                    </div>
                                </div>
                            ` : ''}
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center text-gray-500 py-8">
                        <i class="ri-calendar-line text-4xl mb-2 text-gray-300"></i>
                        <p class="text-sm">لا توجد جلسات مضافة لهذه القضية</p>
                    </div>
                `}
            </div>
        </div>
    `;
}


async function printClientComprehensiveReport() {
    if (!currentSelectedClient) {
        showToast('يجب اختيار موكل أولاً', 'error');
        return;
    }

    try {
        const client = await getById('clients', currentSelectedClient.id);
        if (!client) {
            showToast('لم يتم العثور على بيانات الموكل', 'error');
            return;
        }

        const selectedClientName = currentSelectedClient.name;
        const allCases = await getAllCases();
        let clientCases = allCases.filter(c => c.clientId === client.id);
        clientCases = __filterClientCasesBySelection(clientCases);

        if (clientCases.length === 0) {
            showToast('لا توجد قضايا مطابقة لهذا الموكل', 'error');
            return;
        }


        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));


        let pdfContent = '';

        const allOpponents = await getAllOpponents();
        const opponentsMap = new Map(Array.isArray(allOpponents) ? allOpponents.map(o => [o.id, o]) : []);
        const allSessions = await getAllSessions();
        const sessionsByCaseId = new Map();
        for (const s of allSessions) {
            const arr = sessionsByCaseId.get(s.caseId) || [];
            arr.push(s);
            sessionsByCaseId.set(s.caseId, arr);
        }
        for (const caseItem of clientCases) {
            const opponent = caseItem.opponentId ? (opponentsMap.get(caseItem.opponentId) || null) : null;
            const sessions = (sessionsByCaseId.get(caseItem.id) || []).slice();
            sessions.sort((a, b) => {
                if (!a.sessionDate) return 1;
                if (!b.sessionDate) return -1;
                const da = __parseReportsClientComprehensiveDateString(String(a.sessionDate));
                const db = __parseReportsClientComprehensiveDateString(String(b.sessionDate));
                if (!da) return 1;
                if (!db) return -1;
                return da - db;
            });

            pdfContent += `
                <div style="margin-bottom: 15px; page-break-inside: avoid; border: 2px solid #3b82f6; border-radius: 8px; overflow: hidden;">
                    <!-- عنوان القضية -->
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 8px 12px; text-align: center; font-weight: bold; font-size: 14px;">
                        القضية رقم ${caseItem.caseNumber || 'غير محدد'} لسنة ${caseItem.caseYear || 'غير محدد'} - ${caseItem.caseType || 'غير محدد'}
                    </div>
                    
                    <!-- الأطراف في صف واحد -->
                    <div style="display: grid; grid-template-columns: 1fr 70px 1fr; gap: 2px; background: #e2e8f0; padding: 2px;">
                        <!-- الموكل -->
                        <div style="padding: 8px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 6px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                            <div style="font-weight: bold; color: #1e3a8a; font-size: 14px; margin-bottom: 6px; text-align: center; background: rgba(59, 130, 246, 0.15); padding: 3px; border-radius: 4px; border: 1px solid #3b82f6;">👤 الموكل</div>
                            <div style="display: grid; gap: 3px;">
                                <div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #3b82f6;"><strong style="color: #1e40af;">الاسم</strong> ${client.name || 'غير محدد'}</div>
                                ${(caseItem && caseItem.clientCapacity) ? `<div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #60a5fa;"><strong style="color: #1e40af;">الصفة</strong> ${caseItem.clientCapacity}</div>` : ''}
                                ${client.address ? `<div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #93c5fd;"><strong style="color: #1e40af;">العنوان</strong> ${client.address}</div>` : ''}
                                ${client.phone ? `<div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #93c5fd;"><strong style="color: #1e40af;">الهاتف</strong> ${client.phone}</div>` : ''}
                            </div>
                        </div>
                        
                        <!-- VS -->
                        <div style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); font-weight: bold; color: white; font-size: 14px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid #475569;">
                            <div style="text-align: center; line-height: 1.2;">
                                <div style="font-size: 18px;">⚔️</div>
                                <div style="font-size: 14px;">ضـد</div>
                            </div>
                        </div>
                        
                        <!-- الخصم -->
                        <div style="padding: 8px; background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); border: 2px solid #ef4444; border-radius: 6px; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);">
                            <div style="font-weight: bold; color: #7f1d1d; font-size: 14px; margin-bottom: 6px; text-align: center; background: rgba(239, 68, 68, 0.15); padding: 3px; border-radius: 4px; border: 1px solid #ef4444;">⚖️ الخصم</div>
                            <div style="display: grid; gap: 3px;">
                                <div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #ef4444;"><strong style="color: #991b1b;">الاسم</strong> ${opponent ? opponent.name : 'غير محدد'}</div>
                                ${(caseItem && caseItem.opponentCapacity) ? `<div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #f87171;"><strong style="color: #991b1b;">الصفة</strong> ${caseItem.opponentCapacity}</div>` : ''}
                                ${opponent && opponent.address ? `<div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #fca5a5;"><strong style="color: #991b1b;">العنوان</strong> ${opponent.address}</div>` : ''}
                                ${opponent && opponent.phone ? `<div style="background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 3px; font-size: 12px; border-right: 2px solid #fca5a5;"><strong style="color: #991b1b;">الهاتف</strong> ${opponent.phone}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- بيانات القضية في Grid -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #cbd5e1; padding: 0; margin-top: 0;">
                        ${caseItem.court ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">المحكمة</strong><br>${caseItem.court}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">المحكمة</strong><br>-</div>`}
                        ${caseItem.circuitNumber ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الدائرة</strong><br>${caseItem.circuitNumber}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الدائرة</strong><br>-</div>`}
                        ${caseItem.fileNumber ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الملف</strong><br>${caseItem.fileNumber}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الملف</strong><br>-</div>`}
                        ${caseItem.poaNumber ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">التوكيل</strong><br>${caseItem.poaNumber}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">التوكيل</strong><br>-</div>`}
                        
                        ${caseItem.caseStatus ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الحالة</strong><br>${caseItem.caseStatus}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الحالة</strong><br>-</div>`}
                        ${caseItem.appealNumber ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الاستئناف</strong><br>${caseItem.appealNumber} لسنة ${caseItem.appealYear || ''}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">الاستئناف</strong><br>-</div>`}
                        ${caseItem.cassationNumber ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">النقض</strong><br>${caseItem.cassationNumber} لسنة ${caseItem.cassationYear || ''}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">النقض</strong><br>-</div>`}
                        ${caseItem.subject ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">موضوعها</strong><br>${caseItem.subject}</div>` : `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px;"><strong style="color: #1e40af;">موضوعها</strong><br>-</div>`}
                        
                        ${caseItem.notes ? `<div style="background: #f0f9ff; padding: 5px 6px; font-size: 12px; grid-column: span 4; border-left: 3px solid #3b82f6;"><strong style="color: #1e40af;">ملاحظات</strong> ${caseItem.notes}</div>` : ''}
                    </div>
            `;


            if (sessions.length > 0) {
                pdfContent += `
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 6px 10px; margin-top: 8px; text-align: center; font-weight: bold; font-size: 13px; border-radius: 4px 4px 0 0;">
                        الجلسات (${sessions.length})
                    </div>
                    <div style="border: 2px solid #10b981; padding: 8px; background: #f0fdf4;">
                `;

                sessions.forEach((session, idx) => {
                    pdfContent += `
                        <div style="display: grid; grid-template-columns: 40% 60%; gap: 8px; margin-bottom: 8px; background: white; border: 1px solid #10b981; border-radius: 6px; padding: 8px; page-break-inside: avoid;">
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; align-content: start;">
                                <div style="background: #d1fae5; padding: 4px 8px; border-radius: 3px; text-align: center; font-weight: bold; color: #059669; font-size: 12px;">الجلسة ${idx + 1}</div>
                                <div></div>
                                <strong style="color: #047857; font-size: 12px;">التاريخ</strong>
                                <span style="color: #047857; font-size: 12px;">${__formatReportsClientComprehensiveDateForDisplay(session.sessionDate)}</span>
                                <strong style="color: #047857; font-size: 12px;">الرول</strong>
                                <span style="color: #047857; font-size: 12px;">${session.roll || '-'}</span>
                                <strong style="color: #047857; font-size: 12px;">رقم الحصر</strong>
                                <span style="color: #047857; font-size: 12px;">${session.inventoryNumber || '-'}</span>
                                <strong style="color: #047857; font-size: 12px;">سنة الحصر</strong>
                                <span style="color: #047857; font-size: 12px;">${session.inventoryYear || '-'}</span>
                            </div>
                            
                            <div style="background: #ecfdf5; padding: 8px; border-radius: 4px; border-right: 3px solid #10b981;">
                                <div style="margin-bottom: 6px;">
                                    <strong style="color: #047857; font-size: 12px; display: block; margin-bottom: 4px;">القرار</strong>
                                    <div style="color: #065f46; font-size: 12px; line-height: 1.5;">${session.decision || 'لا يوجد'}</div>
                                </div>
                                ${session.requests && session.requests.trim() ? `
                                    <div style="border-top: 1px dashed #10b981; padding-top: 6px; margin-top: 6px;">
                                        <strong style="color: #047857; font-size: 12px; display: block; margin-bottom: 4px;">الطلبات</strong>
                                        <div style="color: #065f46; font-size: 12px; line-height: 1.5;">${session.requests}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });

                pdfContent += `</div>`;
            }

            pdfContent += `</div>
                    <div style="height: 3px; background: linear-gradient(to right, transparent, #cbd5e1, transparent); margin: 12px 0;"></div>
                `;
        }


        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <!-- Header بالتاريخ والوقت -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير قضايا الموكل</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                
                ${pdfContent}
            </div>
        `;

        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير شامل - ${selectedClientName}</title>
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


async function exportClientComprehensiveReportPDF(forShare) {
    if (!currentSelectedClient) {
        showToast('يجب اختيار موكل أولاً', 'error');
        return;
    }

    try {
        const client = await getById('clients', currentSelectedClient.id);
        if (!client) {
            showToast('لم يتم العثور على بيانات الموكل', 'error');
            return;
        }

        const selectedClientName = currentSelectedClient.name;
        const allCases = await getAllCases();
        let clientCases = allCases.filter(c => c.clientId === client.id);
        clientCases = __filterClientCasesBySelection(clientCases);

        if (clientCases.length === 0) {
            showToast('لا توجد قضايا مطابقة لهذا الموكل', 'error');
            return;
        }

        showToast('جاري إنشاء ملف PDF...', 'info');
        if (typeof showReportsLoadingOverlay === 'function') {
            showReportsLoadingOverlay('جاري إعداد تقرير قضايا الموكل...');
        }
        await new Promise(resolve => setTimeout(resolve, 80));

        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));


        const __formatForPdf = (val) => {
            if (val == null) return '';
            const str = String(val);
            return str.includes('/') ? str.replace(/\//g, ' - ') : str;
        };

        const renderSessionCard = (session, idx) => `
            <div style="display: grid; grid-template-columns: 38% 62%; gap: 5px; margin-bottom: 4px; background: white; border: 1px solid #10b981; border-radius: 6px; padding: 5px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px; align-content: start;">
                    <div style="background: #d1fae5; padding: 2px 5px; border-radius: 3px; text-align: center; font-weight: bold; color: #059669; font-size: 10.5px;">الجلسة ${idx + 1}</div>
                    <div></div>
                    <strong style="color: #047857; font-size: 10.5px;">التاريخ</strong>
                    <span style="color: #047857; font-size: 10.5px;">${__formatReportsClientComprehensiveDateForDisplay(session.sessionDate)}</span>
                    <strong style="color: #047857; font-size: 10.5px;">الرول</strong>
                    <span style="color: #047857; font-size: 10.5px;">${__formatForPdf(session.roll) || '-'}</span>
                    <strong style="color: #047857; font-size: 10.5px;">رقم الحصر</strong>
                    <span style="color: #047857; font-size: 10.5px;">${__formatForPdf(session.inventoryNumber) || '-'}</span>
                    <strong style="color: #047857; font-size: 10.5px;">سنة الحصر</strong>
                    <span style="color: #047857; font-size: 10.5px;">${__formatForPdf(session.inventoryYear) || '-'}</span>
                </div>
                <div style="background: #ecfdf5; padding: 5px; border-radius: 4px; border-right: 3px solid #10b981; box-sizing: border-box;">
                    <div style="margin-bottom: 3px;">
                        <strong style="color: #047857; font-size: 10.5px; display: block; margin-bottom: 2px;">القرار</strong>
                        <div style="color: #065f46; font-size: 10.5px; line-height: 1.35;">${__formatForPdf(session.decision) || 'لا يوجد'}</div>
                    </div>
                    ${session.requests && session.requests.trim() ? `
                        <div style="border-top: 1px dashed #10b981; padding-top: 3px; margin-top: 3px;">
                            <strong style="color: #047857; font-size: 10.5px; display: block; margin-bottom: 2px;">الطلبات</strong>
                            <div style="color: #065f46; font-size: 10.5px; line-height: 1.35;">${__formatForPdf(session.requests)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        const pages = [];

        const buildCaseInfoPdfHtml = (caseItem, opponent) => `
            <!-- عنوان القضية -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 6px 10px; text-align: center; font-weight: bold; font-size: 13px;">
                القضية رقم ${__formatForPdf(caseItem.caseNumber) || 'غير محدد'} لسنة ${__formatForPdf(caseItem.caseYear) || 'غير محدد'} - ${__formatForPdf(caseItem.caseType) || 'غير محدد'}
            </div>
            
            <!-- الأطراف في صف واحد -->
            <div style="display: grid; grid-template-columns: 1fr 65px 1fr; gap: 2px; background: #e2e8f0; padding: 2px; box-sizing: border-box;">
                <!-- الموكل -->
                <div style="padding: 5px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 6px; box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2); box-sizing: border-box;">
                    <div style="font-weight: bold; color: #1e3a8a; font-size: 12px; margin-bottom: 3px; text-align: center; background: rgba(59, 130, 246, 0.15); padding: 2px; border-radius: 4px; border: 1px solid #3b82f6;">👤 الموكل</div>
                    <div style="display: grid; gap: 2px;">
                        <div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #3b82f6;"><strong style="color: #1e40af;">الاسم</strong> ${__formatForPdf(client.name) || 'غير محدد'}</div>
                        ${client.capacity ? `<div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #60a5fa;"><strong style="color: #1e40af;">الصفة</strong> ${__formatForPdf(client.capacity)}</div>` : ''}
                        ${client.address ? `<div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #93c5fd;"><strong style="color: #1e40af;">العنوان</strong> ${__formatForPdf(client.address)}</div>` : ''}
                        ${client.phone ? `<div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #93c5fd;"><strong style="color: #1e40af;">الهاتف</strong> ${__formatForPdf(client.phone)}</div>` : ''}
                    </div>
                </div>
                
                <!-- VS -->
                <div style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); font-weight: bold; color: white; font-size: 12px; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); border: 2px solid #475569;">
                    <div style="text-align: center; line-height: 1.2;">
                        <div style="font-size: 15px;">⚔️</div>
                        <div style="font-size: 12px;">ضـد</div>
                    </div>
                </div>
                
                <!-- الخصم -->
                <div style="padding: 5px; background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); border: 2px solid #ef4444; border-radius: 6px; box-shadow: 0 1px 3px rgba(239, 68, 68, 0.2); box-sizing: border-box;">
                    <div style="font-weight: bold; color: #7f1d1d; font-size: 12px; margin-bottom: 3px; text-align: center; background: rgba(239, 68, 68, 0.15); padding: 2px; border-radius: 4px; border: 1px solid #ef4444;">⚖️ الخصم</div>
                    <div style="display: grid; gap: 2px;">
                        <div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #ef4444;"><strong style="color: #991b1b;">الاسم</strong> ${opponent ? __formatForPdf(opponent.name) : 'غير محدد'}</div>
                        ${opponent && opponent.capacity ? `<div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #f87171;"><strong style="color: #991b1b;">الصفة</strong> ${__formatForPdf(opponent.capacity)}</div>` : ''}
                        ${opponent && opponent.address ? `<div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #fca5a5;"><strong style="color: #991b1b;">العنوان</strong> ${__formatForPdf(opponent.address)}</div>` : ''}
                        ${opponent && opponent.phone ? `<div style="background: rgba(255, 255, 255, 0.85); padding: 2px 5px; border-radius: 3px; font-size: 11px; border-right: 2px solid #fca5a5;"><strong style="color: #991b1b;">الهاتف</strong> ${__formatForPdf(opponent.phone)}</div>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- بيانات القضية في Grid -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #cbd5e1; padding: 0; margin-top: 0; box-sizing: border-box;">
                ${caseItem.court ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">المحكمة</strong><br>${__formatForPdf(caseItem.court)}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">المحكمة</strong><br>-</div>`}
                ${caseItem.circuitNumber ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الدائرة</strong><br>${__formatForPdf(caseItem.circuitNumber)}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الدائرة</strong><br>-</div>`}
                ${caseItem.fileNumber ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الملف</strong><br>${__formatForPdf(caseItem.fileNumber)}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الملف</strong><br>-</div>`}
                ${caseItem.poaNumber ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">التوكيل</strong><br>${__formatForPdf(caseItem.poaNumber)}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">التوكيل</strong><br>-</div>`}
                
                ${caseItem.caseStatus ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الحالة</strong><br>${__formatForPdf(caseItem.caseStatus)}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الحالة</strong><br>-</div>`}
                ${caseItem.appealNumber ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الاستئناف</strong><br>${__formatForPdf(caseItem.appealNumber)}${caseItem.appealYear ? ' - ' + __formatForPdf(caseItem.appealYear) : ''}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">الاستئناف</strong><br>-</div>`}
                ${caseItem.cassationNumber ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">النقض</strong><br>${__formatForPdf(caseItem.cassationNumber)}${caseItem.cassationYear ? ' - ' + __formatForPdf(caseItem.cassationYear) : ''}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">النقض</strong><br>-</div>`}
                ${caseItem.subject ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">موضوعها</strong><br>${__formatForPdf(caseItem.subject)}</div>` : `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px;"><strong style="color: #1e40af;">موضوعها</strong><br>-</div>`}
                
                ${caseItem.notes ? `<div style="background: #f0f9ff; padding: 3px 5px; font-size: 11px; grid-column: span 4; border-left: 3px solid #3b82f6;"><strong style="color: #1e40af;">ملاحظات</strong> ${__formatForPdf(caseItem.notes)}</div>` : ''}
            </div>
        `;

        const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

        if (isMobileDevice) {
            // كود الهاتف: جلسة واحدة في صفحة البداية ومن 3 إلى 4 في التابع للحفاظ على التنسيق بدون تغيير
            for (const caseItem of clientCases) {
                const opponent = caseItem.opponentId ? await getById('opponents', caseItem.opponentId) : null;
                const sessions = await getFromIndex('sessions', 'caseId', caseItem.id);
                sessions.sort((a, b) => {
                    if (!a.sessionDate) return 1;
                    if (!b.sessionDate) return -1;
                    const da = __parseReportsClientComprehensiveDateString(String(a.sessionDate));
                    const db = __parseReportsClientComprehensiveDateString(String(b.sessionDate));
                    if (!da) return 1;
                    if (!db) return -1;
                    return da - db;
                });

                const caseInfoHtml = buildCaseInfoPdfHtml(caseItem, opponent);

                if (sessions.length <= 1) {
                    const caseSessionsHtml = sessions.length === 1 ? `
                        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 8px; margin-top: 4px; text-align: center; font-weight: bold; font-size: 12px;">
                            الجلسات
                        </div>
                        <div style="border-top: 2px solid #10b981; padding: 4px; background: #f0fdf4; box-sizing: border-box;">
                            ${renderSessionCard(sessions[0], 0)}
                        </div>
                    ` : '';

                    const fullCaseCardHtml = `
                        <div style="margin-bottom: 0px; border: 2px solid #3b82f6; border-radius: 8px; overflow: hidden; background: white; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
                            ${caseInfoHtml}
                            ${caseSessionsHtml}
                        </div>
                    `;

                    pages.push(fullCaseCardHtml);
                } else {
                    const firstCaseCardHtml = `
                        <div style="margin-bottom: 0px; border: 2px solid #3b82f6; border-radius: 8px; overflow: hidden; background: white; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
                            ${caseInfoHtml}
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 8px; margin-top: 4px; text-align: center; font-weight: bold; font-size: 12px;">
                                الجلسات
                            </div>
                            <div style="border-top: 2px solid #10b981; padding: 4px; background: #f0fdf4; box-sizing: border-box;">
                                ${renderSessionCard(sessions[0], 0)}
                            </div>
                        </div>
                    `;
                    pages.push(firstCaseCardHtml);

                    const remainingSessions = sessions.slice(1);
                    let remIdx = 1;

                    while (remainingSessions.length > 0) {
                        const batchSize = (remainingSessions.length <= 4) ? remainingSessions.length : 3;
                        const currentBatch = remainingSessions.splice(0, batchSize);

                        const contCardHtml = `
                            <div style="margin-bottom: 0px; border: 2px solid #10b981; border-radius: 8px; overflow: hidden; background: white; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 8px; text-align: center; font-weight: bold; font-size: 12px;">
                                    تابع جلسات القضية رقم ${__formatForPdf(caseItem.caseNumber) || 'غير محدد'} لسنة ${__formatForPdf(caseItem.caseYear) || 'غير محدد'}
                                </div>
                                <div style="padding: 4px; background: #f0fdf4; box-sizing: border-box;">
                                    ${currentBatch.map((s, bIdx) => renderSessionCard(s, remIdx + bIdx)).join('')}
                                </div>
                            </div>
                        `;
                        pages.push(contCardHtml);
                        remIdx += currentBatch.length;
                    }
                }
            }
        } else {
            // كود الكمبيوتر الذكي: تعبئة ديناميكية بدون تقييد عددي، واستغلال المساحة المتبقية إذا امتدت القضية
            const PAGE_MAX_HEIGHT = 980;
            let currentPageBlocks = [];
            let currentUsedHeight = 0;
            let pageHasOverflowSessions = false;

            const calcSessionHeight = (s) => {
                let h = 80;
                if (s.decision && s.decision.length > 0) {
                    h += Math.min(60, Math.ceil(s.decision.length / 45) * 15);
                }
                if (s.requests && s.requests.trim().length > 0) {
                    h += Math.min(45, Math.ceil(s.requests.length / 45) * 15);
                }
                return h;
            };

            const flushCurrentPage = () => {
                if (currentPageBlocks.length > 0) {
                    pages.push(currentPageBlocks.join('<div style="height: 10px;"></div>'));
                    currentPageBlocks = [];
                    currentUsedHeight = 0;
                    pageHasOverflowSessions = false;
                }
            };

            for (const caseItem of clientCases) {
                const opponent = caseItem.opponentId ? await getById('opponents', caseItem.opponentId) : null;
                const sessions = await getFromIndex('sessions', 'caseId', caseItem.id);
                sessions.sort((a, b) => {
                    if (!a.sessionDate) return 1;
                    if (!b.sessionDate) return -1;
                    const da = __parseReportsClientComprehensiveDateString(String(a.sessionDate));
                    const db = __parseReportsClientComprehensiveDateString(String(b.sessionDate));
                    if (!da) return 1;
                    if (!db) return -1;
                    return da - db;
                });

                const caseInfoHtml = buildCaseInfoPdfHtml(caseItem, opponent);
                const caseInfoHeight = 220;

                const neededForNewCaseStart = caseInfoHeight + 35 + (sessions.length > 0 ? calcSessionHeight(sessions[0]) : 0);

                if (currentPageBlocks.length > 0) {
                    if (pageHasOverflowSessions && (PAGE_MAX_HEIGHT - currentUsedHeight >= neededForNewCaseStart)) {
                        // مساحة متبقية كافية بعد جلسات تابعة: نكمل فيها القضية دي فوراً لمنع هدر المساحة
                    } else {
                        // نقفل الصفحة ونبدأ القضية في ورقة جديدة
                        flushCurrentPage();
                    }
                }

                let sessIdx = 0;
                let isFirstBatchForThisCase = true;
                let caseHadOverflow = false;

                while (sessIdx < sessions.length || isFirstBatchForThisCase) {
                    if (isFirstBatchForThisCase) {
                        let batchSessions = [];
                        let batchHeight = caseInfoHeight + (sessions.length > 0 ? 30 : 0);

                        while (sessIdx < sessions.length) {
                            const sh = calcSessionHeight(sessions[sessIdx]);
                            if (currentUsedHeight + batchHeight + sh <= PAGE_MAX_HEIGHT) {
                                batchSessions.push(sessions[sessIdx]);
                                batchHeight += sh;
                                sessIdx++;
                            } else {
                                break;
                            }
                        }

                        const sessionsHtml = batchSessions.length > 0 ? `
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 8px; margin-top: 4px; text-align: center; font-weight: bold; font-size: 12px;">
                                الجلسات
                            </div>
                            <div style="border-top: 2px solid #10b981; padding: 4px; background: #f0fdf4; box-sizing: border-box;">
                                ${batchSessions.map((s, bIdx) => renderSessionCard(s, bIdx)).join('')}
                            </div>
                        ` : '';

                        const caseBlockHtml = `
                            <div style="margin-bottom: 0px; border: 2px solid #3b82f6; border-radius: 8px; overflow: hidden; background: white; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
                                ${caseInfoHtml}
                                ${sessionsHtml}
                            </div>
                        `;

                        currentPageBlocks.push(caseBlockHtml);
                        currentUsedHeight += batchHeight;
                        isFirstBatchForThisCase = false;

                        if (sessIdx < sessions.length) {
                            caseHadOverflow = true;
                            flushCurrentPage();
                        }
                    } else {
                        const contHeaderHeight = 35;
                        let contBatch = [];
                        let contHeight = contHeaderHeight;
                        const startIdx = sessIdx;

                        while (sessIdx < sessions.length) {
                            const sh = calcSessionHeight(sessions[sessIdx]);
                            if (currentUsedHeight + contHeight + sh <= PAGE_MAX_HEIGHT) {
                                contBatch.push(sessions[sessIdx]);
                                contHeight += sh;
                                sessIdx++;
                            } else {
                                break;
                            }
                        }

                        if (contBatch.length === 0 && sessIdx < sessions.length) {
                            contBatch.push(sessions[sessIdx]);
                            contHeight += calcSessionHeight(sessions[sessIdx]);
                            sessIdx++;
                        }

                        const contBlockHtml = `
                            <div style="margin-bottom: 0px; border: 2px solid #10b981; border-radius: 8px; overflow: hidden; background: white; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 8px; text-align: center; font-weight: bold; font-size: 12px;">
                                    تابع جلسات القضية رقم ${__formatForPdf(caseItem.caseNumber) || 'غير محدد'} لسنة ${__formatForPdf(caseItem.caseYear) || 'غير محدد'}
                                </div>
                                <div style="padding: 4px; background: #f0fdf4; box-sizing: border-box;">
                                    ${contBatch.map((s, bIdx) => renderSessionCard(s, startIdx + bIdx)).join('')}
                                </div>
                            </div>
                        `;

                        currentPageBlocks.push(contBlockHtml);
                        currentUsedHeight += contHeight;
                        pageHasOverflowSessions = true;

                        if (sessIdx < sessions.length) {
                            flushCurrentPage();
                        }
                    }
                }

                if (!caseHadOverflow) {
                    flushCurrentPage();
                }
            }

            flushCurrentPage();
        }

        if (pages.length === 0) {
            showToast('لا توجد بيانات صالحة للتصدير', 'error');
            return;
        }

        const currentDate = new Date().toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG');
        const currentTime = new Date().toLocaleTimeString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
        const totalPages = pages.length;

        const pageElements = pages.map((pageHtml, pageIdx) => {
            const div = document.createElement('div');
            div.style.direction = 'rtl';
            div.style.boxSizing = 'border-box';
            div.style.padding = '4px 6px';
            div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

            const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

            div.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 4px;">
                    <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">
                        تقرير قضايا الموكل ${pageNumberLabel}
                    </div>
                    <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                    <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
                </div>
                ${pageHtml}
            `;
            return div;
        });

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_قضايا_الموكل_${selectedClientName}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const emptyDiv = document.createElement('div');
        emptyDiv.style.height = '1px';
        emptyDiv.innerHTML = '&nbsp;';
        const firstWorker = html2pdf().set(opt).from(emptyDiv);
        await firstWorker.toPdf();
        const pdf = await firstWorker.get('pdf');
        const pageSize = await firstWorker.get('pageSize');

        // حذف أي صفحات زائدة إن وجدت لضمان البدء بصفحة 1 نظيفة تماماً
        while (pdf.internal.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.internal.getNumberOfPages());
        }

        // رسم كل صفحة كـ Canvas مستقل وإضافتها لـ jsPDF بدقة لمنع أي انقسام أو صفحات فارغة
        for (let i = 0; i < pageElements.length; i++) {
            if (i > 0) {
                pdf.addPage();
            }
            await new Promise(r => setTimeout(r, 10));
            const pageCanvas = await html2pdf().set(opt).from(pageElements[i]).toCanvas().get('canvas');
            const imgData = pageCanvas.toDataURL('image/' + (opt.image?.type || 'jpeg'), opt.image?.quality || 0.95);
            let imgWidth = pageSize.inner.width;
            let imgHeight = pageCanvas.height * imgWidth / pageCanvas.width;
            let xOffset = opt.margin[1];
            if (imgHeight > pageSize.inner.height) {
                const ratio = pageSize.inner.height / imgHeight;
                imgHeight = pageSize.inner.height;
                imgWidth = imgWidth * ratio;
                xOffset = opt.margin[1] + (pageSize.inner.width - imgWidth) / 2;
            }
            pdf.addImage(imgData, (opt.image?.type || 'jpeg').toUpperCase(), xOffset, opt.margin[0], imgWidth, imgHeight);
        }

        if (forShare) {
            const blob = pdf.output('blob');
            return { blob, filename: opt.filename };
        }

        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    } finally {
        if (typeof hideReportsLoadingOverlay === 'function') {
            hideReportsLoadingOverlay();
        }
    }
}

/** يُرجع تقرير الموكل الشامل كـ blob للمشاركة (واتساب) */
async function exportClientComprehensiveReportPDFForShare() {
    return await exportClientComprehensiveReportPDF(true);
}

async function exportClientComprehensiveReportExcel() {
    if (!currentSelectedClient) {
        showToast('يجب اختيار موكل أولاً', 'error');
        return;
    }

    try {

        const client = await getById('clients', currentSelectedClient.id);

        if (!client) {
            showToast('لم يتم العثور على بيانات الموكل', 'error');
            return;
        }

        const selectedClientName = currentSelectedClient.name;

        const allCases = await getAllCases();
        let clientCases = allCases.filter(c => c.clientId === client.id);
        clientCases = __filterClientCasesBySelection(clientCases);

        if (clientCases.length === 0) {
            showToast('لا توجد قضايا مطابقة لهذا الموكل', 'error');
            return;
        }

        showToast('جاري إنشاء ملف Excel...', 'info');
        if (typeof showReportsLoadingOverlay === 'function') {
            showReportsLoadingOverlay('جاري إعداد ملف Excel...');
        }
        await new Promise(resolve => setTimeout(resolve, 60));

        let excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <meta name="ProgId" content="Excel.Sheet">
                <meta name="Generator" content="Microsoft Excel 15">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        direction: rtl;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        direction: rtl;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: center;
                        font-size: 12px;
                    }
                    th {
                        background-color: #f59e0b;
                        color: white;
                        font-weight: bold;
                    }
                    .section-header {
                        background-color: #fcd34d;
                        font-weight: bold;
                        text-align: right;
                        padding: 10px;
                    }
                    .client-info {
                        background-color: #dbeafe;
                    }
                    .opponent-info {
                        background-color: #fecaca;
                    }
                    .case-info {
                        background-color: #e0f2fe;
                    }
                    .session-info {
                        background-color: #d1fae5;
                    }
                </style>
            </head>
            <body>
                <h2 style="text-align: center;">تقرير شامل - ${selectedClientName}</h2>
                <p style="text-align: center;">التاريخ: ${new Date().toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG')}</p>
        `;

        for (const caseItem of clientCases) {
            const opponent = caseItem.opponentId ? await getById('opponents', caseItem.opponentId) : null;
            const sessions = await getFromIndex('sessions', 'caseId', caseItem.id);
            sessions.sort((a, b) => {
                if (!a.sessionDate) return 1;
                if (!b.sessionDate) return -1;
                const da = __parseReportsClientComprehensiveDateString(String(a.sessionDate));
                const db = __parseReportsClientComprehensiveDateString(String(b.sessionDate));
                if (!da) return 1;
                if (!db) return -1;
                return da - db;
            });

            excelContent += `
                <br/>
                <table>
                    <tr>
                        <td colspan="4" class="section-header">بيانات الأطراف</td>
                    </tr>
                    <tr>
                        <th class="client-info" colspan="2">الموكل</th>
                        <th class="opponent-info" colspan="2">الخصم</th>
                    </tr>
                    <tr>
                        <td class="client-info"><strong>الاسم</strong></td>
                        <td class="client-info">${client.name || 'غير محدد'}</td>
                        <td class="opponent-info"><strong>الاسم</strong></td>
                        <td class="opponent-info">${opponent ? opponent.name : 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <td class="client-info"><strong>الصفة</strong></td>
                        <td class="client-info">${caseItem.clientCapacity || client.capacity || 'غير محدد'}</td>
                        <td class="opponent-info"><strong>الصفة</strong></td>
                        <td class="opponent-info">${(opponent && caseItem.opponentCapacity) ? caseItem.opponentCapacity : (opponent ? opponent.capacity : 'غير محدد')}</td>
                    </tr>
                    <tr>
                        <td class="client-info"><strong>العنوان</strong></td>
                        <td class="client-info">${client.address || 'غير محدد'}</td>
                        <td class="opponent-info"><strong>العنوان</strong></td>
                        <td class="opponent-info">${opponent ? opponent.address : 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <td class="client-info"><strong>الهاتف</strong></td>
                        <td class="client-info">${client.phone || 'غير محدد'}</td>
                        <td class="opponent-info"><strong>الهاتف</strong></td>
                        <td class="opponent-info">${opponent ? opponent.phone : 'غير محدد'}</td>
                    </tr>
                </table>
                
                <br/>
                <table>
                    <tr>
                        <td colspan="4" class="section-header">بيانات القضية</td>
                    </tr>
                    <tr>
                        <th class="case-info">المحكمة</th>
                        <td class="case-info">${caseItem.court || 'غير محدد'}</td>
                        <th class="case-info">رقم الدائرة</th>
                        <td class="case-info">${caseItem.circuitNumber || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <th class="case-info">نوع الدعوى</th>
                        <td class="case-info">${caseItem.caseType || 'غير محدد'}</td>
                        <th class="case-info">موضوع الدعوى</th>
                        <td class="case-info">${caseItem.subject || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <th class="case-info">رقم الدعوى</th>
                        <td class="case-info">${caseItem.caseNumber || 'غير محدد'}</td>
                        <th class="case-info">سنة الدعوى</th>
                        <td class="case-info">${caseItem.caseYear || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <th class="case-info">رقم الاستئناف</th>
                        <td class="case-info">${caseItem.appealNumber || 'غير محدد'}</td>
                        <th class="case-info">سنة الاستئناف</th>
                        <td class="case-info">${caseItem.appealYear || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <th class="case-info">رقم النقض</th>
                        <td class="case-info">${caseItem.cassationNumber || 'غير محدد'}</td>
                        <th class="case-info">سنة النقض</th>
                        <td class="case-info">${caseItem.cassationYear || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <th class="case-info">رقم الملف</th>
                        <td class="case-info">${caseItem.fileNumber || 'غير محدد'}</td>
                        <th class="case-info">رقم التوكيل</th>
                        <td class="case-info">${caseItem.poaNumber || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <th class="case-info">حالة القضية</th>
                        <td class="case-info">${caseItem.caseStatus || 'غير محدد'}</td>
                        <th class="case-info">ملاحظات</th>
                        <td class="case-info">${caseItem.notes || 'لا توجد ملاحظات'}</td>
                    </tr>
                </table>
            `;


            if (sessions.length > 0) {
                excelContent += `
                    <br/>
                    <table>
                        <tr>
                            <td colspan="6" class="section-header">الجلسات (${sessions.length})</td>
                        </tr>
                        <tr>
                            <th class="session-info">رقم الجلسة</th>
                            <th class="session-info">تاريخ الجلسة</th>
                            <th class="session-info">الرول</th>
                            <th class="session-info">رقم الحصر</th>
                            <th class="session-info">سنة الحصر</th>
                            <th class="session-info">القرار</th>
                        </tr>
                `;

                sessions.forEach((session, index) => {
                    excelContent += `
                        <tr>
                            <td class="session-info">${index + 1}</td>
                            <td class="session-info">${__formatReportsClientComprehensiveDateForDisplay(session.sessionDate)}</td>
                            <td class="session-info">${session.roll || 'غير محدد'}</td>
                            <td class="session-info">${session.inventoryNumber || 'غير محدد'}</td>
                            <td class="session-info">${session.inventoryYear || 'غير محدد'}</td>
                            <td class="session-info">${session.decision || 'لا يوجد قرار'}</td>
                        </tr>
                    `;


                    if (session.requests && session.requests.trim()) {
                        excelContent += `
                            <tr>
                                <td colspan="6" class="session-info" style="text-align: right; background-color: #f0fdf4;">
                                    <strong>الطلبات:</strong> ${session.requests}
                                </td>
                            </tr>
                        `;
                    }
                });

                excelContent += `</table>`;
            }

            excelContent += `<br/><hr/><br/>`;
        }

        excelContent += `
            </body>
            </html>
        `;


        const blob = new Blob([excelContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_شامل_${selectedClientName}_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');

    } catch (error) {
        console.error('Error exporting client comprehensive report:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    } finally {
        if (typeof hideReportsLoadingOverlay === 'function') {
            hideReportsLoadingOverlay();
        }
    }
}


function filterClientComprehensiveReport(searchText, clients, allCases, allOpponents) {
    const container = document.getElementById('client-comprehensive-content');
    if (!container) return;

    const clean = (s) => (window.normalizeDigits ? window.normalizeDigits(s) : String(s || '')).toLowerCase().replace(/[إأآ]/g, 'ا').trim();
    const searchLower = clean(searchText);

    const opponentsMap = new Map(Array.isArray(allOpponents) ? allOpponents.map(o => [o.id, o]) : []);
    const casesByClientId = new Map();
    for (const cs of (allCases || [])) {
        const arr = casesByClientId.get(cs.clientId) || [];
        arr.push(cs);
        casesByClientId.set(cs.clientId, arr);
    }

    const matchedEntries = [];

    for (const client of (clients || [])) {
        if (!searchLower) {
            matchedEntries.push({ client, matchingCases: [] });
            continue;
        }

        const clientCases = casesByClientId.get(client.id) || [];
        const opponentNames = getClientOpponentNames(client.id, clientCases, opponentsMap);

        const matchName = clean(client.name).includes(searchLower);
        const matchOpponent = opponentNames.some(name => clean(name).includes(searchLower));
        const matchCapacity = clientCases.some(c => clean(c.clientCapacity).includes(searchLower) || clean(c.opponentCapacity).includes(searchLower));
        const matchingCases = clientCases.filter(c => __matchesReportsClientCase(c, searchLower));

        if (matchName || matchOpponent || matchCapacity || matchingCases.length > 0) {
            matchedEntries.push({ client, matchingCases });
        }
    }

    if (matchedEntries.length > 0) {
        let html = '<div class="space-y-3">';
        for (const { client, matchingCases } of matchedEntries) {
            const clientCases = casesByClientId.get(client.id) || [];
            const opponentNames = getClientOpponentNames(client.id, clientCases, opponentsMap);
            const safeName = String(client.name || '').replace(/'/g, "\\'");
            const opponentsHtml = opponentNames.length > 0
                ? `<div class="text-sm text-gray-600 mt-1 flex items-center gap-2"><span class="text-red-600 font-semibold">ضد:</span><span class="text-red-700 font-medium">${opponentNames.join(' - ')}</span></div>`
                : `<div class="text-sm text-gray-400 mt-1 italic">لا يوجد خصوم مسجلين</div>`;

            const defaultOpenArgs = (matchingCases.length === 1 && searchLower)
                ? `${client.id}, '${safeName}', ${matchingCases[0].id}`
                : (matchingCases.length > 1 && searchLower)
                    ? `${client.id}, '${safeName}', null, '${searchText.replace(/'/g, "\\'")}'`
                    : `${client.id}, '${safeName}'`;

            html += `
                <div class="report-client-card p-4 bg-gradient-to-l from-blue-50 to-white rounded-xl border border-blue-200 hover:shadow-md hover:border-blue-400 hover:from-blue-100 transition-all duration-300">
                    <div class="flex items-center justify-between">
                        <div onclick="displayClientComprehensiveReport(${defaultOpenArgs})" class="flex items-center gap-4 flex-1 cursor-pointer">
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="ri-user-3-fill text-blue-600 text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-bold text-gray-800 text-lg">${client.name || ''}</h3>
                                ${opponentsHtml}
                            </div>
                        </div>
                        ${(typeof isElectronApp === 'function' && isElectronApp()) ? `
                            <button onclick="event.stopPropagation(); printClientFromCard(${client.id}, '${safeName}')" class="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold border-2 border-green-600 hover:border-green-700 cursor-pointer shadow-sm">
                                <i class="ri-printer-line text-lg"></i>
                                <span>طباعة</span>
                            </button>
                        ` : `
                            <button onclick="event.stopPropagation(); shareClientFromCard(${client.id}, '${safeName}')" class="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-gray-800 rounded-lg transition-colors font-medium border border-green-200 shadow-sm cursor-pointer">
                                <i class="ri-whatsapp-line text-green-600"></i>
                                <span>واتساب</span>
                            </button>
                        `}
                    </div>

                    ${matchingCases.length > 0 && searchLower ? `
                        <div class="mt-3 pt-3 border-t border-blue-200/80 space-y-2">
                            <div class="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <i class="ri-scales-3-line text-amber-600"></i>
                                <span>دعاوى مطابقة لكلمة البحث (${matchingCases.length}):</span>
                            </div>
                            ${matchingCases.map(mc => `
                                <div onclick="displayClientComprehensiveReport(${client.id}, '${safeName}', ${mc.id})" class="flex items-center justify-between p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg cursor-pointer transition-colors">
                                    <div class="flex items-center gap-2 text-sm text-amber-950 font-bold">
                                        <span class="bg-amber-600 text-white text-xs px-2 py-0.5 rounded shadow-xs">دعوى</span>
                                        <span>رقم ${mc.caseNumber || 'غير محدد'} لسنة ${mc.caseYear || ''}</span>
                                        ${mc.caseType ? `<span class="text-xs text-gray-600 font-normal">(${mc.caseType})</span>` : ''}
                                        ${mc.court ? `<span class="text-xs text-gray-600 font-normal">• ${mc.court}</span>` : ''}
                                    </div>
                                    <div class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-white px-3 py-1.5 rounded-md shadow-xs border border-blue-200 hover:bg-blue-50">
                                        <span>عرض هذه الدعوى بجلساتها</span>
                                        <i class="ri-arrow-left-line"></i>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    } else {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-search-line text-8xl text-gray-300"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد نتائج</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على موكلين أو دعاوى مطابقة لبحثك</p>
            </div>
        `;
    }
}

// دالة المشاركة المباشرة عبر واتساب من الكارت للهاتف
async function shareClientFromCard(clientId, clientName, targetCaseId = null) {
    try {
        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        await displayClientComprehensiveReport(clientId, clientName, targetCaseId);
        await new Promise(resolve => setTimeout(resolve, 300));
        const result = await exportClientComprehensiveReportPDFForShare();
        if (result && result.blob && typeof shareReportPdfAsFile === 'function') {
            await shareReportPdfAsFile(result.blob, result.filename);
        }
    } catch (error) {
        console.error('Error sharing client report from card:', error);
        showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}

// دالة الطباعة المباشرة من الكارت للكمبيوتر
async function printClientFromCard(clientId, clientName, targetCaseId = null) {
    try {
        // عرض التقرير أولاً لتحميل البيانات
        await displayClientComprehensiveReport(clientId, clientName, targetCaseId);

        // انتظار تحميل المحتوى
        await new Promise(resolve => setTimeout(resolve, 300));

        // تنفيذ الطباعة
        await printClientComprehensiveReport();
    } catch (error) {
        console.error('Error printing from card:', error);
        showToast('حدث خطأ أثناء الطباعة', 'error');
    }
}

// طباعة قائمة الموكلين
async function printClientsList(clients, allCases, allOpponents) {
    try {
        await __getReportsClientComprehensiveDateLocaleSetting();
        if (!clients || clients.length === 0) {
            showToast('لا توجد موكلين للطباعة', 'error');
            return;
        }

        // جلب اسم المكتب
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const currentDate = new Date().toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG');

        // بناء صفوف الجدول (نفس تصميم تقارير القضايا)
        let tableRows = '';
        const opponentsMap = new Map(Array.isArray(allOpponents) ? allOpponents.map(o => [o.id, o]) : []);
        clients.forEach((client, i) => {
            const clientCases = allCases.filter(c => c.clientId === client.id);
            const opponentNames = getClientOpponentNames(client.id, clientCases, opponentsMap);

            const rowBg = i % 2 === 0 ? '#fff7ed' : '#ffffff';
            const opponentsText = opponentNames.length > 0 ? opponentNames.join(' - ') : 'لا يوجد';

            tableRows += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: center; font-size: 14px;">${client.name || 'غير محدد'}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: center; font-size: 14px;">${opponentsText}</td>
                </tr>
            `;
        });

        // بناء HTML (نفس تصميم تقارير القضايا)
        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير الموكلين</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                    <thead>
                        <tr>
                            <th style="background-color: #1e40af; color: white; padding: 8px 6px; text-align: center; border: 1px solid #1e3a8a; font-weight: bold; font-size: 14px; width: 45%; white-space: nowrap;">اسم الموكل</th>
                            <th style="background-color: #1e40af; color: white; padding: 8px 6px; text-align: center; border: 1px solid #1e3a8a; font-weight: bold; font-size: 14px; width: 55%; white-space: nowrap;">الخصوم</th>
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
                <title>تقرير الموكلين - ${new Date().toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG')}</title>
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

        showToast('تم إعداد قائمة الموكلين للطباعة', 'success');

    } catch (error) {
        console.error('Error printing clients list:', error);
        showToast('حدث خطأ أثناء الطباعة', 'error');
    }
}

// تصدير قائمة الموكلين إلى PDF
// توليد PDF متعدد الصفحات نظيف ومستقل لقائمة الموكلين العامة
async function __generateReportsClientsListPDFDocument(clients, allCases, allOpponents, officeName, opt) {
    if (!clients || clients.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    const ROWS_PER_PAGE = 16;
    const pages = [];
    for (let i = 0; i < clients.length; i += ROWS_PER_PAGE) {
        pages.push(clients.slice(i, i + ROWS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsClientComprehensiveDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;
    const opponentsMap = new Map(Array.isArray(allOpponents) ? allOpponents.map(o => [o.id, o]) : []);

    const __formatPdfVal = (v) => {
        if (v == null) return '';
        const s = String(v);
        return s.includes('/') ? s.replace(/\//g, ' - ') : s;
    };

    // بناء عناصر مستقلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pageClients, pageIdx) => {
        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        const rowsHtml = pageClients.map((client, i) => {
            const clientCases = (allCases || []).filter(c => c.clientId === client.id);
            const opponentNames = getClientOpponentNames(client.id, clientCases, opponentsMap);

            const rowBg = i % 2 === 0 ? '#fff7ed' : '#ffffff';
            const opponentsText = opponentNames.length > 0 ? __formatPdfVal(opponentNames.join(' - ')) : 'لا يوجد';

            return `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #cbd5e1; padding: 5px 6px; text-align: center; font-size: 10px; font-weight: bold; word-break: break-word; line-height: 1.15; box-sizing: border-box;">${__formatPdfVal(client.name) || 'غير محدد'}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 5px 6px; text-align: center; font-size: 10px; word-break: break-word; line-height: 1.15; box-sizing: border-box;">${opponentsText}</td>
                </tr>
            `;
        }).join('');

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير الموكلين ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 4px; direction: rtl; table-layout: auto; box-sizing: border-box;">
                <thead>
                    <tr>
                        <th style="background-color: #1e40af; color: white; padding: 5px 6px; text-align: center; border: 1px solid #1e3a8a; font-weight: bold; font-size: 10.5px; width: 45%; white-space: nowrap; box-sizing: border-box;">اسم الموكل</th>
                        <th style="background-color: #1e40af; color: white; padding: 5px 6px; text-align: center; border: 1px solid #1e3a8a; font-weight: bold; font-size: 10.5px; width: 55%; white-space: nowrap; box-sizing: border-box;">الخصوم</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
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

// تصدير قائمة الموكلين إلى PDF
async function exportClientsListPDF(clients, allCases, allOpponents) {
    try {
        if (!clients || clients.length === 0) {
            showToast('لا توجد موكلين للتصدير', 'error');
            return;
        }

        await __getReportsClientComprehensiveDateLocaleSetting();
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `قائمة_الموكلين_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __generateReportsClientsListPDFDocument(clients, allCases, allOpponents, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير قائمة الموكلين بنجاح', 'success');

    } catch (error) {
        console.error('Error exporting clients list:', error);
        showToast('حدث خطأ أثناء التصدير', 'error');
    }
}

/** نفس محتوى تقرير قائمة الموكلين لكن يُرجع blob للمشاركة (واتساب) */
async function exportClientsListPDFAsBlob(clients, allCases, allOpponents) {
    if (!clients || clients.length === 0) throw new Error('لا توجد موكلين للتصدير');
    await __getReportsClientComprehensiveDateLocaleSetting();
    let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

    const opt = {
        margin: [8, 5, 8, 5],
        filename: `قائمة_الموكلين_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdf = await __generateReportsClientsListPDFDocument(clients, allCases, allOpponents, officeName, opt);
    const blob = pdf.output('blob');
    return { blob, filename: opt.filename };
}
