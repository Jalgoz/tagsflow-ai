import type { PropsWithChildren } from 'react'
import type { ProjectRepository } from '../../domain'
import { ProjectRepositoryContext } from './project-repository-context'

type ProjectRepositoryProviderProps = PropsWithChildren<{
  repository: ProjectRepository
}>

export const ProjectRepositoryProvider = ({ children, repository }: ProjectRepositoryProviderProps) => {
  return <ProjectRepositoryContext.Provider value={repository}>{children}</ProjectRepositoryContext.Provider>
}
