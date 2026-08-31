async function buildYearPicker() {
  const wrap = document.getElementById('year-picker-wrap');
  const res = await fetch('/api/draft/years');
  const { min, max } = await res.json();

  const params = new URLSearchParams(window.location.search);
  const selected = parseInt(params.get('year'), 10) || max;

  let options = '';
  for (let y = max; y >= min; y--) {
    options += `<option value="${y}" ${y === selected ? 'selected' : ''}>${y}</option>`;
  }

  wrap.innerHTML = `<select id="year-select" class="pill" style="cursor:pointer;font-weight:700">${options}</select>`;

  document.getElementById('year-select').addEventListener('change', (e) => {
    const url = new URL(window.location.href);
    url.searchParams.set('year', e.target.value);
    window.location.href = url.toString();
  });

  return selected;
}

function renderPick(p) {
  const teamBadge = p.currentTeam
    ? `${logoImgOrBadge(p.currentTeam.abbreviation, 22)}<span class="player-meta">${p.currentTeam.abbreviation}</span>`
    : '<span class="player-meta">—</span>';

  return `
    <div class="player-card" data-id="${p.id}">
      <div class="player-jersey">#${p.pick}</div>
      <div style="flex:1">
        <div class="player-name">${p.first_name} ${p.last_name}</div>
        <div class="player-meta">${p.position || 'N/D'} · ${p.college || p.country || 'N/D'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">${teamBadge}</div>
    </div>
  `;
}

async function loadDraft() {
  const container = document.getElementById('draft-container');
  const year = await buildYearPicker();

  try {
    const res = await fetch(`/api/draft?year=${year}`);
    const data = await res.json();

    if (!data.rounds || !data.rounds.length) {
      container.innerHTML = '<p class="state-msg">No hay datos de draft para este año todavía.</p>';
      return;
    }

    const allPlayers = data.rounds.flatMap((round) => round.players);

    container.innerHTML = data.rounds.map((round) => `
      <div style="margin-bottom:28px">
        <h3 style="margin-bottom:12px">Ronda ${round.round}</h3>
        <div class="roster-grid">
          ${round.players.map(renderPick).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.player-card').forEach((card) => {
      const player = allPlayers.find((p) => String(p.id) === card.dataset.id);
      card.addEventListener('click', () => {
        if (player.isActive) showPlayerStats(player);
        else showRetiredPlayerCard(player);
      });
    });
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudo cargar el draft.</p>';
  }
}

loadDraft();
