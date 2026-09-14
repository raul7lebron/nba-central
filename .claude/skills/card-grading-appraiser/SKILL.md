---
name: card-grading-appraiser
description: Analiza fotos o escaneos de cartas coleccionables — deportivas, Magic: The Gathering, Pokémon TCG, Dragon Ball, One Piece Card Game y Yu-Gi-Oh! — para dos cosas — (1) estimar su grado de conservación siguiendo los criterios usados por PSA y Beckett/BGS (centrado, esquinas, bordes y superficie), y (2) detectar señales visuales de que la carta pueda ser falsa/reimpresa/alterada, aplicando además las señales específicas de falsificación de cada juego/marca. Usa esta skill siempre que el usuario suba imágenes de una carta y pida "gradearla", "valorarla", "puntuarla", pregunte en qué estado está, cuánto podría sacar en PSA/BGS, o mencione "gradeado", "grading", "centrado", "esquinas", "condición de la carta". También úsala cuando pregunte si una carta "es falsa", "es auténtica", "es original", "es una reimpresión/bootleg/custom", quiera verificar antes de comprar/vender, o compare el estado de varias cartas para decidir cuál gradear — sea una carta deportiva o de Magic, Pokémon, Dragon Ball, One Piece o Yu-Gi-Oh!.
---

# Card Grading Appraiser

Esta skill convierte a Claude en un asistente de pre-gradeo: analiza imágenes (escaneadas o fotografiadas) de una carta coleccionable, hace una primera criba de autenticidad, y produce una estimación razonada de la nota que probablemente le daría PSA y la que le daría Beckett/BGS, siguiendo de cerca —pero sin sustituir— los criterios reales que usan esas empresas.

**Funciona en 6 modos**, uno por cada tipo de carta, porque las señales de falsificación cambian mucho de un juego/marca a otro: **Deportivas**, **Magic: The Gathering**, **Pokémon TCG**, **Dragon Ball**, **One Piece Card Game** y **Yu-Gi-Oh!**. El primer paso del flujo siempre es determinar en qué modo estás.

**Antes de gradear, siempre pasa primero por el chequeo de autenticidad (paso 3).** No tiene sentido estimar una nota de conservación sobre una carta que probablemente no es genuina — en ese caso el aviso de autenticidad debe ir primero y con más peso que la nota de grading.

**Importante — deja esto claro siempre al usuario, al principio o al final del informe:** esto es una estimación visual basada en fotos, no un gradeado oficial. PSA y Beckett usan lupas, luz cruzada, a veces UV, y manipulan la carta físicamente (peso, rigidez, autenticidad del papel/holograma). Una foto no puede detectar todo eso, así que la nota real puede variar ±1 punto o más respecto a la estimación.

## Flujo de trabajo

### 1. Identifica el modo (tipo de carta)

Antes de nada, determina cuál de los 6 modos aplica. Si el usuario ya lo dice explícitamente ("es una carta de Pokémon", "esto es de Magic"), úsalo directamente. Si no, identifícalo por el diseño del reverso o el arte/logo del frente en la imagen:

| Modo | Pistas típicas del reverso/logo |
|------|----------------------------------|
| **Deportivas** | Logo de la liga/marca (NBA, MLB, Topps, Panini, Upper Deck...), foto de jugador, sin reglas de juego impresas. |
| **Magic: The Gathering** | Reverso azul con el emblema central de Wizards of the Coast y "Magic: the gathering" en la parte superior. |
| **Pokémon TCG** | Reverso azul/dorado con la Pokéball grande centrada y "Pokémon" en la parte superior. |
| **Dragon Ball** | Varias líneas posibles (Bandai Super Card Game/Fusion World, Carddass, Panini, DBZ CCG antiguo) — si no es evidente, pregunta cuál. |
| **One Piece Card Game** | Reverso azul marino con la silueta del Going Merry y "ONE PIECE CARD GAME". |
| **Yu-Gi-Oh!** | Reverso marrón/bronce con el Rompecabezas del Milenio (Millennium Puzzle) y "Yu-Gi-Oh!" en la parte superior. |

Si tras mirar la imagen sigue sin estar claro (p. ej. carta muy antigua, foto solo del frente, o un juego que no encaja en ninguno de los 6), pregúntaselo directamente al usuario antes de continuar — el resto del análisis de autenticidad depende de saber el modo correcto.

### 2. Pide (o valida) las imágenes correctas

Si el usuario ya subió imágenes, revísalas. Si no, o si son insuficientes, pide:

- **Foto/escaneo del FRENTE**, plana, ocupando el máximo del encuadre, sin flash directo (evita brillos que tapen rayones), con buena luz uniforme.
- **Foto/escaneo del DORSO**, en las mismas condiciones.
- Idealmente, resolución alta y la carta bien enfocada de esquina a esquina.
- Si el usuario tiene un escáner plano, es preferible a foto de móvil: reduce distorsión de perspectiva, que arruina la medición de centrado.

Si las fotos están borrosas, cortadas, con mucho brillo o en ángulo, dilo explícitamente y explica que el análisis de centrado y bordes será menos fiable.

**Pide también, si el usuario puede conseguirlas (mejoran mucho la precisión):**

- 2-4 **fotos macro de las esquinas** que se vean más dudosas en la foto general (con lente macro de clip para móvil, o recorte/zoom digital de una foto en máxima resolución). Esto sustituye en gran parte a la lupa del grader.
- Si las fotos generales están iluminadas de frente, sugiere repetir con **luz rasante/lateral** (casi al ras de la carta): así los rayones y abolladuras proyectan sombra y se ven mucho mejor — esto pesa más que la lupa para juzgar la superficie.
- Una **foto bajo luz UV** (una linterna UV económica sirve), si el usuario tiene una o le preocupa la autenticidad/alteraciones. Bajo UV, el papel original reacciona distinto al papel recortado, reimpreso o retocado con pegamento.
- Para Magic, Pokémon y Yu-Gi-Oh! en concreto, si al usuario le preocupa la autenticidad, pídele además que haga la **prueba de la luz** descrita en la ficha del modo correspondiente (sujetar la carta a contraluz) y te describa o fotografíe el resultado — es una de las pruebas más fiables en esos tres juegos y no se puede deducir de una foto normal bajo luz ambiente.

No es necesario tener todo esto para dar una estimación — con frente + dorso normales ya se puede analizar. Pero si el usuario solo pregunta "¿cómo mejoro la precisión?" o sube fotos de mala calidad, ofrécele este equipo básico (lente macro barata, escáner a 600-1200 DPI, linterna UV barata) como la forma más económica de acercarse a lo que hace un grader real sin comprar equipo profesional.

### 3. Verificación de autenticidad (hazlo SIEMPRE, antes de gradear)

Objetivo: dar un veredicto de confianza (no una certeza absoluta) sobre si la carta parece genuina, sospechosa, o probable reimpresión/falsificación. Aplica siempre las señales generales de abajo, **y además** las señales específicas del modo identificado en el paso 1 (tabla al final de esta sección).

Revisa estas señales generales, comparando cuando puedas con imágenes conocidas de la misma carta auténtica (busca en la web una referencia si no la tienes en memoria):

**Impresión y color**
- Amplía digitalmente (zoom/recorte) zonas de texto pequeño y logos: en una impresión offset genuina el texto es nítido y sólido; en muchas falsificaciones (impresas por inkjet/láser doméstico o impresión digital barata) verás un patrón de puntos (moiré/dithering) visible al ampliar, o bordes de letra "serrados".
- Compara la saturación y tono de color con fotos de referencia de la misma carta: colores apagados, virados (ej. verdes que se ven azulados) o demasiado saturados son señal de alerta.
- Tipografía: fuentes ligeramente distintas, mal alineadas, con kerning raro, o logos de la marca/liga con proporciones incorrectas.

**Cartulina y corte**
- Grosor y rigidez que el usuario pueda describir o mostrar de canto: muchas falsificaciones son notablemente más finas, más flexibles, o al revés, más gruesas/rígidas que el estándar de esa marca/año.
- Color del "core" (capa interna) visible en el canto si la carta está algo desgastada: en varias marcas antiguas el interior es de un color característico (ej. negro/gris en ciertas marcas deportivas clásicas); un interior blanco donde se esperaría otro color es señal de alerta, aunque esto varía por fabricante y año — coméntalo como pista, no como prueba definitiva.
- Corte de los bordes: un corte perfectamente recto, sin la mínima variación, en una carta que debería tener décadas, puede indicar recorte/guillotinado posterior o reimpresión moderna.

**Acabados especiales (holograma, foil, textura)**
- Si la carta original de ese set lleva holograma, sello de autenticidad o foil: revisa si el patrón, color y ubicación coinciden con referencias conocidas. Foils "planos" sin el efecto de difracción esperado, o colocados en posición distinta a la habitual, son sospechosos.
- Texturas especiales (ej. "refractor", relieve): compara si el efecto se ve consistente con ejemplos auténticos o si parece una textura genérica aplicada por encima.

**Luz UV (si el usuario aportó foto bajo UV)**
- El papel/cartulina original suele reaccionar de forma consistente y uniforme bajo UV; zonas que brillan distinto al resto (parches, retoques, pegamento, recortes pegados) son la señal más útil que puedes leer ahí.
- Sin foto UV, no afirmes nada sobre alteraciones — dilo explícitamente como "no verificable con las fotos disponibles".

**Señales específicas por modo**

Consulta y aplica siempre el fichero de referencia del modo detectado en el paso 1, además de las señales generales de arriba:

| Modo | Fichero de referencia |
|------|------------------------|
| Deportivas | `references/authenticity-deportivas.md` |
| Magic: The Gathering | `references/authenticity-magic.md` |
| Pokémon TCG | `references/authenticity-pokemon.md` |
| Dragon Ball | `references/authenticity-dragonball.md` |
| One Piece Card Game | `references/authenticity-onepiece.md` |
| Yu-Gi-Oh! | `references/authenticity-yugioh.md` |

**Veredicto final de autenticidad**

Da uno de estos tres niveles, con el motivo:
- 🟢 **Sin señales de alerta** — nada de lo revisable por imagen resulta sospechoso (aclara que esto no es una autenticación formal).
- 🟡 **Señales dudosas, mereceria revisión adicional** — enumera exactamente qué te hace dudar y qué comprobaría un experto o un servicio de autenticación que tú no puedes verificar por foto.
- 🔴 **Señales claras de falsificación/reimpresión** — enumera las señales concretas encontradas.

Si el veredicto es 🟡 o 🔴, dilo con claridad al principio de tu respuesta, antes de cualquier nota de grading, y recomienda no comprar/vender/enviar a gradear la carta como si fuera genuina hasta confirmarlo por otra vía (comparación física con un experto, envío directo a PSA/BGS, que ya rechazan cartas no auténticas en el propio proceso).

Para Dragon Ball y One Piece Card Game en particular, hay mucha menos documentación pública sobre falsificaciones que para Pokémon, Magic o Yu-Gi-Oh! (mercados más recientes o menos masivos) — sé más conservador con el veredicto 🔴 en esos dos modos salvo que el defecto de impresión sea muy evidente, y dilo explícitamente si tu confianza es menor por esta razón.

### 4. Analiza el CENTRADO (Centering)

- Mide visualmente los márgenes del borde exterior de la imagen impresa respecto al borde físico de la carta, en las 4 direcciones (arriba/abajo, izquierda/derecha), tanto en el frente como en el dorso.
- Expresa el resultado como proporción aproximada, por ejemplo "55/45" o "70/30".
- Ten en cuenta que PSA es más permisivo con el dorso (normalmente hasta 75/25 no penaliza tanto) que con el frente.
- Un centrado perfecto o casi perfecto (50/50 a 55/45) es requisito casi obligatorio para las notas máximas (PSA 10 / BGS 9.5-10 "Black Label").

### 5. Analiza las ESQUINAS (Corners)

Revisa las 4 esquinas del frente y las 4 del dorso (8 en total) buscando:

- Redondeo del vértice (corner rounding)
- Blanqueamiento o desgaste de la tinta en la punta (corner whitening/fraying)
- Golpes o dobleces sutiles

Da un veredicto por esquina si hay diferencias notables (ej. "esquina superior izquierda del frente con ligero whitening; el resto impecables"), no solo un promedio genérico.

### 6. Analiza los BORDES (Edges)

Recorre los 4 bordes (no las esquinas) del frente y del dorso buscando:

- Desportillados o mellas (chipping)
- Rugosidad o "peeling" de la capa superficial
- Manchas de color en el canto que delaten el papel base

### 7. Analiza la SUPERFICIE (Surface)

Busca en toda la cara frontal y dorsal:

- Rayones (surface scratches) — especialmente visibles en cartas con acabado brillante/foil
- Líneas de impresión (print lines) de fábrica
- Manchas, huellas, residuos de pegamento o polvo
- Golpes o abolladuras (indentations, a veces solo visibles a contraluz)
- Para cartas con foil/holograma: describe si hay peeling o burbujas

### 8. Traduce el análisis a notas — PSA

Usa la escala de referencia en `references/psa-scale.md` para situar la carta en la escala 1-10 de PSA. Es la misma escala numérica para los 6 modos (deportivas y TCG) — PSA gradea todos estos juegos con el mismo criterio de centrado/esquinas/bordes/superficie. Ten en cuenta que PSA da **una sola nota final**, no reflejan un subgrado por categoría — la nota final es un juicio holístico, pero dominado por el peor de los 4 aspectos si es muy marcado (ej. una esquina muy dañada limita el máximo aunque el resto esté perfecto).

Da:
- Nota estimada (puede ser un rango, ej. "PSA 7-8")
- El factor que más la está limitando ("lo que más baja la nota es el centrado del frente, ~65/35")
- Qué tendría que mejorar para subir un punto

### 9. Traduce el análisis a notas — Beckett / BGS

Usa `references/beckett-scale.md`. A diferencia de PSA, Beckett/BGS **sí da 4 subgrados explícitos** (Centering, Corners, Edges, Surface, cada uno en escala 1-10 con incrementos de 0.5) y luego una nota final que generalmente es cercana al promedio ponderado del subgrado más bajo, no una media simple. Igual que con PSA, esta escala aplica por igual a los 6 modos.

Da:
- Los 4 subgrados estimados individualmente
- La nota final BGS estimada
- Indica si calificaría para "Black Label" (BGS 10 en las 4 categorías — extremadamente raro)

### 10. Presenta el informe final

Formato recomendado (ajústalo si el usuario pide algo más breve). El veredicto de autenticidad va siempre primero:

```
CARTA: [identifícala si puedes leerla: jugador/personaje, set, año, número]
MODO: [Deportivas / Magic: The Gathering / Pokémon TCG / Dragon Ball / One Piece Card Game / Yu-Gi-Oh!]

AUTENTICIDAD: 🟢/🟡/🔴 [veredicto + motivo breve]

CENTRADO   — Frente: XX/XX | Dorso: XX/XX
ESQUINAS   — [resumen de las 8]
BORDES     — [resumen]
SUPERFICIE — [resumen]

→ Estimación PSA: X (rango X-X)
→ Estimación BGS: X.X  (Centrado X.X / Esquinas X.X / Bordes X.X / Superficie X.X)

Factor limitante principal: [...]
Qué haría falta para subir de nota: [...]

⚠️ Estimación visual, no gradeado oficial ni autenticación formal. La nota real de PSA/Beckett puede variar, y PSA/BGS rechazan y no gradean cartas que detectan como no auténticas en su propio proceso.
```

Si el veredicto de autenticidad es 🔴, puedes omitir o abreviar mucho la parte de grading (no tiene sentido detallar el "estado de conservación" de algo que probablemente no es la carta original) y centra la respuesta en explicar las señales encontradas.

Si el usuario sube varias cartas y pregunta cuál merece la pena enviar a gradear, ordénalas por nota estimada y menciona el coste-beneficio típico (cartas de bajo valor rara vez compensan el coste de envío a gradeo, independientemente del grado). Si son de modos distintos entre sí (ej. una de Pokémon y otra deportiva), acláralo en el listado.

## Notas para Claude sobre limitaciones reales del análisis por imagen

- La detección de falsificación por foto es probabilística, no una autenticación formal: nunca digas "es falsa, 100% seguro" ni "es auténtica, garantizado" — usa siempre "señales de alerta encontradas/no encontradas" y remite a autenticación física o al propio proceso de PSA/BGS para la certeza final.
- Prioriza el chequeo de autenticidad por encima del grading en la respuesta: un usuario que está a punto de comprar o vender una carta necesita saber primero si es sospechosa, antes que su nota de conservación.
- La resolución y el ángulo de la foto limitan mucho la fiabilidad tanto del centrado como de la detección de falsificación (moiré de impresión, por ejemplo, solo se ve bien con buen zoom); sé explícito sobre el margen de error en vez de dar una cifra o veredicto falsamente precisos.
- No confundas los modos ni apliques señales de un juego a otro (ej. la prueba de la luz de Magic/Pokémon/Yu-Gi-Oh! no tiene el mismo significado en una carta deportiva de cartón grueso normal) — si dudas del modo correcto, pregunta antes de dar un veredicto de autenticidad.
- Nunca prometas que la carta "sacará" una nota exacta en el envío real, ni que "pasará" o "no pasará" la autenticación real — usa siempre lenguaje de estimación/rango y probabilidad.
- Esta skill es para proteger al usuario (comprador, vendedor o coleccionista) de un posible engaño — no la uses nunca para ayudar a alguien a mejorar o perfeccionar una falsificación existente ni a evadir la detección de un servicio de gradeo real; si el contexto de la conversación apunta claramente a eso, no continúes con esa parte de la petición.
