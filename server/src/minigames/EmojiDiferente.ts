import { Server } from 'socket.io'
import { Player } from '../Player'
import { CallManager } from '../CallManager'
import {
  GamePhase, PlayerState, MiniGameInfo,
  GameStateSnapshot, EmojiStateData
} from '../types'
import { MiniGame } from './MiniGame'

type InternalPhase = 'REVEAL' | 'DISCUSSION' | 'VOTING' | 'RESULT'

// Large emoji pool — any 2 picked at random = N*(N-1) combinations
const EMOJI_POOL = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵',
  '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐴', '🦄', '🐝', '🐛',
  '🦋', '🐌', '🐞', '🐙', '🦑', '🦀', '🐠', '🐬', '🐳', '🦈',
  '🌸', '🌺', '🌻', '🌹', '🌷', '🌵', '🎄', '🍀', '🍁', '🍂',
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🍒', '🥝',
  '🍕', '🍔', '🌮', '🍩', '🎂', '🍿', '🍦', '🧁', '🥐', '🍪',
  '⚽', '🏀', '🎾', '🏐', '🎱', '🏆', '🎮', '🎲', '🎸', '🎺',
  '🚗', '🚀', '✈️', '🚂', '🚁', '⛵', '🏍️', '🚲', '🛸', '🚌',
  '⭐', '🌙', '☀️', '🌈', '⚡', '🔥', '💧', '❄️', '🌊', '🌪️',
  '💎', '🎩', '👑', '🎭', '🎪', '🗿', '🏰', '⛩️', '🗽', '🎡',
]

export class EmojiDiferente extends MiniGame {
  readonly info: MiniGameInfo = {
    id: 'emoji-diferente',
    name: 'Emoji Diferente',
    shortDescription: 'Todos reciben el mismo emoji menos uno. Descubre quien es el diferente.',
    minPlayers: 3,
  }

  private phase: GamePhase = GamePhase.CALL_PHASE
  private internalPhase: InternalPhase = 'REVEAL'
  private gameId: string

  private baseEmoji: string = ''
  private differentEmoji: string = ''
  private differentPlayerId: string = ''
  private votes: Map<string, string> = new Map()
  private success: boolean = false

  private readonly REVEAL_DURATION = 8
  private readonly DISCUSSION_DURATION = 45
  private readonly VOTING_DURATION = 20
  private readonly RESULT_DURATION = 6

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

  start(): void {
    // Pick 2 random different emojis from the pool (~100 emojis = ~9900 combinations)
    const baseIndex = Math.floor(Math.random() * EMOJI_POOL.length)
    let diffIndex = Math.floor(Math.random() * (EMOJI_POOL.length - 1))
    if (diffIndex >= baseIndex) diffIndex++

    this.baseEmoji = EMOJI_POOL[baseIndex]
    this.differentEmoji = EMOJI_POOL[diffIndex]

    // Pick random player to be "different"
    const playerIds = Array.from(this.players.keys())
    this.differentPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)]

    for (const player of this.players.values()) {
      player.state = PlayerState.ACTIVE
    }

    this.startInternalPhase('REVEAL')
  }

  private startInternalPhase(phase: InternalPhase): void {
    this.internalPhase = phase

    let duration = 0
    switch (phase) {
      case 'REVEAL':
        this.phase = GamePhase.CALL_PHASE
        duration = this.REVEAL_DURATION
        break
      case 'DISCUSSION':
        this.phase = GamePhase.CALL_PHASE
        duration = this.DISCUSSION_DURATION
        for (const player of this.players.values()) {
          player.setActive()
        }
        break
      case 'VOTING':
        this.phase = GamePhase.DECISION_PHASE
        duration = this.VOTING_DURATION
        this.callManager.endAllCalls(this.players, this.io)
        this.votes.clear()
        for (const player of this.players.values()) {
          player.state = PlayerState.DECIDING
        }
        break
      case 'RESULT':
        this.phase = GamePhase.RESULT_PHASE
        duration = this.RESULT_DURATION
        this.calculateResult()
        break
    }

    this.phaseEndTime = Date.now() + duration * 1000

    this.io.to(this.room).emit('phase_changed', {
      phase: this.phase,
      endTime: this.phaseEndTime,
    })

    this.broadcastState()
    this.broadcastEmojiState()

    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.phaseTimer = setTimeout(() => this.advancePhase(), duration * 1000)
  }

  private advancePhase(): void {
    switch (this.internalPhase) {
      case 'REVEAL':
        this.startInternalPhase('DISCUSSION')
        break
      case 'DISCUSSION':
        this.startInternalPhase('VOTING')
        break
      case 'VOTING':
        this.startInternalPhase('RESULT')
        break
      case 'RESULT':
        this.finishGame()
        break
    }
  }

  private calculateResult(): void {
    // Count votes for the different player
    let correctVotes = 0
    const activePlayers = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)

    for (const targetId of this.votes.values()) {
      if (targetId === this.differentPlayerId) {
        correctVotes++
      }
    }

    // Majority = more than half of voters
    const totalVoters = activePlayers.length
    this.success = correctVotes > totalVoters / 2
  }

  voteEmoji(voterId: string, targetId: string): boolean {
    if (this.internalPhase !== 'VOTING') return false
    const voter = this.players.get(voterId)
    if (!voter) return false
    if (this.votes.has(voterId)) return false
    if (voterId === targetId) return false
    if (!this.players.has(targetId)) return false

    this.votes.set(voterId, targetId)
    voter.state = PlayerState.LOCKED

    this.broadcastState()
    this.broadcastEmojiState()

    // Check if all voted
    const allVoted = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)
      .every(p => this.votes.has(p.id))

    if (allVoted) {
      if (this.phaseTimer) clearTimeout(this.phaseTimer)
      this.startInternalPhase('RESULT')
    }

    return true
  }

  private broadcastEmojiState(): void {
    const isResult = this.internalPhase === 'RESULT'
    const differentPlayer = this.players.get(this.differentPlayerId)
    const votesObj: Record<string, string> = {}
    if (isResult) {
      for (const [voterId, targetId] of this.votes) {
        votesObj[voterId] = targetId
      }
    }

    const voteCount = this.votes.size
    const totalVoters = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED).length

    for (const [playerId, player] of this.players) {
      const isDifferent = playerId === this.differentPlayerId
      const state: EmojiStateData = {
        internalPhase: this.internalPhase,
        myEmoji: isDifferent ? this.differentEmoji : this.baseEmoji,
        isDifferent: isResult ? isDifferent : false, // Nobody knows until RESULT
        baseEmoji: isResult ? this.baseEmoji : null,
        differentEmoji: isResult ? this.differentEmoji : null,
        differentPlayerId: isResult ? this.differentPlayerId : null,
        differentPlayerName: isResult ? (differentPlayer?.name ?? '???') : null,
        votes: isResult ? votesObj : null,
        voteCount,
        totalVoters,
        success: isResult ? this.success : null,
      }

      this.io.to(player.socketId).emit('emoji_state', state)
    }
  }

  // Block calls during REVEAL phase
  callPlayer(callerId: string, targetId: string): void {
    if (this.internalPhase === 'REVEAL') return
    super.callPlayer(callerId, targetId)
  }

  // Public getters for MetaGame scoring
  getDifferentPlayerId(): string {
    return this.differentPlayerId
  }

  getSuccess(): boolean {
    return this.success
  }

  skipToFinish(): void {
    if (this.internalPhase !== 'RESULT') return
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.finishGame()
  }

  private finishGame(): void {
    this.phase = GamePhase.GAME_OVER
    if (this.phaseTimer) clearTimeout(this.phaseTimer)

    const allPlayers = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)

    const standings = allPlayers.map(p => ({
      name: p.name,
      balance: p.id === this.differentPlayerId ? (this.success ? 0 : 1) : (this.success ? 1 : 0),
      isShadow: p.id === this.differentPlayerId,
      avatarId: p.avatarId,
      avatarColor: p.avatarColor,
      accessoryId: p.accessoryId,
    }))

    const differentPlayer = this.players.get(this.differentPlayerId)

    this.io.to(this.room).emit('game_over', {
      winnerId: this.success ? '' : this.differentPlayerId,
      winnerName: this.success ? 'Equipo' : (differentPlayer?.name ?? '???'),
      reason: this.success
        ? 'La mayoria descubrio al diferente'
        : `${differentPlayer?.name ?? '???'} engano a todos`,
      standings,
    })

    this.emitComplete({
      minigameId: this.info.id,
      minigameName: this.info.name,
      winnerId: this.success ? '' : this.differentPlayerId,
      winnerName: this.success ? 'Equipo' : (differentPlayer?.name ?? '???'),
      standings,
    })
  }

  getPhase(): GamePhase {
    return this.phase
  }

  getSnapshot(): GameStateSnapshot {
    return {
      gameId: this.gameId,
      minigameId: this.info.id,
      phase: this.phase,
      round: 1,
      maxRounds: 1,
      players: Array.from(this.players.values()).map(p => p.toData()),
      phaseEndTime: this.phaseEndTime,
      activeCalls: this.callManager.getActiveCalls(),
    }
  }
}
