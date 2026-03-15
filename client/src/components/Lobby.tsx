import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import lobbyImage from '../../lobby.png'
import { PlayerState, type PlayerData } from '../types'
import { useI18n } from '../i18n'

type LobbyView = 'welcome' | 'setup' | 'join'
type LobbyAction = 'create-private' | 'create-public' | 'join-public'
type CustomizeTab = 'masks' | 'accessories'
type MenuEmojiMemoryRound = {
  target: string
  options: string[]
  round: number
}
const DEV_MODE_STORAGE_KEY = 'lm_dev_mode'
const isLocalMachine = import.meta.env.DEV && typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname)

const menuEmojiPool = ['👁️', '🧠', '🕷️', '🧨', '🦷', '🦴', '🗝️', '📻', '🩸', '🫀', '🛸', '💀']

function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function createMenuEmojiRound(round: number): MenuEmojiMemoryRound {
  const options = shuffleItems(menuEmojiPool).slice(0, 4)
  const target = options[Math.floor(Math.random() * options.length)]
  return { target, options: shuffleItems(options), round }
}

interface Props {
  onCreateGame: (name: string, avatarId?: string, avatarColor?: string, accessoryId?: string, isPublic?: boolean) => void
  onJoinGame: (name: string, code: string, avatarId?: string, avatarColor?: string, accessoryId?: string) => void
  onStart: (data?: { selectedMinigameIds?: string[] }) => void
  onSendLobbyChat: (text: string) => void
  onSendMenuChat: (data: { name: string; text: string }) => void
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
  background: 'rgba(12, 16, 23, 0.82)',
  border: '1px solid rgba(150, 165, 186, 0.26)',
  color: '#e4ebf5',
  outline: 'none',
  textAlign: 'center',
  letterSpacing: 1.2,
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

export function Lobby({ onCreateGame, onJoinGame, onStart, onSendLobbyChat, onSendMenuChat }: Props) {
  const [view, setView] = useState<LobbyView>('welcome')
  const [pendingAction, setPendingAction] = useState<LobbyAction>('create-private')
  const [pendingPublicRoomId, setPendingPublicRoomId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState('neon-eyes')
  const [selectedAvatarColor, setSelectedAvatarColor] = useState('#00e5ff')
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('none')
  const [customizeTab, setCustomizeTab] = useState<CustomizeTab>('masks')
  const [devMode, setDevMode] = useState(() => {
    if (!isLocalMachine) return false
    return window.sessionStorage.getItem(DEV_MODE_STORAGE_KEY) === '1'
  })
  const [selectedMinigameIds, setSelectedMinigameIds] = useState<string[]>([])
  const [lobbyChatDraft, setLobbyChatDraft] = useState('')
  const [menuChatDraft, setMenuChatDraft] = useState('')
  const [showMenuChatModal, setShowMenuChatModal] = useState(false)
  const [unreadMenuChatCount, setUnreadMenuChatCount] = useState(0)
  const [menuChatNotifications, setMenuChatNotifications] = useState<Array<{ id: string; playerName: string; text: string }>>([])
  const [menuEmojiRound, setMenuEmojiRound] = useState<MenuEmojiMemoryRound>(() => createMenuEmojiRound(1))
  const [menuEmojiPhase, setMenuEmojiPhase] = useState<'showing' | 'guessing' | 'result'>('showing')
  const [menuEmojiResult, setMenuEmojiResult] = useState<{ correct: boolean; guessed: string } | null>(null)
  const [menuEmojiScore, setMenuEmojiScore] = useState(0)
  const [menuEmojiGuessSeconds, setMenuEmojiGuessSeconds] = useState(7)
  const gameId = useGameStore(s => s.gameId)
  const lobbyPlayers = useGameStore(s => s.lobbyPlayers)
  const lobbyChat = useGameStore(s => s.lobbyChat)
  const menuChat = useGameStore(s => s.menuChat)
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
  const publicRooms = useGameStore(s => s.publicRooms)
  const removeGlobalNotification = useGameStore(s => s.removeGlobalNotification)
  const isHost = playerId === hostId
  const hasJoined = !!playerId
  const connectedLobbyPlayers = lobbyPlayers.length > 0 ? lobbyPlayers : globalScoreboard
  const chatListRef = useRef<HTMLDivElement | null>(null)
  const menuChatListRef = useRef<HTMLDivElement | null>(null)
  const lastSeenMenuChatIdRef = useRef<string | null>(null)
  const initializedMenuChatRef = useRef(false)

  const playerNameById = useMemo(() => {
    return new Map(connectedLobbyPlayers.map((player) => [player.playerId, player.name]))
  }, [connectedLobbyPlayers])
  const { language, setLanguage, tr, trMinigameName } = useI18n()

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

  useEffect(() => {
    const hasExpiringRooms = publicRooms.some((room) => room.expiresAt !== null)
    if (!hasExpiringRooms) return

    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [publicRooms])

  useEffect(() => {
    if (!isLocalMachine) return

    if (devMode) {
      window.sessionStorage.setItem(DEV_MODE_STORAGE_KEY, '1')
      return
    }

    window.sessionStorage.removeItem(DEV_MODE_STORAGE_KEY)
  }, [devMode])

  useEffect(() => {
    if (hasJoined || view !== 'welcome') {
      setShowMenuChatModal(false)
    }
  }, [hasJoined, view])

  useEffect(() => {
    if (showMenuChatModal) {
      lastSeenMenuChatIdRef.current = menuChat[menuChat.length - 1]?.id ?? null
      setUnreadMenuChatCount(0)
      return
    }

    const latestMessage = menuChat[menuChat.length - 1]
    if (!latestMessage) return

    if (!initializedMenuChatRef.current) {
      initializedMenuChatRef.current = true
      lastSeenMenuChatIdRef.current = latestMessage.id
      return
    }

    if (latestMessage.id === lastSeenMenuChatIdRef.current) return
    setUnreadMenuChatCount((count) => count + 1)
    setMenuChatNotifications((items) => [
      {
        id: latestMessage.id,
        playerName: latestMessage.playerName,
        text: tr('escribio en el chat'),
      },
      ...items,
    ].slice(0, 3))
  }, [menuChat, showMenuChatModal, tr])

  useEffect(() => {
    if (menuChatNotifications.length === 0) return
    const timers = menuChatNotifications.map((notification) =>
      setTimeout(() => {
        setMenuChatNotifications((items) => items.filter((item) => item.id !== notification.id))
      }, 5000)
    )
    return () => timers.forEach(clearTimeout)
  }, [menuChatNotifications])

  useEffect(() => {
    const element = chatListRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [lobbyChat.length])

  useEffect(() => {
    const element = menuChatListRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [menuChat.length])

  useEffect(() => {
    if (!hasJoined) return

    if (menuEmojiPhase === 'showing') {
      const timer = setTimeout(() => setMenuEmojiPhase('guessing'), 350)
      return () => clearTimeout(timer)
    }

    if (menuEmojiPhase === 'guessing') {
      setMenuEmojiGuessSeconds(7)

      const countdown = setInterval(() => {
        setMenuEmojiGuessSeconds((current) => {
          if (current <= 1) {
            clearInterval(countdown)
            setMenuEmojiResult({ correct: false, guessed: 'TIEMPO' })
            setMenuEmojiScore((score) => Math.max(0, score - 1))
            setMenuEmojiPhase('result')
            return 0
          }

          return current - 1
        })
      }, 1000)

      return () => clearInterval(countdown)
    }

    if (menuEmojiPhase === 'result') {
      const timer = setTimeout(() => {
        setMenuEmojiResult(null)
        setMenuEmojiRound((current) => createMenuEmojiRound(current.round + 1))
        setMenuEmojiGuessSeconds(7)
        setMenuEmojiPhase('showing')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [hasJoined, menuEmojiPhase])

  const handleCreate = (isPublic: boolean = false) => {
    if (!name.trim()) return
    onCreateGame(name.trim(), selectedAvatarId, selectedAvatarColor, selectedAccessoryId, isPublic)
  }

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return
    onJoinGame(name.trim(), roomCode.trim(), selectedAvatarId, selectedAvatarColor, selectedAccessoryId)
  }

  const handleJoinPublicRoom = (publicGameId: string) => {
    if (!name.trim()) return
    onJoinGame(name.trim(), publicGameId, selectedAvatarId, selectedAvatarColor, selectedAccessoryId)
  }

  const handleSendLobbyChat = () => {
    const message = lobbyChatDraft.trim()
    if (!message) return
    onSendLobbyChat(message)
    setLobbyChatDraft('')
  }

  const handleSendMenuChat = () => {
    const normalizedName = name.trim()
    const normalizedText = menuChatDraft.trim()
    if (!normalizedName || !normalizedText) return
    onSendMenuChat({ name: normalizedName, text: normalizedText })
    setMenuChatDraft('')
  }

  const handleMenuEmojiGuess = (emoji: string) => {
    if (menuEmojiPhase !== 'guessing') return

    const correct = emoji === menuEmojiRound.target
    setMenuEmojiResult({ correct, guessed: emoji })
    setMenuEmojiScore((score) => Math.max(0, score + (correct ? 1 : -1)))
    setMenuEmojiPhase('result')
  }

  const openSetupForAction = (action: LobbyAction, publicRoomId?: string) => {
    setPendingAction(action)
    setPendingPublicRoomId(publicRoomId ?? null)
    setView('setup')
  }

  const handleSetupSubmit = () => {
    if (pendingAction === 'create-private') {
      handleCreate(false)
      return
    }

    if (pendingAction === 'create-public') {
      handleCreate(true)
      return
    }

    if (pendingAction === 'join-public' && pendingPublicRoomId) {
      handleJoinPublicRoom(pendingPublicRoomId)
    }
  }

  const setupTitle =
    pendingAction === 'create-private'
      ? tr('CREAR SALA PRIVADA')
      : pendingAction === 'create-public'
        ? tr('CREAR SALA PUBLICA')
        : tr('UNIRSE A SALA PUBLICA')

  const formatRemainingTime = (expiresAt: number | null) => {
    if (!expiresAt) return null

    const remainingMs = Math.max(0, expiresAt - now)
    const totalSeconds = Math.ceil(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const getPublicRoomColors = (colorVariant: number) => {
    const palettes = [
      {
        border: 'rgba(0,229,255,0.24)',
        background: 'rgba(0,229,255,0.06)',
        text: 'var(--cyan)',
      },
      {
        border: 'rgba(132, 152, 178, 0.28)',
        background: 'rgba(132, 152, 178, 0.08)',
        text: '#c8d4e3',
      },
      {
        border: 'rgba(120, 148, 128, 0.28)',
        background: 'rgba(120, 148, 128, 0.08)',
        text: '#c7d6c8',
      },
    ]

    return palettes[colorVariant % palettes.length]
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
    border: '1px solid rgba(140, 155, 176, 0.24)',
    background: 'linear-gradient(180deg, rgba(10,14,20,0.84), rgba(9,12,18,0.94))',
    backdropFilter: 'blur(10px)',
    boxShadow: `
      0 24px 60px rgba(0,0,0,0.58),
      0 8px 24px rgba(4,8,14,0.36),
      inset 0 1px 0 rgba(255,255,255,0.05),
      inset 0 0 0 1px rgba(255,255,255,0.02)
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
                color: '#f1f5fb',
                letterSpacing: 4,
                textShadow: '0 2px 12px rgba(0,0,0,0.28)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              LINEA MUERTA
            </motion.h1>
            {!hasJoined && view === 'welcome' && (
              <div style={{
                fontSize: 11,
                color: 'var(--green-dim)',
                letterSpacing: 4,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}>
                {tr('Confia en la linea.')}
              </div>
            )}
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
                {tr(error)}
              </motion.div>
            )}
          </AnimatePresence>

          {!connected && (
            <div style={{ fontSize: 10, color: 'var(--red-danger)' }}>
              {tr('Conectando al servidor...')}
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
                  <div style={{
                    width: '100%',
                    maxWidth: 420,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: -4,
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      border: '1px solid rgba(140,155,176,0.18)',
                      background: 'rgba(0,0,0,0.18)',
                    }}>
                      {(['es', 'en'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          style={{
                            border: 'none',
                            background: language === lang ? 'rgba(0,229,255,0.12)' : 'transparent',
                            color: language === lang ? 'var(--cyan)' : 'var(--gray-text)',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: 10,
                            letterSpacing: 1.4,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    maxWidth: 420,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    alignItems: 'center',
                  }}>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value.slice(0, 15))}
                      placeholder={tr('Tu nombre')}
                      maxLength={15}
                      autoFocus
                      style={inputStyle}
                    />
                  </div>

                  <div style={{
                    width: '100%',
                    maxWidth: 420,
                    display: 'grid',
                    gap: 8,
                    marginTop: 4,
                  }}>
                    <button
                      className="btn btn-green"
                      onClick={() => openSetupForAction('create-private')}
                      style={{ width: '100%', fontSize: 14, minHeight: 46 }}
                    >
                      {tr('CREAR SALA')}
                    </button>
                    <button
                      className="btn btn-cyan"
                      onClick={() => setView('join')}
                      style={{ width: '100%', fontSize: 14, minHeight: 46 }}
                    >
                      {tr('UNIRSE CON CODIGO')}
                    </button>
                  </div>

                  <div style={{
                    width: '100%',
                    maxWidth: 420,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: 10,
                    border: '1px solid rgba(140,155,176,0.14)',
                    background: 'rgba(0,0,0,0.22)',
                  }}>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--gray-text)',
                      letterSpacing: 1.6,
                      textAlign: 'left',
                    }}>
                      {tr('Salas publicas')}
                    </div>

                    {publicRooms.length === 0 ? (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--gray-shadow)',
                        textAlign: 'center',
                        lineHeight: 1.5,
                      }}>
                        {tr('No hay salas publicas abiertas ahora mismo.')}
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        maxHeight: 148,
                        overflowY: 'auto',
                      }}>
                        {publicRooms.map((room) => (
                          (() => {
                            const roomColors = getPublicRoomColors(room.colorVariant)

                            return (
                              <button
                                key={room.gameId}
                                type="button"
                                onClick={() => openSetupForAction('join-public', room.gameId)}
                                style={{
                                  width: '100%',
                                  border: `1px solid ${roomColors.border}`,
                                  background: roomColors.background,
                                  color: roomColors.text,
                                  padding: '8px 10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                }}
                              >
                                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left' }}>
                                  <span style={{ fontSize: 11, letterSpacing: 1 }}>
                                    {room.hostName}
                                  </span>
                                  {room.expiresAt !== null && (
                                    <span style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 1.2 }}>
                                      Expira en {formatRemainingTime(room.expiresAt)}
                                    </span>
                                  )}
                                  {room.isGeneral && (
                                    <span style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 1.2 }}>
                                      {tr('disponible siempre mientras este en lobby')}
                                    </span>
                                  )}
                                </span>
                                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                  <span style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 1.5 }}>
                                    {room.playerCount}/{room.maxPlayers}
                                  </span>
                                  {room.playerCount === 0 && (
                                    <span style={{ fontSize: 9, color: 'var(--gray-shadow)', letterSpacing: 1.2 }}>
                                      {tr('sala vacia')}
                                    </span>
                                  )}
                                </span>
                              </button>
                            )
                          })()
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{
                    width: '100%',
                    maxWidth: 420,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <button
                      type="button"
                      className="btn btn-cyan"
                      onClick={() => setShowMenuChatModal(true)}
                      style={{
                        width: '100%',
                        fontSize: 12,
                        minHeight: 38,
                        position: 'relative',
                      }}
                    >
                      {tr('ABRIR CHAT PRINCIPAL')}
                      {unreadMenuChatCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: 6,
                          right: 8,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 999,
                          padding: '0 4px',
                          background: 'var(--red-danger)',
                          color: 'var(--white)',
                          fontSize: 9,
                          lineHeight: '16px',
                          textAlign: 'center',
                          letterSpacing: 0,
                          boxShadow: '0 0 10px rgba(255,23,68,0.35)',
                        }}>
                          {unreadMenuChatCount > 9 ? '9+' : unreadMenuChatCount}
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'setup' && (
                <motion.div
                  key="setup"
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
                    color: pendingAction === 'join-public' ? 'var(--cyan)' : 'var(--green-dim)',
                    letterSpacing: 3,
                  }}>
                    {setupTitle}
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value.slice(0, 15))}
                    onKeyDown={e => e.key === 'Enter' && handleSetupSubmit()}
                    placeholder={tr('Tu nombre')}
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
                      {tr('ELIGE TU AVATAR')}
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
                        {tr('MASCARAS')}
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
                        {tr('ACCESORIOS')}
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
                            {tr('PREMIUM')}
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
                            {tr('PREMIUM')}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      className={pendingAction === 'join-public' ? 'btn btn-cyan' : 'btn btn-green'}
                      onClick={handleSetupSubmit}
                      disabled={!name.trim()}
                    >
                      {pendingAction === 'join-public' ? tr('UNIRSE') : tr('CONTINUAR')}
                    </button>
                    <button
                      className="btn btn-red"
                      onClick={() => {
                        setPendingPublicRoomId(null)
                        setView('welcome')
                      }}
                      style={{ fontSize: 12 }}
                    >
                      {tr('VOLVER')}
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
                    {tr('UNIRSE A SALA')}
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={tr('Tu nombre')}
                    maxLength={15}
                    autoFocus
                    style={inputStyle}
                  />

                  <input
                    type="text"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder={tr('Codigo de sala...')}
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
                      {tr('ELIGE TU AVATAR')}
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
                        {tr('MASCARAS')}
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
                        {tr('ACCESORIOS')}
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
                            {tr('PREMIUM')}
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
                            {tr('PREMIUM')}
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
                      {tr('UNIRSE')}
                    </button>
                    <button
                      className="btn btn-red"
                      onClick={() => setView('welcome')}
                      style={{ fontSize: 12 }}
                    >
                      {tr('VOLVER')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {!hasJoined && view === 'welcome' && showMenuChatModal && (
            <div
              onClick={() => setShowMenuChatModal(false)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                background: 'rgba(4, 7, 12, 0.72)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: 'min(460px, 100%)',
                  maxHeight: 'min(80vh, 680px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: 16,
                  border: '1px solid rgba(140, 155, 176, 0.24)',
                  background: 'linear-gradient(180deg, rgba(11,15,22,0.96), rgba(8,12,18,0.98))',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--green-neon)',
                    letterSpacing: 2,
                  }}>
                    {tr('CHAT PRINCIPAL')}
                  </div>
                  <button
                    type="button"
                    className="btn btn-red"
                    onClick={() => setShowMenuChatModal(false)}
                    style={{ padding: '6px 14px', fontSize: 11 }}
                  >
                    {tr('CERRAR')}
                  </button>
                </div>

                <div style={{ fontSize: 10, color: 'var(--gray-text)', lineHeight: 1.5 }}>
                  {tr('Los mensajes aparecen aqui. Puedes pedir codigo, avisar que vas a crear sala o decir a cual entraran.')}
                </div>

                {globalStats && (
                  <div style={{
                    fontSize: 10,
                    color: 'var(--gray-shadow)',
                    lineHeight: 1.5,
                  }}>
                    {language === 'en'
                      ? `${globalStats.totalActivePlayers} active in game · ${globalStats.totalLobbyPlayers} in lobby`
                      : `${globalStats.totalActivePlayers} activo${globalStats.totalActivePlayers !== 1 ? 's' : ''} en partida · ${globalStats.totalLobbyPlayers} en lobby`}
                  </div>
                )}

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 15))}
                  placeholder={tr('Tu nombre')}
                  maxLength={15}
                  style={{
                    ...inputStyle,
                    width: '100%',
                    textAlign: 'left',
                    letterSpacing: 0.5,
                    padding: '10px 12px',
                  }}
                />

                <div
                  ref={menuChatListRef}
                  style={{
                    minHeight: 180,
                    maxHeight: 320,
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.22)',
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {menuChat.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--gray-shadow)', lineHeight: 1.5 }}>
                      {tr('Aun no hay mensajes en el chat principal.')}
                    </div>
                  ) : (
                    menuChat.map((message) => {
                      const isOwnMessage = message.playerName === name.trim()

                      return (
                        <div key={message.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{
                            fontSize: 10,
                            color: isOwnMessage ? 'var(--green-neon)' : 'var(--cyan)',
                            letterSpacing: 1,
                          }}>
                            {message.playerName.toUpperCase()}
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: 'var(--white)',
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                          }}>
                            {message.text}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={menuChatDraft}
                    onChange={(e) => setMenuChatDraft(e.target.value.slice(0, 140))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMenuChat()
                      }
                    }}
                    placeholder={name.trim() ? tr('Escribe al chat principal...') : tr('Escribe tu nombre para enviar mensajes')}
                    style={{
                      ...inputStyle,
                      width: '100%',
                      textAlign: 'left',
                      letterSpacing: 0.5,
                      padding: '10px 12px',
                    }}
                  />
                  <button
                    className="btn btn-green"
                    onClick={handleSendMenuChat}
                    disabled={!name.trim() || !menuChatDraft.trim()}
                    style={{ minWidth: 92 }}
                  >
                    {tr('ENVIAR')}
                  </button>
                </div>
              </div>
            </div>
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
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: 12,
                width: '100%',
                maxWidth: 520,
              }}>
                {connectedLobbyPlayers.map(p => (
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
                {connectedLobbyPlayers.length} jugador{connectedLobbyPlayers.length !== 1 ? 'es' : ''} conectado{connectedLobbyPlayers.length !== 1 ? 's' : ''}
              </div>

              <div style={{
                width: 'min(520px, 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 10,
                border: '1px solid rgba(140,155,176,0.14)',
                background: 'rgba(0,0,0,0.18)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 1.4 }}>
                    Minijuego de espera
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--gray-text)' }}>
                    {menuEmojiPhase === 'guessing' ? `${menuEmojiGuessSeconds}s` : `score ${menuEmojiScore}`}
                  </div>
                </div>

                <div style={{
                  minHeight: 48,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'linear-gradient(180deg, rgba(0,229,255,0.05), rgba(0,0,0,0.16))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                }}>
                  {menuEmojiPhase === 'showing' && (
                    <div className="broadcast-pop" style={{ fontSize: 24 }}>
                      {menuEmojiRound.target}
                    </div>
                  )}

                  {menuEmojiPhase === 'guessing' && (
                    <div style={{ fontSize: 9, color: 'var(--gray-text)', textAlign: 'center', lineHeight: 1.4 }}>
                      ¿Cual fue?
                    </div>
                  )}

                  {menuEmojiPhase === 'result' && menuEmojiResult && (
                    <div style={{
                      fontSize: 9,
                      color: menuEmojiResult.correct ? 'var(--green-neon)' : 'var(--red-danger)',
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}>
                      {menuEmojiResult.correct ? 'Bien' : menuEmojiRound.target}
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: 6,
                }}>
                  {menuEmojiRound.options.map((emoji) => (
                    <button
                      key={`${menuEmojiRound.round}-${emoji}`}
                      type="button"
                      onClick={() => handleMenuEmojiGuess(emoji)}
                      disabled={menuEmojiPhase !== 'guessing'}
                      style={{
                        border: `1px solid ${
                          menuEmojiPhase === 'result' && emoji === menuEmojiRound.target
                            ? 'var(--green-neon)'
                            : 'rgba(0,229,255,0.18)'
                        }`,
                        background: menuEmojiPhase === 'guessing'
                          ? 'rgba(0,229,255,0.06)'
                          : 'rgba(255,255,255,0.03)',
                        color: 'var(--white)',
                        minHeight: 34,
                        cursor: menuEmojiPhase === 'guessing' ? 'pointer' : 'default',
                        fontSize: 18,
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                width: 'min(520px, 100%)',
                border: '1px solid rgba(0,229,255,0.22)',
                background: 'rgba(6, 10, 16, 0.82)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 12,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 2 }}>
                    CHAT DEL LOBBY
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--gray-shadow)', letterSpacing: 1 }}>
                    para coordinar sala o mientras esperan
                  </div>
                </div>

                <div
                  ref={chatListRef}
                  style={{
                    minHeight: 110,
                    maxHeight: 170,
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.22)',
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {lobbyChat.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--gray-shadow)', lineHeight: 1.5 }}>
                      Todavia no hay mensajes. Puedes decir en que sala vas, avisar que faltan jugadores o romper el hielo.
                    </div>
                  ) : (
                    lobbyChat.map((message) => {
                      const isOwnMessage = message.playerId === playerId
                      const currentName = playerNameById.get(message.playerId) ?? message.playerName

                      return (
                        <div key={message.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{
                            fontSize: 10,
                            color: isOwnMessage ? 'var(--green-neon)' : 'var(--cyan)',
                            letterSpacing: 1,
                          }}>
                            {isOwnMessage ? 'TU' : currentName.toUpperCase()}
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: 'var(--white)',
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                          }}>
                            {message.text}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={lobbyChatDraft}
                    onChange={(e) => setLobbyChatDraft(e.target.value.slice(0, 140))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendLobbyChat()
                      }
                    }}
                    placeholder="Escribe algo corto..."
                    style={{
                      ...inputStyle,
                      width: '100%',
                      textAlign: 'left',
                      letterSpacing: 0.5,
                      padding: '10px 12px',
                    }}
                  />
                  <button
                    className="btn btn-cyan"
                    onClick={handleSendLobbyChat}
                    disabled={!lobbyChatDraft.trim()}
                    style={{ minWidth: 92 }}
                  >
                    ENVIAR
                  </button>
                </div>
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
                  {isLocalMachine && (
                    <>
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
                            const disabled = connectedLobbyPlayers.length < minigame.minPlayers
                            return (
                              <label key={minigame.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: disabled ? 'var(--gray-shadow)' : 'var(--white)', cursor: disabled ? 'not-allowed' : 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedMinigameIds.includes(minigame.id)}
                                  onChange={() => toggleMinigameSelection(minigame.id)}
                                  disabled={disabled}
                                />
                                {trMinigameName(minigame.id, minigame.name)}
                                {disabled && <span style={{ fontSize: 9, color: 'var(--gray-shadow)' }}>(min {minigame.minPlayers})</span>}
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}

                  <button
                    className="btn btn-green"
                    onClick={() => onStart(devMode ? { selectedMinigameIds } : undefined)}
                    disabled={connectedLobbyPlayers.length < 2 || (devMode && selectedMinigameIds.length === 0)}
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

              {isHost && connectedLobbyPlayers.length < 2 && (
                <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>
                  Comparte el codigo para que otros se unan
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {!hasJoined && connected && globalStats && (
        <div style={{
          position: 'absolute',
          top: 18,
          right: 18,
          zIndex: 8,
          padding: '5px 10px',
          border: '1px solid rgba(140,155,176,0.16)',
          background: 'rgba(5,10,16,0.46)',
          color: 'var(--gray-text)',
          fontSize: 9,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          backdropFilter: 'blur(6px)',
        }}>
          {language === 'en'
            ? `${globalStats.totalPlayers} connected`
            : `${globalStats.totalPlayers} conectado${globalStats.totalPlayers !== 1 ? 's' : ''}`}
        </div>
      )}

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
                <span style={{ color: 'var(--green-neon)' }}>{n.playerName}</span> {tr(n.action)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!hasJoined && menuChatNotifications.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 96,
          left: 0,
          right: 0,
          zIndex: 11,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 6,
          padding: '0 12px',
          pointerEvents: 'none',
        }}>
          <AnimatePresence>
            {menuChatNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: 10,
                  color: 'var(--cyan)',
                  padding: '4px 14px',
                  border: '1px solid rgba(0,229,255,0.16)',
                  background: 'rgba(6,10,16,0.86)',
                  letterSpacing: 0.5,
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  whiteSpace: 'normal',
                }}
              >
                <span style={{ color: 'var(--white)' }}>{notification.playerName}</span> {notification.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
