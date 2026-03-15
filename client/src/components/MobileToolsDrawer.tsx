import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../i18n'

interface Props {
  open: boolean
  onToggle: () => void
  onShowRules: () => void
  onSendSignal: (data: { emoji: string; label: string }) => void
}

const SIGNAL_OPTIONS = [
  { emoji: '👀', label: 'OJO' },
  { emoji: '⚠️', label: 'CUIDADO' },
  { emoji: '🤝', label: 'CONFIA' },
  { emoji: '❌', label: 'MENTIRA' },
  { emoji: '❓', label: 'DUDA' },
  { emoji: '🔥', label: 'TENSION' },
  { emoji: '🧨', label: 'PELIGRO' },
  { emoji: '📡', label: 'ESCUCHEN' },
]

export function MobileToolsDrawer({ open, onToggle, onShowRules, onSendSignal }: Props) {
  const { tr } = useI18n()
  const latestSignal = useGameStore((s) => s.latestSignal)
  const signalHistory = useGameStore((s) => s.signalHistory)
  const activeMinigameId = useGameStore((s) => s.activeMinigameId)
  const [signalCooldownUntil, setSignalCooldownUntil] = useState(0)
  const [now, setNow] = useState(Date.now())

  const signalCooldownRemaining = Math.max(0, Math.ceil((signalCooldownUntil - now) / 1000))

  useEffect(() => {
    if (signalCooldownUntil <= Date.now()) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [signalCooldownUntil])

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 16,
          zIndex: 6,
          width: 54,
          height: 54,
          borderRadius: '50%',
          border: '1px solid rgba(0,229,255,0.35)',
          background: 'rgba(4,10,16,0.94)',
          color: 'var(--cyan)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 1.2,
          boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
        }}
      >
        TOOLS
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            style={{
              position: 'absolute',
              left: 10,
              right: 10,
              bottom: 80,
              zIndex: 6,
              border: '1px solid rgba(0,229,255,0.24)',
              background: 'rgba(5,12,18,0.96)',
              boxShadow: '0 18px 36px rgba(0,0,0,0.34)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 2.4 }}>{tr('HERRAMIENTAS')}</div>
                <div style={{ fontSize: 9, color: 'var(--gray-text)', marginTop: 2 }}>{tr('Accesos rapidos de cabina')}</div>
              </div>
              <button
                onClick={onShowRules}
                style={{
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--white)',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                }}
              >
                {tr('REGLAS')}
              </button>
            </div>

            <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 1.2 }}>{tr('CANAL GLOBAL')}</div>

            <div style={{
              border: '1px solid rgba(0,229,255,0.16)',
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--white)', lineHeight: 1.5 }}>
                {latestSignal
                  ? `${activeMinigameId === 'adivina-linea' ? 'Linea desconocida' : latestSignal.playerName}: ${latestSignal.emoji} ${latestSignal.label}`
                  : 'Sin broadcast reciente.'}
              </div>
            </div>

            {signalHistory.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {signalHistory.slice(0, 3).map((entry, index) => (
                  <div
                    key={`${entry.playerId}-${entry.emoji}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 9,
                      color: 'var(--gray-text)',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{entry.emoji}</span>
                    <span>
                      {activeMinigameId === 'adivina-linea' ? 'Linea desconocida' : entry.playerName} / {entry.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 6,
            }}>
              {SIGNAL_OPTIONS.map((signal) => (
                <button
                  key={`mobile-${signal.emoji}-${signal.label}`}
                  onClick={() => {
                    if (signalCooldownRemaining > 0) return
                    onSendSignal(signal)
                    setSignalCooldownUntil(Date.now() + 8000)
                    setNow(Date.now())
                    onToggle()
                  }}
                  style={{
                    border: `1px solid ${signalCooldownRemaining > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,229,255,0.16)'}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: signalCooldownRemaining > 0 ? 'var(--gray-shadow)' : 'var(--white)',
                    padding: '8px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    opacity: signalCooldownRemaining > 0 ? 0.45 : 1,
                  }}
                  disabled={signalCooldownRemaining > 0}
                >
                  <span style={{ fontSize: 16 }}>{signal.emoji}</span>
                  <span style={{ color: 'var(--gray-text)' }}>{signal.label}</span>
                </button>
              ))}
            </div>

            {signalCooldownRemaining > 0 && (
              <div style={{ fontSize: 9, color: 'var(--gray-text)', textAlign: 'center' }}>
                Canal en recarga: {signalCooldownRemaining}s
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
