// Genera el enlace a la ficha individual de un jugador (ej.
// /jugador/lebron-james-237). El slug es cosmetico, solo importa el id del
// final. Misma logica que src/playerSlug.js en el servidor (para el
// sitemap) — al no haber empaquetador de JS esta duplicada; si se cambia
// una hay que cambiar la otra.
function playerSlug(player) {
  const base = `${player.first_name} ${player.last_name}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'jugador'}-${player.id}`;
}

function playerUrl(player) {
  return `/jugador/${playerSlug(player)}`;
}
