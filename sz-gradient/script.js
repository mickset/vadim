document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header buttons ----------
     No modal/backend wired up yet — placeholders until that becomes its own
     block. */
  ['ctaHeaderBtn', 'ctaHeroBtn', 'ctaSpecsBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => console.log(id + ': not wired up yet'));
  });

});
