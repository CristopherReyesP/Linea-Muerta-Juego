import { Server } from 'socket.io'
import { Player } from '../Player'
import { CallManager } from '../CallManager'
import {
  GamePhase, PlayerState, Decision, MiniGameInfo,
  MinigameResult, GameStateSnapshot, CallData
} from '../types'

export abstract class MiniGame {
  abstract readonly info: MiniGameInfo
  protected io: Server
  protected room: string
  protected players: Map<string, Player>
  protected callManager: CallManager
  protected phaseEndTime: number = 0
  protected phaseTimer: NodeJS.Timeout | null = null
  private _onComplete: ((result: MinigameResult) => void) | null = null

  constructor(io: Server, room: string, players: Map<string, Player>, callManager: CallManager) {
    this.io = io
    this.room = room
    this.players = players
    this.callManager = callManager
  }

  set onComplete(callback: (result: MinigameResult) => void) {
    this._onComplete = callback
  }

  protected emitComplete(result: MinigameResult): void {
    if (this._onComplete) {
      this._onComplete(result)
    }
  }

  abstract start(): void
  abstract getPhase(): GamePhase
  abstract getSnapshot(): GameStateSnapshot

  // Optional overrides for specific minigame types
  submitDecision(_playerId: string, _decision: Decision): boolean {
    return false
  }

  votePlayer(_voterId: string, _targetId: string): boolean {
    return false
  }

  // Override to allow host to skip result/game-over waiting
  skipToFinish(): void {
    // Default: no-op
  }

  // Shared call logic
  callPlayer(callerId: string, targetId: string): void {
    const phase = this.getPhase()
    if (phase !== GamePhase.CALL_PHASE) return

    const caller = this.players.get(callerId)
    if (!caller) return
    if (this.callManager.isPlayerInActiveCall(callerId) || this.callManager.isPlayerWaitingOutgoing(callerId)) return
    if (!caller.isAlive && !caller.isShadow) return

    const target = this.players.get(targetId)
    if (!target) return
    if (target.state === PlayerState.DISCONNECTED) return
    if (this.callManager.isPlayerInActiveCall(targetId)) return
    if (!target.isAlive && !target.isShadow) return
    if (target.id === callerId) return

    this.callManager.initiateCall(caller, target, this.io)
    this.broadcastState()
  }

  useShadowInterference(shadowId: string, targetId: string): void {
    const phase = this.getPhase()
    if (phase !== GamePhase.CALL_PHASE) return

    const shadow = this.players.get(shadowId)
    if (!shadow || !shadow.isShadow) return
    if (!shadow.useCharge()) return

    const target = this.players.get(targetId)
    if (!target) return

    this.io.to(target.socketId).emit('shadow_interference', { duration: 10 })
    this.broadcastState()
  }

  broadcastState(): void {
    this.io.to(this.room).emit('game_state_update', this.getSnapshot())
  }

  cleanup(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer)
      this.phaseTimer = null
    }
    this.callManager.endAllCalls(this.players, this.io)
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) return player
    }
    return undefined
  }
}
