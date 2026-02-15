import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'
import { GlitchEffect } from './animations/GlitchEffect'

interface Props {
  onInterference: (targetId: string) => void
}

export function ShadowPanel({ onInterference }: Props) {
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const players = useGameStore(s => s.players)
  const phase = useGameStore(s => s.phase)

  if (!myPlayer?.isShadow) return null

  const targets = players.filter(p =>
    p.id !== myPlayer.id && p.isAlive && p.state === 'IN_CALL'
  )

  return (
    <GlitchEffect>
      <div style={{
        padding: 16,
        border: '1px solid var(--gray-shadow)',
        background: 'rgba(68,68,68,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{
          fontSize: 12,
          color: 'var(--gray-shadow)',
          letterSpacing: 3,
        }}
        className="glitch-text"
        >
          ESTADO: SOMBRA
        </div>

        <div style={{
          fontSize: 10,
          color: 'var(--gray-text)',
        }}>
          Cargas de interferencia: {myPlayer.shadowCharges}
        </div>

        {phase === GamePhase.CALL_PHASE && myPlayer.shadowCharges > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 1 }}>
              INTERFERIR LLAMADA:
            </div>
            {targets.length > 0 ? (
              targets.map(t => (
                <button
                  key={t.id}
                  className="btn btn-red"
                  onClick={() => onInterference(t.id)}
                  style={{ fontSize: 10, padding: '6px 12px' }}
                >
                  {t.name}
                </button>
              ))
            ) : (
              <div style={{ fontSize: 10, color: 'var(--gray-shadow)' }}>
                No hay llamadas activas
              </div>
            )}
          </div>
        )}

        {phase === GamePhase.DECISION_PHASE && (
          <div style={{
            fontSize: 11,
            color: 'var(--gray-shadow)',
            fontStyle: 'italic',
          }}>
            No puedes votar como sombra.
          </div>
        )}
      </div>
    </GlitchEffect>
  )
}
