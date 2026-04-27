let __sessionsDateLocaleCache = null;
async function __getDateLocaleSetting() {
    if (__sessionsDateLocaleCache) return __sessionsDateLocaleCache;
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) {}
    __sessionsDateLocaleCache = locale;
    return locale;
}

function __parseSessionDateString(dateStr) {
    try {
        const s = String(dateStr || '').trim();
        if (!s) return null;
        // yyyy-mm-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const d = new Date(s);
            return Number.isFinite(d.getTime()) ? d : null;
        }
        // dd/mm/yyyy
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

async function __formatSessionDateForDisplay(dateStr) {
    try {
        const locale = await __getDateLocaleSetting();
        const d = __parseSessionDateString(dateStr);
        if (!d) return (dateStr || 'غير محدد');
        return d.toLocaleDateString(locale);
    } catch (_) {
        return (dateStr || 'غير محدد');
    }
}

async function displaySessionList() {
    const embedded = document.getElementById('embedded-content');
    const container = embedded || document.getElementById('modal-content');
    const isEmbedded = !!embedded;

    if (!container) return;


    if (!isEmbedded) {
        document.getElementById('modal-title').textContent = 'قائمة الجلسات';
        container.classList.remove('search-modal-content');
    }
    const pageHeaderTitle = document.getElementById('page-title');
    if (pageHeaderTitle) pageHeaderTitle.textContent = 'قائمة الجلسات';
    if (window.location.pathname.includes('search.html')) {
        const mt = document.getElementById('modal-title');
        if (mt) mt.textContent = '';
        if (pageHeaderTitle) pageHeaderTitle.textContent = 'جلسات الدعوى الجديده';
    }
    if (typeof setHeaderAsBack === 'function') setHeaderAsBack();

    const sessions = await getFromIndex('sessions', 'caseId', stateManager.currentCaseId);
    let sessionListHtml = '<div class="space-y-2">';
    if (sessions.length > 0) {
        sessions.sort((a, b) => (a.sessionDate > b.sessionDate) ? 1 : -1)
        for (const s of sessions) {
            const displayDate = await __formatSessionDateForDisplay(s.sessionDate);
            sessionListHtml += `
                <div class="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-bold">تاريخ: ${displayDate || 'غير محدد'}</p>
                        <p class="text-sm text-gray-600">${s.decision || 'لا يوجد قرار'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button data-session-id="${s.id}" class="edit-session-btn text-blue-500 hover:text-blue-700"><i class="ri-pencil-line"></i></button>
                        <button data-session-id="${s.id}" class="delete-session-btn text-red-500 hover:text-red-700"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </div>
            `;
        }
    } else {
        sessionListHtml += '<p class="text-center text-gray-500 p-4">لا توجد جلسات مضافة لهذه القضية.</p>';
    }
    sessionListHtml += '</div>';

    container.innerHTML = `
        <div id="session-list-container">${sessionListHtml}</div>
        <div class="flex justify-center mt-6">
             <button id="add-new-session-btn" class="w-full md:w-auto px-12 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2">
                <i class="ri-add-line"></i><span>إضافة جلسة جديدة</span>
             </button>
        </div>
    `;

    attachSessionListEventListeners();


    if (sessions.length === 1) {
        setTimeout(async () => {
            const sessionId = sessions[0].id;
            const sessionData = await getById('sessions', sessionId);
            navigateTo(displaySessionForm, sessionId, sessionData);
        }, 100);
    }
}

async function handleDeleteSession(sessionId) {
    const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه الجلسة؟') : confirm('هل أنت متأكد من حذف هذه الجلسة؟');
    if (!ok) return;
    try {
        await deleteRecord('sessions', sessionId);
        showToast('تم حذف الجلسة بنجاح.');
        await updateCountersInHeader();
        document.dispatchEvent(new CustomEvent('sessionSaved'));
        replaceCurrentView(displaySessionList);
    } catch (error) {
        showToast('حدث خطأ أثناء الحذف.');

    }
}

function attachSessionListEventListeners() {
    document.getElementById('add-new-session-btn')?.addEventListener('click', () => navigateTo(displaySessionForm, null, null));

    document.querySelectorAll('.edit-session-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const sessionId = parseInt(e.currentTarget.dataset.sessionId, 10);
            const sessionData = await getById('sessions', sessionId);
            navigateTo(displaySessionForm, sessionId, sessionData);
        });
    });

    document.querySelectorAll('.delete-session-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sessionId = parseInt(e.currentTarget.dataset.sessionId, 10);
            handleDeleteSession(sessionId);
        });
    });
}

function __saveSessionsSidebarScroll() {
    try {
        const el = document.getElementById('sessions-sidebar-list');
        if (!el) return;
        window.__sessionsSidebarScrollTop = el.scrollTop;
    } catch (e) { }
}

function __restoreSessionsSidebarScroll(selectedId) {
    try {
        const el = document.getElementById('sessions-sidebar-list');
        if (!el) return;
        if (typeof window.__sessionsSidebarScrollTop === 'number') {
            el.scrollTop = window.__sessionsSidebarScrollTop;
        }
        if (selectedId) {
            const btn = el.querySelector(`.session-item-btn[data-session-id="${selectedId}"]`);
            if (btn && typeof btn.scrollIntoView === 'function') {
                btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    } catch (e) { }
}

async function refreshSessionsSidebar(selectedId) {
    try {
        if (!stateManager.currentCaseId) return;
        const listEl = document.getElementById('sessions-sidebar-list');
        if (!listEl) return;
        const prevScrollTop = listEl.scrollTop;
        let sessions = [];
        try { sessions = await getFromIndex('sessions', 'caseId', stateManager.currentCaseId); } catch (e) { sessions = []; }
        const sorted = [...sessions].sort((a, b) => { if (!a.sessionDate) return 1; if (!b.sessionDate) return -1; return new Date(a.sessionDate) - new Date(b.sessionDate); });
        const html = await Promise.all(sorted.map(async (s) => {
            const displayDate = await __formatSessionDateForDisplay(s.sessionDate);
            return `
            <div class="flex items-center gap-2 min-w-0">
                <button class="session-item-btn flex-1 min-w-0 text-right px-3 py-2 rounded ${selectedId === s.id ? 'bg-blue-200' : 'bg-blue-50 hover:bg-blue-100'} border border-blue-200 flex items-center justify-between gap-2" data-session-id="${s.id}">
                    <span class="font-semibold truncate">${displayDate || 'غير محدد'}</span>
                    <i class="ri-arrow-left-s-line shrink-0"></i>
                </button>
                <button class="delete-session-inline shrink-0 w-9 h-9 flex items-center justify-center text-red-600 hover:text-red-700" data-session-id="${s.id}" title="حذف">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        }));
        const htmlStr = html.join('');
        listEl.innerHTML = htmlStr || '<div class="text-gray-500 text-sm">لا توجد جلسات</div>';
        const h3 = listEl.parentElement ? listEl.parentElement.querySelector('h3') : null;
        if (h3) h3.textContent = `الجلسات (${sorted.length})`;
        listEl.scrollTop = prevScrollTop;
        __restoreSessionsSidebarScroll(selectedId);
    } catch (e) { }
}

async function displaySessionForm(sessionId = null, sessionData = null) {
    const currentSessionData = sessionData || {};

    const embedded = document.getElementById('embedded-content');
    const container = embedded || document.getElementById('modal-content');
    const isEmbedded = !!embedded;

    if (!container) return;

    container.classList.remove('sessions-newcase-no-right-padding');

    if (!isEmbedded) {
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = '';
        container.classList.remove('search-modal-content');
    }
    const pageHeaderTitle2 = document.getElementById('page-title');
    if (pageHeaderTitle2) {
        if (window.location.pathname.includes('new.html') && !sessionId) {
            pageHeaderTitle2.textContent = 'ادخل بيانات الجلسة الجديده';
        } else if (window.location.pathname.includes('session-edit.html') && !sessionId) {
            pageHeaderTitle2.textContent = 'إضافة جلسة جديدة';
        } else {
            pageHeaderTitle2.textContent = 'تعديل الجلسة';
        }
    }
    if (typeof setHeaderAsBack === 'function') setHeaderAsBack();
    if (!stateManager.currentCaseId && currentSessionData && currentSessionData.caseId) { stateManager.currentCaseId = currentSessionData.caseId; }
    const isNewFlow = window.location.pathname.includes('new.html') && !!stateManager.currentCaseId;
    const enableSidebar = (window.location.pathname.includes('new.html') || window.location.pathname.includes('search.html') || window.location.pathname.includes('session-edit.html')) && !!stateManager.currentCaseId;
    window.STAY_ON_SAVE = !!isNewFlow || window.location.pathname.includes('session-edit.html');

    if (enableSidebar) {
        container.classList.add('sessions-newcase-no-right-padding');
    }
    if (enableSidebar && window.location.pathname.includes('search.html')) {
        const modalTitle2 = document.getElementById('modal-title');
        if (modalTitle2) modalTitle2.textContent = '';
        const pageHeader = document.getElementById('page-title');
        if (pageHeader) pageHeader.textContent = 'جلسات الدعوى الجديده';
    }
    let __sessionsForCase = [];
    let __sortedSessions = [];
    let __currentIndex = -1;
    if (enableSidebar) {
        try { __sessionsForCase = await getFromIndex('sessions', 'caseId', stateManager.currentCaseId); } catch (e) { __sessionsForCase = []; }
        __sortedSessions = [...__sessionsForCase].sort((a, b) => { if (!a.sessionDate) return 1; if (!b.sessionDate) return -1; return new Date(a.sessionDate) - new Date(b.sessionDate); });
        if (sessionId) { __currentIndex = __sortedSessions.findIndex(s => s.id === sessionId); }
    }

    const __formHTML = `
        <div class="bg-white rounded-2xl p-2 sm:p-6 shadow-2xl">
            <form id="session-form" class="space-y-4 sm:space-y-6" novalidate>
                 <div class="grid grid-cols-2 gap-3 sm:gap-6 p-2 sm:p-6 bg-blue-50 backdrop-blur-sm rounded-xl shadow-md">
                    <!-- تاريخ الجلسة -->
                    <div class="flex flex-col sm:flex-row sm:items-stretch">
                        <label for="session-date" class="px-3 py-2 sm:py-3 border-2 border-gray-400 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-full sm:w-32 lg:w-36 text-right rounded-t-lg sm:rounded-r-lg sm:rounded-t-lg">
                            <i class="ri-calendar-line text-blue-600 ml-2"></i>تاريخ الجلسة
                        </label>
                        <input type="text" id="session-date" name="sessionDate" value="${currentSessionData.sessionDate || ''}" placeholder="مثال: 15/12/2025" required class="flex-1 px-3 py-2 sm:py-3 bg-white border-2 border-gray-400 border-t-0 sm:border-t-2 sm:border-r-0 rounded-b-lg sm:rounded-l-lg sm:rounded-b-lg focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-800">
                    </div>
                    
                    <!-- الرول -->
                    <div class="flex flex-col sm:flex-row sm:items-stretch">
                        <label for="session-roll" class="px-3 py-2 sm:py-3 border-2 border-gray-400 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-full sm:w-32 lg:w-36 text-right rounded-t-lg sm:rounded-r-lg sm:rounded-t-lg">
                            <i class="ri-list-check text-green-600 ml-2"></i>الرول
                        </label>
                        <input type="text" id="session-roll" name="roll" value="${currentSessionData.roll || ''}" placeholder="رقم الجلسة في الرول" class="flex-1 px-3 py-2 sm:py-3 bg-white border-2 border-gray-400 border-t-0 sm:border-t-2 sm:border-r-0 rounded-b-lg sm:rounded-l-lg sm:rounded-b-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-800">
                    </div>
                    
                    <!-- رقم الحصر -->
                    <div class="flex flex-col sm:flex-row sm:items-stretch">
                        <label for="inventory-number" class="px-3 py-2 sm:py-3 border-2 border-gray-400 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-full sm:w-32 lg:w-36 text-right rounded-t-lg sm:rounded-r-lg sm:rounded-t-lg">
                            <i class="ri-hashtag text-purple-600 ml-2"></i>رقم الحصر
                        </label>
                        <input type="text" id="inventory-number" name="inventoryNumber" value="${currentSessionData.inventoryNumber || ''}" placeholder="رقم الحصر إن وجد" class="flex-1 px-3 py-2 sm:py-3 bg-white border-2 border-gray-400 border-t-0 sm:border-t-2 sm:border-r-0 rounded-b-lg sm:rounded-l-lg sm:rounded-b-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-800">
                    </div>
                    
                    <!-- سنة الحصر -->
                    <div class="flex flex-col sm:flex-row sm:items-stretch">
                        <label for="inventory-year" class="px-3 py-2 sm:py-3 border-2 border-gray-400 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-full sm:w-32 lg:w-36 text-right rounded-t-lg sm:rounded-r-lg sm:rounded-t-lg">
                            <i class="ri-calendar-2-line text-orange-600 ml-2"></i>سنة الحصر
                        </label>
                        <input type="text" id="inventory-year" name="inventoryYear" value="${currentSessionData.inventoryYear || ''}" placeholder="مثال: 2025" class="flex-1 px-3 py-2 sm:py-3 bg-white border-2 border-gray-400 border-t-0 sm:border-t-2 sm:border-r-0 rounded-b-lg sm:rounded-l-lg sm:rounded-b-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right font-semibold text-gray-800">
                    </div>
                </div>
                
                <!-- قسم القرار والطلبات -->
                <div class="p-2 sm:p-6 bg-blue-50 backdrop-blur-sm rounded-xl shadow-md">
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                        <!-- القرار -->
                        <div class="flex flex-col sm:flex-row sm:items-stretch">
                            <label for="session-decision" class="px-3 py-2 sm:py-3 border-2 border-gray-400 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-full sm:w-32 lg:w-36 text-right rounded-t-lg sm:rounded-r-lg sm:rounded-t-lg">
                                <i class="ri-file-text-line text-indigo-600 ml-2"></i>القرار
                            </label>
                            <textarea id="session-decision" name="decision" rows="4" placeholder="اكتب قرار الجلسة..." class="flex-1 px-3 py-2 sm:py-3 bg-white border-2 border-gray-400 border-t-0 sm:border-t-2 sm:border-r-0 rounded-b-lg sm:rounded-l-lg sm:rounded-b-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right transition-colors resize-none font-semibold text-gray-800">${currentSessionData.decision || ''}</textarea>
                        </div>
                        
                        <!-- الطلبات -->
                        <div class="flex flex-col sm:flex-row sm:items-stretch">
                            <label for="session-requests" class="px-3 py-2 sm:py-3 border-2 border-gray-400 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-full sm:w-32 lg:w-36 text-right rounded-t-lg sm:rounded-r-lg sm:rounded-t-lg">
                                <i class="ri-question-answer-line text-indigo-600 ml-2"></i>الطلبات
                            </label>
                            <textarea id="session-requests" name="requests" rows="4" placeholder="اكتب طلباتك هنا..." class="flex-1 px-3 py-2 sm:py-3 bg-white border-2 border-gray-400 border-t-0 sm:border-t-2 sm:border-r-0 rounded-b-lg sm:rounded-l-lg sm:rounded-b-lg placeholder-gray-400 focus:ring-0 focus:border-blue-600 text-right transition-colors resize-none font-semibold text-gray-800">${currentSessionData.requests || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- زر الحفظ -->
                <div class="flex justify-center pt-2 sm:pt-4">
                    <button type="submit" class="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg font-bold flex items-center justify-center gap-2 sm:gap-3">
                        <i class="ri-save-3-line text-lg sm:text-xl"></i><span>حفظ الجلسة</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    if (enableSidebar) {
        const total = __sortedSessions.length;
        const prevDisabled = (__currentIndex <= 0) ? 'opacity-50 cursor-not-allowed' : '';
        const nextDisabled = (__currentIndex === -1 || __currentIndex >= total - 1) ? 'opacity-50 cursor-not-allowed' : '';
        const listItemsArr = await Promise.all(__sortedSessions.map(async (s) => {
            const displayDate = await __formatSessionDateForDisplay(s.sessionDate);
            return `
            <div class="flex items-center gap-2">
                <button class="session-item-btn flex-1 text-right px-3 py-2 rounded ${sessionId === s.id ? 'bg-blue-200' : 'bg-blue-50 hover:bg-blue-100'} border border-blue-200 flex justify-between items-center" data-session-id="${s.id}">
                    <span class="font-semibold">${displayDate || 'غير محدد'}</span>
                    <i class="ri-arrow-left-s-line"></i>
                </button>
                <button class="delete-session-inline px-2 py-2 text-red-600 hover:text-red-700" data-session-id="${s.id}">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        }));
        const listItems = listItemsArr.join('');
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3 sessions-newcase-layout">
                <div class="order-2 md:order-1 md:col-span-1">
                    <div class="bg-white rounded-xl border border-blue-200 p-2 sm:p-3 sessions-newcase-sidebar">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-bold text-blue-700">الجلسات (${total})</h3>
                            <button id="add-new-session-inline" class="px-2 py-1 bg-blue-600 text-white rounded text-sm"><i class="ri-add-line"></i> جديدة</button>
                        </div>
                        <div id="sessions-sidebar-list" class="space-y-2 overflow-y-auto" style="max-height: min(calc(9 * 52px), calc(100vh - 260px));">${listItems || '<div class="text-gray-500 text-sm">لا توجد جلسات</div>'}</div>
                        <div class="flex justify-center items-center gap-2 mt-2">
                            <button id="prev-session-btn" class="px-2 py-1 border rounded ${prevDisabled}"><i class="ri-arrow-right-line"></i></button>
                            <button id="next-session-btn" class="px-2 py-1 border rounded ${nextDisabled}"><i class="ri-arrow-left-line"></i></button>
                        </div>
                    </div>
                </div>
                <div class="order-1 md:order-2 md:col-span-4">
                    ${__formHTML}
                </div>
            </div>
        `;
    } else {
        container.innerHTML = __formHTML;
    }

    try {
        const dateInput = document.getElementById('session-date');
        const applyLocaleFormattingToInput = async () => {
            try {
                if (!dateInput) return;
                const raw = (dateInput.value || '').trim();
                if (!raw) return;
                const d = __parseSessionDateString(raw);
                if (!d) return;
                const locale = await __getDateLocaleSetting();
                dateInput.value = d.toLocaleDateString(locale);
            } catch (_) { }
        };
        if (dateInput) {
            // عند فتح النموذج: إذا كان مخزن yyyy-mm-dd أو dd/mm/yyyy حوّله لعرض محلي داخل الحقل
            setTimeout(() => { applyLocaleFormattingToInput(); }, 0);
            // عند ترك الحقل: ثبّت العرض وفق الإعداد
            dateInput.addEventListener('blur', () => { applyLocaleFormattingToInput(); });
            if (typeof attachDatePicker === 'function') attachDatePicker(dateInput, { format: 'DD/MM/YYYY' });
        }
    } catch (_) { }
    if (enableSidebar) {
        const listEl = document.getElementById('sessions-sidebar-list');
        listEl?.addEventListener('click', async (evt) => {
            const delBtn = evt.target.closest('.delete-session-inline');
            const itemBtn = evt.target.closest('.session-item-btn');
            if (delBtn) {
                evt.stopPropagation();
                const sid = parseInt(delBtn.dataset.sessionId || delBtn.getAttribute('data-session-id'), 10);
                const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه الجلسة؟') : confirm('هل أنت متأكد من حذف هذه الجلسة؟');
                if (!ok) return;
                const isCurrent = !!sessionId && sid === sessionId;
                try {
                    const row = delBtn.parentElement;
                    const neighbor = row?.nextElementSibling || row?.previousElementSibling;
                    row?.remove();
                    const h3 = listEl.parentElement?.querySelector('h3');
                    if (h3) h3.textContent = `الجلسات (${listEl.querySelectorAll('.delete-session-inline').length})`;
                    await deleteRecord('sessions', sid);
                    await updateCountersInHeader();
                    document.dispatchEvent(new CustomEvent('sessionSaved'));
                    const nextId = neighbor ? parseInt(neighbor.querySelector('.session-item-btn')?.dataset.sessionId || '0', 10) : 0;
                    await refreshSessionsSidebar(nextId || (sessionId || null));
                    if (isCurrent) {
                        if (nextId) {
                            const data = await getById('sessions', nextId);
                            replaceCurrentView(displaySessionForm, nextId, data);
                        } else {
                            replaceCurrentView(displaySessionForm, null, null);
                        }
                    }
                    showToast('تم حذف الجلسة بنجاح.');
                } catch (err) {
                    showToast('حدث خطأ أثناء الحذف.');
                }
                return;
            }
            if (itemBtn) {
                const sid = parseInt(itemBtn.dataset.sessionId, 10);
                const s = await getById('sessions', sid);
                __saveSessionsSidebarScroll();
                window.__sessionsSidebarSelectedId = sid;
                navigateTo(displaySessionForm, sid, s);
                return;
            }
        });
        document.getElementById('add-new-session-inline')?.addEventListener('click', () => {
            __saveSessionsSidebarScroll();
            window.__sessionsSidebarSelectedId = null;
            navigateTo(displaySessionForm, null, null);
        });
        document.getElementById('prev-session-btn')?.addEventListener('click', async () => {
            if (__currentIndex > 0) {
                const s = __sortedSessions[__currentIndex - 1];
                const data = await getById('sessions', s.id);
                __saveSessionsSidebarScroll();
                window.__sessionsSidebarSelectedId = s.id;
                navigateTo(displaySessionForm, s.id, data);
            }
        });
        document.getElementById('next-session-btn')?.addEventListener('click', async () => {
            if (__currentIndex !== -1 && __currentIndex < __sortedSessions.length - 1) {
                const s = __sortedSessions[__currentIndex + 1];
                const data = await getById('sessions', s.id);
                __saveSessionsSidebarScroll();
                window.__sessionsSidebarSelectedId = s.id;
                navigateTo(displaySessionForm, s.id, data);
            }
        });

        try {
            const sid = sessionId || window.__sessionsSidebarSelectedId || null;
            window.__sessionsSidebarSelectedId = sid;
            setTimeout(() => __restoreSessionsSidebarScroll(sid), 0);
        } catch (e) { }
    }



    document.getElementById('session-form').addEventListener('submit', (e) => handleSaveSession(e, sessionId));

    if (window.__sessionFormSavedHandler) {
        document.removeEventListener('sessionSaved', window.__sessionFormSavedHandler);
    }
    window.__sessionFormSavedHandler = async () => {
        try {
            if (stateManager.currentCaseId) {
                await refreshSessionsSidebar(sessionId || null);
            }
            if (sessionId) {
                const still = await getById('sessions', sessionId);
                if (still) {
                    const data = await getById('sessions', sessionId);
                    replaceCurrentView(displaySessionForm, sessionId, data);
                    return;
                }
            }
            let list = [];
            try { list = await getFromIndex('sessions', 'caseId', stateManager.currentCaseId); } catch (e) { list = []; }
            list = list.sort((a, b) => { if (!a.sessionDate) return 1; if (!b.sessionDate) return -1; return new Date(a.sessionDate) - new Date(b.sessionDate); });
            if (list.length > 0) {
                const target = list[0];
                const data = await getById('sessions', target.id);
                replaceCurrentView(displaySessionForm, target.id, data);
            } else {
                replaceCurrentView(displaySessionForm, null, null);
            }
        } catch (e) { }
    };
    document.addEventListener('sessionSaved', window.__sessionFormSavedHandler);


    if (isEmbedded) {
        const modal = document.getElementById('modal');
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    }
}

async function handleSaveSession(e, sessionId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const newSessionData = Object.fromEntries(formData.entries());

    const normalizeDigitsOnly = (s) => {
        try {
            let out = (s == null) ? '' : String(s);
            out = out.replace(/[\u200E\u200F\u061C]/g, '');
            const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
            const easternArabicIndic = '۰۱۲۳۴۵۶۷۸۹';
            out = out.replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)));
            out = out.replace(/[۰-۹]/g, (d) => String(easternArabicIndic.indexOf(d)));
            return out;
        } catch (err) {
            return (s == null) ? '' : String(s);
        }
    };
    {
        const raw = newSessionData.sessionDate ? String(newSessionData.sessionDate) : '';
        const s = normalizeDigitsOnly(raw).trim();
        const _pad = n => n.toString().padStart(2, '0');

        const mDMY = s.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/);
        if (mDMY) {
            let d = parseInt(mDMY[1], 10), mo = parseInt(mDMY[2], 10), y = parseInt(mDMY[3], 10);
            if (mDMY[3].length === 2) { y = y < 50 ? 2000 + y : 1900 + y; }
            const dt = new Date(y, mo - 1, d);
            if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
                newSessionData.sessionDate = `${y}-${_pad(mo)}-${_pad(d)}`;
            } else {
                newSessionData.sessionDate = raw;
            }
        } else {
            const mYMD = s.match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})$/);
            if (mYMD) {
                let y = parseInt(mYMD[1], 10), mo = parseInt(mYMD[2], 10), d = parseInt(mYMD[3], 10);
                const dt = new Date(y, mo - 1, d);
                if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
                    newSessionData.sessionDate = `${y}-${_pad(mo)}-${_pad(d)}`;
                } else {
                    newSessionData.sessionDate = raw;
                }
            } else {
                newSessionData.sessionDate = raw;
            }
        }
    }

    const sessionDate = newSessionData.sessionDate?.trim() || '';
    const roll = newSessionData.roll?.trim() || '';
    const inventoryNumber = newSessionData.inventoryNumber?.trim() || '';
    const inventoryYear = newSessionData.inventoryYear?.trim() || '';
    const decision = newSessionData.decision?.trim() || '';
    const requests = newSessionData.requests?.trim() || '';

    const hasAnyData = sessionDate !== '' || roll !== '' || inventoryNumber !== '' || inventoryYear !== '' || decision !== '' || requests !== '';

    if (!hasAnyData) {
        showToast('يجب إدخال بيانات في أي حقل على الأقل قبل الحفظ', 'error');
        return;
    }


    let nextSessionDate = null;
    if (decision) {

        const normalizedDecision = normalizeDigitsOnly(decision);
        const datePattern = /(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{2,4})/g;
        const matches = [...normalizedDecision.matchAll(datePattern)];

        if (matches.length > 0) {

            const lastMatch = matches[matches.length - 1];
            const _pad = n => n.toString().padStart(2, '0');
            let d = parseInt(lastMatch[1], 10);
            let mo = parseInt(lastMatch[2], 10);
            let y = parseInt(lastMatch[3], 10);

            if (lastMatch[3].length === 2) {
                y = y < 50 ? 2000 + y : 1900 + y;
            }

            const dt = new Date(y, mo - 1, d);
            if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
                nextSessionDate = `${y}-${_pad(mo)}-${_pad(d)}`;
            }
        }
    }

    try {
        if (sessionId) {
            const existingSession = await getById('sessions', sessionId);
            const updatedSession = { ...existingSession, ...newSessionData };
            await updateRecord('sessions', sessionId, updatedSession);
            showToast('تم تعديل الجلسة بنجاح.');
        } else {
            if (!stateManager.currentCaseId) {
                showToast("خطأ: لا يمكن إضافة جلسة بدون قضية.");
                return;
            }
            newSessionData.caseId = stateManager.currentCaseId;
            const newId = await addSession(newSessionData);
            newSessionData.id = newId;
            showToast('تم حفظ الجلسة بنجاح.');
        }
        await updateCountersInHeader();


        let newlyCreatedSessionId = null;
        if (nextSessionDate && stateManager.currentCaseId) {
            try {

                const existingSessions = await getFromIndex('sessions', 'caseId', stateManager.currentCaseId);
                const dateExists = existingSessions.some(s => s.sessionDate === nextSessionDate);

                if (!dateExists) {

                    const [year, month, day] = nextSessionDate.split('-');
                    const readableDate = `${day}/${month}/${year}`;

                    const newAutoSession = {
                        caseId: stateManager.currentCaseId,
                        sessionDate: nextSessionDate,
                        roll: '',
                        inventoryNumber: '',
                        inventoryYear: '',
                        decision: '',
                        requests: ''
                    };
                    newlyCreatedSessionId = await addSession(newAutoSession);
                    showToast(`✅ تم إنشاء جلسة جديدة تلقائياً بتاريخ ${readableDate}`);
                    await updateCountersInHeader();
                }
            } catch (err) {
                console.error('Error creating auto session:', err);
            }
        }

        document.dispatchEvent(new CustomEvent('sessionSaved'));

        if (window.STAY_ON_SAVE && (window.location.pathname.includes('new.html') || window.location.pathname.includes('session-edit.html'))) {
            await refreshSessionsSidebar(sessionId ? sessionId : newSessionData.id);
            try {
                let after = [];
                try { after = await getFromIndex('sessions', 'caseId', stateManager.currentCaseId); } catch (err) { after = []; }
                const sortedAfter = [...after].sort((a, b) => { if (!a.sessionDate) return 1; if (!b.sessionDate) return -1; return new Date(a.sessionDate) - new Date(b.sessionDate); });
                const selectedId = sessionId ? sessionId : newSessionData.id;
                const listEl = document.getElementById('sessions-sidebar-list');
                if (listEl) {
                    const prevScrollTop = listEl.scrollTop;
                    const htmlArr = await Promise.all(sortedAfter.map(async (s) => {
                        const displayDate = await __formatSessionDateForDisplay(s.sessionDate);
                        return `
                        <div class="flex items-center gap-2">
                            <button class="session-item-btn flex-1 text-right px-3 py-2 rounded ${selectedId === s.id ? 'bg-blue-200' : 'bg-blue-50 hover:bg-blue-100'} border border-blue-200 flex justify-between items-center" data-session-id="${s.id}">
                                <span class="font-semibold">${displayDate || 'غير محدد'}</span>
                                <i class="ri-arrow-left-s-line"></i>
                            </button>
                            <button class="delete-session-inline px-2 py-2 text-red-600 hover:text-red-700" data-session-id="${s.id}">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    `;
                    }));
                    const html = htmlArr.join('');
                    listEl.innerHTML = html || '<div class="text-gray-500 text-sm">لا توجد جلسات</div>';
                    const h3 = listEl.parentElement ? listEl.parentElement.querySelector('h3') : null;
                    if (h3) h3.textContent = `الجلسات (${sortedAfter.length})`;
                    listEl.scrollTop = prevScrollTop;
                    __restoreSessionsSidebarScroll(selectedId);
                }
            } catch (e) { }
            if (sessionId) {
                const s = await getById('sessions', sessionId);
                replaceCurrentView(displaySessionForm, sessionId, s);
            } else {
                if (newSessionData.id) {
                    const s = await getById('sessions', newSessionData.id);
                    replaceCurrentView(displaySessionForm, newSessionData.id, s);
                } else {
                    replaceCurrentView(displaySessionForm, null, null);
                }
            }
            return;
        }

        const modalTitle = document.getElementById('modal-title')?.textContent || '';


        if (window.location.pathname.includes('new.html') && stateManager.currentCaseId) {

            if (typeof displayCaseDetailsForm === 'function') {
                displayCaseDetailsForm();
            } else {
                navigateBack();
            }
        } else if (modalTitle.includes('بيانات الأطراف') && stateManager.currentCaseId) {
            navigateBack();

            setTimeout(async () => {
                if (window.loadCaseSessions && window.attachAddSessionButtonListener) {
                    await window.loadCaseSessions(stateManager.currentCaseId.toString());
                    window.attachAddSessionButtonListener();
                }
            }, 100);
        } else {
            navigateBack();
        }
    } catch (error) {
        showToast('حدث خطأ أثناء حفظ الجلسة.');

    }
}

// Auto-open session from notification
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const openId = sessionStorage.getItem('temp_open_session_id');
        const openCaseId = sessionStorage.getItem('temp_open_case_id');

        if (openId && openCaseId) {
            sessionStorage.removeItem('temp_open_session_id');
            sessionStorage.removeItem('temp_open_case_id');

            if (typeof initDB === 'function') await initDB();

            if (typeof stateManager !== 'undefined') {
                stateManager.currentCaseId = parseInt(openCaseId, 10);
            }

            setTimeout(async () => {
                try {
                    const sid = parseInt(openId, 10);
                    const data = await getById('sessions', sid);
                    if (typeof displaySessionForm === 'function' && data) {
                        displaySessionForm(sid, data);
                    }
                } catch (e) { console.error('Auto-open session error:', e); }
            }, 600);
        }
    } catch (err) { console.error(err); }
});
