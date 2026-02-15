import { Server } from 'socket.io'
import { Player } from '../Player'
import { CallManager } from '../CallManager'
import {
  BombStateData,
  GamePhase,
  GameStateSnapshot,
  MiniGameInfo,
  PlayerState,
} from '../types'
import { MiniGame } from './MiniGame'

const MATCH_DURATION_SECONDS = 300
const HOLDER_DECISION_SECONDS = 50
const OUTCOME_ANIMATION_MS = 2600
const BASE_DISARM_CHANCE = 15
const PASS_BONUS = 10
const MAX_DISARM_CHANCE = 95

export class LaBomba extends MiniGame {
  readonly info: MiniGameInfo = {
    id: 'la-bomba',
    name: 'La Bomba',
    shortDescription: 'La bomba corre durante 30s. Desactiva o pasala a otro jugador para aumentar la probabilidad.',
  }

  private phase: GamePhase = GamePhase.CALL_PHASE
  private gameId: string
  private bombHolderId = ''
  private passCount = 0
  private passHistory: string[] = []
  private attemptedByCurrentHolder = false
  private exploded = false
  private bombEndTime = 0
  private holderTimer: NodeJS.Timeout | null = null
  private outcomeTimer: NodeJS.Timeout | null = null
  private resolvingOutcome = false

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
    const activePlayers = Array.from(this.players.values()).filter(
      (player) => player.state !== PlayerState.DISCONNECTED
    )

    if (activePlayers.length === 0) {
      this.finishGame('', 'Nadie', false)
      return
    }

    for (const player of this.players.values()) {
      player.state = PlayerState.ACTIVE
    }

    const randomIndex = Math.floor(Math.random() * activePlayers.length)
    this.bombHolderId = activePlayers[randomIndex].id
    this.passCount = 0
    this.passHistory = [activePlayers[randomIndex].name]
    this.attemptedByCurrentHolder = false
    this.exploded = false

    this.phase = GamePhase.CALL_PHASE
    this.phaseEndTime = Date.now() + MATCH_DURATION_SECONDS * 1000
    this.resetHolderTimer()

    this.io.to(this.room).emit('phase_changed', {
      phase: this.phase,
      endTime: this.phaseEndTime,
    })

    this.broadcastBombState()
    this.broadcastState()

    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.phaseTimer = setTimeout(() => this.explodeBomb(), MATCH_DURATION_SECONDS * 1000)
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
      players: Array.from(this.players.values()).map((player) => player.toData()),
      phaseEndTime: this.phaseEndTime,
      activeCalls: this.callManager.getActiveCalls(),
    }
  }

  passBomb(fromPlayerId: string, targetPlayerId: string): boolean {
    if (this.phase !== GamePhase.CALL_PHASE) return false
    if (this.resolvingOutcome) return false
    if (fromPlayerId !== this.bombHolderId) return false
    if (fromPlayerId === targetPlayerId) return false

    const fromPlayer = this.players.get(fromPlayerId)
    const targetPlayer = this.players.get(targetPlayerId)
    if (!fromPlayer || !targetPlayer) return false
    if (targetPlayer.state === PlayerState.DISCONNECTED) return false

    this.bombHolderId = targetPlayerId
    this.passCount += 1
    this.attemptedByCurrentHolder = false
    this.passHistory.push(targetPlayer.name)
    this.resetHolderTimer()

    this.io.to(this.room).emit('bomb_passed', {
      fromId: fromPlayer.id,
      fromName: fromPlayer.name,
      toId: targetPlayer.id,
      toName: targetPlayer.name,
    })

    this.broadcastBombState()
    this.broadcastState()
    return true
  }

  attemptDefuse(playerId: string): boolean {
    if (this.phase !== GamePhase.CALL_PHASE) return false
    if (this.resolvingOutcome) return false
    if (playerId !== this.bombHolderId) return false
    if (this.attemptedByCurrentHolder) return false

    const player = this.players.get(playerId)
    if (!player || player.state === PlayerState.DISCONNECTED) return false

    this.attemptedByCurrentHolder = true
    const chance = this.getDisarmChance()
    const success = Math.random() * 100 < chance

    this.io.to(this.room).emit('bomb_defuse_result', {
      playerId: player.id,
      playerName: player.name,
      success,
      chance,
    })

    this.broadcastBombState()
    this.broadcastState()

    if (success) {
      this.resolvingOutcome = true
      this.io.to(this.room).emit('bomb_defused', {
        playerId: player.id,
        playerName: player.name,
        chance,
      })
      this.outcomeTimer = setTimeout(() => {
        this.finishGame(player.id, player.name, true)
      }, OUTCOME_ANIMATION_MS)
    } else {
      // Failed defuse resolves immediately as an explosion on current holder.
      this.exploded = true
      this.resolvingOutcome = true
      this.io.to(this.room).emit('bomb_exploded', {
        playerId: player.id,
        playerName: player.name,
      })
      this.outcomeTimer = setTimeout(() => {
        this.finishGame('', player.name, false)
      }, OUTCOME_ANIMATION_MS)
    }

    return true
  }

  private getDisarmChance(): number {
    return Math.min(BASE_DISARM_CHANCE + this.passCount * PASS_BONUS, MAX_DISARM_CHANCE)
  }

  private resetHolderTimer(): void {
    if (this.holderTimer) {
      clearTimeout(this.holderTimer)
      this.holderTimer = null
    }

    this.bombEndTime = Date.now() + HOLDER_DECISION_SECONDS * 1000
    this.holderTimer = setTimeout(() => this.explodeBomb(), HOLDER_DECISION_SECONDS * 1000)
  }

  getExplodedHolderId(): string | null {
    if (!this.exploded || !this.bombHolderId) return null
    return this.bombHolderId
  }

  private buildBombState(): BombStateData {
    const holder = this.players.get(this.bombHolderId)
    return {
      holderId: this.bombHolderId,
      holderName: holder?.name ?? 'Desconocido',
      disarmChance: this.getDisarmChance(),
      passCount: this.passCount,
      passHistory: this.passHistory,
      endTime: this.bombEndTime,
    }
  }

  private broadcastBombState(): void {
    this.io.to(this.room).emit('bomb_state_update', this.buildBombState())
  }

  private explodeBomb(): void {
    if (this.phase !== GamePhase.CALL_PHASE) return
    if (this.resolvingOutcome) return
    const holder = this.players.get(this.bombHolderId)
    this.exploded = true
    this.resolvingOutcome = true
    this.io.to(this.room).emit('bomb_exploded', {
      playerId: this.bombHolderId,
      playerName: holder?.name ?? 'Nadie',
    })
    this.outcomeTimer = setTimeout(() => {
      this.finishGame('', holder?.name ?? 'Nadie', false)
    }, OUTCOME_ANIMATION_MS)
  }

  private finishGame(winnerId: string, winnerName: string, defused: boolean): void {
    this.phase = GamePhase.GAME_OVER
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer)
      this.phaseTimer = null
    }
    if (this.holderTimer) {
      clearTimeout(this.holderTimer)
      this.holderTimer = null
    }
    if (this.outcomeTimer) {
      clearTimeout(this.outcomeTimer)
      this.outcomeTimer = null
    }

    const allPlayers = Array.from(this.players.values()).filter(
      (player) => player.state !== PlayerState.DISCONNECTED
    )

    const standings = allPlayers.map((player) => ({
      name: player.name,
      balance: player.id === winnerId && defused ? 1 : 0,
      isShadow: !defused && player.id === this.bombHolderId,
    }))

    this.io.to(this.room).emit('phase_changed', {
      phase: this.phase,
      endTime: Date.now(),
    })

    this.io.to(this.room).emit('game_over', {
      winnerId,
      winnerName: defused ? winnerName : 'Nadie',
      reason: defused
        ? `${winnerName} desactivo la bomba a tiempo`
        : `La bomba exploto en ${winnerName}`,
      standings,
    })

    this.broadcastBombState()
    this.broadcastState()

    this.emitComplete({
      minigameId: this.info.id,
      minigameName: this.info.name,
      winnerId,
      winnerName: defused ? winnerName : 'Nadie',
      standings,
    })
  }

  cleanup(): void {
    super.cleanup()
    if (this.holderTimer) {
      clearTimeout(this.holderTimer)
      this.holderTimer = null
    }
    if (this.outcomeTimer) {
      clearTimeout(this.outcomeTimer)
      this.outcomeTimer = null
    }
  }
}
