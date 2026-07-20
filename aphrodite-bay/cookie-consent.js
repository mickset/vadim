/* ---------- Cookie consent banner ----------
   Self-contained: safe to include on any page (index.html, privacy-policy.html,
   consent-pd.html, and future project pages) regardless of what else is on the
   page. Doesn't depend on script.js or any other markup existing. */
(function () {
  var STORAGE_KEY = 'cookieConsent';

  function init() {
    if (localStorage.getItem(STORAGE_KEY)) return; // already answered

    var banner = document.getElementById('cookieBanner');
    if (!banner) return;

    banner.hidden = false;
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });

    var acceptBtn = document.getElementById('cookieAcceptBtn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        banner.classList.remove('is-visible');
        setTimeout(function () { banner.hidden = true; }, 300);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
