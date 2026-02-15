import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerState } from '../types'

interface Props {
  onPassBomb: (targetId: string) => void
  onAttemptDefuse: () => void
}

export function BombPanel({ onPassBomb, onAttemptDefuse }: Props) {
  const bombState = useGameStore((s) => s.bombState)
  const bombLastPass = useGameStore((s) => s.bombLastPass)
  const bombLastDefuseResult = useGameStore((s) => s.bombLastDefuseResult)
  const players = useGameStore((s) => s.players)
  const myPlayer = useGameStore((s) => s.getMyPlayer())
  const activeCalls = useGameStore((s) => s.activeCalls)

  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!bombState) return
    const syncRemaining = () => {
      const remaining = Math.max(0, Math.ceil((bombState.endTime - Date.now()) / 1000))
      setRemainingSeconds(remaining)
    }

    syncRemaining()
    const interval = setInterval(() => {
      syncRemaining()
    }, 100)

    return () => clearInterval(interval)
  }, [bombState])

  useEffect(() => {
    if (!selectedTargetId) return
    const exists = players.some((p) => p.id === selectedTargetId && p.state !== PlayerState.DISCONNECTED)
    if (!exists) setSelectedTargetId('')
  }, [players, selectedTargetId])

  const isHolder = bombState?.holderId === myPlayer?.id
  const isUrgent = remainingSeconds <= 10

  const passTargets = useMemo(() => {
    if (!bombState) return []
    return players.filter(
      (player) => player.id !== bombState.holderId && player.state !== PlayerState.DISCONNECTED
    )
  }, [bombState, players])

  if (!bombState) return null

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 880,
        border: `1px solid ${isUrgent ? 'var(--red-danger)' : 'var(--cyan)'}`,
        background: isUrgent ? 'rgba(255, 23, 68, 0.08)' : 'rgba(0, 229, 255, 0.04)',
        padding: 20,
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 18,
      }}
      className={isUrgent ? 'pulse-red' : ''}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: 2 }}>
            TEMPORIZADOR DE BOMBA
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: 2 }}>
            LLAMADAS ACTIVAS: {activeCalls.length}
          </div>
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            letterSpacing: 5,
            color: isUrgent ? 'var(--red-danger)' : 'var(--green-neon)',
            textShadow: isUrgent ? '0 0 20px rgba(255,23,68,0.5)' : '0 0 20px rgba(0,255,65,0.3)',
          }}
          className={isUrgent ? 'flicker' : ''}
        >
          {remainingSeconds}s
        </div>

        <motion.div
          key={bombState.holderId}
          initial={{ scale: 0.92, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            border: '1px solid var(--red-danger)',
            background: 'rgba(255,23,68,0.1)',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: 2 }}>TIENE LA BOMBA</span>
          <span style={{ fontSize: 14, color: 'var(--red-danger)', fontWeight: 'bold' }}>{bombState.holderName}</span>
        </motion.div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: 2 }}>
            PROB. DESACTIVACION
          </span>
          <span style={{ fontSize: 24, color: 'var(--cyan)', fontWeight: 'bold' }}>
            {bombState.disarmChance}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--gray-text)' }}>
            ({bombState.passCount} pases)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2 }}>
            HISTORIAL DE PASES
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {bombState.passHistory.map((name, index) => (
              <span
                key={`${name}-${index}`}
                style={{
                  border: '1px solid #333',
                  background: 'var(--bg-panel)',
                  color: 'var(--white)',
                  padding: '4px 8px',
                  fontSize: 10,
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {bombLastPass && (
          <div style={{ fontSize: 11, color: 'var(--cyan)' }}>
            Pase reciente: {bombLastPass.fromName} {'->'} {bombLastPass.toName}
          </div>
        )}

        {bombLastDefuseResult && (
          <div style={{ fontSize: 11, color: bombLastDefuseResult.success ? 'var(--green-neon)' : 'var(--red-danger)' }}>
            {bombLastDefuseResult.playerName} intento desactivar ({bombLastDefuseResult.chance}%):{' '}
            {bombLastDefuseResult.success ? 'EXITO' : 'FALLO'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: 2 }}>
          ACCIONES
        </div>

        <button
          className="btn btn-red"
          onClick={onAttemptDefuse}
          disabled={!isHolder}
        >
          DESACTIVAR
        </button>

        <select
          value={selectedTargetId}
          onChange={(event) => setSelectedTargetId(event.target.value)}
          disabled={!isHolder}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--white)',
            border: '1px solid #333',
            padding: 10,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <option value="">Seleccionar destino</option>
          {passTargets.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>

        <button
          className="btn btn-cyan"
          onClick={() => {
            if (!selectedTargetId) return
            onPassBomb(selectedTargetId)
            setSelectedTargetId('')
          }}
          disabled={!isHolder || !selectedTargetId}
        >
          PASAR BOMBA
        </button>

        <div style={{ fontSize: 11, color: 'var(--gray-text)', lineHeight: 1.5 }}>
          {isHolder
            ? 'Tu decides: desactivar ahora o pasar para subir la probabilidad.'
            : `Esperando decision de ${bombState.holderName}.`}
        </div>
      </div>
    </div>
  )
}
