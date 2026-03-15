import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { useI18n } from '../i18n'

function PlayerDataWithAvatar({ name, avatarId, avatarColor, accessoryId, isShadow }: { name: string; avatarId: string; avatarColor: string; accessoryId: string; isShadow?: boolean }) {
  const player = { name, avatarId, avatarColor, accessoryId, isShadow: isShadow ?? false } as any
  return <PlayerAvatar player={player} size={28} showName={false} showState={false} />
}

export function GameOver() {
  const { tr } = useI18n()
  const gameOver = useGameStore(s => s.gameOver)
  const playerId = useGameStore(s => s.playerId)
  const activeMinigameId = useGameStore(s => s.activeMinigameId)

  if (!gameOver) return null

  const isVotacionSobra = activeMinigameId === 'votacion-sobra'
  const isBombMinigame = activeMinigameId === 'la-bomba'
  const isWinner = isVotacionSobra
    ? gameOver.winnerId !== playerId // In "Quien Sobra?" the "winner" is actually the loser
    : gameOver.winnerId === playerId

  const scoreEffectText = isVotacionSobra
    ? '-1 PUNTO GLOBAL'
    : isBombMinigame
      ? (gameOver.winnerId ? '+2 PUNTOS GLOBAL' : '-2 PUNTOS GLOBAL')
      : '+1 PUNTO GLOBAL'

  const announcementLabel = isVotacionSobra
    ? 'MAS VOTADO'
    : isBombMinigame
      ? (gameOver.winnerId ? 'DESACTIVADOR' : 'RESULTADO')
      : 'GANADOR DE LA RONDA'

  const announcementName = isBombMinigame && !gameOver.winnerId
    ? 'LA BOMBA EXPLOTO'
    : gameOver.winnerName

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
        {tr('PROTOCOLO FINALIZADO')}
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
        {tr(gameOver.reason)}
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
        {isWinner ? tr('VICTORIA') : tr('DERROTA')}
      </motion.div>

      {/* Winner/loser announcement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: 'spring' }}
        style={{
          padding: '12px 24px',
          border: `1px solid ${isVotacionSobra ? 'var(--red-danger)' : isBombMinigame && !gameOver.winnerId ? 'var(--red-danger)' : 'var(--green-neon)'}`,
          background: isVotacionSobra || (isBombMinigame && !gameOver.winnerId) ? 'rgba(255,23,68,0.08)' : 'rgba(0,255,65,0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{
          fontSize: 11,
          color: 'var(--gray-text)',
          letterSpacing: 2,
          marginBottom: 4,
        }}>
          {announcementLabel}
        </div>
        <div style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: isVotacionSobra || (isBombMinigame && !gameOver.winnerId) ? 'var(--red-danger)' : 'var(--green-neon)',
          textShadow: isVotacionSobra || (isBombMinigame && !gameOver.winnerId)
            ? '0 0 15px rgba(255,23,68,0.4)'
            : '0 0 15px rgba(0,255,65,0.4)',
        }}>
          {announcementName}
        </div>
        <div style={{
          fontSize: 11,
          color: isVotacionSobra || (isBombMinigame && !gameOver.winnerId) ? 'var(--red-danger)' : 'var(--cyan)',
          marginTop: 4,
          letterSpacing: 1,
        }}>
          {scoreEffectText}
        </div>
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
          {tr('CLASIFICACION FINAL')}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: i === 0 ? 'var(--green-neon)' : 'var(--gray-text)',
                  width: 24,
                }}>
                  #{i + 1}
                </span>
                <PlayerDataWithAvatar name={p.name} avatarId={p.avatarId} avatarColor={p.avatarColor} accessoryId={p.accessoryId} isShadow={p.isShadow} />
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
                    {tr('SOMBRA')}
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
        {tr('NUEVA PARTIDA')}
      </motion.button>
    </div>
  )
}
