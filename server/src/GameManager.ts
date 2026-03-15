import { Server } from 'socket.io'
import { MetaGame } from './MetaGame'
import { MetaPlayer } from './MetaPlayer'
import { PublicRoomSummary } from './types'
import { v4 as uuid } from 'uuid'

export class GameManager {
  private games: Map<string, MetaGame> = new Map()
  private io: Server
  private cleanupTimer: NodeJS.Timeout

  constructor(io: Server) {
    this.io = io
    this.cleanupTimer = setInterval(() => {
      if (this.cleanupEmptyGames()) {
        this.broadcastPublicRooms()
      }
    }, 60 * 1000)
  }

  createGame(isPublic: boolean = false, creatorKey: string | null = null): MetaGame {
    const id = uuid().slice(0, 6).toUpperCase()
    const game = new MetaGame(id, this.io, isPublic, creatorKey)
    this.games.set(id, game)
    return game
  }

  getGame(id: string): MetaGame | undefined {
    return this.games.get(id)
  }

  getGameBySocket(socketId: string): { game: MetaGame; metaPlayer: MetaPlayer } | null {
    for (const game of this.games.values()) {
      const mp = game.getPlayerBySocketId(socketId)
      if (mp) return { game, metaPlayer: mp }
    }
    return null
  }

  handleDisconnect(socketId: string): void {
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
      const shouldDelete = !hasConnected && (!game.isPublic || game.isStaleEmptyPublicRoom(now))

      if (shouldDelete) {
        this.games.delete(id)
        removedAny = true
      }
    }

    return removedAny
  }

  getGlobalStats(): { totalRooms: number; totalPlayers: number } {
    let totalRooms = 0
    let totalPlayers = 0
    for (const game of this.games.values()) {
      let connectedInGame = 0
      for (const mp of game.players.values()) {
        if (mp.isConnected) connectedInGame++
      }
      if (connectedInGame > 0) {
        totalRooms++
        totalPlayers += connectedInGame
      }
    }
    return { totalRooms, totalPlayers }
  }

  getPublicRooms(): PublicRoomSummary[] {
    return Array.from(this.games.values())
      .map((game) => game.getPublicSummary())
      .filter((room): room is PublicRoomSummary => Boolean(room))
      .sort((a, b) => {
        if (b.playerCount !== a.playerCount) return b.playerCount - a.playerCount
        return a.gameId.localeCompare(b.gameId)
      })
  }

  canCreatePublicGame(creatorKey: string): boolean {
    for (const game of this.games.values()) {
      if (game.isPublic && game.creatorKey === creatorKey) {
        return false
      }
    }
    return true
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
