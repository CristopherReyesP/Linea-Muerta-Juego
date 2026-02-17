# Ideas para Nuevos Mini-Juegos - Línea Muerta (Revisado)

## Análisis del Juego Existente

**Capacidades del sistema:**
- Llamadas de voz entre jugadores (WebRTC)
- Sistema de votaciones
- Sistema de decisiones
- Sistema de sombras (interferencia)
- Distorsión de voz
- Múltiples fases por juego

**Tema:** Compañía telefónica "Línea Muerta" - todo gira alrededor de llamadas telefónicas

---

## Mejora de Ideas: Criterios

Las ideas deben:
1. ✅ Usar el sistema de llamadas de voz
2. ✅ Encajar con el tema telefónico
3. ✅ Ser implementables con la infraestructura actual
4. ✅ Ofrecer variedad de mecánicas

---

## Ideas Revisadas y Mejoradas

---

### Idea 1: Línea Sospechosa (basado en "El Impostor")

**ID propuesto:** `linea-sospechosa`

**Tipo:** Deducción social / Llamadas

**Descripción:**
Los jugadores reciben una palabra secreta. El objetivo es hacer llamadas para obtener información y descubrir quién tiene la palabra "sospechosa".

**Mecánica:**

1. **Asignación (10s):** Un jugador recibe "SOSPECHOSO", los demás reciben palabra normal.

2. **Fase de Llamadas (60s):**
   - Todos pueden llamar a quien quieran
   - El jugador "sospechoso" debe dar pistas falsas
   - Los demás deben hacer preguntas inteligentes
   - Las voces NO están distorsionadas

3. **Votación (30s):** Votan por quién creen que es el sospechoso.

4. **Puntuación:**
   - Si aciertan: quienes votaron bien +3 puntos
   - Si fallan: el sospechoso +3 puntos

**¿Por qué encaja?** Usa el sistema de llamadas, tema telefónico, deducción social.

---

### Idea 2: Central de Emergencias (basado en "Just One" + Impostor)

**ID propuesto:** `central-emergencias`

**Tipo:** Colaborativo con Traidor / Llamadas + Texto

**Descripción:**
Uno o varios jugadores son "Operadores de Emergencias" y deben identificar el mensaje real. Hay 3 emisores: 2 **Técnicos** y 1 **Saboteador**. Cada emisor recibe una pista parcial con opción REAL y FALSA.

**Roles:**
- 1 **Saboteador** (secreto)
- 2 **Técnicos Leales**
- Resto: **Operadores de Emergencias**

**Mecánica:**

1. **Asignación de Roles (10s):**
   - Se asignan los roles.
   - El sistema genera un mensaje REAL con 3 campos: **EMERGENCIA, UBICACIÓN, ACCESO**.
   - Ejemplo: "Incendio, piso 3, escalera norte".
   - Cada emisor (2 técnicos + saboteador) recibe 1 campo con 2 valores: uno REAL y uno FALSO.

2. **Preparación (10s):**
   - Técnicos y Saboteador revisan su dupla REAL/FALSA.
   - El saboteador prepara cómo defender su opción falsa.

3. **Transmisión (90s):**
   - Los 3 emisores pueden **llamarse entre ellos** para coordinarse/debatir.
   - Ningún emisor puede llamar al Operador.
   - Cada emisor manda un reporte escrito de máximo 3 palabras al Operador.
   - Los operadores ven los reportes en tiempo real.

4. **Respuesta de Operadores (60s):**
   - Cada operador elige la emergencia correcta entre 4 opciones.
   - Se decide por mayoría de operadores.

5. **Puntuación:**
   - **Mayoría acierta:** Operadores + Técnicos Leales = +1 pt, Saboteador = 0 pts
   - **Mayoría falla:** Saboteador = +1 pt, todos los demás = 0 pts

**La tensión del juego:**
- Todos tienen comparación REAL vs FALSA, así que hay deducción real en conversación.
- El Saboteador no inventa texto libre: debe vender su valor FALSO.
- Los Técnicos intentan validar valores coherentes y empujar los reales.
- El límite de 3 palabras mantiene fragmentación y presión.
- Base combinatoria de elección de emisor: **2^3 = 8** escenarios.

**Generación de mensajes (Plantillas Combinables):**
El sistema genera mensajes únicos combinando partes intercambiables. Nunca se repiten.

Plantilla: `[EMERGENCIA], [UBICACION], [ACCESO]`

| Parte | Opciones ejemplo |
|-------|-----------------|
| EMERGENCIA | Incendio, Fuga de gas, Inundación, Derrumbe, Corte eléctrico |
| UBICACION | piso 3, sector B, ala este, zona de carga, sótano 2 |
| ACCESO | escalera norte, entrada principal, ruta de escape sur, puerta lateral |

Esto da **5 x 5 x 4 = 100 combinaciones** de mensaje base.

Las opciones del Operador se generan automáticamente: una real y distractores cambiando 1-2 campos.

**¿Por qué encaja?** Usa llamadas entre técnicos, comunicación fragmentada por texto al operador, tema de centralita, deducción social con el Saboteador.

---

### Idea 3: Consensus (basado en "La Mafia" - simplificado)

**ID propuesto:** `consensus`

**Tipo:** Deducción social / Votación

**Descripción:**
Todos tienen roles ocultos. Deben discutir y llegar a consenso sobre quién eliminar.

**Mecánica (simplificada para el sistema actual):**

1. **Roles (10s):** 2 Traidores ocultos entre los jugadores.

2. **Discusión Grupal (60s):** Voz abierta para discutir.

3. **Votación (30s):** Votan por quién eliminar.

4. **Resultado:**
   - Si eliminan Traidor: Inocentes +2 puntos
   - Si eliminan Inocente: Traidores +2 puntos

5. **Gana:** Primera facción en llegar a 5 puntos.

**Ventaja:** Usa sistema de votaciones existente, no requiere cambios grandes.

---

### Idea 4: La Consigna (Teléfono Roto mejorado)

**ID propuesto:** `la-consigna`

**Tipo:** Comunicación / Llamadas

**Descripción:**
El clásico "teléfono descompuesto" pero con llamadas reales.

**Mecánica:**

1. **Mensaje Inicial (10s):** El Jugador 1 recibe una frase secreta.

2. **Cadena de Llamadas (90s):**
   - El Jugador 1 llama al Jugador 2 y le susurra el mensaje
   - El Jugador 2 cuelga y llama al Jugador 3
   - Así sucesivamente hasta el último jugador

3. **Revelación (15s):** El último jugador dice el mensaje final.

4. **Puntuación por similitud:**
   - Mayor al 70%: +3 puntos a todos
   - 40-70%: +1 punto
   - Menor al 40%: 0 puntos

**¿Por qué encaja?** PERFECTO uso del sistema de llamadas, tema telefónico.

---

### Idea 5: Llamada Mortal (Dados + Llamadas)

**ID propuesto:** `llamada-mortal`

**Tipo:** Azar / Riesgo / Llamadas

**Descripción:**
Los jugadores tienen un "teléfono maldito". Pueden pasar la llamada pero cada segundo que pasa aumenta el riesgo.

**Mecánica:**

1. **El Teléfono (10s):** Un jugador recibe la "Llamada Maldita".

2. **Pasar o Responder (60s):**
   - El portador puede: RESPONDER (tira dado) o PASAR (elige a otro jugador)
   - Si responde y NO sacas 1: +2 puntos
   - Si pasas: sigues en juego pero no ganas puntos yet
   - Si sacas 1: PIERDES todo y sales del mini-juego

3. **Escalada:** Cada vez que se pasa, el riesgo aumenta (+10% por cada pase)

4. **Gana:** Último jugador en pie o quien más puntos tenga cuando termine el tiempo.

**¿Por qué encaja?** Tema telefónico + riesgo + uso del sistema de decisiones.

---

### Idea 6: Palabras Cruzadas (Categoría + Llamadas)

**ID propuesto:** `palabras-cruzadas`

**Tipo:** Palabras / Llamadas

**Descripción:**
El sistema da una categoría. Los jugadores deben llamar a otros para coordinarse y no repetir palabras.

**Mecánica:**

1. **Categoría (10s):** El sistema da una categoría (ej: "FRUTAS").

2. **Coordinación (45s):**
   - Los jugadores se llaman entre sí para coordinarse
   - NO pueden escribir, deben hablar
   - Deben cubrir el mayor número de palabras únicas

3. **Resultado:**
   - Cada palabra única cubierta: +1 punto
   - Palabra repetida entre jugadores: -1 punto

**¿Por qué encaja?** Usa llamadas para coordinar, tema de comunicación.

---

### Idea 7: El Testigo (Deducción + Voz)

**ID propuesto:** `el-testigo`

**Tipo:** Deducción social / Memoria / Llamadas

**Descripción:**
Un jugador es "El Testigo" de un crimen. Debe describir al culpable a través del teléfono sin ser descubierto.

**Mecánica:**

1. **El Crimen (10s):** Se revela un "crime" y un "sospechoso" (uno de los jugadores).

2. **Llamadas de Investigación (60s):**
   - Los investigadores pueden llamar al Testigo
   - El Testigo debe dar pistas sobre el sospechoso
   - El Testigo puede mentir si es astuto

3. **Votación (30s):** Votan por quién creen que es el culpable.

4. **Puntuación:**
   - Acertar culpable: Investigadores +3 puntos
   - Testigo不被发现: Testigo +3 puntos

**¿Por qué encaja?** Usa llamadas, deducción, tema de investigación.

---

### Idea 8: Subasta de Línea (Estrategia + Llamadas)

**ID propuesto:** `subasta-linea`

**Tipo:** Estrategia / Apuestas

**Descripción:**
Los jugadores pujan por hacer la "llamada más importante" pero no saben cuánto pujan los demás.

**Mecánica:**

1. **Premio (10s):** Un premio de puntos está en juego.

2. **Puja Ciega (30s):**
   - Cada jugador secretly selecciona cuánto "apuesta" (1-50 puntos)
   - La puja más alta obtiene el derecho de hacer UNA llamada de influencia

3. **La Llamada (30s):**
   - El ganador puede hacer una llamada a cualquier jugador
   - Puede intentar convencerlo de algo o dar información

4. **Resultado:**
   - Si convence: gana puntos del premio
   - Si no: pierde los puntos apostados

**¿Por qué encaja?** Usa llamadas como premio, estrategia.

---

### Idea 9: Memoria de Números (Memoria + Llamadas)

**ID propuesto:** `memoria-numeros`

**Tipo:** Memoria / Llamadas

**Descripción:**
Los jugadores deben recordar una secuencia de números que se revelan a través de "llamadas".

**Mecánica:**

1. **Secuencia Inicial (15s):**
   - El sistema "llama" a cada jugador con un dígito
   - Jugador 1: "5", Jugador 2: "3", Jugador 3: "8"...

2. **Reconstrucción (45s):**
   - Los jugadores deben llamar a otros para reconstruir la secuencia
   - Solo pueden dar su propio dígito

3. **Respuesta (20s):** El jugador elegido intenta decir la secuencia completa.

4. **Puntuación:**
   - Secuencia correcta completa: +5 puntos
   - Parcial: +1 punto por cada dígito correcto

**¿Por qué encaja?** Tema de telefónica, usa llamadas.

---

### Idea 10: La Última Llamada (Supervivencia)

**ID propuesto:** `ultima-llamada`

**Tipo:** Supervivencia / Comunicación

**Descripción:**
Un jugador recibe una "bomba" (llamada). Debe pasarla a otro jugador antes de que explote.

**Mecánica (similar a La Bomba pero con llamadas):**

1. **La Bomba (10s):** Un jugador recibe la llamada-bomba.

2. **Pasar la Llamada (60s):**
   - El portador puede pasar la llamada a cualquier jugador
   - Cada vez que se pasa, el "tiempo" baja (-10 segundos disponibles)
   - El portador puede intentar "colgar" (desactivar) - 30% probabilidad

3. **Explosión:** Si el tiempo llega a 0, el portador pierde.

4. **Gana:** Último jugador sin explotar.

**¿Por qué encaja?** Tema telefónico perfecto, usa sistema de decisiones.

---

## Resumen de Ideas Mejoradas

| # | Idea | Usa Llamadas | Tema Telefónico | Dificultad |
|---|------|--------------|-----------------|-------------|
| 1 | Línea Sospechosa | ✅ | ✅ | ★★☆☆☆ |
| 2 | Central Emergencias | ✅ | ✅ | ★★☆☆☆ |
| 3 | Consensus | ❌ | ❌ | ★★☆☆☆ |
| 4 | La Consigna | ✅ | ✅ | ★★☆☆☆ |
| 5 | Llamada Mortal | ✅ | ✅ | ★★☆☆☆ |
| 6 | Palabras Cruzadas | ✅ | ✅ | ★★☆☆☆ |
| 7 | El Testigo | ✅ | ✅ | ★★★☆☆ |
| 8 | Subasta de Línea | ✅ | ✅ | ★☆☆☆☆ |
| 9 | Memoria de Números | ✅ | ✅ | ★★☆☆☆ |
| 10 | La Última Llamada | ✅ | ✅ | ★★☆☆☆ |

---

## Recomendaciones

**Ideas que mejor aprovechan el sistema:**
1. **La Consigna** - Teléfono roto con llamadas reales
2. **Línea Sospechosa** - Impostor con llamadas
3. **La Última Llamada** - Bomba con llamadas
4. **Central Emergencias** - Colaboración telefónica

**Ideas que necesitan menos cambios:**
- Consensus (usa votaciones existentes)
- Subasta de Línea (usa decisiones existentes)
