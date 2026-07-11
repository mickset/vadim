/* ---------- Telegram bot config ----------
   1. Create a bot via @BotFather in Telegram, copy the token it gives you.
   2. Send any message to the bot (or add it to a group) then open
      https://api.telegram.org/bot<TOKEN>/getUpdates in a browser to find the chat id
      (it's the number in "chat":{"id":...}). Group chat ids are negative.
   3. Paste both values below. */
const TELEGRAM_BOT_TOKEN = '8278679014:AAGhhPe6CxtGwyLdVAkGsDu_HYzFkfL8mwU';
const TELEGRAM_CHAT_ID = '-1001952149907';

/* ---------- Supabase config (mini-CRM storage) ----------
   1. Run supabase-setup.sql (in this same folder) in the Supabase SQL editor
      (Dashboard -> SQL Editor -> New query -> paste -> Run).
   2. Project Settings -> API -> copy the "anon public" key below.
   3. Also create an admin login: Authentication -> Users -> Add user (email + password) —
      that's what you'll use to sign in on admin.html. */
const SUPABASE_URL = 'https://pzdvyzkmgzjznwnroztz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZHZ5emttZ3pqem53bnJvenR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTk2NjQsImV4cCI6MjA5OTA5NTY2NH0.SQ0I1FME0Tcb1JuPPCF7gSR6aZh56GygdOhWrM5Kfd8';

// persistSession/autoRefreshToken: false — this is the PUBLIC site's client. It must always
// act as a plain anonymous visitor and must NOT pick up an admin session that happens to be
// stored in this browser's localStorage (e.g. if you're also logged into admin.html on the
// same origin). Without this, supabase-js would silently send the admin's auth token instead
// of the anon key, and inserts would get rejected by RLS (no INSERT policy for authenticated).
const supabaseClient = (window.supabase && SUPABASE_ANON_KEY !== 'ВАШ_SUPABASE_ANON_KEY')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  : null;

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
  // Opening the modal from a generic CTA (not from a specific lot) should not
  // carry over a previously-selected unit into an unrelated submission.
  const openModalFresh = () => { window.__selectedUnitLabel = null; openModal(); };
  const closeModal = () => modalOverlay.classList.remove('open');

  document.getElementById('ctaHeaderBtn').addEventListener('click', openModalFresh);
  document.getElementById('ctaCallbackBtn').addEventListener('click', openModalFresh);
  const ctaHeroBtn = document.getElementById('ctaHeroBtn');
  if (ctaHeroBtn) ctaHeroBtn.addEventListener('click', openModalFresh);
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  const LEAD_THROTTLE_MS = 60000; // don't let the same browser submit more than once per minute

  document.getElementById('callForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: real visitors never see or fill this field. If it has a value, this is a bot —
    // pretend everything worked (don't tip it off) and quietly drop the submission.
    const honeypot = document.getElementById('callWebsite');
    if (honeypot && honeypot.value.trim() !== '') {
      closeModal();
      e.target.reset();
      return;
    }

    // Throttle: block rapid repeat submissions from the same browser.
    const lastSubmit = Number(localStorage.getItem('leadLastSubmitAt') || 0);
    if (Date.now() - lastSubmit < LEAD_THROTTLE_MS) {
      alert('Заявка уже отправлена недавно — мы уже её получили, ожидайте звонка.');
      return;
    }

    const name = document.getElementById('callName').value.trim();
    const phone = document.getElementById('callPhone').value.trim();
    const submitBtn = document.getElementById('callSubmitBtn');

    const text =
      '📞 Новая заявка "Заказать звонок" с сайта Aphrodite Bay\n' +
      'Имя: ' + (name || '—') + '\n' +
      'Телефон: ' + (phone || '—') +
      (window.__selectedUnitLabel ? '\nИнтересует: ' + window.__selectedUnitLabel : '');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    // Fire both integrations in parallel; don't let one failure block the other.
    const telegramPromise = fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
    }).then(r => r.json()).catch(err => ({ ok: false, error: err }));

    const supabasePromise = supabaseClient
      ? supabaseClient.from('leads').insert({ name, phone }).then(r => r)
      : Promise.resolve({ error: 'supabase not configured' });

    const [tgResult, sbResult] = await Promise.all([telegramPromise, supabasePromise]);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Заказать звонок';

    if (!tgResult.ok) console.error('Telegram error:', tgResult);
    if (sbResult && sbResult.error) console.error('Supabase error:', sbResult.error);

    if (tgResult.ok || (sbResult && !sbResult.error)) {
      localStorage.setItem('leadLastSubmitAt', String(Date.now()));
      alert('Спасибо! Мы вам перезвоним в ближайшее время.');
      closeModal();
      e.target.reset();
      window.__selectedUnitLabel = null;
    } else {
      alert('Не удалось отправить заявку. Попробуйте позвонить нам напрямую.');
    }
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

  /* ---------- Apartment plans data ----------
     Aphrodite Bay is a fictional demo project — прайс-лист и площади вымышленные.
     rooms: 0 = студия, 1 = однокомнатная, 2 = двухкомнатная.
     group: 'floor2' / 'floor3-8' — условное разбиение по этажам для демонстрации фильтра.
     Планировки — иллюстративные схемы (свои SVG), не настоящие чертежи. */
  const PLAN_IMG_BY_ROOMS = { 0: 'floorplan-studio.svg', 1: 'floorplan-1br.svg', 2: 'floorplan-2br.svg' };
  const plans = [
    { rooms: 0, area: 39.5, live: 35.7, price: 7140000,  group: 'floor2' },
    { rooms: 1, area: 43.3, live: 41.8, price: 8360000,  group: 'floor2' },
    { rooms: 2, area: 61.1, live: 57.3, price: 11460000, group: 'floor2' },
    { rooms: 1, area: 38.2, live: 35.3, price: 7060000,  group: 'floor2' },
    { rooms: 1, area: 38.8, live: 35.9, price: 7180000,  group: 'floor2' },
    { rooms: 1, area: 48.1, live: 46.7, price: 9340000,  group: 'floor3-8' },
    { rooms: 2, area: 75.0, live: 68.9, price: 13780000, group: 'floor3-8' },
    { rooms: 0, area: 41.0, live: 37.0, price: 7400000,  group: 'floor3-8' },
    { rooms: 2, area: 67.0, live: 61.2, price: 12240000, group: 'floor3-8' },
    { rooms: 1, area: 51.7, live: 48.3, price: 9660000,  group: 'floor3-8' },
    { rooms: 2, area: 72.8, live: 62.5, price: 15625000, group: 'floor3-8' },
    { rooms: 0, area: 44.6, live: 36.7, price: 9175000,  group: 'floor3-8' },
    { rooms: 0, area: 42.3, live: 34.9, price: 8725000,  group: 'floor3-8' },
    { rooms: 0, area: 42.4, live: 35.0, price: 8750000,  group: 'floor3-8' },
    { rooms: 1, area: 57.4, live: 50.5, price: 12625000, group: 'floor3-8' },
    { rooms: 1, area: 51.2, live: 47.5, price: 11875000, group: 'floor3-8' }
  ].map((p, i) => Object.assign({ id: i + 1, img: PLAN_IMG_BY_ROOMS[p.rooms] }, p));

  const ROOM_LABELS = { 0: 'Студия', 1: '1-комнатная', 2: '2-комнатная' };
  const GROUP_LABELS = { 'floor2': '2 этаж', 'floor3-8': '3–8 этажи' };
  const fmtRub = n => n.toLocaleString('ru-RU') + ' ₽';
  const fmtArea = n => n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  /* ---------- Tower picker (marker popovers) ---------- */
  const towerStage = document.getElementById('towerStage');
  const towerPopover = document.getElementById('towerPopover');
  const towerPopoverTitle = document.getElementById('towerPopoverTitle');
  const towerPopoverCount = document.getElementById('towerPopoverCount');
  const towerPopoverFrom = document.getElementById('towerPopoverFrom');
  const towerPopoverLink = document.getElementById('towerPopoverLink');
  let activeMarkerGroup = null;

  function showTowerPopover(marker, group) {
    const matches = plans.filter(p => p.group === group);
    const minPrice = Math.min(...matches.map(p => p.price));
    towerPopoverTitle.textContent = GROUP_LABELS[group];
    towerPopoverCount.textContent = matches.length + ' ' + pluralPlan(matches.length);
    towerPopoverFrom.textContent = minPrice.toLocaleString('ru-RU');
    activeMarkerGroup = group;

    towerPopover.hidden = false;
    const mx = marker.style.getPropertyValue('--x');
    const my = marker.style.getPropertyValue('--y');
    towerPopover.style.left = mx;
    towerPopover.style.top = my;
    const stageRect = towerStage.getBoundingClientRect();
    const markerLeftPx = (parseFloat(mx) / 100) * stageRect.width;
    towerPopover.style.transform = markerLeftPx > stageRect.width / 2
      ? 'translate(-100%, 14px)' : 'translate(0, 14px)';

    document.querySelectorAll('.tower-marker').forEach(m => m.classList.remove('active'));
    marker.classList.add('active');
  }

  function pluralPlan(n) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'планировка';
    if ([2,3,4].includes(mod10) && ![12,13,14].includes(mod100)) return 'планировки';
    return 'планировок';
  }

  document.querySelectorAll('.tower-marker').forEach(marker => {
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      showTowerPopover(marker, marker.getAttribute('data-group'));
    });
  });
  document.addEventListener('click', (e) => {
    if (towerPopover && !towerPopover.hidden && !towerPopover.contains(e.target) && !e.target.closest('.tower-marker')) {
      towerPopover.hidden = true;
      document.querySelectorAll('.tower-marker').forEach(m => m.classList.remove('active'));
    }
  });

  const paramsViewBtn = document.getElementById('paramsViewBtn');
  const towerViewBtn = document.getElementById('towerViewBtn');
  if (paramsViewBtn) paramsViewBtn.addEventListener('click', () => {
    paramsViewBtn.classList.add('segmented-btn-active');
    towerViewBtn.classList.remove('segmented-btn-active');
    openPlansModal();
  });
  if (towerViewBtn) towerViewBtn.addEventListener('click', () => {
    towerViewBtn.classList.add('segmented-btn-active');
    paramsViewBtn.classList.remove('segmented-btn-active');
  });
  if (towerPopoverLink) towerPopoverLink.addEventListener('click', () => {
    openPlansModal({ group: activeMarkerGroup });
  });

  /* ---------- Plans filter modal ---------- */
  const plansModalOverlay = document.getElementById('plansModalOverlay');
  const plansListView = document.getElementById('plansListView');
  const plansLotView = document.getElementById('plansLotView');
  const plansGrid = document.getElementById('plansGrid');
  const plansCount = document.getElementById('plansCount');
  const roomsChips = document.querySelectorAll('#roomsChips .chip');
  const floorChips = document.querySelectorAll('#floorChips .chip');
  const areaFrom = document.getElementById('areaFrom');
  const areaTo = document.getElementById('areaTo');
  const priceFrom = document.getElementById('priceFrom');
  const priceTo = document.getElementById('priceTo');
  const plansSort = document.getElementById('plansSort');

  function openPlansModal(preset) {
    plansModalOverlay.classList.add('open');
    plansLotView.hidden = true;
    plansListView.hidden = false;
    if (preset && preset.group) {
      floorChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-group') === preset.group));
    }
    renderPlansGrid();
  }
  function closePlansModal() { plansModalOverlay.classList.remove('open'); }

  document.getElementById('plansModalClose').addEventListener('click', closePlansModal);
  plansModalOverlay.addEventListener('click', (e) => { if (e.target === plansModalOverlay) closePlansModal(); });

  roomsChips.forEach(chip => chip.addEventListener('click', () => { chip.classList.toggle('active'); renderPlansGrid(); }));
  floorChips.forEach(chip => chip.addEventListener('click', () => { chip.classList.toggle('active'); renderPlansGrid(); }));
  [areaFrom, areaTo, priceFrom, priceTo].forEach(input => input.addEventListener('input', renderPlansGrid));
  plansSort.addEventListener('change', renderPlansGrid);

  document.getElementById('plansResetBtn').addEventListener('click', () => {
    roomsChips.forEach(c => c.classList.remove('active'));
    floorChips.forEach(c => c.classList.remove('active'));
    areaFrom.value = ''; areaTo.value = ''; priceFrom.value = ''; priceTo.value = '';
    plansSort.value = 'price-asc';
    renderPlansGrid();
  });

  function getFilteredPlans() {
    const activeRooms = Array.from(roomsChips).filter(c => c.classList.contains('active')).map(c => Number(c.getAttribute('data-rooms')));
    const activeGroups = Array.from(floorChips).filter(c => c.classList.contains('active')).map(c => c.getAttribute('data-group'));
    const aFrom = parseFloat(areaFrom.value) || 0;
    const aTo = parseFloat(areaTo.value) || Infinity;
    const pFrom = parseFloat(priceFrom.value) || 0;
    const pTo = parseFloat(priceTo.value) || Infinity;

    let list = plans.filter(p =>
      (!activeRooms.length || activeRooms.includes(p.rooms)) &&
      (!activeGroups.length || activeGroups.includes(p.group)) &&
      p.area >= aFrom && p.area <= aTo &&
      p.price >= pFrom && p.price <= pTo
    );

    const sort = plansSort.value;
    list = list.slice().sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'area-asc') return a.area - b.area;
      if (sort === 'area-desc') return b.area - a.area;
      return 0;
    });
    return list;
  }

  function renderPlansGrid() {
    const list = getFilteredPlans();
    plansCount.textContent = list.length + ' ' + pluralPlan(list.length);
    if (!list.length) {
      plansGrid.innerHTML = '<p class="plans-empty">Ничего не найдено — попробуйте изменить фильтр</p>';
      return;
    }
    plansGrid.innerHTML = list.map(p => (
      '<div class="plan-card-item" data-id="' + p.id + '">' +
        '<img src="' + p.img + '" alt="Планировка №' + p.id + '" loading="lazy">' +
        '<p class="pc-meta">№' + p.id + ' · ' + GROUP_LABELS[p.group] + '</p>' +
        '<p class="pc-title">' + ROOM_LABELS[p.rooms] + ', ' + fmtArea(p.area) + ' м²</p>' +
        '<p class="pc-price">' + fmtRub(p.price) + '</p>' +
      '</div>'
    )).join('');
    plansGrid.querySelectorAll('.plan-card-item').forEach(card => {
      card.addEventListener('click', () => openLot(Number(card.getAttribute('data-id'))));
    });
  }

  /* ---------- Lot detail view ---------- */
  function openLot(id) {
    const p = plans.find(x => x.id === id);
    if (!p) return;
    document.getElementById('lotImage').src = p.img;
    document.getElementById('lotTitle').textContent = 'Планировка №' + p.id;
    document.getElementById('lotArea').textContent = fmtArea(p.area) + ' м²';
    document.getElementById('lotLive').textContent = fmtArea(p.live);
    document.getElementById('lotRooms').textContent = ROOM_LABELS[p.rooms];
    document.getElementById('lotFloor').textContent = GROUP_LABELS[p.group];
    document.getElementById('lotPrice').textContent = fmtRub(p.price);
    document.getElementById('lotPricePerM2').textContent = Math.round(p.price / p.area).toLocaleString('ru-RU') + ' ₽/м²';
    window.__selectedUnitLabel = ROOM_LABELS[p.rooms] + ' №' + p.id + ', ' + fmtArea(p.area) + ' м², ' + fmtRub(p.price);

    plansListView.hidden = true;
    plansLotView.hidden = false;
    plansLotView.scrollTop = 0;
  }

  document.getElementById('lotBackBtn').addEventListener('click', () => {
    plansLotView.hidden = true;
    plansListView.hidden = false;
  });

  document.getElementById('lotCtaBtn').addEventListener('click', () => {
    closePlansModal();
    modalOverlay.classList.add('open');
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

  /* ---------- Scroll-reveal animations ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---------- Animated number counters (stat cards) ---------- */
  const counterEls = document.querySelectorAll('.count[data-count]');

  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = target * eased;
      el.textContent = value.toLocaleString('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (counterEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counterEls.forEach(el => {
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        el.textContent = parseFloat(el.getAttribute('data-count')).toLocaleString('ru-RU', {
          minimumFractionDigits: decimals, maximumFractionDigits: decimals
        });
      });
    } else {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counterEls.forEach(el => counterObserver.observe(el));
    }
  }

});
