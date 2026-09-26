// Registra el service worker (public/sw.js) para que la PWA funcione de
// verdad sin conexion, no solo tenga el manifest. Se registra despues de
// que la pagina termine de cargar para no competir por ancho de banda con
// el contenido real.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // sin service worker la web sigue funcionando con normalidad, solo
      // sin cache offline
    });
  });
}
