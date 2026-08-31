// balldontlie no da "series" ni "ronda" de playoffs, solo partidos sueltos
// marcados postseason:true. Reconstruimos las series agrupando partidos por
// el par de equipos enfrentados, y deducimos la ronda por orden cronologico
// (en un bracket de 16 equipos las series de primera ronda empiezan todas
// antes que las de semifinales, y asi sucesivamente).

const ROUND_NAMES = ['Primera ronda', 'Semifinales de conferencia', 'Finales de conferencia', 'Finales NBA'];

function seriesKey(teamAId, teamBId) {
  return [teamAId, teamBId].sort((a, b) => a - b).join('-');
}

function buildSeries(games) {
  const bySeries = new Map();

  for (const game of games) {
    if (!game.postseason || game.status_state !== 'final') continue;
    const key = seriesKey(game.home_team.id, game.visitor_team.id);
    if (!bySeries.has(key)) bySeries.set(key, []);
    bySeries.get(key).push(game);
  }

  const series = [];
  for (const games of bySeries.values()) {
    games.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const first = games[0];
    const teamA = first.home_team;
    const teamB = first.visitor_team;

    let winsA = 0;
    let winsB = 0;
    for (const g of games) {
      const aIsHome = g.home_team.id === teamA.id;
      const aScore = aIsHome ? g.home_team_score : g.visitor_team_score;
      const bScore = aIsHome ? g.visitor_team_score : g.home_team_score;
      if (aScore > bScore) winsA++; else winsB++;
    }

    series.push({
      startDate: first.date,
      teamA,
      teamB,
      winsA,
      winsB,
      winner: winsA > winsB ? teamA : teamB,
      games: games.map((g) => ({
        date: g.date,
        homeTeam: g.home_team.abbreviation,
        awayTeam: g.visitor_team.abbreviation,
        homeScore: g.home_team_score,
        awayScore: g.visitor_team_score
      }))
    });
  }

  series.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return series;
}

// Un bracket completo de N series (16 equipos) tiene series = 2^k - 1.
// Si encaja ese patron, partimos cronologicamente en grupos de tamano
// decreciente (primera ronda = mitad de las series, y asi sucesivamente).
function groupIntoRounds(series) {
  const n = series.length;
  const isPowerOfTwoMinusOne = n > 0 && Number.isInteger(Math.log2(n + 1));

  if (!isPowerOfTwoMinusOne) {
    return n ? [{ name: 'Playoffs', series }] : [];
  }

  const roundCount = Math.log2(n + 1);
  const names = ROUND_NAMES.slice(ROUND_NAMES.length - roundCount);

  const rounds = [];
  let firstRoundSize = (n + 1) / 2;
  let idx = 0;
  let size = firstRoundSize;
  for (let i = 0; i < roundCount; i++) {
    rounds.push({ name: names[i], series: series.slice(idx, idx + size) });
    idx += size;
    size = size / 2;
  }
  return rounds;
}

function computePlayoffBracket(games) {
  const series = buildSeries(games);
  return groupIntoRounds(series);
}

module.exports = { computePlayoffBracket };
