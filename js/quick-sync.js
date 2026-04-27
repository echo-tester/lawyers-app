

(function(){
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const desktopBell = document.getElementById('notifications-btn');
      const mobileBell = document.getElementById('notifications-btn-mobile');

      const ensureScriptLoaded = (src) => new Promise((resolve, reject) => {
        const exists = Array.from(document.scripts).some(s => (s.src || '').includes(src));
        if (exists) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('failed'));
        document.body.appendChild(s);
      });

      const setLoading = (btn, isLoading) => {
        try {
          if (!btn) return;
          if (isLoading) {
            if (!btn.dataset.prevHtml) btn.dataset.prevHtml = btn.innerHTML;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>';
            btn.disabled = true;
            btn.title = 'جارٍ التحقق...';
            try { if (typeof showToast === 'function') showToast('جارٍ التحقق...', 'info'); } catch(_) {}
          } else {
            if (btn.dataset.prevHtml) btn.innerHTML = btn.dataset.prevHtml;
            btn.disabled = false;
            btn.title = 'مزامنة سريعة';
          }
        } catch(_) {}
      };
      const handleSyncClick = async (e) => {
        e.preventDefault();
        const btn = e.currentTarget;
        setLoading(btn, true);
        try {
          if (typeof handleSyncNow === 'function') { await handleSyncNow(); return; }
          await ensureScriptLoaded('js/settings.js');
          
          const cleanup = (() => {
            const created = [];
            const ensure = (id, tag = 'div') => {
              let el = document.getElementById(id);
              if (!el) {
                el = document.createElement(tag);
                el.id = id;
                el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
                document.body.appendChild(el);
                created.push(el);
              }
              return el;
            };
            ensure('sync-progress-container');
            ensure('sync-progress-text');
            ensure('sync-progress-percent');
            ensure('sync-progress-bar');
            ensure('sync-step-info');
            const btn = ensure('sync-now-btn', 'button');
            btn.disabled = false;
            btn.innerHTML = btn.innerHTML || 'sync';
            return () => { created.forEach(el => { try { el.remove(); } catch(_){} }); };
          })();
          try {
            if (typeof handleSyncNow === 'function') { await handleSyncNow(); cleanup(); return; }
          } catch(_) { cleanup(); throw _; }
          try { if (typeof showToast === 'function') showToast('ميزة المزامنة غير مفعلة حالياً', 'info'); } catch(_) {}
        } catch (_) {
        } finally {
          setLoading(btn, false);
        }
      };

      const createSyncBtn = (refBtn, id, sizeClass, containerFix) => {
        if (!refBtn) return null;
        if (document.getElementById(id)) return document.getElementById(id);
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = `${sizeClass} rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors`;
        btn.style.color = '#4b5563';
        btn.title = 'مزامنة سريعة';
        btn.innerHTML = '<span class="material-symbols-outlined text-2xl">sync</span>';
        btn.addEventListener('click', handleSyncClick);
        
        if (containerFix && containerFix.parent && containerFix.beforeRef) {
          try { containerFix.parent.insertBefore(btn, containerFix.beforeRef); }
          catch(_) { refBtn.insertAdjacentElement('afterend', btn); }
        } else {
          refBtn.insertAdjacentElement('afterend', btn);
        }
        return btn;
      };

      
      if (desktopBell) {
        const desktopSettings = document.getElementById('settings-btn');
        
        const desktopContainer = desktopBell.parentElement.parentElement;
        const syncBtn = createSyncBtn(
          desktopBell,
          'sync-btn',
          'relative w-12 h-12',
          desktopContainer && desktopSettings ? { parent: desktopContainer, beforeRef: desktopSettings } : null
        );
        
        if (syncBtn) {
          syncBtn.style.color = 'var(--md-sys-color-on-surface-variant)';
        }
      }
      
      if (mobileBell) {
        const mobileSettings = document.getElementById('settings-btn-mobile');
        
        const mobileContainer = mobileBell.parentElement;
        createSyncBtn(
          mobileBell,
          'sync-btn-mobile',
          'relative w-12 h-12',
          mobileContainer && mobileSettings ? { parent: mobileContainer, beforeRef: mobileSettings } : null
        );
      }
    } catch (e) {}
  });
})();


