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

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(() => runSearch(q), 250);
  });

  async function runSearch(q) {
    results.innerHTML = '<div class="search-result-empty">Buscando...</div>';
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
      const players = await res.json();

      if (!players.length) {
        results.innerHTML = '<div class="search-result-empty">Sin resultados</div>';
        return;
      }

      results.innerHTML = players.map((p) => `
        <div class="search-result-item" data-id="${p.id}">
          ${p.currentTeam ? logoImgOrBadge(p.currentTeam.abbreviation, 20) : '<span class="team-badge" style="width:20px;height:20px;font-size:0.6rem">?</span>'}
          <span>${p.first_name} ${p.last_name}</span>
          <span class="search-result-tag">${p.isActive ? 'Activo' : 'Retirado'}</span>
        </div>
      `).join('');

      results.querySelectorAll('.search-result-item').forEach((item) => {
        const player = players.find((p) => String(p.id) === item.dataset.id);
        item.addEventListener('click', () => {
          closePanel();
          if (player.isActive) showPlayerStats(player);
          else showRetiredPlayerCard(player);
        });
      });
    } catch (err) {
      results.innerHTML = '<div class="search-result-empty">No se pudo buscar</div>';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPlayerSearch);
} else {
  injectPlayerSearch();
}
