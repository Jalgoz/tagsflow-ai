import { createContext, useContext } from 'react'
import type { ProjectRepository } from '../../domain'

export const ProjectRepositoryContext = createContext<ProjectRepository | null>(null)

export const useProjectRepository = (): ProjectRepository => {
  const repository = useContext(ProjectRepositoryContext)

  if (repository === null) {
    throw new Error('ProjectRepositoryProvider is missing.')
  }

  return repository
}
