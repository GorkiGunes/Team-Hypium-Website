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


/* ---------- TR / EN language switch ---------- */
const EN = {
'Hakkımızda':'About Us','Hikâyemiz':'Our Story','Takımımız':'Our Team','Projeler':'Projects','Hedefler':'Goals','Sponsorlar':'Sponsors','İletişim':'Contact','Bize Katıl':'Join Us','Takıma Katıl':'Join the Team','Bizi Tanı ↓':'Meet Us ↓','Takım Üyesi':'Team Members','Bağlı Kurum':'School','Maskot':'Mascot','Takım Numarası':'Team Number','Ejderha':'Dragon',
'Bir ejderha nasıl\nrobot üretir?':'How does a dragon\nbuild a robot?','Bir fikirden sahaya giden yol.':'From an idea to the field.','Atölyeden sahaya.':'From the workshop to the field.','Bizimle kanat açanlar.':'Those who spread their wings with us.','Bize ulaşın.':'Contact us.','Düzce’den dünyaya\nuzanan bir yolculuk.':'A journey from Düzce\nto the world.','Düzce\'den dünyaya\nuzanan bir yolculuk.':'A journey from Düzce\nto the world.','Bizi yetiştiren\nbilim ortamı.':'The scientific environment\nthat shapes us.','40 kişi,\ntek hedef.':'40 people,\none goal.','Robotun ötesinde\ndeğer üretmek.':'Creating value\nbeyond the robot.','Bir robottan\ndaha fazlası.':'More than\na robot.',
'Düzce Fen Lisesi':'Düzce Science High School','Takım Kaptanları':'Team Captains','Takım Kaptanı':'Team Captain','Mekanik':'Mechanical','Yazılım':'Software','İletişim':'Communications','Sponsorluk':'Sponsorship','Medya':'Media','Etkinlik':'Events','Sosyal Sorumluluk Projeleri':'Social Impact Projects','Maddi Destek':'Financial Support','Üretim Desteği':'Manufacturing Support','Sponsorluk Dosyasını İncele':'View Sponsorship Deck','Bizimle İletişime Geç':'Contact Us','Okulumuzun Resmî Sitesi ↗':'Official School Website ↗','Mesajı Gönder':'Send Message','AD SOYAD':'FULL NAME','E-POSTA':'EMAIL','MESAJ':'MESSAGE','KURUM':'INSTITUTION','KONUM':'LOCATION','INSTAGRAM':'INSTAGRAM',
'Özel Eğitim Kurumları Ziyaretleri':'Visits to Special Education Institutions','Mezun Öğrencilere Karne Hediyesi':'Graduation Gifts for Senior Students','Okul İçi Eğitimler':'In-School Training','Takımlar Arası Bilgi Paylaşımı':'Knowledge Sharing Between FRC Teams','İnsanlığa Değer Katmak':'Creating Value for Humanity','Rookie All-Star':'Rookie All-Star','Houston Yolculuğu':'Journey to Houston','Ağımızı Büyütmek':'Growing Our Network','Geleceğin Mühendisleri':'Engineers of the Future','Takımın Kuruluşu':'Team Founded','Takım İçi Seçim':'Team Election','Resmî Takım Numaramız':'Our Official Team Number','Sponsorlar ve FRC Ağı':'Sponsors and the FRC Network',
'Geçmişimizden ilham alıyor, geleceği inşa ediyoruz.':'Inspired by our past, we build the future.'
};
Object.assign(EN,{"Hypium FRC, Nisan 2026'da Düzce Fen Lisesi çatısı altında resmi olarak kuruldu. Düzce'nin ilk ve tek FRC takımı olarak yola çıkarken hedefimiz yalnızca bir yarışmaya katılmak değil; şehrimizde kalıcı bir mühendislik, üretim ve STEM kültürü oluşturmaktı.": "Hypium FRC was officially founded in April 2026 under Düzce Science High School. As the first and only FRC team in Düzce, our goal is not merely to enter a competition, but to build a lasting culture of engineering, production and STEM in our city.", "Hypium adı, Düzce'nin Konuralp bölgesindeki antik Prusias ad Hypium mirasına uzanır. Takım adımızla yaşadığımız şehrin tarihinden ilham alıyor, bu mirası teknoloji ve mühendislikle geleceğe taşıyoruz.": "The name Hypium reaches back to the ancient heritage of Prusias ad Hypium in Konuralp, Düzce. Our team name draws inspiration from the history of our city and carries that heritage into the future through technology and engineering.", "Hypium, iki takım kaptanı ve farklı uzmanlık alanlarında çalışan 40 öğrenciden oluşur. Her departman kendi sorumluluklarını yürütürken karar alma, üretim ve proje süreçlerinde diğer ekiplerle birlikte hareket eder.": "Hypium consists of 40 students working across different fields, led by two team captains. Each department manages its responsibilities while collaborating throughout decision-making, production and project processes.", "Ana hedefimiz insanlığa değer katmak. Teknolojiyi yalnızca yarışmak için değil; ihtiyaç sahibi insanlara ulaşan projeler geliştirmek, çevremizde kalıcı bir etki oluşturmak ve dünyayı daha iyi hale getirebilecek gençleri bir araya getirmek için kullanmak istiyoruz.": "Our main goal is to create value for humanity. We want to use technology not only to compete, but to develop projects that reach people in need, create lasting impact and bring together young people capable of making the world better."});
const EN_PH={'Adınız Soyadınız':'Your full name','ornek@eposta.com':'name@example.com','Bize ne söylemek istersin?':'How can we help?'};
function translatePage(lang){
 document.documentElement.lang=lang;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let n; while(n=walker.nextNode()){
   if(!n.parentElement || ['SCRIPT','STYLE'].includes(n.parentElement.tagName)) continue;
   if(n._tr===undefined) n._tr=n.nodeValue;
   const raw=n._tr, key=raw.trim();
   if(lang==='tr'){n.nodeValue=raw;continue;}
   if(EN[key]) n.nodeValue=raw.replace(key,EN[key]);
 }
 document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{if(!el.dataset.trPlaceholder)el.dataset.trPlaceholder=el.placeholder;el.placeholder=lang==='en'?(EN_PH[el.dataset.trPlaceholder]||el.dataset.trPlaceholder):el.dataset.trPlaceholder});
 document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
 localStorage.setItem('hypium-lang',lang);
}
document.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click',()=>translatePage(b.dataset.lang)));
translatePage(localStorage.getItem('hypium-lang')||'tr');

});
