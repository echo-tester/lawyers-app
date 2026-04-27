const stateManager = {
    modalHistory: [],
    currentCaseId: null,
    selectedClientId: null,
    selectedOpponentId: null,
    caseDataStash: {},
    
    setModalHistory(value) { this.modalHistory = value; },
    pushToModalHistory(item) { this.modalHistory.push(item); },
    popFromModalHistory() { return this.modalHistory.pop(); },
    
    setCurrentCaseId(id) { this.currentCaseId = id; },
    setSelectedClientId(id) { this.selectedClientId = id; },
    setSelectedOpponentId(id) { this.selectedOpponentId = id; },
    
    setCaseDataStash(data) { this.caseDataStash = data; },
    updateCaseDataStash(key, value) { this.caseDataStash[key] = value; },
    
    resetCaseState() {
        this.caseDataStash = {};
        this.currentCaseId = null;
        this.selectedClientId = null;
        this.selectedOpponentId = null;
    },
    
    resetModalState() {
        this.modalHistory = [];
        this.resetCaseState();
    }
};
