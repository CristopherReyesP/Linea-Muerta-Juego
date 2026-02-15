import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function BombSpectatorPanel() {
  const bombState = useGameStore((s) => s.bombState)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!bombState) return

    const sync = () => {
      const remaining = Math.max(0, Math.ceil((bombState.endTime - Date.now()) / 1000))
      setRemainingSeconds(remaining)
    }

    sync()
    const interval = setInterval(sync, 100)
    return () => clearInterval(interval)
  }, [bombState])

  if (!bombState) return null

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 560,
        border: '1px solid var(--cyan)',
        background: 'rgba(0, 229, 255, 0.04)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2 }}>
        ESTADO DE BOMBA (OBSERVADOR)
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 4px' }}>
        <svg width="84" height="66" viewBox="0 0 96 78" role="img" aria-label="Bomba">
          <defs>
            <radialGradient id="bombBodyMini" cx="38%" cy="35%" r="68%">
              <stop offset="0%" stopColor="#48576d" />
              <stop offset="55%" stopColor="#263244" />
              <stop offset="100%" stopColor="#131c2a" />
            </radialGradient>
          </defs>
          <path d="M63 15 L73 6" stroke="#9eaac0" strokeWidth="3" strokeLinecap="round" />
          <rect x="71" y="3" width="9" height="6" rx="1.5" fill="#8895ad" />
          <path d="M58 15 C65 10 70 11 74 14 C78 17 80 22 79 26" stroke="#c8d4ea" strokeWidth="2.2" fill="none" />
          <path d="M79 26 C83 22 87 22 91 25" stroke="#ffd36e" strokeWidth="2.4" fill="none" />
          <circle cx="48" cy="45" r="30" fill="url(#bombBodyMini)" stroke="#6ce8ff" strokeWidth="2.4" />
          <circle cx="38" cy="35" r="6.5" fill="rgba(255,255,255,0.14)" />
          <circle cx="48" cy="45" r="10" fill="#0f1520" stroke="#7beeff" strokeWidth="1.6" />
          <text x="48" y="49" textAnchor="middle" style={{ fontSize: 12, fontWeight: 'bold', fill: '#a0f4ff' }}>
            !
          </text>
          <circle cx="92" cy="24" r="3.8" fill="#ffd36e" className="pulse" />
        </svg>
      </div>
      <div style={{ fontSize: 14, color: 'var(--red-danger)', fontWeight: 'bold' }}>
        Portador actual: {bombState.holderName}
      </div>
      <div style={{ fontSize: 12, color: 'var(--cyan)' }}>
        Tiempo del portador: {remainingSeconds}s
      </div>
      <div style={{ fontSize: 12, color: 'var(--white)' }}>
        Probabilidad actual: {bombState.disarmChance}% ({bombState.passCount} pases)
      </div>
      <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>
        Espera la siguiente transferencia.
      </div>
    </div>
  )
}
