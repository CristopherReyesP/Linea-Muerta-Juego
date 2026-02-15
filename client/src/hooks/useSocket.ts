import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useGameStore } from '../store/gameStore'
import { Decision } from '../types'
import {
  startAmbient, stopAmbient,
  startRing, stopRing,
  playCallAccepted, playCallEnded,
  playPhaseChange, playShadowTransition,
  playBalanceUp, playBalanceDown,
} from '../audio/SoundEngine'

const SOCKET_URL = 'http://localhost:3001'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const store = useGameStore()

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      store.setConnected(true)
    })

    socket.on('disconnect', () => {
      store.setConnected(false)
    })

    socket.on('game_joined', ({ gameId, playerId }) => {
      store.setPlayerInfo(playerId, gameId)
    })

    socket.on('game_state_update', (state) => {
      store.updateGameState(state)
    })

    socket.on('incoming_call', ({ callId, callerId, callerName }) => {
      store.addIncomingCall({ callId, callerId, callerName })
      startRing()
    })

    socket.on('call_started', ({ callId, peerId }) => {
      store.clearIncomingCalls()
      store.setActiveCall(callId, peerId)
      stopRing()
      playCallAccepted()
    })

    socket.on('call_ended', () => {
      store.setActiveCall(null, null)
      stopRing()
      playCallEnded()
    })

    socket.on('call_rejected', () => {
      store.setActiveCall(null, null)
      stopRing()
      playCallEnded()
    })

    socket.on('call_cancelled', ({ callId }: { callId: string }) => {
      store.removeIncomingCall(callId)
      // Stop ring only if no more incoming calls
      if (useGameStore.getState().incomingCalls.length === 0) {
        stopRing()
      }
    })

    socket.on('phase_changed', ({ phase, endTime }) => {
      store.setPhase(phase, endTime)
      store.clearIncomingCalls()
      store.setActiveCall(null, null)
      stopRing()
      playPhaseChange()

      // Start ambient on first game phase
      if (phase === 'CALL_PHASE') {
        startAmbient()
      } else if (phase === 'GAME_OVER') {
        stopAmbient()
      }
    })

    socket.on('decision_requested', () => {
      store.setMyDecision(null)
    })

    socket.on('round_result', (result) => {
      store.setLastResult(result)

      // Play balance sound for current player
      const myId = useGameStore.getState().playerId
      if (myId && result.balanceChanges[myId] !== undefined) {
        if (result.balanceChanges[myId] > 0) {
          playBalanceUp()
        } else {
          playBalanceDown()
        }
      }
    })

    socket.on('player_became_shadow', () => {
      playShadowTransition()
    })

    socket.on('game_over', (data) => {
      store.setGameOver(data)
      stopAmbient()
    })

    socket.on('shadow_interference', ({ duration }) => {
      store.setShadowInterference(true)
      setTimeout(() => store.setShadowInterference(false), duration * 1000)
    })

    socket.on('error', (msg: string) => {
      console.error('[Server Error]', msg)
      store.setError(msg)
    })

    return () => {
      socket.disconnect()
      stopAmbient()
      stopRing()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createGame = useCallback((name: string) => {
    socketRef.current?.emit('create_game', { name })
  }, [])

  const joinGame = useCallback((name: string, gameId: string) => {
    socketRef.current?.emit('join_game', { name, gameId })
  }, [])

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game')
  }, [])

  const callPlayer = useCallback((targetId: string) => {
    socketRef.current?.emit('call_player', targetId)
  }, [])

  const acceptCall = useCallback((callId: string) => {
    socketRef.current?.emit('accept_call', callId)
  }, [])

  const rejectCall = useCallback((callId: string) => {
    socketRef.current?.emit('reject_call', callId)
    store.removeIncomingCall(callId)
    // Stop ring only if no more incoming calls
    if (useGameStore.getState().incomingCalls.length === 0) {
      stopRing()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hangUp = useCallback(() => {
    socketRef.current?.emit('hang_up')
  }, [])

  const submitDecision = useCallback((decision: Decision) => {
    socketRef.current?.emit('submit_decision', decision)
    store.setMyDecision(decision)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const useShadowInterference = useCallback((targetPlayerId: string) => {
    socketRef.current?.emit('use_shadow_interference', targetPlayerId)
  }, [])

  return {
    socket: socketRef,
    createGame,
    joinGame,
    startGame,
    callPlayer,
    acceptCall,
    rejectCall,
    hangUp,
    submitDecision,
    useShadowInterference,
  }
}
