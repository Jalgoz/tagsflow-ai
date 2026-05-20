import type { ChecklistItem } from './checklist-item'
import type { Priority, TaskStatus } from '../constants'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  inScopeContent: string
  outOfScopeContent: string
  priority: Priority
  status: TaskStatus
  startDate: string | null
  dueDate: string | null
  assigneeMemberId: string | null
  tagIds: string[]
  checklist: ChecklistItem[]
  subtaskIds: string[]
}

export interface CreateTaskInput {
  projectId: string
  title: string
  description: string
  inScopeContent: string
  outOfScopeContent: string
  priority: Priority
  status: TaskStatus
  startDate: string | null
  dueDate: string | null
  assigneeMemberId?: string | null
  tagIds?: string[]
  checklist?: ChecklistItem[]
  subtaskIds?: string[]
}

export type UpdateTaskInput = Partial<CreateTaskInput>
