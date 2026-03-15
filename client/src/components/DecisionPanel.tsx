import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Decision, GamePhase } from '../types'
import { useI18n } from '../i18n'

interface Props {
  onSubmitDecision: (decision: Decision) => void
}

export function DecisionPanel({ onSubmitDecision }: Props) {
  const { tr } = useI18n()
  const phase = useGameStore(s => s.phase)
  const myDecision = useGameStore(s => s.myDecision)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const players = useGameStore(s => s.players)
  const activeMinigameId = useGameStore(s => s.activeMinigameId)

  if (phase !== GamePhase.DECISION_PHASE) return null
  if (!myPlayer?.isAlive) return null
  if (activeMinigameId !== 'cooperar-traicionar') return null

  const pendingPlayers = players.filter((player) => player.isAlive && player.state !== 'LOCKED').length

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
        border: '1px solid var(--red-danger)',
        background: 'linear-gradient(180deg, rgba(255, 23, 68, 0.08), rgba(255, 23, 68, 0.03))',
        boxShadow: '0 0 28px rgba(255,23,68,0.16)',
        maxWidth: 540,
      }}
    >
      <div style={{
        fontSize: 11,
        color: 'var(--red-danger)',
        letterSpacing: 4,
        textTransform: 'uppercase',
      }}>
        {tr('DECISION FINAL')}
      </div>

      <div style={{
        fontSize: 22,
        color: 'var(--white)',
        fontWeight: 'bold',
        letterSpacing: 1,
        textAlign: 'center',
        textTransform: 'uppercase',
      }}>
        {tr('Nadie sabra lo que elegiste hasta que sea demasiado tarde')}
      </div>

      <div style={{
        fontSize: 12,
        color: 'var(--gray-text)',
        textAlign: 'center',
        maxWidth: 420,
        lineHeight: 1.6,
      }}>
        {tr('Una mayoria define el castigo. Tu decision define si sobrevives mejor que los demas.')}
      </div>

      {!myDecision ? (
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            className="btn btn-green"
            onClick={() => onSubmitDecision(Decision.COOPERATE)}
            style={{
              fontSize: 16,
              padding: '16px 32px',
              minWidth: 170,
            }}
          >
            {tr('COOPERAR')}
          </button>
          <button
            className="btn btn-red"
            onClick={() => onSubmitDecision(Decision.BETRAY)}
            style={{
              fontSize: 16,
              padding: '16px 32px',
              minWidth: 170,
            }}
          >
            {tr('TRAICIONAR')}
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            fontSize: 14,
            color: 'var(--gray-text)',
            letterSpacing: 2,
          }}>
            {tr('TU ELECCION QUEDO SELLADA')}
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: myDecision === Decision.COOPERATE ? 'var(--green-neon)' : 'var(--red-danger)',
            letterSpacing: 2,
          }}>
            {myDecision === Decision.COOPERATE ? tr('COOPERAR') : tr('TRAICIONAR')}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--gray-text)',
          }}>
            {tr('Esperando a los demas...')}
          </div>
        </div>
      )}

      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: 10,
        color: 'var(--gray-text)',
        letterSpacing: 1.2,
      }}>
        <span>{tr('Jugadores pendientes:')} {Math.max(0, pendingPlayers)}</span>
        <span>{tr('La mayoria decidira el impacto')}</span>
      </div>
    </motion.div>
  )
}
