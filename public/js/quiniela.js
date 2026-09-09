// Quiniela semanal: elegir el ganador de cada partido de la semana. Sin
// sistema de cuentas en el sitio: la identidad es un id aleatorio guardado
// en este navegador (localStorage) + un apodo que el usuario elige para el
// marcador. Las picks se guardan solas al elegirlas (sin boton "Guardar"),
// para que cuenten en la clasificacion aunque el usuario se vaya enseguida.

function escapeAttr(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const CLIENT_ID_KEY = 'elrompearos_quiniela_client_id';
const NICKNAME_KEY = 'elrompearos_quiniela_nickname';

function getOrCreateClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch (err) {
    // localStorage bloqueado (navegacion privada estricta, etc.): se genera
    // un id de todas formas, pero no sobrevivira a un recargar la pagina.
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function getNickname() {
  try {
    return localStorage.getItem(NICKNAME_KEY) || '';
  } catch (err) {
    return '';
  }
}

function setNickname(value) {
  try {
    localStorage.setItem(NICKNAME_KEY, value);
  } catch (err) {
    // sin persistencia disponible: el apodo solo dura esta visita
  }
}

function localPicksKey(season, week) {
  return `elrompearos_quiniela_picks_${season}_${week}`;
}

function loadLocalPicks(season, week) {
  try {
    const raw = localStorage.getItem(localPicksKey(season, week));
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function saveLocalPicks(season, week, picks) {
  try {
    localStorage.setItem(localPicksKey(season, week), JSON.stringify(picks));
  } catch (err) {
    // sin persistencia disponible: las picks solo duran esta visita
  }
}

const clientId = getOrCreateClientId();
let nickname = getNickname();

let currentSeason = null;
let currentWeek = null;
let availableWeeks = [];
let weekGames = [];
let myPicks = {};
let saveTimer = null;

function formatWeekLabel(games) {
  if (!games.length) return '';
  const first = new Date(games[0].datetime);
  const last = new Date(games[games.length - 1].datetime);
  const fmt = (d) => d.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' });
  return `${fmt(first)} – ${fmt(last)}`;
}

function formatGameTime(datetime) {
  const d = new Date(datetime);
  return d.toLocaleDateString(getLocale(), { weekday: 'short', day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
}

function isLocked(g) {
  return g.status_state === 'final' || new Date(g.datetime) <= new Date();
}

function winnerOf(g) {
  if (g.status_state !== 'final') return null;
  return g.home_team_score > g.visitor_team_score ? g.home_team.id : g.visitor_team.id;
}

function pickButtonHtml(g, team, opponentScore, myScore) {
  const picked = myPicks[g.id] === team.id;
  const locked = isLocked(g);
  const winner = winnerOf(g);
  const classes = ['quiniela-pick-btn'];
  if (picked) classes.push('is-picked');
  if (winner === team.id) classes.push('is-winner');
  if (picked && winner != null && winner !== team.id) classes.push('is-wrong');
  if (locked) classes.push('is-locked');

  const scoreHtml = g.status_state === 'final' ? `<span class="quiniela-score">${myScore}</span>` : '';

  return `
    <button type="button" class="${classes.join(' ')}" data-game="${g.id}" data-team="${team.id}" ${locked ? 'disabled' : ''}>
      ${logoImgOrBadge(team.abbreviation, 32)}
      <span class="player-meta">${displayAbbr(team.abbreviation)}</span>
      ${scoreHtml}
    </button>
  `;
}

function renderGameCard(g) {
  const locked = isLocked(g);
  const statusLabel = g.status_state === 'final'
    ? t('quiniela_final')
    : (locked ? t('quiniela_in_progress') : formatGameTime(g.datetime));

  return `
    <div class="quiniela-game">
      <div class="quiniela-game-teams">
        ${pickButtonHtml(g, g.visitor_team, g.home_team_score, g.visitor_team_score)}
        <span class="quiniela-vs">@</span>
        ${pickButtonHtml(g, g.home_team, g.visitor_team_score, g.home_team_score)}
      </div>
      <div class="quiniela-game-meta">${statusLabel}</div>
    </div>
  `;
}

function renderGames() {
  const container = document.getElementById('quiniela-games');
  if (!weekGames.length) {
    container.innerHTML = `<p class="state-msg">${t('quiniela_no_games_week')}</p>`;
    return;
  }
  container.innerHTML = `<div class="quiniela-games-grid">${weekGames.map(renderGameCard).join('')}</div>`;

  container.querySelectorAll('.quiniela-pick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset.game;
      const teamId = Number(btn.dataset.team);
      myPicks[gameId] = teamId;
      saveLocalPicks(currentSeason, currentWeek, myPicks);
      renderGames();
      renderMyScore();
      schedulePicksSave();
    });
  });
}

function renderMyScore() {
  const el = document.getElementById('quiniela-my-score');
  const decidedGames = weekGames.filter((g) => g.status_state === 'final' && myPicks[g.id] != null);
  if (!decidedGames.length) {
    el.textContent = '';
    return;
  }
  const correct = decidedGames.filter((g) => winnerOf(g) === myPicks[g.id]).length;
  el.textContent = t('quiniela_my_score', { correct, total: decidedGames.length });
}

function updateSaveStatus(text) {
  document.getElementById('quiniela-save-status').textContent = text;
}

function schedulePicksSave() {
  clearTimeout(saveTimer);
  updateSaveStatus(t('quiniela_saving'));
  saveTimer = setTimeout(async () => {
    try {
      const res = await fetch('/api/quiniela/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, nickname, season: currentSeason, week: currentWeek, picks: myPicks })
      });
      if (!res.ok) throw new Error('bad status');
      updateSaveStatus(t('quiniela_saved'));
      loadLeaderboard();
    } catch (err) {
      updateSaveStatus(t('quiniela_save_error'));
    }
  }, 500);
}

function renderWeekNav() {
  const label = document.getElementById('week-label');
  label.textContent = weekGames.length ? formatWeekLabel(weekGames) : currentWeek;

  const idx = availableWeeks.indexOf(currentWeek);
  const prevBtn = document.getElementById('week-prev');
  const nextBtn = document.getElementById('week-next');
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx === -1 || idx >= availableWeeks.length - 1;
}

async function loadWeek(week) {
  document.getElementById('quiniela-games').innerHTML = `<p class="state-msg">${t('quiniela_games_loading')}</p>`;
  try {
    const params = new URLSearchParams();
    if (week) params.set('week', week);
    const res = await fetch(`/api/quiniela/week?${params.toString()}`);
    const data = await res.json();
    currentSeason = data.season;
    currentWeek = data.week;
    availableWeeks = data.availableWeeks;
    weekGames = data.games;
    myPicks = loadLocalPicks(currentSeason, currentWeek);

    renderWeekNav();
    renderGames();
    renderMyScore();
    loadLeaderboard();
  } catch (err) {
    document.getElementById('quiniela-games').innerHTML = `<p class="error-msg">${t('quiniela_games_error')}</p>`;
  }
}

function renderLeaderboardTable(entries, emptyMsg) {
  if (!entries.length) return `<p class="state-msg">${emptyMsg}</p>`;
  const rows = entries.slice(0, 20).map((e, i) => {
    const pct = e.decided ? Math.round((e.correct / e.decided) * 100) : 0;
    const isMe = e.clientId === clientId;
    return `
      <tr ${isMe ? 'style="color:var(--accent);font-weight:700"' : ''}>
        <td>${i + 1}</td>
        <td style="text-align:left">${e.nickname ? escapeAttr(e.nickname) : t('quiniela_anonymous')}${isMe ? t('quiniela_you_suffix') : ''}</td>
        <td>${e.correct}</td>
        <td>${e.decided}</td>
        <td>${pct}%</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-scroll">
      <table class="stats-table">
        <thead><tr><th>#</th><th style="text-align:left">${t('quiniela_th_nickname')}</th><th>${t('quiniela_th_correct')}</th><th>${t('quiniela_th_decided')}</th><th>%</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function loadLeaderboard() {
  const wrap = document.getElementById('quiniela-leaderboard');
  try {
    const res = await fetch(`/api/quiniela/leaderboard?season=${currentSeason}&week=${currentWeek}`);
    const data = await res.json();
    wrap.innerHTML = `
      <h2 style="font-size:1.1rem;margin:24px 0 8px">${t('quiniela_week_leaderboard_title')}</h2>
      ${renderLeaderboardTable(data.weekLeaderboard, t('quiniela_week_leaderboard_empty'))}
      <h2 style="font-size:1.1rem;margin:24px 0 8px">${t('quiniela_season_leaderboard_title')}</h2>
      ${renderLeaderboardTable(data.seasonLeaderboard, t('quiniela_season_leaderboard_empty'))}
    `;
  } catch (err) {
    wrap.innerHTML = `<p class="error-msg">${t('quiniela_leaderboard_error')}</p>`;
  }
}

function initNicknameInput() {
  const input = document.getElementById('quiniela-nickname');
  input.value = nickname;
  input.addEventListener('change', () => {
    nickname = input.value.trim().slice(0, 24);
    setNickname(nickname);
    if (Object.keys(myPicks).length) schedulePicksSave();
    loadLeaderboard();
  });
}

function initWeekNav() {
  document.getElementById('week-prev').addEventListener('click', () => {
    const idx = availableWeeks.indexOf(currentWeek);
    if (idx > 0) loadWeek(availableWeeks[idx - 1]);
  });
  document.getElementById('week-next').addEventListener('click', () => {
    const idx = availableWeeks.indexOf(currentWeek);
    if (idx !== -1 && idx < availableWeeks.length - 1) loadWeek(availableWeeks[idx + 1]);
  });
}

initNicknameInput();
initWeekNav();
loadWeek(null);

document.getElementById('quiniela-ad-slot').innerHTML = renderAdSlot('teamFooter');
activateAdSlots();
