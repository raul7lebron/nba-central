// Año de nacimiento y foto de cada jugador. Ninguna API de baloncesto
// conectada da ninguna de las dos cosas (ni balldontlie, ni HoopsHype, ni
// nba2kapi), pero Wikidata sí las tiene como datos estructurados y es
// público y gratuito (sin API key). Las fotos que enlaza son las que están
// subidas a Wikimedia Commons con licencia libre (CC, dominio público o
// cedidas por el autor) — de ahí que solo cubra a una parte de los
// jugadores: los que no tienen ficha en Wikidata, o cuya ficha no tiene
// foto, sencillamente se quedan sin ella en vez de usar una que no sea
// realmente libre.
//
// Se busca la entidad por nombre y solo se acepta si su descripción
// menciona "basketball" (para no colar el dato de otra persona con el
// mismo nombre); si no hay match seguro, no se muestra nada para ese
// jugador.
//
// IMPORTANTE: no se pudo probar el acceso real a wikidata.org ni a
// commons.wikimedia.org desde el entorno donde se escribió esto (sin
// salida a internet a dominios externos). Si al desplegar el
// emparejamiento falla mucho, las fotos no cargan o los años salen mal,
// revisa aquí antes de nada.

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

// P569 = "date of birth" ("+1998-03-03T00:00:00Z", solo nos interesa el año).
// P18 = "image": el nombre del archivo en Wikimedia Commons (ej.
// "Stephen Curry 2021.jpg"). Special:FilePath lo convierte en una URL de
// imagen directa sin tener que calcular el hash de la ruta nosotros.
// Se piden las dos con una sola llamada (props=claims trae todas las
// propiedades de la entidad) para no duplicar peticiones a Wikidata.
async function getFactsFromEntity(entityId) {
  const data = await wikidataFetch({
    action: 'wbgetentities',
    ids: entityId,
    props: 'claims'
  });
  const claims = data.entities?.[entityId]?.claims || {};

  const time = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  const yearMatch = typeof time === 'string' && time.match(/^[+-](\d{4,})-\d{2}-\d{2}/);
  const birthYear = yearMatch ? parseInt(yearMatch[1], 10) : null;

  const fileName = claims.P18?.[0]?.mainsnak?.datavalue?.value;
  const photoUrl = typeof fileName === 'string' && fileName
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=500`
    : null;

  return { birthYear, photoUrl };
}

async function getPlayerFacts(fullName) {
  try {
    const entityId = await findPlayerEntityId(fullName);
    if (!entityId) return { birthYear: null, photoUrl: null };
    return await getFactsFromEntity(entityId);
  } catch (err) {
    return { birthYear: null, photoUrl: null };
  }
}

// Recorre una lista de jugadores {first_name, last_name} y devuelve un mapa
// nombre normalizado -> {birthYear, photoUrl}. Pensado para el cron semanal
// (ninguno de los dos datos cambia entre semana y semana).
async function getPlayerFactsForPlayers(players) {
  const result = {};
  for (const p of players) {
    const fullName = `${p.first_name} ${p.last_name}`;
    const facts = await getPlayerFacts(fullName);
    if (facts.birthYear || facts.photoUrl) {
      result[normalizeName(fullName)] = facts;
    }
    await sleep(500);
  }
  return result;
}

module.exports = { getPlayerFacts, getPlayerFactsForPlayers };
