
let archiveViewMode = 'list'; 
let archiveSortBy = 'date'; 
let archiveSortOrder = 'desc'; 
let expandedClients = new Set(); 
let activeArchiveFilter = null; 


function saveArchiveState() {
    const state = {
        viewMode: archiveViewMode,
        sortBy: archiveSortBy,
        sortOrder: archiveSortOrder,
        expandedClients: Array.from(expandedClients)
    };
    sessionStorage.setItem('archiveState', JSON.stringify(state));
}

function restoreArchiveState() {
    try {
        const savedStateStr = sessionStorage.getItem('archiveState');
        if (savedStateStr) {
            const savedState = JSON.parse(savedStateStr);
            archiveViewMode = savedState.viewMode || 'list';
            archiveSortBy = savedState.sortBy || 'date';
            archiveSortOrder = savedState.sortOrder || 'desc';
            expandedClients = new Set(savedState.expandedClients || []);
        }
    } catch (error) {
    }
}


function displayArchiveModal() {
    document.getElementById('modal-title').textContent = 'الأرشيف';
    const modalContent = document.getElementById('modal-content');
    const modalContainer = document.getElementById('modal-container');


    modalContainer.classList.remove('max-w-5xl');
    modalContainer.classList.add('max-w-7xl', 'mx-4');

    modalContent.classList.remove('search-modal-content');


    restoreArchiveState();

    modalContent.innerHTML = `
        <div class="flex gap-6 h-[75vh] search-layout">
            <!-- الجانب الأيمن: شريط البحث والإحصائيات -->
            <div class="w-1/4 space-y-4 search-left-pane">
                <!-- أزرار تبديل طرق العرض -->
                <div class="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                    <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <i class="ri-eye-line text-blue-500"></i>
                        طرق العرض
                    </h3>
                    <div class="flex bg-gray-100 rounded-lg p-1 w-full">
                        <button id="list-view-btn" class="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${archiveViewMode === 'list' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}">
                            <i class="ri-list-check ml-1"></i>
                            قائمة
                        </button>
                        <button id="clients-view-btn" class="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${archiveViewMode === 'clients' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}">
                            <i class="ri-user-line ml-1"></i>
                            موكلين
                        </button>
                    </div>
                </div>

                <!-- شريط البحث -->
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-sm">
                    <div class="space-y-3">
                        <div class="relative">
                            <input type="text" id="archive-search" 
                                   placeholder="ابحث بالموكل أو رقم القضية..." 
                                   class="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right shadow-sm pr-10">
                            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <i class="ri-search-2-line text-gray-400 text-lg"></i>
                            </div>
                        </div>
                        
                        <button id="cycle-archive-sort" class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2">
                            <i class="ri-sort-desc text-lg"></i>
                            <span>فرز: التاريخ (الأحدث)</span>
                        </button>
                    </div>
                </div>



                <!-- إحصائيات سريعة -->
                <div id="archive-stats" class="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <h4 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="ri-bar-chart-line text-blue-600"></i>
                        إحصائيات القضايا
                    </h4>
                    <div class="space-y-4">
                        <!-- المربع الكبير: إجمالي القضايا -->
                        <div id="filter-all-btn" class="bg-blue-100 p-3 rounded-lg border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-blue-400">
                            <div class="text-center">
                                <p class="text-sm text-indigo-600 font-medium mb-1">إجمالي القضايا</p>
                                <p class="text-2xl font-bold text-indigo-700" id="total-cases-count">-</p>
                            </div>
                        </div>
                        
                        <!-- المربعين الصغيرين -->
                        <div class="grid grid-cols-2 gap-3">
                            <div id="filter-archived-btn" class="bg-red-50 p-3 rounded-lg border-2 border-red-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-red-400">
                                <div class="text-center">
                                    <p class="text-xs text-red-600 font-medium mb-1">المؤرشفة</p>
                                    <p class="text-lg font-bold text-red-700" id="archived-cases-count">-</p>
                                </div>
                            </div>
                            <div id="filter-active-btn" class="bg-green-50 p-3 rounded-lg border-2 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-green-400">
                                <div class="text-center">
                                    <p class="text-xs text-green-600 font-medium mb-1">النشطة</p>
                                    <p class="text-lg font-bold text-green-700" id="active-cases-count">-</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- الجانب الأيسر: قائمة الموكلين -->
            <div class="flex-1">
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm h-full overflow-hidden">
                    <div id="archive-list" class="space-y-4 h-full overflow-y-auto p-3">
                        <div class="text-center text-gray-500 py-12">
                            <i class="ri-loader-4-line animate-spin text-3xl mb-3"></i>
                            <p class="text-lg">جاري تحميل البيانات...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    attachArchiveListeners();
    loadArchiveContent();
    updateArchiveStats();

    
    try {
        requestAnimationFrame(() => {
            setupArchiveScrollBox();
            setupArchiveHoverScrollBehavior();
        });
        window.addEventListener('resize', setupArchiveScrollBox);
    } catch (e) {
        console.error(e);
    }
}


function attachArchiveListeners() {
    const archiveSearch = document.getElementById('archive-search');
    const cycleSortBtn = document.getElementById('cycle-archive-sort');
    const clientsViewBtn = document.getElementById('clients-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');



    let archiveSearchTimer = null;
    archiveSearch.addEventListener('input', async (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (archiveSearchTimer) clearTimeout(archiveSearchTimer);
        archiveSearchTimer = setTimeout(async () => {
            if (query.length < 2) {

                expandedClients.clear();
                saveArchiveState();
                loadArchiveContent();
                return;
            }
            await performArchiveSearch(query);
        }, 300);
    });

    
    archiveSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            }
        }
    });

    
    const sortOptions = [
        { sortBy: 'date', sortOrder: 'desc', label: 'فرز: التاريخ (الأحدث)', icon: 'ri-sort-desc' },
        { sortBy: 'date', sortOrder: 'asc', label: 'فرز: التاريخ (الأقدم)', icon: 'ri-sort-asc' },
        { sortBy: 'status', sortOrder: 'desc', label: 'فرز: الحالة (نشط أولاً)', icon: 'ri-checkbox-circle-line' },
        { sortBy: 'status', sortOrder: 'asc', label: 'فرز: الحالة (مؤرشف أولاً)', icon: 'ri-archive-line' }
    ];

    let currentSortIndex = sortOptions.findIndex(opt =>
        opt.sortBy === archiveSortBy && opt.sortOrder === archiveSortOrder
    );
    if (currentSortIndex === -1) currentSortIndex = 0;

    const updateSortButton = () => {
        const option = sortOptions[currentSortIndex];
        if (cycleSortBtn) {
            cycleSortBtn.innerHTML = `
                <i class="${option.icon} text-lg"></i>
                <span>${option.label}</span>
            `;
        }
    };

    updateSortButton();

    if (cycleSortBtn) {
        cycleSortBtn.addEventListener('click', () => {
            
            currentSortIndex = (currentSortIndex + 1) % sortOptions.length;
            const option = sortOptions[currentSortIndex];

            
            archiveSortBy = option.sortBy;
            archiveSortOrder = option.sortOrder;

            
            saveArchiveState();

            
            updateSortButton();

            
            loadArchiveContent();

            
            cycleSortBtn.classList.add('scale-95');
            setTimeout(() => cycleSortBtn.classList.remove('scale-95'), 100);
        });
    }

    clientsViewBtn.addEventListener('click', () => {
        archiveViewMode = 'clients';
        expandedClients.clear();
        saveArchiveState();
        displayArchiveModal();
    });

    listViewBtn.addEventListener('click', () => {
        archiveViewMode = 'list';
        expandedClients.clear();
        saveArchiveState();
        displayArchiveModal();
    });

    const archiveListEl = document.getElementById('archive-list');
    if (archiveListEl) {
        archiveListEl.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.case-card, .case-mini-card');
            if (card && archiveListEl.contains(card)) {
                card.classList.add('bg-blue-100', 'border-blue-400', 'ring-1', 'ring-blue-300');
            }
        });
        archiveListEl.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.case-card, .case-mini-card');
            if (card && archiveListEl.contains(card)) {
                card.classList.remove('bg-blue-100', 'border-blue-400', 'ring-1', 'ring-blue-300');
            }
        });
    }

    
    const filterAllBtn = document.getElementById('filter-all-btn');
    const filterArchivedBtn = document.getElementById('filter-archived-btn');
    const filterActiveBtn = document.getElementById('filter-active-btn');

    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', () => {
            
            if (activeArchiveFilter) {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar(); 
                activeArchiveFilter = null;
                removeArchiveFilterStyle();
                restoreArchiveSortButton();
                loadArchiveContent();
                showToast('عرض جميع القضايا', 'info');
            }
        });
    }

    if (filterArchivedBtn) {
        filterArchivedBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar(); 
            toggleArchiveFilter('archived', filterArchivedBtn);
        });
    }

    if (filterActiveBtn) {
        filterActiveBtn.addEventListener('click', () => {
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar(); 
            toggleArchiveFilter('active', filterActiveBtn);
        });
    }

}


function toggleArchiveFilter(filterType, element) {
    
    if (activeArchiveFilter === filterType) {
        activeArchiveFilter = null;
        removeArchiveFilterStyle();
        restoreArchiveSortButton(); 
        loadArchiveContent(); 
        showToast('تم إلغاء الفلتر', 'info');
    } else {
        
        activeArchiveFilter = filterType;
        removeArchiveFilterStyle();
        addArchiveFilterStyle(element);
        convertArchiveSortButtonToCancel(); 
        loadArchiveContent(); 
        const filterName = filterType === 'archived' ? 'المؤرشفة' : 'النشطة';
        showToast(`عرض القضايا ${filterName} فقط`, 'success');
    }
}


function convertArchiveSortButtonToCancel() {
    const sortBtn = document.getElementById('cycle-archive-sort');
    if (sortBtn) {
        sortBtn.innerHTML = `
            <i class="ri-close-circle-line text-lg"></i>
            <span>إلغاء الفرز</span>
        `;
        sortBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        sortBtn.classList.add('bg-red-600', 'hover:bg-red-700');

        
        const newBtn = sortBtn.cloneNode(true);
        sortBtn.parentNode.replaceChild(newBtn, sortBtn);

        newBtn.addEventListener('click', () => {
            activeArchiveFilter = null;
            removeArchiveFilterStyle();
            restoreArchiveSortButton();
            loadArchiveContent();
            showToast('تم إلغاء الفرز', 'info');
        });
    }
}


function restoreArchiveSortButton() {
    const sortBtn = document.getElementById('cycle-archive-sort');
    if (sortBtn) {
        sortBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        sortBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');

        
        displayArchiveModal();
    }
}


function removeArchiveFilterStyle() {
    document.querySelectorAll('#filter-archived-btn, #filter-active-btn').forEach(el => {
        el.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2');
    });
}


function addArchiveFilterStyle(element) {
    element.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2');
}


function loadArchiveContent() {
    if (archiveViewMode === 'clients') {
        loadAllClientsWithCases();
    } else {
        loadAllCasesList();
    }
}


async function loadAllClientsWithCases() {
    try {
        const allClients = await getAllClients();
        const allCases = await getAllCases();
        const archiveList = document.getElementById('archive-list');

        if (allClients.length === 0) {
            archiveList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="ri-folder-history-line text-4xl mb-4 text-gray-400"></i>
                    <p class="text-lg font-medium">لا توجد بيانات</p>
                    <p class="text-sm text-gray-400 mt-2">لا يوجد موكلين مسجلين</p>
                </div>
            `;
            return;
        }


        const clientGroups = {};

        for (const client of allClients) {
            let clientCases = allCases.filter(c => c.clientId === client.id);

            
            if (activeArchiveFilter === 'archived') {
                clientCases = clientCases.filter(c => c.isArchived === true);
            } else if (activeArchiveFilter === 'active') {
                clientCases = clientCases.filter(c => !c.isArchived);
            }

            if (clientCases.length > 0) {
                clientGroups[client.id] = {
                    client: client,
                    cases: clientCases,
                    archivedCases: clientCases.filter(c => c.isArchived),
                    activeCases: clientCases.filter(c => !c.isArchived)
                };
            }
        }

        if (Object.keys(clientGroups).length === 0) {
            archiveList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="ri-folder-history-line text-4xl mb-4 text-gray-400"></i>
                    <p class="text-lg font-medium">لا توجد قضايا</p>
                    <p class="text-sm text-gray-400 mt-2">لا يوجد قضايا مسجلة</p>
                </div>
            `;
            return;
        }

        let html = '';
        const isMobile = (typeof window !== 'undefined') && window.innerWidth <= 768;

        const renderArchiveBtn = (caseRecord) => {
            const isArchived = !!caseRecord.isArchived;
            const baseColor = isArchived ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600';
            if (isMobile) {
                const label = isArchived ? 'إلغاء الأرشفة' : 'أرشفة';
                const icon = isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill';
                return `
                    <button class="archive-toggle-btn ${baseColor} text-white w-full h-10 rounded-lg transition-all flex items-center justify-center gap-2"
                            data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${label}">
                        <i class="${icon} text-base"></i>
                        <span class="font-bold">${label}</span>
                    </button>
                `;
            }
            return `
                <button class="archive-toggle-btn ${baseColor} text-white rounded-full transition-all flex items-center justify-center gap-2 px-3 py-2"
                        data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}">
                    <i class="${isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill'} text-xs"></i>
                    <span class="font-bold text-xs">${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}</span>
                </button>
            `;
        };

        for (const clientId in clientGroups) {
            const group = clientGroups[clientId];
            const client = group.client;

            html += `
                <div class="client-group bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-300 mb-3" data-client-id="${client.id}">
                    <!-- رأس الموكل - قابل للنقر -->
                    <div class="client-header cursor-pointer p-3 hover:bg-gray-50 transition-colors duration-200" data-client-id="${client.id}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                                    <i class="ri-user-line text-white text-base"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-gray-800 mb-1">${client.name}</h3>
                                    <p class="text-xs text-gray-500">${group.cases.length} قضية</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <!-- الإحصائيات المحسنة -->
                                <div class="flex items-center gap-3">
                                    <div class="text-center bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                        <p class="text-sm text-red-600 font-medium">مؤرشفة</p>
                                        <p class="text-base font-bold text-red-700">${group.archivedCases.length}</p>
                                    </div>
                                    <div class="text-center bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                        <p class="text-sm text-green-600 font-medium">نشطة</p>
                                        <p class="text-base font-bold text-green-700">${group.activeCases.length}</p>
                                    </div>
                                </div>
                                <!-- أيقونة التوسيع/الطي -->
                                <div class="expand-icon transition-transform duration-300 ml-2">
                                    <i class="ri-arrow-down-s-line text-xl text-gray-400 hover:text-gray-600"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- قائمة القضايا - مخفية افتراضياً -->
                    <div class="cases-details hidden border-t border-gray-200 bg-gray-50 p-2" data-client-id="${client.id}">
                        <div class="space-y-2">
                            ${group.cases.map(caseRecord => `
                                <div class="case-mini-card ${caseRecord.isArchived ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300'} border rounded-lg p-2 hover:shadow-md transition-all" data-case-id="${caseRecord.id}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <!-- أيقونة صغيرة -->
                                            <div class="w-8 h-8 ${caseRecord.isArchived ? 'bg-red-500' : 'bg-green-500'} rounded-full flex items-center justify-center">
                                                <i class="${caseRecord.isArchived ? 'ri-archive-fill' : 'ri-file-text-fill'} text-white text-sm"></i>
                                            </div>
                                            
                                            <!-- معلومات مبسطة -->
                                            <div>
                                                <p class="font-bold ${caseRecord.isArchived ? 'text-red-800' : 'text-green-800'} text-sm">
                                                    قضية ${caseRecord.caseNumber || 'غير محدد'} لسنة ${caseRecord.caseYear || 'غير محدد'}
                                                </p>
                                                <span class="text-xs px-2 py-1 rounded-full font-medium ${caseRecord.isArchived ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}">
                                                    ${caseRecord.isArchived ? '📁 مؤرشفة' : '📋 نشطة'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <!-- زر الأرشفة -->
                                        ${renderArchiveBtn(caseRecord)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        archiveList.innerHTML = html;


        attachArchiveItemListeners();


        restoreExpandedClients();

    } catch (error) {
        document.getElementById('archive-list').innerHTML = `
            <div class="text-center text-red-500 py-12">
                <i class="ri-error-warning-line text-4xl mb-4"></i>
                <p class="text-lg font-medium">حدث خطأ في تحميل البيانات</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}


function attachArchiveItemListeners() {

    document.querySelectorAll('.client-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const clientId = e.currentTarget.dataset.clientId;
            toggleClientCases(clientId);
        });
    });


    document.querySelectorAll('.archive-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const caseId = parseInt(e.currentTarget.dataset.caseId);
            await toggleArchiveCase(caseId);
        });
    });
}


function toggleClientCases(clientId) {
    const clientGroup = document.querySelector(`.client-group[data-client-id="${clientId}"]`);
    if (!clientGroup) return;

    const casesDetails = clientGroup.querySelector('.cases-details');
    const expandIcon = clientGroup.querySelector('.expand-icon i');

    if (casesDetails.classList.contains('hidden')) {
        casesDetails.classList.remove('hidden');
        expandIcon.style.transform = 'rotate(180deg)';
        expandedClients.add(clientId);
    } else {
        casesDetails.classList.add('hidden');
        expandIcon.style.transform = 'rotate(0deg)';
        expandedClients.delete(clientId);
    }


    saveArchiveState();
}


async function toggleArchiveCase(caseId) {
    try {
        const updatedCase = await toggleCaseArchive(caseId);


        showToast(
            updatedCase.isArchived ? 'تم أرشفة القضية بنجاح' : 'تم إلغاء أرشفة القضية بنجاح',
            'success'
        );


        await loadArchiveContent();
        await updateArchiveStats();


        if (typeof updateCountersInHeader === 'function') {
            await updateCountersInHeader();
        }

    } catch (error) {
        showToast('حدث خطأ في تحديث حالة الأرشفة', 'error');
    }
}


async function updateArchiveStats() {
    try {
        const allCases = await getAllCases();
        const archivedCases = allCases.filter(c => c.isArchived);
        const activeCases = allCases.filter(c => !c.isArchived);

        document.getElementById('total-cases-count').textContent = allCases.length.toLocaleString();
        document.getElementById('archived-cases-count').textContent = archivedCases.length.toLocaleString();
        document.getElementById('active-cases-count').textContent = activeCases.length.toLocaleString();

    } catch (error) {
        document.getElementById('total-cases-count').textContent = '-';
        document.getElementById('archived-cases-count').textContent = '-';
        document.getElementById('active-cases-count').textContent = '-';
    }
}


async function performArchiveSearch(query) {
    if (archiveViewMode === 'clients') {
        await performClientsSearch(query);
    } else {
        await performCasesListSearch(query);
    }
}


async function performClientsSearch(query) {
    try {
        const allClients = await getAllClients();
        const allCases = await getAllCases();
        const clientsMap = new Map(Array.isArray(allClients) ? allClients.map(c => [c.id, c]) : []);


        const matchingClients = allClients.filter(client =>
            client.name.toLowerCase().includes(query)
        );


        const matchingCases = allCases.filter(caseRecord =>
            `${caseRecord.caseNumber} لسنة ${caseRecord.caseYear}`.toLowerCase().includes(query) ||
            (caseRecord.caseType && caseRecord.caseType.toLowerCase().includes(query))
        );


        const clientGroups = {};


        for (const client of matchingClients) {
            const clientCases = allCases.filter(c => c.clientId === client.id);
            if (clientCases.length > 0) {
                clientGroups[client.id] = {
                    client: client,
                    cases: clientCases,
                    archivedCases: clientCases.filter(c => c.isArchived),
                    activeCases: clientCases.filter(c => !c.isArchived)
                };
            }
        }


        for (const caseRecord of matchingCases) {
            const client = clientsMap.get(caseRecord.clientId);
            if (client && !clientGroups[client.id]) {
                const clientCases = allCases.filter(c => c.clientId === client.id);
                clientGroups[client.id] = {
                    client: client,
                    cases: clientCases,
                    archivedCases: clientCases.filter(c => c.isArchived),
                    activeCases: clientCases.filter(c => !c.isArchived)
                };
            }
        }

        const archiveList = document.getElementById('archive-list');

        if (Object.keys(clientGroups).length === 0) {
            archiveList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="ri-search-line text-4xl mb-4 text-gray-400"></i>
                    <p class="text-lg font-medium">لا توجد نتائج</p>
                    <p class="text-sm text-gray-400 mt-2">لم يتم العثور على نتائج مطابقة لـ "${query}"</p>
                </div>
            `;
            return;
        }


        let html = '';
        const isMobile = (typeof window !== 'undefined') && window.innerWidth <= 768;
        const renderArchiveBtn = (caseRecord) => {
            const isArchived = !!caseRecord.isArchived;
            const baseColor = isArchived ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600';
            if (isMobile) {
                const label = isArchived ? 'إلغاء الأرشفة' : 'أرشفة';
                const icon = isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill';
                return `
                    <button class="archive-toggle-btn ${baseColor} text-white w-full h-10 rounded-lg transition-all flex items-center justify-center gap-2"
                            data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${label}">
                        <i class="${icon} text-base"></i>
                        <span class="font-bold">${label}</span>
                    </button>
                `;
            }
            return `
                <button class="archive-toggle-btn ${baseColor} text-white rounded-full transition-all flex items-center justify-center gap-2 px-3 py-2"
                        data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}">
                    <i class="${isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill'} text-xs"></i>
                    <span class="font-bold text-xs">${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}</span>
                </button>
            `;
        };

        for (const clientId in clientGroups) {
            const group = clientGroups[clientId];
            const client = group.client;

            html += `
                <div class="client-group bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-300 mb-3" data-client-id="${client.id}">
                    <!-- رأس الموكل - قابل للنقر -->
                    <div class="client-header cursor-pointer p-3 hover:bg-gray-50 transition-colors duration-200" data-client-id="${client.id}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                                    <i class="ri-user-line text-white text-lg"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800 mb-1">${highlightSearchTerm(client.name, query)}</h3>
                                    <p class="text-sm text-gray-500">${group.cases.length} قضية</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <!-- الإحصائيات المحسنة -->
                                <div class="flex items-center gap-3">
                                    <div class="text-center bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                        <p class="text-sm text-red-600 font-medium">مؤرشفة</p>
                                        <p class="text-base font-bold text-red-700">${group.archivedCases.length}</p>
                                    </div>
                                    <div class="text-center bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                        <p class="text-sm text-green-600 font-medium">نشطة</p>
                                        <p class="text-base font-bold text-green-700">${group.activeCases.length}</p>
                                    </div>
                                </div>
                                <!-- أيقونة التوسيع/الطي -->
                                <div class="expand-icon transition-transform duration-300 ml-2">
                                    <i class="ri-arrow-down-s-line text-xl text-gray-400 hover:text-gray-600"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- قائمة القضايا - مخفية افتراضياً -->
                    <div class="cases-details hidden border-t border-gray-200 bg-gray-50 p-2" data-client-id="${client.id}">
                        <div class="space-y-2">
                            ${group.cases.map(caseRecord => `
                                <div class="case-mini-card ${caseRecord.isArchived ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300'} border rounded-lg p-2 hover:shadow-md transition-all" data-case-id="${caseRecord.id}">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <!-- أيقونة صغيرة -->
                                            <div class="w-8 h-8 ${caseRecord.isArchived ? 'bg-red-500' : 'bg-green-500'} rounded-full flex items-center justify-center">
                                                <i class="${caseRecord.isArchived ? 'ri-archive-fill' : 'ri-file-text-fill'} text-white text-sm"></i>
                                            </div>
                                            
                                            <!-- معلومات مبسطة -->
                                            <div>
                                                <p class="font-bold ${caseRecord.isArchived ? 'text-red-800' : 'text-green-800'} text-sm">
                                                    قضية ${highlightSearchTerm(`${caseRecord.caseNumber} لسنة ${caseRecord.caseYear}`, query)}
                                                </p>
                                                <span class="text-xs px-2 py-1 rounded-full font-medium ${caseRecord.isArchived ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}">
                                                    ${caseRecord.isArchived ? '📁 مؤرشفة' : '📋 نشطة'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <!-- زر الأرشفة -->
                                        ${renderArchiveBtn(caseRecord)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        archiveList.innerHTML = html;


        attachArchiveItemListeners();


        restoreExpandedClients();

    } catch (error) {
        document.getElementById('archive-list').innerHTML = `
            <div class="text-center text-red-500 py-12">
                <i class="ri-error-warning-line text-4xl mb-4"></i>
                <p class="text-lg font-medium">حدث خطأ في البحث</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}


async function performCasesListSearch(query) {
    try {
        const allCases = await getAllCases();
        const allClients = await getAllClients();

        const matchingCases = allCases.filter(caseRecord => {
            const client = allClients.find(c => c.id === caseRecord.clientId);
            const clientName = client ? client.name.toLowerCase() : '';
            const caseNumber = `${caseRecord.caseNumber} لسنة ${caseRecord.caseYear}`.toLowerCase();
            const caseType = (caseRecord.caseType || '').toLowerCase();
            const court = (caseRecord.court || '').toLowerCase();

            return clientName.includes(query) ||
                caseNumber.includes(query) ||
                caseType.includes(query) ||
                court.includes(query);
        });

        const archiveList = document.getElementById('archive-list');

        if (matchingCases.length === 0) {
            archiveList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="ri-search-line text-4xl mb-4 text-gray-400"></i>
                    <p class="text-lg font-medium">لا توجد نتائج</p>
                    <p class="text-sm text-gray-400 mt-2">لم يتم العثور على نتائج مطابقة لـ "${query}"</p>
                </div>
            `;
            return;
        }


        const sortedCases = matchingCases.sort((a, b) => {
            if (archiveSortBy === 'status') {

                const statusA = a.isArchived ? 1 : 0;
                const statusB = b.isArchived ? 1 : 0;

                if (archiveSortOrder === 'desc') {

                    if (statusA !== statusB) return statusB - statusA;
                } else {

                    if (statusA !== statusB) return statusA - statusB;
                }


                return b.caseYear - a.caseYear;
            } else {

                if (a.caseYear !== b.caseYear) {
                    if (archiveSortOrder === 'desc') {
                        return b.caseYear - a.caseYear; 
                    } else {
                        return a.caseYear - b.caseYear; 
                    }
                }


                const numA = parseInt(a.caseNumber) || 0;
                const numB = parseInt(b.caseNumber) || 0;

                if (archiveSortOrder === 'desc') {
                    return numB - numA;
                } else {
                    return numA - numB;
                }
            }
        });

        let html = '<div class="space-y-3">';

        const isMobile = (typeof window !== 'undefined') && window.innerWidth <= 768;
        const renderArchiveBtn = (caseRecord) => {
            const isArchived = !!caseRecord.isArchived;
            const baseColor = isArchived ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600';
            if (isMobile) {
                const label = isArchived ? 'إلغاء الأرشفة' : 'أرشفة';
                const icon = isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill';
                return `
                    <button class="archive-toggle-btn ${baseColor} text-white w-full h-10 rounded-lg transition-all flex items-center justify-center gap-2"
                            data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${label}">
                        <i class="${icon} text-base"></i>
                        <span class="font-bold">${label}</span>
                    </button>
                `;
            }
            return `
                <button class="archive-toggle-btn ${baseColor} text-white rounded-full transition-all flex items-center justify-center gap-2 px-3 py-2"
                        data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}">
                    <i class="${isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill'} text-xs"></i>
                    <span class="font-bold text-xs">${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}</span>
                </button>
            `;
        };

        for (const caseRecord of sortedCases) {
            const client = allClients.find(c => c.id === caseRecord.clientId);
            const clientName = client ? client.name : 'غير معروف';

            html += `
                <div class="case-card ${caseRecord.isArchived ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-lg p-2 hover:shadow-md transition-all duration-300 cursor-pointer" data-case-id="${caseRecord.id}">
                    <div class="flex items-center justify-between">
                        <!-- معلومات القضية الأساسية -->
                        <div class="flex items-center gap-3">
                            <!-- أيقونة صغيرة -->
                            <div class="w-10 h-10 ${caseRecord.isArchived ? 'bg-red-500' : 'bg-green-500'} rounded-full flex items-center justify-center shadow-md">
                                <i class="${caseRecord.isArchived ? 'ri-archive-fill' : 'ri-file-text-fill'} text-white text-base"></i>
                            </div>
                            
                            <!-- المعلومات الأساسية -->
                            <div>
                                <h3 class="text-base font-bold ${caseRecord.isArchived ? 'text-red-800' : 'text-green-800'} mb-1">
                                    قضية رقم ${highlightSearchTerm((caseRecord.caseNumber || 'غير محدد').toString(), query)} لسنة ${caseRecord.caseYear || 'غير محدد'}
                                </h3>
                                <p class="text-sm text-gray-700 font-medium mb-1">
                                    <i class="ri-user-fill text-blue-500 ml-1"></i>
                                    ${highlightSearchTerm(clientName || 'غير معروف', query)}
                                </p>
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${caseRecord.isArchived ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}">
                                    ${caseRecord.isArchived ? '📁 مؤرشفة' : '📋 نشطة'}
                                </span>
                                <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div><i class="ri-bank-line text-blue-500 ml-1"></i>${caseRecord.court || 'غير محدد'}</div>
                                    <div><i class="ri-list-unordered text-purple-500 ml-1"></i>${caseRecord.caseType || 'غير محدد'}</div>
                                    <div><i class="ri-information-line text-amber-500 ml-1"></i>${caseRecord.caseStatus || 'غير محدد'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- زر الأرشفة -->
                        ${renderArchiveBtn(caseRecord)}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        archiveList.innerHTML = html;

        attachArchiveToggleListeners();

    } catch (error) {
        document.getElementById('archive-list').innerHTML = `
            <div class="text-center text-red-500 py-12">
                <i class="ri-error-warning-line text-4xl mb-4"></i>
                <p class="text-lg font-medium">حدث خطأ في البحث</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}


async function loadAllCasesList() {
    try {
        let allCases = await getAllCases();
        const allClients = await getAllClients();
        const archiveList = document.getElementById('archive-list');

        
        if (activeArchiveFilter === 'archived') {
            allCases = allCases.filter(c => c.isArchived === true);
        } else if (activeArchiveFilter === 'active') {
            allCases = allCases.filter(c => !c.isArchived);
        }

        if (allCases.length === 0) {
            const filterMsg = activeArchiveFilter === 'archived' ? 'لا توجد قضايا مؤرشفة' :
                activeArchiveFilter === 'active' ? 'لا توجد قضايا نشطة' :
                    'لا توجد قضايا';
            archiveList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="ri-folder-history-line text-4xl mb-4 text-gray-400"></i>
                    <p class="text-lg font-medium">${filterMsg}</p>
                    <p class="text-sm text-gray-400 mt-2">لا يوجد قضايا مسجلة</p>
                </div>
            `;
            return;
        }


        const sortedCases = allCases.sort((a, b) => {
            if (archiveSortBy === 'status') {

                const statusA = a.isArchived ? 1 : 0;
                const statusB = b.isArchived ? 1 : 0;

                if (archiveSortOrder === 'desc') {

                    if (statusA !== statusB) return statusB - statusA;
                } else {

                    if (statusA !== statusB) return statusA - statusB;
                }


                return b.caseYear - a.caseYear;
            } else {

                if (a.caseYear !== b.caseYear) {
                    if (archiveSortOrder === 'desc') {
                        return b.caseYear - a.caseYear; 
                    } else {
                        return a.caseYear - b.caseYear; 
                    }
                }


                const numA = parseInt(a.caseNumber) || 0;
                const numB = parseInt(b.caseNumber) || 0;

                if (archiveSortOrder === 'desc') {
                    return numB - numA;
                } else {
                    return numA - numB;
                }
            }
        });

        let html = `
            <div class="cases-list space-y-3">
        `;

        const isMobile = (typeof window !== 'undefined') && window.innerWidth <= 768;
        const renderArchiveBtn = (caseRecord) => {
            const isArchived = !!caseRecord.isArchived;
            const baseColor = isArchived ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600';
            if (isMobile) {
                const label = isArchived ? 'إلغاء الأرشفة' : 'أرشفة';
                const icon = isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill';
                return `
                    <button class="archive-toggle-btn ${baseColor} text-white w-full h-10 rounded-lg transition-all flex items-center justify-center gap-2"
                            data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${label}">
                        <i class="${icon} text-base"></i>
                        <span class="font-bold">${label}</span>
                    </button>
                `;
            }
            return `
                <button class="archive-toggle-btn ${baseColor} text-white rounded-full transition-all flex items-center justify-center gap-2 px-3 py-2"
                        data-case-id="${caseRecord.id}" data-is-archived="${isArchived}" title="${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}">
                    <i class="${isArchived ? 'ri-inbox-unarchive-fill' : 'ri-archive-fill'} text-xs"></i>
                    <span class="font-bold text-xs">${isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}</span>
                </button>
            `;
        };

        for (const caseRecord of sortedCases) {
            const client = allClients.find(c => c.id === caseRecord.clientId);
            const clientName = client ? client.name : 'غير معروف';

            html += `
                <div class="case-card ${caseRecord.isArchived ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-lg p-2 hover:shadow-md transition-all duration-300 cursor-pointer" data-case-id="${caseRecord.id}">
                    <div class="flex items-center justify-between">
                        <!-- معلومات القضية الأساسية -->
                        <div class="flex items-center gap-3">
                            <!-- أيقونة صغيرة -->
                            <div class="w-10 h-10 ${caseRecord.isArchived ? 'bg-red-500' : 'bg-green-500'} rounded-full flex items-center justify-center shadow-md">
                                <i class="${caseRecord.isArchived ? 'ri-archive-fill' : 'ri-file-text-fill'} text-white text-base"></i>
                            </div>
                            
                            <!-- المعلومات الأساسية -->
                            <div>
                                <h3 class="text-base font-bold ${caseRecord.isArchived ? 'text-red-800' : 'text-green-800'} mb-1">
                                    قضية رقم ${caseRecord.caseNumber || 'غير محدد'} لسنة ${caseRecord.caseYear || 'غير محدد'}
                                </h3>
                                <p class="text-sm text-gray-700 font-medium mb-1">
                                    <i class="ri-user-fill text-blue-500 ml-1"></i>
                                    ${clientName || 'غير معروف'}
                                </p>
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${caseRecord.isArchived ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}">
                                    ${caseRecord.isArchived ? '📁 مؤرشفة' : '📋 نشطة'}
                                </span>
                                <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div><i class="ri-bank-line text-blue-500 ml-1"></i>${caseRecord.court || 'غير محدد'}</div>
                                    <div><i class="ri-list-unordered text-purple-500 ml-1"></i>${caseRecord.caseType || 'غير محدد'}</div>
                                    <div><i class="ri-information-line text-amber-500 ml-1"></i>${caseRecord.caseStatus || 'غير محدد'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- زر الأرشفة -->
                        ${renderArchiveBtn(caseRecord)}
                    </div>
                </div>
            `;
        }

        html += '</div>'; 
        archiveList.innerHTML = html;

        attachArchiveToggleListeners();

    } catch (error) {
        document.getElementById('archive-list').innerHTML = `
            <div class="text-center text-red-500 py-12">
                <i class="ri-error-warning-line text-4xl mb-4"></i>
                <p class="text-lg font-medium">حدث خطأ في تحميل البيانات</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}


function attachArchiveToggleListeners() {
    document.querySelectorAll('.archive-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const caseId = parseInt(e.currentTarget.dataset.caseId);
            await toggleArchiveCase(caseId);
        });
    });
}


function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}


function restoreExpandedClients() {
    expandedClients.forEach(clientId => {
        const clientGroup = document.querySelector(`.client-group[data-client-id="${clientId}"]`);
        if (clientGroup) {
            const casesDetails = clientGroup.querySelector('.cases-details');
            const expandIcon = clientGroup.querySelector('.expand-icon i');

            if (casesDetails && expandIcon) {
                casesDetails.classList.remove('hidden');
                expandIcon.style.transform = 'rotate(180deg)';
            }
        }
    });
}


function setupArchiveScrollBox() {
    try {
        const rightWrapper = document.querySelector('#modal-content .flex-1 > div');
        const archiveList = document.getElementById('archive-list');
        if (!rightWrapper || !archiveList) return;

        const viewportH = window.innerHeight;
        const wrapperTop = rightWrapper.getBoundingClientRect().top;
        const targetH = Math.max(240, viewportH - wrapperTop - 12);

        rightWrapper.style.height = targetH + 'px';
        rightWrapper.style.minHeight = '0px';

        archiveList.style.maxHeight = (targetH - 24) + 'px';
        archiveList.style.overflowY = 'auto';
    } catch (e) { }
}


function setupArchiveHoverScrollBehavior() {
    const leftPane = document.querySelector('#modal-content .w-1\\/4');
    const rightList = document.getElementById('archive-list');
    const mainEl = document.querySelector('main');
    if (!leftPane || !rightList || !mainEl) return;

    
    const enablePageScroll = () => {
        mainEl.style.overflowY = 'auto';
        document.body.style.overflowY = '';
        rightList.style.overscrollBehavior = 'contain';
    };

    const enableRightListScrollOnly = () => {
        mainEl.style.overflowY = 'hidden';
        rightList.style.overscrollBehavior = 'contain';
    };

    
    leftPane.addEventListener('mouseenter', enablePageScroll);
    leftPane.addEventListener('mouseleave', enableRightListScrollOnly);

    
    rightList.addEventListener('mouseenter', enableRightListScrollOnly);
    rightList.addEventListener('mouseleave', enablePageScroll);

    
    enablePageScroll();
}

