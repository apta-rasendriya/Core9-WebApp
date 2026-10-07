/* Core9 — site-wide bits shared by every page (loaded after main.js):
   1. highlight the current page in the nav (partials/nav.html has no per-page state)
   2. the Book a Demo popup: our form, sent to HubSpot (partials/demo.html)
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

  /* ------------------------------------------------------- Book a Demo popup
     Our own form (partials/demo.html), sent to the HubSpot demo form through
     HubSpot's form submission API. HubSpot doesn't validate these fields, so
     they are checked here first. */
  var HUBSPOT_SUBMIT = 'https://api.hsforms.com/submissions/v3/integration/submit/147137037/216d0b24-0e5b-40c1-85a5-219593301175';
  var modal = $('#demo-modal');
  if (!modal) return;
  var form = $('#demo-form', modal), errorBox = $('#demo-form-error', modal);
  var formWrap = $('#demo-form-wrap', modal), done = $('#demo-done', modal);
  var lastFocus = null;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('demo-open');
    if (window.C9Lenis) window.C9Lenis.stop();
    // on touch screens focusing a field would pop the keyboard over the form
    var touch = window.matchMedia && matchMedia('(hover: none)').matches;
    var first = !done.hidden ? $('.demo-modal__title', done) : touch ? $('#demo-modal-title', modal) : $('input[name=firstname]', form);
    setTimeout(function () { first.focus(); }, 60);
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove('demo-open');
    if (window.C9Lenis) window.C9Lenis.start();
    if (lastFocus) lastFocus.focus();
  }

  function setBad(input, bad) {
    input.closest('.dfield').classList.toggle('is-bad', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  }

  function check(input) {
    var v = input.value.trim();
    var ok = input.name === 'email' ? EMAIL.test(v) : v !== '';
    setBad(input, !ok);
    return ok;
  }

  var required = $$('[required]', form);
  // after a failed submit, re-check each field as it is corrected
  required.forEach(function (input) {
    input.addEventListener('input', function () { if (input.closest('.is-bad')) check(input); });
    input.addEventListener('blur', function () { if (input.value.trim()) check(input); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    var bad = required.filter(function (input) { return !check(input); });
    if (bad.length) { bad[0].focus(); return; }

    var f = form.elements;
    if (f.website.value) { showDone(); return; } // hidden field only bots fill in
    var phone = f.phone.value.trim() ? (f.code.value + ' ' + f.phone.value.trim()) : '';
    var fields = [
      { objectTypeId: '0-1', name: 'firstname', value: f.firstname.value.trim() },
      { objectTypeId: '0-1', name: 'email', value: f.email.value.trim() },
      { objectTypeId: '0-2', name: 'name', value: f.company.value.trim() },
    ];
    if (phone) fields.push({ objectTypeId: '0-1', name: 'phone', value: phone });
    if (f.message.value.trim()) fields.push({ objectTypeId: '0-1', name: 'additional_information', value: f.message.value.trim() });

    var button = $('.dform__submit', form), label = $('span', button);
    button.disabled = true; button.classList.add('is-busy'); label.textContent = 'Sending…';

    fetch(HUBSPOT_SUBMIT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fields, context: { pageUri: location.href, pageName: document.title } }),
    }).then(function (r) {
      if (!r.ok) throw new Error('HubSpot ' + r.status);
      showDone();
    }).catch(function () {
      errorBox.innerHTML = 'Sorry, that didn’t go through. Please try again, or email <a href="mailto:info@core9.ai">info@core9.ai</a> and we’ll set up your demo.';
      errorBox.hidden = false;
    }).then(function () {
      button.disabled = false; button.classList.remove('is-busy'); label.textContent = 'Book my demo';
    });
  });

  function showDone() {
    $('[data-demo-name]', done).textContent = form.elements.firstname.value.trim() || 'there';
    $('[data-demo-email]', done).textContent = form.elements.email.value.trim();
    formWrap.hidden = true;
    done.hidden = false;
    $('.demo-modal__title', done).focus();
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
