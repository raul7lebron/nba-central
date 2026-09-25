// Selector de tema claro/oscuro. Por defecto el sitio es oscuro (su
// identidad visual); si el usuario cambia a claro, se recuerda en
// localStorage para las siguientes visitas. Se aplica lo antes posible
// (no en defer) para evitar un parpadeo del tema oscuro por defecto antes
// de aplicar el claro guardado.
const THEME_STORAGE_KEY = 'elrompearos_theme';

function getTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

document.documentElement.dataset.theme = getTheme();

const SUN_ICON = `
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <line x1="12" y1="2" x2="12" y2="4"></line>
    <line x1="12" y1="20" x2="12" y2="22"></line>
    <line x1="4.2" y1="4.2" x2="5.6" y2="5.6"></line>
    <line x1="18.4" y1="18.4" x2="19.8" y2="19.8"></line>
    <line x1="2" y1="12" x2="4" y2="12"></line>
    <line x1="20" y1="12" x2="22" y2="12"></line>
    <line x1="4.2" y1="19.8" x2="5.6" y2="18.4"></line>
    <line x1="18.4" y1="5.6" x2="19.8" y2="4.2"></line>
  </svg>`;

const MOON_ICON = `
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>`;

// Se inserta el ultimo (via setTimeout): navToggle.js y search.js inyectan
// sus propios botones nada mas cargar, y asi el interruptor de tema
// siempre queda despues de ellos dentro de nav.site-nav, sin depender del
// orden exacto de las etiquetas <script>.
function injectThemeToggle() {
  const nav = document.querySelector('nav.site-nav');
  if (!nav || document.getElementById('theme-toggle')) return;

  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.className = 'theme-toggle';
  btn.type = 'button';

  function render() {
    const isDark = document.documentElement.dataset.theme !== 'light';
    btn.innerHTML = isDark ? SUN_ICON : MOON_ICON;
    const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_STORAGE_KEY, next);
    render();
  });

  render();
  nav.appendChild(btn);
}

setTimeout(injectThemeToggle, 0);
