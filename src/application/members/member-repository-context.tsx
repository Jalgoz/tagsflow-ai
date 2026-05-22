import { createContext, useContext } from 'react'
import type { ProjectRepository, SubtaskRepository, TaskRepository, MemberRepository } from '../../domain'

export interface MemberManagementRepositoryBundle {
  members: MemberRepository
  projects: ProjectRepository
  tasks: TaskRepository
  subtasks: SubtaskRepository
}

export const MemberManagementRepositoryContext = createContext<MemberManagementRepositoryBundle | null>(null)

export const useMemberManagementRepositories = (): MemberManagementRepositoryBundle => {
  const repositories = useContext(MemberManagementRepositoryContext)

  if (repositories === null) {
    throw new Error('MemberManagementRepositoryProvider is missing.')
  }

  return repositories
}
