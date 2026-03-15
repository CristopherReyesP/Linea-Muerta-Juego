import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { Decision, GamePhase } from '../types'

type LogTone = 'neutral' | 'good' | 'warn'

interface LogEntry {
  id: number
  text: string
  tone: LogTone
}

export function AutoLogPanel() {
  const gameId = useGameStore((s) => s.gameId)
  const activeMinigameId = useGameStore((s) => s.activeMinigameId)
  const currentMinigameIndex = useGameStore((s) => s.currentMinigameIndex)
  const phase = useGameStore((s) => s.phase)
  const activeCalls = useGameStore((s) => s.activeCalls)
  const voteResult = useGameStore((s) => s.voteResult)
  const lastResult = useGameStore((s) => s.lastResult)
  const bombLastPass = useGameStore((s) => s.bombLastPass)
  const bombLastDefuseResult = useGameStore((s) => s.bombLastDefuseResult)
  const bombOutcome = useGameStore((s) => s.bombOutcome)
  const lineGuessResults = useGameStore((s) => s.lineGuessResults)
  const emergencyState = useGameStore((s) => s.emergencyState)
  const emojiState = useGameStore((s) => s.emojiState)
  const latestSignal = useGameStore((s) => s.latestSignal)

  const storageKey = useMemo(() => {
    if (!gameId || !activeMinigameId) return null
    return `lm_autolog:${gameId}:${currentMinigameIndex}:${activeMinigameId}`
  }, [activeMinigameId, currentMinigameIndex, gameId])

  const [collapsed, setCollapsed] = useState(true)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const phaseRef = useRef<GamePhase | null>(null)
  const callsCountRef = useRef<number>(0)
  const voteSignatureRef = useRef<string | null>(null)
  const resultSignatureRef = useRef<string | null>(null)
  const bombPassSignatureRef = useRef<string | null>(null)
  const bombDefuseSignatureRef = useRef<string | null>(null)
  const bombOutcomeSignatureRef = useRef<string | null>(null)
  const lineSignatureRef = useRef<string | null>(null)
  const emergencyReportCountRef = useRef<number>(0)
  const emojiSignatureRef = useRef<string | null>(null)
  const signalSignatureRef = useRef<string | null>(null)

  const appendEntry = (text: string, tone: LogTone = 'neutral') => {
    setEntries((current) => {
      const next = [...current, { id: Date.now() + Math.random(), text, tone }]
      return next.slice(-10)
    })
  }

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      setEntries([])
      return
    }

    const saved = window.sessionStorage.getItem(storageKey)
    setEntries(saved ? JSON.parse(saved) as LogEntry[] : [])
    phaseRef.current = null
    callsCountRef.current = 0
    voteSignatureRef.current = null
    resultSignatureRef.current = null
    bombPassSignatureRef.current = null
    bombDefuseSignatureRef.current = null
    bombOutcomeSignatureRef.current = null
    lineSignatureRef.current = null
    emergencyReportCountRef.current = 0
    emojiSignatureRef.current = null
    signalSignatureRef.current = null
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    window.sessionStorage.setItem(storageKey, JSON.stringify(entries))
  }, [entries, storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.dispatchEvent(new CustomEvent('lm-autolog-visibility', {
      detail: { expanded: !collapsed },
    }))

    return () => {
      window.dispatchEvent(new CustomEvent('lm-autolog-visibility', {
        detail: { expanded: false },
      }))
    }
  }, [collapsed])

  useEffect(() => {
    if (!storageKey) return
    if (phaseRef.current === phase) return
    phaseRef.current = phase

    const phaseLabels: Record<string, string> = {
      [GamePhase.CALL_PHASE]: 'Inicio de fase de llamada.',
      [GamePhase.DECISION_PHASE]: 'Inicio de fase de decision.',
      [GamePhase.RESULT_PHASE]: 'Entrando a resultados.',
      [GamePhase.GAME_OVER]: 'Minijuego finalizado.',
    }

    const text = phaseLabels[phase]
    if (text) appendEntry(text, phase === GamePhase.RESULT_PHASE ? 'warn' : 'neutral')
  }, [phase, storageKey])

  useEffect(() => {
    if (!storageKey) return
    const nextCount = activeCalls.length
    if (callsCountRef.current === nextCount) return

    if (nextCount > callsCountRef.current && nextCount > 0) {
      appendEntry(nextCount === 1 ? 'Hay una llamada activa.' : `Hay ${nextCount} llamadas activas.`, 'neutral')
    }

    callsCountRef.current = nextCount
  }, [activeCalls.length, storageKey])

  useEffect(() => {
    if (!voteResult) return
    const signature = `${voteResult.targetName}|${voteResult.voteCount}|${voteResult.effect}`
    if (voteSignatureRef.current === signature) return
    voteSignatureRef.current = signature
    appendEntry(`Votacion resuelta: ${voteResult.targetName}. ${voteResult.effect}`, voteResult.effect.includes('+') ? 'good' : 'warn')
  }, [voteResult])

  useEffect(() => {
    if (!lastResult) return
    const signature = `${lastResult.round}|${lastResult.majorityDecision}`
    if (resultSignatureRef.current === signature) return
    resultSignatureRef.current = signature
    appendEntry(
      `Ronda ${lastResult.round}: la mayoria fue ${lastResult.majorityDecision === Decision.COOPERATE ? 'COOPERAR' : 'TRAICIONAR'}.`,
      lastResult.majorityDecision === Decision.COOPERATE ? 'good' : 'warn'
    )
  }, [lastResult])

  useEffect(() => {
    if (!bombLastPass) return
    const signature = `${bombLastPass.fromId}|${bombLastPass.toId}`
    if (bombPassSignatureRef.current === signature) return
    bombPassSignatureRef.current = signature
    appendEntry(`La bomba paso de ${bombLastPass.fromName} a ${bombLastPass.toName}.`, 'warn')
  }, [bombLastPass])

  useEffect(() => {
    if (!bombLastDefuseResult) return
    const signature = `${bombLastDefuseResult.playerId}|${bombLastDefuseResult.success}|${bombLastDefuseResult.chance}`
    if (bombDefuseSignatureRef.current === signature) return
    bombDefuseSignatureRef.current = signature
    appendEntry(
      `${bombLastDefuseResult.playerName} intento desactivar (${bombLastDefuseResult.chance}%). ${bombLastDefuseResult.success ? 'Exito.' : 'Fallo.'}`,
      bombLastDefuseResult.success ? 'good' : 'warn'
    )
  }, [bombLastDefuseResult])

  useEffect(() => {
    if (!bombOutcome) return
    const signature = `${bombOutcome.type}|${bombOutcome.playerId}|${bombOutcome.chance ?? ''}`
    if (bombOutcomeSignatureRef.current === signature) return
    bombOutcomeSignatureRef.current = signature
    appendEntry(
      bombOutcome.type === 'defused'
        ? `${bombOutcome.playerName} desactivo la bomba.`
        : `La bomba exploto en ${bombOutcome.playerName}.`,
      bombOutcome.type === 'defused' ? 'good' : 'warn'
    )
  }, [bombOutcome])

  useEffect(() => {
    if (!lineGuessResults) return
    const signature = `${lineGuessResults.winnerId}|${lineGuessResults.winnerName}`
    if (lineSignatureRef.current === signature) return
    lineSignatureRef.current = signature
    appendEntry(`Identidades reveladas. Ganador: ${lineGuessResults.winnerName}.`, 'good')
  }, [lineGuessResults])

  useEffect(() => {
    if (!emergencyState) return
    const nextCount = emergencyState.reports.length
    if (nextCount > emergencyReportCountRef.current) {
      const latest = emergencyState.reports[nextCount - 1]
      if (latest) {
        appendEntry(`Nuevo reporte de ${latest.playerName}: "${latest.text}".`, 'neutral')
      }
    }
    emergencyReportCountRef.current = nextCount
  }, [emergencyState])

  useEffect(() => {
    if (!emojiState || emojiState.internalPhase !== 'RESULT') return
    const signature = `${emojiState.differentPlayerId}|${emojiState.success}`
    if (emojiSignatureRef.current === signature) return
    emojiSignatureRef.current = signature
    appendEntry(
      emojiState.success
        ? `El diferente fue descubierto: ${emojiState.differentPlayerName}.`
        : `${emojiState.differentPlayerName} logro pasar desapercibido.`,
      emojiState.success ? 'good' : 'warn'
    )
  }, [emojiState])

  useEffect(() => {
    if (!latestSignal) return
    const signature = `${latestSignal.playerId}|${latestSignal.emoji}|${latestSignal.label}`
    if (signalSignatureRef.current === signature) return
    signalSignatureRef.current = signature
    appendEntry(
      activeMinigameId === 'adivina-linea'
        ? `senal global anonima / ${latestSignal.emoji} ${latestSignal.label}`
        : `senal global: ${latestSignal.playerName} / ${latestSignal.emoji} ${latestSignal.label}`,
      'neutral'
    )
  }, [activeMinigameId, latestSignal])

  if (!storageKey) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        borderTop: '1px solid rgba(0,229,255,0.24)',
        background: 'linear-gradient(180deg, rgba(2,7,11,0.96), rgba(2,5,9,0.98))',
        boxShadow: '0 -16px 32px rgba(0,0,0,0.36)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '9px 16px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(0,229,255,0.14)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--green-neon)',
              boxShadow: '0 0 8px rgba(0,255,65,0.65)',
            }}
            className="pulse"
          />
          <div>
            <div style={{ fontSize: 10, color: 'var(--green-neon)', letterSpacing: 2.6 }}>
              CABIN.LOG / LIVE CONSOLE
            </div>
            <div style={{ fontSize: 9, color: 'var(--gray-text)', marginTop: 2 }}>
              Registro automatico de eventos de cabina
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 1.4 }}>
            {entries.length} linea{entries.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setCollapsed((value) => !value)}
            style={{
              border: '1px solid #23403a',
              background: 'rgba(0,255,65,0.04)',
              color: 'var(--green-neon)',
              fontSize: 10,
              padding: '5px 10px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1.4,
            }}
          >
            {collapsed ? 'ABRIR CONSOLA' : 'OCULTAR CONSOLA'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          style={{
            padding: '10px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 190,
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 1.2 }}>
            `monitor --session active --feed realtime`
          </div>
          {entries.length === 0 ? (
            <div style={{ fontSize: 10, color: 'var(--gray-text)', lineHeight: 1.5 }}>
              &gt; esperando eventos de cabina...
            </div>
          ) : (
            entries.map((entry, index) => {
              const toneColor =
                entry.tone === 'good'
                  ? 'var(--green-neon)'
                  : entry.tone === 'warn'
                    ? 'var(--red-danger)'
                    : 'var(--cyan)'

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '4px 6px',
                    background: index === entries.length - 1 ? 'rgba(0,255,65,0.04)' : 'rgba(255,255,255,0.015)',
                    borderLeft: `2px solid ${toneColor}`,
                    fontSize: 10,
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>
                    [{String(index + 1).padStart(2, '0')}]
                  </span>
                  <span style={{ color: toneColor }}>&gt;</span>
                  <span style={{ color: 'var(--white)' }}>{entry.text}</span>
                </div>
              )
            })
          )}
          <div style={{ fontSize: 9, color: 'var(--green-neon)', opacity: 0.8 }}>
            &gt; feed_status: listening...
          </div>
        </div>
      )}
    </div>
  )
}
