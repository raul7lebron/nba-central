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

  wrap.innerHTML = `
    <select id="season-select" class="pill" style="cursor:pointer;font-weight:700">
      ${options}
    </select>
  `;

  document.getElementById('season-select').addEventListener('change', (e) => {
    const url = new URL(window.location.href);
    url.searchParams.set('season', e.target.value);
    window.location.href = url.toString();
  });

  return selected;
}

function renderConferenceTable(title, rows) {
  const body = rows.map((r) => `
    <tr>
      <td>${r.rank}</td>
      <td style="text-align:left;display:flex;align-items:center;gap:10px;padding-left:4px">
        ${logoImgOrBadge(r.team.abbreviation, 24)}
        <a href="/team.html?id=${r.team.id}" style="color:inherit;text-decoration:none;font-weight:600">${r.team.full_name}</a>
      </td>
      <td>${r.wins}</td>
      <td>${r.losses}</td>
      <td>${(r.winPct * 100).toFixed(1)}%</td>
      <td>${r.rank === 1 ? '-' : r.gamesBehind.toFixed(1)}</td>
      <td style="color:${r.avgDiff >= 0 ? '#3ecf6e' : '#ff6b6b'}">${r.avgDiff >= 0 ? '+' : ''}${r.avgDiff.toFixed(1)}</td>
    </tr>
  `).join('');

  return `
    <div>
      <h3 style="margin-bottom:10px">${title}</h3>
      <div class="table-scroll">
        <table class="stats-table">
          <thead>
            <tr>
              <th>#</th><th style="text-align:left;padding-left:4px">Equipo</th><th>V</th><th>D</th>
              <th>%V</th><th>GB</th><th>DIF</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

async function loadStandings() {
  const container = document.getElementById('standings-container');
  const season = await buildSeasonPicker();

  try {
    const res = await fetch(`/api/standings?season=${season}`);
    const data = await res.json();

    if (!data.East?.length && !data.West?.length) {
      container.innerHTML = '<p class="state-msg">No hay partidos registrados para esta temporada todavía.</p>';
      return;
    }

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:24px">
        ${renderConferenceTable('Conferencia Este', data.East)}
        ${renderConferenceTable('Conferencia Oeste', data.West)}
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudo cargar la clasificación.</p>';
  }
}

loadStandings();
