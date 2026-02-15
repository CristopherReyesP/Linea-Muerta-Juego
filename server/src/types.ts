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

export interface GameConfig {
  callPhaseDuration: number
  decisionPhaseDuration: number
  resultPhaseDuration: number
  initialBalance: number
  minPlayers: number
  maxPlayers: number
  maxRounds: number
  atRiskThreshold: number
  shadowCharges: number
}

export const DEFAULT_CONFIG: GameConfig = {
  callPhaseDuration: 30,
  decisionPhaseDuration: 10,
  resultPhaseDuration: 5,
  initialBalance: 100,
  minPlayers: 2,
  maxPlayers: 8,
  maxRounds: 10,
  atRiskThreshold: 20,
  shadowCharges: 2
}

// Socket events
export interface ClientToServerEvents {
  join_game: (data: { name: string; gameId?: string }) => void
  start_game: () => void
  call_random_player: () => void
  accept_call: (callId: string) => void
  reject_call: (callId: string) => void
  hang_up: () => void
  submit_decision: (decision: Decision) => void
  use_shadow_interference: (targetPlayerId: string) => void
  // WebRTC signaling
  webrtc_offer: (data: { targetId: string; offer: unknown }) => void
  webrtc_answer: (data: { targetId: string; answer: unknown }) => void
  webrtc_ice_candidate: (data: { targetId: string; candidate: unknown }) => void
}

export interface ServerToClientEvents {
  game_joined: (data: { gameId: string; playerId: string }) => void
  game_state_update: (state: GameStateSnapshot) => void
  incoming_call: (data: { callId: string; callerId: string; callerName: string }) => void
  call_started: (data: { callId: string; peerId: string }) => void
  call_ended: (data: { callId: string }) => void
  call_rejected: () => void
  phase_changed: (data: { phase: GamePhase; endTime: number }) => void
  decision_requested: () => void
  round_result: (result: RoundResult) => void
  player_became_shadow: (data: { playerId: string; playerName: string }) => void
  game_over: (data: { winnerId: string; winnerName: string; reason: string; standings: Array<{ name: string; balance: number; isShadow: boolean }> }) => void
  error: (message: string) => void
  shadow_interference: (data: { duration: number }) => void
  // WebRTC signaling
  webrtc_offer: (data: { fromId: string; offer: unknown }) => void
  webrtc_answer: (data: { fromId: string; answer: unknown }) => void
  webrtc_ice_candidate: (data: { fromId: string; candidate: unknown }) => void
}
