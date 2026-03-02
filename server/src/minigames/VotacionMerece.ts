import { Server } from 'socket.io'
import { Player } from '../Player'
import { CallManager } from '../CallManager'
import {
  GamePhase, PlayerState, MiniGameInfo,
  GameStateSnapshot
} from '../types'
import { MiniGame } from './MiniGame'

enum VotingPhase {
  CALL_PHASE = 'CALL_PHASE',
  VOTING_PHASE = 'DECISION_PHASE',
  RESULT_PHASE = 'RESULT_PHASE',
  GAME_OVER = 'GAME_OVER'
}

export class VotacionMerece extends MiniGame {
  readonly info: MiniGameInfo = {
    id: 'votacion-merece',
    name: 'Quien Merece?',
    shortDescription: 'Vota por quien merece seguir adelante. El mas votado gana 1 punto global.'
  }

  private phase: VotingPhase = VotingPhase.CALL_PHASE
  private votes: Map<string, string> = new Map()
  private gameId: string
  private callDuration = 20
  private voteDuration = 15
  private resultDuration = 5

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
    for (const player of this.players.values()) {
      player.state = PlayerState.ACTIVE
    }
    this.startPhase(VotingPhase.CALL_PHASE)
  }

  private startPhase(phase: VotingPhase): void {
    this.phase = phase

    let duration = 0
    switch (phase) {
      case VotingPhase.CALL_PHASE:
        duration = this.callDuration
        this.onCallPhaseStart()
        break
      case VotingPhase.VOTING_PHASE:
        duration = this.voteDuration
        this.onVotingPhaseStart()
        break
      case VotingPhase.RESULT_PHASE:
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
      case VotingPhase.CALL_PHASE:
        this.startPhase(VotingPhase.VOTING_PHASE)
        break
      case VotingPhase.VOTING_PHASE:
        this.startPhase(VotingPhase.RESULT_PHASE)
        break
      case VotingPhase.RESULT_PHASE:
        this.finishGame()
        break
    }
  }

  private onCallPhaseStart(): void {
    for (const player of this.players.values()) {
      player.setActive()
    }
  }

  private onVotingPhaseStart(): void {
    this.callManager.endAllCalls(this.players, this.io)
    this.votes.clear()
    for (const player of this.players.values()) {
      player.state = PlayerState.DECIDING
    }
    this.io.to(this.room).emit('decision_requested')
  }

  private onResultPhaseStart(): void {
    const voteCounts: Map<string, number> = new Map()
    for (const targetId of this.votes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1)
    }
    const mostVotedIds = this.getMostVotedIds()
    const maxVotes = mostVotedIds.length > 0 ? (voteCounts.get(mostVotedIds[0]) ?? 0) : 0
    const firstMostVotedId = mostVotedIds[0] ?? ''
    const tiedNames = mostVotedIds
      .map((id) => this.players.get(id)?.name ?? 'Nadie')
      .join(', ')

    this.io.to(this.room).emit('vote_result', {
      targetId: firstMostVotedId,
      targetName: mostVotedIds.length > 1 ? `Empate: ${tiedNames}` : (this.players.get(firstMostVotedId)?.name ?? 'Nadie'),
      voteCount: maxVotes,
      effect: maxVotes > 0
        ? (mostVotedIds.length > 1 ? `+1 punto global para empatados: ${tiedNames}` : `+1 punto global para ${tiedNames}`)
        : 'Sin votos suficientes'
    })

    this.broadcastState()
  }

  private finishGame(): void {
    this.phase = VotingPhase.GAME_OVER
    if (this.phaseTimer) clearTimeout(this.phaseTimer)

    const voteCounts: Map<string, number> = new Map()
    for (const targetId of this.votes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1)
    }

    const mostVotedIds = this.getMostVotedIds()
    const firstMostVotedId = mostVotedIds[0] ?? ''
    const tiedNames = mostVotedIds
      .map((id) => this.players.get(id)?.name ?? 'Nadie')
      .join(', ')

    const allPlayers = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)

    const standings = allPlayers.map(p => ({
      name: p.name,
      balance: voteCounts.get(p.id) ?? 0,
      isShadow: false,
      avatarId: p.avatarId,
      avatarColor: p.avatarColor,
      accessoryId: p.accessoryId,
    }))

    this.io.to(this.room).emit('game_over', {
      winnerId: firstMostVotedId,
      winnerName: mostVotedIds.length > 1 ? `Empate: ${tiedNames}` : (this.players.get(firstMostVotedId)?.name ?? 'Nadie'),
      reason: mostVotedIds.length > 1
        ? `Empate en votos: ${tiedNames} (+1 punto global para cada uno)`
        : `${this.players.get(firstMostVotedId)?.name ?? 'Nadie'} fue el mas votado (+1 punto global)`,
      standings
    })

    this.emitComplete({
      minigameId: this.info.id,
      minigameName: this.info.name,
      winnerId: firstMostVotedId,
      winnerName: mostVotedIds.length > 1 ? `Empate: ${tiedNames}` : (this.players.get(firstMostVotedId)?.name ?? 'Nadie'),
      standings
    })
  }

  getMostVotedId(): string {
    return this.getMostVotedIds()[0] ?? ''
  }

  getMostVotedIds(): string[] {
    const voteCounts: Map<string, number> = new Map()
    for (const targetId of this.votes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1)
    }
    if (voteCounts.size === 0) return []
    let maxVotes = 0
    for (const count of voteCounts.values()) {
      if (count > maxVotes) maxVotes = count
    }
    return Array.from(voteCounts.entries())
      .filter(([, count]) => count === maxVotes)
      .map(([playerId]) => playerId)
  }

  votePlayer(voterId: string, targetId: string): boolean {
    if (this.phase !== VotingPhase.VOTING_PHASE) return false
    const voter = this.players.get(voterId)
    if (!voter) return false
    if (this.votes.has(voterId)) return false
    if (voterId === targetId) return false
    if (!this.players.has(targetId)) return false

    this.votes.set(voterId, targetId)
    voter.state = PlayerState.LOCKED
    this.broadcastState()

    const allVoted = Array.from(this.players.values())
      .filter(p => p.state !== PlayerState.DISCONNECTED)
      .every(p => this.votes.has(p.id))

    if (allVoted) {
      if (this.phaseTimer) clearTimeout(this.phaseTimer)
      this.startPhase(VotingPhase.RESULT_PHASE)
    }

    return true
  }

  skipToFinish(): void {
    if (this.phase !== VotingPhase.RESULT_PHASE) return
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.finishGame()
  }

  getSnapshot(): GameStateSnapshot {
    return {
      gameId: this.gameId,
      minigameId: this.info.id,
      phase: this.phase as unknown as GamePhase,
      round: 1,
      maxRounds: 1,
      players: Array.from(this.players.values()).map(p => p.toData()),
      phaseEndTime: this.phaseEndTime,
      activeCalls: this.callManager.getActiveCalls()
    }
  }
}
