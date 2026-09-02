const cron = require('node-cron');
const { refreshAll, refreshNews, refreshSalaries, refreshRatings2k, refreshDraftArchive } = require('./refreshAll');
const { processFinishedGames } = require('./fantasy/gameProcessor');

function startScheduler() {
  // Equipos, plantillas y noticias completas: todos los dias a las 06:00
  cron.schedule('0 6 * * *', () => {
    console.log('[cron] refresco diario completo');
    refreshAll().catch((err) => console.error('[cron] error refresco diario:', err));
  });

  // Noticias: cada 30 minutos, para que la portada este mas al dia
  cron.schedule('*/30 * * * *', () => {
    console.log('[cron] refresco de noticias');
    refreshNews().catch((err) => console.error('[cron] error refresco noticias:', err));
  });

  // Salarios: solo cambian con fichajes/traspasos, basta con una vez por semana
  cron.schedule('0 7 * * 0', () => {
    console.log('[cron] refresco semanal de salarios');
    refreshSalaries().catch((err) => console.error('[cron] error refresco salarios:', err));
  });

  // Valoraciones 2K: cambian con los parches del juego, no a diario
  cron.schedule('0 7 * * 0', () => {
    console.log('[cron] refresco semanal de valoraciones 2K');
    refreshRatings2k().catch((err) => console.error('[cron] error refresco 2K:', err));
  });

  // Archivo de drafts: solo cambia cuando hay un draft nuevo (cada junio)
  cron.schedule('0 7 * * 0', () => {
    console.log('[cron] refresco semanal del archivo de drafts');
    refreshDraftArchive().catch((err) => console.error('[cron] error refresco draft:', err));
  });

  // Modo Fantasy: procesa los partidos recien terminados (ajusta precios y
  // reparte dinero) cada 2 horas. Con eso basta durante la temporada, ya
  // que la caché de partidos del día solo se refresca a diario a las 06:00
  // y en directo casi nunca hace falta más frecuencia que esa.
  cron.schedule('0 */2 * * *', () => {
    console.log('[cron] procesando partidos para el modo Fantasy');
    processFinishedGames().catch((err) => console.error('[cron] error procesando fantasy:', err));
  });

  console.log('[cron] tareas programadas: refresco completo 06:00, noticias cada 30min, salarios/2K/draft domingos 07:00, fantasy cada 2h');
}

module.exports = { startScheduler };
