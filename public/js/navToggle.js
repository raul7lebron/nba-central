// Menu de hamburguesa para pantallas estrechas: con 8 secciones + buscador,
// el menu horizontal no cabe y quedaba scroll oculto sin ninguna pista visual
// (parecia que Draft/Mercado/Tienda habian desaparecido). Por debajo de la
// anchura de corte, el menu se pliega en un boton.
function initNavToggle() {
  const header = document.querySelector('header.site-header');
  const nav = document.querySelector('nav.site-nav');
  if (!header || !nav || document.getElementById('nav-toggle')) return;

  const btn = document.createElement('button');
  btn.id = 'nav-toggle';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Abrir menú');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  `;
  header.insertBefore(btn, nav);

  function closeNav() {
    nav.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !btn.contains(e.target)) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavToggle);
} else {
  initNavToggle();
}
