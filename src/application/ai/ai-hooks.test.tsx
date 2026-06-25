import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { SettingsRepository } from '../../domain'
import { SettingsRepositoryProvider } from '../settings'
import { createAIProviderResolver } from './ai-provider-resolver'
import { AIProviderResolverProvider } from './ai-provider-resolver-provider'
import {
  useAIConfiguration,
  useAIModels,
  useClearAIProviderApiKey,
  useSaveAIProviderSettings,
  useTestAIConnection,
} from './ai-hooks'

const createSettingsRepository = (apiKey: string | null = null): SettingsRepository => {
  let settings: {
    theme: 'light' | 'dark'
    aiProvider: {
      provider: 'groq'
      apiKey: string | null
      selectedModelId: string | null
    }
  } = {
    theme: 'light' as const,
    aiProvider: {
      provider: 'groq' as const,
      apiKey,
      selectedModelId: 'llama-3.3-70b-versatile',
    },
  }

  return {
    get: async () => settings,
    save: async (nextSettings) => {
      settings = nextSettings
      return settings
    },
    reset: async () => {
      settings = {
        theme: 'light',
        aiProvider: {
          provider: 'groq',
          apiKey: null,
          selectedModelId: null,
        },
      }
      return settings
    },
  }
}

const createWrapper = (settingsRepository: SettingsRepository, resolver = createAIProviderResolver()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AIProviderResolverProvider resolver={resolver}>
        <SettingsRepositoryProvider repository={settingsRepository}>{children}</SettingsRepositoryProvider>
      </AIProviderResolverProvider>
    </QueryClientProvider>
  )

  return { Wrapper, queryClient }
}

describe('AI application hooks', () => {
  it('derives configured state from saved settings', async () => {
    const { Wrapper } = createWrapper(createSettingsRepository('saved-key'))
    const result = renderHook(() => useAIConfiguration(), { wrapper: Wrapper })

    await waitFor(() => expect(result.result.current.isSuccess).toBe(true))
    expect(result.result.current.data).toEqual({
      provider: 'groq',
      selectedModelId: 'llama-3.3-70b-versatile',
      hasSavedApiKey: true,
      isConfigured: true,
    })
  })

  it('saves selected model changes without clearing an existing saved key', async () => {
    const settingsRepository = createSettingsRepository('saved-key')
    const { Wrapper, queryClient } = createWrapper(settingsRepository)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const result = renderHook(() => useSaveAIProviderSettings(), { wrapper: Wrapper })

    await act(async () => {
      await result.result.current.mutateAsync({
        provider: 'groq',
        selectedModelId: 'openai/gpt-oss-20b',
        apiKey: '',
      })
    })

    expect((await settingsRepository.get()).aiProvider).toEqual({
      provider: 'groq',
      apiKey: 'saved-key',
      selectedModelId: 'openai/gpt-oss-20b',
    })
    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('clears the saved API key and selected model explicitly', async () => {
    const settingsRepository = createSettingsRepository('saved-key')
    const { Wrapper } = createWrapper(settingsRepository)
    const result = renderHook(() => useClearAIProviderApiKey(), { wrapper: Wrapper })

    await act(async () => {
      await result.result.current.mutateAsync()
    })

    expect((await settingsRepository.get()).aiProvider).toEqual({
      provider: 'groq',
      apiKey: null,
      selectedModelId: null,
    })
  })

  it('blocks real provider requests when no key is available', async () => {
    const { Wrapper } = createWrapper(createSettingsRepository())
    const result = renderHook(() => useTestAIConnection(), { wrapper: Wrapper })

    let response: Awaited<ReturnType<typeof result.result.current.mutateAsync>> | undefined

    await act(async () => {
      response = await result.result.current.mutateAsync(undefined)
    })

    expect(response).toEqual({
      connected: false,
      message: 'Add a Groq API key before using AI provider actions.',
    })
  })

  it('supports explicit mock-provider wiring without persisting a mock provider value', async () => {
    const settingsRepository = createSettingsRepository()
    const { Wrapper } = createWrapper(settingsRepository, createAIProviderResolver({ mode: 'mock' }))
    const testConnectionResult = renderHook(() => useTestAIConnection(), { wrapper: Wrapper })

    await act(async () => {
      await expect(testConnectionResult.result.current.mutateAsync(undefined)).resolves.toEqual({
        connected: true,
        message: 'Mock AI provider connection succeeded.',
        modelIds: ['mock-model-v1'],
      })
    })

    const modelsWithOverrideResult = renderHook(() => useAIModels('temporary-key'), { wrapper: Wrapper })

    await waitFor(() => expect(modelsWithOverrideResult.result.current.isSuccess).toBe(true))
    expect(modelsWithOverrideResult.result.current.data?.[0]?.id).toBe('mock-model-v1')
    expect((await settingsRepository.get()).aiProvider.provider).toBe('groq')
  })
})
