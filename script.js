document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  const toTopBtn = document.getElementById('toTopBtn');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 10);
    toTopBtn.classList.toggle('visible', y > 500);
  });

  toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile burger menu ---------- */
  const burgerBtn = document.getElementById('burgerBtn');
  const mainNav = document.getElementById('mainNav');
  burgerBtn.addEventListener('click', () => mainNav.classList.toggle('open'));
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('open')));

  /* ---------- Call modal ---------- */
  const modalOverlay = document.getElementById('callModalOverlay');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const openModal = () => modalOverlay.classList.add('open');
  const closeModal = () => modalOverlay.classList.remove('open');

  document.getElementById('ctaHeaderBtn').addEventListener('click', openModal);
  document.getElementById('ctaCallbackBtn').addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  document.getElementById('callForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Спасибо! Заявка отправлена (демо-форма).');
    closeModal();
    e.target.reset();
  });

  /* ---------- Advantages carousel (simple horizontal scroll) ---------- */
  const advTrack = document.getElementById('advantagesTrack');
  document.getElementById('advNext').addEventListener('click', () => {
    advTrack.scrollBy({ left: advTrack.clientWidth * 0.9, behavior: 'smooth' });
  });
  document.getElementById('advPrev').addEventListener('click', () => {
    advTrack.scrollBy({ left: -advTrack.clientWidth * 0.9, behavior: 'smooth' });
  });
  advTrack.style.overflowX = 'auto';
  advTrack.style.scrollSnapType = 'x mandatory';

  /* ---------- Gallery carousel ---------- */
  const galTrack = document.getElementById('galleryTrack');
  document.getElementById('galNext').addEventListener('click', () => {
    galTrack.scrollBy({ left: galTrack.clientWidth * 0.9, behavior: 'smooth' });
  });
  document.getElementById('galPrev').addEventListener('click', () => {
    galTrack.scrollBy({ left: -galTrack.clientWidth * 0.9, behavior: 'smooth' });
  });
  galTrack.style.overflowX = 'auto';

  /* ---------- Apartment plans data & slider ---------- */
  const plans = [
    { title: 'Студия, 39.5 м2 (35.7 м2)', price: 'от 7 140 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0001.jpg' },
    { title: 'Однокомнатная, 43.3 м2 (41.8 м2)', price: 'от 8 360 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0002.jpg' },
    { title: 'Двухкомнатная, 61.1 м2 (57.3 м2)', price: 'от 11 460 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0003.jpg' },
    { title: 'Однокомнатная, 38.2 м2 (35.3 м2)', price: 'от 7 060 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0004.jpg' },
    { title: 'Однокомнатная, 38.8 м2 (35.9 м2)', price: 'от 7 180 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0005.jpg' },
    { title: 'Однокомнатная, 48.1 м2 (46.7 м2)', price: 'от 9 340 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0006.jpg' },
    { title: 'Двухкомнатная, 75.0 м2 (68.9 м2)', price: 'от 13 780 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0007.jpg' },
    { title: 'Студия, 41.0 м2 (37.0 м2)', price: 'от 7 400 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0008.jpg' },
    { title: 'Двухкомнатная, 67.0 м2 (61.2 м2)', price: 'от 12 240 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-0009.jpg' },
    { title: 'Однокомнатная, 51.7 м2 (48.3 м2)', price: 'от 9 660 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-00010.jpg' },
    { title: 'Двухкомнатная, 72.8 м2 (62.5 м2)', price: 'от 15 625 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-00011.jpg' },
    { title: 'Студия, 44.6 м2 (36.7 м2)', price: 'от 9 175 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-00012.jpg' },
    { title: 'Студия, 42.3 м2 (34.9 м2)', price: 'от 8 725 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-00013.jpg' },
    { title: 'Студия, 42.4 м2 (35.0 м2)', price: 'от 8 750 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-00014.jpg' },
    { title: 'Однокомнатная, 57.4 м2 (50.5 м2)', price: 'от 12 625 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-00015.jpg' },
    { title: 'Однокомнатная, 51.2 м2 (47.5 м2)', price: 'от 11 875 000 р.', img: 'https://sz-gradient.ru/images/plan/sm_page-00016.jpg' }
  ];

  let planIndex = 0;
  const planTitleEl = document.getElementById('planTitle');
  const planPriceEl = document.getElementById('planPrice');
  const planImageEl = document.getElementById('planImage');

  function renderPlan() {
    const p = plans[planIndex];
    planTitleEl.textContent = p.title;
    planPriceEl.textContent = p.price;
    planImageEl.src = p.img;
  }

  document.getElementById('planNext').addEventListener('click', () => {
    planIndex = (planIndex + 1) % plans.length;
    renderPlan();
  });
  document.getElementById('planPrev').addEventListener('click', () => {
    planIndex = (planIndex - 1 + plans.length) % plans.length;
    renderPlan();
  });

  /* ---------- Plan tabs (visual state only) ---------- */
  document.querySelectorAll('.plan-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('plan-tab-active'));
      tab.classList.add('plan-tab-active');
    });
  });

  /* ---------- Smooth in-page nav (handles fixed header offset) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

});
