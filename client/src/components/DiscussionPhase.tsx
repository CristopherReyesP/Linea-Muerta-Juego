import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../i18n'

interface Props {
  onContinue: (data?: { selectedMinigameIds?: string[] }) => void
}

const DEV_MODE_STORAGE_KEY = 'lm_dev_mode'
const isLocalMachine = import.meta.env.DEV && typeof window !== 'undefined'
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
  const { tr, trMinigameDescription, trMinigameName } = useI18n()
  const discussionData = useGameStore(s => s.discussionData)
  const playerId = useGameStore(s => s.playerId)
  const hostId = useGameStore(s => s.hostId)
  const micMuted = useGameStore(s => s.micMuted)
  const toggleMic = useGameStore(s => s.toggleMic)

  if (!discussionData) return null

  const globalScoreboard = discussionData.globalScoreboard
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
      background: `
        radial-gradient(circle at top, rgba(99, 217, 255, 0.08), transparent 24%),
        radial-gradient(circle at bottom, rgba(127, 255, 199, 0.05), transparent 28%),
        linear-gradient(180deg, rgba(3,7,13,0.82), rgba(2,5,9,0.92))
      `,
    }}>
      {/* Completed minigame result */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          width: 'min(960px, 100%)',
          padding: '22px 24px',
          border: '1px solid rgba(130,214,255,0.18)',
          background: 'linear-gradient(180deg, rgba(7,12,20,0.72), rgba(4,8,14,0.86))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.34)',
        }}
      >
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 3,
        }}>
          {tr('TRANSMISION')} {currentIndex + 1}/{totalMinigames} {tr('COMPLETADA')}
        </div>
        <div style={{
          fontSize: 18,
          color: 'var(--cyan)',
          letterSpacing: 2,
        }}>
          {trMinigameName(completedResult.minigameId, completedResult.minigameName)}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--green-neon)',
        }}>
          {tr('Ganador')}: {completedResult.winnerName}
        </div>
      </motion.div>

      {/* Global scoreboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) minmax(280px, 360px)',
          gap: 24,
          width: 'min(960px, 100%)',
          alignItems: 'start',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '18px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(7,12,20,0.72), rgba(4,8,14,0.86))',
        }}>
          <div style={{
            fontSize: 10,
            color: 'var(--gray-text)',
            letterSpacing: 3,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {tr('SCOREBOARD GLOBAL')}
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
                padding: '10px 14px',
                border: `1px solid ${p.playerId === playerId ? 'var(--green-neon)' : 'rgba(255,255,255,0.08)'}`,
                background: p.playerId === playerId ? 'rgba(0,255,65,0.05)' : 'rgba(255,255,255,0.02)',
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
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '18px',
          border: '1px solid rgba(130,214,255,0.14)',
          background: 'linear-gradient(180deg, rgba(7,12,20,0.72), rgba(4,8,14,0.86))',
        }}>
          <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 3, textAlign: 'center' }}>
            {tr('ESTADO DE FLOTILLA')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>{tr('Cabinas conectadas')}</div>
              <div style={{ marginTop: 8, fontSize: 24, color: 'var(--cyan)' }}>{globalScoreboard.length}</div>
            </div>
            <div style={{ padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>{tr('Minijuegos restantes')}</div>
              <div style={{ marginTop: 8, fontSize: 24, color: 'var(--green-neon)' }}>{Math.max(0, totalMinigames - currentIndex - 1)}</div>
            </div>
          </div>

          {/* Next minigame preview */}
          {nextMinigame && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '14px 16px',
                border: '1px solid rgba(130,214,255,0.18)',
                background: 'rgba(130,214,255,0.04)',
              }}
            >
              <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2 }}>
                {tr('SIGUIENTE MINIJUEGO')}
              </div>
              <div style={{ fontSize: 14, color: 'var(--cyan)', letterSpacing: 1 }}>
                {trMinigameName(nextMinigame.id, nextMinigame.name)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray-text)', lineHeight: 1.5 }}>
                {trMinigameDescription(nextMinigame.id, nextMinigame.shortDescription)}
              </div>
            </div>
          )}
        </div>
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
            {tr('VOZ ABIERTA - TODOS PUEDEN HABLAR')}
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
          {micMuted ? tr('MICROFONO APAGADO') : tr('MICROFONO ENCENDIDO')}
        </button>
      </motion.div>

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
            {tr('MODO DESARROLLADOR LOCAL')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center', lineHeight: 1.5 }}>
            {tr('Antes de continuar puedes elegir manualmente el siguiente minijuego.')}
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
              {trMinigameName(minigame.id, minigame.name)}
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
            {tr('CONTINUAR')}
          </button>
        ) : (
          <div style={{
            fontSize: 12,
            color: 'var(--green-dim)',
            letterSpacing: 2,
          }}
          className="pulse"
          >
            {tr('Esperando al anfitrion...')}
          </div>
        )}
      </motion.div>
    </div>
  )
}
