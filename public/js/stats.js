// Pagina de lideres estadisticos: top 50 de la temporada en curso,
// ordenable por cualquier estadistica. Los datos ya vienen filtrados a la
// temporada actual y a jugadores con al menos un partido jugado
// (refreshSeasonLeaders, a diario); aqui solo se ordena/filtra/recorta.

const STAT_OPTIONS = [
  { value: 'val', label: t('stat_val'), thKey: 'th_val' },
  { value: 'pts', label: t('stat_pts'), thKey: 'th_pts' },
  { value: 'reb', label: t('stat_reb'), thKey: 'th_reb' },
  { value: 'ast', label: t('stat_ast'), thKey: 'th_ast' },
  { value: 'stl', label: t('stat_stl'), thKey: 'th_stl' },
  { value: 'blk', label: t('stat_blk'), thKey: 'th_blk' },
  { value: 'fg_pct', label: t('stat_fg_pct'), thKey: 'th_fg_pct' },
  { value: 'fg3_pct', label: t('stat_fg3_pct'), thKey: 'th_fg3_pct' },
  { value: 'min', label: t('stat_min_per_game'), thKey: 'th_min' }
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
  return d.toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' });
}

function renderToolbar(selected) {
  const wrap = document.getElementById('stats-toolbar');
  const options = STAT_OPTIONS.map((o) =>
    `<option value="${o.value}" ${o.value === selected ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  const seasonLabel = seasonMeta.season != null
    ? `${seasonMeta.season}-${String(seasonMeta.season + 1).slice(2)}`
    : '';
  const updatedLabel = seasonMeta.lastRefresh ? ` · ${t('stats_updated')} ${formatDate(seasonMeta.lastRefresh)}` : '';

  wrap.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
      <label class="pill" style="cursor:pointer">
        ${t('stats_sort_label')}
        <select id="stat-select" style="background:transparent;border:none;color:var(--accent);font-weight:700;font-family:inherit;cursor:pointer;margin-left:4px">${options}</select>
      </label>
      <span class="player-meta">${t('stats_season_prefix')} ${seasonLabel} · Top 50${updatedLabel}</span>
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
    container.innerHTML = `<p class="state-msg">${t('stats_no_current_season')}</p>`;
    return;
  }

  const statOption = STAT_OPTIONS.find((o) => o.value === statKey);
  const statLabel = statOption ? t(statOption.thKey) : statKey;

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
            <th>#</th><th style="text-align:left">${t('th_player')}</th><th>${t('th_gp')}</th><th>${t('th_min')}</th>
            <th style="color:var(--accent)">${statLabel}</th>
            <th>${t('th_pts')}</th><th>${t('th_reb')}</th>
            <th>${t('th_ast')}</th><th>${t('th_stl')}</th><th>${t('th_blk')}</th><th>${t('th_fg_pct')}</th><th>${t('th_fg3_pct')}</th><th>${t('th_val')}</th>
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
      container.innerHTML = `<p class="state-msg">${t('stats_no_leaders_yet')}</p>`;
      return;
    }

    renderTable('val');
  } catch (err) {
    container.innerHTML = `<p class="error-msg">${t('stats_error')}</p>`;
  }
}

loadStats();
