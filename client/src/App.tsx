import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { useSocket } from './hooks/useSocket'
import { useWebRTC } from './hooks/useWebRTC'
import { GamePhase } from './types'
import { Lobby } from './components/Lobby'
import { Cabin } from './components/Cabin'
import { GameRules } from './components/GameRules'

export default function App() {
  const phase = useGameStore(s => s.phase)
  const playerId = useGameStore(s => s.playerId)
  const [showRules, setShowRules] = useState(false)

  const {
    socket,
    createGame,
    joinGame,
    startGame,
    callPlayer,
    acceptCall,
    rejectCall,
    hangUp,
    submitDecision,
    useShadowInterference,
  } = useSocket()

  const { remoteAudioRef, audioData, isSpeaking } = useWebRTC(socket)

  // Attach remote audio element
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    const el = document.getElementById('remote-audio') as HTMLAudioElement
    if (el) {
      audioElRef.current = el
      ;(remoteAudioRef as React.MutableRefObject<HTMLAudioElement | null>).current = el
    }
  }, [remoteAudioRef, phase])

  const showLobby = phase === GamePhase.LOBBY || !playerId

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showLobby ? (
        <Lobby
          onCreateGame={createGame}
          onJoinGame={joinGame}
          onStart={startGame}
          onShowRules={() => setShowRules(true)}
        />
      ) : (
        <Cabin
          onCallPlayer={callPlayer}
          onAcceptCall={acceptCall}
          onRejectCall={rejectCall}
          onHangUp={hangUp}
          onSubmitDecision={submitDecision}
          onInterference={useShadowInterference}
          audioData={audioData}
          isSpeaking={isSpeaking}
          onShowRules={() => setShowRules(true)}
        />
      )}

      <AnimatePresence>
        {showRules && <GameRules onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  )
}
