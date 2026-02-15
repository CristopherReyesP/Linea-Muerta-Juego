import { PlayerState, PlayerData } from '../types'

interface Props {
  player: PlayerData
  size?: number
  showName?: boolean
  showState?: boolean
}

export function PlayerAvatar({ player, size = 60, showName = true, showState = true }: Props) {
  const stateColor = getStateColor(player.state)
  const isShadow = player.isShadow
  const isAtRisk = player.state === PlayerState.AT_RISK

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
          filter: isShadow ? 'grayscale(100%) brightness(0.5)' : 'none',
          opacity: player.state === PlayerState.DISCONNECTED ? 0.3 : 1,
        }}
      >
        {/* Hood shape */}
        <path
          d="M50 10 C25 10, 15 35, 15 55 L15 85 C15 90, 20 95, 25 95 L75 95 C80 95, 85 90, 85 85 L85 55 C85 35, 75 10, 50 10Z"
          fill={isShadow ? '#333' : '#1a1a2e'}
          stroke={stateColor}
          strokeWidth="2"
        />
        {/* Face shadow */}
        <ellipse cx="50" cy="50" rx="22" ry="18" fill="#0a0a0a" />
        {/* Eyes */}
        <rect x="36" y="46" width="10" height="3" fill={stateColor} rx="1">
          {player.state === PlayerState.IN_CALL && (
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          )}
        </rect>
        <rect x="54" y="46" width="10" height="3" fill={stateColor} rx="1">
          {player.state === PlayerState.IN_CALL && (
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          )}
        </rect>
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
