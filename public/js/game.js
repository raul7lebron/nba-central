// Pagina de detalle de un partido: resultado + estadisticas por jugador
// (box score). URL: /partido/<id>?season=<season> (el season viene del
// enlace de origen, calendar.js, porque el id de partido no dice por si
// solo a que temporada pertenece).
function getGameIdFromUrl() {
  const match = window.location.pathname.match(/(\d+)\/?$/);
  return match ? match[1] : null;
}

function getSeasonFromUrl() {
  return new URLSearchParams(window.location.search).get('season');
}

function formatGameDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatGameTimeShort(datetime) {
  if (!datetime) return '';
  return new Date(datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function updateSeoForGame(game) {
  const played = game.status_state === 'final';
  const matchup = `${game.visitor_team.full_name} vs ${game.home_team.full_name}`;
  const title = played
    ? `${game.visitor_team_score}-${game.home_team_score}: ${matchup} - Resultado y estadísticas | El Rompearos`
    : `${matchup} - ${formatGameDateLong(game.date)} | El Rompearos`;
  const description = played
    ? `Resultado final: ${game.visitor_team.full_name} ${game.visitor_team_score} - ${game.home_team_score} ${game.home_team.full_name}. Estadísticas por jugador del partido.`
    : `${matchup}, partido programado para el ${formatGameDateLong(game.date)}.`;

  document.title = title;
  document.getElementById('page-title').textContent = title;
  document.getElementById('meta-description').setAttribute('content', description);
  document.getElementById('og-title').setAttribute('content', title);
  document.getElementById('og-description').setAttribute('content', description);

  if (!document.getElementById('game-jsonld')) {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'game-jsonld';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: matchup,
      startDate: game.datetime,
      eventStatus: played ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
      homeTeam: { '@type': 'SportsTeam', name: game.home_team.full_name },
      awayTeam: { '@type': 'SportsTeam', name: game.visitor_team.full_name },
      ...(played ? {
        winner: {
          '@type': 'SportsTeam',
          name: game.home_team_score > game.visitor_team_score ? game.home_team.full_name : game.visitor_team.full_name
        }
      } : {})
    });
    document.head.appendChild(ld);
  }

  const nav = document.getElementById('breadcrumb');
  nav.innerHTML = `
    <a href="/index.html">Inicio</a> <span class="sep" aria-hidden="true">/</span>
    <a href="/calendar.html">Calendario</a> <span class="sep" aria-hidden="true">/</span>
    <span aria-current="page">${matchup}</span>
  `;
}

function renderGameHero(game) {
  const heroEl = document.getElementById('game-hero');
  const played = game.status_state === 'final';
  const visitorWins = played && game.visitor_team_score > game.home_team_score;
  const homeWins = played && game.home_team_score > game.visitor_team_score;

  const statusLine = played
    ? 'Final'
    : `${formatGameDateLong(game.date)} · ${formatGameTimeShort(game.datetime)}`;
  const scoreLine = played ? `${game.visitor_team_score} - ${game.home_team_score}` : '';

  heroEl.innerHTML = `
    <h1 class="visually-hidden">${game.visitor_team.full_name} ${scoreLine} ${game.home_team.full_name}</h1>
    <div style="flex:1;text-align:center">
      <div class="player-meta" style="text-transform:capitalize;margin-bottom:14px">${statusLine}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap">
        <a href="/team.html?id=${game.visitor_team.id}" style="display:flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;color:inherit;min-width:120px">
          ${logoImgOrBadge(game.visitor_team.abbreviation, 56)}
          <span style="font-weight:700${visitorWins ? '' : ';color:var(--text-dim)'}">${displayAbbr(game.visitor_team.abbreviation)}</span>
          ${played ? `<span style="font-size:1.8rem;font-weight:800${visitorWins ? '' : ';color:var(--text-dim)'}">${game.visitor_team_score}</span>` : ''}
        </a>
        <span class="player-meta">@</span>
        <a href="/team.html?id=${game.home_team.id}" style="display:flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;color:inherit;min-width:120px">
          ${logoImgOrBadge(game.home_team.abbreviation, 56)}
          <span style="font-weight:700${homeWins ? '' : ';color:var(--text-dim)'}">${displayAbbr(game.home_team.abbreviation)}</span>
          ${played ? `<span style="font-size:1.8rem;font-weight:800${homeWins ? '' : ';color:var(--text-dim)'}">${game.home_team_score}</span>` : ''}
        </a>
      </div>
      ${renderShareButtons(
        window.location.href,
        played
          ? `${game.visitor_team.full_name} ${game.visitor_team_score} - ${game.home_team_score} ${game.home_team.full_name}`
          : `${game.visitor_team.full_name} vs ${game.home_team.full_name}`
      )}
    </div>
  `;
}

function renderBoxScoreTable(team, rows) {
  if (!rows.length) return '';

  const sorted = [...rows].sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
  const body = sorted.map((r) => `
    <tr>
      <td style="text-align:left">${r.player ? `<a href="${playerUrl(r.player)}" style="color:inherit;text-decoration:none">${r.player.first_name} ${r.player.last_name}</a>` : '—'}</td>
      <td>${r.min || '-'}</td>
      <td>${r.pts ?? '-'}</td>
      <td>${r.reb ?? '-'}</td>
      <td>${r.ast ?? '-'}</td>
      <td>${r.stl ?? '-'}</td>
      <td>${r.blk ?? '-'}</td>
      <td>${r.fg_pct != null ? (r.fg_pct * 100).toFixed(1) + '%' : '-'}</td>
      <td>${r.fg3_pct != null ? (r.fg3_pct * 100).toFixed(1) + '%' : '-'}</td>
    </tr>
  `).join('');

  return `
    <h2 style="display:flex;align-items:center;gap:8px">${logoImgOrBadge(team.abbreviation, 24)} ${team.full_name}</h2>
    <div class="table-scroll">
      <table class="stats-table">
        <thead>
          <tr>
            <th style="text-align:left">Jugador</th><th>MIN</th><th>PTS</th><th>REB</th>
            <th>AST</th><th>ROB</th><th>TAP</th><th>%TC</th><th>%3P</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function renderBoxScore(game, boxScore) {
  const el = document.getElementById('game-boxscore');
  if (!boxScore || !boxScore.length) {
    el.innerHTML = '<p class="state-msg">Todavía no hay estadísticas de este partido.</p>';
    return;
  }

  const visitorRows = boxScore.filter((r) => r.team && r.team.id === game.visitor_team.id);
  const homeRows = boxScore.filter((r) => r.team && r.team.id === game.home_team.id);

  el.innerHTML = `
    ${renderBoxScoreTable(game.visitor_team, visitorRows)}
    <div style="margin-top:24px">${renderBoxScoreTable(game.home_team, homeRows)}</div>
  `;
}

async function loadGame() {
  const gameId = getGameIdFromUrl();
  const season = getSeasonFromUrl();

  if (!gameId) {
    document.getElementById('game-hero').innerHTML = '<h1>Partido no especificado</h1>';
    return;
  }

  try {
    const url = season ? `/api/games/${gameId}/boxscore?season=${season}` : `/api/games/${gameId}/boxscore`;
    const res = await fetch(url);
    if (res.status === 404) {
      document.getElementById('game-hero').innerHTML = '<h1>Partido no encontrado</h1><p class="player-meta">Puede que el enlace sea incorrecto o el partido sea de otra temporada.</p>';
      return;
    }
    const data = await res.json();
    const { game, boxScore } = data;

    updateSeoForGame(game);
    renderGameHero(game);
    renderBoxScore(game, boxScore);

    document.getElementById('game-ad-slot').innerHTML = renderAdSlot('teamFooter');
    activateAdSlots();
  } catch (err) {
    document.getElementById('game-hero').innerHTML = '<p class="error-msg">No se pudo cargar el partido.</p>';
  }
}

loadGame();
