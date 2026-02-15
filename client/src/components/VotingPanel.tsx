import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { GamePhase, PlayerState } from '../types'
import { PlayerAvatar } from './PlayerAvatar'

interface Props {
  onVotePlayer: (targetId: string) => void
}

export function VotingPanel({ onVotePlayer }: Props) {
  const phase = useGameStore(s => s.phase)
  const myVote = useGameStore(s => s.myVote)
  const voteResult = useGameStore(s => s.voteResult)
  const players = useGameStore(s => s.players)
  const playerId = useGameStore(s => s.playerId)
  const currentMinigameInfo = useGameStore(s => s.currentMinigameInfo)

  // During result phase, show vote result
  if (phase === GamePhase.RESULT_PHASE && voteResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: 32,
          border: '1px solid var(--cyan)',
          background: 'var(--bg-panel)',
        }}
      >
        <div style={{
          fontSize: 14,
          color: 'var(--cyan)',
          letterSpacing: 3,
        }}>
          RESULTADO DE VOTACION
        </div>

        <div style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'var(--white)',
        }}>
          {voteResult.targetName}
        </div>

        <div style={{
          fontSize: 12,
          color: 'var(--gray-text)',
        }}>
          {voteResult.voteCount} voto{voteResult.voteCount !== 1 ? 's' : ''}
        </div>

        <div style={{
          fontSize: 13,
          color: voteResult.effect.includes('+') ? 'var(--green-neon)' : 'var(--red-danger)',
          letterSpacing: 1,
        }}>
          {voteResult.effect}
        </div>
      </motion.div>
    )
  }

  // During decision/voting phase
  if (phase !== GamePhase.DECISION_PHASE) return null

  const otherPlayers = players.filter(p =>
    p.id !== playerId &&
    p.state !== PlayerState.DISCONNECTED
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        border: '1px solid var(--cyan)',
        background: 'rgba(0, 229, 255, 0.05)',
      }}
    >
      <div style={{
        fontSize: 14,
        color: 'var(--cyan)',
        letterSpacing: 3,
      }}>
        {currentMinigameInfo?.name?.toUpperCase() ?? 'VOTACION'}
      </div>

      <div style={{
        fontSize: 11,
        color: 'var(--gray-text)',
        textAlign: 'center',
        maxWidth: 300,
        lineHeight: 1.6,
      }}>
        {currentMinigameInfo?.shortDescription ?? 'Vota por un jugador'}
      </div>

      {!myVote ? (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
        }}>
          {otherPlayers.map(p => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onVotePlayer(p.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 16,
                border: '1px solid var(--green-dim)',
                background: 'var(--bg-panel)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px rgba(0,229,255,0.2)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--green-dim)'
              }}
            >
              <PlayerAvatar player={p} size={50} showState={false} />
              <span style={{
                fontSize: 10,
                color: 'var(--cyan)',
                letterSpacing: 2,
              }}>
                VOTAR
              </span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div style={{
          fontSize: 14,
          color: 'var(--cyan)',
          letterSpacing: 2,
        }}>
          VOTO ENVIADO
          <div style={{
            fontSize: 10,
            color: 'var(--gray-text)',
            marginTop: 8,
          }}>
            Esperando a los demas...
          </div>
        </div>
      )}
    </motion.div>
  )
}
