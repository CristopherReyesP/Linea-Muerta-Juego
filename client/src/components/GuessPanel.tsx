import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'

interface Props {
  onSubmitGuesses: (guesses: Record<string, string>) => void
  onSkipToFinish?: () => void
}

export function GuessPanel({ onSubmitGuesses, onSkipToFinish }: Props) {
  const phase = useGameStore(s => s.phase)
  const lineAssignments = useGameStore(s => s.lineAssignments)
  const lineGuessResults = useGameStore(s => s.lineGuessResults)
  const myLineGuesses = useGameStore(s => s.myLineGuesses)
  const playerId = useGameStore(s => s.playerId)
  const hostId = useGameStore(s => s.hostId)
  const isHost = playerId === hostId

  // Local state for guesses before submitting
  const [guesses, setGuesses] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  // Restore previously submitted guesses when component mounts (e.g. after phase transition)
  useEffect(() => {
    if (myLineGuesses && Object.keys(guesses).length === 0) {
      setGuesses(myLineGuesses)
      setSubmitted(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Result phase - show results
  if (phase === GamePhase.RESULT_PHASE && lineGuessResults) {
    const myScore = playerId ? lineGuessResults.scores[playerId] ?? 0 : 0

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
          border: '1px solid var(--cyan)',
          background: 'rgba(0,229,255,0.05)',
          maxWidth: 460,
          boxShadow: '0 0 22px rgba(0,229,255,0.1)',
        }}
      >
        <div style={{
          fontSize: 11,
          color: 'var(--cyan)',
          letterSpacing: 4,
        }}>
          IDENTIDADES REVELADAS
        </div>

        <div style={{
          fontSize: 22,
          color: 'var(--white)',
          fontWeight: 'bold',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}>
          La voz ya no puede esconder a nadie
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          width: '100%',
        }}>
          {lineGuessResults.assignments
            .sort((a, b) => a.lineNumber - b.lineNumber)
            .map(a => (
            <div key={a.lineNumber} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 12px',
              border: '1px solid #222',
              background: 'rgba(0,229,255,0.03)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                Linea {a.lineNumber}
              </span>
              <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 'bold' }}>
                {a.playerName}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 16,
          color: myScore > 0 ? 'var(--green-neon)' : 'var(--gray-text)',
          fontWeight: 'bold',
        }}>
          Adivinaste {myScore} linea{myScore !== 1 ? 's' : ''}
        </div>

        <div style={{
          fontSize: 12,
          color: 'var(--green-neon)',
        }}>
          Ganador: {lineGuessResults.winnerName}
        </div>

        {isHost && onSkipToFinish && (
          <button
            className="btn btn-green"
            onClick={onSkipToFinish}
            style={{ fontSize: 12, marginTop: 8 }}
          >
            CONTINUAR
          </button>
        )}
      </motion.div>
    )
  }

  // Show during both CALL_PHASE and DECISION_PHASE
  if ((phase !== GamePhase.CALL_PHASE && phase !== GamePhase.DECISION_PHASE) || !lineAssignments) return null

  const { lines, playerNames, myLineNumber } = lineAssignments
  const isCallPhase = phase === GamePhase.CALL_PHASE

  // Lines to guess (exclude own)
  const linesToGuess = lines.filter(l => l.lineNumber !== myLineNumber)
  // Player names available for assignment (exclude self)
  const availableNames = playerNames.filter(p => p.playerId !== playerId)

  const allGuessed = linesToGuess.every(l => guesses[String(l.lineNumber)])
  const hasSubmitted = myLineGuesses !== null

  const handleGuess = (lineNumber: number, guessedPlayerId: string) => {
    setGuesses(prev => ({ ...prev, [String(lineNumber)]: guessedPlayerId }))
    // Reset submitted state so player can resubmit with changes
    if (submitted) setSubmitted(false)
  }

  const handleSubmit = () => {
    if (!allGuessed) return
    onSubmitGuesses(guesses)
    setSubmitted(true)
  }

  // During guessing phase (DECISION_PHASE), if already submitted and not editing, show confirmation
  if (!isCallPhase && hasSubmitted && submitted) {
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
          border: '1px solid var(--cyan)',
          background: 'rgba(0, 229, 255, 0.05)',
        }}
      >
        <div style={{ fontSize: 14, color: 'var(--cyan)', letterSpacing: 2 }}>
          RESPUESTAS ENVIADAS
        </div>
        <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>
          Esperando a los demas...
        </div>
      </motion.div>
    )
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
          padding: isCallPhase ? 16 : 24,
          border: '1px solid var(--cyan)',
          background: 'rgba(0, 229, 255, 0.05)',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 0 20px rgba(0,229,255,0.08)',
        }}
      >
      <div style={{
        fontSize: isCallPhase ? 11 : 14,
        color: 'var(--cyan)',
        letterSpacing: 3,
      }}>
        ADIVINA QUIEN ES CADA LINEA
      </div>

      <div style={{
        fontSize: 10,
        color: 'var(--gray-text)',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        Tu eres Linea {myLineNumber}. {isCallPhase ? 'Puedes ir adivinando mientras llamas.' : 'Asigna un nombre a cada linea.'}
      </div>

      <div style={{
        fontSize: 17,
        color: 'var(--white)',
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
      }}>
        {isCallPhase ? 'Cada llamada puede delatar una identidad' : 'Ya no hay mas voces: solo sospechas'}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
      }}>
        {linesToGuess
          .sort((a, b) => a.lineNumber - b.lineNumber)
          .map(line => {
          const currentGuess = guesses[String(line.lineNumber)]
          // Names already used in other guesses
          const usedPlayerIds = Object.entries(guesses)
            .filter(([ln]) => ln !== String(line.lineNumber))
            .map(([, pid]) => pid)

          return (
            <div key={line.lineNumber} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              border: `1px solid ${currentGuess ? 'var(--green-dim)' : '#333'}`,
              background: 'var(--bg-panel)',
            }}>
              <div style={{
                fontSize: 12,
                color: 'var(--cyan)',
                fontWeight: 'bold',
                minWidth: 60,
              }}>
                Linea {line.lineNumber}
              </div>

              <select
                value={currentGuess ?? ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleGuess(line.lineNumber, e.target.value)
                  } else {
                    // Clear this guess
                    setGuesses(prev => {
                      const next = { ...prev }
                      delete next[String(line.lineNumber)]
                      return next
                    })
                    if (submitted) setSubmitted(false)
                  }
                }}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '5px 8px',
                  background: 'var(--bg-primary)',
                  color: currentGuess ? 'var(--green-neon)' : 'var(--gray-text)',
                  border: `1px solid ${currentGuess ? 'var(--green-dim)' : '#333'}`,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  paddingRight: 24,
                }}
              >
                <option value="" style={{ color: 'var(--gray-text)' }}>-- Seleccionar --</option>
                {availableNames.map(p => {
                  const isUsed = usedPlayerIds.includes(p.playerId)
                  const isSelected = currentGuess === p.playerId
                  return (
                    <option
                      key={p.playerId}
                      value={p.playerId}
                      disabled={isUsed && !isSelected}
                      style={{
                        color: isUsed && !isSelected ? '#444' : 'var(--white)',
                        background: 'var(--bg-primary)',
                      }}
                    >
                      {p.name}{isUsed && !isSelected ? ' (ya asignado)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          )
        })}
      </div>

      <button
        className="btn btn-green"
        onClick={handleSubmit}
        disabled={!allGuessed}
        style={{
          fontSize: 12,
          opacity: allGuessed ? 1 : 0.4,
        }}
      >
        {submitted ? 'ACTUALIZAR RESPUESTAS' : 'ENVIAR RESPUESTAS'}
      </button>

      {submitted && isCallPhase && (
        <div style={{ fontSize: 9, color: 'var(--green-dim)' }}>
          Respuestas guardadas. Puedes cambiarlas antes del cierre final.
        </div>
      )}
    </motion.div>
  )
}
