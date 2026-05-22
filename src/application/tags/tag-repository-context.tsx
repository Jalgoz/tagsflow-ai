import { createContext, useContext } from 'react'
import type { SubtaskRepository, TagRepository, TaskRepository } from '../../domain'

export interface TagManagementRepositoryBundle {
  tags: TagRepository
  tasks: TaskRepository
  subtasks: SubtaskRepository
}

export const TagManagementRepositoryContext = createContext<TagManagementRepositoryBundle | null>(null)

export const useTagManagementRepositories = (): TagManagementRepositoryBundle => {
  const repositories = useContext(TagManagementRepositoryContext)

  if (repositories === null) {
    throw new Error('TagManagementRepositoryProvider is missing.')
  }

  return repositories
}
