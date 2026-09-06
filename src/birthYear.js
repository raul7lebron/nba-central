// Año de nacimiento de cada jugador. Ninguna API de baloncesto conectada lo
// da (ni balldontlie, ni HoopsHype, ni nba2kapi), pero Wikidata sí lo tiene
// como dato estructurado y es publico y gratuito (sin API key).
//
// Se busca la entidad por nombre y solo se acepta si su descripción menciona
// "basketball" (para no colar el año de nacimiento de otra persona con el
// mismo nombre); si no hay match seguro, sencillamente no se muestra el
// dato en vez de arriesgarse a que sea el de otra persona.
//
// IMPORTANTE: no se pudo probar el acceso real a wikidata.org desde el
// entorno donde se escribió esto (sin salida a internet a dominios
// externos). Si al desplegar el emparejamiento falla mucho o los años
// salen mal, revisa aquí antes de nada.

const { normalizeName } = require('./salaries');

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const USER_AGENT = 'NBACentral/1.0 (https://www.elrompearos.com)';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function wikidataFetch(params) {
  const url = `${WIKIDATA_API}?${new URLSearchParams({ ...params, format: 'json' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikidata ${params.action} -> HTTP ${res.status}`);
  return res.json();
}

async function findPlayerEntityId(fullName) {
  const data = await wikidataFetch({
    action: 'wbsearchentities',
    search: fullName,
    language: 'en',
    type: 'item',
    limit: '5'
  });
  const match = (data.search || []).find((r) =>
    (r.description || '').toLowerCase().includes('basketball')
  );
  return match ? match.id : null;
}

// P569 = "date of birth" en Wikidata. El valor viene como
// "+1998-03-03T00:00:00Z"; solo nos interesa el año.
async function getBirthYearFromEntity(entityId) {
  const data = await wikidataFetch({
    action: 'wbgetclaims',
    entity: entityId,
    property: 'P569'
  });
  const time = data.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  const match = typeof time === 'string' && time.match(/^[+-](\d{4,})-\d{2}-\d{2}/);
  return match ? parseInt(match[1], 10) : null;
}

async function getBirthYearForPlayer(fullName) {
  try {
    const entityId = await findPlayerEntityId(fullName);
    if (!entityId) return null;
    return await getBirthYearFromEntity(entityId);
  } catch (err) {
    return null;
  }
}

// Recorre una lista de jugadores {first_name, last_name} y devuelve un mapa
// nombre normalizado -> año de nacimiento. Pensado para el cron semanal
// (el año de nacimiento de alguien no cambia, no hace falta más frecuencia).
async function getBirthYearsForPlayers(players) {
  const result = {};
  for (const p of players) {
    const fullName = `${p.first_name} ${p.last_name}`;
    const year = await getBirthYearForPlayer(fullName);
    if (year) result[normalizeName(fullName)] = year;
    await sleep(500);
  }
  return result;
}

module.exports = { getBirthYearForPlayer, getBirthYearsForPlayers };
