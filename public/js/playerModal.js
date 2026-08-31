function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

function formatMoney(amount) {
  if (amount == null) return null;
  return '$' + (amount / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + 'M';
}

function rating2kColor(overall) {
  if (overall >= 90) return '#3ecf6e';
  if (overall >= 80) return '#4c8dff';
  if (overall >= 70) return '#e8b93e';
  return '#8993a8';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// Valoración (índice de eficiencia por partido): balldontlie no la da hecha,
// se calcula con la fórmula estándar a partir de las medias por partido.
// VAL = PTS + REB + AST + ROB + TAP - tiros de campo fallados - tiros libres
// fallados - pérdidas.
function computeValoracion(row) {
  const missedFg = (row.fga ?? 0) - (row.fgm ?? 0);
  const missedFt = (row.fta ?? 0) - (row.ftm ?? 0);
  const val =
    (row.pts ?? 0) + (row.reb ?? 0) + (row.ast ?? 0) + (row.stl ?? 0) + (row.blk ?? 0) -
    missedFg - missedFt - (row.turnover ?? 0);
  return val;
}

function renderStatsTable(history) {
  if (!history || !history.length) {
    return '<p class="state-msg">No hay estadísticas de temporadas disponibles para este jugador.</p>';
  }
  const rows = history.map((row) => `
    <tr>
      <td>${row.team ? logoImgOrBadge(row.team.abbreviation, 22) : '—'}</td>
      <td>${row.season}-${String(row.season + 1).slice(2)}</td>
      <td>${row.games_played ?? '-'}</td>
      <td>${row.min ?? '-'}</td>
      <td>${row.pts ?? '-'}</td>
      <td>${row.reb ?? '-'}</td>
      <td>${row.ast ?? '-'}</td>
      <td>${row.stl ?? '-'}</td>
      <td>${row.blk ?? '-'}</td>
      <td>${row.fg_pct != null ? (row.fg_pct * 100).toFixed(1) + '%' : '-'}</td>
      <td>${row.fg3_pct != null ? (row.fg3_pct * 100).toFixed(1) + '%' : '-'}</td>
      <td style="font-weight:700;color:var(--accent)">${computeValoracion(row).toFixed(1)}</td>
    </tr>
  `).join('');

  return `
    <div class="table-scroll">
      <table class="stats-table">
        <thead>
          <tr>
            <th>Equipo</th><th>Temp.</th><th>PJ</th><th>MIN</th><th>PTS</th><th>REB</th>
            <th>AST</th><th>ROB</th><th>TAP</th><th>%TC</th><th>%3P</th><th>VAL</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function openModal(innerHTML) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-box">
        <button class="modal-close" id="modal-close-btn">&times;</button>
        ${innerHTML}
      </div>
    </div>
  `;
  document.getElementById('modal-close-btn').onclick = closeModal;
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
}

function draftLine(player) {
  if (!player.draft_year) return '<p class="player-meta">No drafteado</p>';
  return `<p class="player-meta">Draft ${player.draft_year} · Ronda ${player.draft_round} · Pick nº${player.draft_number}</p>`;
}

// Ficha de jugador activo: temporada actual, salario, valoración 2K vigente.
async function showPlayerStats(player) {
  const ratingLine = player.rating2k
    ? `<p class="player-meta">Valoración NBA 2K: <span style="color:${rating2kColor(player.rating2k)};font-weight:700">${player.rating2k}</span></p>`
    : '';
  const salaryLine = player.salary
    ? `<p class="player-meta">Salario ${formatMoney(player.salary)} (temporada actual)</p>`
    : '';

  openModal(`
    <h2>${player.first_name} ${player.last_name}</h2>
    <p class="player-meta">${player.position || 'N/D'} · ${player.height || ''} · ${player.weight ? player.weight + ' lb' : ''}</p>
    ${draftLine(player)}
    ${ratingLine}
    ${salaryLine}
    <div id="stats-body"><p class="state-msg">Cargando estadísticas...</p></div>
  `);

  const statsBody = document.getElementById('stats-body');
  try {
    const res = await fetch(`/api/players/${player.id}/stats`);
    if (res.status === 402) {
      const data = await res.json();
      statsBody.innerHTML = `<p class="error-msg">${data.error}</p>`;
      return;
    }
    const data = await res.json();
    statsBody.innerHTML = `
      <h3>Historial por temporada</h3>
      ${renderStatsTable(data.history)}
    `;
  } catch (err) {
    statsBody.innerHTML = '<p class="error-msg">No se pudieron cargar las estadísticas.</p>';
  }
}

// Ficha de jugador retirado/inactivo: estadísticas de toda su carrera y la
// mejor valoración 2K que haya tenido nunca (si el juego llegó a incluirlo).
async function showRetiredPlayerCard(player) {
  const peakLine = player.peakRating2k
    ? `<p class="player-meta">Mejor valoración NBA 2K de su carrera: <span style="color:${rating2kColor(player.peakRating2k)};font-weight:700">${player.peakRating2k}</span></p>`
    : '<p class="player-meta">Sin valoración NBA 2K disponible</p>';

  openModal(`
    <h2>${player.first_name} ${player.last_name}</h2>
    <p class="player-meta">${player.position || 'N/D'} · ${player.height || ''} · ${player.weight ? player.weight + ' lb' : ''} · Retirado/inactivo</p>
    ${draftLine(player)}
    ${peakLine}
    <div id="stats-body"><p class="state-msg">Cargando estadísticas de carrera...</p></div>
  `);

  const statsBody = document.getElementById('stats-body');
  try {
    const res = await fetch(`/api/players/${player.id}/career-stats?fromYear=${player.draft_year || ''}`);
    if (res.status === 402) {
      const data = await res.json();
      statsBody.innerHTML = `<p class="error-msg">${data.error}</p>`;
      return;
    }
    const data = await res.json();
    statsBody.innerHTML = `
      <h3>Estadísticas de toda su carrera</h3>
      ${renderStatsTable(data.history)}
    `;
  } catch (err) {
    statsBody.innerHTML = '<p class="error-msg">No se pudieron cargar las estadísticas.</p>';
  }
}
