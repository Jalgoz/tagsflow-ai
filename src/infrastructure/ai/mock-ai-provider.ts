import type {
  AIConnectionTestResult,
  AIModelInfo,
  AIProvider,
  PrioritySuggestionRequest,
  PrioritySuggestionResult,
  ProjectPlanRequest,
  ProjectPlanResult,
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
    return {
      suggestedTitle: request.title,
      suggestedDescription: request.description,
      taskSuggestions: [
        {
          title: `${request.title} foundation`,
          description: 'Mock-generated top-level task for development and tests.',
          priority: 'medium',
          startDate: request.startDate,
          dueDate: request.dueDate,
        },
      ],
    }
  }

  async generateSubtasks(request: SubtaskGenerationRequest): Promise<SubtaskGenerationResult> {
    return {
      subtaskSuggestions: [
        {
          title: `${request.task.title} follow-up`,
          description: 'Mock-generated subtask for development and tests.',
          priority: request.task.priority,
          startDate: request.task.startDate,
          dueDate: request.task.dueDate,
        },
      ],
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
