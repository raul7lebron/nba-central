const cron = require('node-cron');
const { refreshAll, refreshNews, refreshSalaries, refreshRatings2k, refreshBirthYears, refreshDraftArchive } = require('./refreshAll');
const { checkFinishedGames } = require('./gameResults');

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

  // Resultados finales: cada 10 minutos, para publicar en redes (X/Telegram,
  // si hay credenciales configuradas) el resultado de un partido casi al
  // instante de terminar, que es cuando mas se busca ("resultado X hoy").
  // El refresco completo de partidos de refreshAll solo corre una vez al
  // dia a las 06:00, demasiado tarde para esto.
  cron.schedule('*/10 * * * *', () => {
    checkFinishedGames().catch((err) => console.error('[cron] error comprobando resultados finales:', err));
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

  // Año de nacimiento (Wikidata): no cambia nunca, semanal como el resto
  cron.schedule('0 7 * * 0', () => {
    console.log('[cron] refresco semanal de años de nacimiento');
    refreshBirthYears().catch((err) => console.error('[cron] error refresco años de nacimiento:', err));
  });

  console.log('[cron] tareas programadas: refresco completo 06:00, noticias cada 30min, resultados finales cada 10min, salarios/2K/draft/nacimientos domingos 07:00');
}

module.exports = { startScheduler };
