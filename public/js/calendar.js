function seasonLabel(season) {
  return `${season}-${String(season + 1).slice(2)}`;
}

function formatGameDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatGameTime(datetime) {
  if (!datetime) return '';
  const d = new Date(datetime);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

let allTeams = [];
let allGames = [];

async function buildFilters() {
  const wrap = document.getElementById('filters-wrap');
  const [seasonsRes, teamsRes] = await Promise.all([
    fetch('/api/seasons'),
    fetch('/api/teams')
  ]);
  const { current, earliest } = await seasonsRes.json();
  allTeams = await teamsRes.json();
  allTeams.sort((a, b) => a.full_name.localeCompare(b.full_name));

  const params = new URLSearchParams(window.location.search);
  const selectedSeason = parseInt(params.get('season'), 10) || current;
  const selectedTeam = params.get('team') || '';

  let seasonOptions = '';
  for (let s = current; s >= earliest; s--) {
    seasonOptions += `<option value="${s}" ${s === selectedSeason ? 'selected' : ''}>${seasonLabel(s)}</option>`;
  }

  const teamOptions = allTeams.map((t) =>
    `<option value="${t.id}" ${String(t.id) === selectedTeam ? 'selected' : ''}>${t.full_name}</option>`
  ).join('');

  wrap.innerHTML = `
    <select id="season-select" class="pill" style="cursor:pointer;font-weight:700">${seasonOptions}</select>
    <select id="team-select" class="pill" style="cursor:pointer">
      <option value="">Todos los equipos</option>
      ${teamOptions}
    </select>
  `;

  document.getElementById('season-select').addEventListener('change', (e) => {
    const url = new URL(window.location.href);
    url.searchParams.set('season', e.target.value);
    window.location.href = url.toString();
  });

  document.getElementById('team-select').addEventListener('change', (e) => {
    const url = new URL(window.location.href);
    if (e.target.value) url.searchParams.set('team', e.target.value);
    else url.searchParams.delete('team');
    window.location.href = url.toString();
  });

  return { season: selectedSeason, team: selectedTeam };
}

function renderGames(games) {
  const container = document.getElementById('calendar-container');
  if (!games.length) {
    container.innerHTML = '<p class="state-msg">No hay partidos para este filtro.</p>';
    return;
  }

  const byDate = new Map();
  for (const g of games) {
    if (!byDate.has(g.date)) byDate.set(g.date, []);
    byDate.get(g.date).push(g);
  }

  container.innerHTML = [...byDate.entries()].map(([date, dayGames]) => `
    <div style="margin-bottom:22px">
      <h3 style="margin-bottom:10px;text-transform:capitalize">${formatGameDate(date)}</h3>
      <div class="roster-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
        ${dayGames.map((g) => renderGameCard(g)).join('')}
      </div>
    </div>
  `).join('');
}

function renderGameCard(g) {
  const played = g.status_state === 'final';
  const scoreOrTime = played
    ? `${g.visitor_team_score} - ${g.home_team_score}`
    : formatGameTime(g.datetime);

  return `
    <div class="player-card" style="cursor:default;flex-direction:column;align-items:stretch;gap:8px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px">
          ${logoImgOrBadge(g.visitor_team.abbreviation, 22)}
          <span class="player-meta">${g.visitor_team.abbreviation}</span>
        </div>
        <span style="font-weight:700">${played ? scoreOrTime.split(' - ')[0] : ''}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px">
          ${logoImgOrBadge(g.home_team.abbreviation, 22)}
          <span class="player-meta">${g.home_team.abbreviation}</span>
        </div>
        <span style="font-weight:700">${played ? scoreOrTime.split(' - ')[1] : ''}</span>
      </div>
      ${!played ? `<div class="player-meta" style="text-align:center">${scoreOrTime || 'Por confirmar'}</div>` : ''}
    </div>
  `;
}

async function loadCalendar() {
  const container = document.getElementById('calendar-container');
  const { season, team } = await buildFilters();

  try {
    const res = await fetch(`/api/games?season=${season}`);
    const data = await res.json();
    allGames = data.games || [];

    const filtered = team
      ? allGames.filter((g) => String(g.home_team.id) === team || String(g.visitor_team.id) === team)
      : allGames;

    renderGames(filtered);
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudo cargar el calendario.</p>';
  }
}

loadCalendar();
