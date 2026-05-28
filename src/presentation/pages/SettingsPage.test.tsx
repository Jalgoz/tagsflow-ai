import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type {
  AppSettings,
  LocalBackupData,
  LocalBackupRepository,
  LocalBackupValidationResult,
  SettingsRepository,
  ValidatedLocalBackupData,
} from '../../domain'
import { LocalBackupRepositoryProvider, SettingsRepositoryProvider } from '../../application'
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

const createBackupRepository = (): LocalBackupRepository => {
  let database: ValidatedLocalBackupData = {
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
    exportBackup: async () => exportData,
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
        settings: {
          theme: 'light',
          aiProvider: {
            provider: 'groq',
            apiKey: null,
            selectedModelId: null,
          },
        },
      }
    },
  }
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const settingsRepository = createSettingsRepository()
  const backupRepository = createBackupRepository()

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SettingsRepositoryProvider repository={settingsRepository}>
          <LocalBackupRepositoryProvider repository={backupRepository}>{children}</LocalBackupRepositoryProvider>
        </SettingsRepositoryProvider>
      </ToastProvider>
    </QueryClientProvider>
  )

  return { Wrapper }
}

describe('SettingsPage', () => {
  it('renders the functional settings sections', async () => {
    const { Wrapper } = createWrapper()

    render(<SettingsPage />, { wrapper: Wrapper })

    expect(await screen.findByRole('heading', { name: 'Application settings' })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Appearance' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Local data backup' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Import data' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Danger zone' })).toBeTruthy()
  })

  it('shows import validation errors for malformed JSON', async () => {
    const { Wrapper } = createWrapper()

    render(<SettingsPage />, { wrapper: Wrapper })

    const input = (await screen.findAllByLabelText('Backup file'))[0]
    const invalidFile = new File(['not-valid'], 'invalid.json', { type: 'application/json' })

    fireEvent.change(input, { target: { files: [invalidFile] } })

    expect(await screen.findByText('The selected file is not valid JSON.')).toBeTruthy()
  })

  it('opens and cancels import replacement confirmation for valid backup', async () => {
    const { Wrapper } = createWrapper()

    render(<SettingsPage />, { wrapper: Wrapper })

    const input = (await screen.findAllByLabelText('Backup file'))[0]
    const validFile = new File(['valid'], 'backup.json', { type: 'application/json' })

    fireEvent.change(input, { target: { files: [validFile] } })

    const replaceButton = await screen.findByRole('button', { name: 'Replace local data from backup' })
    fireEvent.click(replaceButton)

    expect(await screen.findByRole('heading', { name: 'Replace local data from backup?' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Replace local data from backup?' })).toBeNull()
    })
  })

  it('clears selected import file when clear button is pressed', async () => {
    const { Wrapper } = createWrapper()

    render(<SettingsPage />, { wrapper: Wrapper })

    const input = (await screen.findAllByLabelText('Backup file'))[0]
    const validFile = new File(['valid'], 'backup.json', { type: 'application/json' })

    fireEvent.change(input, { target: { files: [validFile] } })

    expect(await screen.findByText('backup.json')).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Clear selected backup file' })).toBeTruthy()
    expect(await screen.findByText('Valid backup ready')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear selected backup file' }))

    await waitFor(() => {
      expect(screen.queryByText('backup.json')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Clear selected backup file' })).toBeNull()
      expect(screen.queryByText('Valid backup ready')).toBeNull()
      expect(screen.getAllByText('No file selected').length).toBeGreaterThan(0)
    })
  })
})
