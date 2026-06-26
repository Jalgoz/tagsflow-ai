import type { Priority, TaskStatus } from '../constants'
import type { AppSettings, Project, Subtask, Task } from '../entities'

export interface AIModelInfo {
  id: string
  name: string
  provider: string
  contextWindowTokens?: number
}

export interface AIConnectionTestResult {
  connected: boolean
  message: string
  modelIds?: string[]
}

export interface ProjectPlanSuggestion {
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
  existingTagNames: string[]
}

export interface ProjectPlanTaskContext {
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
}

export interface ProjectPlanRequest {
  title: string
  description: string
  objective: string
  inScopeContent: string
  outOfScopeContent: string
  startDate: string | null
  dueDate: string | null
  existingTasks: ProjectPlanTaskContext[]
  existingTagNames: string[]
  memberNames: string[]
  additionalInstructions?: string
}

export interface ProjectPlanResult {
  taskSuggestions: ProjectPlanSuggestion[]
}

export interface SubtaskContext {
  title: string
  description: string
  priority: Priority
  status: TaskStatus
}

export interface SubtaskSuggestion {
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
  checklistItems: string[]
  existingTagNames: string[]
}

export interface SubtaskGenerationRequest {
  task: Pick<Task, 'title' | 'description' | 'inScopeContent' | 'outOfScopeContent' | 'priority' | 'status' | 'startDate' | 'dueDate'>
  project: Pick<Project, 'title' | 'description' | 'objective' | 'inScopeContent' | 'outOfScopeContent' | 'startDate' | 'dueDate' | 'status'>
  existingSubtasks: SubtaskContext[]
  existingTagNames: string[]
  memberNames: string[]
  additionalInstructions?: string
}

export interface SubtaskGenerationResult {
  subtaskSuggestions: SubtaskSuggestion[]
}

export interface PrioritySuggestionRequest {
  contextType: 'task' | 'subtask'
  title: string
  description: string
  inScopeContent: string
  outOfScopeContent: string
  dueDate: string | null
  project: Pick<Project, 'title' | 'description' | 'objective' | 'inScopeContent' | 'outOfScopeContent' | 'status' | 'startDate' | 'dueDate'>
}

export interface PrioritySuggestionResult {
  priority: Priority
  reason: string
}

export interface ProjectSummaryRequest {
  project: Project
  tasks: Task[]
  subtasks: Subtask[]
  settings: AppSettings
  computedProgress: number
  referenceDate: string
}

export interface ProjectSummaryResult {
  summary: string
  risks: string[]
  nextSteps: string[]
}
