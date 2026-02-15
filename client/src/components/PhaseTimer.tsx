import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'

export function PhaseTimer() {
  const phaseEndTime = useGameStore(s => s.phaseEndTime)
  const phase = useGameStore(s => s.phase)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((phaseEndTime - Date.now()) / 1000))
      setRemaining(diff)
    }, 100)

    return () => clearInterval(interval)
  }, [phaseEndTime])

  if (phase === GamePhase.LOBBY || phase === GamePhase.GAME_OVER) return null

  const isUrgent = remaining <= 5

  return (
    <div style={{
      fontSize: 28,
      fontWeight: 'bold',
      color: isUrgent ? 'var(--red-danger)' : 'var(--green-neon)',
      textAlign: 'center',
      letterSpacing: 4,
    }}
    className={isUrgent ? 'pulse' : ''}
    >
      {remaining}s
    </div>
  )
}
