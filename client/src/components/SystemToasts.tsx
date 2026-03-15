import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'
import { useI18n } from '../i18n'

interface Toast {
  id: string
  text: string
  tone: 'neutral' | 'warn' | 'good'
}

export function SystemToasts() {
  const { tr } = useI18n()
  const phase = useGameStore((s) => s.phase)
  const incomingCalls = useGameStore((s) => s.incomingCalls)
  const latestSignal = useGameStore((s) => s.latestSignal)
  const bombOutcome = useGameStore((s) => s.bombOutcome)
  const activeMinigameId = useGameStore((s) => s.activeMinigameId)

  const [toasts, setToasts] = useState<Toast[]>([])

  const phaseLabel = useMemo(() => {
    if (phase === GamePhase.CALL_PHASE) return tr('FASE DE LLAMADA')
    if (phase === GamePhase.DECISION_PHASE) return tr('FASE DE DECISION')
    if (phase === GamePhase.RESULT_PHASE) return tr('Entrando a resultados.')
    return null
  }, [phase, tr])

  const pushToast = (toast: Toast) => {
    setToasts((current) => [...current, toast].slice(-3))
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== toast.id))
    }, 2600)
  }

  useEffect(() => {
    if (!phaseLabel) return
    pushToast({
      id: `phase-${phase}-${Date.now()}`,
      text: phaseLabel,
      tone: phase === GamePhase.RESULT_PHASE ? 'warn' : 'neutral',
    })
  }, [phase, phaseLabel])

  useEffect(() => {
    if (incomingCalls.length === 0) return
    pushToast({
      id: `call-${incomingCalls[0]?.callId ?? Date.now()}`,
      text: incomingCalls.length === 1 ? tr('LLAMADA ENTRANTE') : `${incomingCalls.length} ${tr('LLAMADAS ENTRANTES...').replace('...', '')}`,
      tone: 'good',
    })
  }, [incomingCalls])

  useEffect(() => {
    if (!latestSignal) return
    pushToast({
      id: `signal-${latestSignal.playerId}-${latestSignal.emoji}-${Date.now()}`,
      text: activeMinigameId === 'adivina-linea'
        ? `${tr('SENAL ANONIMA')} ${latestSignal.emoji} ${tr(latestSignal.label)}`
        : `${latestSignal.playerName} / ${latestSignal.emoji} ${tr(latestSignal.label)}`,
      tone: 'neutral',
    })
  }, [activeMinigameId, latestSignal])

  useEffect(() => {
    if (!bombOutcome) return
    pushToast({
      id: `bomb-${bombOutcome.type}-${bombOutcome.playerId}`,
      text: bombOutcome.type === 'defused'
        ? `${bombOutcome.playerName} ${tr('DESACTIVO LA BOMBA')}`
        : `${tr('LA BOMBA EXPLOTO EN')} ${bombOutcome.playerName}`,
      tone: bombOutcome.type === 'defused' ? 'good' : 'warn',
    })
  }, [bombOutcome])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 18,
        left: 18,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const borderColor =
            toast.tone === 'good'
              ? 'rgba(0,255,65,0.4)'
              : toast.tone === 'warn'
                ? 'rgba(255,23,68,0.45)'
                : 'rgba(0,229,255,0.35)'
          const textColor =
            toast.tone === 'good'
              ? 'var(--green-neon)'
              : toast.tone === 'warn'
                ? 'var(--red-danger)'
                : 'var(--cyan)'

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -20, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.96 }}
              style={{
                maxWidth: 320,
                padding: '9px 12px',
                border: `1px solid ${borderColor}`,
                background: 'rgba(4,10,16,0.92)',
                boxShadow: '0 10px 22px rgba(0,0,0,0.26)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2 }}>{tr('SISTEMA')}</div>
              <div style={{ fontSize: 11, color: textColor, letterSpacing: 1.2, marginTop: 4 }}>{toast.text}</div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
