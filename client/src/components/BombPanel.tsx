import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerState } from '../types'
import { useI18n } from '../i18n'

interface Props {
  onPassBomb: (targetId: string) => void
  onAttemptDefuse: () => void
}

export function BombPanel({ onPassBomb, onAttemptDefuse }: Props) {
  const { language } = useI18n()
  const bombState = useGameStore((s) => s.bombState)
  const bombLastPass = useGameStore((s) => s.bombLastPass)
  const bombLastDefuseResult = useGameStore((s) => s.bombLastDefuseResult)
  const players = useGameStore((s) => s.players)
  const myPlayer = useGameStore((s) => s.getMyPlayer())
  const activeCalls = useGameStore((s) => s.activeCalls)

  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncViewport = () => setIsMobile(window.innerWidth <= 900)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const isHolder = bombState?.holderId === myPlayer?.id
  const isUrgent = remainingSeconds <= 10

  const passTargets = useMemo(() => {
    if (!bombState) return []
    return players.filter(
      (player) => player.id !== bombState.holderId && player.state !== PlayerState.DISCONNECTED
    )
  }, [bombState, players])

  if (!bombState) return null

  const sectionCardStyle = {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(8,14,22,0.9), rgba(5,9,15,0.82))',
    padding: isMobile ? '10px 12px' : '12px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
  }

  const sectionLabelStyle = {
    fontSize: isMobile ? 9 : 10,
    color: 'var(--gray-text)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 880,
        border: `1px solid ${isUrgent ? 'var(--red-danger)' : 'var(--cyan)'}`,
        background: isUrgent ? 'rgba(255, 23, 68, 0.08)' : 'rgba(0, 229, 255, 0.04)',
        padding: isMobile ? 14 : 20,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
        gap: isMobile ? 14 : 18,
        boxShadow: isUrgent ? '0 0 28px rgba(255,23,68,0.18)' : '0 0 24px rgba(0,229,255,0.1)',
      }}
      className={isUrgent ? 'pulse-red' : ''}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          ...sectionCardStyle,
          gap: 10,
          borderColor: isUrgent ? 'rgba(255,23,68,0.28)' : 'rgba(0,229,255,0.18)',
          background: isUrgent
            ? 'linear-gradient(180deg, rgba(42,8,14,0.92), rgba(18,7,10,0.84))'
            : 'linear-gradient(180deg, rgba(9,15,23,0.92), rgba(6,10,16,0.84))',
        }}>
          <div style={{ fontSize: isMobile ? 9 : 11, color: 'var(--red-danger)', letterSpacing: isMobile ? 2.6 : 4 }}>
            {language === 'en' ? 'CRITICAL ALERT' : 'ALERTA CRITICA'}
          </div>
          <div style={{ fontSize: isMobile ? 18 : 24, color: 'var(--white)', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.15 }}>
            {isHolder ? (language === 'en' ? 'The decision is in your hands' : 'La decision esta en tus manos') : `${bombState.holderName} ${language === 'en' ? 'holds the bomb' : 'sostiene la bomba'}`}
          </div>
          <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--gray-text)', lineHeight: 1.5 }}>
            {isHolder
              ? (language === 'en' ? 'You can risk it now or doom another cabin with a pass.' : 'Puedes jugartela ahora o condenar a otra cabina con un pase.')
              : (language === 'en' ? 'Every second brings the explosion or an unexpected transfer closer.' : 'Cada segundo que pasa acerca la explosion o una transferencia inesperada.')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <div style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={sectionLabelStyle}>{language === 'en' ? 'BOMB TIMER' : 'TEMPORIZADOR DE BOMBA'}</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 'bold', color: isUrgent ? 'var(--red-danger)' : 'var(--green-neon)' }}>
                {remainingSeconds}s
              </div>
            </div>
            <div style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={sectionLabelStyle}>{language === 'en' ? 'DEFUSE CHANCE' : 'PROB. DESACTIVACION'}</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 'bold', color: 'var(--cyan)' }}>
                {bombState.disarmChance}%
              </div>
            </div>
            <div style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={sectionLabelStyle}>{language === 'en' ? 'ACTIVE CALLS' : 'LLAMADAS ACTIVAS'}</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 'bold', color: 'var(--white)' }}>
                {activeCalls.length}
              </div>
            </div>
          </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: isMobile ? 12 : 18, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <BombIllustration urgent={isUrgent} compact={isMobile} />
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
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: isMobile ? 10 : 11, color: 'var(--gray-text)', letterSpacing: 2 }}>{language === 'en' ? 'HAS THE BOMB' : 'TIENE LA BOMBA'}</span>
          <span style={{ fontSize: isMobile ? 12 : 14, color: 'var(--red-danger)', fontWeight: 'bold' }}>{bombState.holderName}</span>
        </motion.div>

        <div style={sectionCardStyle}>
          <div style={{ ...sectionLabelStyle, marginBottom: 2 }}>
            {language === 'en' ? 'PASS HISTORY' : 'HISTORIAL DE PASES'}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--gray-text)' }}>
            {bombState.passCount} {language === 'en' ? 'passes registered' : 'pases registrados'}
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
                  fontSize: isMobile ? 9 : 10,
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {bombLastPass && (
          <div style={{ ...sectionCardStyle, color: 'var(--cyan)', lineHeight: 1.45 }}>
            <div style={sectionLabelStyle}>{language === 'en' ? 'Recent pass' : 'Pase reciente'}</div>
            <div style={{ fontSize: isMobile ? 11 : 12 }}>
              {bombLastPass.fromName} {'->'} {bombLastPass.toName}
            </div>
          </div>
        )}

        {bombLastDefuseResult && (
          <div style={{
            ...sectionCardStyle,
            borderColor: bombLastDefuseResult.success ? 'rgba(0,255,65,0.22)' : 'rgba(255,23,68,0.22)',
          }}>
            <div style={sectionLabelStyle}>{language === 'en' ? 'Latest defuse attempt' : 'Ultimo intento de desactivacion'}</div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: bombLastDefuseResult.success ? 'var(--green-neon)' : 'var(--red-danger)', lineHeight: 1.45 }}>
              {bombLastDefuseResult.playerName} {language === 'en' ? 'tried to defuse' : 'intento desactivar'} ({bombLastDefuseResult.chance}%):{' '}
              {bombLastDefuseResult.success ? (language === 'en' ? 'SUCCESS' : 'EXITO') : (language === 'en' ? 'FAIL' : 'FALLO')}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          ...sectionCardStyle,
          position: 'sticky',
          top: 0,
        }}>
        <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--gray-text)', letterSpacing: 2 }}>
          {language === 'en' ? 'ACTIONS' : 'ACCIONES'}
        </div>

          <button
            className="btn btn-red"
            onClick={onAttemptDefuse}
            disabled={!isHolder}
            style={{ width: '100%', padding: isMobile ? '10px 14px' : '12px 14px', fontSize: 12 }}
          >
            {language === 'en' ? 'DEFUSE' : 'DESACTIVAR'}
          </button>

          <select
            value={selectedTargetId}
            onChange={(event) => setSelectedTargetId(event.target.value)}
            disabled={!isHolder}
            style={{
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--white)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: isMobile ? 12 : 10,
              fontFamily: 'var(--font-mono)',
              fontSize: isMobile ? 12 : 14,
              width: '100%',
            }}
          >
            <option value="">{language === 'en' ? 'Select target' : 'Seleccionar destino'}</option>
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
            style={{ width: '100%', padding: isMobile ? '10px 14px' : '12px 14px', fontSize: 12 }}
          >
            {language === 'en' ? 'PASS BOMB' : 'PASAR BOMBA'}
          </button>

          <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--gray-text)', lineHeight: 1.5 }}>
            {isHolder
              ? (language === 'en' ? 'Each action changes your odds. One failure explodes immediately.' : 'Cada accion cambia tus probabilidades. Una falla explota de inmediato.')
              : (language === 'en' ? `Waiting for ${bombState.holderName}'s decision. No one knows if they will risk it or pass it.` : `Esperando decision de ${bombState.holderName}. Nadie sabe si arriesgara o pasara.`)}
          </div>
        </div>
      </div>
    </div>
  )
}

function BombIllustration({ urgent, compact = false }: { urgent: boolean; compact?: boolean }) {
  return (
    <div
      style={{
        width: compact ? 96 : 122,
        height: compact ? 80 : 102,
        border: `1px solid ${urgent ? 'rgba(255,23,68,0.75)' : 'rgba(0,229,255,0.55)'}`,
        background: urgent ? 'rgba(255,23,68,0.08)' : 'rgba(0,229,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={compact ? 76 : 96} height={compact ? 62 : 78} viewBox="0 0 96 78" role="img" aria-label="Bomba">
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
