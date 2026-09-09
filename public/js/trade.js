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

let allTeams = [];
let nextSlotId = 1;
let slots = [];

function emptySlot() {
  return {
    id: nextSlotId++,
    team: null,
    roster: [],
    rosterLoading: false,
    salarySummary: null,
    outgoing: new Set(),
    destinations: new Map() // playerId -> slotId, solo se usa con 3+ equipos
  };
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

function toggleOutgoing(slotId, playerId) {
  const slot = slots.find((s) => s.id === slotId);
  if (slot.outgoing.has(playerId)) {
    slot.outgoing.delete(playerId);
    slot.destinations.delete(playerId);
  } else {
    slot.outgoing.add(playerId);
    // Con solo 2 equipos el destino es siempre "el otro"; con 3+ hay que
    // elegirlo a mano, asi que se deja sin asignar por defecto.
    if (slots.length === MIN_TRADE_TEAMS) {
      const dest = otherSlots(slotId)[0];
      if (dest) slot.destinations.set(playerId, dest.id);
    }
  }
  render();
}

function setDestination(slotId, playerId, destSlotId) {
  const slot = slots.find((s) => s.id === slotId);
  if (destSlotId) {
    slot.destinations.set(playerId, Number(destSlotId));
  } else {
    slot.destinations.delete(playerId);
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

  const incomingPlayers = [];
  for (const other of otherSlots(slot.id)) {
    for (const p of other.roster) {
      if (!other.outgoing.has(p.id)) continue;
      const dest = slots.length === MIN_TRADE_TEAMS ? otherSlots(other.id)[0]?.id : other.destinations.get(p.id);
      if (dest === slot.id) incomingPlayers.push({ player: p, from: other.team });
    }
  }

  const outgoingSalary = outgoingPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
  const incomingSalary = incomingPlayers.reduce((sum, ip) => sum + (ip.player.salary || 0), 0);
  const hasUnknownSalary = outgoingPlayers.some((p) => p.salary == null) || incomingPlayers.some((ip) => ip.player.salary == null);

  const hasActivity = outgoingPlayers.length > 0 || incomingPlayers.length > 0;
  const hasPayrollData = Boolean(slot.salarySummary && slot.salarySummary.hasData);

  let legal = null;
  let maxIncoming = null;
  let newPayroll = null;
  if (hasActivity && hasPayrollData) {
    maxIncoming = maxIncomingSalary(slot.salarySummary.capSpace, outgoingSalary);
    legal = incomingSalary <= maxIncoming;
    newPayroll = slot.salarySummary.totalPayroll - outgoingSalary + incomingSalary;
  }

  return { outgoingPlayers, incomingPlayers, outgoingSalary, incomingSalary, hasUnknownSalary, hasActivity, hasPayrollData, legal, maxIncoming, newPayroll };
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
      <option value="">Elige un equipo…</option>
      ${options}
    </select>
  `;
}

function renderRosterRow(slot, p) {
  const checked = slot.outgoing.has(p.id);
  const showDestination = checked && slots.length > MIN_TRADE_TEAMS;
  const destOptions = otherSlots(slot.id)
    .filter((s) => s.team)
    .map((s) => `<option value="${s.id}" ${slot.destinations.get(p.id) === s.id ? 'selected' : ''}>${displayAbbr(s.team.abbreviation)}</option>`)
    .join('');

  return `
    <div class="trade-player-row ${checked ? 'is-outgoing' : ''}">
      <label>
        <input type="checkbox" class="trade-player-check" data-slot="${slot.id}" data-player="${p.id}" ${checked ? 'checked' : ''}>
        <span class="trade-player-info">
          <span class="player-name">${p.first_name} ${p.last_name}</span>
          <span class="player-meta">${p.position || 'N/D'}${p.jersey_number ? ' · #' + p.jersey_number : ''}</span>
        </span>
        <span class="trade-player-salary">${p.salary ? formatMoney(p.salary) : 'Sin datos'}</span>
      </label>
      ${showDestination ? `
        <select class="pill trade-dest-select" data-slot="${slot.id}" data-player="${p.id}">
          <option value="">¿A quién va?</option>
          ${destOptions}
        </select>
      ` : ''}
    </div>
  `;
}

function renderTeamSlot(slot) {
  const canRemove = slots.length > MIN_TRADE_TEAMS;
  const removeBtn = canRemove ? `<button class="pill trade-remove-btn" data-slot="${slot.id}" type="button">Quitar</button>` : '';

  if (!slot.team) {
    return `
      <div class="trade-team-card trade-team-card-empty">
        ${removeBtn}
        <p class="state-msg">Sin equipo</p>
        ${renderTeamPicker(slot)}
      </div>
    `;
  }

  const capLabel = slot.salarySummary && slot.salarySummary.hasData
    ? (slot.salarySummary.capSpace >= 0
      ? `${formatMoney(slot.salarySummary.capSpace)} de margen`
      : `${formatMoney(Math.abs(slot.salarySummary.capSpace))} por encima del tope`)
    : 'sin datos de nómina';

  const rosterHtml = slot.rosterLoading
    ? '<p class="state-msg">Cargando plantilla...</p>'
    : (slot.roster.length
      ? `<div class="trade-roster-list">${slot.roster.map((p) => renderRosterRow(slot, p)).join('')}</div>`
      : '<p class="state-msg">Sin jugadores cacheados.</p>');

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
      ${rosterHtml}
    </div>
  `;
}

function renderMovementsSummary() {
  const movements = [];
  for (const slot of slots) {
    if (!slot.team) continue;
    for (const p of slot.roster) {
      if (!slot.outgoing.has(p.id)) continue;
      const destId = slots.length === MIN_TRADE_TEAMS ? otherSlots(slot.id)[0]?.id : slot.destinations.get(p.id);
      const destSlot = slots.find((s) => s.id === destId);
      movements.push({ player: p, from: slot.team, to: destSlot ? destSlot.team : null });
    }
  }
  if (!movements.length) return '';

  return `
    <div class="trade-movements">
      ${movements.map((m) => `
        <div class="trade-movement">
          <span class="player-name">${m.player.first_name} ${m.player.last_name}</span>
          <span class="player-meta">${displayAbbr(m.from.abbreviation)} → ${m.to ? displayAbbr(m.to.abbreviation) : '¿?'}</span>
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
        <p class="player-meta">Sin cambios en este traspaso.</p>
      </div>
    `;
  }

  const verdictHtml = !r.hasPayrollData
    ? '<span class="pill trade-verdict-unknown">Sin datos de nómina</span>'
    : (r.legal
      ? '<span class="pill trade-verdict-ok">Cuadra en salario</span>'
      : '<span class="pill trade-verdict-fail">No cuadra en salario</span>');

  return `
    <div class="trade-result-card">
      <div class="trade-result-head">${logoImgOrBadge(slot.team.abbreviation, 24)}<span class="team-name">${displayAbbr(slot.team.abbreviation)}</span>${verdictHtml}</div>
      <div class="trade-result-rows">
        <div><span class="player-meta">Sale</span><b>${formatMoney(r.outgoingSalary)}</b></div>
        <div><span class="player-meta">Entra</span><b>${formatMoney(r.incomingSalary)}</b></div>
        ${r.hasPayrollData ? `
          <div><span class="player-meta">Margen permitido</span><b>${formatMoney(r.maxIncoming)}</b></div>
          <div><span class="player-meta">Nómina resultante</span><b>${formatMoney(r.newPayroll)}</b></div>
        ` : ''}
      </div>
      ${r.hasUnknownSalary ? '<p class="player-meta">Incluye algún jugador sin salario conocido (contado como 0$).</p>' : ''}
    </div>
  `;
}

function renderSummary() {
  const wrap = document.getElementById('trade-summary');
  const teamsChosen = slots.filter((s) => s.team);
  const anyActivity = slots.some((s) => s.outgoing.size > 0);

  if (teamsChosen.length < MIN_TRADE_TEAMS || !anyActivity) {
    wrap.innerHTML = '<p class="state-msg">Elige los equipos y marca qué jugadores salen de cada plantilla para simular el traspaso.</p>';
    return;
  }

  const unresolved = unresolvedDestinationsCount();
  const unresolvedWarning = unresolved > 0
    ? `<p class="error-msg">Falta asignar el destino de ${unresolved} jugador${unresolved > 1 ? 'es' : ''}.</p>`
    : '';

  wrap.innerHTML = `
    <h2 style="font-size:1.1rem;margin:24px 0 8px">Movimientos</h2>
    ${renderMovementsSummary()}
    ${unresolvedWarning}
    <h2 style="font-size:1.1rem;margin:24px 0 8px">¿Cuadra el traspaso?</h2>
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
    cb.addEventListener('change', (e) => toggleOutgoing(Number(e.target.dataset.slot), Number(e.target.dataset.player)));
  });
  document.querySelectorAll('.trade-dest-select').forEach((sel) => {
    sel.addEventListener('change', (e) => setDestination(Number(e.target.dataset.slot), Number(e.target.dataset.player), e.target.value));
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
    const res = await fetch('/api/teams');
    allTeams = (await res.json()).slice().sort((a, b) => a.full_name.localeCompare(b.full_name));
  } catch (err) {
    document.getElementById('trade-teams').innerHTML = '<p class="error-msg">No se pudieron cargar los equipos.</p>';
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
