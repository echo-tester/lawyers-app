/**
 * ملتقط تاريخ (Date Picker) — ملف منفصل للاستخدام لاحقاً في حقول مثل "تاريخ الجلسة"
 *
 * طريقة الاستدعاء لاحقاً:
 * 1) أضف السكربت في الصفحة: <script src="js/date-picker.js"></script>
 * 2) بعد ظهور حقل الإدخال (مثلاً تاريخ الجلسة) استدعِ:
 *    attachDatePicker(document.getElementById('session-date'), { format: 'DD/MM/YYYY' });
 *
 * خيارات (اختياري): format: 'DD/MM/YYYY' أو 'YYYY-MM-DD'، minDate، maxDate (كائن Date)
 */

(function () {
  'use strict';

  var AR_DAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function toYMD(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function toDMY(d) {
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function parseDate(str, format) {
    if (!str || !str.trim()) return null;
    var parts = str.trim().split(/[/\-.\s]/);
    if (parts.length < 3) return null;
    var y, m, day;
    if (format === 'DD/MM/YYYY' || format === 'd/m/y') {
      day = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
    } else {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
    if (isNaN(y) || isNaN(m) || isNaN(day)) return null;
    var d = new Date(y, m, day);
    if (d.getFullYear() !== y || d.getMonth() !== m || d.getDate() !== day) return null;
    return d;
  }

  function buildCalendar(year, month, selectedYMD, todayYMD) {
    var first = new Date(year, month, 1);
    var last = new Date(year, month + 1, 0);
    var startDay = first.getDay();
    var daysInMonth = last.getDate();
    var prevMonth = month === 0 ? 11 : month - 1;
    var prevYear = month === 0 ? year - 1 : year;
    var prevLast = new Date(prevYear, prevMonth + 1, 0);
    var prevDays = prevLast.getDate();
    var rows = [];
    var week = [];
    var i, d, ymd, dayNum, isSelected, isToday, isOtherMonth;

    for (i = 0; i < startDay; i++) {
      dayNum = prevDays - startDay + i + 1;
      d = new Date(prevYear, prevMonth, dayNum);
      ymd = toYMD(d);
      isSelected = ymd === selectedYMD;
      isToday = ymd === todayYMD;
      week.push({ day: dayNum, ymd: ymd, otherMonth: true, selected: isSelected, today: isToday });
    }
    for (d = 1; d <= daysInMonth; d++) {
      ymd = year + '-' + pad(month + 1) + '-' + pad(d);
      week.push({ day: d, ymd: ymd, otherMonth: false, selected: ymd === selectedYMD, today: ymd === todayYMD });
      if (week.length === 7) {
        rows.push(week);
        week = [];
      }
    }
    if (week.length) {
      for (i = 1; week.length < 7; i++) {
        var nextD = new Date(year, month + 1, i);
        ymd = toYMD(nextD);
        week.push({ day: i, ymd: ymd, otherMonth: true, selected: ymd === selectedYMD, today: ymd === todayYMD });
      }
      rows.push(week);
    }
    return rows;
  }

  function createPickerEl(input, opts) {
    var format = opts.format || 'DD/MM/YYYY';
    var minDate = opts.minDate || null;
    var maxDate = opts.maxDate || null;
    var today = new Date();
    var current = parseDate(input.value, format) || new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var selectedYMD = toYMD(current);
    var todayYMD = toYMD(today);

    var wrap = document.createElement('div');
    wrap.className = 'law-date-picker-wrap';
    wrap.setAttribute('dir', 'rtl');
    wrap.style.cssText = 'position:absolute;z-index:9999;background:#fff;border:2px solid #0EA5E9;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.2);padding:12px;min-width:280px;font-family:Cairo,Roboto,sans-serif;';

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;';
    var title = document.createElement('span');
    title.style.cssText = 'font-weight:700;font-size:1rem;color:#0f172a;';
    title.textContent = AR_MONTHS[current.getMonth()] + ' ' + current.getFullYear();

    var nav = document.createElement('div');
    nav.style.cssText = 'display:flex;gap:4px;';
    var btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.setAttribute('aria-label', 'الشهر التالي');
    btnPrev.innerHTML = '&#9654;';
    btnPrev.style.cssText = 'width:32px;height:32px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;cursor:pointer;font-size:1.1rem;color:#475569;';
    var btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.setAttribute('aria-label', 'الشهر السابق');
    btnNext.innerHTML = '&#9664;';
    btnNext.style.cssText = 'width:32px;height:32px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;cursor:pointer;font-size:1.1rem;color:#475569;';

    nav.appendChild(btnPrev);
    nav.appendChild(btnNext);
    head.appendChild(title);
    head.appendChild(nav);
    wrap.appendChild(head);

    var weekRow = document.createElement('div');
    weekRow.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:6px;text-align:center;';
    AR_DAYS.forEach(function (day) {
      var th = document.createElement('span');
      th.style.cssText = 'font-size:0.65rem;font-weight:600;color:#64748b;line-height:1.2;';
      th.textContent = day;
      weekRow.appendChild(th);
    });
    wrap.appendChild(weekRow);

    var grid = document.createElement('div');
    grid.className = 'law-date-picker-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;';

    function isDisabled(ymd) {
      var d = new Date(ymd);
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    }

    function render(y, m) {
      var sel = parseDate(input.value, format);
      selectedYMD = sel ? toYMD(sel) : null;
      todayYMD = toYMD(new Date());
      var rows = buildCalendar(y, m, selectedYMD, todayYMD);
      grid.innerHTML = '';
      rows.forEach(function (week) {
        week.forEach(function (cell) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = cell.day;
          btn.dataset.ymd = cell.ymd;
          btn.style.cssText = 'padding:8px;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.9rem;transition:background 0.15s ease, color 0.15s ease;';
          if (cell.otherMonth) btn.style.color = '#94a3b8';
          else btn.style.color = '#0f172a';
          if (cell.selected) {
            btn.style.background = '#0EA5E9';
            btn.style.color = '#fff';
          } else if (cell.today) {
            btn.style.background = '#E0F2FE';
            btn.style.color = '#083344';
          }
          if (isDisabled(cell.ymd)) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
          }
          var setHover = function (on) {
            if (btn.disabled) return;
            if (on) {
              if (cell.selected) { btn.style.background = '#0284c7'; btn.style.color = '#fff'; }
              else if (cell.today) { btn.style.background = '#bae6fd'; btn.style.color = '#083344'; }
              else { btn.style.background = '#e0f2fe'; btn.style.color = '#0f172a'; }
            } else {
              if (cell.selected) { btn.style.background = '#0EA5E9'; btn.style.color = '#fff'; }
              else if (cell.today) { btn.style.background = '#E0F2FE'; btn.style.color = '#083344'; }
              else { btn.style.background = ''; btn.style.color = cell.otherMonth ? '#94a3b8' : '#0f172a'; }
            }
          };
          btn.addEventListener('mouseenter', function () { setHover(true); });
          btn.addEventListener('mouseleave', function () { setHover(false); });
          btn.addEventListener('click', function () {
            if (btn.disabled) return;
            // Fix timezone: parse YMD locally instead of new Date(ymd) which treats as UTC
            var ymdParts = cell.ymd.split('-');
            var d = new Date(parseInt(ymdParts[0], 10), parseInt(ymdParts[1], 10) - 1, parseInt(ymdParts[2], 10));
            input.value = format === 'DD/MM/YYYY' ? toDMY(d) : toYMD(d);
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            removePicker();
          });
          grid.appendChild(btn);
        });
      });
      title.textContent = AR_MONTHS[m] + ' ' + y;
    }

    render(current.getFullYear(), current.getMonth());

    btnPrev.addEventListener('click', function () {
      var m = current.getMonth() + 1;
      var y = current.getFullYear();
      if (m > 11) { m = 0; y++; }
      current = new Date(y, m, 1);
      render(y, m);
    });
    btnNext.addEventListener('click', function () {
      var m = current.getMonth() - 1;
      var y = current.getFullYear();
      if (m < 0) { m = 11; y--; }
      current = new Date(y, m, 1);
      render(y, m);
    });

    wrap.appendChild(grid);

    var todayRow = document.createElement('div');
    todayRow.style.cssText = 'margin-top:10px;text-align:center;';
    var btnToday = document.createElement('button');
    btnToday.type = 'button';
    btnToday.textContent = 'اليوم';
    btnToday.style.cssText = 'padding:6px 14px;border:1px solid #0EA5E9;border-radius:8px;background:#E0F2FE;color:#083344;font-weight:700;cursor:pointer;font-size:0.85rem;';
    btnToday.addEventListener('click', function () {
      var d = new Date();
      if (minDate && d < minDate) return;
      if (maxDate && d > maxDate) return;
      input.value = format === 'DD/MM/YYYY' ? toDMY(d) : toYMD(d);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      removePicker();
    });
    todayRow.appendChild(btnToday);
    wrap.appendChild(todayRow);

    var blurCloseTimer = null;
    var __pointerDownInsidePicker = false;
    function removePicker() {
      if (!wrap.parentNode) return;
      if (blurCloseTimer) { clearTimeout(blurCloseTimer); blurCloseTimer = null; }
      document.removeEventListener('click', outside);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('pointerdown', markPointerDown, true);
      document.removeEventListener('mousedown', markPointerDown, true);
      document.removeEventListener('touchstart', markPointerDown, true);
      wrap.parentNode.removeChild(wrap);
      if (input) {
        if (input.dataset) input.dataset.lawDatePicker = '';
        if (input._lawDatePickerWrap === wrap) input._lawDatePickerWrap = null;
      }
    }
    function outside(e) {
      if (wrap.contains(e.target) || input.contains(e.target)) return;
      removePicker();
    }
    function onVisibility() { removePicker(); }
    function onPageHide() { removePicker(); }

    function markPointerDown(e) {
      try {
        __pointerDownInsidePicker = !!(wrap && (wrap.contains(e.target) || (input && input.contains && input.contains(e.target))));
      } catch (_) {
        __pointerDownInsidePicker = false;
      }
    }

    input.addEventListener('blur', function () {
      if (__pointerDownInsidePicker) return;
      blurCloseTimer = setTimeout(removePicker, 220);
    });
    wrap.addEventListener('pointerdown', function () {
      if (blurCloseTimer) { clearTimeout(blurCloseTimer); blurCloseTimer = null; }
    });
    wrap.addEventListener('mousedown', function () {
      if (blurCloseTimer) { clearTimeout(blurCloseTimer); blurCloseTimer = null; }
    });
    wrap.addEventListener('touchstart', function () {
      if (blurCloseTimer) { clearTimeout(blurCloseTimer); blurCloseTimer = null; }
    }, { passive: true });

    document.addEventListener('pointerdown', markPointerDown, true);
    document.addEventListener('mousedown', markPointerDown, true);
    document.addEventListener('touchstart', markPointerDown, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    setTimeout(function () { document.addEventListener('click', outside); }, 100);

    return wrap;
  }

  /**
   * تموضع عنصر (مثل نافذة التقويم) داخل الشاشة المرئية حتى لا يختفي جزء منه.
   * للاستخدام مع أي حقل لاحقاً: استدعِ بعد إلحاق العنصر بـ document.body.
   * @param {DOMRect} anchorRect - ناتج getBoundingClientRect() للحقل (المرجع)
   * @param {HTMLElement} element - العنصر المراد تموضعه (النافذة المنبثقة)
   * @param {number} gap - المسافة بين الحقل والعنصر (بكسلات)
   */
  function positionInViewport(anchorRect, element, gap) {
    gap = gap == null ? 4 : gap;
    var scrollY = window.scrollY || document.documentElement.scrollTop;
    var scrollX = window.scrollX || document.documentElement.scrollLeft;
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var elH = element.offsetHeight || 280;
    var elW = element.offsetWidth || 300;

    var topDoc = scrollY + anchorRect.bottom + gap;
    var fitsBelow = topDoc + elH <= scrollY + vh;
    if (fitsBelow) {
      element.style.top = topDoc + 'px';
    } else {
      var topAbove = scrollY + anchorRect.top - elH - gap;
      element.style.top = Math.max(scrollY, topAbove) + 'px';
    }

    var leftDoc = scrollX + anchorRect.left;
    var maxLeft = scrollX + vw - elW;
    if (maxLeft < scrollX) leftDoc = scrollX;
    else if (leftDoc < scrollX) leftDoc = scrollX;
    else if (leftDoc > maxLeft) leftDoc = maxLeft;
    element.style.left = leftDoc + 'px';
  }

  function positionPicker(wrap, input) {
    var rect = input.getBoundingClientRect();
    positionInViewport(rect, wrap, 4);
  }

  /**
   * تربط ملتقط التاريخ بحقل إدخال.
   * @param {HTMLInputElement} input - حقل الإدخال (نص أو تاريخ)
   * @param {Object} options - اختياري: { format: 'DD/MM/YYYY' | 'YYYY-MM-DD', minDate: Date, maxDate: Date }
   */
  function attachDatePicker(input, options) {
    if (!input || !input.addEventListener) return;
    var opts = options || {};
    input.addEventListener('focus', function openPicker() {
      var existing = input._lawDatePickerWrap;
      if (existing && document.body.contains(existing)) return;
      input.dataset.lawDatePicker = '';
      input._lawDatePickerWrap = null;
      var wrap = createPickerEl(input, opts);
      input._lawDatePickerWrap = wrap;
      document.body.appendChild(wrap);
      positionPicker(wrap, input);
      input.dataset.lawDatePicker = 'open';
      wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  }

  if (typeof window !== 'undefined') {
    window.attachDatePicker = attachDatePicker;
    window.positionInViewport = positionInViewport;
    window.LawDatePicker = { attach: attachDatePicker, positionInViewport: positionInViewport, AR_DAYS: AR_DAYS, AR_MONTHS: AR_MONTHS };
  }
})();
