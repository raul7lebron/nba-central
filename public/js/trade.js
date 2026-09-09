// Simulador de traspasos: 2 a 4 equipos, cada uno con su plantilla real
// (via /api/teams/:id/players, que ya trae el salario) y su nomina resumen
// (via /api/teams/:id/salary-summary, que ya trae el tope y el margen).
// No hace falta ningun endpoint nuevo en el servidor.

const MAX_TRADE_TEAMS = 4;
const MIN_TRADE_TEAMS = 2;

// Umbrales de la regla de emparejamiento salarial de la NBA (version
// simplificada, sin impuesto de lujo/aprons/excepciones especiales). Sirven
// tanto para saber cuanto puede ENTRAR un equipo por encima del tope como
// para el aviso legal de la pagina.
const SALARY_MATCH_LOW_THRESHOLD = 6_533_000;
const SALARY_MATCH_MID_THRESHOLD = 19_600_000;

// Cuantos drafts futuros se ofrecen como ficha para incluir en un traspaso.
// No hay ninguna fuente de datos de derechos de elecciones ya traspasadas
// (protecciones, swaps, picks ya cedidos en traspasos anteriores): se
// generan siempre las elecciones propias de 1ª y 2ª ronda del equipo, como
// simplificacion.
const FUTURE_DRAFT_YEARS_AHEAD = 5;

let allTeams = [];
let currentSeason = null;
let nextSlotId = 1;
let slots = [];

function emptySlot() {
  return {
    id: nextSlotId++,
    team: null,
    roster: [],
    picks: [],
    rosterLoading: false,
    salarySummary: null,
    outgoing: new Set(),
    destinations: new Map() // assetId (id de jugador o de eleccion) -> slotId, solo se usa con 3+ equipos
  };
}

// Elecciones de draft de los proximos años (1ª y 2ª ronda) que el equipo
// puede ofrecer en el traspaso. Son solo una ficha de referencia: no
// afectan al calculo de salario ni modelan protecciones o swaps de picks.
function futurePicksForTeam(team) {
  if (!currentSeason) return [];
  const picks = [];
  for (let i = 1; i <= FUTURE_DRAFT_YEARS_AHEAD; i++) {
    const year = currentSeason + i;
    for (const round of [1, 2]) {
      const roundLabel = round === 1 ? t('trade_pick_round1') : t('trade_pick_round2');
      picks.push({ id: `pick-${team.id}-${year}-${round}`, label: `${roundLabel} ${year}` });
    }
  }
  return picks;
}

// Los ids de jugador son numericos; los de eleccion son texto
// ("pick-<equipo>-<año>-<ronda>"). Los atributos data-* del DOM llegan
// siempre como string, asi que hay que distinguirlos al leerlos de vuelta.
function parseAssetId(raw) {
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

function teamsInUse(exceptSlotId) {
  return new Set(
    slots.filter((s) => s.id !== exceptSlotId && s.team).map((s) => s.team.id)
  );
}

function otherSlots(slotId) {
  return slots.filter((s) => s.id !== slotId);
}

async function selectTeam(slotId, teamId) {
  const slot = slots.find((s) => s.id === slotId);
  const team = allTeams.find((t) => String(t.id) === String(teamId)) || null;
  slot.team = team;
  slot.roster = [];
  slot.picks = team ? futurePicksForTeam(team) : [];
  slot.outgoing = new Set();
  slot.salarySummary = null;
  slot.rosterLoading = Boolean(team);
  render();
  if (!team) return;

  try {
    const [playersRes, salaryRes] = await Promise.all([
      fetch(`/api/teams/${team.id}/players`),
      fetch(`/api/teams/${team.id}/salary-summary`)
    ]);
    const players = await playersRes.json();
    const salarySummary = await salaryRes.json();
    // El equipo pudo cambiar (o el hueco pudo borrarse) mientras esperabamos
    // la respuesta; si ya no es este equipo, se descarta para no pisar una
    // seleccion mas reciente.
    if (slot.team !== team) return;
    slot.roster = players
      .slice()
      .sort((a, b) => (b.salary || 0) - (a.salary || 0) || a.last_name.localeCompare(b.last_name));
    slot.salarySummary = salarySummary;
  } catch (err) {
    slot.roster = [];
  } finally {
    slot.rosterLoading = false;
    render();
  }
}

function toggleOutgoing(slotId, assetId) {
  const slot = slots.find((s) => s.id === slotId);
  if (slot.outgoing.has(assetId)) {
    slot.outgoing.delete(assetId);
    slot.destinations.delete(assetId);
  } else {
    slot.outgoing.add(assetId);
    // Con solo 2 equipos el destino es siempre "el otro"; con 3+ hay que
    // elegirlo a mano, asi que se deja sin asignar por defecto.
    if (slots.length === MIN_TRADE_TEAMS) {
      const dest = otherSlots(slotId)[0];
      if (dest) slot.destinations.set(assetId, dest.id);
    }
  }
  render();
}

function setDestination(slotId, assetId, destSlotId) {
  const slot = slots.find((s) => s.id === slotId);
  if (destSlotId) {
    slot.destinations.set(assetId, Number(destSlotId));
  } else {
    slot.destinations.delete(assetId);
  }
  render();
}

function addTeamSlot() {
  if (slots.length >= MAX_TRADE_TEAMS) return;
  slots.push(emptySlot());
  render();
}

function removeTeamSlot(slotId) {
  if (slots.length <= MIN_TRADE_TEAMS) return;
  slots = slots.filter((s) => s.id !== slotId);
  // Cualquier jugador que fuera hacia el equipo eliminado se queda sin
  // destino asignado, en vez de desaparecer del traspaso en silencio.
  for (const slot of slots) {
    for (const [playerId, destId] of slot.destinations) {
      if (destId === slotId) slot.destinations.delete(playerId);
    }
  }
  render();
}

function resetTrade() {
  slots = [emptySlot(), emptySlot()];
  render();
}

// ---------- Calculo de si el traspaso cuadra en salario ----------

// Regla simplificada del CBA: cuanto puede RECIBIR un equipo a cambio de lo
// que envia depende de si tiene hueco bajo el tope o no. Por encima del
// tope, el margen se calcula por tramos segun lo que envia.
function maxIncomingSalary(capSpaceBeforeTrade, outgoingSalary) {
  if (capSpaceBeforeTrade > 0) {
    return capSpaceBeforeTrade + outgoingSalary + 100_000;
  }
  if (outgoingSalary <= SALARY_MATCH_LOW_THRESHOLD) {
    return outgoingSalary * 2 + 250_000;
  }
  if (outgoingSalary <= SALARY_MATCH_MID_THRESHOLD) {
    return outgoingSalary + 5_000_000;
  }
  return outgoingSalary * 1.25 + 100_000;
}

function computeSlotResult(slot) {
  const outgoingPlayers = slot.roster.filter((p) => slot.outgoing.has(p.id));
  const outgoingPicks = slot.picks.filter((pk) => slot.outgoing.has(pk.id));

  const incomingPlayers = [];
  const incomingPicks = [];
  for (const other of otherSlots(slot.id)) {
    const destOf = (assetId) => (slots.length === MIN_TRADE_TEAMS ? otherSlots(other.id)[0]?.id : other.destinations.get(assetId));
    for (const p of other.roster) {
      if (!other.outgoing.has(p.id)) continue;
      if (destOf(p.id) === slot.id) incomingPlayers.push({ player: p, from: other.team });
    }
    for (const pk of other.picks) {
      if (!other.outgoing.has(pk.id)) continue;
      if (destOf(pk.id) === slot.id) incomingPicks.push({ pick: pk, from: other.team });
    }
  }

  // Las elecciones de draft no tienen salario: no cuentan para el
  // emparejamiento salarial, solo para el resumen de movimientos.
  const outgoingSalary = outgoingPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
  const incomingSalary = incomingPlayers.reduce((sum, ip) => sum + (ip.player.salary || 0), 0);
  const hasUnknownSalary = outgoingPlayers.some((p) => p.salary == null) || incomingPlayers.some((ip) => ip.player.salary == null);

  const hasActivity = outgoingPlayers.length > 0 || incomingPlayers.length > 0 || outgoingPicks.length > 0 || incomingPicks.length > 0;
  const hasPayrollData = Boolean(slot.salarySummary && slot.salarySummary.hasData);

  let legal = null;
  let maxIncoming = null;
  let newPayroll = null;
  if (hasActivity && hasPayrollData) {
    maxIncoming = maxIncomingSalary(slot.salarySummary.capSpace, outgoingSalary);
    legal = incomingSalary <= maxIncoming;
    newPayroll = slot.salarySummary.totalPayroll - outgoingSalary + incomingSalary;
  }

  return { outgoingPlayers, incomingPlayers, outgoingPicks, incomingPicks, outgoingSalary, incomingSalary, hasUnknownSalary, hasActivity, hasPayrollData, legal, maxIncoming, newPayroll };
}

function unresolvedDestinationsCount() {
  if (slots.length === MIN_TRADE_TEAMS) return 0;
  let count = 0;
  for (const slot of slots) {
    for (const playerId of slot.outgoing) {
      if (!slot.destinations.has(playerId)) count++;
    }
  }
  return count;
}

// ---------- Render ----------

function renderTeamPicker(slot) {
  const used = teamsInUse(slot.id);
  const options = allTeams
    .filter((t) => !used.has(t.id))
    .map((t) => `<option value="${t.id}">${t.full_name}</option>`)
    .join('');

  return `
    <select class="pill trade-team-select" data-slot="${slot.id}" style="width:100%;justify-content:center;cursor:pointer">
      <option value="">${t('trade_choose_team')}</option>
      ${options}
    </select>
  `;
}

function renderDestinationSelect(slot, assetId) {
  const destOptions = otherSlots(slot.id)
    .filter((s) => s.team)
    .map((s) => `<option value="${s.id}" ${slot.destinations.get(assetId) === s.id ? 'selected' : ''}>${displayAbbr(s.team.abbreviation)}</option>`)
    .join('');

  return `
    <select class="pill trade-dest-select" data-slot="${slot.id}" data-asset="${assetId}">
      <option value="">${t('trade_ask_destination')}</option>
      ${destOptions}
    </select>
  `;
}

function renderRosterRow(slot, p) {
  const checked = slot.outgoing.has(p.id);
  const showDestination = checked && slots.length > MIN_TRADE_TEAMS;

  return `
    <div class="trade-player-row ${checked ? 'is-outgoing' : ''}">
      <label>
        <input type="checkbox" class="trade-player-check" data-slot="${slot.id}" data-asset="${p.id}" ${checked ? 'checked' : ''}>
        <span class="trade-player-info">
          <span class="player-name">${p.first_name} ${p.last_name}</span>
          <span class="player-meta">${p.position || t('common_no_data')}${p.jersey_number ? ' · #' + p.jersey_number : ''}</span>
        </span>
        <span class="trade-player-salary">${p.salary ? formatMoney(p.salary) : t('trade_no_salary_data')}</span>
      </label>
      ${showDestination ? renderDestinationSelect(slot, p.id) : ''}
    </div>
  `;
}

function renderPickRow(slot, pk) {
  const checked = slot.outgoing.has(pk.id);
  const showDestination = checked && slots.length > MIN_TRADE_TEAMS;

  return `
    <div class="trade-player-row ${checked ? 'is-outgoing' : ''}">
      <label>
        <input type="checkbox" class="trade-player-check" data-slot="${slot.id}" data-asset="${pk.id}" ${checked ? 'checked' : ''}>
        <span class="trade-player-info">
          <span class="player-name">${pk.label}</span>
          <span class="player-meta">${t('trade_draft_pick_label')}</span>
        </span>
      </label>
      ${showDestination ? renderDestinationSelect(slot, pk.id) : ''}
    </div>
  `;
}

function renderTeamSlot(slot) {
  const canRemove = slots.length > MIN_TRADE_TEAMS;
  const removeBtn = canRemove ? `<button class="pill trade-remove-btn" data-slot="${slot.id}" type="button">${t('trade_remove')}</button>` : '';

  if (!slot.team) {
    return `
      <div class="trade-team-card trade-team-card-empty">
        ${removeBtn}
        <p class="state-msg">${t('trade_no_team')}</p>
        ${renderTeamPicker(slot)}
      </div>
    `;
  }

  const capLabel = slot.salarySummary && slot.salarySummary.hasData
    ? (slot.salarySummary.capSpace >= 0
      ? `${formatMoney(slot.salarySummary.capSpace)} ${t('common_cap_room')}`
      : `${formatMoney(Math.abs(slot.salarySummary.capSpace))} ${t('common_over_cap')}`)
    : t('trade_no_payroll_data');

  const rosterHtml = slot.rosterLoading
    ? `<p class="state-msg">${t('trade_roster_loading')}</p>`
    : (slot.roster.length
      ? `<div class="trade-roster-list">${slot.roster.map((p) => renderRosterRow(slot, p)).join('')}</div>`
      : `<p class="state-msg">${t('trade_no_players_cached')}</p>`);

  const picksHtml = slot.picks.length
    ? `
      <div class="trade-section-label">${t('trade_section_future_picks')}</div>
      <div class="trade-roster-list trade-picks-list">${slot.picks.map((pk) => renderPickRow(slot, pk)).join('')}</div>
    `
    : '';

  return `
    <div class="trade-team-card">
      ${removeBtn}
      <div class="trade-team-header">
        ${logoImgOrBadge(slot.team.abbreviation, 40)}
        <div>
          <div class="team-name">${slot.team.full_name}</div>
          <span class="pill" style="margin-top:4px">${capLabel}</span>
        </div>
      </div>
      ${renderTeamPicker(slot)}
      <div class="trade-section-label">${t('trade_section_squad')}</div>
      ${rosterHtml}
      ${picksHtml}
    </div>
  `;
}

function renderMovementsSummary() {
  const movements = [];
  for (const slot of slots) {
    if (!slot.team) continue;
    const assets = [
      ...slot.roster.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` })),
      ...slot.picks.map((pk) => ({ id: pk.id, name: pk.label }))
    ];
    for (const a of assets) {
      if (!slot.outgoing.has(a.id)) continue;
      const destId = slots.length === MIN_TRADE_TEAMS ? otherSlots(slot.id)[0]?.id : slot.destinations.get(a.id);
      const destSlot = slots.find((s) => s.id === destId);
      movements.push({ name: a.name, from: slot.team, to: destSlot ? destSlot.team : null });
    }
  }
  if (!movements.length) return '';

  return `
    <div class="trade-movements">
      ${movements.map((m) => `
        <div class="trade-movement">
          <span class="player-name">${m.name}</span>
          <span class="player-meta">${displayAbbr(m.from.abbreviation)} → ${m.to ? displayAbbr(m.to.abbreviation) : t('trade_unknown_destination')}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTeamResult(slot) {
  if (!slot.team) return '';
  const r = computeSlotResult(slot);
  if (!r.hasActivity) {
    return `
      <div class="trade-result-card">
        <div class="trade-result-head">${logoImgOrBadge(slot.team.abbreviation, 24)}<span class="team-name">${displayAbbr(slot.team.abbreviation)}</span></div>
        <p class="player-meta">${t('trade_no_changes')}</p>
      </div>
    `;
  }

  const verdictHtml = !r.hasPayrollData
    ? `<span class="pill trade-verdict-unknown">${t('trade_verdict_no_data')}</span>`
    : (r.legal
      ? `<span class="pill trade-verdict-ok">${t('trade_verdict_ok')}</span>`
      : `<span class="pill trade-verdict-fail">${t('trade_verdict_fail')}</span>`);

  return `
    <div class="trade-result-card">
      <div class="trade-result-head">${logoImgOrBadge(slot.team.abbreviation, 24)}<span class="team-name">${displayAbbr(slot.team.abbreviation)}</span>${verdictHtml}</div>
      <div class="trade-result-rows">
        <div><span class="player-meta">${t('trade_out_label')}</span><b>${formatMoney(r.outgoingSalary)}</b></div>
        <div><span class="player-meta">${t('trade_in_label')}</span><b>${formatMoney(r.incomingSalary)}</b></div>
        ${r.hasPayrollData ? `
          <div><span class="player-meta">${t('trade_margin_allowed')}</span><b>${formatMoney(r.maxIncoming)}</b></div>
          <div><span class="player-meta">${t('trade_resulting_payroll')}</span><b>${formatMoney(r.newPayroll)}</b></div>
        ` : ''}
      </div>
      ${r.hasUnknownSalary ? `<p class="player-meta">${t('trade_unknown_salary_note')}</p>` : ''}
      ${(r.outgoingPicks.length || r.incomingPicks.length) ? `
        <div class="trade-result-picks">
          ${r.outgoingPicks.map((pk) => `<div class="player-meta">${t('trade_gives')} ${pk.label}</div>`).join('')}
          ${r.incomingPicks.map((ip) => `<div class="player-meta">${t('trade_receives')} ${ip.pick.label} ${t('trade_from_word')} ${displayAbbr(ip.from.abbreviation)}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderSummary() {
  const wrap = document.getElementById('trade-summary');
  const teamsChosen = slots.filter((s) => s.team);
  const anyActivity = slots.some((s) => s.outgoing.size > 0);

  if (teamsChosen.length < MIN_TRADE_TEAMS || !anyActivity) {
    wrap.innerHTML = `<p class="state-msg">${t('trade_pick_teams_prompt')}</p>`;
    return;
  }

  const unresolved = unresolvedDestinationsCount();
  const unresolvedWarning = unresolved > 0
    ? `<p class="error-msg">${t(unresolved > 1 ? 'trade_missing_destination_plural' : 'trade_missing_destination_singular', { n: unresolved })}</p>`
    : '';

  wrap.innerHTML = `
    <h2 style="font-size:1.1rem;margin:24px 0 8px">${t('trade_movements_title')}</h2>
    ${renderMovementsSummary()}
    ${unresolvedWarning}
    <h2 style="font-size:1.1rem;margin:24px 0 8px">${t('trade_results_title')}</h2>
    <div class="trade-results-grid">
      ${slots.map((s) => renderTeamResult(s)).join('')}
    </div>
  `;
}

function attachSlotHandlers() {
  document.querySelectorAll('.trade-team-select').forEach((sel) => {
    sel.addEventListener('change', (e) => selectTeam(Number(e.target.dataset.slot), e.target.value));
  });
  document.querySelectorAll('.trade-player-check').forEach((cb) => {
    cb.addEventListener('change', (e) => toggleOutgoing(Number(e.target.dataset.slot), parseAssetId(e.target.dataset.asset)));
  });
  document.querySelectorAll('.trade-dest-select').forEach((sel) => {
    sel.addEventListener('change', (e) => setDestination(Number(e.target.dataset.slot), parseAssetId(e.target.dataset.asset), e.target.value));
  });
  document.querySelectorAll('.trade-remove-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => removeTeamSlot(Number(e.target.dataset.slot)));
  });
}

function render() {
  const teamsWrap = document.getElementById('trade-teams');
  teamsWrap.innerHTML = slots.map((s) => renderTeamSlot(s)).join('');
  attachSlotHandlers();

  const addBtn = document.getElementById('add-team-btn');
  addBtn.disabled = slots.length >= MAX_TRADE_TEAMS;

  renderSummary();
}

async function initTrade() {
  try {
    const [teamsRes, seasonsRes] = await Promise.all([fetch('/api/teams'), fetch('/api/seasons')]);
    allTeams = (await teamsRes.json()).slice().sort((a, b) => a.full_name.localeCompare(b.full_name));
    currentSeason = (await seasonsRes.json()).current;
  } catch (err) {
    document.getElementById('trade-teams').innerHTML = `<p class="error-msg">${t('trade_teams_error')}</p>`;
    return;
  }

  slots = [emptySlot(), emptySlot()];
  render();

  document.getElementById('trade-ad-slot').innerHTML = renderAdSlot('teamFooter');
  activateAdSlots();
}

document.getElementById('add-team-btn').addEventListener('click', addTeamSlot);
document.getElementById('reset-trade-btn').addEventListener('click', resetTrade);

initTrade();
