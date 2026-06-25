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
  AIProviderResolverProvider,
  LocalBackupRepositoryProvider,
  OnboardingStateRepositoryProvider,
  SettingsRepositoryProvider,
  createAIProviderResolver,
} from '../../application'
import type { OnboardingStateRepository } from '../../application/onboarding/onboarding-state-repository'
import { ToastProvider } from '../feedback'
import { SettingsPage } from './SettingsPage'

const createSettingsRepository = (initialSettings?: AppSettings): { repository: SettingsRepository; getSettings: () => AppSettings } => {
  let settings: AppSettings = {
    theme: 'light' as const,
    aiProvider: {
      provider: 'groq' as const,
      apiKey: null,
      selectedModelId: null,
    },
    ...initialSettings,
  }

  return {
    repository: {
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
    },
    getSettings: () => settings,
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

const createWrapper = (
  initialDatabase = createBaseDatabase(),
  initialSettings?: AppSettings,
  resolver = createAIProviderResolver({ mode: 'mock' }),
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const settingsRepositoryState = createSettingsRepository(initialSettings)
  const repositories = createRepositories(initialDatabase)

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AIProviderResolverProvider resolver={resolver}>
          <SettingsRepositoryProvider repository={settingsRepositoryState.repository}>
            <LocalBackupRepositoryProvider repository={repositories.backupRepository}>
              <OnboardingStateRepositoryProvider repository={repositories.onboardingStateRepository}>
                {children}
              </OnboardingStateRepositoryProvider>
            </LocalBackupRepositoryProvider>
          </SettingsRepositoryProvider>
        </AIProviderResolverProvider>
      </ToastProvider>
    </QueryClientProvider>
  )

  return { Wrapper, repositories, getSettings: settingsRepositoryState.getSettings }
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
    expect(screen.getByRole('heading', { name: 'AI provider settings' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Local data backup' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Demo workspace data' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Import data' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Danger zone' })).toBeTruthy()
  })

  it('disables the connection test action when no saved or entered API key is available', async () => {
    const { Wrapper } = createWrapper(createBaseDatabase(), undefined, createAIProviderResolver())

    render(<SettingsPage />, { wrapper: Wrapper })

    expect((await screen.findByRole('button', { name: 'Test connection' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('saves AI settings without rendering the full saved API key back into the input', async () => {
    const { Wrapper, getSettings } = createWrapper(createBaseDatabase(), undefined, createAIProviderResolver())

    render(<SettingsPage />, { wrapper: Wrapper })

    fireEvent.change(await screen.findByLabelText('Groq API key *'), { target: { value: 'secret-key-123' } })
    fireEvent.change(screen.getByLabelText('Selected model'), { target: { value: 'openai/gpt-oss-20b' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save AI settings' }))
    expect(await screen.findByRole('heading', { name: 'Save AI settings to local storage?' })).toBeTruthy()
    expect(
      screen.getByText(
        "These AI settings will be saved in this browser's local storage. If you are using a shared or temporary machine, clear the saved API key when you finish working to reduce the risk of exposing your Groq credentials.",
      ),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Save to local storage' }))

    await waitFor(() => {
      expect(getSettings().aiProvider.apiKey).toBe('secret-key-123')
    })

    const apiKeyInput = screen.getByLabelText('Groq API key *') as HTMLInputElement
    await waitFor(() => {
      expect(apiKeyInput.value).toBe('')
    })
    expect(apiKeyInput.placeholder).toBe('Saved locally. Enter a new key only if you want to replace it.')
    expect(screen.getByText('API key already saved locally')).toBeTruthy()
    expect(
      screen.getByText('Your current Groq API key is already stored. Leave this field empty to keep it, or paste a new key to replace it.'),
    ).toBeTruthy()
    expect(screen.queryByDisplayValue('secret-key-123')).toBeNull()
    expect(await screen.findByText('AI provider settings saved.')).toBeTruthy()
  })

  it('clears a saved API key, clears the selected model, and shows a success toast', async () => {
    const { Wrapper, getSettings } = createWrapper(
      createBaseDatabase(),
      {
        theme: 'light',
        aiProvider: {
          provider: 'groq',
          apiKey: 'saved-key',
          selectedModelId: 'llama-3.3-70b-versatile',
        },
      },
      createAIProviderResolver(),
    )

    render(<SettingsPage />, { wrapper: Wrapper })

    fireEvent.click(await screen.findByRole('button', { name: 'Clear saved API key' }))

    await waitFor(() => {
      expect(getSettings().aiProvider).toEqual({
        provider: 'groq',
        apiKey: null,
        selectedModelId: null,
      })
    })

    expect(await screen.findByText('Groq API key cleared.')).toBeTruthy()
    const selectedModelInput = screen.getByLabelText('Selected model') as HTMLInputElement
    expect(selectedModelInput.value).toBe('')
  })

  it('shows a visible redacted error when the connection test fails', async () => {
    const failingResolver = createAIProviderResolver({
      groqTransport: async () =>
        new Response(JSON.stringify({ error: { message: 'Bearer user-secret-key is invalid.' } }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
    })
    const { Wrapper } = createWrapper(createBaseDatabase(), undefined, failingResolver)

    render(<SettingsPage />, { wrapper: Wrapper })

    fireEvent.change(await screen.findByLabelText('Groq API key *'), { target: { value: 'user-secret-key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))

    expect(await screen.findAllByText('Groq rejected the API key.')).toHaveLength(2)
    expect(screen.queryByText('user-secret-key')).toBeNull()
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
