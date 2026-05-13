/* Sanova — main.js */
(function () {
  'use strict';
  document.documentElement.classList.add('js-on');

  /* ---- Partials ---- */
  async function loadPartials() {
    const slots = document.querySelectorAll('[data-inc]');
    if (!slots.length) return;
    await Promise.all(Array.from(slots).map(async (el) => {
      try {
        const r = await fetch(el.dataset.inc);
        if (!r.ok) throw new Error(r.status);
        el.outerHTML = await r.text();
      } catch (e) { el.outerHTML = ''; }
    }));
  }

  function initUI() {
    /* Active nav */
    const page = document.body.dataset.page || '';
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === page) a.classList.add('active');
    });

    /* Scrolled header */
    const hdr = document.getElementById('siteHeader');
    const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobile drawer */
    const burger = document.getElementById('burger');
    const drawer = document.getElementById('drawer');
    const drawerClose = document.getElementById('drawerClose');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const openDrawer = () => { if (!burger || !drawer) return; burger.classList.add('open'); drawer.classList.add('open'); document.body.style.overflow = 'hidden'; burger.setAttribute('aria-expanded', 'true'); };
    const closeDrawer = () => { if (!burger || !drawer) return; burger.classList.remove('open'); drawer.classList.remove('open'); document.body.style.overflow = ''; burger.setAttribute('aria-expanded', 'false'); };
    burger?.addEventListener('click', () => burger.classList.contains('open') ? closeDrawer() : openDrawer());
    drawerClose?.addEventListener('click', closeDrawer);
    drawerOverlay?.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => e.key === 'Escape' && closeDrawer());
    drawer?.querySelectorAll('.drawer-link').forEach(a => a.addEventListener('click', closeDrawer));

    /* Smooth anchor scroll */
    const hdrH = () => hdr ? hdr.offsetHeight + 12 : 80;
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - hdrH(), behavior: 'smooth' });
      });
    });

    /* Reveal */
    const reveals = document.querySelectorAll('.reveal');
    const revealAll = () => reveals.forEach(el => el.classList.add('visible'));
    const check = () => reveals.forEach(el => { if (!el.classList.contains('visible') && el.getBoundingClientRect().top < innerHeight * .92) el.classList.add('visible'); });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), { threshold: 0, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(el => io.observe(el));
      window.addEventListener('scroll', check, { passive: true });
      requestAnimationFrame(check);
      setTimeout(revealAll, 2500);
    } else { revealAll(); }

    /* Scroll progress bar */
    let bar = document.getElementById('scrollProgress');
    if (!bar) { bar = document.createElement('div'); bar.id = 'scrollProgress'; bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;z-index:9999;background:linear-gradient(90deg,#073f47,#0d6e7a,#5cb88a);transition:width 80ms linear;pointer-events:none;'; document.body.appendChild(bar); }
    const updateBar = () => { const d = document.documentElement; bar.style.width = (d.scrollTop / (d.scrollHeight - d.clientHeight) * 100) + '%'; };
    window.addEventListener('scroll', updateBar, { passive: true });

    /* Counter animation */
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
      counters.forEach(el => { el.dataset.original = el.textContent; });
      const cIO = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target, final = el.dataset.original.trim();
          const m = final.match(/(\d+(?:\.\d+)?)/);
          if (!m) return;
          const num = parseFloat(m[1]), isFloat = m[1].includes('.');
          const before = final.slice(0, m.index), after = final.slice(m.index + m[1].length);
          const start = performance.now(), dur = 1600;
          const tick = now => {
            const t = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = before + (isFloat ? (num * eased).toFixed(1) : Math.round(num * eased)) + after;
            if (t < 1) requestAnimationFrame(tick); else el.textContent = final;
          };
          requestAnimationFrame(tick);
          cIO.unobserve(el);
        });
      }, { threshold: 0.3 });
      counters.forEach(el => cIO.observe(el));
    }

    /* Footer year */
    document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

    /* Hash scroll after load */
    if (location.hash) {
      const t = document.querySelector(location.hash);
      if (t) setTimeout(() => window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - hdrH(), behavior: 'smooth' }), 100);
    }

    /* Newsletter form */
    document.querySelectorAll('.newsletter-form').forEach(f => {
      f.addEventListener('submit', e => { e.preventDefault(); const btn = f.querySelector('button'); if (btn) { btn.textContent = '✓ Subscribed!'; btn.disabled = true; } f.querySelector('input').value = ''; });
    });

    /* Contact form */
    document.querySelectorAll('.contact-form').forEach(f => {
      f.addEventListener('submit', e => { e.preventDefault(); const btn = f.querySelector('button[type=submit]'); if (btn) { btn.textContent = '✓ Message sent!'; btn.disabled = true; setTimeout(() => { btn.textContent = 'Send Message'; btn.disabled = false; }, 3000); } });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadPartials();
    initUI();
  });
})();


/* ---- Gallery Lightbox ---- */
let galImgs = [], galCur = 0;

function openLightbox(src, cap) {
  const thumbs = document.querySelectorAll('.gal-thumb');
  galImgs = Array.from(thumbs).map(t => ({
    src: t.getAttribute('onclick').match(/'([^']+)'/)[1],
    cap: t.getAttribute('onclick').match(/'([^']+)','([^']+)'/)[2]
  }));
  galCur = galImgs.findIndex(i => i.src === src);
  showGalImg();
  const lb = document.getElementById('lightbox');
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function showGalImg() {
  document.getElementById('lightboxImg').src = galImgs[galCur].src;
  document.getElementById('lightboxCaption').textContent = galImgs[galCur].cap;
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}

function prevImg(e) {
  e.stopPropagation();
  galCur = (galCur - 1 + galImgs.length) % galImgs.length;
  showGalImg();
}

function nextImg(e) {
  e.stopPropagation();
  galCur = (galCur + 1) % galImgs.length;
  showGalImg();
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (lb && lb.style.display === 'flex') {
    if (e.key === 'ArrowLeft') prevImg(e);
    if (e.key === 'ArrowRight') nextImg(e);
    if (e.key === 'Escape') closeLightbox();
  }
});
