/* =========================================
   Sticky Nav: transparent → solid on scroll
   + Dynamic hero padding-top to match nav height
   ========================================= */
(function () {
  var nav = document.querySelector('.top-bar');
  var hero = document.querySelector('.hero');
  function syncHeroPadding() {
    if (!nav || !hero) return;
    hero.style.paddingTop = nav.offsetHeight + 'px';
  }
  function handleScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  // Initial sync (DOM ready since script is at end of body)
  syncHeroPadding();
  handleScroll();
  // Refine after fonts/images settle in case nav height shifts
  window.addEventListener('load', syncHeroPadding);
  window.addEventListener('resize', syncHeroPadding);
  window.addEventListener('scroll', handleScroll, { passive: true });
})();

/* =========================================
   Mobile icon swap for the problem/solution
   feature cards: icon-1/2/3.svg ↔ blue-icon-1/2/3.svg
   Triggers at the same breakpoint as feature-cards
   stacking (max-width: 560px).
   ========================================= */
(function () {
  var MOBILE_QUERY = '(max-width: 560px)';
  var icons = document.querySelectorAll('.feature-cards .feature-card img');
  if (!icons.length) return;
  // Cache both desktop (original) and mobile (blue-) src for each icon
  icons.forEach(function (img) {
    var desktopSrc = img.getAttribute('src');
    img.dataset.desktopSrc = desktopSrc;
    img.dataset.mobileSrc = desktopSrc.replace(
      /icon-(\d+)\.svg/,
      'blue-icon-$1.svg'
    );
  });
  function applyIconSrc(isMobile) {
    icons.forEach(function (img) {
      var next = isMobile ? img.dataset.mobileSrc : img.dataset.desktopSrc;
      if (img.getAttribute('src') !== next) img.setAttribute('src', next);
    });
  }
  var mql = window.matchMedia(MOBILE_QUERY);
  applyIconSrc(mql.matches);

  // Live updates on resize / device rotation
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', function (e) { applyIconSrc(e.matches); });
  } else if (typeof mql.addListener === 'function') {
    // Safari < 14 fallback
    mql.addListener(function (e) { applyIconSrc(e.matches); });
  }
})();

/* =========================================
   Testimonials: Read more / Read less toggle
   Quotes are clamped to a fixed number of lines
   (see .testimonial-card blockquote in CSS) so all
   cards share the same collapsed height. A toggle is
   injected under each quote to reveal the full text.
   ========================================= */
(function () {
  var cards = document.querySelectorAll('.testimonial-card');
  if (!cards.length) return;
  cards.forEach(function (card) {
    var quote = card.querySelector('blockquote');
    if (!quote || card.querySelector('.testimonial-toggle')) return;
    // Clamp only kicks in once this class is present, so no-JS visitors
    // still see the full, unclamped quote.
    card.classList.add('has-toggle');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'testimonial-toggle';
    btn.textContent = 'Read more';
    btn.setAttribute('aria-expanded', 'false');
    quote.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', function () {
      var expanded = card.classList.toggle('is-expanded');
      btn.textContent = expanded ? 'Read less' : 'Read more';
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  });
})();

/* =========================================
   Project Gallery: coverflow carousel
   Center slide is large + clear; neighbours peek at the
   sides, scaled and dimmed. Arrows, dots, keyboard,
   touch-swipe and (motion-safe) autoplay all drive the
   same active index.
   ========================================= */
(function () {
  var root = document.querySelector('.gallery-carousel');
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll('.gallery-slide'));
  if (!slides.length) return;

  var prevBtn = root.querySelector('.gallery-prev');
  var nextBtn = root.querySelector('.gallery-next');
  var dotsWrap = root.parentNode.querySelector('.gallery-dots');
  var n = slides.length;
  var active = 0;
  var timer = null;
  var AUTOPLAY_MS = 5000;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build dots
  var dots = [];
  if (dotsWrap) {
    slides.forEach(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'gallery-dot';
      d.setAttribute('aria-label', 'Go to project ' + (i + 1));
      d.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(d);
      dots.push(d);
    });
  }

  function layout() {
    slides.forEach(function (s, i) {
      var rel = i - active;
      if (rel > n / 2) rel -= n;
      if (rel < -n / 2) rel += n;
      var dist = Math.abs(rel);
      var sign = rel < 0 ? -1 : 1;
      var scale = dist === 0 ? 1 : (dist === 1 ? 0.8 : 0.62);
      var opacity = dist === 0 ? 1 : (dist === 1 ? 0.9 : 0);
      var offset = dist === 0 ? 0 : sign * (56 + (dist - 1) * 42); // % of slide width
      s.style.transform = 'translate(-50%, -50%) translateX(' + offset + '%) scale(' + scale + ')';
      s.style.opacity = opacity;
      s.style.zIndex = String(30 - dist);
      s.style.pointerEvents = opacity === 0 ? 'none' : 'auto';
      s.classList.toggle('is-active', dist === 0);
      s.setAttribute('aria-hidden', dist === 0 ? 'false' : 'true');
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === active);
      d.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
  }

  function go(i) { active = ((i % n) + n) % n; layout(); }
  function next() { go(active + 1); }
  function prev() { go(active - 1); }

  if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });

  // Click a peeking slide to bring it forward
  slides.forEach(function (s, i) {
    s.addEventListener('click', function () {
      if (i !== active) { go(i); restart(); }
    });
  });

  // Keyboard (when focus is inside the carousel)
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { prev(); restart(); }
    else if (e.key === 'ArrowRight') { next(); restart(); }
  });

  // Touch swipe
  var startX = null;
  root.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    stop();
  }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { if (dx < 0) { next(); } else { prev(); } }
    startX = null;
    start();
  }, { passive: true });

  // Autoplay (paused on hover / focus, disabled for reduced motion)
  function start() { if (!reduceMotion && !timer) timer = window.setInterval(next, AUTOPLAY_MS); }
  function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  layout();
  start();
  window.addEventListener('resize', layout);
})();