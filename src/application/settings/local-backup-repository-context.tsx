import { createContext, useContext } from 'react'
import type { LocalBackupRepository } from '../../domain'

export const LocalBackupRepositoryContext = createContext<LocalBackupRepository | null>(null)

export const useLocalBackupRepository = (): LocalBackupRepository => {
  const repository = useContext(LocalBackupRepositoryContext)

  if (repository === null) {
    throw new Error('LocalBackupRepositoryProvider is missing.')
  }

  return repository
}
