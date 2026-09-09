// Consentimiento de cookies (RGPD/ePrivacy, obligatorio para publico europeo).
// Sin aceptacion explicita no se cargan cookies/scripts de publicidad
// (Google AdSense) ni de analitica. Los enlaces de afiliado (Fanatics,
// NBA Store, Amazon) no necesitan esto: son salidas a otra web, es esa web
// la que gestiona sus propias cookies cuando el usuario la visita.

const COOKIE_CONSENT_KEY = 'nbacentral_cookie_consent';

function getCookieConsent() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch (err) {
    return null; // localStorage bloqueado: tratamos como "sin decidir"
  }
}

function setCookieConsent(value) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch (err) {
    // si no se puede guardar, simplemente se preguntara otra vez
  }
}

function cookieConsentGranted() {
  return getCookieConsent() === 'accepted';
}

function injectCookieBanner() {
  if (getCookieConsent()) {
    // ya hay una decision guardada: si acepto, activamos publicidad y analitica ahora
    if (cookieConsentGranted()) {
      if (typeof activateAdSlots === 'function') activateAdSlots();
      if (typeof activateAnalytics === 'function') activateAnalytics();
    }
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <p>
      ${t('cookie_banner_text')}
      <a href="/cookies.html">${t('cookie_more_info')}</a>.
    </p>
    <div class="cookie-banner-actions">
      <button id="cookie-reject" class="pill">${t('cookie_reject')}</button>
      <button id="cookie-accept" class="pill" style="border-color:var(--accent);color:var(--accent)">${t('cookie_accept')}</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    setCookieConsent('accepted');
    banner.remove();
    if (typeof activateAdSlots === 'function') activateAdSlots();
    if (typeof activateAnalytics === 'function') activateAnalytics();
  });

  document.getElementById('cookie-reject').addEventListener('click', () => {
    setCookieConsent('rejected');
    banner.remove();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCookieBanner);
} else {
  injectCookieBanner();
}
