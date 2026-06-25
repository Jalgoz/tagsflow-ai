import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { AppSettings } from '../../domain'
import { useSettingsRepository } from '../settings/settings-repository-context'
import { settingsQueryKeys } from '../settings/settings-query-keys'
import { aiQueryKeys } from './ai-query-keys'
import { useAIProviderResolver } from './ai-provider-resolver-context'
import { createAISettingsUseCases, type AIConfigurationState, type SaveAIProviderSettingsInput } from './ai-use-cases'

const invalidateAllAppDataQueries = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries()
}

const toKeySource = (apiKeyOverride: string | null | undefined, hasSavedApiKey: boolean): 'override' | 'saved' | 'missing' => {
  if (typeof apiKeyOverride === 'string' && apiKeyOverride.trim().length > 0) {
    return 'override'
  }

  return hasSavedApiKey ? 'saved' : 'missing'
}

export const useAIConfiguration = () => {
  const repository = useSettingsRepository()
  const resolver = useAIProviderResolver()

  return useQuery({
    queryKey: aiQueryKeys.configuration(),
    queryFn: () => createAISettingsUseCases(repository, resolver).getConfigurationState(),
  })
}

export const useSaveAIProviderSettings = () => {
  const repository = useSettingsRepository()
  const resolver = useAIProviderResolver()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveAIProviderSettingsInput) =>
      createAISettingsUseCases(repository, resolver).saveAIProviderSettings(input),
    onSuccess: async (savedSettings) => {
      const configurationState: AIConfigurationState = {
        provider: savedSettings.aiProvider.provider,
        selectedModelId: savedSettings.aiProvider.selectedModelId,
        hasSavedApiKey: savedSettings.aiProvider.apiKey !== null && savedSettings.aiProvider.apiKey.trim().length > 0,
        isConfigured: savedSettings.aiProvider.apiKey !== null && savedSettings.aiProvider.apiKey.trim().length > 0,
      }

      queryClient.setQueryData<AppSettings>(settingsQueryKeys.current(), savedSettings)
      queryClient.setQueryData(aiQueryKeys.configuration(), configurationState)
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}

export const useClearAIProviderApiKey = () => {
  const repository = useSettingsRepository()
  const resolver = useAIProviderResolver()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => createAISettingsUseCases(repository, resolver).clearAIProviderApiKey(),
    onSuccess: async (savedSettings) => {
      queryClient.setQueryData<AppSettings>(settingsQueryKeys.current(), savedSettings)
      queryClient.setQueryData(aiQueryKeys.configuration(), {
        provider: savedSettings.aiProvider.provider,
        selectedModelId: savedSettings.aiProvider.selectedModelId,
        hasSavedApiKey: false,
        isConfigured: false,
      } satisfies AIConfigurationState)
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}

export const useTestAIConnection = () => {
  const repository = useSettingsRepository()
  const resolver = useAIProviderResolver()

  return useMutation({
    mutationFn: async (apiKeyOverride?: string | null) =>
      createAISettingsUseCases(repository, resolver).testConnection({ apiKeyOverride }),
  })
}

export const useAIModels = (apiKeyOverride?: string | null) => {
  const repository = useSettingsRepository()
  const resolver = useAIProviderResolver()
  const configuration = useAIConfiguration()
  const keySource = toKeySource(apiKeyOverride, configuration.data?.hasSavedApiKey ?? false)

  return useQuery({
    queryKey: aiQueryKeys.models(configuration.data?.provider ?? 'groq', keySource),
    enabled: keySource !== 'missing',
    queryFn: () => createAISettingsUseCases(repository, resolver).listModels({ apiKeyOverride }),
  })
}
