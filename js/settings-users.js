(function () {
    if (window.renderUsersSettingsSection) return;

    window.renderUsersSettingsSection = async function renderUsersSettingsSection(container) {
        try {
            if (!container) return;

            let headerHtml = '';
            try {
                const existingHeader = container.querySelector('.mobile-section-header');
                if (existingHeader && existingHeader.outerHTML) headerHtml = existingHeader.outerHTML;
            } catch (e) { }

            const isAdmin = (sessionStorage.getItem('current_is_admin') === '1');
            if (!isAdmin) {
                container.innerHTML = `
                ${headerHtml}
                <div class="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 shadow-sm transition-all h-fit">
                    <div class="sm:hidden text-center font-bold text-gray-800 mb-2">ادارة المستخدمين</div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2 flex-shrink-0 min-w-[60px]">
                            <div class="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                                <i class="ri-user-settings-line text-white text-lg"></i>
                            </div>
                        </div>
                        <div class="flex-1 w-full sm:max-w-[520px]">
                            <div class="hidden sm:block text-sm font-bold text-gray-800 text-center">ادارة المستخدمين</div>
                            <div class="text-xs text-gray-600 text-center mt-1">لا تملك صلاحية إدارة المستخدمين</div>
                        </div>
                    </div>
                </div>
                `;
                return;
            }

            try {
                if (typeof initDB === 'function') {
                    try { await initDB(); } catch (e) { }
                }
            } catch (e) { }

            container.innerHTML = `
                ${headerHtml}
                <div class="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 shadow-sm transition-all h-fit">
                    <style>
                        /* Hide built-in Edge/Chromium password reveal/clear icons inside Users section */
                        #settings-section-users input[type="password"]::-ms-reveal,
                        #settings-section-users input[type="password"]::-ms-clear,
                        #settings-section-users input[type="password"]::-webkit-credentials-auto-fill-button,
                        #settings-section-users input[type="password"]::-webkit-textfield-decoration-container {
                            display: none !important;
                        }
                    </style>
                    <div class="sm:hidden text-center font-bold text-gray-800 mb-2">ادارة المستخدمين</div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div class="flex-1 min-w-0">
                            <input id="users-new-username" type="text" class="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-center text-sm bg-white transition-all shadow-sm" placeholder="اسم المستخدم">
                        </div>
                        <div class="flex-[2] min-w-0">
                            <div class="relative">
                                <input id="users-new-password" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-center text-sm bg-white transition-all shadow-sm" placeholder="كلمة المرور" style="padding-left:42px;-webkit-text-security:disc;">
                                <button id="toggle-users-new-password" type="button" class="absolute flex items-center justify-center" style="top:50%;transform:translateY(-50%);left:8px;width:32px;height:32px;border-radius:9999px;background:transparent;color:#4b5563;display:none;">
                                    <i class="ri-eye-line text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-center sm:justify-start flex-shrink-0">
                            <button id="users-add-btn" class="flex-1 sm:flex-none px-3 py-2 bg-blue-900 hover:bg-black text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm" title="إضافة">
                                <i class="ri-user-add-line text-base"></i>
                                <span>إضافة</span>
                            </button>
                        </div>
                    </div>

                    <div class="mt-3">
                        <div id="users-list" class="space-y-2"></div>
                    </div>
                </div>
            `;

            const usernameInput = container.querySelector('#users-new-username');
            const passwordInput = container.querySelector('#users-new-password');
            const addBtn = container.querySelector('#users-add-btn');
            const listEl = container.querySelector('#users-list');

            function attachEyeToggle(inputEl, btnEl) {
                try {
                    if (!inputEl || !btnEl) return;
                    if (inputEl.dataset && inputEl.dataset.eyeBound === '1') return;
                    const icon = btnEl.querySelector('i');
                    const update = () => {
                        try {
                            const has = !!(inputEl.value && String(inputEl.value).length);
                            btnEl.style.display = has ? 'inline-flex' : 'none';
                        } catch (e) { }
                    };
                    const setMasked = (masked) => {
                        try {
                            if (!inputEl.dataset) inputEl.dataset = {};
                            inputEl.dataset.masked = masked ? '1' : '0';
                        } catch (e) { }
                        try { inputEl.style.webkitTextSecurity = masked ? 'disc' : 'none'; } catch (e) { }
                        try { inputEl.style.setProperty('-webkit-text-security', masked ? 'disc' : 'none'); } catch (e) { }
                        try {
                            if (icon) icon.className = masked ? 'ri-eye-line text-lg' : 'ri-eye-off-line text-lg';
                        } catch (e) { }
                    };
                    const toggle = () => {
                        try {
                            const masked = (inputEl.dataset && inputEl.dataset.masked === '1');
                            setMasked(!masked);
                        } catch (e) { }
                    };
                    inputEl.addEventListener('input', update);
                    btnEl.addEventListener('click', toggle);
                    setMasked(true);
                    update();
                    try { inputEl.dataset.eyeBound = '1'; } catch (e) { }
                } catch (e) { }
            }

            attachEyeToggle(passwordInput, container.querySelector('#toggle-users-new-password'));

            const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            const FEATURES = [
                { id: 'new', label: 'قضية جديدة' },
                { id: 'search', label: 'قضايا الموكلين' },
                { id: 'sessions', label: 'الجلسات' },
                { id: 'administrative', label: 'المهام' },
                { id: 'clerk-papers', label: 'أوراق المحضرين' },
                { id: 'accounts', label: 'الحسابات' },
                { id: 'expert-sessions', label: 'جلسات الخبراء' },
                { id: 'services', label: 'الخدمات' },
                { id: 'legal-library', label: 'المكتبة القانونية' },
                { id: 'reports', label: 'التقارير' },
                { id: 'settings', label: 'الإعدادات' },
                { id: 'sync', label: 'المزامنة' }
            ];

            const normalizeDenied = (value) => {
                try {
                    if (Array.isArray(value)) return value.map(v => String(v));
                    if (value == null) return [];
                    if (typeof value === 'string') {
                        const s = value.trim();
                        if (!s) return [];
                        try {
                            const parsed = JSON.parse(s);
                            if (Array.isArray(parsed)) return parsed.map(v => String(v));
                        } catch (e) { }
                        return s.split(',').map(x => x.trim()).filter(Boolean);
                    }
                    return [];
                } catch (e) {
                    return [];
                }
            };

            const renderPermissionsPanel = (rowEl, user) => {
                try {
                    if (!rowEl || !user) return;
                    const id = String(user.id);
                    const panel = rowEl.querySelector(`[data-user-perms-panel="${id}"]`);
                    const grid = rowEl.querySelector(`[data-user-perms-grid="${id}"]`);
                    if (!panel || !grid) return;
                    const denied = normalizeDenied(user.deniedFeatures);
                    grid.innerHTML = '';
                    FEATURES.forEach(f => {
                        const wrap = document.createElement('label');
                        wrap.className = 'flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer select-none hover:bg-gray-50';
                        const cb = document.createElement('input');
                        cb.type = 'checkbox';
                        cb.checked = !denied.includes(String(f.id));
                        cb.setAttribute('data-user-perm', id);
                        cb.setAttribute('data-feature', String(f.id));
                        const span = document.createElement('span');
                        span.className = 'text-sm text-gray-700';
                        span.textContent = String(f.label);
                        wrap.appendChild(cb);
                        wrap.appendChild(span);
                        grid.appendChild(wrap);
                    });
                } catch (e) { }
            };

            const passwordSaveTimers = new Map();

            async function savePasswordForUser(user, newPass, inputEl) {
                try {
                    const id = user && user.id != null ? parseInt(String(user.id), 10) : NaN;
                    if (!Number.isFinite(id)) return;
                    const pass = (newPass != null) ? String(newPass) : '';
                    const isAdminUser = !!(user && user.isAdmin === true);
                    const isAdminName = !!(user && String(user.username || '').toLowerCase() === 'admin');

                    await (typeof updateUser === 'function' ? updateUser(id, { password: pass }) : Promise.reject(new Error('MissingUpdateUser')));

                    try {
                        if (isAdminUser && isAdminName && typeof setSetting === 'function') {
                            const v = String(pass || '');
                            await setSetting('appPasswordPlain', v);
                            try { sessionStorage.removeItem('auth_ok'); } catch (e) { }
                        }
                    } catch (e) { }

                    try { if (typeof showToast === 'function') showToast('تم حفظ كلمة المرور', 'success'); } catch (e) { }
                } catch (e) {
                    try { if (typeof showToast === 'function') showToast('تعذر حفظ كلمة المرور', 'error'); } catch (err) { }
                }
            }

            const refresh = async () => {
                try {
                    if (!listEl) return;
                    let users = [];
                    try {
                        users = await (typeof getAllUsers === 'function' ? getAllUsers() : []);
                    } catch (e) {
                        users = [];
                    }
                    if (!Array.isArray(users)) users = [];

                    try {
                        const adminUser = users.find(u => u && u.isAdmin === true && String(u.username || '').toLowerCase() === 'admin');
                        if (adminUser) {
                            let settingsPass = '';
                            try {
                                settingsPass = (typeof getSetting === 'function') ? await getSetting('appPasswordPlain') : '';
                            } catch (e) {
                                settingsPass = '';
                            }
                            settingsPass = String(settingsPass || '');
                            const adminPass = String(adminUser.password || '');

                            if (!settingsPass && adminPass && typeof setSetting === 'function') {
                                try {
                                    await setSetting('appPasswordPlain', adminPass);
                                } catch (e) { }
                            } else if (settingsPass && adminPass !== settingsPass) {
                                try {
                                    adminUser.password = settingsPass;
                                } catch (e) { }
                                try {
                                    if (typeof updateUser === 'function' && adminUser.id != null) {
                                        await updateUser(adminUser.id, { password: settingsPass });
                                    }
                                } catch (e) { }
                            }
                        }
                    } catch (e) { }
                    users.sort((a, b) => {
                        const aa = (a && a.isAdmin) ? 0 : 1;
                        const bb = (b && b.isAdmin) ? 0 : 1;
                        if (aa !== bb) return aa - bb;
                        return String(a.username || '').localeCompare(String(b.username || ''), 'ar');
                    });

                    const adminCount = users.filter(u => u && u.isAdmin === true).length;

                    listEl.innerHTML = '';
                    users.forEach((u) => {
                        const row = document.createElement('div');
                        row.className = 'p-3 border border-gray-200 rounded-lg bg-gray-50';
                        const isAdminRow = (u && u.isAdmin === true);
                        row.innerHTML = `
                            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div class="flex-1 min-w-0">
                                        <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm">
                                        <div class="font-bold text-gray-800 text-sm">
                                            <div class="flex items-center justify-center gap-1">
                                                <i class="${isAdminRow ? 'ri-shield-star-line text-emerald-700' : 'ri-user-3-line text-gray-500'}"></i>
                                                <span class="break-words">${escapeHtml(u.username || '')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex-[2] min-w-0">
                                    <div class="relative">
                                        <input data-user-password="${String(u.id)}" type="text" class="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 text-center text-sm bg-white transition-all shadow-sm" style="padding-left:42px;-webkit-text-security:disc;" value="${escapeHtml(u.password || '')}" placeholder="كلمة المرور">
                                        <button data-user-toggle="${String(u.id)}" type="button" class="absolute flex items-center justify-center" style="top:50%;transform:translateY(-50%);left:8px;width:32px;height:32px;border-radius:9999px;background:transparent;color:#4b5563;display:none;">
                                            <i class="ri-eye-line text-lg"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-center sm:justify-start flex-shrink-0">
                                    ${!isAdminRow ? `
                                    <button data-user-perms="${String(u.id)}" class="flex-1 sm:flex-none px-3 py-2 bg-blue-900 hover:bg-black text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2" title="الصلاحيات" aria-expanded="false">
                                        <i class="ri-shield-user-line"></i>
                                        <span>صلاحياته</span>
                                    </button>
                                    ` : `
                                    <button class="flex-1 sm:flex-none px-3 py-2 bg-blue-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed" title="الصلاحيات" disabled aria-disabled="true" tabindex="-1">
                                        <i class="ri-shield-user-line"></i>
                                        <span>صلاحياته</span>
                                    </button>
                                    `}
                                    <button data-user-del="${String(u.id)}" class="flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2" title="حذف" ${isAdminRow && adminCount <= 1 ? 'disabled style="opacity:0.6;cursor:not-allowed;"' : ''}>
                                        <i class="ri-delete-bin-2-line"></i>
                                        <span>حذف</span>
                                    </button>
                                </div>
                            </div>
                            ${!isAdminRow ? `
                            <div data-user-perms-panel="${String(u.id)}" class="hidden mt-3 p-3 bg-white border border-emerald-200 rounded-lg">
                                <div class="text-sm font-bold text-emerald-800 mb-1">الصلاحيات</div>
                                <div class="text-xs text-gray-600 mb-2">اختر النوافذ المسموح لهذا المستخدم بفتحها</div>
                                <div data-user-perms-grid="${String(u.id)}" class="grid grid-cols-1 md:grid-cols-2 gap-2"></div>
                            </div>
                            ` : ''}
                        `;
                        listEl.appendChild(row);

                        if (!isAdminRow) {
                            renderPermissionsPanel(row, u);
                        }
                    });

                    try {
                        listEl.querySelectorAll('[data-user-password]').forEach((inp) => {
                            const id = String(inp.getAttribute('data-user-password') || '');
                            const btn = listEl.querySelector(`[data-user-toggle="${id}"]`);
                            if (btn) attachEyeToggle(inp, btn);
                        });
                    } catch (e) { }

                    try {
                        listEl.querySelectorAll('[data-user-password]').forEach((inp) => {
                            // حفظ كلمة المرور يكون فقط عبر زر الحفظ لتجنب تكرار التوست
                            try {
                                const idStr = String(inp.getAttribute('data-user-password') || '').trim();
                                const id = parseInt(idStr, 10);
                                if (!Number.isFinite(id)) return;

                                const scheduleSave = async () => {
                                    try {
                                        const user = (typeof getById === 'function') ? await getById('users', id) : null;
                                        if (!user) return;
                                        const newPass = (inp && inp.value != null) ? String(inp.value) : '';
                                        await savePasswordForUser(user, newPass, inp);
                                    } catch (e) { }
                                };

                                const debounceSave = () => {
                                    try {
                                        const prev = passwordSaveTimers.get(id);
                                        if (prev) clearTimeout(prev);
                                        const t = setTimeout(() => { scheduleSave(); }, 600);
                                        passwordSaveTimers.set(id, t);
                                    } catch (e) { }
                                };

                                if (!(inp.dataset && inp.dataset.autoSaveBound === '1')) {
                                    inp.addEventListener('blur', debounceSave);
                                    inp.addEventListener('change', debounceSave);
                                    inp.addEventListener('keydown', (e) => {
                                        try {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                debounceSave();
                                                try { inp.blur(); } catch (err) { }
                                            }
                                        } catch (err) { }
                                    });
                                    try {
                                        if (!inp.dataset) inp.dataset = {};
                                        inp.dataset.autoSaveBound = '1';
                                    } catch (e) { }
                                }
                            } catch (e) { }
                        });
                    } catch (e) { }

                    try {
                        listEl.querySelectorAll('[data-user-perms]').forEach((btn) => {
                            btn.addEventListener('click', async () => {
                                try {
                                    const id = String(btn.getAttribute('data-user-perms') || '');
                                    if (!id) return;
                                    const panel = listEl.querySelector(`[data-user-perms-panel="${id}"]`);
                                    if (!panel) return;
                                    const isOpen = !panel.classList.contains('hidden');
                                    if (isOpen) {
                                        panel.classList.add('hidden');
                                        try { btn.setAttribute('aria-expanded', 'false'); } catch (e) { }
                                    } else {
                                        panel.classList.remove('hidden');
                                        try { btn.setAttribute('aria-expanded', 'true'); } catch (e) { }
                                    }
                                } catch (e) { }
                            });
                        });
                    } catch (e) { }

                    try {
                        listEl.querySelectorAll('input[type="checkbox"][data-user-perm][data-feature]').forEach((cb) => {
                            cb.addEventListener('change', async () => {
                                try {
                                    const userId = parseInt(String(cb.getAttribute('data-user-perm') || ''), 10);
                                    const feature = String(cb.getAttribute('data-feature') || '').trim();
                                    if (!Number.isFinite(userId) || !feature) return;
                                    const user = (typeof getById === 'function') ? await getById('users', userId) : null;
                                    if (!user) return;
                                    const denied = normalizeDenied(user.deniedFeatures);
                                    const isAllowed = cb.checked === true;
                                    const nextDenied = isAllowed
                                        ? denied.filter(x => String(x) !== feature)
                                        : Array.from(new Set(denied.concat([feature])));
                                    await (typeof updateUser === 'function' ? updateUser(userId, { deniedFeatures: nextDenied }) : Promise.reject(new Error('MissingUpdateUser')));
                                    try { if (typeof showToast === 'function') showToast('تم حفظ الصلاحيات', 'success'); } catch (e) { }
                                } catch (e) {
                                    try { if (typeof showToast === 'function') showToast('تعذر حفظ الصلاحيات', 'error'); } catch (err) { }
                                    try { cb.checked = !cb.checked; } catch (err) { }
                                }
                            });
                        });
                    } catch (e) { }

                    try {
                        listEl.querySelectorAll('[data-user-del]').forEach((btn) => {
                            btn.addEventListener('click', async () => {
                                try {
                                    const id = parseInt(String(btn.getAttribute('data-user-del') || ''), 10);
                                    if (!Number.isFinite(id)) return;

                                    let usersNow = [];
                                    try { usersNow = await (typeof getAllUsers === 'function' ? getAllUsers() : []); } catch (e) { usersNow = []; }
                                    if (!Array.isArray(usersNow)) usersNow = [];
                                    const target = usersNow.find(x => String(x.id) === String(id));
                                    const adminsNow = usersNow.filter(x => x && x.isAdmin === true).length;
                                    if (target && target.isAdmin === true && adminsNow <= 1) {
                                        try { if (typeof showToast === 'function') showToast('لا يمكن حذف آخر Admin', 'error'); } catch (e) { }
                                        return;
                                    }

                                    let ok = true;
                                    try {
                                        ok = (typeof window.safeConfirm === 'function') ? await window.safeConfirm('هل تريد حذف المستخدم؟') : confirm('هل تريد حذف المستخدم؟');
                                    } catch (e) { ok = false; }
                                    if (!ok) return;

                                    await (typeof deleteUser === 'function' ? deleteUser(id) : Promise.reject(new Error('MissingDeleteUser')));
                                    try { if (typeof showToast === 'function') showToast('تم حذف المستخدم', 'success'); } catch (e) { }
                                    await refresh();
                                } catch (e) {
                                    try { if (typeof showToast === 'function') showToast('تعذر حذف المستخدم', 'error'); } catch (err) { }
                                }
                            });
                        });
                    } catch (e) { }
                } catch (e) {
                }
            };

            if (addBtn) {
                addBtn.addEventListener('click', async () => {
                    try {
                        const username = (usernameInput && usernameInput.value ? usernameInput.value.trim() : '');
                        const password = (passwordInput && passwordInput.value != null) ? String(passwordInput.value) : '';
                        if (!username) {
                            try { if (typeof showToast === 'function') showToast('يرجى إدخال اسم المستخدم', 'error'); } catch (e) { }
                            try { if (usernameInput) usernameInput.focus(); } catch (e) { }
                            return;
                        }
                        try {
                            await (typeof addUser === 'function' ? addUser({ username, password, isAdmin: false, deniedFeatures: [], createdAt: new Date().toISOString() }) : Promise.reject(new Error('MissingAddUser')));
                            try {
                                if (usernameInput) usernameInput.value = '';
                                if (passwordInput) passwordInput.value = '';
                            } catch (e) { }
                            try { if (typeof showToast === 'function') showToast('تم إضافة المستخدم', 'success'); } catch (e) { }
                            await refresh();
                        } catch (e) {
                            const name = (e && e.name) ? String(e.name) : '';
                            if (name === 'ConstraintError') {
                                try { if (typeof showToast === 'function') showToast('اسم المستخدم موجود بالفعل', 'error'); } catch (err) { }
                            } else {
                                try { if (typeof showToast === 'function') showToast('تعذر إضافة المستخدم', 'error'); } catch (err) { }
                            }
                        }
                    } catch (e) {
                    }
                });
            }

            await refresh();
        } catch (e) {
        }
    };
})();
