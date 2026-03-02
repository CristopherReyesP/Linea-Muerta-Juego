# Linea Muerta

Plataforma de mini-juegos multiplayer online en tiempo real. Los jugadores participan en una sesion de 5 mini-juegos seleccionados aleatoriamente, y quien gane mas es el ganador absoluto.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + TypeScript + Express + Socket.io
- **Estado**: Zustand
- **Comunicacion**: WebSocket (Socket.io) + WebRTC (voz)

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm

## Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/CristopherReyesP/Linea-Muerta-Juego.git
cd Linea-Muerta-Juego

# Instalar todas las dependencias (raiz, servidor y cliente)
npm run install:all
```

## Levantar el proyecto

### Servidor y cliente juntos

```bash
npm run dev
```

Esto levanta:
- **Cliente** en `http://localhost:5173`
- **Servidor** en `http://localhost:3001`

### Por separado

```bash
# Solo servidor
npm run dev:server

# Solo cliente
npm run dev:client
```

## Build de produccion

```bash
# Build del cliente
npm run build
```

## Estructura del proyecto

```
Linea-Muerta-Juego/
├── client/                  # App React (Vite)
│   └── src/
│       ├── components/      # Componentes React
│       ├── hooks/           # Custom hooks
│       ├── store/           # Estado global (Zustand)
│       ├── styles/          # Estilos CSS
│       └── types.ts         # Tipos TypeScript
│
├── server/                  # Servidor Node.js
│   └── src/
│       ├── index.ts         # Punto de entrada
│       ├── events.ts        # Eventos Socket.io
│       ├── GameManager.ts   # Gestor de partidas
│       ├── MetaGame.ts      # Logica de sesion
│       ├── Game.ts          # Logica de juego
│       └── minigames/       # Mini-juegos
│
└── package.json             # Scripts raiz
```

## Mini-juegos incluidos

| Mini-juego | Descripcion |
|------------|-------------|
| Cooperar o Traicionar | Dilema del prisionero grupal con llamadas de voz |
| Quien Sobra? | Votacion para penalizar al jugador dominante |
| Quien Merece? | Votacion para premiar al mejor jugador |
| Adivina la Linea | Deduccion de identidad con voces distorsionadas |
| La Bomba | Pasa la bomba o intenta desactivarla antes de que explote |
| Emoji Diferente | Encuentra el emoji diferente |
| Central de Emergencias | Coordinacion en equipo bajo presion |
