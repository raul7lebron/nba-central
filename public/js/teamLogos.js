// Logos oficiales servidos desde el CDN público de ESPN (a.espncdn.com).
// Mapa de abreviatura balldontlie -> slug de ESPN (verificado, no siempre coincide).
const TEAM_LOGO_SLUGS = {
  ATL: 'atl', BOS: 'bos', BKN: 'bkn', CHA: 'cha', CHI: 'chi', CLE: 'cle',
  DAL: 'dal', DEN: 'den', DET: 'det', GSW: 'gs', HOU: 'hou', IND: 'ind',
  LAC: 'lac', LAL: 'lal', MEM: 'mem', MIA: 'mia',
  NOP: 'no', NYK: 'ny', OKC: 'okc', ORL: 'orl', PHI: 'phi', PHX: 'phx',
  POR: 'por', SAC: 'sac', SAS: 'sa', TOR: 'tor', UTA: 'utah', WAS: 'wsh'
};

// Los 30 equipos tienen logo personalizado servido localmente en vez del
// oficial de ESPN.
const TEAM_LOGO_OVERRIDES = {
  MIN: '/img/logo-min.webp',
  MIL: '/img/logo-mil.webp',
  ORL: '/img/logo-orl.webp',
  MEM: '/img/logo-mem.webp',
  NOP: '/img/logo-nop.webp',
  POR: '/img/logo-por.webp',
  LAL: '/img/logo-lal.webp',
  HOU: '/img/logo-hou.webp',
  DAL: '/img/logo-dal.webp',
  PHX: '/img/logo-phx.webp',
  LAC: '/img/logo-lac.webp',
  SAC: '/img/logo-sac.webp',
  GSW: '/img/logo-gsw.webp',
  DEN: '/img/logo-den.webp',
  IND: '/img/logo-ind.webp',
  WAS: '/img/logo-was.webp',
  BKN: '/img/logo-bkn.webp',
  CHI: '/img/logo-chi.webp',
  UTA: '/img/logo-uta.webp',
  DET: '/img/logo-det.webp',
  OKC: '/img/logo-okc.webp',
  ATL: '/img/logo-atl.webp',
  CHA: '/img/logo-cha.webp',
  BOS: '/img/logo-bos.webp',
  TOR: '/img/logo-tor.webp',
  PHI: '/img/logo-phi.webp',
  NYK: '/img/logo-nyk.webp',
  SAS: '/img/logo-sas.webp',
  CLE: '/img/logo-cle.webp',
  MIA: '/img/logo-mia.webp'
};

function teamLogoUrl(abbreviation) {
  if (TEAM_LOGO_OVERRIDES[abbreviation]) return TEAM_LOGO_OVERRIDES[abbreviation];
  const slug = TEAM_LOGO_SLUGS[abbreviation];
  return slug ? `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png` : null;
}

// Si el logo no carga, se sustituye por la insignia de color con las iniciales.
// width/height explicitos evitan saltos de layout (CLS). Por defecto
// "loading=lazy" difiere los logos fuera de pantalla (listas, tablas...);
// eager=true lo salta para el logo grande de la cabecera de equipo, que
// esta siempre visible nada mas cargar la pagina y no se beneficia de
// diferirlo (al reves: cargarlo lo antes posible ayuda al LCP).
function logoImgOrBadge(abbreviation, size, eager) {
  const url = teamLogoUrl(abbreviation);
  if (!url) return badgeHTML(abbreviation, size);
  const loadingAttr = eager ? '' : ' loading="lazy"';
  const priorityAttr = eager ? ' fetchpriority="high"' : '';
  return `<img src="${url}" alt="Logo ${abbreviation}" class="team-logo-img" width="${size}" height="${size}"${loadingAttr} decoding="async"${priorityAttr} style="width:${size}px;height:${size}px"
            onerror="this.outerHTML=badgeHTML('${abbreviation}', ${size})">`;
}

function badgeHTML(abbreviation, size) {
  return `<div class="team-badge" style="background:${teamColor(abbreviation)};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.32)}px">${displayAbbr(abbreviation)}</div>`;
}

// Algunos equipos muestran una sigla distinta a la real de balldontlie/ESPN
// (esa real sigue haciendo falta tal cual para buscar logo, color e
// insignia). Los Jazz de Utah se muestran como "UJ" en vez de "UTA".
const DISPLAY_ABBR_OVERRIDES = { UTA: 'UTJ' };

function displayAbbr(abbreviation) {
  return DISPLAY_ABBR_OVERRIDES[abbreviation] || abbreviation;
}
