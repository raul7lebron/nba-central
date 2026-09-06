// Genera el slug de la URL de un jugador (ej. "lebron-james-237"). Se usa
// tanto en el servidor (sitemap.xml) como en el navegador (enlaces a la
// ficha del jugador); al no haber empaquetador de JS, la misma logica esta
// duplicada en public/js/playerLinks.js — si se cambia una hay que cambiar
// la otra.
function playerSlug(player) {
  const base = `${player.first_name} ${player.last_name}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'jugador'}-${player.id}`;
}

module.exports = { playerSlug };
