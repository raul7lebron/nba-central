async function loadTeams() {
  const container = document.getElementById('teams-container');
  try {
    const res = await fetch('/api/teams');
    const teams = await res.json();

    if (!teams.length) {
      container.innerHTML = `<p class="state-msg">${t('teams_empty')}</p>`;
      return;
    }

    teams.sort((a, b) => a.full_name.localeCompare(b.full_name));

    container.innerHTML = teams.map((team) => `
      <a class="team-card" href="/team.html?id=${team.id}">
        <div class="team-logo-wrap">${logoImgOrBadge(team.abbreviation, 68)}</div>
        <div class="team-name">${displayAbbr(team.abbreviation)}</div>
        <div class="team-conf">
          <span class="conf-tag" style="background:${team.conference === 'East' ? 'var(--east)' : 'var(--west)'}"></span>
          ${team.conference} · ${team.division}
        </div>
      </a>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-msg">${t('teams_error')}</p>`;
  }
}

loadTeams();
