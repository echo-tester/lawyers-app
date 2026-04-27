
function displayClerkPaperForm(paperId = null) {
    document.body.classList.add('form-active');
    navigateTo(async () => {
        const paperData = paperId ? await getById('clerkPapers', paperId) : {};
        
        document.getElementById('modal-title').textContent = paperId ? 'تعديل ورقة محضر' : 'إضافة ورقة محضر جديدة';
        const modalContent = document.getElementById('modal-content');
        const modalContainer = document.getElementById('modal-container');
        
        
        modalContainer.classList.remove('max-w-5xl', 'max-w-7xl', 'mx-4');
        modalContainer.classList.add('w-full');
        modalContent.classList.remove('search-modal-content');
        
        
        const clients = await getAllClients();
        
        modalContent.innerHTML = `
            <div class="w-full h-full p-2">
                <div class="w-full mx-auto">
                    <form id="clerk-paper-form" class="space-y-3">
                        <!-- السطر الأول: الموكل ونوع الورقة -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- الموكل -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="client-name" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">الموكل</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="client-name" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${paperData.clientId ? ((clients.find(c=>c.id===paperData.clientId)||{}).name||'') : ''}" placeholder="اسم الموكل..." required>
                                        <button type="button" id="client-name-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="client-name-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="client-select" name="clientId" value="${paperData.clientId || ''}">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- نوع الورقة -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="paper-type-name" class="px-3 py-2 border-2 border-blue-300 bg-blue-50 text-sm font-bold text-blue-800 shrink-0 w-28 md:w-32 text-right rounded-r-lg">نوع الورقة</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="paper-type-name" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-blue-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${paperData.paperType || ''}" placeholder="مثال: إعلان" required>
                                        <button type="button" id="paper-type-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="paper-type-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="paper-type" name="paperType" value="${paperData.paperType || ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الثاني: رقم الورقة وقلم المحضرين -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- رقم الورقة -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="paper-number" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">رقم الورقة</label>
                                    <input type="text" id="paper-number" name="paperNumber" value="${paperData.paperNumber || ''}" placeholder="مثال: رقم القضية" required class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 -mr-px font-bold">
                                </div>
                            </div>
                            
                            <!-- قلم المحضرين -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="clerk-office-name" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">قلم المحضرين</label>
                                    <div class="flex-1 relative -mr-px">
                                        <input type="text" id="clerk-office-name" autocomplete="off" class="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold placeholder:text-sm placeholder:font-normal placeholder:text-gray-400" value="${paperData.clerkOffice || ''}" placeholder="مثال: قلم محضري القاهرة">
                                        <button type="button" id="clerk-office-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                        <div id="clerk-office-dropdown" class="autocomplete-results hidden"></div>
                                        <input type="hidden" id="clerk-office" name="clerkOffice" value="${paperData.clerkOffice || ''}">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الثالث: تاريخ التسليم وتاريخ الاستلام -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- تاريخ التسليم -->
                            <div>
                                <div class="flex items-stretch relative">
                                    <label for="delivery-date" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">تاريخ التسليم</label>
                                    <input type="text" id="delivery-date" name="deliveryDate" value="${paperData.deliveryDate || ''}" placeholder="مثال: 15/12/2025" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 -mr-px font-bold">
                                </div>
                            </div>
                            
                            <!-- تاريخ الاستلام -->
                            <div>
                                <div class="flex items-stretch relative">
                                    <label for="receipt-date" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">تاريخ الاستلام</label>
                                    <input type="text" id="receipt-date" name="receiptDate" value="${paperData.receiptDate || ''}" placeholder="مثال: 18/12/2025" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 -mr-px font-bold">
                                </div>
                            </div>
                        </div>
                        
                        <!-- السطر الرابع: الملاحظات -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- الملاحظات -->
                            <div>
                                <div class="flex items-stretch">
                                    <label for="notes" class="px-3 py-2 border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 shrink-0 w-28 md:w-32 text-right rounded-r-lg">ملاحظات</label>
                                    <input type="text" id="notes" name="notes" value="${paperData.notes || ''}" class="flex-1 px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 -mr-px font-bold" placeholder="اكتب ملاحظاتك هنا...">
                                </div>
                            </div>
                        </div>
                        
                        <!-- أزرار الحفظ والإلغاء -->
                        <div class="mt-auto pt-4">
                            <div class="sticky bottom-0 left-0 right-0 z-10 bg-gray-50 border-t border-gray-200 py-3">
                                <div class="flex justify-center">
                                    <div class="bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm flex items-center gap-2">
                                        <button type="submit" class="w-auto px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md font-semibold shadow-sm flex items-center justify-center gap-1">
                                            <i class="ri-save-line text-base"></i>
                                            ${paperId ? 'تحديث الورقة' : 'حفظ الورقة'}
                                        </button>
                                        <button type="button" id="cancel-paper-btn" class="w-auto px-4 py-2 text-sm bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-md font-semibold shadow-sm flex items-center justify-center gap-1">
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
                pageTitle.textContent = paperId ? 'تعديل ورقة محضر' : 'إضافة ورقة محضر جديدة';
                
                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                
                newBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateBack();
                });
            }
        }, 100);
        


        
        attachClerkPaperFormListeners(paperId);
    });
}
