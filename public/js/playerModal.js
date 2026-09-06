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

const CONTRACT_OPTION_LABELS = {
  player: 'Opción jugador',
  team: 'Opción equipo',
  'non-guaranteed': 'No garantizado'
};

// Contrato completo (todos los años firmados), no solo el salario de la
// temporada en curso. La opcion de jugador/equipo depende de que HoopsHype
// la marque en su web; si no la marca, esa columna sale en blanco (mejor
// no mostrar nada que inventar el dato).
function renderContractTable(contract, currentSalary) {
  if (!contract || !contract.length) return '';
  const rows = contract.map((row) => `
    <tr${row.salary === currentSalary ? ' style="font-weight:700;color:var(--accent)"' : ''}>
      <td>${row.season}-${String(row.season + 1).slice(2)}</td>
      <td>${formatMoney(row.salary)}</td>
      <td>${row.option ? CONTRACT_OPTION_LABELS[row.option] || row.option : '—'}</td>
    </tr>
  `).join('');

  return `
    <div class="table-scroll">
      <table class="stats-table contract-table">
        <thead><tr><th>Temporada</th><th>Salario</th><th>Opción</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="player-meta" style="margin-top:6px">Datos de contrato de HoopsHype. Puede haber opciones de jugador/equipo no marcadas en la fuente.</p>
  `;
}

