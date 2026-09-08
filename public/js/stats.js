// Pagina de lideres estadisticos: top 50 de la temporada en curso,
// ordenable por cualquier estadistica. Los datos ya vienen filtrados a la
// temporada actual y a jugadores con al menos un partido jugado
// (refreshSeasonLeaders, a diario); aqui solo se ordena/filtra/recorta.

const STAT_OPTIONS = [
  { value: 'val', label: 'Valoración' },
  { value: 'pts', label: 'Puntos' },
  { value: 'reb', label: 'Rebotes' },
  { value: 'ast', label: 'Asistencias' },
  { value: 'stl', label: 'Robos' },
  { value: 'blk', label: 'Tapones' },
  { value: 'fg_pct', label: '% Tiro de campo' },
  { value: 'fg3_pct', label: '% Triples' },
  { value: 'min', label: 'Minutos por partido' }
];

let allLeaders = [];
let seasonMeta = { season: null, lastRefresh: null };

// balldontlie da los minutos como "33:23" (mm:ss); para ordenar hace falta
// un numero.
function parseMinutes(min) {
  if (!min) return 0;
  const [m, s] = String(min).split(':').map(Number);
  return (m || 0) + (s || 0) / 60;
}

function getStatValue(row, statKey) {
  if (statKey === 'val') return computeValoracion(row);
  if (statKey === 'min') return parseMinutes(row.min);
  return row[statKey] ?? -Infinity;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function renderToolbar(selected) {
  const wrap = document.getElementById('stats-toolbar');
  const options = STAT_OPTIONS.map((o) =>
    `<option value="${o.value}" ${o.value === selected ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  const seasonLabel = seasonMeta.season != null
    ? `${seasonMeta.season}-${String(seasonMeta.season + 1).slice(2)}`
    : '';
  const updatedLabel = seasonMeta.lastRefresh ? ` · actualizado ${formatDate(seasonMeta.lastRefresh)}` : '';

  wrap.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
      <label class="pill" style="cursor:pointer">
        Ordenar por
        <select id="stat-select" style="background:transparent;border:none;color:var(--accent);font-weight:700;font-family:inherit;cursor:pointer;margin-left:4px">${options}</select>
      </label>
      <span class="player-meta">Temporada ${seasonLabel} · Top 50${updatedLabel}</span>
    </div>
  `;
  document.getElementById('stat-select').addEventListener('change', (e) => renderTable(e.target.value));
}

// Valor formateado de la estadistica elegida en el desplegable, igual que
// saldria en su columna normal de la tabla.
function statCellValue(row, statKey) {
  if (statKey === 'val') return computeValoracion(row).toFixed(1);
  if (statKey === 'fg_pct' || statKey === 'fg3_pct') {
    return row[statKey] != null ? (row[statKey] * 100).toFixed(1) + '%' : '-';
  }
  if (statKey === 'min') return row.min ?? '-';
  return formatStat(row[statKey]);
}

function renderTable(statKey) {
  const container = document.getElementById('stats-container');
  const sorted = [...allLeaders]
    .sort((a, b) => getStatValue(b, statKey) - getStatValue(a, statKey))
    .slice(0, 50);

  if (!sorted.length) {
    container.innerHTML = '<p class="state-msg">Todavía no hay estadísticas de esta temporada.</p>';
    return;
  }

  const statLabel = STAT_OPTIONS.find((o) => o.value === statKey)?.label || statKey;

  const rows = sorted.map((p, i) => `
    <tr>
      <td style="font-weight:700;color:var(--text-faint)">${i + 1}</td>
      <td style="text-align:left">
        <a href="${playerUrl(p)}" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;white-space:nowrap">
          ${p.team ? `<span class="player-meta" style="font-weight:700">${displayAbbr(p.team.abbreviation)}</span>` : ''}
          <span style="font-weight:600">${p.first_name} ${p.last_name}</span>
        </a>
      </td>
      <td>${p.games_played ?? '-'}</td>
      <td>${p.min ?? '-'}</td>
      <td style="font-weight:700;color:var(--accent)">${statCellValue(p, statKey)}</td>
      <td>${formatStat(p.pts)}</td>
      <td>${formatStat(p.reb)}</td>
      <td>${formatStat(p.ast)}</td>
      <td>${formatStat(p.stl)}</td>
      <td>${formatStat(p.blk)}</td>
      <td>${p.fg_pct != null ? (p.fg_pct * 100).toFixed(1) + '%' : '-'}</td>
      <td>${p.fg3_pct != null ? (p.fg3_pct * 100).toFixed(1) + '%' : '-'}</td>
      <td style="font-weight:700;color:var(--accent)">${computeValoracion(p).toFixed(1)}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="table-scroll">
      <table class="stats-table">
        <thead>
          <tr>
            <th>#</th><th style="text-align:left">Jugador</th><th>PJ</th><th>MIN</th>
            <th style="color:var(--accent)">${statLabel}</th>
            <th>PTS</th><th>REB</th>
            <th>AST</th><th>ROB</th><th>TAP</th><th>%TC</th><th>%3P</th><th>VAL</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function loadStats() {
  const container = document.getElementById('stats-container');
  try {
    const res = await fetch('/api/stats/leaders');
    const data = await res.json();
    allLeaders = data.leaders || [];
    seasonMeta = { season: data.season, lastRefresh: data.lastRefresh };

    renderToolbar('val');

    if (!allLeaders.length) {
      container.innerHTML = '<p class="state-msg">Todavía no hay estadísticas de la temporada en curso (puede que aún no haya empezado o el servidor no las haya refrescado todavía).</p>';
      return;
    }

    renderTable('val');
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudieron cargar las estadísticas.</p>';
  }
}

loadStats();
