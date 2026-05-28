import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { LocalBackupRepository, SettingsRepository } from '../domain'
import { LocalBackupRepositoryProvider, SettingsRepositoryProvider } from '../application'
import { AppThemeSync } from './AppThemeSync'

const createSettingsRepository = (theme: 'light' | 'dark'): SettingsRepository => ({
  get: async () => ({
    theme,
    aiProvider: {
      provider: 'groq',
      apiKey: null,
      selectedModelId: null,
    },
  }),
  save: async (settings) => settings,
  reset: async () => ({
    theme: 'light',
    aiProvider: {
      provider: 'groq',
      apiKey: null,
      selectedModelId: null,
    },
  }),
})

const backupRepository: LocalBackupRepository = {
  exportBackup: async () => ({
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
        selectedModelId: null,
        hasApiKey: false,
      },
    },
  }),
  validateImport: async () => ({
    success: false,
    code: 'invalid_shape',
    message: 'Not used in this test.',
    details: [],
  }),
  replaceWithValidatedImport: async () => {},
  resetLocalData: async () => {},
}

const createWrapper = (settingsRepository: SettingsRepository) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SettingsRepositoryProvider repository={settingsRepository}>
        <LocalBackupRepositoryProvider repository={backupRepository}>{children}</LocalBackupRepositoryProvider>
      </SettingsRepositoryProvider>
    </QueryClientProvider>
  )
}

describe('AppThemeSync', () => {
  it('applies the persisted theme marker to the root element', async () => {
    render(<AppThemeSync />, { wrapper: createWrapper(createSettingsRepository('dark')) })

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })
})
