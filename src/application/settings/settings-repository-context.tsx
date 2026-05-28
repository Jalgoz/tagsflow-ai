import { createContext, useContext } from 'react'
import type { SettingsRepository } from '../../domain'

export const SettingsRepositoryContext = createContext<SettingsRepository | null>(null)

export const useSettingsRepository = (): SettingsRepository => {
  const repository = useContext(SettingsRepositoryContext)

  if (repository === null) {
    throw new Error('SettingsRepositoryProvider is missing.')
  }

  return repository
}
