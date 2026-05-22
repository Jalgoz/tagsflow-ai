import type { PropsWithChildren } from 'react'
import type { TaskRepository } from '../../domain'
import { TaskRepositoryContext } from './task-repository-context'

type TaskRepositoryProviderProps = PropsWithChildren<{
  repository: TaskRepository
}>

export const TaskRepositoryProvider = ({ children, repository }: TaskRepositoryProviderProps) => {
  return <TaskRepositoryContext.Provider value={repository}>{children}</TaskRepositoryContext.Provider>
}
