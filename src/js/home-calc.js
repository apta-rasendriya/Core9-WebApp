/* ============================================================================
   Core9 — homepage savings calculator (v4)
   Content + maths from the toolkit version (Fleet Risk & Savings), simplified:
   three sliders → one headline number. The number stays soft-blurred until a work
   email is given; then it sharpens and the four-line breakdown opens underneath.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('fcalc'); if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var q = function (s) { return root.querySelector(s); };
  var money = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };
  var o = function (k, v) { Array.prototype.forEach.call(root.querySelectorAll('[data-o="' + k + '"]'), function (e) { e.textContent = v; }); };
  var inputs = Array.prototype.slice.call(root.querySelectorAll('input[type=range]'));
  var shown = { total: 0 };

  function fill(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  function calc(first) {
    var veh = +q('[name=vehicles]').value, acc = +q('[name=accidents]').value, cost = +q('[name=acost]').value;
    o('vehicles', veh.toLocaleString('en-US')); o('accidents', acc); o('acost', money(cost));
    var avoided = acc * 0.26, accSave = avoided * cost, ins = 2400 * veh * 0.08, tot = accSave + ins;
    var rate = acc / (60000 * veh / 1e6), risk = Math.max(5, Math.min(95, 55 + Math.min(24, rate * 3.2)));
    var d = Math.round(tot).toString().length;
    o('band', ['', '', '', 'three-figure', 'four-figure', 'five-figure', 'six-figure', 'seven-figure', 'eight-figure'][d] || 'large');
    o('avoided', avoided.toFixed(1)); o('accSave', money(accSave)); o('ins', money(ins));
    o('risk', Math.round(risk) + ' → ' + Math.round(risk * 0.66));
    inputs.forEach(fill);
    if (first || reduce || !window.gsap) { shown.total = tot; o('total', money(tot)); return; }
    gsap.to(shown, { total: tot, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: function () { o('total', money(shown.total)); } });
  }
  inputs.forEach(function (r) { r.addEventListener('input', function () { calc(false); }); });
  calc(true);

  var form = q('.fcalc__gate');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var em = q('input[type=email]'), row = q('.inrow'), err = q('.err');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { row.classList.add('is-bad'); err.hidden = false; em.focus(); return; }
    row.classList.remove('is-bad'); err.hidden = true;
    o('email', em.value.trim());
    root.classList.add('is-open');
    if (window.C9SubmitLead) C9SubmitLead({ email: em.value.trim(), tool: 'home-fleet-calculator', action: 'email-fleet-savings-report', details: C9PageAnswers(root) }).then(function (ok) {
      if (!ok) q('.fcalc__done').innerHTML = 'We couldn’t save your email. Please write to <a href="mailto:info@core9.ai">info@core9.ai</a> for the full report.';
    });
    if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 900);
  });
})();
