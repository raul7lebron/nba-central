// Selector de idioma (es/en/pt) para el CHROME del sitio: menu, pie,
// titulares de cada pagina, banner de cookies y buscador. El contenido en
// si (noticias, estadisticas, texto legal) sigue en español siempre: las
// noticias vienen de medios españoles y no hay traduccion automatica
// contratada, y el texto legal necesita su propia revision aparte. Donde
// eso pasa, se muestra un aviso con la clase .lang-notice.
//
// Sin cuentas ni backend de idioma: la eleccion se guarda en localStorage
// y tambien se refleja en la URL (?lang=en) para que un enlace compartido
// abra ya en ese idioma.

const LANG_STORAGE_KEY = 'elrompearos_lang';
const SUPPORTED_LANGS = ['es', 'en', 'pt'];
const LANG_NAMES = { es: 'Español', en: 'English', pt: 'Português' };

const TRANSLATIONS = {
  es: {
    nav_news: 'Noticias', nav_teams: 'Equipos', nav_standings: 'Clasificación',
    nav_stats: 'Estadísticas', nav_compare: 'Comparar', nav_trade: 'Simulador de traspasos',
    nav_quiniela: 'Quiniela', nav_calendar: 'Calendario', nav_playoffs: 'Playoffs',
    nav_draft: 'Draft', nav_market: 'Mercado', nav_store: 'Tienda',

    footer_legal: 'Aviso Legal', footer_privacy: 'Privacidad', footer_cookies: 'Cookies',

    cookie_banner_text: 'Usamos cookies propias y de terceros (publicidad) para mantener la web gratuita. Puedes aceptarlas o rechazarlas; si las rechazas, seguirás viendo la web con normalidad pero sin anuncios personalizados.',
    cookie_more_info: 'Más información', cookie_reject: 'Rechazar', cookie_accept: 'Aceptar',

    search_placeholder: 'Buscar jugador...', search_aria_label: 'Buscar jugador',
    search_searching: 'Buscando...', search_no_results: 'Sin resultados', search_error: 'No se pudo buscar',

    content_spanish_only: 'Este contenido solo está disponible en español.',

    home_h1: 'Últimas noticias NBA',
    home_subtitle: 'El Rompearos es tu web de baloncesto NBA en español: noticias, equipos, estadísticas NBA, clasificación, calendario, playoffs, draft y mercado de fichajes de los 30 equipos y sus jugadores.',
    teams_h1: 'Equipos NBA',
    teams_subtitle: 'Consulta la plantilla, estadísticas NBA y salarios de cualquier jugador de baloncesto de los 30 equipos de la NBA, además de su historia, fundación y títulos.',
    standings_h1: 'Clasificación NBA',
    stats_h1: 'Estadísticas NBA',
    stats_subtitle: 'Top 50 jugadores de baloncesto NBA de la temporada en curso, ordenados por valoración, puntos, rebotes, asistencias, robos, tapones o porcentajes de tiro.',
    compare_h1: 'Comparador de jugadores NBA',
    compare_subtitle: 'Compara las estadísticas de dos jugadores de baloncesto NBA, cada uno en la temporada que elijas por separado.',
    trade_h1: 'Simulador de traspasos',
    trade_subtitle: 'Elige entre 2 y 4 equipos, marca quién sale de cada plantilla y comprueba si el traspaso cuadra en salario.',
    quiniela_h1: 'Quiniela semanal',
    quiniela_subtitle: 'Elige el ganador de cada partido de la semana. Se guarda solo, sin necesidad de cuenta.',
    calendar_h1: 'Calendario NBA',
    playoffs_h1: 'Playoffs NBA',
    draft_h1: 'Draft NBA',
    market_h1: 'Mercado de fichajes',
    store_h1: 'Tienda NBA',
    legal_h1: 'Aviso Legal',
    privacy_h1: 'Política de Privacidad',
    cookies_h1: 'Política de Cookies'
  },
  en: {
    nav_news: 'News', nav_teams: 'Teams', nav_standings: 'Standings',
    nav_stats: 'Stats', nav_compare: 'Compare', nav_trade: 'Trade Machine',
    nav_quiniela: "Pick'em", nav_calendar: 'Calendar', nav_playoffs: 'Playoffs',
    nav_draft: 'Draft', nav_market: 'Transactions', nav_store: 'Store',

    footer_legal: 'Legal Notice', footer_privacy: 'Privacy', footer_cookies: 'Cookies',

    cookie_banner_text: "We use our own and third-party cookies (advertising) to keep the site free. You can accept or reject them; if you reject them, you'll keep browsing normally but without personalized ads.",
    cookie_more_info: 'More information', cookie_reject: 'Reject', cookie_accept: 'Accept',

    search_placeholder: 'Search player...', search_aria_label: 'Search player',
    search_searching: 'Searching...', search_no_results: 'No results', search_error: 'Search failed',

    content_spanish_only: 'This content is only available in Spanish.',

    home_h1: 'Latest NBA News',
    home_subtitle: 'El Rompearos is a Spanish-language NBA basketball site: news, teams, NBA stats, standings, schedule, playoffs, draft and trade market coverage for all 30 teams and their players.',
    teams_h1: 'NBA Teams',
    teams_subtitle: 'Check the roster, NBA stats and salaries of any basketball player from all 30 NBA teams, plus their history, founding and titles.',
    standings_h1: 'NBA Standings',
    stats_h1: 'NBA Stats',
    stats_subtitle: 'Top 50 NBA basketball players of the current season, ranked by rating, points, rebounds, assists, steals, blocks or shooting percentages.',
    compare_h1: 'NBA Player Comparison',
    compare_subtitle: 'Compare the stats of two NBA basketball players, each in the season you choose separately.',
    trade_h1: 'Trade Machine',
    trade_subtitle: 'Choose between 2 and 4 teams, mark who leaves each roster and check whether the trade matches under salary rules.',
    quiniela_h1: "Weekly Pick'em",
    quiniela_subtitle: 'Pick the winner of every game this week. Saves automatically, no account needed.',
    calendar_h1: 'NBA Schedule',
    playoffs_h1: 'NBA Playoffs',
    draft_h1: 'NBA Draft',
    market_h1: 'Transactions',
    store_h1: 'NBA Store',
    legal_h1: 'Legal Notice',
    privacy_h1: 'Privacy Policy',
    cookies_h1: 'Cookie Policy'
  },
  pt: {
    nav_news: 'Notícias', nav_teams: 'Times', nav_standings: 'Classificação',
    nav_stats: 'Estatísticas', nav_compare: 'Comparar', nav_trade: 'Simulador de Trocas',
    nav_quiniela: 'Bolão', nav_calendar: 'Calendário', nav_playoffs: 'Playoffs',
    nav_draft: 'Draft', nav_market: 'Mercado', nav_store: 'Loja',

    footer_legal: 'Aviso Legal', footer_privacy: 'Privacidade', footer_cookies: 'Cookies',

    cookie_banner_text: 'Usamos cookies próprios e de terceiros (publicidade) para manter o site gratuito. Você pode aceitá-los ou rejeitá-los; se rejeitar, continuará navegando normalmente, mas sem anúncios personalizados.',
    cookie_more_info: 'Mais informações', cookie_reject: 'Rejeitar', cookie_accept: 'Aceitar',

    search_placeholder: 'Buscar jogador...', search_aria_label: 'Buscar jogador',
    search_searching: 'Buscando...', search_no_results: 'Sem resultados', search_error: 'Não foi possível buscar',

    content_spanish_only: 'Este conteúdo está disponível apenas em espanhol.',

    home_h1: 'Últimas notícias da NBA',
    home_subtitle: 'El Rompearos é um site de basquete da NBA em espanhol: notícias, times, estatísticas da NBA, classificação, calendário, playoffs, draft e mercado de transações dos 30 times e seus jogadores.',
    teams_h1: 'Times da NBA',
    teams_subtitle: 'Consulte o elenco, estatísticas da NBA e salários de qualquer jogador de basquete dos 30 times da NBA, além de sua história, fundação e títulos.',
    standings_h1: 'Classificação da NBA',
    stats_h1: 'Estatísticas da NBA',
    stats_subtitle: 'Top 50 jogadores de basquete da NBA da temporada atual, ordenados por avaliação, pontos, rebotes, assistências, roubos de bola, tocos ou porcentagens de arremesso.',
    compare_h1: 'Comparador de jogadores da NBA',
    compare_subtitle: 'Compare as estatísticas de dois jogadores de basquete da NBA, cada um na temporada que você escolher separadamente.',
    trade_h1: 'Simulador de Trocas',
    trade_subtitle: 'Escolha entre 2 e 4 times, marque quem sai de cada elenco e veja se a troca se encaixa nas regras salariais.',
    quiniela_h1: 'Bolão Semanal',
    quiniela_subtitle: 'Escolha o vencedor de cada jogo da semana. Salva sozinho, sem precisar de conta.',
    calendar_h1: 'Calendário da NBA',
    playoffs_h1: 'Playoffs da NBA',
    draft_h1: 'Draft da NBA',
    market_h1: 'Mercado de transações',
    store_h1: 'Loja da NBA',
    legal_h1: 'Aviso Legal',
    privacy_h1: 'Política de Privacidade',
    cookies_h1: 'Política de Cookies'
  }
};

function getLang() {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && SUPPORTED_LANGS.includes(urlLang)) {
      localStorage.setItem(LANG_STORAGE_KEY, urlLang);
      return urlLang;
    }
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (err) {
    // localStorage bloqueado: no persiste entre paginas, pero no rompe nada
  }
  return 'es';
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (err) { /* sin persistencia disponible */ }
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.location.href = url.toString();
}

const currentLang = getLang();

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS.es[key] || key;
}

// Traduce el HTML estatico ya presente en la pagina (nav, pie, titulares):
// data-i18n para texto, data-i18n-placeholder para el atributo placeholder.
// Los elementos con clase .lang-notice se muestran solo si el idioma
// activo no es español (avisan de que ese bloque concreto sigue en
// español porque el contenido no esta traducido).
function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });

  if (currentLang !== 'es') {
    document.querySelectorAll('.lang-notice[data-i18n]').forEach((el) => { el.hidden = false; });
  }
}

// Se inserta el ultimo (via setTimeout): navToggle.js y search.js inyectan
// sus propios botones en el header de forma sincrona nada mas cargar, y
// asi el selector siempre queda despues de ellos (a la derecha del todo)
// sin depender del orden exacto de las etiquetas <script>.
function injectLangSwitcher() {
  const header = document.querySelector('header.site-header');
  if (!header || document.getElementById('lang-switcher')) return;

  const select = document.createElement('select');
  select.id = 'lang-switcher';
  select.className = 'lang-switcher';
  select.setAttribute('aria-label', 'Idioma / Language / Idioma');
  select.innerHTML = SUPPORTED_LANGS.map((code) =>
    `<option value="${code}" ${code === currentLang ? 'selected' : ''}>${LANG_NAMES[code]}</option>`
  ).join('');
  select.addEventListener('change', () => setLang(select.value));

  header.appendChild(select);
}

applyTranslations();
setTimeout(injectLangSwitcher, 0);
