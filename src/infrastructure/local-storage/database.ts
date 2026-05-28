import { LOCAL_STORAGE_DATABASE_KEY } from '../../shared'
import { createEmptyLocalDatabase } from './defaults'
import { assertValidLocalDatabase, parseLocalDatabase } from './validation'
import type { LocalDatabase, LocalStorageAdapter } from './types'

export const createBrowserLocalStorageAdapter = (): LocalStorageAdapter => {
  return globalThis.localStorage
}

export class LocalStorageDatabase {
  private readonly key: string
  private readonly storage: LocalStorageAdapter

  constructor(storage: LocalStorageAdapter = createBrowserLocalStorageAdapter(), key = LOCAL_STORAGE_DATABASE_KEY) {
    this.storage = storage
    this.key = key
  }

  load(): LocalDatabase {
    const storedValue = this.storage.getItem(this.key)

    if (storedValue === null || storedValue.trim() === '') {
      return createEmptyLocalDatabase()
    }

    try {
      const parsedValue: unknown = JSON.parse(storedValue)

      return parseLocalDatabase(parsedValue).database
    } catch {
      return createEmptyLocalDatabase()
    }
  }

  initialize(): LocalDatabase {
    const database = this.load()
    this.save(database)

    return database
  }

  save(database: LocalDatabase): LocalDatabase {
    const validDatabase = assertValidLocalDatabase(database)
    this.storage.setItem(this.key, JSON.stringify(validDatabase))

    return validDatabase
  }

  update(updater: (database: LocalDatabase) => LocalDatabase): LocalDatabase {
    return this.save(updater(this.load()))
  }

  replace(database: LocalDatabase): LocalDatabase {
    return this.save(database)
  }

  reset(): LocalDatabase {
    return this.save(createEmptyLocalDatabase())
  }
}
