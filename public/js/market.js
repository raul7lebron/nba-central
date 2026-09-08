function escapeAttr(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// Igual que en news.js: son noticias de medios externos, el schema las
// describe como NewsArticle con su propio editor real, no como contenido
// propio. Limitado a 20 para no meter un bloque enorme.
function injectNewsJsonLd(items) {
  const existing = document.getElementById('news-jsonld');
  if (existing) existing.remove();
  if (!items.length) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'news-jsonld';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.slice(0, 20).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'NewsArticle',
        headline: item.title,
        image: item.image || undefined,
        datePublished: item.pubDate || undefined,
        url: item.link,
        publisher: { '@type': 'Organization', name: item.source }
      }
    }))
  });
  document.head.appendChild(script);
}

async function loadMarket() {
  const container = document.getElementById('market-container');
  try {
    const res = await fetch('/api/transactions');
    const items = await res.json();

    if (!items.length) {
      container.innerHTML = '<p class="state-msg">Todavía no se ha detectado ningún fichaje o traspaso. El archivo se va llenando solo con cada actualización de noticias.</p>';
      return;
    }

    const NEWS_PER_AD = 6;
    container.innerHTML = items.map((item, i) => `
      ${i > 0 && i % NEWS_PER_AD === 0 ? renderAdSlot('newsInline') : ''}
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
    `).join('');
    activateAdSlots();
    injectNewsJsonLd(items);
  } catch (err) {
    container.innerHTML = '<p class="error-msg">No se pudo cargar el mercado.</p>';
  }
}

loadMarket();
