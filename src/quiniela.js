// Quiniela semanal: acertar el ganador de cada partido de la semana. Sin
// sistema de cuentas en el sitio todavia, la "identidad" de cada jugador es
// un id aleatorio que el propio navegador genera y guarda (ver quiniela.js
// del cliente) mas un apodo que el usuario elige para el marcador. No hay
// contraseña: quien pierda su navegador/localStorage pierde su progreso.

// Semana ISO 8601 (lunes a domingo), igual que usa el propio calendario NBA
// en la practica. Devuelve algo como "2026-W04".
function isoWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayNum = (d.getUTCDay() + 6) % 7; // lunes = 0 ... domingo = 6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // jueves de esa semana (define el año ISO)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * 86400000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ganador de cada partido YA TERMINADO de la temporada, indexado por id de
// partido. Los partidos sin terminar no aparecen: no tiene ganador todavia.
function buildResultsByGame(games) {
  const results = {};
  for (const g of games) {
    if (g.status_state !== 'final') continue;
    results[g.id] = g.home_team_score > g.visitor_team_score ? g.home_team.id : g.visitor_team.id;
  }
  return results;
}

// Agrupa los partidos de una temporada por semana ISO, cada grupo ordenado
// cronologicamente.
function groupGamesByWeek(games) {
  const weeks = new Map();
  for (const g of games) {
    const wk = isoWeekKey(g.date);
    if (!weeks.has(wk)) weeks.set(wk, []);
    weeks.get(wk).push(g);
  }
  for (const list of weeks.values()) {
    list.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }
  return weeks;
}

// Marcador de una o varias semanas: acumula aciertos de cada jugador
// (clientId) sobre los partidos ya decididos. picksByWeek es el objeto tal
// cual se guarda en cache (semana -> clientId -> {nickname, picks}).
function scoreWeeks(picksByWeek, weekKeys, resultsByGame) {
  const byClient = new Map();
  for (const wk of weekKeys) {
    const entries = picksByWeek[wk] || {};
    for (const [clientId, entry] of Object.entries(entries)) {
      if (!byClient.has(clientId)) byClient.set(clientId, { clientId, nickname: entry.nickname, correct: 0, decided: 0 });
      const stats = byClient.get(clientId);
      if (entry.nickname) stats.nickname = entry.nickname;
      for (const [gameId, teamId] of Object.entries(entry.picks || {})) {
        if (!(gameId in resultsByGame)) continue; // partido sin terminar todavia
        stats.decided++;
        if (String(resultsByGame[gameId]) === String(teamId)) stats.correct++;
      }
    }
  }
  return [...byClient.values()]
    .filter((s) => s.decided > 0)
    .sort((a, b) => b.correct - a.correct || (b.correct / b.decided) - (a.correct / a.decided));
}

module.exports = { isoWeekKey, buildResultsByGame, groupGamesByWeek, scoreWeeks };
