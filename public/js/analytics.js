// Configuracion de Google Analytics (GA4). Vacio por defecto: sin ID de
// medicion no se carga ningun script. En cuanto crees tu propiedad GA4 en
// https://analytics.google.com y consigas el ID de medicion
// (G-XXXXXXXXXX), pegalo aqui y el seguimiento se activa solo, respetando
// el mismo consentimiento de cookies que ya usa AdSense.
const ANALYTICS_CONFIG = {
  measurementId: '' // ej. 'G-XXXXXXXXXX'
};

function analyticsEnabled() {
  return Boolean(ANALYTICS_CONFIG.measurementId);
}

function loadGoogleAnalytics() {
  if (!analyticsEnabled()) return;
  if (document.querySelector('script[data-ga-loader]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.measurementId}`;
  script.dataset.gaLoader = 'true';
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ANALYTICS_CONFIG.measurementId);
}

// RGPD/ePrivacy: igual que con AdSense, no se carga ninguna cookie/script
// de analitica sin consentimiento explicito del banner de cookieConsent.js.
function activateAnalytics() {
  if (!analyticsEnabled()) return;
  const hasConsent = typeof cookieConsentGranted === 'function' && cookieConsentGranted();
  if (!hasConsent) return;

  loadGoogleAnalytics();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', activateAnalytics);
} else {
  activateAnalytics();
}
