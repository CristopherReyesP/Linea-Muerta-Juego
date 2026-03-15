import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

type LobbyView = 'home' | 'create' | 'join' | 'rooms'

interface Props {
  docked: boolean
  onCenterPanel: () => void
  onCreateGame: (name: string, avatarId?: string, avatarColor?: string, accessoryId?: string, isPublic?: boolean) => void
  onJoinGame: (name: string, code: string, avatarId?: string, avatarColor?: string, accessoryId?: string) => void
  onLeaveGame: () => void
  onStart: (data?: { selectedMinigameIds?: string[] }) => void
  onSendLobbyChat: (text: string) => void
  onSendMenuChat: (data: { name: string; text: string }) => void
}

const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(122, 202, 255, 0.22)',
  background: 'linear-gradient(180deg, rgba(6, 11, 18, 0.8), rgba(4, 8, 14, 0.92))',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.36)',
  backdropFilter: 'blur(16px)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid rgba(148, 176, 204, 0.18)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#f1f7fb',
  outline: 'none',
  fontFamily: 'var(--font-mono)',
  fontSize: 14,
  letterSpacing: 1,
}

export function ThreeLobby({ docked, onCenterPanel, onCreateGame, onJoinGame, onLeaveGame, onStart, onSendLobbyChat, onSendMenuChat }: Props) {
  const [view, setView] = useState<LobbyView>('home')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [menuMessage, setMenuMessage] = useState('')
  const [lobbyMessage, setLobbyMessage] = useState('')

  const playerId = useGameStore((s) => s.playerId)
  const gameId = useGameStore((s) => s.gameId)
  const hostId = useGameStore((s) => s.hostId)
  const lobbyPlayers = useGameStore((s) => s.lobbyPlayers)
  const lobbyChat = useGameStore((s) => s.lobbyChat)
  const publicRooms = useGameStore((s) => s.publicRooms)
  const menuChat = useGameStore((s) => s.menuChat)
  const globalStats = useGameStore((s) => s.globalStats)
  const error = useGameStore((s) => s.error)

  const hasJoined = Boolean(playerId)
  const isHost = playerId && playerId === hostId

  const roomSummary = useMemo(() => {
    return publicRooms.slice(0, 4)
  }, [publicRooms])

  const submitMenuChat = () => {
    if (!name.trim() || !menuMessage.trim()) return
    onSendMenuChat({ name: name.trim(), text: menuMessage.trim() })
    setMenuMessage('')
  }

  const submitLobbyChat = () => {
    if (!lobbyMessage.trim()) return
    onSendLobbyChat(lobbyMessage.trim())
    setLobbyMessage('')
  }

  const canUseName = name.trim().length > 0

  const quickActions = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
      <button className="btn btn-green" onClick={() => setView('create')}>
        Crear sala nueva
      </button>
      <button className="btn btn-cyan" onClick={() => setView('join')}>
        Entrar con codigo
      </button>
      <button className="btn btn-cyan" onClick={() => setView('rooms')}>
        Ver salas publicas
      </button>
    </div>
  )

  return (
    <div
      style={{
        width: docked ? 'min(980px, calc(100vw - 32px))' : 'min(1180px, 100%)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 18,
        alignItems: 'stretch',
        transition: 'width 0.25s ease',
      }}
    >
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          ...panelStyle,
          flex: docked ? '0 1 720px' : '1 1 680px',
          padding: 'clamp(22px, 3vw, 34px)',
          minHeight: 'min(86vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: 'var(--cyan)', textTransform: 'uppercase' }}>
              Sala 3D beta
            </div>
            {docked && (
              <button className="btn btn-cyan" style={{ padding: '8px 12px', fontSize: 12 }} onClick={onCenterPanel}>
                Centrar panel
              </button>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 7vw, 72px)', lineHeight: 0.95, color: '#f6fbff' }}>
            Linea Muerta
          </h1>
          <p style={{ maxWidth: 560, lineHeight: 1.7, color: '#bfd0dd', fontSize: 15 }}>
            Pilotas una nave a la deriva en el vacio, aislado del resto de la flotilla. Solo puedes orientarte hablando, dudando y tomando decisiones con voces lejanas que llegan desde otras cabinas perdidas en el espacio.
          </p>
        </div>

        {!hasJoined ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ ...panelStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gray-text)', textTransform: 'uppercase' }}>
                Tu nombre en partida
              </div>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 15))} placeholder="Tu alias" style={inputStyle} />
              <div style={{ fontSize: 12, color: '#a9bbca', lineHeight: 1.6 }}>
                Escribe el nombre que veran los demas jugadores y luego elige una opcion.
              </div>
              {view === 'home' && quickActions}
              {view === 'create' && (
                <div style={{ ...panelStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, textTransform: 'uppercase' }}>
                      Crear sala nueva
                    </div>
                    <button className="btn btn-cyan" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => setView('home')}>
                      Regresar
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button className="btn btn-green" disabled={!canUseName} onClick={() => canUseName && onCreateGame(name.trim(), undefined, undefined, undefined, false)}>
                      Sala privada
                    </button>
                    <button className="btn btn-cyan" disabled={!canUseName} onClick={() => canUseName && onCreateGame(name.trim(), undefined, undefined, undefined, true)}>
                      Sala publica
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: '#9cb1c0', lineHeight: 1.6 }}>
                    `Sala privada` crea una sala por codigo. `Sala publica` aparece en la lista para que otros entren sin pedirte el codigo.
                  </div>
                </div>
              )}
              {view === 'join' && (
                <div style={{ ...panelStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, textTransform: 'uppercase' }}>
                      Entrar con codigo
                    </div>
                    <button className="btn btn-cyan" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => setView('home')}>
                      Regresar
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: '#d8e3eb', lineHeight: 1.6 }}>
                    Pega aqui el codigo que te compartio otro jugador para entrar directo a su sala.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10 }}>
                    <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))} placeholder="Codigo de la sala" style={inputStyle} />
                    <button className="btn btn-cyan" disabled={!canUseName || !roomCode.trim()} onClick={() => canUseName && roomCode.trim() && onJoinGame(name.trim(), roomCode.trim())}>
                      Entrar
                    </button>
                  </div>
                </div>
              )}
              {view === 'rooms' && (
                <div style={{ ...panelStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, textTransform: 'uppercase' }}>
                      Salas publicas
                    </div>
                    <button className="btn btn-cyan" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => setView('home')}>
                      Regresar
                    </button>
                  </div>
                  {roomSummary.length === 0 ? (
                    <div style={{ color: '#93a8b7', fontSize: 12, lineHeight: 1.6 }}>No hay salas publicas abiertas ahora mismo.</div>
                  ) : (
                    roomSummary.map((room) => (
                      <div key={room.gameId} style={{ padding: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                          <div style={{ color: '#f1f7fb', fontSize: 13 }}>{room.hostName}</div>
                          <div style={{ color: 'var(--cyan)', fontSize: 12 }}>{room.gameId}</div>
                        </div>
                        <div style={{ marginTop: 8, color: '#9bb0bf', fontSize: 12 }}>
                          {room.playerCount}/{room.maxPlayers} jugadores
                        </div>
                        <button
                          className="btn btn-cyan"
                          style={{ width: '100%', marginTop: 10 }}
                          onClick={() => canUseName && onJoinGame(name.trim(), room.gameId)}
                          disabled={!canUseName}
                        >
                          {canUseName ? 'Entrar a esta sala' : 'Escribe tu nombre'}
                        </button>
                      </div>
                    ))
                  )}
                  <div style={{ fontSize: 12, color: '#9cb1c0', lineHeight: 1.6 }}>
                    Aqui aparecen las salas publicas que otros jugadores dejaron visibles.
                  </div>
                </div>
              )}
              {error && (
                <div style={{ padding: '10px 12px', border: '1px solid rgba(255, 23, 68, 0.32)', color: '#ff6f90', background: 'rgba(86, 10, 27, 0.18)', fontSize: 12 }}>
                  {error}
                </div>
              )}
            </div>

            <div style={{ ...panelStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, opacity: view === 'home' ? 1 : 0.86 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gray-text)', textTransform: 'uppercase' }}>
                Estado general
              </div>
              <div style={{ fontSize: 30, color: '#f5fbff' }}>{globalStats?.totalPlayers ?? 0}</div>
              <div style={{ fontSize: 12, color: '#a9bbca', lineHeight: 1.6 }}>
                jugadores conectados
              </div>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>Salas en lobby</div>
                  <div style={{ marginTop: 6, color: 'var(--cyan)', fontSize: 20 }}>{globalStats?.totalLobbyRooms ?? 0}</div>
                </div>
                <div style={{ padding: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>Salas activas</div>
                  <div style={{ marginTop: 6, color: '#7ef0a2', fontSize: 20 }}>{globalStats?.totalActiveRooms ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ ...panelStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2, textTransform: 'uppercase' }}>Sala conectada</div>
                  <div style={{ marginTop: 8, fontSize: 34, color: 'var(--cyan)', letterSpacing: 6 }}>{gameId}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {isHost ? (
                    <button className="btn btn-green" disabled={lobbyPlayers.length < 2} onClick={() => onStart()}>
                      Iniciar partida
                    </button>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9eb2c0' }}>Esperando al anfitrion</div>
                  )}
                  <button className="btn btn-cyan" onClick={onLeaveGame}>
                    Salir de la sala
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                {lobbyPlayers.map((player) => (
                  <div
                    key={player.playerId}
                    style={{
                      padding: 12,
                      border: `1px solid ${player.playerId === playerId ? 'rgba(63, 232, 134, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: player.avatarColor, boxShadow: `0 0 16px ${player.avatarColor}` }} />
                    <div style={{ marginTop: 10, color: '#eff7ff', fontSize: 14 }}>{player.name}</div>
                    <div style={{ marginTop: 6, fontSize: 10, color: player.playerId === hostId ? 'var(--cyan)' : 'var(--gray-text)' }}>
                      {player.playerId === hostId ? 'ANFITRION' : 'JUGADOR'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...panelStyle, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Chat de sala
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lobbyChat.length === 0 ? (
                    <div style={{ color: '#90a3b1', fontSize: 12 }}>Todavia no hay mensajes en esta sala.</div>
                  ) : (
                    lobbyChat.map((message) => (
                      <div key={message.id}>
                        <div style={{ fontSize: 10, color: message.playerId === playerId ? '#7ef0a2' : 'var(--cyan)' }}>
                          {message.playerName}
                        </div>
                        <div style={{ marginTop: 4, color: '#d5e1ea', fontSize: 13, lineHeight: 1.5 }}>{message.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <input value={lobbyMessage} onChange={(e) => setLobbyMessage(e.target.value.slice(0, 140))} placeholder="Escribe un mensaje" style={inputStyle} />
                  <button className="btn btn-cyan" onClick={submitLobbyChat}>Enviar</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ ...panelStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Estado de la sala
                </div>
                <div style={{ fontSize: 28, color: '#f4fbff' }}>{lobbyPlayers.length}</div>
                <div style={{ color: '#98aebd', fontSize: 12, lineHeight: 1.6 }}>
                  jugadores listos para empezar la partida.
                </div>
              </div>

              <div style={{ ...panelStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Chat principal
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {menuChat.slice(-4).map((message) => (
                    <div key={message.id}>
                      <div style={{ fontSize: 10, color: '#86d9ff' }}>{message.playerName}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#d4dee6' }}>{message.text}</div>
                    </div>
                  ))}
                </div>
                <textarea
                  value={menuMessage}
                  onChange={(e) => setMenuMessage(e.target.value.slice(0, 140))}
                  placeholder="Mensaje general"
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
                <button className="btn btn-cyan" onClick={submitMenuChat}>Publicar</button>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: '1 1 320px', minWidth: 'min(100%, 320px)' }}>
        <motion.section
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ ...panelStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gray-text)', textTransform: 'uppercase' }}>
            Salas publicas
          </div>
          {roomSummary.length === 0 ? (
            <div style={{ color: '#93a8b7', fontSize: 12, lineHeight: 1.6 }}>No hay salas publicas abiertas ahora mismo.</div>
          ) : (
            roomSummary.map((room) => (
              <div key={room.gameId} style={{ padding: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div style={{ color: '#f1f7fb', fontSize: 13 }}>{room.hostName}</div>
                  <div style={{ color: 'var(--cyan)', fontSize: 12 }}>{room.gameId}</div>
                </div>
                <div style={{ marginTop: 8, color: '#9bb0bf', fontSize: 12 }}>
                  {room.playerCount}/{room.maxPlayers} jugadores
                </div>
                {!hasJoined && (
                  <button
                    className="btn btn-cyan"
                    style={{ width: '100%', marginTop: 10 }}
                    onClick={() => canUseName && onJoinGame(name.trim(), room.gameId)}
                    disabled={!canUseName}
                  >
                    {canUseName ? 'Entrar' : 'Escribe tu nombre'}
                  </button>
                )}
              </div>
            ))
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          style={{ ...panelStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gray-text)', textTransform: 'uppercase' }}>
            Estado de migracion
          </div>
          <div style={{ color: '#d4e2eb', fontSize: 13, lineHeight: 1.7 }}>
            Esta sala 3D ya corre sobre el servidor real. Seguiremos mejorando el ambiente y la interfaz sin tocar la logica estable del juego.
          </div>
        </motion.section>
      </aside>
    </div>
  )
}
