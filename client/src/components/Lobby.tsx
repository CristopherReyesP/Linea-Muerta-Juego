import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { WelcomeText } from './WelcomeText'
import { PlayerAvatar } from './PlayerAvatar'
import lobbyImage from '../../lobby.png'
import { PlayerState, type PlayerData } from '../types'

type LobbyView = 'welcome' | 'create' | 'join'
type CustomizeTab = 'masks' | 'accessories'

interface Props {
  onCreateGame: (name: string, avatarId?: string, avatarColor?: string, accessoryId?: string) => void
  onJoinGame: (name: string, code: string, avatarId?: string, avatarColor?: string, accessoryId?: string) => void
  onStart: (data?: { selectedMinigameIds?: string[] }) => void
  onShowRules: () => void
}

const minigameOptions = [
  { id: 'cooperar-traicionar', name: 'Cooperar o Traicionar', minPlayers: 2 },
  { id: 'votacion-sobra', name: 'Quien Sobra?', minPlayers: 2 },
  { id: 'votacion-merece', name: 'Quien Merece?', minPlayers: 2 },
  { id: 'adivina-linea', name: 'Adivina la Linea', minPlayers: 2 },
  { id: 'la-bomba', name: 'La Bomba', minPlayers: 2 },
  { id: 'central-emergencias', name: 'Central de Emergencias', minPlayers: 4 },
  { id: 'emoji-diferente', name: 'Emoji Diferente', minPlayers: 3 },
]

const avatarOptions = [
  { id: 'neon-eyes', premium: false },
  { id: 'x-glow', premium: false },
  { id: 'heart-core', premium: false },
  { id: 'circle-core', premium: false },
  { id: 'square-core', premium: false },
  { id: 'skull-mask', premium: false },
  { id: 'mask-jason', premium: true },
  { id: 'mask-anonymous', premium: true },
  { id: 'emoji-devil', premium: false },
  { id: 'emoji-robot', premium: false },
  { id: 'emoji-ghost', premium: false },
  { id: 'emoji-skull', premium: false },
  { id: 'emoji-brain', premium: false },
  { id: 'emoji-fire', premium: false },
  { id: 'emoji-alien', premium: false },
  { id: 'emoji-mask', premium: false },
  { id: 'emoji-owl', premium: false },
  { id: 'emoji-crow', premium: false },
  { id: 'emoji-dog', premium: false },
  { id: 'emoji-wizard', premium: false },
  { id: 'emoji-vampire', premium: false },
  { id: 'emoji-zombie', premium: false },
  { id: 'emoji-ninja', premium: false },
  { id: 'emoji-moon-face', premium: false },
  { id: 'emoji-crystal', premium: false },
  { id: 'icon-triangle', premium: false },
  { id: 'icon-bolt', premium: false },
  { id: 'icon-moon', premium: false },
  { id: 'icon-crosshair', premium: false },
  { id: 'icon-wand', premium: false },
  { id: 'icon-star', premium: false },
]

const avatarColors = ['#00e5ff', '#00ff41', '#ff1744', '#ffab00', '#ff4dff', '#8b5a2b', '#a259ff', '#ffffff']
const accessoryOptions = [
  { id: 'none', premium: false },
  { id: 'beanie', premium: false },
  { id: 'visor', premium: false },
  { id: 'horns', premium: false },
  { id: 'pet-raven', premium: false },
  { id: 'pet-cat', premium: false },
  { id: 'angel-wings', premium: true },
  { id: 'butterfly-wings', premium: true },
  { id: 'straw-hat', premium: true },
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

const avatarGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  maxHeight: 182, // 5 rows (15 options visibles) aprox
  overflowY: 'auto',
  paddingRight: 4,
}

export function Lobby({ onCreateGame, onJoinGame, onStart }: Props) {
  const [view, setView] = useState<LobbyView>('welcome')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState('neon-eyes')
  const [selectedAvatarColor, setSelectedAvatarColor] = useState('#00e5ff')
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('none')
  const [customizeTab, setCustomizeTab] = useState<CustomizeTab>('masks')
  const [devMode, setDevMode] = useState(false)
  const [selectedMinigameIds, setSelectedMinigameIds] = useState<string[]>([])
  const gameId = useGameStore(s => s.gameId)
  const globalScoreboard = useGameStore(s => s.globalScoreboard)
  const playerId = useGameStore(s => s.playerId)
  const connected = useGameStore(s => s.connected)
  const error = useGameStore(s => s.error)
  const setError = useGameStore(s => s.setError)

  const hostId = useGameStore(s => s.hostId)
  const micMuted = useGameStore(s => s.micMuted)
  const toggleMic = useGameStore(s => s.toggleMic)
  const openVoicePlayerIds = useGameStore(s => s.openVoicePlayerIds)
  const globalStats = useGameStore(s => s.globalStats)
  const globalNotifications = useGameStore(s => s.globalNotifications)
  const removeGlobalNotification = useGameStore(s => s.removeGlobalNotification)
  const isHost = playerId === hostId
  const hasJoined = !!playerId

  // Clear error when changing view
  useEffect(() => {
    setError(null)
  }, [view, setError])

  // Auto-remove notifications after 8 seconds
  useEffect(() => {
    if (globalNotifications.length === 0) return
    const timers = globalNotifications.map((n) =>
      setTimeout(() => removeGlobalNotification(n.id), 8000)
    )
    return () => timers.forEach(clearTimeout)
  }, [globalNotifications, removeGlobalNotification])

  const handleCreate = () => {
    if (!name.trim()) return
    onCreateGame(name.trim(), selectedAvatarId, selectedAvatarColor, selectedAccessoryId)
  }

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return
    onJoinGame(name.trim(), roomCode.trim(), selectedAvatarId, selectedAvatarColor, selectedAccessoryId)
  }

  const toggleMinigameSelection = (id: string) => {
    setSelectedMinigameIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id)
      return [...prev, id]
    })
  }

  const toLobbyAvatarPlayer = (player: { playerId: string; name: string; avatarId: string; avatarColor: string; accessoryId: string }): PlayerData => ({
    id: player.playerId,
    socketId: '',
    name: player.name,
    avatarId: player.avatarId,
    avatarColor: player.avatarColor,
    accessoryId: player.accessoryId ?? 'none',
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

  const selectedAvatarPreview: PlayerData = {
    id: 'preview',
    socketId: '',
    name: 'Preview',
    avatarId: selectedAvatarId,
    avatarColor: selectedAvatarColor,
    accessoryId: selectedAccessoryId,
    balance: 0,
    state: PlayerState.LOBBY,
    isAlive: true,
    isShadow: false,
    shadowCharges: 0,
    rachaCooperar: 0,
    rachaTraicionar: 0,
  }
  const selectedAccessory = accessoryOptions.find((a) => a.id === selectedAccessoryId)
  const isSelectedAccessoryPremium = !!selectedAccessory?.premium
  const selectedAvatar = avatarOptions.find((a) => a.id === selectedAvatarId)
  const isSelectedAvatarPremium = !!selectedAvatar?.premium
  const hasPremiumSelection = isSelectedAvatarPremium || isSelectedAccessoryPremium

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
            {!hasJoined && view === 'welcome' && <WelcomeText />}
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
                  transition={{ duration: 0.18 }}
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

                  {globalStats && (globalStats.totalRooms > 0 || globalStats.totalPlayers > 0) && (
                    <div style={{
                      fontSize: 10,
                      color: 'var(--gray-shadow)',
                      letterSpacing: 1,
                    }}>
                      {globalStats.totalRooms} sala{globalStats.totalRooms !== 1 ? 's' : ''} activa{globalStats.totalRooms !== 1 ? 's' : ''} · {globalStats.totalPlayers} jugador{globalStats.totalPlayers !== 1 ? 'es' : ''} en linea
                    </div>
                  )}
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

                  <div style={{
                    width: '100%',
                    maxWidth: 360,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    border: `1px solid ${hasPremiumSelection ? 'rgba(255, 214, 102, 0.78)' : '#223'}`,
                    background: hasPremiumSelection
                      ? 'linear-gradient(180deg, rgba(52,34,8,0.33), rgba(10,12,20,0.48))'
                      : 'rgba(0,0,0,0.35)',
                    boxShadow: hasPremiumSelection ? '0 0 16px rgba(255,214,102,0.22)' : undefined,
                    padding: 10,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2, textAlign: 'center' }}>
                      ELIGE TU AVATAR
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <PlayerAvatar player={selectedAvatarPreview} size={74} showName={false} showState={false} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setCustomizeTab('masks')}
                        style={{
                          border: `1px solid ${customizeTab === 'masks' ? 'var(--cyan)' : '#333'}`,
                          background: customizeTab === 'masks' ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.03)',
                          color: customizeTab === 'masks' ? 'var(--cyan)' : 'var(--gray-text)',
                          fontSize: 10,
                          letterSpacing: 1.6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        MASCARAS
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomizeTab('accessories')}
                        style={{
                          border: `1px solid ${customizeTab === 'accessories' ? 'var(--cyan)' : '#333'}`,
                          background: customizeTab === 'accessories' ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.03)',
                          color: customizeTab === 'accessories' ? 'var(--cyan)' : 'var(--gray-text)',
                          fontSize: 10,
                          letterSpacing: 1.6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        ACCESORIOS
                      </button>
                    </div>
                    {customizeTab === 'masks' && (
                      <>
                        <div style={avatarGridStyle}>
                          {avatarOptions.map((avatar) => (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => setSelectedAvatarId(avatar.id)}
                              style={{
                                border: `1px solid ${
                                  selectedAvatarId === avatar.id
                                    ? (avatar.premium ? '#ffd666' : 'var(--cyan)')
                                    : (avatar.premium ? 'rgba(255,214,102,0.5)' : '#333')
                                }`,
                                background: selectedAvatarId === avatar.id
                                  ? (avatar.premium ? 'rgba(255,214,102,0.18)' : 'rgba(0,229,255,0.12)')
                                  : (avatar.premium ? 'rgba(255,214,102,0.08)' : 'rgba(255,255,255,0.02)'),
                                padding: '6px 4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PlayerAvatar
                                player={{ ...selectedAvatarPreview, id: `opt-${avatar.id}`, avatarId: avatar.id }}
                                size={42}
                                showName={false}
                                showState={false}
                              />
                            </button>
                          ))}
                        </div>
                        {isSelectedAvatarPremium && (
                          <div style={{
                            marginTop: 2,
                            textAlign: 'center',
                            fontSize: 10,
                            letterSpacing: 2,
                            color: '#ffd666',
                            textShadow: '0 0 10px rgba(255,214,102,0.35)',
                          }}>
                            PREMIUM
                          </div>
                        )}
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                      {avatarColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedAvatarColor(color)}
                          title={color}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: selectedAvatarColor === color ? '2px solid var(--white)' : '1px solid #333',
                            background: color,
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                    {customizeTab === 'accessories' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {accessoryOptions.map((accessory) => (
                            <button
                              key={accessory.id}
                              type="button"
                              onClick={() => setSelectedAccessoryId(accessory.id)}
                              style={{
                                border: `1px solid ${
                                  selectedAccessoryId === accessory.id
                                    ? (accessory.premium ? '#ffd666' : 'var(--cyan)')
                                    : (accessory.premium ? 'rgba(255,214,102,0.5)' : '#333')
                                }`,
                                background: selectedAccessoryId === accessory.id
                                  ? (accessory.premium ? 'rgba(255,214,102,0.18)' : 'rgba(0,229,255,0.12)')
                                  : (accessory.premium ? 'rgba(255,214,102,0.08)' : 'rgba(255,255,255,0.02)'),
                                padding: '6px 4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PlayerAvatar
                                player={{ ...selectedAvatarPreview, id: `acc-opt-${accessory.id}`, accessoryId: accessory.id }}
                                size={44}
                                showName={false}
                                showState={false}
                              />
                            </button>
                          ))}
                        </div>
                        {isSelectedAccessoryPremium && (
                          <div style={{
                            marginTop: 2,
                            textAlign: 'center',
                            fontSize: 10,
                            letterSpacing: 2,
                            color: '#ffd666',
                            textShadow: '0 0 10px rgba(255,214,102,0.35)',
                          }}>
                            PREMIUM
                          </div>
                        )}
                      </>
                    )}
                  </div>

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

                  <div style={{
                    width: '100%',
                    maxWidth: 360,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    border: `1px solid ${hasPremiumSelection ? 'rgba(255, 214, 102, 0.78)' : '#223'}`,
                    background: hasPremiumSelection
                      ? 'linear-gradient(180deg, rgba(52,34,8,0.33), rgba(10,12,20,0.48))'
                      : 'rgba(0,0,0,0.35)',
                    boxShadow: hasPremiumSelection ? '0 0 16px rgba(255,214,102,0.22)' : undefined,
                    padding: 10,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2, textAlign: 'center' }}>
                      ELIGE TU AVATAR
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <PlayerAvatar player={selectedAvatarPreview} size={74} showName={false} showState={false} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setCustomizeTab('masks')}
                        style={{
                          border: `1px solid ${customizeTab === 'masks' ? 'var(--cyan)' : '#333'}`,
                          background: customizeTab === 'masks' ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.03)',
                          color: customizeTab === 'masks' ? 'var(--cyan)' : 'var(--gray-text)',
                          fontSize: 10,
                          letterSpacing: 1.6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        MASCARAS
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomizeTab('accessories')}
                        style={{
                          border: `1px solid ${customizeTab === 'accessories' ? 'var(--cyan)' : '#333'}`,
                          background: customizeTab === 'accessories' ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.03)',
                          color: customizeTab === 'accessories' ? 'var(--cyan)' : 'var(--gray-text)',
                          fontSize: 10,
                          letterSpacing: 1.6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        ACCESORIOS
                      </button>
                    </div>
                    {customizeTab === 'masks' && (
                      <>
                        <div style={avatarGridStyle}>
                          {avatarOptions.map((avatar) => (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => setSelectedAvatarId(avatar.id)}
                              style={{
                                border: `1px solid ${
                                  selectedAvatarId === avatar.id
                                    ? (avatar.premium ? '#ffd666' : 'var(--cyan)')
                                    : (avatar.premium ? 'rgba(255,214,102,0.5)' : '#333')
                                }`,
                                background: selectedAvatarId === avatar.id
                                  ? (avatar.premium ? 'rgba(255,214,102,0.18)' : 'rgba(0,229,255,0.12)')
                                  : (avatar.premium ? 'rgba(255,214,102,0.08)' : 'rgba(255,255,255,0.02)'),
                                padding: '6px 4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PlayerAvatar
                                player={{ ...selectedAvatarPreview, id: `join-opt-${avatar.id}`, avatarId: avatar.id }}
                                size={42}
                                showName={false}
                                showState={false}
                              />
                            </button>
                          ))}
                        </div>
                        {isSelectedAvatarPremium && (
                          <div style={{
                            marginTop: 2,
                            textAlign: 'center',
                            fontSize: 10,
                            letterSpacing: 2,
                            color: '#ffd666',
                            textShadow: '0 0 10px rgba(255,214,102,0.35)',
                          }}>
                            PREMIUM
                          </div>
                        )}
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                      {avatarColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedAvatarColor(color)}
                          title={color}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: selectedAvatarColor === color ? '2px solid var(--white)' : '1px solid #333',
                            background: color,
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                    {customizeTab === 'accessories' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {accessoryOptions.map((accessory) => (
                            <button
                              key={accessory.id}
                              type="button"
                              onClick={() => setSelectedAccessoryId(accessory.id)}
                              style={{
                                border: `1px solid ${
                                  selectedAccessoryId === accessory.id
                                    ? (accessory.premium ? '#ffd666' : 'var(--cyan)')
                                    : (accessory.premium ? 'rgba(255,214,102,0.5)' : '#333')
                                }`,
                                background: selectedAccessoryId === accessory.id
                                  ? (accessory.premium ? 'rgba(255,214,102,0.18)' : 'rgba(0,229,255,0.12)')
                                  : (accessory.premium ? 'rgba(255,214,102,0.08)' : 'rgba(255,255,255,0.02)'),
                                padding: '6px 4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PlayerAvatar
                                player={{ ...selectedAvatarPreview, id: `join-acc-opt-${accessory.id}`, accessoryId: accessory.id }}
                                size={44}
                                showName={false}
                                showState={false}
                              />
                            </button>
                          ))}
                        </div>
                        {isSelectedAccessoryPremium && (
                          <div style={{
                            marginTop: 2,
                            textAlign: 'center',
                            fontSize: 10,
                            letterSpacing: 2,
                            color: '#ffd666',
                            textShadow: '0 0 10px rgba(255,214,102,0.35)',
                          }}>
                            PREMIUM
                          </div>
                        )}
                      </>
                    )}
                  </div>

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
                    <PlayerAvatar player={toLobbyAvatarPlayer(p)} size={52} showName={false} showState={false} />
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

              {openVoicePlayerIds.length >= 2 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    border: '1px solid var(--green-dim)',
                    background: 'rgba(0,255,65,0.05)',
                  }}>
                    <div
                      className="pulse"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--green-neon)',
                        boxShadow: '0 0 6px var(--green-neon)',
                      }}
                    />
                    <span style={{ fontSize: 9, color: 'var(--green-dim)', letterSpacing: 1 }}>
                      VOZ ABIERTA
                    </span>
                  </div>

                  <button
                    onClick={toggleMic}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 14px',
                      border: `1px solid ${micMuted ? 'var(--red-danger)' : 'var(--green-dim)'}`,
                      background: micMuted ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,65,0.05)',
                      color: micMuted ? 'var(--red-danger)' : 'var(--green-dim)',
                      cursor: 'pointer',
                      fontSize: 10,
                      letterSpacing: 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {micMuted ? 'MIC OFF' : 'MIC ON'}
                  </button>
                </div>
              )}

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
                      {minigameOptions.map((minigame) => {
                        const disabled = globalScoreboard.length < minigame.minPlayers
                        return (
                          <label key={minigame.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: disabled ? 'var(--gray-shadow)' : 'var(--white)', cursor: disabled ? 'not-allowed' : 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedMinigameIds.includes(minigame.id)}
                              onChange={() => toggleMinigameSelection(minigame.id)}
                              disabled={disabled}
                            />
                            {minigame.name}
                            {disabled && <span style={{ fontSize: 9, color: 'var(--gray-shadow)' }}>(min {minigame.minPlayers})</span>}
                          </label>
                        )
                      })}
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

      {/* Global activity notifications - fixed at bottom */}
      {!hasJoined && globalNotifications.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 6,
          padding: '0 12px',
          pointerEvents: 'none',
        }}>
          <AnimatePresence>
            {globalNotifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                style={{
                  fontSize: 10,
                  color: 'var(--green-dim)',
                  padding: '4px 14px',
                  border: '1px solid rgba(0,255,65,0.15)',
                  background: 'rgba(6,10,16,0.85)',
                  letterSpacing: 0.5,
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  whiteSpace: 'normal',
                }}
              >
                <span style={{ color: 'var(--green-neon)' }}>{n.playerName}</span> {n.action}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
