import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

interface Props {
  onVoteEmoji: (targetId: string) => void
}

export function EmojiPanel({ onVoteEmoji }: Props) {
  const emojiState = useGameStore(s => s.emojiState)
  const players = useGameStore(s => s.players)
  const myPlayerId = useGameStore(s => s.playerId)

  const [voted, setVoted] = useState(false)

  if (!emojiState) return null

  const { internalPhase, myEmoji } = emojiState

  // --- REVEAL PHASE ---
  if (internalPhase === 'REVEAL') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: 32,
          maxWidth: 400,
        }}
      >
        <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 3 }}>TU EMOJI</div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          style={{
            fontSize: 120,
            lineHeight: 1,
            textAlign: 'center',
            filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.3))',
          }}
        >
          {myEmoji}
        </motion.div>

        <div style={{ fontSize: 12, color: 'var(--gray-text)', textAlign: 'center', lineHeight: 1.6 }}>
          Memoriza tu emoji. Pronto deberas descubrir quien tiene uno diferente.
        </div>
      </motion.div>
    )
  }

  // --- DISCUSSION PHASE ---
  if (internalPhase === 'DISCUSSION') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 24,
          maxWidth: 400,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          border: '1px solid var(--cyan)',
          background: 'rgba(0,229,255,0.05)',
        }}>
          <span style={{ fontSize: 48 }}>{myEmoji}</span>
          <div>
            <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2 }}>TU EMOJI</div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center' }}>
          Llama a otros jugadores para descubrir quien tiene el emoji diferente.
        </div>
      </motion.div>
    )
  }

  // --- VOTING PHASE ---
  if (internalPhase === 'VOTING') {
    const otherPlayers = players.filter(p => p.id !== myPlayerId)

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 24,
          maxWidth: 420,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          border: '1px solid var(--cyan)',
          background: 'rgba(0,229,255,0.05)',
        }}>
          <span style={{ fontSize: 32 }}>{myEmoji}</span>
        </div>

        <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 3 }}>
          QUIEN TIENE EL DIFERENTE?
        </div>

        <div style={{ fontSize: 11, color: 'var(--cyan)' }}>
          Votos: {emojiState.voteCount} / {emojiState.totalVoters}
        </div>

        {!voted ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {otherPlayers.map(p => (
              <button
                key={p.id}
                className="btn"
                onClick={() => {
                  onVoteEmoji(p.id)
                  setVoted(true)
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: 12,
                  textAlign: 'left',
                  border: '1px solid var(--gray-shadow)',
                  background: 'rgba(0,229,255,0.03)',
                  color: 'var(--white)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--green-dim)', letterSpacing: 1 }}>
            Voto enviado. Esperando a los demas...
          </div>
        )}
      </motion.div>
    )
  }

  // --- RESULT PHASE ---
  if (internalPhase === 'RESULT') {
    const playerNames: Record<string, string> = {}
    for (const p of players) {
      playerNames[p.id] = p.name
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 24,
          maxWidth: 420,
        }}
      >
        <div style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: emojiState.success ? 'var(--green-neon)' : 'var(--red-danger)',
          letterSpacing: 2,
        }}>
          {emojiState.success ? 'DIFERENTE DESCUBIERTO' : 'ENGANO EXITOSO'}
        </div>

        {/* Show both emojis side by side */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64 }}>{emojiState.baseEmoji}</div>
            <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2, marginTop: 4 }}>BASE</div>
          </div>
          <div style={{ fontSize: 20, color: 'var(--gray-text)' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64 }}>{emojiState.differentEmoji}</div>
            <div style={{ fontSize: 9, color: 'var(--red-danger)', letterSpacing: 2, marginTop: 4 }}>DIFERENTE</div>
          </div>
        </div>

        <div style={{
          padding: '8px 16px',
          border: '1px solid var(--red-danger)',
          background: 'rgba(255,0,0,0.05)',
          fontSize: 12,
          color: 'var(--white)',
        }}>
          El diferente era: <strong style={{ color: 'var(--red-danger)' }}>{emojiState.differentPlayerName}</strong>
        </div>

        {/* Show votes */}
        {emojiState.votes && (
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2, marginBottom: 4 }}>VOTOS</div>
            {Object.entries(emojiState.votes).map(([voterId, targetId]) => {
              const correct = targetId === emojiState.differentPlayerId
              return (
                <div key={voterId} style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  color: 'var(--white)',
                  borderLeft: `2px solid ${correct ? 'var(--green-dim)' : 'var(--red-dim)'}`,
                  marginBottom: 4,
                }}>
                  <span style={{ color: 'var(--gray-text)' }}>{playerNames[voterId] ?? '???'}:</span>{' '}
                  {playerNames[targetId] ?? '???'}
                  {correct && <span style={{ color: 'var(--green-dim)', marginLeft: 6 }}>✓</span>}
                </div>
              )
            })}
          </div>
        )}

        <div style={{
          fontSize: 12,
          color: emojiState.success ? 'var(--green-neon)' : 'var(--red-danger)',
        }}>
          {emojiState.success
            ? 'Todos ganan +1 punto excepto el diferente'
            : `${emojiState.differentPlayerName} gana +1 punto`
          }
        </div>
      </motion.div>
    )
  }

  return null
}
