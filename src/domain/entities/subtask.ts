import type { ChecklistItem } from './checklist-item'
import type { Priority, TaskStatus } from '../constants'

export interface Subtask {
  id: string
  taskId: string
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
}

export interface CreateSubtaskInput {
  taskId: string
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
}

export type UpdateSubtaskInput = Partial<CreateSubtaskInput>
