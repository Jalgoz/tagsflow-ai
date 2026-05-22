import type { PropsWithChildren } from 'react'
import type { SubtaskRepository } from '../../domain'
import { SubtaskRepositoryContext } from './subtask-repository-context'

type SubtaskRepositoryProviderProps = PropsWithChildren<{
  repository: SubtaskRepository
}>

export const SubtaskRepositoryProvider = ({ children, repository }: SubtaskRepositoryProviderProps) => {
  return <SubtaskRepositoryContext.Provider value={repository}>{children}</SubtaskRepositoryContext.Provider>
}
