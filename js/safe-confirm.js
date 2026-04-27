(function(){
    if (window.safeConfirm) return;
    function safeConfirm(message){
        return new Promise((resolve)=>{
            try { if (document.getElementById('safe-confirm-overlay')) { document.getElementById('safe-confirm-overlay').remove(); } } catch (_) {}
            const prevOverflow = document.body && document.body.style ? document.body.style.overflow : '';
            const prevFocus = (typeof document !== 'undefined') ? document.activeElement : null;
            const overlay = document.createElement('div');
            overlay.id = 'safe-confirm-overlay';
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '1000001';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.padding = '16px';

            const box = document.createElement('div');
            box.style.background = '#fff';
            box.style.border = '1px solid #e5e7eb';
            box.style.borderRadius = '12px';
            box.style.maxWidth = '90vw';
            box.style.width = '360px';
            box.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25)';
            box.style.fontFamily = 'inherit';

            const content = document.createElement('div');
            content.style.padding = '16px 16px 0 16px';
            const p = document.createElement('div');
            p.textContent = message || '';
            p.style.color = '#111827';
            p.style.fontSize = '14px';
            p.style.lineHeight = '1.5';
            p.style.textAlign = 'center';
            content.appendChild(p);

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';
            actions.style.padding = '16px';
            actions.style.justifyContent = 'center';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'لا';
            cancelBtn.style.padding = '8px 14px';
            cancelBtn.style.borderRadius = '8px';
            cancelBtn.style.border = '1px solid #d1d5db';
            cancelBtn.style.background = '#fff';
            cancelBtn.style.color = '#111827';
            cancelBtn.style.fontWeight = '600';
            cancelBtn.style.cursor = 'pointer';

            const okBtn = document.createElement('button');
            okBtn.type = 'button';
            okBtn.textContent = 'نعم';
            okBtn.style.padding = '8px 14px';
            okBtn.style.borderRadius = '8px';
            okBtn.style.border = '0';
            okBtn.style.background = '#2563eb';
            okBtn.style.color = '#fff';
            okBtn.style.fontWeight = '700';
            okBtn.style.cursor = 'pointer';

            actions.appendChild(cancelBtn);
            actions.appendChild(okBtn);
            box.appendChild(content);
            box.appendChild(actions);
            overlay.appendChild(box);

            function cleanup(){
                try { document.removeEventListener('keydown', onKey); } catch(_){ }
                try { overlay.remove(); } catch(_){ }
                try { if (document.body) document.body.style.overflow = prevOverflow; } catch(_){ }
                try { if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus(); } catch(_){ }
            }
            function onCancel(){ cleanup(); resolve(false); }
            function onOk(){ cleanup(); resolve(true); }
            function onKey(e){
                if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
                if (e.key === 'Enter') { e.preventDefault(); onOk(); }
            }

            overlay.addEventListener('click', (e)=>{ if (e.target === overlay) onCancel(); });
            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onOk);
            document.addEventListener('keydown', onKey);

            try { if (document.body) document.body.style.overflow = 'hidden'; } catch(_){ }
            document.body.appendChild(overlay);
            setTimeout(()=>{ try { okBtn.focus(); } catch(_){ } }, 0);
        });
    }
    window.safeConfirm = safeConfirm;
})();
