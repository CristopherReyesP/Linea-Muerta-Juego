import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { GamePhase } from '../types'
import { BalanceDisplay } from './BalanceDisplay'
import { PhaseTimer } from './PhaseTimer'
import { PlayerList } from './PlayerList'
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
import { MobileToolsDrawer } from './MobileToolsDrawer'
import { ScrollHintBox } from './ScrollHintBox'
import { SystemToasts } from './SystemToasts'
import type { EmergencyStateData, EmojiStateData, PlayerData } from '../types'
import { useI18n } from '../i18n'

interface Props {
  desktopOnly?: boolean
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

const FAR_STAR_POSITIONS = [
  { top: '12%', left: '16%', size: 2.2, opacity: 0.7 },
  { top: '18%', left: '41%', size: 1.8, opacity: 0.55 },
  { top: '24%', left: '73%', size: 2.4, opacity: 0.78 },
  { top: '31%', left: '58%', size: 1.6, opacity: 0.48 },
  { top: '34%', left: '22%', size: 1.8, opacity: 0.65 },
  { top: '39%', left: '82%', size: 2.2, opacity: 0.64 },
  { top: '46%', left: '47%', size: 2.5, opacity: 0.72 },
  { top: '52%', left: '68%', size: 1.7, opacity: 0.52 },
  { top: '57%', left: '27%', size: 2.3, opacity: 0.69 },
  { top: '66%', left: '77%', size: 1.9, opacity: 0.58 },
  { top: '71%', left: '38%', size: 2.1, opacity: 0.74 },
  { top: '76%', left: '61%', size: 1.7, opacity: 0.5 },
]

const NEAR_STAR_POSITIONS = [
  { top: '14%', left: '29%', size: 4, opacity: 0.78 },
  { top: '22%', left: '62%', size: 3.2, opacity: 0.68 },
  { top: '29%', left: '49%', size: 3.6, opacity: 0.62 },
  { top: '43%', left: '18%', size: 4.4, opacity: 0.74 },
  { top: '48%', left: '74%', size: 3.8, opacity: 0.7 },
  { top: '61%', left: '54%', size: 4.2, opacity: 0.76 },
  { top: '69%', left: '24%', size: 3.4, opacity: 0.64 },
]

function getMinigameAccent(activeMinigameId: string | null) {
  if (activeMinigameId === 'la-bomba') return 'rgba(255,23,68,0.2)'
  if (activeMinigameId === 'adivina-linea') return 'rgba(0,229,255,0.2)'
  if (activeMinigameId === 'central-emergencias') return 'rgba(255,214,102,0.18)'
  if (activeMinigameId === 'emoji-diferente') return 'rgba(0,255,65,0.18)'
  return 'rgba(0,229,255,0.14)'
}

function getTutorialCopy(activeMinigameId: string | null) {
  if (activeMinigameId === 'cooperar-traicionar') return 'Habla poco, escucha mucho y decide en secreto.'
  if (activeMinigameId === 'adivina-linea') return 'En este juego la identidad importa: no reveles demasiado pronto.'
  if (activeMinigameId === 'la-bomba') return 'Si tienes la bomba, cada segundo cuenta. Mira primero tus acciones.'
  if (activeMinigameId === 'central-emergencias') return 'No todos tienen la misma informacion. Compara antes de concluir.'
  if (activeMinigameId === 'emoji-diferente') return 'Observa patrones: el diferente suele dudar mas al describirse.'
  if (activeMinigameId?.startsWith('votacion')) return 'Escucha a todos antes de votar: la sala castiga decisiones impulsivas.'
  return null
}

function getPhaseInstruction(params: {
  activeMinigameId: string | null
  phase: GamePhase
  phaseEndTime: number
  myPlayer: PlayerData | null
  bombState: import('../types').BombStateData | null
  emergencyState: EmergencyStateData | null
  emojiState: EmojiStateData | null
}): { label: string; text: string } | null {
  const { activeMinigameId, phase, phaseEndTime, myPlayer, bombState, emergencyState, emojiState } = params

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
    const effectiveEmojiInternalPhase =
      phase === GamePhase.DECISION_PHASE
        ? 'VOTING'
        : phase === GamePhase.RESULT_PHASE
          ? 'RESULT'
          : phase === GamePhase.CALL_PHASE && emojiState.internalPhase === 'REVEAL' && phaseEndTime - Date.now() > 10000
            ? 'DISCUSSION'
            : emojiState.internalPhase
    if (phase === GamePhase.DECISION_PHASE) return { label: 'QUE HACER AHORA', text: 'Vota por quien crees que tiene el emoji diferente.' }
    if (phase === GamePhase.RESULT_PHASE) return { label: 'QUE HACER AHORA', text: 'Se mostrara quien era el diferente y si la mayoria acerto.' }
    if (effectiveEmojiInternalPhase === 'REVEAL') return { label: 'QUE HACER AHORA', text: 'Memoriza tu emoji. Todavia no puedes llamar a nadie.' }
    if (effectiveEmojiInternalPhase === 'DISCUSSION') return { label: 'QUE HACER AHORA', text: 'Describe tu emoji y compara pistas para encontrar al diferente.' }
  }

  return null
}

function CabinViewportBackdrop({
  phaseLabel,
  activePlayers,
  round,
  maxRounds,
  minimal = false,
}: {
  phaseLabel: string
  activePlayers: number
  round: number
  maxRounds: number
  minimal?: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '3% 4% 6%',
          borderRadius: 28,
          border: '1px solid rgba(146, 194, 224, 0.18)',
          background: minimal
            ? 'linear-gradient(180deg, rgba(3,8,16,0.02), rgba(2,5,12,0.16))'
            : 'linear-gradient(180deg, rgba(3,8,16,0.08), rgba(2,5,12,0.42))',
          boxShadow: minimal
            ? 'inset 0 0 30px rgba(0,0,0,0.12)'
            : 'inset 0 0 90px rgba(0,0,0,0.44), inset 0 0 30px rgba(120,220,255,0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(circle at 65% 22%, rgba(116,150,255,${minimal ? '0.08' : '0.14'}), transparent 18%),
              radial-gradient(circle at 17% 74%, rgba(128,87,201,${minimal ? '0.06' : '0.12'}), transparent 20%),
              radial-gradient(circle at 82% 82%, rgba(50,122,213,${minimal ? '0.05' : '0.1'}), transparent 18%),
              linear-gradient(180deg, rgba(6,10,20,${minimal ? '0.05' : '0.15'}), rgba(1,4,10,${minimal ? '0.16' : '0.5'}))
            `,
          }}
        />

        {FAR_STAR_POSITIONS.map((star, index) => (
          <span
            key={`far-${index}`}
            className="cabin-starfield-far"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}

        {NEAR_STAR_POSITIONS.map((star, index) => (
          <span
            key={`near-${index}`}
            className="cabin-starfield-near"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}

        {!minimal && (
        <div
          className="cabin-nebula"
          style={{
            top: '10%',
            right: '-4%',
            width: '34%',
            height: '36%',
            background: 'radial-gradient(circle, rgba(112,150,255,0.22) 0%, rgba(112,150,255,0.08) 36%, transparent 72%)',
          }}
        />
        )}

        {!minimal && (
        <div
          className="cabin-nebula"
          style={{
            bottom: '6%',
            left: '4%',
            width: '38%',
            height: '38%',
            background: 'radial-gradient(circle, rgba(120,92,196,0.18) 0%, rgba(120,92,196,0.07) 32%, transparent 72%)',
            animationDuration: '34s',
          }}
        />
        )}

        {!minimal && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(16% + 55px)',
            right: 'calc(11% - 90px)',
            width: 360,
            height: 70,
            borderRadius: '50%',
            background: `
              radial-gradient(
                ellipse at center,
                rgba(245, 231, 204, 0) 0 48%,
                rgba(212, 184, 142, 0.08) 56%,
                rgba(120, 90, 58, 0.08) 66%,
                rgba(245, 231, 204, 0) 76%
              )
            `,
            transform: 'rotate(-18deg)',
            boxShadow: '0 0 8px rgba(214, 200, 178, 0.04)',
            opacity: 0.22,
            clipPath: 'inset(0 0 54% 0)',
          }}
        />
        )}

        {!minimal && (
        <div
          className="cabin-planet"
          style={{
            top: '16%',
            right: '11%',
            width: 180,
            height: 180,
            background: `
              radial-gradient(circle at 30% 26%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.22) 10%, transparent 22%),
              radial-gradient(circle at 38% 35%, rgba(255,230,170,0.16), transparent 28%),
              radial-gradient(circle at 78% 80%, rgba(8,10,18,0.88) 0%, rgba(8,10,18,0.6) 24%, transparent 42%),
              linear-gradient(180deg,
                rgba(214,186,132,1) 0%,
                rgba(186,144,95,1) 14%,
                rgba(224,196,142,1) 27%,
                rgba(164,122,82,1) 40%,
                rgba(216,182,126,1) 53%,
                rgba(150,108,76,1) 67%,
                rgba(196,158,111,1) 81%,
                rgba(124,89,60,1) 100%
              )
            `,
            boxShadow: `
              0 0 60px rgba(214,170,110,0.12),
              inset -22px -28px 40px rgba(0,0,0,0.38),
              inset 10px 10px 24px rgba(255,255,255,0.08)
            `,
          }}
        />
        )}

        {!minimal && (
        <div
          style={{
            position: 'absolute',
            top: '15.2%',
            right: '10.2%',
            width: 196,
            height: 196,
            borderRadius: '50%',
            border: '1px solid rgba(126,194,255,0.18)',
            boxShadow: '0 0 26px rgba(98,170,255,0.12)',
            opacity: 0.55,
          }}
        />
        )}

        {!minimal && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(16% + 55px)',
            right: 'calc(11% - 90px)',
            width: 360,
            height: 70,
            borderRadius: '50%',
            background: `
              radial-gradient(
                ellipse at center,
                rgba(255, 243, 220, 0) 0 50%,
                rgba(255, 243, 220, 0.09) 58%,
                rgba(255, 243, 220, 0) 64%
              )
            `,
            transform: 'rotate(-18deg)',
            opacity: 0.3,
          }}
        />
        )}

        {!minimal && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(16% + 55px)',
            right: 'calc(11% - 90px)',
            width: 360,
            height: 70,
            borderRadius: '50%',
            background: `
              radial-gradient(
                ellipse at center,
                rgba(255, 245, 228, 0) 0 46%,
                rgba(255, 239, 214, 0.14) 54%,
                rgba(232, 201, 158, 0.24) 60%,
                rgba(137, 103, 66, 0.16) 67%,
                rgba(255, 245, 228, 0) 74%
              )
            `,
            transform: 'rotate(-18deg)',
            boxShadow: '0 0 10px rgba(232, 215, 191, 0.05)',
            opacity: 0.48,
            clipPath: 'inset(58% 0 0 0)',
          }}
        />
        )}

        {!minimal && (
        <div
          className="cabin-planet"
          style={{
            bottom: '-7%',
            left: '8%',
            width: 110,
            height: 110,
            background: `
              radial-gradient(circle at 30% 24%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.16) 12%, transparent 22%),
              radial-gradient(circle at 74% 80%, rgba(8,10,18,0.84) 0%, rgba(8,10,18,0.58) 20%, transparent 40%),
              linear-gradient(145deg, rgba(168,174,198,1) 0%, rgba(92,98,124,1) 48%, rgba(28,30,44,1) 100%)
            `,
            boxShadow: `
              0 0 34px rgba(165,176,220,0.08),
              inset -10px -12px 18px rgba(0,0,0,0.28),
              inset 4px 4px 10px rgba(255,255,255,0.06)
            `,
            opacity: 0.76,
          }}
        />
        )}

        {!minimal && (
        <div
          className="cabin-shuttle"
          style={{
            top: '34%',
            left: '18%',
            width: 90,
            height: 26,
          }}
        />
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: '3% 4% 6%',
          borderRadius: 28,
          border: '1px solid rgba(150, 190, 220, 0.12)',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px rgba(17, 22, 30, 0.52)
          `,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '0.8%',
          left: '8%',
          right: '8%',
          height: '10%',
          borderBottomLeftRadius: 38,
          borderBottomRightRadius: 38,
          background: 'linear-gradient(180deg, rgba(48,56,68,0.92), rgba(22,28,36,0.84) 42%, rgba(10,14,20,0.08))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 30px rgba(0,0,0,0.22)',
          clipPath: 'polygon(4% 0%, 96% 0%, 88% 100%, 12% 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '3.5%',
          top: '8%',
          bottom: '8%',
          width: '7%',
          background: 'linear-gradient(90deg, rgba(42,50,60,0.94), rgba(18,24,31,0.86) 48%, rgba(10,14,20,0.04))',
          clipPath: 'polygon(0% 6%, 100% 0%, 70% 100%, 0% 94%)',
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.08)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: '3.5%',
          top: '8%',
          bottom: '8%',
          width: '7%',
          background: 'linear-gradient(270deg, rgba(42,50,60,0.94), rgba(18,24,31,0.86) 48%, rgba(10,14,20,0.04))',
          clipPath: 'polygon(0% 0%, 100% 6%, 100% 94%, 30% 100%)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.08)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '16%',
          right: '16%',
          bottom: '4.5%',
          height: '8%',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          background: 'linear-gradient(180deg, rgba(44,52,62,0.82), rgba(15,19,27,0.96))',
          clipPath: 'polygon(0% 100%, 10% 0%, 90% 0%, 100% 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 -8px 20px rgba(0,0,0,0.18)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '5% 7% 10%',
          borderRadius: 26,
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.008) 8%, rgba(255,255,255,0) 18%)
          `,
          opacity: 0.08,
          transform: 'perspective(1000px) rotateX(6deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '8%',
          width: '30%',
          height: 84,
          borderRadius: 20,
          border: '1px solid rgba(0,229,255,0.08)',
          background: 'linear-gradient(180deg, rgba(170,230,255,0.08), rgba(170,230,255,0.015))',
          opacity: 0.04,
          transform: 'skewY(-8deg) rotate(-7deg)',
          filter: 'blur(0.2px)',
        }}
      >
        <div style={{ padding: '16px 18px', color: 'rgba(214,243,255,0.08)', fontSize: 11, letterSpacing: 2.2 }}>
          SALDO / AUDIO / SENSORES
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '26%',
          right: '9%',
          width: '24%',
          minHeight: 170,
          borderRadius: 22,
          border: '1px solid rgba(0,229,255,0.08)',
          background: 'linear-gradient(180deg, rgba(164,230,255,0.05), rgba(164,230,255,0.012))',
          opacity: 0.035,
          transform: 'skewY(6deg) rotate(6deg)',
        }}
      >
        <div style={{ padding: '18px 16px 10px', color: 'rgba(221,244,255,0.08)', fontSize: 10, letterSpacing: 2.4 }}>
          TRAFICO DE FLOTILLA
        </div>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              margin: '0 16px 10px',
              height: 18,
              borderRadius: 999,
              background: 'linear-gradient(90deg, rgba(198,239,255,0.04), rgba(198,239,255,0.01))',
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '14%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '42%',
          borderRadius: 18,
          border: '1px solid rgba(193,238,255,0.1)',
          background: 'linear-gradient(180deg, rgba(193,238,255,0.05), rgba(193,238,255,0.012))',
          opacity: 0.03,
          padding: '10px 18px',
          textAlign: 'center',
          color: 'rgba(214,243,255,0.08)',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 3, marginBottom: 6 }}>{phaseLabel}</div>
        <div style={{ fontSize: 12, letterSpacing: 1.6 }}>
          {activePlayers} OPERADORES | RONDA {round}/{maxRounds}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: '4% 5% 8%',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.12),
            inset 0 -18px 26px rgba(0,0,0,0.18),
            inset 18px 0 28px rgba(0,0,0,0.08),
            inset -18px 0 28px rgba(0,0,0,0.08)
          `,
        }}
      />
    </div>
  )
}

export function Cabin({
  desktopOnly = false,
  onCallPlayer, onAcceptCall, onRejectCall, onHangUp,
  onSubmitDecision, onVotePlayer, onSubmitLineGuesses, onPassBomb, onAttemptDefuse, onSkipToFinish, onInterference,
  onSubmitSabotage, onSubmitReport, onSubmitEmergencyResponse, onVoteEmoji,
  onSendSignal,
  audioData, isSpeaking, onShowRules,
}: Props) {
  const { tr } = useI18n()
  const phase = useGameStore(s => s.phase)
  const round = useGameStore(s => s.round)
  const maxRounds = useGameStore(s => s.maxRounds)
  const players = useGameStore(s => s.players)
  const myPlayer = useGameStore(s => s.getMyPlayer())
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const phaseEndTime = useGameStore(s => s.phaseEndTime)
  const bombState = useGameStore(s => s.bombState)
  const emergencyState = useGameStore(s => s.emergencyState)
  const emojiState = useGameStore(s => s.emojiState)
  const [consoleExpanded, setConsoleExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  const activePlayers = players.filter(p => p.isAlive).length
  const isVotingMinigame = activeMinigameId?.startsWith('votacion') ?? false
  const isGuessMinigame = activeMinigameId === 'adivina-linea'
  const isBombMinigame = activeMinigameId === 'la-bomba'
  const isEmergencyMinigame = activeMinigameId === 'central-emergencias'
  const isEmojiMinigame = activeMinigameId === 'emoji-diferente'
  const effectiveEmojiInternalPhase =
    phase === GamePhase.DECISION_PHASE
      ? 'VOTING'
      : phase === GamePhase.RESULT_PHASE
        ? 'RESULT'
        : phase === GamePhase.CALL_PHASE && emojiState?.internalPhase === 'REVEAL' && phaseEndTime - Date.now() > 10000
          ? 'DISCUSSION'
          : emojiState?.internalPhase
  const minigameAccent = getMinigameAccent(activeMinigameId)
  const tutorialCopy = getTutorialCopy(activeMinigameId)
  const phaseInstruction = getPhaseInstruction({
    activeMinigameId,
    phase,
    phaseEndTime,
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
    if (!activeMinigameId || typeof window === 'undefined') return
    const key = `lm_tutorial_seen:${activeMinigameId}`
    const seen = window.sessionStorage.getItem(key) === '1'
    setShowTutorial(!seen)
    if (!seen) window.sessionStorage.setItem(key, '1')
  }, [activeMinigameId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncViewport = () => setIsMobile(desktopOnly ? false : window.innerWidth <= 900)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [desktopOnly])

  if (phase === GamePhase.GAME_OVER) {
    return <GameOver />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '100%',
      width: '100%',
      background: isEmojiMinigame
        ? `
          radial-gradient(circle at 18% 16%, rgba(0,229,255,0.14), transparent 26%),
          radial-gradient(circle at 82% 20%, rgba(0,255,65,0.08), transparent 24%),
          linear-gradient(180deg, #08111b 0%, #09131d 52%, #08111a 100%)
        `
        : `
          radial-gradient(circle at 12% 18%, ${minigameAccent}, transparent 34%),
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
        boxShadow: isEmojiMinigame
          ? 'inset 0 0 24px rgba(0, 229, 255, 0.05)'
          : 'inset 0 0 38px rgba(0, 229, 255, 0.06), inset 0 -36px 80px rgba(0,0,0,0.42)',
      }}>
        {!isMobile && <SystemToasts />}
        <CabinViewportBackdrop
          phaseLabel={tr(phaseLabels[phase] ?? phase)}
          activePlayers={activePlayers}
          round={round}
          maxRounds={maxRounds}
          minimal={isEmojiMinigame}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: isEmojiMinigame
              ? `
                linear-gradient(90deg, rgba(0,0,0,0.14) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.14) 100%),
                linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 22%, transparent 76%, rgba(0,0,0,0.16) 100%)
              `
              : `
                linear-gradient(90deg, rgba(0,0,0,0.34) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.34) 100%),
                linear-gradient(180deg, rgba(0,0,0,0.44) 0%, transparent 22%, transparent 76%, rgba(0,0,0,0.52) 100%)
              `,
          }}
        />
        {/* Minigame header bar */}
        {!isMobile && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <MinigameHeader />
          </div>
        )}

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
          {!isMobile && <BalanceDisplay />}

          <div style={{
            display: 'flex',
            gap: isMobile ? 18 : 32,
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {!isMobile && <AudioControls />}

            <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2 }}>
                {tr('JUGADORES ACTIVOS')}
              </div>
              <div style={{ fontSize: isMobile ? 18 : 24, color: 'var(--green-neon)' }}>
                {activePlayers}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 2 }}>
                {tr('RONDA')}
              </div>
              <div style={{ fontSize: isMobile ? 18 : 24, color: 'var(--white)' }}>
                {round}<span style={{ fontSize: 14, color: 'var(--gray-text)' }}>/{maxRounds}</span>
              </div>
            </div>

            <button
              onClick={onShowRules}
              style={{
                background: 'none',
                border: '1px solid var(--gray-shadow)',
                color: 'var(--gray-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                width: isMobile ? 30 : 32,
                height: isMobile ? 30 : 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={tr('Reglas del juego')}
            >
              ?
            </button>

          </div>
        </div>

        {desktopOnly && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              padding: '8px 24px',
              borderBottom: '1px solid rgba(0,229,255,0.12)',
              background: 'linear-gradient(180deg, rgba(5, 10, 16, 0.9), rgba(5, 10, 16, 0.72))',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--cyan)',
                boxShadow: '0 0 10px rgba(0,229,255,0.9)',
              }}
            />
            <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
              {tr('Cabina de juego optimizada para PC')}
            </div>
          </div>
        )}

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
            color: phase === GamePhase.DECISION_PHASE ? 'var(--red-danger)' : phase === GamePhase.RESULT_PHASE ? 'var(--cyan)' : 'var(--green-dim)',
            letterSpacing: 2.6,
            textTransform: 'uppercase',
            border: `1px solid ${phase === GamePhase.DECISION_PHASE ? 'rgba(255,23,68,0.5)' : phase === GamePhase.RESULT_PHASE ? 'rgba(0,229,255,0.45)' : 'rgba(0,255,65,0.42)'}`,
            background: phase === GamePhase.DECISION_PHASE
              ? 'rgba(255,23,68,0.09)'
              : phase === GamePhase.RESULT_PHASE
                ? 'rgba(0,229,255,0.08)'
                : 'rgba(0,255,65,0.08)',
            padding: '5px 12px',
            boxShadow: phase === GamePhase.DECISION_PHASE
              ? '0 0 14px rgba(255,23,68,0.18)'
              : phase === GamePhase.RESULT_PHASE
                ? '0 0 14px rgba(0,229,255,0.16)'
                : '0 0 14px rgba(0,255,65,0.16)',
          }}
          className={phase === GamePhase.DECISION_PHASE ? 'pulse' : ''}
          >
            {tr(phaseLabels[phase] ?? phase)}
          </div>
          <PhaseTimer />
        </div>

        {/* Content area */}
        <ScrollHintBox
          style={{
          flex: 1,
          minHeight: 0,
          }}
          contentStyle={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 20,
            minHeight: '100%',
            padding: consoleExpanded
            ? (isMobile ? '16px 12px 250px' : '24px 24px 250px')
            : (isMobile ? '16px 12px 104px' : '24px 24px 104px'),
            position: 'relative',
            zIndex: 1,
            transition: 'padding-bottom 0.22s ease',
          }}
        >
          {showTutorial && tutorialCopy && (
            <div style={{ width: '100%', maxWidth: isMobile ? 420 : 760 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: isMobile ? '8px 10px' : '10px 12px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--cyan)', letterSpacing: 2 }}>{tr('TIP RAPIDO')}</div>
                  <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--white)', marginTop: 4, lineHeight: 1.45 }}>{tr(tutorialCopy)}</div>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: 'var(--gray-text)',
                    width: 28,
                    height: 28,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  x
                </button>
              </div>
            </div>
          )}
          {phaseInstruction && (
            <div
              style={{
                width: '100%',
                maxWidth: isMobile ? 420 : 780,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: isMobile ? '10px 12px' : '12px 18px',
                  border: '1px solid rgba(0,229,255,0.28)',
                  background: 'linear-gradient(180deg, rgba(0,229,255,0.08), rgba(0,229,255,0.03))',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.24)',
                }}
              >
                <div style={{ fontSize: isMobile ? 9 : 10, color: 'var(--cyan)', letterSpacing: isMobile ? 2 : 3, marginBottom: 6 }}>
                  {tr(phaseInstruction.label)}
                </div>
                <div style={{ fontSize: isMobile ? 13 : 15, color: 'var(--white)', lineHeight: 1.45 }}>
                  {tr(phaseInstruction.text)}
                </div>
                {!isMobile && (
                  <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 1.4, marginTop: 8 }}>
                  {tr('Reglas completas en el icono `?`')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emergency minigame: show panel + CallPanel only during TRANSMISSION for technicians */}
          {isEmergencyMinigame && (
            <EmergencyPanel
              onSubmitSabotage={onSubmitSabotage}
              onSubmitReport={onSubmitReport}
              onSubmitEmergencyResponse={onSubmitEmergencyResponse}
            />
          )}

          {/* Emoji minigame: CallPanel only during DISCUSSION phase */}
          {phase === GamePhase.CALL_PHASE && isEmojiMinigame && effectiveEmojiInternalPhase === 'DISCUSSION' && (
            <div style={{ width: '100%', maxWidth: 880, padding: '10px 14px', border: '1px solid rgba(0,255,65,0.22)', background: 'rgba(0,255,65,0.05)', color: 'var(--gray-text)', fontSize: 11, lineHeight: 1.5, textAlign: 'center' }}>
              {tr('Las lineas estan abiertas. Usa el panel derecho para llamar, aceptar o rechazar.') }
            </div>
          )}

          {/* Emoji Diferente minigame */}
          {isEmojiMinigame && (
            <EmojiPanel onVoteEmoji={onVoteEmoji} />
          )}

          {phase === GamePhase.CALL_PHASE && isEmergencyMinigame && emergencyState?.internalPhase === 'TRANSMISSION' && emergencyState?.myRole !== 'operator' && (
            <div style={{ width: '100%', maxWidth: 760, padding: '10px 14px', border: '1px solid rgba(0,229,255,0.18)', background: 'rgba(0,229,255,0.04)', color: 'var(--gray-text)', fontSize: 11, lineHeight: 1.5, textAlign: 'center' }}>
              {tr('Las llamadas y respuestas estan en el panel derecho.') }
            </div>
          )}

          {phase === GamePhase.CALL_PHASE && isBombMinigame && bombState?.holderId === myPlayer?.id && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <div style={{
                width: '100%',
                maxWidth: 880,
                padding: '10px 14px',
                border: '1px solid rgba(255,23,68,0.24)',
                background: 'rgba(255,23,68,0.05)',
                color: 'var(--gray-text)',
                fontSize: 11,
                lineHeight: 1.5,
                textAlign: 'center',
              }}>
                {tr('En La Bomba sigues pudiendo llamar a otras naves mientras decides si desactivar o pasar la bomba.')}
              </div>
              <BombPanel
                onPassBomb={onPassBomb}
                onAttemptDefuse={onAttemptDefuse}
              />
            </div>
          )}

          {phase === GamePhase.CALL_PHASE && isBombMinigame && bombState?.holderId !== myPlayer?.id && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <div style={{
                width: '100%',
                maxWidth: 760,
                padding: '10px 14px',
                border: '1px solid rgba(0,229,255,0.18)',
                background: 'rgba(0,229,255,0.04)',
                color: 'var(--gray-text)',
                fontSize: 11,
                lineHeight: 1.5,
                textAlign: 'center',
              }}>
                {tr('Puedes usar llamadas para presionar, distraer o convencer al portador antes de que el contador llegue a cero.')}
              </div>
              <BombSpectatorPanel />
            </div>
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
        </ScrollHintBox>

        {!isMobile && <AutoLogPanel />}
        {!isMobile && <IdleNotesPanel />}
        {isMobile && (
          <MobileToolsDrawer
            open={mobileToolsOpen}
            onToggle={() => setMobileToolsOpen((value) => !value)}
            onShowRules={onShowRules}
            onSendSignal={onSendSignal}
          />
        )}
        {isBombMinigame && <BombOutcomeOverlay />}
      </div>

      {/* Player sidebar */}
      {!isMobile && (
        <PlayerList
          onSendSignal={onSendSignal}
          onCallPlayer={onCallPlayer}
          onAcceptCall={onAcceptCall}
          onRejectCall={onRejectCall}
          onHangUp={onHangUp}
        />
      )}
    </div>
  )
}
