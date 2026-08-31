// Valoraciones NBA 2K via nba2kapi.com (API gratuita dedicada a esto).
// Necesita una API key gratuita: https://www.nba2kapi.com -> "Get an API key"
const BASE_URL = 'https://api.nba2kapi.com';

function getApiKey() {
  return process.env.NBA2KAPI_KEY || '';
}

function normalizeName(name) {
  return (name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv)\.?$/, '')
    .trim();
}

// Un solo endpoint trae TODA la liga de golpe: mucho mas barato que pedir
// jugador a jugador (563 jugadores => 563 peticiones evitadas).
async function getAllPlayerRatings() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Falta NBA2KAPI_KEY. Copia .env.example a .env y añade tu clave gratuita de https://www.nba2kapi.com'
    );
  }

  const res = await fetch(`${BASE_URL}/api/players/bulk`, {
    headers: { 'X-API-Key': apiKey }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`nba2kapi /players/bulk -> HTTP ${res.status}: ${body}`);
  }
  const json = await res.json();
  const players = json.data || [];

  // El dataset incluye tambien cartas clasicas/de coleccion (teamType
  // "class"/"allt", ej. "1992-93 Chicago Bulls"), ademas de la carta de la
  // plantilla vigente (teamType "curr"). Se guardan todas: la plantilla
  // vigente sirve para jugadores activos, y el resto para calcular la mejor
  // valoracion historica de jugadores retirados.
  return players.map((p) => ({
    name: p.name,
    normalizedName: normalizeName(p.name),
    overall: p.overall,
    tier: p.tier,
    teamType: p.teamType
  }));
}

// De todas las cartas de un jugador (actual + clasicas), la valoracion mas
// alta que haya tenido nunca en el juego.
function getPeakRatingByName(allRatings) {
  const peakByName = new Map();
  for (const r of allRatings) {
    const current = peakByName.get(r.normalizedName);
    if (!current || r.overall > current.overall) {
      peakByName.set(r.normalizedName, r);
    }
  }
  return peakByName;
}

module.exports = { getAllPlayerRatings, getPeakRatingByName, normalizeName };
