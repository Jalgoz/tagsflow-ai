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
import {
  AIProviderError,
  createUnsupportedAIProviderOperationError,
  normalizeAIProviderError,
  redactSecrets,
} from './errors'

export type AIRequestTransport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type GroqModelListResponse = {
  data?: Array<{
    id?: string
    owned_by?: string
    context_window?: number
  }>
  error?: {
    message?: string
  }
}

type GroqAIProviderOptions = {
  apiKey: string
  selectedModelId: string | null
  transport?: AIRequestTransport
}

const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1'

const defaultAIRequestTransport: AIRequestTransport = (input, init) => globalThis.fetch(input, init)

const createGroqRequestHeaders = (apiKey: string): HeadersInit => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
})

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const getErrorMessageFromBody = (body: unknown): string | null => {
  if (!isRecord(body)) {
    return null
  }

  if (isRecord(body.error) && typeof body.error.message === 'string') {
    return body.error.message
  }

  return null
}

const createHttpError = (status: number, statusText: string, body: unknown, apiKey: string): AIProviderError => {
  const providerMessage = getErrorMessageFromBody(body)

  if (status === 401 || status === 403) {
    return new AIProviderError('authentication_failed', 'Groq rejected the API key.')
  }

  const baseMessage =
    providerMessage ?? (statusText.trim().length > 0 ? `Groq request failed with ${status} ${statusText}.` : `Groq request failed with status ${status}.`)

  return new AIProviderError('provider_error', redactSecrets(baseMessage, [apiKey]))
}

export class GroqAIProvider implements AIProvider {
  private readonly apiKey: string
  private readonly selectedModelId: string | null
  private readonly transport: AIRequestTransport

  constructor({ apiKey, selectedModelId, transport = defaultAIRequestTransport }: GroqAIProviderOptions) {
    this.apiKey = apiKey.trim()
    this.selectedModelId = selectedModelId
    this.transport = transport
  }

  async listModels(): Promise<AIModelInfo[]> {
    try {
      const response = await this.transport(`${GROQ_API_BASE_URL}/models`, {
        method: 'GET',
        headers: createGroqRequestHeaders(this.apiKey),
      })

      const body = (await response.json().catch(() => null)) as GroqModelListResponse | null

      if (!response.ok) {
        throw createHttpError(response.status, response.statusText, body, this.apiKey)
      }

      if (body === null || !Array.isArray(body.data)) {
        throw new AIProviderError('invalid_response', 'Groq returned an invalid model list response.')
      }

      return body.data
        .filter((model): model is Required<Pick<NonNullable<GroqModelListResponse['data']>[number], 'id'>> &
          NonNullable<GroqModelListResponse['data']>[number] => typeof model.id === 'string' && model.id.trim().length > 0)
        .map((model) => ({
          id: model.id,
          name: model.id,
          provider: typeof model.owned_by === 'string' && model.owned_by.trim().length > 0 ? model.owned_by : 'groq',
          contextWindowTokens: typeof model.context_window === 'number' ? model.context_window : undefined,
        }))
    } catch (error) {
      throw normalizeAIProviderError(error, [this.apiKey])
    }
  }

  async testConnection(): Promise<AIConnectionTestResult> {
    const models = await this.listModels()

    return {
      connected: true,
      message:
        this.selectedModelId === null
          ? 'Groq connection succeeded.'
          : `Groq connection succeeded for the current configuration.`,
      modelIds: models.map((model) => model.id),
    }
  }

  async generateProjectPlan(request: ProjectPlanRequest): Promise<ProjectPlanResult> {
    void request
    throw createUnsupportedAIProviderOperationError('AI project planning')
  }

  async generateSubtasks(request: SubtaskGenerationRequest): Promise<SubtaskGenerationResult> {
    void request
    throw createUnsupportedAIProviderOperationError('AI subtask generation')
  }

  async suggestPriority(request: PrioritySuggestionRequest): Promise<PrioritySuggestionResult> {
    void request
    throw createUnsupportedAIProviderOperationError('AI priority suggestion')
  }

  async summarizeProject(request: ProjectSummaryRequest): Promise<ProjectSummaryResult> {
    void request
    throw createUnsupportedAIProviderOperationError('AI project summary')
  }
}
