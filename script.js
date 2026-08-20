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
  // 'gallery/atolye-1.jpg',
  // 'gallery/musabaka-1.jpg',
  // 'gallery/robot-1.jpg',
];

const SPONSORS = [
  // { name: 'Firma Adı', logo: 'sponsors/firma-logo.png', url: 'https://firma-sitesi.com' },
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

  /* ---------- Gallery placeholder tiles ---------- */
  const icons = [
    // wrench
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.1-2.1 2.6-2.6z"/></svg>',
    // gear
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    // robot arm
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><rect x="4" y="4" width="6" height="6" rx="1"/><path d="M10 7h5l4 6"/><circle cx="19" cy="15" r="2"/></svg>',
    // circuit
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M6 8v4a2 2 0 0 0 2 2h4M12 14h4a2 2 0 0 0 2-2v-2"/></svg>',
    // camera / photo
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg>',
    // trophy
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5M12 13v3M9 20h6M10 16h4v4h-4z"/></svg>',
    // dragon wing (abstract)
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><path d="M3 18c4-1 6-5 6-10 2 3 2 7 0 10-3 2-4 2-6 0zM21 18c-4-1-6-5-6-10-2 3-2 7 0 10 3 2 4 2 6 0z"/></svg>',
    // laptop / code
    '<svg viewBox="0 0 24 24" fill="none" stroke="#b8dcf2" stroke-width="1.4"><rect x="4" y="5" width="16" height="10" rx="1"/><path d="M2 19h20M9 9l-2 2 2 2M15 9l2 2-2 2"/></svg>',
  ];
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryNote = document.getElementById('galleryNote');
  if (galleryGrid) {
    if (GALLERY_IMAGES.length > 0) {
      const spans = [true, false, false, false, false, true, false, false];
      GALLERY_IMAGES.forEach((src, i) => {
        const tile = document.createElement('div');
        tile.className = 'gallery-tile has-photo' + (spans[i % spans.length] ? ' span2' : '');
        const img = document.createElement('img');
        img.src = 'assets/' + src;
        img.alt = 'Hypium galeri fotoğrafı';
        img.loading = 'lazy';
        tile.appendChild(img);
        galleryGrid.appendChild(tile);
      });
      if (galleryNote) galleryNote.style.display = 'none';
    } else {
      const spans = [true, false, false, false, false, true, false, false];
      icons.forEach((svg, i) => {
        const tile = document.createElement('div');
        tile.className = 'gallery-tile' + (spans[i] ? ' span2' : '');
        tile.innerHTML = svg;
        galleryGrid.appendChild(tile);
      });
    }
  }

  /* ---------- Sponsor placeholder slots ---------- */
  const sponsorGrid = document.getElementById('sponsorGrid');
  if (sponsorGrid) {
    if (SPONSORS.length > 0) {
      SPONSORS.forEach(sponsor => {
        const slot = document.createElement(sponsor.url ? 'a' : 'div');
        slot.className = 'sponsor-slot has-logo';
        if (sponsor.url) { slot.href = sponsor.url; slot.target = '_blank'; slot.rel = 'noopener'; }
        const img = document.createElement('img');
        img.src = 'assets/' + sponsor.logo;
        img.alt = sponsor.name || 'Sponsor logosu';
        img.loading = 'lazy';
        slot.appendChild(img);
        sponsorGrid.appendChild(slot);
      });
    } else {
      for (let i = 1; i <= 8; i++) {
        const slot = document.createElement('div');
        slot.className = 'sponsor-slot';
        slot.textContent = 'SPONSOR ' + String(i).padStart(2, '0');
        sponsorGrid.appendChild(slot);
      }
    }
  }

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

  /* ---------- Contact form (mailto fallback) ---------- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name');
    const email = data.get('email');
    const message = data.get('message');

    const mailLink = document.querySelector('.info-row a[href^="mailto:"]');
    const to = mailLink ? mailLink.getAttribute('href').replace('mailto:', '') : 'hypium@duzcefenlisesi.k12.tr';

    const subject = encodeURIComponent('Web sitesi iletişim formu — ' + name);
    const body = encodeURIComponent(`Gönderen: ${name}\nE-posta: ${email}\n\n${message}`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    status.textContent = 'E-posta uygulamanız açılıyor...';
    form.reset();
  });

  /* ---------- Nav background intensifies on scroll ---------- */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) nav.style.borderBottomColor = 'rgba(255,179,0,0.25)';
    else nav.style.borderBottomColor = 'rgba(255,255,255,0.16)';
  });

});
