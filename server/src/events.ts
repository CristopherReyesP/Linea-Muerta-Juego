import { Server, Socket } from 'socket.io'
import { GameManager } from './GameManager'
import { Player } from './Player'
import { Decision } from './types'

export function registerEvents(io: Server, gameManager: GameManager): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Connect] ${socket.id}`)

    socket.on('create_game', ({ name }: { name: string }) => {
      const game = gameManager.createGame()
      const player = new Player(socket.id, name)

      if (!game.addPlayer(player)) {
        socket.emit('error', 'No se pudo crear la partida')
        return
      }

      socket.emit('game_joined', { gameId: game.id, playerId: player.id })
      game.broadcastState()
    })

    socket.on('join_game', ({ name, gameId }: { name: string; gameId: string }) => {
      const code = gameId.toUpperCase().trim()
      const game = gameManager.getGame(code)

      if (!game) {
        socket.emit('error', 'Sala no encontrada. Verifica el codigo.')
        return
      }

      if (game.phase !== 'LOBBY') {
        socket.emit('error', 'La partida ya comenzo.')
        return
      }

      const player = new Player(socket.id, name)

      if (!game.addPlayer(player)) {
        socket.emit('error', 'La sala esta llena.')
        return
      }

      socket.emit('game_joined', { gameId: game.id, playerId: player.id })
      game.broadcastState()
    })

    socket.on('start_game', () => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      if (result.game.hostId !== result.player.id) {
        socket.emit('error', 'Solo el anfitrion puede iniciar')
        return
      }

      result.game.startGame()
    })

    socket.on('call_player', (targetId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      result.game.callPlayer(result.player.id, targetId)
    })

    socket.on('accept_call', (callId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      result.game.callManager.acceptCall(callId, result.game.players, io)
      result.game.broadcastState()
    })

    socket.on('reject_call', (callId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      result.game.callManager.rejectCall(callId, result.game.players, io)
      result.game.broadcastState()
    })

    socket.on('hang_up', () => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      result.game.callManager.hangUp(result.player.id, result.game.players, io)
      result.game.broadcastState()
    })

    socket.on('submit_decision', (decision: Decision) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      if (decision !== Decision.COOPERATE && decision !== Decision.BETRAY) {
        socket.emit('error', 'Decision invalida')
        return
      }

      result.game.submitDecision(result.player.id, decision)
    })

    socket.on('use_shadow_interference', (targetPlayerId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      result.game.useShadowInterference(result.player.id, targetPlayerId)
    })

    // WebRTC Signaling
    socket.on('webrtc_offer', ({ targetId, offer }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      const target = result.game.players.get(targetId)
      if (!target) return

      io.to(target.socketId).emit('webrtc_offer', {
        fromId: result.player.id,
        offer
      })
    })

    socket.on('webrtc_answer', ({ targetId, answer }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      const target = result.game.players.get(targetId)
      if (!target) return

      io.to(target.socketId).emit('webrtc_answer', {
        fromId: result.player.id,
        answer
      })
    })

    socket.on('webrtc_ice_candidate', ({ targetId, candidate }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result?.player || !result.game) return

      const target = result.game.players.get(targetId)
      if (!target) return

      io.to(target.socketId).emit('webrtc_ice_candidate', {
        fromId: result.player.id,
        candidate
      })
    })

    socket.on('disconnect', () => {
      console.log(`[Disconnect] ${socket.id}`)
      gameManager.handleDisconnect(socket.id)
    })
  })
}
