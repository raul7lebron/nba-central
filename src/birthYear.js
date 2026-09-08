// Año de nacimiento, foto y premios individuales de cada jugador. Ninguna
// API de baloncesto conectada da nada de esto (ni balldontlie, ni
// HoopsHype, ni nba2kapi), pero Wikidata sí lo tiene como datos
// estructurados y es público y gratuito (sin API key). Las fotos que
// enlaza son las que están subidas a Wikimedia Commons con licencia libre
// (CC, dominio público o cedidas por el autor) — de ahí que solo cubra a
// una parte de los jugadores: los que no tienen ficha en Wikidata, o cuya
// ficha no tiene foto, sencillamente se quedan sin ella en vez de usar una
// que no sea realmente libre.
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
//
// Premios (MVP, All-Star, quinteto defensivo, rookie del año): se cuentan
// las declaraciones "award received" (P166) — y, para el All-Star, también
// "participant of" (P1344), por si Wikidata lo modela como participación
// en el partido en vez de como premio — cuyo valor coincide con el
// identificador del premio en Wikidata. Estos identificadores (Q222047,
// Q644357, Q1465181, Q137341) se localizaron por búsqueda, pero **no se
// pudo verificar contra la ficha real de ningún jugador** desde este
// entorno (mismo bloqueo de red que arriba): si tras desplegar los premios
// salen siempre a 0 o claramente mal, es la primera pista a revisar aquí.
const AWARD_QIDS = {
  mvp: 'Q222047', // NBA Most Valuable Player Award
  rookieOfYear: 'Q644357', // NBA Rookie of the Year Award
  allDefensive: 'Q1465181', // NBA All-Defensive Team (no distingue 1º/2º quinteto)
  allStar: 'Q137341' // NBA All-Star Game
};

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

function countAwardClaims(claims, qid) {
  const inAwardsReceived = (claims.P166 || []).filter(
    (c) => c.mainsnak?.datavalue?.value?.id === qid
  ).length;
  const inParticipantOf = (claims.P1344 || []).filter(
    (c) => c.mainsnak?.datavalue?.value?.id === qid
  ).length;
  return inAwardsReceived + inParticipantOf;
}

function hasAnyAward(awards) {
  return Object.values(awards).some((n) => n > 0);
}

// P569 = "date of birth" ("+1998-03-03T00:00:00Z", solo nos interesa el año).
// P18 = "image": el nombre del archivo en Wikimedia Commons (ej.
// "Stephen Curry 2021.jpg"). Special:FilePath lo convierte en una URL de
// imagen directa sin tener que calcular el hash de la ruta nosotros.
// Se piden las dos con una sola llamada (props=claims trae todas las
// propiedades de la entidad, incluidos los premios) para no duplicar
// peticiones a Wikidata.
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

  // width=250: nunca se muestra a más de 120px en el sitio (ficha de
  // jugador), así que 250 ya deja margen de sobra para pantallas retina sin
  // pedirle a Wikimedia una imagen 4 veces más grande de la que hace falta.
  const fileName = claims.P18?.[0]?.mainsnak?.datavalue?.value;
  const photoUrl = typeof fileName === 'string' && fileName
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=250`
    : null;

  const awards = {
    mvp: countAwardClaims(claims, AWARD_QIDS.mvp),
    allStar: countAwardClaims(claims, AWARD_QIDS.allStar),
    allDefensive: countAwardClaims(claims, AWARD_QIDS.allDefensive),
    rookieOfYear: countAwardClaims(claims, AWARD_QIDS.rookieOfYear)
  };

  return { birthYear, photoUrl, awards };
}

const EMPTY_AWARDS = { mvp: 0, allStar: 0, allDefensive: 0, rookieOfYear: 0 };

async function getPlayerFacts(fullName) {
  try {
    const entityId = await findPlayerEntityId(fullName);
    if (!entityId) return { birthYear: null, photoUrl: null, awards: EMPTY_AWARDS };
    return await getFactsFromEntity(entityId);
  } catch (err) {
    return { birthYear: null, photoUrl: null, awards: EMPTY_AWARDS };
  }
}

// Recorre una lista de jugadores {first_name, last_name} y devuelve un mapa
// nombre normalizado -> {birthYear, photoUrl, awards}. Pensado para el cron
// semanal (ninguno de estos datos cambia entre semana y semana, salvo que
// un jugador gane un premio nuevo esa temporada).
async function getPlayerFactsForPlayers(players) {
  const result = {};
  for (const p of players) {
    const fullName = `${p.first_name} ${p.last_name}`;
    const facts = await getPlayerFacts(fullName);
    if (facts.birthYear || facts.photoUrl || hasAnyAward(facts.awards)) {
      result[normalizeName(fullName)] = facts;
    }
    await sleep(500);
  }
  return result;
}

module.exports = { getPlayerFacts, getPlayerFactsForPlayers };
