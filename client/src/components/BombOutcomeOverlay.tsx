import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export function BombOutcomeOverlay() {
  const bombOutcome = useGameStore((s) => s.bombOutcome)
  const playerId = useGameStore((s) => s.playerId)

  if (!bombOutcome) return null

  const isMe = bombOutcome.playerId === playerId
  const exploded = bombOutcome.type === 'exploded'

  const title = exploded
    ? (isMe ? 'TE EXPLOTO LA BOMBA' : `A ${bombOutcome.playerName} LE EXPLOTO LA BOMBA`)
    : (isMe ? 'DESACTIVASTE LA BOMBA' : `${bombOutcome.playerName} DESACTIVO LA BOMBA`)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 60,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: exploded
            ? 'radial-gradient(circle, rgba(255,60,60,0.22) 0%, rgba(0,0,0,0.72) 70%)'
            : 'radial-gradient(circle, rgba(0,255,120,0.18) 0%, rgba(0,0,0,0.66) 70%)',
        }}
      >
        <motion.div
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            border: `1px solid ${exploded ? 'var(--red-danger)' : 'var(--green-neon)'}`,
            background: exploded ? 'rgba(60,0,0,0.35)' : 'rgba(0,40,20,0.35)',
            padding: '22px 28px',
            textAlign: 'center',
            boxShadow: exploded
              ? '0 0 30px rgba(255,23,68,0.45)'
              : '0 0 30px rgba(0,255,65,0.35)',
            maxWidth: 620,
          }}
          className={exploded ? 'pulse-red' : 'pulse'}
        >
          <div style={{ fontSize: 12, color: 'var(--gray-text)', letterSpacing: 3, marginBottom: 8 }}>
            EVENTO CRITICO
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: exploded ? 'var(--red-danger)' : 'var(--green-neon)',
            letterSpacing: 2,
            textShadow: exploded
              ? '0 0 24px rgba(255,23,68,0.6)'
              : '0 0 24px rgba(0,255,65,0.45)',
          }}>
            {title}
          </div>
          {!exploded && bombOutcome.chance !== undefined && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--cyan)' }}>
              Probabilidad usada: {bombOutcome.chance}%
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
