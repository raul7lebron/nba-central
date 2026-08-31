require('dotenv').config();
const { readCache, writeCache } = require('./cache');
const {
  getAllTeams,
  getPlayersForTeam,
  getGamesForSeason,
  getFullPlayerHistoryForTeam,
  currentSeasonYear
} = require('./balldontlie');
const { fetchAllNews } = require('./news');
const { getTeamSalaries } = require('./salaries');
const { getAllPlayerRatings } = require('./ratings2k');
const { updateTransactionsArchive } = require('./transactions');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshTeamsAndRosters() {
  console.log('[refresh] descargando equipos...');
  const teams = await getAllTeams();
  writeCache('teams', teams);

  const rosters = readCache('rosters', {});
  for (const team of teams) {
    try {
      console.log(`[refresh] plantilla de ${team.full_name}...`);
      rosters[team.id] = await getPlayersForTeam(team.id);
      writeCache('rosters', rosters);
    } catch (err) {
      console.error(`[refresh] fallo plantilla equipo ${team.id}: ${err.message}`);
    }
    await sleep(2000);
  }
  console.log(`[refresh] ${teams.length} equipos y plantillas actualizados.`);
}

async function refreshNews() {
  console.log('[refresh] descargando noticias...');
  const news = await fetchAllNews();
  writeCache('news', news);
  console.log(`[refresh] ${news.length} noticias actualizadas.`);

  const transactions = updateTransactionsArchive(readCache('transactions', []), news);
  writeCache('transactions', transactions);
  console.log(`[refresh] ${transactions.length} noticias de mercado en el archivo (6 meses).`);
}

// Los contratos apenas cambian fuera de fichajes/traspasos: no hace falta
// refrescarlos a diario (se ejecuta en un cron aparte, semanal).
async function refreshSalaries() {
  console.log('[refresh] descargando salarios (HoopsHype)...');
  const teams = readCache('teams', []);
  const season = currentSeasonYear();
  const salaries = readCache('salaries', {});

  for (const team of teams) {
    try {
      salaries[team.abbreviation] = await getTeamSalaries(team.abbreviation, season);
      writeCache('salaries', salaries);
    } catch (err) {
      console.error(`[refresh] fallo salarios ${team.abbreviation}: ${err.message}`);
    }
    await sleep(1500);
  }
  writeCache('salaries_meta', { lastRefresh: new Date().toISOString(), season });
  console.log(`[refresh] salarios de ${teams.length} equipos actualizados.`);
}

// Las valoraciones de NBA 2K se actualizan de vez en cuando (parches del
// juego), no hace falta refrescarlas a diario: se hace en el cron semanal
// junto con los salarios.
async function refreshRatings2k() {
  console.log('[refresh] descargando valoraciones NBA 2K...');
  const ratings = await getAllPlayerRatings();
  writeCache('ratings2k', ratings);
  console.log(`[refresh] ${ratings.length} valoraciones 2K actualizadas.`);
}

// No existe filtro por año de draft en la API: hay que traer el historial
// COMPLETO de jugadores de cada equipo (no solo /active) y quedarse con los
// que tengan draft_year. Se ejecuta en el cron semanal (no cambia a diario,
// solo cuando hay un draft nuevo cada junio).
async function refreshDraftArchive() {
  console.log('[refresh] descargando archivo de drafts...');
  const teams = readCache('teams', []);
  const byPlayerId = new Map();

  for (const team of teams) {
    try {
      const history = await getFullPlayerHistoryForTeam(team.id);
      for (const p of history) {
        if (p.draft_year) byPlayerId.set(p.id, p);
      }
    } catch (err) {
      console.error(`[refresh] fallo historial equipo ${team.id}: ${err.message}`);
    }
    await sleep(1500);
  }

  const archive = [...byPlayerId.values()];
  writeCache('draft_archive', archive);
  console.log(`[refresh] ${archive.length} jugadores drafteados en el archivo.`);
}

// Los partidos de temporadas pasadas nunca cambian (se cachean bajo demanda
// la primera vez que se piden). Solo la temporada en curso necesita
// refrescarse a diario, para que calendario y clasificacion reflejen los
// resultados mas recientes.
async function refreshCurrentSeasonGames() {
  const season = currentSeasonYear();
  console.log(`[refresh] descargando partidos de la temporada ${season}...`);
  const games = await getGamesForSeason(season);
  writeCache(`games_${season}`, games);
  console.log(`[refresh] ${games.length} partidos actualizados.`);
}

async function refreshAll() {
  await refreshNews();
  await refreshTeamsAndRosters();
  await refreshCurrentSeasonGames();
  writeCache('meta', { lastFullRefresh: new Date().toISOString() });
}

if (require.main === module) {
  const mode = process.argv[2];
  const task =
    mode === 'salaries' ? refreshSalaries() :
    mode === 'ratings2k' ? refreshRatings2k() :
    mode === 'draft' ? refreshDraftArchive() :
    mode === 'games' ? refreshCurrentSeasonGames() :
    refreshAll();
  task
    .then(() => {
      console.log('[refresh] completo.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[refresh] error fatal:', err);
      process.exit(1);
    });
}

module.exports = {
  refreshAll,
  refreshNews,
  refreshTeamsAndRosters,
  refreshSalaries,
  refreshRatings2k,
  refreshDraftArchive,
  refreshCurrentSeasonGames
};
