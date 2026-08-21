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
