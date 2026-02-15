import { Server } from 'socket.io'
import { MetaPlayer } from './MetaPlayer'
import { Player } from './Player'
import { CallManager } from './CallManager'
import { MiniGame } from './minigames/MiniGame'
import { CooperarTraicionar } from './minigames/CooperarTraicionar'
import { VotacionSobra } from './minigames/VotacionSobra'
import { VotacionMerece } from './minigames/VotacionMerece'
import { AdivinaLinea } from './minigames/AdivinaLinea'
import { LaBomba } from './minigames/LaBomba'
import { v4 as uuid } from 'uuid'
import {
  MetaGamePhase, PlayerState, MiniGameInfo, MinigameResult,
  MetaGameStateSnapshot, DEFAULT_CONFIG
} from './types'

// Registry of all available minigames
const MINIGAME_REGISTRY: MiniGameInfo[] = [
  {
    id: 'cooperar-traicionar',
    name: 'Cooperar o Traicionar',
    shortDescription: 'Negocia por telefono y decide: cooperar o traicionar. La mayoria define tu destino.'
  },
  {
    id: 'votacion-sobra',
    name: 'Quien Sobra?',
    shortDescription: 'Vota por quien crees que domina demasiado. El mas votado pierde 1 punto global.'
  },
  {
    id: 'votacion-merece',
    name: 'Quien Merece?',
    shortDescription: 'Vota por quien merece seguir adelante. El mas votado gana 1 punto global.'
  },
  {
    id: 'adivina-linea',
    name: 'Adivina la Linea',
    shortDescription: 'Las identidades estan ocultas y las voces distorsionadas. Llama a las lineas y adivina quien esta detras de cada una.'
  },
  {
    id: 'la-bomba',
    name: 'La Bomba',
    shortDescription: 'La bomba corre durante 30s. Desactiva o pasala a otro jugador para aumentar la probabilidad.'
  },
]

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export class MetaGame {
  id: string
  metaPhase: MetaGamePhase = MetaGamePhase.LOBBY
  metaPlayers: Map<string, MetaPlayer> = new Map()
  hostId: string | null = null
  private io: Server
  private callManager: CallManager = new CallManager()

  private selectedMinigames: MiniGameInfo[] = []
  private currentMinigameIndex: number = 0
  private currentMinigame: MiniGame | null = null
  private minigameHistory: MinigameResult[] = []
  private phaseTimer: NodeJS.Timeout | null = null

  private readonly TOTAL_MINIGAMES = 5

  constructor(id: string, io: Server) {
    this.id = id
    this.io = io
  }

  private get room(): string {
    return `game:${this.id}`
  }

  // --- Lobby ---

  addPlayer(
    socketId: string,
    name: string,
    avatarId: string = 'neon-eyes',
    avatarColor: string = '#00e5ff',
    accessoryId: string = 'none'
  ): MetaPlayer | null {
    if (this.metaPlayers.size >= DEFAULT_CONFIG.maxPlayers) return null
    if (this.metaPhase !== MetaGamePhase.LOBBY) return null

    const player = new MetaPlayer(uuid(), socketId, name, avatarId, avatarColor, accessoryId)
    this.metaPlayers.set(player.id, player)

    if (!this.hostId) this.hostId = player.id

    this.io.to(socketId).socketsJoin(this.room)
    this.broadcastMetaState()
    return player
  }

  removePlayer(playerId: string): void {
    const mp = this.metaPlayers.get(playerId)
    if (!mp) return

    mp.isConnected = false

    // Delegate to current minigame if active
    if (this.currentMinigame) {
      const mgPlayer = this.currentMinigame.getPlayerBySocketId(mp.socketId)
      if (mgPlayer) {
        // Just mark disconnected in the minigame's player map
        mgPlayer.state = PlayerState.DISCONNECTED
        this.callManager.hangUp(mgPlayer.id, this.getMinigamePlayers(), this.io)
      }
    }

    // Transfer host
    if (this.hostId === playerId) {
      for (const [id, p] of this.metaPlayers) {
        if (id !== playerId && p.isConnected) {
          this.hostId = id
          break
        }
      }
    }

    this.broadcastMetaState()
  }

  reconnectPlayer(playerId: string, newSocketId: string): boolean {
    const mp = this.metaPlayers.get(playerId)
    if (!mp) return false

    mp.socketId = newSocketId
    mp.isConnected = true
    this.io.to(newSocketId).socketsJoin(this.room)
    this.broadcastMetaState()
    return true
  }

  // --- Session flow ---

  startSession(options?: { selectedMinigameIds?: string[] }): void {
    if (this.metaPlayers.size < DEFAULT_CONFIG.minPlayers) return
    if (this.metaPhase !== MetaGamePhase.LOBBY) return

    const requestedIds = options?.selectedMinigameIds ?? []
    const hasDevSelection = requestedIds.length > 0

    if (hasDevSelection) {
      const selected = requestedIds
        .map((id) => MINIGAME_REGISTRY.find((minigame) => minigame.id === id))
        .filter((minigame): minigame is MiniGameInfo => Boolean(minigame))

      if (selected.length === 0) return

      this.selectedMinigames = []
      for (let i = 0; i < this.TOTAL_MINIGAMES; i++) {
        this.selectedMinigames.push(selected[i % selected.length])
      }
    } else {
      // Select minigames: shuffle registry and pick up to TOTAL_MINIGAMES
      // If registry has fewer, repeat some
      const shuffled = shuffleArray(MINIGAME_REGISTRY)
      this.selectedMinigames = []
      for (let i = 0; i < this.TOTAL_MINIGAMES; i++) {
        this.selectedMinigames.push(shuffled[i % shuffled.length])
      }
    }

    this.currentMinigameIndex = 0
    this.startMinigameIntro()
  }

  private startMinigameIntro(): void {
    this.metaPhase = MetaGamePhase.MINIGAME_INTRO

    const info = this.selectedMinigames[this.currentMinigameIndex]

    this.io.to(this.room).emit('minigame_intro', {
      minigame: info,
      index: this.currentMinigameIndex,
      total: this.TOTAL_MINIGAMES
    })

    this.broadcastMetaState()

    // After 3 seconds, start the minigame
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.phaseTimer = setTimeout(() => this.startCurrentMinigame(), 3000)
  }

  private startCurrentMinigame(): void {
    this.metaPhase = MetaGamePhase.MINIGAME_IN_PROGRESS

    const info = this.selectedMinigames[this.currentMinigameIndex]
    const players = this.createMinigamePlayers()

    // Clean call manager
    this.callManager = new CallManager()

    const minigame = this.createMinigame(info.id, players)
    if (!minigame) return

    this.currentMinigame = minigame

    minigame.onComplete = (result: MinigameResult) => {
      this.onMinigameComplete(result)
    }

    this.broadcastMetaState()
    minigame.start()
  }

  private createMinigame(id: string, players: Map<string, Player>): MiniGame | null {
    switch (id) {
      case 'cooperar-traicionar':
        return new CooperarTraicionar(this.io, this.room, players, this.callManager, this.id)
      case 'votacion-sobra':
        return new VotacionSobra(this.io, this.room, players, this.callManager, this.id)
      case 'votacion-merece':
        return new VotacionMerece(this.io, this.room, players, this.callManager, this.id)
      case 'adivina-linea':
        return new AdivinaLinea(this.io, this.room, players, this.callManager, this.id)
      case 'la-bomba':
        return new LaBomba(this.io, this.room, players, this.callManager, this.id)
      default:
        return null
    }
  }

  private createMinigamePlayers(): Map<string, Player> {
    const players = new Map<string, Player>()

    for (const [metaId, mp] of this.metaPlayers) {
      if (!mp.isConnected) continue

      const player = new Player(mp.socketId, mp.name, mp.avatarId, mp.avatarColor, mp.accessoryId)
      // Override the auto-generated id with the metaPlayer id so they match
      ;(player as any).id = metaId
      player.balance = DEFAULT_CONFIG.initialBalance
      player.state = PlayerState.ACTIVE
      player.isAlive = true
      player.isShadow = false
      player.shadowCharges = 0
      player.rachaCooperar = 0
      player.rachaTraicionar = 0

      players.set(metaId, player)
    }

    return players
  }

  private onMinigameComplete(result: MinigameResult): void {
    this.minigameHistory.push(result)

    // Award global score based on minigame type
    const info = this.selectedMinigames[this.currentMinigameIndex]

    if (info.id === 'cooperar-traicionar') {
      // Winner of cooperar/traicionar gets +1 global
      if (result.winnerId) {
        const mp = this.metaPlayers.get(result.winnerId)
        if (mp) mp.addWin()
      }
    } else if (info.id === 'votacion-sobra') {
      // Most voted loses 1 global point
      const minigame = this.currentMinigame as VotacionSobra
      const mostVotedId = minigame.getMostVotedId()
      if (mostVotedId) {
        const mp = this.metaPlayers.get(mostVotedId)
        if (mp) mp.adjustScore(-1)
      }
    } else if (info.id === 'votacion-merece') {
      // Most voted gains 1 global point
      const minigame = this.currentMinigame as VotacionMerece
      const mostVotedId = minigame.getMostVotedId()
      if (mostVotedId) {
        const mp = this.metaPlayers.get(mostVotedId)
        if (mp) mp.addWin()
      }
    } else if (info.id === 'adivina-linea') {
      // Winner (most correct guesses) gets +1 global
      if (result.winnerId) {
        const mp = this.metaPlayers.get(result.winnerId)
        if (mp) mp.addWin()
      }
    } else if (info.id === 'la-bomba') {
      // Successful defuse: +2 global points. Explosion: holder -2 global points.
      if (result.winnerId) {
        const mp = this.metaPlayers.get(result.winnerId)
        if (mp) mp.adjustScore(2)
      } else {
        const bombGame = this.currentMinigame as LaBomba
        const explodedHolderId = bombGame.getExplodedHolderId()
        if (explodedHolderId) {
          const mp = this.metaPlayers.get(explodedHolderId)
          if (mp) mp.adjustScore(-2)
        }
      }
    }

    // Clean up current minigame
    if (this.currentMinigame) {
      this.currentMinigame.cleanup()
      this.currentMinigame = null
    }

    // Check if session is complete
    if (this.currentMinigameIndex >= this.TOTAL_MINIGAMES - 1) {
      this.endSession()
    } else {
      this.startDiscussion()
    }
  }

  private startDiscussion(): void {
    this.metaPhase = MetaGamePhase.DISCUSSION

    const lastResult = this.minigameHistory[this.minigameHistory.length - 1]
    const nextInfo = this.currentMinigameIndex < this.TOTAL_MINIGAMES - 1
      ? this.selectedMinigames[this.currentMinigameIndex + 1]
      : null

    this.io.to(this.room).emit('discussion_started', {
      completedResult: lastResult,
      globalScoreboard: this.getGlobalScoreboard(),
      nextMinigame: nextInfo,
      currentIndex: this.currentMinigameIndex,
      totalMinigames: this.TOTAL_MINIGAMES
    })

    // Send open voice signal so clients connect audio with everyone
    const playerIds = Array.from(this.metaPlayers.values())
      .filter(p => p.isConnected)
      .map(p => p.id)

    this.io.to(this.room).emit('open_voice', { playerIds })

    this.broadcastMetaState()
  }

  continueToNext(playerId: string): void {
    if (playerId !== this.hostId) return
    if (this.metaPhase !== MetaGamePhase.DISCUSSION) return

    this.currentMinigameIndex++
    this.startMinigameIntro()
  }

  private endSession(): void {
    this.metaPhase = MetaGamePhase.SESSION_COMPLETE

    const scoreboard = this.getGlobalScoreboard()
    const sorted = [...scoreboard].sort((a, b) => b.globalScore - a.globalScore)
    const winner = sorted[0]

    this.io.to(this.room).emit('session_complete', {
      overallWinnerId: winner?.playerId ?? '',
      overallWinnerName: winner?.name ?? 'Nadie',
      globalScoreboard: scoreboard,
      history: this.minigameHistory
    })

    this.broadcastMetaState()
  }

  // --- Delegate to current minigame ---

  getCurrentMinigame(): MiniGame | null {
    return this.currentMinigame
  }

  private getMinigamePlayers(): Map<string, Player> {
    if (!this.currentMinigame) return new Map()
    // Access via the minigame's players (they're set in constructor)
    return (this.currentMinigame as any).players
  }

  // --- State ---

  private getGlobalScoreboard(): Array<{ playerId: string; name: string; avatarId: string; avatarColor: string; accessoryId: string; globalScore: number }> {
    return Array.from(this.metaPlayers.values())
      .filter(p => p.isConnected)
      .map(p => ({ playerId: p.id, name: p.name, avatarId: p.avatarId, avatarColor: p.avatarColor, accessoryId: p.accessoryId, globalScore: p.globalScore }))
      .sort((a, b) => b.globalScore - a.globalScore)
  }

  getMetaSnapshot(): MetaGameStateSnapshot {
    return {
      gameId: this.id,
      metaPhase: this.metaPhase,
      currentMinigameIndex: this.currentMinigameIndex,
      totalMinigames: this.TOTAL_MINIGAMES,
      currentMinigameInfo: this.selectedMinigames[this.currentMinigameIndex] ?? null,
      globalScoreboard: this.getGlobalScoreboard(),
      hostId: this.hostId,
      minigameSnapshot: this.currentMinigame?.getSnapshot() ?? null
    }
  }

  broadcastMetaState(): void {
    this.io.to(this.room).emit('meta_state_update', this.getMetaSnapshot())
  }

  getPlayerBySocketId(socketId: string): MetaPlayer | undefined {
    for (const mp of this.metaPlayers.values()) {
      if (mp.socketId === socketId) return mp
    }
    return undefined
  }

  get callManagerInstance(): CallManager {
    return this.callManager
  }

  get players(): Map<string, MetaPlayer> {
    return this.metaPlayers
  }
}
