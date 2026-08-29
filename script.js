// ============================================
// HYPIUM FRC TEAM — script.js
// ============================================

/* ============================================
   BURAYI DÜZENLEYİN — Galeri ve Sponsor görselleri
   ============================================
   Fotoğraflarınızı assets/gallery/ klasörüne, sponsor logolarını
   assets/sponsors/ klasörüne koyun ve dosya adlarını aşağıdaki
   listelere ekleyin. Liste boş kalırsa yer tutucu (placeholder)
   kutular otomatik olarak gösterilir. */

const GALLERY_IMAGES = [
  'gallery/glory.png',
  'gallery/nightwings.png',
  'gallery/yeseil.png',
  'gallery/yesil.png',
];

const SPONSORS = [
  { name: 'CHT', logo: 'sponsors/cht.png' },
  { name: 'Teknorot', logo: 'sponsors/teknorot.png' },
];

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile nav toggle ---------- */
  const nav = document.getElementById('siteNav');
  const navToggle = document.getElementById('navToggle');
  navToggle?.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  document.querySelectorAll('.nav-links a, .nav-cta').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });

  /* Gallery and sponsor images are rendered directly in index.html for reliable mobile loading. */

  /* ---------- Scroll reveal (progressive enhancement, safe fallback) ---------- */
  const revealTargets = document.querySelectorAll('.section-head, .about-copy, .about-subteams, .frc-lead, .frc-steps, .gallery-grid, .sponsor-grid, .sponsor-tiers, .contact-info, .contact-form');

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => io.observe(el));

    // Safety net: if something never intersects (e.g. very short viewport,
    // odd device), reveal everything anyway after a short delay so content
    // is never permanently stuck invisible.
    window.setTimeout(() => {
      revealTargets.forEach(el => el.classList.add('reveal-in'));
    }, 2500);
  }

  /* ---------- Contact form ---------- */
  // Form gönderimi HTML form action üzerinden güvenli HTTPS POST ile yapılır.

  /* ---------- Nav background intensifies on scroll ---------- */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) nav.style.borderBottomColor = 'rgba(255,179,0,0.25)';
    else nav.style.borderBottomColor = 'rgba(255,255,255,0.16)';
  });

});

/* v15 — drawer accessibility + Impact counters */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  toggle?.addEventListener('click', () => toggle.setAttribute('aria-expanded', siteNav?.classList.contains('open') ? 'true' : 'false'));
  document.addEventListener('click', (e) => {
    if (siteNav?.classList.contains('open') && !siteNav.contains(e.target)) {
      siteNav.classList.remove('open'); toggle?.setAttribute('aria-expanded','false');
    }
  });
  const cards=[...document.querySelectorAll('.metric-card')];
  if(!cards.length) return;
  const animate=(card)=>{
    const value=card.querySelector('[data-count]'); const bar=card.querySelector('[data-progress]');
    const target=Number(value?.dataset.count||0); const start=performance.now(); const dur=950;
    if(bar){bar.style.setProperty('--progress',(bar.dataset.progress||0)+'%'); card.classList.add('metric-in');}
    if(!value) return;
    const tick=(now)=>{const p=Math.min(1,(now-start)/dur); const eased=1-Math.pow(1-p,3); value.textContent=Math.round(target*eased); if(p<1)requestAnimationFrame(tick)}; requestAnimationFrame(tick);
  };
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){animate(e.target);io.unobserve(e.target)}}),{threshold:.35});cards.forEach(c=>io.observe(c));}else cards.forEach(animate);
});

/* =====================================================
   v16 — Hub motion system
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('hub-page')) return;

  const body = document.body;
  const progress = document.querySelector('.scroll-progress i');
  const blueprint = document.querySelector('.hub-hero .blueprint-grid');
  const heroInner = document.querySelector('.hub-hero-inner');
  const sections = [...document.querySelectorAll('.section')];
  const motionItems = [...document.querySelectorAll('.motion-item')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stagger cards and alternate directional entrances.
  const groupedSelectors = ['.metric-card', '.eng-step', '.project-card', '.engineering-card', '.course-card', '.academy-principles article', '.season-item'];
  groupedSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 85, 420)}ms`;
      if (i % 3 === 1) el.dataset.motion = 'left';
      else if (i % 3 === 2) el.dataset.motion = 'right';
      else el.dataset.motion = 'zoom';
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    motionItems.forEach(el => el.classList.add('motion-in'));
  } else {
    const motionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-in');
          motionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    motionItems.forEach(el => motionObserver.observe(el));
  }

  // Scroll progress, parallax and scroll-stop state.
  let settleTimer;
  let raf = false;
  const updateScrollMotion = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.width = `${Math.min(100, y / max * 100)}%`;
    if (!reduceMotion) {
      if (blueprint) blueprint.style.transform = `translate3d(0, ${Math.min(y * .12, 80)}px, 0)`;
      if (heroInner) heroInner.style.transform = `translate3d(0, ${Math.min(y * .035, 22)}px, 0)`;
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const offset = Math.max(-35, Math.min(35, (innerHeight / 2 - (rect.top + rect.height / 2)) * .035));
        section.style.setProperty('--section-parallax', `${offset}px`);
      });
    }
    raf = false;
  };

  window.addEventListener('scroll', () => {
    body.classList.add('is-scrolling');
    body.classList.remove('scroll-settled');
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      body.classList.remove('is-scrolling');
      body.classList.add('scroll-settled');
      setTimeout(() => body.classList.remove('scroll-settled'), 900);
    }, 150);
    if (!raf) { requestAnimationFrame(updateScrollMotion); raf = true; }
  }, { passive: true });
  updateScrollMotion();

  // Soft pointer tilt only on precise pointer devices.
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.metric-card,.project-card,.engineering-card,.course-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY-r.top)/r.height-.5)*-2.2;
        const ry = ((e.clientX-r.left)/r.width-.5)*2.2;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
      });
      card.addEventListener('mouseleave', () => card.style.transform = '');
    });
  }
});


/* =====================================================
   v20 — Interactive Impact Map
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('impactMap');
  const cards = [...document.querySelectorAll('[data-impact-location]')];
  if (!mapEl || !cards.length) return;

  if (typeof L === 'undefined') {
    mapEl.innerHTML = '<div style="padding:24px;color:#4b5563">Interactive map could not be loaded. Event locations remain available in the list.</div>';
    return;
  }

  const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true }).setView([39.4, 35.2], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const markers = cards.map((card, index) => {
    const lat = Number(card.dataset.lat), lng = Number(card.dataset.lng);
    const marker = L.marker([lat, lng]).addTo(map);
    const popup = `<div class="impact-popup"><img src="${card.dataset.image}" alt=""><div class="impact-popup-copy"><small>${card.dataset.location} · ${card.dataset.date}</small><strong>${card.dataset.title}</strong><p>${card.dataset.description}</p></div></div>`;
    marker.bindPopup(popup, { maxWidth: 310 });
    marker.on('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      map.flyTo([lat, lng], Number(card.dataset.zoom || 9), { duration: .8 });
      marker.openPopup();
    });
    return marker;
  });
  const group = L.featureGroup(markers);
  map.fitBounds(group.getBounds().pad(.55), { maxZoom: 7 });
});
