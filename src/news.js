const Parser = require('rss-parser');

// Marca usa media:content (extension no estandar); enclosure y content lo
// parsea rss-parser de serie.
const parser = new Parser({
  timeout: 20000,
  customFields: {
    item: [['media:content', 'mediaContent', { keepArray: false }]]
  }
});

// Feeds RSS de noticias de NBA en español
const FEEDS = [
  { name: 'Marca', url: 'https://www.marca.com/rss/baloncesto/nba.xml' },
  { name: 'Mundo Deportivo', url: 'https://www.mundodeportivo.com/rss/baloncesto/nba.xml' },
  { name: 'Gigantes del Basket', url: 'https://www.gigantes.com/nba/feed/' }
];

// Cada medio trae la imagen de portada de una forma distinta: Marca via
// media:content, Mundo Deportivo via enclosure, Gigantes (WordPress) la
// incrusta como primer <img> dentro del contenido.
function extractImage(item) {
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  const match = (item.content || '').match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

async function fetchFeed(feed, retries = 1) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || [])
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title,
        link: item.link,
        source: feed.name,
        pubDate: item.pubDate || item.isoDate || null,
        summary: (item.contentSnippet || item.summary || '').slice(0, 280),
        image: extractImage(item)
      }));
  } catch (err) {
    if (retries > 0) return fetchFeed(feed, retries - 1);
    console.error(`[news] fallo al leer feed ${feed.name}: ${err.message}`);
    return [];
  }
}

async function fetchAllNews() {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const merged = results.flat();

  const seen = new Set();
  const deduped = merged.filter((item) => {
    const key = item.link || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  return deduped.slice(0, 120);
}

module.exports = { fetchAllNews };
