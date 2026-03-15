import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { Decision, GamePhase } from '../types'

export function ResultPanel() {
  const phase = useGameStore(s => s.phase)
  const lastResult = useGameStore(s => s.lastResult)
  const playerId = useGameStore(s => s.playerId)
  const players = useGameStore(s => s.players)
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const [revealStep, setRevealStep] = useState(0)

  if (phase !== GamePhase.RESULT_PHASE || !lastResult || !playerId) return null
  if (activeMinigameId !== 'cooperar-traicionar') return null

  const myDecision = lastResult.decisions[playerId]
  const myChange = lastResult.balanceChanges[playerId] ?? 0
  const myRachaResult = lastResult.rachaResults?.[playerId]
  const rachaAmount = myRachaResult?.amount ?? 0
  const totalChange = myChange + rachaAmount
  const isPositive = totalChange > 0
  const matchedMajority = myDecision === lastResult.majorityDecision
  const revealCopy = matchedMajority
    ? 'Tu decision camino con la multitud.'
    : 'Quedaste del lado equivocado de la mayoria.'
  const impactCopy = isPositive
    ? 'La ronda jugo a tu favor.'
    : 'La ronda te dejo expuesto.'

  useEffect(() => {
    setRevealStep(0)
    const first = window.setTimeout(() => setRevealStep(1), 250)
    const second = window.setTimeout(() => setRevealStep(2), 900)
    const third = window.setTimeout(() => setRevealStep(3), 1450)
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(second)
      window.clearTimeout(third)
    }
  }, [lastResult?.round, playerId])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          padding: 28,
          border: `1px solid ${isPositive ? 'var(--green-neon)' : 'var(--red-danger)'}`,
          background: isPositive
            ? 'linear-gradient(180deg, rgba(0,255,65,0.08), rgba(0,255,65,0.03))'
            : 'linear-gradient(180deg, rgba(255,23,68,0.08), rgba(255,23,68,0.03))',
          boxShadow: isPositive
            ? '0 0 30px rgba(0,255,65,0.14)'
            : '0 0 30px rgba(255,23,68,0.16)',
          maxWidth: 620,
        }}
      >
        <div style={{
          fontSize: 11,
          color: 'var(--gray-text)',
          letterSpacing: 4,
        }}>
          REVELACION RONDA {lastResult.round}
        </div>

        {revealStep >= 1 && (
          <div style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: matchedMajority ? 'var(--white)' : 'var(--red-danger)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {revealCopy}
          </div>
        )}

        {revealStep >= 1 && (
          <div style={{
            fontSize: 12,
            color: 'var(--gray-text)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            {impactCopy}
          </div>
        )}

        {revealStep >= 2 && (
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-text)', marginBottom: 4 }}>
              TU DECISION
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
        )}

        {revealStep >= 3 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          style={{
            fontSize: 42,
            fontWeight: 'bold',
            color: isPositive ? 'var(--green-neon)' : 'var(--red-danger)',
            textShadow: isPositive ? '0 0 16px rgba(0,255,65,0.24)' : '0 0 16px rgba(255,23,68,0.24)',
          }}
        >
          {isPositive ? '+' : ''}{totalChange}
        </motion.div>
        )}

        {/* Desglose de cambios */}
        {revealStep >= 3 && (
        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--gray-text)' }}>
          <span>Ronda: {myChange > 0 ? '+' : ''}{myChange}</span>
          {rachaAmount !== 0 && (
            <span style={{ color: rachaAmount > 0 ? 'var(--green-neon)' : 'var(--red-danger)' }}>
              Racha: {rachaAmount > 0 ? '+' : ''}{rachaAmount}
            </span>
          )}
        </div>
        )}

        {/* Racha bonus/penalizacion */}
        {revealStep >= 3 && myRachaResult && myRachaResult.type && (
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
        {revealStep >= 2 && (
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 2,
        }}>
          ASI JUGO CADA CABINA
        </div>
        )}
        {revealStep >= 2 && (
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
        )}
      </motion.div>
    </AnimatePresence>
  )
}
