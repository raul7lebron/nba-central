async function loadTeams() {
  const container = document.getElementById('teams-container');
  try {
    const res = await fetch('/api/teams');
    const teams = await res.json();

    if (!teams.length) {
      container.innerHTML = '<p class="state-msg">Todavía no hay equipos cacheados. Vuelve en unos minutos.</p>';
      return;
    }

    teams.sort((a, b) => a.full_name.localeCompare(b.full_name));

    container.innerHTML = teams.map((team) => `
      <a class="team-card" href="/team.html?id=${team.id}">
        <div class="team-logo-wrap">${logoImgOrBadge(team.abbreviation, 68)}</div>
        <div class="team-name">${team.full_name}</div>
        <div class="team-conf">
          <span class="conf-tag" style="background:${team.conference === 'East' ? 'var(--east)' : 'var(--west)'}"></span>
          ${team.conference} · ${team.division}
        </div>
      </a>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudieron cargar los equipos.</p>';
  }
}

loadTeams();
