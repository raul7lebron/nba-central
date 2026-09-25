// Si hay un equipo marcado como favorito (team.js), lo destaca en la
// portada con su próximo partido y un enlace directo a su ficha. Oculto
// por completo si no hay favorito, o si algo falla al cargarlo.
async function loadFavoriteWidget() {
  const wrap = document.getElementById('favorite-wrap');
  const teamId = getFavoriteTeamId();
  if (!wrap || !teamId) return;

  try {
    const [teamRes, gamesRes] = await Promise.all([
      fetch(`/api/teams/${teamId}`),
      fetch('/api/games')
    ]);
    if (!teamRes.ok) return;
    const team = await teamRes.json();
    const gamesData = await gamesRes.json();

    const now = new Date();
    const upcoming = (gamesData.games || [])
      .filter((g) =>
        (String(g.home_team.id) === String(teamId) || String(g.visitor_team.id) === String(teamId)) &&
        g.status_state !== 'final' && new Date(g.datetime) > now
      )
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    let nextGameHtml = '<span class="player-meta">Sin más partidos programados por ahora</span>';
    if (upcoming.length) {
      const g = upcoming[0];
      const isHome = String(g.home_team.id) === String(teamId);
      const opponent = isHome ? g.visitor_team : g.home_team;
      const dateLabel = new Date(g.datetime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      const timeLabel = new Date(g.datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      nextGameHtml = `<span class="player-meta">Próximo: ${isHome ? 'vs' : '@'} ${displayAbbr(opponent.abbreviation)} · ${dateLabel}, ${timeLabel}</span>`;
    }

    wrap.hidden = false;
    wrap.innerHTML = `
      <a href="/team.html?id=${teamId}" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;flex:1;min-width:0">
        ${logoImgOrBadge(team.abbreviation, 40, true)}
        <div style="min-width:0">
          <div style="font-weight:700">★ ${team.full_name}</div>
          ${nextGameHtml}
        </div>
      </a>
      <button id="favorite-widget-remove" class="pill" style="cursor:pointer;flex-shrink:0" title="Quitar de favoritos">Quitar</button>
    `;

    document.getElementById('favorite-widget-remove').addEventListener('click', () => {
      setFavoriteTeamId(null);
      wrap.hidden = true;
    });
  } catch (err) {
    wrap.hidden = true;
  }
}

loadFavoriteWidget();
