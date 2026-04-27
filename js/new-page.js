
const partyDetailsFormHTML = `
<form id="party-details-form" class="space-y-6 min-h-[calc(100vh-48px)]" autocomplete="off">
    <div class="flex flex-col md:flex-row items-stretch gap-6">
        <div class="flex-1 p-4 md:p-6 border-2 border-blue-300 rounded-xl bg-blue-100 shadow-sm">
            <h3 class="text-lg font-bold text-blue-800 mb-4 flex items-center justify-center gap-2"><i class="ri-user-3-line"></i><span>بيانات الموكل</span></h3>
            <div class="space-y-3">
                <div class="autocomplete-container">
                    <div class="flex items-stretch">
                        <label for="client-name" class="px-4 py-3 border-2 border-blue-300 bg-blue-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">اسم الموكل</label>
                        <div class="flex-1 relative -mr-px">
                            <input type="text" id="client-name" name="clientName" required autocomplete="off" placeholder="اكتب اسم الموكل..." class="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-900 min-h-[48px]">
                            <button type="button" id="client-name-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>
                            <div id="client-name-dropdown" class="autocomplete-results hidden"></div>
                        </div>
                    </div>
                    <div id="client-autocomplete-results-container" class="autocomplete-results hidden"></div>
                </div>
                <div class="autocomplete-container">
                    <div class="flex items-stretch">
                        <label for="client-capacity" class="px-4 py-3 border-2 border-blue-300 bg-blue-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">صفته</label>
                        <div class="flex-1 relative -mr-px">
                            <input type="text" id="client-capacity" name="clientCapacity" autocomplete="off" placeholder="مثال: متهم" class="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-900 min-h-[48px]">
                            <button type="button" id="client-capacity-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>
                            <div id="client-capacity-dropdown" class="autocomplete-results hidden"></div>
                        </div>
                    </div>
                </div>
                <div class="autocomplete-container">
                    <div class="flex items-stretch">
                        <label for="client-address" class="px-4 py-3 border-2 border-blue-300 bg-blue-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">عنوانه</label>
                        <div class="flex-1 relative -mr-px">
                            <input type="text" id="client-address" name="clientAddress" placeholder="عنوان الموكل بالتفصيل" class="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-900 min-h-[48px]">
                            <button type="button" id="client-address-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>
                            <div id="client-address-dropdown" class="autocomplete-results hidden"></div>
                        </div>
                    </div>
                </div>
                <div class="flex items-stretch">
                    <label for="client-phone" class="px-4 py-3 border-2 border-blue-300 bg-blue-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">الهاتف</label>
                    <input type="text" id="client-phone" name="clientPhone" placeholder="01234567890" class="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-900 -mr-px min-h-[48px]">
                </div>
                <div class="autocomplete-container">
                    <div class="flex items-stretch">
                        <label for="client-poa-number" class="px-4 py-3 border-2 border-blue-300 bg-blue-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">رقم التوكيل</label>
                        <div class="flex-1 relative -mr-px">
                            <input type="text" id="client-poa-number" name="clientPoaNumber" placeholder="رقم التوكيل" class="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-900 min-h-[48px]">
                            <button type="button" id="client-poa-number-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                            <div id="client-poa-number-dropdown" class="autocomplete-results hidden"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex items-center justify-center py-2 md:py-0"><span class="text-sm md:text-base font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">ضد</span></div>
        <div class="flex-1 p-4 md:p-6 border-2 border-red-300 rounded-xl bg-red-50 shadow-sm">
            <h3 class="text-lg font-bold text-red-800 mb-4 flex items-center justify-center gap-2"><i class="ri-shield-user-line"></i><span>بيانات الخصم</span></h3>
            <div class="space-y-3">
                <div class="autocomplete-container">
                    <div class="flex items-stretch">
                        <label for="opponent-name" class="px-4 py-3 border-2 border-red-200 bg-red-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">اسم الخصم</label>
                        <div class="flex-1 relative -mr-px">
                            <input type="text" id="opponent-name" name="opponentName" required autocomplete="off" placeholder="اكتب اسم الخصم..." class="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-red-400 text-right font-semibold text-gray-900 min-h-[48px]">
                            <button type="button" id="opponent-name-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>
                            <div id="opponent-name-dropdown" class="autocomplete-results hidden"></div>
                        </div>
                    </div>
                    <div id="opponent-autocomplete-results-container" class="autocomplete-results hidden"></div>
                </div>
                <div class="autocomplete-container">
                    <div class="flex items-stretch">
                        <label for="opponent-capacity" class="px-4 py-3 border-2 border-red-200 bg-red-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">صفته</label>
                        <div class="flex-1 relative -mr-px">
                            <input type="text" id="opponent-capacity" name="opponentCapacity" autocomplete="off" placeholder="مثال: مجني عليه" class="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-red-400 text-right font-semibold text-gray-900 min-h-[48px]">
                            <button type="button" id="opponent-capacity-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>
                            <div id="opponent-capacity-dropdown" class="autocomplete-results hidden"></div>
                        </div>
                    </div>
                </div>
                <div class="autocomplete-container">
                    <div class="flex items-stretch">
                        <label for="opponent-address" class="px-4 py-3 border-2 border-red-200 bg-red-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">عنوانه</label>
                        <div class="flex-1 relative -mr-px">
                            <input type="text" id="opponent-address" name="opponentAddress" placeholder="عنوان الخصم بالتفصيل" class="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-red-400 text-right font-semibold text-gray-900 min-h-[48px]">
                            <button type="button" id="opponent-address-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>
                            <div id="opponent-address-dropdown" class="autocomplete-results hidden"></div>
                        </div>
                    </div>
                </div>
                <div class="flex items-stretch">
                    <label for="opponent-phone" class="px-4 py-3 border-2 border-red-200 bg-red-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">الهاتف</label>
                    <input type="text" id="opponent-phone" name="opponentPhone" placeholder="01234567890" class="flex-1 px-4 py-3 bg-white border-2 border-red-200 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-red-400 text-right font-semibold text-gray-900 -mr-px min-h-[48px]">
                </div>
                <div class="flex items-stretch">
                    <label for="case-notes" class="px-4 py-3 border-2 border-red-200 bg-red-50 text-sm font-bold text-gray-700 shrink-0 w-32 md:w-36 text-right rounded-r-lg">ملاحظات</label>
                    <input type="text" id="case-notes" name="caseNotes" placeholder="ملاحظات على القضية" class="flex-1 px-4 py-3 bg-white border-2 border-red-200 rounded-l-lg placeholder-gray-400 focus:ring-0 focus:border-red-400 text-right font-semibold text-gray-900 -mr-px min-h-[48px]">
                </div>
            </div>
        </div>
    </div>
    <div id="party-details-actions" class="flex flex-col items-center gap-3 p-4 mt-3 mb-6 bg-blue-50 rounded-xl shadow-md">
        <!-- Wide Save & Proceed buttons -->
        <div class="w-full flex justify-center gap-3">
            <button type="button" id="save-parties-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                <i class="ri-save-3-line"></i>
                <span>حفظ</span>
            </button>
            <button type="button" id="next-to-case-details-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                <i class="ri-arrow-left-line"></i>
                <span>متابعة للقضية</span>
            </button>
        </div>
        <!-- Attach and Open buttons below -->
        <div id="client-folder-actions" class="flex items-center justify-center gap-2">
            <button type="button" id="create-folder-btn" class="px-4 py-2 bg-white border-2 border-gray-500 text-gray-800 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-blue-600">
                <i class="ri-attachment-2"></i>
                <span>إرفاق ملفات</span>
            </button>
            <button type="button" id="open-folder-btn" class="px-4 py-2 bg-white border-2 border-gray-500 text-gray-800 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-blue-600">
                <i class="ri-folder-open-line"></i>
                <span>فتح المجلد</span>
            </button>
        </div>
        <div class="text-xs text-gray-500">
            (<span id="client-cases-count">0</span> قضية محفوظة)
        </div>
    </div>
</form>
`;

let __editCaseIdFromStorage = null;
let __isEditCaseMode = false;
let __newEntryMode = '';
let __isFreshClientMode = false;
let __isAddCaseForClientMode = false;

function clearFreshClientForm(form) {
    if (!form) return;
    try { form.reset(); } catch (_) { }
    const fieldIds = [
        'client-name',
        'client-capacity',
        'client-address',
        'client-phone',
        'client-poa-number',
        'opponent-name',
        'opponent-capacity',
        'opponent-address',
        'opponent-phone',
        'case-notes'
    ];
    fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await initDB();

        try {
            __newEntryMode = String(sessionStorage.getItem('newEntryMode') || '').trim();
            __isFreshClientMode = (__newEntryMode === 'freshClient');
            __isAddCaseForClientMode = (__newEntryMode === 'addCaseForClient');
            sessionStorage.removeItem('newEntryMode');

            if (__isAddCaseForClientMode) {
                // داخلين نضيف قضية لموكل محدد: ممنوع نسحب أي مخزون قديم من شاشة إدخال سابقة
                try { sessionStorage.removeItem('new_draft_case_flow'); } catch (_) { }
                try {
                    if (typeof stateManager?.resetCaseState === 'function') stateManager.resetCaseState();
                } catch (_) { }
            }
            if (__isFreshClientMode) {
                try {
                    if (typeof stateManager?.resetCaseState === 'function') stateManager.resetCaseState();
                } catch (_) { }
                try {
                    stateManager.setSelectedClientId(null);
                    stateManager.setSelectedOpponentId(null);
                } catch (_) { }
                try {
                    sessionStorage.removeItem('returnToPage');
                    sessionStorage.removeItem('returnToClientId');
                    sessionStorage.removeItem('openClientDetailsOnSearch');
                    sessionStorage.removeItem('clientViewSelectedClientId');
                    sessionStorage.removeItem('clientViewSelectedCaseId');
                    sessionStorage.removeItem('clientViewSelectedCaseIndex');
                    sessionStorage.removeItem('new_draft_case_flow');
                    sessionStorage.removeItem('new_open_case_details');
                    sessionStorage.removeItem('new_open_case_id');
                    sessionStorage.removeItem('editCaseId');
                    sessionStorage.removeItem('currentCaseId');
                } catch (_) { }
            }
        } catch (_) { }

        // Restore draft data if returning from session-edit or page reload
        try {
            const rawDraft = (__isFreshClientMode || __isAddCaseForClientMode) ? '' : sessionStorage.getItem('new_draft_case_flow');
            if (rawDraft) {
                const draft = JSON.parse(rawDraft);
                if (draft && typeof draft === 'object') {
                    try {
                        if (draft.parties && typeof stateManager?.updateCaseDataStash === 'function') {
                            stateManager.updateCaseDataStash('parties', draft.parties);
                        } else if (draft.parties) {
                            stateManager.caseDataStash = stateManager.caseDataStash || {};
                            stateManager.caseDataStash.parties = draft.parties;
                        }
                    } catch (_) { }
                    try {
                        if (draft.caseDetails && typeof stateManager?.updateCaseDataStash === 'function') {
                            stateManager.updateCaseDataStash('caseDetails', draft.caseDetails);
                        } else if (draft.caseDetails) {
                            stateManager.caseDataStash = stateManager.caseDataStash || {};
                            stateManager.caseDataStash.caseDetails = draft.caseDetails;
                        }
                    } catch (_) { }
                }
                try { sessionStorage.removeItem('new_draft_case_flow'); } catch (_) { }
            }
        } catch (_) { }

        let __openCaseDetailsOnLoad = false;
        let __openCaseIdOnLoad = null;
        try {
            __openCaseDetailsOnLoad = sessionStorage.getItem('new_open_case_details') === '1';
            const raw = sessionStorage.getItem('new_open_case_id');
            const parsed = parseInt(raw || '0', 10);
            if (parsed) __openCaseIdOnLoad = parsed;
        } catch (_) { }

        try {
            const rawEditCaseId = sessionStorage.getItem('editCaseId');
            const parsed = parseInt(rawEditCaseId || '0', 10);
            if (parsed) __editCaseIdFromStorage = parsed;
            try { sessionStorage.removeItem('editCaseId'); } catch (_) { }
        } catch (_) { }

        try {
            if (__isFreshClientMode) {
                stateManager.setSelectedClientId(null);
                stateManager.setSelectedOpponentId(null);
            } else {
                const origin = sessionStorage.getItem('returnToPage') || '';
                if (origin === 'search') {
                    const cid = parseInt(sessionStorage.getItem('returnToClientId') || '0', 10);
                    if (cid) stateManager.setSelectedClientId(cid);
                } else if (origin === 'clientView') {
                    const cid = parseInt(sessionStorage.getItem('returnToClientId') || '0', 10);
                    if (cid) stateManager.setSelectedClientId(cid);
                    else stateManager.setSelectedClientId(null);
                } else {
                    // لو returnToPage اتشال لأي سبب لكن لسه فيه اختيار موكل من شاشة تفاصيل الموكل
                    // اعتبره جاي من تفاصيل الموكل عشان (اللوك) والرجوع يفضلوا شغالين
                    try {
                        const fromClientView = parseInt(sessionStorage.getItem('clientViewSelectedClientId') || '0', 10);
                        if (fromClientView) {
                            stateManager.setSelectedClientId(fromClientView);
                            sessionStorage.setItem('returnToPage', 'clientView');
                            sessionStorage.setItem('returnToClientId', String(fromClientView));
                        } else {
                            // فتح (موكل/قضية جديدة) من الشاشة الرئيسية: نبدأ بدون موكل مختار
                            stateManager.setSelectedClientId(null);
                        }
                    } catch (_) {
                        stateManager.setSelectedClientId(null);
                    }
                }
            }
        } catch (_) { }

        if (__editCaseIdFromStorage) {
            __isEditCaseMode = true;
            try { stateManager.setCurrentCaseId(__editCaseIdFromStorage); } catch (_) { stateManager.currentCaseId = __editCaseIdFromStorage; }
            try {
                const caseRecord = await getById('cases', __editCaseIdFromStorage);
                if (caseRecord) {
                    try { stateManager.setSelectedClientId(caseRecord.clientId || null); } catch (_) { stateManager.selectedClientId = (caseRecord.clientId || null); }
                    try { stateManager.setSelectedOpponentId(caseRecord.opponentId || null); } catch (_) { stateManager.selectedOpponentId = (caseRecord.opponentId || null); }
                    try {
                        stateManager.updateCaseDataStash('parties', {
                            clientCapacity: caseRecord.clientCapacity,
                            opponentCapacity: caseRecord.opponentCapacity,
                            clientPoaNumber: caseRecord.poaNumber,
                            caseNotes: caseRecord.notes
                        });
                    } catch (_) { }
                }
            } catch (_) { }

            try {
                const partyContainer = document.getElementById('party-form-container');
                if (partyContainer) partyContainer.classList.add('hidden');
            } catch (_) { }
            try {
                const embedded = document.getElementById('embedded-content');
                if (embedded) embedded.classList.remove('hidden');
            } catch (_) { }

            await displayCaseDetailsForm();
            try {
                const pageHeaderTitle = document.getElementById('page-title');
                if (pageHeaderTitle) pageHeaderTitle.textContent = 'تعديل الدعوى';
            } catch (_) { }
            setupBackButton();
            setupModalClose();
            return;
        }

        // رجوع من session-edit: افتح بيانات القضية مباشرة بدل الأطراف
        if (__openCaseDetailsOnLoad) {
            try {
                sessionStorage.removeItem('new_open_case_details');
                sessionStorage.removeItem('new_open_case_id');
            } catch (_) { }

            try {
                await loadPartyDetailsForm();
            } catch (_) { }

            try {
                const partyContainer = document.getElementById('party-form-container');
                if (partyContainer) partyContainer.classList.add('hidden');
            } catch (_) { }
            try {
                const embedded = document.getElementById('embedded-content');
                if (embedded) embedded.classList.remove('hidden');
            } catch (_) { }
            if (__openCaseIdOnLoad) {
                try { stateManager.setCurrentCaseId(__openCaseIdOnLoad); } catch (_) { stateManager.currentCaseId = __openCaseIdOnLoad; }
            }
            await displayCaseDetailsForm();
            try {
                const pageHeaderTitle = document.getElementById('page-title');
                if (pageHeaderTitle) pageHeaderTitle.textContent = 'إدخال بيانات الدعوى';
            } catch (_) { }
            setupBackButton();
            setupModalClose();
            return;
        }

        await loadPartyDetailsForm();
        setupBackButton();
        setupModalClose();
    } catch (error) {
        console.error('Error initializing new case page:', error);
        if (typeof showToast === 'function') {
            showToast('حدث خطأ في تهيئة الصفحة', 'error');
        } else {
            alert('حدث خطأ في تهيئة الصفحة: ' + error.message);
        }
    }
});

async function loadPartyDetailsForm() {
    const container = document.getElementById('party-form-container');
    if (!container) return;

    container.innerHTML = partyDetailsFormHTML;

    try {
        const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
        if (!isElectron) {
            const actions = document.getElementById('client-folder-actions');
            if (actions) actions.remove();
        }
    } catch (_) { }

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'إدخال بيانات الأطراف';

    const form = document.getElementById('party-details-form');

    if (__isFreshClientMode) {
        clearFreshClientForm(form);
    }

    if (!__isFreshClientMode && !__isAddCaseForClientMode && stateManager.caseDataStash.parties) {
        for (const [key, value] of Object.entries(stateManager.caseDataStash.parties)) {
            if (form.elements[key]) {
                form.elements[key].value = value;
            }
        }
    }

    let __isNewCaseFlow = false;
    let __isNewCaseFromClientView = false;
    let __hasUserPartiesStash = false;
    try {
        const origin = sessionStorage.getItem('returnToPage') || '';
        const cid = parseInt(sessionStorage.getItem('returnToClientId') || '0', 10);
        __isNewCaseFlow = (origin === 'search' && !!cid && !stateManager.currentCaseId);
    } catch (_) { }
    try {
        const clientViewId = parseInt(sessionStorage.getItem('clientViewSelectedClientId') || '0', 10);
        __isNewCaseFromClientView = (!!clientViewId && stateManager.selectedClientId === clientViewId && !stateManager.currentCaseId);
    } catch (_) { }
    try {
        const p = stateManager.caseDataStash.parties;
        __hasUserPartiesStash = !!(p && Object.values(p).some(v => String(v || '').trim()));
    } catch (_) { }

    if (__isFreshClientMode) {
        __hasUserPartiesStash = false;
    }
    if (__isAddCaseForClientMode) {
        __hasUserPartiesStash = false;
        __isNewCaseFromClientView = true;
    }

    if (!__isFreshClientMode && stateManager.selectedClientId && (__isAddCaseForClientMode || !stateManager.caseDataStash.parties?.clientName)) {
        await loadSelectedClientData();
    }

    try {
        if ((__isNewCaseFlow || __isNewCaseFromClientView) && !__hasUserPartiesStash) {
            const capEl = document.getElementById('client-capacity');
            if (capEl) capEl.value = '';

            stateManager.setSelectedOpponentId(null);
            const idsToClear = ['opponent-name', 'opponent-capacity', 'opponent-address', 'opponent-phone'];
            idsToClear.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }
    } catch (_) { }

    try {
        const hasOpponentInStash = !!(stateManager.caseDataStash.parties && stateManager.caseDataStash.parties.opponentName);
        if (!__isFreshClientMode && !__isNewCaseFlow && !stateManager.selectedOpponentId && stateManager.selectedClientId && !hasOpponentInStash) {
            const rel = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}');
            const ids = rel && rel[stateManager.selectedClientId] ? rel[stateManager.selectedClientId] : [];
            const pick = Array.isArray(ids) && ids.length > 0 ? ids[0] : null;
            if (pick) {
                stateManager.setSelectedOpponentId(pick);
            }
        }
        if (!__isFreshClientMode && !__isNewCaseFlow && stateManager.selectedOpponentId && !hasOpponentInStash) {
            await loadSelectedOpponentData();
        }
    } catch (_) { }

    setupEventListeners();

    setupAutocompleteFields();

    await initCapacityCombos();
    await initNameAddressCombos();

    if (!__isFreshClientMode && stateManager.selectedClientId && stateManager.caseDataStash.parties?.clientName) {
        try { await initPartyPoaCombobox(); } catch (_) { }
    }

    if (__isFreshClientMode) {
        clearFreshClientForm(form);
        try { setTimeout(() => clearFreshClientForm(form), 0); } catch (_) { }
    }

    updateClientCasesCount();

    try {
        const isClientLocked = !!stateManager.selectedClientId;
        if (isClientLocked) {
            const header = document.querySelector('#party-details-form .border-2.border-blue-300 h3');
            if (header) {
                const lockEl = document.createElement('i');
                lockEl.className = 'ri-lock-2-fill text-gray-600 ml-2';
                header.appendChild(lockEl);
            }
            const lockIds = ['client-name'];
            lockIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.readOnly = true;
                    el.classList.add('bg-gray-100', 'cursor-not-allowed');
                    el.setAttribute('tabindex', '-1');
                }
            });
            const toggles = ['client-name-toggle'];
            toggles.forEach(id => { const btn = document.getElementById(id); if (btn) btn.style.display = 'none'; });
        }
    } catch (_) { }
}

async function loadSelectedClientData() {
    try {
        const clientData = await getById('clients', stateManager.selectedClientId);
        if (clientData) {
            document.getElementById('client-name').value = clientData.name || '';
            let latestCap = '';
            try {
                const clientCases = await getFromIndex('cases', 'clientId', stateManager.selectedClientId);
                const sorted = Array.isArray(clientCases) ? clientCases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
                for (const cs of sorted) {
                    const v = String(cs && cs.clientCapacity ? cs.clientCapacity : '').trim();
                    if (v) { latestCap = v; break; }
                }
            } catch (_) { }
            document.getElementById('client-capacity').value = latestCap || '';
            document.getElementById('client-address').value = clientData.address || '';
            document.getElementById('client-phone').value = clientData.phone || '';

            const poa = await getLatestPoaForClient(stateManager.selectedClientId);
            if (poa) {
                const currentParties = stateManager.caseDataStash.parties || {};
                stateManager.updateCaseDataStash('parties', { ...currentParties, clientPoaNumber: poa });
                const poaField = document.getElementById('client-poa-number');
                if (poaField && !poaField.value) poaField.value = poa;
            }
            await initPartyPoaCombobox();
        }
    } catch (error) {
        console.error('Error loading client data:', error);
    }
}

async function loadSelectedOpponentData() {
    try {
        const opponentData = await getById('opponents', stateManager.selectedOpponentId);
        if (opponentData) {
            const nameEl = document.getElementById('opponent-name');
            if (nameEl) nameEl.value = opponentData.name || '';

            let latestCap = '';
            try {
                const opponentCases = await getFromIndex('cases', 'opponentId', stateManager.selectedOpponentId);
                const sorted = Array.isArray(opponentCases) ? opponentCases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
                for (const cs of sorted) {
                    const v = String(cs && cs.opponentCapacity ? cs.opponentCapacity : '').trim();
                    if (v) { latestCap = v; break; }
                }
            } catch (_) { }

            const capEl = document.getElementById('opponent-capacity');
            if (capEl) capEl.value = latestCap || '';
            const addrEl = document.getElementById('opponent-address');
            if (addrEl) addrEl.value = opponentData.address || '';
            const phoneEl = document.getElementById('opponent-phone');
            if (phoneEl) phoneEl.value = opponentData.phone || '';
        }
    } catch (error) {
        console.error('Error loading opponent data:', error);
    }
}

function setupEventListeners() {

    document.getElementById('save-parties-btn').addEventListener('click', handleSavePartiesOnly);
    document.getElementById('next-to-case-details-btn').addEventListener('click', handleSaveAndProceedToCaseDetails);

    try {
        const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
        if (isElectron) {
            document.getElementById('create-folder-btn')?.addEventListener('click', handleCreateFolderAndUpload);
            document.getElementById('open-folder-btn')?.addEventListener('click', handleOpenFolder);
        }
    } catch (_) { }

    document.getElementById('client-name').addEventListener('input', () => {

        stateManager.setSelectedClientId(null);

        setTimeout(updateClientCasesCount, 300);
    });
}

function setupAutocompleteFields() { }

async function getCapacityOptions() {
    try {
        const cases = await getAllCases();
        const s = new Set();
        cases.forEach(cs => {
            if (cs && cs.clientCapacity && cs.clientCapacity.trim()) s.add(cs.clientCapacity.trim());
            if (cs && cs.opponentCapacity && cs.opponentCapacity.trim()) s.add(cs.opponentCapacity.trim());
        });
        return Array.from(s).filter(Boolean).sort();
    } catch (e) { return []; }
}

async function initCapacityCombos() {
    try {
        await initDB();
    } catch (e) {
        console.error('Error initializing DB for capacity combos:', e);
        return;
    }
    const options = await getCapacityOptions();
    setupCapacityCombobox('client-capacity', 'client-capacity-dropdown', 'client-capacity-toggle', options);
    setupCapacityCombobox('opponent-capacity', 'opponent-capacity-dropdown', 'opponent-capacity-toggle', options);
}

function setupCapacityCombobox(inputId, dropdownId, toggleId, options) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const toggle = document.getElementById(toggleId);
    if (!input || !dropdown) return;
    const container = input.closest('.autocomplete-container') || document;
    const setVals = new Set(options || []);
    function toList() { return Array.from(setVals).sort(); }
    function show(list) {
        dropdown.innerHTML = list.map(v => `<div class="autocomplete-item">${v}</div>`).join('');
        dropdown.classList.remove('hidden');
        dropdown.style.top = '';
        dropdown.style.bottom = '';
    }
    function hide() { dropdown.classList.add('hidden'); }
    function ensureCurrentInList() {
        const val = (input.value || '').trim();
        if (val && !setVals.has(val)) {
            setVals.add(val);
        }
    }
    input.addEventListener('input', () => {
        const q = (input.value || '').trim().toLowerCase();
        const filtered = toList().filter(v => v.toLowerCase().includes(q));
        if (q.length >= 1) {
            show(filtered);
        } else {
            hide();
        }
    });
    input.addEventListener('blur', () => {
        ensureCurrentInList();
    });
    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        input.value = item.textContent || '';
        ensureCurrentInList();
        hide();
    });
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown.classList.contains('hidden')) show(toList()); else hide();
        });
    }
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) hide();
    });
}

async function initNameAddressCombos() {
    try {
        await initDB();

        const [clients, opponents, cases] = await Promise.all([getAllClients(), getAllOpponents(), getAllCases()]);
        const clientCapacityById = new Map();
        const opponentCapacityById = new Map();
        (cases || []).forEach(cs => {
            if (cs && cs.clientId != null) {
                const v = String(cs.clientCapacity || '').trim();
                if (v) clientCapacityById.set(cs.clientId, v);
            }
            if (cs && cs.opponentId != null) {
                const v = String(cs.opponentCapacity || '').trim();
                if (v) opponentCapacityById.set(cs.opponentId, v);
            }
        });
        const clientItems = (clients || []).map(c => ({ id: c.id, name: c.name || '', capacity: clientCapacityById.get(c.id) || '', address: c.address || '', phone: c.phone || '' }));
        const opponentItems = (opponents || []).map(o => ({ id: o.id, name: o.name || '', capacity: opponentCapacityById.get(o.id) || '', address: o.address || '', phone: o.phone || '' }));
        const s = new Set();
        (clients || []).forEach(c => { if (c && c.address && c.address.trim()) s.add(c.address.trim()); });
        (opponents || []).forEach(o => { if (o && o.address && o.address.trim()) s.add(o.address.trim()); });
        (cases || []).forEach(cs => {
            if (cs && cs.clientAddress && cs.clientAddress.trim()) s.add(cs.clientAddress.trim());
            if (cs && cs.opponentAddress && cs.opponentAddress.trim()) s.add(cs.opponentAddress.trim());
        });
        const addresses = Array.from(s).filter(Boolean).sort();

        setupOptionsCombobox('client-name', 'client-name-dropdown', 'client-name-toggle', clientItems, i => i.name, async (item) => {
            stateManager.setSelectedClientId(item ? item.id : null);
            document.getElementById('client-capacity').value = item ? item.capacity : '';
            document.getElementById('client-address').value = item ? item.address : '';
            document.getElementById('client-phone').value = item ? item.phone : '';
            updateClientCasesCount();

            if (item && item.id) {
                const poa = await getLatestPoaForClient(item.id);
                if (poa) {
                    const currentParties = stateManager.caseDataStash.parties || {};
                    stateManager.updateCaseDataStash('parties', { ...currentParties, clientPoaNumber: poa });
                    const poaField = document.getElementById('client-poa-number');
                    if (poaField && !poaField.value) poaField.value = poa;
                }
                await initPartyPoaCombobox();
            }
        });
        setupOptionsCombobox('opponent-name', 'opponent-name-dropdown', 'opponent-name-toggle', opponentItems, i => i.name, (item) => {
            stateManager.setSelectedOpponentId(item ? item.id : null);
            document.getElementById('opponent-capacity').value = item ? item.capacity : '';
            document.getElementById('opponent-address').value = item ? item.address : '';
            document.getElementById('opponent-phone').value = item ? item.phone : '';
        });
        setupOptionsCombobox('client-address', 'client-address-dropdown', 'client-address-toggle', addresses, v => v, null);
        setupOptionsCombobox('opponent-address', 'opponent-address-dropdown', 'opponent-address-toggle', addresses, v => v, null);
    } catch (e) {
        console.error('Error initializing name/address combos:', e);
    }
}

function setupOptionsCombobox(inputId, dropdownId, toggleId, items, getLabel, onPick, getValue) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const toggle = document.getElementById(toggleId);
    if (!input || !dropdown) return;
    const container = input.closest('.autocomplete-container') || document;
    let currentList = Array.isArray(items) ? items.slice() : [];

    // Keep Tab navigation logical: focus moves between inputs, not dropdown toggle buttons.
    try {
        if (toggle) toggle.tabIndex = -1;
    } catch (_) { }

    function render(list) {
        dropdown.innerHTML = (list || []).map((item, idx) => {
            const disabled = !!(item && typeof item === 'object' && item.disabled === true);
            const extraClass = disabled ? ' opacity-70 cursor-not-allowed' : '';
            const disabledAttr = disabled ? ' data-disabled="1"' : '';
            return `<div class="autocomplete-item${extraClass}" data-index="${idx}"${disabledAttr}>${getLabel(item) || ''}</div>`;
        }).join('');
        dropdown.classList.remove('hidden');
        dropdown.style.top = '';
        dropdown.style.bottom = '';
    }
    function hide() { dropdown.classList.add('hidden'); }
    input.addEventListener('input', () => {
        const q = (input.value || '').trim().toLowerCase();
        const base = Array.isArray(items) ? items : [];
        const filtered = base.filter(item => ((getLabel(item) || '').toLowerCase().includes(q)));
        if (q.length >= 1) {
            currentList = filtered;
            render(currentList);
        } else {
            hide();
        }
    });
    dropdown.addEventListener('click', (e) => {
        const el = e.target.closest('.autocomplete-item');
        if (!el) return;
        try {
            if (el.getAttribute('data-disabled') === '1') return;
        } catch (_) { }
        const idx = parseInt(el.getAttribute('data-index'), 10);
        const item = currentList[idx];
        const val = (typeof getValue === 'function') ? getValue(item) : (getLabel(item) || '');
        input.value = val || '';
        if (typeof onPick === 'function') onPick(item);
        hide();
    });
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown.classList.contains('hidden')) {
                currentList = Array.isArray(items) ? items.slice() : [];
                render(currentList);
            } else {
                hide();
            }
        });
    }
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) hide();
    });
}

function normalizeStatus(value) {
    const s = (value || '').replace(/\uFFFD/g, '').trim();
    if (s === 'متهية') return 'منتهية';
    return s;
}

async function getLastFileNumberByYearMap() {
    try {
        const raw = await getSetting('lastFileNumberByYear');
        if (!raw) return {};
        if (typeof raw === 'object') return raw || {};
        const parsed = JSON.parse(String(raw));
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (_) {
        return {};
    }
}

async function setLastFileNumberByYearMap(map) {
    try {
        await setSetting('lastFileNumberByYear', map || {});
    } catch (_) { }
}

async function bootstrapLastFileNumberByYearFromCases(cases) {
    try {
        const list = Array.isArray(cases) ? cases : [];
        if (list.length === 0) return;
        const currentMap = await getLastFileNumberByYearMap();
        let changed = false;
        for (const c of list) {
            const y = String(c && c.caseYear != null ? c.caseYear : '').trim();
            const n = parseFileNumberToInt(c && c.fileNumber != null ? c.fileNumber : null);
            if (!y || !n || n < 1) continue;
            const existing = parseFileNumberToInt(currentMap[y]);
            if (!existing || n > existing) {
                currentMap[y] = n;
                changed = true;
            }
        }
        if (changed) {
            await setLastFileNumberByYearMap(currentMap);
        }
    } catch (_) { }
}

function parseFileNumberToInt(v) {
    const n = parseInt(String(v ?? '').trim(), 10);
    return Number.isFinite(n) ? n : null;
}

async function getNextFileNumberForYear(caseYear) {
    const y = String(caseYear ?? '').trim();
    if (!y) return '1';
    const map = await getLastFileNumberByYearMap();
    const last = parseFileNumberToInt(map[y]);
    if (!last || last < 1) return '1';
    return String(last + 1);
}

async function maybeUpdateLastFileNumberForYear(caseYear, fileNumber) {
    const y = String(caseYear ?? '').trim();
    const n = parseFileNumberToInt(fileNumber);
    if (!y || !n || n < 1) return;
    try {
        const map = await getLastFileNumberByYearMap();
        const last = parseFileNumberToInt(map[y]);
        if (!last || n > last) {
            map[y] = n;
            await setLastFileNumberByYearMap(map);
        }
    } catch (_) { }
}

async function initCaseDetailsCombos() {
    try {
        const [cases, courts] = await Promise.all([getAllCases(), getCourtNames()]);

        try { await bootstrapLastFileNumberByYearFromCases(cases); } catch (_) { }

        const cn = [...new Set((cases || []).map(c => c.circuitNumber).filter(v => v && v.trim()))].sort();
        const ct = [...new Set((cases || []).map(c => c.caseType).filter(v => v && v.trim()))].sort();
        const cs = [...new Set((cases || []).map(c => c.subject).filter(v => v && v.trim()))].sort();

        // حصر حالات القضية في قيمتين فقط كما طلبت: متداولة، منتهية
        const st = ['متداولة', 'منتهية'];
        setupOptionsCombobox('court', 'court-dropdown', 'court-toggle', courts || [], v => v, null);
        setupOptionsCombobox('circuitNumber', 'circuitNumber-dropdown', 'circuitNumber-toggle', cn, v => v, null);
        setupOptionsCombobox('caseType', 'caseType-dropdown', 'caseType-toggle', ct, v => v, null);
        setupOptionsCombobox('subject', 'subject-dropdown', 'subject-toggle', cs, v => v, null);
        setupOptionsCombobox('caseStatus', 'caseStatus-dropdown', 'caseStatus-toggle', st, v => v, null);
        const __currentCaseIdForFileNumber = (typeof stateManager !== 'undefined' && stateManager && stateManager.currentCaseId) ? stateManager.currentCaseId : null;
        const fileNumbersByYear = new Map(); // year => Map(fileNumber => Set(ids))
        try {
            (cases || []).forEach(c => {
                const y = String((c && c.caseYear != null) ? c.caseYear : '').trim();
                const fn = String((c && c.fileNumber != null) ? c.fileNumber : '').trim();
                if (!y || !fn) return;
                let perYear = fileNumbersByYear.get(y);
                if (!perYear) {
                    perYear = new Map();
                    fileNumbersByYear.set(y, perYear);
                }
                let ids = perYear.get(fn);
                if (!ids) {
                    ids = new Set();
                    perYear.set(fn, ids);
                }
                if (c && c.id != null) ids.add(c.id);
                else ids.add(`__noid_${Math.random()}`);
            });
        } catch (_) { }

        function isFileNumberDuplicateInYear(fileNumber, caseYear) {
            const y = String(caseYear ?? '').trim();
            const fn = String(fileNumber ?? '').trim();
            if (!y || !fn) return false;
            const perYear = fileNumbersByYear.get(y);
            if (!perYear) return false;
            const ids = perYear.get(fn);
            if (!ids || ids.size === 0) return false;
            if (__currentCaseIdForFileNumber == null) return true;
            return (ids.size > 1) || !ids.has(__currentCaseIdForFileNumber);
        }

        const fnInput = document.getElementById('fileNumber');
        const yearInput = document.getElementById('caseYear');
        const suggestions = [{ value: '', label: '<span class="text-xs text-black">ادخل سنة الدعوى اولا</span>', disabled: true }];

        try {
            const initialYearVal = yearInput ? String(yearInput.value || '').trim() : '';
            if (initialYearVal) {
                const next = await getNextFileNumberForYear(initialYearVal);
                suggestions[0] = { value: next, label: `${next} لسنه ${initialYearVal}` };
            }
        } catch (_) { }

        if (yearInput) {
            yearInput.addEventListener('input', async () => {
                try {
                    const y = String(yearInput.value || '').trim();
                    if (!y) {
                        suggestions[0] = { value: '', label: '<span class="text-xs text-gray-500">ادخل سنة الدعوى اولا</span>', disabled: true };
                        return;
                    }
                    const next = await getNextFileNumberForYear(y);
                    suggestions[0] = { value: next, label: `${next} لسنه ${y}` };
                } catch (_) { }
            });
        }

        setupOptionsCombobox(
            'fileNumber',
            'fileNumber-dropdown',
            'fileNumber-toggle',
            suggestions,
            (v) => (v && typeof v === 'object' ? (v.label || '') : String(v || '')),
            (picked) => {
            try {
                const pv = (picked && typeof picked === 'object') ? picked.value : picked;
                const y = yearInput ? String(yearInput.value || '').trim() : '';
                if (pv && y && isFileNumberDuplicateInYear(pv, y)) {
                    if (typeof showToast === 'function') showToast('تنبيه: رقم الملف موجود بالفعل. تأكد من عدم التكرار.', 'info');
                }
            } catch (_) { }
            },
            (v) => (v && typeof v === 'object' ? (v.value || '') : String(v || ''))
        );

        // Live duplicate warning on typing
        try {
            if (fnInput) {
                let __lastFNWarn = '';
                fnInput.addEventListener('input', () => {
                    const v = String(fnInput.value || '').trim();
                    const y = yearInput ? String(yearInput.value || '').trim() : '';
                    if (v && y && isFileNumberDuplicateInYear(v, y) && v !== __lastFNWarn) {
                        __lastFNWarn = v;
                        if (typeof showToast === 'function') showToast('تنبيه: رقم الملف موجود بالفعل. تأكد من عدم التكرار.', 'info');
                    }
                });
            }
        } catch (_) { }
    } catch (e) { }
}

const hideAllDropdowns = () => {
    document.querySelectorAll('.autocomplete-results').forEach(el => el.classList.add('hidden'));
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-container')) hideAllDropdowns();
});

document.addEventListener('focusin', (e) => {
    if (!e.target.closest('.autocomplete-container')) hideAllDropdowns();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Tab') hideAllDropdowns();
});

function setupBackButton() {
    const backButton = document.getElementById('back-to-main');
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            const embedded = document.getElementById('embedded-content');
            const hasEmbeddedView = embedded && embedded.childElementCount > 0;
            const caseForm = embedded ? embedded.querySelector('#case-details-form') : null;
            const sessionForm = embedded ? embedded.querySelector('#session-form') : null;
            const sessionList = embedded ? embedded.querySelector('#session-list-container') : null;

            if (sessionForm || sessionList) {
                e.preventDefault();
                if (typeof displayCaseDetailsForm === 'function') {
                    navigateTo(displayCaseDetailsForm);
                    const titleEl = document.getElementById('page-title');
                    if (titleEl) titleEl.textContent = 'إدخال بيانات الدعوى';
                } else {
                    if (embedded) embedded.innerHTML = '';
                    const titleEl = document.getElementById('page-title');
                    if (titleEl) titleEl.textContent = 'إدخال بيانات الدعوى';
                }
                return;
            }

            if (caseForm) {
                e.preventDefault();

                // في وضع تعديل الدعوى: الرجوع يرجع للبحث ويفتح نفس الموكل (بدون شاشة بيضاء)
                if (__isEditCaseMode) {
                    try {
                        const goBackTo = sessionStorage.getItem('returnToPage') || '';
                        const clientId = parseInt(sessionStorage.getItem('returnToClientId') || '0', 10);
                        if ((goBackTo === 'search' || goBackTo === 'clientView') && clientId) {
                            sessionStorage.removeItem('returnToPage');
                            sessionStorage.removeItem('returnToClientId');
                            sessionStorage.setItem('openClientDetailsOnSearch', String(clientId));
                            window.location.href = 'search.html';
                            return;
                        }
                    } catch (_) { }
                    window.location.href = 'search.html';
                    return;
                }

                try {
                    const poaEl = embedded ? embedded.querySelector('#poaNumber') : null;
                    const notesEl = embedded ? embedded.querySelector('#notes') : null;
                    const partyPoaEl = document.getElementById('client-poa-number');
                    const partyNotesEl = document.getElementById('case-notes');
                    if (poaEl && partyPoaEl && poaEl.value) partyPoaEl.value = poaEl.value;
                    if (notesEl && partyNotesEl && notesEl.value) partyNotesEl.value = notesEl.value;
                } catch (_) { }
                const partyContainer = document.getElementById('party-form-container');
                if (partyContainer) partyContainer.classList.remove('hidden');
                if (embedded) embedded.innerHTML = '';
                const pageTitleEl = document.getElementById('page-title');
                if (pageTitleEl) pageTitleEl.textContent = 'إدخال بيانات الأطراف';
                return;
            }

            if (hasEmbeddedView) {
                e.preventDefault();
                if (embedded) embedded.innerHTML = '';
                return;
            }

            try {
                const goBackTo = sessionStorage.getItem('returnToPage') || '';
                let clientId = parseInt(sessionStorage.getItem('returnToClientId') || '0', 10);
                if (!clientId) {
                    try {
                        const fromClientView = parseInt(sessionStorage.getItem('clientViewSelectedClientId') || '0', 10);
                        if (fromClientView) clientId = fromClientView;
                    } catch (_) { }
                }
                if (!clientId) {
                    try {
                        const sid = parseInt(String(stateManager && stateManager.selectedClientId ? stateManager.selectedClientId : '0') || '0', 10);
                        if (sid) clientId = sid;
                    } catch (_) { }
                }
                if (goBackTo === 'search' && clientId) {
                    e.preventDefault();
                    sessionStorage.removeItem('returnToPage');
                    sessionStorage.removeItem('returnToClientId');
                    sessionStorage.setItem('openClientDetailsOnSearch', String(clientId));
                    window.location.href = 'search.html';
                    return;
                }
                if (goBackTo === 'clientView' && clientId) {
                    e.preventDefault();
                    sessionStorage.removeItem('returnToPage');
                    sessionStorage.removeItem('returnToClientId');
                    sessionStorage.setItem('openClientDetailsOnSearch', String(clientId));
                    window.location.href = 'search.html';
                    return;
                }
            } catch (_) { }

            // Fallback: اشتغل بس لو المستخدم كان جاي من (بحث/تفاصيل موكل).
            // لو جاي من الرئيسية (موكل جديد) ماينفعش نرجعه لتفاصيل موكل بسبب بواقي قديمة.
            try {
                const origin = sessionStorage.getItem('returnToPage') || '';
                if (origin === 'search' || origin === 'clientView') {
                    let cid = parseInt(sessionStorage.getItem('openClientDetailsOnSearch') || '0', 10);
                    if (!cid) {
                        cid = parseInt(sessionStorage.getItem('clientViewSelectedClientId') || '0', 10);
                    }
                    if (!cid) {
                        cid = parseInt(String(stateManager && stateManager.selectedClientId ? stateManager.selectedClientId : '0') || '0', 10);
                    }
                    if (cid) {
                        e.preventDefault();
                        sessionStorage.setItem('openClientDetailsOnSearch', String(cid));
                        window.location.href = 'search.html';
                        return;
                    }
                }
            } catch (_) { }

            window.location.href = 'index.html';
        });
    }
}

function setupModalClose() {
    const modal = document.getElementById('modal');
    const closeButton = document.getElementById('modal-close-button');

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                navigateBack();
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', navigateBack);
    }
}

async function handleSavePartiesOnly(e) {
    e.preventDefault();
    const btn = document.getElementById('save-parties-btn');
    if (btn && btn.disabled) return;
    const form = document.getElementById('party-details-form');
    const formData = new FormData(form);
    const partyData = Object.fromEntries(formData.entries());

    if (!partyData.clientName || !partyData.clientName.trim()) {
        showToast('يجب إدخال اسم الموكل قبل الحفظ', 'error');
        document.getElementById('client-name').focus();
        return;
    }

    if (!partyData.opponentName || !partyData.opponentName.trim()) {
        showToast('يجب إدخال اسم الخصم قبل الحفظ', 'error');
        document.getElementById('opponent-name').focus();
        return;
    }

    if (btn) btn.disabled = true;

    stateManager.updateCaseDataStash('parties', partyData);

    try {
        const { clientId, opponentId } = await saveParties(partyData);
        stateManager.setSelectedClientId(clientId);
        stateManager.setSelectedOpponentId(opponentId);

        try {
            const existingCaseId = stateManager.currentCaseId;
            const hasAnyCapacity = !!(String(partyData.clientCapacity || '').trim() || String(partyData.opponentCapacity || '').trim());
            const hasPoaOrNotes = !!(String(partyData.clientPoaNumber || '').trim() || String(partyData.caseNotes || '').trim());
            if (existingCaseId) {
                await updateRecord('cases', existingCaseId, {
                    clientId,
                    opponentId,
                    clientCapacity: partyData.clientCapacity,
                    opponentCapacity: partyData.opponentCapacity,
                    poaNumber: partyData.clientPoaNumber,
                    notes: partyData.caseNotes
                });
            } else {
                if (hasAnyCapacity || hasPoaOrNotes) {
                    const stubCase = {
                        clientId,
                        opponentId,
                        clientCapacity: partyData.clientCapacity,
                        opponentCapacity: partyData.opponentCapacity,
                        poaNumber: partyData.clientPoaNumber,
                        notes: partyData.caseNotes
                    };
                    const newCaseId = await addCase(stubCase);
                    stateManager.setCurrentCaseId(newCaseId);
                }
            }
        } catch (_) { }

        showToast('تم حفظ بيانات الأطراف بنجاح.');
    } catch (error) {
        showToast('حدث خطأ أثناء حفظ بيانات الأطراف.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function handleSaveAndProceedToCaseDetails(e) {
    e.preventDefault();
    const btn = document.getElementById('next-to-case-details-btn');
    if (btn && btn.disabled) return;
    const form = document.getElementById('party-details-form');
    const formData = new FormData(form);
    const partyData = Object.fromEntries(formData.entries());


    if (!partyData.clientName || !partyData.clientName.trim()) {
        showToast('يجب إدخال اسم الموكل قبل المتابعة', 'error');
        document.getElementById('client-name').focus();
        return;
    }

    if (!partyData.opponentName || !partyData.opponentName.trim()) {
        showToast('يجب إدخال اسم الخصم قبل المتابعة', 'error');
        document.getElementById('opponent-name').focus();
        return;
    }

    if (btn) btn.disabled = true;

    stateManager.updateCaseDataStash('parties', partyData);

    try {
        const { clientId, opponentId } = await saveParties(partyData);
        stateManager.setSelectedClientId(clientId);
        stateManager.setSelectedOpponentId(opponentId);

        try {
            const existingCaseId = stateManager.currentCaseId;
            const hasAnyCapacity = !!(String(partyData.clientCapacity || '').trim() || String(partyData.opponentCapacity || '').trim());
            const hasPoaOrNotes = !!(String(partyData.clientPoaNumber || '').trim() || String(partyData.caseNotes || '').trim());
            if (existingCaseId) {
                await updateRecord('cases', existingCaseId, {
                    clientId,
                    opponentId,
                    clientCapacity: partyData.clientCapacity,
                    opponentCapacity: partyData.opponentCapacity,
                    poaNumber: partyData.clientPoaNumber,
                    notes: partyData.caseNotes
                });
            } else {
                if (hasAnyCapacity || hasPoaOrNotes) {
                    const stubCase = {
                        clientId,
                        opponentId,
                        clientCapacity: partyData.clientCapacity,
                        opponentCapacity: partyData.opponentCapacity,
                        poaNumber: partyData.clientPoaNumber,
                        notes: partyData.caseNotes
                    };
                    const newCaseId = await addCase(stubCase);
                    stateManager.setCurrentCaseId(newCaseId);
                }
            }
        } catch (_) { }


        showToast('تم حفظ بيانات الأطراف تلقائياً.');


        const partyContainer = document.getElementById('party-form-container');
        if (partyContainer) partyContainer.classList.add('hidden');
        displayCaseDetailsForm();

    } catch (error) {
        showToast('حدث خطأ أثناء حفظ بيانات الأطراف.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function saveParties(partyData) {
    let clientId = stateManager.selectedClientId;
    let opponentId = stateManager.selectedOpponentId;

    if (!clientId) {
        const clientData = {
            name: partyData.clientName,
            address: partyData.clientAddress,
            phone: partyData.clientPhone
        };
        clientId = await addClient(clientData);
    } else {
        await updateRecord('clients', clientId, {
            name: partyData.clientName,
            address: partyData.clientAddress,
            phone: partyData.clientPhone
        });
    }

    if (!opponentId) {
        const opponentData = {
            name: partyData.opponentName,
            address: partyData.opponentAddress,
            phone: partyData.opponentPhone
        };
        opponentId = await addOpponent(opponentData);
    } else {
        await updateRecord('opponents', opponentId, {
            name: partyData.opponentName,
            address: partyData.opponentAddress,
            phone: partyData.opponentPhone
        });
    }


    let clientOpponentRelations = JSON.parse(localStorage.getItem('clientOpponentRelations') || '{}');
    if (!clientOpponentRelations[clientId]) {
        clientOpponentRelations[clientId] = [];
    }
    if (!clientOpponentRelations[clientId].includes(opponentId)) {
        clientOpponentRelations[clientId].push(opponentId);
    }
    localStorage.setItem('clientOpponentRelations', JSON.stringify(clientOpponentRelations));

    try {
        if (stateManager.currentCaseId) {
            await updateRecord('cases', stateManager.currentCaseId, {
                clientId,
                opponentId,
                clientCapacity: partyData.clientCapacity,
                opponentCapacity: partyData.opponentCapacity
            });
        }
    } catch (_) { }

    return { clientId, opponentId };
}

async function updateClientCasesCount() {
    try {
        const clientNameInput = document.getElementById('client-name');
        const countElement = document.getElementById('client-cases-count');

        if (!clientNameInput || !countElement) return;

        const clientName = clientNameInput.value.trim();
        if (!clientName) {
            countElement.textContent = '0';
            return;
        }

        let clientId = stateManager.selectedClientId;
        if (!clientId) {
            try {
                const matches = await getClientByName(clientName);
                if (Array.isArray(matches) && matches.length > 0) {
                    clientId = matches[0].id;
                }
            } catch (_) { }
        }

        if (clientId) {
            const clientCases = await getFromIndex('cases', 'clientId', clientId);
            countElement.textContent = String((clientCases || []).length);
            return;
        }

        countElement.textContent = '0';
    } catch (error) {
        console.error('Error updating client cases count:', error);
        const countElement = document.getElementById('client-cases-count');
        if (countElement) {
            countElement.textContent = '0';
        }
    }
}


async function handleCreateFolderAndUpload() {
    const clientNameInput = document.getElementById('client-name');
    const clientName = clientNameInput ? clientNameInput.value.trim() : '';

    if (!clientName) {
        showToast('يجب إدخال اسم الموكل أولاً', 'error');
        if (clientNameInput) {
            clientNameInput.focus();
        }
        return;
    }


    if (!window.electronAPI || !window.electronAPI.createClientFolder) {
        showToast('هذه الميزة متاحة فقط في تطبيق سطح المكتب', 'error');
        return;
    }

    const doAttach = async () => {
        try {
            let attachMode = 'copy';
            try {
                const savedMode = await getSetting('attachMode');
                if (savedMode === 'move' || savedMode === 'copy') {
                    attachMode = savedMode;
                }
            } catch (e) {
                attachMode = 'copy';
            }
            const result = await window.electronAPI.createClientFolder(clientName, attachMode);
            if (result.success) {
                if (result.filesCount > 0) {
                    showToast(`✓ تم إرفاق الملفات`, 'success');
                } else {
                    showToast(`✓ تم إنشاء المجلد`, 'success');
                }
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            showToast('حدث خطأ في إنشاء المجلد', 'error');
        }
    };

    try {
        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning(
                            { path: chk.path, desktop: chk.desktop },
                            { onContinue: () => { try { doAttach(); } catch (_) { } } }
                        );
                    }
                } catch (_) { }
                return;
            }
        }
    } catch (_) { }

    await doAttach();
}

async function handleOpenFolder() {
    const clientNameInput = document.getElementById('client-name');
    const clientName = clientNameInput ? clientNameInput.value.trim() : '';

    if (!clientName) {
        showToast('يجب إدخال اسم الموكل أولاً', 'error');
        if (clientNameInput) {
            clientNameInput.focus();
        }
        return;
    }


    if (!window.electronAPI || !window.electronAPI.openClientFolder) {
        showToast('هذه الميزة متاحة فقط في تطبيق سطح المكتب', 'error');
        return;
    }

    try {
        const result = await window.electronAPI.openClientFolder(clientName);
        if (result.success) {
            showToast('✓ المجلد مفتوح', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error opening folder:', error);
        showToast('حدث خطأ في فتح المجلد', 'error');
    }
}


function setHeaderAsBack() {
    const btn = document.getElementById('back-to-main');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    if (icon) {
        icon.className = 'ri-arrow-go-back-line text-blue-600 text-lg';
    }
    if (span) span.textContent = 'رجوع';
}
function setHeaderAsHome() {
    const btn = document.getElementById('back-to-main');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    if (icon) {
        icon.className = 'ri-home-5-line text-blue-600 text-lg';
    }
    if (span) span.textContent = 'الرئيسيه';
}


async function displayCaseDetailsForm() {

    const embedded = document.getElementById('embedded-content');
    const targetContainer = embedded || document.getElementById('modal-content');
    if (targetContainer) {
        const titleEl = document.getElementById('modal-title');
        if (titleEl) titleEl.textContent = '';
        targetContainer.classList.remove('search-modal-content');
        if (typeof setHeaderAsBack === 'function') setHeaderAsBack();
    }
    const pageHeaderTitle = document.getElementById('page-title');
    if (pageHeaderTitle) pageHeaderTitle.textContent = 'بيانات الدعوى الجديدة';
    setHeaderAsBack();
    if (!targetContainer) return;
    targetContainer.innerHTML = `
        <div class="bg-white rounded-xl p-4 md:p-6 shadow-lg border-2 border-blue-300 max-w-4xl mx-auto case-details--mobile-tight md:border-0 md:bg-transparent md:shadow-none">
            <form id="case-details-form" class="space-y-4" novalidate>
                <div class="p-4 bg-blue-50 rounded-xl shadow-md">
                    <div class="space-y-4">
                        
                        <div>
                            <label for="court" class="block text-sm font-bold text-gray-700 text-right mb-1">المحكمة</label>
                            <div class="relative">
                                <input type="text" id="court" name="court" placeholder="مثال: محكمة القاهرة الابتدائية" class="w-full h-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right transition-colors font-semibold text-gray-800">
                                <button type="button" id="court-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                <div id="court-dropdown" class="autocomplete-results hidden"></div>
                            </div>
                        </div>

                        <div>
                            <label for="circuitNumber" class="block text-sm font-bold text-gray-700 text-right mb-1">رقم الدائرة</label>
                            <div class="relative">
                                <input type="text" id="circuitNumber" name="circuitNumber" placeholder="مثال: الدائرة الأولى" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800">
                                <button type="button" id="circuitNumber-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                <div id="circuitNumber-dropdown" class="autocomplete-results hidden"></div>
                            </div>
                        </div>

                        <div>
                            <label for="caseType" class="block text-sm font-bold text-gray-700 text-right mb-1">نوع الدعوى</label>
                            <div class="relative">
                                <input type="text" id="caseType" name="caseType" placeholder="مثال: تجارية - مدنية - جنائية" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800">
                                <button type="button" id="caseType-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                <div id="caseType-dropdown" class="autocomplete-results hidden"></div>
                            </div>
                        </div>

                        <div>
                            <label for="subject" class="block text-sm font-bold text-gray-700 text-right mb-1">موضوع الدعوى</label>
                            <div class="relative">
                                <input type="text" id="subject" name="subject" placeholder="اكتب موضوع الدعوى باختصار..." class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800">
                                <button type="button" id="subject-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                <div id="subject-dropdown" class="autocomplete-results hidden"></div>
                            </div>
                        </div>

                        <div>
                            <label for="caseNumber" class="block text-sm font-bold text-gray-700 text-right mb-1">رقم الدعوى</label>
                            <div>
                                <input type="text" id="caseNumber" name="caseNumber" placeholder="مثال: 123" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800">
                                <p id="case-number-error" class="text-red-500 text-xs text-right mt-1 hidden">هذا الرقم مستخدم بالفعل لهذه السنة.</p>
                            </div>
                        </div>

                        <div><label for="caseYear" class="block text-sm font-bold text-gray-700 text-right mb-1">سنة الدعوى</label><input type="text" id="caseYear" name="caseYear" placeholder="مثال: 2025" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800"></div>
                        <div><label for="appealNumber" class="block text-sm font-bold text-gray-700 text-right mb-1">رقم الاستئناف</label><input type="text" id="appealNumber" name="appealNumber" placeholder="رقم الاستئناف إن وجد" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800"></div>
                        <div><label for="appealYear" class="block text-sm font-bold text-gray-700 text-right mb-1">سنة الاستئناف</label><input type="text" id="appealYear" name="appealYear" placeholder="مثال: 2025" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800"></div>
                        <div><label for="cassationNumber" class="block text-sm font-bold text-gray-700 text-right mb-1">رقم النقض</label><input type="text" id="cassationNumber" name="cassationNumber" placeholder="رقم النقض إن وجد" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800"></div>
                        <div><label for="cassationYear" class="block text-sm font-bold text-gray-700 text-right mb-1">سنة النقض</label><input type="text" id="cassationYear" name="cassationYear" placeholder="مثال: 2025" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800"></div>
                        <div>
                            <label for="fileNumber" class="block text-sm font-bold text-gray-700 text-right mb-1">رقم الملف</label>
                            <div class="relative autocomplete-container">
                                <input type="text" id="fileNumber" name="fileNumber" placeholder="ادخل او اختر رقم الملف" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800">
                                <button type="button" id="fileNumber-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                <div id="fileNumber-dropdown" class="autocomplete-results hidden"></div>
                            </div>
                        </div>
                        <div>
                            <label for="poaNumber" class="block text-sm font-bold text-gray-700 text-right mb-1">رقم التوكيل</label>
                            <div class="relative">
                                <input type="text" id="poaNumber" name="poaNumber" placeholder="رقم التوكيل الرسمي" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800">
                                <button type="button" id="poaNumber-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                <div id="poaNumber-dropdown" class="autocomplete-results hidden"></div>
                            </div>
                        </div>
                        
                        <div>
                            <label for="caseStatus" class="block text-sm font-bold text-gray-700 text-right mb-1">حالة القضية</label>
                            <div class="relative">
                                <input type="text" id="caseStatus" name="caseStatus" placeholder="مثال: جاري النظر - محكوم فيها" class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-bold transition-colors">
                                <button type="button" id="caseStatus-toggle" tabindex="-1" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                <div id="caseStatus-dropdown" class="autocomplete-results hidden"></div>
                            </div>
                        </div>
                        
                        <div>
                            <label for="notes" class="block text-sm font-bold text-gray-700 text-right mb-1">ملاحظات</label>
                            <input type="text" id="notes" name="notes" placeholder="أضف أي ملاحظات..." class="w-full px-3 py-3 bg-white border-2 border-gray-400 rounded-lg placeholder-gray-400 focus:ring-0 focus:border-blue-700 text-right font-semibold text-gray-800">
                        </div>
                    </div>
                    
                    <!-- Actions Row: Save and proceed to sessions -->
                    <div class="flex flex-row flex-wrap items-center justify-center gap-2 pt-4">
                        <button type="button" id="save-case-only-btn" class="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-base font-semibold">
                            <i class="ri-save-3-line"></i>
                            <span>حفظ</span>
                        </button>
                        <button type="button" id="manage-sessions-btn" class="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-base font-semibold">
                            <i class="ri-arrow-left-line"></i>
                            <span>متابعة للجلسات</span>
                            <span class="text-xs opacity-80">(<span id="case-session-count">0</span>)</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;

    const form = (typeof targetContainer !== 'undefined' ? targetContainer : document).querySelector('#case-details-form');


    if (stateManager.currentCaseId) {
        const existingCase = await getById('cases', stateManager.currentCaseId);
        if (existingCase) {
            for (const [key, value] of Object.entries(existingCase)) {
                if (form.elements[key]) {
                    form.elements[key].value = value || '';
                }
            }
        }
    } else if (stateManager.caseDataStash.caseDetails) {

        for (const [key, value] of Object.entries(stateManager.caseDataStash.caseDetails)) {
            if (form.elements[key]) {
                form.elements[key].value = value;
            }
        }
    }

    // لو حقل حالة القضية فارغ عند فتح النافذة، املاه تلقائياً بالقيمة الافتراضية "متداولة"
    try {
        const statusInput = document.getElementById('caseStatus');
        if (statusInput && !String(statusInput.value || '').trim()) {
            statusInput.value = 'متداولة';
        }
    } catch (_) { }


    if (stateManager.caseDataStash.parties && stateManager.caseDataStash.parties.clientPoaNumber) {
        const poaNumberField = document.getElementById('poaNumber');
        if (poaNumberField && !poaNumberField.value) {
            poaNumberField.value = stateManager.caseDataStash.parties.clientPoaNumber;
        }
    }

    if (stateManager.caseDataStash.parties && stateManager.caseDataStash.parties.caseNotes) {
        const notesField = document.getElementById('notes');
        if (notesField && !notesField.value) {
            notesField.value = stateManager.caseDataStash.parties.caseNotes;
        }
    }


    let sessions = [];
    if (stateManager.currentCaseId) {
        sessions = await getFromIndex('sessions', 'caseId', stateManager.currentCaseId);
    }
    const caseSessionCountEl = document.getElementById('case-session-count'); if (caseSessionCountEl) caseSessionCountEl.textContent = sessions.length;

    const _container = (typeof targetContainer !== 'undefined' ? targetContainer : document);

    async function saveCaseDetailsCore() {
        const form = document.getElementById('case-details-form');
        const formData = new FormData(form);
        const caseData = Object.fromEntries(formData.entries());

        try {
            const partyFormEl = document.getElementById('party-details-form');
            let partiesData = null;
            if (partyFormEl) {
                try {
                    const pf = new FormData(partyFormEl);
                    partiesData = Object.fromEntries(pf.entries());
                } catch (_) { partiesData = null; }
            }
            const draft = {
                parties: partiesData || (stateManager.caseDataStash ? stateManager.caseDataStash.parties : null),
                caseDetails: caseData || (stateManager.caseDataStash ? stateManager.caseDataStash.caseDetails : null)
            };
            sessionStorage.setItem('new_draft_case_flow', JSON.stringify(draft));
            if (stateManager && stateManager.currentCaseId) {
                sessionStorage.setItem('currentCaseId', String(stateManager.currentCaseId));
            }
        } catch (_) { }

        const hasAnyData = Object.values(caseData).some(value => value && value.trim() !== '');
        if (!hasAnyData) {
            showToast('يجب إدخال بيانات في أي حقل على الأقل قبل المتابعة', 'error');
            return false;
        }

        stateManager.updateCaseDataStash('caseDetails', caseData);

        const caseNumber = caseData.caseNumber?.trim();
        const caseYear = caseData.caseYear?.trim();
        const caseType = caseData.caseType?.trim();
        const caseKey = (caseNumber && caseYear) ? (caseType ? `${caseNumber}__${caseYear}__${caseType}` : `${caseNumber}__${caseYear}`) : '';

        try {
            if (stateManager.currentCaseId) {
                if (caseNumber && caseYear) {
                    const matchingCases = await getFromIndex('cases', 'caseNumberYearKey', caseKey);
                    if (matchingCases.length > 0 && matchingCases[0].id !== stateManager.currentCaseId) {
                        showToast('خطأ: قضية بنفس الرقم والسنة موجودة بالفعل.');
                        return false;
                    }
                }
                try {
                    const fileNumber = String(caseData.fileNumber || '').trim();
                    if (fileNumber && caseYear) {
                        const allCases = await getAllCases();
                        const dup = allCases.some(c => c.id !== stateManager.currentCaseId && String(c.caseYear || '').trim() === String(caseYear || '').trim() && String(c.fileNumber || '').trim() === fileNumber);
                        if (dup) {
                            showToast('تنبيه: رقم الملف موجود بالفعل. تأكد من عدم التكرار.', 'info');
                        }
                    }
                } catch (_) { }
                const existingCase = await getById('cases', stateManager.currentCaseId);
                const updatedRecord = { ...existingCase, ...caseData };
                await updateRecord('cases', stateManager.currentCaseId, updatedRecord);
                try { await maybeUpdateLastFileNumberForYear(caseYear, caseData.fileNumber); } catch (_) { }
                showToast('تم حفظ بيانات الدعوى بنجاح.');
                await updateCountersInHeader();
            } else {
                if (caseNumber && caseYear) {
                    const existing = await getFromIndex('cases', 'caseNumberYearKey', caseKey);
                    if (existing.length > 0) {
                        showToast('خطأ: قضية بنفس الرقم والسنة موجودة بالفعل.');
                        return false;
                    }
                }
                try {
                    const fileNumber = String(caseData.fileNumber || '').trim();
                    if (fileNumber && caseYear) {
                        const allCases = await getAllCases();
                        const dup = allCases.some(c => String(c.caseYear || '').trim() === String(caseYear || '').trim() && String(c.fileNumber || '').trim() === fileNumber);
                        if (dup) {
                            showToast('تنبيه: رقم الملف موجود بالفعل. تأكد من عدم التكرار.', 'info');
                        }
                    }
                } catch (_) { }
                const fullCaseData = {
                    ...caseData,
                    clientId: stateManager.selectedClientId,
                    opponentId: stateManager.selectedOpponentId,
                    clientCapacity: (stateManager.caseDataStash.parties || {}).clientCapacity,
                    opponentCapacity: (stateManager.caseDataStash.parties || {}).opponentCapacity
                };
                const caseId = await addCase(fullCaseData);
                stateManager.setCurrentCaseId(caseId);
                try { await maybeUpdateLastFileNumberForYear(caseYear, caseData.fileNumber); } catch (_) { }
                showToast('تم حفظ بيانات الدعوى بنجاح.');
                await updateCountersInHeader();
            }
        } catch (error) {
            if (error.message && error.message.includes('ConstraintError')) {
                showToast('خطأ: قضية بنفس الرقم والسنة موجودة بالفعل.');
            } else {
                showToast('حدث خطأ أثناء حفظ بيانات الدعوى.');
            }
            return false;
        }

        return true;
    }

    const saveCaseOnlyBtn = _container.querySelector('#save-case-only-btn');
    if (saveCaseOnlyBtn) saveCaseOnlyBtn.addEventListener('click', async () => {
        await saveCaseDetailsCore();
    });

    const manageBtn = _container.querySelector('#manage-sessions-btn');
    if (manageBtn) manageBtn.addEventListener('click', async () => {
        const saved = await saveCaseDetailsCore();
        if (!saved) return;
        try {
            sessionStorage.setItem('returnToPage', 'new');
        } catch (_) { }
        window.location.href = `session-edit.html?caseId=${stateManager.currentCaseId}`;
    });


    if (stateManager.currentCaseId) {
        const caseForm = (typeof targetContainer !== 'undefined' ? targetContainer : document).querySelector('#case-details-form');
        if (caseForm) caseForm.addEventListener('submit', handleUpdateCaseDetails);
    } else {
        const caseForm = (typeof targetContainer !== 'undefined' ? targetContainer : document).querySelector('#case-details-form');
        if (caseForm) caseForm.addEventListener('submit', handleSaveCaseDetails);
    }

    const caseNumberInput = document.getElementById('caseNumber');
    const caseYearInput = document.getElementById('caseYear');
    const caseNumberError = document.getElementById('case-number-error');
    caseNumberInput.addEventListener('input', () => validateCaseNumber(caseNumberInput, caseYearInput, caseNumberError));
    caseYearInput.addEventListener('input', () => validateCaseNumber(caseNumberInput, caseYearInput, caseNumberError));




    setTimeout(async () => {
        await initCaseDetailsCombos();
        await initPoaCombobox();
    }, 100);
}

async function getCourtNames() {
    try {
        const cases = await getAllCases();
        return [...new Set(cases
            .map(c => c.court)
            .filter(name => name && name.trim() !== '')
        )].sort();
    } catch (error) {
        console.error('خطأ في جلب أسماء المحاكم:', error);
        return [];
    }
}

async function loadCourtsSelect() {
    const courtNames = await getCourtNames();
    const select = document.getElementById('courtSelect');
    if (select) {
        select.innerHTML = `
            <option value="">اختر المحكمة</option>
            <option value="__custom__">إدخال يدوي...</option>
        `;
        courtNames.forEach(courtName => {
            const option = document.createElement('option');
            option.value = courtName;
            option.textContent = courtName;
            select.insertBefore(option, select.lastElementChild);
        });
    }
}

function setupCourtSelection() {
    const select = document.getElementById('courtSelect');
    const input = document.getElementById('court');

    if (select && input) {
        select.addEventListener('change', function () {
            if (this.value === '__custom__') {
                select.classList.add('hidden');
                input.classList.remove('hidden');
                input.focus();
                input.value = '';
            } else if (this.value !== '') {
                input.value = this.value;
            } else {
                input.value = '';
            }
        });

        input.addEventListener('blur', function () {
            if (this.value.trim() === '') {
                input.classList.add('hidden');
                select.classList.remove('hidden');
                select.value = '';
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                input.classList.add('hidden');
                select.classList.remove('hidden');
                select.value = '';
                input.value = '';
            }
        });
    }
}

function loadCourtData() {
    const select = document.getElementById('courtSelect');
    const input = document.getElementById('court');

    if (select && input) {
        const courtValue = input.value;
        if (courtValue) {
            const option = Array.from(select.options).find(opt => opt.value === courtValue);
            if (option && option.value !== '__custom__') {
                select.value = courtValue;
            } else {
                select.value = '__custom__';
                select.classList.add('hidden');
                input.classList.remove('hidden');
            }
        }
    }
}

async function handleUpdateCaseDetails(e) {
    e.preventDefault();
    if (!stateManager.currentCaseId) {
        showToast("خطأ: لا يوجد ق��ية حالية للحفظ.");
        return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const updatedData = Object.fromEntries(formData.entries());

    // ربط حالة القضية بحقل الأرشفة:
    // "متداولة" = غير مؤرشفة، "منتهية" = مؤرشفة
    try {
        const normStatus = normalizeStatus(updatedData.caseStatus);
        if (normStatus === 'منتهية') {
            updatedData.isArchived = true;
        } else if (normStatus === 'متداولة') {
            updatedData.isArchived = false;
        }
    } catch (_) { }
    stateManager.updateCaseDataStash('caseDetails', updatedData);

    const caseNumber = updatedData.caseNumber?.trim();
    const caseYear = updatedData.caseYear?.trim();

    if (caseNumber && caseYear) {
        const matchingCases = await getFromIndex('cases', 'caseNumberYear', [caseNumber, caseYear]);
        if (matchingCases.length > 0 && matchingCases[0].id !== stateManager.currentCaseId) {
            showToast('خطأ: قضية بنفس الرقم والسنة موجودة بالفعل.');
            return;
        }
    }

    try {
        const existingCase = await getById('cases', stateManager.currentCaseId);
        const updatedRecord = { ...existingCase, ...updatedData };

        await updateRecord('cases', stateManager.currentCaseId, updatedRecord);
        showToast('تم حفظ بيانات الدعوى بنجاح.');
        await updateCountersInHeader();
    } catch (error) {
        console.error('Error updating case:', error);
        showToast('حدث خطأ أثناء تحديث بيانات الدعوى.');
    }
}

async function validateCaseNumber(numberInput, yearInput, errorElement) {
    const number = numberInput.value.trim();
    const year = yearInput.value.trim();
    const typeInput = document.getElementById('caseType');
    const type = typeInput ? String(typeInput.value || '').trim() : '';
    if (number && year) {
        const key = type ? `${number}__${year}__${type}` : `${number}__${year}`;
        const existing = await getFromIndex('cases', 'caseNumberYearKey', key);
        if (existing.length > 0 && existing[0].id !== stateManager.currentCaseId) {
            errorElement.classList.remove('hidden');
        } else {
            errorElement.classList.add('hidden');
        }
    } else {
        errorElement.classList.add('hidden');
    }
}

async function handleSaveCaseDetails(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const caseData = Object.fromEntries(formData.entries());

    // ربط حالة القضية بحقل الأرشفة في القضايا الجديدة
    try {
        const normStatus = normalizeStatus(caseData.caseStatus);
        if (normStatus === 'منتهية') {
            caseData.isArchived = true;
        } else if (normStatus === 'متداولة') {
            caseData.isArchived = false;
        }
    } catch (_) { }


    const hasAnyData = Object.values(caseData).some(value => value && value.trim() !== '');

    if (!hasAnyData) {
        showToast('يجب إدخال بيانات في أي حقل على الأقل قبل الحفظ', 'error');
        return;
    }

    stateManager.updateCaseDataStash('caseDetails', caseData);

    const caseNumber = caseData.caseNumber?.trim();
    const caseYear = caseData.caseYear?.trim();
    const caseType = caseData.caseType?.trim();

    if (caseNumber && caseYear) {
        const key = caseType ? `${caseNumber}__${caseYear}__${caseType}` : `${caseNumber}__${caseYear}`;
        const existing = await getFromIndex('cases', 'caseNumberYearKey', key);
        if (existing.length > 0) {
            showToast('خطأ: قضية بنفس الرقم والسنة موجودة بالفعل.');
            return;
        }
    }

    try {
        const fullCaseData = {
            ...caseData,
            clientId: stateManager.selectedClientId,
            opponentId: stateManager.selectedOpponentId
        };

        const caseId = await addCase(fullCaseData);
        stateManager.setCurrentCaseId(caseId);
        try { await maybeUpdateLastFileNumberForYear(caseYear, caseData.fileNumber); } catch (_) { }
        showToast('تم حفظ بيانات الدعوى بنجاح.');
        await updateCountersInHeader();


        navigateTo(displayCaseDetailsForm);
    } catch (error) {
        if (error.message.includes('ConstraintError')) {
            showToast('خطأ: قضية بنفس الرقم والسنة موجودة بالفعل.');
        } else {
            showToast('حدث خطأ أثناء إدخال بيانات الدعوى.');
        }
    }
}


function openModalWithView(viewFunction, ...args) {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('hidden');
        viewFunction(...args);
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function navigateTo(viewFunction, ...args) {
    viewFunction(...args);
}


async function getNextFileNumber() {
    try {
        const yearInput = document.getElementById('caseYear');
        const caseYear = yearInput ? String(yearInput.value || '').trim() : '';
        return await getNextFileNumberForYear(caseYear);
    } catch (_) {
        return '1';
    }
}

async function getLatestPoaForClient(clientId) {
    if (!clientId) return null;
    try {
        const cases = await getFromIndex('cases', 'clientId', clientId);
        const casesWithPoa = cases.filter(c => c.poaNumber && c.poaNumber.trim() !== '');

        if (casesWithPoa.length === 0) return null;

        // Sort by ID descending (assuming higher ID = newer)
        casesWithPoa.sort((a, b) => b.id - a.id);

        return casesWithPoa[0].poaNumber;
    } catch (error) {
        console.error('Error fetching latest POA:', error);
        return null;
    }
}

async function initPoaCombobox() {
    if (!stateManager.selectedClientId) return;
    try {
        const cases = await getFromIndex('cases', 'clientId', stateManager.selectedClientId);
        const poas = [...new Set(cases
            .map(c => c.poaNumber)
            .filter(p => p && p.trim() !== '')
        )].sort();

        setupOptionsCombobox('poaNumber', 'poaNumber-dropdown', 'poaNumber-toggle', poas, v => v, null);
    } catch (e) {
        console.error('Error initializing POA combobox:', e);
    }
}

async function initPartyPoaCombobox() {
    if (!stateManager.selectedClientId) return;
    try {
        const cases = await getFromIndex('cases', 'clientId', stateManager.selectedClientId);
        const poas = [...new Set(cases
            .map(c => c.poaNumber)
            .filter(p => p && p.trim() !== '')
        )].sort();

        setupOptionsCombobox('client-poa-number', 'client-poa-number-dropdown', 'client-poa-number-toggle', poas, v => v, null);
    } catch (e) {
        console.error('Error initializing party POA combobox:', e);
    }
}
