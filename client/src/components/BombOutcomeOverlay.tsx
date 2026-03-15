import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../i18n'

export function BombOutcomeOverlay() {
  const { tr } = useI18n()
  const bombOutcome = useGameStore((s) => s.bombOutcome)
  const playerId = useGameStore((s) => s.playerId)

  if (!bombOutcome) return null

  const isMe = bombOutcome.playerId === playerId
  const exploded = bombOutcome.type === 'exploded'

  const title = exploded
    ? (isMe ? 'THE BOMB EXPLODED ON YOU' : `THE BOMB EXPLODED ON ${bombOutcome.playerName}`)
    : (isMe ? 'YOU DEFUSED THE BOMB' : `${bombOutcome.playerName} ${tr('DESACTIVO LA BOMBA')}`)

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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            {exploded ? (
              <svg width="124" height="92" viewBox="0 0 124 92" role="img" aria-label="Explosion">
                <path d="M62 6 L72 23 L90 17 L84 36 L104 42 L86 52 L100 70 L79 67 L75 86 L62 74 L49 86 L45 67 L24 70 L38 52 L20 42 L40 36 L34 17 L52 23 Z" fill="#ff7a24" stroke="#ffd56b" strokeWidth="3" />
                <path d="M62 20 L68 32 L81 28 L77 40 L91 44 L78 51 L88 63 L74 61 L71 74 L62 66 L53 74 L50 61 L36 63 L46 51 L33 44 L47 40 L43 28 L56 32 Z" fill="#ff3e3e" />
                <circle cx="62" cy="46" r="9" fill="#ffe28c" />
              </svg>
            ) : (
              <svg width="108" height="82" viewBox="0 0 96 78" role="img" aria-label="Bomba desactivada">
                <defs>
                  <radialGradient id="overlayBomb" cx="38%" cy="35%" r="68%">
                    <stop offset="0%" stopColor="#48576d" />
                    <stop offset="55%" stopColor="#263244" />
                    <stop offset="100%" stopColor="#131c2a" />
                  </radialGradient>
                </defs>
                <path d="M63 15 L73 6" stroke="#9eaac0" strokeWidth="3" strokeLinecap="round" />
                <rect x="71" y="3" width="9" height="6" rx="1.5" fill="#8895ad" />
                <path d="M58 15 C65 10 70 11 74 14 C78 17 80 22 79 26" stroke="#c8d4ea" strokeWidth="2.2" fill="none" />
                <circle cx="48" cy="45" r="30" fill="url(#overlayBomb)" stroke="#7beeff" strokeWidth="2.4" />
                <circle cx="48" cy="45" r="10" fill="#0f1520" stroke="#74ffb0" strokeWidth="1.6" />
                <path d="M44 45 L47 48 L53 42" stroke="#74ffb0" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-text)', letterSpacing: 3, marginBottom: 8 }}>
            CRITICAL EVENT
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
              Chance used: {bombOutcome.chance}%
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
