document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header / hero CTA buttons ----------
     "Выбрать квартиру" goes to the picker, "Характеристики дома" goes to
     the About section (specs/stats live there). No backend — just smooth
     scroll. */
  const ctaTargets = { ctaHeaderBtn: 'planirovki', ctaHeroBtn: 'planirovki', ctaSpecsBtn: 'o-proekte' };
  Object.keys(ctaTargets).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      document.getElementById(ctaTargets[id])?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Lead form ----------
     No backend wired up — client-side "thanks" state only, matching the
     rest of this demo project. */
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const thanks = leadForm.querySelector('.lead-thanks');
      leadForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
      if (thanks) thanks.hidden = false;
    });
  }

  /* ---------- Apartment picker (Планировки) ----------
     Real unit data scraped from sz-gradient.ru's own planirovki block —
     16 units, room type / total area / living area / starting price.
     twelve.ru's picker also filters by corpus/floor/features, but that
     level of detail isn't in the source data, so this keeps to what's
     verifiably real: room type + price/area sort, same as twelve's core
     filter bar. */
  const APARTMENTS = [
    { rooms: 'Студия', area: 39.5, living: 35.7, price: 7140000 },
    { rooms: 'Однокомнатная', area: 43.3, living: 41.8, price: 8360000 },
    { rooms: 'Двухкомнатная', area: 61.1, living: 57.3, price: 11460000 },
    { rooms: 'Однокомнатная', area: 38.2, living: 35.3, price: 7060000 },
    { rooms: 'Однокомнатная', area: 38.8, living: 35.9, price: 7180000 },
    { rooms: 'Однокомнатная', area: 48.1, living: 46.7, price: 9340000 },
    { rooms: 'Двухкомнатная', area: 75.0, living: 68.9, price: 13780000 },
    { rooms: 'Студия', area: 41.0, living: 37.0, price: 7400000 },
    { rooms: 'Двухкомнатная', area: 67.0, living: 61.2, price: 12240000 },
    { rooms: 'Однокомнатная', area: 51.7, living: 48.3, price: 9660000 },
    { rooms: 'Двухкомнатная', area: 72.8, living: 62.5, price: 15625000 },
    { rooms: 'Студия', area: 44.6, living: 36.7, price: 9175000 },
    { rooms: 'Студия', area: 42.3, living: 34.9, price: 8725000 },
    { rooms: 'Студия', area: 42.4, living: 35.0, price: 8750000 },
    { rooms: 'Однокомнатная', area: 57.4, living: 50.5, price: 12625000 },
    { rooms: 'Однокомнатная', area: 51.2, living: 47.5, price: 11875000 },
  ];

  const pickerGrid = document.getElementById('pickerGrid');
  if (pickerGrid) {
    const chips = document.querySelectorAll('.picker-chip');
    const sortSelect = document.getElementById('pickerSort');
    const countEl = document.getElementById('pickerCount');
    const emptyEl = document.getElementById('pickerEmpty');
    let activeRooms = 'all';

    const priceFmt = new Intl.NumberFormat('ru-RU');

    function render() {
      let list = APARTMENTS.filter(a => activeRooms === 'all' || a.rooms === activeRooms);

      const sortBy = sortSelect ? sortSelect.value : 'default';
      if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
      else if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
      else if (sortBy === 'area-asc') list = [...list].sort((a, b) => a.area - b.area);
      else if (sortBy === 'area-desc') list = [...list].sort((a, b) => b.area - a.area);

      if (countEl) countEl.textContent = list.length + ' ' + pluralizeVariants(list.length);
      if (emptyEl) emptyEl.hidden = list.length > 0;

      pickerGrid.innerHTML = list.map(a => `
        <div class="picker-card">
          <span class="picker-card-badge">${a.rooms}</span>
          <div>
            <p class="picker-card-title">${a.rooms}, ${a.area.toFixed(1)} м²</p>
            <p class="picker-card-area">Жилая площадь ${a.living.toFixed(1)} м²</p>
          </div>
          <p class="picker-card-price"><span>от</span>${priceFmt.format(a.price)} ₽</p>
          <a class="picker-card-cta" href="#lokatsiya">Уточнить стоимость</a>
        </div>
      `).join('');
    }

    function pluralizeVariants(n) {
      const mod10 = n % 10, mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return 'вариант';
      if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'варианта';
      return 'вариантов';
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeRooms = chip.dataset.rooms;
        render();
      });
    });
    if (sortSelect) sortSelect.addEventListener('change', render);

    render();
  }

});
