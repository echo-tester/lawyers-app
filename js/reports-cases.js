


let __reportsCasesDateLocaleCache = null;
async function __getReportsCasesDateLocaleSetting() {
    if (__reportsCasesDateLocaleCache) return __reportsCasesDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) { }
    __reportsCasesDateLocaleCache = locale;
    return locale;
}

function __parseReportsCasesDateString(dateStr) {
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

function __formatReportsCasesDateForDisplay(dateStr) {
    try {
        const d = __parseReportsCasesDateString(dateStr);
        if (!d) return (dateStr || 'غير محدد');
        return d.toLocaleDateString(__reportsCasesDateLocaleCache || 'ar-EG');
    } catch (_) {
        return (dateStr || 'غير محدد');
    }
}

let __reportsCasesAllSessions = [];
let __reportsCasesCurrentSessions = [];
let __reportsCasesVisibleColumnKeysCache = null;
const __reportsCasesColumnsStorageKey = 'reportsCasesVisibleColumns';
const __reportsCasesLegacyDefaultVisibleColumns = ['clientName', 'fileNumber', 'caseNumber', 'inventoryNumber', 'decision'];
const __reportsCasesPreviousDefaultVisibleColumns = ['clientName', 'caseNumber', 'inventoryNumber', 'sessionDate'];
const __reportsCasesDefaultVisibleColumns = ['clientName', 'opponentName', 'caseNumber', 'inventoryNumber'];

let __reportsCasesTimeFilterMode = 'all'; // all | today | week | month
let __reportsCasesSearchTerm = '';
const __reportsCasesColumnDefinitions = [
    { key: 'clientName', group: 'clients', label: 'اسم الموكل', icon: 'ri-user-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '175px' },
    { key: 'clientPhone', group: 'clients', label: 'هاتف الموكل', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'clientCapacity', group: 'clients', label: 'صفة الموكل', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'clientAddress', group: 'clients', label: 'عنوان الموكل', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words', minWidth: '155px' },
    { key: 'opponentName', group: 'opponents', label: 'اسم الخصم', icon: 'ri-user-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '175px' },
    { key: 'opponentPhone', group: 'opponents', label: 'هاتف الخصم', icon: 'ri-phone-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'opponentCapacity', group: 'opponents', label: 'صفة الخصم', icon: 'ri-bookmark-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'opponentAddress', group: 'opponents', label: 'عنوان الخصم', icon: 'ri-map-pin-line', cellClass: 'whitespace-normal break-words', minWidth: '155px' },
    { key: 'fileNumber', group: 'cases', label: 'رقم الملف', icon: 'ri-folder-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '85px' },
    { key: 'caseNumber', group: 'cases', label: 'رقم القضية', icon: 'ri-hashtag', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'caseType', group: 'cases', label: 'نوع القضية', icon: 'ri-file-list-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '115px' },
    { key: 'court', group: 'cases', label: 'المحكمة', icon: 'ri-building-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '115px' },
    { key: 'circuitNumber', group: 'cases', label: 'رقم الدائرة', icon: 'ri-layout-grid-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '90px' },
    { key: 'subject', group: 'cases', label: 'موضوع القضية', icon: 'ri-article-line', cellClass: 'whitespace-normal break-words', minWidth: '165px' },
    { key: 'caseStatus', group: 'cases', label: 'حالة القضية', icon: 'ri-scales-3-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '105px' },
    { key: 'poaNumber', group: 'cases', label: 'رقم التوكيل', icon: 'ri-file-paper-2-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'appealLabel', group: 'cases', label: 'الاستئناف', icon: 'ri-file-copy-2-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'cassationLabel', group: 'cases', label: 'النقض', icon: 'ri-file-copy-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '125px' },
    { key: 'sessionDate', group: 'sessions', label: 'آخر جلسة', icon: 'ri-calendar-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '115px' },
    { key: 'roll', group: 'sessions', label: 'الرول', icon: 'ri-list-check', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '75px' },
    { key: 'inventoryNumber', group: 'sessions', label: 'رقم الحصر', icon: 'ri-file-list-line', cellClass: 'whitespace-normal break-words overflow-hidden', minWidth: '115px' },
    { key: 'inventoryYear', group: 'sessions', label: 'سنة الحصر', icon: 'ri-calendar-2-line', cellClass: 'whitespace-nowrap overflow-hidden', minWidth: '95px' },
    { key: 'decision', group: 'sessions', label: 'القرار', icon: 'ri-gavel-line', cellClass: 'break-words', minWidth: '155px' },
    { key: 'requests', group: 'sessions', label: 'الطلبات', icon: 'ri-question-answer-line', cellClass: 'break-words', minWidth: '155px' }
];

function __escapeReportsCasesHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function __normalizeReportsCasesCellValue(value, fallback = 'غير محدد') {
    const text = String(value == null ? '' : value).trim();
    return text !== '' ? text : fallback;
}

function __formatReportsCasesNumberYearValue(numberValue, yearValue) {
    const numberText = String(numberValue == null ? '' : numberValue).trim();
    const yearText = String(yearValue == null ? '' : yearValue).trim();
    if (numberText && yearText) return `${numberText} لسنة ${yearText}`;
    return numberText || yearText || 'غير محدد';
}

function __getReportsCasesVisibleColumnKeys() {
    if (Array.isArray(__reportsCasesVisibleColumnKeysCache) && __reportsCasesVisibleColumnKeysCache.length) {
        return [...__reportsCasesVisibleColumnKeysCache];
    }
    try {
        const raw = localStorage.getItem(__reportsCasesColumnsStorageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const validKeys = __reportsCasesColumnDefinitions.map(col => col.key);
            const filtered = parsed.filter(key => validKeys.includes(key));
            if (filtered.length) {
                const isLegacyDefault = filtered.length === __reportsCasesLegacyDefaultVisibleColumns.length
                    && filtered.every((key, index) => key === __reportsCasesLegacyDefaultVisibleColumns[index]);
                const isPreviousDefault = filtered.length === __reportsCasesPreviousDefaultVisibleColumns.length
                    && filtered.every((key, index) => key === __reportsCasesPreviousDefaultVisibleColumns[index]);
                const shouldUpgradeToDefault = isLegacyDefault || isPreviousDefault;
                __reportsCasesVisibleColumnKeysCache = shouldUpgradeToDefault ? [...__reportsCasesDefaultVisibleColumns] : filtered;
                if (shouldUpgradeToDefault) {
                    try {
                        localStorage.setItem(__reportsCasesColumnsStorageKey, JSON.stringify(__reportsCasesVisibleColumnKeysCache));
                    } catch (_) { }
                }
                return [...__reportsCasesVisibleColumnKeysCache];
            }
        }
    } catch (_) { }
    __reportsCasesVisibleColumnKeysCache = [...__reportsCasesDefaultVisibleColumns];
    return [...__reportsCasesVisibleColumnKeysCache];
}

function __setReportsCasesVisibleColumnKeys(keys) {
    const validKeys = __reportsCasesColumnDefinitions.map(col => col.key);
    const nextKeys = (Array.isArray(keys) ? keys : []).filter(key => validKeys.includes(key));
    __reportsCasesVisibleColumnKeysCache = nextKeys.length ? nextKeys : [...__reportsCasesDefaultVisibleColumns];
    try {
        localStorage.setItem(__reportsCasesColumnsStorageKey, JSON.stringify(__reportsCasesVisibleColumnKeysCache));
    } catch (_) { }
}

function __getReportsCasesVisibleColumns() {
    const visibleKeys = __getReportsCasesVisibleColumnKeys();
    return visibleKeys
        .map(key => __reportsCasesColumnDefinitions.find(col => col.key === key))
        .filter(Boolean);
}

function __getReportsCasesRowData(session, caseMap, clientNameByCaseId, clientByCaseId, opponentByCaseId) {
    const caseIdKey = String(session && session.caseId != null ? session.caseId : '');
    const map = caseMap || window.sessionsCasesById || {};
    const clientNameMap = clientNameByCaseId || window.sessionsClientNameByCaseId || {};
    const clientMap = clientByCaseId || window.sessionsClientByCaseId || {};
    const opponentMap = opponentByCaseId || window.sessionsOpponentByCaseId || {};
    const caseObj = map[caseIdKey] || null;
    const clientObj = clientMap[caseIdKey] || null;
    const opponentObj = opponentMap[caseIdKey] || null;
    const clientNameVal = clientNameMap[caseIdKey] || (clientObj && clientObj.name) || (caseObj && caseObj.clientName) || '';
    const fileNumberVal = session && session.fileNumber != null ? session.fileNumber : (caseObj ? caseObj.fileNumber : '');
    const caseNumberVal = session && session.caseNumber != null ? session.caseNumber : (caseObj ? caseObj.caseNumber : '');
    const caseYearVal = session && session.caseYear != null ? session.caseYear : (caseObj ? caseObj.caseYear : '');
    const appealNumberVal = caseObj ? caseObj.appealNumber : '';
    const appealYearVal = caseObj ? caseObj.appealYear : '';
    const cassationNumberVal = caseObj ? caseObj.cassationNumber : '';
    const cassationYearVal = caseObj ? caseObj.cassationYear : '';
    const sessionDateVal = session && session.sessionDate ? __formatReportsCasesDateForDisplay(session.sessionDate) : '';
    return {
        clientName: __normalizeReportsCasesCellValue(clientNameVal),
        clientPhone: __normalizeReportsCasesCellValue(clientObj && clientObj.phone),
        clientCapacity: __normalizeReportsCasesCellValue((caseObj && caseObj.clientCapacity) || (clientObj && clientObj.capacity)),
        clientAddress: __normalizeReportsCasesCellValue(clientObj && clientObj.address),
        opponentName: __normalizeReportsCasesCellValue(opponentObj && opponentObj.name),
        opponentPhone: __normalizeReportsCasesCellValue(opponentObj && opponentObj.phone),
        opponentCapacity: __normalizeReportsCasesCellValue((caseObj && caseObj.opponentCapacity) || (opponentObj && opponentObj.capacity)),
        opponentAddress: __normalizeReportsCasesCellValue(opponentObj && opponentObj.address),
        fileNumber: __normalizeReportsCasesCellValue(fileNumberVal),
        caseNumber: __formatReportsCasesNumberYearValue(caseNumberVal, caseYearVal),
        caseType: __normalizeReportsCasesCellValue(caseObj && caseObj.caseType),
        court: __normalizeReportsCasesCellValue(caseObj && caseObj.court),
        circuitNumber: __normalizeReportsCasesCellValue(caseObj && caseObj.circuitNumber),
        subject: __normalizeReportsCasesCellValue(caseObj && caseObj.subject),
        caseStatus: __normalizeReportsCasesCellValue(caseObj && caseObj.caseStatus),
        poaNumber: __normalizeReportsCasesCellValue(caseObj && caseObj.poaNumber),
        appealLabel: __formatReportsCasesNumberYearValue(appealNumberVal, appealYearVal),
        cassationLabel: __formatReportsCasesNumberYearValue(cassationNumberVal, cassationYearVal),
        sessionDate: __normalizeReportsCasesCellValue(sessionDateVal),
        roll: __normalizeReportsCasesCellValue(session && session.roll),
        inventoryNumber: __normalizeReportsCasesCellValue(session && session.inventoryNumber),
        inventoryYear: __normalizeReportsCasesCellValue(session && session.inventoryYear),
        decision: __normalizeReportsCasesCellValue(session && session.decision),
        requests: __normalizeReportsCasesCellValue(session && session.requests)
    };
}

function __buildReportsCasesColumnMenuHTML(activeColumnKey) {
    const visibleKeys = __getReportsCasesVisibleColumnKeys();
    const visibleSet = new Set(visibleKeys);
    const currentColumn = __reportsCasesColumnDefinitions.find(col => col.key === activeColumnKey);
    const sameGroupColumns = currentColumn
        ? __reportsCasesColumnDefinitions.filter(col => col.group === currentColumn.group && col.key !== activeColumnKey && !visibleSet.has(col.key))
        : [];
    const items = sameGroupColumns.length ? sameGroupColumns.map(col => `
        <button type="button" onclick="toggleReportsCasesColumnVisibility(event, '${col.key}', '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-orange-50 transition-colors text-gray-700">
            <i class="ri-add-circle-line text-green-600"></i>
            <span class="flex-1 text-sm font-medium">إضافة ${col.label}</span>
            <i class="ri-add-line text-green-600 text-sm"></i>
        </button>
    `).join('') : `
        <div class="px-3 py-3 text-sm text-gray-500 text-right bg-gray-50">لا توجد حقول أخرى في نفس الجدول</div>
    `;
    const canHideCurrent = visibleSet.has(activeColumnKey) && visibleKeys.length > 1;
    return `
        <div id="reports-cases-column-menu-${activeColumnKey}" class="hidden absolute top-full right-0 mt-2 w-72 max-w-[92vw] bg-white border border-orange-200 rounded-xl shadow-2xl z-[80] overflow-hidden flex flex-col">
            ${currentColumn ? `
                <div class="px-3 py-2 bg-orange-50 border-b border-orange-100 text-right shrink-0">
                    <div class="text-xs font-bold text-orange-700">حقول ${currentColumn.label}</div>
                </div>
                <button type="button" onclick="hideReportsCasesColumn(event, '${activeColumnKey}')" class="w-full flex items-center gap-2 px-3 py-2.5 text-right ${canHideCurrent ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 bg-gray-50 cursor-not-allowed'} transition-colors shrink-0" ${canHideCurrent ? '' : 'disabled'}>
                    <i class="ri-eye-off-line"></i>
                    <span class="text-sm font-semibold">إخفاء ${currentColumn.label}</span>
                </button>
            ` : ''}
            <div class="border-t border-orange-100 shrink-0"></div>
            <div class="overflow-y-auto flex-1 max-h-80">${items}</div>
            <div class="border-t border-orange-100 shrink-0"></div>
            <button type="button" onclick="resetReportsCasesColumns(event)" class="w-full flex items-center gap-2 px-3 py-2.5 text-right text-blue-700 hover:bg-blue-50 transition-colors shrink-0">
                <i class="ri-refresh-line"></i>
                <span class="text-sm font-semibold">إرجاع الافتراضي</span>
            </button>
        </div>
    `;
}

function closeReportsCasesColumnMenus() {
    document.querySelectorAll('[id^="reports-cases-column-menu-"]').forEach(menu => {
        try { menu.classList.add('hidden'); } catch (_) { }
    });
}

function __cleanupDetachedCasesColumnMenus() {
    document.querySelectorAll('body > [id^="reports-cases-column-menu-"]').forEach(menu => {
        try { menu.remove(); } catch (_) { }
    });
}

// إغلاق القائمة تلقائياً عند النقر في أي مكان خارجها
if (!window.__reportsCasesGlobalMenuClickBound) {
    window.__reportsCasesGlobalMenuClickBound = true;
    document.addEventListener('click', function (e) {
        if (!e.target.closest('[id^="reports-cases-column-menu-"]') && !e.target.closest('.reports-cases-column-toggle-btn')) {
            closeReportsCasesColumnMenus();
        }
    });
}

function __renderReportsCasesCurrentTable() {
    const reportContent = document.getElementById('sessions-report-content');
    if (!reportContent) return;
    reportContent.innerHTML = generateSessionsReportHTML(__getReportsCasesSessionsForAction(), currentSessionsSortOrder);
}

function __positionReportsCasesColumnMenu(menu, anchorEl) {
    try {
        if (!menu || !anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return;
        const rect = anchorEl.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;

        // Ensure fixed positioning (avoid clipping in scroll containers).
        menu.style.position = 'fixed';
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
        menu.style.marginTop = '0px';
        menu.style.zIndex = '999999';

        // Measure menu width/height after it becomes visible.
        const menuW = Math.max(220, Math.round(menu.offsetWidth || 0) || 0);

        // Prefer aligning to the right edge of the button (RTL-friendly).
        let left = Math.round(rect.right - menuW);
        let top = Math.round(rect.bottom + 6);

        // Keep inside viewport.
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

function toggleReportsCasesColumnMenu(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById(`reports-cases-column-menu-${columnKey}`);
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeReportsCasesColumnMenus();
    if (!shouldOpen) return;

    // Portal menu to body once to avoid being clipped by overflow containers.
    try {
        if (menu && menu.parentElement && menu.parentElement !== document.body) {
            document.body.appendChild(menu);
        }
    } catch (_) { }

    menu.classList.remove('hidden');
    try {
        const anchorEl = (event && event.currentTarget) ? event.currentTarget : null;
        __positionReportsCasesColumnMenu(menu, anchorEl);
    } catch (_) { }
}

function toggleReportsCasesColumnVisibility(event, columnKey, anchorColumnKey = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsCasesColumnMenus();
    const currentKeys = __getReportsCasesVisibleColumnKeys();
    const currentSet = new Set(currentKeys);
    if (currentSet.has(columnKey) && currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    if (currentSet.has(columnKey)) {
        __setReportsCasesVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
        __renderReportsCasesCurrentTable();
        return;
    }
    const nextKeys = [...currentKeys];
    const anchorIndex = anchorColumnKey ? nextKeys.indexOf(anchorColumnKey) : -1;
    if (anchorIndex !== -1) nextKeys.splice(anchorIndex + 1, 0, columnKey);
    else nextKeys.push(columnKey);
    __setReportsCasesVisibleColumnKeys(nextKeys);
    __renderReportsCasesCurrentTable();
}

function hideReportsCasesColumn(event, columnKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsCasesColumnMenus();
    const currentKeys = __getReportsCasesVisibleColumnKeys();
    if (!currentKeys.includes(columnKey)) return;
    if (currentKeys.length === 1) {
        if (typeof showToast === 'function') showToast('لا يمكن إخفاء كل الأعمدة', 'info');
        return;
    }
    __setReportsCasesVisibleColumnKeys(currentKeys.filter(key => key !== columnKey));
    __renderReportsCasesCurrentTable();
}

function resetReportsCasesColumns(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    closeReportsCasesColumnMenus();
    __setReportsCasesVisibleColumnKeys(__reportsCasesDefaultVisibleColumns);
    __renderReportsCasesCurrentTable();
}

function __buildReportsCasesDocumentTable(sessionsData, relationsData = {}, options = {}) {
    const visibleColumns = __getReportsCasesVisibleColumns();
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
    const headerCellStyle = `background-color: #ea580c; color: white; padding: ${headerPadding}; text-align: center; border: 1px solid #c2410c; font-weight: bold; font-size: ${headerFontSize}; white-space: nowrap; box-sizing: border-box;`;

    const rowsHtml = (Array.isArray(sessionsData) ? sessionsData : []).map((session, index) => {
        const rowData = __getReportsCasesRowData(session, relationsData.caseMap, relationsData.clientNameByCaseId, relationsData.clientByCaseId, relationsData.opponentByCaseId);
        const rowBg = index % 2 === 0 ? '#fff7ed' : '#ffffff';
        const cellsHtml = visibleColumns.map(col => {
            let rawVal = rowData[col.key];
            if (isPdfExport && rawVal) {
                rawVal = String(rawVal).replace(/\s*\/\s*/g, ' - ');
            }
            const value = __escapeReportsCasesHtml(rawVal);

            // تخصيص حجم النص وسلوكه وفقاً لحجم الخلية وطبيعة المحتوى
            let specificCellFontSize = cellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone' || col.key === 'opponentPhone';
            const isNumberCol = col.key === 'fileNumber' || col.key === 'circuitNumber' || col.key === 'roll';
            const isCodeCol = col.key === 'caseNumber' || col.key === 'poaNumber' || col.key === 'inventoryNumber' || col.key === 'inventoryYear' || col.key === 'sessionDate';

            if (isPhoneCol) {
                if (colCount >= 6) {
                    specificCellFontSize = (parseFloat(cellFontSize) * 0.95).toFixed(1) + 'px';
                }
                extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
            } else if (isNumberCol || isCodeCol) {
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'court') {
                extraCellStyle = 'word-break: break-word; line-height: 1.15;';
            } else {
                extraCellStyle = 'word-break: break-word; line-height: 1.2;';
            }

            return `<td style="border: 1px solid #fed7aa; padding: ${cellPadding}; text-align: center; font-size: ${specificCellFontSize}; ${extraCellStyle} box-sizing: border-box; overflow: hidden;">${value}</td>`;
        }).join('');

        return `<tr style="background: ${rowBg};">${cellsHtml}</tr>`;
    }).join('');

    const headerHtml = visibleColumns.map(col => {
        let colW = '';
        if (col.key === 'fileNumber' || col.key === 'circuitNumber' || col.key === 'roll') {
            colW = 'width: 1%; white-space: nowrap;';
        } else if (col.key === 'caseNumber' || col.key === 'poaNumber' || col.key === 'inventoryNumber' || col.key === 'inventoryYear' || col.key === 'sessionDate' || col.key === 'clientPhone' || col.key === 'opponentPhone') {
            colW = 'width: 1%; white-space: nowrap;';
        } else {
            colW = 'white-space: nowrap;';
        }
        return `<th style="${headerCellStyle} ${colW}">${col.label}</th>`;
    }).join('');

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

async function __getReportsCasesRelationsData() {
    const cases = await getAllCasesCached();
    const clients = await (typeof getAllClientsCached === 'function' ? getAllClientsCached() : getAllClients());
    const opponents = await (typeof getAllOpponentsCached === 'function' ? getAllOpponentsCached() : getAllOpponents());
    const caseMap = {};
    const fileMap = {};
    const clientNameByCaseId = {};
    const clientByCaseId = {};
    const opponentByCaseId = {};
    const clientsById = {};
    const opponentsById = {};
    try {
        (clients || []).forEach(client => {
            if (client && client.id != null) clientsById[String(client.id)] = client;
        });
    } catch (_) { }
    try {
        (opponents || []).forEach(opponent => {
            if (opponent && opponent.id != null) opponentsById[String(opponent.id)] = opponent;
        });
    } catch (_) { }
    try {
        (cases || []).forEach(caseItem => {
            if (!caseItem || caseItem.id == null) return;
            const caseIdKey = String(caseItem.id);
            caseMap[caseIdKey] = caseItem;
            fileMap[caseIdKey] = __normalizeReportsCasesCellValue(caseItem.fileNumber, '');
            const clientObj = clientsById[String(caseItem.clientId)] || null;
            const opponentObj = opponentsById[String(caseItem.opponentId)] || null;
            if (clientObj) {
                clientByCaseId[caseIdKey] = clientObj;
                if (clientObj.name) clientNameByCaseId[caseIdKey] = String(clientObj.name);
            }
            if (opponentObj) opponentByCaseId[caseIdKey] = opponentObj;
        });
    } catch (_) { }
    const relationsData = { caseMap, fileMap, clientNameByCaseId, clientByCaseId, opponentByCaseId, clientsById, opponentsById };
    window.sessionsCasesById = caseMap;
    window.sessionsFileNumberByCaseId = fileMap;
    window.sessionsClientNameByCaseId = clientNameByCaseId;
    window.sessionsClientByCaseId = clientByCaseId;
    window.sessionsOpponentByCaseId = opponentByCaseId;
    window.__reportsCasesRelationsData = relationsData;
    return relationsData;
}

function __getReportsCasesSessionsForAction() {
    try {
        if (Array.isArray(__reportsCasesCurrentSessions) && __reportsCasesCurrentSessions.length >= 0) {
            return __reportsCasesCurrentSessions;
        }
    } catch (e) { }
    return Array.isArray(__reportsCasesAllSessions) ? __reportsCasesAllSessions : [];
}

let currentCasesSortField = 'caseNumber';
let currentCasesSortDirection = 'asc';

function __sortReportsCasesSessions(sessions, field = currentCasesSortField, direction = currentCasesSortDirection) {
    const sessionsData = Array.isArray(sessions) ? [...sessions] : [];
    const caseMap = window.sessionsCasesById || {};
    const isAsc = direction === 'asc';

    const getVal = (s) => {
        if (!s) return '';
        const caseObj = caseMap[String(s.caseId)] || {};
        if (field === 'fileNumber') {
            const fn = s.fileNumber != null ? s.fileNumber : caseObj.fileNumber;
            return fn != null ? String(fn).trim() : '';
        }
        if (field === 'inventoryNumber') {
            const invNum = s.inventoryNumber != null ? s.inventoryNumber : '';
            const invYear = s.inventoryYear != null ? s.inventoryYear : '';
            if (invNum && invYear) return `${invNum}/${invYear}`;
            return String(invNum || '').trim();
        }
        if (field === 'court') {
            const court = s.court != null ? s.court : caseObj.court;
            return court != null ? String(court).trim() : '';
        }
        // default: caseNumber
        const cn = s.caseNumber != null ? s.caseNumber : caseObj.caseNumber;
        const cy = s.caseYear != null ? s.caseYear : caseObj.caseYear;
        if (cn && cy) return `${cn}/${cy}`;
        return String(cn || '').trim();
    };

    sessionsData.sort((a, b) => {
        const valA = getVal(a);
        const valB = getVal(b);
        if (!valA && !valB) return 0;
        if (!valA) return 1;
        if (!valB) return -1;
        const res = String(valA).localeCompare(String(valB), 'ar', { numeric: true, sensitivity: 'base' });
        return isAsc ? res : -res;
    });

    return sessionsData;
}

async function __getReportsCasesPreparedActionData() {
    await __getReportsCasesDateLocaleSetting();
    const relationsData = await __getReportsCasesRelationsData();
    const sessionsData = __sortReportsCasesSessions(__getReportsCasesSessionsForAction());
    return { sessionsData, relationsData };
}

async function updateSessionsReportContent(reportName, reportType) {
    const reportContent = document.getElementById('report-content');

    try {

        await __getReportsCasesDateLocaleSetting();

        const sessions = await getAllSessionsCached();
        __reportsCasesAllSessions = Array.isArray(sessions) ? sessions : [];
        __reportsCasesCurrentSessions = __reportsCasesAllSessions;
        await __getReportsCasesRelationsData();

        const colors = { bg: '#f97316', bgHover: '#ea580c', bgLight: '#fff7ed', text: '#ea580c', textLight: '#fdba74' };

        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <!-- أدوات التقرير -->
                <div class="flex flex-wrap gap-2 mb-2 md:items-center">
                    <!-- مربع البحث -->
                    <div class="relative w-full md:flex-1">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="ri-search-line text-gray-400"></i>
                        </div>
                        <input type="text" id="sessions-search" class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all" placeholder="البحث في ${reportName}..." onfocus="this.style.boxShadow='0 0 0 2px ${colors.bg}40'" onblur="this.style.boxShadow='none'">
                    </div>
                    <div class="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                        <div class="relative">
                            <button id="cases-view-menu-btn" onclick="toggleCasesViewMenu()" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                                <i class="ri-filter-3-line"></i>
                                <span data-cases-view-label>فرز</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="cases-view-menu" class="hidden absolute right-0 mt-1 rounded-xl shadow-2xl z-50 p-2.5" style="min-width: 250px; width: 260px; max-width: 90vw; box-sizing: border-box; background-color: #e2e8f0; border: 1px solid #94a3b8;">
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">ترتيب القضايا</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 6px;">
                                    <button type="button" data-field-mode="caseNumber" onclick="setCasesSortField('caseNumber')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">رقم القضية</button>
                                    <button type="button" data-field-mode="fileNumber" onclick="setCasesSortField('fileNumber')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">رقم الملف</button>
                                    <button type="button" data-field-mode="inventoryNumber" onclick="setCasesSortField('inventoryNumber')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">رقم الحصر</button>
                                    <button type="button" data-field-mode="court" onclick="setCasesSortField('court')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">المحكمة</button>
                                </div>
                                <div style="border-top: 1px solid #cbd5e1; margin: 6px 0;"></div>
                                <div class="text-[11px] font-bold text-slate-700 mb-1.5 text-right px-0.5">الاتجاه</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button type="button" data-direction-mode="asc" onclick="setCasesSortDirection('asc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">تصاعدي</button>
                                    <button type="button" data-direction-mode="desc" onclick="setCasesSortDirection('desc')" class="py-1.5 px-2 text-center rounded-lg border text-xs transition-colors shadow-sm" style="border: 1px solid #cbd5e1; white-space: nowrap; background-color: #ffffff;">تنازلي</button>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                            <button onclick="toggleExportMenuCases()" id="export-btn-cases" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <i class="ri-download-line"></i>
                                <span>تصدير</span>
                                <i class="ri-arrow-down-s-line text-sm"></i>
                            </button>
                            <div id="export-menu-cases" class="reports-export-dropdown hidden absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                                <button onclick="exportSessionsReportExcel()" class="export-menu-item-excel w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-gray-700">
                                    <span>Excel</span>
                                    <i class="ri-file-excel-line text-green-600"></i>
                                </button>
                                <button onclick="exportSessionsReportPDF()" class="export-menu-item-pdf w-full text-right px-4 py-2 hover:bg-gray-100 ${typeof isElectronApp === 'function' && isElectronApp() ? 'rounded-b-lg' : ''} flex items-center gap-2 text-gray-700">
                                    <span>PDF</span>
                                    <i class="ri-file-pdf-line text-red-600"></i>
                                </button>
                                ${typeof isElectronApp !== 'function' || !isElectronApp() ? `<button onclick="exportSessionsReportWhatsApp()" class="export-menu-item-whatsapp w-full text-right px-4 py-2 bg-green-50 hover:bg-green-100 rounded-b-lg flex items-center gap-2 text-gray-800 border border-green-200"><span>واتساب</span><i class="ri-whatsapp-line text-green-600"></i></button>` : ''}
                            </div>
                        </div>
                        <button onclick="printSessionsReport()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="ri-printer-line"></i>
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
                
                <!-- محتوى التقرير -->
                <div class="bg-white rounded-lg border border-gray-200 p-0 relative flex-1 min-h-0 flex flex-col overflow-hidden" id="sessions-report-content">
                    <div class="flex items-center justify-center py-12 text-gray-400">
                        <i class="ri-loader-4-line animate-spin text-3xl ml-2"></i>
                        <span>جاري إعداد تقرير القضايا...</span>
                    </div>
                </div>
            </div>
        `;

        __reportsCasesTimeFilterMode = 'all';
        __reportsCasesSearchTerm = '';
        currentCasesSortField = 'caseNumber';
        currentCasesSortDirection = 'asc';
        currentSessionsSortOrder = 'asc';
        __reportsCasesCurrentSessions = __sortReportsCasesSessions(__reportsCasesAllSessions, currentCasesSortField, currentCasesSortDirection);
        __reportsCasesUpdateViewMenuButtonLabel();
        __renderReportsCasesCurrentTable();

        const __searchEl = document.getElementById('sessions-search');
        if (__searchEl) {
            let __debounceT;
            __searchEl.addEventListener('input', function (e) {
                const v = e.target.value;
                clearTimeout(__debounceT);
                __debounceT = setTimeout(() => filterSessionsReport(v), 150);
            });
        }

    } catch (error) {
        console.error('Error loading sessions data:', error);
        reportContent.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-y-auto">
                    <div class="text-center text-red-500 py-12">
                        <i class="ri-error-warning-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">خطأ في تحميل البيانات</h3>
                        <p class="text-gray-400">حدث خطأ أثناء تحميل بيانات القضايا</p>
                    </div>
                </div>
            </div>
        `;
    }
}


let __reportsCasesChunkTimer = null;

function generateSessionsReportHTML(sessions, sortOrder = 'desc') {
    __cleanupDetachedCasesColumnMenus();
    if (__reportsCasesChunkTimer) {
        cancelAnimationFrame(__reportsCasesChunkTimer);
        __reportsCasesChunkTimer = null;
    }
    if (!sessions || sessions.length === 0) {
        return `
            <div class="text-center text-gray-500 py-16">
                <div class="mb-6">
                    <i class="ri-calendar-event-line text-8xl text-orange-200"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-gray-700">لا توجد بيانات</h3>
                <p class="text-gray-400 text-lg">لم يتم العثور على بيانات القضايا</p>
            </div>
        `;
    }

    const visibleColumns = __getReportsCasesVisibleColumns();
    const totalTableMinWidth = visibleColumns.reduce((sum, col) => sum + (parseInt(col.minWidth || '130', 10)), 0);
    let sessionsData = [...sessions];
    sessionsData.sort((a, b) => {
        const dateA = new Date(a.sessionDate || a.createdAt || a.id);
        const dateB = new Date(b.sessionDate || b.createdAt || b.id);

        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    const buildRowHtml = (session, i) => {
        const rowClass = i % 2 === 0 ? 'bg-gradient-to-l from-orange-50 to-amber-50' : 'bg-white';
        const rowData = __getReportsCasesRowData(session);
        const cellsHtml = visibleColumns.map(col => {
            const value = __escapeReportsCasesHtml(rowData[col.key]);
            return `
                <td class="py-2 px-3 md:py-4 md:px-6 text-center border-l border-gray-200 align-top" style="min-width: ${col.minWidth || '120px'};">
                    <div class="font-bold text-sm md:text-base text-gray-800 hover:text-orange-700 transition-colors duration-200 ${col.cellClass}" title="${value}">${value}</div>
                </td>
            `;
        }).join('');
        return `
            <tr class="report-record ${rowClass} border-b border-gray-200 hover:bg-gradient-to-l hover:from-orange-100 hover:to-amber-100 transition-all duration-300 hover:shadow-sm">
                ${cellsHtml}
            </tr>
        `;
    };

    const initialBatchSize = 100;
    const initialRows = sessionsData.slice(0, initialBatchSize).map((s, i) => buildRowHtml(s, i)).join('');

    const headerHtml = visibleColumns.map(col => `
        <th style="position: sticky; top: 0; z-index: 20; min-width: ${col.minWidth || '120px'}; background-color: #ea580c !important; color: white !important; border-color: #f97316 !important; white-space: nowrap; padding: 0.5rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; border-left: 2px solid #f97316;">
            <div class="relative flex items-center justify-center">
                <button type="button" onclick="toggleReportsCasesColumnMenu(event, '${col.key}')" class="reports-cases-column-toggle-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold" style="min-height: 36px;">
                    <i class="${col.icon} text-sm"></i>
                    <span>${col.label}</span>
                    <i class="ri-arrow-down-s-line text-sm opacity-90"></i>
                </button>
                ${__buildReportsCasesColumnMenuHTML(col.key)}
            </div>
        </th>
    `).join('');

    if (sessionsData.length > initialBatchSize) {
        let currentIndex = initialBatchSize;
        const appendNextChunk = () => {
            const tbody = document.getElementById('sessions-table-body');
            if (!tbody) return;
            const end = Math.min(currentIndex + 100, sessionsData.length);
            let chunkHtml = '';
            for (let i = currentIndex; i < end; i++) {
                chunkHtml += buildRowHtml(sessionsData[i], i);
            }
            tbody.insertAdjacentHTML('beforeend', chunkHtml);
            currentIndex = end;
            if (currentIndex < sessionsData.length) {
                __reportsCasesChunkTimer = requestAnimationFrame(appendNextChunk);
            } else {
                __reportsCasesChunkTimer = null;
            }
        };
        __reportsCasesChunkTimer = requestAnimationFrame(appendNextChunk);
    }

    return `
        <div class="sessions-report-container flex-1 min-h-0 flex flex-col" style="height: 100%; position: relative;">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 flex-1 min-h-0 overflow-auto" style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior: contain;">
                <table class="w-full border-separate" style="border-spacing: 0; min-width: ${Math.max(totalTableMinWidth, 600)}px;">
                    <thead style="position: sticky; top: 0; z-index: 20;">
                        <tr class="text-white shadow-lg" style="background-color: #ea580c !important;">
                            ${headerHtml}
                        </tr>
                    </thead>
                    <tbody id="sessions-table-body">
                        ${initialRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


let currentSessionsSortOrder = 'desc';

function __reportsCasesGetViewModeLabel() {
    if (__reportsCasesTimeFilterMode === 'today') return 'اليوم';
    if (__reportsCasesTimeFilterMode === 'week') return 'الاسبوع';
    if (__reportsCasesTimeFilterMode === 'month') return 'الشهر';
    return 'الكل';
}

function __reportsCasesGetSortLabel() {
    return currentSessionsSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';
}

function __reportsCasesUpdateViewMenuButtonLabel() {
    try {
        const btn = document.getElementById('cases-view-menu-btn');
        if (!btn) return;
        const textEl = btn.querySelector('[data-cases-view-label]');
        if (!textEl) return;
        textEl.textContent = 'فرز';
    } catch (_) { }
}

function __reportsCasesIsSameDay(a, b) {
    try {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    } catch (_) {
        return false;
    }
}

function __reportsCasesIsInTimeFilter(session) {
    if (__reportsCasesTimeFilterMode === 'all') return true;
    const d = __parseReportsCasesDateString(session && session.sessionDate);
    if (!d) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sd = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (__reportsCasesTimeFilterMode === 'today') {
        return __reportsCasesIsSameDay(sd, today);
    }

    if (__reportsCasesTimeFilterMode === 'month') {
        return sd.getFullYear() === today.getFullYear() && sd.getMonth() === today.getMonth();
    }

    if (__reportsCasesTimeFilterMode === 'week') {
        // آخر 7 أيام (اليوم + 6 أيام قبلها) لتفادي اختلاف بداية الأسبوع.
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return sd >= start && sd <= today;
    }

    return true;
}

function __reportsCasesDedupLatestSessionByCaseId(sessions) {
    const list = Array.isArray(sessions) ? sessions : [];
    const byCaseId = new Map();
    const score = (s) => {
        try {
            const d = __parseReportsCasesDateString(s && s.sessionDate);
            const t = d ? d.getTime() : 0;
            const created = new Date((s && (s.createdAt || s.id)) || 0).getTime() || 0;
            return t * 10000000 + created;
        } catch (_) {
            return 0;
        }
    };

    for (const s of list) {
        const caseIdKey = String(s && s.caseId != null ? s.caseId : '').trim();
        if (!caseIdKey) continue;
        const prev = byCaseId.get(caseIdKey);
        if (!prev || score(s) >= score(prev)) byCaseId.set(caseIdKey, s);
    }

    return Array.from(byCaseId.values());
}

function __reportsCasesNormalizeSearchValue(value) {
    const s = window.normalizeDigits ? window.normalizeDigits(value) : String(value || '');
    return s
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ')
        .trim();
}

function __reportsCasesApplyViewModeAndRender() {
    try {
        const base = Array.isArray(__reportsCasesAllSessions) ? __reportsCasesAllSessions : [];
        const searchLower = __reportsCasesNormalizeSearchValue(__reportsCasesSearchTerm);
        const visibleColumns = __getReportsCasesVisibleColumns();
        const visibleKeys = visibleColumns.map(col => col.key);
        const finalList = !searchLower ? base : base.filter(session => {
            const rowData = __getReportsCasesRowData(session);
            return visibleKeys.some(key => __reportsCasesNormalizeSearchValue(rowData[key]).includes(searchLower));
        });

        __reportsCasesCurrentSessions = __sortReportsCasesSessions(finalList, currentCasesSortField, currentCasesSortDirection);
        __reportsCasesUpdateViewMenuButtonLabel();
        __renderReportsCasesCurrentTable();
    } catch (_) { }
}

function __reportsCasesUpdateActiveTiles() {
    try {
        const fieldButtons = document.querySelectorAll('#cases-view-menu [data-field-mode]');
        fieldButtons.forEach(btn => {
            const mode = btn.getAttribute('data-field-mode');
            if (mode === currentCasesSortField) {
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

        const dirButtons = document.querySelectorAll('#cases-view-menu [data-direction-mode]');
        dirButtons.forEach(btn => {
            const mode = btn.getAttribute('data-direction-mode');
            if (mode === currentCasesSortDirection) {
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

function toggleCasesViewMenu() {
    try {
        const menu = document.getElementById('cases-view-menu');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            __reportsCasesUpdateActiveTiles();
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    } catch (_) { }
}

function setCasesSortField(field) {
    currentCasesSortField = field || 'caseNumber';
    __reportsCasesUpdateActiveTiles();
    __reportsCasesApplyViewModeAndRender();
    const menu = document.getElementById('cases-view-menu');
    if (menu) menu.classList.add('hidden');
}

function setCasesSortDirection(direction) {
    currentCasesSortDirection = direction || 'asc';
    currentSessionsSortOrder = direction || 'asc';
    __reportsCasesUpdateActiveTiles();
    __reportsCasesApplyViewModeAndRender();
    const menu = document.getElementById('cases-view-menu');
    if (menu) menu.classList.add('hidden');
}

function setCasesSortOrder(mode) {
    setCasesSortDirection(mode);
}


async function toggleSessionsSort() {
    try {

        currentSessionsSortOrder = currentSessionsSortOrder === 'desc' ? 'asc' : 'desc';


        const sessions = __getReportsCasesSessionsForAction();


        const sortButton = document.querySelector('button[onclick="toggleSessionsSort()"]');
        const icon = sortButton.querySelector('i');
        const text = sortButton.querySelector('span');

        icon.className = currentSessionsSortOrder === 'desc' ? 'ri-time-line' : 'ri-history-line';
        text.textContent = currentSessionsSortOrder === 'desc' ? 'الأحدث' : 'الأقدم';


        const reportContent = document.getElementById('sessions-report-content');
        reportContent.innerHTML = generateSessionsReportHTML(sessions, currentSessionsSortOrder);

    } catch (error) {
        console.error('Error sorting sessions report:', error);
        showToast('حدث خطأ أثناء فرز التقرير', 'error');
    }
}


function filterSessionsReport(searchTerm) {
    __reportsCasesSearchTerm = String(searchTerm || '');
    __reportsCasesApplyViewModeAndRender();
}


async function printSessionsReport() {
    try {
        const { sessionsData, relationsData } = await __getReportsCasesPreparedActionData();
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const printHTML = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 6px 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 15px;">
                    <div style="color: #1e40af; font-size: 14px; font-weight: bold; text-align: right;">تقرير القضايا</div>
                    <div style="color: #666; font-size: 14px; text-align: center;">${new Date().toLocaleDateString(__reportsCasesDateLocaleCache || 'ar-EG')} | ${new Date().toLocaleTimeString(__reportsCasesDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style="color: #666; font-size: 14px; text-align: left;">${officeName}</div>
                </div>
                ${__buildReportsCasesDocumentTable(sessionsData, relationsData, { headerFontSize: '13px', cellFontSize: '12px', headerPadding: '6px 6px', cellPadding: '6px 6px' })}
            </div>
        `;

        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>تقرير القضايا - ${new Date().toLocaleDateString(__reportsCasesDateLocaleCache || 'ar-EG')}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 8mm;
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


async function exportSessionsReport() {
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
                toggleExportMenuCases();
                return;
            }
        }

        const { sessionsData, relationsData } = await __getReportsCasesPreparedActionData();

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
                                <x:Name>القضايا</x:Name>
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
                ${__buildReportsCasesDocumentTable(sessionsData, relationsData, { headerFontSize: '21px', cellFontSize: '18px', headerPadding: '10px', cellPadding: '8px', tableStyle: 'border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; font-size: 18px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;' })}
            </body>
            </html>
        `;


        const blob = new Blob([excelContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_القضايا_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('تم تصدير التقرير بنجاح', 'success');
        toggleExportMenuCases();

    } catch (error) {
        console.error('Error exporting sessions report:', error);
        showToast('حدث خطأ أثناء تصدير التقرير', 'error');
    }
}


// -------------------------------------------------------------
// بناء صفحات PDF ديناميكية ذكية ومقاسة لمنع قص الصفوف (Smart Dynamic PDF Pagination)
// -------------------------------------------------------------
async function __buildReportsCasesPdfPagesHTML(sessionsData, relationsData = {}, officeName = 'المحامى الرقمى', opt = {}) {
    const visibleColumns = __getReportsCasesVisibleColumns();
    const colCount = visibleColumns.length;

    // مقاس الخط والحواشي للـ PDF وفقاً لعدد الأعمدة الظاهرة
    let headerFontSize = '9.5px';
    let cellFontSize = '8.5px';
    let headerPadding = '5px 4px';
    let cellPadding = '4px 3px';

    if (colCount >= 7) {
        headerFontSize = '7.5px';
        cellFontSize = '7px';
        headerPadding = '4px 2px';
        cellPadding = '3px 2px';
    } else if (colCount === 6) {
        headerFontSize = '8.5px';
        cellFontSize = '8px';
        headerPadding = '4px 3px';
        cellPadding = '4px 3px';
    }

    const tableStyle = 'width: 100%; border-collapse: collapse; margin-top: 6px; direction: rtl; table-layout: auto; box-sizing: border-box;';
    const headerCellStyle = `background-color: #ea580c; color: white; padding: ${headerPadding}; text-align: center; border: 1px solid #c2410c; font-weight: bold; font-size: ${headerFontSize}; white-space: nowrap; box-sizing: border-box;`;

    const headerThs = visibleColumns.map(col => {
        let colW = '';
        if (col.key === 'fileNumber' || col.key === 'circuitNumber' || col.key === 'roll') {
            colW = 'width: 1%; white-space: nowrap;';
        } else if (col.key === 'caseNumber' || col.key === 'poaNumber' || col.key === 'inventoryNumber' || col.key === 'inventoryYear' || col.key === 'sessionDate' || col.key === 'clientPhone' || col.key === 'opponentPhone') {
            colW = 'width: 1%; white-space: nowrap;';
        } else {
            colW = 'white-space: nowrap;';
        }
        return `<th style="${headerCellStyle} ${colW}">${col.label}</th>`;
    }).join('');

    const headerHtml = `<thead><tr>${headerThs}</tr></thead>`;

    // بناء كود HTML لكل صف على حدة
    const allRowsHtml = (Array.isArray(sessionsData) ? sessionsData : []).map((session, index) => {
        const rowData = __getReportsCasesRowData(session, relationsData.caseMap, relationsData.clientNameByCaseId, relationsData.clientByCaseId, relationsData.opponentByCaseId);
        const rowBg = index % 2 === 0 ? '#fff7ed' : '#ffffff';
        const cellsHtml = visibleColumns.map(col => {
            let rawVal = rowData[col.key];
            if (rawVal) {
                rawVal = String(rawVal).replace(/\s*\/\s*/g, ' - ');
            }
            const value = __escapeReportsCasesHtml(rawVal);

            let specificCellFontSize = cellFontSize;
            let extraCellStyle = '';

            const isPhoneCol = col.key === 'clientPhone' || col.key === 'opponentPhone';
            const isNumberCol = col.key === 'fileNumber' || col.key === 'circuitNumber' || col.key === 'roll';
            const isCodeCol = col.key === 'caseNumber' || col.key === 'poaNumber' || col.key === 'inventoryNumber' || col.key === 'inventoryYear' || col.key === 'sessionDate';

            if (isPhoneCol) {
                if (colCount >= 6) {
                    specificCellFontSize = (parseFloat(cellFontSize) * 0.95).toFixed(1) + 'px';
                }
                extraCellStyle = 'white-space: nowrap; direction: ltr; unicode-bidi: embed; letter-spacing: -0.3px;';
            } else if (isNumberCol || isCodeCol) {
                extraCellStyle = 'white-space: nowrap;';
            } else if (col.key === 'court') {
                extraCellStyle = 'word-break: break-word; line-height: 1.15;';
            } else {
                extraCellStyle = 'word-break: break-word; line-height: 1.2;';
            }

            return `<td style="border: 1px solid #fed7aa; padding: ${cellPadding}; text-align: center; font-size: ${specificCellFontSize}; ${extraCellStyle} box-sizing: border-box; overflow: hidden;">${value}</td>`;
        }).join('');

        return `<tr style="background: ${rowBg};">${cellsHtml}</tr>`;
    });

    if (allRowsHtml.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = `<div style="text-align: center; padding: 20px;">لا توجد بيانات</div>`;
        const worker = html2pdf().set(opt).from(emptyDiv);
        await worker.toPdf();
        return await worker.get('pdf');
    }

    // عدد الصفوف المتوازن والممتلئ في كل صفحة A4 (16 صفاً يملأ الصفحة بشكل ممتاز وآمن تماماً)
    const ROWS_PER_PAGE = 16;
    const pages = [];
    for (let i = 0; i < allRowsHtml.length; i += ROWS_PER_PAGE) {
        pages.push(allRowsHtml.slice(i, i + ROWS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString(__reportsCasesDateLocaleCache || 'ar-EG');
    const currentTime = new Date().toLocaleTimeString(__reportsCasesDateLocaleCache || 'ar-EG', { hour: '2-digit', minute: '2-digit' });
    const totalPages = pages.length;

    // بناء حاويات صفحات منفصلة لكل صفحة A4 برأسها المستقل الكامل في القمة
    const pageElements = pages.map((pageRows, pageIdx) => {
        const div = document.createElement('div');
        div.style.direction = 'rtl';
        div.style.boxSizing = 'border-box';
        div.style.padding = '4px 6px';
        div.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

        const pageNumberLabel = totalPages > 1 ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; margin-right: 6px;">${pageIdx + 1}</span>` : '';

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
                <div style="color: #1e40af; font-size: 10px; font-weight: bold; text-align: right;">
                    تقرير القضايا ${pageNumberLabel}
                </div>
                <div style="color: #666; font-size: 7px; text-align: center;">${currentDate} | ${currentTime}</div>
                <div style="color: #666; font-size: 7px; text-align: left;">${officeName}</div>
            </div>
            <table style="${tableStyle}">
                ${headerHtml}
                <tbody>
                    ${pageRows.join('')}
                </tbody>
            </table>
        `;
        return div;
    });

    // توليد PDF متعدد الصفحات نظيف تماماً: كل صفحة A4 ترسم كـ Canvas مستقل دون تقطيع أو صفحات فارغة
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

async function exportSessionsReportPDF() {
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
                toggleExportMenuCases();
                return;
            }
        }

        const { sessionsData, relationsData } = await __getReportsCasesPreparedActionData();
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const isMobile = typeof isElectronApp === 'function' ? !isElectronApp() : true;
        const html2canvasOpt = { scale: 2, letterRendering: true, imageTimeout: 0 };
        if (isMobile) {
            html2canvasOpt.windowWidth = 1200;
        }

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_القضايا_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: html2canvasOpt,
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء ملف PDF...', 'info');
        const pdf = await __buildReportsCasesPdfPagesHTML(sessionsData, relationsData, officeName, opt);
        pdf.save(opt.filename);
        showToast('تم تصدير PDF بنجاح', 'success');
        toggleExportMenuCases();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('حدث خطأ أثناء تصدير PDF', 'error');
    }
}

async function exportSessionsReportWhatsApp() {
    try {
        const { sessionsData, relationsData } = await __getReportsCasesPreparedActionData();
        let officeName = await (typeof getReportsOfficeName === 'function' ? getReportsOfficeName() : Promise.resolve('المحامى الرقمى'));

        const isMobile = typeof isElectronApp === 'function' ? !isElectronApp() : true;
        const html2canvasOpt = { scale: 2, letterRendering: true, imageTimeout: 0 };
        if (isMobile) {
            html2canvasOpt.windowWidth = 1200;
        }

        const opt = {
            margin: [8, 5, 8, 5],
            filename: `تقرير_القضايا_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: html2canvasOpt,
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('جاري إنشاء التقرير للمشاركة...', 'info');
        toggleExportMenuCases();
        const pdf = await __buildReportsCasesPdfPagesHTML(sessionsData, relationsData, officeName, opt);
        const blob = pdf.output('blob');
        if (typeof shareReportPdfAsFile === 'function') await shareReportPdfAsFile(blob, opt.filename);
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = opt.filename; a.click(); URL.revokeObjectURL(a.href); window.open('https://wa.me/?text=' + encodeURIComponent('تقرير PDF مرفق'), '_blank'); showToast('تم تحميل التقرير. يمكنك إرفاقه في واتساب.', 'success'); }
    } catch (error) {
        console.error('Error exporting report to WhatsApp:', error);
        showToast('حدث خطأ أثناء إعداد التقرير للمشاركة', 'error');
    }
}

async function exportSessionsReportExcel() {
    return await exportSessionsReport();
}


async function toggleExportMenuCases() {
    const openMenu = () => {
        const menu = document.getElementById('export-menu-cases');
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
    const menu = document.getElementById('export-menu-cases');
    const button = document.getElementById('export-btn-cases');
    const viewMenu = document.getElementById('cases-view-menu');
    const viewBtn = document.getElementById('cases-view-menu-btn');
    const target = event.target;
    const clickedInsideColumnMenu = target && typeof target.closest === 'function' ? target.closest('[id^="reports-cases-column-menu-"]') : null;
    const clickedColumnToggle = target && typeof target.closest === 'function' ? target.closest('.reports-cases-column-toggle-btn') : null;
    const clickedInsideViewMenu = target && typeof target.closest === 'function' ? target.closest('#cases-view-menu') : null;

    if (menu && button && !menu.contains(target) && !button.contains(target)) {
        menu.classList.add('hidden');
    }

    if (viewMenu && viewBtn && !clickedInsideViewMenu && !viewBtn.contains(target)) {
        viewMenu.classList.add('hidden');
    }

    if (!clickedInsideColumnMenu && !clickedColumnToggle) {
        closeReportsCasesColumnMenus();
    }
});
