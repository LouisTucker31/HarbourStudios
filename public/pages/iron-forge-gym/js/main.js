/* ============================================
   IRONFORGE GYM — MAIN JS
============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- NAV SCROLL EFFECT ----
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // ---- MOBILE MENU ----
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = mobileMenu.classList.contains('open') ? 'rotate(45deg) translate(5px, 5px)' : '';
      spans[1].style.opacity  = mobileMenu.classList.contains('open') ? '0' : '1';
      spans[2].style.transform = mobileMenu.classList.contains('open') ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });
    // close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });
  }

  // ---- ACTIVE NAV LINK ----
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPage || (currentPage === '' && href === 'index.html'))) {
      link.classList.add('active');
    }
  });

  // ---- SCROLL REVEAL ----
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (revealElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.revealDelay || 0;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach(el => observer.observe(el));
  }

  // ---- COUNTER ANIMATION ----
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.counter);
          const suffix = el.dataset.suffix || '';
          let start = 0;
          const duration = 1600;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { start = target; clearInterval(timer); }
            el.textContent = Math.floor(start) + suffix;
          }, 16);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  // ---- BOOKING MODAL ----
  const bookingModal = document.getElementById('bookingModal');
  const bookingClose = document.getElementById('bookingClose');

  window.openBooking = function(className) {
    if (!bookingModal) return;
    const titleEl = bookingModal.querySelector('#bookingClassName');
    if (titleEl && className) titleEl.textContent = sanitise(className);
    bookingModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  if (bookingClose) {
    bookingClose.addEventListener('click', closeModal);
  }
  if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeModal();
    });
  }

  function closeModal() {
    if (!bookingModal) return;
    bookingModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ---- FAQ ACCORDION ----
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ---- TIMETABLE FILTERS ----
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.timetable-table tbody tr').forEach(row => {
        if (filter === 'all' || row.dataset.category === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // ---- NEWSLETTER FORM ----
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      if (input && input.value) {
        btn.textContent = 'Subscribed ✓';
        btn.style.background = '#2ecc71';
        input.value = '';
        setTimeout(() => {
          btn.textContent = 'Subscribe';
          btn.style.background = '';
        }, 3000);
      }
    });
  });

  // ---- CONTACT FORM (MOCK) ----
  const contactForm = document.querySelector('.contact-form form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = 'Message Sent ✓';
      btn.style.background = '#2ecc71';
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        contactForm.reset();
      }, 3000);
    });
  }

  // ---- JOIN FORM (MOCK) ----
  document.querySelectorAll('.membership-join-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Application Received ✓';
      btn.style.background = '#2ecc71';
    });
  });

  // ---- EXTERNAL LINK SAFETY ----
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    const url = link.getAttribute('href');
    if (!url.startsWith(window.location.origin)) {
      link.setAttribute('rel', 'noopener noreferrer');
      if (!link.hasAttribute('target')) link.setAttribute('target', '_blank');
    }
  });

  // ---- SMOOTH SCROLL FOR ANCHOR LINKS ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});

// ---- REVEAL CSS ----
const style = document.createElement('style');
style.textContent = `
  [data-reveal] {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  [data-reveal].revealed {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);


// ============================================================
// SECURITY HARDENING
// ============================================================

// ---- INPUT SANITISATION ----
// Strips HTML tags from any string before use in the DOM
function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}


// ---- FORM SUBMIT RATE LIMITING ----
// Prevents rapid repeated form submissions (basic client-side guard)
(function() {
  const submitTimestamps = new WeakMap();
  document.addEventListener('submit', function(e) {
    const form = e.target;
    const last = submitTimestamps.get(form) || 0;
    const now = Date.now();
    if (now - last < 3000) {          // 3-second cooldown
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    submitTimestamps.set(form, now);
  }, true);
})();

// ---- CLICKJACKING GUARD (JS layer) ----
if (window.top !== window.self) {
  try {
    window.top.location = window.self.location;
  } catch (e) {
    document.body.style.display = 'none';
  }
}

// ---- PREVENT TABNAPPING via history manipulation ----
window.addEventListener('pageshow', function(e) {
  if (e.persisted) {
    // Page was restored from bfcache - ensure state is clean
    document.querySelectorAll('form').forEach(f => {
      const btns = f.querySelectorAll('button[type="submit"]');
      btns.forEach(btn => {
        btn.disabled = false;
      });
    });
  }
});


/* ---- COOKIE BANNER ---- */
(function() {
  const banner  = document.getElementById('cookie-banner');
  const accept  = document.getElementById('cookieAccept');
  const decline = document.getElementById('cookieDecline');
  if (!banner) return;
  try { if (!localStorage.getItem('if_cookie_consent')) setTimeout(() => banner.classList.add('visible'), 1200); } catch(e) {}
  const dismiss = v => { banner.classList.remove('visible'); try { localStorage.setItem('if_cookie_consent', v); } catch(e) {} };
  if (accept)  accept.addEventListener('click',  () => dismiss('accepted'));
  if (decline) decline.addEventListener('click', () => dismiss('declined'));
})();
