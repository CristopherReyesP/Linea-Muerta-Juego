import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'
import { BalanceDisplay } from './BalanceDisplay'
import { PhaseTimer } from './PhaseTimer'
import { PlayerList } from './PlayerList'
import { CallPanel } from './CallPanel'
import { DecisionPanel } from './DecisionPanel'
import { ResultPanel } from './ResultPanel'
import { ShadowPanel } from './ShadowPanel'
import { GameOver } from './GameOver'

interface Props {
  onCallPlayer: (targetId: string) => void
  onAcceptCall: (callId: string) => void
  onRejectCall: (callId: string) => void
  onHangUp: () => void
  onSubmitDecision: (decision: import('../types').Decision) => void
  onInterference: (targetId: string) => void
  audioData: Uint8Array
  isSpeaking: boolean
  onShowRules: () => void
}

const phaseLabels: Record<string, string> = {
  [GamePhase.CALL_PHASE]: 'FASE DE LLAMADA',
  [GamePhase.DECISION_PHASE]: 'FASE DE DECISION',
  [GamePhase.RESULT_PHASE]: 'RESULTADOS',
  [GamePhase.GAME_OVER]: 'FIN DEL PROTOCOLO',
}

export function Cabin({
  onCallPlayer, onAcceptCall, onRejectCall, onHangUp,
  onSubmitDecision, onInterference, audioData, isSpeaking, onShowRules,
}: Props) {
  const phase = useGameStore(s => s.phase)
  const round = useGameStore(s => s.round)
  const maxRounds = useGameStore(s => s.maxRounds)
  const players = useGameStore(s => s.players)
  const myPlayer = useGameStore(s => s.getMyPlayer())

  const activePlayers = players.filter(p => p.isAlive).length

  if (phase === GamePhase.GAME_OVER) {
    return <GameOver />
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
    }}>
      {/* Main area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #222',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <BalanceDisplay />

          <div style={{
            display: 'flex',
            gap: 32,
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2 }}>
                JUGADORES ACTIVOS
              </div>
              <div style={{ fontSize: 24, color: 'var(--green-neon)' }}>
                {activePlayers}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2 }}>
                RONDA
              </div>
              <div style={{ fontSize: 24, color: 'var(--white)' }}>
                {round}<span style={{ fontSize: 14, color: 'var(--gray-text)' }}>/{maxRounds}</span>
              </div>
            <button
              onClick={onShowRules}
              style={{
                background: 'none',
                border: '1px solid var(--gray-shadow)',
                color: 'var(--gray-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Reglas del juego"
            >
              ?
            </button>
            </div>
          </div>
        </div>

        {/* Phase indicator + timer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          padding: '8px 24px',
          borderBottom: '1px solid #111',
        }}>
          <div style={{
            fontSize: 12,
            color: phase === GamePhase.DECISION_PHASE ? 'var(--red-danger)' : 'var(--green-dim)',
            letterSpacing: 3,
          }}
          className={phase === GamePhase.DECISION_PHASE ? 'pulse' : ''}
          >
            {phaseLabels[phase] ?? phase}
          </div>
          <PhaseTimer />
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 24,
          overflowY: 'auto',
        }}>
          {phase === GamePhase.CALL_PHASE && (
            <CallPanel
              onCallPlayer={onCallPlayer}
              onAcceptCall={onAcceptCall}
              onRejectCall={onRejectCall}
              onHangUp={onHangUp}
              audioData={audioData}
              isSpeaking={isSpeaking}
            />
          )}

          {phase === GamePhase.DECISION_PHASE && (
            <DecisionPanel onSubmitDecision={onSubmitDecision} />
          )}

          {phase === GamePhase.RESULT_PHASE && <ResultPanel />}

          {myPlayer?.isShadow && (
            <ShadowPanel onInterference={onInterference} />
          )}
        </div>
      </div>

      {/* Player sidebar */}
      <PlayerList />

      {/* Hidden audio element for WebRTC */}
      <audio id="remote-audio" autoPlay style={{ display: 'none' }} />
    </div>
  )
}
