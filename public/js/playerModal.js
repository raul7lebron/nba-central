function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  document.removeEventListener('keydown', closeModalOnEscape);
}

function closeModalOnEscape(e) {
  if (e.key === 'Escape') closeModal();
}

function formatMoney(amount) {
  if (amount == null) return null;
  return '$' + (amount / 1_000_000).toLocaleString(getLocale(), { maximumFractionDigits: 1 }) + 'M';
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
  return d.toLocaleString(getLocale(), {
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

// balldontlie da las medias con hasta 3 decimales (ej. 20.821); con uno
// solo (20.8) se lee igual de bien y la tabla ocupa menos ancho.
function formatStat(value) {
  return value != null ? Number(value).toFixed(1) : '-';
}

function renderStatsTable(history) {
  if (!history || !history.length) {
    return `<p class="state-msg">${t('modal_no_season_stats')}</p>`;
  }
  const rows = history.map((row) => `
    <tr>
      <td style="font-weight:600">${row.team ? displayAbbr(row.team.abbreviation) : '—'}</td>
      <td>${row.season}-${String(row.season + 1).slice(2)}</td>
      <td>${row.games_played ?? '-'}</td>
      <td>${row.min ?? '-'}</td>
      <td>${formatStat(row.pts)}</td>
      <td>${formatStat(row.reb)}</td>
      <td>${formatStat(row.ast)}</td>
      <td>${formatStat(row.stl)}</td>
      <td>${formatStat(row.blk)}</td>
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
            <th>${t('th_team')}</th><th>${t('th_season')}</th><th>${t('th_gp')}</th><th>${t('th_min')}</th><th>${t('th_pts')}</th><th>${t('th_reb')}</th>
            <th>${t('th_ast')}</th><th>${t('th_stl')}</th><th>${t('th_blk')}</th><th>${t('th_fg_pct')}</th><th>${t('th_fg3_pct')}</th><th>${t('th_val')}</th>
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
      <div class="modal-box" role="dialog" aria-modal="true">
        <button class="modal-close" id="modal-close-btn" aria-label="${t('common_close')}">&times;</button>
        ${innerHTML}
      </div>
    </div>
  `;
  document.getElementById('modal-close-btn').onclick = closeModal;
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
  document.addEventListener('keydown', closeModalOnEscape);
}

const CONTRACT_OPTION_LABELS = {
  player: t('contract_option_player'),
  team: t('contract_option_team'),
  'non-guaranteed': t('contract_option_non_guaranteed')
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
        <thead><tr><th>${t('th_season')}</th><th>${t('th_salary')}</th><th>${t('th_option')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="player-meta" style="margin-top:6px">${t('contract_source_note')}</p>
  `;
}

