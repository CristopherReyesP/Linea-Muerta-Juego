import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export function BalanceDisplay() {
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const lastResult = useGameStore(s => s.lastResult)
  const playerId = useGameStore(s => s.playerId)
  const [displayBalance, setDisplayBalance] = useState(myPlayer?.balance ?? 100)
  const [balanceChange, setBalanceChange] = useState<number | null>(null)
  const prevBalance = useRef(myPlayer?.balance ?? 100)

  useEffect(() => {
    const target = myPlayer?.balance ?? 0
    if (target !== prevBalance.current) {
      const diff = target - prevBalance.current
      setBalanceChange(diff)

      // Animate counting
      const steps = 20
      const increment = diff / steps
      let current = prevBalance.current
      let step = 0

      const timer = setInterval(() => {
        step++
        current += increment
        setDisplayBalance(Math.round(current))
        if (step >= steps) {
          clearInterval(timer)
          setDisplayBalance(target)
          setTimeout(() => setBalanceChange(null), 1500)
        }
      }, 50)

      prevBalance.current = target
      return () => clearInterval(timer)
    }
  }, [myPlayer?.balance])

  const change = playerId && lastResult?.balanceChanges[playerId]

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{
        fontSize: 10,
        color: 'var(--gray-text)',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        SALDO:
      </span>
      <span style={{
        fontSize: 36,
        fontWeight: 'bold',
        color: displayBalance <= 20 ? 'var(--red-danger)' : 'var(--green-neon)',
      }}
      className={displayBalance <= 20 ? 'pulse' : ''}
      >
        {displayBalance}
      </span>

      <AnimatePresence>
        {balanceChange !== null && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              position: 'absolute',
              right: -40,
              top: 0,
              fontSize: 18,
              fontWeight: 'bold',
              color: balanceChange > 0 ? 'var(--green-neon)' : 'var(--red-danger)',
            }}
          >
            {balanceChange > 0 ? '+' : ''}{balanceChange}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
