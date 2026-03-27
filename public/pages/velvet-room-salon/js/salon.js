/* ── Nav scroll ── */
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

    /* ── Hamburger ── */
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }));

    /* ── Smooth scroll ── */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function(e) {
        const t = document.querySelector(this.getAttribute('href'));
        if (t) {
          e.preventDefault();
          const offset = nav.offsetHeight + 8;
          window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        }
      });
    });

    /* ── Booking form (demo) ── */
    const form     = document.getElementById('bookingForm');
    const formWrap = document.getElementById('formWrap');
    const success  = document.getElementById('bookingSuccess');

    function sanitise(str) {
      return String(str).replace(/[<>&"'/]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;','/':'&#x2F;'}[c]));
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name  = sanitise(document.getElementById('fName').value.trim());
      const email = sanitise(document.getElementById('fEmail').value.trim());
      if (!name || name.length > 100) return;
      if (!email || !validateEmail(email)) {
        document.getElementById('fEmail').focus();
        return;
      }
      const btn = form.querySelector('.form-submit');
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        formWrap.style.display = 'none';
        success.classList.add('visible');
      }, 900);
    });

    /* ── Scroll reveal ── */
    const revealEls = document.querySelectorAll('[data-reveal]');
    const observer  = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));

    /* ── Cookie banner ── */
    (function() {
      const banner  = document.getElementById('cookie-banner');
      const accept  = document.getElementById('cookieAccept');
      const decline = document.getElementById('cookieDecline');
      if (!banner) return;
      try { if (!localStorage.getItem('vr_cookie_consent')) setTimeout(() => banner.classList.add('visible'), 1200); } catch(e) {}
      const dismiss = v => { banner.classList.remove('visible'); try { localStorage.setItem('vr_cookie_consent', v); } catch(e) {} };
      if (accept)  accept.addEventListener('click',  () => dismiss('accepted'));
      if (decline) decline.addEventListener('click', () => dismiss('declined'));
    })();