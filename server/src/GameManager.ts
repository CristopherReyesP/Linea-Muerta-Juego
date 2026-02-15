import { Server } from 'socket.io'
import { Game } from './Game'
import { v4 as uuid } from 'uuid'

export class GameManager {
  private games: Map<string, Game> = new Map()
  private playerToGame: Map<string, string> = new Map()
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  createGame(): Game {
    const id = uuid().slice(0, 6).toUpperCase()
    const game = new Game(id, this.io)
    this.games.set(id, game)
    return game
  }

  getGame(id: string): Game | undefined {
    return this.games.get(id)
  }

  getOrCreateDefaultGame(): Game {
    // For MVP, reuse the first lobby game or create a new one
    for (const game of this.games.values()) {
      if (game.phase === 'LOBBY' && game.players.size < game.config.maxPlayers) {
        return game
      }
    }
    return this.createGame()
  }

  joinGame(gameId: string | undefined, socketId: string, playerName: string): { game: Game; playerId: string } | null {
    let game: Game

    if (gameId) {
      const existing = this.games.get(gameId)
      if (!existing) return null
      game = existing
    } else {
      game = this.getOrCreateDefaultGame()
    }

    const { Player } = require('./Player')
    const player = new Player(socketId, playerName)

    if (!game.addPlayer(player)) return null

    this.playerToGame.set(player.id, game.id)

    return { game, playerId: player.id }
  }

  getGameBySocket(socketId: string): { game: Game; player: ReturnType<Game['getPlayerBySocketId']> } | null {
    for (const game of this.games.values()) {
      const player = game.getPlayerBySocketId(socketId)
      if (player) return { game, player }
    }
    return null
  }

  handleDisconnect(socketId: string): void {
    const result = this.getGameBySocket(socketId)
    if (!result || !result.player) return

    result.game.removePlayer(result.player.id)
  }

  cleanupFinishedGames(): void {
    for (const [id, game] of this.games) {
      if (game.phase === 'GAME_OVER') {
        this.games.delete(id)
      }
    }
  }
}
