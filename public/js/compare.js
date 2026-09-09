// Comparador de dos jugadores, cada uno con su propia temporada elegida.
// Reutiliza los endpoints que ya existen (busqueda + historial de
// temporadas) en vez de crear ninguno nuevo.

const slots = {
  a: { player: null, history: [], season: null },
  b: { player: null, history: [], season: null }
};

// Igual que en search.js: si dos busquedas del mismo hueco se solapan (el
// usuario escribe rapido) y las respuestas llegan desordenadas por la red,
// sin esta guarda una respuesta antigua podria pisar a una mas reciente.
// Cada hueco (a/b) lleva su propio contador porque son busquedas
// independientes entre si.
const searchTokens = { a: 0, b: 0 };

function parseMinutes(min) {
  if (!min) return null;
  const [m, s] = String(min).split(':').map(Number);
  return (m || 0) + (s || 0) / 60;
}

function draftLabel(player) {
  if (!player.draft_year) return t('common_undrafted');
  return `Draft ${player.draft_year} · ${t('player_draft_round_word')} ${player.draft_round} · ${t('player_draft_pick_word')}${player.draft_number}`;
}

function renderSearchBox(slotKey) {
  const el = document.getElementById(`slot-${slotKey}`);
  el.innerHTML = `
    <div class="compare-search">
      <input type="text" id="search-${slotKey}" placeholder="${t('search_placeholder')}" autocomplete="off">
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
      searchTokens[slotKey]++;
      results.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(() => runSearch(slotKey, q, results), 250);
  });
}

async function runSearch(slotKey, q, resultsEl) {
  const token = ++searchTokens[slotKey];
  resultsEl.innerHTML = `<div class="search-result-empty">${t('search_searching')}</div>`;
  try {
    const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
    const players = await res.json();
    if (token !== searchTokens[slotKey]) return;

    if (!players.length) {
      resultsEl.innerHTML = `<div class="search-result-empty">${t('search_no_results')}</div>`;
      return;
    }

    resultsEl.innerHTML = players.map((p) => `
      <div class="search-result-item" data-id="${p.id}">
        ${p.currentTeam ? logoImgOrBadge(p.currentTeam.abbreviation, 20) : '<span class="team-badge" style="width:20px;height:20px;font-size:0.6rem">?</span>'}
        <span>${p.first_name} ${p.last_name}</span>
        <span class="search-result-tag">${p.isActive ? t('common_active') : t('common_retired')}</span>
      </div>
    `).join('');

    resultsEl.querySelectorAll('.search-result-item').forEach((item) => {
      const player = players.find((p) => String(p.id) === item.dataset.id);
      item.addEventListener('click', () => selectPlayer(slotKey, player));
    });
  } catch (err) {
    resultsEl.innerHTML = `<div class="search-result-empty">${t('search_error')}</div>`;
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
      <button class="pill compare-change-btn" id="change-${slotKey}">${t('compare_change')}</button>
      ${photoHtml}
      <h2><a href="${playerUrl(player)}">${player.first_name} ${player.last_name}</a></h2>
      <p class="player-meta">${player.position || t('common_no_data')} · ${player.height || '—'} · ${player.weight ? player.weight + ' lb' : '—'}</p>
      <p class="player-meta">${draftLabel(player)}</p>
      <div id="season-${slotKey}" style="margin-top:10px"><p class="state-msg">${t('compare_loading_seasons')}</p></div>
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
    wrap.innerHTML = `<p class="state-msg">${t('compare_no_stats')}</p>`;
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
    if (seasonWrap) seasonWrap.innerHTML = `<p class="error-msg">${t('compare_seasons_error')}</p>`;
  }
}

const COMPARE_ROWS = [
  { key: 'games_played', label: t('compare_games_played') },
  { key: 'min', label: t('stat_min_per_game') },
  { key: 'pts', label: t('stat_pts') },
  { key: 'reb', label: t('stat_reb') },
  { key: 'ast', label: t('stat_ast') },
  { key: 'stl', label: t('stat_stl') },
  { key: 'blk', label: t('stat_blk') },
  { key: 'fg_pct', label: t('stat_fg_pct'), isPct: true },
  { key: 'fg3_pct', label: t('stat_fg3_pct'), isPct: true },
  { key: 'val', label: t('stat_val'), compute: computeValoracion }
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
    wrap.innerHTML = `<p class="state-msg">${t('compare_pick_two')}</p>`;
    return;
  }

  const rowA = getRow('a');
  const rowB = getRow('b');
  if (!rowA || !rowB) {
    wrap.innerHTML = `<p class="state-msg">${t('compare_pick_season_both')}</p>`;
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
