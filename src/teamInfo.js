// Datos históricos estáticos: balldontlie no los ofrece y no existe ninguna API
// gratuita conectada que los sirva en vivo. Año de fundación (inmutable) y
// campeonatos NBA ganados a fecha de la temporada 2024-25. Si un equipo gana un
// título nuevo, hay que sumarlo aquí a mano.
const TEAM_INFO = {
  ATL: { founded: 1946, titles: 1 },
  BOS: { founded: 1946, titles: 18 },
  BKN: { founded: 1967, titles: 0 },
  CHA: { founded: 2004, titles: 0 },
  CHI: { founded: 1966, titles: 6 },
  CLE: { founded: 1970, titles: 1 },
  DAL: { founded: 1980, titles: 1 },
  DEN: { founded: 1967, titles: 1 },
  DET: { founded: 1941, titles: 3 },
  GSW: { founded: 1946, titles: 7 },
  HOU: { founded: 1967, titles: 2 },
  IND: { founded: 1967, titles: 0 },
  LAC: { founded: 1970, titles: 0 },
  LAL: { founded: 1947, titles: 17 },
  MEM: { founded: 1995, titles: 0 },
  MIA: { founded: 1988, titles: 3 },
  MIL: { founded: 1968, titles: 2 },
  MIN: { founded: 1989, titles: 0 },
  NOP: { founded: 1988, titles: 0 },
  NYK: { founded: 1946, titles: 2 },
  OKC: { founded: 1967, titles: 2 },
  ORL: { founded: 1989, titles: 0 },
  PHI: { founded: 1946, titles: 3 },
  PHX: { founded: 1968, titles: 0 },
  POR: { founded: 1970, titles: 1 },
  SAC: { founded: 1923, titles: 1 },
  SAS: { founded: 1967, titles: 5 },
  TOR: { founded: 1995, titles: 1 },
  UTA: { founded: 1974, titles: 0 },
  WAS: { founded: 1961, titles: 1 }
};

function getTeamInfo(abbreviation) {
  return TEAM_INFO[abbreviation] || null;
}

module.exports = { TEAM_INFO, getTeamInfo };
