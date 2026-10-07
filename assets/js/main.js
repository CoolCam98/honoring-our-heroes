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

// Photo gallery lightbox (links open the full photo if JS is off)
(function () {
  var box = document.querySelector('.lightbox');
  if (!box || typeof box.showModal !== 'function') return;
  var links = Array.prototype.slice.call(document.querySelectorAll('.gallery-grid a'));
  var img = box.querySelector('img');
  var count = box.querySelector('.lb-count');
  var current = 0, opener = null, touchX = null;

  function show(i) {
    current = (i + links.length) % links.length;
    var a = links[current], thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = thumb.alt;
    img.width = +a.dataset.w; img.height = +a.dataset.h;
    count.textContent = (current + 1) + ' of ' + links.length;
    [-1, 1].forEach(function (d) { new Image().src = links[(current + d + links.length) % links.length].getAttribute('href'); });
  }

  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      opener = a;
      show(i);
      box.showModal();
    });
  });

  box.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
  box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  box.addEventListener('close', function () {
    img.removeAttribute('src');
    if (opener) opener.focus();
  });
})();

// Gallery slideshow: full-screen, auto-advancing, for playing behind a presentation
(function () {
  var chooser = document.querySelector('.ss-chooser');
  var show = document.querySelector('.slideshow');
  if (!chooser || !show || typeof show.showModal !== 'function') return;

  var layers = show.querySelectorAll('.ss-img');
  var pauseBtn = show.querySelector('.ss-pause');
  var speedRange = show.querySelector('#ss-speed-range');
  var speedValue = show.querySelector('.ss-speed-value');
  var count = show.querySelector('.ss-count');
  var status = show.querySelector('.ss-status');
  // Seconds each photo stays up; the slider runs from slowest (left) to fastest (right)
  var speeds = [20, 15, 12, 10, 8, 7, 6, 5, 4, 3];
  var speed = 5, list = [], current = 0, front = 0, token = 0;
  var paused = false, timer = null, hideTimer = null, hintTimer = null, wakeLock = null, fullscreen = false;

  try { var saved = localStorage.getItem('hoh-slideshow-pace'); if (saved !== null && speeds[+saved]) speed = +saved; } catch (e) {}

  function photos(set) {
    var sel = set === 'all' ? '[data-set] .gallery-grid a' : '[data-set="' + set + '"] .gallery-grid a';
    return Array.prototype.map.call(document.querySelectorAll(sel), function (a) {
      return { src: a.getAttribute('href'), alt: a.querySelector('img').alt };
    });
  }

  chooser.querySelectorAll('[data-count]').forEach(function (el) {
    el.textContent = photos(el.getAttribute('data-count')).length + ' photos';
  });

  function schedule() {
    clearTimeout(timer);
    if (!paused) timer = setTimeout(function () { go(current + 1); }, speeds[speed] * 1000);
  }

  function go(n) {
    current = (n + list.length) % list.length;
    var t = ++token, photo = list[current], next = new Image();
    next.src = photo.src;
    (next.decode ? next.decode() : Promise.resolve()).catch(function () {}).then(function () {
      if (t !== token) return;
      var back = layers[1 - front];
      back.src = photo.src;
      back.alt = photo.alt;
      back.classList.add('is-on');
      layers[front].classList.remove('is-on');
      front = 1 - front;
      count.textContent = (current + 1) + ' of ' + list.length;
      new Image().src = list[(current + 1) % list.length].src;
      schedule();
    });
  }

  function setPaused(p) {
    paused = p;
    show.classList.toggle('ss-is-paused', p);
    pauseBtn.querySelector('span').textContent = p ? 'Play' : 'Pause';
    pauseBtn.querySelector('path').setAttribute('d', p ? 'M7 4.5v15l13-7.5z' : 'M6 4h4v16H6zM14 4h4v16h-4z');
    status.textContent = p ? 'Slideshow paused' : 'Slideshow playing';
    if (p) clearTimeout(timer); else schedule();
  }

  function setSpeed(s) {
    speed = s;
    var text = speeds[s] + ' seconds per photo';
    speedRange.value = s;
    speedRange.setAttribute('aria-valuetext', text);
    speedValue.textContent = text;
    try { localStorage.setItem('hoh-slideshow-pace', s); } catch (e) {}
    schedule();
  }

  // Controls appear when the mouse moves or the screen is touched, then hide again
  function wake() {
    show.classList.add('ss-active');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (show.querySelector('.ss-controls:hover')) return wake();
      show.classList.remove('ss-active');
    }, 3500);
  }

  function keepAwake() {
    if (!('wakeLock' in navigator) || !show.open) return;
    navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () {});
  }

  function start(set) {
    list = photos(set);
    if (!list.length) return;
    show.showModal();
    var root = document.documentElement;
    if (root.requestFullscreen) {
      root.requestFullscreen().then(function () { fullscreen = true; }).catch(function () {});
    }
    keepAwake();
    setSpeed(speed);
    setPaused(false);
    show.classList.add('ss-hinting');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { show.classList.remove('ss-hinting'); }, 6000);
    wake();
    clearTimeout(timer);
    go(0);
    if (typeof window.gtag === 'function') window.gtag('event', 'slideshow_start', { photo_set: set });
  }

  show.addEventListener('close', function () {
    token++;
    clearTimeout(timer); clearTimeout(hideTimer); clearTimeout(hintTimer);
    layers.forEach(function (l) { l.classList.remove('is-on'); l.removeAttribute('src'); });
    show.classList.remove('ss-active', 'ss-hinting', 'ss-is-paused');
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
    if (fullscreen && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    fullscreen = false;
  });

  // Leaving full screen (e.g. pressing Esc) ends the slideshow
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && fullscreen && show.open) { fullscreen = false; show.close(); }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && show.open) keepAwake();
  });

  show.addEventListener('mousemove', wake);
  show.addEventListener('pointerdown', wake);
  show.querySelector('.ss-prev').addEventListener('click', function () { go(current - 1); });
  show.querySelector('.ss-next').addEventListener('click', function () { go(current + 1); });
  pauseBtn.addEventListener('click', function () { setPaused(!paused); });
  speedRange.addEventListener('input', function () { setSpeed(+speedRange.value); wake(); });
  show.querySelector('.ss-exit').addEventListener('click', function () { show.close(); });

  // Keyboard and presentation clickers (which send Page Up / Page Down)
  show.addEventListener('keydown', function (e) {
    var k = e.key;
    if (e.target === speedRange && k !== ' ' && k !== 'Spacebar' && k !== 'k') return; // let arrows move the slider
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); go(current + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); go(current - 1); }
    else if (k === ' ' || k === 'Spacebar' || k === 'k') { e.preventDefault(); setPaused(!paused); }
  });

  function openChooser() { chooser.showModal(); }
  document.querySelectorAll('.ss-open').forEach(function (b) { b.addEventListener('click', openChooser); });
  document.querySelectorAll('.ss-play').forEach(function (b) {
    b.addEventListener('click', function () { start(b.getAttribute('data-set')); });
  });
  chooser.querySelectorAll('.ss-choice').forEach(function (b) {
    b.addEventListener('click', function () { chooser.close(); start(b.getAttribute('data-set')); });
  });
  chooser.querySelector('.ss-cancel').addEventListener('click', function () { chooser.close(); });

  // A bookmark to /gallery/#slideshow opens the photo choice straight away
  if (location.hash === '#slideshow') openChooser();
})();
