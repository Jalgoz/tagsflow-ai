import type {
  AIConnectionTestResult,
  AIModelInfo,
  AIProvider,
  PrioritySuggestionRequest,
  PrioritySuggestionResult,
  ProjectPlanRequest,
  ProjectPlanResult,
  ProjectPlanSuggestion,
  ProjectSummaryRequest,
  ProjectSummaryResult,
  SubtaskGenerationRequest,
  SubtaskGenerationResult,
} from '../../domain'

const MOCK_MODEL_ID = 'mock-model-v1'

const createMockModels = (): AIModelInfo[] => [
  {
    id: MOCK_MODEL_ID,
    name: 'Mock Model',
    provider: 'mock',
    contextWindowTokens: 8192,
  },
]

export class MockAIProvider implements AIProvider {
  async listModels(): Promise<AIModelInfo[]> {
    return createMockModels()
  }

  async testConnection(): Promise<AIConnectionTestResult> {
    return {
      connected: true,
      message: 'Mock AI provider connection succeeded.',
      modelIds: [MOCK_MODEL_ID],
    }
  }

  async generateProjectPlan(request: ProjectPlanRequest): Promise<ProjectPlanResult> {
    const suggestions: ProjectPlanSuggestion[] = [
      {
        title: `${request.title} foundation`,
        description: 'Define the baseline project structure, milestones, and delivery checkpoints.',
        priority: 'medium' as const,
        status: 'todo' as const,
        dueDate: request.dueDate,
        existingTagNames: request.existingTagNames.slice(0, 1),
      },
      {
        title: `${request.title} implementation`,
        description: 'Deliver the first executable slice with explicit review checkpoints.',
        priority: 'high' as const,
        status: 'in_progress' as const,
        dueDate: request.dueDate,
        existingTagNames: request.existingTagNames.slice(1, 2),
      },
    ]

    if (typeof request.additionalInstructions === 'string' && request.additionalInstructions.trim().length > 0) {
      suggestions.push({
        title: 'Instructed task',
        description: request.additionalInstructions.trim(),
        priority: 'high' as const,
        status: 'todo' as const,
        dueDate: null,
        existingTagNames: [],
      })
    }

    return {
      taskSuggestions: suggestions,
    }
  }

  async generateSubtasks(request: SubtaskGenerationRequest): Promise<SubtaskGenerationResult> {
    const suggestions = [
      {
        title: `${request.task.title} foundation`,
        description: 'Mock-generated foundational subtask for development and tests.',
        priority: request.task.priority,
        status: 'todo' as const,
        dueDate: request.task.dueDate,
        checklistItems: ['Mock checklist 1', 'Mock checklist 2'],
        existingTagNames: request.existingTagNames.slice(0, 1),
      },
    ]

    if (typeof request.additionalInstructions === 'string' && request.additionalInstructions.trim().length > 0) {
      suggestions.push({
        title: 'Instructed subtask',
        description: request.additionalInstructions.trim(),
        priority: 'high' as const,
        status: 'todo' as const,
        dueDate: null,
        checklistItems: [],
        existingTagNames: [],
      })
    }

    return {
      subtaskSuggestions: suggestions,
    }
  }

  async suggestPriority(request: PrioritySuggestionRequest): Promise<PrioritySuggestionResult> {
    return {
      priority: request.contextType === 'task' ? 'medium' : 'low',
      reason: 'Mock priority suggestion for development and tests.',
    }
  }

  async summarizeProject(request: ProjectSummaryRequest): Promise<ProjectSummaryResult> {
    void request
    return {
      summary: 'Mock project summary.',
      risks: ['Mock risk'],
      nextSteps: ['Mock next step'],
    }
  }
}
