async function displayCaseEditForm(caseId) {
    try {
        sessionStorage.setItem('editCaseId', String(caseId));
    } catch (_) { }
    try {
        const caseRecord = await getById('cases', parseInt(caseId, 10));
        if (caseRecord && caseRecord.clientId) {
            try { sessionStorage.setItem('returnToPage', 'search'); } catch (_) { }
            try { sessionStorage.setItem('returnToClientId', String(caseRecord.clientId)); } catch (_) { }
        }
    } catch (_) { }
    window.location.href = 'new.html';
}



