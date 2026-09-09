function escapeAttr(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function getTeamId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function showTeamNews(team) {
  openModal(`
    <h2>${t('nav_news')} · ${team.full_name}</h2>
    <div id="team-news-body" style="margin-top:14px">
      <p class="state-msg">${t('team_news_loading')}</p>
    </div>
  `);

  const body = document.getElementById('team-news-body');
  try {
    const res = await fetch(`/api/teams/${team.id}/news`);
    const news = await res.json();

    if (!news.length) {
      body.innerHTML = `<p class="state-msg">${t('team_news_empty')}</p>`;
      return;
    }

    body.innerHTML = `<div class="news-list">${news.map((item) => `
      <article style="display:contents">
        <a class="news-item" href="${escapeAttr(item.link)}" target="_blank" rel="noopener noreferrer">
          ${item.image ? `<img class="news-thumb" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy" onerror="this.remove()">` : ''}
          <div class="news-body">
            <span class="news-source">${item.source}</span>
            <div class="news-title">${escapeAttr(item.title)}</div>
            <div class="news-summary">${escapeAttr(item.summary || '')}</div>
            <div class="news-date">${formatDate(item.pubDate)}</div>
          </div>
        </a>
      </article>
    `).join('')}</div>`;
  } catch (err) {
    body.innerHTML = `<p class="error-msg">${t('news_error')}</p>`;
  }
}

function renderHero(team, teamId) {
  const heroEl = document.getElementById('team-hero');
  if (!team) {
    heroEl.innerHTML = `<h1>${t('team_unnamed')} #${teamId}</h1>`;
    return;
  }
  const confVar = team.conference === 'East' ? 'var(--east)' : 'var(--west)';
  const confLabel = team.conference === 'East' ? t('common_conference_east') : t('common_conference_west');
  const titleWord = team.titles === 1 ? t('team_title_singular') : t('team_title_plural');
  const historyPill = team.founded
    ? `<span class="pill">🏆 ${team.titles} ${titleWord} · ${t('team_founded_in')} ${team.founded}</span>`
    : '';

  heroEl.innerHTML = `
    <div class="team-logo-wrap">${logoImgOrBadge(team.abbreviation, 84)}</div>
    <div style="flex:1">
      <h1>${displayAbbr(team.abbreviation)}</h1>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
        <span class="pill"><span class="conf-tag" style="background:${confVar}"></span>${confLabel} · ${team.division}</span>
        ${historyPill}
        <span class="pill" id="salary-pill">${t('team_payroll_loading')}</span>
      </div>
    </div>
    <button class="pill" id="team-news-btn" style="cursor:pointer;border:1px solid var(--accent);color:var(--accent)">📰 ${t('team_news_button')}</button>
  `;

  document.getElementById('team-news-btn').addEventListener('click', () => showTeamNews(team));
  loadSalarySummary(teamId);
  updateSeoForTeam(team);
  updateBreadcrumb(team);
}

// Migas de pan (Inicio > Equipos > Nombre) + su JSON-LD a juego, para que
// Google pueda mostrar la ruta en el resultado de busqueda.
function updateBreadcrumb(team) {
  const nav = document.getElementById('breadcrumb');
  if (!nav) return;
  nav.innerHTML = `
    <a href="/index.html">${t('breadcrumb_home')}</a> <span class="sep" aria-hidden="true">/</span>
    <a href="/teams.html">${t('nav_teams')}</a> <span class="sep" aria-hidden="true">/</span>
    <span aria-current="page">${team.full_name}</span>
  `;

  const ldJson = document.createElement('script');
  ldJson.type = 'application/ld+json';
  ldJson.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.elrompearos.com/' },
      { '@type': 'ListItem', position: 2, name: 'Equipos', item: 'https://www.elrompearos.com/teams.html' },
      { '@type': 'ListItem', position: 3, name: team.full_name, item: `https://www.elrompearos.com/team.html?id=${team.id}` }
    ]
  });
  document.head.appendChild(ldJson);
}

// El titulo/descripcion base son genericos porque la pagina carga el equipo
// por JS; en cuanto sabemos que equipo es, los hacemos especificos (mejor
// para SEO que un titulo igual en las 30 paginas de equipo).
function updateSeoForTeam(team) {
  const title = `${team.full_name} - Plantilla, salarios y valoración 2K | El Rompearos`;
  const description = `Plantilla actual de ${team.full_name}: estadísticas NBA, salarios y valoración NBA 2K de cada jugador de baloncesto. ${team.conference}ern Conference, división ${team.division}.`;

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
}

// Se llama por separado (no en updateSeoForTeam) porque necesita la plantilla,
// que llega despues del equipo. Listar a cada jugador como "athlete" ayuda a
// que Google asocie su nombre con esta pagina, ya que no tienen URL propia.
function injectTeamJsonLd(team, players) {
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
    },
    athlete: players.map((p) => ({
      '@type': 'Person',
      name: `${p.first_name} ${p.last_name}`,
      ...(p.position ? { jobTitle: p.position } : {})
    }))
  });
  document.head.appendChild(ldJson);
}

async function loadSalarySummary(teamId) {
  const pill = document.getElementById('salary-pill');
  try {
    const res = await fetch(`/api/teams/${teamId}/salary-summary`);
    const data = await res.json();
    if (!data.hasData) {
      pill.textContent = t('team_payroll_no_data');
      return;
    }
    const capSpaceLabel = data.capSpace >= 0
      ? `${formatMoney(data.capSpace)} ${t('common_cap_room')}`
      : `${formatMoney(Math.abs(data.capSpace))} ${t('common_over_cap')}`;
    pill.textContent = `${t('team_payroll_label')} ${formatMoney(data.totalPayroll)} · ${capSpaceLabel}`;
  } catch (err) {
    pill.textContent = t('team_payroll_unavailable');
  }
}

async function loadTeam() {
  const teamId = getTeamId();
  const container = document.getElementById('roster-container');

  if (!teamId) {
    document.getElementById('team-hero').innerHTML = `<h1>${t('team_not_specified')}</h1>`;
    return;
  }

  try {
    // Equipo y plantilla no dependen entre si: pedirlos en paralelo en vez
    // de uno detras de otro ahorra un viaje de red completo.
    const [teamRes, playersRes] = await Promise.all([
      fetch(`/api/teams/${teamId}`),
      fetch(`/api/teams/${teamId}/players`)
    ]);
    const team = teamRes.ok ? await teamRes.json() : null;
    renderHero(team, teamId);

    const players = await playersRes.json();

    if (!players.length) {
      container.innerHTML = `<p class="state-msg">${t('team_no_players')}</p>`;
      return;
    }

    // De mayor a menor valoracion 2K; los que no tienen valoracion van al
    // final, ordenados por apellido entre ellos.
    players.sort((a, b) => {
      if (a.rating2k != null && b.rating2k != null) return b.rating2k - a.rating2k;
      if (a.rating2k != null) return -1;
      if (b.rating2k != null) return 1;
      return a.last_name.localeCompare(b.last_name);
    });
    if (team) injectTeamJsonLd(team, players);

    container.innerHTML = players.map((p) => `
      <a class="player-card" href="${playerUrl(p)}">
        <div class="player-jersey">${p.jersey_number ? '#' + p.jersey_number : '—'}</div>
        <div style="flex:1">
          <div class="player-name">${p.first_name} ${p.last_name}</div>
          <div class="player-meta">${p.position || t('common_no_data')}${p.height ? ' · ' + p.height : ''}${p.weight ? ' · ' + p.weight + ' lb' : ''}${p.birthYear ? ' · ' + p.birthYear : ''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${p.rating2k ? `<span class="pill" style="padding:2px 8px;font-size:0.7rem;color:${rating2kColor(p.rating2k)};border-color:${rating2kColor(p.rating2k)}66">${p.rating2k}</span>` : ''}
          ${p.salary ? `<div class="player-meta" style="font-weight:700;color:var(--accent)">${formatMoney(p.salary)}</div>` : ''}
        </div>
      </a>
    `).join('');

    document.getElementById('team-ad-slot').innerHTML = renderAdSlot('teamFooter');
    activateAdSlots();
  } catch (err) {
    container.innerHTML = `<p class="error-msg">${t('team_roster_error')}</p>`;
  }
}

loadTeam();
