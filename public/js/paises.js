// Jugadores NBA agrupados por pais (activos e historicos). El servidor ya
// entrega cada pais con su lista ordenada (activos primero, luego
// retirados, cada grupo por valoracion) y con la valoracion unificada
// (2K actual si esta activo, pico historico si esta retirado): aqui solo
// hace falta pintarlo. Cada pais se pliega en un <details> porque EE.UU.
// por si solo puede tener miles de jugadores en el archivo historico.
function renderPlayerLink(p) {
  const cls = p.isActive ? 'is-active' : 'is-retired';
  const name = `${p.first_name} ${p.last_name}`;
  return `<a class="country-player ${cls}" href="${playerUrl(p)}">${name}</a>`;
}

function renderCountrySection(entry) {
  const flag = countryFlag(entry.country);
  const activeCount = entry.players.filter((p) => p.isActive).length;

  return `
    <details class="country-section">
      <summary class="country-summary">
        ${flag ? `<span class="flag">${flag}</span>` : ''}
        <span>${entry.country}</span>
        <span class="country-count">${entry.players.length} · ${activeCount} en activo</span>
      </summary>
      <div class="country-players-list">
        ${entry.players.map(renderPlayerLink).join('')}
      </div>
    </details>
  `;
}

async function loadCountries() {
  const container = document.getElementById('countries-container');
  try {
    const res = await fetch('/api/players/countries');
    const data = await res.json();

    if (!data.countries || data.countries.length === 0) {
      container.innerHTML = '<p class="state-msg">No hay datos de jugadores todavía.</p>';
      return;
    }

    container.innerHTML = data.countries.map(renderCountrySection).join('');
  } catch (err) {
    container.innerHTML = '<p class="state-msg">No se pudieron cargar los jugadores.</p>';
  }
}

loadCountries();
