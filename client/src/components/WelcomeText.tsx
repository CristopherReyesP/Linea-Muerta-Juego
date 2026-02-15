import { motion } from 'framer-motion'

const lines = [
  'Bienvenido al Protocolo.',
  'Tu saldo es tu vida.',
  'Confia en la linea.',
]

export function WelcomeText() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      marginBottom: 32,
    }}>
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.8, duration: 0.6 }}
          style={{
            fontSize: 14,
            color: 'var(--green-dim)',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
          className="flicker"
        >
          {line}
        </motion.div>
      ))}
    </div>
  )
}
