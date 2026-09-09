require('dotenv').config();
const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const { readCache, writeCache } = require('./src/cache');
const {
  getPlayerStatsHistory,
  getPlayerCareerStatsHistory,
  getGamesForSeason,
  getGamesForDate,
  currentSeasonYear
} = require('./src/balldontlie');
const { refreshAll, refreshSalaries, refreshRatings2k, refreshBirthYears, refreshSeasonLeaders, refreshDraftArchive } = require('./src/refreshAll');
const { startScheduler } = require('./src/scheduler');
const { getTeamInfo } = require('./src/teamInfo');
const { normalizeName, LEAGUE_SALARY_CAP_2025_26 } = require('./src/salaries');
const { playerSlug } = require('./src/playerSlug');
const { normalizeName: normalize2kName, getPeakRatingByName } = require('./src/ratings2k');
const { computeStandings } = require('./src/standings');
const { computePlayoffBracket } = require('./src/playoffs');
const { isoWeekKey, buildResultsByGame, groupGamesByWeek, scoreWeeks } = require('./src/quiniela');

const EARLIEST_SEASON = 1980;

// Los partidos de una temporada ya finalizada no cambian nunca: se cachean
// para siempre. La temporada en curso se refresca a diario desde el cron.
async function getOrFetchSeasonGames(season) {
  const cacheKey = `games_${season}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const games = await getGamesForSeason(season);
  writeCache(cacheKey, games);
  return games;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Comprime HTML/CSS/JS/JSON con gzip antes de enviarlos: menos bytes por la
// red, sobre todo notable en movil. Las imagenes/webp ya van comprimidas,
// compression las deja pasar tal cual.
app.use(compression());

function escapeAttr(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function formatNewsDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function renderNewsItemHtml(item) {
  const imgHtml = item.image
    ? `<img class="news-thumb" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy" onerror="this.remove()">`
    : '';
  return `
    <a class="news-item" href="${escapeAttr(item.link)}" target="_blank" rel="noopener noreferrer">
      ${imgHtml}
      <div class="news-body">
        <span class="news-source">${item.source}</span>
        <div class="news-title">${escapeAttr(item.title)}</div>
        <div class="news-summary">${escapeAttr(item.summary || '')}</div>
        <div class="news-date">${formatNewsDate(item.pubDate)}</div>
      </div>
    </a>
  `;
}

// Mismo formato que injectNewsJsonLd en public/js/news.js: cuando el
// cliente ejecuta, busca este script por id y lo sustituye por el suyo (no
// se duplica).
function buildNewsJsonLd(news) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: news.slice(0, 20).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'NewsArticle',
        headline: item.title,
        image: item.image || undefined,
        datePublished: item.pubDate || undefined,
        url: item.link,
        publisher: { '@type': 'Organization', name: item.source }
      }
    }))
  });
}

const indexHtmlPath = path.join(__dirname, 'public', 'index.html');

// index.html se servia siempre igual (estatico), con un "Cargando
// noticias..." en el HTML crudo: cualquier buscador que no ejecute JS (o
// que le dé menos peso a lo que solo aparece tras ejecutarlo) veia una
// portada practicamente vacia, a pesar de ser contenido real y ya
// disponible en el servidor. Aqui se rellena el mismo hueco que
// public/js/news.js rellena en el cliente, con las noticias ya cacheadas,
// antes de mandar la pagina. El cliente sigue haciendo su fetch normal y
// vuelve a pintar encima: no hace falta ningun cambio en news.js.
function renderIndexHtml() {
  const template = fs.readFileSync(indexHtmlPath, 'utf-8');
  const news = readCache('news', []);

  const newsHtml = news.length
    ? news.map(renderNewsItemHtml).join('')
    : '<p class="state-msg">Todavía no hay noticias cacheadas. Vuelve en unos minutos.</p>';
  const jsonLdHtml = news.length
    ? `<script type="application/ld+json" id="news-jsonld">${buildNewsJsonLd(news)}</script>`
    : '';

  return template.replace(
    /<div id="news-container" class="news-list">[\s\S]*?<\/div>/,
    `<div id="news-container" class="news-list">${newsHtml}</div>${jsonLdHtml}`
  );
}

app.get(['/', '/index.html'], (req, res) => {
  res.set('Cache-Control', 'public, max-age=120');
  res.send(renderIndexHtml());
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', index: false }));
// Limite pequeño a proposito: el unico body que se envia es el de las picks
// de la quiniela (un puñado de ids de partido/equipo), no hace falta mas.
app.use(express.json({ limit: '20kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// URL con el nombre del jugador (ej. /jugador/lebron-james-237) en vez de
// un parametro de consulta: mejor para SEO porque la propia URL lleva la
// palabra clave. El slug es cosmetico, solo se usa el id del final; player.js
// lo extrae con una expresion regular y pide los datos por id.
app.get('/jugador/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Sitemap dinamico: incluye las paginas fijas + una entrada por cada uno de
// los 30 equipos (paginas de contenido real y distinto, altas para SEO).
// El fallback coincide con el dominio ya fijado en robots.txt y en las
// etiquetas canonical/og:url de cada pagina.
const SITE_URL = process.env.SITE_URL || 'https://www.elrompearos.com';

app.get('/sitemap.xml', (req, res) => {
  const staticPages = [
    '/index.html', '/teams.html', '/standings.html', '/stats.html', '/compare.html', '/trade.html', '/quiniela.html', '/calendar.html',
    '/playoffs.html', '/draft.html', '/market.html', '/store.html'
  ];
  const teams = readCache('teams', []);
  const teamUrls = teams.map((t) => `/team.html?id=${t.id}`);

  // Solo jugadores de plantillas activas: son los unicos con ficha completa
  // (salario, contrato, valoracion 2K). El archivo historico del draft tiene
  // muchos menos datos y de momento se deja fuera del sitemap.
  const rosters = readCache('rosters', {});
  const playerUrls = Object.values(rosters)
    .flat()
    .map((p) => `/jugador/${playerSlug(p)}`);

  const urls = [...staticPages, ...teamUrls, ...playerUrls];

  const lastmod = (readCache('meta', {}).lastFullRefresh || new Date().toISOString()).slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

// Mapas reutilizados para enriquecer cualquier jugador (draft, busqueda...)
// con si esta activo, su salario y sus valoraciones 2K.
function buildPlayerEnrichmentMaps() {
  const rosters = readCache('rosters', {});
  const activeIds = new Set();
  for (const roster of Object.values(rosters)) {
    for (const p of roster) activeIds.add(p.id);
  }

  const allSalaries = Object.values(readCache('salaries', {})).flat();
  const salaryByName = new Map(allSalaries.map((s) => [s.normalizedName, s]));

  const allRatings = readCache('ratings2k', []);
  const currentRatingByName = new Map(
    allRatings.filter((r) => r.teamType === 'curr').map((r) => [r.normalizedName, r])
  );
  const peakRatingByName = getPeakRatingByName(allRatings);

  const birthYearByName = readCache('birth_years', {});
  const photoByName = readCache('player_photos', {});
  const awardsByName = readCache('player_awards', {});

  return { activeIds, salaryByName, currentRatingByName, peakRatingByName, birthYearByName, photoByName, awardsByName };
}

function enrichPlayer(p, maps) {
  const fullName = `${p.first_name} ${p.last_name}`;
  const isActive = maps.activeIds.has(p.id);
  const salaryMatch = maps.salaryByName.get(normalizeName(fullName));
  const currentRatingMatch = maps.currentRatingByName.get(normalize2kName(fullName));
  const peakRatingMatch = maps.peakRatingByName.get(normalize2kName(fullName));
  const birthYear = maps.birthYearByName[normalizeName(fullName)] || null;
  const photoUrl = maps.photoByName[normalizeName(fullName)] || null;
  const awards = maps.awardsByName[normalizeName(fullName)] || null;

  return {
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    position: p.position,
    height: p.height,
    weight: p.weight,
    college: p.college,
    country: p.country,
    draft_year: p.draft_year,
    draft_round: p.draft_round,
    draft_number: p.draft_number,
    currentTeam: p.team || null,
    isActive,
    salary: isActive && salaryMatch ? salaryMatch.salary : null,
    contract: isActive && salaryMatch ? salaryMatch.contract : null,
    rating2k: isActive && currentRatingMatch ? currentRatingMatch.overall : null,
    peakRating2k: peakRatingMatch ? peakRatingMatch.overall : null,
    birthYear,
    photoUrl,
    awards
  };
}

function getTeamOr404(req, res) {
  const teams = readCache('teams', []);
  const team = teams.find((t) => String(t.id) === String(req.params.id));
  if (!team) {
    res.status(404).json({ error: 'Equipo no encontrado' });
    return null;
  }
  return team;
}

app.get('/api/meta', (req, res) => {
  res.json(readCache('meta', { lastFullRefresh: null }));
});

app.get('/api/teams', (req, res) => {
  const teams = readCache('teams', []);
  const enriched = teams.map((t) => ({ ...t, ...getTeamInfo(t.abbreviation) }));
  // Los equipos solo cambian en el refresco diario: cachear un rato en el
  // navegador evita volver a pedir los 30 en cada pagina de equipo.
  res.set('Cache-Control', 'public, max-age=300');
  res.json(enriched);
});

// Un solo equipo, para no tener que traer los 30 solo para encontrar uno
// (lo usa team.html).
app.get('/api/teams/:id', (req, res) => {
  const team = getTeamOr404(req, res);
  if (!team) return;
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ ...team, ...getTeamInfo(team.abbreviation) });
});

app.get('/api/teams/:id/players', (req, res) => {
  const rosters = readCache('rosters', {});
  const players = rosters[req.params.id] || [];
  const team = getTeamOr404(req, res);
  if (!team) return;

  const salaries = readCache('salaries', {})[team.abbreviation] || [];
  const salaryByName = new Map(salaries.map((s) => [s.normalizedName, s]));

  const ratings2kCurrent = readCache('ratings2k', []).filter((r) => r.teamType === 'curr');
  const ratingByName = new Map(ratings2kCurrent.map((r) => [r.normalizedName, r]));

  const birthYearByName = readCache('birth_years', {});
  const photoByName = readCache('player_photos', {});

  const enriched = players.map((p) => {
    const fullName = `${p.first_name} ${p.last_name}`;
    const salaryMatch = salaryByName.get(normalizeName(fullName));
    const ratingMatch = ratingByName.get(normalize2kName(fullName));
    return {
      ...p,
      salary: salaryMatch ? salaryMatch.salary : null,
      contract: salaryMatch ? salaryMatch.contract : null,
      rating2k: ratingMatch ? ratingMatch.overall : null,
      birthYear: birthYearByName[normalizeName(fullName)] || null,
      photoUrl: photoByName[normalizeName(fullName)] || null
    };
  });

  res.json(enriched);
});

app.get('/api/teams/:id/salary-summary', (req, res) => {
  const team = getTeamOr404(req, res);
  if (!team) return;

  const salaries = readCache('salaries', {})[team.abbreviation] || [];
  const salariesMeta = readCache('salaries_meta', {});
  const totalPayroll = salaries.reduce((sum, s) => sum + (s.salary || 0), 0);

  res.json({
    season: salariesMeta.season || null,
    lastRefresh: salariesMeta.lastRefresh || null,
    totalPayroll,
    leagueCap: LEAGUE_SALARY_CAP_2025_26,
    capSpace: LEAGUE_SALARY_CAP_2025_26 - totalPayroll,
    hasData: salaries.length > 0
  });
});

app.get('/api/teams/:id/news', (req, res) => {
  const team = getTeamOr404(req, res);
  if (!team) return;

  const news = readCache('news', []);
  const nickname = team.name.toLowerCase();
  const filtered = news.filter((item) =>
    `${item.title} ${item.summary}`.toLowerCase().includes(nickname)
  );
  res.json(filtered);
});

app.get('/api/news', (req, res) => {
  const news = readCache('news', []);
  res.json(news);
});

app.get('/api/transactions', (req, res) => {
  const transactions = readCache('transactions', []);
  res.json(transactions);
});

app.get('/api/seasons', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ current: currentSeasonYear(), earliest: EARLIEST_SEASON });
});

// Medias por partido de la temporada en curso, de todos los jugadores de
// plantillas activas con al menos un partido jugado. Se refresca a diario
// (refreshSeasonLeaders); el cliente ordena/filtra por la columna que
// elija y se queda con el top 50, no hace falta paginar en el servidor.
app.get('/api/stats/leaders', (req, res) => {
  const leaders = readCache('season_leaders', []);
  const meta = readCache('season_leaders_meta', { season: currentSeasonYear(), lastRefresh: null });
  res.json({ season: meta.season, lastRefresh: meta.lastRefresh, leaders });
});

app.get('/api/draft/years', (req, res) => {
  const archive = readCache('draft_archive', []);
  const years = archive.map((p) => p.draft_year).filter(Boolean);
  if (!years.length) {
    return res.json({ min: currentSeasonYear(), max: currentSeasonYear() });
  }
  res.json({ min: Math.min(...years), max: Math.max(...years) });
});

app.get('/api/draft', (req, res) => {
  const year = parseInt(req.query.year, 10) || currentSeasonYear();
  const archive = readCache('draft_archive', []);
  const picks = archive
    .filter((p) => p.draft_year === year)
    .sort((a, b) => (a.draft_round - b.draft_round) || (a.draft_number - b.draft_number));

  const maps = buildPlayerEnrichmentMaps();
  const rounds = new Map();
  for (const p of picks) {
    if (!rounds.has(p.draft_round)) rounds.set(p.draft_round, []);
    rounds.get(p.draft_round).push({ ...enrichPlayer(p, maps), pick: p.draft_number });
  }

  res.json({
    year,
    rounds: [...rounds.entries()].map(([round, players]) => ({ round, players }))
  });
});

// Combina el archivo de draft (historico completo) con las plantillas
// activas (por si alguien no fue drafteado y por eso no aparece en el
// archivo de draft), sin duplicar por id.
function getAllKnownPlayers() {
  const archive = readCache('draft_archive', []);
  const rosters = readCache('rosters', {});
  const activeExtras = Object.values(rosters).flat();

  const byId = new Map();
  for (const p of [...archive, ...activeExtras]) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return [...byId.values()];
}

// Busca cualquier jugador (activo o retirado) por nombre para poder ir
// directo a su ficha desde el buscador de la cabecera.
app.get('/api/players/search', (req, res) => {
  const q = normalizeName(req.query.q || '');
  if (q.length < 2) return res.json([]);

  const maps = buildPlayerEnrichmentMaps();
  const matches = getAllKnownPlayers()
    .filter((p) => normalizeName(`${p.first_name} ${p.last_name}`).includes(q))
    .slice(0, 8)
    .map((p) => enrichPlayer(p, maps));

  res.json(matches);
});

// Ficha completa de un jugador por id, para su pagina individual
// (/jugador/<slug>-<id>). Mismo enriquecimiento que busqueda/draft.
app.get('/api/players/:id', (req, res) => {
  const player = getAllKnownPlayers().find((p) => String(p.id) === req.params.id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

  const maps = buildPlayerEnrichmentMaps();
  res.json(enrichPlayer(player, maps));
});

app.get('/api/standings', async (req, res) => {
  const season = parseInt(req.query.season, 10) || currentSeasonYear();
  if (season < EARLIEST_SEASON || season > currentSeasonYear()) {
    return res.status(400).json({ error: 'Temporada fuera de rango' });
  }

  try {
    const games = await getOrFetchSeasonGames(season);
    const teams = readCache('teams', []);
    const standings = computeStandings(games, teams);
    res.json({ season, ...standings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playoffs', async (req, res) => {
  const season = parseInt(req.query.season, 10) || currentSeasonYear();
  if (season < EARLIEST_SEASON || season > currentSeasonYear()) {
    return res.status(400).json({ error: 'Temporada fuera de rango' });
  }

  try {
    const games = await getOrFetchSeasonGames(season);
    const rounds = computePlayoffBracket(games);
    res.json({ season, rounds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games', async (req, res) => {
  const season = parseInt(req.query.season, 10) || currentSeasonYear();
  if (season < EARLIEST_SEASON || season > currentSeasonYear()) {
    return res.status(400).json({ error: 'Temporada fuera de rango' });
  }

  try {
    const games = await getOrFetchSeasonGames(season);
    const sorted = [...games].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    res.json({ season, games: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// balldontlie fecha los partidos con el dia en horario de EE.UU. (Eastern),
// no con el dia de calendario del servidor/visitante: un partido de las 22h
// hora de Los Angeles cae ya en "hoy" para balldontlie aunque en España sea
// de madrugada del dia siguiente. Calculamos "hoy" en esa misma zona para
// pedir la fecha correcta.
function nbaTodayISO() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

// Marcador en directo: a diferencia de /api/games (que lee del cache de
// temporada, refrescado una vez al dia), esto pide la fecha de hoy
// directamente a balldontlie para tener el marcador real de partidos en
// curso. Cache en memoria de 20s para no golpear el limite de peticiones
// por minuto del plan gratuito si varios visitantes cargan la home a la vez.
let liveGamesCache = { date: null, games: null, fetchedAt: 0 };
const LIVE_GAMES_CACHE_TTL_MS = 20000;

app.get('/api/games/live', async (req, res) => {
  try {
    const date = nbaTodayISO();
    const now = Date.now();
    if (liveGamesCache.date === date && now - liveGamesCache.fetchedAt < LIVE_GAMES_CACHE_TTL_MS) {
      return res.json({ date, games: liveGamesCache.games });
    }

    const games = await getGamesForDate(date);
    const sorted = [...games].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    liveGamesCache = { date, games: sorted, fetchedAt: now };
    res.json({ date, games: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Partidos de una semana ISO concreta (por defecto la semana actual), para
// la quiniela. Devuelve tambien todas las semanas con partidos en esta
// temporada, para poder navegar entre ellas desde el cliente.
app.get('/api/quiniela/week', async (req, res) => {
  const season = parseInt(req.query.season, 10) || currentSeasonYear();
  if (season < EARLIEST_SEASON || season > currentSeasonYear()) {
    return res.status(400).json({ error: 'Temporada fuera de rango' });
  }

  try {
    const games = await getOrFetchSeasonGames(season);
    const weeks = groupGamesByWeek(games);
    const availableWeeks = [...weeks.keys()].sort();
    const week = req.query.week && weeks.has(req.query.week) ? req.query.week : isoWeekKey(new Date().toISOString().slice(0, 10));

    res.json({ season, week, games: weeks.get(week) || [], availableWeeks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guarda (o sobrescribe) las picks de un jugador para una semana. clientId
// es un id aleatorio generado por el propio navegador (ver quiniela.js del
// cliente): no hay contraseña, es solo para poder acumular su marcador.
app.post('/api/quiniela/picks', async (req, res) => {
  const { clientId, nickname, season: rawSeason, week, picks } = req.body || {};

  if (typeof clientId !== 'string' || !clientId.trim() || clientId.length > 64) {
    return res.status(400).json({ error: 'clientId inválido' });
  }
  if (typeof week !== 'string' || !/^\d{4}-W\d{2}$/.test(week)) {
    return res.status(400).json({ error: 'Semana inválida' });
  }
  if (!picks || typeof picks !== 'object' || Array.isArray(picks)) {
    return res.status(400).json({ error: 'picks inválido' });
  }

  const season = parseInt(rawSeason, 10) || currentSeasonYear();
  if (season < EARLIEST_SEASON || season > currentSeasonYear()) {
    return res.status(400).json({ error: 'Temporada fuera de rango' });
  }

  try {
    const games = await getOrFetchSeasonGames(season);
    const weekGames = groupGamesByWeek(games).get(week) || [];
    const gamesById = new Map(weekGames.map((g) => [String(g.id), g]));

    // Solo se aceptan picks hacia un partido real de esa semana y hacia uno
    // de los dos equipos que juegan ese partido: evita guardar basura (o
    // manipulacion) desde el cliente.
    const cleanPicks = {};
    for (const [gameId, teamId] of Object.entries(picks)) {
      const game = gamesById.get(String(gameId));
      if (!game) continue;
      const validTeamIds = [game.home_team.id, game.visitor_team.id].map(String);
      if (!validTeamIds.includes(String(teamId))) continue;
      cleanPicks[gameId] = teamId;
    }

    const allPicks = readCache('quiniela_picks', {});
    if (!allPicks[season]) allPicks[season] = {};
    if (!allPicks[season][week]) allPicks[season][week] = {};
    allPicks[season][week][clientId] = {
      nickname: typeof nickname === 'string' ? nickname.trim().slice(0, 24) : null,
      picks: cleanPicks,
      updatedAt: new Date().toISOString()
    };
    writeCache('quiniela_picks', allPicks);

    res.json({ ok: true, savedPicks: Object.keys(cleanPicks).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcador de una semana concreta y marcador acumulado de toda la
// temporada, calculados a partir de los mismos partidos ya terminados.
app.get('/api/quiniela/leaderboard', async (req, res) => {
  const season = parseInt(req.query.season, 10) || currentSeasonYear();
  if (season < EARLIEST_SEASON || season > currentSeasonYear()) {
    return res.status(400).json({ error: 'Temporada fuera de rango' });
  }

  try {
    const games = await getOrFetchSeasonGames(season);
    const resultsByGame = buildResultsByGame(games);
    const picksByWeek = readCache('quiniela_picks', {})[season] || {};
    const week = req.query.week && /^\d{4}-W\d{2}$/.test(req.query.week) ? req.query.week : null;

    res.json({
      season,
      week,
      weekLeaderboard: week ? scoreWeeks(picksByWeek, [week], resultsByGame) : [],
      seasonLeaderboard: scoreWeeks(picksByWeek, Object.keys(picksByWeek), resultsByGame)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Las estadisticas de cada jugador se piden bajo demanda (al hacer click) y se
// cachean en disco para no golpear el limite de peticiones de la API gratuita.
app.get('/api/players/:id/stats', async (req, res) => {
  const playerId = req.params.id;
  const cacheKey = `player_stats_${playerId}`;
  const cached = readCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const stats = await getPlayerStatsHistory(playerId);
    if (stats && stats.error === 'PAID_TIER_REQUIRED') {
      return res.status(402).json({
        error:
          'El endpoint de estadisticas de balldontlie.io requiere el plan de pago ALL-STAR o superior.'
      });
    }
    writeCache(cacheKey, stats);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Estadisticas de TODA la carrera (para jugadores retirados/inactivos, ej.
// desde la pagina de Draft). fromYear deberia ser el draft_year del jugador.
app.get('/api/players/:id/career-stats', async (req, res) => {
  const playerId = req.params.id;
  const fromYear = parseInt(req.query.fromYear, 10) || undefined;
  const cacheKey = `career_stats_${playerId}`;
  const cached = readCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const stats = await getPlayerCareerStatsHistory(playerId, fromYear);
    if (stats && stats.error === 'PAID_TIER_REQUIRED') {
      return res.status(402).json({
        error:
          'El endpoint de estadisticas de balldontlie.io requiere el plan de pago ALL-STAR o superior.'
      });
    }
    writeCache(cacheKey, stats);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Servidor NBA en http://localhost:${PORT}`);
  startScheduler();

  const hasTeams = readCache('teams');
  if (!hasTeams) {
    console.log('[startup] no hay cache previa, lanzando primer refresco...');
    try {
      await refreshAll();
    } catch (err) {
      console.error(
        '[startup] no se pudo hacer el refresco inicial. Revisa tu BALLDONTLIE_API_KEY en .env'
      );
      console.error(err.message);
    }
  }

  // Salarios, valoraciones 2K y el archivo de draft normalmente solo se
  // refrescan en el cron semanal (cambian poco), pero si el hosting no tiene
  // disco persistente, cada redeploy borra la cache y tocaria esperar hasta
  // el domingo para volver a verlos. Los rellenamos tambien en el primer
  // arranque si faltan, igual que equipos y noticias.
  if (!readCache('salaries')) {
    console.log('[startup] no hay cache de salarios, lanzando refresco...');
    refreshSalaries().catch((err) => console.error('[startup] fallo refresco de salarios:', err.message));
  }
  if (!readCache('ratings2k')) {
    console.log('[startup] no hay cache de valoraciones 2K, lanzando refresco...');
    refreshRatings2k().catch((err) => console.error('[startup] fallo refresco de valoraciones 2K:', err.message));
  }
  if (!readCache('draft_archive')) {
    console.log('[startup] no hay cache de draft, lanzando refresco...');
    refreshDraftArchive().catch((err) => console.error('[startup] fallo refresco de draft:', err.message));
  }
  if (!readCache('birth_years') || !readCache('player_photos')) {
    console.log('[startup] no hay cache de años de nacimiento/fotos, lanzando refresco...');
    refreshBirthYears().catch((err) => console.error('[startup] fallo refresco de años de nacimiento/fotos:', err.message));
  }
  if (!readCache('season_leaders')) {
    console.log('[startup] no hay cache de lideres de temporada, lanzando refresco...');
    refreshSeasonLeaders().catch((err) => console.error('[startup] fallo refresco de lideres de temporada:', err.message));
  }
});
