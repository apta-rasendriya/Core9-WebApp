/* ============================================================================
   Core9 — shared interactions (v4: categorized nav, guarded hero reveal)
   GSAP + ScrollTrigger + SplitText + Lenis (all vendored locally, no CDN).
   Effect vocabulary borrowed from React Bits, rebuilt in vanilla for Core9:
   Split/Blur text reveal · Scroll Reveal (scrubbed words) · Decrypted/scramble
   labels · Shiny text · Magnet buttons · Spotlight cards · Tilted card ·
   Scroll Stack · Count Up · Dot-grid (world map) · Grid Distortion (hero).
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.remove('js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, window.SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* -------------------------------------------------------- smooth scroll */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    window.C9Lenis = lenis;
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------- helpers */
  function scramble(el, duration) {
    if (!el || el._scr) return;
    el._scr = true;
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/';
    var n = text.length, t0 = performance.now(); duration = duration || 900;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / duration);
      var reveal = Math.floor(p * p * n * 1.05), out = '';
      for (var i = 0; i < n; i++) {
        var c = text.charAt(i);
        out += (c === ' ' || i < reveal) ? c : glyphs.charAt((Math.random() * glyphs.length) | 0);
      }
      el.textContent = p < 1 ? out : text;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function fmt(v, dec, comma) {
    var s = v.toFixed(dec);
    if (comma) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return s;
  }

  /* --------------------------------------------------------------- intro */
  function runIntro(done) {
    var el = $('#intro');
    var seen = false;
    try { seen = sessionStorage.getItem('c9-intro') === '1'; } catch (e) {}
    if (!el || reduce || seen || window.C9_NOINTRO || /nointro/.test(location.search)) { if (el) el.remove(); done(); return; }
    try { sessionStorage.setItem('c9-intro', '1'); } catch (e) {}
    if (lenis) lenis.stop();
    var mark = $('.intro__mark', el), bar = $('.intro__bar i', el);
    gsap.set(mark, { scale: 0.86 });
    gsap.timeline({
      onComplete: function () { el.remove(); if (lenis) lenis.start(); done(); }
    })
      .to(mark, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' }, 0)
      .to(bar, { scaleX: 1, duration: 1.05, ease: 'power2.inOut' }, 0.05)
      .to(mark, { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' }, 1.1)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 1.2);
  }

  /* once a masked reveal has played, drop the clipping mask so nothing (g, y, p, s…) can ever be cut */
  function unclip(sp) {
    if (!sp) return;
    (sp.masks || []).forEach(function (m) { m.style.setProperty('overflow', 'visible', 'important'); });
  }

  /* ---------------------------------------------------------------- hero */
  function revealHero() {
    var h1 = $('#heroTitle');
    var words = [], split = null;
    if (window.SplitText) {
      split = SplitText.create(h1, { type: 'lines,words', mask: 'words' });
      var shinyRe = new RegExp('^(' + (h1.dataset.shiny || 'Intelligent').split('|').map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')$');
      split.words.forEach(function (w) { if (shinyRe.test(w.textContent.trim())) w.classList.add('shiny'); });
      words = split.words;
      (split.masks || []).forEach(function (m) { m.classList.add('c9-mask'); });
    }
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: function () { unclip(split); } });
    if ($('.hero .eyebrow')) tl.to('.hero .eyebrow', { opacity: 1, duration: 0.9, onStart: function () { scramble($('.hero .eyebrow'), 1100); } }, 0);
    if (words.length) tl.from(words, { yPercent: 118, rotate: 4, opacity: 0, duration: 1.5, stagger: 0.085 }, 0.1);
    if ($('.hero__sub')) tl.fromTo('.hero__sub', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3 }, 0.6);
    if ($('.hero__cta')) tl.fromTo('.hero__cta > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1 }, 0.8);
    if ($('.hero__trust li')) tl.fromTo('.hero__trust li', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 1.05);
    if ($('.hero [data-hero-in]')) tl.fromTo('.hero [data-hero-in]', { y: 30, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.3, stagger: 0.12 }, 0.35);
    if (window.C9Hero) window.C9Hero.start();
  }

  /* ----------------------------------------------------------------- nav */
  function initNav() {
    var nav = $('#nav'), last = 0;
    function onY(y, dir) {
      nav.classList.toggle('is-scrolled', y > 40);
      /* v3: navbar is sticky — always visible, never auto-hides */
    }
    if (lenis) {
      lenis.on('scroll', function (e) { onY(e.scroll, e.direction); });
    } else {
      window.addEventListener('scroll', function () {
        var y = window.scrollY; onY(y, y > last ? 1 : -1); last = y;
      }, { passive: true });
    }
    /* v4: every top-level category is a dropdown. Hover-intent on desktop (small delay so menus don't
       flicker while the pointer travels), click/tap to toggle, Esc or click-outside to close. */
    var items = $$('.nav__item');
    var hoverOK = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    function closeAll(except) {
      items.forEach(function (it) {
        if (it === except) return;
        it.classList.remove('is-open');
        var b = $('button', it); if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
    items.forEach(function (it) {
      var b = $('button', it); if (!b) return;
      var tOpen = null, tClose = null;
      function open() { closeAll(it); it.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        it.classList.contains('is-open') ? closeAll() : open();
      });
      if (hoverOK) {
        it.addEventListener('pointerenter', function () { clearTimeout(tClose); tOpen = setTimeout(open, 90); });
        it.addEventListener('pointerleave', function () { clearTimeout(tOpen); tClose = setTimeout(function () { it.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }, 220); });
      }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav__item')) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

    // mobile menu: one category open at a time
    $$('.mnav__group').forEach(function (g, i, all) {
      var h = $('.mnav__h', g);
      h.addEventListener('click', function () {
        var open = !g.classList.contains('is-open');
        all.forEach(function (o) { o.classList.remove('is-open'); $('.mnav__h', o).setAttribute('aria-expanded', 'false'); });
        if (open) { g.classList.add('is-open'); h.setAttribute('aria-expanded', 'true'); }
      });
    });

    var burger = $('#burger'), mnav = $('#mnav');
    function setMenu(open) {
      nav.classList.toggle('is-menu', open); mnav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
      if (lenis) open ? lenis.stop() : lenis.start();
    }
    burger.addEventListener('click', function () { setMenu(!mnav.classList.contains('is-open')); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ------------------------------------------------------ anchor scrolling */
  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      a.addEventListener('click', function (e) {
        var t = $(id); if (!t) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(t, { offset: id === '#products' ? -10 : 0, duration: 1.7, easing: function (x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); } });
        else t.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* --------------------------------------------- pointer micro-interactions */
  function initPointerFX() {
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (!fine) return;
    $$('.magnet').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
    // tilted product frames
    $$('.pcard__media').forEach(function (m) {
      var tilt = $('.tilt', m);
      var rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      var ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      var tx = gsap.quickTo(tilt, 'x', { duration: 0.9, ease: 'power3.out' });
      var ty = gsap.quickTo(tilt, 'y', { duration: 0.9, ease: 'power3.out' });
      m.addEventListener('pointermove', function (e) {
        var r = m.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 5); rx(-py * 3.5); tx(px * -9); ty(py * -6);
      });
      m.addEventListener('pointerleave', function () { rx(0); ry(0); tx(0); ty(0); });
    });
  }

  /* ---------------------------------------------------- generic reveals */
  function initReveals() {
    // masked line reveal for section headings
    $$('.split').forEach(function (el) {
      if (!window.SplitText) { el.classList.add('is-split'); return; }
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          el.classList.add('is-split');
          (self.masks || []).forEach(function (m) { m.classList.add('c9-mask'); });
          return gsap.from(self.lines, {
            yPercent: 112, rotate: 2, duration: 1.4, stagger: 0.11, ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onComplete: function () { unclip(self); }
          });
        }
      });
    });
    // scrambled eyebrows
    $$('.eyebrow[data-scramble]').forEach(function (el) {
      if (el.closest('.hero')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { scramble(el, 900); } });
    });
    // fade-up + un-blur
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 91%', once: true,
      onEnter: function (els) {
        gsap.to(els, {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, stagger: 0.11, ease: 'expo.out', overwrite: true,
          onComplete: function () { els.forEach(function (e) { e.classList.add('is-in'); gsap.set(e, { clearProps: 'all' }); }); }
        });
      }
    });
  }

  /* --------------------------------------------- statement (scroll reveal) */
  function initStatement() {
    var el = $('#statement'); if (!el) return;
    var words = [];
    (function walk(node, isKey) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'w' + (isKey ? ' k' : ''); s.textContent = tok;
            frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n, n.classList.contains('k') || isKey);
      });
    })(el, false);
    if (reduce) { words.forEach(function (w) { w.style.opacity = 1; w.style.filter = 'none'; }); return; }
    gsap.to(words, {
      opacity: 1, filter: 'blur(0px)', ease: 'none', stagger: { each: 0.1 }, duration: 0.5,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 52%', scrub: 0.6 }
    });
  }

  /* --------------------------------------------- products (scroll stack) */
  function initStack() {
    var cards = $$('.pcard'); if (!cards.length) return;
    cards.forEach(function (card, i) {
      var scrim = document.createElement('div');
      scrim.style.cssText = 'position:absolute;inset:0;z-index:6;pointer-events:none;border-radius:inherit;background:#08050e;opacity:0';
      card.appendChild(scrim);
      var next = cards[i + 1];
      if (next && !reduce) {
        gsap.to(card, {
          scale: 0.925, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 88%', end: 'top 22%', scrub: true }
        });
        gsap.to(scrim, {
          opacity: 0.6, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 88%', end: 'top 22%', scrub: true }
        });
      }
      var img = $('img.ph', card);
      // check-marks draw in
      var paths = $$('.checks path', card);
      if (!reduce) gsap.from(paths, {
        strokeDashoffset: 20, duration: 0.9, stagger: 0.14, ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 62%', once: true }
      });
      // body copy rises in
      var kids = [$('h3', card), $('p', card), $('.checks', card), $('.pcard__cta', card)];
      if (!reduce) gsap.from(kids, {
        y: 34, opacity: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 72%', once: true }
      });
    });
  }

  /* ------------------------------------------------- bento (system) extras */
  function initBento() {
    if (reduce) return;
    $$('.bcard').forEach(function (c) {
      var iso = $('.bcard__iso', c);
      gsap.fromTo(iso, { backgroundPosition: '0px 0px' }, {
        backgroundPosition: '72px 41.6px', ease: 'none',
        scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ------------------------------------------------------ scroll-expand */
  function initExpand() {
    var sec = $('#why'); if (!sec) return;
    var title = $('#expTitle');
    var words = [];
    (function walk(node, isGrad) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = tok;
            frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          var g = n.classList.contains('grad');
          if (g) n.classList.remove('grad');
          walk(n, g || isGrad);
        }
      });
    })(title, false);
    words.forEach(function (w, i) { w.classList.add('is-shine'); w.style.setProperty('--o', (i / Math.max(1, words.length - 1)).toFixed(3)); });
    if (reduce) {
      gsap.set('#expFrame', { clipPath: 'inset(0% round 0px)' });
      return;
    }
    var mobile = window.innerWidth < 860;
    var start = mobile ? 'inset(26% 8% 26% 8% round 30px)' : 'inset(23% 29% 23% 29% round 44px)';
    gsap.set(words, { opacity: 0, y: 46, filter: 'blur(10px)' });
    gsap.set('#expSub', { opacity: 0, y: 24 });
    gsap.set('.layer', { opacity: 0, y: 46 });
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, start: 'top top', end: mobile ? '+=230%' : '+=290%', pin: true, scrub: 0.7, anticipatePin: 1 }
    });
    tl.fromTo('#expFrame', { clipPath: start }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.3, ease: 'power2.inOut' }, 0)
      .fromTo('#expFrame img', { scale: 1.32 }, { scale: 1.02, duration: 2.4 }, 0)
      .to(words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.11, ease: 'power2.out' }, 0.75)
      .to('#expSub', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 1.75)
      .to('.layer', { opacity: 1, y: 0, duration: 0.55, stagger: 0.2, ease: 'power2.out' }, 2.05)
      .to({}, { duration: 0.6 });
  }

  /* --------------------------------------------------------- stats + map */
  function initStats() {
    $$('[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), comma = !!el.dataset.comma;
      if (reduce) { el.textContent = fmt(target, dec, comma); return; }
      var o = { v: 0 };
      el.textContent = fmt(0, dec, comma);
      gsap.to(o, {
        v: target, duration: 2.4, ease: 'power3.out',
        scrollTrigger: { trigger: '.stats', start: 'top 88%', once: true },
        onUpdate: function () { el.textContent = fmt(o.v, dec, comma); }
      });
    });
  }

  function initMap() {
    var M = window.C9_MAP, box = $('#mapbox'), cv = $('#mapCanvas');
    if (!M || !box || !cv) return;
    var ctx = cv.getContext('2d');
    var n = M.dots.length / 2;
    box.style.aspectRatio = M.W + ' / ' + M.H;
    // city pins: three main hubs highlighted, the rest subtle
    var origin = null;
    M.cities.forEach(function (c) {
      var p = document.createElement('div');
      p.className = 'pin' + (c.m ? ' is-main' : '') + (c.s ? ' is-' + c.s : '');
      p.style.left = (c.x / M.W * 100) + '%';
      p.style.top = (c.y / M.H * 100) + '%';
      p.innerHTML = '<i></i><span>' + c.n + '</span>';
      box.appendChild(p);
      if (c.n === 'Lahore') origin = [c.x, c.y];
    });
    var maxD = 0, delays = new Float32Array(n), i;
    for (i = 0; i < n; i++) {
      var d = Math.hypot(M.dots[i * 2] - origin[0], M.dots[i * 2 + 1] - origin[1]);
      delays[i] = d; if (d > maxD) maxD = d;
    }
    for (i = 0; i < n; i++) delays[i] = delays[i] / maxD * 0.65;
    var w = 0, h = 0, dpr = 1, s = 1;
    var ptr = { x: -999, y: -999 };
    var state = { reveal: reduce ? 1 : 0 };
    var visible = false;
    function size() {
      var r = box.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      s = w / M.W;
    }
    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var rad = Math.max(1.15, 1.75 * s);
      for (var k = 0; k < n; k++) {
        var x = M.dots[k * 2] * s, y = M.dots[k * 2 + 1] * s;
        var a = Math.min(1, Math.max(0, (state.reveal - delays[k]) / 0.35));
        if (a <= 0) continue;
        var hi = M.flag[k];
        var tw = 0.5 + 0.5 * Math.sin(now * 0.0011 + k * 12.9898);
        var al = (hi ? 0.5 + tw * 0.14 : 0.13 + tw * 0.06) * a;
        var r = hi ? rad * 1.12 : rad;
        // v3: hover response kept very subtle — a faint local brighten only, no jump in size or position
        var dx = x - ptr.x, dy = y - ptr.y;
        var dd = dx * dx + dy * dy;
        if (dd < 3600) {
          var f = 1 - Math.sqrt(dd) / 60;
          al += f * 0.16; r += f * 0.35 * s;
        }
        ctx.fillStyle = 'rgba(225,195,255,' + Math.min(1, al).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      }
    }
    function loop(now) { if (visible) draw(now); requestAnimationFrame(loop); }
    size(); window.addEventListener('resize', size);
    box.addEventListener('pointermove', function (e) { var r = box.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; });
    box.addEventListener('pointerleave', function () { ptr.x = ptr.y = -999; });
    ScrollTrigger.create({
      trigger: box, start: 'top 95%', end: 'bottom 5%',
      onToggle: function (self) { visible = self.isActive; }
    });
    if (reduce) { visible = true; draw(0); return; }
    gsap.to(state, { reveal: 1.05, duration: 2.8, ease: 'power2.inOut', scrollTrigger: { trigger: box, start: 'top 80%', once: true } });
    gsap.from('.pin', { scale: 0, opacity: 0, duration: 1, stagger: { each: 0.06, from: 'random' }, ease: 'back.out(2)', scrollTrigger: { trigger: box, start: 'top 70%', once: true } });
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ ROI */
  function initROI() {
    var ids = ['sites', 'cams', 'hrs', 'cost'];
    var el = {}, out = {};
    ids.forEach(function (k) { el[k] = $('#r-' + k); out[k] = $('#o-' + k); });
    if (!el.sites) return;
    var xs = { cams: $('#x-cams'), hrs: $('#x-hrs'), cost: $('#x-cost'), ch: $('#x-ch') };
    var cur = { cams: 0, hrs: 0, cost: 0, ch: 0 };
    function fmtCh(v) { return v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'K' : Math.round(v).toString(); }
    function paint() {
      xs.cams.textContent = Math.round(cur.cams).toLocaleString('en-US');
      xs.hrs.textContent = Math.round(cur.hrs).toLocaleString('en-US');
      xs.cost.textContent = '$' + Math.round(cur.cost).toLocaleString('en-US');
      xs.ch.textContent = fmtCh(cur.ch);
    }
    function calc(first) {
      var sites = +el.sites.value, cams = +el.cams.value, hrs = +el.hrs.value, cost = +el.cost.value;
      ids.forEach(function (k) {
        var e = el[k]; e.style.setProperty('--p', ((e.value - e.min) / (e.max - e.min) * 100) + '%');
      });
      out.sites.textContent = sites; out.cams.textContent = cams; out.hrs.textContent = hrs; out.cost.textContent = '$' + cost;
      var t = { cams: sites * cams, hrs: sites * hrs * 52, cost: sites * hrs * 52 * cost, ch: sites * cams * 24 * 365 };
      if (first || reduce) { Object.assign(cur, t); paint(); return; }
      gsap.to(cur, Object.assign({ duration: 0.7, ease: 'power3.out', overwrite: true, onUpdate: paint }, t));
    }
    ids.forEach(function (k) { el[k].addEventListener('input', function () { calc(false); }); });
    calc(true);
  }

  /* ------------------------------------------------------------------ FAQ */
  function initFAQ() {
    var items = $$('.qa');
    items.forEach(function (qa) {
      $('.qa__q', qa).addEventListener('click', function () {
        var open = !qa.classList.contains('is-open');
        items.forEach(function (o) { o.classList.remove('is-open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); });
        if (open) { qa.classList.add('is-open'); $('.qa__q', qa).setAttribute('aria-expanded', 'true'); }
        setTimeout(function () { ScrollTrigger.refresh(); }, 650);
      });
    });
  }

  /* ---------------------------------------------------- footer wordmark */
  function initWordmark() {
    var wrap = $('#wordmark'); if (!wrap) return;
    var svg = $('svg', wrap), c = $('#wmCircle', wrap); if (!svg || !c) return;
    var vb = svg.viewBox.baseVal;
    var pos = { x: vb.x - 200, y: vb.y + vb.height / 2, r: vb.height * 0.85 };
    function apply() { c.setAttribute('cx', pos.x); c.setAttribute('cy', pos.y); c.setAttribute('r', pos.r); }
    apply();
    var tween = null;
    if (!reduce) ScrollTrigger.create({
      trigger: wrap, start: 'top 92%', once: true,
      onEnter: function () {
        tween = gsap.to(pos, { x: vb.x + vb.width + 200, duration: 2.6, ease: 'power2.inOut', onUpdate: apply });
      }
    });
    if (!fine) { pos.x = vb.x + vb.width / 2; apply(); return; }
    var fx = gsap.quickTo(pos, 'x', { duration: 0.6, ease: 'power3.out', onUpdate: apply });
    var fy = gsap.quickTo(pos, 'y', { duration: 0.6, ease: 'power3.out', onUpdate: apply });
    var footer = $('.footer');
    footer.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect();
      if (tween && tween.isActive()) tween.kill();
      fx(vb.x + (e.clientX - r.left) / r.width * vb.width);
      fy(vb.y + (e.clientY - r.top) / r.height * vb.height);
    });
  }

  /* ---------------------------------------------------------- use-case library (tabs) */
  function initUseCases() {
    $$('[data-ulib]').forEach(function (root) {
      var tabs = $$('.ulib__tab', root), panels = $$('.ulib__panel', root);
      function select(i, focus) {
        tabs.forEach(function (t, j) { var on = j === i; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
        panels.forEach(function (p, j) { var on = j === i; p.classList.toggle('is-on', on); p.hidden = !on; });
        if (focus) tabs[i].focus();
        var bar = tabs[i].parentNode, t = tabs[i];
        if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: t.offsetLeft - (bar.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
        if (!reduce) {
          gsap.fromTo($$('.ulib__side, .ucard', panels[i]), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.035, ease: 'expo.out', clearProps: 'transform,opacity' });
        }
        ScrollTrigger.refresh();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { if (!t.classList.contains('is-on')) select(i); });
        t.addEventListener('keydown', function (e) {
          var k = e.key, n = tabs.length;
          if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select((i + 1) % n, true); }
          if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select((i - 1 + n) % n, true); }
          if (k === 'Home') { e.preventDefault(); select(0, true); }
          if (k === 'End') { e.preventDefault(); select(n - 1, true); }
        });
      });
    });
  }

  /* ---------------------------------------------------------------- boot */
  function inlineChecks() {
    $$('.checks svg').forEach(function (svg) {
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.innerHTML = '<path pathLength="20" d="M3 8.6l3.1 3.1L13 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    });
  }

  function initHeroScroll() {
    if (reduce) return;
    if ($('.hero__inner')) gsap.to('.hero__inner', { yPercent: -10, opacity: 0.0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '8% top', end: '70% top', scrub: true } });
    if ($('.hero__bottom, .scrollcue')) gsap.to('.hero__bottom, .scrollcue', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '5% top', end: '30% top', scrub: true } });
  }

  function init() {
    inlineChecks(); initHeroScroll();
    initNav(); initAnchors(); initPointerFX();
    initReveals(); initStatement(); initStack(); initBento(); initExpand();
    initStats(); initMap(); initROI(); initFAQ(); initWordmark(); initUseCases();
    window.__c9ok = true;
    ScrollTrigger.refresh();
  }

  function boot() {
    runIntro(revealHero);
    init();
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(boot);

  // failsafe: never leave the page hidden if something above throws
  setTimeout(function () { if (!window.__c9ok) document.documentElement.classList.remove('js'); }, 4500);
  window.addEventListener('load', function () { setTimeout(function () { ScrollTrigger.refresh(); }, 400); });
})();
