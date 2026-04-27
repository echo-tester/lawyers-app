/**
 * مشاركة تقرير PDF عبر واتساب أو التطبيقات (متوافق مع الجوال والكمبيوتر).
 */
/* قائمة التصدير: أوضح على الهاتف — أزرار أكبر ومنظمة */
(function injectExportMenuStyles() {
    if (document.getElementById('reports-export-menu-styles')) return;
    var style = document.createElement('style');
    style.id = 'reports-export-menu-styles';
    style.textContent = [
        '@media (max-width: 640px) {',
        '  [id^="export-menu-"].reports-export-dropdown { min-width: 240px !important; width: max-content; max-width: calc(100vw - 24px); border-radius: 12px; overflow: hidden; }',
        '  [id^="export-menu-"].reports-export-dropdown button { padding: 14px 16px !important; min-height: 52px !important; font-size: 1rem !important; font-weight: 500; display: flex !important; align-items: center; justify-content: flex-end; gap: 10px; }',
        '  [id^="export-menu-"].reports-export-dropdown button .ri-whatsapp-line, [id^="export-menu-"].reports-export-dropdown button .ri-file-pdf-line, [id^="export-menu-"].reports-export-dropdown button .ri-file-excel-line { font-size: 1.25rem !important; }',
        '}'
    ].join('\n');
    document.head.appendChild(style);
})();

function isElectronApp() {
    return typeof window !== 'undefined' && (window.electronAPI || (window.process && window.process.type === 'renderer') || /electron/i.test(navigator.userAgent || ''));
}

/** جلب اسم المكتب الحالي من الإعدادات (يُستدعى عند كل تصدير/طباعة لضمان الاسم المحدث). إذا لم يوجد يُرجع "المحامى الرقمى". */
async function getReportsOfficeName() {
    try {
        if (typeof getSetting === 'function') {
            const v = await getSetting('officeName');
            const s = (v != null ? String(v) : '').trim();
            if (s) return s;
        }
    } catch (e) { }
    try {
        const v = localStorage.getItem('officeName');
        const s = (v != null ? String(v) : '').trim();
        if (s) return s;
    } catch (e) { }
    return 'المحامى الرقمى';
}

async function shareReportPdfAsFile(blob, filename) {
    if (!blob || !(blob instanceof Blob)) {
        if (typeof showToast === 'function') showToast('لا يوجد ملف للمشاركة', 'error');
        return;
    }
    const file = new File([blob], filename || 'report.pdf', { type: 'application/pdf' });
    const show = typeof showToast === 'function' ? showToast : function () { };
    const fallbackDownload = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'report.pdf';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        show('تم تحميل التقرير. افتح واتساب وأرفق الملف من المعرض أو الملفات.', 'info');
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share({ title: 'تقرير', files: [file] });
            show('تم فتح المشاركة. اختر واتساب أو أي تطبيق.', 'success');
        } catch (err) {
            if (err && err.name === 'AbortError') return;
            fallbackDownload();
        }
    } else {
        fallbackDownload();
    }
}

function displayReportsModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalContainer = document.getElementById('modal-container');

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
    }

    modalTitle.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                <i class="ri-pie-chart-line text-white text-xl"></i>
            </div>
            <span class="text-2xl font-bold text-gray-800">التقارير</span>
        </div>
    `;

    try {
        const headerEl = document.querySelector('header');
        const headerHRaw = headerEl ? Math.max(0, Math.round(headerEl.getBoundingClientRect().height || 0)) : 0;
        const headerH = headerHRaw || 48;
        try { document.documentElement.style.setProperty('--reports-header-h', headerH + 'px'); } catch (_) { }

        const mainEl = document.querySelector('main');
        if (mainEl) {
            try { mainEl.style.setProperty('padding-top', '0px', 'important'); } catch (_) { }
            try { mainEl.style.setProperty('margin-top', headerH + 'px', 'important'); } catch (_) { }

            try {
                const top = mainEl.getBoundingClientRect().top;
                const vh = window.innerHeight;
                const h = Math.max(240, vh - top);
                mainEl.style.height = h + 'px';
                mainEl.style.maxHeight = h + 'px';
            } catch (_) { }

            mainEl.style.overflowY = 'hidden';
        }

        try {
            const shell = document.querySelector('main > div > div.bg-white');
            if (shell) {
                shell.style.paddingTop = '0px';
                shell.style.paddingBottom = '0px';
            }
        } catch (_) { }

        try {
            if (modalContainer) {
                modalContainer.style.paddingTop = '0px';
                modalContainer.style.paddingBottom = '0px';
            }
        } catch (_) { }

        try {
            document.body.style.overflowY = 'hidden';
            document.documentElement.style.overflowY = 'hidden';
        } catch (_) { }
    } catch (_) { }

    modalContent.innerHTML = `
        <div class="flex h-full min-h-0 gap-0 search-layout">
            <!-- الشريط الجانبي للأزرار -->
            <div id="reports-sidebar" class="w-64 bg-gray-50 border-l border-gray-200 p-3 overflow-y-auto search-left-pane search-left-pane-dark" data-left-pane="reports">
                                
                <!-- لون موحد لجميع الأقسام (لون قسم القضايا) -->
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="client-comprehensive">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-file-user-line text-xl"></i>
                        <span class="text-base font-bold">تقارير الموكلين</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="clients-files">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-folder-user-line text-xl"></i>
                        <span class="text-base font-bold">تقارير التوكيلات</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="sessions">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-calendar-event-line text-xl"></i>
                        <span class="text-base font-bold">تقارير القضايا</span>
                    </div>
                </button>
            
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="accounts">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-wallet-3-line text-xl"></i>
                        <span class="text-base font-bold">تقارير الحسابات</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="administrative">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-briefcase-line text-xl"></i>
                        <span class="text-base font-bold">تقارير المهام</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="clerk-papers">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-file-paper-line text-xl"></i>
                        <span class="text-base font-bold">تقارير المحضرين</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="expert-sessions">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-team-line text-xl"></i>
                        <span class="text-base font-bold">تقارير الخبراء</span>
                    </div>
                </button>
                
                <button class="report-btn w-full text-right p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-orange-300" style="background: linear-gradient(135deg, #f97316, #ea580c);" data-report="archive">
                    <div class="flex items-center gap-3 text-white">
                        <i class="ri-folder-history-line text-xl"></i>
                        <span class="text-base font-bold">تقارير المؤرشف</span>
                    </div>
                </button>
            </div>
            
            <!-- منطقة المحتوى الرئيسي -->
            <div class="flex-1 min-h-0 p-2 md:p-3" id="report-content">
                <div class="flex items-center justify-center h-full">
                    <div class="text-center text-gray-500">
                        <i class="ri-file-chart-line text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">مرحباً بك في التقارير</h3>
                        <p class="text-gray-400">اختر نوع التقرير المطلوب من القائمة الجانبية</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const reportType = this.dataset.report;
            
            if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            handleReportClick(reportType);
        });
    });

    // فتح قسم الموكلين افتراضياً في التأثير التالي حتى لا يؤثر على سرعة ظهور النافذة
    setTimeout(function () {
        try {
            handleReportClick('client-comprehensive');
        } catch (_) { }
    }, 0);

    const reportContent = document.getElementById('report-content');
    if (reportContent && !reportContent.dataset.reportRecordSelectBound) {
        reportContent.addEventListener('click', (e) => {
            const rec = e.target.closest('.report-record');
            if (!rec || !reportContent.contains(rec)) return;
            reportContent.querySelectorAll('.report-record.report-record-selected')
                .forEach(el => el.classList.remove('report-record-selected'));
            rec.classList.add('report-record-selected');
        });
        reportContent.dataset.reportRecordSelectBound = '1';
    }

    
    try {
        requestAnimationFrame(() => {
            try { applyReportsSidebarThemeAndHover(); } catch (_) { }
            setupReportsScrollBox();
            setupReportsHoverScrollBehavior();
        });
        window.addEventListener('resize', setupReportsScrollBox);
    } catch (e) {
        console.error(e);
    }
}


function handleReportClick(reportType) {
    const reportNames = {
        'client-comprehensive': 'تقارير الموكلين',
        'clients-files': 'تقارير التوكيلات',
        'sessions': 'تقارير القضايا',
        'archive': 'تقارير المؤرشف',
        'accounts': 'تقارير الحسابات',
        'administrative': 'تقارير المهام',
        'clerk-papers': 'تقارير المحضرين',
        'expert-sessions': 'تقارير الخبراء'
    };

    const reportName = reportNames[reportType] || 'تقرير غير معروف';

    
    if (reportType === 'client-comprehensive') {
        updateClientComprehensiveReportContent(reportName, reportType);
    } else if (reportType === 'clients-files') {
        updateClientsFilesReportContent(reportName, reportType);
    } else if (reportType === 'sessions') {
        updateSessionsReportContent(reportName, reportType);
    } else if (reportType === 'archive') {
        updateArchiveReportContent(reportName, reportType);
    } else if (reportType === 'accounts') {
        updateAccountsReportContent(reportName, reportType);
    } else if (reportType === 'administrative') {
        updateAdministrativeReportContent(reportName, reportType);
    } else if (reportType === 'clerk-papers') {
        updateClerkPapersReportContent(reportName, reportType);
    } else if (reportType === 'expert-sessions') {
        updateExpertSessionsReportContent(reportName, reportType);
    } else {
        updateReportContent(reportName, reportType);
    }

    
    updateButtonStates(reportType);
}


function updateButtonStates(activeReportType) {
    
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-white', 'ring-opacity-50', 'report-selected');
        btn.style.transform = 'scale(1)';
    });

    
    const activeButton = document.querySelector(`[data-report="${activeReportType}"]`);
    if (activeButton) {
        activeButton.classList.add('report-selected');
        activeButton.style.transform = 'scale(1)';
    }
}


function setupReportsScrollBox() {
    try {
        const rightWrapper = document.getElementById('report-content');
        if (!rightWrapper) return;

        const viewportH = window.innerHeight;
        const wrapperTop = rightWrapper.getBoundingClientRect().top;
        const targetH = Math.max(240, viewportH - wrapperTop - 12);

        rightWrapper.style.maxHeight = targetH + 'px';
        rightWrapper.style.height = targetH + 'px';
        rightWrapper.style.overflowY = 'auto';
        rightWrapper.style.overscrollBehavior = 'contain';

        const leftPane = document.getElementById('reports-sidebar');
        if (leftPane) {
            const leftTop = leftPane.getBoundingClientRect().top;
            const leftH = Math.max(240, viewportH - leftTop - 12);
            leftPane.style.maxHeight = leftH + 'px';
            leftPane.style.height = leftH + 'px';
            leftPane.style.minHeight = '0px';
            leftPane.style.overflowY = 'auto';
            leftPane.style.overflowX = 'hidden';
            leftPane.style.overscrollBehavior = 'contain';
        }
    } catch (e) { }
}


function setupReportsHoverScrollBehavior() {
    const leftPane = document.getElementById('reports-sidebar');
    const rightContent = document.getElementById('report-content');
    const mainEl = document.querySelector('main');
    if (!leftPane || !rightContent || !mainEl) return;

    try { mainEl.style.overflowY = 'hidden'; } catch (_) { }
    try {
        document.body.style.overflowY = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
    } catch (_) { }
    try {
        leftPane.style.overscrollBehavior = 'contain';
        rightContent.style.overscrollBehavior = 'contain';
    } catch (_) { }
}

function applyReportsSidebarThemeAndHover() {
    const sidebar = document.getElementById('reports-sidebar');
    const rightContent = document.getElementById('report-content');
    if (sidebar) {
        try { sidebar.classList.add('search-left-pane-dark'); } catch (_) { }
        try { sidebar.style.background = '#111827'; } catch (_) { }
        try { sidebar.style.borderLeft = '2px solid rgba(14, 165, 233, .45)'; } catch (_) { }
        try { sidebar.style.color = 'rgba(255,255,255,.92)'; } catch (_) { }
        try {
            sidebar.style.borderBottomLeftRadius = '16px';
            sidebar.style.borderBottomRightRadius = '16px';
        } catch (_) { }
    }

    if (rightContent) {
        try {
            rightContent.style.setProperty('background', '#ffffff', 'important');
            rightContent.style.setProperty('border', '2px solid rgba(14, 165, 233, .45)', 'important');
            rightContent.style.setProperty('border-radius', '14px', 'important');
            rightContent.style.setProperty('box-shadow', '0 10px 22px rgba(15, 23, 42, 0.12)', 'important');
        } catch (_) { }
    }

    const buttons = document.querySelectorAll('.report-btn');
    buttons.forEach((btn) => {
        if (!btn || (btn.dataset && btn.dataset.hoverStyled === '1')) return;
        if (btn.dataset) btn.dataset.hoverStyled = '1';

        const setImp = (node, prop, value) => {
            try { node.style.setProperty(prop, value, 'important'); } catch (_) { }
        };
        const clearImp = (node, prop) => {
            try { node.style.removeProperty(prop); } catch (_) { }
        };

        const base = () => {
            setImp(btn, 'border', '1px solid rgba(255,255,255,0.10)');
            setImp(btn, 'transition', 'background-color .15s ease, transform .15s ease, box-shadow .15s ease, border-color .15s ease');
            clearImp(btn, 'transform');
            clearImp(btn, 'box-shadow');
            clearImp(btn, 'border-color');
            try { btn.classList.remove('ring-2', 'ring-yellow-400'); } catch (_) { }
        };

        const hover = () => {
            setImp(btn, 'border-color', 'rgba(245, 158, 11, .90)');
            setImp(btn, 'transform', 'translateY(-2px) scale(1.01)');
            setImp(btn, 'box-shadow', '0 14px 26px rgba(245, 158, 11, .14), 0 10px 18px rgba(15, 23, 42, .20)');
        };

        base();
        btn.addEventListener('mouseenter', hover);
        btn.addEventListener('mouseleave', base);
        btn.addEventListener('mousedown', () => { try { setImp(btn, 'transform', 'translateY(-1px)'); } catch (_) { } });
        btn.addEventListener('mouseup', hover);
        btn.addEventListener('blur', base);
    });
}
