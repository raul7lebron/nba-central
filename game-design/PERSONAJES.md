# Personajes — Juego estilo Rush Royale

Documento de diseño con el roster de personajes para un tower defense estilo
*Rush Royale* (unidades colocadas en una cuadrícula, atacan automáticamente a
los enemigos que avanzan por sus carriles). Pensado para pasarse tal cual a
Claude Code como especificación con la que empezar a programar la lógica de
combate.

Cada personaje tiene: rareza, rol, coste de invocación orientativo,
estadísticas base y la habilidad especial detallada con sus números de
diseño (todos ajustables en playtesting, pero sirven como punto de partida
coherente).

Los valores exactos de daño están expresados en **DPB (Daño Por Bloque)**,
una unidad relativa: 1.0 DPB = daño base de un personaje Común de nivel 1.
Así se pueden reescalar todos los números juntos sin reescribir el documento.

## Índice rápido

| Personaje | Rareza | Rol | Objetivo de la habilidad |
|---|---|---|---|
| Espartano | Común | DPS a distancia | Lanza espadas, daño perforante en línea |
| Samurái | Raro | Soporte / tanque | Protege y absorbe daño de unidades vecinas |
| Vampiro | Raro | DPS con drenaje | Murciélagos a objetivo aleatorio de la fila |
| Robot | Épico | DPS creciente | Láser que debilita progresivamente |
| Minotauro | Épico | Control de área | Maza que aturde y debilita en área |
| Golem | Épico | Daño de área | Terremoto que golpea a todos en su alcance |
| Luchador de Sumo | Legendario | Daño multiobjetivo | Onda de choque con daño decreciente a 5 unidades |
| Babosa | Legendario | Control + terreno | Devora unidades y deja terreno ralentizante |
| Gigante | Mítico | Bloqueo / control | Rocas que bloquean y paralizan el camino |

---

## Común

### Espartano — *"Lanza jabalinas"*
- **Rol:** DPS a distancia, daño básico constante.
- **Ataque base:** lanza una espada cada 1.2s a la primera unidad del carril.
- **Daño:** 1.0 DPB por impacto.
- **Habilidad especial — Lanza perforante:** cada 4º ataque, la espada
  atraviesa a la primera unidad y golpea también a la segunda con 50% del
  daño. No aplica ningún debuff, es daño puro y consistente.
- **Diseño:** unidad de entrada, barata y fiable, para enseñar la mecánica
  de "ataque en línea que a veces perfora".

---

## Raro

### Samurái — *"Guardián"*
- **Rol:** soporte defensivo, protege unidades adyacentes (no ataca fuerte
  por sí mismo).
- **Ataque base:** golpe cuerpo a cuerpo cada 1.5s, 0.6 DPB (bajo, no es su
  función principal).
- **Habilidad especial — Escudo de honor:** cada 6s, el Samurái genera un
  escudo que se reparte entre él mismo y las unidades **ortogonalmente
  adyacentes** (arriba/abajo/izquierda/derecha en la cuadrícula). El escudo
  absorbe hasta 3.0 DPB de daño repartido entre todas las unidades cubiertas
  y dura 4s o hasta romperse.
- **Diseño:** unidad de sinergia — recompensa colocarlo en el centro de un
  clúster de unidades frágiles (arqueras, magas) para protegerlas durante
  oleadas fuertes.

### Vampiro — *"Enjambre nocturno"*
- **Rol:** DPS con drenaje de vida, presión constante sin depender de la
  posición del enemigo.
- **Ataque base:** no ataca al objetivo más cercano por defecto; su daño
  viene solo de la habilidad.
- **Habilidad especial — Bandada de murciélagos:** cada 5s (no depende de si
  hay enemigos en su carril ni de la distancia), lanza 2 murciélagos que
  vuelan directos a **una unidad enemiga aleatoria visible en el mapa**
  (no tiene que ser la primera de la fila). Cada murciélago hace 1.4 DPB al
  impactar y luego permanece "mordiendo" al objetivo durante 3s, haciendo
  0.3 DPB adicional por segundo antes de desaparecer. El Vampiro cura a la
  unidad aliada con menos vida (%) por un 30% del daño total infligido por
  los murciélagos.
- **Diseño:** única unidad capaz de golpear objetivos que no sean "el
  primero de la fila", útil contra enemigos que se esconden detrás de
  tanques.

---

## Épico

### Robot — *"Emisor láser"*
- **Rol:** DPS que escala cuanto más tiempo mantiene el mismo objetivo.
- **Ataque base:** rayo láser continuo sobre la primera unidad del carril.
- **Habilidad especial — Sobrecarga progresiva:** mientras el láser
  permanece fijo en el mismo objetivo, su daño y velocidad aumentan cada
  segundo:
  - Segundo 1: 0.8 DPB/s (base)
  - Segundo 2: 1.1 DPB/s
  - Segundo 3: 1.5 DPB/s
  - Segundo 4 en adelante: +0.4 DPB/s por segundo, sin límite superior,
    hasta que el objetivo muere o sale de rango.
  Al cambiar de objetivo, el contador se reinicia a 0.8 DPB/s.
- **Diseño:** excelente contra tanques únicos y jefes, débil contra oleadas
  rápidas de enemigos variados porque nunca llega a "calentar" el láser.

### Minotauro — *"Furia de hierro"*
- **Rol:** control de área con debuff, rompe formaciones densas.
- **Ataque base:** golpe cuerpo a cuerpo cada 1.8s, 1.1 DPB.
- **Habilidad especial — Maza aturdidora:** cada 7s lanza un bate de hierro
  al punto más denso de enemigos en su alcance. Impacto:
  - Daño de 2.5 DPB en un área **mayor que la de otras unidades de
    impacto** (radio grande, pensado para golpear 3-5 enemigos a la vez).
  - **Aturde** 1.5s a todos los enemigos alcanzados (no pueden moverse ni
    atacar).
  - Tras el aturdimiento, aplica **Debilitado**: -25% daño y -15% velocidad
    de movimiento durante 3s adicionales.
- **Diseño:** la pieza central de control de multitudes de la rareza Épica;
  gran radio de área es su seña de identidad frente a otras unidades de
  daño en área más concentradas.

### Golem — *"Sismo"*
- **Rol:** daño de área constante, castiga agrupaciones de enemigos.
- **Ataque base:** golpe de puño cada 2s, 1.3 DPB al objetivo principal.
- **Habilidad especial — Terremoto:** cada 8s, golpea el suelo y provoca un
  temblor que se propaga por todo su alcance de ataque. Todos los enemigos
  dentro del radio reciben 2.0 DPB y quedan con -20% velocidad de
  movimiento durante 2s (representa perder el equilibrio, sin llegar a ser
  un aturdimiento completo). A diferencia del Minotauro, el Terremoto no
  tiene objetivo prioritario: golpea el radio entero por igual.
- **Diseño:** daño de área "plano" y predecible, ideal como base de
  formaciones antioleada; se diferencia del Minotauro en que no aturde,
  solo ralentiza, pero golpea con más frecuencia.

---

## Legendario

### Luchador de Sumo — *"Palma de las cinco direcciones"*
- **Rol:** daño multiobjetivo con falloff, arrasa líneas completas de
  enemigos débiles.
- **Ataque base:** empujón cuerpo a cuerpo cada 2s, 1.0 DPB.
- **Habilidad especial — Onda de choque:** cada 9s, golpea el suelo con la
  palma y genera una onda que viaja por el carril, alcanzando hasta **5
  unidades enemigas** en orden de posición (la primera, la segunda, etc.),
  sin importar la distancia entre ellas dentro del carril. El daño base de
  la onda es 3.0 DPB y decae por posición:
  | Posición alcanzada | % del daño base |
  |---|---|
  | 1ª unidad | 100% (3.0 DPB) |
  | 2ª unidad | 80% (2.4 DPB) |
  | 3ª unidad | 60% (1.8 DPB) |
  | 4ª unidad | 40% (1.2 DPB) |
  | 5ª unidad | 20% (0.6 DPB) |
  Si hay menos de 5 enemigos en el carril, la onda simplemente no reparte
  ese daño sobrante (no se redistribuye a otro carril).
- **Diseño:** la unidad "anti-oleada de hormigas" por excelencia: fulmina
  a enemigos débiles en cadena pero pierde fuerza rápido contra una fila
  corta de tanques.

### Babosa — *"Devoradora viscosa"*
- **Rol:** control puro + control de terreno, elimina unidades pequeñas de
  golpe y castiga la zona donde aparece.
- **Ataque base:** ninguno; la Babosa no tiene ataque normal, solo su
  habilidad.
- **Habilidad especial — Emboscada gelatinosa:** cada 3s, aparece de
  repente sobre su carril y **engulle a las 2 primeras unidades enemigas**
  que encuentre, eliminándolas instantáneamente si su vida restante está
  por debajo de un umbral (recomendado: mata directamente a enemigos con
  vida máxima ≤ 4.0 DPB equivalente; contra enemigos más grandes, en su
  lugar les hace 4.0 DPB de daño puro, sin matarlos). Justo después de
  desaparecer, deja en el suelo un **charco de baba** en esa casilla que
  permanece 4s: cualquier enemigo que lo pise sufre -35% de velocidad de
  movimiento mientras esté sobre él.
- **Diseño:** unidad de ritmo muy alto (cada 3s) pensada para limpiar
  oleadas de enemigos pequeños/débiles mientras deja control de terreno
  residual; su punto débil es que no hace nada útil contra un único enemigo
  muy tanque que sobreviva al engullido.

---

## Mítico

### Gigante — *"Lanzarrocas"*
- **Rol:** control de camino a largo plazo, obliga a los enemigos a parar
  y destruir el obstáculo antes de poder avanzar.
- **Ataque base:** ninguno cuerpo a cuerpo; toda su presión viene de la
  habilidad.
- **Habilidad especial — Alud:** cada 10s, lanza una roca gigante que
  **cae sobre una casilla del carril enemigo** (preferentemente la más
  adelantada donde haya un hueco) y crea un obstáculo físico:
  - La roca tiene 6.0 DPB de "vida" propia.
  - **Ningún enemigo puede avanzar más allá de la roca** hasta destruirla:
    los enemigos que la alcanzan se detienen y la atacan como si fuera un
    objetivo más (usando su daño normal), quedando efectivamente
    **paralizados en el sitio** mientras dura el bloqueo.
  - Mientras están parados golpeando la roca, siguen siendo objetivo válido
    para el resto del equipo, que puede acribillarlos con el camino
    cortado.
  - Si la roca no es destruida en 12s, se desintegra sola para no trabar
    la partida indefinidamente.
- **Diseño:** unidad de rareza máxima pensada para partidas donde la
  velocidad de los enemigos es la amenaza principal; convierte el carril en
  un cuello de botella temporal y sinergiza con cualquier unidad de daño en
  área (Golem, Sumo) que se beneficia de enemigos parados y agrupados.

---

## Notas de balance generales

- **Frecuencias de habilidad** (para referencia rápida): Vampiro y Babosa
  son las más rápidas (3–5s) por diseño — son unidades de "ritmo", no de
  "golpe grande". Golem y Minotauro están en un rango medio (7–8s). Sumo y
  Gigante son las más lentas (9–10s) porque su efecto es el más
  determinante de la partida.
- **Solapamiento intencional:** Golem y Minotauro comparten arquetipo
  (área + debuff) pero se diferencian en aturdimiento (Minotauro sí,
  Golem no) y en frecuencia (Golem golpea más seguido, Minotauro pega más
  fuerte y controla más tiempo).
- **Contadores naturales:** la Babosa es fuerte contra oleadas de enemigos
  débiles pero floja contra un único tanque; el Gigante es lo opuesto,
  fuerte reteniendo a un enemigo pero inútil si el enemigo tiene ataque a
  distancia que ignora la roca. Están pensados para combinarse, no para
  sustituirse.
- **Escalado por niveles (sugerido, no implementado en detalle aquí):** cada
  personaje debería tener niveles de mejora (fusión de copias, como en
  Rush Royale) que multiplican DPB y reducen levemente los cooldowns de
  habilidad (máx. -20% en el nivel más alto), nunca eliminan por completo
  el tiempo de espera.

## Siguiente paso técnico

Los mismos datos están en [`personajes.json`](./personajes.json) en formato
estructurado (rareza, cooldowns, daños en DPB, radios y efectos) listo para
usarse como fuente de datos al implementar la lógica de combate.
