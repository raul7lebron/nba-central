# El Rompearos

Web con los 30 equipos de la NBA, sus plantillas, estadísticas de jugadores
(temporada actual e históricas) y una portada de noticias agregadas de varios
medios. Los datos se refrescan automáticamente cada día mediante tareas cron
internas del servidor.

## 1. Configurar la clave de la API

Las estadísticas y plantillas vienen de [balldontlie.io](https://www.balldontlie.io).

1. Regístrate gratis en https://www.balldontlie.io (botón "Sign up" / "My Account").
2. Copia tu API key.
3. Copia `.env.example` a `.env` y pega la clave:

```bash
cp .env.example .env
```

```
BALLDONTLIE_API_KEY=tu_clave_aqui
```

> Importante: el plan **gratuito** de balldontlie.io solo da acceso a equipos y
> al historial completo de jugadores (incluye retirados). Para mostrar la
> **plantilla actual** (`/players/active`) y las **estadísticas** por
> temporada (`/season_averages`) hace falta el plan de pago **ALL-STAR** o
> superior (~$9.99/mes). Con el plan gratuito, la plantilla de cada equipo
> mostrará a todos los jugadores que ha tenido alguna vez, y al hacer click en
> un jugador verás un aviso de que hace falta actualizar el plan.

## 2. Instalar dependencias

```bash
npm install
```

## 3. Arrancar el servidor

```bash
npm start
```

Abre http://localhost:3000

En el primer arranque, si no hay datos cacheados en `data/`, el servidor hace
un refresco inicial automáticamente (puede tardar varios minutos por el
límite de peticiones por minuto de la API).

## 4. Actualización automática

Mientras el proceso `npm start` esté corriendo, tres tareas programadas
(`node-cron`) se encargan de mantener los datos al día:

- **06:00 cada día**: refresca equipos, plantillas y noticias.
- **Cada 30 minutos**: refresca solo noticias.
- **Domingos 07:00**: refresca salarios, valoraciones 2K y el archivo de
  draft (todos cambian poco, no hace falta más frecuencia).

Si quieres forzar un refresco manual sin esperar al cron:

```bash
npm run refresh            # equipos + plantillas + noticias
node src/refreshAll.js salaries   # solo salarios
```

## 5. Salarios, historia del equipo y noticias por equipo

- **Salarios y margen salarial**: balldontlie solo los da en su plan más caro
  (GOAT). En su lugar se obtienen de [HoopsHype](https://hoopshype.com/salaries/),
  que publica los mismos datos de contratos en abierto (están incrustados como
  JSON en cada página de equipo). Se guardan en `data/salaries.json` y se cruzan
  con la plantilla por nombre de jugador.
- **Margen salarial**: se calcula como tope salarial NBA 2025-26
  ($154.647M, fijado por la liga) menos la suma de contratos del equipo. El
  tope es una cifra fija de temporada — hay que actualizarla a mano en
  `src/salaries.js` (`LEAGUE_SALARY_CAP_2025_26`) cuando la NBA anuncie el
  nuevo tope cada verano.
- **Año de fundación y campeonatos**: no existen en ninguna API conectada, así
  que están en una tabla estática en `src/teamInfo.js`, verificada a fecha de
  la temporada 2024-25. Si un equipo gana un título nuevo, hay que sumarlo ahí
  a mano.
- **Noticias del equipo**: el botón "Noticias del equipo" en la página de
  plantilla filtra la caché de noticias por el apodo del equipo (ej.
  "Lakers"). No hace falta una fuente nueva, reutiliza `data/news.json`.
- **Entrenador**: no se ha implementado. Ni balldontlie ni HoopsHype tienen
  esta información, y no hay otra fuente conectada. Si consigues acceso a una
  API que sí la tenga (ej. SportsData.io, API-Sports), se puede integrar.

## 6. Clasificación y calendario

- **Clasificación por conferencias** (`/standings.html`): balldontlie solo da
  el endpoint `/standings` en el plan GOAT. En su lugar se calcula a mano
  (`src/standings.js`) a partir de los resultados de `/games` (plan ALL-STAR),
  sumando victorias/derrotas de temporada regular. Se excluyen los partidos de
  playoffs y los de la fase eliminatoria de la NBA Cup (cuartos, semifinal y
  final del torneo no cuentan para el récord; la fase de grupos sí). Un
  selector arriba permite ver temporadas anteriores (desde 1980); cada
  temporada se cachea la primera vez que se pide y ya no cambia si está
  terminada.
- **Calendario** (`/calendar.html`): lista los partidos de la temporada
  elegida agrupados por fecha, con resultado si ya se jugó, filtrable por
  equipo. **No incluye el canal de TV**: NBA.com sí publica esa información,
  pero la carga con JavaScript detrás de protección anti-bots (Akamai), así
  que no hay forma fiable de obtenerla sin un scraper pesado y frágil
  (decisión tomada conscientemente, no es un olvido).
- Ambas páginas comparten la caché `data/games_<temporada>.json`. La
  temporada en curso se refresca en el cron diario de las 06:00; las
  temporadas ya terminadas no hace falta refrescarlas nunca.

## 7. Playoffs, draft y mercado de fichajes

- **Playoffs** (`/playoffs.html`): balldontlie no da "series" ni "ronda", solo
  partidos sueltos marcados `postseason:true`. `src/playoffs.js` los agrupa
  por el par de equipos enfrentados (cada par = una serie) y deduce la ronda
  por orden cronológico (en un bracket de 16 equipos, primera ronda = las 8
  series que empiezan antes, y así sucesivamente). Selector de temporada
  igual que en clasificación/calendario. Verificado contra resultados reales
  (2023-24: Celtics campeones batiendo a Mavericks 4-1, exacto).
- **Draft** (`/draft.html`): tampoco hay filtro por año de draft en la API.
  `refreshDraftArchive()` (cron semanal) descarga el historial COMPLETO de
  jugadores de los 30 equipos (no solo `/active`) y se queda con los que
  tengan `draft_year`, deduplicando por id de jugador. Cubre desde 1947 hasta
  el año actual. El "equipo actual" que se muestra junto a cada pick es el
  equipo más reciente del jugador según balldontlie, **no necesariamente el
  que lo drafteó** (la API no guarda ese dato por separado) — se avisa en el
  pie de página.
- **Mercado de fichajes** (`/market.html`): no existe ninguna API gratuita de
  transacciones (ni balldontlie ni NBA.com la exponen sin scraping pesado
  contra protección anti-bots). En su lugar, `src/transactions.js` reutiliza
  las mismas noticias de Marca/AS/Mundo Deportivo/Sport/Gigantes del Basket y detecta
  por palabras clave ("ficha", "traspaso", "firma con", etc.) cuáles hablan de
  fichajes. Cada refresco de noticias (cada 2h) añade las nuevas coincidencias
  a un archivo acumulado de 6 meses (`data/transactions.json`), podando lo más
  antiguo. Es una aproximación por palabras clave, no un registro oficial de
  transacciones — puede haber ruido o huecos. Como el archivo solo empieza a
  acumular desde que se activó esta función, tardará 6 meses reales en cubrir
  la ventana completa.

## 8. Valoración NBA 2K y publicidad

- **Valoración 2K**: viene de [nba2kapi.com](https://www.nba2kapi.com), una
  API gratuita dedicada a esto (hace falta registrarse y añadir
  `NBA2KAPI_KEY` en `.env`). El endpoint `/players/bulk` trae también cartas
  clásicas/de colección (ej. "1992-93 Chicago Bulls"); se filtra por
  `teamType === 'curr'` para quedarnos solo con la carta de la plantilla
  vigente. Se refresca en el cron semanal junto con salarios y draft.
- **Publicidad (Google AdSense)**: preparado en `public/js/ads.js`, pero
  **vacío por defecto** — Google no sirve anuncios en localhost y hace falta
  una cuenta de AdSense aprobada. Hay tres huecos reservados: dentro del
  listado de noticias/mercado (cada 6 elementos), al final de la plantilla de
  cada equipo, y un hueco vertical fijo a la derecha en todas las páginas
  (se oculta en pantallas de menos de 1500px para no molestar). En cuanto
  tengas tu ID de editor (`ca-pub-...`) y los IDs de bloque, rellena
  `ADSENSE_CONFIG` en `public/js/ads.js` y los huecos se activan solos.

## 9. Tienda de afiliados

`/store.html`: catálogo de camisetas, calzado, gorras, balones, coleccionismo
y videojuegos con enlaces a Fanatics, NBA Store y Amazon
(`public/js/shopConfig.js`). Son enlaces de afiliado genéricos (sin tu ID de
seguimiento todavía): en cuanto tengas cuenta aprobada en el programa de
afiliados correspondiente, sustituye el campo `url` de cada producto por tu
enlace de seguimiento real. La página incluye un aviso de afiliación
(`.affiliate-disclosure`) — es obligatorio por ley y por las condiciones de
los propios programas de afiliados; no lo quites.

## 10. SEO

- **Metadatos**: las 9 páginas tienen `<title>` y `<meta name="description">`
  únicos y orientados a búsqueda, más Open Graph y Twitter Card para que se
  vean bien al compartir. La página de plantilla (`team.html`) actualiza su
  título/descripción por JavaScript en cuanto sabe qué equipo es (30
  variantes reales en vez de un título genérico repetido).
- **Datos estructurados (JSON-LD)**: `WebSite` en la portada, `SportsTeam`
  inyectado por JS en cada página de equipo.
- **robots.txt y sitemap.xml**: `public/robots.txt` y la ruta dinámica
  `/sitemap.xml` (en `server.js`, incluye las 8 páginas fijas + las 30 de
  equipo). **Antes de publicar, cambia `TU-DOMINIO.com`** en `robots.txt` y
  en la variable de entorno `SITE_URL` — un sitemap apuntando a un dominio
  que no es el tuyo no sirve de nada a los buscadores.
- **Rendimiento**: los logos de equipo cargan con `loading="lazy"` y
  `width`/`height` fijos para evitar saltos de layout (Core Web Vitals).
- **Limitación importante y honesta**: esta web renderiza el contenido con
  JavaScript en el navegador (fetch + innerHTML), no en el servidor. Google
  consigue indexarla porque ejecuta JavaScript, pero Bing y otros motores lo
  hacen peor, y el HTML inicial que ve cualquier bot está casi vacío de
  contenido real. Para competir de verdad con sitios como NBA.com o ESPN
  (que sí renderizan en servidor) haría falta migrar a un framework con SSR
  (Next.js, Astro, etc.) — es un cambio de arquitectura grande, no un ajuste
  de SEO. Lo de aquí es el máximo razonable sin llegar a eso.

## 11. Desplegar en un servicio real

Este proyecto es una app Node.js estándar (Express), así que puedes desplegarla
en Render, Railway, un VPS con PM2, etc. Recuerda:

- Configurar las variables de entorno `BALLDONTLIE_API_KEY`, `NBA2KAPI_KEY` y
  `SITE_URL` (tu dominio real, para el sitemap) en el panel del hosting.
- Si tu hosting permite disco persistente (ej. Render Disks), móntalo y
  añade la variable `DATA_DIR` apuntando a esa ruta (ej. `/var/data`). Así la
  caché de `data/*.json` sobrevive a los redeploys en vez de rehacerse desde
  cero cada vez (ver `src/cache.js`).
- El proceso debe quedarse corriendo de forma continua (no serverless "one-shot")
  para que los cron internos se ejecuten. Si tu hosting es serverless, sustituye
  `src/scheduler.js` por un cron externo de la plataforma que llame a
  `npm run refresh`.

## Estructura

```
server.js             Servidor Express y rutas /api/*
src/balldontlie.js     Cliente de la API de equipos/jugadores/stats/partidos
src/standings.js       Cálculo de clasificación a partir de /games
src/playoffs.js        Reconstrucción de series/rondas de playoffs
src/salaries.js        Scraper de contratos de HoopsHype + tope salarial
src/ratings2k.js        Cliente de nba2kapi.com (valoraciones NBA 2K)
src/teamInfo.js         Tabla estática de fundación/campeonatos por equipo
src/news.js             Agregador de RSS (Marca, AS, Mundo Deportivo, Sport, Gigantes del Basket)
src/transactions.js     Detección de fichajes/traspasos por palabras clave
src/refreshAll.js       Lógica de refresco de toda la caché
src/scheduler.js        Tareas cron internas
src/cache.js            Lectura/escritura de la caché en data/*.json
public/js/ads.js        Configuración y huecos de Google AdSense
public/                 Frontend (HTML/CSS/JS vanilla)
```
