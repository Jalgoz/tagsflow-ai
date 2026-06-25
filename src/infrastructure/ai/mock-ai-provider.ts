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
      taskSuggestions: [
        {
          title: `${request.title} foundation`,
          description: 'Define the baseline project structure, milestones, and delivery checkpoints.',
          priority: 'medium',
          status: 'todo',
          dueDate: request.dueDate,
          existingTagNames: request.existingTagNames.slice(0, 1),
        },
        {
          title: `${request.title} implementation`,
          description: 'Deliver the first executable slice with explicit review checkpoints.',
          priority: 'high',
          status: 'in_progress',
          dueDate: request.dueDate,
          existingTagNames: request.existingTagNames.slice(1, 2),
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
