import type { PropsWithChildren } from 'react'
import type { LocalBackupRepository } from '../../domain'
import { LocalBackupRepositoryContext } from './local-backup-repository-context'

type LocalBackupRepositoryProviderProps = PropsWithChildren<{
  repository: LocalBackupRepository
}>

export const LocalBackupRepositoryProvider = ({ children, repository }: LocalBackupRepositoryProviderProps) => {
  return <LocalBackupRepositoryContext.Provider value={repository}>{children}</LocalBackupRepositoryContext.Provider>
}
