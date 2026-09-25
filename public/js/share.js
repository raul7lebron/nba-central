// Botones de compartir. Solo se usan en paginas propias (jugador, equipo,
// partido) enlazando de vuelta a elrompearos.com: compartir una noticia
// solo re-comparte el enlace del medio original (Marca, AS...), no trae
// trafico de vuelta, asi que no se ponen ahi.
function buildShareUrls(url, title) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  };
}

function renderShareButtons(url, title) {
  const urls = buildShareUrls(url, title);
  return `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px">
      <span class="player-meta">Compartir:</span>
      <a class="pill" href="${urls.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="pill" href="${urls.twitter}" target="_blank" rel="noopener">X</a>
      <a class="pill" href="${urls.facebook}" target="_blank" rel="noopener">Facebook</a>
    </div>
  `;
}
