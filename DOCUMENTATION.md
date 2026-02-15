# Línea Muerta - Documentación del Proyecto

## 1. Visión General del Proyecto

**Línea Muerta** es una plataforma de juegos multiplayer online que consiste en múltiples mini-juegos seleccionados aleatoriamente. Los jugadores participan en una sesión de 5 mini-juegos, y quien gane más mini-juegos es el ganador absoluto.

### Concepto
- Una sesión contiene **5 mini-juegos** seleccionados aleatoriamente
- Cada mini-juego tiene su propia mecánica
- Los jugadores ganan **puntos globales** por victoria en cada mini-juego
- Voz grupal durante las fases de discusión
- Sistema de avatares personalizables

---

## 2. Arquitectura del Proyecto

### Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + TypeScript + Socket.io
- **Comunicación**: WebSocket (Socket.io)
- **Voz**: WebRTC para llamadas

### Estructura de Archivos

```
Linea Muerta - Juego/
├── client/                         # Aplicación React
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── hooks/               # Custom hooks
│   │   ├── store/               # Estado global (Zustand)
│   │   ├── types.ts             # Tipos TypeScript
│   │   └── styles/              # Estilos CSS
│   └── package.json
│
└── server/                       # Servidor Node.js
    └── src/
        ├── index.ts              # Punto de entrada
        ├── events.ts             # Eventos Socket.io
        ├── GameManager.ts        # Gestor de partidas
        ├── MetaGame.ts           # Lógica de sesión completa
        ├── MetaPlayer.ts         # Jugador a nivel de sesión
        ├── Player.ts            # Jugador a nivel de mini-juego
        ├── CallManager.ts       # Gestor de llamadas
        ├── types.ts             # Tipos TypeScript
        ├── minigames/           # Mini-juegos
        │   ├── MiniGame.ts     # Clase base abstracta
        │   ├── CooperarTraicionar.ts
        │   ├── VotacionSobra.ts
        │   ├── VotacionMerece.ts
        │   ├── AdivinaLinea.ts
        │   └── LaBomba.ts
        └── ...
```

---

## 3. Arquitectura de Clases (Backend)

### 3.1 MetaGame (MetaGame.ts)
La clase principal que maneja toda la sesión:

```typescript
class MetaGame {
  id: string                      // ID de la sala
  metaPhase: MetaGamePhase        // Fase actual de la sesión
  metaPlayers: Map<string, MetaPlayer>  // Jugadores conectados
  hostId: string | null          // ID del host
  private selectedMinigames: MiniGameInfo[]  // Mini-juegos seleccionados
  private currentMinigameIndex: number       // Índice actual
  private currentMinigame: MiniGame | null    // Mini-juego activo
  private minigameHistory: MinigameResult[]   // Historial de resultados
  private readonly TOTAL_MINIGAMES = 5       // Cantidad por sesión
}
```

**Fases de la Sesión:**
```typescript
enum MetaGamePhase {
  LOBBY = 'LOBBY',                    // Sala de espera
  MINIGAME_INTRO = 'MINIGAME_INTRO',  // Introducción del mini-juego
  MINIGAME_IN_PROGRESS = 'MINIGAME_IN_PROGRESS', // Mini-juego activo
  DISCUSSION = 'DISCUSSION',           // Discusión entre mini-juegos
  SESSION_COMPLETE = 'SESSION_COMPLETE' // Sesión terminada
}
```

### 3.2 MiniGame (minigames/MiniGame.ts)
Clase abstracta base para todos los mini-juegos:

```typescript
abstract class MiniGame {
  abstract readonly info: MiniGameInfo
  abstract start(): void
  abstract getPhase(): GamePhase
  abstract getSnapshot(): GameStateSnapshot
  
  // Métodos opcionales
  submitDecision(playerId: string, decision: Decision): boolean
  votePlayer(voterId: string, targetId: string): boolean
  
  // Compartidos
  callPlayer(callerId: string, targetId: string): void
  useShadowInterference(shadowId: string, targetId: string): void
  broadcastState(): void
  cleanup(): void
}
```

### 3.3 MetaPlayer (MetaPlayer.ts)
Jugador a nivel de sesión (persiste entre mini-juegos):

```typescript
class MetaPlayer {
  id: string
  socketId: string
  name: string
  avatarId: string
  avatarColor: string
  accessoryId: string
  globalScore: number    // Puntos globales (victorias)
  isConnected: boolean
  
  addWin(): void        // +1 punto global
  adjustScore(n): void  // Ajustar score
}
```

### 3.4 Player (Player.ts)
Jugador a nivel de mini-juego (se reinicia cada mini-juego):

```typescript
class Player {
  id: string
  socketId: string
  name: string
  avatarId: string
  avatarColor: string
  accessoryId: string
  balance: number        // Saldo del mini-juego
  state: PlayerState
  isAlive: boolean
  isShadow: boolean
  shadowCharges: number  // Cargas de interferencia
  rachaCooperar: number   // Racha cooperaciones
  rachaTraicionar: number  // Racha traiciones
}
```

---

## 4. Mini-Juegos Implementados

### 4.1 Cooperar o Traicionar
**ID**: `cooperar-traicionar`

El juego original de Línea Muerta:
- Fase de llamada (30s): Comunicarse por teléfono
- Fase de decisión (10s): Cooperar o Traicionar
- Resultados según mayoría

**Puntuación:**

| Decisión | Mayoría Coopera | Mayoría Traiciona |
|----------|-----------------|-------------------|
| COOPERAR | +30 | -40 |
| TRAICIONAR | +50 | -10 |

**Rachas (bonus/penalización):**
- 2 cooperaciones seguidas: **+15** bonus
- 2 traiciones seguidas: **-25** penalización

**Sombras:**
- Cuando balance = 0, jugador se vuelve sombra
- Puede seguir llamando pero no vota
- Tiene 2 cargas de interferencia

### 4.2 Quien Sobra?
**ID**: `votacion-sobra`

Votación para eliminar a alguien:
- Todos votan por quien "domina demasiado"
- El más voted pierde 1 punto global

### 4.3 Quien Merece?
**ID**: `votacion-merece`

Votación para premiar a alguien:
- Todos votan por quien "merece seguir"
- El más voted gana 1 punto global

### 4.4 Adivina la Linea
**ID**: `adivina-linea`

Juego de deducción con voces distorsionadas:
- Fase de llamada (5 min): Llamadas con voz distorsionada
- Fase de adivinación (30s): Adivinar quién está en cada línea
- Gana quien adivine más correctamente

**Mecánica:**
- Cada jugador recibe un número de línea aleatorio
- Las voces se distorsionan automáticamente
- Hay 4 líneas disponibles
- El jugador debe adivinar qué jugador está en cada línea

### 4.5 La Bomba
**ID**: `la-bomba`

Juego de riesgo y tensión:
- La bomba start con un jugador aleatorio
- El portador tiene 50 segundos para:
  - Intentary desactivar (15% probabilidad base)
  - Pasar la bomba a otro jugador (+10% probabilidad)
- La probabilidad máximo es 95%
- Si explota, el portador pierde

**Mecánica:**
- Duración total: 5 minutos
- Tiempo por decisiones: 50 segundos
- Probabilidad base: 15%
- Bonus por pasar: +10%
- Probabilidad máxima: 95%

---

## 5. Sistema de Avatares

Los jugadores pueden personalizar su apariencia:

| Campo | Descripción |
|-------|-------------|
| avatarId | ID del modelo de avatar |
| avatarColor | Color del avatar |
| accessoryId | ID del accesorio |

---

## 6. Sistema de Voces

### Llamadas Normales
- WebRTC peer-to-peer
- Audio en tiempo real

### Distorsión de Voz (AdivinaLinea)
- Voz distorsionada automáticamente
- Oculta la identidad del jugador

### Interferencia de Sombras
- Cuando una sombra interfiere, el audio se distorsiona
- Duración: 10 segundos

---

## 7. Flujo de una Sesión

```
LOBBY → MINIGAME_INTRO → MINIGAME_IN_PROGRESS → DISCUSSION → (repetir 5 veces) → SESSION_COMPLETE
```

### 7.1 Lobby
1. Jugadores se unen con código de sala
2. Personalizan su avatar
3. Host inicia la sesión
4. Se seleccionan 5 mini-juegos aleatoriamente

### 7.2 Mini-Game Intro
- Se muestra el nombre y descripción del mini-juego
- Se abre voz grupal automáticamente

### 7.3 Mini-Game In Progress
- Cada mini-juego tiene sus propias fases
- Puede incluir llamadas, decisiones, votaciones

### 7.4 Discussion (Discusión)
- Se muestran resultados del mini-juego
- Voz grupal abierta
- Host puede "continuar" al siguiente

### 7.5 Session Complete
- Se revela el ganador absoluto
- Ranking de puntos globales
- Opción de nueva partida

---

## 8. Tipos de Datos

### Estados del Jugador (PlayerState)
```typescript
enum PlayerState {
  LOBBY = 'LOBBY'
  ACTIVE = 'ACTIVE'
  IN_CALL = 'IN_CALL'
  DECIDING = 'DECIDING'
  LOCKED = 'LOCKED'
  AT_RISK = 'AT_RISK'
  SHADOW = 'SHADOW'
  DISCONNECTED = 'DISCONNECTED'
}
```

### Fases del Mini-Juego (GamePhase)
```typescript
enum GamePhase {
  LOBBY = 'LOBBY'
  CALL_PHASE = 'CALL_PHASE'
  DECISION_PHASE = 'DECISION_PHASE'
  RESULT_PHASE = 'RESULT_PHASE'
  GAME_OVER = 'GAME_OVER'
}
```

### Decisiones
```typescript
enum Decision {
  COOPERATE = 'COOPERATE'
  BETRAY = 'BETRAY'
}
```

---

## 9. Eventos Socket.io

### Cliente → Servidor
| Evento | Descripción |
|--------|-------------|
| `create_game` | Crear nueva sala (con avatar) |
| `join_game` | Unirse a sala |
| `start_game` | Iniciar sesión (solo host) |
| `call_player` | Llamar a jugador |
| `accept_call` | Aceptar llamada |
| `reject_call` | Rechazar llamada |
| `hang_up` | Colgar |
| `submit_decision` | Enviar decisión |
| `vote_player` | Votar jugador |
| `use_shadow_interference` | Usar interferencia |
| `continue_to_next` | Continuar al siguiente mini-juego |
| `submit_line_guesses` | Enviar adivinaciones (AdivinaLinea) |
| `pass_bomb` | Pasar la bomba (LaBomba) |
| `attempt_defuse` | Intentar desactivar (LaBomba) |

### Servidor → Cliente
| Evento | Descripción |
|--------|-------------|
| `game_joined` | Confirmación de unión |
| `meta_state_update` | Estado de la sesión |
| `game_state_update` | Estado del mini-juego |
| `minigame_intro` | Info del mini-juego entrante |
| `discussion_started` | Inicio de discusión |
| `session_complete` | Sesión terminada |
| `open_voice` | Abrir voz grupal |
| `incoming_call` | Llamada entrante |
| `phase_changed` | Cambio de fase |
| `round_result` | Resultado de ronda |
| `vote_result` | Resultado de votación |
| `line_assignments` | Asignación de líneas (AdivinaLinea) |
| `line_guess_results` | Resultados de adivinación (AdivinaLinea) |
| `bomb_state_update` | Estado de la bomba (LaBomba) |
| `bomb_passed` | Bomba pasada |
| `bomb_defuse_result` | Resultado de desactivación |
| `bomb_exploded` | Bomba explotó |
| `bomb_defused` | Bomba desactivada |
| `voice_distortion` | Activar distorsión de voz |

---

## 10. Configuración

```typescript
const DEFAULT_CONFIG = {
  callPhaseDuration: 30,       // Segundos fase de llamada
  decisionPhaseDuration: 10,   // Segundos fase de decisión
  resultPhaseDuration: 5,      // Segundos fase de resultados
  initialBalance: 100,         // Saldo inicial
  minPlayers: 2,              // Mínimo jugadores
  maxPlayers: 8,              // Máximo jugadores
  maxRounds: 10,              // Rondas por mini-juego
  atRiskThreshold: 20,         // Umbral para AT_RISK
  shadowCharges: 2             // Cargas de interferencia
}
```

---

## 11. Cómo Agregar un Nuevo Mini-Juego

### Paso 1: Crear el archivo
Crear `server/src/minigames/MiNuevoJuego.ts`

### Paso 2: Extender MiniGame
```typescript
import { MiniGame } from './MiniGame'

export class MiNuevoJuego extends MiniGame {
  readonly info: MiniGameInfo = {
    id: 'mi-nuevo-juego',
    name: 'Mi Nuevo Juego',
    shortDescription: 'Descripción breve'
  }
  
  start(): void { ... }
  getPhase(): GamePhase { ... }
  getSnapshot(): GameStateSnapshot { ... }
}
```

### Paso 3: Registrar en MetaGame.ts
Agregar al `MINIGAME_REGISTRY`:
```typescript
{
  id: 'mi-nuevo-juego',
  name: 'Mi Nuevo Juego',
  shortDescription: '...'
}
```

---

## 12. Comandos de Desarrollo

### Instalar dependencias
```bash
npm install
```

### Iniciar desarrollo (ambos)
```bash
npm run dev
```

### Iniciar solo servidor
```bash
cd server && npm run dev
```

### Iniciar solo cliente
```bash
cd client && npm run dev
```

---

## 13. Glosario

| Término | Definición |
|---------|------------|
| **MetaGame** | Sesión completa de 5 mini-juegos |
| **MiniGame** | Juego individual |
| **MetaPlayer** | Jugador a nivel de sesión (persiste globalScore) |
| **Player** | Jugador a nivel de mini-juego (se reinicia) |
| **globalScore** | Puntos de victoria en la sesión |
| **Discussion** | Fase de discusión entre mini-juegos |
| **Shadow** | Jugador sin voto por saldo 0 |
| **Racha** | Veces seguidas eligiendo la misma decisión |
| **Avatar** | Personalización visual del jugador |

---

## 14. Estado Actual del Proyecto

El proyecto ya cuenta con:
- ✅ Sistema de sesiones con múltiples mini-juegos
- ✅ 5 mini-juegos implementados
- ✅ Sistema de rachas (bonus/penalización)
- ✅ Sistema de sombras
- ✅ Llamadas de voz (WebRTC)
- ✅ Sistema de avatares
- ✅ Votaciones entre mini-juegos
- ✅ Discusión grupal
- ✅ Distorsión de voz
- ✅ Juego de la bomba

Para expandir: agregar más mini-juegos en la carpeta `server/src/minigames/`
