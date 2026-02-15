// Shared types mirrored from server
export enum PlayerState {
  LOBBY = 'LOBBY',
  ACTIVE = 'ACTIVE',
  IN_CALL = 'IN_CALL',
  DECIDING = 'DECIDING',
  LOCKED = 'LOCKED',
  AT_RISK = 'AT_RISK',
  SHADOW = 'SHADOW',
  DISCONNECTED = 'DISCONNECTED'
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  CALL_PHASE = 'CALL_PHASE',
  DECISION_PHASE = 'DECISION_PHASE',
  RESULT_PHASE = 'RESULT_PHASE',
  GAME_OVER = 'GAME_OVER'
}

export enum Decision {
  COOPERATE = 'COOPERATE',
  BETRAY = 'BETRAY'
}

export interface PlayerData {
  id: string
  socketId: string
  name: string
  balance: number
  state: PlayerState
  isAlive: boolean
  isShadow: boolean
  shadowCharges: number
}

export interface CallData {
  id: string
  callerId: string
  receiverId: string
  active: boolean
}

export interface RoundResult {
  round: number
  decisions: Record<string, Decision>
  majorityDecision: Decision
  balanceChanges: Record<string, number>
}

export interface GameStateSnapshot {
  gameId: string
  phase: GamePhase
  round: number
  maxRounds: number
  players: PlayerData[]
  phaseEndTime: number
  activeCalls: CallData[]
}
