import type { LocalStorageAdapter } from './types'

export interface InMemoryStorageAdapter extends LocalStorageAdapter {
  entries(): Record<string, string>
}

export const createInMemoryStorage = (initialEntries: Record<string, string> = {}): InMemoryStorageAdapter => {
  const entries = new Map(Object.entries(initialEntries))

  return {
    getItem(key) {
      return entries.get(key) ?? null
    },
    setItem(key, value) {
      entries.set(key, value)
    },
    removeItem(key) {
      entries.delete(key)
    },
    entries() {
      return Object.fromEntries(entries)
    },
  }
}
