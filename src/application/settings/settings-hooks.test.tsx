import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type {
  AppSettings,
  LocalBackupData,
  LocalBackupRepository,
  LocalBackupValidationResult,
  SettingsRepository,
  ValidatedLocalBackupData,
} from '../../domain'
import {
  LocalBackupRepositoryProvider,
  SettingsRepositoryProvider,
  useReplaceLocalBackup,
  useResetLocalData,
  useSaveTheme,
  useSettings,
  useValidateLocalBackupImport,
} from './index'

const createSettings = (theme: AppSettings['theme'] = 'light'): AppSettings => ({
  theme,
  aiProvider: {
    provider: 'groq',
    apiKey: null,
    selectedModelId: null,
  },
})

const createSettingsRepository = (initialSettings = createSettings()): SettingsRepository => {
  let settings = initialSettings

  return {
    get: async () => settings,
    save: async (nextSettings) => {
      settings = nextSettings
      return settings
    },
    reset: async () => {
      settings = createSettings()
      return settings
    },
  }
}

const createLocalBackupRepository = (): {
  repository: LocalBackupRepository
  getState: () => ValidatedLocalBackupData
} => {
  let database: ValidatedLocalBackupData = {
    version: 1,
    projects: [],
    tasks: [],
    subtasks: [],
    members: [],
    tags: [],
    settings: createSettings('light'),
  }

  const exportData: LocalBackupData = {
    ...database,
    settings: {
      theme: 'light',
      aiProvider: {
        provider: 'groq',
        selectedModelId: null,
        hasApiKey: false,
      },
    },
  }

  return {
    repository: {
      exportBackup: async () => exportData,
      validateImport: async (jsonText: string): Promise<LocalBackupValidationResult> => {
        if (jsonText === 'bad-json') {
          return {
            success: false,
            code: 'malformed_json',
            message: 'Invalid JSON.',
            details: [],
          }
        }

        return {
          success: true,
          database,
        }
      },
      replaceWithValidatedImport: async (nextDatabase) => {
        database = nextDatabase
      },
      resetLocalData: async () => {
        database = {
          version: 1,
          projects: [],
          tasks: [],
          subtasks: [],
          members: [],
          tags: [],
          settings: createSettings('light'),
        }
      },
    },
    getState: () => database,
  }
}

const createWrapper = (settingsRepository: SettingsRepository, backupRepository: LocalBackupRepository) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SettingsRepositoryProvider repository={settingsRepository}>
        <LocalBackupRepositoryProvider repository={backupRepository}>{children}</LocalBackupRepositoryProvider>
      </SettingsRepositoryProvider>
    </QueryClientProvider>
  )

  return { Wrapper, queryClient }
}

describe('settings hooks', () => {
  it('loads current settings and persists theme changes', async () => {
    const settingsRepository = createSettingsRepository(createSettings('light'))
    const backupRepository = createLocalBackupRepository().repository
    const { Wrapper } = createWrapper(settingsRepository, backupRepository)

    const settingsResult = renderHook(() => useSettings(), { wrapper: Wrapper })
    const saveThemeResult = renderHook(() => useSaveTheme(), { wrapper: Wrapper })

    await waitFor(() => expect(settingsResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await saveThemeResult.result.current.mutateAsync('dark')
    })

    await waitFor(async () => {
      const savedSettings = await settingsRepository.get()
      expect(savedSettings.theme).toBe('dark')
    })
  })

  it('returns validation errors for invalid imports', async () => {
    const settingsRepository = createSettingsRepository()
    const backupRepository = createLocalBackupRepository().repository
    const { Wrapper } = createWrapper(settingsRepository, backupRepository)
    const validateImportResult = renderHook(() => useValidateLocalBackupImport(), { wrapper: Wrapper })

    let validationResult: LocalBackupValidationResult | undefined

    await act(async () => {
      validationResult = await validateImportResult.result.current.mutateAsync('bad-json')
    })

    expect(validationResult).toEqual({
      success: false,
      code: 'malformed_json',
      message: 'Invalid JSON.',
      details: [],
    })
  })

  it('replaces imported data and invalidates cached queries', async () => {
    const settingsRepository = createSettingsRepository()
    const backupState = createLocalBackupRepository()
    const { Wrapper, queryClient } = createWrapper(settingsRepository, backupState.repository)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const replaceResult = renderHook(() => useReplaceLocalBackup(), { wrapper: Wrapper })

    await act(async () => {
      await replaceResult.result.current.mutateAsync({
        version: 1,
        projects: [{ id: 'project-1', title: 'P', description: '', objective: '', inScopeContent: '', outOfScopeContent: '', status: 'active', startDate: null, dueDate: null, memberIds: [], taskIds: [] }],
        tasks: [],
        subtasks: [],
        members: [],
        tags: [],
        settings: createSettings('dark'),
      })
    })

    expect(backupState.getState().projects).toHaveLength(1)
    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('resets local data and invalidates cached queries', async () => {
    const settingsRepository = createSettingsRepository()
    const backupState = createLocalBackupRepository()
    const { Wrapper, queryClient } = createWrapper(settingsRepository, backupState.repository)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const resetResult = renderHook(() => useResetLocalData(), { wrapper: Wrapper })

    await act(async () => {
      await resetResult.result.current.mutateAsync()
    })

    expect(backupState.getState().projects).toEqual([])
    expect(backupState.getState().settings.theme).toBe('light')
    expect(invalidateSpy).toHaveBeenCalled()
  })
})
