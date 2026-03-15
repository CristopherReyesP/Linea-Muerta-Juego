import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { GamePhase, PlayerState } from '../types'
import { PlayerAvatar } from './PlayerAvatar'
import { Waveform } from './animations/Waveform'
import { useI18n } from '../i18n'

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
  const { tr } = useI18n()
  const phase = useGameStore(s => s.phase)
  const incomingCalls = useGameStore(s => s.incomingCalls)
  const pendingCall = useGameStore(s => s.pendingCall)
  const activeCallPeerId = useGameStore(s => s.activeCallPeerId)
  const players = useGameStore(s => s.players)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const shadowInterference = useGameStore(s => s.shadowInterference)

  const peer = activeCallPeerId ? players.find(p => p.id === activeCallPeerId) : null
  const pendingTarget = pendingCall ? players.find(p => p.id === pendingCall.targetId) : null

  const hasIncomingCalls = incomingCalls.length > 0

  const canCall = phase === GamePhase.CALL_PHASE &&
    myPlayer &&
    (myPlayer.state === PlayerState.ACTIVE || myPlayer.state === PlayerState.AT_RISK || myPlayer.isShadow) &&
    !activeCallPeerId &&
    !pendingCall

  const callTargets = players.filter(p =>
    p.id !== myPlayer?.id &&
    p.state !== PlayerState.DISCONNECTED
  )

  const getCallStatus = (player: typeof players[number]): { key: 'available' | 'in_call' | 'unavailable'; label: string; color: string } => {
    if (player.state === PlayerState.IN_CALL) {
      return { key: 'in_call', label: tr('En llamada'), color: '#ffab00' }
    }
    if (!player.isAlive && !player.isShadow) {
      return { key: 'unavailable', label: tr('No disponible'), color: '#7a7a7a' }
    }
    return { key: 'available', label: tr('Disponible'), color: '#00ff41' }
  }

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

      {/* Pending outgoing call - "Llamando a..." */}
      <AnimatePresence>
        {pendingCall && pendingTarget && !activeCallPeerId && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: 24,
              border: '1px solid var(--green-dim)',
              background: 'var(--bg-panel)',
            }}
          >
            <div style={{
              fontSize: 12,
              color: 'var(--green-dim)',
              letterSpacing: 3,
            }}
            className="pulse"
            >
              {tr('LLAMANDO...')}
            </div>

            <PhoneWaves color="var(--green-neon)" />

            <PlayerAvatar player={pendingTarget} size={70} />

            <div style={{
              fontSize: 11,
              color: 'var(--gray-text)',
              letterSpacing: 1,
            }}>
              {tr('Esperando respuesta')}
            </div>

            <button className="btn btn-red" onClick={onHangUp} style={{ fontSize: 11 }}>
              {tr('CANCELAR')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming calls - show even if we have a pending outgoing call */}
      <AnimatePresence>
        {hasIncomingCalls && !activeCallPeerId && (
          <motion.div
            key="incoming"
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
              {incomingCalls.length === 1 ? tr('LLAMADA ENTRANTE...') : `${incomingCalls.length} ${tr('LLAMADAS ENTRANTES...')}`}
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
                        {tr('CONTESTAR')}
                      </button>
                      <button
                        className="btn btn-red"
                        onClick={() => onRejectCall(call.callId)}
                        style={{ fontSize: 11, padding: '6px 12px' }}
                      >
                        {tr('RECHAZAR')}
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
              {tr('EN LLAMADA')}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              border: '1px solid var(--cyan)',
              borderRadius: '50%',
              background: 'rgba(0,229,255,0.08)',
              boxShadow: '0 0 14px rgba(0,229,255,0.28)',
              fontSize: 20,
              color: 'var(--cyan)',
            }}
            className="pulse"
            title={tr('Llamada activa')}
            >
              📞
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
              {tr('COLGAR')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle state - player selection (only when no pending call, no incoming, no active) */}
      {!hasIncomingCalls && !activeCallPeerId && !pendingCall && phase === GamePhase.CALL_PHASE && (
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
            {tr('SELECCIONA A QUIEN LLAMAR')}
          </div>

          {callTargets.length > 0 ? (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
            }}>
              {callTargets.map(p => {
                const callStatus = getCallStatus(p)
                const canCallTarget = canCall && callStatus.key === 'available'
                return (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => canCallTarget && onCallPlayer(p.id)}
                  disabled={!canCallTarget}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: 16,
                    border: `1px solid ${
                      callStatus.key === 'available'
                        ? (p.state === PlayerState.AT_RISK ? 'var(--red-danger)' : p.isShadow ? 'var(--gray-shadow)' : 'var(--green-dim)')
                        : callStatus.color
                    }`,
                    background: 'var(--bg-panel)',
                    cursor: canCallTarget ? 'pointer' : 'not-allowed',
                    opacity: canCallTarget ? 1 : 0.65,
                    fontFamily: 'var(--font-mono)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (canCallTarget) {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px rgba(0,255,65,0.2)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--green-neon)'
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    ;(e.currentTarget as HTMLElement).style.borderColor = callStatus.key === 'available'
                      ? (p.state === PlayerState.AT_RISK ? 'var(--red-danger)' : p.isShadow ? 'var(--gray-shadow)' : 'var(--green-dim)')
                      : callStatus.color
                  }}
                >
                  <PlayerAvatar player={p} size={50} showState={false} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: callStatus.color }}>☎</span>
                    <span style={{
                      fontSize: 10,
                      color: callStatus.color,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                    }}>
                      {callStatus.label}
                    </span>
                  </div>
                </motion.button>
              )})}
            </div>
          ) : (
            <div style={{
              fontSize: 11,
              color: 'var(--gray-shadow)',
              letterSpacing: 1,
              lineHeight: 1.6,
              textAlign: 'center',
            }}>
              {tr('No hay jugadores disponibles.')}
              <br />
              {tr('La cabina esta en silencio por ahora.')}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function PhoneWaves({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[0, 0.38, 0.76].map((delay, idx) => (
        <motion.span
          key={idx}
          initial={{ scale: 0.5, opacity: 0.65 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 1.25, repeat: Infinity, ease: 'easeOut', delay }}
          style={{
            position: 'absolute',
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: `1.4px solid ${color}`,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}
      <span style={{ color, fontSize: 16 }}>📞</span>
    </div>
  )
}
