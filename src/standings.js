// balldontlie solo da /standings en su plan mas caro (GOAT). En su lugar
// calculamos la clasificacion nosotros mismos a partir de los partidos de
// temporada regular (plan ALL-STAR ya nos da /games).

// Las eliminatorias de la NBA Cup (cuartos, semifinal y final del torneo) no
// cuentan para el record de temporada regular, pero la API no las marca como
// "postseason". Solo la fase de grupos (ist_stage tipo "East/West Group *")
// si cuenta.
const NBA_CUP_KNOCKOUT_STAGES = new Set([
  'East Quarterfinal', 'West Quarterfinal',
  'East Semifinal', 'West Semifinal',
  'Championship'
]);

function computeStandings(games, teams) {
  const records = new Map();
  for (const team of teams) {
    records.set(team.id, {
      team,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      gamesPlayed: 0
    });
  }

  for (const game of games) {
    if (game.postseason) continue;
    if (NBA_CUP_KNOCKOUT_STAGES.has(game.ist_stage)) continue;
    if (game.status_state !== 'final') continue;

    const home = records.get(game.home_team.id);
    const away = records.get(game.visitor_team.id);
    if (!home || !away) continue;

    home.gamesPlayed++;
    away.gamesPlayed++;
    home.pointsFor += game.home_team_score;
    home.pointsAgainst += game.visitor_team_score;
    away.pointsFor += game.visitor_team_score;
    away.pointsAgainst += game.home_team_score;

    if (game.home_team_score > game.visitor_team_score) {
      home.wins++;
      away.losses++;
    } else {
      away.wins++;
      home.losses++;
    }
  }

  const byConference = { East: [], West: [] };
  for (const record of records.values()) {
    const conf = record.team.conference;
    if (!byConference[conf]) continue;
    const winPct = record.gamesPlayed ? record.wins / record.gamesPlayed : 0;
    byConference[conf].push({
      team: record.team,
      wins: record.wins,
      losses: record.losses,
      gamesPlayed: record.gamesPlayed,
      winPct,
      avgDiff: record.gamesPlayed
        ? (record.pointsFor - record.pointsAgainst) / record.gamesPlayed
        : 0
    });
  }

  for (const conf of Object.keys(byConference)) {
    byConference[conf].sort((a, b) => b.winPct - a.winPct || b.wins - a.wins);
    const leader = byConference[conf][0];
    byConference[conf].forEach((row, i) => {
      row.rank = i + 1;
      row.gamesBehind = leader
        ? (leader.wins - row.wins + (row.losses - leader.losses)) / 2
        : 0;
    });
  }

  return byConference;
}

module.exports = { computeStandings };
