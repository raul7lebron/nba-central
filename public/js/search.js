function ensureModalRoot() {
  if (!document.getElementById('modal-root')) {
    const div = document.createElement('div');
    div.id = 'modal-root';
    document.body.appendChild(div);
  }
}

function injectPlayerSearch() {
  const header = document.querySelector('header.site-header');
  if (!header || document.getElementById('nav-search')) return;

  ensureModalRoot();

  const wrap = document.createElement('div');
  wrap.id = 'nav-search';
  wrap.className = 'nav-search';
  wrap.innerHTML = `
    <button id="search-toggle" class="search-toggle" aria-label="Buscar jugador" title="Buscar jugador">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="21" y1="21" x2="16.2" y2="16.2"></line>
      </svg>
    </button>
    <div id="search-panel" class="search-panel" hidden>
      <input type="text" id="search-input" placeholder="Buscar jugador..." autocomplete="off">
      <div id="search-results" class="search-results"></div>
    </div>
  `;
  // Se añade como hijo directo de la cabecera (no dentro de nav) para que el
  // desplegable de resultados no quede recortado por el overflow-x del menú.
  header.appendChild(wrap);

  const toggle = document.getElementById('search-toggle');
  const panel = document.getElementById('search-panel');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  function openPanel() {
    panel.hidden = false;
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    input.value = '';
    results.innerHTML = '';
    searchToken++;
  }

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closePanel();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  // Si dos busquedas se solapan (el usuario escribe rapido y las respuestas
  // llegan desordenadas por la red), sin esta guarda una respuesta antigua
  // podria pisar a una mas reciente y dejar en pantalla resultados de una
  // busqueda anterior. searchToken guarda cual es la busqueda mas reciente;
  // cada respuesta solo se pinta si sigue siendolo cuando llega.
  let debounceTimer;
  let searchToken = 0;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      searchToken++;
      results.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(() => runSearch(q), 250);
  });

  async function runSearch(q) {
    const token = ++searchToken;
    results.innerHTML = '<div class="search-result-empty">Buscando...</div>';
    try {
      const normalizedQ = q.toLowerCase();
      const [playersRes, teams] = await Promise.all([
        fetch(`/api/players/search?q=${encodeURIComponent(q)}`),
        getTeamsCached()
      ]);
      const players = await playersRes.json();
      if (token !== searchToken) return;

      const matchingTeams = teams.filter((t) =>
        t.full_name.toLowerCase().includes(normalizedQ) || t.abbreviation.toLowerCase().includes(normalizedQ)
      );

      if (!players.length && !matchingTeams.length) {
        results.innerHTML = '<div class="search-result-empty">Sin resultados</div>';
        return;
      }

      const teamsHtml = matchingTeams.map((t) => `
        <a class="search-result-item" href="/team.html?id=${t.id}">
          ${logoImgOrBadge(t.abbreviation, 20)}
          <span>${t.full_name}</span>
          <span class="search-result-tag">Equipo</span>
        </a>
      `).join('');

      const playersHtml = players.map((p) => `
        <a class="search-result-item" href="${playerUrl(p)}">
          ${p.currentTeam ? logoImgOrBadge(p.currentTeam.abbreviation, 20) : '<span class="team-badge" style="width:20px;height:20px;font-size:0.6rem">?</span>'}
          <span>${p.first_name} ${p.last_name}</span>
          <span class="search-result-tag">${p.isActive ? 'Activo' : 'Retirado'}</span>
        </a>
      `).join('');

      results.innerHTML = teamsHtml + playersHtml;
    } catch (err) {
      results.innerHTML = '<div class="search-result-empty">No se pudo buscar</div>';
    }
  }
}

// Los 30 equipos cambian muy poco: se piden una vez y se reutilizan en
// cada busqueda, en vez de una peticion nueva por cada tecla.
let teamsCache = null;
async function getTeamsCached() {
  if (teamsCache) return teamsCache;
  try {
    const res = await fetch('/api/teams');
    teamsCache = await res.json();
  } catch (err) {
    teamsCache = [];
  }
  return teamsCache;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPlayerSearch);
} else {
  injectPlayerSearch();
}
