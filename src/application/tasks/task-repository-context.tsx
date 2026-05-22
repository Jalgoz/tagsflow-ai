import { createContext, useContext } from 'react'
import type { TaskRepository } from '../../domain'

export const TaskRepositoryContext = createContext<TaskRepository | null>(null)

export const useTaskRepository = (): TaskRepository => {
  const repository = useContext(TaskRepositoryContext)

  if (repository === null) {
    throw new Error('TaskRepositoryProvider is missing.')
  }

  return repository
}
