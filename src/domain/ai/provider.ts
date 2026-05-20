import type {
  AIConnectionTestResult,
  AIModelInfo,
  PrioritySuggestionRequest,
  PrioritySuggestionResult,
  ProjectPlanRequest,
  ProjectPlanResult,
  ProjectSummaryRequest,
  ProjectSummaryResult,
  SubtaskGenerationRequest,
  SubtaskGenerationResult,
} from './dto'

export interface AIProvider {
  listModels(): Promise<AIModelInfo[]>
  testConnection(): Promise<AIConnectionTestResult>
  generateProjectPlan(request: ProjectPlanRequest): Promise<ProjectPlanResult>
  generateSubtasks(request: SubtaskGenerationRequest): Promise<SubtaskGenerationResult>
  suggestPriority(request: PrioritySuggestionRequest): Promise<PrioritySuggestionResult>
  summarizeProject(request: ProjectSummaryRequest): Promise<ProjectSummaryResult>
}
