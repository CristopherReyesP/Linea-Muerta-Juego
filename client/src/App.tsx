import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { useSocket } from './hooks/useSocket'
import { useWebRTC } from './hooks/useWebRTC'
import { MetaGamePhase } from './types'
import { Lobby } from './components/Lobby'
import { Cabin } from './components/Cabin'
import { DiscussionPhase } from './components/DiscussionPhase'
import { SessionComplete } from './components/SessionComplete'
import { GameRules } from './components/GameRules'

export default function App() {
  const metaPhase = useGameStore(s => s.metaPhase)
  const playerId = useGameStore(s => s.playerId)
  const currentMinigameInfo = useGameStore(s => s.currentMinigameInfo)
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
    votePlayer,
    submitLineGuesses,
    passBomb,
    attemptDefuse,
    skipToFinish,
    useShadowInterference,
    continueToNext,
    submitSabotage,
    submitReport,
    submitEmergencyResponse,
    voteEmoji,
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
  }, [remoteAudioRef, metaPhase])

  const showLobby = metaPhase === MetaGamePhase.LOBBY || !playerId

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showLobby && (
        <Lobby
          onCreateGame={createGame}
          onJoinGame={joinGame}
          onStart={startGame}
          onShowRules={() => setShowRules(true)}
        />
      )}

      {/* Minigame intro overlay */}
      {metaPhase === MetaGamePhase.MINIGAME_INTRO && currentMinigameInfo && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: 48,
              border: '1px solid var(--cyan)',
              background: 'rgba(0, 229, 255, 0.05)',
            }}
          >
            <div style={{
              fontSize: 10,
              color: 'var(--gray-text)',
              letterSpacing: 4,
            }}>
              SIGUIENTE MINIJUEGO
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: 'var(--cyan)',
              letterSpacing: 4,
              textShadow: '0 0 20px rgba(0,229,255,0.3)',
            }}>
              {currentMinigameInfo.name}
            </div>
            <div style={{
              fontSize: 12,
              color: 'var(--gray-text)',
              textAlign: 'center',
              maxWidth: 360,
              lineHeight: 1.6,
            }}>
              {currentMinigameInfo.shortDescription}
            </div>
          </motion.div>
        </div>
      )}

      {/* Active minigame */}
      {metaPhase === MetaGamePhase.MINIGAME_IN_PROGRESS && (
        <Cabin
          onCallPlayer={callPlayer}
          onAcceptCall={acceptCall}
          onRejectCall={rejectCall}
          onHangUp={hangUp}
          onSubmitDecision={submitDecision}
          onVotePlayer={votePlayer}
          onSubmitLineGuesses={submitLineGuesses}
          onPassBomb={passBomb}
          onAttemptDefuse={attemptDefuse}
          onSkipToFinish={skipToFinish}
          onInterference={useShadowInterference}
          onSubmitSabotage={submitSabotage}
          onSubmitReport={submitReport}
          onSubmitEmergencyResponse={submitEmergencyResponse}
          onVoteEmoji={voteEmoji}
          audioData={audioData}
          isSpeaking={isSpeaking}
          onShowRules={() => setShowRules(true)}
        />
      )}

      {/* Discussion phase */}
      {metaPhase === MetaGamePhase.DISCUSSION && (
        <DiscussionPhase onContinue={continueToNext} />
      )}

      {/* Session complete */}
      {metaPhase === MetaGamePhase.SESSION_COMPLETE && (
        <SessionComplete />
      )}

      <AnimatePresence>
        {showRules && <GameRules onClose={() => setShowRules(false)} />}
      </AnimatePresence>

      {/* Hidden audio element for WebRTC */}
      <audio id="remote-audio" autoPlay style={{ display: 'none' }} />
    </div>
  )
}
