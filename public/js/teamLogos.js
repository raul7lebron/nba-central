// Logos oficiales servidos desde el CDN público de ESPN (a.espncdn.com).
// Mapa de abreviatura balldontlie -> slug de ESPN (verificado, no siempre coincide).
const TEAM_LOGO_SLUGS = {
  ATL: 'atl', BOS: 'bos', BKN: 'bkn', CHA: 'cha', CHI: 'chi', CLE: 'cle',
  DAL: 'dal', DEN: 'den', DET: 'det', GSW: 'gs', HOU: 'hou', IND: 'ind',
  LAC: 'lac', LAL: 'lal', MEM: 'mem', MIA: 'mia',
  NOP: 'no', NYK: 'ny', OKC: 'okc', ORL: 'orl', PHI: 'phi', PHX: 'phx',
  POR: 'por', SAC: 'sac', SAS: 'sa', TOR: 'tor', UTA: 'utah', WAS: 'wsh'
};

// Timberwolves y Bucks: logos personalizados servidos localmente en vez
// del oficial de ESPN.
const TEAM_LOGO_OVERRIDES = {
  MIN: '/img/logo-min.webp',
  MIL: '/img/logo-mil.jpg'
};

function teamLogoUrl(abbreviation) {
  if (TEAM_LOGO_OVERRIDES[abbreviation]) return TEAM_LOGO_OVERRIDES[abbreviation];
  const slug = TEAM_LOGO_SLUGS[abbreviation];
  return slug ? `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png` : null;
}

// Si el logo no carga, se sustituye por la insignia de color con las iniciales.
// width/height explicitos + loading lazy: evitan saltos de layout (CLS) y
// difieren la carga de logos fuera de pantalla, algo que Google mide como
// señal de rendimiento (Core Web Vitals).
function logoImgOrBadge(abbreviation, size) {
  const url = teamLogoUrl(abbreviation);
  if (!url) return badgeHTML(abbreviation, size);
  return `<img src="${url}" alt="Logo ${abbreviation}" class="team-logo-img" width="${size}" height="${size}" loading="lazy" decoding="async" style="width:${size}px;height:${size}px"
            onerror="this.outerHTML=badgeHTML('${abbreviation}', ${size})">`;
}

function badgeHTML(abbreviation, size) {
  return `<div class="team-badge" style="background:${teamColor(abbreviation)};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.32)}px">${abbreviation}</div>`;
}
