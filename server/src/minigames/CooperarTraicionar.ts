import { Server } from 'socket.io'
import { Player } from '../Player'
import { CallManager } from '../CallManager'
import {
  GamePhase, PlayerState, Decision, MiniGameInfo,
  MinigameResult, RoundResult, GameStateSnapshot, GameConfig, DEFAULT_CONFIG
} from '../types'
import { MiniGame } from './MiniGame'

export class CooperarTraicionar extends MiniGame {
  readonly info: MiniGameInfo = {
    id: 'cooperar-traicionar',
    name: 'Cooperar o Traicionar',
    shortDescription: 'Negocia por telefono y decide: cooperar o traicionar. La mayoria define tu destino.'
  }

  private phase: GamePhase = GamePhase.CALL_PHASE
  private round: number = 0
  private decisions: Map<string, Decision> = new Map()
  private config: GameConfig
  private gameId: string

  constructor(
    io: Server,
    room: string,
    players: Map<string, Player>,
    callManager: CallManager,
    gameId: string,
    config?: Partial<GameConfig>
  ) {
    super(io, room, players, callManager)
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.gameId = gameId
  }

  getPhase(): GamePhase {
    return this.phase
  }

  start(): void {
    for (const player of this.players.values()) {
      player.state = PlayerState.ACTIVE
    }
    this.round = 1
    this.startPhase(GamePhase.CALL_PHASE)
  }

  private startPhase(phase: GamePhase): void {
    this.phase = phase

    let duration = 0
    switch (phase) {
      case GamePhase.CALL_PHASE:
        duration = this.config.callPhaseDuration
        this.onCallPhaseStart()
        break
      case GamePhase.DECISION_PHASE:
        duration = this.config.decisionPhaseDuration
        this.onDecisionPhaseStart()
        break
      case GamePhase.RESULT_PHASE:
        duration = this.config.resultPhaseDuration
        this.onResultPhaseStart()
        break
    }

    this.phaseEndTime = Date.now() + duration * 1000

    this.io.to(this.room).emit('phase_changed', {
      phase: this.phase,
      endTime: this.phaseEndTime
    })

    this.broadcastState()

    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.phaseTimer = setTimeout(() => this.advancePhase(), duration * 1000)
  }

  private advancePhase(): void {
    switch (this.phase) {
      case GamePhase.CALL_PHASE:
        this.startPhase(GamePhase.DECISION_PHASE)
        break
      case GamePhase.DECISION_PHASE:
        this.startPhase(GamePhase.RESULT_PHASE)
        break
      case GamePhase.RESULT_PHASE:
        if (!this.checkGameOver()) {
          this.round++
          this.startPhase(GamePhase.CALL_PHASE)
        }
        break
    }
  }

  private onCallPhaseStart(): void {
    for (const player of this.players.values()) {
      if (player.isAlive) {
        player.setActive()
      }
    }
  }

  private onDecisionPhaseStart(): void {
    this.callManager.endAllCalls(this.players, this.io)
    this.decisions.clear()
    for (const player of this.players.values()) {
      if (player.isAlive) {
        player.state = PlayerState.DECIDING
      }
    }
    this.io.to(this.room).emit('decision_requested')
  }

  private onResultPhaseStart(): void {
    // Auto-submit for players who didn't decide (random)
    for (const player of this.players.values()) {
      if (player.isAlive && !this.decisions.has(player.id)) {
        this.decisions.set(player.id, Math.random() > 0.5 ? Decision.COOPERATE : Decision.BETRAY)
      }
    }

    const result = this.resolveRound()
    const rachaResults: Record<string, { type: 'bonus' | 'penalizacion' | null; amount: number; message: string }> = {}

    for (const [playerId, change] of Object.entries(result.balanceChanges)) {
      const player = this.players.get(playerId)
      if (!player) continue

      const wasShadow = player.isShadow
      const wasAlive = player.isAlive
      player.updateBalance(change)

      if (!wasShadow && player.isShadow) {
        this.io.to(this.room).emit('player_became_shadow', {
          playerId: player.id,
          playerName: player.name
        })
        rachaResults[playerId] = { type: null, amount: 0, message: '' }
        continue
      }

      if (wasAlive && player.isAlive) {
        const decision = this.decisions.get(playerId)

        if (decision === Decision.COOPERATE) {
          player.rachaCooperar += 1
          player.rachaTraicionar = 0

          if (player.rachaCooperar === 2) {
            player.balance += 15
            rachaResults[playerId] = {
              type: 'bonus',
              amount: 15,
              message: 'Bonus de confianza: cooperaste 2 rondas seguidas (+15)'
            }
            player.rachaCooperar = 0
          } else {
            rachaResults[playerId] = { type: null, amount: 0, message: '' }
          }
        } else if (decision === Decision.BETRAY) {
          player.rachaTraicionar += 1
          player.rachaCooperar = 0

          if (player.rachaTraicionar === 2) {
            player.balance -= 25
            rachaResults[playerId] = {
              type: 'penalizacion',
              amount: -25,
              message: 'Desconfianza generada: traicionaste 2 rondas seguidas (-25)'
            }
            player.rachaTraicionar = 0
          } else {
            rachaResults[playerId] = { type: null, amount: 0, message: '' }
          }
        } else {
          rachaResults[playerId] = { type: null, amount: 0, message: '' }
        }
      } else {
        rachaResults[playerId] = { type: null, amount: 0, message: '' }
      }

      if (player.isAlive && player.balance <= 0) {
        player.balance = 0
        const becameShadow = !player.isShadow
        player.becomeShadow()
        if (becameShadow) {
          this.io.to(this.room).emit('player_became_shadow', {
            playerId: player.id,
            playerName: player.name
          })
        }
      }
    }

    result.rachaResults = rachaResults
    this.io.to(this.room).emit('round_result', result)
    this.broadcastState()
  }

  private resolveRound(): RoundResult {
    const decisions: Record<string, Decision> = {}
    const balanceChanges: Record<string, number> = {}

    let cooperateCount = 0
    let betrayCount = 0

    for (const [playerId, decision] of this.decisions) {
      decisions[playerId] = decision
      if (decision === Decision.COOPERATE) cooperateCount++
      else betrayCount++
    }

    const majorityDecision = cooperateCount >= betrayCount
      ? Decision.COOPERATE
      : Decision.BETRAY

    for (const [playerId, decision] of this.decisions) {
      if (majorityDecision === Decision.COOPERATE) {
        balanceChanges[playerId] = decision === Decision.COOPERATE ? 30 : 45
      } else {
        balanceChanges[playerId] = decision === Decision.COOPERATE ? -40 : -10
      }
    }

    return { round: this.round, decisions, majorityDecision, balanceChanges }
  }

  submitDecision(playerId: string, decision: Decision): boolean {
    if (this.phase !== GamePhase.DECISION_PHASE) return false
    const player = this.players.get(playerId)
    if (!player || !player.isAlive) return false
    if (this.decisions.has(playerId)) return false

    this.decisions.set(playerId, decision)
    player.state = PlayerState.LOCKED
    this.broadcastState()

    const allDecided = Array.from(this.players.values())
      .filter(p => p.isAlive)
      .every(p => this.decisions.has(p.id))

    if (allDecided) {
      if (this.phaseTimer) clearTimeout(this.phaseTimer)
      this.startPhase(GamePhase.RESULT_PHASE)
    }

    return true
  }

  private checkGameOver(): boolean {
    const activePlayers = Array.from(this.players.values()).filter(
      p => p.isAlive && p.state !== PlayerState.DISCONNECTED
    )

    let reason = ''

    if (activePlayers.length <= 1) {
      reason = 'Ultimo jugador en pie'
    } else if (this.round >= this.config.maxRounds) {
      reason = `Se completaron las ${this.config.maxRounds} rondas`
    }

    if (!reason) return false

    this.phase = GamePhase.GAME_OVER
    if (this.phaseTimer) clearTimeout(this.phaseTimer)

    const allPlayers = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)
    const sorted = [...allPlayers].sort((a, b) => b.balance - a.balance)
    const winner = sorted[0]

    const standings = sorted.map(p => ({
      name: p.name,
      balance: p.balance,
      isShadow: p.isShadow,
      avatarId: p.avatarId,
      avatarColor: p.avatarColor,
      accessoryId: p.accessoryId,
    }))

    this.io.to(this.room).emit('game_over', {
      winnerId: winner?.id ?? '',
      winnerName: winner?.name ?? 'Nadie',
      reason,
      standings,
    })

    this.emitComplete({
      minigameId: this.info.id,
      minigameName: this.info.name,
      winnerId: winner?.id ?? '',
      winnerName: winner?.name ?? 'Nadie',
      standings,
    })

    this.broadcastState()
    return true
  }

  getSnapshot(): GameStateSnapshot {
    return {
      gameId: this.gameId,
      minigameId: this.info.id,
      phase: this.phase,
      round: this.round,
      maxRounds: this.config.maxRounds,
      players: Array.from(this.players.values()).map(p => p.toData()),
      phaseEndTime: this.phaseEndTime,
      activeCalls: this.callManager.getActiveCalls()
    }
  }
}
