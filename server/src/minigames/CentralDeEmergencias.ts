import { Server } from 'socket.io'
import { Player } from '../Player'
import { CallManager } from '../CallManager'
import { MiniGame } from './MiniGame'
import { GamePhase, MiniGameInfo, GameStateSnapshot } from '../types'

// --- Template system: ~500 unique combinations ---

const EMERGENCIAS = ['Incendio', 'Fuga de gas', 'Inundacion', 'Derrumbe', 'Corte electrico']
const UBICACIONES = ['piso 3', 'sector B', 'ala este', 'zona de carga', 'sotano 2']
const ACCESOS = ['escalera norte', 'entrada principal', 'ruta de escape sur', 'puerta lateral']

const FIELD_NAMES: (keyof EmergencyMessage)[] = ['emergencia', 'ubicacion', 'acceso']
const FIELD_LABELS: Record<string, string> = {
  emergencia: 'Emergencia',
  ubicacion: 'Ubicacion',
  acceso: 'Acceso',
}
const FIELD_SOURCES: Record<string, string[]> = {
  emergencia: EMERGENCIAS,
  ubicacion: UBICACIONES,
  acceso: ACCESOS,
}

interface EmergencyMessage {
  emergencia: string
  ubicacion: string
  acceso: string
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickRandomExcluding<T>(arr: T[], exclude: T): T {
  const filtered = arr.filter(v => v !== exclude)
  return filtered[Math.floor(Math.random() * filtered.length)]
}

function generateMessage(): EmergencyMessage {
  return {
    emergencia: pickRandom(EMERGENCIAS),
    ubicacion: pickRandom(UBICACIONES),
    acceso: pickRandom(ACCESOS),
  }
}

function formatMessage(msg: EmergencyMessage): string {
  return `Se reporta ${msg.emergencia} en ${msg.ubicacion}. Acceso recomendado: ${msg.acceso}.`
}

function generateResponseOptions(real: EmergencyMessage): { options: string[]; correctIndex: number } {
  const realText = formatMessage(real)

  const distractor1: EmergencyMessage = {
    ...real,
    emergencia: pickRandomExcluding(EMERGENCIAS, real.emergencia),
  }
  const distractor2: EmergencyMessage = {
    ...real,
    acceso: pickRandomExcluding(ACCESOS, real.acceso),
  }
  const distractor3: EmergencyMessage = {
    ...real,
    ubicacion: pickRandomExcluding(UBICACIONES, real.ubicacion),
    emergencia: pickRandomExcluding(EMERGENCIAS, real.emergencia),
  }

  const options = [realText, formatMessage(distractor1), formatMessage(distractor2), formatMessage(distractor3)]

  const unique = [...new Set(options)]
  while (unique.length < 4) {
    const extra = generateMessage()
    const extraText = formatMessage(extra)
    if (!unique.includes(extraText)) unique.push(extraText)
  }

  const shuffled = shuffleArr(unique.slice(0, 4))
  const correctIndex = shuffled.indexOf(realText)

  return { options: shuffled, correctIndex }
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// --- Internal phases ---

type InternalPhase = 'ROLES' | 'SABOTAGE' | 'TRANSMISSION' | 'OPERATOR_RESPONSE' | 'RESULT'

export interface SabotageData {
  field: string
  value: string
}

export interface EmergencyReport {
  playerId: string
  playerName: string
  text: string
}

interface PlayerClue {
  field: keyof EmergencyMessage
  label: string
  realValue: string
  fakeValue: string
  recommendedValue: 'real' | 'fake'
  value: string
}

// Fixed roles with clues: 1 saboteur + 2 technicians (rest are operators)
const TECHNICIAN_COUNT = 2

export class CentralDeEmergencias extends MiniGame {
  readonly info: MiniGameInfo = {
    id: 'central-emergencias',
    name: 'Central de Emergencias',
    shortDescription: '2 tecnicos y 1 saboteador transmiten pistas al operador. Todos tienen una opcion real y una falsa.',
  }

  private gameId: string
  private phase: GamePhase = GamePhase.LOBBY
  private internalPhase: InternalPhase = 'ROLES'

  private operatorIds: string[] = []
  private saboteurId: string = ''
  private technicianIds: string[] = []
  private realMessage: EmergencyMessage = { emergencia: '', ubicacion: '', acceso: '' }
  private playerClues: Map<string, PlayerClue> = new Map()
  private saboteurField: keyof EmergencyMessage = 'emergencia'
  private saboteurFakeValue: string = ''
  private reports: EmergencyReport[] = []
  private responseOptions: string[] = []
  private correctOptionIndex: number = 0
  private operatorChoices: Map<string, number> = new Map()
  private success: boolean | null = null

  constructor(io: Server, room: string, players: Map<string, Player>, callManager: CallManager, gameId: string) {
    super(io, room, players, callManager)
    this.gameId = gameId
  }

  start(): void {
    const playerIds = Array.from(this.players.keys())
    const shuffled = shuffleArr(playerIds)

    // 1 saboteur + 2 technicians = 3 with clues, rest are operators
    this.saboteurId = shuffled[0]
    this.technicianIds = shuffled.slice(1, 1 + TECHNICIAN_COUNT)
    this.operatorIds = shuffled.slice(1 + TECHNICIAN_COUNT)

    // Generate real message
    this.realMessage = generateMessage()

    // Assign clues to saboteur + technicians (3 players, 3 unique fields)
    const clueHolders = [this.saboteurId, ...this.technicianIds]
    const shuffledFields = shuffleArr([...FIELD_NAMES])

    for (let i = 0; i < clueHolders.length; i++) {
      const playerId = clueHolders[i]
      const field = shuffledFields[i % shuffledFields.length]
      const realValue = this.realMessage[field]
      const fakeValue = pickRandomExcluding(FIELD_SOURCES[field], realValue)
      const recommendedValue: 'real' | 'fake' = playerId === this.saboteurId ? 'fake' : 'real'

      this.playerClues.set(playerId, {
        field,
        label: FIELD_LABELS[field],
        realValue,
        fakeValue,
        recommendedValue,
        value: recommendedValue === 'real' ? realValue : fakeValue,
      })
    }

    const saboteurClue = this.playerClues.get(this.saboteurId)!
    this.saboteurField = saboteurClue.field
    this.saboteurFakeValue = saboteurClue.fakeValue

    this.startInternalPhase('ROLES', 10)
  }

  private getRole(playerId: string): 'operator' | 'saboteur' | 'technician' {
    if (this.operatorIds.includes(playerId)) return 'operator'
    if (playerId === this.saboteurId) return 'saboteur'
    return 'technician'
  }

  private isOperator(playerId: string): boolean {
    return this.operatorIds.includes(playerId)
  }

  private startInternalPhase(internalPhase: InternalPhase, durationSeconds: number): void {
    this.internalPhase = internalPhase

    if (internalPhase === 'ROLES' || internalPhase === 'SABOTAGE' || internalPhase === 'TRANSMISSION') {
      this.phase = GamePhase.CALL_PHASE
    } else if (internalPhase === 'OPERATOR_RESPONSE') {
      this.phase = GamePhase.DECISION_PHASE
    } else if (internalPhase === 'RESULT') {
      this.phase = GamePhase.RESULT_PHASE
    }

    this.phaseEndTime = Date.now() + durationSeconds * 1000

    this.io.to(this.room).emit('phase_changed', {
      phase: this.phase,
      endTime: this.phaseEndTime,
    })

    this.broadcastEmergencyState()
    this.broadcastState()

    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    this.phaseTimer = setTimeout(() => this.advancePhase(), durationSeconds * 1000)
  }

  private advancePhase(): void {
    switch (this.internalPhase) {
      case 'ROLES':
        this.startInternalPhase('SABOTAGE', 10)
        break
      case 'SABOTAGE':
        this.onSabotageEnd()
        this.startInternalPhase('TRANSMISSION', 90)
        break
      case 'TRANSMISSION':
        this.onTransmissionEnd()
        break
      case 'OPERATOR_RESPONSE':
        this.onOperatorResponseEnd()
        break
      case 'RESULT':
        this.finishGame()
        break
    }
  }

  private onSabotageEnd(): void {
    const saboteurClue = this.playerClues.get(this.saboteurId)
    if (!saboteurClue) return

    this.saboteurField = saboteurClue.field
    this.saboteurFakeValue = saboteurClue.fakeValue
    saboteurClue.value = saboteurClue.fakeValue
  }

  private onTransmissionEnd(): void {
    const { options, correctIndex } = generateResponseOptions(this.realMessage)
    this.responseOptions = options
    this.correctOptionIndex = correctIndex

    this.startInternalPhase('OPERATOR_RESPONSE', 60)
  }

  private onOperatorResponseEnd(): void {
    // Auto-select wrong answer for operators who didn't vote
    for (const opId of this.operatorIds) {
      if (!this.operatorChoices.has(opId)) {
        const wrongOptions = this.responseOptions
          .map((_, i) => i)
          .filter(i => i !== this.correctOptionIndex)
        this.operatorChoices.set(opId, pickRandom(wrongOptions))
      }
    }

    // Majority vote: success if more than half chose correctly
    let correctCount = 0
    for (const choice of this.operatorChoices.values()) {
      if (choice === this.correctOptionIndex) correctCount++
    }
    this.success = correctCount > this.operatorIds.length / 2

    this.startInternalPhase('RESULT', 8)
  }

  private finishGame(): void {
    this.phase = GamePhase.GAME_OVER

    // Winner side
    const winnerName = this.success ? 'Los operadores' : 'El saboteador'

    this.io.to(this.room).emit('game_over', {
      winnerId: this.success ? this.operatorIds[0] : this.saboteurId,
      winnerName,
      reason: this.success
        ? 'La mayoria de operadores identifico la emergencia correcta!'
        : 'El saboteador logro confundir a la mayoria!',
      standings: Array.from(this.players.values()).map(p => ({
        name: p.name,
        balance: this.getPlayerScore(p.id),
        isShadow: false,
        avatarId: p.avatarId,
        avatarColor: p.avatarColor,
        accessoryId: p.accessoryId,
      })),
    })

    this.emitComplete({
      minigameId: this.info.id,
      minigameName: this.info.name,
      winnerId: this.success ? this.operatorIds[0] : this.saboteurId,
      winnerName,
      standings: Array.from(this.players.values()).map(p => ({
        name: p.name,
        balance: this.getPlayerScore(p.id),
        isShadow: false,
        avatarId: p.avatarId,
        avatarColor: p.avatarColor,
        accessoryId: p.accessoryId,
      })),
    })
  }

  private getPlayerScore(playerId: string): number {
    if (this.success) {
      // Operators and technicians win, saboteur gets 0
      return playerId === this.saboteurId ? 0 : 1
    } else {
      // Saboteur wins, everyone else gets 0
      return playerId === this.saboteurId ? 1 : 0
    }
  }

  // --- Public methods called from events.ts ---

  submitSabotage(playerId: string, data: SabotageData): void {
    if (playerId !== this.saboteurId) return
    if (this.internalPhase !== 'SABOTAGE') return
    void data
    // Rule update: all clue holders receive a fixed pair (real + fake), including saboteur.
    // The saboteur can no longer choose a custom fake value.

    this.broadcastEmergencyState()
  }

  submitReport(playerId: string, text: string): void {
    if (this.internalPhase !== 'TRANSMISSION') return
    if (this.isOperator(playerId)) return

    const words = text.trim().split(/\s+/)
    if (words.length > 3 || words.length === 0) return

    if (this.reports.some(r => r.playerId === playerId)) return

    const player = this.players.get(playerId)
    if (!player) return

    this.reports.push({
      playerId,
      playerName: player.name,
      text: words.join(' '),
    })

    this.broadcastEmergencyState()
  }

  submitEmergencyResponse(playerId: string, optionIndex: number): void {
    if (!this.isOperator(playerId)) return
    if (this.internalPhase !== 'OPERATOR_RESPONSE') return
    if (this.operatorChoices.has(playerId)) return
    if (optionIndex < 0 || optionIndex >= this.responseOptions.length) return

    this.operatorChoices.set(playerId, optionIndex)

    this.broadcastEmergencyState()

    // If all operators have voted, advance immediately
    if (this.operatorChoices.size >= this.operatorIds.length) {
      let correctCount = 0
      for (const choice of this.operatorChoices.values()) {
        if (choice === this.correctOptionIndex) correctCount++
      }
      this.success = correctCount > this.operatorIds.length / 2

      if (this.phaseTimer) clearTimeout(this.phaseTimer)
      this.startInternalPhase('RESULT', 8)
    }
  }

  // --- Call restriction: Operators cannot call or be called during TRANSMISSION ---

  override callPlayer(callerId: string, targetId: string): void {
    if (this.internalPhase === 'TRANSMISSION') {
      if (this.isOperator(callerId) || this.isOperator(targetId)) return
    }
    if (this.internalPhase !== 'TRANSMISSION') return

    super.callPlayer(callerId, targetId)
  }

  // --- State ---

  getPhase(): GamePhase {
    return this.phase
  }

  getSnapshot(): GameStateSnapshot {
    return {
      gameId: this.gameId,
      minigameId: this.info.id,
      phase: this.phase,
      round: 1,
      maxRounds: 1,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        socketId: p.socketId,
        name: p.name,
        avatarId: p.avatarId,
        avatarColor: p.avatarColor,
        accessoryId: p.accessoryId,
        balance: 0,
        state: p.state,
        isAlive: p.isAlive,
        isShadow: false,
        shadowCharges: 0,
        rachaCooperar: 0,
        rachaTraicionar: 0,
      })),
      phaseEndTime: this.phaseEndTime,
      activeCalls: this.callManager.getActiveCalls(),
    }
  }

  // --- Per-player emergency state ---

  private broadcastEmergencyState(): void {
    // Build operator names list
    const operatorNames = this.operatorIds.map(id => this.players.get(id)?.name ?? '???')

    for (const [playerId, player] of this.players) {
      const role = this.getRole(playerId)

      const state: Record<string, unknown> = {
        internalPhase: this.internalPhase,
        operatorIds: this.operatorIds,
        operatorNames,
        myRole: role,
        reports: this.reports,
        saboteurId: null,
        realMessage: null,
        myClue: null,
        sabotageInfo: null,
        responseOptions: null,
        correctOptionIndex: null,
        operatorChoices: null,
        operatorVoteCount: this.internalPhase === 'OPERATOR_RESPONSE' ? this.operatorChoices.size : null,
        operatorTotal: this.operatorIds.length,
        success: null,
      }

      // Clue visible during TRANSMISSION and OPERATOR_RESPONSE
      const clue = this.playerClues.get(playerId)
      if (clue && (this.internalPhase === 'TRANSMISSION' || this.internalPhase === 'OPERATOR_RESPONSE')) {
        state.myClue = {
          field: clue.field,
          label: clue.label,
          value: clue.value,
          realValue: clue.realValue,
          fakeValue: clue.fakeValue,
          recommendedValue: clue.recommendedValue,
        }
      }

      // Saboteur: during ROLES and SABOTAGE, show their fixed real/fake pair
      if (role === 'saboteur') {
        if (this.internalPhase === 'ROLES' || this.internalPhase === 'SABOTAGE') {
          const saboteurClue = this.playerClues.get(this.saboteurId)
          state.sabotageInfo = {
            field: this.saboteurField,
            label: FIELD_LABELS[this.saboteurField],
            realValue: this.realMessage[this.saboteurField],
            fakeValue: saboteurClue?.fakeValue ?? this.saboteurFakeValue,
            currentFake: (saboteurClue?.fakeValue ?? this.saboteurFakeValue) || null,
          }
        }
      }

      // Response options for operators
      if (this.internalPhase === 'OPERATOR_RESPONSE' && role === 'operator') {
        state.responseOptions = this.responseOptions
        state.myChoice = this.operatorChoices.get(playerId) ?? null
      }

      // Result phase: show everything to everyone
      if (this.internalPhase === 'RESULT') {
        state.realMessage = formatMessage(this.realMessage)
        state.saboteurId = this.saboteurId
        state.responseOptions = this.responseOptions
        state.correctOptionIndex = this.correctOptionIndex
        state.success = this.success

        // Convert operator choices to serializable format
        const choices: Record<string, number> = {}
        for (const [opId, choice] of this.operatorChoices) {
          choices[opId] = choice
        }
        state.operatorChoices = choices

        state.sabotageInfo = {
          field: this.saboteurField,
          label: FIELD_LABELS[this.saboteurField],
          realValue: this.realMessage[this.saboteurField],
          fakeValue: this.saboteurFakeValue,
        }
      }

      this.io.to(player.socketId).emit('emergency_state' as any, state)
    }
  }

  // --- Scoring helpers for MetaGame ---

  getSuccess(): boolean {
    return this.success ?? false
  }

  getSaboteurId(): string {
    return this.saboteurId
  }

  getOperatorIds(): string[] {
    return this.operatorIds
  }

  override skipToFinish(): void {
    if (this.internalPhase === 'RESULT') {
      if (this.phaseTimer) clearTimeout(this.phaseTimer)
      this.finishGame()
    }
  }
}
