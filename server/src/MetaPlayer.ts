import { MetaPlayerData } from './types'

export class MetaPlayer implements MetaPlayerData {
  id: string
  socketId: string
  name: string
  globalScore: number
  isConnected: boolean

  constructor(id: string, socketId: string, name: string) {
    this.id = id
    this.socketId = socketId
    this.name = name
    this.globalScore = 0
    this.isConnected = true
  }

  addWin(): void {
    this.globalScore++
  }

  adjustScore(amount: number): void {
    this.globalScore += amount
  }

  toData(): MetaPlayerData {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      globalScore: this.globalScore,
      isConnected: this.isConnected,
    }
  }
}
