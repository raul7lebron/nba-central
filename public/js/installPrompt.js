// Boton "App" junto al icono de menu: en vez de depender del aviso
// automatico que mete el propio navegador (el "mini-infobar" de Chrome,
// que aparece solo, sin que el usuario lo pida, nada mas cumplirse los
// requisitos de instalabilidad), capturamos el evento beforeinstallprompt
// con preventDefault() para que no salga solo, y lo lanzamos nosotros
// unicamente cuando el usuario pulsa este boton. Si el navegador no
// soporta instalar la web (iOS Safari, Firefox...) o ya esta instalada,
// el evento nunca llega y el boton no se muestra.
let deferredInstallPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// Registrado cuanto antes (no en el setTimeout de mas abajo): el evento
// puede llegar en cualquier momento tras cargar la pagina y si no hay un
// listener ya puesto para entonces, se pierde para siempre en esta carga.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.hidden = false;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.hidden = true;
});

// Igual que theme.js: se inserta con setTimeout(0) para ir despues de
// navToggle.js (que crea #nav-toggle) sea cual sea el orden de los
// <script> en cada pagina.
function injectInstallButton() {
  const header = document.querySelector('header.site-header');
  if (!header || document.getElementById('install-app-btn') || isStandalone()) return;

  const btn = document.createElement('button');
  btn.id = 'install-app-btn';
  btn.className = 'install-app-btn';
  btn.type = 'button';
  btn.textContent = 'App';
  btn.setAttribute('aria-label', 'Instalar la app de El Rompearos');
  btn.title = 'Instalar la app de El Rompearos en este dispositivo';
  // Oculto hasta que el navegador confirme que se puede instalar (o visible
  // de entrada si el evento ya llego antes de que este botón existiera).
  btn.hidden = !deferredInstallPrompt;

  btn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    // El mismo evento no se puede reutilizar una segunda vez (lo acepte o
    // lo rechace); si el navegador decide que vuelve a tener sentido
    // ofrecerlo, llegara un beforeinstallprompt nuevo en una futura visita.
    deferredInstallPrompt = null;
    btn.hidden = true;
  });

  // navToggle.js mete #nav-toggle ANTES de <nav> (para que la hamburguesa
  // quede a la izquierda del menu plegable), no despues: insertar este
  // boton pegado al toggle lo dejaria delante de todo el menu en vez de en
  // el grupo de iconos de la derecha. #nav-search si va despues de <nav>
  // (search.js lo añade el ultimo), asi que insertar justo antes de el es
  // lo que de verdad deja este boton junto al resto de iconos.
  const search = document.getElementById('nav-search');
  if (search) {
    search.insertAdjacentElement('beforebegin', btn);
  } else {
    header.appendChild(btn);
  }
}

setTimeout(injectInstallButton, 0);
