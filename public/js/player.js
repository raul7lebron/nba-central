// La URL lleva el nombre por SEO (/jugador/lebron-james-237) pero lo unico
// que usamos es el id al final; el resto del slug es cosmetico.
function getPlayerIdFromUrl() {
  const match = window.location.pathname.match(/(\d+)\/?$/);
  return match ? match[1] : null;
}

function updateSeoForPlayer(player) {
  const teamPart = player.currentTeam ? ` (${player.currentTeam.full_name})` : '';
  const title = `${player.first_name} ${player.last_name}${teamPart} - Estadísticas y contrato NBA | El Rompearos`;
  const description = player.isActive
    ? `Estadísticas NBA, contrato y valoración 2K de ${player.first_name} ${player.last_name}, jugador de baloncesto de ${player.currentTeam ? player.currentTeam.full_name : 'la NBA'}.`
    : `Estadísticas de toda la carrera NBA de ${player.first_name} ${player.last_name}.`;

  document.title = title;
  document.getElementById('page-title').textContent = title;
  document.getElementById('meta-description').setAttribute('content', description);
  document.getElementById('og-title').setAttribute('content', title);
  document.getElementById('og-description').setAttribute('content', description);

  const canonicalUrl = `https://www.elrompearos.com${playerUrl(player)}`;
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
    '@type': 'Person',
    name: `${player.first_name} ${player.last_name}`,
    jobTitle: player.position || undefined,
    image: player.photoUrl || undefined,
    memberOf: player.currentTeam
      ? { '@type': 'SportsTeam', name: player.currentTeam.full_name }
      : undefined
  });
  document.head.appendChild(ldJson);
}

// Premios individuales (MVP, All-Star, quinteto defensivo, rookie del año),
// vía Wikidata (ver src/birthYear.js). No todos los jugadores tienen ficha
// en Wikidata o premios registrados ahí; si no hay ninguno, no se muestra
// nada en vez de una fila de pills vacía.
function renderAwardPills(awards) {
  if (!awards) return '';
  const items = [];
  if (awards.mvp > 0) items.push(`🏆 ${awards.mvp > 1 ? awards.mvp + '× ' : ''}MVP`);
  if (awards.allStar > 0) items.push(`⭐ ${awards.allStar}× All-Star`);
  if (awards.allDefensive > 0) items.push(`🛡️ ${awards.allDefensive}× Quinteto defensivo`);
  if (awards.rookieOfYear > 0) items.push('🌱 Rookie del año');
  if (!items.length) return '';

  return `
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
      ${items.map((t) => `<span class="pill" style="border-color:var(--accent);color:var(--accent)">${t}</span>`).join('')}
    </div>
  `;
}

function renderPlayerHero(player) {
  const heroEl = document.getElementById('player-hero');
  const teamLine = player.currentTeam
    ? `<a class="pill" href="/team.html?id=${player.currentTeam.id}">${logoImgOrBadge(player.currentTeam.abbreviation, 18)} ${displayAbbr(player.currentTeam.abbreviation)}</a>`
    : '<span class="pill">Sin equipo actual</span>';

  const draftPill = player.draft_year
    ? `<span class="pill">Draft ${player.draft_year} · Ronda ${player.draft_round} · Pick nº${player.draft_number}</span>`
    : '<span class="pill">No drafteado</span>';

  const ratingPill = player.isActive && player.rating2k
    ? `<span class="pill">2K: <span style="color:${rating2kColor(player.rating2k)};font-weight:700">${player.rating2k}</span></span>`
    : (!player.isActive && player.peakRating2k
      ? `<span class="pill">Mejor 2K de su carrera: <span style="color:${rating2kColor(player.peakRating2k)};font-weight:700">${player.peakRating2k}</span></span>`
      : '');

  const salaryPill = player.isActive && player.salary
    ? `<span class="pill">Salario ${formatMoney(player.salary)} (temporada actual)</span>`
    : '';

  // Foto libre de Wikimedia Commons, vía Wikidata (ver src/birthYear.js). No
  // todos los jugadores tienen una; si no hay o falla al cargar, se omite
  // en vez de mostrar un hueco roto. Sin loading="lazy": es la imagen
  // principal de la pagina, siempre visible nada mas cargar (candidata a
  // LCP) — diferirla solo la haria mas lenta, al reves de lo que "lazy"
  // deberia conseguir.
  const photoHtml = player.photoUrl
    ? `<img class="player-photo" src="${player.photoUrl}" alt="${player.first_name} ${player.last_name}" width="120" height="120" fetchpriority="high" onerror="this.remove()">`
    : '';

  heroEl.innerHTML = `
    ${photoHtml}
    <div style="flex:1">
      <h1>${player.first_name} ${player.last_name}</h1>
      <div class="player-meta">${player.position || 'N/D'} · ${player.height || ''} · ${player.weight ? player.weight + ' lb' : ''}${player.birthYear ? ' · ' + player.birthYear : ''}${player.isActive ? '' : ' · Retirado/inactivo'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
        ${teamLine}
        ${draftPill}
        ${ratingPill}
        ${salaryPill}
      </div>
      ${renderAwardPills(player.awards)}
    </div>
  `;
}

// Migas de pan (Inicio > Equipos > Equipo > Nombre, o sin el equipo si no
// se conoce) + su JSON-LD, para que Google pueda mostrar la ruta en el
// resultado de busqueda.
function updateBreadcrumb(player) {
  const nav = document.getElementById('breadcrumb');
  if (!nav) return;

  const crumbs = [
    { name: 'Inicio', url: 'https://www.elrompearos.com/', href: '/index.html' },
    { name: 'Equipos', url: 'https://www.elrompearos.com/teams.html', href: '/teams.html' }
  ];
  if (player.currentTeam) {
    crumbs.push({
      name: player.currentTeam.full_name,
      url: `https://www.elrompearos.com/team.html?id=${player.currentTeam.id}`,
      href: `/team.html?id=${player.currentTeam.id}`
    });
  }
  const playerName = `${player.first_name} ${player.last_name}`;

  nav.innerHTML = crumbs.map((c) =>
    `<a href="${c.href}">${c.name}</a> <span class="sep" aria-hidden="true">/</span>`
  ).join('') + `<span aria-current="page">${playerName}</span>`;

  const ldJson = document.createElement('script');
  ldJson.type = 'application/ld+json';
  ldJson.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ...crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
      { '@type': 'ListItem', position: crumbs.length + 1, name: playerName, item: `https://www.elrompearos.com${playerUrl(player)}` }
    ]
  });
  document.head.appendChild(ldJson);
}

function renderPlayerContract(player) {
  const el = document.getElementById('player-contract');
  if (!player.contract || !player.contract.length) return;
  el.innerHTML = `<h2>Contrato</h2>${renderContractTable(player.contract, player.salary)}`;
}

async function renderPlayerStats(player) {
  const el = document.getElementById('player-stats');
  el.innerHTML = `
    <h2>${player.isActive ? 'Estadísticas por temporada' : 'Estadísticas de toda su carrera'}</h2>
    <div id="player-stats-body"><p class="state-msg">Cargando estadísticas...</p></div>
  `;
  const body = document.getElementById('player-stats-body');

  try {
    const endpoint = player.isActive
      ? `/api/players/${player.id}/stats`
      : `/api/players/${player.id}/career-stats?fromYear=${player.draft_year || ''}`;
    const res = await fetch(endpoint);
    if (res.status === 402) {
      const data = await res.json();
      body.innerHTML = `<p class="error-msg">${data.error}</p>`;
      return;
    }
    const data = await res.json();
    body.innerHTML = renderStatsTable(data.history);
  } catch (err) {
    body.innerHTML = '<p class="error-msg">No se pudieron cargar las estadísticas.</p>';
  }
}

async function loadPlayer() {
  const playerId = getPlayerIdFromUrl();
  if (!playerId) {
    document.getElementById('player-hero').innerHTML = '<h1>Jugador no especificado</h1>';
    return;
  }

  try {
    const res = await fetch(`/api/players/${playerId}`);
    if (res.status === 404) {
      document.getElementById('player-hero').innerHTML = '<h1>Jugador no encontrado</h1>';
      return;
    }
    const player = await res.json();

    updateSeoForPlayer(player);
    updateBreadcrumb(player);
    renderPlayerHero(player);
    renderPlayerStats(player);
    renderPlayerContract(player);

    document.getElementById('player-ad-slot').innerHTML = renderAdSlot('teamFooter');
    activateAdSlots();
  } catch (err) {
    document.getElementById('player-hero').innerHTML = '<p class="error-msg">No se pudo cargar el jugador.</p>';
  }
}

loadPlayer();
