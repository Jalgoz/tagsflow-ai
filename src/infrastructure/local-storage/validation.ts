import { createEmptyLocalDatabase } from './defaults'
import { localDatabaseSchema } from './schemas'
import type { LocalDatabase, LocalDatabaseValidationResult } from './types'

export const parseLocalDatabase = (value: unknown): LocalDatabaseValidationResult => {
  const result = localDatabaseSchema.safeParse(value)

  if (!result.success) {
    return {
      database: createEmptyLocalDatabase(),
      recovered: true,
    }
  }

  return {
    database: result.data,
    recovered: false,
  }
}

export const assertValidLocalDatabase = (database: LocalDatabase): LocalDatabase => {
  return localDatabaseSchema.parse(database)
}
