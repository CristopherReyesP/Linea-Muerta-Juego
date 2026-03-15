import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

interface Props {
  onSubmitSabotage: (data: { field: string; value: string }) => void
  onSubmitReport: (text: string) => void
  onSubmitEmergencyResponse: (optionIndex: number) => void
}

const roleStyles: Record<string, { color: string; label: string; description: string; rules: string[] }> = {
  operator: {
    color: 'var(--cyan)',
    label: 'OPERADOR DE EMERGENCIAS',
    description: 'Recibiras reportes de los tecnicos. Debes identificar la emergencia correcta.',
    rules: [
      'No puedes llamar ni recibir llamadas',
      'Formato del mensaje: EMERGENCIA + UBICACION + ACCESO',
      'Recibiras reportes escritos de los tecnicos (max 3 palabras cada uno)',
      'Hay 3 emisores: 2 tecnicos y 1 saboteador',
      'Cada emisor tiene una opcion REAL y una FALSA para comparar',
      'Debes elegir la emergencia correcta entre 4 opciones',
      'La mayoria de operadores debe acertar para ganar',
      'Si la mayoria acierta: todos ganan +1 pt excepto el saboteador',
      'Si la mayoria falla: el saboteador gana +1 pt',
    ],
  },
  saboteur: {
    color: 'var(--red-danger)',
    label: 'SABOTEADOR',
    description: 'Recibes una pista real y una falsa. Debes colar la falsa.',
    rules: [
      'Formato del mensaje: EMERGENCIA + UBICACION + ACCESO',
      'Recibes una dupla de pista: valor REAL y valor FALSO',
      'Tu objetivo es impulsar el valor FALSO',
      'Llama a otros tecnicos para convencerlos de tu version',
      'Envia un reporte de 3 palabras para desviar al operador',
      'Si la mayoria de operadores falla: ganas +1 pt',
      'Si la mayoria acierta: ganas 0 pts',
    ],
  },
  technician: {
    color: 'var(--green-neon)',
    label: 'TECNICO',
    description: 'Tienes una pista parcial con opcion real y falsa. Defiende la real.',
    rules: [
      'Formato del mensaje: EMERGENCIA + UBICACION + ACCESO',
      'Recibes una dupla de pista: valor REAL y valor FALSO',
      'Tu objetivo es impulsar el valor REAL',
      'Llama a otros tecnicos para compartir pistas y armar el mensaje',
      'Cuidado: uno de ustedes es saboteador e intentara colar su valor falso',
      'Envia un reporte de max 3 palabras al operador',
      'No puedes llamar al operador',
      'Si la mayoria de operadores acierta: ganas +1 pt',
      'Si la mayoria falla: ganas 0 pts',
    ],
  },
}

function RoleBadge({ myRole, showRules, onToggleRules }: { myRole: string; showRules: boolean; onToggleRules: () => void }) {
  const style = roleStyles[myRole]
  if (!style) return null

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      marginBottom: 8,
    }}>
      <div
        onClick={onToggleRules}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          border: `1px solid ${style.color}`,
          background: `${style.color}11`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: style.color,
            boxShadow: `0 0 6px ${style.color}`,
          }} />
          <span style={{ fontSize: 11, fontWeight: 'bold', color: style.color, letterSpacing: 2 }}>
            {style.label}
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--gray-text)' }}>
          {showRules ? 'OCULTAR' : 'REGLAS'}
        </span>
      </div>

      {showRules && (
        <div style={{
          padding: '8px 12px',
          borderLeft: `1px solid ${style.color}`,
          borderRight: `1px solid ${style.color}`,
          borderBottom: `1px solid ${style.color}`,
          background: `${style.color}08`,
        }}>
          {style.rules.map((rule, i) => (
            <div key={i} style={{
              fontSize: 10,
              color: 'var(--gray-text)',
              padding: '3px 0',
              paddingLeft: 8,
              borderLeft: `2px solid ${style.color}33`,
              marginBottom: 2,
              lineHeight: 1.4,
            }}>
              {rule}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EmergencyPanel({ onSubmitSabotage: _onSubmitSabotage, onSubmitReport, onSubmitEmergencyResponse }: Props) {
  const emergencyState = useGameStore(s => s.emergencyState)
  const players = useGameStore(s => s.players)

  const [reportText, setReportText] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [responseSubmitted, setResponseSubmitted] = useState(false)
  const [showRules, setShowRules] = useState(true)

  if (!emergencyState) return null

  const { internalPhase, myRole, operatorNames } = emergencyState
  const style = roleStyles[myRole]

  // --- ROLES PHASE ---
  if (internalPhase === 'ROLES') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: 32,
          border: `1px solid ${style.color}`,
          background: `${style.color}11`,
          maxWidth: 400,
        }}
      >
        <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 3 }}>TU ROL</div>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: style.color, letterSpacing: 3 }}>
          {style.label}
        </div>
        <div style={{ fontSize: 18, color: 'var(--white)', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
          Una pieza falsa puede arruinar toda la operacion
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-text)', textAlign: 'center', lineHeight: 1.6 }}>
          {style.description}
        </div>
        <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 8 }}>
          {operatorNames.length === 1 ? 'Operador' : 'Operadores'}: {operatorNames.join(', ')}
        </div>

        {/* Show rules in ROLES phase */}
        <div style={{ width: '100%', marginTop: 8 }}>
          {style.rules.map((rule, i) => (
            <div key={i} style={{
              fontSize: 10,
              color: 'var(--gray-text)',
              padding: '3px 0',
              paddingLeft: 8,
              borderLeft: `2px solid ${style.color}33`,
              marginBottom: 2,
              lineHeight: 1.4,
            }}>
              {rule}
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  // --- SABOTAGE PHASE ---
  if (internalPhase === 'SABOTAGE') {
    if (myRole === 'saboteur' && emergencyState.sabotageInfo) {
      const info = emergencyState.sabotageInfo
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 24,
            maxWidth: 420,
          }}
        >
          <RoleBadge myRole={myRole} showRules={showRules} onToggleRules={() => setShowRules(v => !v)} />
          <div style={{ fontSize: 10, color: 'var(--red-danger)', letterSpacing: 3 }}>INSTRUCCIONES DEL SABOTEADOR</div>
          <div style={{ fontSize: 18, color: 'var(--white)', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
            Tu mentira debe sonar mas creible que la verdad
          </div>

          <div style={{ padding: '12px 16px', border: '1px solid var(--red-danger)', background: 'rgba(255,0,0,0.05)', width: '100%' }}>
            <div style={{ fontSize: 9, color: 'var(--red-danger)', letterSpacing: 2, marginBottom: 6 }}>
              TU CAMPO: {info.label}
            </div>
            <div style={{ fontSize: 13, color: 'var(--white)' }}>
              Valor REAL: <strong>{info.realValue}</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--white)', marginTop: 4 }}>
              Valor FALSO: <strong>{info.fakeValue ?? info.currentFake ?? '???'}</strong>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--gray-text)', textAlign: 'center' }}>
            Ya tienes una opcion real y una falsa. En transmision intenta que crean la falsa.
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)' }} className="pulse">
            Esperando inicio de transmision...
          </div>
        </motion.div>
      )
    }

    // Non-saboteur waiting
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24, maxWidth: 420, width: '100%' }}
      >
        <RoleBadge myRole={myRole} showRules={showRules} onToggleRules={() => setShowRules(v => !v)} />
        <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 3 }}>PREPARANDO EMERGENCIA</div>
        <div style={{ fontSize: 17, color: 'var(--white)', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Pronto alguien intentara contaminar el mensaje
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-text)' }} className="pulse">
          Esperando informacion...
        </div>
      </motion.div>
    )
  }

  // --- TRANSMISSION PHASE ---
  if (internalPhase === 'TRANSMISSION') {
    if (myRole === 'operator') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 24,
            maxWidth: 400,
          }}
        >
          <RoleBadge myRole={myRole} showRules={showRules} onToggleRules={() => setShowRules(v => !v)} />
          <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 3 }}>RECIBIENDO REPORTES</div>
          <div style={{ fontSize: 18, color: 'var(--white)', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Debes reconstruir la verdad con fragmentos dudosos
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center' }}>
            Los tecnicos estan coordinando y enviando reportes. No puedes llamar a nadie.
          </div>

          <div style={{ width: '100%', marginTop: 8 }}>
            {emergencyState.reports.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center' }} className="pulse">
                Esperando reportes...
              </div>
            ) : (
              emergencyState.reports.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--cyan)',
                    background: 'rgba(0,229,255,0.05)',
                    marginBottom: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--gray-text)' }}>{r.playerName}:</span>
                  <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 'bold' }}>{r.text}</span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )
    }

    // Technician/Saboteur - see their clue + send report
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 24,
          maxWidth: 400,
        }}
      >
        <RoleBadge myRole={myRole} showRules={showRules} onToggleRules={() => setShowRules(v => !v)} />
        <div style={{ fontSize: 10, color: 'var(--green-neon)', letterSpacing: 3 }}>TRANSMISION</div>
        <div style={{ fontSize: 18, color: 'var(--white)', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Convencer a los demas vale tanto como tener la pista correcta
        </div>

        {/* Show the player's clue */}
        {emergencyState.myClue && (
          <div style={{
            padding: '12px 16px',
            border: `1px solid ${myRole === 'saboteur' ? 'var(--red-danger)' : 'var(--green-dim)'}`,
            background: myRole === 'saboteur' ? 'rgba(255,0,0,0.05)' : 'rgba(0,255,65,0.05)',
            width: '100%',
          }}>
            <div style={{
              fontSize: 9,
              color: myRole === 'saboteur' ? 'var(--red-danger)' : 'var(--green-dim)',
              letterSpacing: 2,
              marginBottom: 6,
            }}>
              TU PISTA — {emergencyState.myClue.label}
            </div>
            {emergencyState.myClue.realValue && emergencyState.myClue.fakeValue ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--white)' }}>
                  REAL: <strong>{emergencyState.myClue.realValue}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--white)' }}>
                  FALSA: <strong>{emergencyState.myClue.fakeValue}</strong>
                </div>
                <div style={{ fontSize: 10, color: myRole === 'saboteur' ? 'var(--red-danger)' : 'var(--green-dim)' }}>
                  {myRole === 'saboteur'
                    ? `Objetivo: impulsar FALSA (${emergencyState.myClue.fakeValue})`
                    : `Objetivo: impulsar REAL (${emergencyState.myClue.realValue})`}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 16, color: 'var(--white)', fontWeight: 'bold' }}>
                {emergencyState.myClue.value}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center' }}>
          Llama a otros tecnicos para compartir pistas. Luego envia un reporte de max 3 palabras al operador.
        </div>

        {!reportSubmitted ? (
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input
              type="text"
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder="Max 3 palabras..."
              maxLength={50}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--gray-shadow)',
                color: 'var(--white)',
                fontFamily: 'inherit',
                fontSize: 12,
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && reportText.trim()) {
                  const words = reportText.trim().split(/\s+/)
                  if (words.length <= 3) {
                    onSubmitReport(reportText.trim())
                    setReportSubmitted(true)
                  }
                }
              }}
            />
            <button
              className="btn btn-green"
              onClick={() => {
                const words = reportText.trim().split(/\s+/)
                if (words.length <= 3 && words.length > 0) {
                  onSubmitReport(reportText.trim())
                  setReportSubmitted(true)
                }
              }}
              disabled={!reportText.trim() || reportText.trim().split(/\s+/).length > 3}
              style={{ fontSize: 11 }}
            >
              ENVIAR
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--green-dim)', letterSpacing: 1 }}>
            Reporte enviado
          </div>
        )}

        {emergencyState.reports.length > 0 && (
          <div style={{ width: '100%', marginTop: 4 }}>
            <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2, marginBottom: 4 }}>REPORTES ENVIADOS</div>
            {emergencyState.reports.map((r, i) => (
              <div key={i} style={{
                padding: '4px 8px',
                fontSize: 11,
                color: 'var(--gray-text)',
                borderLeft: '2px solid var(--green-dim)',
                marginBottom: 4,
              }}>
                {r.playerName}: <span style={{ color: 'var(--white)' }}>{r.text}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    )
  }

  // --- OPERATOR RESPONSE PHASE ---
  if (internalPhase === 'OPERATOR_RESPONSE') {
    if (myRole === 'operator' && emergencyState.responseOptions) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 24,
            maxWidth: 420,
          }}
        >
          <RoleBadge myRole={myRole} showRules={showRules} onToggleRules={() => setShowRules(v => !v)} />
          <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 3 }}>ELIGE LA EMERGENCIA CORRECTA</div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center' }}>
            Basandote en los reportes, selecciona la emergencia real.
          </div>

          {emergencyState.reports.length > 0 && (
            <div style={{ width: '100%', marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2, marginBottom: 4 }}>REPORTES RECIBIDOS</div>
              {emergencyState.reports.map((r, i) => (
                <div key={i} style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  color: 'var(--gray-text)',
                  borderLeft: '2px solid var(--cyan)',
                  marginBottom: 4,
                }}>
                  {r.playerName}: <span style={{ color: 'var(--white)' }}>{r.text}</span>
                </div>
              ))}
            </div>
          )}

          {emergencyState.responseOptions.map((option, i) => {
            const isMyChoice = emergencyState.myChoice === i
            return (
              <button
                key={i}
                className="btn"
                onClick={() => {
                  if (!responseSubmitted) {
                    onSubmitEmergencyResponse(i)
                    setResponseSubmitted(true)
                  }
                }}
                disabled={responseSubmitted}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: 12,
                  textAlign: 'left',
                  border: `1px solid ${isMyChoice ? 'var(--green-neon)' : 'var(--cyan)'}`,
                  background: isMyChoice ? 'rgba(0,255,65,0.1)' : 'rgba(0,229,255,0.05)',
                  color: 'var(--white)',
                  cursor: responseSubmitted ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {option}
              </button>
            )
          })}

          {responseSubmitted && (
            <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 4 }}>
              Votos: {emergencyState.operatorVoteCount ?? 0} / {emergencyState.operatorTotal} — esperando otros operadores...
            </div>
          )}
        </motion.div>
      )
    }

    // Non-operator: show their clue for reference while waiting
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24, maxWidth: 420, width: '100%' }}
      >
        <RoleBadge myRole={myRole} showRules={showRules} onToggleRules={() => setShowRules(v => !v)} />
        <div style={{ fontSize: 10, color: 'var(--gray-text)', letterSpacing: 3 }}>RESPUESTA DE OPERADORES</div>

        {emergencyState.myClue && (
          <div style={{
            padding: '8px 12px',
            border: '1px solid var(--gray-shadow)',
            background: 'rgba(255,255,255,0.02)',
            width: '100%',
          }}>
            <div style={{ fontSize: 9, color: 'var(--gray-text)', letterSpacing: 2, marginBottom: 4 }}>
              TU PISTA — {emergencyState.myClue.label}
            </div>
            {emergencyState.myClue.realValue && emergencyState.myClue.fakeValue ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--white)' }}>
                  REAL: <strong>{emergencyState.myClue.realValue}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--white)' }}>
                  FALSA: <strong>{emergencyState.myClue.fakeValue}</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--white)' }}>{emergencyState.myClue.value}</div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 4 }}>
          Votos: {emergencyState.operatorVoteCount ?? 0} / {emergencyState.operatorTotal}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-text)' }} className="pulse">
          Los operadores estan eligiendo su respuesta...
        </div>
      </motion.div>
    )
  }

  // --- RESULT PHASE ---
  if (internalPhase === 'RESULT') {
    const saboteurName = emergencyState.saboteurId
      ? players.find(p => p.id === emergencyState.saboteurId)?.name ?? '???'
      : '???'

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 24,
          maxWidth: 420,
        }}
      >
        <div style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: emergencyState.success ? 'var(--green-neon)' : 'var(--red-danger)',
          letterSpacing: 2,
        }}>
          {emergencyState.success ? 'EMERGENCIA RESUELTA' : 'SABOTAJE EXITOSO'}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '8px 12px', border: '1px solid var(--green-dim)', background: 'rgba(0,255,65,0.05)' }}>
            <div style={{ fontSize: 9, color: 'var(--green-dim)', letterSpacing: 2, marginBottom: 4 }}>MENSAJE REAL</div>
            <div style={{ fontSize: 12, color: 'var(--white)' }}>{emergencyState.realMessage}</div>
          </div>

          {emergencyState.sabotageInfo && (
            <div style={{ padding: '8px 12px', border: '1px solid var(--red-danger)', background: 'rgba(255,0,0,0.05)' }}>
              <div style={{ fontSize: 9, color: 'var(--red-danger)', letterSpacing: 2, marginBottom: 4 }}>PISTA FALSA</div>
              <div style={{ fontSize: 12, color: 'var(--white)' }}>
                {emergencyState.sabotageInfo.label}: <strong>{emergencyState.sabotageInfo.fakeValue}</strong>
                <span style={{ color: 'var(--gray-text)' }}> (real: {emergencyState.sabotageInfo.realValue})</span>
              </div>
            </div>
          )}

          {emergencyState.responseOptions && emergencyState.operatorChoices && (
            <div style={{ padding: '8px 12px', border: '1px solid var(--cyan)', background: 'rgba(0,229,255,0.05)' }}>
              <div style={{ fontSize: 9, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 4 }}>VOTOS DE OPERADORES</div>
              {operatorNames.map((name, idx) => {
                const opId = emergencyState.operatorIds[idx]
                const choice = emergencyState.operatorChoices?.[opId]
                return (
                  <div key={opId} style={{ fontSize: 11, color: 'var(--white)', marginBottom: 4 }}>
                    <span style={{ color: 'var(--cyan)' }}>{name}:</span>{' '}
                    {choice !== undefined && emergencyState.responseOptions
                      ? emergencyState.responseOptions[choice]
                      : 'No voto'}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--red-danger)' }}>
          Saboteador: {saboteurName}
        </div>

        <div style={{
          fontSize: 12,
          color: emergencyState.success ? 'var(--green-neon)' : 'var(--red-danger)',
        }}>
          {emergencyState.success
            ? 'Todos los tecnicos y operadores ganan +1 punto'
            : 'El saboteador gana +1 punto'
          }
        </div>
      </motion.div>
    )
  }

  return null
}
