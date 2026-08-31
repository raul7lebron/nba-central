// Colores primarios aproximados por abreviatura de equipo, solo para las insignias de la interfaz.
const TEAM_COLORS = {
  ATL: '#e03a3e', BOS: '#007a33', BKN: '#000000', CHA: '#1d1160', CHI: '#ce1141',
  CLE: '#860038', DAL: '#00538c', DEN: '#0e2240', DET: '#c8102e', GSW: '#1d428a',
  HOU: '#ce1141', IND: '#002d62', LAC: '#c8102e', LAL: '#552583', MEM: '#5d76a9',
  MIA: '#98002e', MIL: '#00471b', MIN: '#0c2340', NOP: '#0c2340', NYK: '#006bb6',
  OKC: '#007ac1', ORL: '#0077c0', PHI: '#006bb6', PHX: '#1d1160', POR: '#e03a3e',
  SAC: '#5a2d81', SAS: '#c4ced4', TOR: '#ce1141', UTA: '#002b5c', WAS: '#002b5c'
};

function teamColor(abbreviation) {
  return TEAM_COLORS[abbreviation] || '#444c56';
}
