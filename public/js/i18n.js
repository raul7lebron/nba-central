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
// El selector muestra el codigo corto (ES/EN/PT), no el nombre completo:
// con el nombre entero ("English", "Português") el control no cabia junto
// al resto de iconos de la cabecera en movil (se salia por el borde
// derecho, invisible e inutilizable). El nombre completo de cada idioma
// sigue disponible por el title de cada <option>, para quien pase el ratón
// o use un lector de pantalla que lo anuncie.
const LANG_CODES = { es: 'ES', en: 'EN', pt: 'PT' };

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
    cookies_h1: 'Política de Cookies',

    common_no_data: 'N/D', common_active: 'Activo', common_retired: 'Retirado',
    common_all_teams: 'Todos los equipos', common_undrafted: 'No drafteado',
    common_view_product: 'Ver producto →', common_close: 'Cerrar',
    common_conference_east: 'Conferencia Este', common_conference_west: 'Conferencia Oeste',
    common_cap_room: 'de margen', common_over_cap: 'por encima del tope',

    teams_loading: 'Cargando equipos...', teams_error: 'No se pudieron cargar los equipos.',
    teams_empty: 'Todavía no hay equipos cacheados. Vuelve en unos minutos.',

    breadcrumb_home: 'Inicio',
    team_unnamed: 'Equipo', team_not_specified: 'Equipo no especificado',
    team_news_loading: 'Cargando noticias...',
    team_news_empty: 'No hay noticias recientes que mencionen a este equipo.',
    team_title_singular: 'título', team_title_plural: 'títulos', team_founded_in: 'fundado en',
    team_payroll_label: 'Nómina', team_payroll_loading: 'Nómina: cargando…',
    team_payroll_no_data: 'Nómina: sin datos todavía', team_payroll_unavailable: 'Nómina: no disponible',
    team_news_button: 'Noticias del equipo',
    team_no_players: 'No hay jugadores cacheados para este equipo todavía.',
    team_loading: 'Cargando equipo...', team_roster_loading: 'Cargando plantilla...', team_roster_error: 'No se pudo cargar la plantilla.',

    news_loading: 'Cargando noticias...', news_empty: 'Todavía no hay noticias cacheadas. Vuelve en unos minutos.',
    news_error: 'No se pudieron cargar las noticias.',

    player_no_current_team: 'Sin equipo actual',
    player_draft_round_word: 'Ronda', player_draft_pick_word: 'Pick nº',
    player_2k_career_best: 'Mejor 2K de su carrera:',
    player_salary_label: 'Salario', player_current_season: 'temporada actual',
    player_retired_inactive: 'Retirado/inactivo',
    player_award_all_defensive: 'Quinteto defensivo', player_award_rookie: 'Rookie del año',
    player_contract_title: 'Contrato',
    player_stats_season_title: 'Estadísticas por temporada', player_stats_career_title: 'Estadísticas de toda su carrera',
    player_stats_loading: 'Cargando estadísticas...', player_stats_error: 'No se pudieron cargar las estadísticas.',
    player_not_specified: 'Jugador no especificado', player_not_found: 'Jugador no encontrado',
    player_loading: 'Cargando jugador...', player_load_error: 'No se pudo cargar el jugador.',

    modal_no_season_stats: 'No hay estadísticas de temporadas disponibles para este jugador.',
    th_team: 'Equipo', th_season: 'Temp.', th_gp: 'PJ', th_min: 'MIN', th_pts: 'PTS', th_reb: 'REB',
    th_ast: 'AST', th_stl: 'ROB', th_blk: 'TAP', th_fg_pct: '%TC', th_fg3_pct: '%3P', th_val: 'VAL',
    th_player: 'Jugador', th_salary: 'Salario', th_option: 'Opción',
    contract_option_player: 'Opción jugador', contract_option_team: 'Opción equipo',
    contract_option_non_guaranteed: 'No garantizado',
    contract_source_note: 'Datos de contrato de HoopsHype. Puede haber opciones de jugador/equipo no marcadas en la fuente.',

    standings_th_w: 'V', standings_th_l: 'D', standings_th_pct: '%V', standings_th_gb: 'GB', standings_th_diff: 'DIF',
    standings_no_games: 'No hay partidos registrados para esta temporada todavía.',
    standings_loading: 'Cargando clasificación...', standings_error: 'No se pudo cargar la clasificación.',

    stats_sort_label: 'Ordenar por', stats_season_prefix: 'Temporada', stats_updated: 'actualizado',
    stat_val: 'Valoración', stat_pts: 'Puntos', stat_reb: 'Rebotes', stat_ast: 'Asistencias',
    stat_stl: 'Robos', stat_blk: 'Tapones', stat_fg_pct: '% Tiro de campo', stat_fg3_pct: '% Triples',
    stat_min_per_game: 'Minutos por partido',
    stats_no_current_season: 'Todavía no hay estadísticas de esta temporada.',
    stats_no_leaders_yet: 'Todavía no hay estadísticas de la temporada en curso (puede que aún no haya empezado o el servidor no las haya refrescado todavía).',
    stats_error: 'No se pudieron cargar las estadísticas.',

    compare_change: 'Cambiar', compare_loading_seasons: 'Cargando temporadas...',
    compare_no_stats: 'Sin estadísticas disponibles para este jugador.',
    compare_pick_two: 'Elige dos jugadores para compararlos.',
    compare_pick_season_both: 'Elige, para cada jugador, una temporada con estadísticas.',
    compare_seasons_error: 'No se pudieron cargar las temporadas.',
    compare_games_played: 'Partidos jugados',

    calendar_no_games_filter: 'No hay partidos para este filtro.', calendar_tbd: 'Por confirmar',
    calendar_loading: 'Cargando calendario...', calendar_error: 'No se pudo cargar el calendario.',

    playoffs_no_games: 'No hay partidos de playoffs registrados para esta temporada todavía.',
    playoffs_loading: 'Cargando playoffs...', playoffs_error: 'No se pudieron cargar los playoffs.',
    playoffs_round_generic: 'Playoffs', playoffs_round_first: 'Primera ronda',
    playoffs_round_conf_semis: 'Semifinales de conferencia', playoffs_round_conf_finals: 'Finales de conferencia',
    playoffs_round_nba_finals: 'Finales NBA',

    draft_no_data_year: 'No hay datos de draft para este año todavía.', draft_loading: 'Cargando draft...', draft_error: 'No se pudo cargar el draft.',

    market_no_transactions: 'Todavía no se ha detectado ningún fichaje o traspaso. El archivo se va llenando solo con cada actualización de noticias.',
    market_error: 'No se pudo cargar el mercado.', market_loading: 'Cargando mercado...',

    ads_placeholder: 'Espacio publicitario', ads_sidebar_label: 'Publicidad',

    trade_choose_team: 'Elige un equipo…', trade_no_team: 'Sin equipo', trade_remove: 'Quitar',
    trade_roster_loading: 'Cargando plantilla...', trade_no_players_cached: 'Sin jugadores cacheados.',
    trade_section_squad: 'Plantilla', trade_section_future_picks: 'Elecciones de draft futuras',
    trade_pick_round1: '1ª ronda', trade_pick_round2: '2ª ronda', trade_draft_pick_label: 'Elección de draft',
    trade_no_salary_data: 'Sin datos', trade_ask_destination: '¿A quién va?',
    trade_no_payroll_data: 'sin datos de nómina', trade_no_changes: 'Sin cambios en este traspaso.',
    trade_verdict_no_data: 'Sin datos de nómina', trade_verdict_ok: 'Cuadra en salario',
    trade_verdict_fail: 'No cuadra en salario',
    trade_out_label: 'Sale', trade_in_label: 'Entra', trade_margin_allowed: 'Margen permitido',
    trade_resulting_payroll: 'Nómina resultante',
    trade_unknown_salary_note: 'Incluye algún jugador sin salario conocido (contado como 0$).',
    trade_gives: 'Cede', trade_receives: 'Recibe', trade_from_word: 'de', trade_unknown_destination: '¿?', trade_movements_title: 'Movimientos',
    trade_pick_teams_prompt: 'Elige los equipos y marca qué jugadores salen de cada plantilla para simular el traspaso.',
    trade_missing_destination_singular: 'Falta asignar el destino de 1 jugador.',
    trade_missing_destination_plural: 'Falta asignar el destino de {n} jugadores.',
    trade_results_title: '¿Cuadra el traspaso?',
    trade_add_team: '+ Añadir equipo', trade_reset: 'Reiniciar traspaso',
    trade_teams_error: 'No se pudieron cargar los equipos.', trade_teams_loading: 'Cargando equipos...',
    trade_disclaimer: 'Simulación simplificada de las reglas de emparejamiento salarial de la NBA: no modela impuesto de lujo, aprons ni excepciones especiales (Bird rights, TPE, etc.). Las elecciones de draft futuras son siempre las propias de cada equipo (1ª y 2ª ronda de los próximos 5 años): no se modelan protecciones, swaps ni picks ya cedidos en traspasos anteriores. No sustituye una validación oficial del CBA.',

    quiniela_nickname_label: 'Tu apodo', quiniela_nickname_placeholder: 'Elige un apodo',
    quiniela_privacy_note: 'El apodo y tus picks se guardan en este navegador, sin contraseña. Si borras los datos del sitio, empiezas de cero.',
    quiniela_week_prev: '← Semana anterior', quiniela_week_next: 'Semana siguiente →',
    quiniela_final: 'Final', quiniela_in_progress: 'En juego / por confirmar',
    quiniela_no_games_week: 'No hay partidos programados esta semana. Prueba otra semana.',
    quiniela_my_score: 'Tu resultado esta semana: {correct} de {total} acertados.',
    quiniela_saving: 'Guardando...', quiniela_saved: 'Guardado ✓',
    quiniela_save_error: 'No se pudo guardar. Se reintentará con la próxima elección.',
    quiniela_games_loading: 'Cargando partidos...', quiniela_games_error: 'No se pudieron cargar los partidos.',
    quiniela_week_leaderboard_title: 'Clasificación de esta semana',
    quiniela_season_leaderboard_title: 'Clasificación de la temporada',
    quiniela_week_leaderboard_empty: 'Todavía nadie ha acertado ningún partido decidido esta semana.',
    quiniela_season_leaderboard_empty: 'Todavía no hay resultados decididos esta temporada.',
    quiniela_leaderboard_error: 'No se pudo cargar la clasificación.',
    quiniela_anonymous: 'Jugador anónimo', quiniela_you_suffix: ' (tú)',
    quiniela_th_nickname: 'Apodo', quiniela_th_correct: 'Aciertos', quiniela_th_decided: 'Decididos'
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
    cookies_h1: 'Cookie Policy',

    common_no_data: 'N/A', common_active: 'Active', common_retired: 'Retired',
    common_all_teams: 'All teams', common_undrafted: 'Undrafted',
    common_view_product: 'View product →', common_close: 'Close',
    common_conference_east: 'Eastern Conference', common_conference_west: 'Western Conference',
    common_cap_room: 'of cap room', common_over_cap: 'over the cap',

    teams_loading: 'Loading teams...', teams_error: "Couldn't load the teams.",
    teams_empty: 'No teams cached yet. Check back in a few minutes.',

    breadcrumb_home: 'Home',
    team_unnamed: 'Team', team_not_specified: 'No team specified',
    team_news_loading: 'Loading news...',
    team_news_empty: 'No recent news mentioning this team.',
    team_title_singular: 'title', team_title_plural: 'titles', team_founded_in: 'founded in',
    team_payroll_label: 'Payroll', team_payroll_loading: 'Payroll: loading…',
    team_payroll_no_data: 'Payroll: no data yet', team_payroll_unavailable: 'Payroll: unavailable',
    team_news_button: 'Team news',
    team_no_players: 'No players cached for this team yet.',
    team_loading: 'Loading team...', team_roster_loading: 'Loading roster...', team_roster_error: "Couldn't load the roster.",

    news_loading: 'Loading news...', news_empty: 'No news cached yet. Check back in a few minutes.',
    news_error: "Couldn't load the news.",

    player_no_current_team: 'No current team',
    player_draft_round_word: 'Round', player_draft_pick_word: 'Pick #',
    player_2k_career_best: 'Career-best 2K:',
    player_salary_label: 'Salary', player_current_season: 'current season',
    player_retired_inactive: 'Retired/inactive',
    player_award_all_defensive: 'All-Defensive Team', player_award_rookie: 'Rookie of the Year',
    player_contract_title: 'Contract',
    player_stats_season_title: 'Season stats', player_stats_career_title: 'Career stats',
    player_stats_loading: 'Loading stats...', player_stats_error: "Couldn't load the stats.",
    player_not_specified: 'No player specified', player_not_found: 'Player not found',
    player_loading: 'Loading player...', player_load_error: "Couldn't load the player.",

    modal_no_season_stats: 'No season stats available for this player.',
    th_team: 'Team', th_season: 'Season', th_gp: 'GP', th_min: 'MIN', th_pts: 'PTS', th_reb: 'REB',
    th_ast: 'AST', th_stl: 'STL', th_blk: 'BLK', th_fg_pct: 'FG%', th_fg3_pct: '3P%', th_val: 'VAL',
    th_player: 'Player', th_salary: 'Salary', th_option: 'Option',
    contract_option_player: 'Player option', contract_option_team: 'Team option',
    contract_option_non_guaranteed: 'Non-guaranteed',
    contract_source_note: 'Contract data from HoopsHype. Some player/team options may not be marked in the source.',

    standings_th_w: 'W', standings_th_l: 'L', standings_th_pct: 'PCT', standings_th_gb: 'GB', standings_th_diff: 'DIFF',
    standings_no_games: 'No games recorded for this season yet.',
    standings_loading: 'Loading standings...', standings_error: "Couldn't load the standings.",

    stats_sort_label: 'Sort by', stats_season_prefix: 'Season', stats_updated: 'updated',
    stat_val: 'Rating', stat_pts: 'Points', stat_reb: 'Rebounds', stat_ast: 'Assists',
    stat_stl: 'Steals', stat_blk: 'Blocks', stat_fg_pct: 'FG%', stat_fg3_pct: '3P%',
    stat_min_per_game: 'Minutes per game',
    stats_no_current_season: 'No stats for this season yet.',
    stats_no_leaders_yet: "No stats for the current season yet (it may not have started, or the server hasn't refreshed them yet).",
    stats_error: "Couldn't load the stats.",

    compare_change: 'Change', compare_loading_seasons: 'Loading seasons...',
    compare_no_stats: 'No stats available for this player.',
    compare_pick_two: 'Choose two players to compare.',
    compare_pick_season_both: 'Choose a season with stats for each player.',
    compare_seasons_error: "Couldn't load the seasons.",
    compare_games_played: 'Games played',

    calendar_no_games_filter: 'No games for this filter.', calendar_tbd: 'TBD',
    calendar_loading: 'Loading schedule...', calendar_error: "Couldn't load the schedule.",

    playoffs_no_games: 'No playoff games recorded for this season yet.',
    playoffs_loading: 'Loading playoffs...', playoffs_error: "Couldn't load the playoffs.",
    playoffs_round_generic: 'Playoffs', playoffs_round_first: 'First round',
    playoffs_round_conf_semis: 'Conference semifinals', playoffs_round_conf_finals: 'Conference finals',
    playoffs_round_nba_finals: 'NBA Finals',

    draft_no_data_year: 'No draft data for this year yet.', draft_loading: 'Loading draft...', draft_error: "Couldn't load the draft.",

    market_no_transactions: "No signings or trades detected yet. The archive fills in automatically with each news update.",
    market_error: "Couldn't load the transactions.", market_loading: 'Loading transactions...',

    ads_placeholder: 'Ad space', ads_sidebar_label: 'Advertising',

    trade_choose_team: 'Choose a team…', trade_no_team: 'No team', trade_remove: 'Remove',
    trade_roster_loading: 'Loading roster...', trade_no_players_cached: 'No players cached.',
    trade_section_squad: 'Roster', trade_section_future_picks: 'Future draft picks',
    trade_pick_round1: '1st round', trade_pick_round2: '2nd round', trade_draft_pick_label: 'Draft pick',
    trade_no_salary_data: 'No data', trade_ask_destination: 'Which team?',
    trade_no_payroll_data: 'no payroll data', trade_no_changes: 'No changes in this trade.',
    trade_verdict_no_data: 'No payroll data', trade_verdict_ok: 'Salary matches',
    trade_verdict_fail: "Salary doesn't match",
    trade_out_label: 'Out', trade_in_label: 'In', trade_margin_allowed: 'Allowed margin',
    trade_resulting_payroll: 'Resulting payroll',
    trade_unknown_salary_note: 'Includes a player with unknown salary (counted as $0).',
    trade_gives: 'Gives up', trade_receives: 'Receives', trade_from_word: 'from', trade_unknown_destination: '?', trade_movements_title: 'Movements',
    trade_pick_teams_prompt: 'Choose the teams and mark which players leave each roster to simulate the trade.',
    trade_missing_destination_singular: '1 player still needs a destination.',
    trade_missing_destination_plural: '{n} players still need a destination.',
    trade_results_title: 'Does the trade work?',
    trade_add_team: '+ Add team', trade_reset: 'Reset trade',
    trade_teams_error: "Couldn't load the teams.", trade_teams_loading: 'Loading teams...',
    trade_disclaimer: "Simplified simulation of the NBA's salary-matching rules: it doesn't model luxury tax, aprons, or special exceptions (Bird rights, TPE, etc.). Future draft picks are always each team's own (1st and 2nd round for the next 5 years): protections, swaps, and picks already traded away in prior deals aren't modeled. This doesn't replace an official CBA validation.",

    quiniela_nickname_label: 'Your nickname', quiniela_nickname_placeholder: 'Choose a nickname',
    quiniela_privacy_note: "Your nickname and picks are saved in this browser, no password needed. If you clear your site data, you start from scratch.",
    quiniela_week_prev: '← Previous week', quiniela_week_next: 'Next week →',
    quiniela_final: 'Final', quiniela_in_progress: 'In progress / TBD',
    quiniela_no_games_week: 'No games scheduled this week. Try another week.',
    quiniela_my_score: 'Your result this week: {correct} of {total} correct.',
    quiniela_saving: 'Saving...', quiniela_saved: 'Saved ✓',
    quiniela_save_error: "Couldn't save. It'll retry on your next pick.",
    quiniela_games_loading: 'Loading games...', quiniela_games_error: "Couldn't load the games.",
    quiniela_week_leaderboard_title: "This week's leaderboard",
    quiniela_season_leaderboard_title: 'Season leaderboard',
    quiniela_week_leaderboard_empty: "No one has gotten a decided game right this week yet.",
    quiniela_season_leaderboard_empty: 'No decided results yet this season.',
    quiniela_leaderboard_error: "Couldn't load the leaderboard.",
    quiniela_anonymous: 'Anonymous player', quiniela_you_suffix: ' (you)',
    quiniela_th_nickname: 'Nickname', quiniela_th_correct: 'Correct', quiniela_th_decided: 'Decided'
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
    cookies_h1: 'Política de Cookies',

    common_no_data: 'N/D', common_active: 'Ativo', common_retired: 'Aposentado',
    common_all_teams: 'Todos os times', common_undrafted: 'Não draftado',
    common_view_product: 'Ver produto →', common_close: 'Fechar',
    common_conference_east: 'Conferência Leste', common_conference_west: 'Conferência Oeste',
    common_cap_room: 'de espaço no teto', common_over_cap: 'acima do teto',

    teams_loading: 'Carregando times...', teams_error: 'Não foi possível carregar os times.',
    teams_empty: 'Ainda não há times em cache. Volte em alguns minutos.',

    breadcrumb_home: 'Início',
    team_unnamed: 'Time', team_not_specified: 'Time não especificado',
    team_news_loading: 'Carregando notícias...',
    team_news_empty: 'Nenhuma notícia recente menciona este time.',
    team_title_singular: 'título', team_title_plural: 'títulos', team_founded_in: 'fundado em',
    team_payroll_label: 'Folha salarial', team_payroll_loading: 'Folha salarial: carregando…',
    team_payroll_no_data: 'Folha salarial: sem dados ainda', team_payroll_unavailable: 'Folha salarial: indisponível',
    team_news_button: 'Notícias do time',
    team_no_players: 'Nenhum jogador em cache para este time ainda.',
    team_loading: 'Carregando time...', team_roster_loading: 'Carregando elenco...', team_roster_error: 'Não foi possível carregar o elenco.',

    news_loading: 'Carregando notícias...', news_empty: 'Ainda não há notícias em cache. Volte em alguns minutos.',
    news_error: 'Não foi possível carregar as notícias.',

    player_no_current_team: 'Sem time atual',
    player_draft_round_word: 'Rodada', player_draft_pick_word: 'Pick nº',
    player_2k_career_best: 'Melhor 2K da carreira:',
    player_salary_label: 'Salário', player_current_season: 'temporada atual',
    player_retired_inactive: 'Aposentado/inativo',
    player_award_all_defensive: 'Quinteto Defensivo', player_award_rookie: 'Novato do Ano',
    player_contract_title: 'Contrato',
    player_stats_season_title: 'Estatísticas por temporada', player_stats_career_title: 'Estatísticas de carreira',
    player_stats_loading: 'Carregando estatísticas...', player_stats_error: 'Não foi possível carregar as estatísticas.',
    player_not_specified: 'Jogador não especificado', player_not_found: 'Jogador não encontrado',
    player_loading: 'Carregando jogador...', player_load_error: 'Não foi possível carregar o jogador.',

    modal_no_season_stats: 'Não há estatísticas de temporada disponíveis para este jogador.',
    th_team: 'Time', th_season: 'Temp.', th_gp: 'J', th_min: 'MIN', th_pts: 'PTS', th_reb: 'REB',
    th_ast: 'AST', th_stl: 'RB', th_blk: 'TC', th_fg_pct: '%FG', th_fg3_pct: '%3P', th_val: 'VAL',
    th_player: 'Jogador', th_salary: 'Salário', th_option: 'Opção',
    contract_option_player: 'Opção do jogador', contract_option_team: 'Opção do time',
    contract_option_non_guaranteed: 'Não garantido',
    contract_source_note: 'Dados de contrato via HoopsHype. Algumas opções de jogador/time podem não estar marcadas na fonte.',

    standings_th_w: 'V', standings_th_l: 'D', standings_th_pct: 'APR', standings_th_gb: 'GB', standings_th_diff: 'DIF',
    standings_no_games: 'Nenhum jogo registrado para esta temporada ainda.',
    standings_loading: 'Carregando classificação...', standings_error: 'Não foi possível carregar a classificação.',

    stats_sort_label: 'Ordenar por', stats_season_prefix: 'Temporada', stats_updated: 'atualizado',
    stat_val: 'Avaliação', stat_pts: 'Pontos', stat_reb: 'Rebotes', stat_ast: 'Assistências',
    stat_stl: 'Roubos de bola', stat_blk: 'Tocos', stat_fg_pct: '% Arremessos de quadra', stat_fg3_pct: '% Triplos',
    stat_min_per_game: 'Minutos por jogo',
    stats_no_current_season: 'Ainda não há estatísticas desta temporada.',
    stats_no_leaders_yet: 'Ainda não há estatísticas da temporada atual (pode ser que ainda não tenha começado, ou o servidor ainda não as atualizou).',
    stats_error: 'Não foi possível carregar as estatísticas.',

    compare_change: 'Trocar', compare_loading_seasons: 'Carregando temporadas...',
    compare_no_stats: 'Sem estatísticas disponíveis para este jogador.',
    compare_pick_two: 'Escolha dois jogadores para comparar.',
    compare_pick_season_both: 'Escolha, para cada jogador, uma temporada com estatísticas.',
    compare_seasons_error: 'Não foi possível carregar as temporadas.',
    compare_games_played: 'Jogos disputados',

    calendar_no_games_filter: 'Nenhum jogo para este filtro.', calendar_tbd: 'A confirmar',
    calendar_loading: 'Carregando calendário...', calendar_error: 'Não foi possível carregar o calendário.',

    playoffs_no_games: 'Nenhum jogo de playoffs registrado para esta temporada ainda.',
    playoffs_loading: 'Carregando playoffs...', playoffs_error: 'Não foi possível carregar os playoffs.',
    playoffs_round_generic: 'Playoffs', playoffs_round_first: 'Primeira rodada',
    playoffs_round_conf_semis: 'Semifinais de conferência', playoffs_round_conf_finals: 'Finais de conferência',
    playoffs_round_nba_finals: 'Finais da NBA',

    draft_no_data_year: 'Ainda não há dados de draft para este ano.', draft_loading: 'Carregando draft...', draft_error: 'Não foi possível carregar o draft.',

    market_no_transactions: 'Nenhuma contratação ou troca detectada ainda. O arquivo vai se preenchendo sozinho a cada atualização de notícias.',
    market_error: 'Não foi possível carregar o mercado.', market_loading: 'Carregando mercado...',

    ads_placeholder: 'Espaço publicitário', ads_sidebar_label: 'Publicidade',

    trade_choose_team: 'Escolha um time…', trade_no_team: 'Sem time', trade_remove: 'Remover',
    trade_roster_loading: 'Carregando elenco...', trade_no_players_cached: 'Nenhum jogador em cache.',
    trade_section_squad: 'Elenco', trade_section_future_picks: 'Escolhas de draft futuras',
    trade_pick_round1: '1ª rodada', trade_pick_round2: '2ª rodada', trade_draft_pick_label: 'Escolha de draft',
    trade_no_salary_data: 'Sem dados', trade_ask_destination: 'Para qual time?',
    trade_no_payroll_data: 'sem dados de folha salarial', trade_no_changes: 'Sem alterações nesta troca.',
    trade_verdict_no_data: 'Sem dados de folha salarial', trade_verdict_ok: 'Encaixa no salário',
    trade_verdict_fail: 'Não encaixa no salário',
    trade_out_label: 'Sai', trade_in_label: 'Entra', trade_margin_allowed: 'Margem permitida',
    trade_resulting_payroll: 'Folha salarial resultante',
    trade_unknown_salary_note: 'Inclui algum jogador sem salário conhecido (contado como $0).',
    trade_gives: 'Cede', trade_receives: 'Recebe', trade_from_word: 'de', trade_unknown_destination: '?', trade_movements_title: 'Movimentações',
    trade_pick_teams_prompt: 'Escolha os times e marque quais jogadores saem de cada elenco para simular a troca.',
    trade_missing_destination_singular: 'Falta atribuir o destino de 1 jogador.',
    trade_missing_destination_plural: 'Faltam atribuir o destino de {n} jogadores.',
    trade_results_title: 'A troca se encaixa?',
    trade_add_team: '+ Adicionar time', trade_reset: 'Reiniciar troca',
    trade_teams_error: 'Não foi possível carregar os times.', trade_teams_loading: 'Carregando times...',
    trade_disclaimer: 'Simulação simplificada das regras de compatibilização salarial da NBA: não modela imposto de luxo, aprons nem exceções especiais (Bird rights, TPE, etc.). As escolhas de draft futuras são sempre as próprias de cada time (1ª e 2ª rodada dos próximos 5 anos): não são modeladas proteções, trocas de picks nem escolhas já cedidas em negociações anteriores. Isso não substitui uma validação oficial do CBA.',

    quiniela_nickname_label: 'Seu apelido', quiniela_nickname_placeholder: 'Escolha um apelido',
    quiniela_privacy_note: 'Seu apelido e suas escolhas são salvos neste navegador, sem senha. Se você limpar os dados do site, começa do zero.',
    quiniela_week_prev: '← Semana anterior', quiniela_week_next: 'Próxima semana →',
    quiniela_final: 'Final', quiniela_in_progress: 'Em andamento / a confirmar',
    quiniela_no_games_week: 'Nenhum jogo programado esta semana. Tente outra semana.',
    quiniela_my_score: 'Seu resultado esta semana: {correct} de {total} acertos.',
    quiniela_saving: 'Salvando...', quiniela_saved: 'Salvo ✓',
    quiniela_save_error: 'Não foi possível salvar. Será tentado novamente na próxima escolha.',
    quiniela_games_loading: 'Carregando jogos...', quiniela_games_error: 'Não foi possível carregar os jogos.',
    quiniela_week_leaderboard_title: 'Classificação desta semana',
    quiniela_season_leaderboard_title: 'Classificação da temporada',
    quiniela_week_leaderboard_empty: 'Ainda ninguém acertou nenhum jogo decidido esta semana.',
    quiniela_season_leaderboard_empty: 'Ainda não há resultados decididos nesta temporada.',
    quiniela_leaderboard_error: 'Não foi possível carregar a classificação.',
    quiniela_anonymous: 'Jogador anônimo', quiniela_you_suffix: ' (você)',
    quiniela_th_nickname: 'Apelido', quiniela_th_correct: 'Acertos', quiniela_th_decided: 'Decididos'
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

// params sustituye {nombre} dentro del texto traducido, ej.
// t('quiniela_my_score', { correct: 3, total: 5 }).
function t(key, params) {
  let str = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS.es[key] || key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
    }
  }
  return str;
}

// Locale real para Intl/toLocaleString: numeros, fechas y horas se
// formatean con las convenciones del idioma activo, no solo se traduce el
// texto fijo alrededor.
const LOCALE_BY_LANG = { es: 'es-ES', en: 'en-US', pt: 'pt-BR' };
function getLocale() {
  return LOCALE_BY_LANG[currentLang] || 'es-ES';
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

// Se inserta el ultimo (via setTimeout) dentro de nav.site-nav (no en el
// header): asi viaja con el menu colapsado en movil (dentro del desplegable
// de la hamburguesa) en vez de ocupar espacio fijo junto al logo, que es lo
// que obligaba a ocultar "El Rompearos" en pantallas pequeñas.
function injectLangSwitcher() {
  const nav = document.querySelector('nav.site-nav');
  if (!nav || document.getElementById('lang-switcher')) return;

  const select = document.createElement('select');
  select.id = 'lang-switcher';
  select.className = 'lang-switcher';
  select.setAttribute('aria-label', 'Idioma / Language / Idioma');
  select.innerHTML = SUPPORTED_LANGS.map((code) =>
    `<option value="${code}" title="${LANG_NAMES[code]}" ${code === currentLang ? 'selected' : ''}>${LANG_CODES[code]}</option>`
  ).join('');
  select.addEventListener('change', () => setLang(select.value));

  nav.appendChild(select);
}

applyTranslations();
setTimeout(injectLangSwitcher, 0);
