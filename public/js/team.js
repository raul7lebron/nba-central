function escapeAttr(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function getTeamId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function showTeamNews(team) {
  openModal(`
    <h2>Noticias · ${team.full_name}</h2>
    <div id="team-news-body" style="margin-top:14px">
      <p class="state-msg">Cargando noticias...</p>
    </div>
  `);

  const body = document.getElementById('team-news-body');
  try {
    const res = await fetch(`/api/teams/${team.id}/news`);
    const news = await res.json();

    if (!news.length) {
      body.innerHTML = '<p class="state-msg">No hay noticias recientes que mencionen a este equipo.</p>';
      return;
    }

    body.innerHTML = `<div class="news-list">${news.map((item) => `
      <a class="news-item" href="${item.link}" target="_blank" rel="noopener noreferrer">
        ${item.image ? `<img class="news-thumb" src="${item.image}" alt="${escapeAttr(item.title)}" loading="lazy" onerror="this.remove()">` : ''}
        <div class="news-body">
          <span class="news-source">${item.source}</span>
          <div class="news-title">${item.title}</div>
          <div class="news-summary">${item.summary || ''}</div>
          <div class="news-date">${formatDate(item.pubDate)}</div>
        </div>
      </a>
    `).join('')}</div>`;
  } catch (err) {
    body.innerHTML = '<p class="error-msg">No se pudieron cargar las noticias.</p>';
  }
}

function renderHero(team, teamId) {
  const heroEl = document.getElementById('team-hero');
  if (!team) {
    heroEl.innerHTML = `<h1>Equipo #${teamId}</h1>`;
    return;
  }
  const confVar = team.conference === 'East' ? 'var(--east)' : 'var(--west)';
  const historyPill = team.founded
    ? `<span class="pill">🏆 ${team.titles} título${team.titles === 1 ? '' : 's'} · fundado en ${team.founded}</span>`
    : '';

  heroEl.innerHTML = `
    <div class="team-logo-wrap">${logoImgOrBadge(team.abbreviation, 84)}</div>
    <div style="flex:1">
      <h1>${team.full_name}</h1>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
        <span class="pill"><span class="conf-tag" style="background:${confVar}"></span>${team.conference}ern Conference · ${team.division}</span>
        ${historyPill}
        <span class="pill" id="salary-pill">Nómina: cargando…</span>
      </div>
    </div>
    <button class="pill" id="team-news-btn" style="cursor:pointer;border:1px solid var(--accent);color:var(--accent)">📰 Noticias del equipo</button>
  `;

  document.getElementById('team-news-btn').addEventListener('click', () => showTeamNews(team));
  loadSalarySummary(teamId);
  updateSeoForTeam(team);
}

// El titulo/descripcion base son genericos porque la pagina carga el equipo
// por JS; en cuanto sabemos que equipo es, los hacemos especificos (mejor
// para SEO que un titulo igual en las 30 paginas de equipo).
function updateSeoForTeam(team) {
  const title = `${team.full_name} - Plantilla, salarios y valoración 2K | El Rompearos`;
  const description = `Plantilla actual de ${team.full_name}: estadísticas, salarios y valoración NBA 2K de cada jugador. ${team.conference}ern Conference, división ${team.division}.`;

  document.title = title;
  document.getElementById('page-title').textContent = title;
  document.getElementById('meta-description').setAttribute('content', description);
  document.getElementById('og-title').setAttribute('content', title);
  document.getElementById('og-description').setAttribute('content', description);

  const canonicalUrl = `https://www.elrompearos.com/team.html?id=${team.id}`;
  const canonicalLink = document.createElement('link');
  canonicalLink.rel = 'canonical';
  canonicalLink.href = canonicalUrl;
  document.head.appendChild(canonicalLink);

  const ogUrl = document.createElement('meta');
  ogUrl.setAttribute('property', 'og:url');
  ogUrl.setAttribute('content', canonicalUrl);
  document.head.appendChild(ogUrl);

  const ldJson = document.createElement('script');
  ldJson.type = 'application/ld+json';
  ldJson.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.full_name,
    sport: 'Basketball',
    memberOf: {
      '@type': 'SportsOrganization',
      name: 'National Basketball Association'
    }
  });
  document.head.appendChild(ldJson);
}

async function loadSalarySummary(teamId) {
  const pill = document.getElementById('salary-pill');
  try {
    const res = await fetch(`/api/teams/${teamId}/salary-summary`);
    const data = await res.json();
    if (!data.hasData) {
      pill.textContent = 'Nómina: sin datos todavía';
      return;
    }
    const capSpaceLabel = data.capSpace >= 0
      ? `${formatMoney(data.capSpace)} de margen`
      : `${formatMoney(Math.abs(data.capSpace))} por encima del tope`;
    pill.textContent = `Nómina ${formatMoney(data.totalPayroll)} · ${capSpaceLabel}`;
  } catch (err) {
    pill.textContent = 'Nómina: no disponible';
  }
}

async function loadTeam() {
  const teamId = getTeamId();
  const container = document.getElementById('roster-container');

  if (!teamId) {
    document.getElementById('team-hero').innerHTML = '<h1>Equipo no especificado</h1>';
    return;
  }

  try {
    const teamsRes = await fetch('/api/teams');
    const teams = await teamsRes.json();
    const team = teams.find((t) => String(t.id) === String(teamId));
    renderHero(team, teamId);

    const playersRes = await fetch(`/api/teams/${teamId}/players`);
    const players = await playersRes.json();

    if (!players.length) {
      container.innerHTML = '<p class="state-msg">No hay jugadores cacheados para este equipo todavía.</p>';
      return;
    }

    players.sort((a, b) => a.last_name.localeCompare(b.last_name));

    container.innerHTML = players.map((p) => `
      <div class="player-card" data-id="${p.id}">
        <div class="player-jersey">${p.jersey_number ? '#' + p.jersey_number : '—'}</div>
        <div style="flex:1">
          <div class="player-name">${p.first_name} ${p.last_name}</div>
          <div class="player-meta">${p.position || 'N/D'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${p.rating2k ? `<span class="pill" style="padding:2px 8px;font-size:0.7rem;color:${rating2kColor(p.rating2k)};border-color:${rating2kColor(p.rating2k)}66">${p.rating2k}</span>` : ''}
          ${p.salary ? `<div class="player-meta" style="font-weight:700;color:var(--accent)">${formatMoney(p.salary)}</div>` : ''}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.player-card').forEach((card) => {
      const player = players.find((p) => String(p.id) === card.dataset.id);
      card.addEventListener('click', () => showPlayerStats(player));
    });

    document.getElementById('team-ad-slot').innerHTML = renderAdSlot('teamFooter');
    activateAdSlots();
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudo cargar la plantilla.</p>';
  }
}

loadTeam();
