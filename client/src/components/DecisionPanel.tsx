import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Decision, GamePhase } from '../types'

interface Props {
  onSubmitDecision: (decision: Decision) => void
}

export function DecisionPanel({ onSubmitDecision }: Props) {
  const phase = useGameStore(s => s.phase)
  const myDecision = useGameStore(s => s.myDecision)
  const myPlayer = useGameStore(s => s.getMyPlayer())

  if (phase !== GamePhase.DECISION_PHASE) return null
  if (!myPlayer?.isAlive) return null

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
        border: '1px solid var(--red-danger)',
        background: 'rgba(255, 23, 68, 0.05)',
      }}
    >
      <div style={{
        fontSize: 14,
        color: 'var(--red-danger)',
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}>
        VOTA: ELIGE TU ACCION
      </div>

      {!myDecision ? (
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            className="btn btn-green"
            onClick={() => onSubmitDecision(Decision.COOPERATE)}
            style={{
              fontSize: 16,
              padding: '16px 32px',
            }}
          >
            COOPERAR
          </button>
          <button
            className="btn btn-red"
            onClick={() => onSubmitDecision(Decision.BETRAY)}
            style={{
              fontSize: 16,
              padding: '16px 32px',
            }}
          >
            TRAICIONAR
          </button>
        </div>
      ) : (
        <div style={{
          fontSize: 14,
          color: myDecision === Decision.COOPERATE ? 'var(--green-neon)' : 'var(--red-danger)',
          letterSpacing: 2,
        }}>
          DECISION: {myDecision === Decision.COOPERATE ? 'COOPERAR' : 'TRAICIONAR'}
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
