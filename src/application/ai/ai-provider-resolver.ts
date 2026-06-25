import type { AppSettings, AIProvider } from '../../domain'
import { createMissingConfigurationError, GroqAIProvider, MockAIProvider, type AIRequestTransport } from '../../infrastructure/ai'

export type AIProviderResolverMode = 'live' | 'mock'

export type ResolveAIProviderOptions = {
  apiKeyOverride?: string | null
}

export type AIProviderResolution =
  | {
      isConfigured: true
      provider: AIProvider
      providerId: 'groq' | 'mock'
      selectedModelId: string | null
    }
  | {
      isConfigured: false
      error: Error
      providerId: 'groq'
      selectedModelId: string | null
    }

export interface AIProviderResolver {
  mode: AIProviderResolverMode
  resolve: (settings: AppSettings, options?: ResolveAIProviderOptions) => AIProviderResolution
}

type CreateAIProviderResolverOptions = {
  groqTransport?: AIRequestTransport
  mode?: AIProviderResolverMode
}

const toNullableTrimmedString = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : null
}

const getEffectiveApiKey = (settings: AppSettings, options?: ResolveAIProviderOptions): string | null =>
  toNullableTrimmedString(options?.apiKeyOverride) ?? toNullableTrimmedString(settings.aiProvider.apiKey)

export const createAIProviderResolver = ({
  groqTransport,
  mode = 'live',
}: CreateAIProviderResolverOptions = {}): AIProviderResolver => ({
  mode,
  resolve: (settings, options) => {
    if (mode === 'mock') {
      return {
        isConfigured: true,
        provider: new MockAIProvider(),
        providerId: 'mock',
        selectedModelId: settings.aiProvider.selectedModelId,
      }
    }

    const effectiveApiKey = getEffectiveApiKey(settings, options)

    if (effectiveApiKey === null) {
      return {
        isConfigured: false,
        error: createMissingConfigurationError(),
        providerId: 'groq',
        selectedModelId: settings.aiProvider.selectedModelId,
      }
    }

    return {
      isConfigured: true,
      provider: new GroqAIProvider({
        apiKey: effectiveApiKey,
        selectedModelId: settings.aiProvider.selectedModelId,
        transport: groqTransport,
      }),
      providerId: 'groq',
      selectedModelId: settings.aiProvider.selectedModelId,
    }
  },
})
