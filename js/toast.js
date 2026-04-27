function __toastGetContainer(position) {
    try {
        if (position === 'top-center') {
            let c = document.getElementById('toast-container-top-center');
            if (!c) {
                c = document.createElement('div');
                c.id = 'toast-container-top-center';
                document.body.appendChild(c);
            }
            const top = (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ? 60 : 20;
            c.style.position = 'fixed';
            c.style.top = top + 'px';
            c.style.left = '50%';
            c.style.right = 'auto';
            c.style.transform = 'translateX(-50%)';
            c.style.display = 'flex';
            c.style.flexDirection = 'column';
            c.style.alignItems = 'center';
            c.style.gap = '10px';
            c.style.pointerEvents = 'none';
            c.style.zIndex = '2147483647';
            c.style.minWidth = '260px';
            c.style.maxWidth = 'min(420px, 92vw)';
            return c;
        }
        return document.getElementById('toast-container');
    } catch (_) {
        return document.getElementById('toast-container');
    }
}

function showToast(message, type = 'success', durationMs = 3000, position) {
    const container = __toastGetContainer(position);
    if (!container) return;

    
    const existingToasts = container.querySelectorAll('.toast');
    if (existingToasts.length >= 2) {
        
        const oldestToast = existingToasts[existingToasts.length - 1];
        oldestToast.classList.remove('show');
        setTimeout(() => oldestToast.remove(), 200);
    }

    const toast = document.createElement('div');
    
    
    let bgColor, icon;
    switch (type) {
        case 'error':
            bgColor = '#ef4444'; 
            icon = 'ri-error-warning-fill';
            break;
        case 'info':
            bgColor = '#3b82f6'; 
            icon = 'ri-information-fill';
            break;
        case 'warning':
            bgColor = '#f59e0b'; 
            icon = 'ri-alert-fill';
            break;
        case 'purple':
            bgColor = '#9333ea'; 
            icon = 'ri-information-fill';
            break;
        default: 
            bgColor = '#2dce89'; 
            icon = 'ri-checkbox-circle-fill';
    }
    
    toast.className = 'toast';
    toast.style.backgroundColor = bgColor;
    toast.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
    
    
    toast.style.pointerEvents = 'auto';
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            try {
                if (container && container.id === 'toast-container-top-center' && container.children.length === 0) {
                    container.remove();
                }
            } catch (_) { }
        }, 200);
    });
    
    
    container.insertBefore(toast, container.firstChild);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            try {
                if (container && container.id === 'toast-container-top-center' && container.children.length === 0) {
                    container.remove();
                }
            } catch (_) { }
        }, 200);
    }, (typeof durationMs === 'number' && durationMs > 0) ? durationMs : 3000);
}
