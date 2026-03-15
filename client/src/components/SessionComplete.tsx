import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { useI18n } from '../i18n'

function PlayerDataWithAvatar({ name, avatarId, avatarColor, accessoryId, isShadow }: { name: string; avatarId: string; avatarColor: string; accessoryId: string; isShadow?: boolean }) {
  const player = { name, avatarId, avatarColor, accessoryId, isShadow: isShadow ?? false } as any
  return <PlayerAvatar player={player} size={28} showName={false} showState={false} />
}

export function SessionComplete() {
  const { tr, trMinigameName } = useI18n()
  const sessionComplete = useGameStore(s => s.sessionComplete)
  const playerId = useGameStore(s => s.playerId)

  if (!sessionComplete) return null

  const isWinner = sessionComplete.overallWinnerId === playerId

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
        {tr('SESION FINALIZADA')}
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
        {isWinner ? tr('VICTORIA GLOBAL') : tr('DERROTA')}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          fontSize: 14,
          color: 'var(--cyan)',
        }}
      >
        {tr('Ganador')}: {sessionComplete.overallWinnerName}
      </motion.div>

      {/* Global scoreboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%',
          maxWidth: 340,
        }}
      >
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 3,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          {tr('CLASIFICACION FINAL')}
        </div>

        {sessionComplete.globalScoreboard.map((p, i) => (
          <motion.div
            key={p.playerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.15 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 16px',
              border: `1px solid ${i === 0 ? 'var(--green-neon)' : p.playerId === playerId ? 'var(--cyan)' : '#222'}`,
              background: i === 0 ? 'rgba(0,255,65,0.05)' : 'var(--bg-panel)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlayerDataWithAvatar name={p.name} avatarId={p.avatarId} avatarColor={p.avatarColor} accessoryId={p.accessoryId} />
              <span style={{
                fontSize: 13,
                color: 'var(--white)',
              }}>
                {p.name}
              </span>
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: 'var(--green-neon)',
            }}>
              {p.globalScore}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Minigame history */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%',
          maxWidth: 340,
        }}
      >
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 3,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          {tr('HISTORIAL DE MINIJUEGOS')}
        </div>

        {sessionComplete.history.map((result, i) => {
          const isSobra = result.minigameId === 'votacion-sobra'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 + i * 0.1 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 16px',
                border: '1px solid #222',
                background: 'var(--bg-panel)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--gray-text)' }}>
                  #{i + 1}
                </span>
                <span style={{ fontSize: 11, color: 'var(--cyan)' }}>
                  {trMinigameName(result.minigameId, result.minigameName)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 11,
                  color: isSobra ? 'var(--red-danger)' : 'var(--green-neon)',
                }}>
                  {result.winnerName}
                </span>
                <span style={{
                  fontSize: 9,
                  color: isSobra ? 'var(--red-danger)' : 'var(--green-dim)',
                }}>
                  {isSobra ? '-1' : '+1'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="btn btn-green"
        onClick={() => window.location.reload()}
        style={{ marginTop: 16 }}
      >
        {tr('NUEVA SESION')}
      </motion.button>
    </div>
  )
}
