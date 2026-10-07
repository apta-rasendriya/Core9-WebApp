/* Core9 — site-wide bits shared by every page (loaded after main.js):
   1. highlight the current page in the nav (partials/nav.html has no per-page state)
   2. the Book a Demo popup with the HubSpot form (partials/demo.html) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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
