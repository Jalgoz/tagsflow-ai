import { describe, expect, it, vi } from 'vitest'
import type { AppSettings, SettingsRepository } from '../../domain'
import { createPrioritySuggestionUseCases } from './priority-suggestion-use-cases'
import type { AIProviderResolver } from './ai-provider-resolver'

const createSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
  theme: 'light',
  aiProvider: {
    provider: 'groq',
    apiKey: 'secret-key',
    selectedModelId: 'llama-3.3-70b-versatile',
  },
  ...overrides,
})

const createRepository = (settings: AppSettings): SettingsRepository => ({
  get: async () => settings,
  save: async (nextSettings) => nextSettings,
  reset: async () => settings,
})

describe('createPrioritySuggestionUseCases', () => {
  it('resolves configured AI and returns provider-neutral suggestions', async () => {
    const suggestPriority = vi.fn(async () => ({
      suggestedPriority: 'high' as const,
      rationale: 'The task is blocking the release.',
    }))
    const resolver: AIProviderResolver = {
      mode: 'live',
      resolve: () => ({
        isConfigured: true,
        provider: {
          listModels: async () => [],
          testConnection: async () => ({ connected: true, message: 'ok' }),
          generateProjectPlan: async () => ({ taskSuggestions: [] }),
          generateSubtasks: async () => ({ subtaskSuggestions: [] }),
          suggestPriority,
          summarizeProject: async () => ({ summary: '', risks: [], nextSteps: [] }),
        },
        providerId: 'groq',
        selectedModelId: 'llama-3.3-70b-versatile',
      }),
    }

    const useCases = createPrioritySuggestionUseCases(createRepository(createSettings()), resolver)

    await expect(
      useCases.generatePrioritySuggestion({
        project: {
          id: 'project-1',
          title: 'Platform refresh',
          description: 'Refresh the main platform experience.',
          objective: 'Ship the MVP',
          inScopeContent: 'Dashboard and tasks',
          outOfScopeContent: 'Backend services',
          status: 'active',
          startDate: '2026-06-01',
          dueDate: '2026-06-30',
          memberIds: [],
          taskIds: [],
        },
        task: {
          id: 'task-1',
          projectId: 'project-1',
          title: 'Review current UX',
          description: 'Audit the current task flows and identify gaps.',
          inScopeContent: 'Selected scope',
          outOfScopeContent: 'Outside scope',
          priority: 'medium',
          status: 'todo',
          startDate: '2026-06-02',
          dueDate: '2026-06-12',
          assigneeMemberId: null,
          tagIds: [],
          checklist: [],
          subtaskIds: [],
        },
        tasks: [],
        subtasks: [],
        tags: [],
        members: [],
      }),
    ).resolves.toEqual({
      suggestedPriority: 'high',
      rationale: 'The task is blocking the release.',
    })

    expect(suggestPriority).toHaveBeenCalledWith(
      expect.objectContaining({
        project: expect.objectContaining({
          title: 'Platform refresh',
        }),
        selectedTask: expect.objectContaining({
          currentPriority: 'medium',
        }),
      }),
    )
  })

  it('rejects generation when AI configuration is missing', async () => {
    const resolver: AIProviderResolver = {
      mode: 'live',
      resolve: () => {
        throw new Error('provider should not be resolved')
      },
    }

    const useCases = createPrioritySuggestionUseCases(createRepository(createSettings({ aiProvider: { provider: 'groq', apiKey: null, selectedModelId: null } })), resolver)

    await expect(
      useCases.generatePrioritySuggestion({
        project: {
          id: 'project-1',
          title: 'Platform refresh',
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
        task: {
          id: 'task-1',
          projectId: 'project-1',
          title: 'Review current UX',
          description: '',
          inScopeContent: '',
          outOfScopeContent: '',
          priority: 'medium',
          status: 'todo',
          startDate: null,
          dueDate: null,
          assigneeMemberId: null,
          tagIds: [],
          checklist: [],
          subtaskIds: [],
        },
        tasks: [],
        subtasks: [],
        tags: [],
        members: [],
      }),
    ).rejects.toThrow('Add a Groq API key in Settings before generating AI priority suggestions.')
  })
})

