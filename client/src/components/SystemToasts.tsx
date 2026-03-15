import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'

interface Toast {
  id: string
  text: string
  tone: 'neutral' | 'warn' | 'good'
}

export function SystemToasts() {
  const phase = useGameStore((s) => s.phase)
  const incomingCalls = useGameStore((s) => s.incomingCalls)
  const latestSignal = useGameStore((s) => s.latestSignal)
  const bombOutcome = useGameStore((s) => s.bombOutcome)
  const activeMinigameId = useGameStore((s) => s.activeMinigameId)

  const [toasts, setToasts] = useState<Toast[]>([])

  const phaseLabel = useMemo(() => {
    if (phase === GamePhase.CALL_PHASE) return 'FASE DE LLAMADA'
    if (phase === GamePhase.DECISION_PHASE) return 'FASE DE DECISION'
    if (phase === GamePhase.RESULT_PHASE) return 'ENTRANDO A RESULTADOS'
    return null
  }, [phase])

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
      text: incomingCalls.length === 1 ? 'LLAMADA ENTRANTE' : `${incomingCalls.length} LLAMADAS ENTRANTES`,
      tone: 'good',
    })
  }, [incomingCalls])

  useEffect(() => {
    if (!latestSignal) return
    pushToast({
      id: `signal-${latestSignal.playerId}-${latestSignal.emoji}-${Date.now()}`,
      text: activeMinigameId === 'adivina-linea'
        ? `SENAL ANONIMA ${latestSignal.emoji} ${latestSignal.label}`
        : `${latestSignal.playerName} / ${latestSignal.emoji} ${latestSignal.label}`,
      tone: 'neutral',
    })
  }, [activeMinigameId, latestSignal])

  useEffect(() => {
    if (!bombOutcome) return
    pushToast({
      id: `bomb-${bombOutcome.type}-${bombOutcome.playerId}`,
      text: bombOutcome.type === 'defused'
        ? `${bombOutcome.playerName} DESACTIVO LA BOMBA`
        : `LA BOMBA EXPLOTO EN ${bombOutcome.playerName}`,
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
              <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2 }}>SISTEMA</div>
              <div style={{ fontSize: 11, color: textColor, letterSpacing: 1.2, marginTop: 4 }}>{toast.text}</div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
