// Cliente para la API publica https://www.balldontlie.io (v1)
// Necesita una API key gratuita: https://www.balldontlie.io -> Sign up -> My Account
const BASE_URL = 'https://api.balldontlie.io/v1';

function getApiKey() {
  return process.env.BALLDONTLIE_API_KEY || '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// El plan gratuito de balldontlie.io tiene un limite de peticiones por minuto
// muy bajo. Reintentamos con espera cuando responde 429.
async function bdlFetch(endpoint, retries = 5) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Falta BALLDONTLIE_API_KEY. Copia .env.example a .env y añade tu clave gratuita de https://www.balldontlie.io'
    );
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: apiKey }
      });
    } catch (networkErr) {
      if (attempt < retries) {
        await sleep(2000);
        continue;
      }
      throw networkErr;
    }

    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get('retry-after')) || 3;
      await sleep((retryAfter + 1) * 1000);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`balldontlie ${endpoint} -> HTTP ${res.status}: ${body}`);
    }
    return res.json();
  }
}

async function fetchAllPages(endpoint, maxPages = 5) {
  let cursor;
  let all = [];
  for (let i = 0; i < maxPages; i++) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = cursor ? `${endpoint}${sep}cursor=${cursor}` : endpoint;
    const json = await bdlFetch(url);
    all = all.concat(json.data || []);
    cursor = json.meta && json.meta.next_cursor;
    if (!cursor) break;
  }
  return all;
}

async function getAllTeams() {
  const teams = await fetchAllPages('/teams?per_page=100', 1);
  // balldontlie tambien devuelve equipos de otras ligas (Euroliga, NBL, CBA...);
  // los 30 equipos NBA son los unicos con conferencia East/West.
  return teams.filter((t) => ['East', 'West'].includes((t.conference || '').trim()));
}

async function getPlayersForTeam(teamId) {
  // /players devuelve el historial completo del equipo; /players/active (plan
  // ALL-STAR) filtra solo la plantilla vigente.
  return fetchAllPages(`/players/active?team_ids[]=${teamId}&per_page=100`, 3);
}

// Temporada NBA "actual": octubre-septiembre. Ej: en agosto 2026 la temporada
// vigente/mas reciente es la 2025 (2025-26), porque la 2026-27 empieza en octubre 2026.
function currentSeasonYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  return month >= 10 ? year : year - 1;
}

async function getSeasonAveragesForPlayer(playerId, season) {
  try {
    const json = await bdlFetch(
      `/season_averages?season=${season}&player_id=${playerId}`
    );
    return json.data || [];
  } catch (err) {
    // Los endpoints de stats requieren un plan de pago (ALL-STAR o superior).
    if (String(err.message).includes('401') || String(err.message).includes('403')) {
      return { error: 'PAID_TIER_REQUIRED' };
    }
    throw err;
  }
}

// /season_averages no dice en que equipo jugo esa temporada. /stats (partido
// a partido) si trae el equipo, asi que basta con pedir un partido cualquiera
// de esa temporada para saber el equipo (el ultimo que jugo esa temporada,
// por si hubo traspaso a mitad de curso).
async function getPlayerTeamForSeason(playerId, season) {
  try {
    const json = await bdlFetch(
      `/stats?player_ids[]=${playerId}&seasons[]=${season}&per_page=1`
    );
    const row = (json.data || [])[0];
    return row ? row.team : null;
  } catch (err) {
    return null;
  }
}

async function getPlayerStatsHistory(playerId, seasonsBack = 5) {
  const latest = currentSeasonYear();
  const seasons = Array.from({ length: seasonsBack }, (_, i) => latest - i);
  const history = [];
  for (const season of seasons) {
    const [rows, team] = await Promise.all([
      getSeasonAveragesForPlayer(playerId, season),
      getPlayerTeamForSeason(playerId, season)
    ]);
    if (rows && rows.error === 'PAID_TIER_REQUIRED') {
      return { error: 'PAID_TIER_REQUIRED' };
    }
    if (rows && rows.length > 0) {
      history.push({ season, team, ...rows[0] });
    }
  }
  return { current: history[0] || null, history };
}

// Historial de TODA la carrera de un jugador (para retirados/inactivos),
// desde su año de draft hasta que deja de haber datos (balldontlie si tiene
// datos de temporadas viejas, ej. Michael Jordan desde 1984). balldontlie no
// dice cuando se retiro alguien, asi que paramos tras varias temporadas
// seguidas sin datos una vez que ya hemos encontrado al menos una; y si un
// jugador no tiene NINGUN dato disponible (draft muy antiguo sin cobertura),
// nos rendimos tras un numero razonable de intentos en vano.
async function getPlayerCareerStatsHistory(playerId, fromYear) {
  const latest = currentSeasonYear();
  const startYear = (fromYear || latest) - 1; // por si el draft_year no coincide con el debut
  const history = [];
  let consecutiveEmpty = 0;

  for (let season = startYear; season <= latest; season++) {
    const [rows, team] = await Promise.all([
      getSeasonAveragesForPlayer(playerId, season),
      getPlayerTeamForSeason(playerId, season)
    ]);
    if (rows && rows.error === 'PAID_TIER_REQUIRED') {
      return { error: 'PAID_TIER_REQUIRED' };
    }
    if (rows && rows.length > 0) {
      history.push({ season, team, ...rows[0] });
      consecutiveEmpty = 0;
    } else {
      consecutiveEmpty++;
      // 5 de margen: algunos jugadores vuelven de un retiro de varias
      // temporadas (ej. Michael Jordan estuvo 3 años fuera antes de volver
      // con los Wizards). Menos margen los cortaria antes de su regreso.
      if (history.length > 0 && consecutiveEmpty >= 5) break;
      if (history.length === 0 && consecutiveEmpty >= 10) break; // sin datos en absoluto
    }
  }

  history.sort((a, b) => b.season - a.season);
  return { history };
}

async function getGamesForSeason(season) {
  return fetchAllPages(`/games?seasons[]=${season}&per_page=100`, 20);
}

// Estadisticas partido a partido de una lista de partidos concretos (usado
// por el modo Fantasy para calcular la valoracion de cada jugador tras cada
// jornada). Igual que /season_averages, requiere el plan de pago ALL-STAR
// o superior.
async function getStatsForGameIds(gameIds) {
  if (!gameIds.length) return [];
  const query = gameIds.map((id) => `game_ids[]=${id}`).join('&');
  try {
    return await fetchAllPages(`/stats?${query}&per_page=100`, 20);
  } catch (err) {
    if (String(err.message).includes('401') || String(err.message).includes('403')) {
      return { error: 'PAID_TIER_REQUIRED' };
    }
    throw err;
  }
}

// No existe filtro por año de draft en la API. Para construir el archivo de
// drafts hay que traer el historial COMPLETO de jugadores de cada equipo
// (no solo /active) y quedarnos con los que tengan draft_year.
async function getFullPlayerHistoryForTeam(teamId) {
  return fetchAllPages(`/players?team_ids[]=${teamId}&per_page=100`, 6);
}

module.exports = {
  getAllTeams,
  getPlayersForTeam,
  getPlayerStatsHistory,
  getPlayerCareerStatsHistory,
  getGamesForSeason,
  getStatsForGameIds,
  getFullPlayerHistoryForTeam,
  currentSeasonYear
};
