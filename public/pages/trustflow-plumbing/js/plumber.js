/* TrustFlow Plumbing — shared JS */

/* Nav scroll */
const nav = document.getElementById('plumber-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* Hamburger */
const hamburger = document.getElementById('plumberHamburger');
const navLinks  = document.getElementById('plumberNavLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }));
}

/* Smooth scroll for anchor links */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = document.querySelector(this.getAttribute('href'));
    if (t) {
      e.preventDefault();
      const offset = (nav ? nav.offsetHeight : 0) + 8;
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  });
});

/* Quote form with sanitisation */
function sanitise(str) {
  return String(str).replace(/[<>&"'\/]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;','/':'&#x2F;'}[c]));
}
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const form    = document.getElementById('plumberQuoteForm');
const wrap    = document.getElementById('plumberFormWrap');
const success = document.getElementById('plumberFormSuccess');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = sanitise((document.getElementById('pName')?.value || '').trim());
    const phone = sanitise((document.getElementById('pPhone')?.value || '').trim());
    const email = sanitise((document.getElementById('pEmail')?.value || '').trim());
    if (!name || name.length > 100) return;
    if (!email || !validateEmail(email)) { document.getElementById('pEmail')?.focus(); return; }
    const btn = form.querySelector('.plumber-form-submit');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      if (wrap) wrap.style.display = 'none';
      if (success) success.classList.add('visible');
    }, 1000);
  });
}

/* Scroll reveal */
const revealEls = document.querySelectorAll('[data-reveal]');
if (revealEls.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  revealEls.forEach(el => observer.observe(el));
}

/* ── Cookie banner ── */
(function() {
  const banner  = document.getElementById('cookie-banner');
  const accept  = document.getElementById('cookieAccept');
  const decline = document.getElementById('cookieDecline');
  if (!banner) return;
  try {
    const consent = localStorage.getItem('tf_cookie_consent');
    if (!consent) setTimeout(() => banner.classList.add('visible'), 1200);
  } catch(e) {}
  const dismiss = (value) => {
    banner.classList.remove('visible');
    try { localStorage.setItem('tf_cookie_consent', value); } catch(e) {}
  };
  if (accept)  accept.addEventListener('click',  () => dismiss('accepted'));
  if (decline) decline.addEventListener('click', () => dismiss('declined'));
})();
