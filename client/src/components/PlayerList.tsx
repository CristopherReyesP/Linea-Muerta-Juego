import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './PlayerAvatar'
import { ScrollHintBox } from './ScrollHintBox'
import { GamePhase, PlayerState } from '../types'

const SIGNAL_OPTIONS = [
  { emoji: '👀', label: 'OJO' },
  { emoji: '⚠️', label: 'CUIDADO' },
  { emoji: '🤝', label: 'CONFIA' },
  { emoji: '❌', label: 'MENTIRA' },
  { emoji: '❓', label: 'DUDA' },
  { emoji: '🔥', label: 'TENSION' },
  { emoji: '🧨', label: 'PELIGRO' },
  { emoji: '📡', label: 'ESCUCHEN' },
]

interface Props {
  onSendSignal: (data: { emoji: string; label: string }) => void
  mobile?: boolean
  onCallPlayer?: (targetId: string) => void
  onAcceptCall?: (callId: string) => void
  onRejectCall?: (callId: string) => void
  onHangUp?: () => void
}

export function PlayerList({
  onSendSignal,
  mobile = false,
  onCallPlayer,
  onAcceptCall,
  onRejectCall,
  onHangUp,
}: Props) {
  const players = useGameStore(s => s.players)
  const playerId = useGameStore(s => s.playerId)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const phase = useGameStore(s => s.phase)
  const bombState = useGameStore(s => s.bombState)
  const round = useGameStore(s => s.round)
  const playerSignals = useGameStore(s => s.playerSignals)
  const latestSignal = useGameStore(s => s.latestSignal)
  const signalHistory = useGameStore(s => s.signalHistory)
  const incomingCalls = useGameStore(s => s.incomingCalls)
  const pendingCall = useGameStore(s => s.pendingCall)
  const activeCallPeerId = useGameStore(s => s.activeCallPeerId)

  const [signalPickerOpen, setSignalPickerOpen] = useState(false)
  const [signalCooldownUntil, setSignalCooldownUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [signalAlertActive, setSignalAlertActive] = useState(false)

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
  const isGuessMinigame = activeMinigameId === 'adivina-linea'
  const hideCabinNumber = activeMinigameId === 'adivina-linea'
  const signalCooldownRemaining = Math.max(0, Math.ceil((signalCooldownUntil - now) / 1000))
  const canUseSidebarCalls = Boolean(onCallPlayer && onAcceptCall && onRejectCall && onHangUp) && phase === GamePhase.CALL_PHASE

  useEffect(() => {
    if (signalCooldownUntil <= Date.now()) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [signalCooldownUntil])

  useEffect(() => {
    if (!latestSignal) return
    setSignalAlertActive(true)
    const timer = window.setTimeout(() => setSignalAlertActive(false), 2600)
    return () => window.clearTimeout(timer)
  }, [latestSignal])

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

  const canCallTarget = (player: typeof players[number]) => {
    if (!canUseSidebarCalls || !myPlayer) return false
    if (player.id === myPlayer.id) return false
    if (player.state === PlayerState.DISCONNECTED || player.state === PlayerState.IN_CALL) return false
    if (!player.isAlive && !player.isShadow) return false
    if (activeCallPeerId || pendingCall) return false
    return myPlayer.state === PlayerState.ACTIVE || myPlayer.state === PlayerState.AT_RISK || myPlayer.isShadow
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: mobile ? 'row' : 'column',
      alignItems: mobile ? 'stretch' : 'initial',
      gap: mobile ? 6 : 8,
      padding: mobile ? 8 : 12,
      background: 'linear-gradient(180deg, rgba(6,10,16,0.92), rgba(4,7,12,0.95))',
      borderLeft: mobile ? 'none' : '1px solid rgba(0,229,255,0.2)',
      borderBottom: mobile ? '1px solid rgba(0,229,255,0.16)' : 'none',
      boxShadow: 'inset 0 0 16px rgba(0,229,255,0.08)',
      minWidth: mobile ? 0 : 304,
      width: mobile ? '100%' : 304,
      maxHeight: mobile ? 98 : '100%',
      overflow: 'hidden',
    }}>
      {mobile ? (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 6,
        flex: '0 0 auto',
        overflowX: 'auto',
      }}>
        <div style={{
          fontSize: 8,
          color: 'var(--gray-text)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 4,
          minWidth: 54,
          paddingTop: 18,
        }}>
          RED
        </div>

        {myPlayer && (
          <div
            style={{
              padding: 6,
              border: '1px solid var(--cyan)',
              background: 'rgba(0,229,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 0 12px rgba(0,229,255,0.2)',
              minWidth: 64,
              flexShrink: 0,
            }}
          >
            <PlayerAvatar player={myPlayer} size={32} showName={false} showState={false} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 8,
                  color: 'var(--white)',
                  fontWeight: 'bold',
                  letterSpacing: 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 56,
                }}>
                  TU
                </span>
                {!isGuessMinigame && playerSignals[myPlayer.id] && (
                  <span
                    style={{ fontSize: 14, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.25))' }}
                    className="broadcast-pop"
                  >
                    {playerSignals[myPlayer.id].emoji}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {sortedPlayers.map(player => (
          <div
            key={player.id}
            style={{
              padding: 6,
              border: `1px solid ${player.state === PlayerState.AT_RISK ? 'var(--red-danger)' : player.isShadow ? 'var(--gray-shadow)' : '#222'}`,
              background: 'var(--bg-panel)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              minWidth: 60,
              flexShrink: 0,
            }}
            className={player.state === PlayerState.AT_RISK ? 'pulse-red' : ''}
          >
            <PlayerAvatar player={player} size={30} showName={false} showState={false} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 8,
                  color: 'var(--white)',
                  fontWeight: 'bold',
                  letterSpacing: 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 48,
                }}>
                  {player.name}
                </span>
                {!isGuessMinigame && playerSignals[player.id] && (
                  <span
                    style={{ fontSize: 14, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.25))' }}
                    className="broadcast-pop"
                  >
                    {playerSignals[player.id].emoji}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      ) : (
      <ScrollHintBox style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'initial',
        gap: 8,
        flex: 1,
      }} contentStyle={{ display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 2 }}>
        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 2,
          minWidth: 'auto',
          paddingTop: 0,
          paddingBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          JUGADORES
        </div>

        {myPlayer && (
          <div
            style={{
              padding: mobile ? 6 : 10,
              border: '1px solid var(--cyan)',
              background: 'linear-gradient(180deg, rgba(0,229,255,0.11), rgba(0,229,255,0.05))',
              display: 'flex',
              flexDirection: mobile ? 'column' : 'row',
              alignItems: 'center',
              gap: mobile ? 4 : 8,
              boxShadow: '0 0 12px rgba(0,229,255,0.2)',
              minWidth: mobile ? 64 : 'auto',
              flexShrink: 0,
            }}
          >
          <PlayerAvatar player={myPlayer} size={mobile ? 32 : 40} showName={false} showState={false} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: mobile ? 8 : 11,
                color: 'var(--white)',
                fontWeight: 'bold',
                letterSpacing: 0.6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: mobile ? 56 : 'none',
              }}>
                {mobile ? 'TU' : `TU • ${myPlayer.name}`}
              </span>
              {(pendingCall || activeCallPeerId) && (
                <span
                  style={{
                    fontSize: 14,
                    color: activeCallPeerId ? 'var(--cyan)' : 'var(--green-neon)',
                    filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.25))',
                  }}
                  className={activeCallPeerId ? 'pulse' : ''}
                  title={activeCallPeerId ? 'En llamada' : 'Llamando'}
                >
                  ☎
                </span>
              )}
              {!isGuessMinigame && playerSignals[myPlayer.id] && (
                <span
                  style={{ fontSize: 14, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.25))' }}
                  className="broadcast-pop"
                >
                  {playerSignals[myPlayer.id].emoji}
                </span>
              )}
            </div>
            {!mobile && (
            <span style={{
              fontSize: 9,
              color: 'var(--gray-text)',
              letterSpacing: 1,
            }}>
              CABINA {hideCabinNumber ? '?' : (cabinByPlayerId[myPlayer.id] ?? '?')}
            </span>
            )}
            {!mobile && (
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
            )}
            {!mobile && canUseSidebarCalls && incomingCalls.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {incomingCalls.map((call) => (
                  <div key={call.callId} style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => onAcceptCall?.(call.callId)}
                      style={sidebarActionButton('var(--green-dim)', 'rgba(0,255,65,0.08)')}
                      title="Aceptar llamada"
                    >
                      ☎ Aceptar
                    </button>
                    <button
                      onClick={() => onRejectCall?.(call.callId)}
                      style={sidebarActionButton('var(--red-danger)', 'rgba(255,23,68,0.08)')}
                      title="Rechazar llamada"
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!mobile && canUseSidebarCalls && pendingCall && (
              <div style={{ marginTop: 6 }}>
                <button
                  onClick={() => onHangUp?.()}
                  style={sidebarActionButton('var(--red-danger)', 'rgba(255,23,68,0.08)')}
                  title="Cancelar llamada saliente"
                >
                  ☎ Cancelar llamada
                </button>
              </div>
            )}
            {!mobile && canUseSidebarCalls && activeCallPeerId && (
              <div style={{ marginTop: 6 }}>
                <button
                  onClick={() => onHangUp?.()}
                  style={sidebarActionButton('var(--red-danger)', 'rgba(255,23,68,0.08)')}
                  title="Colgar llamada activa"
                >
                  ☎ Colgar
                </button>
              </div>
            )}
          </div>
          </div>
        )}

        {sortedPlayers.map(player => (
          <div
            key={player.id}
            style={{
              padding: mobile ? 6 : 10,
              border: `1px solid ${player.state === PlayerState.AT_RISK ? 'var(--red-danger)' : player.isShadow ? 'var(--gray-shadow)' : '#222'}`,
              background: 'linear-gradient(180deg, rgba(26,26,26,0.92), rgba(18,18,18,0.9))',
              display: 'flex',
              flexDirection: mobile ? 'column' : 'row',
              alignItems: 'center',
              gap: mobile ? 4 : 8,
              minWidth: mobile ? 60 : 'auto',
              flexShrink: 0,
            }}
            className={`${player.state === PlayerState.AT_RISK ? 'pulse-red' : ''} ${incomingCalls.some((call) => call.callerId === player.id) ? 'vibrate' : ''}`.trim()}
          >
            <PlayerAvatar player={player} size={mobile ? 30 : 40} showName={false} showState={false} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: mobile ? 8 : 11,
                  color: 'var(--white)',
                  fontWeight: 'bold',
                  letterSpacing: 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: mobile ? 48 : 'none',
                }}>
                  {player.name}
                </span>
                {!isGuessMinigame && playerSignals[player.id] && (
                  <span
                    style={{ fontSize: 14, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.25))' }}
                    className="broadcast-pop"
                  >
                    {playerSignals[player.id].emoji}
                  </span>
                )}
              </div>
              {!mobile && (
              <span style={{
                fontSize: 9,
                color: 'var(--gray-text)',
                letterSpacing: 1,
              }}>
                CABINA {hideCabinNumber ? '?' : (cabinByPlayerId[player.id] ?? '?')}
              </span>
              )}
              {!mobile && (
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
              )}
              {!mobile && canUseSidebarCalls && (
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {incomingCalls
                    .filter((call) => call.callerId === player.id)
                    .map((call) => (
                      <div key={call.callId} style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => onAcceptCall?.(call.callId)}
                          style={sidebarActionButton('var(--green-dim)', 'rgba(0,255,65,0.08)')}
                          className="vibrate"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => onRejectCall?.(call.callId)}
                          style={sidebarActionButton('var(--red-danger)', 'rgba(255,23,68,0.08)')}
                        >
                          Rechazar
                        </button>
                      </div>
                    ))}
                  {activeCallPeerId === player.id && (
                    <span style={sidebarBadge('var(--cyan)', 'rgba(0,229,255,0.08)')}>
                      ☎ En llamada
                    </span>
                  )}
                  {pendingCall?.targetId === player.id && (
                    <span style={sidebarBadge('var(--green-dim)', 'rgba(0,255,65,0.08)')}>
                      ☎ Llamando
                    </span>
                  )}
                  {!incomingCalls.some((call) => call.callerId === player.id) && activeCallPeerId !== player.id && pendingCall?.targetId !== player.id && (
                    <button
                      onClick={() => canCallTarget(player) && onCallPlayer?.(player.id)}
                      disabled={!canCallTarget(player)}
                      style={sidebarActionButton(
                        canCallTarget(player) ? 'var(--cyan)' : 'var(--gray-shadow)',
                        canCallTarget(player) ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.03)',
                        !canCallTarget(player)
                      )}
                    >
                      Llamar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </ScrollHintBox>
      )}

      {!mobile && (
      <div style={{
        borderTop: mobile ? 'none' : '1px solid rgba(0,229,255,0.14)',
        paddingTop: mobile ? 6 : 12,
        marginTop: mobile ? 0 : 'auto',
        minWidth: mobile ? 220 : 'auto',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10,
          color: 'var(--cyan)',
          letterSpacing: 2.2,
          marginBottom: 8,
        }}>
          CANAL GLOBAL
        </div>
        <div style={{
          border: signalAlertActive ? '1px solid rgba(0,255,65,0.5)' : '1px solid rgba(0,229,255,0.18)',
          background: signalAlertActive
            ? 'linear-gradient(180deg, rgba(0,255,65,0.14), rgba(0,229,255,0.06))'
            : 'linear-gradient(180deg, rgba(0,229,255,0.06), rgba(255,255,255,0.01))',
          padding: '8px 9px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          position: 'relative',
          boxShadow: signalAlertActive ? '0 0 22px rgba(0,255,65,0.18)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: latestSignal ? 'var(--green-neon)' : 'var(--gray-shadow)',
              boxShadow: latestSignal ? '0 0 10px rgba(0,255,65,0.55)' : 'none',
              flexShrink: 0,
            }} />
            <div style={{
              fontSize: 9,
              color: 'var(--gray-text)',
              letterSpacing: 1.2,
            }}>
              BROADCAST DE CABINA
            </div>
          </div>

          {latestSignal ? (
            <div
              className={signalAlertActive ? 'broadcast-pop' : ''}
              style={{
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                border: '1px solid rgba(0,255,65,0.22)',
                background: 'rgba(0,0,0,0.24)',
              }}
            >
              <div style={{
                fontSize: 22,
                lineHeight: 1,
                filter: 'drop-shadow(0 0 12px rgba(0,255,65,0.3))',
              }}>
                {latestSignal.emoji}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 11,
                  color: 'var(--white)',
                  letterSpacing: 0.6,
                  fontWeight: 'bold',
                }}>
                  {isGuessMinigame ? 'LINEA DESCONOCIDA' : latestSignal.playerName}
                </div>
                <div style={{
                  fontSize: 9,
                  color: 'var(--green-neon)',
                  letterSpacing: 1.4,
                }}>
                  {latestSignal.label}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              minHeight: 36,
              fontSize: 10,
              color: 'var(--gray-text)',
              lineHeight: 1.5,
            }}>
              El canal esta en espera. Una senal bien puesta puede cambiar la lectura de la sala.
            </div>
          )}

          {signalHistory.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 1.4 }}>
                HISTORIAL RECIENTE
              </div>
              {signalHistory.slice(0, 3).map((entry, index) => (
                <div
                  key={`${entry.playerId}-${entry.emoji}-${entry.label}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 6px',
                    background: 'rgba(255,255,255,0.02)',
                    fontSize: 9,
                    color: 'var(--gray-text)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{entry.emoji}</span>
                  <span style={{ color: 'var(--white)' }}>
                    {activeMinigameId === 'adivina-linea' ? 'Linea desconocida' : entry.playerName}
                  </span>
                  <span>{entry.label}</span>
                </div>
              ))}
            </div>
          )}

          {myPlayer && (
            <div style={{ position: 'relative', marginTop: 2 }}>
              <button
                onClick={() => setSignalPickerOpen((value) => !value)}
                disabled={signalCooldownRemaining > 0}
                style={{
                  width: '100%',
                  fontSize: 9,
                  color: signalCooldownRemaining > 0 ? 'var(--gray-shadow)' : 'var(--cyan)',
                  border: `1px solid ${signalCooldownRemaining > 0 ? '#2a2a2a' : 'rgba(0,229,255,0.22)'}`,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '6px 8px',
                  cursor: signalCooldownRemaining > 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1.2,
                }}
              >
                {signalCooldownRemaining > 0 ? `CANAL EN RECARGA ${signalCooldownRemaining}s` : 'PUBLICAR SENAL'}
              </button>

              {signalPickerOpen && signalCooldownRemaining === 0 && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 'calc(100% + 6px)',
                  zIndex: 4,
                  display: 'grid',
                  gridTemplateColumns: mobile ? 'repeat(3, 1fr)' : 'repeat(4, minmax(0, 1fr))',
                  gap: 6,
                  padding: 8,
                  border: '1px solid rgba(0,229,255,0.22)',
                  background: 'rgba(5,12,18,0.98)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.35)',
                  maxHeight: mobile ? 168 : 144,
                  overflowY: 'auto',
                  alignItems: 'stretch',
                }}>
                  {SIGNAL_OPTIONS.map((signal) => (
                    <button
                      key={`channel-${signal.emoji}-${signal.label}`}
                      onClick={() => {
                        onSendSignal(signal)
                        setSignalCooldownUntil(Date.now() + 8000)
                        setNow(Date.now())
                        setSignalPickerOpen(false)
                      }}
                      style={{
                        border: '1px solid #233445',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--white)',
                        padding: '8px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        fontFamily: 'var(--font-mono)',
                        minHeight: 52,
                        position: 'relative',
                      }}
                      title={signal.label}
                    >
                      <span style={{ fontSize: 16 }}>{signal.emoji}</span>
                      <span
                        style={{
                          fontSize: 8,
                          color: 'var(--gray-text)',
                          opacity: mobile ? 1 : 0,
                          transform: mobile ? 'translateY(0)' : 'translateY(2px)',
                          transition: 'opacity 0.16s ease, transform 0.16s ease',
                          pointerEvents: 'none',
                        }}
                        className={mobile ? '' : 'signal-label-hover'}
                      >
                        {signal.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

function sidebarActionButton(color: string, background: string, disabled = false) {
  return {
    border: `1px solid ${color}`,
    background,
    color,
    padding: '4px 8px',
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: 'var(--font-mono)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
  } as const
}

function sidebarBadge(color: string, background: string) {
  return {
    border: `1px solid ${color}`,
    background,
    color,
    padding: '4px 8px',
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: 'var(--font-mono)',
    display: 'inline-flex',
    alignItems: 'center',
  } as const
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
