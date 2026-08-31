// Configuracion de la Tienda (enlaces de afiliado). Rellena esto en cuanto
// tengas cuenta aprobada en un programa de afiliados (Fanatics Affiliate
// Program, Amazon Asociados, NBA Store, etc.) y pega tus enlaces reales de
// seguimiento en el campo "url" de cada producto. Mientras tanto, los
// enlaces van directos a la categoria de la tienda (funcionan, pero sin
// comision para ti hasta que sean enlaces de afiliado de verdad).
const SHOP_CATEGORIES = [
  {
    name: 'Camisetas oficiales',
    items: [
      { title: 'Camiseta Icon Edition', desc: 'Réplica oficial de la camiseta de juego', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/jerseys/' },
      { title: 'Camiseta Statement Edition', desc: 'Segunda equipación de tu equipo', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/jerseys/' },
      { title: 'Camiseta Association Edition', desc: 'Equipación local clásica', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/jerseys/' },
      { title: 'Camisetas retro/vintage', desc: 'Diseños de temporadas pasadas', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/vintage/' }
    ]
  },
  {
    name: 'Calzado',
    items: [
      { title: 'Zapatillas de firma', desc: 'Modelos de tus jugadores favoritos', retailer: 'NBA Store', url: 'https://store.nba.com/footwear/' },
      { title: 'Zapatillas de baloncesto casual', desc: 'Para calle y para pista', retailer: 'NBA Store', url: 'https://store.nba.com/footwear/' }
    ]
  },
  {
    name: 'Gorras y sombreros',
    items: [
      { title: 'Gorra snapback', desc: 'Escudo bordado de tu equipo', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/hats/' },
      { title: 'Gorro de invierno', desc: 'Ideal para la temporada fría', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/hats/' }
    ]
  },
  {
    name: 'Balones y equipación de juego',
    items: [
      { title: 'Balón oficial Wilson', desc: 'El balón oficial de la NBA', retailer: 'NBA Store', url: 'https://store.nba.com/basketballs/' },
      { title: 'Balón de edición de equipo', desc: 'Con los colores de tu franquicia', retailer: 'NBA Store', url: 'https://store.nba.com/basketballs/' }
    ]
  },
  {
    name: 'Coleccionismo',
    items: [
      { title: 'Cartas Panini NBA', desc: 'Sobres y cajas de la temporada actual', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/trading-cards/' },
      { title: 'Memorabilia autografiada', desc: 'Piezas certificadas de coleccionista', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/autographed/' }
    ]
  },
  {
    name: 'Videojuegos',
    items: [
      { title: 'NBA 2K27', desc: 'La última entrega del videojuego', retailer: 'Amazon', url: 'https://www.amazon.com/s?k=NBA+2K27' }
    ]
  }
];

function buildShopGrid() {
  return SHOP_CATEGORIES.map((cat) => `
    <div style="margin-bottom:28px">
      <h3 style="margin-bottom:12px">${cat.name}</h3>
      <div class="shop-grid">
        ${cat.items.map((item) => `
          <a class="shop-tile" href="${item.url}" target="_blank" rel="sponsored noopener noreferrer">
            <span class="shop-tile-retailer">${item.retailer}</span>
            <span class="shop-tile-title">${item.title}</span>
            <span class="shop-tile-desc">${item.desc}</span>
            <span class="shop-tile-cta">Ver oferta →</span>
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}
