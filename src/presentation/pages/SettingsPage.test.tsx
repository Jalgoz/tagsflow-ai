import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
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
  OnboardingStateRepositoryProvider,
  SettingsRepositoryProvider,
} from '../../application'
import type { OnboardingStateRepository } from '../../application/onboarding/onboarding-state-repository'
import { ToastProvider } from '../feedback'
import { SettingsPage } from './SettingsPage'

const createSettingsRepository = (): SettingsRepository => {
  let settings: AppSettings = {
    theme: 'light' as const,
    aiProvider: {
      provider: 'groq' as const,
      apiKey: null,
      selectedModelId: null,
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

const createBaseDatabase = (): ValidatedLocalBackupData => ({
  version: 1,
  projects: [],
  tasks: [],
  subtasks: [],
  members: [],
  tags: [],
  settings: {
    theme: 'light',
    aiProvider: {
      provider: 'groq',
      apiKey: null,
      selectedModelId: null,
    },
  },
})

const createRepositories = (initialDatabase = createBaseDatabase()): {
  backupRepository: LocalBackupRepository
  onboardingStateRepository: OnboardingStateRepository
  getDatabase: () => ValidatedLocalBackupData
  getReplaceCount: () => number
} => {
  let database = initialDatabase
  let onboardingCompleted = false
  let replaceCount = 0

  const exportData = (): LocalBackupData => ({
    ...database,
    settings: {
      theme: database.settings.theme,
      aiProvider: {
        provider: 'groq',
        selectedModelId: database.settings.aiProvider.selectedModelId,
        hasApiKey: database.settings.aiProvider.apiKey !== null,
      },
    },
  })

  return {
    backupRepository: {
      exportBackup: async () => exportData(),
      validateImport: async (jsonText: string): Promise<LocalBackupValidationResult> => {
        if (jsonText === 'valid') {
          return {
            success: true,
            database,
          }
        }

        return {
          success: false,
          code: 'malformed_json',
          message: 'The selected file is not valid JSON.',
          details: [],
        }
      },
      replaceWithValidatedImport: async (nextDatabase) => {
        replaceCount += 1
        database = nextDatabase
      },
      resetLocalData: async () => {
        database = createBaseDatabase()
      },
    },
    onboardingStateRepository: {
      getState: async () => ({
        version: 1,
        completed: onboardingCompleted,
      }),
      markCompleted: async () => {
        onboardingCompleted = true
        return {
          version: 1,
          completed: true,
        }
      },
      clear: async () => {
        onboardingCompleted = false
      },
    },
    getDatabase: () => database,
    getReplaceCount: () => replaceCount,
  }
}

const createWrapper = (initialDatabase = createBaseDatabase()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const settingsRepository = createSettingsRepository()
  const repositories = createRepositories(initialDatabase)

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SettingsRepositoryProvider repository={settingsRepository}>
          <LocalBackupRepositoryProvider repository={repositories.backupRepository}>
            <OnboardingStateRepositoryProvider repository={repositories.onboardingStateRepository}>
              {children}
            </OnboardingStateRepositoryProvider>
          </LocalBackupRepositoryProvider>
        </SettingsRepositoryProvider>
      </ToastProvider>
    </QueryClientProvider>
  )

  return { Wrapper, repositories }
}

describe('SettingsPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the functional settings sections', async () => {
    const { Wrapper } = createWrapper()

    render(<SettingsPage />, { wrapper: Wrapper })

    expect(await screen.findByRole('heading', { name: 'Application settings' })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Appearance' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Local data backup' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Demo workspace data' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Import data' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Danger zone' })).toBeTruthy()
  })

  it('loads demo data directly when local business data is empty', async () => {
    const { Wrapper, repositories } = createWrapper()

    render(<SettingsPage />, { wrapper: Wrapper })

    const [loadDemoButton] = await screen.findAllByRole('button', { name: 'Load demo data' })
    fireEvent.click(loadDemoButton)

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Replace local data with demo workspace?' })).toBeNull()
      expect(repositories.getDatabase().projects[0]?.title).toBe('Development of a SaaS Frontend Platform')
      expect(repositories.getReplaceCount()).toBe(1)
    })
  })

  it('asks confirmation before replacing existing local data with demo data and keeps data unchanged on cancel', async () => {
    const populatedDatabase: ValidatedLocalBackupData = {
      ...createBaseDatabase(),
      projects: [
        {
          id: 'project-original',
          title: 'Existing project',
          description: '',
          objective: '',
          inScopeContent: '',
          outOfScopeContent: '',
          status: 'active',
          startDate: null,
          dueDate: null,
          memberIds: [],
          taskIds: [],
        },
      ],
    }
    const { Wrapper, repositories } = createWrapper(populatedDatabase)

    render(<SettingsPage />, { wrapper: Wrapper })

    const [loadDemoButton] = await screen.findAllByRole('button', { name: 'Load demo data' })
    fireEvent.click(loadDemoButton)
    expect(await screen.findByRole('heading', { name: 'Replace local data with demo workspace?' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Replace local data with demo workspace?' })).toBeNull()
      expect(repositories.getDatabase().projects[0]?.title).toBe('Existing project')
      expect(repositories.getReplaceCount()).toBe(0)
    })
  })

  it('replaces existing local data with demo data after confirmation', async () => {
    const populatedDatabase: ValidatedLocalBackupData = {
      ...createBaseDatabase(),
      projects: [
        {
          id: 'project-original',
          title: 'Existing project',
          description: '',
          objective: '',
          inScopeContent: '',
          outOfScopeContent: '',
          status: 'active',
          startDate: null,
          dueDate: null,
          memberIds: [],
          taskIds: [],
        },
      ],
    }
    const { Wrapper, repositories } = createWrapper(populatedDatabase)

    render(<SettingsPage />, { wrapper: Wrapper })

    const [loadDemoButton] = await screen.findAllByRole('button', { name: 'Load demo data' })
    fireEvent.click(loadDemoButton)
    fireEvent.click(await screen.findByRole('button', { name: 'Replace with demo data' }))

    await waitFor(() => {
      expect(repositories.getDatabase().projects[0]?.title).toBe('Development of a SaaS Frontend Platform')
      expect(repositories.getReplaceCount()).toBe(1)
    })

    expect(await screen.findByText('Demo workspace loaded as editable local data.')).toBeTruthy()
  })

  it('shows import validation errors for malformed JSON', async () => {
    const { Wrapper } = createWrapper()

    render(<SettingsPage />, { wrapper: Wrapper })

    const input = (await screen.findAllByLabelText('Backup file'))[0]
    const invalidFile = new File(['not-valid'], 'invalid.json', { type: 'application/json' })

    fireEvent.change(input, { target: { files: [invalidFile] } })

    expect(await screen.findByText('The selected file is not valid JSON.')).toBeTruthy()
  })
})
