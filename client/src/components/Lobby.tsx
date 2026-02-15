import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { WelcomeText } from './WelcomeText'
import { PlayerAvatar } from './PlayerAvatar'
import lobbyImage from '../../lobby.png'
import { PlayerState, type PlayerData } from '../types'

type LobbyView = 'welcome' | 'create' | 'join'

interface Props {
  onCreateGame: (name: string) => void
  onJoinGame: (name: string, code: string) => void
  onStart: (data?: { selectedMinigameIds?: string[] }) => void
  onShowRules: () => void
}

const minigameOptions = [
  { id: 'cooperar-traicionar', name: 'Cooperar o Traicionar' },
  { id: 'votacion-sobra', name: 'Quien Sobra?' },
  { id: 'votacion-merece', name: 'Quien Merece?' },
  { id: 'adivina-linea', name: 'Adivina la Linea' },
  { id: 'la-bomba', name: 'La Bomba' },
]

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 16,
  padding: '12px 24px',
  background: 'var(--bg-panel)',
  border: '1px solid var(--green-dim)',
  color: 'var(--green-neon)',
  outline: 'none',
  textAlign: 'center',
  letterSpacing: 2,
  width: 280,
}

export function Lobby({ onCreateGame, onJoinGame, onStart }: Props) {
  const [view, setView] = useState<LobbyView>('welcome')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [devMode, setDevMode] = useState(false)
  const [selectedMinigameIds, setSelectedMinigameIds] = useState<string[]>([])
  const gameId = useGameStore(s => s.gameId)
  const globalScoreboard = useGameStore(s => s.globalScoreboard)
  const playerId = useGameStore(s => s.playerId)
  const connected = useGameStore(s => s.connected)
  const error = useGameStore(s => s.error)
  const setError = useGameStore(s => s.setError)

  const hostId = useGameStore(s => s.hostId)
  const isHost = playerId === hostId
  const hasJoined = !!playerId

  // Clear error when changing view
  useEffect(() => {
    setError(null)
  }, [view, setError])

  const handleCreate = () => {
    if (!name.trim()) return
    onCreateGame(name.trim())
  }

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return
    onJoinGame(name.trim(), roomCode.trim())
  }

  const toggleMinigameSelection = (id: string) => {
    setSelectedMinigameIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id)
      return [...prev, id]
    })
  }

  const toLobbyAvatarPlayer = (player: { playerId: string; name: string }): PlayerData => ({
    id: player.playerId,
    socketId: '',
    name: player.name,
    balance: 0,
    state: PlayerState.LOBBY,
    isAlive: true,
    isShadow: false,
    shadowCharges: 0,
    rachaCooperar: 0,
    rachaTraicionar: 0,
  })

  const cardStyle: React.CSSProperties = {
    width: 'min(560px, 100%)',
    maxHeight: 'min(90vh, 920px)',
    overflowY: 'auto',
    border: '1px solid rgba(0, 229, 255, 0.62)',
    background: 'linear-gradient(180deg, rgba(7,12,19,0.78), rgba(8,13,20,0.88))',
    backdropFilter: 'blur(6px)',
    boxShadow: `
      0 20px 50px rgba(0,0,0,0.55),
      0 0 42px rgba(0,229,255,0.2),
      0 0 16px rgba(0,255,65,0.14),
      inset 0 0 18px rgba(0,229,255,0.12)
    `,
    padding: 'clamp(18px, 2.6vw, 30px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    marginLeft: 'clamp(0px, 8vw, 140px)',
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${lobbyImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: 'scale(1.03)',
        filter: 'saturate(1.05) contrast(1.05)',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(5,7,12,0.38) 0%, rgba(5,7,12,0.74) 58%, rgba(5,7,12,0.9) 100%)',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(22px, 5vh, 54px) clamp(14px, 4vw, 42px)',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          style={cardStyle}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: 38,
                fontWeight: 'bold',
                color: 'var(--white)',
                letterSpacing: 6,
                textShadow: '0 0 20px rgba(0,255,65,0.25)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              LINEA MUERTA
            </motion.h1>
            <WelcomeText />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '8px 20px',
                  border: '1px solid var(--red-danger)',
                  background: 'var(--red-dark)',
                  color: 'var(--red-danger)',
                  fontSize: 12,
                  letterSpacing: 1,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {!connected && (
            <div style={{ fontSize: 10, color: 'var(--red-danger)' }}>
              Conectando al servidor...
            </div>
          )}

          {!hasJoined && connected && (
            <AnimatePresence mode="wait">
              {view === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: 2.4 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    paddingTop: 8,
                  }}
                >
                  <button
                    className="btn btn-green"
                    onClick={() => setView('create')}
                    style={{ width: 280, fontSize: 14 }}
                  >
                    CREAR SALA
                  </button>
                  <button
                    className="btn btn-cyan"
                    onClick={() => setView('join')}
                    style={{ width: 280, fontSize: 14 }}
                  >
                    UNIRSE A SALA
                  </button>
                </motion.div>
              )}

              {view === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{
                    fontSize: 12,
                    color: 'var(--green-dim)',
                    letterSpacing: 3,
                  }}>
                    CREAR NUEVA SALA
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Tu nombre..."
                    maxLength={15}
                    autoFocus
                    style={inputStyle}
                  />

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      className="btn btn-green"
                      onClick={handleCreate}
                      disabled={!name.trim()}
                    >
                      CREAR
                    </button>
                    <button
                      className="btn btn-red"
                      onClick={() => setView('welcome')}
                      style={{ fontSize: 12 }}
                    >
                      VOLVER
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'join' && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{
                    fontSize: 12,
                    color: 'var(--cyan)',
                    letterSpacing: 3,
                  }}>
                    UNIRSE A SALA
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre..."
                    maxLength={15}
                    autoFocus
                    style={inputStyle}
                  />

                  <input
                    type="text"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder="Codigo de sala..."
                    maxLength={6}
                    style={{
                      ...inputStyle,
                      letterSpacing: 8,
                      fontSize: 22,
                      borderColor: 'var(--cyan)',
                      color: 'var(--cyan)',
                    }}
                  />

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      className="btn btn-cyan"
                      onClick={handleJoin}
                      disabled={!name.trim() || !roomCode.trim()}
                    >
                      UNIRSE
                    </button>
                    <button
                      className="btn btn-red"
                      onClick={() => setView('welcome')}
                      style={{ fontSize: 12 }}
                    >
                      VOLVER
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {hasJoined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '16px 32px',
                border: '1px solid var(--green-dim)',
                background: 'rgba(6, 10, 16, 0.85)',
              }}>
                <div style={{
                  fontSize: 10,
                  color: 'var(--gray-text)',
                  letterSpacing: 3,
                }}>
                  CODIGO DE SALA
                </div>
                <div
                  style={{
                    fontSize: 36,
                    color: 'var(--green-neon)',
                    letterSpacing: 12,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(gameId ?? '')
                  }}
                  title="Click para copiar"
                >
                  {gameId}
                </div>
                <div style={{
                  fontSize: 9,
                  color: 'var(--gray-shadow)',
                  letterSpacing: 1,
                }}>
                  Click para copiar
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: 420,
              }}>
                {globalScoreboard.map(p => (
                  <div
                    key={p.playerId}
                    style={{
                      position: 'relative',
                      padding: 12,
                      border: `1px solid ${p.playerId === playerId ? 'var(--green-neon)' : '#222'}`,
                      background: 'rgba(6, 10, 16, 0.85)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      minWidth: 110,
                    }}
                  >
                    {p.playerId === hostId && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          fontSize: 8,
                          letterSpacing: 1,
                          color: 'var(--cyan)',
                          border: '1px solid var(--cyan)',
                          padding: '1px 5px',
                          background: 'rgba(0, 229, 255, 0.08)',
                        }}
                      >
                        HOST
                      </span>
                    )}
                    <PlayerAvatar player={toLobbyAvatarPlayer(p)} size={44} showName={false} showState={false} />
                    <div style={{
                      fontSize: 12,
                      color: p.playerId === playerId ? 'var(--green-neon)' : 'var(--white)',
                      letterSpacing: 1,
                    }}>
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                {globalScoreboard.length} jugador{globalScoreboard.length !== 1 ? 'es' : ''} conectado{globalScoreboard.length !== 1 ? 's' : ''}
              </div>

              {isHost ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--gray-text)' }}>
                    <input
                      type="checkbox"
                      checked={devMode}
                      onChange={e => setDevMode(e.target.checked)}
                    />
                    MODO DESARROLLADOR
                  </label>

                  {devMode && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      border: '1px solid var(--cyan)',
                      background: 'rgba(0,229,255,0.05)',
                      padding: 12,
                      minWidth: 280,
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 2 }}>
                        SELECCIONA MINIJUEGOS A PROBAR
                      </div>
                      {minigameOptions.map((minigame) => (
                        <label key={minigame.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--white)' }}>
                          <input
                            type="checkbox"
                            checked={selectedMinigameIds.includes(minigame.id)}
                            onChange={() => toggleMinigameSelection(minigame.id)}
                          />
                          {minigame.name}
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    className="btn btn-green"
                    onClick={() => onStart(devMode ? { selectedMinigameIds } : undefined)}
                    disabled={globalScoreboard.length < 2 || (devMode && selectedMinigameIds.length === 0)}
                    style={{ fontSize: 16 }}
                  >
                    INICIAR PARTIDA
                  </button>
                </div>
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

              {isHost && globalScoreboard.length < 2 && (
                <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>
                  Comparte el codigo para que otros se unan
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
