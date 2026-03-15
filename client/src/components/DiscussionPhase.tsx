import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

interface Props {
  onContinue: (data?: { selectedMinigameIds?: string[] }) => void
}

const DEV_MODE_STORAGE_KEY = 'lm_dev_mode'
const isLocalMachine = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname)
const minigameOptions = [
  { id: 'cooperar-traicionar', name: 'Cooperar o Traicionar', minPlayers: 2 },
  { id: 'votacion-sobra', name: 'Quien Sobra?', minPlayers: 2 },
  { id: 'votacion-merece', name: 'Quien Merece?', minPlayers: 2 },
  { id: 'adivina-linea', name: 'Adivina la Linea', minPlayers: 2 },
  { id: 'la-bomba', name: 'La Bomba', minPlayers: 2 },
  { id: 'central-emergencias', name: 'Central de Emergencias', minPlayers: 4 },
  { id: 'emoji-diferente', name: 'Emoji Diferente', minPlayers: 3 },
]

export function DiscussionPhase({ onContinue }: Props) {
  const discussionData = useGameStore(s => s.discussionData)
  const globalScoreboard = useGameStore(s => s.globalScoreboard)
  const playerId = useGameStore(s => s.playerId)
  const hostId = useGameStore(s => s.hostId)
  const micMuted = useGameStore(s => s.micMuted)
  const toggleMic = useGameStore(s => s.toggleMic)

  const isHost = playerId === hostId
  const developerModeActive = isLocalMachine && window.sessionStorage.getItem(DEV_MODE_STORAGE_KEY) === '1'
  const [selectedNextMinigameId, setSelectedNextMinigameId] = useState<string | null>(null)
  const availableMinigames = minigameOptions.filter((minigame) => globalScoreboard.length >= minigame.minPlayers)
  const nextMinigameId = discussionData?.nextMinigame?.id ?? null

  useEffect(() => {
    setSelectedNextMinigameId((current) => {
      if (current && availableMinigames.some((minigame) => minigame.id === current)) {
        return current
      }

      return nextMinigameId ?? availableMinigames[0]?.id ?? null
    })
  }, [nextMinigameId, globalScoreboard.length])

  if (!discussionData) return null

  const { completedResult, nextMinigame, currentIndex, totalMinigames } = discussionData

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 24,
      padding: 32,
    }}>
      {/* Completed minigame result */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 3,
        }}>
          MINIJUEGO {currentIndex + 1}/{totalMinigames} COMPLETADO
        </div>
        <div style={{
          fontSize: 16,
          color: 'var(--cyan)',
          letterSpacing: 2,
        }}>
          {completedResult.minigameName}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--green-neon)',
        }}>
          Ganador: {completedResult.winnerName}
        </div>
      </motion.div>

      {/* Global scoreboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%',
          maxWidth: 340,
        }}
      >
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 3,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          SCOREBOARD GLOBAL
        </div>

        {globalScoreboard.map((p, i) => (
          <motion.div
            key={p.playerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 16px',
              border: `1px solid ${p.playerId === playerId ? 'var(--green-neon)' : '#222'}`,
              background: p.playerId === playerId ? 'rgba(0,255,65,0.05)' : 'var(--bg-panel)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: i === 0 ? 'var(--green-neon)' : 'var(--gray-text)',
                width: 24,
              }}>
                #{i + 1}
              </span>
              <span style={{
                fontSize: 13,
                color: 'var(--white)',
              }}>
                {p.name}
              </span>
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: p.globalScore < 0 ? 'var(--red-danger)' : 'var(--green-neon)',
            }}>
              {p.globalScore}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Open voice indicator + mic toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          border: '1px solid var(--green-dim)',
          background: 'rgba(0,255,65,0.05)',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--green-neon)',
            boxShadow: '0 0 8px var(--green-neon)',
          }}
          className="pulse"
          />
          <span style={{ fontSize: 11, color: 'var(--green-dim)', letterSpacing: 1 }}>
            VOZ ABIERTA - TODOS PUEDEN HABLAR
          </span>
        </div>

        <button
          onClick={toggleMic}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            border: `1px solid ${micMuted ? 'var(--red-danger)' : 'var(--green-dim)'}`,
            background: micMuted ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,65,0.05)',
            color: micMuted ? 'var(--red-danger)' : 'var(--green-dim)',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: 1,
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 16 }}>{micMuted ? '\u{1F507}' : '\u{1F3A4}'}</span>
          {micMuted ? 'MICROFONO APAGADO' : 'MICROFONO ENCENDIDO'}
        </button>
      </motion.div>

      {/* Next minigame preview */}
      {nextMinigame && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '12px 24px',
            border: '1px solid var(--gray-shadow)',
            background: 'var(--bg-panel)',
          }}
        >
          <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2 }}>
            SIGUIENTE MINIJUEGO
          </div>
          <div style={{ fontSize: 14, color: 'var(--cyan)', letterSpacing: 1 }}>
            {nextMinigame.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray-text)', textAlign: 'center', maxWidth: 280 }}>
            {nextMinigame.shortDescription}
          </div>
        </motion.div>
      )}

      {isHost && developerModeActive && nextMinigame && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.08 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '12px 24px',
            border: '1px solid var(--cyan)',
            background: 'rgba(0,229,255,0.05)',
            minWidth: 320,
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, textAlign: 'center' }}>
            MODO DESARROLLADOR LOCAL
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center', lineHeight: 1.5 }}>
            Antes de continuar puedes elegir manualmente el siguiente minijuego.
          </div>
          {availableMinigames.map((minigame) => (
            <label
              key={minigame.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: 'var(--white)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="next-dev-minigame"
                checked={selectedNextMinigameId === minigame.id}
                onChange={() => setSelectedNextMinigameId(minigame.id)}
              />
              {minigame.name}
            </label>
          ))}
        </motion.div>
      )}

      {/* Continue button (host only) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {isHost ? (
          <button
            className="btn btn-green"
            onClick={() => onContinue(
              developerModeActive && selectedNextMinigameId
                ? { selectedMinigameIds: [selectedNextMinigameId] }
                : undefined
            )}
            style={{ fontSize: 14 }}
          >
            CONTINUAR
          </button>
        ) : (
          <div style={{
            fontSize: 12,
            color: 'var(--green-dim)',
            letterSpacing: 2,
          }}
          className="pulse"
          >
            Esperando al anfitrion...
          </div>
        )}
      </motion.div>
    </div>
  )
}
