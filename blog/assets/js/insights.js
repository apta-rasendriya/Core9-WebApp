/* Core9 Insights: reading progress + table-of-contents highlight on article pages.
   (Topic filters on the listing are plain links, filtered by index.php.) */
(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- article: reading progress + TOC */
  var prose = document.querySelector('.aprose'), bar = document.querySelector('.aprog i');
  if (!prose) return;
  var links = $$('.atoc a'), heads = links.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
  function y() { return window.pageYOffset || document.documentElement.scrollTop; }
  function update() {
    var r = prose.getBoundingClientRect(), total = prose.offsetHeight - window.innerHeight * 0.6;
    var p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    var cur = -1;
    heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < 140) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-on', i === cur); });
  }
  if (window.C9Lenis) window.C9Lenis.on('scroll', update); else window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  /* small screens: the TOC starts closed */
  var box = document.querySelector('.atoc__box');
  if (box && window.matchMedia('(max-width: 900px)').matches) box.open = false;
  /* TOC links scroll smoothly through Lenis (main.js only handles same-page links it saw at boot) */
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      if (!heads[i]) return;
      e.preventDefault();
      if (window.C9Lenis) window.C9Lenis.scrollTo(heads[i], { offset: -100, duration: 1.2 });
      else window.scrollTo({ top: heads[i].getBoundingClientRect().top + y() - 100, behavior: 'smooth' });
      if (box && window.matchMedia('(max-width: 900px)').matches) box.open = false;
    });
  });
})();
