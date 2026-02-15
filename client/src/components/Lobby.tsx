import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { WelcomeText } from './WelcomeText'
import { PlayerAvatar } from './PlayerAvatar'

type LobbyView = 'welcome' | 'create' | 'join'

interface Props {
  onCreateGame: (name: string) => void
  onJoinGame: (name: string, code: string) => void
  onStart: () => void
  onShowRules: () => void
}

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
  const gameId = useGameStore(s => s.gameId)
  const players = useGameStore(s => s.players)
  const playerId = useGameStore(s => s.playerId)
  const connected = useGameStore(s => s.connected)
  const error = useGameStore(s => s.error)
  const setError = useGameStore(s => s.setError)

  const isHost = players.length > 0 && players[0]?.id === playerId
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
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: 'var(--white)',
          letterSpacing: 8,
          textShadow: '0 0 20px rgba(0,255,65,0.3)',
          marginBottom: 8,
        }}
      >
        LINEA MUERTA
      </motion.h1>

      <WelcomeText />

      {/* Error display */}
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

      {/* Pre-join views */}
      {!hasJoined && connected && (
        <AnimatePresence mode="wait">
          {/* Welcome: choose create or join */}
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

          {/* Create room */}
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

          {/* Join room */}
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

      {/* Waiting room (after joining) */}
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
          {/* Room code - prominent and copyable */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '16px 32px',
            border: '1px solid var(--green-dim)',
            background: 'var(--bg-panel)',
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

          {/* Player list */}
          <div style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 400,
          }}>
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  padding: 12,
                  border: `1px solid ${p.id === playerId ? 'var(--green-neon)' : '#222'}`,
                  background: 'var(--bg-panel)',
                }}
              >
                <PlayerAvatar player={p} size={50} showState={false} />
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
            {players.length} jugador{players.length !== 1 ? 'es' : ''} conectado{players.length !== 1 ? 's' : ''}
          </div>

          {isHost ? (
            <button
              className="btn btn-green"
              onClick={onStart}
              disabled={players.length < 2}
              style={{ fontSize: 16 }}
            >
              INICIAR PARTIDA
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

          {isHost && players.length < 2 && (
            <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>
              Comparte el codigo para que otros se unan
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
