# Linea Muerta

Real-time multiplayer party game: a Node.js server with Socket.io runs sessions of five voice-based mini-games, and a React client connects players through WebSockets and WebRTC audio.

## Overview

Players create a private room (joined with a 6-character code) or join a public room. Once at least 2 players are in (maximum 8), the host starts a session. The server picks 5 mini-games at random, skipping any whose minimum player count is not met and repeating games if fewer than 5 are available. Each mini-game awards or removes global points, a short discussion phase with group voice follows each one, and the player with the most global points wins the session.

The UI is available in Spanish and English.

## Architecture

```
server/src/
├── index.ts          Express + HTTP server, Socket.io setup, /health, serves the client build in production
├── events.ts         Socket.io handlers: rooms, game actions, chat, WebRTC signaling relay
├── GameManager.ts    In-memory room registry, public room list, global stats, cleanup timer
├── MetaGame.ts       Session state machine and global scoring across the 5 mini-games
├── MetaPlayer.ts     Session-level player (global score, connection state)
├── Player.ts         Mini-game-level player (balance, state), recreated for every mini-game
├── CallManager.ts    1:1 call lifecycle: ringing, accept, reject, hang up, busy checks
└── minigames/        MiniGame abstract base class and 7 implementations
client/src/
├── hooks/useSocket.ts   Socket.io client; maps server events into the store
├── hooks/useWebRTC.ts   Peer connections for 1:1 calls and group voice
├── store/gameStore.ts   Global state (Zustand)
└── components/          React UI; components/three holds the Three.js lobby scene
```

**Request flow**

1. The client emits an intent, for example `create_game`, `vote_player` or `pass_bomb`.
2. `events.ts` resolves the socket to its room and player through `GameManager`, then delegates to the current `MetaGame` or mini-game.
3. The server updates its in-memory state and broadcasts full snapshots: `meta_state_update` for the session and `game_state_update` for the active mini-game, sent to the Socket.io room `game:<id>`.
4. The client stores the snapshot in Zustand and re-renders.

**Session flow** (`MetaGamePhase`): `LOBBY` → `MINIGAME_INTRO` (3 s) → `MINIGAME_IN_PROGRESS` → `DISCUSSION` (12 s, or earlier if the host continues) → next mini-game → `SESSION_COMPLETE`.

**Voice.** Audio never passes through the server. The server relays `webrtc_offer`, `webrtc_answer` and `webrtc_ice_candidate` messages to the target player's socket, and browsers connect peer to peer using public Google STUN servers (no TURN server is configured). `CallManager` tracks 1:1 calls during mini-games; for group voice in the lobby and discussion phases the server emits `open_voice` with the player list and each client opens one peer connection per player. Voice distortion in *Adivina la Linea* is applied in the browser with an AudioWorklet (`client/public/audio/voice-disguise-worklet.js`), switched on and off by the server's `voice_distortion` event.

More design notes (in Spanish, written for an earlier version with 5 mini-games): [DOCUMENTATION.md](DOCUMENTATION.md).

## Tech Stack

| Area | Technology |
|------|------------|
| Server | Node.js (>= 18), TypeScript ^5.3, Express ^4.18, Socket.io ^4.7, cors, uuid |
| Client | React ^18.2, Vite ^5.0, Zustand ^4.5, socket.io-client ^4.7, Framer Motion ^11 |
| 3D lobby | Three.js ^0.161, @react-three/fiber ^8.17, @react-three/drei ^9.122 |
| Voice | Browser WebRTC and Web Audio (AudioWorklet) APIs |
| Tooling | tsx (server watch mode), concurrently (runs server and client together) |

## Key Technical Decisions

- **Server-authoritative game state.** Clients only send intents. Rules, phase timers, role assignment and scoring run on the server, and clients render the snapshots they receive.
- **Mini-games behind one abstract class.** Each mini-game extends `MiniGame` (`start`, `getPhase`, `getSnapshot`) and reports its result through an `onComplete` callback. `MetaGame` keeps the registry, creates instances, and applies global scoring in one place.
- **Two player models.** `MetaPlayer` keeps the session score. A fresh `Player` (initial balance 100) is created for every mini-game, so no mini-game state leaks into the next one.
- **In-memory storage only.** Rooms and players live in `Map`s; there is no database, and a server restart ends all sessions. A timer removes empty rooms every 5 seconds, empty public rooms expire after 10 minutes, and one general public room is always kept open.
- **Reconnection.** The client stores `{ gameId, playerId }` in `sessionStorage` and sends `resume_session` after a reload; the server re-binds that player to the new socket.
- **Basic abuse limits per socket.** Quick signals are limited to one every 8 seconds and must come from a fixed list, pre-room chat to one message every 2.5 seconds, messages are cut to 140 characters, and each client IP (read from `x-forwarded-for` when present) can own one public room at a time.
- **Host authority.** Only the host can start, skip or advance; if the host disconnects, the role passes to another connected player.
- **Single deployable.** With `NODE_ENV=production`, Express serves `client/dist` with a fallback to `index.html`, so one Node process serves both the UI and Socket.io. A developer option to pick specific mini-games is only accepted from localhost sockets outside production.

## Features

- Private rooms by code, a public room list, and live counts of connected players and rooms.
- Customizable avatars (avatar, color, accessory).
- 1:1 voice calls (ring, accept, reject, hang up) and group voice in the lobby and discussion phases.
- Lobby chat, a global chat before joining a room, and quick emoji signals inside a room.
- Rejoining an ongoing session after a page reload.

### Mini-games

| Mini-game | How it works | Global points |
|-----------|--------------|---------------|
| Cooperar o Traicionar | Talk in 1:1 calls, then secretly choose to cooperate or betray (up to 5 rounds). The majority decides how balances change; players whose balance drops to 0 become "shadows" who can no longer decide but can still call and send interference to other players. | +1 to the highest positive balance, -1 to every shadow |
| Quien Sobra? | Vote for the player who dominates too much. | -1 to the most voted |
| Quien Merece? | Vote for the player who deserves to move on. | +1 to the most voted |
| Adivina la Linea | Identities are hidden and voices distorted; call other lines and guess who is behind each one. | +1 to the most correct guesses |
| La Bomba | 5-minute round; each holder has 50 seconds to pass the bomb or try to defuse it. Defuse chance starts at 15% and rises 10 points per pass, up to 95%. | +2 on defuse, -2 to the holder on explosion |
| Central de Emergencias (4+ players) | 1 saboteur and 2 technicians get clues and send short reports; operators must pick the correct message. | +1 to everyone but the saboteur on success, otherwise +1 to the saboteur |
| Emoji Diferente (3+ players) | Everyone gets the same emoji except one player; talk and vote to find them. | +1 to everyone but that player if found, otherwise +1 to that player |

## Running Locally

Requirements: Node.js 18 or later and npm.

```bash
git clone https://github.com/CristopherReyesP/Linea-Muerta-Juego.git
cd Linea-Muerta-Juego

# Installs root dependencies; the postinstall script also installs server/ and client/
npm install

# Server on http://localhost:3001 and client on http://localhost:5173
npm run dev
```

Run each side on its own with `npm run dev:server` or `npm run dev:client`. `npm run install:all` reinstalls only the server and client dependencies. Open the client in two browser windows to have the 2 players needed to start a session; voice features ask for microphone permission.

**Production build**

```bash
npm run build                    # vite build (client) + tsc (server)
NODE_ENV=production npm start    # serves client/dist and Socket.io from one process
```

`GET /health` returns the server status and the IDs of open rooms.

Environment variables read by the server: `PORT` (default `3001`) and `NODE_ENV`.

## Testing

There are no automated tests in this repository.

## Project Status

Personal project, built between February and March 2026. The last feature commit is labeled "version 2 beta". There is no live deployment available at the moment.
