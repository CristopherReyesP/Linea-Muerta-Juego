import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { useSocket } from './hooks/useSocket'
import { useWebRTC } from './hooks/useWebRTC'
import { MetaGamePhase } from './types'
import { Cabin } from './components/Cabin'
import { DiscussionPhase } from './components/DiscussionPhase'
import { SessionComplete } from './components/SessionComplete'
import { GameRules } from './components/GameRules'
import { LanguageProvider, useI18n } from './i18n'
import { ThreeLobby } from './components/three/ThreeLobby'
import { ThreeSceneShell } from './components/three/ThreeSceneShell'

function IntroOverlay() {
  const currentMinigameInfo = useGameStore((s) => s.currentMinigameInfo)
  const currentMinigameIndex = useGameStore((s) => s.currentMinigameIndex)
  const totalMinigames = useGameStore((s) => s.totalMinigames)
  const { tr, trMinigameDescription, trMinigameName } = useI18n()

  if (!currentMinigameInfo) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{
        width: 'min(760px, calc(100vw - 32px))',
        padding: '36px clamp(22px, 4vw, 44px)',
        border: '1px solid rgba(130, 214, 255, 0.24)',
        background: `
          radial-gradient(circle at top, rgba(96, 221, 255, 0.14), transparent 32%),
          linear-gradient(180deg, rgba(5, 10, 18, 0.9), rgba(3, 7, 13, 0.95))
        `,
        boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 100%),
            linear-gradient(180deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 100%)
          `,
          backgroundSize: '24px 24px',
          opacity: 0.22,
        }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: 'var(--gray-text)', textTransform: 'uppercase' }}>
            {tr('Siguiente transmision')}
          </div>
          <div
            style={{
              padding: '6px 10px',
              border: '1px solid rgba(130, 214, 255, 0.22)',
              background: 'rgba(130, 214, 255, 0.06)',
              color: 'var(--cyan)',
              fontSize: 12,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
            }}
          >
            {tr('Salto')} {currentMinigameIndex + 1}/{totalMinigames}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(220px, 0.8fr)',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#9bb0bf', letterSpacing: 2.2, textTransform: 'uppercase' }}>
                {tr('Destino de la mision')}
              </div>
              <h2
                style={{
                  marginTop: 12,
                  fontSize: 'clamp(30px, 5vw, 52px)',
                  lineHeight: 0.98,
                  color: '#f4fbff',
                  textShadow: '0 2px 18px rgba(103, 217, 255, 0.15)',
                }}
              >
                {trMinigameName(currentMinigameInfo.id, currentMinigameInfo.name)}
              </h2>
              <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.75, color: '#c6d4de', maxWidth: 460 }}>
                {trMinigameDescription(currentMinigameInfo.id, currentMinigameInfo.shortDescription)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '7px 10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#d8e3eb',
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                {tr('Cabinas aisladas')}
              </div>
              <div
                style={{
                  padding: '7px 10px',
                  border: '1px solid rgba(130, 214, 255, 0.18)',
                  background: 'rgba(130, 214, 255, 0.05)',
                  color: '#b8eeff',
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                {tr('Canal sincronizado')}
              </div>
            </div>
          </div>

          <div
            style={{
              border: '1px solid rgba(130, 214, 255, 0.16)',
              background: 'linear-gradient(180deg, rgba(7, 14, 22, 0.8), rgba(4, 9, 15, 0.9))',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 220,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2, textTransform: 'uppercase' }}>
                {tr('Estado del salto')}
              </div>
              <div
                style={{
                  marginTop: 14,
                  height: 10,
                  border: '1px solid rgba(130, 214, 255, 0.18)',
                  background: 'rgba(255,255,255,0.04)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentMinigameIndex + 1) / totalMinigames) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #67d9ff, #9fffc9)',
                    boxShadow: '0 0 18px rgba(103, 217, 255, 0.45)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: '#dce8ef', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {tr('Preparando enlace entre naves')}
              </div>
              <div style={{ fontSize: 13, color: '#9fb4c4', lineHeight: 1.6 }}>
                {tr('Mantente listo. El siguiente minijuego comenzara en unos segundos.')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function OverlayFrame({ children, zIndex = 2 }: { children: React.ReactNode; zIndex?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function AppContent() {
  const metaPhase = useGameStore((s) => s.metaPhase)
  const playerId = useGameStore((s) => s.playerId)
  const [showRules, setShowRules] = useState(false)
  const [threeLobbyDocked, setThreeLobbyDocked] = useState(false)
  const { tr } = useI18n()

  const {
    socket,
    createGame,
    joinGame,
    leaveGame,
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
    sendSignal,
    sendLobbyChat,
    sendMenuChat,
  } = useSocket()

  const { remoteAudioRef, audioData, isSpeaking } = useWebRTC(socket)

  const audioElRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    const el = document.getElementById('remote-audio') as HTMLAudioElement
    if (el) {
      audioElRef.current = el
      ;(remoteAudioRef as React.MutableRefObject<HTMLAudioElement | null>).current = el
    }
  }, [remoteAudioRef, metaPhase])

  const showLobby = metaPhase === MetaGamePhase.LOBBY || !playerId
  const showThreeShell = showLobby || metaPhase === MetaGamePhase.MINIGAME_INTRO || metaPhase === MetaGamePhase.DISCUSSION || metaPhase === MetaGamePhase.SESSION_COMPLETE

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showThreeShell && (
        <ThreeSceneShell
          interactive={showLobby}
          onSceneTap={showLobby && threeLobbyDocked ? () => setThreeLobbyDocked(false) : undefined}
        />
      )}

      {showLobby && (
        <>
          <div
            style={{
              position: 'fixed',
              left: 14,
              bottom: 14,
              zIndex: 9998,
              display: 'flex',
              gap: 8,
              padding: 6,
              border: '1px solid rgba(130, 214, 255, 0.18)',
              background: 'rgba(4, 8, 14, 0.72)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            }}
          >
            {!threeLobbyDocked ? (
              <button
                className="btn btn-cyan"
                style={{ padding: '8px 12px', fontSize: 12 }}
                onClick={() => setThreeLobbyDocked(true)}
              >
                Ver escena
              </button>
            ) : (
              <button
                className="btn btn-green"
                style={{ padding: '8px 12px', fontSize: 12 }}
                onClick={() => setThreeLobbyDocked(false)}
              >
                Mostrar panel
              </button>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: threeLobbyDocked ? 'flex-start' : 'center',
              padding: 16,
              pointerEvents: 'none',
            }}
          >
            {!threeLobbyDocked && (
              <button
                type="button"
                aria-label="Ocultar panel y ver escena"
                onClick={() => setThreeLobbyDocked(true)}
                style={{
                  inset: 0,
                  position: 'absolute',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  pointerEvents: 'auto',
                  cursor: 'default',
                }}
              />
            )}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: threeLobbyDocked ? 'flex-start' : 'center',
                transition: 'justify-content 0.25s ease',
              }}
            >
              {!threeLobbyDocked && (
                <div
                  style={{ pointerEvents: 'auto' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <ThreeLobby
                    docked={false}
                    onCenterPanel={() => setThreeLobbyDocked(false)}
                    onCreateGame={createGame}
                    onJoinGame={joinGame}
                    onLeaveGame={leaveGame}
                    onStart={startGame}
                    onSendLobbyChat={sendLobbyChat}
                    onSendMenuChat={sendMenuChat}
                  />
                </div>
              )}
              {threeLobbyDocked && (
                <div
                  style={{
                    pointerEvents: 'auto',
                    padding: '10px 12px',
                    border: '1px solid rgba(130, 214, 255, 0.2)',
                    background: 'rgba(4, 8, 14, 0.56)',
                    backdropFilter: 'blur(8px)',
                    color: 'var(--gray-text)',
                    fontSize: 11,
                    letterSpacing: 1.1,
                  }}
                >
                  {tr('Arrastra la escena para rotar la camara.')}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {metaPhase === MetaGamePhase.MINIGAME_INTRO && (
        <OverlayFrame zIndex={30}>
          <IntroOverlay />
        </OverlayFrame>
      )}

      {metaPhase === MetaGamePhase.MINIGAME_IN_PROGRESS && (
        <>
          <Cabin
            desktopOnly
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
            onSendSignal={sendSignal}
            audioData={audioData}
            isSpeaking={isSpeaking}
            onShowRules={() => setShowRules(true)}
          />
        </>
      )}

      {metaPhase === MetaGamePhase.DISCUSSION && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
          <DiscussionPhase onContinue={continueToNext} />
        </div>
      )}

      {metaPhase === MetaGamePhase.SESSION_COMPLETE && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
          <SessionComplete />
        </div>
      )}

      <AnimatePresence>
        {showRules && <GameRules onClose={() => setShowRules(false)} />}
      </AnimatePresence>

      <audio id="remote-audio" autoPlay style={{ display: 'none' }} />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
