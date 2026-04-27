function scrapeCurrentVisibleForm() {
    try {
        const partyForm = document.getElementById('party-details-form');
        if (partyForm) {
            const formData = new FormData(partyForm);
            stateManager.updateCaseDataStash('parties', Object.fromEntries(formData.entries()));
            return;
        }
        const caseForm = document.getElementById('case-details-form');
        if (caseForm) {
            const formData = new FormData(caseForm);
            stateManager.updateCaseDataStash('caseDetails', Object.fromEntries(formData.entries()));
            return;
        }
    } catch (error) {


    }
}

function navigateTo(viewFunction, ...args) {
    scrapeCurrentVisibleForm();
    

    const modalContainer = document.getElementById('modal-container');
    const isStandalonePage = (document.body && document.body.dataset && document.body.dataset.standalone === 'true')
        || (modalContainer && modalContainer.dataset && modalContainer.dataset.lockSize === 'true');

    if (modalContainer && !isStandalonePage && !viewFunction.name.includes('displaySearchOptions')) {
        modalContainer.classList.remove('max-w-7xl', 'mx-4');
        modalContainer.classList.add('max-w-5xl');
    }
    
    stateManager.pushToModalHistory({ func: viewFunction, args: args });
    viewFunction(...args);

    
}

function navigateBack() {
    scrapeCurrentVisibleForm();

    
    const modalContainer = document.getElementById('modal-container') || document.getElementById('modal-container-hidden');
    const isStandalonePage = (document.body && document.body.dataset && document.body.dataset.standalone === 'true')
        || (modalContainer && modalContainer.dataset && modalContainer.dataset.lockSize === 'true');

    const modalTitleEl = document.getElementById('modal-title');
    const modalTitle = modalTitleEl ? modalTitleEl.textContent || '' : '';

    const clientDetailsFlag = document.getElementById('client-cases-list');
    if (clientDetailsFlag && window.location.pathname.includes('search.html')) {
        closeModal();
        return;
    }

    const caseDetailsFormEl = document.getElementById('case-details-form');
    if (caseDetailsFormEl && window.location.pathname.includes('search.html')) {
        window.location.href = 'new.html';
        return;
    }

    const partyFormEl = document.getElementById('party-details-form');
    if (partyFormEl && window.location.pathname.includes('search.html')) {
        if (typeof replaceCurrentView === 'function' && typeof displayClientViewForm === 'function' && stateManager.selectedClientId) {
            replaceCurrentView(displayClientViewForm, stateManager.selectedClientId);
            return;
        } else if (typeof displayClientViewForm === 'function' && stateManager.selectedClientId) {
            stateManager.pushToModalHistory({ func: displayClientViewForm, args: [stateManager.selectedClientId] });
            displayClientViewForm(stateManager.selectedClientId);
            return;
        } else {
            closeModal();
            return;
        }
    }

    if (modalTitle.includes('جلسات الدعوى الجديده')) {
        if (typeof replaceCurrentView === 'function' && typeof displayCaseDetailsForm === 'function') {
            replaceCurrentView(displayCaseDetailsForm);
            return;
        } else if (typeof displayCaseDetailsForm === 'function') {
            stateManager.pushToModalHistory({ func: displayCaseDetailsForm, args: [] });
            displayCaseDetailsForm();
            return;
        }
    }

    
    if (modalTitle.includes('تعديل بيانات الدعوى')) {
        window.location.href = 'new.html';
        return;
    }

    if (modalTitle.includes('تعديل العمل الإداري') || modalTitle.includes('إضافة عمل إداري جديد')) {
        const clientSelect = document.getElementById('client-select');
        if (clientSelect && clientSelect.value) {
            sessionStorage.setItem('expandedAdministrativeClientId', clientSelect.value);
        }
        displayAdministrativeModal();
        return;
    }

    if (modalTitle.includes('تعديل الحساب') || modalTitle.includes('إضافة حساب جديد')) {
        const clientSelect = document.getElementById('client-select');
        const selectedClientId = clientSelect?.value;
        if (selectedClientId) {
            sessionStorage.setItem('expandedClientId', selectedClientId);
        }
        displayAccountsModal();
        
        setTimeout(() => {
            const backBtn = document.getElementById('back-to-main');
            const pageTitle = document.getElementById('page-title');
            if (backBtn && pageTitle) {
                backBtn.innerHTML = `
                    <i class="ri-home-5-line text-white text-lg"></i>
                    <span class="text-white">الرئيسيه</span>
                `;
                pageTitle.textContent = 'الحسابات';
            }
        }, 100);
        return;
    }

    if (modalTitle.includes('تعديل ورقة محضر') || modalTitle.includes('إضافة ورقة محضر جديدة')) {
        displayClerkPapersModal();
        return;
    }

    if (modalTitle.includes('تعديل جلسة خبير') || modalTitle.includes('إضافة جلسة خبير جديدة')) {
        displayExpertSessionsModal();
        return;
    }

    const editSingleClientForm = document.getElementById('edit-single-client-form');
    const editSingleOpponentForm = document.getElementById('edit-single-opponent-form');

    if (editSingleClientForm) {
        const clientId = parseInt(document.getElementById('edit-single-client-id')?.value);
        if (clientId) {
            displayClientViewForm(clientId);
            return;
        }
    }

    if (editSingleOpponentForm) {
        const opponentId = parseInt(document.getElementById('edit-single-opponent-id')?.value);
        if (opponentId) {
            getFromIndex('cases', 'opponentId', opponentId).then(cases => {
                if (cases.length > 0) {
                    displayClientViewForm(cases[0].clientId);
                } else {
                    if (stateManager.modalHistory.length <= 1) {
                        if (isStandalonePage) {
                            window.location.href = 'index.html';
                        } else {
                            closeModal();
                        }
                    } else {
                        stateManager.popFromModalHistory();
                        const previousView = stateManager.modalHistory[stateManager.modalHistory.length - 1];
                        previousView.func(...previousView.args);
                    }
                }
            });
            return;
        }
    }

    
    if (stateManager.modalHistory.length <= 1) {
        if (isStandalonePage) {
            window.location.href = 'index.html';
        } else {
            closeModal();
        }
        return;
    }

    
    let targetIndex = stateManager.modalHistory.length - 2; 
    while (targetIndex >= 0) {
        const candidate = stateManager.modalHistory[targetIndex];
        const fname = candidate?.func?.name || '';
        if (fname.includes('displayEditClientForm') || fname.includes('displayEditOpponentForm')) {
            targetIndex -= 1; 
            continue;
        }
        break;
    }

    if (targetIndex < 0) {
        
        if (isStandalonePage) {
            window.location.href = 'index.html';
        } else {
            closeModal();
        }
        return;
    }

    
    while (stateManager.modalHistory.length - 1 > targetIndex) {
        stateManager.popFromModalHistory();
    }
    const previousView = stateManager.modalHistory[targetIndex];
    previousView.func(...previousView.args);
}

function replaceCurrentView(viewFunction, ...args) {
    if (stateManager.modalHistory.length > 0) {
        stateManager.modalHistory[stateManager.modalHistory.length - 1] = { func: viewFunction, args: args };
        viewFunction(...args);
    }
}

function openModalWithView(viewFunction, ...args) {
    stateManager.setModalHistory([]);

    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    
    modal.scrollTop = 0;

    stateManager.pushToModalHistory({ func: viewFunction, args: args });
    viewFunction(...args);
}

function closeModal() {
    const modal = document.getElementById('modal');
    const modalContainer = document.getElementById('modal-container');

    const isStandalonePage = (document.body && document.body.dataset && document.body.dataset.standalone === 'true')
        || (modalContainer && modalContainer.dataset && modalContainer.dataset.lockSize === 'true');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.scrollTop = 0;
    }
    

    if (modalContainer && !isStandalonePage) {
        modalContainer.classList.remove('max-w-7xl', 'mx-4');
        modalContainer.classList.add('max-w-5xl');
    }
    
    stateManager.resetModalState();
}
