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
