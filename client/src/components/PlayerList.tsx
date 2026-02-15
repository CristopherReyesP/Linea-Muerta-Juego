import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { PlayerState } from '../types'

export function PlayerList() {
  const players = useGameStore(s => s.players)
  const playerId = useGameStore(s => s.playerId)

  const sortedPlayers = [...players]
    .filter(p => p.id !== playerId)
    .sort((a, b) => {
      // Active first, then at_risk, then shadow, then disconnected
      const order: Record<string, number> = {
        [PlayerState.ACTIVE]: 0,
        [PlayerState.IN_CALL]: 0,
        [PlayerState.DECIDING]: 0,
        [PlayerState.LOCKED]: 0,
        [PlayerState.AT_RISK]: 1,
        [PlayerState.SHADOW]: 2,
        [PlayerState.DISCONNECTED]: 3,
      }
      return (order[a.state] ?? 4) - (order[b.state] ?? 4)
    })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 12,
      background: 'rgba(0,0,0,0.5)',
      borderLeft: '1px solid #222',
      minWidth: 140,
      maxHeight: '100%',
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 10,
        color: 'var(--gray-text)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        JUGADORES
      </div>

      {sortedPlayers.map(player => (
        <div
          key={player.id}
          style={{
            padding: 8,
            border: `1px solid ${player.state === PlayerState.AT_RISK ? 'var(--red-danger)' : player.isShadow ? 'var(--gray-shadow)' : '#222'}`,
            background: 'var(--bg-panel)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          className={player.state === PlayerState.AT_RISK ? 'pulse-red' : ''}
        >
          <PlayerAvatar player={player} size={40} showName={false} showState={false} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{
              fontSize: 11,
              color: 'var(--white)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {player.name}
            </span>
            <span style={{
              fontSize: 9,
              color: player.isShadow ? 'var(--gray-shadow)' : player.state === PlayerState.AT_RISK ? 'var(--red-danger)' : 'var(--green-neon)',
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
            className={player.isShadow ? 'glitch-text' : ''}
            >
              {player.isShadow ? 'SOMBRA' : player.state === PlayerState.AT_RISK ? 'PELIGRO' :
                player.state === PlayerState.IN_CALL ? 'EN LLAMADA' : 'ACTIVO'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
