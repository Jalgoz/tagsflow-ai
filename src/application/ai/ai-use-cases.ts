import type { AIConnectionTestResult, AIModelInfo, AppSettings, SettingsRepository } from '../../domain'
import type { AIProviderResolver, ResolveAIProviderOptions } from './ai-provider-resolver'

export type AIConfigurationState = {
  hasSavedApiKey: boolean
  isConfigured: boolean
  provider: AppSettings['aiProvider']['provider']
  selectedModelId: string | null
}

export type SaveAIProviderSettingsInput = {
  apiKey: string | null | undefined
  provider: AppSettings['aiProvider']['provider']
  selectedModelId: string | null
}

type AIProviderActionInput = ResolveAIProviderOptions

const toNullableTrimmedString = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : null
}

const hasConfiguredApiKey = (apiKey: string | null): boolean => apiKey !== null && apiKey.trim().length > 0

const toConfigurationState = (settings: AppSettings): AIConfigurationState => ({
  provider: settings.aiProvider.provider,
  selectedModelId: settings.aiProvider.selectedModelId,
  hasSavedApiKey: hasConfiguredApiKey(settings.aiProvider.apiKey),
  isConfigured: hasConfiguredApiKey(settings.aiProvider.apiKey),
})

export const createAISettingsUseCases = (
  settingsRepository: SettingsRepository,
  providerResolver: AIProviderResolver,
) => ({
  getConfigurationState: async (): Promise<AIConfigurationState> => toConfigurationState(await settingsRepository.get()),
  saveAIProviderSettings: async (input: SaveAIProviderSettingsInput): Promise<AppSettings> => {
    const currentSettings = await settingsRepository.get()
    const nextApiKey = toNullableTrimmedString(input.apiKey)

    return settingsRepository.save({
      ...currentSettings,
      aiProvider: {
        provider: input.provider,
        apiKey: nextApiKey ?? currentSettings.aiProvider.apiKey,
        selectedModelId: toNullableTrimmedString(input.selectedModelId),
      },
    })
  },
  clearAIProviderApiKey: async (): Promise<AppSettings> => {
    const currentSettings = await settingsRepository.get()

    return settingsRepository.save({
      ...currentSettings,
      aiProvider: {
        ...currentSettings.aiProvider,
        apiKey: null,
        selectedModelId: null,
      },
    })
  },
  testConnection: async (input: AIProviderActionInput = {}): Promise<AIConnectionTestResult> => {
    const settings = await settingsRepository.get()
    const resolution = providerResolver.resolve(settings, input)

    if (!resolution.isConfigured) {
      return {
        connected: false,
        message: resolution.error.message,
      }
    }

    return resolution.provider.testConnection()
  },
  listModels: async (input: AIProviderActionInput = {}): Promise<AIModelInfo[]> => {
    const settings = await settingsRepository.get()
    const resolution = providerResolver.resolve(settings, input)

    if (!resolution.isConfigured) {
      throw resolution.error
    }

    return resolution.provider.listModels()
  },
})
