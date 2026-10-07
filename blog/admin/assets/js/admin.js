document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (!window.confirm(form.getAttribute('data-confirm'))) {
        event.preventDefault();
      }
    });
  });

  var titleField = document.querySelector('[data-slug-source]');
  var slugField = document.querySelector('[data-slug-target]');
  if (titleField && slugField) {
    var slugTouched = slugField.value.trim() !== '';
    slugField.addEventListener('input', function () { slugTouched = true; });
    titleField.addEventListener('input', function () {
      if (slugTouched) return;
      slugField.value = titleField.value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    });
  }
});
