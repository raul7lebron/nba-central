// Salarios reales de contrato desde la página pública de HoopsHype (hoopshype.com).
// balldontlie solo ofrece esto en su plan de pago más caro (GOAT); HoopsHype publica
// los mismos datos de contratos en abierto, incrustados como JSON en cada página de equipo.
// No hace falta refrescar esto a diario: los contratos apenas cambian entre fichajes.

const TEAM_SLUGS = {
  ATL: 'atlanta_hawks', BOS: 'boston_celtics', BKN: 'brooklyn_nets', CHA: 'charlotte_hornets',
  CHI: 'chicago_bulls', CLE: 'cleveland_cavaliers', DAL: 'dallas_mavericks', DEN: 'denver_nuggets',
  DET: 'detroit_pistons', GSW: 'golden_state_warriors', HOU: 'houston_rockets', IND: 'indiana_pacers',
  LAC: 'los_angeles_clippers', LAL: 'los_angeles_lakers', MEM: 'memphis_grizzlies', MIA: 'miami_heat',
  MIL: 'milwaukee_bucks', MIN: 'minnesota_timberwolves', NOP: 'new_orleans_pelicans', NYK: 'new_york_knicks',
  OKC: 'oklahoma_city_thunder', ORL: 'orlando_magic', PHI: 'philadelphia_76ers', PHX: 'phoenix_suns',
  POR: 'portland_trail_blazers', SAC: 'sacramento_kings', SAS: 'san_antonio_spurs', TOR: 'toronto_raptors',
  UTA: 'utah_jazz', WAS: 'washington_wizards'
};

// Tope salarial NBA 2025-26 fijado por la liga (154.647M$). Fuente: pr.nba.com.
// Cifra fija de temporada: no hay endpoint que la sirva, hay que actualizarla cada
// verano cuando la NBA anuncia el nuevo tope (normalmente sube ~10%).
const LEAGUE_SALARY_CAP_2025_26 = 154_647_000;

function normalizeName(name) {
  return (name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv)\.?$/, '')
    .trim();
}

async function fetchTeamContractsHtml(slug) {
  const res = await fetch(`https://hoopshype.com/salaries/${slug}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NBACentral/1.0)' }
  });
  if (!res.ok) throw new Error(`HoopsHype ${slug} -> HTTP ${res.status}`);
  return res.text();
}

function extractContracts(html) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!match) throw new Error('No se encontró __NEXT_DATA__ en la página de HoopsHype');
  const data = JSON.parse(match[1]);
  const queries = data.props?.pageProps?.dehydratedState?.queries || [];

  for (const q of queries) {
    const d = q.state && q.state.data;
    const page = d && d.pages ? d.pages[0] : d;
    if (page && page.contracts && Array.isArray(page.contracts.contracts)) {
      return page.contracts.contracts;
    }
  }
  return [];
}

// HoopsHype marca algunas temporadas de un contrato como opcion de jugador,
// opcion de equipo o no garantizada. No hemos podido confirmar el nombre
// exacto del campo en su JSON (bloqueado el acceso a hoopshype.com desde
// el entorno donde se escribio esto), asi que se prueban los nombres mas
// plausibles; si ninguno aparece, sencillamente no se muestra ninguna
// etiqueta para esa temporada en vez de arriesgarse a inventar el dato.
function normalizeSeasonOption(seasonRaw) {
  const raw = seasonRaw.option ?? seasonRaw.contractOption ?? seasonRaw.type ?? seasonRaw.note ?? seasonRaw.label;
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw.toLowerCase();
  if (normalized.includes('player')) return 'player';
  if (normalized.includes('team')) return 'team';
  if (normalized.includes('guarant')) return 'non-guaranteed';
  return null;
}

let loggedRawSeasonKeysOnce = false;

// balldontlie numera la temporada por el año en que EMPIEZA (2025 = temporada
// 2025-26); HoopsHype numera por el año en que TERMINA (2026 = temporada
// 2025-26). Hay que restar 1 a cada temporada de HoopsHype para pasarla a
// numeracion balldontlie.
async function getTeamSalaries(abbreviation, season) {
  const slug = TEAM_SLUGS[abbreviation];
  if (!slug) return [];

  const html = await fetchTeamContractsHtml(slug);
  const contracts = extractContracts(html);

  // Ayuda a depurar el nombre real del campo de opcion de contrato: se
  // imprime una sola vez por proceso, con las claves crudas de la primera
  // temporada del primer contrato que se procese.
  if (!loggedRawSeasonKeysOnce && contracts[0]?.seasons?.[0]) {
    console.log('[salaries] campos disponibles por temporada (debug):', Object.keys(contracts[0].seasons[0]));
    loggedRawSeasonKeysOnce = true;
  }

  return contracts
    .map((c) => {
      const allSeasons = (c.seasons || [])
        .filter((s) => s.salary != null)
        .map((s) => ({
          season: s.season - 1,
          salary: s.salary,
          option: normalizeSeasonOption(s)
        }))
        .sort((a, b) => a.season - b.season);

      const currentSeasonRow = allSeasons.find((s) => s.season === season) || allSeasons[0];
      if (!currentSeasonRow) return null;

      return {
        playerName: c.playerName,
        normalizedName: normalizeName(c.playerName),
        salary: currentSeasonRow.salary,
        season: currentSeasonRow.season,
        contract: allSeasons
      };
    })
    .filter(Boolean);
}

module.exports = {
  TEAM_SLUGS,
  LEAGUE_SALARY_CAP_2025_26,
  normalizeName,
  getTeamSalaries
};
