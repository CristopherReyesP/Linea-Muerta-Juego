import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export function MinigameHeader() {
  const currentMinigameIndex = useGameStore(s => s.currentMinigameIndex)
  const totalMinigames = useGameStore(s => s.totalMinigames)
  const currentMinigameInfo = useGameStore(s => s.currentMinigameInfo)
  const globalScoreboard = useGameStore(s => s.globalScoreboard)
  const playerId = useGameStore(s => s.playerId)

  const myScore = globalScoreboard.find(p => p.playerId === playerId)?.globalScore ?? 0

  if (!currentMinigameInfo) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        padding: '8px 16px',
        background: 'rgba(0, 229, 255, 0.05)',
        borderBottom: '1px solid var(--cyan)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          fontSize: 10,
          color: 'var(--cyan)',
          letterSpacing: 2,
          padding: '2px 8px',
          border: '1px solid var(--cyan)',
        }}>
          {currentMinigameIndex + 1}/{totalMinigames}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--white)',
          letterSpacing: 1,
        }}>
          {currentMinigameInfo.name}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 1 }}>
          SCORE GLOBAL
        </span>
        <span style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: 'var(--green-neon)',
        }}>
          {myScore}
        </span>
      </div>
    </motion.div>
  )
}
