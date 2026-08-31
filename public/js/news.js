function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

async function loadNews() {
  const container = document.getElementById('news-container');
  try {
    const res = await fetch('/api/news');
    const news = await res.json();

    if (!news.length) {
      container.innerHTML = '<p class="state-msg">Todavía no hay noticias cacheadas. Vuelve en unos minutos.</p>';
      return;
    }

    const NEWS_PER_AD = 6;
    container.innerHTML = news.map((item, i) => `
      ${i > 0 && i % NEWS_PER_AD === 0 ? renderAdSlot('newsInline') : ''}
      <a class="news-item" href="${item.link}" target="_blank" rel="noopener noreferrer">
        ${item.image ? `<img class="news-thumb" src="${item.image}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div class="news-body">
          <span class="news-source">${item.source}</span>
          <div class="news-title">${item.title}</div>
          <div class="news-summary">${item.summary || ''}</div>
          <div class="news-date">${formatDate(item.pubDate)}</div>
        </div>
      </a>
    `).join('');
    activateAdSlots();
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudieron cargar las noticias.</p>';
  }
}

loadNews();
