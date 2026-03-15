import { create } from 'zustand'
import {
  GamePhase, MetaGamePhase, Decision,
  PlayerData, CallData, RoundResult, GameStateSnapshot,
  MiniGameInfo, MinigameResult, DiscussionData, SessionCompleteData,
  MetaGameStateSnapshot, BombStateData, BombOutcomeData, EmergencyStateData,
  EmojiStateData
} from '../types'

interface IncomingCall {
  callId: string
  callerId: string
  callerName: string
}

interface PendingCall {
  callId: string
  targetId: string
  targetName: string
}

interface GameOverData {
  winnerId: string
  winnerName: string
  reason: string
  standings: Array<{ name: string; balance: number; isShadow: boolean; avatarId: string; avatarColor: string; accessoryId: string }>
}

interface VoteResult {
  targetId: string
  targetName: string
  voteCount: number
  effect: string
}

interface BombPassData {
  fromId: string
  fromName: string
  toId: string
  toName: string
}

interface BombDefuseResult {
  playerId: string
  playerName: string
  success: boolean
  chance: number
}

interface GameStore {
  // Connection
  connected: boolean
  playerId: string | null
  gameId: string | null
  playerName: string

  // Meta-game state
  metaPhase: MetaGamePhase
  currentMinigameIndex: number
  totalMinigames: number
  currentMinigameInfo: MiniGameInfo | null
  globalScoreboard: Array<{ playerId: string; name: string; avatarId: string; avatarColor: string; accessoryId: string; globalScore: number }>
  hostId: string | null
  discussionData: DiscussionData | null
  sessionComplete: SessionCompleteData | null
  minigameHistory: MinigameResult[]

  // Minigame state (active minigame)
  activeMinigameId: string | null
  phase: GamePhase
  round: number
  maxRounds: number
  players: PlayerData[]
  phaseEndTime: number
  activeCalls: CallData[]

  // Call state
  incomingCalls: IncomingCall[]
  pendingCall: PendingCall | null
  activeCallPeerId: string | null
  activeCallId: string | null

  // Decision state
  myDecision: Decision | null
  myVote: string | null
  lastResult: RoundResult | null
  voteResult: VoteResult | null

  // Shadow
  shadowInterference: boolean

  // Game over (per minigame)
  gameOver: GameOverData | null

  // Open voice
  openVoicePlayerIds: string[]
  micMuted: boolean

  // Adivina la Linea
  voiceDistortion: boolean
  lineAssignments: { myLineNumber: number; lines: Array<{ lineNumber: number }>; playerNames: Array<{ playerId: string; name: string }> } | null
  lineGuessResults: { assignments: Array<{ lineNumber: number; playerId: string; playerName: string }>; scores: Record<string, number>; winnerId: string; winnerName: string } | null
  myLineGuesses: Record<string, string> | null // submitted guesses
  bombState: BombStateData | null
  bombLastPass: BombPassData | null
  bombLastDefuseResult: BombDefuseResult | null
  bombOutcome: BombOutcomeData | null

  // Central de Emergencias
  emergencyState: EmergencyStateData | null

  // Emoji Diferente
  emojiState: EmojiStateData | null

  // Error
  error: string | null
  ambientVolume: number
  playerVolume: number

  // Actions
  setConnected: (connected: boolean) => void
  setPlayerInfo: (playerId: string, gameId: string) => void
  setPlayerName: (name: string) => void
  updateMetaState: (state: MetaGameStateSnapshot) => void
  updateGameState: (state: GameStateSnapshot) => void
  addIncomingCall: (call: IncomingCall) => void
  removeIncomingCall: (callId: string) => void
  clearIncomingCalls: () => void
  setPendingCall: (call: PendingCall | null) => void
  setActiveCall: (callId: string | null, peerId: string | null) => void
  setPhase: (phase: GamePhase, endTime: number) => void
  setMyDecision: (decision: Decision | null) => void
  setMyVote: (targetId: string | null) => void
  setLastResult: (result: RoundResult | null) => void
  setVoteResult: (result: VoteResult | null) => void
  setShadowInterference: (active: boolean) => void
  setGameOver: (data: GameOverData | null) => void
  setDiscussionData: (data: DiscussionData | null) => void
  setSessionComplete: (data: SessionCompleteData | null) => void
  setMinigameIntro: (info: MiniGameInfo, index: number, total: number) => void
  setOpenVoicePlayerIds: (ids: string[]) => void
  setMicMuted: (muted: boolean) => void
  toggleMic: () => void
  setVoiceDistortion: (enabled: boolean) => void
  setLineAssignments: (data: GameStore['lineAssignments']) => void
  setLineGuessResults: (data: GameStore['lineGuessResults']) => void
  setMyLineGuesses: (guesses: Record<string, string> | null) => void
  setBombState: (data: BombStateData | null) => void
  setBombLastPass: (data: BombPassData | null) => void
  setBombDefuseResult: (data: BombDefuseResult | null) => void
  setBombOutcome: (data: BombOutcomeData | null) => void
  setEmergencyState: (data: EmergencyStateData | null) => void
  setEmojiState: (data: EmojiStateData | null) => void
  setError: (error: string | null) => void
  setAmbientVolume: (volume: number) => void
  setPlayerVolume: (volume: number) => void
  getMyPlayer: () => PlayerData | null
  reset: () => void
}

const initialState = {
  connected: false,
  playerId: null,
  gameId: null,
  playerName: '',
  metaPhase: MetaGamePhase.LOBBY,
  currentMinigameIndex: 0,
  totalMinigames: 5,
  currentMinigameInfo: null,
  globalScoreboard: [],
  hostId: null,
  discussionData: null,
  sessionComplete: null,
  minigameHistory: [],
  activeMinigameId: null,
  phase: GamePhase.LOBBY,
  round: 0,
  maxRounds: 10,
  players: [],
  phaseEndTime: 0,
  activeCalls: [],
  incomingCalls: [],
  pendingCall: null,
  activeCallPeerId: null,
  activeCallId: null,
  myDecision: null,
  myVote: null,
  lastResult: null,
  voteResult: null,
  shadowInterference: false,
  gameOver: null,
  openVoicePlayerIds: [],
  micMuted: false,
  voiceDistortion: false,
  lineAssignments: null,
  lineGuessResults: null,
  myLineGuesses: null,
  bombState: null,
  bombLastPass: null,
  bombLastDefuseResult: null,
  bombOutcome: null,
  emergencyState: null,
  emojiState: null,
  error: null,
  ambientVolume: 0.35,
  playerVolume: 1,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setConnected: (connected) => set({ connected }),
  setPlayerInfo: (playerId, gameId) => set({ playerId, gameId }),
  setPlayerName: (name) => set({ playerName: name }),

  updateMetaState: (state) => set({
    metaPhase: state.metaPhase,
    currentMinigameIndex: state.currentMinigameIndex,
    totalMinigames: state.totalMinigames,
    currentMinigameInfo: state.currentMinigameInfo,
    globalScoreboard: state.globalScoreboard,
    hostId: state.hostId,
    ...(state.minigameSnapshot ? {
      activeMinigameId: state.minigameSnapshot.minigameId,
      phase: state.minigameSnapshot.phase,
      round: state.minigameSnapshot.round,
      maxRounds: state.minigameSnapshot.maxRounds,
      players: state.minigameSnapshot.players,
      phaseEndTime: state.minigameSnapshot.phaseEndTime,
      activeCalls: state.minigameSnapshot.activeCalls,
    } : {}),
  }),

  updateGameState: (state) => set({
    activeMinigameId: state.minigameId,
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    players: state.players,
    phaseEndTime: state.phaseEndTime,
    activeCalls: state.activeCalls,
  }),

  addIncomingCall: (call) => set(s => ({ incomingCalls: [...s.incomingCalls, call] })),
  removeIncomingCall: (callId) => set(s => ({ incomingCalls: s.incomingCalls.filter(c => c.callId !== callId) })),
  clearIncomingCalls: () => set({ incomingCalls: [] }),
  setPendingCall: (call) => set({ pendingCall: call }),
  setActiveCall: (callId, peerId) => set({ activeCallId: callId, activeCallPeerId: peerId }),

  setPhase: (phase, endTime) => set({
    phase,
    phaseEndTime: endTime,
    myDecision: phase === GamePhase.DECISION_PHASE ? null : get().myDecision,
    myVote: phase === GamePhase.DECISION_PHASE ? null : get().myVote,
    lastResult: phase === GamePhase.DECISION_PHASE ? null : get().lastResult,
    voteResult: phase === GamePhase.DECISION_PHASE ? null : get().voteResult,
  }),

  setMyDecision: (decision) => set({ myDecision: decision }),
  setMyVote: (targetId) => set({ myVote: targetId }),
  setLastResult: (result) => set({ lastResult: result }),
  setVoteResult: (result) => set({ voteResult: result }),
  setShadowInterference: (active) => set({ shadowInterference: active }),
  setGameOver: (data) => set({ gameOver: data, bombOutcome: null }),
  setDiscussionData: (data) => set({ discussionData: data }),
  setSessionComplete: (data) => set({ sessionComplete: data }),

  setMinigameIntro: (info, index, total) => set({
    currentMinigameInfo: info,
    currentMinigameIndex: index,
    totalMinigames: total,
    gameOver: null,
    myDecision: null,
    myVote: null,
    lastResult: null,
    voteResult: null,
    lineAssignments: null,
    lineGuessResults: null,
    myLineGuesses: null,
    voiceDistortion: false,
    bombState: null,
    bombLastPass: null,
    bombLastDefuseResult: null,
    bombOutcome: null,
    emojiState: null,
  }),

  setOpenVoicePlayerIds: (ids) => set({ openVoicePlayerIds: ids, micMuted: false }),
  setMicMuted: (muted) => set({ micMuted: muted }),
  toggleMic: () => set((s) => ({ micMuted: !s.micMuted })),
  setVoiceDistortion: (enabled) => set({ voiceDistortion: enabled }),
  setLineAssignments: (data) => set({ lineAssignments: data }),
  setLineGuessResults: (data) => set({ lineGuessResults: data }),
  setMyLineGuesses: (guesses) => set({ myLineGuesses: guesses }),
  setBombState: (data) => set({ bombState: data }),
  setBombLastPass: (data) => set({ bombLastPass: data }),
  setBombDefuseResult: (data) => set({ bombLastDefuseResult: data }),
  setBombOutcome: (data) => set({ bombOutcome: data }),
  setEmergencyState: (data) => set({ emergencyState: data }),
  setEmojiState: (data) => set({ emojiState: data }),
  setError: (error) => set({ error }),
  setAmbientVolume: (volume) => set({ ambientVolume: Math.max(0, Math.min(1, volume)) }),
  setPlayerVolume: (volume) => set({ playerVolume: Math.max(0, Math.min(1, volume)) }),

  getMyPlayer: () => {
    const { playerId, players } = get()
    if (!playerId) return null
    return players.find(p => p.id === playerId) ?? null
  },

  reset: () => set(initialState),
}))
