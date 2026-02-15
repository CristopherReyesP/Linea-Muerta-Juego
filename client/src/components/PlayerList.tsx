import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { PlayerState } from '../types'

export function PlayerList() {
  const players = useGameStore(s => s.players)
  const playerId = useGameStore(s => s.playerId)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const bombState = useGameStore(s => s.bombState)
  const round = useGameStore(s => s.round)

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

  const isBombMinigame = activeMinigameId === 'la-bomba'
  const hideCabinNumber = activeMinigameId === 'adivina-linea'

  const cabinByPlayerId = useMemo(() => {
    const ids = players
      .filter((p) => p.state !== PlayerState.DISCONNECTED)
      .map((p) => p.id)
      .sort()

    const seedInput = `${activeMinigameId ?? 'unknown'}:${round}:${ids.join('|')}`
    let seed = 0
    for (let i = 0; i < seedInput.length; i++) {
      seed = (seed * 31 + seedInput.charCodeAt(i)) >>> 0
    }
    const random = mulberry32(seed || 1)
    const shuffled = [...ids]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      const tmp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = tmp
    }

    const map: Record<string, number> = {}
    shuffled.forEach((id, index) => {
      map[id] = index + 1
    })
    return map
  }, [players, activeMinigameId, round])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 12,
      background: 'linear-gradient(180deg, rgba(6,10,16,0.92), rgba(4,7,12,0.95))',
      borderLeft: '1px solid rgba(0,229,255,0.2)',
      boxShadow: 'inset 0 0 16px rgba(0,229,255,0.08)',
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

      {myPlayer && (
        <div
          style={{
            padding: 8,
            border: '1px solid var(--cyan)',
            background: 'rgba(0,229,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 0 12px rgba(0,229,255,0.2)',
          }}
        >
          <PlayerAvatar player={myPlayer} size={40} showName={false} showState={false} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{
              fontSize: 11,
              color: 'var(--white)',
              fontWeight: 'bold',
              letterSpacing: 0.6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              TU • {myPlayer.name}
            </span>
            <span style={{
              fontSize: 9,
              color: 'var(--gray-text)',
              letterSpacing: 1,
            }}>
              CABINA {hideCabinNumber ? '?' : (cabinByPlayerId[myPlayer.id] ?? '?')}
            </span>
            <span style={{
              fontSize: 9,
              color: getStatusColor(myPlayer),
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
            className={myPlayer.isShadow ? 'glitch-text' : ''}
            >
              {getStatusLabel(myPlayer, isBombMinigame, bombState?.holderId)}
            </span>
          </div>
        </div>
      )}

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
              fontWeight: 'bold',
              letterSpacing: 0.6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {player.name}
            </span>
            <span style={{
              fontSize: 9,
              color: 'var(--gray-text)',
              letterSpacing: 1,
            }}>
              CABINA {hideCabinNumber ? '?' : (cabinByPlayerId[player.id] ?? '?')}
            </span>
            <span style={{
              fontSize: 9,
              color: getStatusColor(player),
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
            className={player.isShadow ? 'glitch-text' : ''}
            >
              {getStatusLabel(player, isBombMinigame, bombState?.holderId)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function getStatusColor(player: { isShadow: boolean; state: PlayerState }) {
  if (player.isShadow) return 'var(--gray-shadow)'
  if (player.state === PlayerState.AT_RISK) return 'var(--red-danger)'
  return 'var(--green-neon)'
}

function getStatusLabel(
  player: { id: string; isShadow: boolean; state: PlayerState },
  isBombMinigame: boolean,
  bombHolderId?: string
) {
  if (isBombMinigame && bombHolderId === player.id) return 'TIENE BOMBA'
  if (player.isShadow) return 'SOMBRA'
  if (player.state === PlayerState.AT_RISK) return 'PELIGRO'
  if (player.state === PlayerState.IN_CALL) return 'EN LLAMADA'
  return 'ACTIVO'
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
