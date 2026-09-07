// Comparador de dos jugadores, cada uno con su propia temporada elegida.
// Reutiliza los endpoints que ya existen (busqueda + historial de
// temporadas) en vez de crear ninguno nuevo.

const slots = {
  a: { player: null, history: [], season: null },
  b: { player: null, history: [], season: null }
};

function parseMinutes(min) {
  if (!min) return null;
  const [m, s] = String(min).split(':').map(Number);
  return (m || 0) + (s || 0) / 60;
}

function draftLabel(player) {
  if (!player.draft_year) return 'No drafteado';
  return `Draft ${player.draft_year} · Ronda ${player.draft_round} · Pick nº${player.draft_number}`;
}

function renderSearchBox(slotKey) {
  const el = document.getElementById(`slot-${slotKey}`);
  el.innerHTML = `
    <div class="compare-search">
      <input type="text" id="search-${slotKey}" placeholder="Buscar jugador..." autocomplete="off">
      <div class="search-results" id="results-${slotKey}"></div>
    </div>
  `;
  const input = document.getElementById(`search-${slotKey}`);
  const results = document.getElementById(`results-${slotKey}`);

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(() => runSearch(slotKey, q, results), 250);
  });
}

async function runSearch(slotKey, q, resultsEl) {
  resultsEl.innerHTML = '<div class="search-result-empty">Buscando...</div>';
  try {
    const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
    const players = await res.json();

    if (!players.length) {
      resultsEl.innerHTML = '<div class="search-result-empty">Sin resultados</div>';
      return;
    }

    resultsEl.innerHTML = players.map((p) => `
      <div class="search-result-item" data-id="${p.id}">
        ${p.currentTeam ? logoImgOrBadge(p.currentTeam.abbreviation, 20) : '<span class="team-badge" style="width:20px;height:20px;font-size:0.6rem">?</span>'}
        <span>${p.first_name} ${p.last_name}</span>
        <span class="search-result-tag">${p.isActive ? 'Activo' : 'Retirado'}</span>
      </div>
    `).join('');

    resultsEl.querySelectorAll('.search-result-item').forEach((item) => {
      const player = players.find((p) => String(p.id) === item.dataset.id);
      item.addEventListener('click', () => selectPlayer(slotKey, player));
    });
  } catch (err) {
    resultsEl.innerHTML = '<div class="search-result-empty">No se pudo buscar</div>';
  }
}

function renderPlayerCard(slotKey) {
  const player = slots[slotKey].player;
  const el = document.getElementById(`slot-${slotKey}`);
  // Se reserva el hueco de la foto aunque no la tenga (div vacio del mismo
  // tamaño), para que el nombre y los datos de los dos jugadores empiecen
  // siempre a la misma altura, tenga foto o no cada uno.
  const photoHtml = player.photoUrl
    ? `<img class="player-photo" src="${player.photoUrl}" alt="${player.first_name} ${player.last_name}" width="90" height="90" loading="lazy" onerror="this.outerHTML='<div class=&quot;player-photo&quot;></div>'">`
    : '<div class="player-photo"></div>';

  el.innerHTML = `
    <div class="compare-card">
      <button class="pill compare-change-btn" id="change-${slotKey}">Cambiar</button>
      ${photoHtml}
      <h2><a href="${playerUrl(player)}">${player.first_name} ${player.last_name}</a></h2>
      <p class="player-meta">${player.position || 'N/D'} · ${player.height || '—'} · ${player.weight ? player.weight + ' lb' : '—'}</p>
      <p class="player-meta">${draftLabel(player)}</p>
      <div id="season-${slotKey}" style="margin-top:10px"><p class="state-msg">Cargando temporadas...</p></div>
    </div>
  `;

  document.getElementById(`change-${slotKey}`).addEventListener('click', () => {
    slots[slotKey] = { player: null, history: [], season: null };
    renderSearchBox(slotKey);
    renderComparison();
  });
}

function renderSeasonPicker(slotKey) {
  const wrap = document.getElementById(`season-${slotKey}`);
  if (!wrap) return;
  const { history, season } = slots[slotKey];

  if (!history.length) {
    wrap.innerHTML = '<p class="state-msg">Sin estadísticas disponibles para este jugador.</p>';
    return;
  }

  const options = history.map((row) =>
    `<option value="${row.season}" ${row.season === season ? 'selected' : ''}>${row.season}-${String(row.season + 1).slice(2)}</option>`
  ).join('');

  wrap.innerHTML = `<select class="pill" id="season-select-${slotKey}" style="cursor:pointer;font-weight:700">${options}</select>`;

  document.getElementById(`season-select-${slotKey}`).addEventListener('change', (e) => {
    slots[slotKey].season = parseInt(e.target.value, 10);
    renderComparison();
  });
}

// Si sabemos el año de draft pedimos la carrera entera (cualquier temporada
// que haya jugado); si no (jugador no drafteado), nos conformamos con las
// ultimas que de el endpoint de estadisticas recientes.
async function selectPlayer(slotKey, player) {
  slots[slotKey] = { player, history: [], season: null };
  renderPlayerCard(slotKey);
  renderComparison();

  const seasonWrap = document.getElementById(`season-${slotKey}`);
  try {
    const endpoint = player.draft_year
      ? `/api/players/${player.id}/career-stats?fromYear=${player.draft_year}`
      : `/api/players/${player.id}/stats`;
    const res = await fetch(endpoint);
    if (res.status === 402) {
      const data = await res.json();
      if (seasonWrap) seasonWrap.innerHTML = `<p class="error-msg">${data.error}</p>`;
      return;
    }
    const data = await res.json();
    const history = (data.history || []).slice().sort((a, b) => b.season - a.season);
    slots[slotKey].history = history;
    slots[slotKey].season = history[0]?.season ?? null;
    renderSeasonPicker(slotKey);
    renderComparison();
  } catch (err) {
    if (seasonWrap) seasonWrap.innerHTML = '<p class="error-msg">No se pudieron cargar las temporadas.</p>';
  }
}

const COMPARE_ROWS = [
  { key: 'games_played', label: 'Partidos jugados' },
  { key: 'min', label: 'Minutos por partido' },
  { key: 'pts', label: 'Puntos' },
  { key: 'reb', label: 'Rebotes' },
  { key: 'ast', label: 'Asistencias' },
  { key: 'stl', label: 'Robos' },
  { key: 'blk', label: 'Tapones' },
  { key: 'fg_pct', label: '% Tiro de campo', isPct: true },
  { key: 'fg3_pct', label: '% Triples', isPct: true },
  { key: 'val', label: 'Valoración', compute: computeValoracion }
];

function getRow(slotKey) {
  const { history, season } = slots[slotKey];
  if (season == null) return null;
  return history.find((r) => r.season === season) || null;
}

// Valor numerico para COMPARAR, redondeado igual que lo que se muestra
// (displayValue) para que dos jugadores que se ven iguales (ej. "20.2" los
// dos) no salgan coloreados como si fueran distintos por un resto de coma
// flotante que nunca se llega a ver.
function comparableValue(row, def) {
  if (def.compute) return Math.round(def.compute(row) * 10) / 10;
  if (def.key === 'min') {
    const mins = parseMinutes(row.min);
    return mins == null ? null : Math.round(mins * 10) / 10;
  }
  const raw = row[def.key];
  if (raw == null) return null;
  if (def.isPct) return Math.round(raw * 1000) / 10;
  if (def.key === 'games_played') return raw;
  return Math.round(raw * 10) / 10;
}

function displayValue(row, def) {
  if (def.compute) return def.compute(row).toFixed(1);
  const raw = row[def.key];
  if (raw == null) return '-';
  if (def.isPct) return (raw * 100).toFixed(1) + '%';
  if (def.key === 'min' || def.key === 'games_played') return raw;
  return Number(raw).toFixed(1);
}

function renderComparison() {
  const wrap = document.getElementById('compare-table-wrap');

  if (!slots.a.player || !slots.b.player) {
    wrap.innerHTML = '<p class="state-msg">Elige dos jugadores para compararlos.</p>';
    return;
  }

  const rowA = getRow('a');
  const rowB = getRow('b');
  if (!rowA || !rowB) {
    wrap.innerHTML = '<p class="state-msg">Elige, para cada jugador, una temporada con estadísticas.</p>';
    return;
  }

  const rows = COMPARE_ROWS.map((def) => {
    const cmpA = comparableValue(rowA, def);
    const cmpB = comparableValue(rowB, def);

    let colorA = 'var(--text)';
    let colorB = 'var(--text)';
    if (cmpA != null && cmpB != null && cmpA !== cmpB) {
      colorA = cmpA > cmpB ? 'var(--positive)' : 'var(--negative)';
      colorB = cmpB > cmpA ? 'var(--positive)' : 'var(--negative)';
    }

    return `
      <tr>
        <td class="compare-value compare-value-a" style="color:${colorA}">${displayValue(rowA, def)}</td>
        <td class="compare-label">${def.label}</td>
        <td class="compare-value compare-value-b" style="color:${colorB}">${displayValue(rowB, def)}</td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    <div class="table-scroll">
      <table class="compare-table"><tbody>${rows}</tbody></table>
    </div>
  `;
}

renderSearchBox('a');
renderSearchBox('b');
renderComparison();
