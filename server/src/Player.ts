import { PlayerState, PlayerData, DEFAULT_CONFIG } from './types'
import { v4 as uuid } from 'uuid'

export class Player implements PlayerData {
  id: string
  socketId: string
  name: string
  balance: number
  state: PlayerState
  isAlive: boolean
  isShadow: boolean
  shadowCharges: number
  rachaCooperar: number
  rachaTraicionar: number

  constructor(socketId: string, name: string) {
    this.id = uuid()
    this.socketId = socketId
    this.name = name
    this.balance = DEFAULT_CONFIG.initialBalance
    this.state = PlayerState.LOBBY
    this.isAlive = true
    this.isShadow = false
    this.shadowCharges = 0
    this.rachaCooperar = 0
    this.rachaTraicionar = 0
  }

  updateBalance(amount: number): void {
    this.balance += amount
    if (this.balance <= 0) {
      this.balance = 0
      this.becomeShadow()
    } else if (this.balance <= DEFAULT_CONFIG.atRiskThreshold) {
      if (this.state !== PlayerState.IN_CALL) {
        this.state = PlayerState.AT_RISK
      }
    }
  }

  becomeShadow(): void {
    this.isShadow = true
    this.isAlive = false
    this.state = PlayerState.SHADOW
    this.shadowCharges = DEFAULT_CONFIG.shadowCharges
    this.rachaCooperar = 0
    this.rachaTraicionar = 0
  }

  useCharge(): boolean {
    if (this.shadowCharges > 0) {
      this.shadowCharges--
      return true
    }
    return false
  }

  setActive(): void {
    if (this.isShadow) {
      this.state = PlayerState.SHADOW
    } else if (this.balance <= DEFAULT_CONFIG.atRiskThreshold) {
      this.state = PlayerState.AT_RISK
    } else {
      this.state = PlayerState.ACTIVE
    }
  }

  toData(): PlayerData {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      balance: this.balance,
      state: this.state,
      isAlive: this.isAlive,
      isShadow: this.isShadow,
      shadowCharges: this.shadowCharges,
      rachaCooperar: this.rachaCooperar,
      rachaTraicionar: this.rachaTraicionar
    }
  }
}
