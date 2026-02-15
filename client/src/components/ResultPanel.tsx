import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Decision, GamePhase } from '../types'

export function ResultPanel() {
  const phase = useGameStore(s => s.phase)
  const lastResult = useGameStore(s => s.lastResult)
  const playerId = useGameStore(s => s.playerId)
  const players = useGameStore(s => s.players)

  if (phase !== GamePhase.RESULT_PHASE || !lastResult || !playerId) return null

  const myDecision = lastResult.decisions[playerId]
  const myChange = lastResult.balanceChanges[playerId] ?? 0
  const myRachaResult = lastResult.rachaResults?.[playerId]
  const rachaAmount = myRachaResult?.amount ?? 0
  const totalChange = myChange + rachaAmount
  const isPositive = totalChange > 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: 24,
          border: `1px solid ${isPositive ? 'var(--green-neon)' : 'var(--red-danger)'}`,
          background: isPositive ? 'rgba(0,255,65,0.05)' : 'rgba(255,23,68,0.05)',
        }}
      >
        <div style={{
          fontSize: 12,
          color: 'var(--gray-text)',
          letterSpacing: 3,
        }}>
          RESULTADO RONDA {lastResult.round}
        </div>

        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-text)', marginBottom: 4 }}>
              TU VOTO
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: myDecision === Decision.COOPERATE ? 'var(--green-neon)' : 'var(--red-danger)',
            }}>
              {myDecision === Decision.COOPERATE ? 'COOPERAR' : 'TRAICIONAR'}
            </div>
          </div>

          <div style={{
            width: 1,
            height: 40,
            background: '#333',
          }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-text)', marginBottom: 4 }}>
              MAYORIA
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: lastResult.majorityDecision === Decision.COOPERATE ? 'var(--green-neon)' : 'var(--red-danger)',
            }}>
              {lastResult.majorityDecision === Decision.COOPERATE ? 'COOPERAR' : 'TRAICIONAR'}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: isPositive ? 'var(--green-neon)' : 'var(--red-danger)',
          }}
        >
          {isPositive ? '+' : ''}{totalChange}
        </motion.div>

        {/* Desglose de cambios */}
        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--gray-text)' }}>
          <span>Ronda: {myChange > 0 ? '+' : ''}{myChange}</span>
          {rachaAmount !== 0 && (
            <span style={{ color: rachaAmount > 0 ? 'var(--green-neon)' : 'var(--red-danger)' }}>
              Racha: {rachaAmount > 0 ? '+' : ''}{rachaAmount}
            </span>
          )}
        </div>

        {/* Racha bonus/penalizacion */}
        {myRachaResult && myRachaResult.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              padding: '8px 16px',
              border: `1px solid ${myRachaResult.type === 'bonus' ? 'var(--green-neon)' : 'var(--red-danger)'}`,
              background: myRachaResult.type === 'bonus' ? 'rgba(0,255,65,0.1)' : 'rgba(255,23,68,0.1)',
            }}
          >
            <div style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: myRachaResult.type === 'bonus' ? 'var(--green-neon)' : 'var(--red-danger)',
              textAlign: 'center',
            }}>
              {myRachaResult.message}
            </div>
          </motion.div>
        )}

        {/* Summary of all players */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          maxWidth: 300,
        }}>
          {Object.entries(lastResult.decisions).map(([pid, dec]) => {
            const player = players.find(p => p.id === pid)
            if (!player) return null
            const change = lastResult.balanceChanges[pid] ?? 0
            return (
              <div key={pid} style={{
                padding: '4px 8px',
                border: `1px solid ${dec === Decision.COOPERATE ? '#00ff4144' : '#ff174444'}`,
                fontSize: 9,
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}>
                <span style={{ color: 'var(--gray-text)' }}>{player.name}</span>
                <span style={{
                  color: dec === Decision.COOPERATE ? 'var(--green-neon)' : 'var(--red-danger)',
                  fontWeight: 'bold',
                }}>
                  {dec === Decision.COOPERATE ? 'C' : 'T'}
                </span>
                <span style={{
                  color: change > 0 ? 'var(--green-neon)' : 'var(--red-danger)',
                }}>
                  {change > 0 ? '+' : ''}{change}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
