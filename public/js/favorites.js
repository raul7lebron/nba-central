// Equipo favorito: se guarda solo el id en localStorage, sin cuenta ni
// servidor. Lo usan team.js (botón de marcar/desmarcar) e index.html
// (destaca al equipo favorito con su próximo partido).
const FAVORITE_TEAM_KEY = 'elrompearos_favorite_team';

function getFavoriteTeamId() {
  try {
    return localStorage.getItem(FAVORITE_TEAM_KEY);
  } catch (e) {
    return null;
  }
}

function setFavoriteTeamId(teamId) {
  try {
    if (teamId) localStorage.setItem(FAVORITE_TEAM_KEY, teamId);
    else localStorage.removeItem(FAVORITE_TEAM_KEY);
  } catch (e) {
    // localStorage no disponible (privado/bloqueado): la web sigue
    // funcionando, simplemente no recuerda el favorito.
  }
}
