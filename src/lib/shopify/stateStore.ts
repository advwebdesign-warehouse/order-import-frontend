//file path: lib/shopify/stateStore.ts

/**
 * Global state store for OAuth state management
 * This uses a singleton pattern to persist across Next.js route invocations
 */

interface StateData {
  shop: string
  storeId?: string
  timestamp: number
}

class OAuthStateStore {
  private static instance: OAuthStateStore
  private store: Map<string, StateData>

  private constructor() {
    this.store = new Map()
  }

  static getInstance(): OAuthStateStore {
    if (!OAuthStateStore.instance) {
      OAuthStateStore.instance = new OAuthStateStore()
    }
    return OAuthStateStore.instance
  }

  set(state: string, data: StateData): void {
    // Clean up old states first
    this.cleanup()

    this.store.set(state, data)
    console.log('[StateStore] Saved state:', state, 'for shop:', data.shop)
    console.log('[StateStore] Current store size:', this.store.size)
  }

  get(state: string): StateData | undefined {
    const data = this.store.get(state)
    console.log('[StateStore] Retrieved state:', state, 'data:', data)
    return data
  }

  delete(state: string): void {
    this.store.delete(state)
    console.log('[StateStore] Deleted state:', state)
  }

  private cleanup(): void {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    this.store.forEach((value, key) => {
      if (value.timestamp < tenMinutesAgo) {
        this.store.delete(key)
        console.log('[StateStore] Cleaned up expired state:', key)
      }
    })
  }
}

// Create and export singleton instance
export const stateStore = OAuthStateStore.getInstance()

// Also export as global to ensure persistence
declare global {
  var __shopifyStateStore: OAuthStateStore | undefined
}

if (!global.__shopifyStateStore) {
  global.__shopifyStateStore = OAuthStateStore.getInstance()
}

export const globalStateStore = global.__shopifyStateStore
