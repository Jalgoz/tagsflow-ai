import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { LocalBackupRepository, SettingsRepository, ValidatedLocalBackupData } from '../../domain'
import {
  LocalBackupRepositoryProvider,
  OnboardingStateRepositoryProvider,
  SettingsRepositoryProvider,
} from '../index'
import type { OnboardingStateRepository } from './onboarding-state-repository'
import {
  useLoadDemoData,
  useOnboardingStatus,
  useResetLocalDataWithOnboarding,
  useStartEmptyOnboarding,
} from './onboarding-hooks'

const createSettings = () => ({
  theme: 'light' as const,
  aiProvider: {
    provider: 'groq' as const,
    apiKey: null,
    selectedModelId: null,
  },
})

const createSettingsRepository = (): SettingsRepository => ({
  get: async () => createSettings(),
  save: async (settings) => settings,
  reset: async () => createSettings(),
})

const createRepositories = (): {
  backupRepository: LocalBackupRepository
  getBackupData: () => ValidatedLocalBackupData
  onboardingStateRepository: OnboardingStateRepository
  getCompleted: () => boolean
} => {
  let backupData: ValidatedLocalBackupData = {
    version: 1,
    projects: [],
    tasks: [],
    subtasks: [],
    members: [],
    tags: [],
    settings: createSettings(),
  }
  let completed = false

  return {
    backupRepository: {
      exportBackup: async () => ({
        ...backupData,
        settings: {
          theme: backupData.settings.theme,
          aiProvider: {
            provider: backupData.settings.aiProvider.provider,
            selectedModelId: backupData.settings.aiProvider.selectedModelId,
            hasApiKey: backupData.settings.aiProvider.apiKey !== null,
          },
        },
      }),
      validateImport: async () => ({
        success: false,
        code: 'invalid_shape',
        message: 'Not used in onboarding tests.',
        details: [],
      }),
      replaceWithValidatedImport: async (nextDatabase) => {
        backupData = nextDatabase
      },
      resetLocalData: async () => {
        backupData = {
          version: 1,
          projects: [],
          tasks: [],
          subtasks: [],
          members: [],
          tags: [],
          settings: createSettings(),
        }
      },
    },
    getBackupData: () => backupData,
    onboardingStateRepository: {
      getState: async () => ({
        version: 1,
        completed,
      }),
      markCompleted: async () => {
        completed = true
        return {
          version: 1,
          completed,
        }
      },
      clear: async () => {
        completed = false
      },
    },
    getCompleted: () => completed,
  }
}

const createWrapper = (params: {
  backupRepository: LocalBackupRepository
  onboardingStateRepository: OnboardingStateRepository
  settingsRepository: SettingsRepository
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SettingsRepositoryProvider repository={params.settingsRepository}>
        <LocalBackupRepositoryProvider repository={params.backupRepository}>
          <OnboardingStateRepositoryProvider repository={params.onboardingStateRepository}>
            {children}
          </OnboardingStateRepositoryProvider>
        </LocalBackupRepositoryProvider>
      </SettingsRepositoryProvider>
    </QueryClientProvider>
  )

  return { Wrapper, queryClient }
}

describe('onboarding hooks', () => {
  it('shows onboarding for an empty workspace until a choice is completed', async () => {
    const repositories = createRepositories()
    const { Wrapper } = createWrapper({
      backupRepository: repositories.backupRepository,
      onboardingStateRepository: repositories.onboardingStateRepository,
      settingsRepository: createSettingsRepository(),
    })

    const onboardingStatus = renderHook(() => useOnboardingStatus(), { wrapper: Wrapper })
    const startEmpty = renderHook(() => useStartEmptyOnboarding(), { wrapper: Wrapper })

    await waitFor(() => expect(onboardingStatus.result.current.isSuccess).toBe(true))
    expect(onboardingStatus.result.current.data?.shouldShowOnboarding).toBe(true)

    await act(async () => {
      await startEmpty.result.current.mutateAsync()
    })

    await waitFor(() => {
      expect(repositories.getCompleted()).toBe(true)
      expect(onboardingStatus.result.current.data?.shouldShowOnboarding).toBe(false)
    })
  })

  it('loads demo data, persists onboarding completion, and prevents repeat onboarding', async () => {
    const repositories = createRepositories()
    const { Wrapper, queryClient } = createWrapper({
      backupRepository: repositories.backupRepository,
      onboardingStateRepository: repositories.onboardingStateRepository,
      settingsRepository: createSettingsRepository(),
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const hooks = renderHook(
      () => ({
        loadDemoData: useLoadDemoData(),
        onboardingStatus: useOnboardingStatus(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(hooks.result.current.onboardingStatus.isSuccess).toBe(true))

    await act(async () => {
      await hooks.result.current.loadDemoData.mutateAsync()
    })
    await act(async () => {
      await hooks.result.current.onboardingStatus.refetch()
    })

    await waitFor(() => {
      expect(repositories.getCompleted()).toBe(true)
      expect(repositories.getBackupData().projects.length).toBe(1)
      expect(hooks.result.current.onboardingStatus.data?.shouldShowOnboarding).toBe(false)
      expect(invalidateSpy).toHaveBeenCalled()
    })
  })

  it('clears onboarding completion when reset returns the workspace to empty data', async () => {
    const repositories = createRepositories()
    const { Wrapper } = createWrapper({
      backupRepository: repositories.backupRepository,
      onboardingStateRepository: repositories.onboardingStateRepository,
      settingsRepository: createSettingsRepository(),
    })
    const loadDemoData = renderHook(() => useLoadDemoData(), { wrapper: Wrapper })
    const resetWithOnboarding = renderHook(() => useResetLocalDataWithOnboarding(), { wrapper: Wrapper })

    await act(async () => {
      await loadDemoData.result.current.mutateAsync()
    })
    expect(repositories.getCompleted()).toBe(true)
    expect(repositories.getBackupData().projects.length).toBe(1)

    await act(async () => {
      await resetWithOnboarding.result.current.mutateAsync()
    })

    await waitFor(() => {
      expect(repositories.getBackupData().projects).toEqual([])
      expect(repositories.getCompleted()).toBe(false)
    })
  })
})
