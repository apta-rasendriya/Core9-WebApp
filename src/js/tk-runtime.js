/* Core9 shared tool runtime v2: capped sliders, toggle cards, live rails,
   share links and mock self-serve lead capture. No build step, no deps. */
(function () {
  var CUR = {
    USD: { sym: "$", rate: 1 },
    SAR: { sym: "SAR ", rate: 3.75 },
    PKR: { sym: "Rs ", rate: 278 },
    IDR: { sym: "Rp ", rate: 16000 }
  };

  /* compact number: round first, then choose the unit, so 999,600 reads 1.0M not 1000k */
  function compact(abs) {
    if (abs < 1e4) return Math.round(abs).toLocaleString("en-US");
    if (abs < 1e6) { var k = Math.round(abs / 1e3); if (k < 1000) return k + "k"; }
    if (abs < 1e9) { var m = abs / 1e6, rm = Number(m.toFixed(1)); if (rm < 10) return rm.toFixed(1) + "M"; rm = Math.round(m); if (rm < 1000) return rm + "M"; }
    var g = abs / 1e9, rg = Number(g.toFixed(1));
    return rg < 10 ? rg.toFixed(1) + "B" : Math.round(g) + "B";
  }

  var C9 = {
    currency: "USD",
    recalc: function () {},
    hooks: {},

    money: function (usd, opts) {
      opts = opts || {};
      var c = CUR[C9.currency] || CUR.USD;
      var v = usd * c.rate, abs = Math.abs(v);
      var body = opts.exact ? Math.round(abs).toLocaleString("en-US") : compact(abs);
      if (body === "0" || body === "0k") return c.sym + "0";
      return (v < 0 ? "-" : "") + c.sym + body;
    },

    rate: function () { return (CUR[C9.currency] || CUR.USD).rate; },

    num: function (n, digits) {
      return Number(n).toLocaleString("en-US", { maximumFractionDigits: digits == null ? 0 : digits });
    },

    plural: function (n, one, many) { return C9.num(n) + " " + (Number(n) === 1 ? one : (many || one + "s")); },

    state: function () {
      var s = {};
      document.querySelectorAll("input[type=range][id]").forEach(function (el) { s[el.id] = Number(el.value); });
      document.querySelectorAll("input[type=number][id], input[type=text][data-state][id], select[data-state][id]").forEach(function (el) {
        s[el.id] = el.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value;
      });
      document.querySelectorAll("[data-group]").forEach(function (el) {
        var g = el.getAttribute("data-group");
        if (el.getAttribute("data-single") === "true") { if (el.classList.contains("is-on")) s[g] = el.getAttribute("data-value"); }
        else { s[g] = s[g] || []; if (el.classList.contains("is-on")) s[g].push(el.getAttribute("data-value")); }
      });
      s.currency = C9.currency;
      return s;
    },

    set: function (id, text) { var el = document.getElementById(id); if (el) el.textContent = text; },
    bar: function (id, pct) { var el = document.getElementById(id); if (el) el.style.width = Math.max(0, Math.min(100, pct)) + "%"; },

    /* set a slider programmatically and repaint it */
    setSlider: function (id, v) {
      var el = document.getElementById(id); if (!el) return;
      el.value = v; C9.paintSlider(el);
    },
    /* change a slider's max, keeping its value inside the new range */
    setMax: function (id, max) {
      var el = document.getElementById(id); if (!el) return;
      max = Math.max(Number(el.min), max);
      if (Number(el.max) !== max) { el.max = max; var caps = el.parentNode.querySelectorAll(".slider__caps span"); if (caps[1]) caps[1].textContent = C9.fmt(el, max); }
      if (Number(el.value) > max) el.value = max;
      C9.paintSlider(el);
    },

    fmt: function (el, v) {
      var f = el.getAttribute("data-format") || "num";
      if (f === "money") return C9.money(v, { exact: Math.abs(v * C9.rate()) < 1e6 });
      if (f === "pct") return v + "%";
      if (f === "hrs") return v + " h";
      return C9.num(v);
    },

    init: function (recalc) {
      C9.recalc = recalc || C9.recalc;

      document.querySelectorAll("input[type=range]").forEach(function (el) {
        el.addEventListener("input", function () { el.dataset.touched = "1"; C9.paintSlider(el); C9.recalc(); });
      });

      /* delegated, so cards rendered later (Pilot Planner focus) work too.
         A container with data-max caps how many cards in its group can be on. */
      document.addEventListener("click", function (e) {
        var el = e.target.closest && e.target.closest("[data-group]");
        if (!el || el.tagName === "SELECT" || el.tagName === "INPUT") return;
        var g = el.getAttribute("data-group");
        if (el.getAttribute("data-single") === "true") {
          document.querySelectorAll('[data-group="' + g + '"]').forEach(function (s) { s.classList.remove("is-on"); });
          el.classList.add("is-on");
        } else {
          var box = el.closest("[data-max]");
          if (!el.classList.contains("is-on") && box) {
            var max = Number(box.getAttribute("data-max"));
            if (box.querySelectorAll('[data-group="' + g + '"].is-on').length >= max) {
              box.classList.remove("is-full"); void box.offsetWidth; box.classList.add("is-full");
              if (C9.hooks.onFull) C9.hooks.onFull(g, max);
              return;
            }
          }
          el.classList.toggle("is-on");
        }
        if (C9.hooks.onGroup) C9.hooks.onGroup(g, el);
        C9.recalc();
      });

      document.querySelectorAll("input[type=number], select[data-state], input[data-state]").forEach(function (el) {
        el.addEventListener("input", function () { C9.recalc(); });
        el.addEventListener("change", function () { C9.recalc(); });
      });

      /* currency: results and every money slider label repaint together */
      document.querySelectorAll("[data-currency]").forEach(function (sel) {
        sel.addEventListener("change", function () {
          C9.currency = sel.value;
          document.querySelectorAll("[data-currency]").forEach(function (o) { o.value = sel.value; });
          if (C9.hooks.onCurrency) C9.hooks.onCurrency(sel.value);
          C9.repaintAll(); C9.recalc();
        });
      });

      document.querySelectorAll("[data-search-for]").forEach(function (box) {
        box.addEventListener("input", function () {
          var q = box.value.trim().toLowerCase();
          document.querySelectorAll("#" + box.getAttribute("data-search-for") + " .tk-chip").forEach(function (chip) {
            chip.style.display = !q || chip.textContent.toLowerCase().indexOf(q) > -1 ? "" : "none";
          });
        });
      });

      document.querySelectorAll("[data-capture]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var box = form.closest(".capture") || form;
          var email = form.querySelector("input[type=email]");
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { if (email) email.focus(); return; }
          var button = form.querySelector("button");
          if (button) button.disabled = true;
          var safe = email.value.replace(/[<>&"]/g, "");
          C9.logLead({ action: form.getAttribute("data-capture"), email: email.value }).then(function (ok) {
            if (button) button.disabled = false;
            if (!ok) { C9.leadFailed(form); return; }
            box.classList.add("is-done");
            box.innerHTML = '<div class="capture__label" style="color:#7ee2b0">Got it. We’ll send your results to ' + safe + '.</div><div class="capture__note">Someone from our team will email you, usually within one working day. No newsletter.</div>';
          });
        });
      });

      document.querySelectorAll("[data-gate]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = Object.fromEntries(new FormData(form).entries());
          var button = form.querySelector("button[type=submit]");
          if (button) button.disabled = true;
          C9.logLead({
            action: "pilot-plan-request", email: f.email, firstName: f.firstName, lastName: f.lastName,
            company: f.company, phone: f.phone ? (String(f.code || "").split(" ")[0] + " " + f.phone).trim() : ""
          }).then(function (ok) {
            if (button) button.disabled = false;
            if (!ok) { C9.leadFailed(form); return; }
            var done = form.parentNode.querySelector("[data-gate-done]");
            form.style.display = "none";
            if (done) done.style.display = "block";
          });
        });
      });

      document.querySelectorAll("[data-share]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var q = ["cur=" + C9.currency];
          document.querySelectorAll("input[type=range][id], input[type=number][id]").forEach(function (el) { if (el.value !== "") q.push(el.id + "=" + encodeURIComponent(el.value)); });
          var groups = {};
          document.querySelectorAll("[data-group]").forEach(function (el) { groups[el.getAttribute("data-group")] = 1; });
          Object.keys(groups).forEach(function (g) {
            var on = document.querySelectorAll('[data-group="' + g + '"].is-on');
            if (!on.length) q.push(g + "~");
            on.forEach(function (el) { q.push(g + "~" + encodeURIComponent(el.getAttribute("data-value"))); });
          });
          var url = location.origin + location.pathname + "?" + q.join("&");
          var label = btn.textContent;
          if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
          btn.textContent = "Link copied";
          setTimeout(function () { btn.textContent = label; }, 2000);
        });
      });

      C9.restore();
      C9.repaintAll();
      C9.recalc();
    },

    repaintAll: function () {
      document.querySelectorAll("input[type=range]").forEach(function (el) {
        C9.paintSlider(el);
        if (el.getAttribute("data-format") === "money") {
          var caps = el.parentNode.querySelectorAll(".slider__caps span");
          if (caps[0]) caps[0].textContent = C9.fmt(el, Number(el.min));
          if (caps[1]) caps[1].textContent = C9.fmt(el, Number(el.max));
        }
      });
    },

    paintSlider: function (el) {
      var out = document.getElementById(el.id + "Val");
      if (out) out.textContent = C9.fmt(el, Number(el.value));
      var mn = Number(el.min) || 0, mx = Number(el.max) || 100;
      el.style.setProperty("--f", ((Number(el.value) - mn) / ((mx - mn) || 1) * 100) + "%");
    },

    /* rebuild state from a shared link: single groups first, then the page hook
       (so dependent cards can render), then multi groups with defaults cleared */
    restore: function () {
      if (!location.search) return;
      var pairs = location.search.substring(1).split("&"), multi = {}, cleared = {};
      C9.restored = true;
      pairs.forEach(function (pair) {
        if (pair.indexOf("~") > -1) {
          var g = pair.split("~"), val = decodeURIComponent(g[1] || "");
          var any = document.querySelector('[data-group="' + g[0] + '"]');
          if (!any) { (multi[g[0]] = multi[g[0]] || []).push(val); return; }
          if (any.getAttribute("data-single") === "true") {
            var el = document.querySelector('[data-group="' + g[0] + '"][data-value="' + val + '"]');
            if (el) { document.querySelectorAll('[data-group="' + g[0] + '"]').forEach(function (s) { s.classList.remove("is-on"); }); el.classList.add("is-on"); }
          } else (multi[g[0]] = multi[g[0]] || []).push(val);
        } else {
          var kv = pair.split("="), k = kv[0], v = decodeURIComponent(kv[1] || "");
          if (k === "cur" && CUR[v]) { C9.currency = v; document.querySelectorAll("[data-currency]").forEach(function (o) { o.value = v; }); return; }
          var input = document.getElementById(k);
          if (input && (input.type === "range" || input.type === "number")) { input.value = v; input.dataset.touched = "1"; }
        }
      });
      if (C9.hooks.afterSingles) C9.hooks.afterSingles();
      Object.keys(multi).forEach(function (g) {
        document.querySelectorAll('[data-group="' + g + '"]').forEach(function (s) { if (!cleared[g]) s.classList.remove("is-on"); });
        cleared[g] = 1;
        multi[g].forEach(function (val) {
          if (!val) return;
          var el = document.querySelector('[data-group="' + g + '"][data-value="' + val + '"]');
          if (el) el.classList.add("is-on");
        });
      });
    },

    /* Save a self-serve lead with this tool's inputs (see C9SubmitLead in site.js).
       Resolves to true once saved. */
    logLead: function (lead) {
      lead.tool = document.body.getAttribute("data-tool") || location.pathname;
      lead.details = Object.assign({ page: location.pathname }, C9.state());
      return window.C9SubmitLead ? window.C9SubmitLead(lead) : Promise.resolve(false);
    },

    /* shown under a capture form when saving failed */
    leadFailed: function (form) {
      var msg = form.querySelector(".lead-error");
      if (!msg) {
        msg = document.createElement("p");
        msg.className = "capture__note lead-error";
        msg.style.color = "#f0a0a0";
        form.appendChild(msg);
      }
      msg.innerHTML = 'Sorry, that didn’t go through. Please email <a href="mailto:info@core9.ai">info@core9.ai</a> and we’ll send it over.';
    }
  };

  window.C9 = C9;
})();
