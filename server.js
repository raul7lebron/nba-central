require('dotenv').config();
const express = require('express');
const path = require('path');

const { readCache, writeCache } = require('./src/cache');
const {
  getPlayerStatsHistory,
  getPlayerCareerStatsHistory,
  getGamesForSeason,
  currentSeasonYear
} = require('./src/balldontlie');
const { refreshAll } = require('./src/refreshAll');
const { startScheduler } = require('./src/scheduler');
const { getTeamInfo } = require('./src/teamInfo');
const { normalizeName, LEAGUE_SALARY_CAP_2025_26 } = require('./src/salaries');
const { normalizeName: normalize2kName, getPeakRatingByName } = require('./src/ratings2k');
const { computeStandings } = require('./src/standings');
const { computePlayoffBracket } = require('./src/playoffs');

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

app.use(express.static(path.join(__dirname, 'public')));

// Sitemap dinamico: incluye las paginas fijas + una entrada por cada uno de
// los 30 equipos (paginas de contenido real y distinto, altas para SEO).
// IMPORTANTE: cambia SITE_URL por tu dominio real antes de publicar la web;
// un sitemap con localhost no sirve de nada a los buscadores.
const SITE_URL = process.env.SITE_URL || 'https://TU-DOMINIO.com';

app.get('/sitemap.xml', (req, res) => {
  const staticPages = [
    '/index.html', '/teams.html', '/standings.html', '/calendar.html',
    '/playoffs.html', '/draft.html', '/market.html', '/store.html'
  ];
  const teams = readCache('teams', []);
  const teamUrls = teams.map((t) => `/team.html?id=${t.id}`);
  const urls = [...staticPages, ...teamUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
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

  return { activeIds, salaryByName, currentRatingByName, peakRatingByName };
}

function enrichPlayer(p, maps) {
  const fullName = `${p.first_name} ${p.last_name}`;
  const isActive = maps.activeIds.has(p.id);
  const salaryMatch = maps.salaryByName.get(normalizeName(fullName));
  const currentRatingMatch = maps.currentRatingByName.get(normalize2kName(fullName));
  const peakRatingMatch = maps.peakRatingByName.get(normalize2kName(fullName));

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
    rating2k: isActive && currentRatingMatch ? currentRatingMatch.overall : null,
    peakRating2k: peakRatingMatch ? peakRatingMatch.overall : null
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
  res.json(enriched);
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

  const enriched = players.map((p) => {
    const fullName = `${p.first_name} ${p.last_name}`;
    const salaryMatch = salaryByName.get(normalizeName(fullName));
    const ratingMatch = ratingByName.get(normalize2kName(fullName));
    return {
      ...p,
      salary: salaryMatch ? salaryMatch.salary : null,
      rating2k: ratingMatch ? ratingMatch.overall : null
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
  res.json({ current: currentSeasonYear(), earliest: EARLIEST_SEASON });
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

// Busca cualquier jugador (activo o retirado) por nombre para poder ir
// directo a su ficha desde el buscador de la cabecera. Combina el archivo
// de draft (historico completo) con las plantillas activas (por si alguien
// no fue drafteado y por eso no aparece en el archivo de draft).
app.get('/api/players/search', (req, res) => {
  const q = normalizeName(req.query.q || '');
  if (q.length < 2) return res.json([]);

  const archive = readCache('draft_archive', []);
  const rosters = readCache('rosters', {});
  const activeExtras = Object.values(rosters).flat();

  const byId = new Map();
  for (const p of [...archive, ...activeExtras]) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }

  const maps = buildPlayerEnrichmentMaps();
  const matches = [...byId.values()]
    .filter((p) => normalizeName(`${p.first_name} ${p.last_name}`).includes(q))
    .slice(0, 8)
    .map((p) => enrichPlayer(p, maps));

  res.json(matches);
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
});
