

window.USE_NOTIFICATIONS_PORTAL = true;

(function(){
  document.addEventListener('DOMContentLoaded', async () => {
    
    try { if (typeof initDB === 'function') await initDB(); } catch(e) {}

    
    function isVisible(el){
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      
      const rect = el.getBoundingClientRect();
      return (rect.width > 0 && rect.height > 0);
    }
    function getBellBtn(){
      const mobile = document.getElementById('notifications-btn-mobile');
      const desktop = document.getElementById('notifications-btn');
      if (isVisible(mobile)) return mobile;
      if (isVisible(desktop)) return desktop;
      return mobile || desktop;
    }
    let bellBtn = getBellBtn();
    if (!bellBtn) return;

    function isMobileBellActive(){
      try {
        const mobile = document.getElementById('notifications-btn-mobile');
        if (mobile && isVisible(mobile)) return true;
        return false;
      } catch (_) { return false; }
    }

    
    const pop = document.createElement('div');
    pop.id = 'notifications-portal-popover';
    pop.setAttribute('dir', 'rtl');
    pop.style.position = 'fixed';
    pop.style.top = '0px'; 
    pop.style.left = '0px';
    pop.style.width = '22rem';
    pop.style.maxWidth = '95vw';
    pop.style.background = '#ffffff';
    pop.style.border = '1px solid #e5e7eb';
    pop.style.borderRadius = '12px';
    pop.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
    pop.style.overflow = 'hidden';
    pop.style.display = 'none';
    pop.style.zIndex = '100000';

    pop.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:13px;font-weight:700">الإشعارات</span>
        <button id="portal-toggle-mute-btn" style="font-size:12px;padding:4px 8px;border:1px solid #d1d5db;border-radius:9999px;background:#fff;">كتم</button>
      </div>
      <div id="portal-popover-list" style="max-height:320px; overflow:auto; padding:8px; font-size:14px;"></div>
    `;
    document.body.appendChild(pop);

    // على الهاتف: خلي اللوحة بعرض الشاشة بدل عرض ثابت
    try {
      if (isMobileBellActive()) {
        pop.style.width = '100vw';
        pop.style.maxWidth = '100vw';
        pop.style.left = '0px';
        pop.style.right = '0px';
        pop.style.borderRadius = '0px 0px 14px 14px';
      }
    } catch (_) { }

    function placePopover() {
      try {
        const r = bellBtn.getBoundingClientRect();
        const gap = 8;

        // الهاتف: اللوحة تبقى بعرض الشاشة وتبدأ من أول الشاشة
        if (isMobileBellActive()) {
          pop.style.left = '0px';
          pop.style.right = '0px';
          pop.style.top = Math.round(r.bottom + gap) + 'px';
          return;
        }
        
        const width = pop.offsetWidth || 352; 
        let x = Math.round(r.right - width);
        if (x < 8) x = 8; 
        const maxX = Math.max(8, window.innerWidth - width - 8);
        if (x > maxX) x = maxX;
        pop.style.left = x + 'px';
        pop.style.top = Math.round(r.bottom + gap) + 'px';
      } catch (e) {}
    }

    async function refreshMuteLabelPortal() {
      try {
        const muted = await getSetting('notificationsMuted');
        const btnMute = document.getElementById('portal-toggle-mute-btn');
        if (btnMute) btnMute.textContent = (muted === true || muted === 'true') ? 'إلغاء الكتم' : 'كتم';
      } catch (e) {}
    }

    let __portalCache = window.__portalCache || { ts: 0, items: null };
    // اجعل الكاش شبه فوري حتى تظهر أيقونة العين فور تحديث البيانات
    const PORTAL_CACHE_MS = 0;

    async function buildList(el) {
      if (!el) return;
      el.innerHTML = '';
      try {
        try {
          const now = Date.now();
          if (__portalCache && Array.isArray(__portalCache.items) && (now - __portalCache.ts) < PORTAL_CACHE_MS) {
            const items = __portalCache.items;
            if (!items.length) {
              el.innerHTML = '<div style="text-align:center;color:#6b7280;padding:24px 0;">لا توجد إشعارات</div>';
              return;
            }
            const frag = document.createDocumentFragment();
            items.forEach(it => {
              const block = document.createElement('div');
              block.style.padding = '8px 0';
              const header = document.createElement('div');
              header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 8px;';
              header.innerHTML = '<span class="material-symbols-outlined" style="color:#4b5563;font-size:18px;">notifications</span>' +
                                 `<span style="font-weight:700;">${it.title}</span>`;
              block.appendChild(header);
              it.lines.slice(0,3).forEach(line => {
                const row = document.createElement('div');
                row.style.cssText = 'padding:4px 8px;color:#374151;';
                row.textContent = (typeof line === 'string') ? line : (line && typeof line === 'object' ? (line.text || '') : '');
                block.appendChild(row);
              });
              frag.appendChild(block);
            });
            el.appendChild(frag);
            return;
          }
        } catch(_) {}
        const [
          todaySessionsList,
          tomorrowSessionsList,
          todayExpertsList,
          tomorrowExpertsList,
          todayAdminList,
          tomorrowAdminList,
          allCases
        ] = await Promise.all([
          getTodaySessions(3),
          getTomorrowSessions(3),
          getTodayExpertSessions(3),
          getTomorrowExpertSessions(3),
          getTodayAdministrative(3),
          getTomorrowAdministrative(3),
          getAllCases()
        ]);
        const casesMap = new Map(Array.isArray(allCases) ? allCases.map(c => [c.id, c]) : []);
        const items = [];
        const fmt = (d) => { try { return new Date(d).toLocaleDateString('ar-EG'); } catch(e) { return d || ''; } };

        if (Array.isArray(todaySessionsList) && todaySessionsList.length) {
          const todayLines = [];
          for (const s of todaySessionsList) {
              const caseInfo = casesMap.get(s.caseId) || null;
              const caseNum = caseInfo ? (caseInfo.caseNumber || '') : '';
              const roll = s.roll || '';
              const rollText = roll ? ` - رول ${roll}` : '';
              todayLines.push({
                text: `قضية ${caseNum}${rollText}`,
                type: 'session',
                id: s.id,
                caseId: s.caseId
              });
          }
          items.push({ title: `جلسات اليوم (${todaySessionsList.length})`, lines: todayLines });
        }
        if (Array.isArray(tomorrowSessionsList) && tomorrowSessionsList.length) {
          const tomorrowLines = [];
          for (const s of tomorrowSessionsList) {
              const caseInfo = casesMap.get(s.caseId) || null;
              const caseNum = caseInfo ? (caseInfo.caseNumber || '') : '';
              const roll = s.roll || '';
              const rollText = roll ? ` - رول ${roll}` : '';
              tomorrowLines.push({
                text: `قضية ${caseNum}${rollText}`,
                type: 'session',
                id: s.id,
                caseId: s.caseId
              });
          }
          items.push({ title: `جلسات الغد (${tomorrowSessionsList.length})`, lines: tomorrowLines });
        }
        if (Array.isArray(todayExpertsList) && todayExpertsList.length) {
          const lines = todayExpertsList.map(s => ({
            text: `${s.sessionType || 'جلسة'} - ${s.sessionTime || ''}`,
            type: 'expert',
            day: 'today',
            id: s.id
          }));
          items.push({ title: `خبراء اليوم (${todayExpertsList.length})`, lines: lines });
        }
        if (Array.isArray(tomorrowExpertsList) && tomorrowExpertsList.length) {
           const lines = tomorrowExpertsList.map(s => ({
            text: `${s.sessionType || 'جلسة'} - ${s.sessionTime || ''}`,
            type: 'expert',
            day: 'tomorrow',
            id: s.id
          }));
          items.push({ title: `خبراء الغد (${tomorrowExpertsList.length})`, lines: lines });
        }
        if (Array.isArray(todayAdminList) && todayAdminList.length) {
           const lines = todayAdminList.map(a => ({
            text: `${a.title || a.task || 'عمل'}`,
            type: 'admin',
            day: 'today',
            id: a.id
          }));
          items.push({ title: `مهام اليوم (${todayAdminList.length})`, lines: lines });
        }
        if (Array.isArray(tomorrowAdminList) && tomorrowAdminList.length) {
           const lines = tomorrowAdminList.map(a => ({
            text: `${a.title || a.task || 'عمل'}`,
            type: 'admin',
            day: 'tomorrow',
            id: a.id
          }));
          items.push({ title: `مهام الغد (${tomorrowAdminList.length})`, lines: lines });
        }

        if (!items.length) {
          el.innerHTML = '<div style="text-align:center;color:#6b7280;padding:24px 0;">لا توجد إشعارات</div>';
          return;
        }

        try { __portalCache = { ts: Date.now(), items: items }; window.__portalCache = __portalCache; } catch(_) {}

        const frag = document.createDocumentFragment();
        items.forEach(it => {
          const block = document.createElement('div');
          block.style.padding = '8px 0';
          const header = document.createElement('div');
          header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 8px;';
          header.innerHTML = '<span class="material-symbols-outlined" style="color:#4b5563;font-size:18px;">notifications</span>' +
                             `<span style="font-weight:700;">${it.title}</span>`;
          block.appendChild(header);
          it.lines.slice(0, 3).forEach(lineItem => {
            const row = document.createElement('div');
            row.style.cssText = 'padding:4px 8px;color:#374151;display:flex;align-items:center;justify-content:space-between;gap:8px;';
            
            // Text logic
            const textHTML = typeof lineItem === 'string' ? lineItem : (lineItem.text || '');
            const txt = document.createElement('span');
            txt.textContent = textHTML;
            row.appendChild(txt);

            // Action Button logic
            if (typeof lineItem === 'object' && lineItem.type) {
                const btn = document.createElement('button');
                btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">visibility</span>';
                btn.title = 'عرض التفاصيل';
                btn.style.cssText = 'border:none;background:transparent;color:#3b82f6;cursor:pointer;padding:2px;border-radius:4px;display:flex;align-items:center;';
                btn.onmouseover = () => btn.style.background = '#eff6ff';
                btn.onmouseout = () => btn.style.background = 'transparent';
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    // Close portal
                    if(typeof hidePopover === 'function') hidePopover(); else { try{ document.getElementById('notifications-portal-popover').style.display='none'; }catch(e){} }
                    
                    // Navigate logic
                    const type = lineItem.type;
                    const id = lineItem.id;
                    const day = lineItem.day;
                    
                    if (type === 'session') {
                        window.location.href = `case-info.html?sessionId=${encodeURIComponent(String(id || ''))}`;
                    } else if (type === 'expert') {
                         try {
                             if (day === 'today' || day === 'tomorrow') {
                                 sessionStorage.setItem('expert_sessions_open_filter', day);
                             } else {
                                 sessionStorage.setItem('expert_sessions_open_filter', 'tomorrow');
                             }
                         } catch (_) { }
                         window.location.href = `expert-sessions.html?filter=${encodeURIComponent(String(day || 'tomorrow'))}`;
                    } else if (type === 'admin') {
                         window.location.href = `administrative.html?filter=${encodeURIComponent(String(day || 'tomorrow'))}`;
                    }
                };
                row.appendChild(btn);
            }
            
            block.appendChild(row);
          });
          frag.appendChild(block);
        });
        el.appendChild(frag);
      } catch (err) {
        el.innerHTML = '<div style="text-align:center;color:#6b7280;padding:24px 0;">لا توجد إشعارات</div>';
      }
    }

    function showPopover() {
      pop.style.display = 'block';
      buildList(pop.querySelector('#portal-popover-list'));
      refreshMuteLabelPortal();
      placePopover();
      setTimeout(() => {
        document.addEventListener('click', onOutside, true);
        window.addEventListener('resize', hidePopover);
        window.addEventListener('scroll', onAnyScroll, true);
      }, 0);
    }

    
    (async () => {
      try {
        const muted = await getSetting('notificationsMuted');
        try { if (typeof window.setNotificationsBellMutedIcon === 'function') window.setNotificationsBellMutedIcon(muted); } catch(e) {}
        await refreshMuteLabelPortal();
      } catch (e) {}
    })();
    function hidePopover() {
      pop.style.display = 'none';
      document.removeEventListener('click', onOutside, true);
      window.removeEventListener('resize', hidePopover);
      window.removeEventListener('scroll', onAnyScroll, true);
    }
    function onOutside(e) {
      if (pop.contains(e.target) || bellBtn.contains(e.target)) return;
      hidePopover();
    }
    function onAnyScroll(e) {
      try {
        
        if (pop.contains(e.target)) return;
      } catch(_) {}
      hidePopover();
    }

    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pop.style.display === 'block') hidePopover(); else showPopover();
    });

    pop.querySelector('#portal-toggle-mute-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const muted = await getSetting('notificationsMuted');
        const next = !(muted === true || muted === 'true');
        await setSetting('notificationsMuted', next);
        await refreshMuteLabelPortal();
        try { if (typeof window.setNotificationsBellMutedIcon === 'function') window.setNotificationsBellMutedIcon(next); } catch(e) {}
        if (typeof showToast === 'function') showToast(next ? 'تم كتم الإشعارات' : 'تم إلغاء الكتم', 'info');
      } catch (err) {}
    });
  });
})();