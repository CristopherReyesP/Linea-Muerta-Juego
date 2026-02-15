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
  rachaCooperar: number
  rachaTraicionar: number
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
  rachaResults?: Record<string, { type: 'bonus' | 'penalizacion' | null; amount: number; message: string }>
}

export interface GameStateSnapshot {
  gameId: string
  minigameId: string
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

// Meta-game types
export enum MetaGamePhase {
  LOBBY = 'LOBBY',
  MINIGAME_INTRO = 'MINIGAME_INTRO',
  MINIGAME_IN_PROGRESS = 'MINIGAME_IN_PROGRESS',
  DISCUSSION = 'DISCUSSION',
  SESSION_COMPLETE = 'SESSION_COMPLETE'
}

export interface MiniGameInfo {
  id: string
  name: string
  shortDescription: string
}

export interface MinigameResult {
  minigameId: string
  minigameName: string
  winnerId: string
  winnerName: string
  standings: Array<{ name: string; balance: number; isShadow: boolean }>
}

export interface MetaPlayerData {
  id: string
  socketId: string
  name: string
  globalScore: number
  isConnected: boolean
}

export interface DiscussionData {
  completedResult: MinigameResult
  globalScoreboard: Array<{ playerId: string; name: string; globalScore: number }>
  nextMinigame: MiniGameInfo | null
  currentIndex: number
  totalMinigames: number
}

export interface SessionCompleteData {
  overallWinnerId: string
  overallWinnerName: string
  globalScoreboard: Array<{ playerId: string; name: string; globalScore: number }>
  history: MinigameResult[]
}

export interface BombStateData {
  holderId: string
  holderName: string
  disarmChance: number
  passCount: number
  passHistory: string[]
  endTime: number
}

export interface MetaGameStateSnapshot {
  gameId: string
  metaPhase: MetaGamePhase
  currentMinigameIndex: number
  totalMinigames: number
  currentMinigameInfo: MiniGameInfo | null
  globalScoreboard: Array<{ playerId: string; name: string; globalScore: number }>
  hostId: string | null
  // When in MINIGAME_IN_PROGRESS, the minigame's own snapshot is sent separately
  minigameSnapshot: GameStateSnapshot | null
}

// Socket events
export interface ClientToServerEvents {
  create_game: (data: { name: string }) => void
  join_game: (data: { name: string; gameId: string }) => void
  start_game: (data?: { selectedMinigameIds?: string[] }) => void
  call_player: (targetId: string) => void
  accept_call: (callId: string) => void
  reject_call: (callId: string) => void
  hang_up: () => void
  submit_decision: (decision: Decision) => void
  use_shadow_interference: (targetPlayerId: string) => void
  continue_to_next: () => void
  vote_player: (targetPlayerId: string) => void
  submit_line_guesses: (guesses: Record<string, string>) => void // lineNumber -> guessedPlayerId
  pass_bomb: (targetPlayerId: string) => void
  attempt_defuse: () => void
  // WebRTC signaling
  webrtc_offer: (data: { targetId: string; offer: unknown }) => void
  webrtc_answer: (data: { targetId: string; answer: unknown }) => void
  webrtc_ice_candidate: (data: { targetId: string; candidate: unknown }) => void
}

export interface ServerToClientEvents {
  game_joined: (data: { gameId: string; playerId: string }) => void
  game_state_update: (state: GameStateSnapshot) => void
  meta_state_update: (state: MetaGameStateSnapshot) => void
  incoming_call: (data: { callId: string; callerId: string; callerName: string }) => void
  call_started: (data: { callId: string; peerId: string }) => void
  call_ringing: (data: { callId: string; targetId: string; targetName: string }) => void
  call_ended: (data: { callId: string }) => void
  call_rejected: () => void
  call_cancelled: (data: { callId: string }) => void
  phase_changed: (data: { phase: GamePhase; endTime: number }) => void
  decision_requested: () => void
  round_result: (result: RoundResult) => void
  player_became_shadow: (data: { playerId: string; playerName: string }) => void
  game_over: (data: { winnerId: string; winnerName: string; reason: string; standings: Array<{ name: string; balance: number; isShadow: boolean }> }) => void
  minigame_intro: (data: { minigame: MiniGameInfo; index: number; total: number }) => void
  discussion_started: (data: DiscussionData) => void
  session_complete: (data: SessionCompleteData) => void
  open_voice: (data: { playerIds: string[] }) => void
  vote_result: (data: { targetId: string; targetName: string; voteCount: number; effect: string }) => void
  line_assignments: (data: { myLineNumber: number; lines: Array<{ lineNumber: number; playerId: string }>; playerNames: Array<{ playerId: string; name: string }> }) => void
  line_guess_results: (data: { assignments: Array<{ lineNumber: number; playerId: string; playerName: string }>; scores: Record<string, number>; winnerId: string; winnerName: string }) => void
  bomb_state_update: (data: BombStateData) => void
  bomb_passed: (data: { fromId: string; fromName: string; toId: string; toName: string }) => void
  bomb_defuse_result: (data: { playerId: string; playerName: string; success: boolean; chance: number }) => void
  bomb_exploded: (data: { playerId: string; playerName: string }) => void
  bomb_defused: (data: { playerId: string; playerName: string; chance: number }) => void
  voice_distortion: (data: { enabled: boolean }) => void
  error: (message: string) => void
  shadow_interference: (data: { duration: number }) => void
  // WebRTC signaling
  webrtc_offer: (data: { fromId: string; offer: unknown }) => void
  webrtc_answer: (data: { fromId: string; answer: unknown }) => void
  webrtc_ice_candidate: (data: { fromId: string; candidate: unknown }) => void
}
