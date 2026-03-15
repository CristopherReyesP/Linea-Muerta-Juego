import { Server } from 'socket.io'
import { MetaGame } from './MetaGame'
import { MetaPlayer } from './MetaPlayer'
import { MetaGamePhase, PublicRoomSummary } from './types'
import { v4 as uuid } from 'uuid'

export class GameManager {
  private static readonly GENERAL_PUBLIC_CREATOR_KEY = '__general_public_room__'

  private games: Map<string, MetaGame> = new Map()
  private connectedSockets: Set<string> = new Set()
  private io: Server
  private cleanupTimer: NodeJS.Timeout
  private nextPublicColorVariant: number = 0

  constructor(io: Server) {
    this.io = io
    this.ensureGeneralPublicRoom()
    this.cleanupTimer = setInterval(() => {
      if (this.cleanupEmptyGames()) {
        this.broadcastPublicRooms()
      }
    }, 5 * 1000)
  }

  private allocatePublicColorVariant(): number {
    const variant = this.nextPublicColorVariant % 3
    this.nextPublicColorVariant += 1
    return variant
  }

  createGame(
    isPublic: boolean = false,
    creatorKey: string | null = null,
    options?: { isGeneralPublic?: boolean }
  ): MetaGame {
    const id = uuid().slice(0, 6).toUpperCase()
    const game = new MetaGame(
      id,
      this.io,
      isPublic,
      creatorKey,
      options?.isGeneralPublic ?? false,
      isPublic ? this.allocatePublicColorVariant() : 0
    )
    this.games.set(id, game)
    return game
  }

  getGame(id: string): MetaGame | undefined {
    return this.games.get(id)
  }

  getPublicGameByCreatorKey(creatorKey: string): MetaGame | null {
    for (const game of this.games.values()) {
      if (game.isPublic && game.creatorKey === creatorKey) {
        return game
      }
    }
    return null
  }

  getGameBySocket(socketId: string): { game: MetaGame; metaPlayer: MetaPlayer } | null {
    for (const game of this.games.values()) {
      const mp = game.getPlayerBySocketId(socketId)
      if (mp) return { game, metaPlayer: mp }
    }
    return null
  }

  registerConnection(socketId: string): void {
    this.connectedSockets.add(socketId)
  }

  unregisterConnection(socketId: string): void {
    this.connectedSockets.delete(socketId)
  }

  handleDisconnect(socketId: string): void {
    this.unregisterConnection(socketId)
    const result = this.getGameBySocket(socketId)
    if (!result) return
    result.game.removePlayer(result.metaPlayer.id)
    this.cleanupEmptyGames()
  }

  cleanupEmptyGames(): boolean {
    let removedAny = false
    const now = Date.now()

    for (const [id, game] of this.games) {
      const hasConnected = Array.from(game.players.values()).some(p => p.isConnected)
      const shouldDelete = !hasConnected && (
        game.metaPhase !== MetaGamePhase.LOBBY
        || !game.isPublic
        || game.isStaleEmptyPublicRoom(now)
      )

      if (shouldDelete) {
        this.games.delete(id)
        removedAny = true
      }
    }

    this.ensureGeneralPublicRoom()

    return removedAny
  }

  getGlobalStats(): {
    totalRooms: number
    totalPlayers: number
    totalLobbyRooms: number
    totalLobbyPlayers: number
    totalActiveRooms: number
    totalActivePlayers: number
    totalMenuPlayers: number
  } {
    let totalRooms = 0
    let totalPlayers = 0
    let totalLobbyRooms = 0
    let totalLobbyPlayers = 0
    let totalActiveRooms = 0
    let totalActivePlayers = 0
    const playersInGames = new Set<string>()

    for (const game of this.games.values()) {
      let connectedInGame = 0
      for (const mp of game.players.values()) {
        if (mp.isConnected) {
          connectedInGame++
          playersInGames.add(mp.socketId)
        }
      }
      if (connectedInGame > 0) {
        totalRooms++
        totalPlayers += connectedInGame
        if (game.metaPhase === MetaGamePhase.LOBBY) {
          totalLobbyRooms++
          totalLobbyPlayers += connectedInGame
        } else {
          totalActiveRooms++
          totalActivePlayers += connectedInGame
        }
      }
    }

    const totalMenuPlayers = Array.from(this.connectedSockets).filter((socketId) => !playersInGames.has(socketId)).length
    totalLobbyPlayers += totalMenuPlayers
    totalPlayers += totalMenuPlayers

    return {
      totalRooms,
      totalPlayers,
      totalLobbyRooms,
      totalLobbyPlayers,
      totalActiveRooms,
      totalActivePlayers,
      totalMenuPlayers,
    }
  }

  getPublicRooms(): PublicRoomSummary[] {
    this.ensureGeneralPublicRoom()

    return Array.from(this.games.values())
      .map((game) => game.getPublicSummary())
      .filter((room): room is PublicRoomSummary => Boolean(room))
      .sort((a, b) => {
        if (a.isGeneral !== b.isGeneral) return a.isGeneral ? -1 : 1
        const aEmpty = a.playerCount === 0 ? 1 : 0
        const bEmpty = b.playerCount === 0 ? 1 : 0
        if (aEmpty !== bEmpty) return aEmpty - bEmpty
        if (b.playerCount !== a.playerCount) return b.playerCount - a.playerCount
        if (a.expiresAt !== b.expiresAt) {
          if (a.expiresAt === null) return -1
          if (b.expiresAt === null) return 1
          return a.expiresAt - b.expiresAt
        }
        return a.gameId.localeCompare(b.gameId)
      })
  }

  canCreatePublicGame(creatorKey: string): boolean {
    return !this.getPublicGameByCreatorKey(creatorKey)
  }

  private ensureGeneralPublicRoom(): void {
    const existingGeneralRoom = Array.from(this.games.values()).find(
      (game) => game.isGeneralPublic && game.metaPhase === MetaGamePhase.LOBBY
    )

    if (existingGeneralRoom) return

    this.createGame(true, GameManager.GENERAL_PUBLIC_CREATOR_KEY, { isGeneralPublic: true })
  }

  broadcastGlobalActivity(notification?: { playerName: string; action: string }): void {
    const stats = this.getGlobalStats()
    this.io.emit('global_activity', {
      ...stats,
      notification,
    })
  }

  broadcastPublicRooms(): void {
    this.io.emit('public_rooms_update', {
      rooms: this.getPublicRooms(),
    })
  }
}
