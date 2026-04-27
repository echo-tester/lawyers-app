
function updateOpponentDisplay(opponents) {
    if (opponents.length === 0) return;
    
    const currentOpponent = opponents[currentOpponentIndex];
    
    
    const nameEl = document.getElementById('opponent-name-value');
    const capacityEl = document.getElementById('opponent-capacity-value');
    const addressEl = document.getElementById('opponent-address-value');
    const phoneEl = document.getElementById('opponent-phone-value');
    const fileNumberEl = document.getElementById('opponent-file-number-value');
    
    if (nameEl) nameEl.textContent = currentOpponent.name || 'فارغ';
    if (capacityEl) {
        let cap = '';
        try {
            const m = (typeof window !== 'undefined' && window.__clientViewOpponentCapacityById) ? window.__clientViewOpponentCapacityById : null;
            if (m && currentOpponent && currentOpponent.id != null) {
                cap = m.get ? (m.get(currentOpponent.id) || '') : '';
            }
        } catch (_) { cap = ''; }
        capacityEl.textContent = String(cap || '').trim() || currentOpponent.capacity || 'فارغ';
    }
    if (addressEl) addressEl.textContent = currentOpponent.address || 'فارغ';
    if (phoneEl) phoneEl.textContent = currentOpponent.phone || 'فارغ';
    if (fileNumberEl) fileNumberEl.textContent = currentOpponent.fileNumber || 'فارغ';
    
    
    const editBtn = document.querySelector('.edit-opponent-btn');
    if (editBtn) {
        editBtn.setAttribute('data-opponent-id', currentOpponent.id);
    }
    
    
    const indexSpan = document.getElementById('current-opponent-index');
    if (indexSpan) {
        indexSpan.textContent = currentOpponentIndex + 1;
    }
}