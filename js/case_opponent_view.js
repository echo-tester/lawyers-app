



window.loadCaseSessions = async function loadCaseSessions(caseId, locale) {
    try {
        let resolvedLocale = (locale === 'ar-EG' || locale === 'en-GB') ? locale : null;
        if (!resolvedLocale) {
            resolvedLocale = 'ar-EG';
            try {
                if (typeof getSetting === 'function') {
                    const v = await getSetting('dateLocale');
                    if (v === 'ar-EG' || v === 'en-GB') resolvedLocale = v;
                }
            } catch (_) { }
        }

        const sessions = await getFromIndex('sessions', 'caseId', parseInt(caseId));
        const sessionsContainer = document.getElementById(`case-sessions-${caseId}`);

        if (!sessionsContainer) return;

        // Reset first (avoid large DOM diffs)
        sessionsContainer.innerHTML = '';

        if (sessions.length === 0) {
            sessionsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-6 bg-white rounded-lg border border-gray-200">
                    <i class="ri-calendar-line text-2xl mb-2 text-gray-400"></i>
                    <p class="text-sm font-medium">لا توجد جلسات مسجلة لهذه القضية</p>
                </div>
            `;
            return;
        }

        sessions.sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

        const shouldHideDetails = sessions.length > 1;
        const nowTs = Date.now();
        let formatter = null;
        try { formatter = new Intl.DateTimeFormat(resolvedLocale); } catch (_) { formatter = null; }
        const formatDate = (d) => {
            try {
                if (!d) return '';
                if (formatter) return formatter.format(d);
                return d.toLocaleDateString(resolvedLocale);
            } catch (_) {
                return '';
            }
        };

        const renderOne = (session) => {
            const sd = session && session.sessionDate ? new Date(session.sessionDate) : null;
            const isUpcoming = !!(sd && sd.getTime() > nowTs);
            const sdText = sd ? formatDate(sd) : '';

            return `
                <div class="session-card bg-white rounded-lg p-4 shadow-md border ${isUpcoming ? 'border-green-200 bg-green-50' : 'border-gray-200'} hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg transition-shadow">
                    <div class="session-header flex justify-between items-start mb-4 cursor-pointer" data-session-id="${session.id}">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 ${isUpcoming ? 'bg-green-600' : 'bg-blue-600'} rounded-full flex items-center justify-center">
                                <i class="ri-calendar-event-line text-white"></i>
                            </div>
                            <div>
                                <h5 class="text-base font-bold ${isUpcoming ? 'text-green-800' : 'text-blue-800'} flex items-center gap-2">
                                    ${isUpcoming ? 'جلسة قادمة' : 'جلسة سابقة'}
                                    ${shouldHideDetails ? `<i class="ri-arrow-down-s-line text-gray-400 transition-transform session-arrow" data-session-id="${session.id}"></i>` : ''}
                                </h5>
                                <p class="text-sm text-gray-600 font-bold">${sdText || (session.sessionDate || 'غير محدد')}</p>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <button class="edit-session-btn bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors" data-session-id="${session.id}" onclick="event.stopPropagation()">
                                <i class="ri-edit-line mr-1"></i>تعديل
                            </button>
                            <button class="delete-session-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors" data-session-id="${session.id}" onclick="event.stopPropagation()">
                                <i class="ri-delete-bin-line mr-1"></i>حذف
                            </button>
                        </div>
                    </div>
                    
                    <!-- عرض تفاصيل الجلسة في مربعات جميلة -->
                    <div class="session-details ${shouldHideDetails ? 'hidden' : ''}" data-session-id="${session.id}">
                        <!-- الصف الأول: البيانات الأساسية -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div class="bg-white rounded-lg p-4 shadow-md border border-blue-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-blue-700 block mb-2">تاريخ الجلسة</span>
                                <p class="text-sm font-bold text-gray-800">${sdText || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-green-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-green-700 block mb-2">الرول</span>
                                <p class="text-sm font-bold text-gray-800">${session.roll || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-purple-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-purple-700 block mb-2">رقم الحصر</span>
                                <p class="text-sm font-bold text-gray-800">${session.inventoryNumber || 'فارغ'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-md border border-orange-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-orange-700 block mb-2">سنة الحصر</span>
                                <p class="text-sm font-bold text-gray-800">${session.inventoryYear || 'فارغ'}</p>
                            </div>
                        </div>
                        
                        <!-- الصف الثاني: القرار والطلبات -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div class="bg-white rounded-lg p-4 shadow-md border border-indigo-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-indigo-700 block mb-2">القرار</span>
                                <p class="text-sm font-bold text-gray-800 leading-relaxed">${session.decision || 'فارغ'}</p>
                            </div>
                            <div class="bg-white rounded-lg p-4 shadow-md border border-blue-100 hover:shadow-lg transition-shadow text-center">
                                <span class="text-sm font-bold text-blue-700 block mb-2">الطلبات</span>
                                <p class="text-sm font-bold text-gray-800 leading-relaxed">${session.requests || 'فارغ'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        };

        // Chunked rendering to avoid freezing Electron during scroll
        const batchSize = 10;
        let i = 0;
        const renderBatch = () => {
            if (!sessionsContainer) return;
            const end = Math.min(i + batchSize, sessions.length);
            let html = '';
            for (; i < end; i++) {
                html += renderOne(sessions[i]);
            }
            if (html) sessionsContainer.insertAdjacentHTML('beforeend', html);
            if (i < sessions.length) {
                if (typeof requestIdleCallback === 'function') {
                    requestIdleCallback(renderBatch, { timeout: 120 });
                } else {
                    setTimeout(renderBatch, 0);
                }
            } else {
                // Bind events after full render
                try { attachSessionEventListeners(); } catch (_) { }
            }
        };
        renderBatch();
        
    } catch (error) {
        showToast('حدث خطأ في تحميل الجلسات', 'error');
    }
}


function attachSessionEventListeners() {
    
    document.querySelectorAll('.edit-session-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const sessionId = parseInt(btn.dataset.sessionId);
            try {
                const currentPath = String(window.location.pathname || '');
                if (currentPath.includes('new.html')) {
                    sessionStorage.setItem('returnToPage', 'new');
                } else if (currentPath.includes('search.html')) {
                    sessionStorage.setItem('returnToPage', 'search');
                }
                try {
                    const sessionData = await getById('sessions', sessionId);
                    const caseId = sessionData && sessionData.caseId ? parseInt(sessionData.caseId, 10) : 0;
                    if (caseId) {
                        const caseRecord = await getById('cases', caseId);
                        if (caseRecord && caseRecord.clientId) {
                            sessionStorage.setItem('returnToClientId', String(caseRecord.clientId));
                        }
                    }
                } catch (_) { }
            } catch (_) { }
            window.location.href = `session-edit.html?sessionId=${sessionId}`;
        });
    });

    
    document.querySelectorAll('.delete-session-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const sessionId = parseInt(btn.dataset.sessionId);
            const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه الجلسة؟') : confirm('هل أنت متأكد من حذف هذه الجلسة؟');
            if (!ok) return;
            try {
                await deleteRecord('sessions', sessionId);
                showToast('تم حذف الجلسة بنجاح', 'success');
                
                
                const caseId = stateManager.currentCaseId;
                if (caseId) {
                    await loadCaseSessions(caseId);
                }
            } catch (error) {
                showToast('حدث خطأ في حذف الجلسة', 'error');
            }
        });
    });

    
    attachSessionExpandListeners();
}


function attachSessionExpandListeners() {
    document.querySelectorAll('.session-header').forEach(header => {
        header.addEventListener('click', (e) => {
            
            if (e.target.closest('.edit-session-btn') || e.target.closest('.delete-session-btn')) {
                return;
            }
            
            const sessionId = header.dataset.sessionId;
            const sessionDetails = document.querySelector(`.session-details[data-session-id="${sessionId}"]`);
            const sessionArrow = document.querySelector(`.session-arrow[data-session-id="${sessionId}"]`);
            
            if (sessionDetails && sessionArrow) {
                if (sessionDetails.classList.contains('hidden')) {
                    sessionDetails.classList.remove('hidden');
                    sessionArrow.style.transform = 'rotate(180deg)';
                } else {
                    sessionDetails.classList.add('hidden');
                    sessionArrow.style.transform = 'rotate(0deg)';
                }
            }
        });
    });
}


async function displayCaseDetails(caseId) {
    try {
        const caseRecord = await getById('cases', caseId);
        if (!caseRecord) {
            showToast('لم يتم العثور على بيانات القضية', 'error');
            return;
        }

        let locale = 'ar-EG';
        try {
            if (typeof getSetting === 'function') {
                const v = await getSetting('dateLocale');
                if (v === 'ar-EG' || v === 'en-GB') locale = v;
            }
        } catch (_) {}
        
        const caseDetailsDisplay = document.getElementById('case-details-display');
        const caseDetailsTitle = document.getElementById('selected-case-details-title');
        const caseDetailsContent = document.getElementById('case-details-content');
        
        caseDetailsTitle.textContent = `تفاصيل القضية رقم: ${caseRecord.caseNumber} لسنة ${caseRecord.caseYear}`;
        
        const poaDate = caseRecord.poaDate ? new Date(caseRecord.poaDate).toLocaleDateString(locale) : 'غير محدد';
        
        caseDetailsContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-hashtag text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">رقم القضية</span>
                    </div>
                    <p class="text-lg font-bold text-gray-800">${caseRecord.caseNumber || 'غير محدد'} لسنة ${caseRecord.caseYear || 'غير محدد'}</p>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-building-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">المحكمة</span>
                    </div>
                    <p class="text-base font-medium text-gray-800">${caseRecord.court || 'غير محدد'}</p>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-file-text-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">نوع القضية</span>
                    </div>
                    <p class="text-base font-medium text-gray-800">${caseRecord.caseType || 'غير محدد'}</p>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-pulse-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">حالة القضية</span>
                    </div>
                    <p class="text-base font-medium text-gray-800">${caseRecord.caseStatus || 'غير محدد'}</p>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-file-paper-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">رقم التوكيل</span>
                    </div>
                    <p class="text-base font-medium text-gray-800">${caseRecord.poaNumber || 'غير محدد'}</p>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-calendar-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">تاريخ التوكيل</span>
                    </div>
                    <p class="text-base font-medium text-gray-800">${poaDate}</p>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-scales-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">رقم الاستئناف</span>
                    </div>
                    <p class="text-base font-medium text-gray-800">${caseRecord.appealNumber || 'غير محدد'} لسنة ${caseRecord.appealYear || 'غير محدد'}</p>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="ri-government-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">رقم النقض</span>
                    </div>
                    <p class="text-base font-medium text-gray-800">${caseRecord.cassationNumber || 'غير محدد'} لسنة ${caseRecord.cassationYear || 'غير محدد'}</p>
                </div>
            </div>
            
            ${caseRecord.subject ? `
                <div class="bg-white rounded-lg p-4 shadow-sm mt-6">
                    <div class="flex items-center gap-3 mb-3">
                        <i class="ri-article-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">موضوع القضية</span>
                    </div>
                    <p class="text-base text-gray-800 leading-relaxed">${caseRecord.subject}</p>
                </div>
            ` : ''}
            
            ${caseRecord.notes ? `
                <div class="bg-white rounded-lg p-4 shadow-sm mt-6">
                    <div class="flex items-center gap-3 mb-3">
                        <i class="ri-sticky-note-line text-blue-600 text-lg"></i>
                        <span class="text-sm font-bold text-blue-700">ملاحظات</span>
                    </div>
                    <p class="text-base text-gray-800 leading-relaxed">${caseRecord.notes}</p>
                </div>
            ` : ''}
            
            <div class="flex gap-4 mt-6 pt-4 border-t border-blue-200">
                <button class="edit-case-from-details-btn flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-3 px-6 rounded-lg transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105" data-case-id="${caseId}">
                    <i class="ri-edit-line mr-2"></i>تعديل القضية
                </button>
                <button class="view-sessions-from-details-btn bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-3 px-6 rounded-lg transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105" data-case-id="${caseId}">
                    <i class="ri-calendar-event-line mr-2"></i>عرض الجلسات
                </button>
            </div>
        `;
        
        
        document.getElementById('sessions-display').classList.add('hidden');
        
        
        caseDetailsDisplay.classList.remove('hidden');
        
        
        attachCaseDetailsListeners();
        
    } catch (error) {
        showToast('حدث خطأ في تحميل تفاصيل القضية', 'error');
    }
}


function attachCaseDetailsListeners() {
    
    const editBtn = document.querySelector('.edit-case-from-details-btn');
    if (editBtn) {
        editBtn.addEventListener('click', async () => {
            const caseId = parseInt(editBtn.dataset.caseId);
            try {
                sessionStorage.setItem('returnToPage', 'search');
                sessionStorage.setItem('editCaseId', String(caseId));
            } catch (_) { }
            try {
                const caseRecord = await getById('cases', caseId);
                if (caseRecord && caseRecord.clientId) {
                    try { sessionStorage.setItem('returnToClientId', String(caseRecord.clientId)); } catch (_) { }
                }
            } catch (_) { }
            window.location.href = 'new.html';
        });
    }
}


async function displayCaseViewForm(caseId) {
    try {
        const caseRecord = await getById('cases', caseId);
        if (!caseRecord) {
            showToast('لم يتم العثور على بيانات القضية', 'error');
            return;
        }

        let locale = 'ar-EG';
        try {
            if (typeof getSetting === 'function') {
                const v = await getSetting('dateLocale');
                if (v === 'ar-EG' || v === 'en-GB') locale = v;
            }
        } catch (_) {}

        const client = await getById('clients', caseRecord.clientId);
        const opponent = await getById('opponents', caseRecord.opponentId);
        const sessions = await getFromIndex('sessions', 'caseId', caseId);
        
        document.getElementById('modal-title').textContent = `8. عرض القضية رقم: ${caseRecord.caseNumber} لسنة ${caseRecord.caseYear}`;
        const modalContent = document.getElementById('modal-content');
        modalContent.classList.remove('search-modal-content');
        
        modalContent.innerHTML = `
            <div class="max-w-7xl mx-auto space-y-6">
                <!-- بيانات القضية والأطراف -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- بيانات القضية الأساسية -->
                    <div class="lg:col-span-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-lg">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                                <i class="ri-briefcase-line text-white text-xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-purple-800">بيانات القضية</h3>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-hashtag text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">رقم القضية</span>
                                </div>
                                <p class="text-lg font-bold text-gray-800">${caseRecord.caseNumber || 'غير محدد'} لسنة ${caseRecord.caseYear || 'غير محدد'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-building-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">المحكمة</span>
                                </div>
                                <p class="text-base font-medium text-gray-800">${caseRecord.court || 'غير محدد'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-file-text-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">نوع القضية</span>
                                </div>
                                <p class="text-base font-medium text-gray-800">${caseRecord.caseType || 'غير محدد'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-pulse-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">حالة القضية</span>
                                </div>
                                <p class="text-base font-medium text-gray-800">${caseRecord.caseStatus || 'غير محدد'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-file-paper-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">رقم التوكيل</span>
                                </div>
                                <p class="text-base font-medium text-gray-800">${caseRecord.poaNumber || 'غير محدد'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-calendar-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">تاريخ التوكيل</span>
                                </div>
                                <p class="text-base font-medium text-gray-800">${caseRecord.poaDate ? new Date(caseRecord.poaDate).toLocaleDateString(locale) : 'غير محدد'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-scales-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">رقم الاستئناف</span>
                                </div>
                                <p class="text-base font-medium text-gray-800">${caseRecord.appealNumber || 'غير محدد'} لسنة ${caseRecord.appealYear || 'غير محدد'}</p>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-government-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">رقم النقض</span>
                                </div>
                                <p class="text-base font-medium text-gray-800">${caseRecord.cassationNumber || 'غير محدد'} لسنة ${caseRecord.cassationYear || 'غير محدد'}</p>
                            </div>
                        </div>
                        
                        ${caseRecord.subject ? `
                            <div class="bg-white rounded-lg p-4 shadow-sm mt-6">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-article-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">موضوع القضية</span>
                                </div>
                                <p class="text-base text-gray-800 leading-relaxed">${caseRecord.subject}</p>
                            </div>
                        ` : ''}
                        
                        ${caseRecord.notes ? `
                            <div class="bg-white rounded-lg p-4 shadow-sm mt-6">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="ri-sticky-note-line text-purple-600 text-lg"></i>
                                    <span class="text-sm font-bold text-purple-700">ملاحظات</span>
                                </div>
                                <p class="text-base text-gray-800 leading-relaxed">${caseRecord.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- بيانات الأطراف -->
                    <div class="space-y-6">
                        <!-- الموكل -->
                        <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                    <i class="ri-user-3-line text-white"></i>
                                </div>
                                <h4 class="text-lg font-bold text-green-800">الموكل</h4>
                            </div>
                            <div class="bg-white rounded-lg p-4 shadow-sm space-y-3">
                                <div>
                                    <span class="text-xs font-bold text-green-700">الاسم</span>
                                    <p class="text-base font-medium text-gray-800">${client?.name || 'غير محدد'}</p>
                                </div>
                                <div>
                                    <span class="text-xs font-bold text-green-700">الصفة</span>
                                    <p class="text-sm text-gray-700">${(caseRecord && caseRecord.clientCapacity) ? caseRecord.clientCapacity : 'غير محدد'}</p>
                                </div>
                                <div>
                                    <span class="text-xs font-bold text-green-700">العنوان</span>
                                    <p class="text-sm text-gray-700">${client?.address || 'غير محدد'}</p>
                                </div>
                                <div>
                                    <span class="text-xs font-bold text-green-700">الهاتف</span>
                                    <p class="text-sm text-gray-700">${client?.phone || 'غير محدد'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- الخصم -->
                        <div class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                                    <i class="ri-shield-user-line text-white"></i>
                                </div>
                                <h4 class="text-lg font-bold text-red-800">الخصم</h4>
                            </div>
                            <div class="bg-white rounded-lg p-4 shadow-sm space-y-3">
                                <div>
                                    <span class="text-xs font-bold text-red-700">الاسم</span>
                                    <p class="text-base font-medium text-gray-800">${opponent?.name || 'غير محدد'}</p>
                                </div>
                                <div>
                                    <span class="text-xs font-bold text-red-700">الصفة</span>
                                    <p class="text-sm text-gray-700">${(caseRecord && caseRecord.opponentCapacity) ? caseRecord.opponentCapacity : 'غير محدد'}</p>
                                </div>
                                <div>
                                    <span class="text-xs font-bold text-red-700">العنوان</span>
                                    <p class="text-sm text-gray-700">${opponent?.address || 'غير محدد'}</p>
                                </div>
                                <div>
                                    <span class="text-xs font-bold text-red-700">الهاتف</span>
                                    <p class="text-sm text-gray-700">${opponent?.phone || 'غير محدد'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- الجلسات -->
                <div class="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                <i class="ri-calendar-event-line text-white text-xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-blue-800">الجلسات</h3>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                ${sessions.length} جلسة
                            </span>
                            <button id="add-new-session-btn" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-all font-bold flex items-center gap-2" data-case-id="${caseId}">
                                <i class="ri-add-line"></i>إضافة جلسة
                            </button>
                        </div>
                    </div>
                    
                    <div id="case-sessions-list" class="space-y-4">
                        <!-- الجلسات ستُحمل هنا -->
                    </div>
                </div>

                <!-- أزرار التحكم -->
                <div class="flex gap-3 pt-4 border-t border-gray-200">
                    <button id="edit-case-data-btn" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg transition-all font-bold" data-case-id="${caseId}">
                        <i class="ri-edit-line mr-2"></i>تعديل القضية
                    </button>
                    <button id="close-case-view-btn" class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        <i class="ri-close-line mr-2"></i>إغلاق
                    </button>
                </div>
            </div>
        `;

        
        await loadCaseSessionsForView(sessions);
        
        
        attachCaseViewListeners(caseId);
        
    } catch (error) {
        showToast('حدث خطأ في تحميل بيانات القضية', 'error');
    }
}


async function loadCaseSessionsForView(sessions) {
    const sessionsList = document.getElementById('case-sessions-list');
    let locale = 'ar-EG';
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('dateLocale');
            if (v === 'ar-EG' || v === 'en-GB') locale = v;
        }
    } catch (_) {}
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = `
            <div class="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
                <i class="ri-calendar-line text-2xl mb-2 text-gray-400"></i>
                <p class="text-sm font-medium">لا توجد جلسات مسجلة لهذه القضية</p>
            </div>
        `;
        return;
    }
    
    
    sessions.sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));
    
    let html = '';
    for (const session of sessions) {
        const statusColor = session.sessionStatus === 'منتهية' ? 'text-green-600 bg-green-100' : 
                           session.sessionStatus === 'مقررة' ? 'text-blue-600 bg-blue-100' : 
                           'text-gray-600 bg-gray-100';
        
        const sessionDate = session.sessionDate ? new Date(session.sessionDate).toLocaleDateString(locale) : 'غير محدد';
        const nextSessionDate = session.nextSessionDate ? new Date(session.nextSessionDate).toLocaleDateString(locale) : null;
        
        html += `
            <div class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                                <i class="ri-calendar-event-line text-white text-sm"></i>
                            </div>
                            <h4 class="font-bold text-xl text-orange-700">
                                ${session.sessionType || 'جلسة'}
                            </h4>
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor}">
                                ${session.sessionStatus || 'غير محدد'}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div class="bg-gray-50 rounded-lg p-3">
                                <span class="text-xs font-bold text-gray-600">التاريخ</span>
                                <p class="text-sm font-medium text-gray-800">${sessionDate}</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <span class="text-xs font-bold text-gray-600">الوقت</span>
                                <p class="text-sm font-medium text-gray-800">${session.sessionTime || 'غير محدد'}</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <span class="text-xs font-bold text-gray-600">رقم الحصر</span>
                                <p class="text-sm font-medium text-gray-800">${session.inventoryNumber || 'غير محدد'} / ${session.inventoryYear || 'غير محدد'}</p>
                            </div>
                        </div>
                        
                        ${session.sessionResult ? `
                            <div class="bg-blue-50 rounded-lg p-3 mb-4">
                                <span class="text-xs font-bold text-blue-700">نتيجة الجلسة</span>
                                <p class="text-sm text-gray-800 mt-1">${session.sessionResult}</p>
                            </div>
                        ` : ''}
                        
                        ${nextSessionDate ? `
                            <div class="bg-green-50 rounded-lg p-3 mb-4">
                                <span class="text-xs font-bold text-green-700">الجلسة القادمة</span>
                                <p class="text-sm text-gray-800 mt-1">${nextSessionDate}</p>
                            </div>
                        ` : ''}
                        
                        ${session.notes ? `
                            <div class="bg-yellow-50 rounded-lg p-3">
                                <span class="text-xs font-bold text-yellow-700">ملاحظات</span>
                                <p class="text-sm text-gray-800 mt-1">${session.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col gap-3 ml-6">
                        <button class="edit-session-btn bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105" data-session-id="${session.id}">
                            <i class="ri-edit-line mr-1"></i>تعديل
                        </button>
                        <button class="delete-session-btn bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105" data-session-id="${session.id}">
                            <i class="ri-delete-bin-line mr-1"></i>حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    sessionsList.innerHTML = html;
}


function attachCaseViewListeners(caseId) {
    
    document.getElementById('edit-case-data-btn').addEventListener('click', () => {
        (async () => {
            try {
                sessionStorage.setItem('returnToPage', 'search');
                sessionStorage.setItem('editCaseId', String(caseId));
            } catch (_) { }
            try {
                const caseRecord = await getById('cases', caseId);
                if (caseRecord && caseRecord.clientId) {
                    try { sessionStorage.setItem('returnToClientId', String(caseRecord.clientId)); } catch (_) { }
                }
            } catch (_) { }
            window.location.href = 'new.html';
        })();
    });
    
    
    document.getElementById('close-case-view-btn').addEventListener('click', () => {
        navigateBack();
    });
    
    
    document.getElementById('add-new-session-btn').addEventListener('click', async () => {
        stateManager.currentCaseId = caseId;
        try {
            const currentPath = String(window.location.pathname || '');
            if (currentPath.includes('new.html')) {
                sessionStorage.setItem('returnToPage', 'new');
            } else if (currentPath.includes('search.html')) {
                sessionStorage.setItem('returnToPage', 'search');
            }
            try {
                const caseRecord = await getById('cases', caseId);
                if (caseRecord && caseRecord.clientId) {
                    sessionStorage.setItem('returnToClientId', String(caseRecord.clientId));
                }
            } catch (_) { }
        } catch (_) { }
        window.location.href = `session-edit.html?caseId=${caseId}`;
    });
    
    
    document.querySelectorAll('.edit-session-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const sessionId = parseInt(btn.dataset.sessionId);
            try {
                const currentPath = String(window.location.pathname || '');
                if (currentPath.includes('new.html')) {
                    sessionStorage.setItem('returnToPage', 'new');
                } else if (currentPath.includes('search.html')) {
                    sessionStorage.setItem('returnToPage', 'search');
                }
            } catch (_) { }
            window.location.href = `session-edit.html?sessionId=${sessionId}`;
        });
    });
    
    
    document.querySelectorAll('.delete-session-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const sessionId = parseInt(btn.dataset.sessionId);
            const ok = window.safeConfirm ? await safeConfirm('هل أنت متأكد من حذف هذه الجلسة؟') : confirm('هل أنت متأكد من حذف هذه الجلسة؟');
            if (!ok) return;
            try {
                await deleteRecord('sessions', sessionId);
                showToast('تم حذف الجلسة بنجاح', 'success');
                await loadCaseSessions(stateManager.currentCaseId);
                await updateCountersInHeader();
            } catch (error) {
                showToast('حدث خطأ أثناء حذف الجلسة', 'error');
            }
        });
    });
}


async function displayOpponentViewForm(opponentId) {
    try {
        const opponent = await getById('opponents', opponentId);
        if (!opponent) {
            showToast('لم يتم العثور على بيانات الخصم', 'error');
            return;
        }

        const cases = await getFromIndex('cases', 'opponentId', opponentId);
        const latestCase = (Array.isArray(cases) ? cases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [])[0] || null;
        
        document.getElementById('modal-title').textContent = `9. عرض بيانات الخصم: ${opponent.name}`;
        const modalContent = document.getElementById('modal-content');
        modalContent.classList.remove('search-modal-content');
        
        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- بيانات الخصم -->
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 class="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                        <i class="ri-shield-user-line"></i>البيانات الشخصية
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <i class="ri-user-line text-red-600"></i>
                                <div>
                                    <span class="text-sm text-gray-600">الاسم:</span>
                                    <p class="font-medium text-gray-800">${opponent.name || 'غير محدد'}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="ri-briefcase-line text-red-600"></i>
                                <div>
                                    <span class="text-sm text-gray-600">الصفة:</span>
                                    <p class="font-medium text-gray-800">${(latestCase && latestCase.opponentCapacity) ? latestCase.opponentCapacity : 'غير محدد'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <i class="ri-phone-line text-red-600"></i>
                                <div>
                                    <span class="text-sm text-gray-600">الهاتف:</span>
                                    <p class="font-medium text-gray-800">${opponent.phone || 'غير محدد'}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="ri-map-pin-line text-red-600"></i>
                                <div>
                                    <span class="text-sm text-gray-600">العنوان:</span>
                                    <p class="font-medium text-gray-800">${opponent.address || 'غير محدد'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- القضايا المرتبطة -->
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-orange-800 flex items-center gap-2">
                            <i class="ri-briefcase-line"></i>القضايا المرتبطة
                        </h3>
                        <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            ${cases.length} قضية
                        </span>
                    </div>
                    
                    <div id="opponent-cases-list" class="space-y-3 max-h-60 overflow-y-auto">
                        ${cases.length === 0 ? 
                            '<div class="text-center text-gray-500 py-8"><i class="ri-briefcase-line text-2xl mb-2"></i><p>لا توجد قضايا مسجلة ضد هذا الخصم</p></div>' 
                            : ''
                        }
                    </div>
                </div>

                <!-- أزرار التحكم -->
                <div class="flex gap-3 pt-4 border-t border-gray-200">
                    <button id="edit-opponent-data-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition-all font-bold" data-opponent-id="${opponentId}">
                        <i class="ri-edit-line mr-2"></i>تعديل البيانات
                    </button>
                    <button id="close-opponent-view-btn" class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        <i class="ri-close-line mr-2"></i>إغلاق
                    </button>
                </div>
            </div>
        `;

        
        await loadOpponentCasesForView(cases);
        
        
        attachOpponentViewListeners(opponentId);
        
    } catch (error) {
        showToast('حدث خطأ في تحميل بيانات الخصم', 'error');
    }
}


async function loadOpponentCasesForView(cases) {
    const casesList = document.getElementById('opponent-cases-list');
    
    if (cases.length === 0) return;
    
    let html = '';
    for (const caseRecord of cases) {
        const client = await getById('clients', caseRecord.clientId);
        const sessions = await getFromIndex('sessions', 'caseId', caseRecord.id);
        
        html += `
            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-bold text-lg text-orange-700 mb-2">
                            قضية رقم: ${caseRecord.caseNumber || 'غير محدد'} لسنة ${caseRecord.caseYear || 'غير محدد'}
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                            <div>
                                <p><span class="font-medium">الموكل:</span> ${client ? client.name : 'غير محدد'}</p>
                                <p><span class="font-medium">نوع القضية:</span> ${caseRecord.caseType || 'غير محدد'}</p>
                                <p><span class="font-medium">المحكمة:</span> ${caseRecord.court || 'غير محدد'}</p>
                            </div>
                            <div>
                                <p><span class="font-medium">رقم التوكيل:</span> ${caseRecord.poaNumber || 'غير محدد'}</p>
                                <p><span class="font-medium">حالة القضية:</span> ${caseRecord.caseStatus || 'غير محدد'}</p>
                                <p><span class="font-medium">عدد الجلسات:</span> ${sessions.length}</p>
                            </div>
                        </div>
                        ${caseRecord.subject ? `<p class="mt-2 text-sm text-gray-700"><span class="font-medium">الموضوع:</span> ${caseRecord.subject}</p>` : ''}
                    </div>
                    <div class="flex flex-col gap-2 ml-4">
                        <button class="view-case-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors" data-case-id="${caseRecord.id}">
                            <i class="ri-eye-line mr-1"></i>عرض
                        </button>
                        <button class="edit-case-btn bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors" data-case-id="${caseRecord.id}">
                            <i class="ri-edit-line mr-1"></i>تعديل
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    casesList.innerHTML = html;
}


function attachOpponentViewListeners(opponentId) {
    
    document.getElementById('edit-opponent-data-btn').addEventListener('click', () => {
        navigateTo(() => displayOpponentEditForm(opponentId));
    });
    
    
    document.getElementById('close-opponent-view-btn').addEventListener('click', () => {
        closeModal();
    });
    
    
    document.querySelectorAll('.view-case-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const caseId = parseInt(btn.dataset.caseId);
            displayCaseViewForm(caseId);
        });
    });
    
    
    document.querySelectorAll('.edit-case-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const caseId = parseInt(btn.dataset.caseId);
            try {
                sessionStorage.setItem('returnToPage', 'search');
                sessionStorage.setItem('editCaseId', String(caseId));
            } catch (_) { }
            try {
                const caseRecord = await getById('cases', caseId);
                if (caseRecord && caseRecord.clientId) {
                    try { sessionStorage.setItem('returnToClientId', String(caseRecord.clientId)); } catch (_) { }
                }
            } catch (_) { }
            window.location.href = 'new.html';
        });
    });
}


window.attachAddSessionButtonListener = function attachAddSessionButtonListener() {
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
                
                try {
                    const currentPath = String(window.location.pathname || '');
                    if (currentPath.includes('new.html')) {
                        sessionStorage.setItem('returnToPage', 'new');
                    } else if (currentPath.includes('search.html')) {
                        sessionStorage.setItem('returnToPage', 'search');
                    }
                    try {
                        if (caseRecord && caseRecord.clientId) {
                            sessionStorage.setItem('returnToClientId', String(caseRecord.clientId));
                        }
                    } catch (_) { }
                } catch (_) { }
                window.location.href = `session-edit.html?caseId=${caseId}`;
            } catch (error) {
                showToast('حدث خطأ في التحقق من بيانات القضية', 'error');
            }
        });
    });
}