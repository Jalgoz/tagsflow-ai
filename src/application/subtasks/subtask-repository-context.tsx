import { createContext, useContext } from 'react'
import type { SubtaskRepository } from '../../domain'

export const SubtaskRepositoryContext = createContext<SubtaskRepository | null>(null)

export const useSubtaskRepository = (): SubtaskRepository => {
  const repository = useContext(SubtaskRepositoryContext)

  if (repository === null) {
    throw new Error('SubtaskRepositoryProvider is missing.')
  }

  return repository
}
