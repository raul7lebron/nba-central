// Configuracion de Google AdSense. Vacio por defecto: sin cuenta de AdSense
// aprobada y sin la web publicada en un dominio real, Google no sirve
// anuncios (no funciona en localhost). En cuanto tengas tu ID de editor
// (ca-pub-XXXXXXXXXXXXXXXX) y los IDs de bloque de anuncio, rellena esto y
// los huecos se activan solos, sin tocar el HTML de las paginas.
const ADSENSE_CONFIG = {
  publisherId: '', // ej. 'ca-pub-1234567890123456'
  slots: {
    newsInline: '', // bloque de anuncio dentro del listado de noticias
    teamFooter: '', // bloque de anuncio al final de la plantilla del equipo
    sidebar: ''     // bloque vertical fijo a la derecha, en todas las paginas
  }
};

function adsEnabled() {
  return Boolean(ADSENSE_CONFIG.publisherId);
}

function loadAdSenseScript() {
  if (!adsEnabled()) return;
  if (document.querySelector('script[data-adsense-loader]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.publisherId}`;
  script.crossOrigin = 'anonymous';
  script.dataset.adsenseLoader = 'true';
  document.head.appendChild(script);
}

// Devuelve el HTML de un hueco de anuncio. Sin cuenta configurada, se ve
// como un hueco discreto (para comprobar que la posicion no molesta);
// con cuenta configurada, se convierte en un bloque real de AdSense.
function renderAdSlot(slotKey, label) {
  const slotId = ADSENSE_CONFIG.slots[slotKey];
  if (!adsEnabled() || !slotId) {
    return `<div class="ad-slot ad-slot-placeholder">${label || 'Espacio publicitario'}</div>`;
  }
  return `
    <div class="ad-slot">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${ADSENSE_CONFIG.publisherId}"
           data-ad-slot="${slotId}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  `;
}

// Hueco fijo vertical a la derecha, presente en todas las paginas. Se oculta
// en pantallas estrechas para no molestar ni solaparse con el contenido.
function injectAdSidebar() {
  if (document.getElementById('ad-sidebar')) return;
  const el = document.createElement('div');
  el.id = 'ad-sidebar';
  el.className = 'ad-sidebar';
  el.innerHTML = renderAdSlot('sidebar', 'Publicidad');
  document.body.appendChild(el);
  activateAdSlots();
}

// RGPD/ePrivacy: en la UE no se pueden cargar cookies/scripts de publicidad
// sin consentimiento explicito. Sin cookieConsent.js cargado (o sin
// respuesta todavia) no se activa nada; el hueco se queda como placeholder
// discreto hasta que el usuario acepte.
function activateAdSlots() {
  if (!adsEnabled()) return;
  const hasConsent = typeof cookieConsentGranted === 'function' && cookieConsentGranted();
  if (!hasConsent) return;

  loadAdSenseScript();
  document.querySelectorAll('.adsbygoogle').forEach(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // silencioso: si AdSense todavia no aprobo el sitio, no debe romper la pagina
    }
  });
}

// Con solo incluir <script src="/js/ads.js"> en una pagina ya aparece el
// hueco lateral, sin tener que llamarlo a mano desde cada script de pagina.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAdSidebar);
} else {
  injectAdSidebar();
}
