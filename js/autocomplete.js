function setupAutocomplete(inputId, resultsContainerId, sourceFunction, onSelect) {
    const input = document.getElementById(inputId);
    const resultsContainer = document.getElementById(resultsContainerId);
    
    if (!input || !resultsContainer) return;

    input.addEventListener('input', async () => {
        const query = input.value.trim().toLowerCase();
        resultsContainer.innerHTML = '';

        if (query.length < 1) {
            resultsContainer.classList.add('hidden');
            onSelect(null);
            return;
        }

        const items = await sourceFunction();
        const filteredItems = items.filter(item => item.name.toLowerCase().includes(query));

        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const div = document.createElement('div');
                div.textContent = item.name;
                div.className = 'autocomplete-item text-right text-base font-semibold text-gray-900';
                div.addEventListener('click', () => {
                    onSelect(item);
                    input.value = item.name;
                    resultsContainer.innerHTML = '';
                    resultsContainer.classList.add('hidden');
                });
                resultsContainer.appendChild(div);
            });
            resultsContainer.classList.remove('hidden');
        } else {
            resultsContainer.classList.add('hidden');
            onSelect(null);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== input) {
            resultsContainer.classList.add('hidden');
        }
    });
}
