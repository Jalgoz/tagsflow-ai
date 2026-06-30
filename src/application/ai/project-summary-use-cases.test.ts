import { describe, expect, it, vi } from 'vitest'
import type { AppSettings, SettingsRepository } from '../../domain'
import { createProjectSummaryUseCases } from './project-summary-use-cases'
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

describe('createProjectSummaryUseCases', () => {
  it('resolves configured AI and returns provider-neutral summaries', async () => {
    const summarizeProject = vi.fn(async () => ({
      summary: 'The project is on track.',
      health: 'on_track' as const,
      risks: [],
      blockers: [],
      nextSteps: ['Keep the current pace.'],
      notableCompletedWork: ['Finished the initial setup.'],
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
          suggestPriority: async () => ({ suggestedPriority: 'medium', rationale: 'ok' }),
          summarizeProject,
        },
        providerId: 'groq',
        selectedModelId: 'llama-3.3-70b-versatile',
      }),
    }

    const useCases = createProjectSummaryUseCases(createRepository(createSettings()), resolver)

    await expect(
      useCases.generateProjectSummary({
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
          taskIds: ['task-1'],
        },
        tasks: [
          {
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
        ],
        subtasks: [],
        tags: [],
        members: [],
        referenceDate: '2026-06-09',
      }),
    ).resolves.toEqual({
      summary: 'The project is on track.',
      health: 'on_track',
      risks: [],
      blockers: [],
      nextSteps: ['Keep the current pace.'],
      notableCompletedWork: ['Finished the initial setup.'],
    })

    expect(summarizeProject).toHaveBeenCalledWith(
      expect.objectContaining({
        project: expect.objectContaining({
          title: 'Platform refresh',
        }),
        taskCounts: expect.objectContaining({
          todo: 1,
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

    const useCases = createProjectSummaryUseCases(
      createRepository(createSettings({ aiProvider: { provider: 'groq', apiKey: null, selectedModelId: null } })),
      resolver,
    )

    await expect(
      useCases.generateProjectSummary({
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
        tasks: [],
        subtasks: [],
        tags: [],
        members: [],
        referenceDate: '2026-06-09',
      }),
    ).rejects.toThrow('Add a Groq API key in Settings before generating an AI project summary.')
  })
})
