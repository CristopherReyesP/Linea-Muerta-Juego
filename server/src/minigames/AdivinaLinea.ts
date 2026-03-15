import { Server } from 'socket.io'
import { Player } from '../Player'
import { CallManager } from '../CallManager'
import {
  GamePhase, PlayerState, MiniGameInfo,
  GameStateSnapshot
} from '../types'
import { MiniGame } from './MiniGame'

enum AdivinaPhase {
  CALL_PHASE = 'CALL_PHASE',
  GUESSING_PHASE = 'DECISION_PHASE', // Reuse DECISION_PHASE on client
  RESULT_PHASE = 'RESULT_PHASE',
  GAME_OVER = 'GAME_OVER'
}

export class AdivinaLinea extends MiniGame {
  readonly info: MiniGameInfo = {
    id: 'adivina-linea',
    name: 'Adivina la Linea',
    shortDescription: 'Las identidades estan ocultas y las voces distorsionadas. Llama a las lineas y adivina quien esta detras de cada una.'
  }

  private phase: AdivinaPhase = AdivinaPhase.CALL_PHASE
  private gameId: string

  // lineNumber (1-indexed string) -> playerId
  private lineAssignments: Map<string, string> = new Map()
  // playerId -> lineNumber
  private playerToLine: Map<string, string> = new Map()
  // playerId -> { lineNumber -> guessedPlayerId }
  private guesses: Map<string, Record<string, string>> = new Map()

  private callDuration = 300 // 5 minutes
  private guessDuration = 30
  private resultDuration = 8

  constructor(
    io: Server,
    room: string,
    players: Map<string, Player>,
    callManager: CallManager,
    gameId: string
  ) {
    super(io, room, players, callManager)
    this.gameId = gameId
  }

  getPhase(): GamePhase {
    return this.phase as unknown as GamePhase
  }

  start(): void {
    // Assign random line numbers to players
    const playerIds = Array.from(this.players.keys()).filter(
      id => this.players.get(id)!.state !== PlayerState.DISCONNECTED
    )

    // Shuffle player IDs
    const shuffled = [...playerIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Assign line numbers
    shuffled.forEach((playerId, index) => {
      const lineNumber = String(index + 1)
      this.lineAssignments.set(lineNumber, playerId)
      this.playerToLine.set(playerId, lineNumber)
    })

    for (const player of this.players.values()) {
      player.state = PlayerState.ACTIVE
    }

    // Send each player their own line number and the list of lines (without revealing who is who)
    this.sendLineAssignments()

    // Enable voice distortion on all clients
    this.io.to(this.room).emit('voice_distortion', { enabled: true })

    this.startPhase(AdivinaPhase.CALL_PHASE)
  }

  private sendLineAssignments(): void {
    // Only send line numbers - do NOT reveal which playerId is behind each line
    const lines = Array.from(this.lineAssignments.keys()).map(lineNumber => ({
      lineNumber: parseInt(lineNumber),
    }))

    const playerNames = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)
      .map(p => ({ playerId: p.id, name: p.name }))

    for (const [playerId, player] of this.players) {
      const myLineNumber = parseInt(this.playerToLine.get(playerId) ?? '0')
      this.io.to(player.socketId).emit('line_assignments', {
        myLineNumber,
        lines,
        playerNames
      })
    }
  }

  private startPhase(phase: AdivinaPhase): void {
    this.phase = phase

    let duration = 0
    switch (phase) {
      case AdivinaPhase.CALL_PHASE:
        duration = this.callDuration
        break
      case AdivinaPhase.GUESSING_PHASE:
        duration = this.guessDuration
        this.onGuessingPhaseStart()
        // If onGuessingPhaseStart already advanced to the next phase, bail out
        if (this.phase !== AdivinaPhase.GUESSING_PHASE) return
        break
      case AdivinaPhase.RESULT_PHASE:
        duration = this.resultDuration
        this.onResultPhaseStart()
        break
    }

    this.phaseEndTime = Date.now() + duration * 1000

    this.io.to(this.room).emit('phase_changed', {
      phase: this.phase as unknown as GamePhase,
      endTime: this.phaseEndTime
    })

    this.broadcastState()

    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.phaseTimer = setTimeout(() => this.advancePhase(), duration * 1000)
  }

  private advancePhase(): void {
    switch (this.phase) {
      case AdivinaPhase.CALL_PHASE:
        this.startPhase(AdivinaPhase.GUESSING_PHASE)
        break
      case AdivinaPhase.GUESSING_PHASE:
        this.startPhase(AdivinaPhase.RESULT_PHASE)
        break
      case AdivinaPhase.RESULT_PHASE:
        this.finishGame()
        break
    }
  }

  private onGuessingPhaseStart(): void {
    this.callManager.endAllCalls(this.players, this.io)
    // Don't clear guesses - keep any submitted during call phase

    for (const player of this.players.values()) {
      if (player.state !== PlayerState.DISCONNECTED) {
        // If already submitted guesses during call phase, lock them
        player.state = this.hasCompleteSubmission(player.id) ? PlayerState.LOCKED : PlayerState.DECIDING
      }
    }

    this.io.to(this.room).emit('decision_requested')

    // If everyone already submitted during call phase, skip ahead
    const allGuessed = this.haveAllParticipantsSubmittedComplete()

    if (allGuessed) {
      if (this.phaseTimer) clearTimeout(this.phaseTimer)
      this.startPhase(AdivinaPhase.RESULT_PHASE)
    }
  }

  private onResultPhaseStart(): void {
    // Disable voice distortion
    this.io.to(this.room).emit('voice_distortion', { enabled: false })

    // Calculate scores
    const scores: Record<string, number> = {}
    for (const [playerId] of this.players) {
      scores[playerId] = 0
    }

    for (const [playerId, playerGuesses] of this.guesses) {
      for (const [lineNumber, guessedPlayerId] of Object.entries(playerGuesses)) {
        const actualPlayerId = this.lineAssignments.get(lineNumber)
        if (actualPlayerId === guessedPlayerId) {
          scores[playerId] = (scores[playerId] ?? 0) + 1
        }
      }
    }

    // Build reveal data
    const assignments = Array.from(this.lineAssignments.entries()).map(([lineNumber, playerId]) => ({
      lineNumber: parseInt(lineNumber),
      playerId,
      playerName: this.players.get(playerId)?.name ?? '???'
    }))

    // Find winner
    let maxScore = 0
    let winnerId = ''
    for (const [playerId, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        winnerId = playerId
      }
    }

    this.io.to(this.room).emit('line_guess_results', {
      assignments,
      scores,
      winnerId,
      winnerName: this.players.get(winnerId)?.name ?? 'Nadie'
    })

    this.broadcastState()
  }

  private finishGame(): void {
    this.phase = AdivinaPhase.GAME_OVER
    if (this.phaseTimer) clearTimeout(this.phaseTimer)

    // Calculate scores again for standings
    const scores: Record<string, number> = {}
    for (const [playerId] of this.players) {
      scores[playerId] = 0
    }

    for (const [playerId, playerGuesses] of this.guesses) {
      for (const [lineNumber, guessedPlayerId] of Object.entries(playerGuesses)) {
        const actualPlayerId = this.lineAssignments.get(lineNumber)
        if (actualPlayerId === guessedPlayerId) {
          scores[playerId] = (scores[playerId] ?? 0) + 1
        }
      }
    }

    let maxScore = 0
    let winnerId = ''
    for (const [playerId, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        winnerId = playerId
      }
    }

    const allPlayers = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)
      .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))

    const standings = allPlayers.map(p => ({
      name: p.name,
      balance: scores[p.id] ?? 0,
      isShadow: false,
      avatarId: p.avatarId,
      avatarColor: p.avatarColor,
      accessoryId: p.accessoryId,
    }))

    this.io.to(this.room).emit('game_over', {
      winnerId,
      winnerName: this.players.get(winnerId)?.name ?? 'Nadie',
      reason: `${this.players.get(winnerId)?.name ?? 'Nadie'} adivino ${maxScore} linea${maxScore !== 1 ? 's' : ''} correctamente`,
      standings
    })

    this.emitComplete({
      minigameId: this.info.id,
      minigameName: this.info.name,
      winnerId,
      winnerName: this.players.get(winnerId)?.name ?? 'Nadie',
      standings
    })
  }

  // Get winner ID for MetaGame scoring
  getWinnerId(): string {
    return this.getTopScorerIds()[0] ?? ''
  }

  getTopScorerIds(): string[] {
    const scores: Record<string, number> = {}
    for (const [playerId, playerGuesses] of this.guesses) {
      scores[playerId] = 0
      for (const [lineNumber, guessedPlayerId] of Object.entries(playerGuesses)) {
        const actualPlayerId = this.lineAssignments.get(lineNumber)
        if (actualPlayerId === guessedPlayerId) {
          scores[playerId]++
        }
      }
    }

    let maxScore = 0
    for (const score of Object.values(scores)) {
      if (score > maxScore) maxScore = score
    }
    // Only award winners if someone actually guessed correctly
    if (maxScore === 0) return []
    return Object.entries(scores)
      .filter(([, score]) => score === maxScore)
      .map(([playerId]) => playerId)
  }

  submitLineGuesses(playerId: string, guesses: Record<string, string>): boolean {
    // Allow submitting during both CALL_PHASE and GUESSING_PHASE
    if (this.phase !== AdivinaPhase.CALL_PHASE && this.phase !== AdivinaPhase.GUESSING_PHASE) return false
    const player = this.players.get(playerId)
    if (!player) return false

    // Always allow updating guesses (overwrite previous)
    this.guesses.set(playerId, guesses)

    // Check if all players have submitted
    const allGuessed = this.haveAllParticipantsSubmittedComplete()

    if (this.phase === AdivinaPhase.GUESSING_PHASE) {
      player.state = this.hasCompleteSubmission(playerId) ? PlayerState.LOCKED : PlayerState.DECIDING
      this.broadcastState()

      if (allGuessed) {
        if (this.phaseTimer) clearTimeout(this.phaseTimer)
        this.startPhase(AdivinaPhase.RESULT_PHASE)
      }
    } else if (this.phase === AdivinaPhase.CALL_PHASE && allGuessed) {
      // All submitted during call phase - skip guessing, go straight to results
      if (this.phaseTimer) clearTimeout(this.phaseTimer)
      this.callManager.endAllCalls(this.players, this.io)
      this.startPhase(AdivinaPhase.RESULT_PHASE)
    }

    return true
  }

  private getParticipantIds(): string[] {
    return Array.from(this.playerToLine.keys()).filter((id) => {
      const player = this.players.get(id)
      return Boolean(player) && player!.state !== PlayerState.DISCONNECTED
    })
  }

  private hasCompleteSubmission(playerId: string): boolean {
    const submission = this.guesses.get(playerId)
    if (!submission) return false
    const myLine = this.playerToLine.get(playerId)
    if (!myLine) return false

    const requiredLines = Array.from(this.lineAssignments.keys()).filter((line) => line !== myLine)
    if (requiredLines.length === 0) return false

    for (const line of requiredLines) {
      const guessedPlayerId = submission[line]
      if (!guessedPlayerId) return false
      if (!this.players.has(guessedPlayerId)) return false
    }
    return true
  }

  private haveAllParticipantsSubmittedComplete(): boolean {
    const participants = this.getParticipantIds()
    if (participants.length === 0) return false
    return participants.every((id) => this.hasCompleteSubmission(id))
  }

  skipToFinish(): void {
    if (this.phase !== AdivinaPhase.RESULT_PHASE) return
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.finishGame()
  }

  // Override getSnapshot to anonymize player names
  getSnapshot(): GameStateSnapshot {
    const anonymizedPlayers = Array.from(this.players.values()).map(p => {
      const lineNumber = this.playerToLine.get(p.id)
      const data = p.toData()

      // During call and guessing phases, hide real names - show line number
      if (this.phase !== AdivinaPhase.GAME_OVER && this.phase !== AdivinaPhase.RESULT_PHASE) {
        data.name = `Linea ${lineNumber ?? '?'}`
      }

      return data
    })

    return {
      gameId: this.gameId,
      minigameId: this.info.id,
      phase: this.phase as unknown as GamePhase,
      round: 1,
      maxRounds: 1,
      players: anonymizedPlayers,
      phaseEndTime: this.phaseEndTime,
      activeCalls: this.callManager.getActiveCalls()
    }
  }

  cleanup(): void {
    super.cleanup()
    this.io.to(this.room).emit('voice_distortion', { enabled: false })
  }
}
