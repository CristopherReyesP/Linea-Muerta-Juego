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
        boxShadow: isUrgent ? '0 0 28px rgba(255,23,68,0.18)' : '0 0 24px rgba(0,229,255,0.1)',
      }}
      className={isUrgent ? 'pulse-red' : ''}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--red-danger)', letterSpacing: 4 }}>
            ALERTA CRITICA
          </div>
          <div style={{ fontSize: 24, color: 'var(--white)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {isHolder ? 'La decision esta en tus manos' : `${bombState.holderName} sostiene la bomba`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-text)', lineHeight: 1.6 }}>
            {isHolder
              ? 'Puedes jugartela ahora o condenar a otra cabina con un pase.'
              : 'Cada segundo que pasa acerca la explosion o una transferencia inesperada.'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: 2 }}>
            TEMPORIZADOR DE BOMBA
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: 2 }}>
            LLAMADAS ACTIVAS: {activeCalls.length}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <BombIllustration urgent={isUrgent} />
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
            ? 'Cada accion cambia tus probabilidades. Una falla explota de inmediato.'
            : `Esperando decision de ${bombState.holderName}. Nadie sabe si arriesgara o pasara.`}
        </div>
      </div>
    </div>
  )
}

function BombIllustration({ urgent }: { urgent: boolean }) {
  return (
    <div
      style={{
        width: 122,
        height: 102,
        border: `1px solid ${urgent ? 'rgba(255,23,68,0.75)' : 'rgba(0,229,255,0.55)'}`,
        background: urgent ? 'rgba(255,23,68,0.08)' : 'rgba(0,229,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="96" height="78" viewBox="0 0 96 78" role="img" aria-label="Bomba">
        <defs>
          <radialGradient id="bombBody" cx="38%" cy="35%" r="68%">
            <stop offset="0%" stopColor="#48576d" />
            <stop offset="55%" stopColor="#263244" />
            <stop offset="100%" stopColor="#131c2a" />
          </radialGradient>
        </defs>
        <path d="M63 15 L73 6" stroke="#9eaac0" strokeWidth="3" strokeLinecap="round" />
        <rect x="71" y="3" width="9" height="6" rx="1.5" fill="#8895ad" />
        <path d="M58 15 C65 10 70 11 74 14 C78 17 80 22 79 26" stroke="#c8d4ea" strokeWidth="2.2" fill="none" />
        <path d="M79 26 C83 22 87 22 91 25" stroke="#ffd36e" strokeWidth="2.4" fill="none" />
        <circle cx="48" cy="45" r="30" fill="url(#bombBody)" stroke={urgent ? '#ff6d86' : '#6ce8ff'} strokeWidth="2.4" />
        <circle cx="38" cy="35" r="6.5" fill="rgba(255,255,255,0.14)" />
        <circle cx="48" cy="45" r="10" fill="#0f1520" stroke={urgent ? '#ff7e94' : '#7beeff'} strokeWidth="1.6" />
        <text x="48" y="49" textAnchor="middle" style={{ fontSize: 12, fontWeight: 'bold', fill: urgent ? '#ff9bae' : '#a0f4ff' }}>
          !
        </text>
        <circle cx="92" cy="24" r="3.8" fill={urgent ? '#ff3d5e' : '#ffd36e'} className={urgent ? 'pulse-red' : 'pulse'} />
      </svg>
    </div>
  )
}
