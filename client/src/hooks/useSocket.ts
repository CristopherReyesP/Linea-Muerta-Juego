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
  playBombExplosion, playBombDefused,
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

    // Meta-game state updates
    socket.on('meta_state_update', (state) => {
      store.updateMetaState(state)
    })

    // Minigame state updates (from active minigame)
    socket.on('game_state_update', (state) => {
      store.updateGameState(state)
    })

    socket.on('call_ringing', ({ callId, targetId, targetName }) => {
      store.setPendingCall({ callId, targetId, targetName })
    })

    socket.on('incoming_call', ({ callId, callerId, callerName }) => {
      store.addIncomingCall({ callId, callerId, callerName })
      startRing()
    })

    socket.on('call_started', ({ callId, peerId }) => {
      store.setPendingCall(null)
      store.clearIncomingCalls()
      store.setActiveCall(callId, peerId)
      stopRing()
      playCallAccepted()
    })

    socket.on('call_ended', () => {
      store.setPendingCall(null)
      store.setActiveCall(null, null)
      stopRing()
      playCallEnded()
    })

    socket.on('call_rejected', () => {
      store.setPendingCall(null)
      store.setActiveCall(null, null)
      stopRing()
      playCallEnded()
    })

    socket.on('call_cancelled', ({ callId }: { callId: string }) => {
      store.removeIncomingCall(callId)
      if (useGameStore.getState().incomingCalls.length === 0) {
        stopRing()
      }
    })

    socket.on('phase_changed', ({ phase, endTime }) => {
      store.setPhase(phase, endTime)
      store.setPendingCall(null)
      store.clearIncomingCalls()
      store.setActiveCall(null, null)
      stopRing()
      playPhaseChange()

      if (phase === 'CALL_PHASE') {
        startAmbient()
      } else if (phase === 'GAME_OVER') {
        stopAmbient()
      }
    })

    socket.on('decision_requested', () => {
      store.setMyDecision(null)
      store.setMyVote(null)
    })

    socket.on('round_result', (result) => {
      store.setLastResult(result)

      const myId = useGameStore.getState().playerId
      if (myId && result.balanceChanges[myId] !== undefined) {
        if (result.balanceChanges[myId] > 0) {
          playBalanceUp()
        } else {
          playBalanceDown()
        }
      }
    })

    socket.on('vote_result', (result) => {
      store.setVoteResult(result)
    })

    socket.on('player_became_shadow', () => {
      playShadowTransition()
    })

    socket.on('game_over', (data) => {
      store.setGameOver(data)
      stopAmbient()
    })

    socket.on('minigame_intro', ({ minigame, index, total }) => {
      store.setMinigameIntro(minigame, index, total)
    })

    socket.on('discussion_started', (data) => {
      store.setDiscussionData(data)
      stopAmbient()
    })

    socket.on('session_complete', (data) => {
      store.setSessionComplete(data)
      stopAmbient()
    })

    socket.on('open_voice', ({ playerIds }) => {
      store.setOpenVoicePlayerIds(playerIds)
    })

    socket.on('voice_distortion', ({ enabled }) => {
      store.setVoiceDistortion(enabled)
    })

    socket.on('line_assignments', (data) => {
      store.setLineAssignments(data)
    })

    socket.on('line_guess_results', (data) => {
      store.setLineGuessResults(data)
    })

    socket.on('bomb_state_update', (data) => {
      store.setBombState(data)
    })

    socket.on('bomb_passed', (data) => {
      store.setBombLastPass(data)
    })

    socket.on('bomb_defuse_result', (data) => {
      store.setBombDefuseResult(data)
    })

    socket.on('bomb_exploded', (data) => {
      store.setBombOutcome({ type: 'exploded', playerId: data.playerId, playerName: data.playerName })
      playBombExplosion()
    })

    socket.on('bomb_defused', (data) => {
      store.setBombOutcome({ type: 'defused', playerId: data.playerId, playerName: data.playerName, chance: data.chance })
      playBombDefused()
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

  const createGame = useCallback((name: string, avatarId?: string, avatarColor?: string, accessoryId?: string) => {
    socketRef.current?.emit('create_game', { name, avatarId, avatarColor, accessoryId })
  }, [])

  const joinGame = useCallback((name: string, gameId: string, avatarId?: string, avatarColor?: string, accessoryId?: string) => {
    socketRef.current?.emit('join_game', { name, gameId, avatarId, avatarColor, accessoryId })
  }, [])

  const startGame = useCallback((data?: { selectedMinigameIds?: string[] }) => {
    socketRef.current?.emit('start_game', data)
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
    if (useGameStore.getState().incomingCalls.length === 0) {
      stopRing()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hangUp = useCallback(() => {
    socketRef.current?.emit('hang_up')
    store.setPendingCall(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitDecision = useCallback((decision: Decision) => {
    socketRef.current?.emit('submit_decision', decision)
    store.setMyDecision(decision)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const votePlayer = useCallback((targetPlayerId: string) => {
    socketRef.current?.emit('vote_player', targetPlayerId)
    store.setMyVote(targetPlayerId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const useShadowInterference = useCallback((targetPlayerId: string) => {
    socketRef.current?.emit('use_shadow_interference', targetPlayerId)
  }, [])

  const submitLineGuesses = useCallback((guesses: Record<string, string>) => {
    socketRef.current?.emit('submit_line_guesses', guesses)
    store.setMyLineGuesses(guesses)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const passBomb = useCallback((targetPlayerId: string) => {
    socketRef.current?.emit('pass_bomb', targetPlayerId)
  }, [])

  const attemptDefuse = useCallback(() => {
    socketRef.current?.emit('attempt_defuse')
  }, [])

  const skipToFinish = useCallback(() => {
    socketRef.current?.emit('skip_to_finish')
  }, [])

  const continueToNext = useCallback(() => {
    socketRef.current?.emit('continue_to_next')
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
    votePlayer,
    submitLineGuesses,
    passBomb,
    attemptDefuse,
    skipToFinish,
    useShadowInterference,
    continueToNext,
  }
}
