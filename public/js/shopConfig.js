// Configuracion de la Tienda (enlaces de afiliado). Rellena esto en cuanto
// tengas cuenta aprobada en un programa de afiliados (Fanatics Affiliate
// Program, Amazon Asociados, NBA Store, etc.) y pega tus enlaces reales de
// seguimiento en el campo "url" de cada producto. Mientras tanto, los
// enlaces van directos al producto real (funcionan, pero sin comision para
// ti hasta que sean enlaces de afiliado de verdad).
//
// No mostramos precio: cambia constantemente en la tienda del vendedor y no
// tenemos forma honesta de mantenerlo actualizado sin acceso a la API de
// afiliados de cada tienda (ver conversacion/README). Las imagenes si son
// reales, tomadas directamente de la ficha de producto de cada tienda.
const SHOP_CATEGORIES = [
  {
    name: 'Camisetas oficiales',
    items: [
      { title: 'Camiseta Icon Edition', desc: 'Réplica oficial de la camiseta de juego', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/new-york-knicks/jalen-brunson-new-york-knicks-nike-unisex-swingman-jersey-icon-edition-blue/o-1392+t-47148575+p-49244155688+z-9-648011915', image: 'https://rio.frgimages.com/new-york-knicks/unisex-nike-jalen-brunson-blue-new-york-knicks-swingman-jersey-icon-edition_ss5_p-5270594+u-wjkmhasdp9s5wwzt2bmb+v-vsc8v0podzqmoive9ewb.jpg?_hv=2&w=400' },
      { title: 'Camiseta Statement Edition', desc: 'Segunda equipación de tu equipo', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/new-york-knicks/jalen-brunson-new-york-knicks-jordan-brand-unisex-swingman-jersey-statement-edition-black/o-3503+t-36582953+p-2411577656558+z-9-3150873249', image: 'https://rio.frgimages.com/new-york-knicks/unisex-jordan-brand-jalen-brunson-black-new-york-knicks-swingman-jersey-statement-edition_ss5_p-202926206+u-ldhosdioii4f3ycr0tpw+v-zus7pxhgobwwhazdm6bl.jpg?_hv=2&w=400' },
      { title: 'Camiseta Association Edition', desc: 'Equipación local clásica', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/new-york-knicks/new-york-knicks-fanatics-youth-2026-nba-finals-fast-break-replica-custom-jersey-association-edition-white/o-1325+t-25693020+p-3500362376647+z-9-3918311213', image: 'https://rio.frgimages.com/new-york-knicks/youth-fanatics-white-new-york-knicks-2026-nba-finals-fast-break-replica-custom-jersey-association-edition_ss5_p-203164484+u-9sdduqrjqclbb16iblqm+v-5m7iqnd6sodlygod9luf.jpg?_hv=2&w=400' },
      { title: 'Camisetas retro/vintage', desc: 'Diseños de temporadas pasadas', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/new-york-knicks/carmelo-anthony-new-york-knicks-mitchell-and-ness-2010/11-hardwood-classics-authentic-jersey-blue/o-8058+t-58470720+p-683335040058+z-8-2986303825', image: 'https://rio.frgimages.com/new-york-knicks/mens-mitchell-and-ness-carmelo-anthony-blue-new-york-knicks-2010/11-hardwood-classics-authentic-jersey_ss5_p-202295656+u-xhydpkorefq6ia9rkit6+v-55xhpnjke2rgmum0qzfg.jpg?_hv=2&w=400' }
    ]
  },
  {
    name: 'Calzado',
    items: [
      { title: 'Zapatillas de firma autografiadas', desc: 'Piezas de colección firmadas por jugadores', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/boston-celtics/jayson-tatum-boston-celtics-autographed-fanatics-authentic-yellow-jordan-brand-tatum-4-basketball-shoes/o-3581+t-81259497+p-0244707525135+z-9-3031013647', image: 'https://rio.frgimages.com/boston-celtics/jayson-tatum-boston-celtics-autographed-yellow-jordan-brand-tatum-4-basketball-shoes_ss5_p-203897316+u-hhxmuuqltibgqzjrqe3a+v-z63s4hyeybvanaghcsny.jpg?_hv=2&w=400' },
      { title: 'Zapatillas de baloncesto casual', desc: 'Para calle y para pista', retailer: 'Fanatics', url: 'https://www.fanatics.com/college/kansas-jayhawks/kansas-jayhawks-adidas-unisex-centennial-85-low-basketball-shoes-royal/red/o-27+t-45960219+p-91774580344133+z-9-2380934025', image: 'https://rio.frgimages.com/kansas-jayhawks/unisex-adidas-royal/red-kansas-jayhawks-centennial-85-low-basketball-shoes_ss5_p-201212743+u-atz5zjflm703nvwp2gxi+v-ve21tiu4zpi4gpyvolqm.jpg?_hv=2&w=400' }
    ]
  },
  {
    name: 'Gorras y sombreros',
    items: [
      { title: 'Gorra snapback', desc: 'Escudo bordado de tu equipo', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/new-york-knicks/new-york-knicks-new-era-2-tone-9fifty-adjustable-snapback-hat-black/blue/o-1358+t-81702975+p-57524761118+z-9-745788042', image: 'https://rio.frgimages.com/new-york-knicks/mens-new-era-black/blue-new-york-knicks-2-tone-9fifty-adjustable-snapback-hat_pi2735000_ff_2735060_full.jpg?_hv=2&w=400' },
      { title: 'Gorra fitted 59FIFTY', desc: 'El clásico ajustado de New Era', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/new-york-knicks/new-york-knicks-new-era-official-team-color-59fifty-fitted-hat-black/o-3558+t-81925208+p-46506256610+z-9-2570124739', image: 'https://rio.frgimages.com/new-york-knicks/mens-new-era-black-new-york-knicks-official-team-color-59fifty-fitted-hat_pi2561000_ff_2561362_full.jpg?_hv=2&w=400' }
    ]
  },
  {
    name: 'Balones y equipación de juego',
    items: [
      { title: 'Balón oficial Wilson', desc: 'El balón oficial de la NBA', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/logo-gear/fanatics-authentic-unsigned-wilson-nba-official-game-basketball/o-2425+t-92038544+p-9378625747+z-8-1781096265', image: 'https://rio.frgimages.com/logo-gear/unsigned-wilson-nba-official-game-basketball_ss5_p-4163557+u-68gy7duiuzwkghj6im5z+v-9w9l8rouxfs0sbzmnpcl.jpg?_hv=2&w=400' },
      { title: 'Balón Wilson Authentic Series', desc: 'Versión indoor/outdoor', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/logo-gear/wilson-nba-authentic-series-indoor/outdoor-basketball/o-2481+t-81472977+p-93902847736+z-9-3406331266', image: 'https://rio.frgimages.com/logo-gear/wilson-nba-authentic-series-indoor/outdoor-basketball_ss5_p-4163558+u-bapsfa3lt57gkfobxhh0+v-htiyx1ezhqglogwnesi3.jpg?_hv=2&w=400' }
    ]
  },
  {
    name: 'Coleccionismo',
    items: [
      { title: 'Cartas Panini NBA', desc: 'Cartas oficiales de la temporada actual', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/golden-state-warriors/stephen-curry-golden-state-warriors-2024-25-panini-revolution-kaboom-number-3-psa-authenticated-8-card/o-4692+t-58814096+p-914448404663+z-8-3220091803', image: 'https://rio.frgimages.com/golden-state-warriors/stephen-curry-golden-state-warriors-2024-25-panini-revolution-kaboom-number-3-psa-authenticated-8-card_ss5_p-204019824+u-xe4lpvijxp3ixzgv6d4q+v-dnqw0egpbcj1de3dpgfe.jpg?_hv=2&w=400' },
      { title: 'Memorabilia autografiada', desc: 'Piezas certificadas de coleccionista', retailer: 'Fanatics', url: 'https://www.fanatics.com/nba/dallas-mavericks/luka-don%C4%8Di%C4%87-dallas-mavericks-autographed-2024-25-panini-eminence-game-winners-emerald-diamond-gem-number-gw-luk-number-2/3-psa-authenticated-10/10-card/o-3503+t-58475170+p-7900041275291+z-9-3062618646', image: 'https://rio.frgimages.com/dallas-mavericks/luka-don%C4%8Di%C4%87-dallas-mavericks-autographed-2024-25-panini-eminence-game-winners-emerald-diamond-gem-number-gw-luk-number-2/3-psa-authenticated-10/10-card_ss5_p-204145756+u-cwvptamrmhirk7clpnvt+v-88g1z6geayary8dm3bmm.jpg?_hv=2&w=400' }
    ]
  },
  {
    name: 'Videojuegos',
    items: [
      { title: 'NBA 2K27', desc: 'La última entrega del videojuego', retailer: 'Amazon', url: 'https://www.amazon.com/dp/B0H9Z71PJK', image: 'https://m.media-amazon.com/images/I/81uApUmA8RL._AC_UY218_.jpg' }
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
            ${item.image ? `<img class="shop-tile-img" src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.remove()">` : ''}
            <span class="shop-tile-retailer">${item.retailer}</span>
            <span class="shop-tile-title">${item.title}</span>
            <span class="shop-tile-desc">${item.desc}</span>
            <span class="shop-tile-cta">Ver producto →</span>
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}
