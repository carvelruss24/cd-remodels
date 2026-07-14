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