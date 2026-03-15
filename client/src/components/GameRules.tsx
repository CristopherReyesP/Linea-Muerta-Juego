import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

interface Props {
  onClose: () => void
}

interface RuleSection {
  title: string
  text?: string
  items?: string[]
}

const cooperarTraicionarRules: RuleSection[] = [
  {
    title: 'OBJETIVO',
    text: 'Sobrevive 10 rondas con el mayor saldo posible. Si tu saldo llega a 0, te conviertes en SOMBRA.',
  },
  {
    title: 'FASE DE LLAMADA (30s)',
    text: 'Habla con otros jugadores por voz. Negocia, miente o convence antes de decidir.',
  },
  {
    title: 'FASE DE DECISION (10s)',
    text: 'Elige en secreto: COOPERAR o TRAICIONAR.',
  },
  {
    title: 'RESULTADOS',
    items: [
      'Si la mayoria COOPERA: cooperadores +30, traidores +45',
      'Si la mayoria TRAICIONA: cooperadores -40, traidores -10',
    ],
  },
  {
    title: 'RACHAS',
    items: [
      'Cooperar 2 veces seguidas: +15 de bonus',
      'Traicionar 2 veces seguidas: -25 de penalizacion',
      'La racha se rompe si cambias de decision',
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

const votacionSobraRules: RuleSection[] = [
  {
    title: 'OBJETIVO',
    text: 'Vota por el jugador que crees que domina demasiado. El mas votado pierde 1 punto global.',
  },
  {
    title: 'FASE DE LLAMADA (20s)',
    text: 'Habla con otros jugadores para discutir quien esta dominando la sesion.',
  },
  {
    title: 'FASE DE VOTACION (15s)',
    text: 'Vota en secreto por el jugador que crees que sobra. No puedes votarte a ti mismo.',
  },
  {
    title: 'RESULTADO',
    items: [
      'El jugador mas votado pierde 1 punto del scoreboard global',
      'En caso de empate, todos los empatados pierden el punto',
    ],
  },
]

const votacionMereceRules: RuleSection[] = [
  {
    title: 'OBJETIVO',
    text: 'Vota por el jugador que mas merece seguir adelante. El mas votado gana 1 punto global.',
  },
  {
    title: 'FASE DE LLAMADA (20s)',
    text: 'Habla con otros jugadores para discutir quien merece ser reconocido.',
  },
  {
    title: 'FASE DE VOTACION (15s)',
    text: 'Vota en secreto por el jugador que mas merece. No puedes votarte a ti mismo.',
  },
  {
    title: 'RESULTADO',
    items: [
      'El jugador mas votado gana 1 punto del scoreboard global',
      'En caso de empate, todos los empatados ganan el punto',
    ],
  },
]

const adivinaLineaRules: RuleSection[] = [
  {
    title: 'OBJETIVO',
    text: 'Descubre quien esta detras de cada linea telefonica. Gana quien adivine mas identidades.',
  },
  {
    title: 'IDENTIDADES OCULTAS',
    text: 'Los nombres de los jugadores estan ocultos. Solo veras numeros de linea (Linea 1, Linea 2, etc.).',
  },
  {
    title: 'VOCES DISTORSIONADAS',
    text: 'Las voces se escuchan distorsionadas para dificultar el reconocimiento. Presta atencion a las pistas en la conversacion.',
  },
  {
    title: 'FASE DE LLAMADA (5 min)',
    text: 'Llama a las diferentes lineas para intentar descubrir quien es cada jugador. Puedes ir llenando tus sospechas mientras hablas.',
  },
  {
    title: 'FASE DE ADIVINANZA (30s)',
    text: 'Asigna un nombre a cada linea. Cada nombre solo puede usarse una vez.',
  },
  {
    title: 'RESULTADO',
    items: [
      'Cada adivinanza correcta suma 1 punto',
      'El jugador o jugadores con mas aciertos ganan +1 punto global',
    ],
  },
]

const laBombaRules: RuleSection[] = [
  {
    title: 'OBJETIVO',
    text: 'Evita que la bomba explote. Solo el jugador que la porta puede decidir entre desactivarla o pasarla.',
  },
  {
    title: 'TEMPORIZADORES',
    text: 'Hay dos relojes: la partida completa dura 5 minutos y cada portador tiene su propio timer de decision.',
  },
  {
    title: 'TIMER DE BOMBA (50s)',
    text: 'Cada portador tiene 50 segundos para decidir. Si se pasa la bomba, ese timer se reinicia para el nuevo portador.',
  },
  {
    title: 'PROBABILIDAD DE DESACTIVACION',
    items: [
      'Inicia en 15%',
      'Cada pase suma +10% acumulativo',
      'A mayor cantidad de pases, mayor probabilidad',
    ],
  },
  {
    title: 'ACCIONES',
    items: [
      'DESACTIVAR: intenta desactivar con la probabilidad actual',
      'PASAR BOMBA: entrega la bomba a otra cabina para subir la probabilidad',
      'Solo el portador actual puede ejecutar estas acciones',
    ],
  },
  {
    title: 'RESULTADO',
    items: [
      'Si alguien desactiva: ese jugador gana +2 puntos globales',
      'Si explota: el portador pierde -2 puntos globales',
    ],
  },
]

const centralEmergenciasRules: RuleSection[] = [
  {
    title: 'OBJETIVO',
    text: 'Los Operadores deben identificar el mensaje correcto usando reportes de 2 Tecnicos y 1 Saboteador.',
  },
  {
    title: 'FORMATO DEL MENSAJE',
    items: [
      'El mensaje siempre tiene 3 campos: EMERGENCIA, UBICACION, ACCESO',
      'No existe campo LUGAR en esta version',
    ],
  },
  {
    title: 'ROLES',
    items: [
      'OPERADOR(ES): reciben reportes y eligen la emergencia correcta entre 4 opciones (mayoria)',
      '2 TECNICOS: cada uno recibe 1 campo con opcion REAL y FALSA; deben empujar la REAL',
      '1 SABOTEADOR: recibe 1 campo con opcion REAL y FALSA, pero debe colar la FALSA',
    ],
  },
  {
    title: 'FASE 1: ASIGNACION (10s)',
    text: 'Se asignan roles al azar. Cada no-operador recibe una pista parcial con dos valores: uno real y uno falso.',
  },
  {
    title: 'FASE 2: PREPARACION (10s)',
    text: 'Todos revisan su dupla REAL/FALSA. El Saboteador prepara su estrategia para defender la falsa.',
  },
  {
    title: 'FASE 3: TRANSMISION (90s)',
    items: [
      'Cada emisor (2 tecnicos + 1 saboteador) puede llamarse para discutir',
      'Todos comparan sus opciones reales/falsas para detectar inconsistencias',
      'Cada emisor envia un reporte de max 3 palabras al Operador',
      'Los Operadores no pueden llamar ni recibir llamadas durante esta fase',
      'Total de combinaciones de reporte: 8 (2^3)',
    ],
  },
  {
    title: 'FASE 4: RESPUESTA DE OPERADORES (60s)',
    text: 'Cada Operador elige la emergencia correcta entre 4 opciones. La mayoria decide el resultado.',
  },
  {
    title: 'PUNTUACION',
    items: [
      'Mayoria de operadores acierta: Operadores y Tecnicos leales +1 pt, Saboteador 0 pts',
      'Mayoria falla: Saboteador +1 pt, todos los demas 0 pts',
    ],
  },
]

const emojiDiferenteRules: RuleSection[] = [
  {
    title: 'OBJETIVO',
    text: 'Todos reciben el mismo emoji en su pantalla, excepto uno que recibe uno diferente. Nadie sabe si es el diferente. Descubrelo hablando.',
  },
  {
    title: 'FASE DE REVELACION (8s)',
    text: 'Ves tu emoji grande en pantalla. Memorizalo bien. No puedes llamar a nadie todavia.',
  },
  {
    title: 'FASE DE DISCUSION (45s)',
    text: 'Llama a otros jugadores y describe tu emoji para deducir quien tiene uno diferente. Cuidado: tu podrias ser el diferente sin saberlo.',
  },
  {
    title: 'FASE DE VOTACION (20s)',
    text: 'Vota por quien crees que tiene el emoji diferente. No puedes votarte a ti mismo.',
  },
  {
    title: 'RESULTADO',
    items: [
      'Si la mayoria vota correctamente al diferente: todos ganan +1 pt excepto el diferente',
      'Si la mayoria falla: el diferente gana +1 pt, los demas 0',
    ],
  },
]

const rulesMap: Record<string, { title: string; rules: RuleSection[]; tagline: string }> = {
  'cooperar-traicionar': {
    title: 'COOPERAR O TRAICIONAR',
    rules: cooperarTraicionarRules,
    tagline: '"Tu saldo es tu vida. Confia en la linea."',
  },
  'votacion-sobra': {
    title: 'QUIEN SOBRA?',
    rules: votacionSobraRules,
    tagline: '"El que mas brilla, mas sombra proyecta."',
  },
  'votacion-merece': {
    title: 'QUIEN MERECE?',
    rules: votacionMereceRules,
    tagline: '"El reconocimiento es un arma de doble filo."',
  },
  'adivina-linea': {
    title: 'ADIVINA LA LINEA',
    rules: adivinaLineaRules,
    tagline: '"Las voces mienten, pero las palabras revelan."',
  },
  'la-bomba': {
    title: 'LA BOMBA',
    rules: laBombaRules,
    tagline: '"Cada segundo pesa. Cada pase decide."',
  },
  'central-emergencias': {
    title: 'CENTRAL DE EMERGENCIAS',
    rules: centralEmergenciasRules,
    tagline: '"La informacion es fragmentada. La verdad, tambien."',
  },
  'emoji-diferente': {
    title: 'EMOJI DIFERENTE',
    rules: emojiDiferenteRules,
    tagline: '"Las apariencias engannan. Solo uno es distinto."',
  },
}

const defaultRulesData = {
  title: 'REGLAS DEL PROTOCOLO',
  rules: cooperarTraicionarRules,
  tagline: '"Tu saldo es tu vida. Confia en la linea."',
}

export function GameRules({ onClose }: Props) {
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const currentMinigameInfo = useGameStore(s => s.currentMinigameInfo)
  const minigameId = activeMinigameId ?? currentMinigameInfo?.id ?? ''
  const rulesData = rulesMap[minigameId] ?? defaultRulesData

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
          {rulesData.title}
        </div>

        {rulesData.rules.map((rule, i) => (
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
            {rulesData.tagline}
          </div>
          <button className="btn btn-green" onClick={onClose}>
            ENTENDIDO
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
