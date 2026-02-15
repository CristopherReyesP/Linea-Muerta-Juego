import { PlayerState, PlayerData } from '../types'
import { useGameStore } from '../store/gameStore'

interface Props {
  player: PlayerData
  size?: number
  showName?: boolean
  showState?: boolean
}

export function PlayerAvatar({ player, size = 60, showName = true, showState = true }: Props) {
  const activeMinigameId = useGameStore((s) => s.activeMinigameId)
  const hideIdentity = activeMinigameId === 'adivina-linea'
  const stateColor = getStateColor(player.state)
  const isShadow = player.isShadow
  const isAtRisk = player.state === PlayerState.AT_RISK
  const avatarId = player.avatarId ?? 'neon-eyes'
  const avatarColor = player.avatarColor ?? stateColor
  const accessoryId = player.accessoryId ?? 'none'
  const premiumAccessory = !hideIdentity && (accessoryId === 'neon-ears' || accessoryId === 'butterfly-wings' || accessoryId === 'angel-wings' || accessoryId === 'straw-hat')
  const outlineColor = hideIdentity ? '#1f2228' : avatarColor

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
      className={isShadow ? 'glitch' : isAtRisk ? 'pulse-red' : ''}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          overflow: premiumAccessory ? 'visible' : undefined,
          filter: isShadow ? 'grayscale(100%) brightness(0.5)' : 'none',
          opacity: player.state === PlayerState.DISCONNECTED ? 0.3 : 1,
        }}
      >
        {!hideIdentity && renderBackAccessory(accessoryId, avatarColor)}
        {/* Hood shape */}
        <path
          d="M50 6 L28 20 C18 28 13 42 13 57 L13 84 C13 90 18 95 24 95 L76 95 C82 95 87 90 87 84 L87 57 C87 42 82 28 72 20 L50 6Z"
          fill={hideIdentity ? '#0b0d11' : isShadow ? '#303030' : '#111826'}
          stroke={outlineColor}
          strokeWidth="2.4"
        />
        {/* Inner hood rim to separate hood from mask opening */}
        <path
          d="M50 15 C35 15 24 30 24 47 C24 63 31 76 39 84 L61 84 C69 76 76 63 76 47 C76 30 65 15 50 15Z"
          fill={hideIdentity ? '#0a0c10' : isShadow ? '#252525' : '#0f1625'}
          stroke={hideIdentity ? '#191c22' : isShadow ? '#4a4a4a' : 'rgba(180, 230, 255, 0.35)'}
          strokeWidth="1.4"
        />
        {/* Opening contour around mask */}
        <path
          d="M50 23 C38 23 30 35 30 50 C30 63 38 72 50 72 C62 72 70 63 70 50 C70 35 62 23 50 23Z"
          fill={hideIdentity ? '#050608' : '#06080c'}
          stroke={hideIdentity ? 'rgba(35, 40, 48, 0.6)' : 'rgba(120, 190, 235, 0.24)'}
          strokeWidth="1.2"
        />
        {/* Subtle center seam on hood */}
        <path d="M50 10 L50 28" stroke={hideIdentity ? 'rgba(60, 66, 76, 0.45)' : 'rgba(190, 235, 255, 0.18)'} strokeWidth="1" />
        {/* Face shadow / mask area */}
        <path d="M50 26 C36 26 28 38 28 51 C28 65 37 74 50 74 C63 74 72 65 72 51 C72 38 64 26 50 26Z" fill={hideIdentity ? '#030405' : '#07090d'} />
        {!hideIdentity && renderAccessory(accessoryId, avatarColor)}
        {!hideIdentity && renderFaceMark(avatarId, avatarColor, player.state === PlayerState.IN_CALL)}
      </svg>

      {showName && (
        <span style={{
          fontSize: 11,
          color: stateColor,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {player.name}
        </span>
      )}

      {showState && (
        <span style={{
          fontSize: 9,
          color: stateColor,
          fontWeight: 'bold',
          letterSpacing: 2,
        }}
        className={isShadow ? 'glitch-text' : ''}
        >
          {getStateLabel(player.state)}
        </span>
      )}
    </div>
  )
}

function renderBackAccessory(accessoryId: string, color: string) {
  if (accessoryId !== 'neon-ears' && accessoryId !== 'angel-wings' && accessoryId !== 'butterfly-wings') return null

  if (accessoryId === 'butterfly-wings') {
    return (
      <g
        opacity="1"
        transform="translate(50 58) scale(1.35) translate(-50 -58)"
        style={{ filter: 'drop-shadow(0 0 10px rgba(120, 220, 255, 0.65))' }}
      >
        <ellipse cx="50" cy="58" rx="52" ry="36" fill="rgba(120, 220, 255, 0.2)" />

        {/* Left butterfly wing */}
        <path
          d="M45 63 C22 62 6 50 5 34 C6 20 19 13 33 16 C42 18 48 27 49 38 C48 48 47 56 45 63 Z"
          fill="rgba(120, 220, 255, 0.62)"
          stroke="#b7f0ff"
          strokeWidth="1.5"
        />
        <path
          d="M45 63 C30 71 19 81 16 91 C20 97 33 97 44 89 C50 82 50 72 45 63 Z"
          fill="rgba(255, 138, 213, 0.52)"
          stroke="#ffd1ef"
          strokeWidth="1.35"
        />

        {/* Right butterfly wing */}
        <path
          d="M55 63 C78 62 94 50 95 34 C94 20 81 13 67 16 C58 18 52 27 51 38 C52 48 53 56 55 63 Z"
          fill="rgba(120, 220, 255, 0.62)"
          stroke="#b7f0ff"
          strokeWidth="1.5"
        />
        <path
          d="M55 63 C70 71 81 81 84 91 C80 97 67 97 56 89 C50 82 50 72 55 63 Z"
          fill="rgba(255, 138, 213, 0.52)"
          stroke="#ffd1ef"
          strokeWidth="1.35"
        />

        {/* Antenna hints visible above hood */}
        <path d="M47 24 C45 20 44 16 44 12" stroke="#b7f0ff" strokeWidth="1.2" fill="none" />
        <path d="M53 24 C55 20 56 16 56 12" stroke="#b7f0ff" strokeWidth="1.2" fill="none" />
        <circle cx="44" cy="11.5" r="1.4" fill="#fff2c2" />
        <circle cx="56" cy="11.5" r="1.4" fill="#fff2c2" />

        <circle cx="35" cy="48" r="2" fill="#fff2c2" opacity="0.85" />
        <circle cx="65" cy="48" r="2" fill="#fff2c2" opacity="0.85" />
      </g>
    )
  }

  return (
    <g
      opacity="1"
      transform="translate(50 57) scale(1.22) translate(-50 -57)"
      style={{ filter: 'drop-shadow(0 0 8px rgba(255, 240, 180, 0.62))' }}
    >
      {/* Back aura */}
      <ellipse cx="50" cy="57" rx="47" ry="33" fill="rgba(255, 240, 180, 0.22)" />
      <ellipse cx="50" cy="57" rx="34" ry="23" fill="rgba(180, 235, 255, 0.14)" />

      {/* Decorative rays */}
      <path d="M50 22 L50 10" stroke="#ffe9a8" strokeWidth="1.1" opacity="0.55" />
      <path d="M24 29 L14 19" stroke="#ffe9a8" strokeWidth="1" opacity="0.42" />
      <path d="M76 29 L86 19" stroke="#ffe9a8" strokeWidth="1" opacity="0.42" />

      {/* Large wings behind the hood */}
      <path
        d="M40 73 C11 68 1 48 5 20 C23 29 34 43 39 59 C38 44 40 26 47 16 C52 39 49 61 40 73 Z"
        fill="rgba(255,255,255,0.96)"
        stroke="#ffe9a8"
        strokeWidth="1.45"
      />
      <path
        d="M60 73 C89 68 99 48 95 20 C77 29 66 43 61 59 C62 44 60 26 53 16 C48 39 51 61 60 73 Z"
        fill="rgba(255,255,255,0.96)"
        stroke="#ffe9a8"
        strokeWidth="1.45"
      />

      {/* Feather lines */}
      <path d="M40 73 C30 67 21 58 15 46" stroke={color} strokeWidth="1.05" fill="none" opacity="0.72" />
      <path d="M40 73 C28 71 17 64 8 56" stroke={color} strokeWidth="1" fill="none" opacity="0.58" />
      <path d="M40 73 C27 73 14 71 5 69" stroke={color} strokeWidth="0.95" fill="none" opacity="0.45" />
      <path d="M60 73 C70 67 79 58 85 46" stroke={color} strokeWidth="1.05" fill="none" opacity="0.72" />
      <path d="M60 73 C72 71 83 64 92 56" stroke={color} strokeWidth="1" fill="none" opacity="0.58" />
      <path d="M60 73 C73 73 86 71 95 69" stroke={color} strokeWidth="0.95" fill="none" opacity="0.45" />
    </g>
  )
}

function renderAccessory(accessoryId: string, color: string) {
  switch (accessoryId) {
    case 'beanie':
      return (
        <g>
          <path d="M27 24 C31 12 40 5 50 5 C60 5 69 12 73 24 Z" fill="#1d2740" stroke={color} strokeWidth="1.9" />
          <rect x="27" y="22" width="46" height="10" rx="3.5" fill="#131d31" stroke={color} strokeWidth="1.5" />
          <circle cx="50" cy="14.5" r="2.2" fill={color} opacity="0.8" />
        </g>
      )
    case 'visor':
      return (
        <g>
          <rect x="29" y="14" width="42" height="10" rx="5" fill="#122039" stroke={color} strokeWidth="1.7" />
          <path d="M63 19 L78 24 L63 29 Z" fill="#1a2b47" stroke={color} strokeWidth="1.3" />
          <line x1="34" y1="19" x2="66" y2="19" stroke={color} strokeWidth="1" opacity="0.5" />
        </g>
      )
    case 'horns':
      return (
        <g>
          <path d="M31 24 L22 8 L36 15 Z" fill="#12131a" stroke={color} strokeWidth="1.5" />
          <path d="M69 24 L78 8 L64 15 Z" fill="#12131a" stroke={color} strokeWidth="1.5" />
          <path d="M36 20 L31 24" stroke={color} strokeWidth="1.1" opacity="0.5" />
          <path d="M64 20 L69 24" stroke={color} strokeWidth="1.1" opacity="0.5" />
        </g>
      )
    case 'pet-raven':
      return (
        <g>
          <circle cx="72" cy="17" r="9.5" fill="#0b0f18" stroke={color} strokeWidth="1.5" />
          <path d="M66 17 C66 13 69 10 73 10 C76 10 79 13 79 16 C79 21 76 23 73 23 C69 23 66 21 66 17 Z" fill="#141a26" opacity="0.7" />
          <circle cx="69.5" cy="15.5" r="1.5" fill={color} />
          <path d="M79.5 18 L87 20 L79.5 23 Z" fill={color} />
        </g>
      )
    case 'pet-cat':
      return (
        <g>
          <circle cx="72" cy="17" r="9.5" fill="#141d30" stroke={color} strokeWidth="1.5" />
          <path d="M65.5 12 L69 5.5 L72 13 Z" fill="#141d30" stroke={color} strokeWidth="1.25" />
          <path d="M72 13 L75 5.5 L78.5 12 Z" fill="#141d30" stroke={color} strokeWidth="1.25" />
          <circle cx="69.5" cy="17" r="1.3" fill={color} />
          <circle cx="74.5" cy="17" r="1.3" fill={color} />
          <path d="M72 19 L70.7 20.3 L72 21.2 L73.3 20.3 Z" fill={color} opacity="0.7" />
        </g>
      )
    case 'straw-hat':
      return (
        <g>
          <ellipse cx="50" cy="20.8" rx="31.5" ry="9.1" fill="#cfa251" stroke="#7a4e1f" strokeWidth="1.6" />
          <ellipse cx="50" cy="20.8" rx="25.5" ry="6.3" fill="none" stroke="#edcd88" strokeWidth="1" opacity="0.48" />
          <path d="M33 22 C33 12 40.8 6.2 50 6.2 C59.2 6.2 67 12 67 22 L67 24.8 C67 27.2 65.2 29.2 62.8 29.2 L37.2 29.2 C34.8 29.2 33 27.2 33 24.8 Z" fill="#deb86a" stroke="#7a4e1f" strokeWidth="1.5" />
          <path d="M34.6 17.3 C39.2 15.6 60.8 15.6 65.4 17.3 L65.4 22.2 C60.8 24 39.2 24 34.6 22.2 Z" fill="#b92f2f" />
          <path d="M35.4 16.9 C40.2 15.4 59.8 15.4 64.6 16.9" stroke="#f07e7e" strokeWidth="0.8" opacity="0.55" />
          <path d="M34.1 24.7 C39.5 26.1 60.5 26.1 65.9 24.7" stroke="#8a2222" strokeWidth="0.85" opacity="0.55" />
          <path d="M36 10.8 C40.8 8 59.2 8 64 10.8" stroke="#f4d89f" strokeWidth="1.1" fill="none" opacity="0.56" />
          <path d="M20 20.9 C28.8 24.7 71.2 24.7 80 20.9" stroke="#f1d28e" strokeWidth="1.15" fill="none" opacity="0.62" />
        </g>
      )
    case 'angel-wings':
      return null
    case 'none':
    default:
      return null
  }
}

function renderFaceMark(avatarId: string, color: string, animated: boolean) {
  const pulseAnim = animated ? (
    <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
  ) : null

  switch (avatarId) {
    case 'x-glow':
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round">
          <line x1="39" y1="40" x2="61" y2="62">{pulseAnim}</line>
          <line x1="61" y1="40" x2="39" y2="62">{pulseAnim}</line>
        </g>
      )
    case 'heart-core':
      return (
        <path
          d="M50 61 C34 50, 34 40, 42 38 C46 37, 48 39, 50 42 C52 39, 54 37, 58 38 C66 40, 66 50, 50 61Z"
          fill={color}
        >
          {pulseAnim}
        </path>
      )
    case 'circle-core':
      return (
        <circle cx="50" cy="50" r="10" fill="none" stroke={color} strokeWidth="3">
          {pulseAnim}
        </circle>
      )
    case 'square-core':
      return (
        <rect x="41" y="41" width="18" height="18" rx="2" fill="none" stroke={color} strokeWidth="3">
          {pulseAnim}
        </rect>
      )
    case 'skull-mask':
      return (
        <g fill={color}>
          <rect x="39" y="43" width="7" height="5" rx="1">{pulseAnim}</rect>
          <rect x="54" y="43" width="7" height="5" rx="1">{pulseAnim}</rect>
          <rect x="45" y="54" width="10" height="3" rx="1">{pulseAnim}</rect>
        </g>
      )
    case 'mask-jason':
      return (
        <g>
          <ellipse cx="50" cy="51" rx="18.5" ry="24.2" fill="rgba(255, 220, 130, 0.16)" />
          <path d="M50 26 C38.5 26 31 35 31 46 L31 58 C31 70.5 39.2 78.2 50 78.2 C60.8 78.2 69 70.5 69 58 L69 46 C69 35 61.5 26 50 26Z" fill="#f1ede2" stroke="#e7c36a" strokeWidth="1.9">
            {pulseAnim}
          </path>
          <ellipse cx="42.8" cy="50.3" rx="2.6" ry="2" fill="#0b0d12" />
          <ellipse cx="57.2" cy="50.3" rx="2.6" ry="2" fill="#0b0d12" />
          <rect x="46.8" y="57.2" width="6.4" height="6.2" rx="2.3" fill="#0b0d12" />
          <circle cx="50" cy="37.8" r="1.35" fill="#d93030" />
          <circle cx="38.8" cy="44.8" r="1.1" fill="#d93030" />
          <circle cx="61.2" cy="44.8" r="1.1" fill="#d93030" />
          <circle cx="40.8" cy="62.6" r="1.1" fill="#d93030" />
          <circle cx="59.2" cy="62.6" r="1.1" fill="#d93030" />
          <ellipse cx="50" cy="51" rx="18.7" ry="24.4" fill="none" stroke="#ffe7aa" strokeWidth="0.95" opacity="0.58" />
        </g>
      )
    case 'mask-anonymous':
      return (
        <g>
          {/* Premium glow */}
          <ellipse cx="50" cy="50" rx="22" ry="27" fill="rgba(140, 245, 220, 0.2)" />
          {/* Inverted-egg mask contour: flatter forehead, fuller lower face */}
          <path d="M50 24 C40 24 33 28 31 35 C30 39 30 44 30 49 C30 64 38 73 50 73 C62 73 70 64 70 49 C70 44 70 39 69 35 C67 28 60 24 50 24Z" fill="#f6f2eb" stroke="#72e9ce" strokeWidth="2">
            {pulseAnim}
          </path>

          {/* Cheeks */}
          <ellipse cx="40.8" cy="56.3" rx="3.1" ry="1.9" fill="#ff9fab" opacity="0.5" />
          <ellipse cx="59.2" cy="56.3" rx="3.1" ry="1.9" fill="#ff9fab" opacity="0.5" />

          {/* Brows (raised, separated) */}
          <path d="M36.8 43.4 C39.8 39.6 44.2 39.2 47.2 41.8" stroke="#0d1016" strokeWidth="2.05" fill="none" strokeLinecap="round" />
          <path d="M52.8 41.8 C55.8 39.2 60.2 39.6 63.2 43.4" stroke="#0d1016" strokeWidth="2.05" fill="none" strokeLinecap="round" />
          {/* Eye openings (dark slits) */}
          <path d="M40.1 47.8 C42.2 46.4 45 46.4 47.1 47.8 C45.2 49.4 42.2 49.4 40.1 47.8Z" fill="#05070a" />
          <path d="M52.9 47.8 C55 46.4 57.8 46.4 59.9 47.8 C57.8 49.4 54.8 49.4 52.9 47.8Z" fill="#05070a" />
          <path d="M40.1 47.8 C42.2 46.3 45 46.3 47.1 47.8" stroke="#0d1016" strokeWidth="0.9" fill="none" opacity="0.75" />
          <path d="M52.9 47.8 C55 46.3 57.8 46.3 59.9 47.8" stroke="#0d1016" strokeWidth="0.9" fill="none" opacity="0.75" />

          {/* Nose */}
          <path d="M50 50.3 C48.8 52.5 48.8 54.1 50 55.4 C51.2 54.1 51.2 52.5 50 50.3Z" fill="#0d1016" opacity="0.9" />

          {/* Moustache as thick strokes */}
          <path d="M40.5 59.2 C43.5 56.7 46.8 56.6 49.4 58.7" stroke="#0d1016" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M59.5 59.2 C56.5 56.7 53.2 56.6 50.6 58.7" stroke="#0d1016" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M49.4 58.7 L50.6 58.7" stroke="#0d1016" strokeWidth="1.8" strokeLinecap="round" />

          {/* Mouth/chin line and vertical goatee line */}
          <path d="M44.2 63.9 C47.1 65.4 52.9 65.4 55.8 63.9" stroke="#0d1016" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M50 64.6 L50 72.4" stroke="#0d1016" strokeWidth="2.2" strokeLinecap="round" />

          <path d="M34 52 C34 36 41 26 50 26 C59 26 66 36 66 52 C66 63 59 70 50 70 C41 70 34 63 34 52Z" fill="none" stroke="#b7fff0" strokeWidth="1.05" opacity="0.65" />
        </g>
      )
    case 'emoji-devil':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          😈{pulseAnim}
        </text>
      )
    case 'emoji-robot':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🤖{pulseAnim}
        </text>
      )
    case 'emoji-ghost':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          👻{pulseAnim}
        </text>
      )
    case 'emoji-skull':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          💀{pulseAnim}
        </text>
      )
    case 'emoji-brain':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🧠{pulseAnim}
        </text>
      )
    case 'emoji-fire':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🔥{pulseAnim}
        </text>
      )
    case 'emoji-alien':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          👽{pulseAnim}
        </text>
      )
    case 'emoji-mask':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🎭{pulseAnim}
        </text>
      )
    case 'emoji-owl':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🦉{pulseAnim}
        </text>
      )
    case 'emoji-crow':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🐦‍⬛{pulseAnim}
        </text>
      )
    case 'emoji-dog':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🐶{pulseAnim}
        </text>
      )
    case 'emoji-wizard':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🧙{pulseAnim}
        </text>
      )
    case 'emoji-vampire':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🧛{pulseAnim}
        </text>
      )
    case 'emoji-zombie':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🧟{pulseAnim}
        </text>
      )
    case 'emoji-ninja':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🥷{pulseAnim}
        </text>
      )
    case 'emoji-moon-face':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🌚{pulseAnim}
        </text>
      )
    case 'emoji-crystal':
      return (
        <text x="50" y="60" textAnchor="middle" fontSize="28">
          🔮{pulseAnim}
        </text>
      )
    case 'icon-triangle':
      return (
        <polygon points="50,36 64,62 36,62" fill="none" stroke={color} strokeWidth="3">
          {pulseAnim}
        </polygon>
      )
    case 'icon-bolt':
      return (
        <path d="M54 36 L43 50 L52 50 L46 64 L60 47 L52 47 Z" fill={color}>
          {pulseAnim}
        </path>
      )
    case 'icon-moon':
      return (
        <path d="M58 39 A12 12 0 1 0 58 61 A9 12 0 1 1 58 39Z" fill={color}>
          {pulseAnim}
        </path>
      )
    case 'icon-crosshair':
      return (
        <g stroke={color} strokeWidth="2" fill="none">
          <circle cx="50" cy="50" r="9">{pulseAnim}</circle>
          <line x1="50" y1="37" x2="50" y2="43">{pulseAnim}</line>
          <line x1="50" y1="57" x2="50" y2="63">{pulseAnim}</line>
          <line x1="37" y1="50" x2="43" y2="50">{pulseAnim}</line>
          <line x1="57" y1="50" x2="63" y2="50">{pulseAnim}</line>
        </g>
      )
    case 'icon-wand':
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round" fill="none">
          <line x1="38" y1="62" x2="61" y2="39">{pulseAnim}</line>
          <path d="M63 35 L65 40 L70 42 L65 44 L63 49 L61 44 L56 42 L61 40 Z" fill={color}>
            {pulseAnim}
          </path>
        </g>
      )
    case 'icon-star':
      return (
        <path d="M50 35 L54 45 L65 46 L56 53 L59 64 L50 58 L41 64 L44 53 L35 46 L46 45 Z" fill={color}>
          {pulseAnim}
        </path>
      )
    case 'neon-eyes':
    default:
      return (
        <g fill={color}>
          <rect x="36" y="46" width="10" height="3" rx="1">{pulseAnim}</rect>
          <rect x="54" y="46" width="10" height="3" rx="1">{pulseAnim}</rect>
        </g>
      )
  }
}

function getStateColor(state: PlayerState): string {
  switch (state) {
    case PlayerState.ACTIVE: return '#00ff41'
    case PlayerState.IN_CALL: return '#00e5ff'
    case PlayerState.DECIDING: return '#ffab00'
    case PlayerState.LOCKED: return '#00ff41'
    case PlayerState.AT_RISK: return '#ff1744'
    case PlayerState.SHADOW: return '#666666'
    case PlayerState.DISCONNECTED: return '#333333'
    case PlayerState.LOBBY: return '#888888'
    default: return '#888888'
  }
}

function getStateLabel(state: PlayerState): string {
  switch (state) {
    case PlayerState.ACTIVE: return 'ACTIVO'
    case PlayerState.IN_CALL: return 'EN LLAMADA'
    case PlayerState.DECIDING: return 'DECIDIENDO'
    case PlayerState.LOCKED: return 'LISTO'
    case PlayerState.AT_RISK: return 'PELIGRO'
    case PlayerState.SHADOW: return 'SOMBRA'
    case PlayerState.DISCONNECTED: return 'DESCONECTADO'
    case PlayerState.LOBBY: return 'LOBBY'
    default: return ''
  }
}
