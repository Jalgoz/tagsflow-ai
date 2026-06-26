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
  createMissingModelConfigurationError,
  createUnsupportedAIProviderOperationError,
  normalizeAIProviderError,
  redactSecrets,
} from './errors'
import {
  buildProjectPlannerSystemPrompt,
  buildProjectPlannerUserPrompt,
  parseProjectPlanResponse,
} from './project-planner'
import {
  buildSubtaskGeneratorSystemPrompt,
  buildSubtaskGeneratorUserPrompt,
  parseSubtaskGenerationResponse,
} from './subtask-generator'

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

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
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

const getFirstChatCompletionContent = (body: GroqChatCompletionResponse | null): string | null => {
  if (body === null || !Array.isArray(body.choices) || body.choices.length === 0) {
    return null
  }

  const firstChoice = body.choices[0]
  const content = firstChoice?.message?.content

  return typeof content === 'string' && content.trim().length > 0 ? content : null
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
    if (this.selectedModelId === null || this.selectedModelId.trim().length === 0) {
      throw createMissingModelConfigurationError()
    }

    try {
      const response = await this.transport(`${GROQ_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: createGroqRequestHeaders(this.apiKey),
        body: JSON.stringify({
          model: this.selectedModelId,
          temperature: 0.2,
          response_format: {
            type: 'json_object',
          },
          messages: [
            {
              role: 'system',
              content: buildProjectPlannerSystemPrompt(),
            },
            {
              role: 'user',
              content: buildProjectPlannerUserPrompt(request),
            },
          ],
        }),
      })

      const body = (await response.json().catch(() => null)) as GroqChatCompletionResponse | null

      if (!response.ok) {
        throw createHttpError(response.status, response.statusText, body, this.apiKey)
      }

      const responseContent = getFirstChatCompletionContent(body)

      if (responseContent === null) {
        throw new AIProviderError('invalid_response', 'Groq returned an invalid project planner response.')
      }

      const parsedResponse = parseProjectPlanResponse(responseContent)

      if (!parsedResponse.success) {
        throw new AIProviderError(
          'invalid_response',
          parsedResponse.code === 'invalid_json'
            ? 'The AI project planner returned invalid JSON.'
            : 'The AI project planner returned data in an unexpected format.',
        )
      }

      return parsedResponse.data
    } catch (error) {
      throw normalizeAIProviderError(error, [this.apiKey])
    }
  }

  async generateSubtasks(request: SubtaskGenerationRequest): Promise<SubtaskGenerationResult> {
    if (this.selectedModelId === null || this.selectedModelId.trim().length === 0) {
      throw createMissingModelConfigurationError()
    }

    try {
      const response = await this.transport(`${GROQ_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: createGroqRequestHeaders(this.apiKey),
        body: JSON.stringify({
          model: this.selectedModelId,
          temperature: 0.2,
          response_format: {
            type: 'json_object',
          },
          messages: [
            {
              role: 'system',
              content: buildSubtaskGeneratorSystemPrompt(),
            },
            {
              role: 'user',
              content: buildSubtaskGeneratorUserPrompt(request),
            },
          ],
        }),
      })

      const body = (await response.json().catch(() => null)) as GroqChatCompletionResponse | null

      if (!response.ok) {
        throw createHttpError(response.status, response.statusText, body, this.apiKey)
      }

      const responseContent = getFirstChatCompletionContent(body)

      if (responseContent === null) {
        throw new AIProviderError('invalid_response', 'Groq returned an invalid subtask generator response.')
      }

      const parsedResponse = parseSubtaskGenerationResponse(responseContent)

      if (!parsedResponse.success) {
        throw new AIProviderError(
          'invalid_response',
          parsedResponse.code === 'invalid_json'
            ? 'The AI subtask generator returned invalid JSON.'
            : 'The AI subtask generator returned data in an unexpected format.',
        )
      }

      return parsedResponse.data
    } catch (error) {
      throw normalizeAIProviderError(error, [this.apiKey])
    }
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
