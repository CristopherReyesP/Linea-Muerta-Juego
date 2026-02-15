import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export function GameOver() {
  const gameOver = useGameStore(s => s.gameOver)
  const playerId = useGameStore(s => s.playerId)

  if (!gameOver) return null

  const isWinner = gameOver.winnerId === playerId

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 24,
      padding: 32,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        style={{
          fontSize: 12,
          color: 'var(--gray-text)',
          letterSpacing: 4,
        }}
      >
        PROTOCOLO FINALIZADO
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: 10,
          color: 'var(--gray-shadow)',
          letterSpacing: 2,
        }}
      >
        {gameOver.reason}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: isWinner ? 'var(--green-neon)' : 'var(--red-danger)',
          letterSpacing: 4,
          textShadow: isWinner
            ? '0 0 30px rgba(0,255,65,0.5)'
            : '0 0 30px rgba(255,23,68,0.5)',
        }}
      >
        {isWinner ? 'VICTORIA' : 'DERROTA'}
      </motion.div>

      {/* Standings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%',
          maxWidth: 320,
        }}
      >
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 3,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          CLASIFICACION FINAL
        </div>

        {gameOver.standings.map((p, i) => {
          const isMe = gameOver.standings[i]?.name === gameOver.winnerName && i === 0
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.15 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 16px',
                border: `1px solid ${i === 0 ? 'var(--green-neon)' : p.isShadow ? 'var(--gray-shadow)' : '#222'}`,
                background: i === 0 ? 'rgba(0,255,65,0.05)' : 'var(--bg-panel)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: i === 0 ? 'var(--green-neon)' : 'var(--gray-text)',
                  width: 24,
                }}>
                  #{i + 1}
                </span>
                <span style={{
                  fontSize: 13,
                  color: p.isShadow ? 'var(--gray-shadow)' : 'var(--white)',
                }}
                className={p.isShadow ? 'glitch-text' : ''}
                >
                  {p.name}
                </span>
                {p.isShadow && (
                  <span style={{ fontSize: 9, color: 'var(--gray-shadow)', letterSpacing: 1 }}>
                    SOMBRA
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: p.balance > 0 ? 'var(--green-neon)' : 'var(--red-danger)',
              }}>
                {p.balance}
              </span>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="btn btn-green"
        onClick={() => window.location.reload()}
        style={{ marginTop: 16 }}
      >
        NUEVA PARTIDA
      </motion.button>
    </div>
  )
}
