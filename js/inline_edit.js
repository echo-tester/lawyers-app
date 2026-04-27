async function displayEditClientFormInline(clientId) {
    try {
        const client = await getById('clients', clientId);
        if (!client) {
            showToast('لم يتم العثور على بيانات الموكل', 'error');
            return;
        }

        let latestCap = '';
        try {
            const cases = await getFromIndex('cases', 'clientId', clientId);
            const sorted = Array.isArray(cases) ? cases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
            for (const cs of sorted) {
                const v = String(cs && cs.clientCapacity ? cs.clientCapacity : '').trim();
                if (v) { latestCap = v; break; }
            }
        } catch (_) { }

        let selectedCase = null;
        try {
            const restoredClientId = parseInt(sessionStorage.getItem('clientViewSelectedClientId') || '0', 10);
            const restoredCaseId = parseInt(sessionStorage.getItem('clientViewSelectedCaseId') || '0', 10);
            if (restoredClientId && restoredClientId === clientId && restoredCaseId) {
                selectedCase = await getById('cases', restoredCaseId);
                if (selectedCase && selectedCase.clientId !== clientId) selectedCase = null;
            }
        } catch (_) {}

        const capValue = (selectedCase && String(selectedCase.clientCapacity || '').trim())
            ? String(selectedCase.clientCapacity || '')
            : (latestCap || client.capacity || '');

        const pageHeaderTitle = document.getElementById('page-title');
        if (pageHeaderTitle) pageHeaderTitle.textContent = 'تعديل البيانات';
        const modalTitleEl = document.getElementById('modal-title');
        if (modalTitleEl) modalTitleEl.textContent = '';
        const modalContent = document.getElementById('modal-content');
        modalContent.classList.remove('search-modal-content');
        

        stateManager.currentClientId = clientId;
        
        modalContent.innerHTML = `
            <style id="inline-edit-mobile-style">
                @media (max-width: 768px) {
                    .inline-edit-shell {
                        background: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .inline-edit-grid {
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        border-radius: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .inline-edit-actions {
                        padding-top: 12px !important;
                    }
                }
            </style>

            <div class="inline-edit-shell bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl p-6 shadow-2xl border border-blue-300">
                <form id="edit-client-form" class="space-y-6">
                    <!-- الحقول في شبكة -->
                    <div class="inline-edit-grid grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-blue-200 shadow-md">
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="client-name" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-blue-50 border-2 border-blue-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    اسم الموكل
                                </label>
                                <div class="relative flex-1 autocomplete-container">
                                    <input type="text" id="client-name" name="name" value="${client.name || ''}" required 
                                           class="w-full p-3 bg-white border-2 border-blue-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right transition-colors font-semibold text-gray-800">
                                    <button type="button" id="client-name-edit-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                    <div id="client-name-edit-dropdown" class="autocomplete-results hidden"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="client-capacity" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-blue-50 border-2 border-blue-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    صفته
                                </label>
                                <div class="relative flex-1 autocomplete-container">
                                    <input type="text" id="client-capacity" name="capacity" value="${capValue}" 
                                           class="w-full p-3 bg-white border-2 border-blue-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right transition-colors font-semibold text-gray-800">
                                    <button type="button" id="client-capacity-edit-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                    <div id="client-capacity-edit-dropdown" class="autocomplete-results hidden"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="client-address" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-blue-50 border-2 border-blue-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    عنوانه
                                </label>
                                <div class="relative flex-1 autocomplete-container">
                                    <input type="text" id="client-address" name="address" value="${client.address || ''}" 
                                           class="w-full p-3 bg-white border-2 border-blue-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right transition-colors font-semibold text-gray-800">
                                    <button type="button" id="client-address-edit-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                    <div id="client-address-edit-dropdown" class="autocomplete-results hidden"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="client-phone" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-blue-50 border-2 border-blue-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    الهاتف
                                </label>
                                <input type="text" id="client-phone" name="phone" value="${client.phone || ''}" 
                                       class="flex-1 p-3 bg-white border-2 border-blue-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right transition-colors font-semibold text-gray-800">
                            </div>
                        </div>
                        
                                            </div>
                    
                    <!-- أزرار التحكم -->
                    <div class="inline-edit-actions flex flex-col sm:flex-row gap-4 pt-6">
                        <button type="submit" class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg font-bold flex items-center justify-center gap-3">
                            <i class="ri-save-3-line text-xl"></i>
                            <span>حفظ التعديلات</span>
                        </button>
                        <button type="button" id="cancel-edit-btn" class="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg font-bold flex items-center justify-center gap-3">
                            <i class="ri-close-line text-xl"></i>
                            <span>إلغاء</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        initAutocomplete('client-name', 'client-name-edit-dropdown', 'client-name-edit-toggle');
        initAutocomplete('client-capacity', 'client-capacity-edit-dropdown', 'client-capacity-edit-toggle');
        initAutocomplete('client-address', 'client-address-edit-dropdown', 'client-address-edit-toggle');

        document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData.entries());
            
            try {
                const capacityValue = String(updatedData.capacity || '');
                if (updatedData && Object.prototype.hasOwnProperty.call(updatedData, 'capacity')) {
                    try { delete updatedData.capacity; } catch (_) { updatedData.capacity = undefined; }
                }
                await updateRecord('clients', clientId, updatedData);

                try {
                    if (selectedCase && selectedCase.id != null) {
                        await updateRecord('cases', selectedCase.id, { clientCapacity: capacityValue });
                    }
                } catch (_) {}

                showToast('تم تحديث بيانات الموكل بنجاح', 'success');
                await updateCountersInHeader();

                
                navigateBack();
            } catch (error) {
                showToast('حدث خطأ في تحديث البيانات', 'error');
            }
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', async () => {
            
            navigateBack();
        });

    } catch (error) {
        showToast('حدث خطأ في تحميل نموذج التعديل', 'error');
    }
}

function setupInlineCombobox(inputId, dropdownId, toggleId, items) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const toggle = document.getElementById(toggleId);
    if (!input || !dropdown) return;
    const container = input.closest('.autocomplete-container') || document;
    let currentList = Array.isArray(items) ? items.slice() : [];
    function render(list) {
        dropdown.innerHTML = (list || []).map((v, idx) => `<div class="autocomplete-item" data-index="${idx}">${v}</div>`).join('');
        dropdown.classList.remove('hidden');
        dropdown.style.top = '';
        dropdown.style.bottom = '';
    }
    function hide() { dropdown.classList.add('hidden'); }
    input.addEventListener('input', () => {
        const q = (input.value || '').trim().toLowerCase();
        const base = Array.isArray(items) ? items : [];
        const filtered = base.filter(v => ((v || '').toLowerCase().includes(q)));
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
        const idx = parseInt(el.getAttribute('data-index'), 10);
        const v = currentList[idx];
        input.value = v || '';
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

async function getInlineCapacityOptions() {
    try {
        const cases = await getAllCases();
        const s = new Set();
        (cases || []).forEach(cs => {
            if (cs && cs.clientCapacity && cs.clientCapacity.trim()) s.add(cs.clientCapacity.trim());
            if (cs && cs.opponentCapacity && cs.opponentCapacity.trim()) s.add(cs.opponentCapacity.trim());
        });
        return Array.from(s).filter(Boolean).sort();
    } catch (e) { return []; }
}

async function getInlineAddressOptions() {
    try {
        const [clients, opponents, cases] = await Promise.all([
            getAllClients(),
            getAllOpponents(),
            getAllCases()
        ]);
        const s = new Set();
        (clients || []).forEach(c => { if (c && c.address && c.address.trim()) s.add(c.address.trim()); });
        (opponents || []).forEach(o => { if (o && o.address && o.address.trim()) s.add(o.address.trim()); });
        (cases || []).forEach(cs => {
            if (cs && cs.clientAddress && cs.clientAddress.trim()) s.add(cs.clientAddress.trim());
            if (cs && cs.opponentAddress && cs.opponentAddress.trim()) s.add(cs.opponentAddress.trim());
        });
        return Array.from(s).filter(Boolean).sort();
    } catch (e) { return []; }
}

async function getInlineClientNames() {
    try {
        const clients = await getAllClients();
        return Array.from(new Set((clients || []).map(c => (c && c.name ? c.name.trim() : '')).filter(Boolean))).sort();
    } catch (e) { return []; }
}

async function getInlineOpponentNames() {
    try {
        const opponents = await getAllOpponents();
        return Array.from(new Set((opponents || []).map(o => (o && o.name ? o.name.trim() : '')).filter(Boolean))).sort();
    } catch (e) { return []; }
}

async function initAutocomplete(inputId, dropdownId, toggleId) {
    let items = [];
    try {
        if (inputId === 'client-name') {
            items = await getInlineClientNames();
        } else if (inputId === 'opponent-name') {
            items = await getInlineOpponentNames();
        } else if (inputId.includes('capacity')) {
            items = await getInlineCapacityOptions();
        } else if (inputId.includes('address')) {
            items = await getInlineAddressOptions();
        } else {
            return;
        }
        setupInlineCombobox(inputId, dropdownId, toggleId, items);
    } catch (e) {}
}


async function displayEditOpponentFormInline(opponentId) {
    try {
        const opponent = await getById('opponents', opponentId);
        if (!opponent) {
            showToast('لم يتم العثور على بيانات الخصم', 'error');
            return;
        }

        let latestCap = '';
        try {
            const cases = await getFromIndex('cases', 'opponentId', opponentId);
            const sorted = Array.isArray(cases) ? cases.slice().sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
            for (const cs of sorted) {
                const v = String(cs && cs.opponentCapacity ? cs.opponentCapacity : '').trim();
                if (v) { latestCap = v; break; }
            }
        } catch (_) { }

        let selectedCase = null;
        try {
            const restoredCaseId = parseInt(sessionStorage.getItem('clientViewSelectedCaseId') || '0', 10);
            if (restoredCaseId) {
                selectedCase = await getById('cases', restoredCaseId);
                if (selectedCase && selectedCase.opponentId !== opponentId) selectedCase = null;
            }
        } catch (_) {}

        const capValue = (selectedCase && String(selectedCase.opponentCapacity || '').trim())
            ? String(selectedCase.opponentCapacity || '')
            : (latestCap || opponent.capacity || '');


        const cases = await getFromIndex('cases', 'opponentId', opponentId);
        const clientId = selectedCase ? selectedCase.clientId : (cases.length > 0 ? cases[0].clientId : null);

        const pageHeaderTitle = document.getElementById('page-title');
        if (pageHeaderTitle) pageHeaderTitle.textContent = 'تعديل البيانات';
        const modalTitleEl2 = document.getElementById('modal-title');
        if (modalTitleEl2) modalTitleEl2.textContent = '';
        const modalContent = document.getElementById('modal-content');
        modalContent.classList.remove('search-modal-content');
        

        stateManager.currentClientId = clientId;
        
        modalContent.innerHTML = `
            <style id="inline-edit-mobile-style">
                @media (max-width: 768px) {
                    .inline-edit-shell {
                        background: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .inline-edit-grid {
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        border-radius: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .inline-edit-actions {
                        padding-top: 12px !important;
                    }
                }
            </style>

            <div class="inline-edit-shell bg-gradient-to-br from-red-100 to-pink-200 rounded-2xl p-6 shadow-2xl border border-red-300">
                <form id="edit-opponent-form" class="space-y-6">
                    <!-- الحقول في شبكة -->
                    <div class="inline-edit-grid grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-red-200 shadow-md">
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="opponent-name" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-red-50 border-2 border-red-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    اسم الخصم
                                </label>
                                <div class="relative flex-1 autocomplete-container">
                                    <input type="text" id="opponent-name" name="name" value="${opponent.name || ''}" required 
                                           class="w-full p-3 bg-white border-2 border-red-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right transition-colors font-semibold text-gray-800">
                                    <button type="button" id="opponent-name-edit-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                    <div id="opponent-name-edit-dropdown" class="autocomplete-results hidden"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="opponent-capacity" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-red-50 border-2 border-red-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    صفته
                                </label>
                                <div class="relative flex-1 autocomplete-container">
                                    <input type="text" id="opponent-capacity" name="capacity" value="${capValue}" 
                                           class="w-full p-3 bg-white border-2 border-red-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right transition-colors font-semibold text-gray-800">
                                    <button type="button" id="opponent-capacity-edit-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                    <div id="opponent-capacity-edit-dropdown" class="autocomplete-results hidden"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="opponent-address" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-red-50 border-2 border-red-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    عنوانه
                                </label>
                                <div class="relative flex-1 autocomplete-container">
                                    <input type="text" id="opponent-address" name="address" value="${opponent.address || ''}" 
                                           class="w-full p-3 bg-white border-2 border-red-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right transition-colors font-semibold text-gray-800">
                                    <button type="button" id="opponent-address-edit-toggle" class="absolute inset-y-0 left-0 flex items-center px-2 text-gray-500 hover:text-gray-700"><i class="ri-arrow-down-s-line"></i></button>
                                    <div id="opponent-address-edit-dropdown" class="autocomplete-results hidden"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="inline-flex w-full items-stretch">
                                <label for="opponent-phone" class="w-24 md:w-28 shrink-0 pr-3 py-3 text-sm font-semibold text-gray-700 bg-red-50 border-2 border-red-300 rounded-r-lg border-l-0 flex items-center justify-start text-right">
                                    الهاتف
                                </label>
                                <input type="text" id="opponent-phone" name="phone" value="${opponent.phone || ''}" 
                                       class="flex-1 p-3 bg-white border-2 border-red-300 rounded-l-lg border-r-0 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right transition-colors font-semibold text-gray-800">
                            </div>
                        </div>
                        
                                            </div>
                    
                    <!-- أزرار التحكم -->
                    <div class="inline-edit-actions flex flex-col sm:flex-row gap-4 pt-6">
                        <button type="submit" class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg font-bold flex items-center justify-center gap-3">
                            <i class="ri-save-3-line text-xl"></i>
                            <span>حفظ التعديلات</span>
                        </button>
                        <button type="button" id="cancel-edit-opponent-btn" class="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg font-bold flex items-center justify-center gap-3">
                            <i class="ri-close-line text-xl"></i>
                            <span>إلغاء</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        initAutocomplete('opponent-name', 'opponent-name-edit-dropdown', 'opponent-name-edit-toggle');
        initAutocomplete('opponent-capacity', 'opponent-capacity-edit-dropdown', 'opponent-capacity-edit-toggle');
        initAutocomplete('opponent-address', 'opponent-address-edit-dropdown', 'opponent-address-edit-toggle');

        document.getElementById('edit-opponent-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = Object.fromEntries(formData.entries());
            
            try {
                const capacityValue = String(updatedData.capacity || '');
                if (updatedData && Object.prototype.hasOwnProperty.call(updatedData, 'capacity')) {
                    try { delete updatedData.capacity; } catch (_) { updatedData.capacity = undefined; }
                }
                await updateRecord('opponents', opponentId, updatedData);

                try {
                    if (selectedCase && selectedCase.id != null) {
                        await updateRecord('cases', selectedCase.id, { opponentCapacity: capacityValue });
                    }
                } catch (_) {}

                showToast('تم تحديث بيانات الخصم بنجاح', 'success');
                await updateCountersInHeader();

                
                navigateBack();
            } catch (error) {
                showToast('حدث خطأ في تحديث البيانات', 'error');
            }
        });

        document.getElementById('cancel-edit-opponent-btn').addEventListener('click', async () => {
            
            navigateBack();
        });

    } catch (error) {
        showToast('حدث خطأ في تحميل نموذج التعديل', 'error');
    }
}