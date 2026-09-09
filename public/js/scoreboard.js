// Marcador en directo: tira horizontal con los partidos de hoy, con
// marcador en vivo si estan en juego. Se pide de nuevo cada 20s mientras la
// pagina este abierta (mismo intervalo que el cache del servidor) para que
// el marcador vaya avanzando sin recargar.
const SCOREBOARD_POLL_MS = 20000;

function scoreboardGameState(g) {
  if (g.status_state === 'final') return 'final';
  if (new Date(g.datetime) <= new Date()) return 'live';
  return 'upcoming';
}

function scoreboardFormatTime(datetime) {
  const d = new Date(datetime);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function scoreboardTeamRow(team, score, state, isWinner) {
  return `
    <div class="scoreboard-team${isWinner ? ' is-winner' : ''}">
      ${logoImgOrBadge(team.abbreviation, 24)}
      <span class="scoreboard-team-abbr">${displayAbbr(team.abbreviation)}</span>
      ${state !== 'upcoming' ? `<span class="scoreboard-score">${score}</span>` : ''}
    </div>
  `;
}

function scoreboardCard(g) {
  const state = scoreboardGameState(g);
  const homeWins = state !== 'upcoming' && g.home_team_score > g.visitor_team_score;
  const visitorWins = state !== 'upcoming' && g.visitor_team_score > g.home_team_score;

  const statusHtml = state === 'live'
    ? '<span class="scoreboard-status is-live"><span class="scoreboard-live-dot"></span>En directo</span>'
    : state === 'final'
      ? '<span class="scoreboard-status">Final</span>'
      : `<span class="scoreboard-status">${scoreboardFormatTime(g.datetime)}</span>`;

  return `
    <div class="scoreboard-card">
      ${scoreboardTeamRow(g.visitor_team, g.visitor_team_score, state, visitorWins)}
      ${scoreboardTeamRow(g.home_team, g.home_team_score, state, homeWins)}
      ${statusHtml}
    </div>
  `;
}

async function loadScoreboard() {
  const wrap = document.getElementById('scoreboard-wrap');
  if (!wrap) return;

  try {
    const res = await fetch('/api/games/live');
    const data = await res.json();
    const games = data.games || [];

    if (!games.length) {
      wrap.hidden = true;
      return;
    }

    wrap.hidden = false;
    document.getElementById('scoreboard-strip').innerHTML = games.map(scoreboardCard).join('');
  } catch (err) {
    wrap.hidden = true;
  }
}

loadScoreboard();
setInterval(loadScoreboard, SCOREBOARD_POLL_MS);
