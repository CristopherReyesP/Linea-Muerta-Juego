import { MetaPlayerData } from './types'

export class MetaPlayer implements MetaPlayerData {
  id: string
  socketId: string
  name: string
  avatarId: string
  avatarColor: string
  accessoryId: string
  globalScore: number
  isConnected: boolean

  constructor(id: string, socketId: string, name: string, avatarId: string, avatarColor: string, accessoryId: string) {
    this.id = id
    this.socketId = socketId
    this.name = name
    this.avatarId = avatarId
    this.avatarColor = avatarColor
    this.accessoryId = accessoryId
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
      avatarId: this.avatarId,
      avatarColor: this.avatarColor,
      accessoryId: this.accessoryId,
      globalScore: this.globalScore,
      isConnected: this.isConnected,
    }
  }
}
