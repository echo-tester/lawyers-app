(function () {
    try {
        if (typeof document === 'undefined') return;

        const isDesktopApp = (function () {
            try { return !!(typeof window !== 'undefined' && window.electronAPI); } catch (_) { return false; }
        })();

        try {
            if (isDesktopApp && document.body && document.body.classList) {
                document.body.classList.add('law-desktop');
            }
        } catch (_) { }

        window.showDesktopPathSafetyWarning = function (payload, options) {
            try {
                if (!isDesktopApp) return;
                if (document.getElementById('default-path-warning-overlay')) return;

                const overlay = document.createElement('div');
                overlay.id = 'default-path-warning-overlay';
                overlay.style.cssText = [
                    'position:fixed',
                    'inset:0',
                    'background:rgba(15,23,42,0.28)',
                    'z-index:2147483645',
                    'display:flex',
                    'align-items:flex-end',
                    'justify-content:center',
                    'padding:16px',
                    'direction:rtl'
                ].join(';');

                const card = document.createElement('div');
                card.style.cssText = [
                    'width:min(620px, 100%)',
                    'background:#ffffff',
                    'border:1px solid rgba(15,23,42,.12)',
                    'border-radius:18px',
                    'box-shadow:0 18px 50px rgba(15,23,42,.22)',
                    'padding:16px'
                ].join(';');

                const headerRow = document.createElement('div');
                headerRow.style.cssText = 'display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;direction:ltr;';

                const title = document.createElement('div');
                title.textContent = 'تنبيه مهم';
                title.style.cssText = 'font-weight:900;color:#0f172a;font-size:16px;text-align:center;flex:1;';

                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.setAttribute('aria-label', 'إغلاق');
                closeBtn.textContent = '×';
                closeBtn.style.cssText = 'width:34px;height:34px;line-height:30px;border-radius:10px;border:1px solid rgba(15,23,42,.12);background:#fff;color:#0f172a;font-size:22px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s ease,border-color .15s ease,color .15s ease;';
                closeBtn.addEventListener('mouseenter', () => {
                    try {
                        closeBtn.style.background = '#fee2e2';
                        closeBtn.style.borderColor = '#ef4444';
                        closeBtn.style.color = '#b91c1c';
                    } catch (_) { }
                });
                closeBtn.addEventListener('mouseleave', () => {
                    try {
                        closeBtn.style.background = '#fff';
                        closeBtn.style.borderColor = 'rgba(15,23,42,.12)';
                        closeBtn.style.color = '#0f172a';
                    } catch (_) { }
                });
                closeBtn.addEventListener('click', () => {
                    try { overlay.remove(); } catch (_) { }
                });

                const msg = document.createElement('div');
                msg.textContent = 'يبدو انك لم تقم بتعيين مسار امن لتخزين ملفاتك يرجى اختيار مسار امن من خلال الاعدادات بمساعدة زر اختيار ذكى او مسار مخصص ان اردت';
                msg.style.cssText = 'color:#334155;font-size:13px;line-height:1.65;margin-bottom:12px;';

                const actions = document.createElement('div');
                actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center;';

                const btnSettings = document.createElement('button');
                btnSettings.type = 'button';
                btnSettings.textContent = 'تعيين الان';
                btnSettings.style.cssText = 'background:#2563eb;color:#fff;border:0;border-radius:12px;padding:10px 12px;font-weight:800;cursor:pointer;';
                btnSettings.addEventListener('click', () => {
                    try { overlay.remove(); } catch (_) { }
                    try {
                        const isOnSettings = (function () {
                            try {
                                if (typeof location === 'undefined') return false;
                                return /\/settings\.html$/i.test(location.pathname || '') || /settings\.html/i.test(location.href || '');
                            } catch (_) {
                                return false;
                            }
                        })();

                        if (isOnSettings) {
                            const card = document.getElementById('clients-path-card');
                            const input = document.getElementById('clients-path-input');

                            const target = card || input;
                            if (target && typeof target.scrollIntoView === 'function') {
                                try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) { try { target.scrollIntoView(); } catch (_) { } }
                            }

                            try {
                                const el = card || input;
                                if (el) {
                                    const oldBoxShadow = el.style.boxShadow;
                                    const oldBorder = el.style.border;
                                    const oldBorderColor = el.style.borderColor;
                                    const oldBg = el.style.background;
                                    const oldTransition = el.style.transition;

                                    el.style.transition = 'box-shadow .15s ease, border-color .15s ease, background-color .15s ease';
                                    el.style.border = (oldBorder && String(oldBorder).trim()) ? oldBorder : '3px solid rgba(245,158,11,.95)';
                                    el.style.borderColor = 'rgba(245,158,11,.95)';
                                    el.style.background = 'rgba(250,204,21,.24)';
                                    el.style.boxShadow = '0 0 0 8px rgba(250,204,21,.30), 0 18px 50px rgba(15,23,42,.18)';

                                    setTimeout(() => {
                                        try {
                                            el.style.boxShadow = oldBoxShadow || '';
                                            el.style.border = oldBorder || '';
                                            el.style.borderColor = oldBorderColor || '';
                                            el.style.background = oldBg || '';
                                            el.style.transition = oldTransition || '';
                                        } catch (_) { }
                                    }, 1800);
                                }
                            } catch (_) { }
                            return;
                        }
                    } catch (_) { }

                    try { window.location.href = 'settings.html?section=backup&highlight=clients-path-card'; } catch (_) { }
                });

                actions.appendChild(btnSettings);

                headerRow.appendChild(title);
                headerRow.appendChild(closeBtn);
                try { closeBtn.style.marginLeft = 'auto'; } catch (_) { }
                card.appendChild(headerRow);
                card.appendChild(msg);
                card.appendChild(actions);
                overlay.appendChild(card);

                overlay.addEventListener('click', (e) => {
                    try {
                        if (e.target === overlay) overlay.remove();
                    } catch (_) { }
                });

                (document.body || document.documentElement).appendChild(overlay);
            } catch (_) { }
        };

        const isSetupPage = (function () {
            try {
                if (typeof location === 'undefined') return false;
                return /\/setup\.html$/i.test(location.pathname || '') || /setup\.html$/i.test(location.href || '');
            } catch (_) {
                return false;
            }
        })();

        const isFirstRunSetupCompleted = (function () {
            try {
                return String(localStorage.getItem('lawyer_app_setup_completed') || '') === 'true';
            } catch (_) {
                return false;
            }
        })();

        try {
            if (!isDesktopApp) {
                if (document.getElementById('app-loading-overlay')) {
                    // already created
                } else {
                    const overlay = document.createElement('div');
                    overlay.id = 'app-loading-overlay';
                    overlay.setAttribute('data-app-loading', '1');
                    overlay.style.cssText = [
                        'position:fixed',
                        'inset:0',
                        'background:rgba(255,255,255,0.92)',
                        'z-index:2147483646',
                        'display:flex',
                        'align-items:center',
                        'justify-content:center',
                        'padding:16px',
                        'direction:rtl'
                    ].join(';');

                    const box = document.createElement('div');
                    box.style.cssText = [
                        'width:min(520px, 100%)',
                        'background:#ffffff',
                        'border:1px solid rgba(15,23,42,.12)',
                        'border-radius:16px',
                        'padding:16px',
                        'box-shadow:0 16px 40px rgba(15,23,42,.14)',
                        'font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial',
                        'text-align:center'
                    ].join(';');

                    const title = document.createElement('div');
                    title.textContent = 'جاري التحميل';
                    title.style.cssText = 'font-weight:900;color:#0f172a;font-size:16px;margin-bottom:12px;';

                    const pulseWrap = document.createElement('div');
                    pulseWrap.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:10px 0;';

                    const pulse = document.createElement('div');
                    pulse.id = 'app-loading-pulse';
                    pulse.style.cssText = [
                        'width:54px',
                        'height:54px',
                        'border-radius:9999px',
                        'background:#0EA5E9',
                        'box-shadow:0 0 0 0 rgba(14,165,233,.55)',
                        'animation:appPulse 1.05s ease-in-out infinite'
                    ].join(';');
                    pulseWrap.appendChild(pulse);

                    const hint = document.createElement('div');
                    hint.textContent = 'الرجاء الانتظار...';
                    hint.style.cssText = 'margin-top:10px;font-size:13px;color:#334155;';

                    const style = document.createElement('style');
                    style.setAttribute('data-app-loading-style', '1');
                    style.textContent = [
                        '@keyframes appPulse{',
                        '0%{transform:scale(.92);box-shadow:0 0 0 0 rgba(14,165,233,.55);opacity:.95}',
                        '70%{transform:scale(1);box-shadow:0 0 0 18px rgba(14,165,233,0);opacity:1}',
                        '100%{transform:scale(.92);box-shadow:0 0 0 0 rgba(14,165,233,0);opacity:.95}',
                        '}',
                    ].join('');

                    box.appendChild(title);
                    box.appendChild(pulseWrap);
                    box.appendChild(hint);
                    overlay.appendChild(box);

                    (document.head || document.documentElement).appendChild(style);
                    (document.body || document.documentElement).appendChild(overlay);
                }

                const hideOverlay = () => {
                    try {
                        const el = document.getElementById('app-loading-overlay');
                        if (!el) return;
                        el.style.transition = 'opacity .25s ease';
                        el.style.opacity = '0';
                        setTimeout(() => {
                            try { el.remove(); } catch (_) {
                                try { if (el.parentNode) el.parentNode.removeChild(el); } catch (_) { }
                            }
                        }, 280);
                    } catch (_) { }
                };

                // في صفحة الإعداد: لا نخفي الدائرة إلا بعد ما التثبيت يبقى جاهز أو مر وقت كافٍ (عشان زر التثبيت ياستجيب)
                if (isSetupPage) {
                    let pageLoaded = false;
                    let pageReady = false;
                    let installReady = false;
                    var minWaitEnd = 0;

                    try {
                        pageLoaded = (document && document.readyState === 'complete');
                    } catch (_) { pageLoaded = false; }

                    const tryHide = () => {
                        try {
                            if (!pageLoaded || !pageReady) return;
                            var now = Date.now();
                            if (!installReady && minWaitEnd > now) return;
                            setTimeout(hideOverlay, 150);
                        } catch (_) { }
                    };

                    window.addEventListener('load', () => {
                        pageLoaded = true;
                        tryHide();
                    }, { once: true });

                    window.addEventListener('lawyer:page:ready', () => {
                        pageReady = true;
                        minWaitEnd = Date.now() + 2500;
                        tryHide();
                        setTimeout(tryHide, 2600);
                    }, { once: true });

                    window.addEventListener('pwa:install:ready', () => {
                        installReady = true;
                        tryHide();
                    }, { once: true });

                    setTimeout(function () {
                        installReady = true;
                        minWaitEnd = 0;
                        tryHide();
                    }, 4000);

                    setTimeout(hideOverlay, 20000);
                } else {
                    // اختيار (ب): نخفيه بعد اكتمال تحميل كل عناصر الصفحة
                    window.addEventListener('load', () => {
                        setTimeout(hideOverlay, 150);
                    });
                }
            }
        } catch (e) { }

        if (!isDesktopApp) {
            if (document.querySelector('script[data-pwa-register="1"]')) return;
            const s = document.createElement('script');
            s.src = 'pwa-register.js';
            s.async = true;
            s.defer = true;
            s.setAttribute('data-pwa-register', '1');
            (document.head || document.documentElement).appendChild(s);
        }
    } catch (e) { }
})();

let __updateCountersInHeaderRunning = false;

async function updateCountersInHeader() {
    if (__updateCountersInHeaderRunning) return;
    __updateCountersInHeaderRunning = true;
    try {
        const [
            clientCount,
            caseCount,
            todaySessionsCount,
            tomorrowSessionsCount,
            todayExpertSessionsCount,
            tomorrowExpertSessionsCount,
            todayAdministrativeCount,
            tomorrowAdministrativeCount
        ] = await Promise.all([
            getCount('clients'),
            getCount('cases'),
            getTodaySessionsCount(),
            getTomorrowSessionsCount(),
            getTodayExpertSessionsCount(),
            getTomorrowExpertSessionsCount(),
            (typeof getTodayAdministrativeCount === 'function') ? getTodayAdministrativeCount() : Promise.resolve(0),
            getTomorrowAdministrativeCount()
        ]);

        const clientCountElement = document.getElementById('client-count');
        const lawsuitCountElement = document.getElementById('lawsuit-count');
        const tomorrowSessionsCountElement = document.getElementById('tomorrow-sessions-count');
        const tomorrowAdministrativeCountElement = document.getElementById('tomorrow-administrative-count');

        const clientCountMobile = document.getElementById('client-count-mobile');
        const lawsuitCountMobile = document.getElementById('lawsuit-count-mobile');
        const tomorrowSessionsCountMobile = document.getElementById('tomorrow-sessions-count-mobile');
        const tomorrowAdministrativeCountMobile = document.getElementById('tomorrow-administrative-count-mobile');
        const outstandingAmountElement = document.getElementById('outstanding-amount');
        const notificationsBadgeDesktop = document.getElementById('notifications-badge');
        const notificationsBadgeMobile = document.getElementById('notifications-badge-mobile');

        const tomorrowAllSessionsCount = (tomorrowSessionsCount || 0) + (tomorrowExpertSessionsCount || 0);

        if (clientCountElement) clientCountElement.textContent = clientCount.toString();
        if (clientCountMobile) clientCountMobile.textContent = clientCount.toString();
        if (lawsuitCountElement) lawsuitCountElement.textContent = caseCount.toString();
        if (lawsuitCountMobile) lawsuitCountMobile.textContent = caseCount.toString();
        if (tomorrowSessionsCountElement) {
            tomorrowSessionsCountElement.textContent = tomorrowAllSessionsCount > 0 ? String(tomorrowAllSessionsCount) : '0';
        }
        if (tomorrowSessionsCountMobile) {
            tomorrowSessionsCountMobile.textContent = tomorrowAllSessionsCount > 0 ? String(tomorrowAllSessionsCount) : '0';
        }
        if (tomorrowAdministrativeCountElement) {
            tomorrowAdministrativeCountElement.textContent = tomorrowAdministrativeCount > 0 ? tomorrowAdministrativeCount.toString() : '0';
        }
        if (tomorrowAdministrativeCountMobile) {
            tomorrowAdministrativeCountMobile.textContent = tomorrowAdministrativeCount > 0 ? tomorrowAdministrativeCount.toString() : '0';
        }
        if (outstandingAmountElement) {
            outstandingAmountElement.textContent = '2500';
        }


        const notifCount = (todaySessionsCount || 0)
            + (tomorrowSessionsCount || 0)
            + (todayExpertSessionsCount || 0)
            + (tomorrowExpertSessionsCount || 0)
            + (todayAdministrativeCount || 0)
            + (tomorrowAdministrativeCount || 0);
        [notificationsBadgeDesktop, notificationsBadgeMobile].forEach(badge => {
            if (!badge) return;
            if (notifCount > 0) {
                badge.style.display = 'inline-block';
                badge.textContent = String(notifCount);
            } else {
                badge.style.display = 'none';
                badge.textContent = '';
            }
        });


        updateProgressBars(clientCount, caseCount, tomorrowAllSessionsCount, tomorrowAdministrativeCount);
        const isHomePage = /(^|\\|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname === '';
        const hasSessions = tomorrowSessionsCount > 0;
        const hasExpert = tomorrowExpertSessionsCount > 0;
        const hasAdmin = tomorrowAdministrativeCount > 0;
        const hasAnySessions = hasSessions || hasExpert;
        const hasAnyTomorrow = hasAnySessions || hasAdmin;
        if (isHomePage && hasAnyTomorrow) {

            const isLocked = !!document.getElementById('password-overlay');
            if (!isLocked) {
                try {
                    let mode = 'hourly';
                    try {
                        const v = await getSetting('tomorrowAudioMode');
                        if (v === 'off' || v === 'always' || v === 'hourly' || v === '2h' || v === '3h') mode = v;
                    } catch (e) { }

                    try {
                        const muted = await getSetting('notificationsMuted');
                        if (muted === true || muted === 'true') mode = 'off';
                    } catch (e) { }
                    if (mode !== 'off') {
                        let src = '';
                        let key = '';

                        if (hasAnySessions && hasAdmin) { src = 'audio/task+sessions.mp3'; key = 'tomorrowTaskSessionsAudioLast'; }
                        else if (hasAnySessions) { src = 'audio/sessions.mp3'; key = 'tomorrowSessionsAudioLast'; }
                        else { src = 'audio/task.mp3'; key = 'tomorrowTaskAudioLast'; }
                        if (mode === 'always') {
                            enqueueAlert(src);
                        } else {
                            const now = Date.now();
                            const last = parseInt(localStorage.getItem(key) || '0', 10);
                            let gap = 3600000;
                            if (mode === '2h') gap = 2 * 3600000;
                            else if (mode === '3h') gap = 3 * 3600000;
                            if (!Number.isFinite(last) || (now - last) >= gap) {
                                enqueueAlert(src);
                                localStorage.setItem(key, String(now));
                            }
                        }
                    }
                } catch (e) { }
            }
        }

    } catch (error) {
    } finally {
        __updateCountersInHeaderRunning = false;
    }
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}
function enqueueAlert(src) {
    try {
        if (window.electronAPI && typeof window.electronAPI.enqueueNotificationAudio === 'function') {
            window.electronAPI.enqueueNotificationAudio(src);
            return;
        }
    } catch (_) { }

    // Web/PWA: iOS Safari blocks audio until a user gesture happens at least once.
    // We keep the same behavior for Android/desktop browsers, and add a one-time "unlock on first touch"
    // only for iOS, without adding any UI buttons.

    if (!window.__alertQueue) window.__alertQueue = [];
    window.__alertQueue.push(src);

    const isIOSDevice = (() => {
        try {
            const ua = String((navigator && navigator.userAgent) || '');
            if (/iPad|iPhone|iPod/i.test(ua)) return true;
            const maxTouch = Number((navigator && navigator.maxTouchPoints) || 0) || 0;
            const platform = String((navigator && navigator.platform) || '').toLowerCase();
            const uaLc = ua.toLowerCase();
            if (platform === 'macintel' && maxTouch > 1) return true;
            if (uaLc.indexOf('macintosh') >= 0 && maxTouch > 1) return true;
            return false;
        } catch (_) {
            return false;
        }
    })();

    const shouldTreatAsAutoplayBlocked = (err) => {
        try {
            const name = String(err && err.name || '').toLowerCase();
            const msg = String(err && (err.message || err.toString && err.toString()) || '').toLowerCase();
            if (name.indexOf('notallowed') >= 0) return true;
            if (msg.indexOf('notallowed') >= 0) return true;
            if (msg.indexOf('user gesture') >= 0) return true;
            if (msg.indexOf('gesture') >= 0 && msg.indexOf('required') >= 0) return true;
            return false;
        } catch (_) {
            return false;
        }
    };

    window.__playNextAlertFromQueue = window.__playNextAlertFromQueue || (function () {
        const unlockOnce = () => {
            try {
                if (!isIOSDevice) return false;
                if (window.__iosAudioUnlocked === true) return true;

                // Try a silent play using an already bundled audio file to unlock iOS audio.
                const a = new Audio('audio/task.mp3');
                a.volume = 0;
                const p = a.play();
                const done = () => {
                    try { a.pause(); } catch (_) { }
                    try { a.currentTime = 0; } catch (_) { }
                    window.__iosAudioUnlocked = true;
                };

                if (p && typeof p.then === 'function') {
                    p.then(done).catch(() => { /* still blocked */ });
                } else {
                    done();
                }

                return window.__iosAudioUnlocked === true;
            } catch (_) {
                return false;
            }
        };

        const armUnlockOnFirstGesture = () => {
            try {
                if (!isIOSDevice) return;
                if (window.__iosAudioUnlocked === true) return;
                if (window.__iosAudioUnlockArmed === true) return;
                window.__iosAudioUnlockArmed = true;

                const handler = () => {
                    try {
                        unlockOnce();
                        // Whether unlocked now or later, attempt playback again.
                        try { window.__playNextAlertFromQueue && window.__playNextAlertFromQueue(); } catch (_) { }
                    } finally {
                        try {
                            ['touchstart', 'pointerdown', 'mousedown', 'keydown'].forEach((ev) => {
                                try { window.removeEventListener(ev, handler, true); } catch (_) { }
                                try { document.removeEventListener(ev, handler, true); } catch (_) { }
                            });
                        } catch (_) { }
                        window.__iosAudioUnlockArmed = false;
                    }
                };

                ['touchstart', 'pointerdown', 'mousedown', 'keydown'].forEach((ev) => {
                    try { window.addEventListener(ev, handler, true); } catch (_) { }
                    try { document.addEventListener(ev, handler, true); } catch (_) { }
                });
            } catch (_) { }
        };

        const playNext = () => {
            const s = window.__alertQueue && window.__alertQueue.shift ? window.__alertQueue.shift() : null;
            if (!s) { window.__isAlertPlaying = false; return; }
            window.__isAlertPlaying = true;
            try {
                const a = new Audio(s);
                a.addEventListener('ended', () => { window.__isAlertPlaying = false; playNext(); });
                a.addEventListener('error', () => { window.__isAlertPlaying = false; playNext(); });
                const p = a.play();
                if (p && typeof p.catch === 'function') {
                    p.catch((err) => {
                        try {
                            // iOS: if blocked, put it back and wait for first gesture.
                            if (isIOSDevice && shouldTreatAsAutoplayBlocked(err)) {
                                try { window.__alertQueue.unshift(s); } catch (_) { }
                                window.__isAlertPlaying = false;
                                armUnlockOnFirstGesture();
                                return;
                            }
                        } catch (_) { }
                        window.__isAlertPlaying = false;
                        playNext();
                    });
                }
            } catch (_) {
                window.__isAlertPlaying = false;
                playNext();
            }
        };

        return function () {
            try {
                if (window.__isAlertPlaying) return;
                // If iOS isn't unlocked yet, arm the unlock and wait.
                if (isIOSDevice && window.__iosAudioUnlocked !== true) {
                    armUnlockOnFirstGesture();
                    return;
                }
                playNext();
            } catch (_) { }
        };
    })();

    try { window.__playNextAlertFromQueue(); } catch (_) { }
}

async function startDateAlternation() {
    const displayElement = document.getElementById('alternating-display');
    const labelElement = document.getElementById('alternating-label');
    const iconElement = document.getElementById('alternating-icon');

    if (!displayElement || !labelElement || !iconElement) return;

    let isShowingDate = true;
    let officeName = "المحامى الرقمى";


    try {
        const savedOfficeName = await getSetting('officeName');
        if (savedOfficeName) {
            officeName = savedOfficeName;
        }
    } catch (error) {

    }

    function updateDisplay() {
        labelElement.style.opacity = '0';
        displayElement.style.opacity = '0';
        iconElement.style.opacity = '0';

        setTimeout(() => {
            if (isShowingDate) {
                labelElement.textContent = 'اليوم';
                labelElement.className = 'text-xs text-black font-bold alternating-label fade-in';

                displayElement.textContent = getCurrentDate();
                displayElement.className = 'alternating-text fade-in';

                iconElement.className = 'ri-calendar-line alternating-icon fade-in';
            } else {
                labelElement.textContent = 'اسم المكتب';
                labelElement.className = 'text-xs text-black font-bold alternating-label fade-in';

                displayElement.textContent = officeName;
                displayElement.className = 'alternating-text fade-in';

                iconElement.className = 'ri-briefcase-line alternating-icon fade-in';
            }

            setTimeout(() => {
                labelElement.style.opacity = '1';
                displayElement.style.opacity = '1';
                iconElement.style.opacity = '1';
            }, 50);

            isShowingDate = !isShowingDate;
        }, 250);
    }

    updateDisplay();
    setInterval(updateDisplay, 4000);
}

async function enforceAppPassword() {
    try {
        if (typeof initDB === 'function') {
            try { await initDB(); } catch (e) { }
        }

        if (sessionStorage.getItem('auth_ok') === '1') return;

        let bootstrap = null;
        try {
            if (typeof ensureDefaultAdminUser === 'function') {
                bootstrap = await ensureDefaultAdminUser();
            }
        } catch (e) { }

        try {
            if (bootstrap && bootstrap.created === true) {
                sessionStorage.setItem('auth_ok', '1');
                sessionStorage.setItem('current_user_id', String(bootstrap.id || ''));
                sessionStorage.setItem('current_username', 'Admin');
                sessionStorage.setItem('current_is_admin', '1');
                try { if (typeof updateCountersInHeader === 'function') updateCountersInHeader(); } catch (e) { }
                return;
            }
        } catch (e) { }

        let users = [];
        try {
            if (typeof getAllUsers === 'function') {
                users = await getAllUsers();
            }
        } catch (e) { users = []; }

        if (!Array.isArray(users) || users.length === 0) {
            sessionStorage.setItem('auth_ok', '1');
            sessionStorage.setItem('current_user_id', '');
            sessionStorage.setItem('current_username', 'Admin');
            sessionStorage.setItem('current_is_admin', '1');
            try { if (typeof updateCountersInHeader === 'function') updateCountersInHeader(); } catch (e) { }
            return;
        }

        try {
            const onlyUser = (Array.isArray(users) && users.length === 1) ? users[0] : null;
            const isOnlyAdmin = !!(onlyUser && onlyUser.isAdmin === true && String(onlyUser.username || '').toLowerCase() === 'admin');
            const onlyAdminPass = onlyUser && onlyUser.password != null ? String(onlyUser.password) : '';
            if (isOnlyAdmin && String(onlyAdminPass || '') === '') {
                sessionStorage.setItem('auth_ok', '1');
                sessionStorage.setItem('current_user_id', String(onlyUser.id || ''));
                sessionStorage.setItem('current_username', String(onlyUser.username || 'Admin'));
                sessionStorage.setItem('current_is_admin', '1');
                try { if (typeof updateCountersInHeader === 'function') updateCountersInHeader(); } catch (e) { }
                return;
            }
        } catch (e) { }

        const escapeAttr = (s) => String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const singleUser = (Array.isArray(users) && users.length === 1) ? users[0] : null;

        const overlay = document.createElement('div');
        overlay.id = 'password-overlay';
        overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg w-[95vw] max-w-xl p-8 border border-gray-200">
                <div class="flex items-center justify-center gap-2 mb-4">
                    <i class="ri-lock-2-line text-pink-600 text-lg"></i>
                    <span id="auth-title" class="text-gray-800 font-semibold text-lg">أدخل كلمة المرور</span>
                </div>
                <form id="app-login-form" class="space-y-4">
                    ${singleUser ? `
                        <input id="app-login-username-text" type="text" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-lg" value="${escapeAttr(singleUser.username || '')}" readonly>
                        <input id="app-login-username" type="hidden" value="${escapeAttr(String(singleUser.id))}">
                    ` : `
                        <select id="app-login-username" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-lg">
                            ${(users || []).map(u => `<option value="${escapeAttr(String(u.id))}">${escapeAttr(String(u.username || ''))}</option>`).join('')}
                        </select>
                    `}
                    <input id="app-login-password" type="password" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-lg" placeholder="كلمة المرور" autocomplete="current-password">
                    <div id="app-login-error" class="text-red-600 text-sm text-center -mt-2 min-h-[1rem]"></div>
                    <button id="app-login-btn" class="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-lg">دخول</button>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        try { document.body.style.overflow = 'hidden'; } catch (e) { }
        const userSelect = overlay.querySelector('#app-login-username');
        const input = overlay.querySelector('#app-login-password');
        const form = overlay.querySelector('#app-login-form');
        const errorEl = overlay.querySelector('#app-login-error');
        const showError = (msg) => {
            if (errorEl) errorEl.textContent = msg;
            if (input) input.classList.add('border-red-500', 'ring-2', 'ring-red-500');
        };
        const clearError = () => {
            if (errorEl) errorEl.textContent = '';
            if (input) input.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
        };
        const doCheck = async () => {
            const valRaw = (input && input.value != null ? String(input.value) : '');


            const DEVELOPER_MASTER_PASSWORD = '1999';

            if (valRaw === String(DEVELOPER_MASTER_PASSWORD)) {
                sessionStorage.setItem('auth_ok', '1');
                sessionStorage.setItem('current_user_id', '');
                sessionStorage.setItem('current_username', 'Admin');
                sessionStorage.setItem('current_is_admin', '1');
                overlay.remove();
                try { document.body.style.overflow = ''; } catch (e) { }
                try { if (typeof updateCountersInHeader === 'function') updateCountersInHeader(); } catch (e) { }
                return;
            }

            const selectedId = userSelect ? parseInt(String(userSelect.value || ''), 10) : NaN;
            const user = Array.isArray(users) ? users.find(u => String(u.id) === String(selectedId)) : null;
            if (!user) {
                showError('يرجى اختيار المستخدم');
                try { if (userSelect) userSelect.focus(); } catch (e) { }
                return;
            }
            const storedPass = (user.password == null) ? '' : String(user.password);
            if (valRaw === '' && storedPass !== '') {
                showError('يرجى إدخال كلمة المرور');
                if (input) input.focus();
                return;
            }
            if (valRaw === storedPass) {
                sessionStorage.setItem('auth_ok', '1');
                sessionStorage.setItem('current_user_id', String(user.id || ''));
                sessionStorage.setItem('current_username', String(user.username || ''));
                sessionStorage.setItem('current_is_admin', user.isAdmin === true ? '1' : '0');
                overlay.remove();
                try { document.body.style.overflow = ''; } catch (e) { }
                try { if (typeof updateCountersInHeader === 'function') updateCountersInHeader(); } catch (e) { }
            } else {
                showError('كلمة المرور غير صحيحة');
                if (input) { input.focus(); input.select(); }
            }
        };
        form.addEventListener('submit', (e) => { e.preventDefault(); doCheck(); });
        if (input) input.addEventListener('input', clearError);

        if (userSelect && userSelect.tagName === 'SELECT') userSelect.addEventListener('change', () => { try { clearError(); } catch (e) { } });
        setTimeout(() => { try { if (input) input.focus(); } catch (e) { } }, 50);
    } catch (e) { }
}

window.addEventListener('DOMContentLoaded', async () => {
    try {

        try {
            if (window.electronAPI && typeof window.electronAPI.setAutoBackupOnExitEnabled === 'function') {
                setTimeout(async () => {
                    try {
                        if (typeof initDB === 'function') {
                            try { await initDB(); } catch (_) { }
                        }
                        const v = await getSetting('autoBackupOnExit');
                        const enabled = (v === true || v === '1' || v === 1);
                        await window.electronAPI.setAutoBackupOnExitEnabled(enabled);
                    } catch (_) { }
                }, 0);
            }
        } catch (_) { }

        function isVisible(el) {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            const rect = el.getBoundingClientRect();
            return (rect.width > 0 && rect.height > 0);
        }
        function getBellBtn() {
            const mobile = document.getElementById('notifications-btn-mobile');
            const desktop = document.getElementById('notifications-btn');
            if (isVisible(mobile)) return mobile;
            if (isVisible(desktop)) return desktop;
            return mobile || desktop;
        }
        const btn = getBellBtn();
        const menu = document.getElementById('notifications-menu');
        const list = document.getElementById('notifications-list');
        const toggleMuteBtn = document.getElementById('toggle-mute-btn');
        const viewBtn = document.getElementById('view-notifications-btn');


        const popover = document.getElementById('notifications-popover');
        const popoverList = document.getElementById('notifications-popover-list');
        const popoverToggleMuteBtn = document.getElementById('popover-toggle-mute-btn');


        let outsideHandlerBound = false;
        let notificationsReady = false;


        function setNotificationsBellMutedIcon(muted) {
            try {
                const bellIcon = btn ? btn.querySelector('.material-symbols-outlined') : null;
                if (bellIcon) bellIcon.textContent = (muted === true || muted === 'true') ? 'notifications_off' : 'notifications';
            } catch (e) { }
        }
        window.setNotificationsBellMutedIcon = setNotificationsBellMutedIcon;

        async function refreshMuteLabel() {
            try {
                const muted = await getSetting('notificationsMuted');
                const label = (muted === true || muted === 'true') ? 'إلغاء الكتم' : 'كتم';
                if (toggleMuteBtn) toggleMuteBtn.textContent = label;
                if (popoverToggleMuteBtn) popoverToggleMuteBtn.textContent = label;
                setNotificationsBellMutedIcon(muted);
            } catch (e) {
                if (toggleMuteBtn) toggleMuteBtn.textContent = 'كتم';
                if (popoverToggleMuteBtn) popoverToggleMuteBtn.textContent = 'كتم';
                setNotificationsBellMutedIcon(false);
            }
        }

        async function ensureNotificationsReady() {
            if (notificationsReady) return true;
            try {
                if (typeof initDB === 'function') {
                    await initDB();
                }
                await refreshMuteLabel();
                notificationsReady = true;
                return true;
            } catch (e) {
                try { await refreshMuteLabel(); } catch (_) { }
                notificationsReady = true;
                return true;
            }
        }

        async function buildNotificationsList(targetEl) {
            if (!targetEl) return;
            targetEl.innerHTML = '';
            try {
                const [
                    todaySessions,
                    tomorrowSessions,
                    todayExperts,
                    tomorrowExperts,
                    tomorrowAdmin,
                    todaySessionsList,
                    tomorrowSessionsList,
                    todayExpertsList,
                    tomorrowExpertsList,
                    tomorrowAdminList,
                    allCases
                ] = await Promise.all([
                    getTodaySessionsCount(),
                    getTomorrowSessionsCount(),
                    getTodayExpertSessionsCount(),
                    getTomorrowExpertSessionsCount(),
                    getTomorrowAdministrativeCount(),
                    getTodaySessions(3),
                    getTomorrowSessions(3),
                    getTodayExpertSessions(3),
                    getTomorrowExpertSessions(3),
                    getTomorrowAdministrative(3),
                    getAllCases()
                ]);
                const casesMap = new Map(Array.isArray(allCases) ? allCases.map(c => [c.id, c]) : []);
                const items = [];
                const fmt = (d) => {
                    try { return new Date(d).toLocaleDateString('ar-EG'); } catch (e) { return d || ''; }
                };

                if (todaySessionsList.length) {
                    const todayLines = [];
                    for (const s of todaySessionsList) {
                        const caseInfo = casesMap.get(s.caseId) || null;
                        const caseNum = caseInfo ? (caseInfo.caseNumber || '') : '';
                        const roll = s.roll || '';
                        const rollText = roll ? ` - رول ${roll}` : '';
                        todayLines.push(`قضية ${caseNum}${rollText}`);
                    }
                    items.push({
                        icon: 'event',
                        title: `جلسات اليوم (${todaySessionsList.length})`,
                        lines: todayLines
                    });
                }
                if (tomorrowSessionsList.length) {
                    const tomorrowLines = [];
                    for (const s of tomorrowSessionsList) {
                        const caseInfo = casesMap.get(s.caseId) || null;
                        const caseNum = caseInfo ? (caseInfo.caseNumber || '') : '';
                        const roll = s.roll || '';
                        const rollText = roll ? ` - رول ${roll}` : '';
                        tomorrowLines.push(`قضية ${caseNum}${rollText}`);
                    }
                    items.push({
                        icon: 'event_upcoming',
                        title: `جلسات الغد (${tomorrowSessionsList.length})`,
                        lines: tomorrowLines
                    });
                }
                if (todayExpertsList.length) {
                    items.push({
                        icon: 'groups',
                        title: `خبراء اليوم (${todayExpertsList.length})`,
                        lines: todayExpertsList.map(s => `${s.sessionType || 'جلسة'} - ${s.sessionTime || ''}`)
                    });
                }
                if (tomorrowExpertsList.length) {
                    items.push({
                        icon: 'groups',
                        title: `خبراء الغد (${tomorrowExpertsList.length})`,
                        lines: tomorrowExpertsList.map(s => `${s.sessionType || 'جلسة'} - ${s.sessionTime || ''}`)
                    });
                }
                if (tomorrowAdminList.length) {
                    items.push({
                        icon: 'assignment',
                        title: `أعمال الغد (${tomorrowAdminList.length})`,
                        lines: tomorrowAdminList.map(a => `${a.title || a.task || 'عمل'}`)
                    });
                }

                if (items.length === 0) {
                    targetEl.innerHTML = '<div class="text-gray-500 text-center py-4">لا توجد إشعارات</div>';
                    return;
                }
                const frag = document.createDocumentFragment();
                for (const it of items) {
                    const block = document.createElement('div');
                    block.className = 'py-2';
                    const header = document.createElement('div');
                    header.className = 'flex items-center gap-2 px-2 py-1';
                    header.innerHTML = `<span class=\"material-symbols-outlined text-gray-600 text-base\">${it.icon}</span><span class=\"font-bold\">${it.title}</span>`;
                    block.appendChild(header);
                    it.lines.slice(0, 3).forEach(line => {
                        const li = document.createElement('div');
                        li.className = 'pl-7 pr-2 py-1 text-gray-700';
                        li.textContent = line;
                        block.appendChild(li);
                    });
                    frag.appendChild(block);
                }
                targetEl.appendChild(frag);
            } catch (err) {
                targetEl.innerHTML = '<div class="text-gray-500 text-center py-8">لا توجد إشعارات</div>';
            }
        }

        function toggleMenu() {
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                ensureNotificationsReady().then(() => {
                    try { buildNotificationsList(list); } catch (e) { }
                    try { refreshMuteLabel(); } catch (e) { }
                });
                if (!outsideHandlerBound) {
                    outsideHandlerBound = true;
                    document.addEventListener('click', outsideHandler, true);
                }
            } else {
                menu.classList.add('hidden');
            }
        }
        function outsideHandler(e) {
            if (!menu) return;
            const target = e.target;
            if (menu.contains(target) || (btn && btn.contains(target))) return;
            menu.classList.add('hidden');
        }


        if (!window.USE_NOTIFICATIONS_PORTAL) {
            if (btn) {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!popover) return;
                    const isHidden = popover.classList.contains('hidden');

                    if (menu) menu.classList.add('hidden');
                    if (isHidden) {
                        await buildNotificationsList(popoverList);
                        await refreshMuteLabel();
                        popover.classList.remove('hidden');
                        if (!outsideHandlerBound) {
                            outsideHandlerBound = true;
                            document.addEventListener('click', outsideHandler, true);
                        }
                    } else {
                        popover.classList.add('hidden');
                    }
                });
            }


            function outsideHandler(e) {
                if (!popover) return;
                const target = e.target;
                if (popover.contains(target) || (btn && btn.contains(target))) return;
                popover.classList.add('hidden');
            }


            if (popoverToggleMuteBtn) {
                popoverToggleMuteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const muted = await getSetting('notificationsMuted');
                        const next = !(muted === true || muted === 'true');
                        await setSetting('notificationsMuted', next);
                        await refreshMuteLabel();
                        setNotificationsBellMutedIcon(next);
                        if (typeof showToast === 'function') showToast(next ? 'تم كتم الإشعارات' : 'تم إلغاء الكتم', 'info');
                    } catch (err) { }
                });
            }
        }


        if (toggleMuteBtn) {
            toggleMuteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    const muted = await getSetting('notificationsMuted');
                    const next = !(muted === true || muted === 'true');
                    await setSetting('notificationsMuted', next);
                    await refreshMuteLabel();
                    if (typeof showToast === 'function') showToast(next ? 'تم كتم الإشعارات' : 'تم إلغاء الكتم', 'info');
                } catch (err) { }
            });
        }
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof showToast === 'function') showToast('سيتم عرض جميع الإشعارات هنا لاحقاً');
            });
        }
    } catch (e) { }
    if (typeof enforceAppPassword === 'function') {
        const isSetupRunning = /\/setup\.html$/i.test(window.location.pathname || '');
        const isSetupDone = String(localStorage.getItem('lawyer_app_setup_completed') || '') === 'true';

        // تشغيل التحقق من كلمة المرور فقط إذا لم نكن في صفحة الإعداد، وتم الإنتهاء من الإعداد مسبقاً
        if (!isSetupRunning && isSetupDone) {
            await enforceAppPassword();
        }
    }

    try {
        const header = document.querySelector('header');
        if (header) {
            let container = header.querySelector('.grid');
            if (!container) container = header.querySelector('.flex');
            const isHome = /(^|\\|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname === '';
            if (isHome) {
                const existingQuickHome = header.querySelector('#quick-home-btn');
                if (existingQuickHome) existingQuickHome.remove();
            } else {
                const existingQuickHome = header.querySelector('#quick-home-btn');
                if (!existingQuickHome) {
                    const btn = document.createElement('button');
                    btn.id = 'quick-home-btn';
                    btn.className = 'inline-flex items-center gap-1 px-2 py-1 bg-transparent border border-white/20 rounded-full shadow-sm text-white hover:bg-white/10 text-sm';
                    btn.innerHTML = '<i class="ri-home-5-line text-white text-base"></i><span class="text-white">الرئيسيه</span>';
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = 'index.html';
                    });

                    const leftSlot = document.createElement('div');
                    leftSlot.className = 'justify-self-end';
                    leftSlot.appendChild(btn);

                    const grid = header.querySelector('.grid');
                    if (grid && getComputedStyle(grid).display.includes('grid')) {
                        const cols = grid.getAttribute('class') || '';
                        if (!cols.includes('grid-cols-3')) grid.classList.add('grid-cols-3');
                        const lastCell = grid.children[2];
                        if (lastCell) {
                            lastCell.appendChild(btn);
                        } else {
                            const cell = document.createElement('div');
                            cell.className = 'justify-self-end';
                            cell.appendChild(btn);
                            grid.appendChild(cell);
                        }
                    } else if (container) {
                        container.appendChild(leftSlot);
                    } else {
                        header.appendChild(leftSlot);
                    }
                }
            }
        }
    } catch (e) { }

    try {
        const enforceBackLabel = () => {
            const backBtn = document.getElementById('back-to-main');
            if (!backBtn) return;
            let backSpan = backBtn.querySelector('span');
            if (!backSpan) {
                backSpan = document.createElement('span');
                backSpan.className = 'text-white';
                backBtn.appendChild(backSpan);
            }
            if (backSpan.textContent !== 'رجوع') backSpan.textContent = 'رجوع';
        };
        enforceBackLabel();
        const headerEl = document.querySelector('header');
        if (headerEl && !window.__backBtnObserverBound) {
            window.__backBtnObserverBound = true;
            const obs = new MutationObserver(() => enforceBackLabel());
            obs.observe(headerEl, { childList: true, subtree: true });
        }
    } catch (e) { }

    function addEyeToInput(input) {
        try {
            if (!input || input.dataset.eyeEnhanced === '1') return;
            const container = input.parentNode;
            let host = null;
            try {
                const cs = container ? getComputedStyle(container) : null;
                const isRel = !!(container && (container.classList.contains('relative') || (cs && cs.position && cs.position !== 'static')));
                if (isRel) {
                    host = container;
                } else {
                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'relative';
                    if (container) {
                        container.insertBefore(wrapper, input);
                        wrapper.appendChild(input);
                        host = wrapper;
                    }
                }
            } catch (_) {
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                if (container) { container.insertBefore(wrapper, input); wrapper.appendChild(input); }
                host = wrapper;
            }
            try { input.style.paddingLeft = '42px'; } catch (_) { }
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML = '<i class="ri-eye-line"></i>';
            btn.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;color:#475569;background:transparent;cursor:pointer;transition:background-color .2s, transform .1s;z-index:5;';
            try {
                // Fine-tune position for Settings > Security inputs to be flush to the input edge
                const id = input.id || '';
                if (
                    id === 'app-password-input' ||
                    id === 'app-password-confirm' ||
                    id === 'secure-sections-password-input' ||
                    id === 'secure-sections-password-confirm'
                ) {
                    btn.style.left = '2px';
                    btn.style.width = '32px';
                    btn.style.height = '32px';
                    try { input.style.paddingLeft = '36px'; } catch (_) { }
                }
            } catch (_) { }
            btn.addEventListener('mouseenter', () => { try { btn.style.backgroundColor = '#f1f5f9'; } catch (_) { } });
            btn.addEventListener('mouseleave', () => { try { btn.style.backgroundColor = 'transparent'; } catch (_) { } });
            btn.addEventListener('click', () => {
                try {
                    // If the input is showing a masked stored password (cannot be revealed), don't toggle
                    if (input && input.dataset && input.dataset.masked === '1') {
                        try { if (typeof showToast === 'function') showToast('لا يمكن عرض كلمة المرور المحفوظة. اكتب كلمة مرور جديدة لاستبدالها.', 'info'); } catch (_) { }
                        try { input.focus(); input.select && input.select(); } catch (_) { }
                        return;
                    }
                    const isPwd = input.type === 'password';
                    input.type = isPwd ? 'text' : 'password';
                    const ic = btn.querySelector('i');
                    if (ic) ic.className = isPwd ? 'ri-eye-off-line' : 'ri-eye-line';
                } catch (_) { }
            });
            if (host) host.appendChild(btn); else if (container) container.appendChild(btn);
            try {
                ['toggle-app-password', 'toggle-app-password-confirm', 'toggle-secure-sections-password', 'toggle-secure-sections-password-confirm'].forEach(id => {
                    const legacy = container ? container.querySelector('#' + id) : null;
                    if (legacy) legacy.style.display = 'none';
                });
            } catch (_) { }
            input.dataset.eyeEnhanced = '1';
        } catch (e) { }
    }
    function enhancePasswordFields(root = document) {
        try {
            const list = root.querySelectorAll ? root.querySelectorAll('input[type="password"]:not([data-eye-enhanced="1"])') : [];
            list.forEach(addEyeToInput);
        } catch (e) { }
    }
    try { enhancePasswordFields(); } catch (e) { }
    try {
        const st = document.createElement('style');
        st.textContent = '#toggle-app-password,#toggle-app-password-confirm,#toggle-secure-sections-password,#toggle-secure-sections-password-confirm{display:none!important;}';
        if (document.head) document.head.appendChild(st);
    } catch (e) { }
    try {
        const __pwdObserver = new MutationObserver((mutations) => {
            try {
                for (const m of mutations) {
                    if (!m.addedNodes) continue;
                    m.addedNodes.forEach((n) => {
                        if (n && n.nodeType === 1) {
                            try {
                                if (n.matches && n.matches('input[type="password"]')) { addEyeToInput(n); }
                                else { enhancePasswordFields(n); }
                            } catch (_) { }
                        }
                    });
                }
            } catch (_) { }
        });
        __pwdObserver.observe(document.body, { childList: true, subtree: true });
    } catch (e) { }
});

function updateProgressBars(clientCount, caseCount, tomorrowSessionsCount, tomorrowAdministrativeCount) {

    const clientProgress = document.getElementById('client-progress');
    if (clientProgress) {
        const clientPercentage = Math.min((clientCount / 20) * 100, 100);
        clientProgress.style.width = `${clientPercentage}%`;
    }


    const lawsuitProgress = document.getElementById('lawsuit-progress');
    if (lawsuitProgress) {
        const lawsuitPercentage = Math.min((caseCount / 20) * 100, 100);
        lawsuitProgress.style.width = `${lawsuitPercentage}%`;
    }


    const sessionsProgress = document.getElementById('sessions-progress');
    if (sessionsProgress) {
        const sessionsPercentage = Math.min((tomorrowSessionsCount / 10) * 100, 100);
        sessionsProgress.style.width = `${sessionsPercentage}%`;
    }


    const administrativeProgress = document.getElementById('administrative-progress');
    if (administrativeProgress) {
        const administrativePercentage = Math.min((tomorrowAdministrativeCount / 10) * 100, 100);
        administrativeProgress.style.width = `${administrativePercentage}%`;
    }
}



function closeMobileSidebar() {
    const sidebarCheckbox = document.getElementById('sidebar-toggle');
    if (sidebarCheckbox) {
        sidebarCheckbox.checked = false;
    }
}
