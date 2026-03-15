import { useEffect, useState } from 'react'
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
import { EmergencyPanel } from './EmergencyPanel'
import { EmojiPanel } from './EmojiPanel'
import { AutoLogPanel } from './AutoLogPanel'
import { IdleNotesPanel } from './IdleNotesPanel'
import type { EmergencyStateData, EmojiStateData, PlayerData } from '../types'

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
  onSubmitSabotage: (data: { field: string; value: string }) => void
  onSubmitReport: (text: string) => void
  onSubmitEmergencyResponse: (optionIndex: number) => void
  onVoteEmoji: (targetId: string) => void
  onSendSignal: (data: { emoji: string; label: string }) => void
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

function getPhaseInstruction(params: {
  activeMinigameId: string | null
  phase: GamePhase
  myPlayer: PlayerData | null
  bombState: import('../types').BombStateData | null
  emergencyState: EmergencyStateData | null
  emojiState: EmojiStateData | null
}): { label: string; text: string } | null {
  const { activeMinigameId, phase, myPlayer, bombState, emergencyState, emojiState } = params

  if (!activeMinigameId) return null

  if (activeMinigameId === 'cooperar-traicionar') {
    if (phase === GamePhase.CALL_PHASE) return { label: 'QUE HACER AHORA', text: 'Habla con otros jugadores y negocia tu decision.' }
    if (phase === GamePhase.DECISION_PHASE) return { label: 'QUE HACER AHORA', text: 'Elige en secreto si cooperas o traicionas.' }
    if (phase === GamePhase.RESULT_PHASE) return { label: 'QUE HACER AHORA', text: 'Revisa el resultado de la ronda y como cambio cada saldo.' }
  }

  if (activeMinigameId === 'votacion-sobra') {
    if (phase === GamePhase.CALL_PHASE) return { label: 'QUE HACER AHORA', text: 'Discute quien esta dominando demasiado la sesion.' }
    if (phase === GamePhase.DECISION_PHASE) return { label: 'QUE HACER AHORA', text: 'Vota por quien sobra. No puedes votarte a ti mismo.' }
    if (phase === GamePhase.RESULT_PHASE) return { label: 'QUE HACER AHORA', text: 'Se mostrara quien perdio punto global por la votacion.' }
  }

  if (activeMinigameId === 'votacion-merece') {
    if (phase === GamePhase.CALL_PHASE) return { label: 'QUE HACER AHORA', text: 'Habla y decide quien merece ser reconocido.' }
    if (phase === GamePhase.DECISION_PHASE) return { label: 'QUE HACER AHORA', text: 'Vota por quien merece el punto. No puedes votarte.' }
    if (phase === GamePhase.RESULT_PHASE) return { label: 'QUE HACER AHORA', text: 'Se mostrara quien gano punto global por la votacion.' }
  }

  if (activeMinigameId === 'adivina-linea') {
    if (phase === GamePhase.CALL_PHASE) return { label: 'QUE HACER AHORA', text: 'Llama a las lineas, escucha pistas y ve armando tus sospechas.' }
    if (phase === GamePhase.DECISION_PHASE) return { label: 'QUE HACER AHORA', text: 'Asigna un nombre a cada linea antes de que termine el tiempo.' }
    if (phase === GamePhase.RESULT_PHASE) return { label: 'QUE HACER AHORA', text: 'Mira las identidades reales y cuantos aciertos lograste.' }
  }

  if (activeMinigameId === 'la-bomba') {
    if (phase === GamePhase.CALL_PHASE) {
      const isHolder = bombState?.holderId === myPlayer?.id
      return {
        label: isHolder ? 'TIENES LA BOMBA' : 'QUE HACER AHORA',
        text: isHolder
          ? 'Decide rapido: intenta desactivar o pasa la bomba a otro jugador.'
          : 'Observa al portador y preparate por si la bomba llega a tu cabina.',
      }
    }
    if (phase === GamePhase.RESULT_PHASE) return { label: 'QUE HACER AHORA', text: 'Se resolvera si alguien la desactivo o si la bomba exploto.' }
  }

  if (activeMinigameId === 'central-emergencias') {
    if (!emergencyState) return { label: 'QUE HACER AHORA', text: 'Sigue tu rol y coordina usando la informacion parcial.' }
    if (emergencyState.internalPhase === 'ROLES') return { label: 'TU MISION', text: 'Lee tu rol y entiende si debes deducir, ayudar o sabotear.' }
    if (emergencyState.internalPhase === 'SABOTAGE') return { label: 'TU MISION', text: emergencyState.myRole === 'saboteur' ? 'Memoriza tu valor falso: luego tendras que defenderlo.' : 'Revisa tu pista y preparate para compararla en transmision.' }
    if (emergencyState.internalPhase === 'TRANSMISSION') {
      if (emergencyState.myRole === 'operator') return { label: 'TU MISION', text: 'Espera reportes escritos y arma el mensaje correcto con esas pistas.' }
      return { label: 'TU MISION', text: 'Habla con otros emisores y envia un reporte corto al operador.' }
    }
    if (emergencyState.internalPhase === 'OPERATOR_RESPONSE') {
      return {
        label: 'TU MISION',
        text: emergencyState.myRole === 'operator'
          ? 'Elige cual de las 4 opciones coincide con los reportes recibidos.'
          : 'Espera la decision de los operadores.',
      }
    }
    if (emergencyState.internalPhase === 'RESULT') return { label: 'QUE HACER AHORA', text: 'Se revelara si los operadores acertaron o si gano el saboteador.' }
  }

  if (activeMinigameId === 'emoji-diferente') {
    if (!emojiState) return { label: 'QUE HACER AHORA', text: 'Compara tu emoji con los demas y descubre al diferente.' }
    if (emojiState.internalPhase === 'REVEAL') return { label: 'QUE HACER AHORA', text: 'Memoriza tu emoji. Todavia no puedes llamar a nadie.' }
    if (emojiState.internalPhase === 'DISCUSSION') return { label: 'QUE HACER AHORA', text: 'Describe tu emoji y compara pistas para encontrar al diferente.' }
    if (emojiState.internalPhase === 'VOTING') return { label: 'QUE HACER AHORA', text: 'Vota por quien crees que tiene el emoji diferente.' }
    if (emojiState.internalPhase === 'RESULT') return { label: 'QUE HACER AHORA', text: 'Se mostrara quien era el diferente y si la mayoria acerto.' }
  }

  return null
}

export function Cabin({
  onCallPlayer, onAcceptCall, onRejectCall, onHangUp,
  onSubmitDecision, onVotePlayer, onSubmitLineGuesses, onPassBomb, onAttemptDefuse, onSkipToFinish, onInterference,
  onSubmitSabotage, onSubmitReport, onSubmitEmergencyResponse, onVoteEmoji,
  onSendSignal,
  audioData, isSpeaking, onShowRules,
}: Props) {
  const phase = useGameStore(s => s.phase)
  const round = useGameStore(s => s.round)
  const maxRounds = useGameStore(s => s.maxRounds)
  const players = useGameStore(s => s.players)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const bombState = useGameStore(s => s.bombState)
  const emergencyState = useGameStore(s => s.emergencyState)
  const emojiState = useGameStore(s => s.emojiState)
  const [consoleExpanded, setConsoleExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const activePlayers = players.filter(p => p.isAlive).length
  const isVotingMinigame = activeMinigameId?.startsWith('votacion') ?? false
  const isGuessMinigame = activeMinigameId === 'adivina-linea'
  const isBombMinigame = activeMinigameId === 'la-bomba'
  const isEmergencyMinigame = activeMinigameId === 'central-emergencias'
  const isEmojiMinigame = activeMinigameId === 'emoji-diferente'
  const phaseInstruction = getPhaseInstruction({
    activeMinigameId,
    phase,
    myPlayer,
    bombState,
    emergencyState,
    emojiState,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ expanded?: boolean }>
      setConsoleExpanded(Boolean(customEvent.detail?.expanded))
    }

    window.addEventListener('lm-autolog-visibility', handleVisibility as EventListener)
    return () => window.removeEventListener('lm-autolog-visibility', handleVisibility as EventListener)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncViewport = () => setIsMobile(window.innerWidth <= 900)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  if (phase === GamePhase.GAME_OVER) {
    return <GameOver />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '100%',
      width: '100%',
      background: `
        radial-gradient(circle at 12% 18%, rgba(0, 180, 255, 0.12), transparent 34%),
        radial-gradient(circle at 88% 22%, rgba(255, 40, 40, 0.11), transparent 36%),
        radial-gradient(circle at 50% 120%, rgba(0, 0, 0, 0.55), transparent 55%),
        linear-gradient(180deg, #05080e 0%, #03050a 58%, #020307 100%)
      `,
    }}>
      {isMobile && <PlayerList onSendSignal={onSendSignal} mobile />}

      {/* Main area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: 0,
        borderRight: isMobile ? 'none' : '1px solid rgba(0, 229, 255, 0.1)',
        borderTop: isMobile ? '1px solid rgba(0, 229, 255, 0.12)' : 'none',
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
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? 12 : 0,
          padding: isMobile ? '12px 14px' : '12px 24px',
          borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
          background: 'linear-gradient(180deg, rgba(7,12,20,0.92), rgba(4,8,14,0.88))',
          boxShadow: '0 10px 22px rgba(0,0,0,0.35)',
          position: 'relative',
          zIndex: 1,
        }}>
          <BalanceDisplay />

          <div style={{
            display: 'flex',
            gap: isMobile ? 18 : 32,
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
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
          flexWrap: 'wrap',
          gap: 16,
          padding: isMobile ? '8px 14px' : '8px 24px',
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
          justifyContent: 'flex-start',
          gap: 20,
          padding: consoleExpanded
            ? (isMobile ? '16px 12px 250px' : '24px 24px 250px')
            : (isMobile ? '16px 12px 104px' : '24px 24px 104px'),
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
          transition: 'padding-bottom 0.22s ease',
        }}>
          {phaseInstruction && (
            <div
              style={{
                width: '100%',
                maxWidth: 780,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '12px 18px',
                  border: '1px solid rgba(0,229,255,0.28)',
                  background: 'linear-gradient(180deg, rgba(0,229,255,0.08), rgba(0,229,255,0.03))',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.24)',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 3, marginBottom: 6 }}>
                  {phaseInstruction.label}
                </div>
                <div style={{ fontSize: 15, color: 'var(--white)', lineHeight: 1.5 }}>
                  {phaseInstruction.text}
                </div>
                <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 1.4, marginTop: 8 }}>
                  Reglas completas en el icono `?`
                </div>
              </div>
            </div>
          )}

          {phase === GamePhase.CALL_PHASE && !isEmergencyMinigame && !isEmojiMinigame && (
            <CallPanel
              onCallPlayer={onCallPlayer}
              onAcceptCall={onAcceptCall}
              onRejectCall={onRejectCall}
              onHangUp={onHangUp}
              audioData={audioData}
              isSpeaking={isSpeaking}
            />
          )}

          {/* Emergency minigame: show panel + CallPanel only during TRANSMISSION for technicians */}
          {isEmergencyMinigame && (
            <EmergencyPanel
              onSubmitSabotage={onSubmitSabotage}
              onSubmitReport={onSubmitReport}
              onSubmitEmergencyResponse={onSubmitEmergencyResponse}
            />
          )}

          {/* Emoji Diferente minigame */}
          {isEmojiMinigame && (
            <EmojiPanel onVoteEmoji={onVoteEmoji} />
          )}

          {/* Emoji minigame: CallPanel only during DISCUSSION phase */}
          {phase === GamePhase.CALL_PHASE && isEmojiMinigame && emojiState?.internalPhase === 'DISCUSSION' && (
            <CallPanel
              onCallPlayer={onCallPlayer}
              onAcceptCall={onAcceptCall}
              onRejectCall={onRejectCall}
              onHangUp={onHangUp}
              audioData={audioData}
              isSpeaking={isSpeaking}
            />
          )}

          {phase === GamePhase.CALL_PHASE && isEmergencyMinigame && emergencyState?.internalPhase === 'TRANSMISSION' && emergencyState?.myRole !== 'operator' && (
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

          {phase === GamePhase.DECISION_PHASE && !isVotingMinigame && !isGuessMinigame && !isEmergencyMinigame && !isEmojiMinigame && (
            <DecisionPanel onSubmitDecision={onSubmitDecision} />
          )}

          {phase === GamePhase.DECISION_PHASE && isVotingMinigame && (
            <VotingPanel onVotePlayer={onVotePlayer} />
          )}

          {phase === GamePhase.DECISION_PHASE && isGuessMinigame && (
            <GuessPanel onSubmitGuesses={onSubmitLineGuesses} />
          )}

          {phase === GamePhase.RESULT_PHASE && !isVotingMinigame && !isGuessMinigame && !isEmergencyMinigame && !isEmojiMinigame && <ResultPanel />}

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

        <AutoLogPanel />
        <IdleNotesPanel />
        {isBombMinigame && <BombOutcomeOverlay />}
      </div>

      {/* Player sidebar */}
      {!isMobile && <PlayerList onSendSignal={onSendSignal} />}
    </div>
  )
}
