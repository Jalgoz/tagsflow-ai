import type { Priority, ProjectStatus, TaskStatus } from '../constants'
import type { Project, Task } from '../entities'

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

export type PrioritySuggestionSupportedPriority = Priority

export type PrioritySuggestionRationale = string

export interface PrioritySuggestionProjectContext {
  title: string
  description: string
  objective: string
  inScopeContent: string
  outOfScopeContent: string
  status: Project['status']
  startDate: string | null
  dueDate: string | null
}

export interface PrioritySuggestionTaskContext {
  title: string
  description: string
  inScopeContent: string
  outOfScopeContent: string
  currentPriority: Priority
  status: TaskStatus
  startDate: string | null
  dueDate: string | null
  checklistSummary: string
  tagNames: string[]
  assigneeName: string | null
  subtaskProgressSummary: string
}

export interface PrioritySuggestionSiblingTaskContext {
  title: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
}

export interface PrioritySuggestionRequest {
  project: PrioritySuggestionProjectContext
  selectedTask: PrioritySuggestionTaskContext
  siblingTasks: PrioritySuggestionSiblingTaskContext[]
  additionalInstructions?: string
}

export interface PrioritySuggestionResult {
  suggestedPriority: PrioritySuggestionSupportedPriority
  rationale: PrioritySuggestionRationale
}

export type PrioritySuggestionResponse = PrioritySuggestionResult

export type ProjectSummaryHealthLabel = 'on_track' | 'at_risk' | 'blocked'

export interface ProjectSummaryProjectContext {
  title: string
  description: string
  objective: string
  inScopeContent: string
  outOfScopeContent: string
  status: ProjectStatus
  startDate: string | null
  dueDate: string | null
  progressPercent: number
}

export interface ProjectSummaryTaskCounts {
  backlog: number
  todo: number
  in_progress: number
  blocked: number
  review: number
  done: number
}

export interface ProjectSummaryPriorityCounts {
  low: number
  medium: number
  high: number
  urgent: number
}

export interface ProjectSummaryWorkItemContext {
  title: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
  assigneeName: string | null
}

export interface ProjectSummaryCompletedWorkItem {
  title: string
  priority: Priority
}

export interface ProjectSummaryTaskDetailContext {
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  dueDate: string | null
  assigneeName: string | null
  tagNames: string[]
  checklistSummary: string
  subtaskSummary: string
}

export interface ProjectSummaryRequest {
  project: ProjectSummaryProjectContext
  taskCounts: ProjectSummaryTaskCounts
  priorityCounts: ProjectSummaryPriorityCounts
  blockedTasks: ProjectSummaryWorkItemContext[]
  overdueTasks: ProjectSummaryWorkItemContext[]
  upcomingTasks: ProjectSummaryWorkItemContext[]
  completedTasks: ProjectSummaryCompletedWorkItem[]
  taskDetails: ProjectSummaryTaskDetailContext[]
  existingTagNames: string[]
  memberNames: string[]
  referenceDate: string
  additionalInstructions?: string
}

export interface ProjectSummaryResult {
  summary: string
  health: ProjectSummaryHealthLabel
  risks: string[]
  blockers: string[]
  nextSteps: string[]
  notableCompletedWork: string[]
}
