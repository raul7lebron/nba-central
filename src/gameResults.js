const { readCache, writeCache } = require('./cache');
const { getGamesForDate } = require('./balldontlie');
const { publishGameResult } = require('./socialPublish');

// balldontlie fecha los partidos con el dia en horario de EE.UU. (Eastern):
// duplicado a proposito de la funcion homonima en server.js (mismo calculo,
// modulos distintos, para no crear una dependencia cruzada entre server.js
// y src/ solo por esto).
function nbaTodayISO() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

// Mete los partidos ya finales de hoy en la cache de su temporada, para que
// /partido/:slug, el calendario y la clasificacion reflejen el resultado sin
// esperar al refresco completo de las 06:00.
function mergeIntoSeasonCache(finalGames) {
  const bySeasonId = new Map();
  for (const g of finalGames) {
    if (!bySeasonId.has(g.season)) bySeasonId.set(g.season, []);
    bySeasonId.get(g.season).push(g);
  }
  for (const [season, games] of bySeasonId) {
    const cacheKey = `games_${season}`;
    const cached = readCache(cacheKey, []);
    const byId = new Map(cached.map((g) => [g.id, g]));
    for (const g of games) byId.set(g.id, g);
    writeCache(cacheKey, [...byId.values()]);
  }
}

// Comprueba los partidos de hoy (mismo endpoint barato que usa el marcador
// en directo, no la temporada entera) y publica en redes el resultado de
// los que acaban de terminar. announced_game_results guarda que partidos ya
// se publicaron, para no repetir el aviso en la siguiente pasada del cron.
async function checkFinishedGames() {
  const todayGames = await getGamesForDate(nbaTodayISO());
  if (!todayGames || todayGames.length === 0) return;

  const finalGames = todayGames.filter((g) => g.status_state === 'final');
  if (finalGames.length === 0) return;

  mergeIntoSeasonCache(finalGames);

  const announced = new Set(readCache('announced_game_results', []));
  const newlyFinal = finalGames.filter((g) => !announced.has(g.id));
  if (newlyFinal.length === 0) return;

  for (const game of newlyFinal) {
    try {
      await publishGameResult(game);
    } catch (err) {
      console.error(`[social] fallo publicando resultado partido ${game.id}: ${err.message}`);
    }
    announced.add(game.id);
  }
  writeCache('announced_game_results', [...announced]);
}

module.exports = { checkFinishedGames };
