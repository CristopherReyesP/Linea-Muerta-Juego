import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { GamePhase, PlayerState } from '../types'
import { PlayerAvatar } from './PlayerAvatar'
import { Waveform } from './animations/Waveform'

interface Props {
  onCallPlayer: (targetId: string) => void
  onAcceptCall: (callId: string) => void
  onRejectCall: (callId: string) => void
  onHangUp: () => void
  audioData: Uint8Array
  isSpeaking: boolean
}

export function CallPanel({
  onCallPlayer, onAcceptCall, onRejectCall, onHangUp,
  audioData, isSpeaking,
}: Props) {
  const phase = useGameStore(s => s.phase)
  const incomingCalls = useGameStore(s => s.incomingCalls)
  const activeCallPeerId = useGameStore(s => s.activeCallPeerId)
  const players = useGameStore(s => s.players)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const shadowInterference = useGameStore(s => s.shadowInterference)

  const peer = activeCallPeerId ? players.find(p => p.id === activeCallPeerId) : null

  const hasIncomingCalls = incomingCalls.length > 0

  const canCall = phase === GamePhase.CALL_PHASE &&
    myPlayer &&
    (myPlayer.state === PlayerState.ACTIVE || myPlayer.state === PlayerState.AT_RISK || myPlayer.isShadow) &&
    !activeCallPeerId &&
    !hasIncomingCalls

  // Players available to call
  const availablePlayers = players.filter(p =>
    p.id !== myPlayer?.id &&
    p.state !== PlayerState.DISCONNECTED &&
    p.state !== PlayerState.IN_CALL &&
    (p.isAlive || p.isShadow)
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      padding: 24,
      flex: 1,
      position: 'relative',
    }}>
      {/* Shadow interference overlay */}
      <AnimatePresence>
        {shadowInterference && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 0, 0, 0.1)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
            className="glitch"
          />
        )}
      </AnimatePresence>

      {/* Incoming calls */}
      <AnimatePresence>
        {hasIncomingCalls && !activeCallPeerId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{
              fontSize: 12,
              color: 'var(--green-neon)',
              letterSpacing: 3,
            }}
            className="flicker"
            >
              {incomingCalls.length === 1 ? 'LLAMADA ENTRANTE...' : `${incomingCalls.length} LLAMADAS ENTRANTES...`}
            </div>

            <div style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {incomingCalls.map(call => {
                const caller = players.find(p => p.id === call.callerId)
                if (!caller) return null

                return (
                  <motion.div
                    key={call.callId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                      padding: 20,
                      border: '1px solid var(--green-neon)',
                      background: 'var(--bg-panel)',
                      minWidth: 140,
                    }}
                  >
                    <div className="vibrate">
                      <PlayerAvatar player={caller} size={60} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-green"
                        onClick={() => onAcceptCall(call.callId)}
                        style={{ fontSize: 11, padding: '6px 12px' }}
                      >
                        CONTESTAR
                      </button>
                      <button
                        className="btn btn-red"
                        onClick={() => onRejectCall(call.callId)}
                        style={{ fontSize: 11, padding: '6px 12px' }}
                      >
                        RECHAZAR
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active call */}
      <AnimatePresence>
        {activeCallPeerId && peer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: 24,
              border: '1px solid var(--cyan)',
              background: 'var(--bg-panel)',
            }}
          >
            <div style={{
              fontSize: 12,
              color: 'var(--cyan)',
              letterSpacing: 3,
            }}>
              EN LLAMADA
            </div>

            <PlayerAvatar player={peer} size={80} />

            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isSpeaking ? 'var(--green-neon)' : 'var(--gray-shadow)',
              boxShadow: isSpeaking ? '0 0 10px var(--green-neon)' : 'none',
              transition: 'all 0.1s',
            }} />

            <Waveform
              audioData={audioData}
              color={shadowInterference ? '#ff1744' : '#00e5ff'}
            />

            <button className="btn btn-red" onClick={onHangUp}>
              COLGAR
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle state - player selection */}
      {!hasIncomingCalls && !activeCallPeerId && phase === GamePhase.CALL_PHASE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <div style={{
            fontSize: 12,
            color: 'var(--gray-text)',
            letterSpacing: 2,
          }}>
            SELECCIONA A QUIEN LLAMAR
          </div>

          {availablePlayers.length > 0 ? (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
            }}>
              {availablePlayers.map(p => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => canCall && onCallPlayer(p.id)}
                  disabled={!canCall}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: 16,
                    border: `1px solid ${p.state === PlayerState.AT_RISK ? 'var(--red-danger)' : p.isShadow ? 'var(--gray-shadow)' : 'var(--green-dim)'}`,
                    background: 'var(--bg-panel)',
                    cursor: canCall ? 'pointer' : 'not-allowed',
                    opacity: canCall ? 1 : 0.4,
                    fontFamily: 'var(--font-mono)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (canCall) {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px rgba(0,255,65,0.2)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--green-neon)'
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    ;(e.currentTarget as HTMLElement).style.borderColor = p.state === PlayerState.AT_RISK ? 'var(--red-danger)' : p.isShadow ? 'var(--gray-shadow)' : 'var(--green-dim)'
                  }}
                >
                  <PlayerAvatar player={p} size={50} showState={false} />
                  <span style={{
                    fontSize: 10,
                    color: 'var(--green-neon)',
                    letterSpacing: 2,
                  }}>
                    LLAMAR
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div style={{
              fontSize: 11,
              color: 'var(--gray-shadow)',
              letterSpacing: 1,
            }}>
              No hay jugadores disponibles
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
