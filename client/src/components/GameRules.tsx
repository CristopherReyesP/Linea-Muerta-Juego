import { motion } from 'framer-motion'

interface Props {
  onClose: () => void
}

const rules = [
  {
    title: 'OBJETIVO',
    text: 'Sobrevive 10 rondas con el mayor saldo posible. Si tu saldo llega a 0, te conviertes en SOMBRA.',
  },
  {
    title: 'FASE DE LLAMADA (60s)',
    text: 'Habla con otros jugadores por voz. Negocia, miente, convence. La informacion es poder.',
  },
  {
    title: 'FASE DE DECISION (10s)',
    text: 'Elige en secreto: COOPERAR o TRAICIONAR.',
  },
  {
    title: 'RESULTADOS',
    items: [
      'Si la mayoria COOPERA: cooperadores +30, traidores +50',
      'Si la mayoria TRAICIONA: cooperadores -40, traidores -10',
    ],
  },
  {
    title: 'SOMBRA',
    text: 'Si tu saldo llega a 0, pierdes el voto pero puedes seguir llamando y tienes 2 cargas de interferencia para distorsionar llamadas ajenas.',
  },
  {
    title: 'FIN DEL JUEGO',
    text: 'El juego termina cuando queda 1 jugador activo o se completan las 10 rondas. Gana quien tenga mayor saldo.',
  },
]

export function GameRules({ onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 500,
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 32,
          border: '1px solid var(--green-dim)',
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: 'var(--green-neon)',
          letterSpacing: 6,
          textAlign: 'center',
        }}>
          REGLAS DEL PROTOCOLO
        </div>

        {rules.map((rule, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{
              fontSize: 11,
              color: 'var(--cyan)',
              letterSpacing: 3,
              fontWeight: 'bold',
            }}>
              {rule.title}
            </div>
            {rule.text && (
              <div style={{
                fontSize: 12,
                color: 'var(--white)',
                lineHeight: 1.6,
              }}>
                {rule.text}
              </div>
            )}
            {rule.items && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rule.items.map((item, j) => (
                  <div key={j} style={{
                    fontSize: 11,
                    color: 'var(--white)',
                    paddingLeft: 12,
                    borderLeft: `2px solid ${item.includes('+') ? 'var(--green-dim)' : 'var(--red-dim)'}`,
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          marginTop: 8,
        }}>
          <div style={{
            fontSize: 11,
            color: 'var(--green-dim)',
            letterSpacing: 2,
            textAlign: 'center',
          }}>
            "Tu saldo es tu vida. Confia en la linea."
          </div>
          <button className="btn btn-green" onClick={onClose}>
            ENTENDIDO
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
