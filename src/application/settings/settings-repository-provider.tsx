import type { PropsWithChildren } from 'react'
import type { SettingsRepository } from '../../domain'
import { SettingsRepositoryContext } from './settings-repository-context'

type SettingsRepositoryProviderProps = PropsWithChildren<{
  repository: SettingsRepository
}>

export const SettingsRepositoryProvider = ({ children, repository }: SettingsRepositoryProviderProps) => {
  return <SettingsRepositoryContext.Provider value={repository}>{children}</SettingsRepositoryContext.Provider>
}
