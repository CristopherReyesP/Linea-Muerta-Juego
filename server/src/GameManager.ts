import { Server } from 'socket.io'
import { MetaGame } from './MetaGame'
import { MetaPlayer } from './MetaPlayer'
import { v4 as uuid } from 'uuid'

export class GameManager {
  private games: Map<string, MetaGame> = new Map()
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  createGame(): MetaGame {
    const id = uuid().slice(0, 6).toUpperCase()
    const game = new MetaGame(id, this.io)
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

  cleanupEmptyGames(): void {
    for (const [id, game] of this.games) {
      const hasConnected = Array.from(game.players.values()).some(p => p.isConnected)
      if (!hasConnected) {
        this.games.delete(id)
      }
    }
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

  broadcastGlobalActivity(notification?: { playerName: string; action: string }): void {
    const stats = this.getGlobalStats()
    this.io.emit('global_activity', {
      ...stats,
      notification,
    })
  }
}
