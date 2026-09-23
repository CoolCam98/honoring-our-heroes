// Mobile menu + dropdown toggles
(function () {
  var header = document.querySelector('.site-header');
  var menuBtn = document.querySelector('.menu-toggle');

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', open);
    });
  }

  document.querySelectorAll('.sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.has-sub');
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  });

  // Close menus with Escape
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    header.classList.remove('nav-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('.has-sub.open').forEach(function (el) { el.classList.remove('open'); });
  });
})();

// Analytics: count the actions that matter (emails, calls, maps, outside links, form sends)
(function () {
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var label = (a.textContent || '').replace(/\s+/g, ' ').trim();

    if (href.indexOf('mailto:') === 0) {
      var subject = (href.split('subject=')[1] || '');
      var type = /Sponsorship/i.test(decodeURIComponent(subject)) ? 'sponsor_email' :
                 /Volunteer/i.test(decodeURIComponent(subject)) || /sherry/i.test(href) ? 'volunteer_email' : 'email_click';
      track(type, { link_text: label });
    } else if (href.indexOf('tel:') === 0) {
      track(/8255|988/.test(href) ? 'crisis_line_call' : 'phone_call', { link_text: label });
    } else if (/google\.com\/maps/.test(href)) {
      track('map_click', { link_text: label });
    } else if (href === '/events/#tickets' || href === '#attend' || href === '#tickets') {
      track('tickets_info_click', { link_text: label });
    }
  });

  var form = document.querySelector('form[name="contact"]');
  if (form) {
    form.addEventListener('submit', function () {
      var topic = form.querySelector('[name="topic"]');
      track('generate_lead', { form: 'contact', topic: topic ? topic.value : '' , transport_type: 'beacon' });
    });
  }
})();
