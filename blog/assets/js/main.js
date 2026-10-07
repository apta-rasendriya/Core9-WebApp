document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-hamburger');
  var menu = document.querySelector('.hidden-menu-cont');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      toggle.querySelector('.nav-icon3').classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  var results = document.getElementById('results');
  if (!results) {
    return;
  }

  var FADE_MS = 200;

  function setActiveChip(categorySlug) {
    var chips = document.querySelectorAll('#chips a.chip');
    for (var i = 0; i < chips.length; i++) {
      var chipCategory = chips[i].getAttribute('data-category') || '';
      chips[i].classList.toggle('active', chipCategory === (categorySlug || ''));
    }
  }

  function loadResults(url, push) {
    if (results.classList.contains('is-loading')) {
      return;
    }
    results.classList.add('is-loading');

    var fetchPromise = fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Request failed');
        }
        return response.json();
      });
    var minDelay = new Promise(function (resolve) { setTimeout(resolve, FADE_MS); });

    Promise.all([fetchPromise, minDelay]).then(function (values) {
      var data = values[0];
      results.innerHTML = data.html;
      setActiveChip(data.category);
      if (push) {
        history.pushState({ ajaxResults: true }, '', url);
      }
      requestAnimationFrame(function () {
        results.classList.remove('is-loading');
        results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }).catch(function () {
      window.location.href = url;
    });
  }

  document.addEventListener('click', function (event) {
    var chip = event.target.closest('#chips a.chip');
    if (chip) {
      event.preventDefault();
      loadResults(chip.getAttribute('href'), true);
      return;
    }

    var pagerLink = event.target.closest('#results .pager a:not(.pg-disabled)');
    if (pagerLink) {
      event.preventDefault();
      loadResults(pagerLink.getAttribute('href'), true);
    }
  });

  window.addEventListener('popstate', function () {
    loadResults(location.pathname + location.search, false);
  });
});
