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
  const activeMinigameId = useGameStore(s => s.activeMinigameId)

  // During result phase, show vote result
  if (phase === GamePhase.RESULT_PHASE && voteResult) {
    const isRewardVote = activeMinigameId === 'votacion-merece'
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
          border: `1px solid ${isRewardVote ? 'var(--green-neon)' : 'var(--red-danger)'}`,
          background: isRewardVote ? 'rgba(0,255,65,0.06)' : 'rgba(255,23,68,0.06)',
          boxShadow: isRewardVote ? '0 0 24px rgba(0,255,65,0.12)' : '0 0 24px rgba(255,23,68,0.14)',
          maxWidth: 520,
        }}
      >
        <div style={{
          fontSize: 11,
          color: isRewardVote ? 'var(--green-neon)' : 'var(--red-danger)',
          letterSpacing: 4,
        }}>
          VEREDICTO
        </div>

        <div style={{
          fontSize: 26,
          fontWeight: 'bold',
          color: 'var(--white)',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}>
          {voteResult.targetName}
        </div>

        <div style={{
          fontSize: 12,
          color: 'var(--gray-text)',
          textAlign: 'center',
          maxWidth: 380,
          lineHeight: 1.6,
        }}>
          {isRewardVote
            ? 'La sala decidio a quien elevar.'
            : 'La sala ya decidio quien quedo bajo sospecha.'}
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
          textAlign: 'center',
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
  const isRewardVote = activeMinigameId === 'votacion-merece'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: 28,
        border: `1px solid ${isRewardVote ? 'var(--green-neon)' : 'var(--red-danger)'}`,
        background: isRewardVote ? 'rgba(0,255,65,0.05)' : 'rgba(255,23,68,0.05)',
        boxShadow: isRewardVote ? '0 0 24px rgba(0,255,65,0.1)' : '0 0 24px rgba(255,23,68,0.12)',
        maxWidth: 600,
      }}
    >
      <div style={{
        fontSize: 11,
        color: isRewardVote ? 'var(--green-neon)' : 'var(--red-danger)',
        letterSpacing: 4,
      }}>
        {currentMinigameInfo?.name?.toUpperCase() ?? 'VOTACION'}
      </div>

      <div style={{
        fontSize: 22,
        color: 'var(--white)',
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
        maxWidth: 460,
      }}>
        {isRewardVote ? 'Solo un nombre deberia salir fortalecido' : 'Solo un nombre cargara con la sospecha'}
      </div>

      <div style={{
        fontSize: 11,
        color: 'var(--gray-text)',
        textAlign: 'center',
        maxWidth: 360,
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
          color: isRewardVote ? 'var(--green-neon)' : 'var(--red-danger)',
          letterSpacing: 2,
          textAlign: 'center',
        }}>
          TU VOTO YA FUE CONTADO
          <div style={{
            fontSize: 10,
            color: 'var(--gray-text)',
            marginTop: 8,
          }}>
            Esperando a los demas para revelar el veredicto...
          </div>
        </div>
      )}
    </motion.div>
  )
}
