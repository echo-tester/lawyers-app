async function ensureAppActivatedForExternalSites() {
    try {
        if (typeof getSetting !== 'function') return true;
        let isLicensed = await getSetting('licensed');
        isLicensed = (isLicensed === true || isLicensed === 'true');
        if (isLicensed) return true;
        if (typeof showToast === 'function') {
            showToast('يرجى ترخيص البرنامج للمتابعه', 'error');
        } else {
            alert('يرجى ترخيص البرنامج للمتابعه');
        }
        return false;
    } catch (_) {
        return true;
    }
}

function displayLegalLibraryModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalContainer = document.getElementById('modal-container');

    const isElectron = !!(window.electronAPI) || (navigator.userAgent && navigator.userAgent.includes('Electron'));

    // إخفاء زر القائمة الجانبية في المتصفح/الموبايل
    const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
    if (mobileToggle) {
        mobileToggle.style.display = isElectron ? '' : 'none';
    }

    modalTitle.textContent = 'المكتبة القانونية';
    if (modalContainer) {
        modalContainer.style.maxWidth = '100%';
        modalContainer.style.width = '100%';
        modalContainer.style.margin = '0';
        modalContainer.style.height = '100vh';
    }
    if (modalContent) {
        modalContent.style.padding = '0';
        modalContent.style.margin = '0';
        modalContent.style.width = '100%';
        modalContent.style.maxWidth = '100%';
        try { modalContent.classList.remove('search-modal-content'); } catch (_) { }
        try { modalContent.style.background = '#ffffff'; } catch (_) { }
    }
    try {
        if (modalContainer) {
            try { modalContainer.classList.remove('p-6'); } catch (_) { }
            try { modalContainer.classList.remove('px-6', 'pb-6', 'pt-3'); } catch (_) { }
            try {
                modalContainer.style.paddingTop = '0px';
                modalContainer.style.paddingBottom = '0px';
                modalContainer.style.paddingLeft = '0px';
                modalContainer.style.paddingRight = '0px';
                modalContainer.style.marginLeft = '0px';
                modalContainer.style.marginRight = '0px';
            } catch (_) { }
        }

        try {
            const mainContainer = document.querySelector('main > .container');
            if (mainContainer) {
                try { mainContainer.classList.remove('px-4'); } catch (_) { }
                try {
                    mainContainer.style.paddingLeft = '0px';
                    mainContainer.style.paddingRight = '0px';
                    mainContainer.style.marginLeft = '0px';
                    mainContainer.style.marginRight = '0px';
                    mainContainer.style.width = '100%';
                    mainContainer.style.maxWidth = '100%';
                } catch (_) { }
            }
        } catch (_) { }

        try {
            const mainEl2 = document.querySelector('main');
            if (mainEl2) {
                try { mainEl2.style.paddingTop = '0px'; } catch (_) { }
            }
        } catch (_) { }

        try {
            if (modalContent) {
                modalContent.style.paddingTop = '0px';
                modalContent.style.paddingLeft = '0px';
                modalContent.style.paddingRight = '0px';
                modalContent.style.paddingBottom = '0px';
            }
        } catch (_) { }

        try {
            const mainEl = document.querySelector('main');
            if (mainEl) {
                try {
                    const headerEl = document.querySelector('header');
                    const headerHRaw = headerEl ? Math.max(0, Math.round(headerEl.getBoundingClientRect().height || 0)) : 0;
                    const headerH = headerHRaw || 48;
                    try { mainEl.classList.remove('pt-8'); } catch (_) { }
                    if (headerH) {
                        mainEl.style.marginTop = headerH + 'px';
                        mainEl.style.paddingTop = '0px';
                    }
                } catch (_) { }

                const top = mainEl.getBoundingClientRect().top;
                const vh = window.innerHeight;
                const h = Math.max(240, vh - top);
                mainEl.style.height = h + 'px';
                mainEl.style.maxHeight = h + 'px';
                mainEl.style.overflowY = 'hidden';
            }

            try { document.body.style.overflowY = 'hidden'; } catch (_) { }
            try { document.documentElement.style.overflowY = 'hidden'; } catch (_) { }

            if (!window.__legalLibraryMainOffsetBound) {
                window.__legalLibraryMainOffsetBound = true;
                window.addEventListener('resize', () => {
                    try {
                        const mainEl2 = document.querySelector('main');
                        if (!mainEl2) return;
                        const headerEl2 = document.querySelector('header');
                        const headerH2 = headerEl2 ? Math.max(0, Math.round(headerEl2.getBoundingClientRect().height || 0)) : 0;
                        if (headerH2) {
                            mainEl2.style.marginTop = headerH2 + 'px';
                            mainEl2.style.paddingTop = '0px';
                        }

                        const top2 = mainEl2.getBoundingClientRect().top;
                        const vh2 = window.innerHeight;
                        const h2 = Math.max(240, vh2 - top2);
                        mainEl2.style.height = h2 + 'px';
                        mainEl2.style.maxHeight = h2 + 'px';
                    } catch (_) { }
                });
            }
        } catch (_) { }
    } catch (_) { }

    modalContent.innerHTML = `
        <div class="legal-library-container w-full h-full min-h-0 flex gap-0">
            <!-- الشريط الجانبي الأيمن -->
            <div id="legal-sidebar" class="${isElectron ? '' : 'hidden'} w-80 bg-green-50 border-l border-green-200 flex flex-col search-left-pane search-left-pane-dark" data-left-pane="legal">

                <!-- نموذج إنشاء مجلد جديد -->
                <div class="p-4">
                    <div class="bg-white rounded-lg p-4 border border-green-200">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="ri-add-circle-line text-green-600 text-lg"></i>
                            <h3 class="font-semibold text-gray-800 text-sm">إنشاء مجلد جديد</h3>
                        </div>
                        
                        <div class="space-y-3">
                            <input 
                                type="text" 
                                id="folder-name" 
                                placeholder="اسم المجلد الجديد..."
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-right text-sm transition-all"
                            >
                            <button 
                                id="attach-files-btn" 
                                class="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                            >
                                <i class="ri-attachment-2"></i>
                                إنشاء وإرفاق ملفات
                            </button>
                        </div>
                    </div>
                </div>

                <!-- الصيغ الجاهزة -->
                <div class="p-4">
                    <div class="bg-white rounded-lg p-4 border border-purple-200">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="ri-file-copy-line text-purple-600 text-lg"></i>
                            <h3 class="font-semibold text-gray-800 text-sm">الصيغ الجاهزة</h3>
                        </div>
                        
                        <button 
                            id="copy-pack-btn" 
                            class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-sm hover:bg-purple-700 transition-colors"
                        >
                            <i class="ri-file-copy-line"></i>
                            نسخ الصيغ لسطح المكتب
                        </button>
                    </div>
                </div>

                <!-- كتب القانون -->
                <div class="p-4">
                    <div class="bg-white rounded-lg p-4 border border-purple-200">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="ri-book-open-line text-purple-600 text-lg"></i>
                            <h3 class="font-semibold text-gray-800 text-sm">كتب القانون</h3>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <button 
                                id="open-law-books-ebooksar-btn" 
                                class="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-xs hover:bg-purple-700 transition-colors"
                                title="مراجع فقهية وقانونية"
                            >
                                <i class="ri-book-read-line"></i>
                                المكتبة الأولى
                            </button>

                            <button 
                                id="open-law-books-egy-btn" 
                                class="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-xs hover:bg-purple-700 transition-colors"
                                title="كتب القانون المصري"
                            >
                                <i class="ri-scales-3-line"></i>
                                المكتبة الثانية
                            </button>

                            <button 
                                id="open-law-books-foulabook-btn" 
                                class="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-xs hover:bg-purple-700 transition-colors"
                                title="كتب قانونية متنوعة"
                            >
                                <i class="ri-book-2-line"></i>
                                المكتبة الثالثة
                            </button>

                            <button 
                                id="open-law-books-govlib-btn" 
                                class="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-xs hover:bg-purple-700 transition-colors"
                                title="المكتبة الرقمية الحكومية"
                            >
                                <i class="ri-government-line"></i>
                                المكتبة الرابعة
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <!-- المنطقة الرئيسية للمجلدات -->
            <div class="flex-1 bg-white flex flex-col">
                <div id="folders-list" class="flex-1 p-1 md:p-2 overflow-y-auto">
                    <div class="text-center text-gray-500 py-20">
                        <i class="ri-folder-open-line text-6xl mb-6 text-gray-300"></i>
                        <p class="text-xl font-medium text-gray-400 mb-2">لا توجد مجلدات بعد</p>
                        <p class="text-sm text-gray-400">ابدأ بإنشاء مجلد جديد من الشريط الجانبي لتنظيم مكتبتك القانونية</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        const sidebar = document.getElementById('legal-sidebar');
        if (sidebar) {
            try { sidebar.classList.add('search-left-pane-dark'); } catch (_) { }
            try { sidebar.style.background = '#111827'; } catch (_) { }
            try { sidebar.style.borderLeft = '2px solid rgba(14, 165, 233, .45)'; } catch (_) { }
            try { sidebar.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
            try {
                sidebar.style.borderBottomLeftRadius = '16px';
                sidebar.style.borderBottomRightRadius = '16px';
                sidebar.style.overflowX = 'hidden';
                sidebar.style.overflowY = 'auto';
                sidebar.style.overscrollBehavior = 'contain';
                sidebar.style.paddingBottom = '10px';
            } catch (_) { }

            try {
                sidebar.querySelectorAll(':scope > div').forEach((sec) => {
                    try {
                        sec.style.borderBottom = '0px';
                        sec.style.borderBottomWidth = '0px';
                    } catch (_) { }
                });
            } catch (_) { }

            try {
                sidebar.querySelectorAll('div.bg-white').forEach((c) => {
                    try { c.style.background = 'rgba(15, 23, 42, .78)'; } catch (_) { }
                    try { c.style.borderColor = 'rgba(148, 163, 184, .18)'; } catch (_) { }
                });
            } catch (_) { }

            try {
                sidebar.querySelectorAll('h3').forEach((h) => {
                    try { h.style.color = 'rgba(255,255,255,.94)'; } catch (_) { }
                });
            } catch (_) { }

            try {
                const folderNameInput = document.getElementById('folder-name');
                if (folderNameInput) {
                    try { folderNameInput.style.background = 'rgba(255,255,255,.08)'; } catch (_) { }
                    try { folderNameInput.style.borderColor = 'rgba(148, 163, 184, .28)'; } catch (_) { }
                    try { folderNameInput.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
                }
            } catch (_) { }

            try {
                const btnIds = [
                    'attach-files-btn',
                    'copy-pack-btn',
                    'open-law-books-ebooksar-btn',
                    'open-law-books-egy-btn',
                    'open-law-books-foulabook-btn',
                    'open-law-books-govlib-btn'
                ];
                btnIds.forEach((id) => {
                    const b = document.getElementById(id);
                    if (!b) return;
                    try {
                        b.style.setProperty('background', '#1e3a8a', 'important');
                        b.style.setProperty('color', '#ffffff', 'important');
                        b.style.setProperty('border', '1px solid rgba(255,255,255,0.10)', 'important');
                        b.style.setProperty('transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease', 'important');
                    } catch (_) { }
                });
            } catch (_) { }

            try {
                const cards = sidebar.querySelectorAll(':scope > div > div');
                cards.forEach((el) => {
                    if (!el) return;
                    if (el.dataset && el.dataset.hoverStyled === '1') return;
                    if (el.dataset) el.dataset.hoverStyled = '1';

                    const setImp = (node, prop, value) => {
                        try { node.style.setProperty(prop, value, 'important'); } catch (_) { }
                    };
                    const clearImp = (node, prop) => {
                        try { node.style.removeProperty(prop); } catch (_) { }
                    };

                    const applyBase = () => {
                        try {
                            setImp(el, 'transition', 'background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease');
                            clearImp(el, 'transform');
                            clearImp(el, 'box-shadow');
                            clearImp(el, 'border-color');
                        } catch (_) { }
                    };
                    const applyHover = () => {
                        try {
                            setImp(el, 'border-color', 'rgba(245, 158, 11, .85)');
                            setImp(el, 'transform', 'translateY(-2px)');
                            setImp(el, 'box-shadow', '0 14px 26px rgba(245, 158, 11, .14), 0 10px 18px rgba(15, 23, 42, .20)');
                        } catch (_) { }
                    };

                    applyBase();
                    el.addEventListener('mouseenter', applyHover);
                    el.addEventListener('mouseleave', applyBase);
                    el.addEventListener('mousedown', () => { try { setImp(el, 'transform', 'translateY(-1px)'); } catch (_) { } });
                    el.addEventListener('mouseup', applyHover);
                    el.addEventListener('blur', applyBase);
                });
            } catch (_) { }
        }

        try {
            const rightFrame = document.querySelector('#modal-content .legal-library-container > div.flex-1');
            if (rightFrame) {
                rightFrame.style.setProperty('background', '#ffffff', 'important');
                rightFrame.style.setProperty('border', '2px solid rgba(14, 165, 233, .45)', 'important');
                rightFrame.style.setProperty('border-radius', '14px', 'important');
                rightFrame.style.setProperty('box-shadow', '0 10px 22px rgba(15, 23, 42, 0.12)', 'important');
                rightFrame.style.setProperty('overflow', 'hidden', 'important');
            }
        } catch (_) { }
    } catch (_) { }

    try {
        if (!document.getElementById('legal-library-sidebar-hover-style')) {
            const st = document.createElement('style');
            st.id = 'legal-library-sidebar-hover-style';
            st.textContent = `
                .low-power #modal-content #legal-sidebar #attach-files-btn,
                .low-power #modal-content #legal-sidebar #copy-pack-btn,
                .low-power #modal-content #legal-sidebar #open-law-books-ebooksar-btn,
                .low-power #modal-content #legal-sidebar #open-law-books-egy-btn,
                .low-power #modal-content #legal-sidebar #open-law-books-foulabook-btn,
                .low-power #modal-content #legal-sidebar #open-law-books-govlib-btn,
                .low-power #modal-content #legal-sidebar .bg-white {
                    transition: background-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease !important;
                }

                #modal-content #legal-sidebar #attach-files-btn:hover,
                #modal-content #legal-sidebar #copy-pack-btn:hover,
                #modal-content #legal-sidebar #open-law-books-ebooksar-btn:hover,
                #modal-content #legal-sidebar #open-law-books-egy-btn:hover,
                #modal-content #legal-sidebar #open-law-books-foulabook-btn:hover,
                #modal-content #legal-sidebar #open-law-books-govlib-btn:hover {
                    border-color: rgba(245, 158, 11, .90) !important;
                    outline: 2px solid rgba(245, 158, 11, .65) !important;
                    outline-offset: 2px !important;
                    transform: translateY(-1px) scale(1.02) !important;
                    box-shadow: 0 16px 26px rgba(245, 158, 11, .14), 0 12px 18px rgba(15, 23, 42, .20) !important;
                }

                #modal-content #legal-sidebar #folder-name::placeholder {
                    color: rgba(226,232,240,.78) !important;
                }
            `;
            (document.head || document.documentElement).appendChild(st);
        }
    } catch (_) { }


    attachLegalLibraryListeners();


    try { updateToggleViewerButton(); } catch (e) { }


    try {
        const viewer = document.getElementById('site-viewer');
        const wrap = document.getElementById('webviews-container');
        if (viewer) viewer.style.overflow = 'hidden';
        if (wrap) wrap.style.overflow = 'hidden';
    } catch (e) { }


    loadExistingFolders();
}


function attachLegalLibraryListeners() {
    const attachFilesBtn = document.getElementById('attach-files-btn');
    const folderNameInput = document.getElementById('folder-name');


    attachFilesBtn.addEventListener('click', async () => {
        const folderName = folderNameInput.value.trim();
        if (!folderName) {
            showToast('يرجى إدخال اسم المجلد أولاً', 'error');
            folderNameInput.focus();
            return;
        }

        await attachFilesAndCreateFolder(folderName);
    });


    folderNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attachFilesBtn.click();
        }
    });


    const copyPackBtn = document.getElementById('copy-pack-btn');
    if (copyPackBtn) {
        copyPackBtn.addEventListener('click', handleCopyPackToDesktop);
    }

    const ebooksarBtn = document.getElementById('open-law-books-ebooksar-btn');
    if (ebooksarBtn) {
        ebooksarBtn.addEventListener('click', () => openDownloadSite('7'));
    }

    const egyBtn = document.getElementById('open-law-books-egy-btn');
    if (egyBtn) {
        egyBtn.addEventListener('click', () => openDownloadSite('2'));
    }

    const foulabookBtn = document.getElementById('open-law-books-foulabook-btn');
    if (foulabookBtn) {
        foulabookBtn.addEventListener('click', () => openDownloadSite('1'));
    }

    const govlibBtn = document.getElementById('open-law-books-govlib-btn');
    if (govlibBtn) {
        govlibBtn.addEventListener('click', () => openDownloadSite('8'));
    }


    const root = document.getElementById('modal-content');
    if (root) {
        let hoveredEl = null;
        root.addEventListener('mouseover', (e) => {
            const target = e.target.closest('.folder-item, .view-toggle-btn, #attach-files-btn, .attach-files-folder-btn, .edit-folder-btn, .delete-folder-btn');
            if (!target || !root.contains(target)) return;
            if (hoveredEl === target) return;
            hoveredEl = target;
            if (target.classList.contains('view-toggle-btn')) {
                if (target.classList.contains('bg-gray-200')) target.classList.add('bg-gray-300');
            } else if (target.classList.contains('folder-item')) {
                // Hover handled by CSS
            } else {
                target.classList.add('ring-1', 'ring-blue-300');
            }
        });
        root.addEventListener('mouseout', (e) => {
            if (!hoveredEl) return;
            const related = e.relatedTarget;
            if (related && hoveredEl.contains(related)) return;

            const folder = e.target.closest('.folder-item');
            if (folder && (!related || !folder.contains(related))) {
                folder.classList.remove('bg-blue-50', 'border-blue-300', 'ring-1', 'ring-blue-300');
                folder.querySelectorAll('.attach-files-folder-btn, .edit-folder-btn, .delete-folder-btn')
                    .forEach(btn => btn.classList.remove('ring-1', 'ring-blue-300'));
            }

            if (hoveredEl.classList.contains('view-toggle-btn')) {
                hoveredEl.classList.remove('bg-gray-300');
            } else if (hoveredEl.classList.contains('folder-item')) {
                // Hover handled by CSS
            } else {
                hoveredEl.classList.remove('ring-1', 'ring-blue-300');
            }
            hoveredEl = null;
        });
    }
    const toggleBtn = document.getElementById('toggle-viewer-full');
    const sidebarEl = document.getElementById('legal-sidebar');
    if (toggleBtn && sidebarEl) {
        toggleBtn.addEventListener('click', async () => {
            const enteringFull = !document.fullscreenElement;
            try {
                if (enteringFull) {
                    await enterLegalLibraryFullscreen();
                } else {
                    await exitLegalLibraryFullscreen();
                }
            } catch (e) { }
            updateToggleViewerButton();
            setupLegalLibraryScrollBox();
            const activeWv = document.querySelector('#webviews-container webview:not(.hidden)');
            if (activeWv) { try { fitWebviewToWidth(activeWv); } catch (e) { } }
        });
    }
    if (!window.__legalLibResizeBound) {
        window.__legalLibResizeBound = true;
        window.addEventListener('resize', () => {
            setupLegalLibraryScrollBox();
            const activeWv = document.querySelector('#webviews-container webview:not(.hidden)');
            if (activeWv) { try { fitWebviewToWidth(activeWv); } catch (e) { } }
            try { updateToggleViewerButton(); } catch (e) { }
        });
    }
}




async function attachFilesAndCreateFolder(folderName) {

    if (!window.electronAPI || !window.electronAPI.createLegalLibraryFolder) {
        showBrowserLimitationModal();
        return;
    }

    const doAttach = async () => {
        try {
            const result = await window.electronAPI.createLegalLibraryFolder(folderName);
            if (result.success) {
                if (result.filesCount > 0) {
                    showToast(`✓ تم إنشاء المجلد وإرفاق الملفات`, 'success');
                } else {
                    showToast(`✓ تم إنشاء المجلد`, 'success');
                }
                try { await loadExistingFolders(); } catch (_) { }
            } else {
                showToast(result.message || 'حدث خطأ', 'error');
            }
        } catch (error) {
            showToast('حدث خطأ في إنشاء المجلد وإرفاق الملفات', 'error');
        }
    };

    try {
        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning(
                            {},
                            {}
                        );
                    }
                } catch (_) { }
                return;
            }
        }
    } catch (_) { }

    await doAttach();
    return;
}






function getFolderIconAndColor(folderName) {
    const folderTypes = {
        'قانون المرافعات': { icon: 'ri-book-line', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
        'القانون المدنى': { icon: 'ri-home-line', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-800' },
        'القانون الجنائى': { icon: 'ri-shield-line', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-800' },
        'القانون الادارى': { icon: 'ri-settings-line', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-800' },
        'قانون الاجراءات الجنائية': { icon: 'ri-book-line', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
        'قانون العمل': { icon: 'ri-home-line', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-800' },
        'قانون العمل والتأمينات': { icon: 'ri-home-line', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-800' },
        'قانون الاحوال الشخصيه': { icon: 'ri-heart-line', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50', textColor: 'text-pink-800' },
        'احكام محكمه النقض': { icon: 'ri-star-line', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-800' },
        'قانون التجارة': { icon: 'ri-store-2-line', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
        'قانون الشركات': { icon: 'ri-building-4-line', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-800' },
        'قانون الضريبة': { icon: 'ri-money-dollar-circle-line', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-800' },
        'قانون الإثبات': { icon: 'ri-file-list-3-line', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-800' }
    };

    return folderTypes[folderName] || { icon: 'ri-folder-fill', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-50', textColor: 'text-gray-800' };
}


async function loadExistingFolders(viewType = 'grid') {
    const foldersList = document.getElementById('folders-list');


    if (!window.electronAPI || !window.electronAPI.loadLegalLibraryFolders) {
        foldersList.innerHTML = `
            <div class="flex flex-col gap-4 p-4 w-full max-w-full">
                <!-- المكتبة الأولى -->
                <div onclick="openDownloadSite('7')" 
                     class="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl cursor-pointer transition-all hover:bg-green-600 group">
                    <div class="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-green-600 transition-all">
                        <i class="ri-book-read-fill text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-green-900 text-base group-hover:text-white transition-colors">المكتبة الأولى</h3>
                        <p class="text-green-700 text-xs group-hover:text-green-50 transition-colors">مراجع فقهية وقانونية</p>
                    </div>
                    <i class="ri-arrow-left-s-line text-xl text-green-400 group-hover:text-white"></i>
                </div>

                <!-- المكتبة الثانية -->
                <div onclick="openDownloadSite('2')" 
                     class="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl cursor-pointer transition-all hover:bg-blue-600 group">
                    <div class="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-all">
                        <i class="ri-scales-fill text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-blue-900 text-base group-hover:text-white transition-colors">المكتبة الثانية</h3>
                        <p class="text-blue-700 text-xs group-hover:text-blue-50 transition-colors">شروحات وصيغ قانونية</p>
                    </div>
                    <i class="ri-arrow-left-s-line text-xl text-blue-300 group-hover:text-white"></i>
                </div>

                <!-- المكتبة الثالثة -->
                <div onclick="openDownloadSite('1')" 
                     class="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl cursor-pointer transition-all hover:bg-indigo-600 group">
                    <div class="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-indigo-600 transition-all">
                        <i class="ri-book-fill text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-indigo-900 text-base group-hover:text-white transition-colors">المكتبة الثالثة</h3>
                        <p class="text-indigo-700 text-xs group-hover:text-indigo-50 transition-colors">تحميل كتب قانونية</p>
                    </div>
                    <i class="ri-arrow-left-s-line text-xl text-indigo-300 group-hover:text-white"></i>
                </div>

                <!-- المكتبة الرابعة -->
                <div onclick="openDownloadSite('8')" 
                     class="flex items-center gap-4 p-4 bg-purple-50 border border-purple-100 rounded-2xl cursor-pointer transition-all hover:bg-purple-600 group">
                    <div class="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-purple-600 transition-all">
                        <i class="ri-government-fill text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-purple-900 text-base group-hover:text-white transition-colors">المكتبة الرابعة</h3>
                        <p class="text-purple-700 text-xs group-hover:text-purple-50 transition-colors">تشريعات وقوانين رسمية</p>
                    </div>
                    <i class="ri-arrow-left-s-line text-xl text-purple-400 group-hover:text-white"></i>
                </div>

                <!-- مكتبة التليجرام -->
                <div onclick="openTelegramLibrary()" 
                     class="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl cursor-pointer transition-all hover:bg-blue-500 group">
                    <div class="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-500 transition-all">
                        <i class="ri-telegram-fill text-2xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-blue-900 text-base group-hover:text-white transition-colors">مكتبة التليجرام</h3>
                        <p class="text-blue-700 text-xs group-hover:text-blue-50 transition-colors">كتب قانونية متجددة</p>
                    </div>
                    <i class="ri-arrow-left-s-line text-xl text-blue-300 group-hover:text-white"></i>
                </div>

            </div>
        `;
        return;
    }

    try {
        const result = await window.electronAPI.loadLegalLibraryFolders();

        if (result.success && result.items && result.items.length > 0) {
            displayFolders(result.items, viewType, false);
        } else {
            foldersList.innerHTML = `
                <div class="text-center text-gray-500 py-16">
                    <i class="ri-folder-open-line text-5xl mb-4 text-gray-300"></i>
                    <p class="text-lg font-medium text-gray-400">لا توجد مجلدات بعد</p>
                    <p class="text-sm text-gray-400 mt-2">ابدأ بإنشاء مجلد جديد لتنظيم مكتبتك القانونية</p>
                </div>
            `;
        }
    } catch (error) {

        if (error.message && error.message.includes('electronAPI')) {
            foldersList.innerHTML = `
                <div class="text-center py-16">
                    <div class="max-w-md mx-auto">
                        <div class="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="ri-computer-line text-white text-3xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-3">المكتبة القانونية</h3>
                        <p class="text-gray-600 mb-4 leading-relaxed">
                            هذه الميزة متاحة فقط في تطبيق سطح المكتب<br>
                            للاستفادة من المكتبة القانونية الكاملة
                        </p>
                        <button onclick="closeModal()" class="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                            فهمت، شكراً
                        </button>
                    </div>
                </div>
            `;
        } else {

            foldersList.innerHTML = `
                <div class="text-center text-red-500 py-12">
                    <i class="ri-error-warning-line text-4xl mb-4"></i>
                    <p class="text-lg font-medium">حدث خطأ في تحميل المجلدات</p>
                    <p class="text-sm mt-2">${error.message}</p>
                </div>
            `;
        }

    }
}

function displayFolders(folders, viewType = 'grid', isDemoMode = false) {
    const foldersList = document.getElementById('folders-list');
    let html = '';

    if (viewType === 'grid') {

        html = '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">';

        folders.forEach(folder => {
            const folderStyle = getFolderIconAndColor(folder.name);
            html += `
                <div class="folder-item border-2 rounded-lg p-3 cursor-pointer transition-all duration-300 hover:shadow-lg group shadow-sm" data-folder-name="${folder.name}" data-demo="${isDemoMode}">
                    <div class="folder-content text-center">
                        <div class="w-12 h-12 bg-gradient-to-br ${folderStyle.color} rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 mx-auto mb-2">
                            <i class="${folderStyle.icon} text-white text-lg"></i>
                        </div>
                        <h4 class="text-sm font-bold ${folderStyle.textColor} mb-1 line-clamp-2">${folder.name}</h4>
                        <p class="text-xs text-gray-500">${isDemoMode ? 'تجريبي' : 'افتراضى'}</p>
                    </div>
                    
                    <!-- أزرار التحكم -->
                    <div class="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button class="attach-files-folder-btn w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="إرفاق ملفات" data-folder-name="${folder.name}">
                            <i class="ri-attachment-2 text-xs"></i>
                        </button>
                        <button class="edit-folder-btn w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="تعديل الاسم" data-folder-name="${folder.name}">
                            <i class="ri-edit-line text-xs"></i>
                        </button>
                        <button class="delete-folder-btn w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="حذف المجلد" data-folder-name="${folder.name}">
                            <i class="ri-delete-bin-line text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    } else {

        html = '<div class="space-y-3">';

        folders.forEach(folder => {
            const folderStyle = getFolderIconAndColor(folder.name);
            html += `
                <div class="folder-item border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg group flex items-center justify-between shadow-sm" data-folder-name="${folder.name}" data-demo="${isDemoMode}">
                    <div class="flex items-center gap-4 folder-content flex-1">
                        <div class="w-14 h-14 bg-gradient-to-br ${folderStyle.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                            <i class="${folderStyle.icon} text-white text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-base font-bold ${folderStyle.textColor} mb-1">${folder.name}</h4>
                            <p class="text-sm text-gray-500">${isDemoMode ? 'عرض تجريبي - مكتبة قانونية' : 'مجلد مكتبة قانونية'}</p>
                        </div>
                    </div>
                    
                    <!-- أزرار التحكم -->
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button class="attach-files-folder-btn w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="إرفاق ملفات" data-folder-name="${folder.name}">
                            <i class="ri-attachment-2 text-sm"></i>
                        </button>
                        <button class="edit-folder-btn w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="تعديل الاسم" data-folder-name="${folder.name}">
                            <i class="ri-edit-line text-sm"></i>
                        </button>
                        <button class="delete-folder-btn w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg" title="حذف المجلد" data-folder-name="${folder.name}">
                            <i class="ri-delete-bin-line text-sm"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    foldersList.innerHTML = html;


    attachFolderOpenListeners();
    setupLegalLibraryScrollBox();
}


function attachFolderOpenListeners() {

    document.querySelectorAll('.folder-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            const folderItem = content.closest('.folder-item');
            const folderName = folderItem.dataset.folderName;
            const isDemoMode = folderItem.dataset.demo === 'true';

            if (isDemoMode) {
                showBrowserLimitationModal();
            } else {
                openSpecificFolder(folderName);
            }
        });
    });


    document.querySelectorAll('.folder-item').forEach(item => {
        item.addEventListener('click', (e) => {

            if (e.target.closest('.edit-folder-btn') || e.target.closest('.delete-folder-btn') || e.target.closest('.attach-files-folder-btn')) {
                return;
            }
            const folderName = item.dataset.folderName;
            const isDemoMode = item.dataset.demo === 'true';

            if (isDemoMode) {
                showBrowserLimitationModal();
            } else {
                openSpecificFolder(folderName);
            }
        });
    });


    document.querySelectorAll('.edit-folder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const folderItem = btn.closest('.folder-item');
            const isDemoMode = folderItem.dataset.demo === 'true';
            const folderName = btn.dataset.folderName;

            if (isDemoMode) {
                showBrowserLimitationModal();
            } else {
                showRenameFolderDialog(folderName);
            }
        });
    });


    document.querySelectorAll('.delete-folder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const folderItem = btn.closest('.folder-item');
            const isDemoMode = folderItem.dataset.demo === 'true';
            const folderName = btn.dataset.folderName;

            if (isDemoMode) {
                showBrowserLimitationModal();
            } else {
                showDeleteFolderDialog(folderName);
            }
        });
    });


    document.querySelectorAll('.attach-files-folder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const folderItem = btn.closest('.folder-item');
            const isDemoMode = folderItem.dataset.demo === 'true';
            const folderName = btn.dataset.folderName;

            if (isDemoMode) {
                showBrowserLimitationModal();
            } else {
                attachFilesToExistingFolder(folderName);
            }
        });
    });
}

function setupLegalLibraryScrollBox() {
    try {
        const viewportH = window.innerHeight;

        const sidebar = document.getElementById('legal-sidebar');
        if (sidebar) {
            const topS = sidebar.getBoundingClientRect().top;
            const targetHS = Math.max(240, viewportH - topS - 12);
            sidebar.style.height = targetHS + 'px';
            sidebar.style.maxHeight = targetHS + 'px';
            sidebar.style.minHeight = '0px';
            sidebar.style.overflowY = 'auto';
            sidebar.style.overflowX = 'hidden';
            sidebar.style.overscrollBehavior = 'contain';
            sidebar.style.borderBottomLeftRadius = '16px';
            sidebar.style.borderBottomRightRadius = '16px';
        }
        const list = document.getElementById('folders-list');
        if (list) {
            const top = list.getBoundingClientRect().top;
            const targetH = Math.max(240, viewportH - top - 12);
            list.style.height = targetH + 'px';
            list.style.maxHeight = targetH + 'px';
            list.style.overflowY = 'auto';
        }
        const viewer = document.getElementById('site-viewer');
        if (viewer) {
            const top2 = viewer.getBoundingClientRect().top;
            const targetH2 = Math.max(240, viewportH - top2 - 12);
            viewer.style.height = targetH2 + 'px';
            viewer.style.maxHeight = targetH2 + 'px';
            const header = viewer.querySelector(':scope > div');
            const toolbarH = header ? header.offsetHeight : 0;
            const contentH = targetH2 - toolbarH;
            const wrap = document.getElementById('webviews-container');
            if (wrap) {
                wrap.style.height = (contentH > 0 ? contentH : targetH2) + 'px';
                const webviews = wrap.querySelectorAll('webview');
                webviews.forEach(wv => { wv.style.height = (contentH > 0 ? contentH : targetH2) + 'px'; });
            }
        }
    } catch (e) { }
}


async function openSpecificFolder(folderName) {

    if (!window.electronAPI || !window.electronAPI.openLegalLibraryFolder) {
        showToast('فتح المجلدات متاح فقط في تطبيق سطح المكتب', 'info');
        return;
    }

    try {
        const result = await window.electronAPI.openLegalLibraryFolder(folderName);

        if (result.success) {
        } else {
            showToast('حدث خطأ في فتح المجلد: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('حدث خطأ في فتح المجلد', 'error');
    }
}


function showDeleteFolderDialog(folderName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div class="text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="ri-delete-bin-line text-red-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
                <p class="text-gray-600 mb-6">هل أنت متأكد من حذف مجلد "<strong>${folderName}</strong>"؟<br>سيتم حذف جميع الملفات الموجودة بداخله نهائياً.</p>
                <div class="flex gap-3 justify-center">
                    <button id="confirm-delete" class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all">
                        حذف نهائي
                    </button>
                    <button id="cancel-delete" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold transition-all">
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);


    modal.querySelector('#confirm-delete').addEventListener('click', async () => {
        await deleteLegalLibraryFolder(folderName);
        document.body.removeChild(modal);
    });


    modal.querySelector('#cancel-delete').addEventListener('click', () => {
        document.body.removeChild(modal);
    });


    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}


function showRenameFolderDialog(folderName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="ri-edit-line text-blue-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">تعديل اسم المجلد</h3>
                <p class="text-gray-600 mb-4">الاسم الحالي: "<strong>${folderName}</strong>"</p>
                <input type="text" id="new-folder-name" value="${folderName}" class="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right mb-4" placeholder="الاسم الجديد">
                <div class="flex gap-3 justify-center">
                    <button id="confirm-rename" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all">
                        حفظ التغيير
                    </button>
                    <button id="cancel-rename" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold transition-all">
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const newNameInput = modal.querySelector('#new-folder-name');
    newNameInput.focus();
    newNameInput.select();


    modal.querySelector('#confirm-rename').addEventListener('click', async () => {
        const newName = newNameInput.value.trim();
        if (newName && newName !== folderName) {
            await renameLegalLibraryFolder(folderName, newName);
        }
        document.body.removeChild(modal);
    });


    modal.querySelector('#cancel-rename').addEventListener('click', () => {
        document.body.removeChild(modal);
    });


    newNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#confirm-rename').click();
        }
    });


    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}


async function deleteLegalLibraryFolder(folderName) {

    if (!window.electronAPI || !window.electronAPI.deleteLegalLibraryFolder) {
        showToast('حذف المجلدات متاح فقط في تطبيق سطح المكتب', 'info');
        return;
    }

    try {
        const result = await window.electronAPI.deleteLegalLibraryFolder(folderName);

        if (result.success) {
            showToast(result.message, 'success');

            await loadExistingFolders();
        } else {
            showToast('حدث خطأ في حذف المجلد: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('حدث خطأ في حذف المجلد', 'error');
    }
}


async function renameLegalLibraryFolder(oldName, newName) {

    if (!window.electronAPI || !window.electronAPI.renameLegalLibraryFolder) {
        showToast('تعديل أسماء المجلدات متاح فقط في تطبيق سطح المكتب', 'info');
        return;
    }

    try {
        const result = await window.electronAPI.renameLegalLibraryFolder(oldName, newName);

        if (result.success) {
            showToast(result.message, 'success');

            await loadExistingFolders();
        } else {
            showToast('حدث خطأ في تعديل اسم المجلد: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('حدث خطأ في تعديل اسم المجلد', 'error');
    }
}




function showBrowserLimitationModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div class="text-center">
                <div class="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="ri-computer-line text-white text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-3">المكتبة القانونية</h3>
                <p class="text-gray-600 mb-4 leading-relaxed">
                    هذه الميزة متاحة بالكامل فقط في تطبيق سطح المكتب<br>
                    للاستفادة من جميع إمكانيات المكتبة القانونية
                </p>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-right">
                    <div class="flex items-start gap-3">
                        <i class="ri-information-line text-blue-600 text-lg mt-0.5"></i>
                        <div>
                            <p class="text-sm text-blue-800 font-medium mb-2">مميزات تطبيق سطح المكتب:</p>
                            <ul class="text-sm text-blue-700 space-y-1">
                                <li>• إنشاء وتنظيم مجلدات المراجع القانونية</li>
                                <li>• رفع وحفظ الملفات والوثائق (PDF, Word, إلخ)</li>
                                <li>• فتح الملفات مباشرة من التطبيق</li>
                                <li>• تعديل وحذف المجلدات</li>
                                <li>• البحث في محتوى الملفات</li>
                                <li>• العمل بدون إنترنت تماماً</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 justify-center">
                    <button id="close-limitation-modal" class="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                        فهمت، شكراً
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);


    const closeBtn = modal.querySelector('#close-limitation-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });


    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}


async function attachFilesToExistingFolder(folderName) {

    if (!window.electronAPI || !window.electronAPI.attachFilesToFolder) {
        showBrowserLimitationModal();
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
            const result = await window.electronAPI.attachFilesToFolder(folderName, attachMode);

            if (result.success) {
                if (result.filesCount > 0) {
                    showToast(`✓ تم إرفاق الملفات`, 'success');
                } else {
                    showToast('لم يتم اختيار أي ملفات', 'info');
                }
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('حدث خطأ في إرفاق الملفات', 'error');
        }
    };

    try {
        if (window.electronAPI && typeof window.electronAPI.checkClientsPathOnDesktop === 'function') {
            const chk = await window.electronAPI.checkClientsPathOnDesktop();
            if (chk && chk.success === true && chk.isOnDesktop === true) {
                try {
                    if (typeof window.showDesktopPathSafetyWarning === 'function') {
                        window.showDesktopPathSafetyWarning(
                            {},
                            {}
                        );
                    }
                } catch (_) { }
                return;
            }
        }
    } catch (_) { }

    await doAttach();
    return;

    // (moved to doAttach above)
}


async function openTelegramLibrary() {
    const ok = await ensureAppActivatedForExternalSites();
    if (!ok) return;
    window.open('https://t.me/Legal_Knowledgee', '_blank');
}

async function openLegalLibraryInternalWindow(url, title) {
    try {
        if (!window.electronAPI || typeof window.electronAPI.openInternalUrl !== 'function') return false;
        const result = await window.electronAPI.openInternalUrl(url, title);
        return !!(result && result.success);
    } catch (_) {
        return false;
    }
}

async function openDownloadSite(siteNumber) {
    const ok = await ensureAppActivatedForExternalSites();
    if (!ok) return;
    const sites = {
        '1': 'https://foulabook.com/ar/books/%D9%82%D8%A7%D9%86%D9%88%D9%86?page=1',
        '2': 'https://www.bibliotdroit.com/',
        '3': 'https://deepai.org/chat/free-chatgpt',
        '4': 'https://www.moj.gov.eg',
        '5': 'https://digital.gov.eg/categories',
        '6': 'https://www.ppo.gov.eg',
        '7': 'https://www.ebooksar.com/',
        '8': 'https://elpai.idsc.gov.eg/Library'
    };
    const titles = {
        '1': 'المكتبة الثالثة',
        '2': 'المكتبة الثانية',
        '3': 'الذكاء الاصطناعي',
        '4': 'وزارة العدل',
        '5': 'مصر الرقمية',
        '6': 'النيابة العامة',
        '7': 'المكتبة الأولى',
        '8': 'المكتبة الرابعة'
    };
    const url = sites[siteNumber];
    if (!url) { showToast('رقم الموقع غير صحيح', 'error'); return; }

    const isElectron = !!(window.electronAPI) || (navigator.userAgent && navigator.userAgent.includes('Electron'));


    const useExternal = await shouldUseExternalBrowser();

    if (!isElectron || useExternal) {

        if (isElectron && window.electronAPI && window.electronAPI.openExternalUrl) {
            try {
                await window.electronAPI.openExternalUrl(url);
                if (typeof showToast === 'function') {
                    showToast('تم فتح الرابط في المتصفح الخارجي', 'success');
                }
            } catch (e) {
                window.open(url, '_blank');
            }
        } else {
            window.open(url, '_blank');
        }
        return;
    }

    const fallbackTitle = titles[siteNumber] || url;
    if (isElectron) {
        if (await openLegalLibraryInternalWindow(url, fallbackTitle)) {
            return;
        }
        try { showToast('تعذر فتح الموقع داخل النافذة الداخلية', 'error'); } catch (_) { }
    }

    window.open(url, '_blank');
}

function createSiteTab(title, url) {
    const tabsEl = document.getElementById('site-tabs');
    const wrap = document.getElementById('webviews-container');
    if (!tabsEl || !wrap) return;
    const tabId = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'tab-pill inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50';
    tabBtn.dataset.tabId = tabId;
    tabBtn.innerHTML = `<span class="truncate max-w-[160px]">${title}</span><i class="ri-close-line text-xs"></i>`;
    tabBtn.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('ri-close-line')) {
            e.stopPropagation();
            try { closeSiteTab(tabId); } catch (e) { }
            return;
        }
        activateSiteTab(tabId);
    });
    tabsEl.appendChild(tabBtn);
    const wv = document.createElement('webview');
    wv.className = 'site-webview absolute inset-0 w-full h-full hidden';
    wv.setAttribute('allowpopups', '');
    wv.dataset.tabId = tabId;
    wv.src = url;

    wv.addEventListener('did-fail-load', async (e) => {
        try {
            const code = (e && typeof e.errorCode === 'number') ? e.errorCode : 0;
            if (code === -101 || code === -105 || code === -137) {

                const attempt = parseInt(wv.getAttribute('data-retry') || '0', 10) || 0;
                if (attempt < 2) {
                    wv.setAttribute('data-retry', String(attempt + 1));
                    setTimeout(() => { try { wv.reload(); } catch (_) { } }, 400);
                } else {
                    const openedInsideWindow = await openLegalLibraryInternalWindow(url, title);
                    if (openedInsideWindow) {
                        try { closeSiteTab(tabId); } catch (_) { }
                    } else {
                        try { showToast('تعذر تحميل الموقع داخل التطبيق. حاول لاحقاً.', 'error'); } catch (_) { }
                    }
                }
            }
        } catch (_) { }
    });
    const onDomReady = () => {
        try {
            wv.insertCSS(`
                html, body { width: 100% !important; max-width: 100vw !important; min-width: 0 !important; overflow-x: hidden !important; }
                *, *::before, *::after { box-sizing: border-box !important; }
                img, video, canvas, svg, iframe { max-width: 100% !important; height: auto !important; }
                table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
                td, th { word-wrap: break-word !important; overflow-wrap: anywhere !important; }
                pre { white-space: pre-wrap !important; }
                [class*="container"], [class*="content"], [class*="wrapper"] { max-width: 100% !important; min-width: 0 !important; overflow-x: hidden !important; }
                /* إخفاء أي شرائط جانبية ثابتة تضيق العرض على الشاشات الصغيرة */
                @media (max-width: 1024px) {
                    [class*="sidebar" i] { position: static !important; width: 100% !important; }
                    [style*="position:fixed" i] { max-width: 100vw !important; }
                }
            `);
        } catch (e) { }
        try {
            wv.executeJavaScript(`(function(){ try { var m = document.querySelector('meta[name="viewport"]') || document.createElement('meta'); m.name = 'viewport'; m.content = 'width=device-width, initial-scale=1, maximum-scale=1'; if (!m.parentNode) document.head.appendChild(m); } catch(e){} })();`, false);
        } catch (e) { }
    };
    const onDidFrameFinish = () => { try { fitWebviewToWidth(wv); } catch (e) { } };
    const onDidNavigate = () => { try { fitWebviewToWidth(wv); } catch (e) { } };
    const onDidNavigateInPage = () => { try { fitWebviewToWidth(wv); } catch (e) { } };

    wv.addEventListener('dom-ready', onDomReady, { once: true });
    wv.addEventListener('did-frame-finish-load', onDidFrameFinish);
    wv.addEventListener('did-navigate', onDidNavigate);
    wv.addEventListener('did-navigate-in-page', onDidNavigateInPage);
    wrap.appendChild(wv);
    activateSiteTab(tabId);
}

function fitWebviewToWidth(wv) {
    try {
        const apply = () => {
            try {
                wv.executeJavaScript(`(function(){
                    try {
                        var sw = Math.max(document.documentElement.scrollWidth || 0, (document.body && document.body.scrollWidth) || 0);
                        var vw = window.innerWidth || document.documentElement.clientWidth || 0;
                        var factor = 1;
                        if (sw > vw && sw > 0) {
                            factor = Math.max(0.5, Math.min(1, vw / sw));
                        }
                        factor;
                    } catch(e) { return 1; }
                })();`, true).then(function (factor) {
                    if (typeof factor === 'number' && !isNaN(factor)) {
                        try { wv.setZoomFactor(factor); } catch (e) { }
                    }
                }).catch(function () { });
            } catch (e) { }
        };
        apply();
        setTimeout(apply, 300);
        setTimeout(apply, 1000);
    } catch (e) { }
}

function activateSiteTab(tabId) {
    const tabsEl = document.getElementById('site-tabs');
    const wrap = document.getElementById('webviews-container');
    if (!tabsEl || !wrap) return;
    Array.from(tabsEl.children).forEach(btn => {
        if (btn.dataset.tabId === tabId) {
            btn.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-indigo-600', 'text-white', 'border-transparent', 'shadow');
            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
        } else {
            btn.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-indigo-600', 'text-white', 'border-transparent', 'shadow');
            btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        }
    });
    const webviews = wrap.querySelectorAll('webview');
    webviews.forEach(wv => {
        if (wv.dataset.tabId === tabId) {
            wv.classList.remove('hidden');
        } else {
            wv.classList.add('hidden');
        }
    });
}

function closeSiteTab(tabId) {
    const tabsEl = document.getElementById('site-tabs');
    const wrap = document.getElementById('webviews-container');
    const folders = document.getElementById('folders-list');
    const viewer = document.getElementById('site-viewer');
    if (!tabsEl || !wrap) return;
    const btn = Array.from(tabsEl.children).find(b => b.dataset.tabId === tabId);
    if (btn) tabsEl.removeChild(btn);
    const wv = wrap.querySelector(`webview[data-tab-id="${tabId}"]`);
    if (wv) {
        try {

            wv.replaceWith(wv.cloneNode(true));
        } catch (e) { }
        const toRemove = wrap.querySelector(`webview[data-tab-id="${tabId}"]`);
        if (toRemove) wrap.removeChild(toRemove);
    }
    const remaining = Array.from(tabsEl.children);
    if (remaining.length === 0) {
        if (viewer && folders) {
            viewer.classList.add('hidden');
            folders.classList.remove('hidden');
            const sidebarEl = document.getElementById('legal-sidebar');
            if (sidebarEl) { sidebarEl.classList.remove('hidden'); sidebarEl.style.display = ''; }
            setupLegalLibraryScrollBox();
        }

        try { exitLegalLibraryFullscreen(); } catch (e) { }

        try { document.body.style.overflow = ''; } catch (e) { }
    } else {
        const hasActive = Array.from(wrap.querySelectorAll('webview')).some(el => !el.classList.contains('hidden'));
        if (!hasActive) {
            const next = remaining[remaining.length - 1];
            if (next) activateSiteTab(next.dataset.tabId);
        }
    }
}


async function enterLegalLibraryFullscreen() {
    try {
        const viewer = document.getElementById('site-viewer');
        const header = document.querySelector('header');
        const sidebar = document.getElementById('legal-sidebar');
        if (sidebar) { sidebar.classList.add('hidden'); sidebar.style.display = 'none'; }
        if (header) { header.style.display = 'none'; }
        document.body.dataset.legallibFull = '1';
        if (viewer && !document.fullscreenElement && viewer.requestFullscreen) {
            try { await viewer.requestFullscreen(); } catch (e) { }
        }
        setupLegalLibraryScrollBox();
        const activeWv = document.querySelector('#webviews-container webview:not(.hidden)');
        if (activeWv) { try { fitWebviewToWidth(activeWv); } catch (e) { } }
    } catch (e) { }
}


async function exitLegalLibraryFullscreen() {
    try {
        const header = document.querySelector('header');
        const sidebar = document.getElementById('legal-sidebar');
        if (sidebar) { sidebar.classList.remove('hidden'); sidebar.style.display = ''; }
        if (header) { header.style.display = ''; }
        document.body.dataset.legallibFull = '0';
        if (document.fullscreenElement && document.exitFullscreen) {
            try { await document.exitFullscreen(); } catch (e) { }
        }
        setupLegalLibraryScrollBox();
        const activeWv = document.querySelector('#webviews-container webview:not(.hidden)');
        if (activeWv) { try { fitWebviewToWidth(activeWv); } catch (e) { } }
    } catch (e) { }
}


['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(function (evt) {
    document.addEventListener(evt, function () {
        const isFull = !!document.fullscreenElement;
        if (!isFull) { try { exitLegalLibraryFullscreen(); } catch (e) { } }
        try { updateToggleViewerButton(); } catch (e) { }
    });
});


function updateToggleViewerButton() {
    try {
        const toggleBtn = document.getElementById('toggle-viewer-full');
        if (!toggleBtn) return;
        const iconEl = toggleBtn.querySelector('i');
        const textEl = toggleBtn.querySelector('span');
        const inFull = !!document.fullscreenElement || document.body.dataset.legallibFull === '1';
        if (iconEl) iconEl.className = inFull ? 'ri-fullscreen-exit-fill text-sm' : 'ri-fullscreen-fill text-sm';
        if (textEl) textEl.textContent = inFull ? 'تصغير' : 'تكبير';
    } catch (e) { }
}


async function handleCopyPackToDesktop() {

    if (!window.electronAPI || !window.electronAPI.copyPackToDesktop) {
        if (typeof showToast === 'function') {
            showToast('هذه الميزة تعمل فقط في تطبيق سطح المكتب', 'error');
        } else {
            alert('هذه الميزة تعمل فقط في تطبيق سطح المكتب');
        }
        return;
    }

    const btn = document.getElementById('copy-pack-btn');
    const originalHTML = btn ? btn.innerHTML : null;
    try {
        if (btn) {
            btn.disabled = true;
            try { btn.classList.add('opacity-60', 'cursor-not-allowed'); } catch (_) { }
            btn.innerHTML = 'جارى النسخ من فضلك انتظر';
        }


        if (typeof showToast === 'function') {
            showToast('جاري نسخ الصيغ الجاهزة...', 'info');
        }


        const result = await window.electronAPI.copyPackToDesktop();

        if (result && result.success) {
            if (typeof showToast === 'function') {
                showToast(result.message, 'success');
            } else {
                alert(result.message);
            }
        } else {
            const errMsg = result && result.message ? result.message : 'فشل نسخ الصيغ الجاهزة';
            if (typeof showToast === 'function') {
                showToast(errMsg, 'error');
            } else {
                alert('خطأ: ' + errMsg);
            }
        }
    } catch (error) {
        console.error('خطأ في نسخ مجلد الصيغ الجاهزة:', error);
        if (typeof showToast === 'function') {
            showToast('حدث خطأ أثناء نسخ الصيغ الجاهزة', 'error');
        } else {
            alert('حدث خطأ أثناء نسخ الصيغ الجاهزة');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            try { btn.classList.remove('opacity-60', 'cursor-not-allowed'); } catch (_) { }
            btn.innerHTML = originalHTML || '<i class="ri-file-copy-line"></i> نسخ الصيغ لسطح المكتب';
        }
    }
}


async function handleOpenLawBooks() {
    const urls = [
        'https://www.ebooksar.com/',
        'https://books-library.website/c-Books-Egyption-Law-best-download',
        'https://foulabook.com/ar/books/%D9%82%D8%A7%D9%86%D9%88%D9%86?page=1',
        'https://elpai.idsc.gov.eg/Library'
    ];

    const isElectron = !!(window.electronAPI) || (navigator.userAgent && navigator.userAgent.includes('Electron'));

    for (const url of urls) {
        if (isElectron && window.electronAPI && window.electronAPI.openExternalUrl) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await window.electronAPI.openExternalUrl(url);
                continue;
            } catch (_) { }
        }
        try { window.open(url, '_blank'); } catch (_) { }
    }

    try { if (typeof showToast === 'function') showToast('تم فتح الكتب في المتصفح', 'success'); } catch (_) { }
}


function setupExternalBrowserToggle() {
    const toggle = document.getElementById('toggle-external-browser');
    const track = document.getElementById('external-browser-track');
    const knob = document.getElementById('external-browser-knob');

    if (!toggle || !track || !knob) return;

    const toggleFromUiClick = (e) => {
        try { e.preventDefault(); } catch (_) { }
        try { e.stopPropagation(); } catch (_) { }
        toggle.checked = !toggle.checked;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
    };

    track.addEventListener('click', toggleFromUiClick);
    knob.addEventListener('click', toggleFromUiClick);


    (async () => {
        try {
            const saved = await getSetting('useExternalBrowser');

            let isEnabled;
            if (saved === null || saved === undefined || saved === '') {
                isEnabled = false;
            } else {
                isEnabled = saved === true || saved === 'true';
            }
            toggle.checked = isEnabled;
            updateExternalBrowserUI(isEnabled, track, knob);
        } catch (e) {

            toggle.checked = false;
            updateExternalBrowserUI(false, track, knob);
        }
    })();


    toggle.addEventListener('change', async () => {
        const isEnabled = toggle.checked;
        updateExternalBrowserUI(isEnabled, track, knob);

        try {
            await setSetting('useExternalBrowser', isEnabled);
            if (typeof showToast === 'function') {
                showToast(isEnabled ? 'سيتم فتح الروابط في المتصفح الخارجي' : 'سيتم فتح الروابط داخل التطبيق', 'success');
            }
        } catch (e) {
            console.error('خطأ في حفظ الإعداد:', e);
        }
    });
}


function updateExternalBrowserUI(isEnabled, track, knob) {
    if (isEnabled) {
        track.style.background = '#3b82f6';
        track.style.borderColor = '#2563eb';
        knob.style.transition = 'left .25s, box-shadow .25s';
        knob.style.left = '26px';
    } else {
        track.style.background = '#e5e7eb';
        track.style.borderColor = '#cbd5e1';
        knob.style.transition = 'left .25s, box-shadow .25s';
        knob.style.left = '2px';
    }
}


async function shouldUseExternalBrowser() {
    try {
        const saved = await getSetting('useExternalBrowser');

        if (saved === null || saved === undefined || saved === '') {
            return false;
        }
        return saved === true || saved === 'true';
    } catch (e) {

        return false;
    }
}