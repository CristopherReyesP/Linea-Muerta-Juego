import { create } from 'zustand'
import {
  GamePhase, Decision,
  PlayerData, CallData, RoundResult, GameStateSnapshot
} from '../types'

interface IncomingCall {
  callId: string
  callerId: string
  callerName: string
}

interface GameOverData {
  winnerId: string
  winnerName: string
  reason: string
  standings: Array<{ name: string; balance: number; isShadow: boolean }>
}

interface GameStore {
  // Connection
  connected: boolean
  playerId: string | null
  gameId: string | null
  playerName: string

  // Game state
  phase: GamePhase
  round: number
  maxRounds: number
  players: PlayerData[]
  phaseEndTime: number
  activeCalls: CallData[]

  // Call state
  incomingCalls: IncomingCall[]
  activeCallPeerId: string | null
  activeCallId: string | null

  // Decision state
  myDecision: Decision | null
  lastResult: RoundResult | null

  // Shadow
  shadowInterference: boolean

  // Game over
  gameOver: GameOverData | null

  // Error
  error: string | null

  // Actions
  setConnected: (connected: boolean) => void
  setPlayerInfo: (playerId: string, gameId: string) => void
  setPlayerName: (name: string) => void
  updateGameState: (state: GameStateSnapshot) => void
  addIncomingCall: (call: IncomingCall) => void
  removeIncomingCall: (callId: string) => void
  clearIncomingCalls: () => void
  setActiveCall: (callId: string | null, peerId: string | null) => void
  setPhase: (phase: GamePhase, endTime: number) => void
  setMyDecision: (decision: Decision | null) => void
  setLastResult: (result: RoundResult | null) => void
  setShadowInterference: (active: boolean) => void
  setGameOver: (data: GameOverData | null) => void
  setError: (error: string | null) => void
  getMyPlayer: () => PlayerData | null
  reset: () => void
}

const initialState = {
  connected: false,
  playerId: null,
  gameId: null,
  playerName: '',
  phase: GamePhase.LOBBY,
  round: 0,
  maxRounds: 10,
  players: [],
  phaseEndTime: 0,
  activeCalls: [],
  incomingCalls: [],
  activeCallPeerId: null,
  activeCallId: null,
  myDecision: null,
  lastResult: null,
  shadowInterference: false,
  gameOver: null,
  error: null,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setConnected: (connected) => set({ connected }),
  setPlayerInfo: (playerId, gameId) => set({ playerId, gameId }),
  setPlayerName: (name) => set({ playerName: name }),

  updateGameState: (state) => set({
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
  setActiveCall: (callId, peerId) => set({ activeCallId: callId, activeCallPeerId: peerId }),

  setPhase: (phase, endTime) => set({
    phase,
    phaseEndTime: endTime,
    myDecision: phase === GamePhase.DECISION_PHASE ? null : get().myDecision,
    lastResult: phase === GamePhase.DECISION_PHASE ? null : get().lastResult,
  }),

  setMyDecision: (decision) => set({ myDecision: decision }),
  setLastResult: (result) => set({ lastResult: result }),
  setShadowInterference: (active) => set({ shadowInterference: active }),
  setGameOver: (data) => set({ gameOver: data }),
  setError: (error) => set({ error }),

  getMyPlayer: () => {
    const { playerId, players } = get()
    if (!playerId) return null
    return players.find(p => p.id === playerId) ?? null
  },

  reset: () => set(initialState),
}))
