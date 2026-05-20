import type { ProjectStatus } from '../constants'

export interface Project {
  id: string
  title: string
  description: string
  objective: string
  inScopeContent: string
  outOfScopeContent: string
  status: ProjectStatus
  startDate: string | null
  dueDate: string | null
  memberIds: string[]
  taskIds: string[]
}

export interface CreateProjectInput {
  title: string
  description: string
  objective: string
  inScopeContent: string
  outOfScopeContent: string
  status: ProjectStatus
  startDate: string | null
  dueDate: string | null
  memberIds?: string[]
  taskIds?: string[]
}

export type UpdateProjectInput = Partial<CreateProjectInput>
