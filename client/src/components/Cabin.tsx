import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'
import { BalanceDisplay } from './BalanceDisplay'
import { PhaseTimer } from './PhaseTimer'
import { PlayerList } from './PlayerList'
import { CallPanel } from './CallPanel'
import { DecisionPanel } from './DecisionPanel'
import { VotingPanel } from './VotingPanel'
import { ResultPanel } from './ResultPanel'
import { ShadowPanel } from './ShadowPanel'
import { GameOver } from './GameOver'
import { GuessPanel } from './GuessPanel'
import { MinigameHeader } from './MinigameHeader'
import { BombPanel } from './BombPanel'
import { BombSpectatorPanel } from './BombSpectatorPanel'
import { AudioControls } from './AudioControls'
import { BombOutcomeOverlay } from './BombOutcomeOverlay'

interface Props {
  onCallPlayer: (targetId: string) => void
  onAcceptCall: (callId: string) => void
  onRejectCall: (callId: string) => void
  onHangUp: () => void
  onSubmitDecision: (decision: import('../types').Decision) => void
  onVotePlayer: (targetId: string) => void
  onSubmitLineGuesses: (guesses: Record<string, string>) => void
  onPassBomb: (targetId: string) => void
  onAttemptDefuse: () => void
  onSkipToFinish: () => void
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
  onSubmitDecision, onVotePlayer, onSubmitLineGuesses, onPassBomb, onAttemptDefuse, onSkipToFinish, onInterference, audioData, isSpeaking, onShowRules,
}: Props) {
  const phase = useGameStore(s => s.phase)
  const round = useGameStore(s => s.round)
  const maxRounds = useGameStore(s => s.maxRounds)
  const players = useGameStore(s => s.players)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const bombState = useGameStore(s => s.bombState)

  const activePlayers = players.filter(p => p.isAlive).length
  const isVotingMinigame = activeMinigameId?.startsWith('votacion') ?? false
  const isGuessMinigame = activeMinigameId === 'adivina-linea'
  const isBombMinigame = activeMinigameId === 'la-bomba'

  if (phase === GamePhase.GAME_OVER) {
    return <GameOver />
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      background: `
        radial-gradient(circle at 12% 18%, rgba(0, 180, 255, 0.12), transparent 34%),
        radial-gradient(circle at 88% 22%, rgba(255, 40, 40, 0.11), transparent 36%),
        radial-gradient(circle at 50% 120%, rgba(0, 0, 0, 0.55), transparent 55%),
        linear-gradient(180deg, #05080e 0%, #03050a 58%, #020307 100%)
      `,
    }}>
      {/* Main area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRight: '1px solid rgba(0, 229, 255, 0.1)',
        boxShadow: 'inset 0 0 38px rgba(0, 229, 255, 0.06), inset 0 -36px 80px rgba(0,0,0,0.42)',
      }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: `
              linear-gradient(90deg, rgba(0,0,0,0.34) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.34) 100%),
              linear-gradient(180deg, rgba(0,0,0,0.44) 0%, transparent 22%, transparent 76%, rgba(0,0,0,0.52) 100%)
            `,
          }}
        />
        {/* Minigame header bar */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <MinigameHeader />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
          background: 'linear-gradient(180deg, rgba(7,12,20,0.92), rgba(4,8,14,0.88))',
          boxShadow: '0 10px 22px rgba(0,0,0,0.35)',
          position: 'relative',
          zIndex: 1,
        }}>
          <BalanceDisplay />

          <div style={{
            display: 'flex',
            gap: 32,
            alignItems: 'center',
          }}>
            <AudioControls />

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
          borderBottom: '1px solid rgba(0,229,255,0.14)',
          background: 'linear-gradient(180deg, rgba(0,229,255,0.08), rgba(0,229,255,0.02))',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: phase === GamePhase.DECISION_PHASE ? 'var(--red-danger)' : 'var(--green-dim)',
            letterSpacing: 2.6,
            textTransform: 'uppercase',
            border: `1px solid ${phase === GamePhase.DECISION_PHASE ? 'rgba(255,23,68,0.5)' : 'rgba(0,255,65,0.42)'}`,
            background: phase === GamePhase.DECISION_PHASE
              ? 'rgba(255,23,68,0.09)'
              : 'rgba(0,255,65,0.08)',
            padding: '5px 12px',
            boxShadow: phase === GamePhase.DECISION_PHASE
              ? '0 0 14px rgba(255,23,68,0.18)'
              : '0 0 14px rgba(0,255,65,0.16)',
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
          position: 'relative',
          zIndex: 1,
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

          {phase === GamePhase.CALL_PHASE && isBombMinigame && bombState?.holderId === myPlayer?.id && (
            <BombPanel
              onPassBomb={onPassBomb}
              onAttemptDefuse={onAttemptDefuse}
            />
          )}

          {phase === GamePhase.CALL_PHASE && isBombMinigame && bombState?.holderId !== myPlayer?.id && (
            <BombSpectatorPanel />
          )}

          {/* Show GuessPanel alongside CallPanel during call phase for adivina-linea */}
          {phase === GamePhase.CALL_PHASE && isGuessMinigame && (
            <GuessPanel onSubmitGuesses={onSubmitLineGuesses} />
          )}

          {phase === GamePhase.DECISION_PHASE && !isVotingMinigame && !isGuessMinigame && (
            <DecisionPanel onSubmitDecision={onSubmitDecision} />
          )}

          {phase === GamePhase.DECISION_PHASE && isVotingMinigame && (
            <VotingPanel onVotePlayer={onVotePlayer} />
          )}

          {phase === GamePhase.DECISION_PHASE && isGuessMinigame && (
            <GuessPanel onSubmitGuesses={onSubmitLineGuesses} />
          )}

          {phase === GamePhase.RESULT_PHASE && !isVotingMinigame && !isGuessMinigame && <ResultPanel />}

          {phase === GamePhase.RESULT_PHASE && isVotingMinigame && (
            <VotingPanel onVotePlayer={onVotePlayer} />
          )}

          {phase === GamePhase.RESULT_PHASE && isGuessMinigame && (
            <GuessPanel onSubmitGuesses={onSubmitLineGuesses} onSkipToFinish={onSkipToFinish} />
          )}

          {myPlayer?.isShadow && (
            <ShadowPanel onInterference={onInterference} />
          )}
        </div>

        {isBombMinigame && <BombOutcomeOverlay />}
      </div>

      {/* Player sidebar */}
      <PlayerList />
    </div>
  )
}
