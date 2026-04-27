let __clientViewOpponentCapacityById = new Map();
let __clientViewCurrentClientId = null;
let __clientViewClientCapacities = [];
let __clientViewClientCapacityIndex = 0;
let __clientViewClientCapacityCaseByValue = new Map();
let __clientViewOpponentCaseById = new Map();
let __clientViewSelectedCase = null;
let __clientViewCasesSorted = [];
let __clientViewSelectedCaseIndex = 0;

function clientViewNormalizeStatus(value) {
    const s = (value || '').replace(/\uFFFD/g, '').trim();
    if (s === 'متهية') return 'منتهية';
    return s;
}

async function __clientViewRenderSelectedCaseParties(selectedCase) {
    try {
        const clientCapEl = document.getElementById('client-capacity-value');
        if (clientCapEl) clientCapEl.textContent = (selectedCase && selectedCase.clientCapacity) ? String(selectedCase.clientCapacity) : 'فارغ';

        const oppNameEl = document.getElementById('opponent-name-value');
        const oppCapEl = document.getElementById('opponent-capacity-value');
        const oppAddrEl = document.getElementById('opponent-address-value');
        const oppPhoneEl = document.getElementById('opponent-phone-value');

        if (!selectedCase || selectedCase.opponentId == null) {
            if (oppNameEl) oppNameEl.textContent = 'فارغ';
            if (oppCapEl) oppCapEl.textContent = 'فارغ';
            if (oppAddrEl) oppAddrEl.textContent = 'فارغ';
            if (oppPhoneEl) oppPhoneEl.textContent = 'فارغ';
            return;
        }

        const opp = await getById('opponents', selectedCase.opponentId);
        if (oppNameEl) oppNameEl.textContent = (opp && opp.name) ? opp.name : 'فارغ';
        if (oppCapEl) oppCapEl.textContent = (selectedCase && selectedCase.opponentCapacity) ? String(selectedCase.opponentCapacity) : 'فارغ';
        if (oppAddrEl) oppAddrEl.textContent = (opp && opp.address) ? opp.address : 'فارغ';
        if (oppPhoneEl) oppPhoneEl.textContent = (opp && opp.phone) ? opp.phone : 'فارغ';
    } catch (_) { }
}

async function __clientViewSelectCaseByIndex(index) {
    const casesArr = Array.isArray(__clientViewCasesSorted) ? __clientViewCasesSorted : [];
    if (casesArr.length === 0) return;
    const safeIndex = ((index % casesArr.length) + casesArr.length) % casesArr.length;
    __clientViewSelectedCaseIndex = safeIndex;
    const cs = casesArr[safeIndex] || null;
    __clientViewSelectedCase = cs;

    try {
        const idxEl = document.getElementById('current-case-index');
        if (idxEl) idxEl.textContent = String(safeIndex + 1);
    } catch (_) { }

    try {
        if (__clientViewSelectedCase && __clientViewSelectedCase.id != null) {
            highlightCaseCard(String(__clientViewSelectedCase.id));
            stateManager.currentCaseId = parseInt(__clientViewSelectedCase.id);
        }
    } catch (_) { }

    await __clientViewRenderSelectedCaseParties(cs);
}

async function __clientViewShowOnlyCaseCard(caseId) {
    try {
        const idStr = String(caseId || '').trim();
        if (!idStr) return;

        try { showAllCases(); } catch (_) { }

        const caseDetails = document.querySelector(`.case-details[data-case-id="${idStr}"]`);
        const arrow = document.querySelector(`.case-arrow[data-case-id="${idStr}"]`);

        if (!caseDetails) return;

        // Close all first
        document.querySelectorAll('.case-details').forEach(detail => {
            detail.classList.add('hidden');
        });
        document.querySelectorAll('.case-arrow').forEach(arr => {
            try { arr.style.transform = 'rotate(0deg)'; } catch (_) { }
        });

        // Show only this card
        try { hideOtherCases(idStr); } catch (_) { }

        // Open details
        try { expandModalForCaseDetails(); } catch (_) { }
        caseDetails.classList.remove('hidden');
        if (arrow) arrow.style.transform = 'rotate(180deg)';

        // Ensure sessions list reflects the opened case
        let locale = 'ar-EG';
        try {
            if (typeof getSetting === 'function') {
                const v = await getSetting('dateLocale');
                if (v === 'ar-EG' || v === 'en-GB') locale = v;
            }
        } catch (_) { }
        try { await loadCaseSessions(idStr, locale); } catch (_) { }
    } catch (_) { }
}

async function displayClientViewForm(clientId) {
    try {
        const client = await getById('clients', clientId);
        if (!client) {
            showToast('لم يتم العثور على بيانات الموكل', 'error');
            return;
        }

        const cases = await getFromIndex('cases', 'clientId', clientId);
        const sortedCases = Array.isArray(cases) ? cases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
        const latestCase = sortedCases[0] || null;


        const pageHeaderTitle = document.getElementById('page-title');
        if (pageHeaderTitle) pageHeaderTitle.textContent = 'تفاصيل الموكل';
        const modalTitleEl = document.getElementById('modal-title');
        if (modalTitleEl) modalTitleEl.textContent = '';
        const modalContent = document.getElementById('modal-content');
        modalContent.classList.remove('search-modal-content');

        const clientCapacities = [];
        let restoredCapIndex = 0;
        let restoredCase = null;
        let restoredOpponentId = null;
        let restoredSelectedCaseIndex = null;
        try {
            const restoredClientId = parseInt(sessionStorage.getItem('clientViewSelectedClientId') || '0', 10);
            if (restoredClientId && restoredClientId === clientId) {
                const restoredCaseId = parseInt(sessionStorage.getItem('clientViewSelectedCaseId') || '0', 10);
                restoredOpponentId = parseInt(sessionStorage.getItem('clientViewSelectedOpponentId') || '0', 10);
                const restoredCapValue = String(sessionStorage.getItem('clientViewSelectedCapacityValue') || '').trim();
                const restoredCapIndexRaw = parseInt(sessionStorage.getItem('clientViewSelectedCapacityIndex') || '0', 10);
                const restoredCaseIndexRaw = parseInt(sessionStorage.getItem('clientViewSelectedCaseIndex') || '0', 10);
                const casesArr = Array.isArray(cases) ? cases : [];
                if (restoredCaseId) restoredCase = casesArr.find(c => c && c.id === restoredCaseId) || null;
                if (restoredCapValue) {
                    sessionStorage.setItem('clientViewSelectedCapacityValue', restoredCapValue);
                }
                if (Number.isFinite(restoredCapIndexRaw) && restoredCapIndexRaw >= 0) {
                    restoredCapIndex = restoredCapIndexRaw;
                }
                if (Number.isFinite(restoredCaseIndexRaw) && restoredCaseIndexRaw >= 0) {
                    restoredSelectedCaseIndex = restoredCaseIndexRaw;
                }
            }
        } catch (_) { }
        try {
            const sortedCases = Array.isArray(cases) ? cases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
            const seenCaps = new Set();
            for (const cs of sortedCases) {
                if (!cs) continue;
                const v = String(cs.clientCapacity || '').trim();
                if (v && !seenCaps.has(v)) {
                    seenCaps.add(v);
                    clientCapacities.push(v);
                }
            }
        } catch (_) { }
        __clientViewClientCapacities = clientCapacities;
        __clientViewClientCapacityIndex = 0;

        const clientCapacityCaseByValue = new Map();
        try {
            const sortedCases = Array.isArray(cases) ? cases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
            for (const cs of sortedCases) {
                if (!cs) continue;
                const v = String(cs.clientCapacity || '').trim();
                if (v && !clientCapacityCaseByValue.has(v)) {
                    clientCapacityCaseByValue.set(v, cs);
                }
            }
        } catch (_) { }
        __clientViewClientCapacityCaseByValue = clientCapacityCaseByValue;

        if (restoredCase && restoredCase.clientCapacity) {
            const cap = String(restoredCase.clientCapacity || '').trim();
            const idx = cap ? clientCapacities.indexOf(cap) : -1;
            if (idx >= 0) __clientViewClientCapacityIndex = idx;
        } else {
            if (clientCapacities.length > 0) {
                if (restoredCapIndex >= 0 && restoredCapIndex < clientCapacities.length) {
                    __clientViewClientCapacityIndex = restoredCapIndex;
                }
            }
        }

        const selectedClientCap = (clientCapacities.length > 0 && __clientViewClientCapacityIndex >= 0 && __clientViewClientCapacityIndex < clientCapacities.length)
            ? clientCapacities[__clientViewClientCapacityIndex]
            : '';
        const capMatchedCase = selectedClientCap ? (clientCapacityCaseByValue.get(selectedClientCap) || null) : null;
        const defaultCase = (latestCase && capMatchedCase && latestCase.id > capMatchedCase.id) ? latestCase : (capMatchedCase || latestCase || null);
        __clientViewSelectedCase = restoredCase || defaultCase;
        if (!restoredCase && __clientViewSelectedCase && __clientViewSelectedCase.clientCapacity) {
            const _cap = String(__clientViewSelectedCase.clientCapacity || '').trim();
            const _idx = _cap ? clientCapacities.indexOf(_cap) : -1;
            if (_idx >= 0) __clientViewClientCapacityIndex = _idx;
        }
        try {
            if (typeof window !== 'undefined') {
                window.__clientViewClientCapacities = clientCapacities;
                window.__clientViewClientCapacityIndex = __clientViewClientCapacityIndex;
                window.__clientViewClientCapacityCaseByValue = clientCapacityCaseByValue;
            }
        } catch (_) { }

        const clientCapacityText = (__clientViewSelectedCase && __clientViewSelectedCase.clientCapacity)
            ? String(__clientViewSelectedCase.clientCapacity)
            : (selectedClientCap || 'فارغ');


        const caseOpponentIds = [...new Set(cases.map(c => c.opponentId).filter(id => id))];


        let tempOpponentIds = [];
        const clientOpponentRelations = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}');
        if (clientOpponentRelations[clientId]) {
            tempOpponentIds = clientOpponentRelations[clientId];
        }


        const uniqueOpponentIds = [...new Set([...caseOpponentIds, ...tempOpponentIds])];

        const opponents = [];
        for (const opponentId of uniqueOpponentIds) {
            const opponent = await getById('opponents', opponentId);
            if (opponent) opponents.push(opponent);
        }

        try {
            const initialOpponentId = (__clientViewSelectedCase && __clientViewSelectedCase.opponentId != null) ? __clientViewSelectedCase.opponentId : null;
            if (initialOpponentId != null && opponents.length > 1) {
                const idx = opponents.findIndex(o => o && o.id === initialOpponentId);
                if (idx > 0) {
                    const tmp = opponents[0];
                    opponents[0] = opponents[idx];
                    opponents[idx] = tmp;
                }
            }
        } catch (_) { }

        const opponentCapacityById = new Map();
        const opponentCaseById = new Map();
        try {
            const sortedCases = Array.isArray(cases) ? cases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
            for (const cs of sortedCases) {
                if (!cs || cs.opponentId == null) continue;
                const v = String(cs.opponentCapacity || '').trim();
                if (v && !opponentCapacityById.has(cs.opponentId)) {
                    opponentCapacityById.set(cs.opponentId, v);
                }
                if (!opponentCaseById.has(cs.opponentId)) {
                    opponentCaseById.set(cs.opponentId, cs);
                }
            }
        } catch (_) { }

        __clientViewOpponentCapacityById = opponentCapacityById;
        __clientViewOpponentCaseById = opponentCaseById;
        __clientViewCurrentClientId = clientId;
        try {
            if (typeof window !== 'undefined') {
                window.__clientViewOpponentCapacityById = opponentCapacityById;
                window.__clientViewCurrentClientId = clientId;
                window.__clientViewOpponentCaseById = opponentCaseById;
            }
        } catch (_) { }

        try {
            const wantOpponentId = (restoredOpponentId != null && Number.isFinite(restoredOpponentId) && restoredOpponentId)
                ? restoredOpponentId
                : ((__clientViewSelectedCase && __clientViewSelectedCase.opponentId != null) ? __clientViewSelectedCase.opponentId : null);
            if (wantOpponentId != null && opponents.length > 1) {
                const idx = opponents.findIndex(o => o && o.id === wantOpponentId);
                if (idx > 0) {
                    const tmp = opponents[0];
                    opponents[0] = opponents[idx];
                    opponents[idx] = tmp;
                }
            }
        } catch (_) { }

        try {
            sessionStorage.removeItem('clientViewSelectedOpponentId');
            sessionStorage.removeItem('clientViewSelectedCapacityIndex');
            sessionStorage.removeItem('clientViewSelectedCapacityValue');
        } catch (_) { }

        modalContent.innerHTML = `
            <style id="client-view-performance-style">
                .client-view .shadow-sm:not(button),
                .client-view .shadow-md:not(button),
                .client-view .shadow-lg:not(button),
                .client-view .hover\:shadow-lg:not(button):hover {
                    box-shadow: none !important;
                }
            </style>
            <div class="client-view client-view--mobile-tight space-y-6">
                <!-- بيانات الأطراف -->
                <div class="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                    <!-- بيانات الموكل -->
                    <div class="flex-1 flex flex-col">
                        <div class="p-6 rounded-lg bg-blue-50 border border-blue-200/60 flex-1 flex flex-col">
                            <h3 class="text-lg font-bold text-blue-800 mb-4 flex items-center justify-center gap-2">
                                <i class="ri-user-3-line"></i>
                                <span>بيانات الموكل</span>
                            </h3>
                            <div class="space-y-4 flex-1">
                                <div class="inline-flex w-full items-stretch">
                                    <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-r-lg border-l-0">اسم الموكل</div>
                                    <div class="flex-1 font-bold text-lg text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">${client.name || 'فارغ'}</div>
                                </div>
                                <div class="inline-flex w-full items-stretch">
                                    <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-r-lg border-l-0">صفته</div>
                                    <div class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">
                                        <span id="client-capacity-value">${clientCapacityText}</span>
                                    </div>
                                </div>
                                <div class="inline-flex w-full items-stretch">
                                    <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-r-lg border-l-0">عنوانه</div>
                                    <div class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">${client.address || 'فارغ'}</div>
                                </div>
                                <div class="inline-flex w-full items-stretch">
                                    <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-r-lg border-l-0">الهاتف</div>
                                    <div class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">${client.phone || 'فارغ'}</div>
                                </div>
                                                            </div>
                            
                            <div class="mt-6 text-center">
                                <button id="edit-client-data-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105" data-client-id="${clientId}">
                                    <i class="ri-edit-line mr-2"></i>تعديل
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- فاصل "ضد" -->
                    <div class="against-separator flex items-center justify-center self-center">
                        <span class="text-2xl font-black text-gray-500 bg-white px-4 py-2 rounded-full border">ضد</span>
                    </div>

                    <!-- بيانات الخصوم -->
                    <div class="flex-1 flex flex-col">
                        <div class="p-6 rounded-lg bg-red-50 border border-red-200/60 flex-1 flex flex-col">
                            <h3 class="text-lg font-bold text-red-800 mb-4 flex items-center justify-center gap-2">
                                <i class="ri-shield-user-line"></i>
                                <span>بيانات الخصوم</span>
                            </h3>
                            ${opponents.length === 0 ? `
                            <div class="space-y-4 flex-1">
                            <div class="inline-flex w-full items-stretch">
                            <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">اسم الخصم</div>
                            <div class="flex-1 font-bold text-lg text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">فارغ</div>
                            </div>
                            <div class="inline-flex w-full items-stretch">
                            <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">صفته</div>
                            <div class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">فارغ</div>
                            </div>
                            <div class="inline-flex w-full items-stretch">
                            <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">عنوانه</div>
                            <div class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">فارغ</div>
                            </div>
                            <div class="inline-flex w-full items-stretch">
                            <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">الهاتف</div>
                            <div class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">فارغ</div>
                            </div>
                                                        </div>
                            <div class="mt-6 text-center">
                            <button class="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed" disabled>
                            <i class="ri-edit-line mr-2"></i>تعديل
                            </button>
                            </div>
                            ` : `
                            
                                <div class="space-y-4 flex-1">
                                    <div class="inline-flex w-full items-stretch">
                                        <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">اسم الخصم</div>
                                        <div id="opponent-name-value" class="flex-1 font-bold text-lg text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">${opponents[0]?.name || 'فارغ'}</div>
                                    </div>
                                    <div class="inline-flex w-full items-stretch">
                                        <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">صفته</div>
                                        <div id="opponent-capacity-value" class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">${(opponents[0]?.id != null && opponentCapacityById.get(opponents[0].id)) ? opponentCapacityById.get(opponents[0].id) : 'فارغ'}</div>
                                    </div>
                                    <div class="inline-flex w-full items-stretch">
                                        <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">عنوانه</div>
                                        <div id="opponent-address-value" class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">${opponents[0]?.address || 'فارغ'}</div>
                                    </div>
                                    <div class="inline-flex w-full items-stretch">
                                        <div class="w-24 md:w-28 shrink-0 px-3 py-3 text-sm font-medium text-gray-700 bg-red-50 border border-red-200 rounded-r-lg border-l-0">الهاتف</div>
                                        <div id="opponent-phone-value" class="flex-1 font-medium text-gray-800 bg-white p-3 border rounded-l-lg border-r-0">${opponents[0]?.phone || 'فارغ'}</div>
                                    </div>
                                                                    </div>
                                <div class="mt-6 text-center">
                                    <button class="edit-opponent-btn px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105" data-opponent-id="${opponents[0]?.id}">
                                        <i class="ri-edit-line mr-2"></i>تعديل
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                ${sortedCases.length > 1 ? `
                <div class="flex items-center justify-center mt-3">
                    <div class="inline-flex items-center gap-4 bg-white/80 border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                        <button id="prev-case-btn" class="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-full transition-all shadow-md" title="القضية السابقة">
                            <i class="ri-arrow-right-line"></i>
                        </button>
                        <span class="text-sm text-gray-700 bg-white px-3 py-1 rounded-full border">
                            <span id="current-case-index">1</span> من ${sortedCases.length}
                        </span>
                        <button id="next-case-btn" class="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-full transition-all shadow-md" title="القضية التالية">
                            <i class="ri-arrow-left-line"></i>
                        </button>
                    </div>
                </div>
                ` : ''}

                <!-- قضايا الموكل -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-green-800 flex items-center gap-2">
                            <i class="ri-briefcase-line"></i>القضايا
                        </h3>
                        <button id="add-case-for-client-btn" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-all font-bold flex items-center gap-2" data-client-id="${clientId}">
                            <i class="ri-add-line"></i>إضافة قضية
                        </button>
                    </div>
                    
                    <div id="client-cases-list" class="space-y-3 mb-6">
                        ${cases.length === 0 ?
                '<div class="text-center text-gray-500 py-8"><i class="ri-briefcase-line text-2xl mb-2"></i><p>لا توجد قضايا مسجلة لهذا الموكل</p></div>'
                : ''
            }
                    </div>

                </div>


            </div>
        `;


        currentOpponentIndex = 0;

        __clientViewCasesSorted = sortedCases;
        try {
            if (restoredSelectedCaseIndex != null) {
                __clientViewSelectedCaseIndex = restoredSelectedCaseIndex;
            } else {
                const initialCaseId = (__clientViewSelectedCase && __clientViewSelectedCase.id != null) ? __clientViewSelectedCase.id : null;
                if (initialCaseId != null) {
                    const idx = sortedCases.findIndex(c => c && c.id === initialCaseId);
                    __clientViewSelectedCaseIndex = idx >= 0 ? idx : 0;
                } else {
                    __clientViewSelectedCaseIndex = 0;
                }
            }
        } catch (_) {
            __clientViewSelectedCaseIndex = 0;
        }


        await loadClientCasesList(cases);

        try {
            if (__clientViewSelectedCase && __clientViewSelectedCase.id != null) {
                highlightCaseCard(String(__clientViewSelectedCase.id));
            }
        } catch (_) { }


        attachClientViewListeners(clientId, opponents, sortedCases);

        try {
            await __clientViewSelectCaseByIndex(__clientViewSelectedCaseIndex);
        } catch (_) { }

    } catch (error) {

        showToast('حدث خطأ في تحميل بيانات الموكل', 'error');
    }
}


async function loadClientCasesList(cases) {
    const casesList = document.getElementById('client-cases-list');

    if (cases.length === 0) return;

    const allOpponents = await getAllOpponents();
    const opponentsMap = new Map(Array.isArray(allOpponents) ? allOpponents.map(o => [o.id, o]) : []);
    const allSessions = await getAllSessions();
    const sessionsByCaseId = new Map();
    for (const s of allSessions) {
        const arr = sessionsByCaseId.get(s.caseId) || [];
        arr.push(s);
        sessionsByCaseId.set(s.caseId, arr);
    }
    let html = '';
    for (const caseRecord of cases) {
        const normalizedStatus = clientViewNormalizeStatus(caseRecord.caseStatus);
        const isArchived = (caseRecord && caseRecord.isArchived === true) || normalizedStatus === 'منتهية';
        const archiveBtnLabel = isArchived ? 'استخراج' : 'أرشفة';
        const archiveBtnMobileColorClasses = isArchived
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-blue-600 hover:bg-blue-700';
        const archiveBtnDesktopColorClasses = archiveBtnMobileColorClasses;
        const opponent = opponentsMap.get(caseRecord.opponentId);
        const sessions = (sessionsByCaseId.get(caseRecord.id) || []).slice();

        html += `
            <div class="case-card bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300" data-case-id="${caseRecord.id}">
                <!-- رأس الكارت -->
                <div class="p-4 cursor-pointer case-header relative" data-case-id="${caseRecord.id}">
                    <div class="flex items-start gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start gap-3 mb-2">
                                <h4 class="font-bold text-lg text-green-700 flex-1 min-w-0">
                                    قضية رقم: ${caseRecord.caseNumber || 'غير محدد'} لسنة ${caseRecord.caseYear || 'غير محدد'}
                                    <i class="ri-arrow-down-s-line text-gray-400 transition-transform case-arrow inline-block ml-1 align-middle" data-case-id="${caseRecord.id}"></i>
                                </h4>
                            </div>
                            ${caseRecord.subject ? `<p class="text-sm text-gray-700 mb-2"><span class="font-medium">الموضوع:</span> ${caseRecord.subject}</p>` : '<p class="text-sm text-gray-500 mb-2">لا يوجد موضوع محدد</p>'}
                            <div class="flex items-center gap-4 text-sm text-gray-600">
                                <span class="flex items-center gap-1">
                                    <i class="ri-shield-user-line text-red-500"></i>
                                    ضد: ${opponent ? opponent.name : 'غير محدد'}
                                </span>
                            </div>

                            <!-- أزرار الموبايل: تحت (ضد) وفي المنتصف -->
                            <div class="flex md:hidden items-center justify-center gap-2 mt-3" onclick="event.stopPropagation()">
                                <button class="edit-case-btn bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm transition-colors" data-case-id="${caseRecord.id}">
                                    <i class="ri-edit-line mr-1"></i>تعديل
                                </button>
                                <button class="delete-case-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors" data-case-id="${caseRecord.id}">
                                    <i class="ri-delete-bin-line mr-1"></i>حذف
                                </button>
                                <button class="toggle-archive-btn ${archiveBtnMobileColorClasses} text-white px-4 py-2 rounded text-sm transition-colors" data-case-id="${caseRecord.id}" data-archived="${isArchived ? '1' : '0'}">
                                    <i class="ri-archive-line mr-1"></i>${archiveBtnLabel}
                                </button>
                            </div>
                        </div>

                        <!-- أزرار الكمبيوتر: كما هي في الجانب -->
                        <div class="hidden md:flex flex-col gap-2 ml-4" onclick="event.stopPropagation()">
                            <button class="edit-case-btn bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors" data-case-id="${caseRecord.id}">
                                <i class="ri-edit-line mr-1"></i>تعديل
                            </button>
                            <button class="delete-case-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors" data-case-id="${caseRecord.id}">
                                <i class="ri-delete-bin-line mr-1"></i>حذف
                            </button>
                            <button class="toggle-archive-btn ${archiveBtnDesktopColorClasses} text-white px-3 py-1 rounded text-sm transition-colors" data-case-id="${caseRecord.id}" data-archived="${isArchived ? '1' : '0'}">
                                <i class="ri-archive-line mr-1"></i>${archiveBtnLabel}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- تفاصيل القضية المخفية -->
                <div class="case-details hidden border-t border-gray-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" data-case-id="${caseRecord.id}">
                    <div class="p-6">
                        <!-- عنوان التفاصيل -->
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <i class="ri-information-line text-white text-xs"></i>
                            </div>
                            <h3 class="text-lg font-bold text-blue-800">تفاصيل القضية الكاملة</h3>
                        </div>
                        
                        <!-- الصف الأول: الأرقام -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div class="bg-white rounded-lg p-4 shadow-md border border-blue-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-blue-700 block mb-2">رقم القضية</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.caseNumber || 'فارغ'} لسنة ${caseRecord.caseYear || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-red-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-red-700 block mb-2">رقم الاستئناف</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.appealNumber || 'فارغ'} لسنة ${caseRecord.appealYear || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-teal-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-teal-700 block mb-2">رقم النقض</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.cassationNumber || 'فارغ'} لسنة ${caseRecord.cassationYear || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-indigo-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-indigo-700 block mb-2">رقم التوكيل</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.poaNumber || 'فارغ'}</p>
                            </div>
                        </div>
                        
                        <!-- الصف الثاني: البيانات الوصفية -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div class="bg-white rounded-lg p-4 shadow-md border border-orange-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-orange-700 block mb-2">نوع الدعوى</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.caseType || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-cyan-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-cyan-700 block mb-2">موضوع الدعوى</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.subject || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-green-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-green-700 block mb-2">المحكمة</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.court || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-pink-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-pink-700 block mb-2">رقم الدائرة</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.circuitNumber || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-purple-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-purple-700 block mb-2">حالة القضية</span>
                                <p class="text-sm font-bold text-gray-800 case-status-text">${normalizedStatus || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-sky-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-sky-700 block mb-2">رقم الملف</span>
                                <p class="text-sm font-bold text-gray-800">${caseRecord.fileNumber || 'فارغ'}</p>
                            </div>
                            <div class="bg-white rounded-lg p-4 shadow-md border border-yellow-100 hover:shadow-lg transition-shadow text-center md:col-span-2 lg:col-span-2">
                                <span class="text-sm font-bold text-yellow-700 block mb-2">ملاحظات</span>
                                <p class="text-sm font-bold text-gray-800 leading-relaxed">${caseRecord.notes || 'فارغ'}</p>
                            </div>
                        </div>
                        
                        <!-- عرض الجلسات تلقائياً -->
                        <div class="pt-4 border-t border-blue-200">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                        <i class="ri-calendar-event-line text-white text-xs"></i>
                                    </div>
                                    <h4 class="text-lg font-bold text-purple-800">جلسات القضية</h4>
                                </div>
                                <button class="add-session-for-case-btn px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2" data-case-id="${caseRecord.id}">
                                    <i class="ri-add-line"></i>
                                    <span>إضافة جلسة</span>
                                </button>
                            </div>
                            <div id="case-sessions-${caseRecord.id}" class="space-y-4">
                                <!-- الجلسات ستظهر هنا تلقائياً -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    casesList.innerHTML = html;


    attachCaseCardListeners();


    if (cases.length === 1) {
        setTimeout(async () => {
            const firstCaseId = cases[0].id;
            const firstCaseDetails = document.querySelector(`.case-details[data-case-id="${firstCaseId}"]`);
            const firstArrow = document.querySelector(`.case-arrow[data-case-id="${firstCaseId}"]`);

            if (firstCaseDetails && firstArrow) {

                expandModalForCaseDetails();


                firstCaseDetails.classList.remove('hidden');
                firstArrow.style.transform = 'rotate(180deg)';


                stateManager.currentCaseId = parseInt(firstCaseId);


                let locale = 'ar-EG';
                try {
                    if (typeof getSetting === 'function') {
                        const v = await getSetting('dateLocale');
                        if (v === 'ar-EG' || v === 'en-GB') locale = v;
                    }
                } catch (_) { }
                await loadCaseSessions(firstCaseId, locale);
            }
        }, 100);
    }
}


function attachCaseCardListeners() {

    document.querySelectorAll('.case-header').forEach(header => {
        header.addEventListener('click', async (e) => {
            const caseId = header.dataset.caseId;
            const caseDetails = document.querySelector(`.case-details[data-case-id="${caseId}"]`);
            const arrow = document.querySelector(`.case-arrow[data-case-id="${caseId}"]`);

            if (caseDetails.classList.contains('hidden')) {

                try {
                    const idNum = parseInt(caseId, 10);
                    const casesArr = Array.isArray(__clientViewCasesSorted) ? __clientViewCasesSorted : [];
                    const idx = casesArr.findIndex(c => c && c.id === idNum);
                    if (idx >= 0) {
                        await __clientViewSelectCaseByIndex(idx);
                        storeClientViewSelection(__clientViewCurrentClientId, []);
                    }
                } catch (_) { }

                highlightCaseCard(String(caseId));

                document.querySelectorAll('.case-details').forEach(detail => {
                    detail.classList.add('hidden');
                });
                document.querySelectorAll('.case-arrow').forEach(arr => {
                    arr.style.transform = 'rotate(0deg)';
                });





                expandModalForCaseDetails();


                caseDetails.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';

                var firstCaseId = caseId;


                stateManager.currentCaseId = parseInt(firstCaseId);


                stateManager.currentCaseId = parseInt(caseId);

                let locale = 'ar-EG';
                try {
                    if (typeof getSetting === 'function') {
                        const v = await getSetting('dateLocale');
                        if (v === 'ar-EG' || v === 'en-GB') locale = v;
                    }
                } catch (_) { }
                await loadCaseSessions(caseId, locale);
            } else {

                caseDetails.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';





                const anyOpen = Array.from(document.querySelectorAll('.case-details')).some(el => !el.classList.contains('hidden'));
                if (!anyOpen) {
                    resetModalSize();
                    try { showAllCases(); } catch (_) { }
                }
            }
        });
    });

}


function expandModalForCaseDetails() {

    const modalContainer = document.getElementById('modal-container') || document.getElementById('modal-container-hidden');
    const modalContent = document.getElementById('modal-content');
    if (modalContainer && modalContent) {

        modalContainer.style.maxHeight = 'none';
        modalContainer.style.height = 'auto';
        modalContent.style.maxHeight = 'none';
        modalContent.style.overflowY = 'visible';


        modalContainer.classList.add('min-h-fit');
    }
}


function resetModalSize() {
    const modalContainer = document.getElementById('modal-container') || document.getElementById('modal-container-hidden');
    const modalContent = document.getElementById('modal-content');
    if (modalContainer && modalContent) {

        modalContainer.style.maxHeight = '';
        modalContainer.style.height = '';
        modalContent.style.maxHeight = '';
        modalContent.style.overflowY = '';

        modalContainer.classList.remove('min-h-fit');
    }
}


function hideOtherCases(activeCaseId) {
    document.querySelectorAll('.case-card').forEach(card => {
        const cardCaseId = card.dataset.caseId;
        if (cardCaseId !== activeCaseId) {
            card.style.display = 'none';
        }
    });
}


function showAllCases() {
    document.querySelectorAll('.case-card').forEach(card => {
        card.style.display = 'block';
    });
}


function highlightCaseCard(activeCaseId) {
    try {
        const idStr = String(activeCaseId);
        document.querySelectorAll('.case-card').forEach(card => {
            card.style.borderColor = '';
            card.style.boxShadow = '';
        });
        const target = document.querySelector(`.case-card[data-case-id="${idStr}"]`);
        if (target) {
            target.style.borderColor = '#facc15';
            target.style.boxShadow = '0 0 0 3px rgba(250, 204, 21, 0.85)';
        }
    } catch (_) { }
}


let currentOpponentIndex = 0;


function updateOpponentDisplay(opponents) {
    if (opponents.length === 0) return;

    const currentOpponent = opponents[currentOpponentIndex];

    const nameEl = document.getElementById('opponent-name-value');
    const capacityEl = document.getElementById('opponent-capacity-value');
    const addressEl = document.getElementById('opponent-address-value');
    const phoneEl = document.getElementById('opponent-phone-value');

    if (nameEl) nameEl.textContent = currentOpponent.name || 'فارغ';
    if (capacityEl) {
        let fromCase = '';
        try {
            if (__clientViewSelectedCase && currentOpponent && currentOpponent.id != null && __clientViewSelectedCase.opponentId === currentOpponent.id) {
                fromCase = String(__clientViewSelectedCase.opponentCapacity || '').trim();
            }
        } catch (_) { }
        if (!fromCase) {
            fromCase = (currentOpponent && currentOpponent.id != null) ? (__clientViewOpponentCapacityById.get(currentOpponent.id) || '') : '';
        }
        capacityEl.textContent = (String(fromCase || '').trim() || 'فارغ');
    }
    if (addressEl) addressEl.textContent = currentOpponent.address || 'فارغ';
    if (phoneEl) phoneEl.textContent = currentOpponent.phone || 'فارغ';

    const editBtn = document.querySelector('.edit-opponent-btn');
    if (editBtn) {
        editBtn.setAttribute('data-opponent-id', currentOpponent.id);
    }
    const indexSpan = document.getElementById('current-opponent-index');
    if (indexSpan) {
        indexSpan.textContent = currentOpponentIndex + 1;
    }
}

function updateClientCapacityDisplay() {
    try {
        const valueEl = document.getElementById('client-capacity-value');
        if (!valueEl) return;
        const caps = Array.isArray(__clientViewClientCapacities) ? __clientViewClientCapacities : [];
        if (caps.length > 0) {
            const idx = Math.max(0, Math.min(__clientViewClientCapacityIndex, caps.length - 1));
            __clientViewClientCapacityIndex = idx;
            valueEl.textContent = caps[idx] || 'فارغ';
        }
        const indexSpan = document.getElementById('current-client-capacity-index');
        if (indexSpan) indexSpan.textContent = (__clientViewClientCapacityIndex + 1);
        try {
            if (typeof window !== 'undefined') {
                window.__clientViewClientCapacityIndex = __clientViewClientCapacityIndex;
            }
        } catch (_) { }
    } catch (_) { }
}

function syncOpponentToSelectedClientCapacity(opponents) {
    try {
        const caps = Array.isArray(__clientViewClientCapacities) ? __clientViewClientCapacities : [];
        const selectedCap = caps.length > 0 ? (caps[__clientViewClientCapacityIndex] || '') : '';
        const caseMap = __clientViewClientCapacityCaseByValue instanceof Map ? __clientViewClientCapacityCaseByValue : new Map();
        const cs = selectedCap ? (caseMap.get(selectedCap) || null) : null;
        __clientViewSelectedCase = cs;

        try {
            if (__clientViewSelectedCase && __clientViewSelectedCase.id != null) {
                highlightCaseCard(String(__clientViewSelectedCase.id));
                stateManager.currentCaseId = parseInt(__clientViewSelectedCase.id);
            }
        } catch (_) { }

        if (!Array.isArray(opponents) || opponents.length === 0) return;
        if (cs && cs.opponentId != null) {
            const idx = opponents.findIndex(o => o && o.id === cs.opponentId);
            if (idx >= 0) {
                currentOpponentIndex = idx;
            }
        }
        updateOpponentDisplay(opponents);
    } catch (_) { }
}

function syncClientCapacityToSelectedOpponent(opponents) {
    try {
        if (!Array.isArray(opponents) || opponents.length === 0) return;
        const currentOpponent = opponents[currentOpponentIndex];
        if (!currentOpponent || currentOpponent.id == null) return;
        const caseMap = __clientViewOpponentCaseById instanceof Map ? __clientViewOpponentCaseById : new Map();
        const cs = caseMap.get(currentOpponent.id) || null;
        if (!cs) {
            __clientViewSelectedCase = null;
            try {
                stateManager.currentCaseId = null;
            } catch (_) { }
            updateOpponentDisplay(opponents);
            return;
        }
        __clientViewSelectedCase = cs;

        try {
            if (__clientViewSelectedCase && __clientViewSelectedCase.id != null) {
                highlightCaseCard(String(__clientViewSelectedCase.id));
                stateManager.currentCaseId = parseInt(__clientViewSelectedCase.id);
            }
        } catch (_) { }

        const cap = String(cs.clientCapacity || '').trim();
        if (cap && Array.isArray(__clientViewClientCapacities) && __clientViewClientCapacities.length > 0) {
            const idx = __clientViewClientCapacities.indexOf(cap);
            if (idx >= 0) {
                __clientViewClientCapacityIndex = idx;
                updateClientCapacityDisplay();
            }
        }
        updateOpponentDisplay(opponents);
    } catch (_) { }
}

function storeClientViewSelection(clientId, opponents) {
    try {
        sessionStorage.setItem('clientViewSelectedClientId', String(clientId));
        sessionStorage.setItem('clientViewSelectedCaseId', String((__clientViewSelectedCase && __clientViewSelectedCase.id != null) ? __clientViewSelectedCase.id : ''));
        sessionStorage.setItem('clientViewSelectedCaseIndex', String(__clientViewSelectedCaseIndex || 0));
    } catch (_) { }
}


function attachClientViewListeners(clientId, opponents, sortedCases) {

    const editClientBtn = document.getElementById('edit-client-data-btn');
    if (editClientBtn) {
        editClientBtn.addEventListener('click', () => {
            storeClientViewSelection(clientId, opponents);
            navigateTo(displayEditClientFormInline, clientId);
        });
    }


    const addCaseBtn = document.getElementById('add-case-for-client-btn');
    if (addCaseBtn) {
        addCaseBtn.addEventListener('click', () => {
            storeClientViewSelection(clientId, opponents);

            try {
                if (stateManager && typeof stateManager.resetCaseState === 'function') {
                    stateManager.resetCaseState();
                }
            } catch (_) { }

            try {
                sessionStorage.setItem('newEntryMode', 'addCaseForClient');
                // نحدد جهة الرجوع: شاشة تفاصيل الموكل
                sessionStorage.setItem('returnToPage', 'clientView');
                sessionStorage.setItem('returnToClientId', String(clientId));
                // خلي فتح تفاصيل الموكل مضمون عند الرجوع حتى لو returnToClientId اتشال لأي سبب
                sessionStorage.setItem('openClientDetailsOnSearch', String(clientId));
                sessionStorage.removeItem('new_draft_case_flow');
                sessionStorage.removeItem('currentCaseId');
            } catch (_) { }

            window.location.href = 'new.html';
        });
    }


    document.querySelectorAll('.edit-opponent-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const opponentId = parseInt(btn.dataset.opponentId);
            storeClientViewSelection(clientId, opponents);
            navigateTo(displayEditOpponentFormInline, opponentId);
        });
    });

    try {
        const casesArr = Array.isArray(sortedCases) ? sortedCases : [];
        if (casesArr.length > 1) {
            const prevCaseBtn = document.getElementById('prev-case-btn');
            const nextCaseBtn = document.getElementById('next-case-btn');
            if (prevCaseBtn && nextCaseBtn) {
                prevCaseBtn.addEventListener('click', async () => {
                    await __clientViewSelectCaseByIndex(__clientViewSelectedCaseIndex - 1);
                    storeClientViewSelection(clientId, opponents);
                    try {
                        if (__clientViewSelectedCase && __clientViewSelectedCase.id != null) {
                            await __clientViewShowOnlyCaseCard(__clientViewSelectedCase.id);
                        }
                    } catch (_) { }
                });
                nextCaseBtn.addEventListener('click', async () => {
                    await __clientViewSelectCaseByIndex(__clientViewSelectedCaseIndex + 1);
                    storeClientViewSelection(clientId, opponents);
                    try {
                        if (__clientViewSelectedCase && __clientViewSelectedCase.id != null) {
                            await __clientViewShowOnlyCaseCard(__clientViewSelectedCase.id);
                        }
                    } catch (_) { }
                });
            }
        }
    } catch (_) { }


    document.querySelectorAll('.edit-case-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const caseId = parseInt(btn.dataset.caseId);
            try {
                sessionStorage.setItem('returnToPage', 'search');
                sessionStorage.setItem('returnToClientId', String(clientId));
                sessionStorage.setItem('editCaseId', String(caseId));
            } catch (_) { }
            window.location.href = 'new.html';
        });
    });


    document.querySelectorAll('.delete-case-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const caseId = parseInt(btn.dataset.caseId);
            const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه القضية؟ سيتم حذف جميع الجلسات المرتبطة بها أيضاً.') : confirm('هل أنت متأكد من حذف هذه القضية؟ سيتم حذف جميع الجلسات المرتبطة بها أيضاً.');
            if (!ok) return;
            try {

                const sessions = await getFromIndex('sessions', 'caseId', caseId);
                for (const session of sessions) {
                    await deleteRecord('sessions', session.id);
                }


                await deleteRecord('cases', caseId);

                showToast('تم حذف القضية بنجاح', 'success');


                displayClientViewForm(clientId);
            } catch (error) {
                showToast('حدث خطأ في حذف القضية', 'error');
            }
        });
    });


    // توحيد تأثير الهوفر لزر الأرشفة/الاستخراج: خلفية الزر تصبح سوداء والنص أبيض عند الإشارة عليه
    try {
        document.querySelectorAll('.toggle-archive-btn').forEach(btn => {
            if (!btn || (btn.dataset && btn.dataset.hoverStyled === '1')) return;
            if (btn.dataset) btn.dataset.hoverStyled = '1';
            const applyBase = () => {
                try {
                    btn.style.background = '';
                    btn.style.color = '#ffffff';
                } catch (_) { }
            };
            const applyHover = () => {
                try {
                    btn.style.background = '#000000';
                    btn.style.color = '#ffffff';
                } catch (_) { }
            };
            applyBase();
            btn.addEventListener('mouseenter', applyHover);
            btn.addEventListener('mouseleave', applyBase);
            btn.addEventListener('blur', applyBase);
        });
    } catch (_) { }


    document.querySelectorAll('.toggle-archive-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const caseId = parseInt(btn.dataset.caseId);
            if (!caseId) return;
            try {
                const caseRecord = await getById('cases', caseId);
                if (!caseRecord) {
                    showToast('لم يتم العثور على بيانات القضية', 'error');
                    return;
                }
                const currentStatusNormalized = clientViewNormalizeStatus(caseRecord.caseStatus);
                const currentlyArchived = (caseRecord.isArchived === true) || currentStatusNormalized === 'منتهية';

                let newStatus;
                let newIsArchived;
                if (currentlyArchived) {
                    newStatus = 'متداولة';
                    newIsArchived = false;
                } else {
                    newStatus = 'منتهية';
                    newIsArchived = true;
                }

                const updatedRecord = { ...caseRecord, caseStatus: newStatus, isArchived: newIsArchived };
                await updateRecord('cases', caseId, updatedRecord);

                const statusEl = document.querySelector(`.case-card[data-case-id="${caseId}"] .case-status-text`);
                if (statusEl) {
                    statusEl.textContent = newStatus;
                }

                const allButtons = document.querySelectorAll(`.toggle-archive-btn[data-case-id="${caseId}"]`);
                allButtons.forEach(b => {
                    b.dataset.archived = newIsArchived ? '1' : '0';
                    try {
                        b.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'bg-green-600', 'hover:bg-green-700');
                        if (newIsArchived) {
                            b.classList.add('bg-green-600', 'hover:bg-green-700');
                        } else {
                            b.classList.add('bg-blue-600', 'hover:bg-blue-700');
                        }
                    } catch (_) { }
                    b.innerHTML = `<i class="ri-archive-line mr-1"></i>${newIsArchived ? 'استخراج' : 'أرشفة'}`;
                });

                if (newIsArchived) {
                    showToast('تمت أرشفة القضية لأنها منتهية', 'success');
                } else {
                    showToast('تم استخراج القضية من الأرشيف', 'success');
                }
            } catch (error) {
                showToast('حدث خطأ أثناء تحديث حالة القضية.', 'error');
            }
        });
    });


    document.querySelectorAll('.add-session-for-case-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const caseId = parseInt(btn.dataset.caseId);

            try {
                const caseRecord = await getById('cases', caseId);
                if (!caseRecord) {
                    showToast('لم يتم العثور على بيانات القضية', 'error');
                    return;
                }

                if (!caseRecord.caseNumber || !caseRecord.caseYear) {
                    showToast('يجب إدخال رقم الدعوى والسنة أولاً قبل إضافة الجلسات', 'error');
                    return;
                }

                stateManager.currentCaseId = caseId;
                try {
                    sessionStorage.setItem('returnToPage', 'search');
                    sessionStorage.setItem('returnToClientId', String(__clientViewCurrentClientId || ''));
                    sessionStorage.setItem('openClientDetailsOnSearch', String(__clientViewCurrentClientId || ''));
                } catch (_) { }
                window.location.href = `session-edit.html?caseId=${caseId}`;
            } catch (error) {
                showToast('حدث خطأ في التحقق من بيانات القضية', 'error');
            }
        });
    });


}
