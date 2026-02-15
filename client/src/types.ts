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
  avatarId: string
  avatarColor: string
  accessoryId: string
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
  avatarId: string
  avatarColor: string
  accessoryId: string
  globalScore: number
  isConnected: boolean
}

export interface DiscussionData {
  completedResult: MinigameResult
  globalScoreboard: Array<{ playerId: string; name: string; avatarId: string; avatarColor: string; accessoryId: string; globalScore: number }>
  nextMinigame: MiniGameInfo | null
  currentIndex: number
  totalMinigames: number
}

export interface SessionCompleteData {
  overallWinnerId: string
  overallWinnerName: string
  globalScoreboard: Array<{ playerId: string; name: string; avatarId: string; avatarColor: string; accessoryId: string; globalScore: number }>
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

export interface BombOutcomeData {
  type: 'exploded' | 'defused'
  playerId: string
  playerName: string
  chance?: number
}

export interface MetaGameStateSnapshot {
  gameId: string
  metaPhase: MetaGamePhase
  currentMinigameIndex: number
  totalMinigames: number
  currentMinigameInfo: MiniGameInfo | null
  globalScoreboard: Array<{ playerId: string; name: string; avatarId: string; avatarColor: string; accessoryId: string; globalScore: number }>
  hostId: string | null
  minigameSnapshot: GameStateSnapshot | null
}
