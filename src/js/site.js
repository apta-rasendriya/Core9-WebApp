/* Core9 — site-wide bits shared by every page (loaded after main.js):
   1. highlight the current page in the nav (partials/nav.html has no per-page state)
   2. the Book a Demo popup with the HubSpot form (partials/demo.html)
   3. window.C9SubmitLead: saves a toolkit calculator lead via the blog's lead.php */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* -------------------------------------------------------- toolkit leads
     The site is static, so leads go to the PHP blog (served at /insights/),
     which stores them for admin/leads.php. lead = { email, tool, action,
     details?, firstName?, lastName?, company?, phone? }. Resolves to true
     once saved, false otherwise (callers then point people to info@core9.ai). */
  var LEAD_URL = '/insights/lead.php';
  window.C9SubmitLead = function (lead) {
    if (!window.fetch) return Promise.resolve(false);
    return fetch(LEAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    }).then(function (r) { return r.ok; }, function () { return false; });
  };

  /* The visitor's answers on a calculator page, for a lead's details: slider and
     number values by name/id, and the chosen options of each question. */
  window.C9PageAnswers = function (root) {
    var a = { page: location.pathname };
    $$('input[type=range], input[type=number]', root).forEach(function (el) {
      var k = el.name || el.id; if (k) a[k] = el.value;
    });
    $$('[data-q], [data-group], .q[data-i]', root).forEach(function (q) {
      var title = $('.q__h p', q) || $('.q__h', q);
      var k = q.getAttribute('data-q') || q.getAttribute('data-group') || (title ? title.textContent.trim().slice(0, 90) : 'q' + q.getAttribute('data-i'));
      // the chosen options' visible text reads better in a lead than their codes
      var on = $$('.on[data-v], .is-on[data-v], .on[data-value], .is-on[data-value]', q).map(function (o) { return o.textContent.trim() || o.getAttribute('data-v') || o.getAttribute('data-value'); });
      if (q.matches('.on, .is-on')) on.push(q.textContent.trim().slice(0, 60) || q.getAttribute('data-v') || q.getAttribute('data-value'));
      if (on.length) a[k] = on.filter(Boolean).join(', ');
    });
    $$('input[type=checkbox]:checked, input[type=radio]:checked', root).forEach(function (el) {
      var k = el.name || el.id; if (k) a[k] = (a[k] ? a[k] + ', ' : '') + el.value;
    });
    return a;
  };

  /* ---------------------------------------------------------- current page */
  var here = location.pathname.replace(/index\.html$/, '');
  $$('.nav a[href^="/"], .mnav a[href^="/"]').forEach(function (a) {
    var path = a.getAttribute('href').split('#')[0];
    if (path === '/' || path !== here) return;
    a.classList.add('is-current');
    var item = a.closest('.nav__item');
    var btn = item ? $('.nav__link', item) : (a.classList.contains('nav__link') ? a : null);
    if (btn) btn.classList.add('is-here');
  });

  /* ------------------------------------------------------- Book a Demo popup */
  var modal = $('#demo-modal');
  if (!modal) return;
  var formLoaded = false, lastFocus = null;

  function loadForm() {
    if (formLoaded) return;
    formLoaded = true;
    var s = document.createElement('script');
    s.src = 'https://js-eu1.hsforms.net/forms/embed/147137037.js';
    s.defer = true;
    document.head.appendChild(s);
  }

  function open() {
    loadForm();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('demo-open');
    if (window.C9Lenis) window.C9Lenis.stop();
    $('.demo-modal__close', modal).focus();
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove('demo-open');
    if (window.C9Lenis) window.C9Lenis.start();
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#book-demo"]');
    if (a) { e.preventDefault(); open(); return; }
    if (e.target.closest && e.target.closest('[data-demo-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  if (/[?&]demo=1\b/.test(location.search) || location.hash === '#book-demo') open();
})();
