// No existe ninguna API gratuita de fichajes/traspasos (ni balldontlie ni
// NBA.com la exponen sin scraping pesado y fragil contra proteccion anti-bots).
// En su lugar, se reutilizan las noticias que ya tenemos (Marca, Mundo
// Deportivo, Gigantes del Basket) y se filtran las que hablan de mercado de
// fichajes por palabras clave. Es una aproximacion, no un registro oficial:
// puede haber falsos positivos/negativos.

const KEYWORDS = [
  'ficha', 'fichaje', 'fichan', 'traspasa', 'traspaso', 'traspasan',
  'firma con', 'firma un', 'acuerdo con', 'se compromete', 'waive', 'cortan a',
  'corta a', 'extensión', 'extension', 'agente libre', 'sign-and-trade',
  'envían a', 'envian a', 'canjean', 'intercambian', 'renueva', 'contrato con',
  'nuevo equipo', 'rescinde'
];

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

function isTransactionNews(item) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return KEYWORDS.some((kw) => text.includes(kw));
}

function updateTransactionsArchive(existingArchive, freshNews) {
  const now = Date.now();
  const cutoff = now - SIX_MONTHS_MS;

  const candidates = freshNews.filter(isTransactionNews);
  const merged = [...existingArchive, ...candidates];

  const seen = new Set();
  const deduped = merged.filter((item) => {
    const key = item.link || item.title;
    const pubTime = new Date(item.pubDate || 0).getTime();
    if (!key || seen.has(key)) return false;
    if (pubTime && pubTime < cutoff) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  return deduped;
}

module.exports = { isTransactionNews, updateTransactionsArchive };
