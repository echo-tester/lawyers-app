
function displayExpertSessionForm(sessionId = null) {
    document.body.classList.add('form-active');
    navigateTo(async () => {
        const sessionData = sessionId ? await getById('expertSessions', sessionId) : {};
        
        document.getElementById('modal-title').textContent = sessionId ? 'تعديل جلسة خبير' : 'إضافة جلسة خبير جديدة';
        const modalContent = document.getElementById('modal-content');
        const modalContainer = document.getElementById('modal-container');
        
        
        modalContainer.classList.remove('max-w-5xl', 'max-w-7xl', 'mx-4');
        modalContainer.classList.add('w-full');
        modalContent.classList.remove('search-modal-content');
        
        
        const clients = await getAllClients();
        
        modalContent.innerHTML = `
            <div class="w-full h-full p-2">
                <div class="w-full mx-auto">
                    <form id="expert-session-form" class="space-y-3">
                        <!-- السطر الأول: الموكل ورقم القضية -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- الموكل -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="client-name" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">الموكل</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="client-name" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${sessionData.clientId ? ((clients.find(c=>c.id===sessionData.clientId)||{}).name||'') : ''}" placeholder="اسم الموكل..." required>
                                        <button type="button" id="client-name-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="client-name-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="client-select" name="clientId" value="${sessionData.clientId || ''}">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- رقم القضية -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="case-number-display" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">رقم القضية</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="case-number-display" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${sessionData.caseNumber || ''}" placeholder="مثال: 123">
                                        <button type="button" id="case-number-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="case-number-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="case-number" name="caseNumber" value="${sessionData.caseNumber || ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الثاني: نوع الجلسة والحالة -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- نوع الجلسة -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="session-type-display" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">نوع الجلسة</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="session-type-display" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${sessionData.sessionType || ''}" placeholder="مثال: جلسة فحص">
                                        <button type="button" id="session-type-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="session-type-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="session-type" name="sessionType" value="${sessionData.sessionType || ''}">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- الحالة -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="status-display" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">الحالة</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="status-display" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${sessionData.status || ''}" placeholder="مثال: مجدولة">
                                        <button type="button" id="status-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="status-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="status" name="status" value="${sessionData.status || ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الثالث: تاريخ الجلسة ووقت الجلسة -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- تاريخ الجلسة -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="session-date" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">تاريخ الجلسة</label>
                                    <input type="text" id="session-date" name="sessionDate" value="${sessionData.sessionDate || ''}" placeholder="مثال: 29/9/2026" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right -mr-px font-bold">
                                </div>
                            </div>
                            
                            <!-- وقت الجلسة -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="session-time" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">وقت الجلسة</label>
                                    <input type="time" id="session-time" name="sessionTime" value="${sessionData.sessionTime || ''}" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right -mr-px font-bold">
                                </div>
                            </div>
                        </div>

                        <!-- السطر الرابع: رقم الصادر ورقم الوارد -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- رقم الصادر -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="outgoing-number" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">رقم الصادر</label>
                                    <input type="text" id="outgoing-number" name="outgoingNumber" value="${sessionData.outgoingNumber || ''}" placeholder="مثال: 15" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right -mr-px font-bold">
                                </div>
                            </div>

                            <!-- رقم الوارد -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="incoming-number" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">رقم الوارد</label>
                                    <input type="text" id="incoming-number" name="incomingNumber" value="${sessionData.incomingNumber || ''}" placeholder="مثال: 22" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right -mr-px font-bold">
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الخامس: اسم الخبير والملاحظات -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- اسم الخبير -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="expert-name-display" class="px-3 py-2 border-2 border-purple-300 bg-purple-50 text-sm font-bold text-purple-800 shrink-0 w-28 md:w-32 text-right rounded-r-lg">اسم الخبير</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="expert-name-display" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-purple-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${sessionData.expertName || ''}" placeholder="مثال: د. أحمد علي">
                                        <button type="button" id="expert-name-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="expert-name-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="expert-name" name="expertName" value="${sessionData.expertName || ''}">
                                    </div>
                                </div>
                            </div>

                            <!-- الملاحظات -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="notes" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">ملاحظات</label>
                                    <input type="text" id="notes" name="notes" value="${sessionData.notes || ''}" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 -mr-px font-bold" placeholder="اكتب ملاحظاتك هنا...">
                                </div>
                            </div>
                        </div>
                        
                        <!-- أزرار الحفظ والإلغاء -->
                        <div class="mt-auto pt-4">
                            <div class="sticky bottom-0 left-0 right-0 z-10 bg-gray-50 border-t border-gray-200 py-3">
                                <div class="flex justify-center">
                                    <div class="bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm flex items-center gap-2">
                                        <button type="submit" class="w-auto px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-md font-semibold shadow-sm flex items-center justify-center gap-1">
                                            <i class="ri-save-line text-base"></i>
                                            ${sessionId ? 'تحديث الجلسة' : 'حفظ الجلسة'}
                                        </button>
                                        <button type="button" id="cancel-session-btn" class="w-auto px-4 py-2 text-sm bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-md font-semibold shadow-sm flex items-center justify-center gap-1">
                                            <i class="ri-close-line text-base"></i>
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const backBtn = document.getElementById('back-to-main');
            const pageTitle = document.getElementById('page-title');
            if (backBtn && pageTitle) {
                backBtn.innerHTML = `
                    <i class="ri-arrow-right-line text-white text-lg"></i>
                    <span class="text-white">رجوع</span>
                `;
                pageTitle.textContent = sessionId ? 'تعديل جلسة خبير' : 'إضافة جلسة خبير جديدة';
                
                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                
                newBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateBack();
                });
            }
        }, 100);
        


        
        attachExpertSessionFormListeners(sessionId);
    });
}
