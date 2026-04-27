let currentStep = 0;
let wizardState = {
    officeName: '',
    chosenPath: '',
    loadDemoData: false
};
let steps = [];

function isDesktopApp(){
    try { return !!(window && window.electronAPI); } catch (e) { return false; }
}

function isStandaloneMode(){
    try {
        return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone);
    } catch (e) {
        return false;
    }
}

function isBrowserMode(){
    try { return !isDesktopApp() && !isStandaloneMode(); } catch (e) { return false; }
}

function wasPwaInstalledFlag(){
    try { return String(localStorage.getItem('pwa_installed') || '') === '1'; } catch (e) { return false; }
}

function isIOSDevice(){
    try {
        const ua = String((navigator && navigator.userAgent) || '');
        const uaLc = ua.toLowerCase();
        if (/iphone|ipad|ipod/.test(uaLc)) return true;

        // iPadOS/iOS "Request Desktop Website" can report as Macintosh.
        // Use touch capability as the differentiator.
        const maxTouch = Number((navigator && navigator.maxTouchPoints) || 0) || 0;
        const platform = String((navigator && navigator.platform) || '').toLowerCase();
        if (platform === 'macintel' && maxTouch > 1) return true;
        if (uaLc.indexOf('macintosh') >= 0 && maxTouch > 1) return true;
        return false;
    } catch (e) {
        return false;
    }
}

function buildSteps(){
    const s = [];
    if (isBrowserMode()) {
        s.push({ id: 'install_only', required: false });
        steps = s;
        currentStep = 0;
        return;
    }

    s.push({ id: 'office', required: true });
    if (isDesktopApp()) s.push({ id: 'storage', required: false });
    s.push({ id: 'demo', required: false });
    s.push({ id: 'done', required: false });
    steps = s;
    if (currentStep >= steps.length) currentStep = steps.length - 1;
    if (currentStep < 0) currentStep = 0;
}

function $(id){ return document.getElementById(id); }

function setIndicators(){
    const c = $('steps-indicator');
    if (!c) return;
    c.innerHTML = '';
    steps.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'step-dot' + (i === currentStep ? ' active' : '');
        c.appendChild(d);
    });
}

function render(){
    setIndicators();
    const cont = $('step-container');
    const prev = $('prev-btn');
    const next = $('next-btn');
    const skip = $('skip-btn');
    if (!cont || !prev || !next || !skip) return;
    const nav = document.querySelector('#setup-wizard .wizard-nav');
    const indicator = $('steps-indicator');
    
    
    skip.classList.add('hidden');
    
    
    const isPwaInstalled = (!isDesktopApp() && isStandaloneMode());
    next.textContent = currentStep === steps.length - 1 ? (isPwaInstalled ? 'موافق واستمرار' : 'إنهاء') : 'التالي';

    const s = steps[currentStep].id;
    if (s === 'install_only') cont.innerHTML = getInstallOnlyHtml();
    else if (s === 'office') cont.innerHTML = getOfficeHtml();
	else if (s === 'storage') cont.innerHTML = getStorageHtml();
    else if (s === 'demo') cont.innerHTML = getDemoHtml();
    else if (s === 'done') cont.innerHTML = getDoneHtml();

    bindStepHandlers(s);

    if (s === 'done') {
        try {
            window.dispatchEvent(new CustomEvent('lawyer:setup:last-step'));
        } catch (e) {}
    }

    
    if (s === 'install_only') {
        try { if (nav) nav.style.display = 'none'; } catch (e) {}
        try { if (indicator) indicator.style.display = 'none'; } catch (e) {}
        try { prev.classList.add('hidden'); } catch (e) {}
        try { skip.classList.add('hidden'); } catch (e) {}
        try { next.classList.add('hidden'); } catch (e) {}
        return;
    }

    try { if (nav) nav.style.display = ''; } catch (e) {}
    try { if (indicator) indicator.style.display = ''; } catch (e) {}
    try { next.classList.remove('hidden'); } catch (e) {}

    prev.classList.toggle('hidden', currentStep === 0);
    prev.disabled = currentStep === 0;
}

function getOfficeHtml(){
    return `
      <div>
        <h2 class="text-2xl font-extrabold mb-2">مرحباً بك!</h2>
        <p class="text-white/80 mb-6">يرجى إدخال اسم المكتب مختصر لانه يستخدم فى معرفه مصدر البيانات بين اجهزتك وهكذا</p>
        <label class="block text-sm mb-2">اسم المكتب</label>
        <input id="office-name-input" class="w-full rounded-xl p-3 bg-white text-black" placeholder="المستشار رجائى عطية" />
        <p id="office-name-error-msg" class="text-red-300 text-sm mt-1 hidden">يرجى إدخال اسم المكتب</p>
      </div>
    `;
}

function getIOSInstallGuideHtml(){
    return `
      <div class="space-y-3">
        <div class="rounded-2xl border border-white/15 bg-white/10 p-4">
          <div class="text-sm font-bold mb-3">اتبع هذه الخطوات داخل Safari:</div>
          <div class="space-y-3 text-sm text-white/90">
            <div class="rounded-2xl bg-white/10 p-4 text-center">
              <div style="width:68px;height:68px;margin:0 auto 10px;border-radius:18px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;">
                  <path d="M12 16V4"></path>
                  <path d="M8 8l4-4 4 4"></path>
                  <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"></path>
                </svg>
              </div>
              <div class="font-bold mb-1">1) زر المشاركة</div>
              <div class="text-white/75">ابحث عن زر المشاركة في أسفل Safari ثم اضغط عليه.</div>
            </div>
            <div class="rounded-2xl bg-white/10 p-4 text-center">
              <div style="width:68px;height:68px;margin:0 auto 10px;border-radius:18px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;">
                  <rect x="4" y="4" width="16" height="16" rx="3"></rect>
                  <path d="M12 8v8"></path>
                  <path d="M8 12h8"></path>
                </svg>
              </div>
              <div class="font-bold mb-1">2) إضافة إلى الشاشة الرئيسية</div>
              <div class="text-white/75">مرر داخل القائمة حتى يظهر لك هذا الخيار ثم اضغط عليه.</div>
            </div>
            <div class="rounded-2xl bg-white/10 p-4 text-center">
              <div style="width:68px;height:68px;margin:0 auto 10px;border-radius:18px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;">
                  <rect x="5" y="5" width="14" height="14" rx="3"></rect>
                  <path d="M9 12h6"></path>
                </svg>
              </div>
              <div class="font-bold mb-1">3) زر إضافة</div>
              <div class="text-white/75">اضغط إضافة ليظهر التطبيق كأيقونة على الشاشة الرئيسية.</div>
            </div>
          </div>
        </div>
      </div>
    `;
}

function getInstallOnlyHtml(){
    const ios = isIOSDevice();
    const title = ios ? 'إنشاء أيقونة التطبيق على iPhone' : 'إنشاء أيقونة التطبيق';
    const hint = ios
        ? 'ستظل هذه التعليمات ظاهرة دائمًا داخل Safari حتى تفتح التطبيق من الأيقونة.'
        : 'قم بالضغط على زر إنشاء أيقونة التطبيق لإضافته على هاتفك ثم قم بإغلاق هذه الصفحة وافتحه من الشاشة الرئيسية.';
    var isInst = false;
    try { isInst = localStorage.getItem('pwa_installed') === '1'; } catch(e){}
    const btnText = isInst ? 'إعادة إنشاء الأيقونة' : 'إنشاء أيقونة التطبيق';
    const button = ios
        ? getIOSInstallGuideHtml()
        : `<button id="setup-install-only-btn" class="btn-primary px-6 py-3 rounded-xl w-full">${btnText}</button>`;
    return `
      <div>
        <h2 class="text-2xl font-extrabold mb-2">${title}</h2>
        <p class="text-white/80 mb-6">${hint}</p>
        <div class="space-y-3">
          ${button}
          <div id="setup-install-only-status" class="text-sm text-white/80"></div>
        </div>
      </div>
    `;
}

function getOpenInstalledHtml(){
    return `
      <div>
        <h2 class="text-2xl font-extrabold mb-2">افتح من التطبيق المثبت</h2>
        <p class="text-white/80 mb-6">هذه الصفحة لا تُكمل الإعداد من المتصفح. افتح التطبيق من الأيقونة على الشاشة الرئيسية لإكمال الإعداد.</p>
      </div>
    `;
}

function getStorageHtml(){
    return `
      <div>
        <h2 class="text-2xl font-extrabold mb-2">مكان حفظ البيانات</h2>
          <p class="text-white/80 mb-6">حدد قسم امن على جهازك لتخزين مجلد المحامى الرقمى الذى يتم تخزين بداخله اى بيانات يتم حفظها او ارفاقها او تصديرها مثل بيانات الموكلين والكتب القانونيه والتقارير والنسخ الاحتياطيه وغيرها</p>
        <div class="flex items-center gap-2 flex-wrap">
          <button id="auto-path-btn" class="btn-secondary px-4 py-3 rounded-xl">اختيار ذكى</button>
          <span id="chosen-path" class="text-sm text-white/80 truncate"></span>
        </div>
      </div>
    `;
}



function getDemoHtml(){
    return `
      <div>
        <h2 class="text-2xl font-extrabold mb-2">البيانات الوهمية </h2>
        <p class="text-white/80 mb-6">اذا قمت بتفعيل هذا الخيار سيدخل البرنامج بيانات وهمية  لكى تختبره وتفهم طريقة عمله بدلا من بذل مجهود لادخالها بنفسك .</p>
        <div class="text-white">
          <div class="flex items-center justify-between gap-3">
            <label for="load-demo-data" class="text-base">البيانات الوهمية </label>
            <div class="flex items-center gap-3">
              <span id="demo-switch-state" class="text-sm font-bold">معطلة</span>
              <div class="relative">
              <input id="load-demo-data" type="checkbox" class="sr-only">
              <div id="demo-switch" class="relative w-12 h-7 rounded-full bg-gray-400 transition-colors">
                <span id="demo-switch-knob" class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"></span>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}

function getInstallHtml(){
        if (isIOSDevice()) {
            return `
              <div>
                <h2 class="text-2xl font-extrabold mb-2">إنشاء أيقونة التطبيق على iPhone</h2>
                <p class="text-white/80 mb-6">ستظل هذه التعليمات ظاهرة دائمًا داخل Safari حتى تفتح التطبيق من الأيقونة.</p>
                <div class="space-y-3">
                  ${getIOSInstallGuideHtml()}
                  <div id="setup-install-status" class="text-sm text-white/80"></div>
                  <div id="setup-install-final" class="text-sm font-bold text-green-200" style="display:none;"></div>
                  <div id="setup-install-help" class="text-sm text-white/80" style="display:none;"></div>
                </div>
              </div>
            `;
        }
        var isInst = false;
        try { isInst = localStorage.getItem('pwa_installed') === '1'; } catch(e){}
        const btnText = isInst ? 'إعادة إنشاء الأيقونة' : 'إنشاء أيقونة التطبيق';
    return `
      <div>
        <h2 class="text-2xl font-extrabold mb-2">إنشاء أيقونة التطبيق</h2>
        <p class="text-white/80 mb-6">إنشاء أيقونة التطبيق على جهازك الحالي للعمل بدون إنترنت وبسرعة أكبر</p>
        <div class="space-y-3">
          <button id="setup-install-btn" class="btn-primary px-6 py-3 rounded-xl w-full">${btnText}</button>
          <div id="setup-install-status" class="text-sm text-white/80"></div>
          <div id="setup-install-final" class="text-sm font-bold text-green-200" style="display:none;"></div>
          <div id="setup-install-help" class="text-sm text-white/80" style="display:none;">
            لو الزر مش شغال: افتح قائمة المتصفح واختر \"إضافة للشاشة الرئيسية\" أو \"تثبيت التطبيق\".
          </div>
        </div>
      </div>
    `;
}

function getDoneHtml(){
    const isPwaInstalled = (!isDesktopApp() && isStandaloneMode());
    const finishText = isPwaInstalled ? 'موافق واستمرار' : 'إنهاء';
    return `
      <div class="text-center">
        <h2 class="text-3xl font-extrabold mb-2">تم الإعداد بنجاح</h2>
        <p class="text-white/80">مرحباً بك في التطبيق! اضغط "${finishText}" للانتقال إلى الشاشة الرئيسية.</p>
        ${isPwaInstalled ? `
          <div class="mt-6">
            <button id="setup-terms-btn" type="button" class="btn-secondary px-6 py-3 rounded-xl w-full">قراءة الشروط والأحكام</button>
          </div>

          <div id="setup-terms-overlay" class="fixed inset-0 z-[99999] hidden" style="background:rgba(0,0,0,0.65);padding:16px;direction:rtl;">
            <div class="bg-white rounded-2xl w-full max-w-2xl mx-auto p-4 sm:p-6" style="max-height:90vh;overflow:hidden;">
              <div class="flex items-center justify-between gap-3">
                <div class="text-lg font-extrabold text-gray-900">الشروط والأحكام</div>
                <button id="setup-terms-close" type="button" class="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold">إغلاق</button>
              </div>
              <div id="setup-terms-body" class="mt-4 text-sm text-gray-800 whitespace-pre-wrap border border-gray-200 rounded-xl bg-gray-50 p-3" style="max-height:60vh;overflow:auto;">جاري التحميل...</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
}

function bindStepHandlers(stepId){
    if (stepId === 'install_only') {
        const btn = document.getElementById('setup-install-only-btn');
        const status = document.getElementById('setup-install-only-status');

        const notAvailableMsg = 'التثبيت غير متاح الآن. برجاء إعادة تحميل الصفحة لتفعيل زر "تثبيت الآن".';
        const showInstallPopup = (message) => {
            try {
                if (typeof showToast === 'function') {
                    try { showToast(message || notAvailableMsg, 'error'); } catch (_) { }
                    return;
                }

                if (document.getElementById('setup-install-popup-overlay')) return;

                const overlay = document.createElement('div');
                overlay.id = 'setup-install-popup-overlay';
                overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl;';

                const card = document.createElement('div');
                card.style.cssText = 'width:min(560px, 100%);background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(15,23,42,.25);border:1px solid rgba(15,23,42,.12);padding:14px 14px 12px;';
                card.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;direction:ltr;">
                      <div style="font-weight:900;color:#0f172a;font-size:15px;flex:1;text-align:center;">تنبيه</div>
                      <button type="button" id="setup-install-popup-close" style="width:34px;height:34px;border-radius:10px;border:1px solid rgba(15,23,42,.12);background:#fff;color:#0f172a;font-size:22px;font-weight:900;cursor:pointer;">×</button>
                    </div>
                    <div style="color:#334155;font-size:13px;line-height:1.7;margin-bottom:12px;white-space:pre-wrap;">${String(message || notAvailableMsg)}</div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start;">
                      <button type="button" id="setup-install-popup-reload" style="background:#f59e0b;color:#111827;border:0;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer;">إعادة تحميل الصفحة</button>
                      <button type="button" id="setup-install-popup-ok" style="background:#0ea5e9;color:#fff;border:0;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer;">حسنًا</button>
                    </div>
                `;

                overlay.appendChild(card);
                (document.body || document.documentElement).appendChild(overlay);

                const close = () => { try { overlay.remove(); } catch (_) { } };
                overlay.addEventListener('click', (e) => { try { if (e && e.target === overlay) close(); } catch (_) { } });
                card.querySelector('#setup-install-popup-close')?.addEventListener('click', close);
                card.querySelector('#setup-install-popup-ok')?.addEventListener('click', close);
                card.querySelector('#setup-install-popup-reload')?.addEventListener('click', () => {
                    try { close(); } catch (_) { }
                    try { location.reload(); } catch (_) { }
                });
            } catch (_) { }
        };

        const setBtnVisual = (canInstall) => {
            try {
                if (!btn) return;
                btn.style.opacity = '';
                btn.style.filter = '';
                btn.style.cursor = 'pointer';
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            } catch (_) { }
        };

        const refresh = () => {
            try {
                if (isIOSDevice()) {
                    const running = !!(window.pwaAPI && typeof window.pwaAPI.isPrecacheRunning === 'function' && window.pwaAPI.isPrecacheRunning());
                    const ready = !!(window.pwaAPI && typeof window.pwaAPI.isOfflineReady === 'function' && window.pwaAPI.isOfflineReady());
                    if (status) status.textContent = running
                        ? 'جارٍ تنزيل ملفات التطبيق الآن. بعد الانتهاء اتبع الخطوات الموضحة أعلاه لإنشاء الأيقونة.'
                        : (ready
                            ? 'تم تنزيل ملفات التطبيق. اتبع الخطوات الموضحة أعلاه لإنشاء أيقونة التطبيق على الشاشة الرئيسية.'
                            : 'جارٍ تجهيز التطبيق الآن. انتظر قليلًا ثم اتبع الخطوات الموضحة أعلاه.');
                    return;
                }
                const can = !!(window.pwaAPI && typeof window.pwaAPI.canPromptInstall === 'function' && window.pwaAPI.canPromptInstall());
                setBtnVisual(true);
                if (status) status.textContent = can ? 'تم تنزيل ملفات التطبيق. قم بالضغط على زر إنشاء أيقونة التطبيق لإضافته على الشاشة الرئيسية.' : '';
            } catch (e) { }
        };

        refresh();
        setTimeout(refresh, 300);
        setTimeout(refresh, 1200);

        window.addEventListener('pwa:appinstalled', () => {
            try { localStorage.setItem('pwa_installed', '1'); } catch (e) { }
        });

        window.addEventListener('pwa:precache:progress', (ev) => {
            try {
                if (!isIOSDevice()) return;
                const detail = (ev && ev.detail) ? ev.detail : {};
                const done = Number(detail.done || 0);
                const total = Number(detail.total || 0);
                const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
                if (status) status.textContent = 'جارٍ تنزيل ملفات التطبيق: ' + done + ' / ' + total + ' (' + pct + '%). بعد الانتهاء اتبع الخطوات الموضحة أعلاه.';
            } catch (_) { }
        });

        window.addEventListener('pwa:precache:complete', (ev) => {
            try {
                if (!isIOSDevice()) return;
                const detail = (ev && ev.detail) ? ev.detail : {};
                const failed = Array.isArray(detail.failed) ? detail.failed : [];
                if (status) status.textContent = failed.length > 0
                    ? 'تعذر تنزيل بعض الملفات. تأكد من ثبات الإنترنت وانتظر إعادة المحاولة التلقائية.'
                    : 'تم تنزيل ملفات التطبيق. اتبع الخطوات الموضحة أعلاه لإنشاء أيقونة التطبيق على الشاشة الرئيسية.';
            } catch (_) { }
        });

        if (btn) {
            btn.addEventListener('click', function () {
                try {
                    btn.disabled = true;
                    btn.style.opacity = '0.6';
                    btn.style.cursor = 'not-allowed';

                    var releaseBtn = function () {
                        try {
                            btn.disabled = false;
                            btn.style.opacity = '';
                            btn.style.cursor = 'pointer';
                        } catch (_) {}
                    };

                    if (window.pwaAPI && typeof window.pwaAPI.isPrecacheRunning === 'function' && window.pwaAPI.isPrecacheRunning()) {
                        releaseBtn();
                        if (status) status.textContent = 'جاري تجهيز التطبيق تلقائياً. انتظر اكتمال التحميل ثم اضغط تثبيت.';
                        return;
                    }

                    releaseBtn();
                    var promise = (window.pwaAPI && typeof window.pwaAPI.promptInstall === 'function') ? window.pwaAPI.promptInstall() : null;
                    if (!promise || typeof promise.then !== 'function') {
                        if (isIOSDevice()) {
                            showInstallPopup('على iPhone: اضغط زر المشاركة (Share) ثم "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).');
                            if (status) status.textContent = 'اتبع الخطوات اللي فوق لإضافة الأيقونة.';
                        } else {
                            if (status) status.textContent = 'نافذة إنشاء الأيقونة غير متاحة حالياً من المتصفح.';
                        }
                        return;
                    }
                    if (status) status.textContent = 'إذا ظهرت نافذة من المتصفح، فوافق عليها لإنشاء أيقونة التطبيق على الشاشة الرئيسية.';
                    promise.then(function (ok) {
                        try {
                            if (ok) {
                                if (status) status.textContent = 'تم قبول الطلب. انتظر قليلًا حتى ينشئ المتصفح أيقونة التطبيق.';
                                if (btn) btn.textContent = 'إعادة إنشاء الأيقونة';
                            } else {
                                if (status) status.textContent = 'تم إلغاء العملية. يمكنك المحاولة مرة أخرى.';
                                if (btn) btn.textContent = 'إعادة إنشاء الأيقونة';
                            }
                        } catch (_) {}
                    }).catch(function () {
                        try {
                            if (status) status.textContent = '';
                            if (btn) btn.textContent = 'إعادة إنشاء الأيقونة';
                        } catch (_) {}
                    });
                } catch (_) {}
            });
        }
        return;
    }

    if (stepId === 'done') {
        const isPwaInstalled = (!isDesktopApp() && isStandaloneMode());
        if (!isPwaInstalled) return;

        const btn = document.getElementById('setup-terms-btn');
        const overlay = document.getElementById('setup-terms-overlay');
        const closeBtn = document.getElementById('setup-terms-close');
        const body = document.getElementById('setup-terms-body');

        const decodeSmart = (buf) => {
            try {
                const bytes = new Uint8Array(buf || []);
                let zeros = 0;
                for (let i = 0; i < bytes.length; i += 1) if (bytes[i] === 0) zeros += 1;
                const looksUtf16 = bytes.length > 0 && (zeros / bytes.length) > 0.2;

                const tryDecode = (enc) => {
                    try {
                        const td = new TextDecoder(enc);
                        return td.decode(bytes);
                    } catch (e) {
                        return '';
                    }
                };

                let text = looksUtf16 ? tryDecode('utf-16le') : tryDecode('utf-8');
                if (!text || /\u0000/.test(text)) {
                    const alt = looksUtf16 ? tryDecode('utf-8') : tryDecode('utf-16le');
                    if (alt) text = alt;
                }
                return String(text || '').replace(/\u0000/g, '').trim();
            } catch (e) {
                return '';
            }
        };

        const loadTerms = async () => {
            try {
                if (body) body.textContent = 'جاري التحميل...';
                const res = await fetch('license_ar.txt', { cache: 'no-store' });
                if (!res || !res.ok) throw new Error('fetch_failed');
                const buf = await res.arrayBuffer();
                const text = decodeSmart(buf);
                if (body) body.textContent = text || 'لا توجد بيانات';
            } catch (e) {
                try { if (body) body.textContent = 'تعذر فتح الشروط الآن'; } catch (_) { }
            }
        };

        const open = async () => {
            try {
                if (!overlay) return;
                overlay.classList.remove('hidden');
                try { document.body.style.overflow = 'hidden'; } catch (e) { }
                await loadTerms();
            } catch (e) { }
        };
        const close = () => {
            try {
                if (!overlay) return;
                overlay.classList.add('hidden');
                try { document.body.style.overflow = ''; } catch (e) { }
            } catch (e) { }
        };

        try {
            if (btn) btn.addEventListener('click', open);
            if (closeBtn) closeBtn.addEventListener('click', close);
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    try { if (e && e.target === overlay) close(); } catch (_) { }
                });
            }
        } catch (e) { }

        return;
    }

    if (stepId === 'office') {
        const officeInput = $('office-name-input');
        const officeNameError = $('office-name-error-msg');
        const prev = $('prev-btn');
        if (officeInput && prev) {
            
            if (wizardState && typeof wizardState.officeName === 'string') {
                officeInput.value = wizardState.officeName;
            }
            const syncOfficeName = () => {
                wizardState.officeName = (officeInput.value || '').trim();
                
                if (officeNameError) officeNameError.classList.add('hidden');
            };
            officeInput.addEventListener('input', syncOfficeName);
            syncOfficeName();
        }
    }
    if (stepId === 'storage') {
        const autoBtn = $('auto-path-btn');
        if (autoBtn) {
            if (!window.electronAPI || !window.electronAPI.listLocalDrives) {
                try { autoBtn.style.display = 'none'; } catch (e) { }
            } else {
                autoBtn.addEventListener('click', async () => {
                    let overlay = null;
                    let modal = null;
                    let cancelled = false;
                    const closeOverlay = (value) => {
                        try { cancelled = true; } catch (e) { }
                        try { if (overlay && overlay.parentNode) document.body.removeChild(overlay); } catch (e) { }
                        try { document.body.style.overflow = ''; } catch (e) { }
                        return value;
                    };
                    try {
                        autoBtn.disabled = true;

                        overlay = document.createElement('div');
                        overlay.id = 'auto-path-overlay';
                        overlay.className = 'fixed inset-0 flex items-center justify-center z-[9999] auto-path-overlay';
                        overlay.style.direction = 'rtl';
                        try { overlay.style.zIndex = '2147483647'; } catch (e) { }
                        try { overlay.style.background = 'rgba(0,0,0,0.55)'; } catch (e) { }
                        try { overlay.style.backdropFilter = 'blur(4px)'; } catch (e) { }
                        try { document.body.style.overflow = 'hidden'; } catch (e) { }

                        modal = document.createElement('div');
                        modal.id = 'auto-path-modal';
                        modal.className = 'bg-white rounded-2xl shadow-2xl max-w-2xl w-[95vw] sm:w-[680px] border border-white/30 auto-path-modal';
                        try { modal.style.zIndex = '2147483647'; } catch (e) { }
                        modal.innerHTML = `
                            <div class="p-4 sm:p-5 border-b border-gray-100">
                                <div class="flex items-center justify-between gap-3">
                                    <div>
                                        <div class="text-lg sm:text-xl font-extrabold text-gray-900">اختيار مكان حفظ البيانات</div>
                                    </div>
                                    <button id="auto-path-close" class="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-700 flex items-center justify-center" title="إغلاق">
                                        <i class="ri-close-line text-xl"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="p-6 sm:p-8">
                                <div class="flex items-center gap-3 text-gray-800">
                                    <div class="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                    <div class="font-bold">جارى تحميل الأقراص...</div>
                                </div>
                                <div class="text-xs text-gray-600 mt-2">قد يستغرق ذلك بضع ثوانٍ حسب الجهاز</div>
                            </div>
                        `;

                        overlay.appendChild(modal);
                        document.body.appendChild(overlay);

                        modal.querySelector('#auto-path-close')?.addEventListener('click', () => {
                            closeOverlay(null);
                        });
                        overlay.addEventListener('click', (e) => {
                            if (e.target === overlay) {
                                closeOverlay(null);
                            }
                        });

                        await new Promise((r) => setTimeout(r, 0));

                        let res = await window.electronAPI.listLocalDrives();
                        if (cancelled) return;
                        if (!res || !res.success || !Array.isArray(res.drives)) {
                            try { if (typeof showToast === 'function') showToast('تعذر اكتشاف الأقراص الآن', 'error'); } catch (_) { }
                            closeOverlay(null);
                            return;
                        }

                        const systemDrive = String((res && res.systemDrive) || 'C:').trim().toUpperCase();
                        let drives = res.drives
                            .map(d => ({
                                deviceId: String((d && d.deviceId) || '').trim(),
                                freeSpace: (d && d.freeSpace != null) ? Number(d.freeSpace) : -1,
                                size: (d && d.size != null) ? Number(d.size) : -1,
                                driveType: (d && d.driveType != null) ? Number(d.driveType) : -1,
                                volumeName: String((d && d.volumeName) || '').trim()
                            }))
                            .filter(d => d.deviceId);

                        // في بعض الأجهزة، أول نداء يعيد الأقراص بدون مساحة فارغة صحيحة،
                        // لذلك نعيد المحاولة مرة واحدة إذا كانت كل المساحات غير معروفة.
                        const allUnknownFree =
                            !drives.length ||
                            drives.every(d => !Number.isFinite(d.freeSpace) || d.freeSpace <= 0);
                        if (allUnknownFree) {
                            try {
                                const res2 = await window.electronAPI.listLocalDrives();
                                if (res2 && res2.success && Array.isArray(res2.drives)) {
                                    drives = res2.drives
                                        .map(d => ({
                                            deviceId: String((d && d.deviceId) || '').trim(),
                                            freeSpace: (d && d.freeSpace != null) ? Number(d.freeSpace) : -1,
                                            size: (d && d.size != null) ? Number(d.size) : -1,
                                            driveType: (d && d.driveType != null) ? Number(d.driveType) : -1,
                                            volumeName: String((d && d.volumeName) || '').trim()
                                        }))
                                        .filter(d => d.deviceId);
                                }
                            } catch (_) { }
                        }

                        if (!drives.length) {
                            try { if (typeof showToast === 'function') showToast('لم يتم العثور على أقراص داخلية', 'error'); } catch (_) { }
                            closeOverlay(null);
                            return;
                        }

                        const formatGB = (bytes) => {
                            const n = Number(bytes || 0);
                            if (!Number.isFinite(n) || n < 0) return 'غير معروف';
                            return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
                        };

                        const normalizeId = (id) => String(id || '').trim().toUpperCase();
                        const safeDrives = drives
                            .filter(d => normalizeId(d.deviceId) !== systemDrive)
                            .sort((a, b) => (b.freeSpace || 0) - (a.freeSpace || 0));
                        const windowsDrives = drives
                            .filter(d => normalizeId(d.deviceId) === systemDrive);

                        const pickStrongRecommended = (arr) => {
                            try {
                                const fixed = (Array.isArray(arr) ? arr : []).filter(x => Number(x && x.driveType) === 3);
                                if (!fixed.length) return null;
                                let best = fixed[0];
                                for (const d of fixed) {
                                    const f1 = Number(best && best.freeSpace);
                                    const f2 = Number(d && d.freeSpace);
                                    if ((Number.isFinite(f2) ? f2 : -1) > (Number.isFinite(f1) ? f1 : -1)) best = d;
                                    else if ((Number.isFinite(f2) ? f2 : -1) === (Number.isFinite(f1) ? f1 : -1)) {
                                        const s1 = Number(best && best.size);
                                        const s2 = Number(d && d.size);
                                        if ((Number.isFinite(s2) ? s2 : -1) > (Number.isFinite(s1) ? s1 : -1)) best = d;
                                    }
                                }
                                return best || null;
                            } catch (_) {
                                return null;
                            }
                        };

                        const strongDrive = pickStrongRecommended(safeDrives);
                        const orderedSafeDrives = strongDrive
                            ? [strongDrive, ...safeDrives.filter(d => normalizeId(d.deviceId) !== normalizeId(strongDrive.deviceId))]
                            : safeDrives;

                        const btnCard = (d, opts) => {
                            const title = `${d.deviceId}${d.volumeName ? ' - ' + d.volumeName : ''}`;
                            const details = `المساحة الفارغة: ${formatGB(d.freeSpace)}`;
                            const badge = opts && opts.badge ? `<span class="inline-flex whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full ${opts.badgeClass}">${opts.badge}</span>` : '';
                            return `
                                <button data-drive="${d.deviceId}" class="w-full text-right border border-gray-200 rounded-xl p-3 hover:bg-blue-50 transition-colors">
                                    <div class="flex items-start justify-between gap-3">
                                        <div>
                                            <div class="font-bold text-gray-900">${title}</div>
                                            <div class="text-xs text-gray-600 mt-1">${details}</div>
                                        </div>
                                        <div class="pt-0.5">${badge}</div>
                                    </div>
                                </button>
                            `;
                        };

                        const safeListHtml = orderedSafeDrives.length
                            ? `<div class="space-y-2">${orderedSafeDrives.map(d => btnCard(d, {
                                badge: (strongDrive && normalizeId(d.deviceId) === normalizeId(strongDrive.deviceId)) ? 'موصى به بشدة' : 'موصى به',
                                badgeClass: (strongDrive && normalizeId(d.deviceId) === normalizeId(strongDrive.deviceId))
                                    ? 'bg-green-200 text-green-900 border border-green-300'
                                    : 'bg-green-100 text-green-800 border border-green-200',
                            })).join('')}</div>`
                            : `<div class="text-sm text-gray-600">لا يوجد أقراص أخرى غير قسم الويندوز</div>`;

                        const windowsListHtml = windowsDrives.length
                            ? `<div class="space-y-2">${windowsDrives.map(d => btnCard(d, {
                                badge: 'غير آمن',
                                badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                            })).join('')}</div>`
                            : `<div class="text-sm text-gray-600">غير متاح</div>`;

                        modal.innerHTML = `
                            <div class="p-4 sm:p-5 border-b border-gray-100">
                                <div class="flex items-center justify-between gap-3">
                                    <div>
                                        <div class="text-lg sm:text-xl font-extrabold text-gray-900">اختيار مكان حفظ البيانات</div>
                                    </div>
                                    <button id="auto-path-close" class="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-700 flex items-center justify-center" title="إغلاق">
                                        <i class="ri-close-line text-xl"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
                                <div class="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <div class="text-sm font-bold text-gray-800">ملاحظة مهمة</div>
                                    <div class="text-xs text-gray-700 mt-1">✅ الأقراص غير قسم الويندوز: <span class="font-semibold">آمنة وموصى بها</span> لحفظ البيانات.</div>
                                    <div class="text-xs text-gray-700 mt-1">⚠️ قسم الويندوز (${systemDrive}): <span class="font-semibold">غير آمن</span> وقد يسبب فقدان البيانات عند مشاكل النظام أو إعادة تثبيت الويندوز.</div>
                                </div>
                                <div class="mb-4">
                                    <div class="font-bold text-green-800 mb-2">✅ أقراص آمنة (موصى بها)</div>
                                    ${safeListHtml}
                                </div>

                                <div class="mt-5">
                                    <div class="font-bold text-yellow-800 mb-2">⚠️ قسم الويندوز (غير آمن)</div>
                                    ${windowsListHtml}
                                </div>
                            </div>

                            <div class="p-4 sm:p-5 border-t border-gray-100">
                                <button id="auto-path-cancel" class="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl font-bold">إلغاء</button>
                            </div>
                        `;

                        const finishWithDrive = async (dv) => {
                            const selectedDrive = String(dv || '').trim();
                            if (!selectedDrive) return;
                            const chosenPath = `${selectedDrive}\\المحامى الرقمى`;
                            try { await setSetting('customClientsPath', chosenPath); } catch (e) { }
                            try { if (window.electronAPI && window.electronAPI.setCustomClientsPath) { await window.electronAPI.setCustomClientsPath(chosenPath); } } catch (e) { }
                            try { const span = $('chosen-path'); if (span) span.textContent = chosenPath; } catch (e) { }
                            wizardState.chosenPath = chosenPath;
                            try { if (typeof showToast === 'function') showToast('تم اختيار المسار تلقائياً بنجاح'); } catch (_) { }
                        };

                        modal.querySelectorAll('button[data-drive]').forEach(btnEl => {
                            btnEl.addEventListener('click', async () => {
                                const dv = String(btnEl.getAttribute('data-drive') || '').trim();
                                closeOverlay(null);
                                await finishWithDrive(dv);
                            });
                        });

                        modal.querySelector('#auto-path-close')?.addEventListener('click', () => {
                            closeOverlay(null);
                        });

                        modal.querySelector('#auto-path-cancel')?.addEventListener('click', () => {
                            closeOverlay(null);
                        });
                    } catch (e) {
                        try { if (typeof showToast === 'function') showToast('حدث خطأ أثناء الاختيار التلقائي', 'error'); } catch (_) { }
                        try { closeOverlay(null); } catch (_) { }
                    } finally {
                        try { autoBtn.disabled = false; } catch (e) { }
                    }
                });
            }
        }

        const chosenPathSpan = $('chosen-path');
        if (chosenPathSpan && wizardState.chosenPath) {
            chosenPathSpan.textContent = wizardState.chosenPath;
        }
    }
    if (stepId === 'demo') {
        const cb = $('load-demo-data');
        const track = $('demo-switch');
        const knob = $('demo-switch-knob');
        const stateLabel = $('demo-switch-state');
        const applySwitch = () => {
            if (track && cb) {
                track.classList.toggle('bg-green-500', !!cb.checked);
                track.classList.toggle('bg-gray-400', !cb.checked);
            }
            if (knob && cb) {
                try { knob.style.transform = cb.checked ? 'translateX(20px)' : 'translateX(0)'; } catch (e) {}
            }
            if (stateLabel && cb) {
                stateLabel.textContent = cb.checked ? 'مفعلة' : 'معطلة';
                stateLabel.classList.toggle('text-green-200', !!cb.checked);
                stateLabel.classList.toggle('text-red-200', !cb.checked);
            }
        };
        if (cb) {
            cb.checked = !!wizardState.loadDemoData;
            applySwitch();
            cb.addEventListener('change', () => { 
                wizardState.loadDemoData = !!cb.checked; 
                applySwitch();
            });
            if (track) {
                track.addEventListener('click', () => {
                    cb.checked = !cb.checked;
                    wizardState.loadDemoData = !!cb.checked;
                    applySwitch();
                });
            }
        }
    }

    if (stepId === 'install') {
        const btn = $('setup-install-btn');
        const status = $('setup-install-status');
        const finalMsg = $('setup-install-final');
        const help = $('setup-install-help');
        const nextBtn = $('next-btn');
        const cont = $('step-container');

        const setBtn = (text, disabled) => {
            try { if (btn) btn.textContent = text; } catch (e) {}
            try { if (btn) btn.disabled = !!disabled; } catch (e) {}
        };

        const showFinal = (text) => {
            try {
                if (!finalMsg) return;
                finalMsg.textContent = text || '';
                finalMsg.style.display = text ? 'block' : 'none';
            } catch (e) {}
        };

        const refreshState = () => {
            try {
                const can = !!(window.pwaAPI && typeof window.pwaAPI.canPromptInstall === 'function' && window.pwaAPI.canPromptInstall());
                setBtn('إنشاء أيقونة التطبيق', false);
                if (status) status.textContent = can ? 'تم تنزيل ملفات التطبيق. قم بالضغط على زر إنشاء أيقونة التطبيق لإضافته على الشاشة الرئيسية.' : 'برجاء استخدام قائمة المتصفح لإضافة الأيقونة';
                showFinal('');
                if (help) help.style.display = can ? 'none' : 'block';

                // Mobile-only: Next button acts as the install button (mandatory install)
                try {
                    if (!isDesktopApp() && nextBtn) {
                        if (!isStandaloneMode()) {
                            nextBtn.textContent = 'إنشاء أيقونة التطبيق';
                            nextBtn.disabled = false;
                        } else {
                            nextBtn.textContent = 'التالي';
                            nextBtn.disabled = false;
                        }
                    }
                } catch (e) {}
            } catch (e) {
                if (help) help.style.display = 'block';
            }
        };

        refreshState();

        const updatePrecacheProgress = (done, total) => {
            try {
                const d = Number(done || 0);
                const t = Number(total || 0);
                const pct = t ? Math.min(100, Math.round((d / t) * 100)) : 0;
                if (status) status.textContent = `جاري تحميل ملفات الأوفلاين: ${d} / ${t} (${pct}%)`;
                setBtn('جاري تحميل ملفات الأوفلاين...', true);
            } catch (e) {}
        };

        const onInstalled = () => {
            try {
                if (status) status.textContent = 'تم التثبيت بنجاح. جاري تجهيز ملفات الأوفلاين...';
                try {
                    if (nextBtn && !isDesktopApp()) {
                        nextBtn.textContent = 'التالي';
                        nextBtn.disabled = false;
                    }
                } catch (e) {}
            } catch (e) {}
        };

        const onPrecacheComplete = (failed) => {
            try {
                const f = Array.isArray(failed) ? failed : [];
                if (f.length > 0) {
                    if (status) status.textContent = 'تعذر تحميل بعض ملفات الأوفلاين بعد عدة محاولات تلقائية. ثبّت الإنترنت ثم أعد المحاولة.';
                } else {
                    if (status) status.textContent = 'تم تنزيل ملفات التطبيق. قم بالضغط على زر إنشاء أيقونة التطبيق لإضافته على الشاشة الرئيسية.';
                }

                try {
                    if (nextBtn && !isDesktopApp()) {
                        nextBtn.textContent = 'التالي';
                        nextBtn.disabled = false;
                    }
                } catch (e) {}
            } catch (e) {}
        };

        window.addEventListener('pwa:appinstalled', () => {
            onInstalled();
        });

        window.addEventListener('pwa:precache:progress', (ev) => {
            try {
                const detail = (ev && ev.detail) ? ev.detail : {};
                updatePrecacheProgress(detail.done, detail.total);
            } catch (e) {}
        });

        window.addEventListener('pwa:precache:complete', (ev) => {
            try {
                const detail = (ev && ev.detail) ? ev.detail : {};
                onPrecacheComplete(detail.failed);
            } catch (e) {}
        });

        if (btn) {
            btn.addEventListener('click', function () {
                try {
                    showFinal('');
                    if (help) help.style.display = 'none';
                    if (window.pwaAPI && typeof window.pwaAPI.isPrecacheRunning === 'function' && window.pwaAPI.isPrecacheRunning()) {
                        if (status) status.textContent = 'جاري تجهيز التطبيق تلقائياً. انتظر اكتمال التحميل ثم اضغط تثبيت.';
                        setBtn('إنشاء أيقونة التطبيق', false);
                        return;
                    }

                    var promise = (window.pwaAPI && typeof window.pwaAPI.promptInstall === 'function') ? window.pwaAPI.promptInstall() : null;
                    if (!promise || typeof promise.then !== 'function') {
                        if (status) status.textContent = 'نافذة إنشاء الأيقونة غير متاحة حالياً من المتصفح.';
                        setBtn('إنشاء أيقونة التطبيق', false);
                        return;
                    }
                    if (status) status.textContent = 'إذا ظهرت نافذة من المتصفح، فوافق عليها لإنشاء أيقونة التطبيق على الشاشة الرئيسية.';
                    setBtn('جاري إنشاء الأيقونة...', true);
                    promise.then(function (ok) {
                        try {
                            if (ok) {
                                if (status) status.textContent = 'تم قبول الطلب. انتظر قليلًا حتى ينشئ المتصفح أيقونة التطبيق.';
                                setBtn('إعادة إنشاء الأيقونة', false);
                            } else {
                                if (status) status.textContent = 'تم إلغاء العملية. يمكنك المحاولة مرة أخرى.';
                                setBtn('إعادة إنشاء الأيقونة', false);
                            }
                        } catch (_) {}
                    }).catch(function () {
                        try {
                            if (status) status.textContent = '';
                            setBtn('إعادة إنشاء الأيقونة', false);
                        } catch (_) {}
                    });
                } catch (e) {
                    if (status) status.textContent = 'جاري تجهيز وتحديث الملفات...';
                }
            });
        }

        // Mobile-only: hide the inner install button (use Next instead).
        try {
            if (!isDesktopApp() && btn) {
                btn.style.display = 'none';
            }
        } catch (e) {}

        try {
            window.dispatchEvent(new CustomEvent('lawyer:setup:install-step'));
        } catch (e) {}
    }
}



async function handleNext(){
    const id = steps[currentStep].id;

    if (id === 'office') {
        
        const name = (document.getElementById('office-name-input')?.value || '').trim();
        const officeNameError = $('office-name-error-msg');
        
        if (!name) { 
            
            if (officeNameError) officeNameError.classList.remove('hidden');
            return; 
        }
        
        
        if (officeNameError) officeNameError.classList.add('hidden');
        
        try { await setSetting('officeName', name); } catch (e) {}
        
        wizardState.officeName = name;
    } else if (id === 'storage') {
        
        const chosenPathText = $('chosen-path')?.textContent?.trim();
        if (!chosenPathText) {
            
            if (currentStep < steps.length - 1) {
                currentStep += 1;
                render();
            }
            return;
        }
        
    }

    if (currentStep < steps.length - 1) {
        currentStep += 1;
        render();
    } else {
        try {
            if (!document.getElementById('app-loading-overlay')) {
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

                const hint = document.createElement('div');
                hint.textContent = 'الرجاء الانتظار...';
                hint.style.cssText = 'margin-top:10px;font-size:13px;color:#334155;';

                box.appendChild(title);
                box.appendChild(hint);
                overlay.appendChild(box);
                (document.body || document.documentElement).appendChild(overlay);
            }
        } catch (e) {}
        
        try { 
            if (wizardState.loadDemoData) { await importSampleData(); }
            await setSetting('firstRunCompleted', true); 
            
            localStorage.setItem('lawyer_app_setup_completed', 'true');
        } catch (e) {}
        window.location.href = 'index.html';
    }
}

function handlePrev(){ if (currentStep > 0) { currentStep -= 1; render(); } }
function handleSkip(){ currentStep += 1; render(); }

document.addEventListener('DOMContentLoaded', async () => {
    try { await initDB(); } catch (e) {}
    try {
        if (!isDesktopApp() && isStandaloneMode()) {
            localStorage.setItem('pwa_installed', '1');
        }
    } catch (e) {}

    try {
        const titleEl = document.querySelector('#setup-wizard .text-lg.font-bold.flex.items-center.gap-2');
        if (!isDesktopApp() && titleEl) {
            let tapCount = 0;
            let lastTapAt = 0;
            titleEl.addEventListener('click', async () => {
                try {
                    const now = Date.now();
                    if (!lastTapAt || (now - lastTapAt) > 900) {
                        tapCount = 0;
                    }
                    lastTapAt = now;
                    tapCount += 1;
                    if (tapCount < 5) return;
                    tapCount = 0;

                    const defaultOfficeName = 'المستشار رجائى عطية';
                    try { await setSetting('officeName', defaultOfficeName); } catch (e) { }
                    try { wizardState.officeName = defaultOfficeName; } catch (e) { }

                    try { wizardState.loadDemoData = true; } catch (e) { }
                    try {
                        const alreadyLoaded = String(localStorage.getItem('lawyer_app_demo_loaded') || '') === '1';
                        if (!alreadyLoaded) {
                            try {
                                if (!document.getElementById('app-loading-overlay')) {
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

                                    const hint = document.createElement('div');
                                    hint.textContent = 'جارى إدخال البيانات الوهمية...';
                                    hint.style.cssText = 'margin-top:10px;font-size:13px;color:#334155;';

                                    box.appendChild(title);
                                    box.appendChild(hint);
                                    overlay.appendChild(box);
                                    (document.body || document.documentElement).appendChild(overlay);
                                }
                            } catch (e) { }

                            try {
                                const ok = await importSampleData();
                                if (ok) {
                                    try { localStorage.setItem('lawyer_app_demo_loaded', '1'); } catch (e) { }
                                }
                            } catch (e) { }
                        }
                    } catch (e) { }

                    try { await setSetting('firstRunCompleted', true); } catch (e) { }
                    try { localStorage.setItem('lawyer_app_setup_completed', 'true'); } catch (e) { }

                    try { window.location.href = 'index.html'; } catch (e) { }
                } catch (e) { }
            });
        }
    } catch (e) { }
    try { buildSteps(); } catch (e) {}
    try {
        const savedOffice = await getSetting('officeName');
        if (savedOffice) wizardState.officeName = savedOffice;
    } catch (e) {}
    try {
        const savedPath = await getSetting('customClientsPath');
        if (savedPath) wizardState.chosenPath = savedPath;
    } catch (e) {}
    
    const prev = $('prev-btn');
    const next = $('next-btn');
    if (prev) prev.addEventListener('click', handlePrev);
    if (next) next.addEventListener('click', handleNext);
    render();

    try {
        // إشعار بأن الصفحة أصبحت جاهزة للاستخدام (لإخفاء شاشة التحميل)
        window.dispatchEvent(new CustomEvent('lawyer:page:ready'));
    } catch (e) {}
});

async function importSampleData() {
    const tryPaths = ['test-data.json', 'test-data/test-data.json', 'data/test-data.json'];
    for (const p of tryPaths) {
        try {
            const res = await fetch(p);
            if (!res.ok) continue;
            const backupData = await res.json();
            await restoreBackup(backupData);
            try { if (typeof showToast === 'function') showToast('تم تحميل البيانات الوهمية'); } catch (e) {}
            return true;
        } catch (e) {}
    }
    const loadScript = (src) => new Promise((resolve, reject) => {
        try {
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('script load failed'));
            document.head.appendChild(s);
        } catch (err) { reject(err); }
    });
    const jsPaths = ['js/test-data.js', 'test-data.js', 'test-data/test-data.js', 'data/test-data.js'];
    for (const p of jsPaths) {
        try {
            await loadScript(p);
            const candidate = (window && (window.__LAW_APP_TEST_DATA || window.TEST_DATA || window.SAMPLE_DATA)) || null;
            if (candidate && typeof candidate === 'object') {
                await restoreBackup(candidate);
                try { if (typeof showToast === 'function') showToast('تم تحميل البيانات الوهمية'); } catch (e) {}
                return true;
            }
        } catch (e) {}
    }
    try { if (typeof showToast === 'function') showToast('تعذر العثور على ملف test-data', 'error'); } catch (e) {}
    return false;
}

async function restoreBackup(backupData) {
    if (!backupData || typeof backupData !== 'object') throw new Error('بيانات غير صالحة');
    let dataToRestore;
    if (backupData.data && typeof backupData.data === 'object') dataToRestore = backupData.data; else if (typeof backupData === 'object' && !backupData.data) dataToRestore = backupData; else throw new Error('بنية البيانات غير معروفة');
    const requiredCollections = ['clients', 'cases', 'sessions'];
    for (const c of requiredCollections) { if (!Array.isArray(dataToRestore[c])) throw new Error(`بيانات ${c} غير صحيحة أو مفقودة`); }

    try {
        if (!Array.isArray(dataToRestore.opponents)) dataToRestore.opponents = [];

        const pick = (obj, keys) => {
            const out = {};
            for (const k of keys) {
                if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
            }
            return out;
        };

        dataToRestore.clients = (dataToRestore.clients || []).map(c => {
            const r = pick(c, ['id', 'name', 'address', 'phone']);
            return r;
        });

        dataToRestore.opponents = (dataToRestore.opponents || []).map(o => {
            const r = pick(o, ['id', 'name', 'address', 'phone']);
            return r;
        });

        dataToRestore.cases = (dataToRestore.cases || []).map(cs => {
            const r = pick(cs, [
                'id',
                'clientId', 'opponentId',
                'clientCapacity', 'opponentCapacity',
                'court', 'circuitNumber', 'caseType',
                'subject',
                'caseNumber', 'caseYear',
                'appealNumber', 'appealYear',
                'cassationNumber', 'cassationYear',
                'fileNumber', 'poaNumber',
                'caseStatus', 'notes', 'isArchived',
                'caseNumberYearKey'
            ]);

            if ((!r.subject || !String(r.subject).trim()) && cs && cs.caseSubject) {
                r.subject = cs.caseSubject;
            }

            try {
                if (typeof applyCaseNumberYearKey === 'function') {
                    applyCaseNumberYearKey(r);
                } else {
                    const num = String(r.caseNumber ?? '').trim();
                    const year = String(r.caseYear ?? '').trim();
                    const type = String(r.caseType ?? '').trim();
                    if (num && year) r.caseNumberYearKey = type ? `${num}__${year}__${type}` : `${num}__${year}`;
                    else {
                        try { delete r.caseNumberYearKey; } catch (_) { r.caseNumberYearKey = undefined; }
                    }
                }
            } catch (_) { }

            return r;
        });
    } catch (_) {}

    try {
        const casesArr = Array.isArray(dataToRestore.cases) ? dataToRestore.cases : [];
        casesArr.forEach(cs => {
            if (!cs || typeof cs !== 'object') return;
            try {
                if (!cs.clientCapacity || !String(cs.clientCapacity).trim()) cs.clientCapacity = 'موكل';
                if (!cs.opponentCapacity || !String(cs.opponentCapacity).trim()) cs.opponentCapacity = 'خصم';
            } catch (_) { }
        });
    } catch (_) {}

    await initDB();
    const expectedStores = ['clients', 'opponents', 'cases', 'sessions', 'accounts', 'administrative', 'clerkPapers', 'expertSessions'];
    for (const storeName of expectedStores) { try { await clearStore(storeName); } catch (e) {} }
    for (const [storeName, records] of Object.entries(dataToRestore)) {
        if (storeName === 'settings') continue;
        if (Array.isArray(records) && records.length > 0) {
            for (const record of records) {
                if (record && typeof record === 'object') {
                    if (storeName === 'cases') {
                        try {
                            if (typeof applyCaseNumberYearKey === 'function') applyCaseNumberYearKey(record);
                        } catch (_) { }
                    }
                    if (record.id) { await putRecord(storeName, record); } else { await addRecord(storeName, record); }
                }
            }
        }
    }
}

async function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const dbInstance = getDbInstance();
        if (!dbInstance) { reject(new Error('قاعدة البيانات غير متاحة')); return; }
        try {
            const transaction = dbInstance.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
            transaction.onerror = () => reject(transaction.error);
        } catch (error) {
            resolve();
        }
    });
}
