/* ============================================================================
   Core9 — Industries & Compliance interactions (on top of main.js)
   · hero event card: rows land one by one, the alert turns gold, the response ticks through
   · use-case switcher: click (or it steps on its own while nobody is interacting)
   · count-up on key numbers · data-flow line that draws as you scroll
   ========================================================================== */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ hero event card */
  function heroCard() {
    var card = $('.evt--hero'); if (!card) return;
    var rows = $$('.evt__row', card), rule = $('.evt__rule', card), steps = $$('.evt__steps li', card), clip = $('.evt__clip', card);
    if (reduce) { steps.forEach(function (s) { s.classList.add('is-done'); }); return; }
    rows.forEach(function (r) { if (r.classList.contains('is-hot')) { r.classList.remove('is-hot'); r.dataset.hot = '1'; } });
    gsap.set(rows.concat([rule, clip].filter(Boolean)), { opacity: 0, y: 10 });
    function play() {
      var tl = gsap.timeline({ delay: 0.9 });
      tl.to(rows, { opacity: 1, y: 0, duration: 0.6, stagger: 0.28, ease: 'expo.out' });
      if (clip) tl.to(clip, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '-=0.2');
      tl.call(function () { rows.forEach(function (r) { if (r.dataset.hot) r.classList.add('is-hot'); }); }, null, '+=0.15');
      if (rule) tl.to(rule, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '+=0.1');
      steps.forEach(function (s, i) { tl.call(function () { s.classList.add('is-done'); }, null, i ? '+=0.45' : '+=0.35'); });
    }
    (function wait() { if (document.getElementById('intro')) return setTimeout(wait, 80); play(); })();
  }

  /* --------------------------------------------------- use cases */
  function useCases() {
    var root = $('#uc'); if (!root) return;
    var items = $$('.uc__item', root), cards = $$('.uc__stage .evt', root);
    var cur = 0, auto = !reduce, inView = false, hover = false, t0 = 0, DUR = 5200, raf = 0;
    function show(i, byUser) {
      cur = i;
      items.forEach(function (it, k) { it.classList.toggle('is-on', k === i); it.style.setProperty('--p', 0); });
      cards.forEach(function (c, k) {
        var on = k === i;
        c.classList.toggle('is-on', on);
        var st = $$('.evt__steps li', c);
        st.forEach(function (s) { s.classList.remove('is-done'); });
        if (on) setTimeout(function () { st.forEach(function (s) { s.classList.add('is-done'); }); }, reduce ? 0 : 700);
      });
      if (byUser) auto = false;                 // once someone picks, stop stepping on its own
      t0 = performance.now();
    }
    items.forEach(function (it, i) { it.addEventListener('click', function () { show(i, true); }); });
    root.addEventListener('pointerenter', function () { hover = true; });
    root.addEventListener('pointerleave', function () { hover = false; t0 = performance.now() - (parseFloat(items[cur].style.getPropertyValue('--p')) || 0) * DUR; });
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!auto || !inView) return;
      if (hover) { t0 += 16; return; }
      var p = Math.min(1, (now - t0) / DUR);
      items[cur].style.setProperty('--p', p.toFixed(3));
      if (p >= 1) show((cur + 1) % items.length, false);
    }
    ScrollTrigger.create({ trigger: root, start: 'top 75%', end: 'bottom 20%', onToggle: function (s) { inView = s.isActive; if (inView) t0 = performance.now(); } });
    show(0, false);
    if (auto) raf = requestAnimationFrame(tick);
  }

  /* --------------------------------------------------- count-up */
  function countUps() {
    $$('[data-k]').forEach(function (el) {
      var txt = el.textContent, m = txt.match(/^([^\d]*)([\d][\d,]*(?:\.\d+)?)(.*)$/);
      if (!m || reduce) return;
      var pre = m[1], num = m[2], post = m[3], dec = (num.split('.')[1] || '').length, comma = num.indexOf(',') > -1;
      var target = parseFloat(num.replace(/,/g, '')); if (!isFinite(target)) return;
      var o = { v: 0 };
      function fmt(v) {
        var s = v.toFixed(dec);
        if (comma) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        return pre + s + post;
      }
      el.textContent = fmt(0);
      gsap.to(o, { v: target, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v); }, onComplete: function () { el.textContent = txt; },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  /* --------------------------------------------------- data flow */
  function dataFlow() {
    var flow = $('.flow'); if (!flow) return;
    var steps = $$('.fstep', flow), n = steps.length;
    function set(p) {
      flow.style.setProperty('--fp', p.toFixed(3));
      steps.forEach(function (s, i) { s.classList.toggle('is-on', p >= i / (n - 1) - 0.02); });
    }
    if (reduce) { set(1); return; }
    set(0);
    ScrollTrigger.create({ trigger: flow, start: 'top 78%', end: 'bottom 45%', scrub: 0.6, onUpdate: function (s) { set(s.progress); } });
  }

  /* --------------------------------------------------- evidence fields */
  function records() {
    if (reduce) return;
    $$('.record').forEach(function (r) {
      gsap.from($$('.fields span', r), { opacity: 0, y: 10, scale: 0.94, duration: 0.6, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 80%', once: true } });
    });
  }


  /* ------------------------------------------------------ with / without */
  function initCompare() {
    var tg = $('#cmpToggle'), cmp = $('#cmp'); if (!tg || !cmp) return;
    var btns = $$('button', tg);
    function set(side) {
      btns.forEach(function (b) { var on = b.dataset.side === side; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      tg.classList.toggle('is-without', side === 'without');
      cmp.classList.toggle('is-with', side === 'with');
      cmp.classList.toggle('is-without', side === 'without');
      if (!reduce) gsap.fromTo($$(side === 'with' ? '.cmp__yes' : '.cmp__no', cmp), { x: side === 'with' ? 14 : -14 }, { x: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out' });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.side); }); });
    if (!reduce) {
      gsap.from($$('.cmp__row', cmp), { y: 30, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: cmp, start: 'top 80%', once: true } });
      set('without');
      ScrollTrigger.create({ trigger: cmp, start: 'top 55%', once: true, onEnter: function () { setTimeout(function () { set('with'); }, 500); } });
    }
  }

  function boot() {
    heroCard(); useCases(); countUps(); dataFlow(); records(); initCompare();
    ScrollTrigger.refresh();
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(boot, 40); });
  var rt = null;
  function remeasure() { clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 120); }
  $$('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', remeasure, { once: true }); });
  window.addEventListener('load', remeasure);
})();
