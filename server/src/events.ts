import { Server, Socket } from 'socket.io'
import { GameManager } from './GameManager'
import { Decision, MetaGamePhase } from './types'
import { AdivinaLinea } from './minigames/AdivinaLinea'
import { LaBomba } from './minigames/LaBomba'
import { CentralDeEmergencias } from './minigames/CentralDeEmergencias'
import { EmojiDiferente } from './minigames/EmojiDiferente'

function getCreatorKey(socket: Socket): string {
  const forwardedFor = socket.handshake.headers['x-forwarded-for']
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  const ip = forwardedValue?.split(',')[0]?.trim() || socket.handshake.address || socket.conn.remoteAddress || socket.id
  return ip
}

function isLocalDevSocket(socket: Socket): boolean {
  if (process.env.NODE_ENV === 'production') return false

  const host = String(socket.handshake.headers.host ?? '')
  const origin = String(socket.handshake.headers.origin ?? '')
  const address = String(socket.handshake.address ?? socket.conn.remoteAddress ?? '')
  const localMarkers = ['localhost', '127.0.0.1', '::1']

  return localMarkers.some((marker) =>
    host.includes(marker) || origin.includes(marker) || address.includes(marker)
  )
}

export function registerEvents(io: Server, gameManager: GameManager): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Connect] ${socket.id}`)
    gameManager.registerConnection(socket.id)
    let lastSignalAt = 0

    // Send current global stats to the newly connected socket
    const initialStats = gameManager.getGlobalStats()
    socket.emit('global_activity', { ...initialStats })
    socket.emit('public_rooms_update', { rooms: gameManager.getPublicRooms() })
    gameManager.broadcastGlobalActivity()

    socket.on('create_game', ({ name, isPublic, avatarId, avatarColor, accessoryId }: { name: string; isPublic?: boolean; avatarId?: string; avatarColor?: string; accessoryId?: string }) => {
      const creatorKey = getCreatorKey(socket)
      const normalizedAvatarId = avatarId ?? 'neon-eyes'
      const normalizedAvatarColor = avatarColor ?? '#00e5ff'
      const normalizedAccessoryId = accessoryId ?? 'none'

      if (isPublic && !gameManager.canCreatePublicGame(creatorKey)) {
        const existingGame = gameManager.getPublicGameByCreatorKey(creatorKey)
        const reclaimedPlayer = existingGame?.reclaimPublicRoom(
          socket.id,
          name,
          normalizedAvatarId,
          normalizedAvatarColor,
          normalizedAccessoryId
        ) ?? null

        if (existingGame && reclaimedPlayer) {
          socket.emit('game_joined', { gameId: existingGame.id, playerId: reclaimedPlayer.id })
          existingGame.broadcastMetaState()
          gameManager.broadcastPublicRooms()
          return
        }

        socket.emit('error', 'Ya tienes una sala publica activa o en enfriamiento. Reutilizala o espera a que expire.')
        return
      }

      const game = gameManager.createGame(Boolean(isPublic), creatorKey)
      const metaPlayer = game.addPlayer(socket.id, name, normalizedAvatarId, normalizedAvatarColor, normalizedAccessoryId)

      if (!metaPlayer) {
        socket.emit('error', 'No se pudo crear la partida')
        return
      }

      socket.emit('game_joined', { gameId: game.id, playerId: metaPlayer.id })
      game.broadcastMetaState()
      gameManager.broadcastPublicRooms()
      gameManager.broadcastGlobalActivity({ playerName: name, action: game.isPublic ? 'creo una sala publica' : 'creo una sala' })
    })

    socket.on('join_game', ({ name, gameId, avatarId, avatarColor, accessoryId }: { name: string; gameId: string; avatarId?: string; avatarColor?: string; accessoryId?: string }) => {
      const code = gameId.toUpperCase().trim()
      const game = gameManager.getGame(code)

      if (!game) {
        socket.emit('error', 'Sala no encontrada. Verifica el codigo.')
        return
      }

      if (game.metaPhase !== MetaGamePhase.LOBBY) {
        socket.emit('error', 'La partida ya comenzo.')
        return
      }

      const metaPlayer = game.addPlayer(socket.id, name, avatarId ?? 'neon-eyes', avatarColor ?? '#00e5ff', accessoryId ?? 'none')

      if (!metaPlayer) {
        socket.emit('error', 'La sala esta llena.')
        return
      }

      socket.emit('game_joined', { gameId: game.id, playerId: metaPlayer.id })
      game.broadcastMetaState()
      gameManager.broadcastPublicRooms()
      gameManager.broadcastGlobalActivity({ playerName: name, action: 'se unio a una sala' })
    })

    socket.on('start_game', (data?: { selectedMinigameIds?: string[] }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      if (result.game.hostId !== result.metaPlayer.id) {
        socket.emit('error', 'Solo el anfitrion puede iniciar')
        return
      }

      result.game.startSession({
        selectedMinigameIds: isLocalDevSocket(socket) ? data?.selectedMinigameIds : undefined,
      })
      gameManager.broadcastPublicRooms()
      gameManager.broadcastGlobalActivity()
    })

    socket.on('call_player', (targetId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      minigame.callPlayer(result.metaPlayer.id, targetId)
    })

    socket.on('accept_call', (callId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      const players = (minigame as any).players as Map<string, any>
      result.game.callManagerInstance.acceptCall(callId, players, io)
      minigame.broadcastState()
    })

    socket.on('reject_call', (callId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      const players = (minigame as any).players as Map<string, any>
      result.game.callManagerInstance.rejectCall(callId, players, io)
      minigame.broadcastState()
    })

    socket.on('hang_up', () => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      const players = (minigame as any).players as Map<string, any>
      result.game.callManagerInstance.hangUp(result.metaPlayer.id, players, io)
      minigame.broadcastState()
    })

    socket.on('submit_decision', (decision: Decision) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      if (decision !== Decision.COOPERATE && decision !== Decision.BETRAY) {
        socket.emit('error', 'Decision invalida')
        return
      }

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      minigame.submitDecision(result.metaPlayer.id, decision)
    })

    socket.on('vote_player', (targetPlayerId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      minigame.votePlayer(result.metaPlayer.id, targetPlayerId)
    })

    socket.on('use_shadow_interference', (targetPlayerId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      minigame.useShadowInterference(result.metaPlayer.id, targetPlayerId)
    })

    socket.on('submit_line_guesses', (guesses: Record<string, string>) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      if ('submitLineGuesses' in minigame) {
        (minigame as AdivinaLinea).submitLineGuesses(result.metaPlayer.id, guesses)
      }
    })

    socket.on('pass_bomb', (targetPlayerId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return
      if (!(minigame instanceof LaBomba)) return

      minigame.passBomb(result.metaPlayer.id, targetPlayerId)
    })

    socket.on('attempt_defuse', () => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return
      if (!(minigame instanceof LaBomba)) return

      minigame.attemptDefuse(result.metaPlayer.id)
    })

    socket.on('submit_sabotage', (data: { field: string; value: string }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame || !(minigame instanceof CentralDeEmergencias)) return

      minigame.submitSabotage(result.metaPlayer.id, data)
    })

    socket.on('submit_report', (text: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame || !(minigame instanceof CentralDeEmergencias)) return

      minigame.submitReport(result.metaPlayer.id, text)
    })

    socket.on('vote_emoji', (targetPlayerId: string) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame || !(minigame instanceof EmojiDiferente)) return

      minigame.voteEmoji(result.metaPlayer.id, targetPlayerId)
    })

    socket.on('submit_emergency_response', (optionIndex: number) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame || !(minigame instanceof CentralDeEmergencias)) return

      minigame.submitEmergencyResponse(result.metaPlayer.id, optionIndex)
    })

    socket.on('send_signal', (data: { emoji: string; label: string }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const now = Date.now()
      if (now - lastSignalAt < 8000) {
        socket.emit('error', 'Espera un momento antes de enviar otra senal.')
        return
      }

      const emoji = String(data.emoji ?? '').slice(0, 4)
      const label = String(data.label ?? '').slice(0, 24)
      const allowedSignals = new Set([
        '👀|OJO',
        '⚠️|CUIDADO',
        '🤝|CONFIA',
        '❌|MENTIRA',
        '❓|DUDA',
        '🔥|TENSION',
        '🧨|PELIGRO',
        '📡|ESCUCHEN',
      ])

      if (!allowedSignals.has(`${emoji}|${label}`)) {
        socket.emit('error', 'Senal invalida.')
        return
      }

      lastSignalAt = now
      io.to(`game:${result.game.id}`).emit('signal_broadcast', {
        playerId: result.metaPlayer.id,
        playerName: result.metaPlayer.name,
        emoji,
        label,
      })
    })

    socket.on('continue_to_next', (data?: { selectedMinigameIds?: string[] }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      result.game.continueToNext(result.metaPlayer.id, {
        selectedMinigameIds: isLocalDevSocket(socket) ? data?.selectedMinigameIds : undefined,
      })
    })

    socket.on('skip_to_finish', () => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      // Only host can skip
      if (result.game.hostId !== result.metaPlayer.id) return

      const minigame = result.game.getCurrentMinigame()
      if (!minigame) return

      minigame.skipToFinish()
    })

    // WebRTC Signaling
    socket.on('webrtc_offer', ({ targetId, offer }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const target = result.game.metaPlayers.get(targetId)
      if (!target) return

      io.to(target.socketId).emit('webrtc_offer', {
        fromId: result.metaPlayer.id,
        offer
      })
    })

    socket.on('webrtc_answer', ({ targetId, answer }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const target = result.game.metaPlayers.get(targetId)
      if (!target) return

      io.to(target.socketId).emit('webrtc_answer', {
        fromId: result.metaPlayer.id,
        answer
      })
    })

    socket.on('webrtc_ice_candidate', ({ targetId, candidate }) => {
      const result = gameManager.getGameBySocket(socket.id)
      if (!result) return

      const target = result.game.metaPlayers.get(targetId)
      if (!target) return

      io.to(target.socketId).emit('webrtc_ice_candidate', {
        fromId: result.metaPlayer.id,
        candidate
      })
    })

    socket.on('disconnect', () => {
      console.log(`[Disconnect] ${socket.id}`)
      gameManager.handleDisconnect(socket.id)
      gameManager.broadcastPublicRooms()
      gameManager.broadcastGlobalActivity()
    })
  })
}
