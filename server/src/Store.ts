// In-memory store (Redis-compatible interface for future migration)
export class Store {
  private data: Map<string, string> = new Map()

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value)
  }

  async del(key: string): Promise<void> {
    this.data.delete(key)
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const val = this.data.get(key)
    if (!val) return null
    return JSON.parse(val) as T
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    this.data.set(key, JSON.stringify(value))
  }
}

export const store = new Store()
