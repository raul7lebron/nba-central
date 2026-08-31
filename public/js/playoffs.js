function seasonLabel(season) {
  return `${season}-${String(season + 1).slice(2)}`;
}

async function buildSeasonPicker() {
  const wrap = document.getElementById('season-picker-wrap');
  const res = await fetch('/api/seasons');
  const { current, earliest } = await res.json();

  const params = new URLSearchParams(window.location.search);
  const selected = parseInt(params.get('season'), 10) || current;

  let options = '';
  for (let s = current; s >= earliest; s--) {
    options += `<option value="${s}" ${s === selected ? 'selected' : ''}>${seasonLabel(s)}</option>`;
  }

  wrap.innerHTML = `<select id="season-select" class="pill" style="cursor:pointer;font-weight:700">${options}</select>`;

  document.getElementById('season-select').addEventListener('change', (e) => {
    const url = new URL(window.location.href);
    url.searchParams.set('season', e.target.value);
    window.location.href = url.toString();
  });

  return selected;
}

function renderSeries(s) {
  const winnerIsA = s.winner.id === s.teamA.id;
  return `
    <div class="player-card" style="cursor:default;flex-direction:column;align-items:stretch;gap:10px;padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px">
          ${logoImgOrBadge(s.teamA.abbreviation, 26)}
          <span style="font-weight:${winnerIsA ? 700 : 500};color:${winnerIsA ? 'var(--text)' : 'var(--text-dim)'}">${s.teamA.full_name}</span>
        </div>
        <span style="font-weight:800;font-size:1.1rem">${s.winsA}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px">
          ${logoImgOrBadge(s.teamB.abbreviation, 26)}
          <span style="font-weight:${!winnerIsA ? 700 : 500};color:${!winnerIsA ? 'var(--text)' : 'var(--text-dim)'}">${s.teamB.full_name}</span>
        </div>
        <span style="font-weight:800;font-size:1.1rem">${s.winsB}</span>
      </div>
    </div>
  `;
}

async function loadPlayoffs() {
  const container = document.getElementById('playoffs-container');
  const season = await buildSeasonPicker();

  try {
    const res = await fetch(`/api/playoffs?season=${season}`);
    const data = await res.json();

    if (!data.rounds || !data.rounds.length) {
      container.innerHTML = '<p class="state-msg">No hay partidos de playoffs registrados para esta temporada todavía.</p>';
      return;
    }

    container.innerHTML = data.rounds.map((round) => `
      <div style="margin-bottom:28px">
        <h3 style="margin-bottom:12px">${round.name}</h3>
        <div class="roster-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
          ${round.series.map(renderSeries).join('')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudieron cargar los playoffs.</p>';
  }
}

loadPlayoffs();
