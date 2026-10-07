/* ============================================================================
   Core9 — DriveSense page interactions (on top of main.js)
   · hero brand reveal
   · sticky feature showcase (image + live overlays swap as the copy scrolls)
   · following-distance meter loop on the "risk" frame
   · portal screen tilts flat on scroll
   · product video: scroll-expand, chapters, click to pause/play
   · with / without comparison toggle
   ========================================================================== */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ hero brand */
  function heroBrand() {
    var b = $('.hero__brand'); if (!b) return;
    if (reduce) { b.style.opacity = 1; return; }
    (function wait() {
      if (document.getElementById('intro')) return setTimeout(wait, 80);
      gsap.fromTo(b, { opacity: 0, y: 18, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out' });
    })();
  }

  /* ------------------------------------------------------ feature showcase */
  var riskTl = null;
  function initFeatures() {
    var items = $$('.fitem'), shots = $$('.fshot'), rail = $$('#featRail li');
    if (!items.length) return;
    var cur = -1;
    function setActive(i) {
      if (i === cur) return; cur = i;
      if (window.innerWidth <= 960) { if (riskTl) riskTl.play(); return; }
      shots.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      items.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      rail.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      if (riskTl) { i === 2 ? riskTl.restart(true) : riskTl.pause(0); }
    }
    function drawChecks(i) {
      if (reduce) return;
      gsap.fromTo($$('.checks path', items[i]), { strokeDashoffset: 20 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, delay: 0.25, ease: 'power2.out', overwrite: true });
    }
    var mm = gsap.matchMedia();

    /* desktop: pin the block; each feature is one "step" and the scroll snaps to it */
    mm.add('(min-width: 961px)', function () {
      var n = items.length, step = Math.round(window.innerHeight * 0.75);
      var st = ScrollTrigger.create({
        trigger: '.feat__grid', start: 'center center', end: '+=' + step * (n - 1),
        pin: true, anticipatePin: 1,
        onUpdate: function (self) {
          var p = self.progress * (n - 1);
          var i = Math.round(p);
          if (i !== cur) { setActive(i); drawChecks(i); }
          rail.forEach(function (li, k) { li.style.setProperty('--p', Math.max(0, Math.min(1, p - k + 1)).toFixed(3)); });
        }
      });
      // snap: once scrolling stops inside the pinned range, glide to the nearest step
      // (direction-aware, so a small nudge is enough to move to the next feature)
      var snapping = false;
      function snap() {
        if (snapping || !st.isActive && (window.scrollY < st.start || window.scrollY > st.end)) return;
        var y = window.scrollY; if (y < st.start - 2 || y > st.end + 2) return;
        var p = (y - st.start) / (st.end - st.start) * (n - 1);
        var dir = st.direction || 1, frac = p - Math.floor(p);
        var target = dir > 0 ? (frac > 0.12 ? Math.ceil(p) : Math.floor(p)) : (frac < 0.88 ? Math.floor(p) : Math.ceil(p));
        target = Math.max(0, Math.min(n - 1, target));
        var ty = st.start + (st.end - st.start) * target / (n - 1);
        if (Math.abs(ty - y) < 3) return;
        snapping = true;
        var L = window.C9Lenis;
        if (L) L.scrollTo(ty, { duration: 0.75, easing: function (x) { return 1 - Math.pow(1 - x, 3); }, onComplete: function () { snapping = false; } });
        else { window.scrollTo({ top: ty, behavior: 'smooth' }); setTimeout(function () { snapping = false; }, 700); }
      }
      var timer = null;
      function onScroll() { if (snapping) return; clearTimeout(timer); timer = setTimeout(snap, 140); }
      if (window.C9Lenis) window.C9Lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });
      rail.forEach(function (li, k) {
        li.onclick = function () {
          var ty = st.start + (st.end - st.start) * k / (n - 1);
          if (window.C9Lenis) window.C9Lenis.scrollTo(ty, { duration: 1 }); else window.scrollTo({ top: ty, behavior: 'smooth' });
        };
      });
      setActive(0); drawChecks(0);
      return function () {
        if (window.C9Lenis) window.C9Lenis.off('scroll', onScroll); else window.removeEventListener('scroll', onScroll);
      };
    });

    /* phones / small tablets: simple stacked list */
    mm.add('(max-width: 960px)', function () {
      items.forEach(function (it, i) {
        it.classList.add('is-on');
        if (!reduce) gsap.from([$('.fitem__no', it), $('h3', it), $('.checks', it)], {
          y: 30, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out',
          scrollTrigger: { trigger: it, start: 'top 80%', once: true }
        });
      });
    });

    // following-distance meter (frame 03)
    var gap = $('.fgap'), val = $('.fgap__v'), bar = $('.fgap__bar i');
    if (gap && !reduce) {
      var o = { s: 2.4 };
      riskTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.4, delay: 0.9 })
        .call(function () { gap.classList.remove('is-warn'); })
        .fromTo(o, { s: 2.4 }, {
          s: 1.4, duration: 2.6, ease: 'power1.inOut',
          onUpdate: function () { val.textContent = o.s.toFixed(1) + ' s'; bar.style.width = (o.s / 3 * 100).toFixed(1) + '%'; }
        })
        .call(function () { gap.classList.add('is-warn'); })
        .to({}, { duration: 2.2 })
        .to(o, {
          s: 2.4, duration: 1.4, ease: 'power2.out',
          onStart: function () { gap.classList.remove('is-warn'); },
          onUpdate: function () { val.textContent = o.s.toFixed(1) + ' s'; bar.style.width = (o.s / 3 * 100).toFixed(1) + '%'; }
        })
        .to({}, { duration: 1 });
      if (cur === 2) riskTl.play();
    }
  }

  /* ---------------------------------------------------------------- portal */
  function initPortal() {
    var scr = $('#portalScreen'); if (!scr || reduce) { if (scr) scr.style.transform = 'none'; return; }
    gsap.fromTo(scr, { rotateX: 26, scale: 0.88, y: 40 }, {
      rotateX: 0, scale: 1, y: 0, ease: 'none',
      scrollTrigger: { trigger: '#portalStage', start: 'top 92%', end: 'top 22%', scrub: 0.6 }
    });
    gsap.fromTo('.portal__sheen', { backgroundPosition: '120% 0' }, {
      backgroundPosition: '-60% 0', ease: 'none',
      scrollTrigger: { trigger: '#portalStage', start: 'top 70%', end: 'bottom 30%', scrub: true }
    });
    gsap.fromTo('.portal__chip--a', { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '#portalStage', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.portal__chip--b', { y: -30 }, { y: 50, ease: 'none', scrollTrigger: { trigger: '#portalStage', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* -------------------------------------------- video: scroll-expand + UI */
  function initVideo() {
    var sec = $('#showcase'), v = $('#dsVideo'); if (!sec || !v) return;
    var toggle = $('#vToggle'), chs = $$('.vch');
    var CH = chs.map(function (c) { return parseFloat(c.dataset.t); }), DUR = 32.3;
    var userPaused = false, inView = false;

    function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function sync() {
      toggle.classList.toggle('is-paused', v.paused);
      toggle.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
    }
    function flip() {
      if (!sec.classList.contains('is-open')) return;           // no play/pause while it's still a teaser
      if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); }
    }
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    v.addEventListener('click', flip);
    toggle.addEventListener('click', flip);
    v.addEventListener('loadedmetadata', function () { if (v.duration) DUR = v.duration; });
    v.addEventListener('timeupdate', function () {
      var t = v.currentTime;
      chs.forEach(function (c, i) {
        var a = CH[i], b = i < CH.length - 1 ? CH[i + 1] : DUR;
        var on = t >= a && t < b;
        c.classList.toggle('is-on', on);
        c.style.setProperty('--p', on ? ((t - a) / (b - a)).toFixed(3) : (t >= b ? 1 : 0));
      });
    });
    chs.forEach(function (c, i) { c.style.setProperty('--grow', ((i < CH.length - 1 ? CH[i + 1] : DUR) - CH[i]).toFixed(2)); });
    chs.forEach(function (c, i) {
      c.addEventListener('click', function () { v.currentTime = CH[i] + 0.05; userPaused = false; if (opened) play(); });
    });
    // v4: the video only plays once it has opened up (title gone, full screen). Before that it
    // stays blurred and still; scrolling back up pauses it again.
    var opened = false;
    function setOpen(on) {
      if (on === opened) return; opened = on;
      sec.classList.toggle('is-open', on);
      if (on && inView && !userPaused) play(); else if (!on) v.pause();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          inView = e.isIntersecting;
          if (inView && opened && !userPaused) play(); else if (!inView) v.pause();
        });
      }, { threshold: 0.15 }).observe(sec);
    }

    // title → words, same white-with-sheen treatment as the homepage expand
    var title = $('#vTitle'), words = [];
    title.innerHTML = title.textContent.split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    words = $$('.w', title);
    words.forEach(function (w, i) { w.classList.add('is-shine'); w.style.setProperty('--o', (i / Math.max(1, words.length - 1)).toFixed(3)); });

    /* desktop: the card grows into a true full-screen video (like v1). The frame is covered, but the
       crop is biased (object-position in CSS) so the captions at the bottom-left are never cut.
       phones: a portrait screen can't show 16:9 full-screen without losing the captions, so it opens
       to a full-width 16:9 band instead, with the chapters under it. */
    var frame = $('#vFrame'), bar = $('#vBar');
    var R = { x: 0, y: 0, w: 0, h: 0 }, C = { x: 0, y: 0, w: 0, h: 0 }, VW = 0, VH = 0, mobile = false;
    function layout() {
      VW = sec.clientWidth; VH = sec.clientHeight; mobile = VW < 860;
      if (mobile) {
        var h = VW * 9 / 16, top = Math.max(VH * 0.3, (VH - h) / 2);
        R = { x: 0, y: top, w: VW, h: h };
        bar.style.top = (R.y + R.h + 18) + 'px'; bar.style.bottom = 'auto';
      } else {
        R = { x: 0, y: 0, w: VW, h: VH };
        bar.style.top = ''; bar.style.bottom = '';                          // bottom-right row, clear of the captions
      }
      gsap.set(v, { left: R.x, top: R.y, width: R.w, height: R.h });
      var cw = mobile ? VW * 0.72 : Math.min(VW * 0.46, 760), ch = cw * 9 / 16;
      C = { x: (VW - cw) / 2, y: mobile ? R.y + (R.h - ch) / 2 : (VH - ch) / 2 + VH * 0.04, w: cw, h: ch };
    }
    function clipAt(k) {                     // k: 0 = card, 1 = full screen (desktop) / full-width band (phone)
      var x = C.x + (R.x - C.x) * k, y = C.y + (R.y - C.y) * k, w = C.w + (R.w - C.w) * k, h = C.h + (R.h - C.h) * k;
      var rad = 28 * (1 - k);
      return 'inset(' + y.toFixed(1) + 'px ' + (VW - x - w).toFixed(1) + 'px ' + (VH - y - h).toFixed(1) + 'px ' + x.toFixed(1) + 'px round ' + rad.toFixed(1) + 'px)';
    }
    layout();
    window.addEventListener('resize', function () { layout(); ScrollTrigger.refresh(); });

    // title is on screen as soon as the section arrives (time-based, not scrubbed)
    if (!reduce) {
      gsap.set(words, { opacity: 0, y: 34, filter: 'blur(10px)' });
      gsap.set('#vContent .eyebrow', { opacity: 0, y: 14 });
      ScrollTrigger.create({
        trigger: sec, start: 'top 80%', once: true,
        onEnter: function () {
          gsap.to('#vContent .eyebrow', { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' });
          gsap.to(words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.07, ease: 'expo.out', delay: 0.05 });
        }
      });
    }

    if (reduce) {
      frame.style.clipPath = clipAt(1);
      gsap.set(bar, { opacity: 1, y: 0 }); v.style.setProperty('--vblur', '0px'); v.style.setProperty('--vdim', '1'); setOpen(true);
      $('#vContent').style.display = 'none';
      return;
    }
    /* v4 sequence (all while pinned — the portal section keeps its breathing room above):
       hold    — small card, video blurred + still, title on top
       fade    — title fades out
       expand  — card opens to full screen, blur lifts; once open the video starts playing */
    var o = { k: 0, blur: 16, dim: 0.72 };
    function paint() {
      frame.style.clipPath = clipAt(o.k);
      v.style.setProperty('--vblur', o.blur.toFixed(2) + 'px');
      v.style.setProperty('--vdim', o.dim.toFixed(3));
    }
    paint();
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, start: 'top top', end: mobile ? '+=160%' : '+=230%', pin: true, scrub: 0.8,
        invalidateOnRefresh: true,
        onRefresh: function () { layout(); paint(); },
        onUpdate: function (self) { setOpen(self.progress > 0.68); }
      }
    });
    tl.to({}, { duration: 0.42 })                                                                   // hold
      .to(['#vContent .eyebrow', words], { opacity: 0, y: -26, filter: 'blur(8px)', duration: 0.26, stagger: 0.02 }, 0.42)
      .to(o, { k: 1, blur: 0, dim: 1, duration: 1, ease: 'power2.inOut', onUpdate: paint }, 0.5)
      .fromTo(v, { scale: 1.1 }, { scale: 1, duration: 1, ease: 'power2.inOut' }, 0.5)
      .to(bar, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 1.35)
      .to({}, { duration: 0.35 });

    /* custom cursor: "Scroll to watch" until the video is open, then pause / play */
    var cur = $('#sCursor'), fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (cur && fine) {
      document.body.appendChild(cur);          // outside the pinned section so position:fixed stays true
      sec.classList.add('has-cursor');
      var cx = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3.out' }), cy = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3.out' });
      var label = $('span', cur);
      function setLabel() {
        label.textContent = !sec.classList.contains('is-open') ? 'Scroll to watch' : (v.paused ? 'Play' : 'Pause');
      }
      sec.addEventListener('pointermove', function (e) {
        var overBar = !!e.target.closest('.vbar');
        cur.classList.toggle('is-hidden', overBar);
        cx(e.clientX); cy(e.clientY); setLabel();
      });
      sec.addEventListener('pointerenter', function (e) { gsap.set(cur, { x: e.clientX, y: e.clientY }); cur.classList.add('is-on'); setLabel(); });
      sec.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
      v.addEventListener('play', setLabel); v.addEventListener('pause', setLabel);
      if (window.C9Lenis) window.C9Lenis.on('scroll', setLabel);
    }
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
      // start on "without", flip to "with" as the table arrives — shows the change once
      set('without');
      ScrollTrigger.create({ trigger: cmp, start: 'top 55%', once: true, onEnter: function () { setTimeout(function () { set('with'); }, 500); } });
    }
  }

  /* --------------------------------------------------------- capabilities */
  function initCaps() {
    var grid = $('.caps__grid'), cols = $$('.caps__col');
    if (grid && cols.length) {
      var i = 0, timer = null, hover = -1, visible = false;
      function show(k) { cols.forEach(function (c, j) { c.classList.toggle('is-hi', j === k); }); grid.classList.add('is-cycling'); }
      function tick() { if (hover < 0 && visible) { show(i); i = (i + 1) % cols.length; } }
      function start() { if (!timer) { tick(); timer = setInterval(tick, 2600); } }
      function stop() { clearInterval(timer); timer = null; }
      cols.forEach(function (c, j) {
        c.addEventListener('pointerenter', function () { hover = j; show(j); });
        c.addEventListener('pointerleave', function () { hover = -1; i = (j + 1) % cols.length; });
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.35 }).observe(grid);
      } else { visible = true; start(); }
    }
    if (reduce) return;
    $$('.caps__col').forEach(function (col) {
      gsap.from($$('.cap', col), { y: 26, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: col, start: 'top 82%', once: true } });
    });
  }

  function boot() {
    heroBrand(); initFeatures(); initPortal(); initVideo(); initCompare(); initCaps();
    ScrollTrigger.sort();   // triggers below the pinned video were created earlier (main.js) — re-order by position
    ScrollTrigger.refresh();
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(boot, 30); });

  /* v5: anything that loads late and changes height (images, fonts) must re-measure the pinned
     sections — otherwise a pin starts/ends at a stale position and the page visibly jumps. */
  var rt = null;
  function remeasure() { clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 120); }
  Array.prototype.slice.call(document.images).forEach(function (im) { if (!im.complete) im.addEventListener('load', remeasure, { once: true }); });
  window.addEventListener('load', remeasure);
})();
