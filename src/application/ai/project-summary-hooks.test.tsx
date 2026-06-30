import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type {
  AppSettings,
  AIProvider,
  CreateMemberInput,
  CreateProjectInput,
  CreateSubtaskInput,
  CreateTagInput,
  CreateTaskInput,
  Member,
  MemberRepository,
  Project,
  ProjectRepository,
  SettingsRepository,
  Subtask,
  SubtaskRepository,
  Tag,
  TagRepository,
  Task,
  TaskRepository,
  UpdateMemberInput,
  UpdateProjectInput,
  UpdateSubtaskInput,
  UpdateTagInput,
  UpdateTaskInput,
} from '../../domain'
import {
  AIProviderResolverProvider,
  MemberManagementRepositoryProvider,
  ProjectRepositoryProvider,
  SettingsRepositoryProvider,
  SubtaskRepositoryProvider,
  TagManagementRepositoryProvider,
  TaskRepositoryProvider,
} from '../index'
import type { AIProviderResolver } from './ai-provider-resolver'
import { useAIProjectSummary } from './project-summary-hooks'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Project Atlas',
  description: 'Build the summary slice.',
  objective: 'Ship the AI summary.',
  inScopeContent: 'Project detail and AI insights.',
  outOfScopeContent: 'Backend services.',
  status: 'active',
  startDate: '2026-06-01',
  dueDate: '2026-06-30',
  memberIds: ['member-1'],
  taskIds: ['task-1'],
  ...overrides,
})

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Audit current workflow',
  description: 'Review current project detail surfaces.',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  status: 'todo',
  startDate: null,
  dueDate: '2026-06-12',
  assigneeMemberId: 'member-1',
  tagIds: ['tag-1'],
  checklist: [],
  subtaskIds: [],
  ...overrides,
})

const createSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  id: 'subtask-1',
  taskId: 'task-1',
  title: 'Draft outline',
  description: 'Write the first pass.',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  status: 'todo',
  startDate: null,
  dueDate: null,
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
  ...overrides,
})

const createTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  name: 'Planning',
  color: '#4f46e5',
  ...overrides,
})

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  name: 'Alex Doe',
  email: 'alex@example.com',
  role: 'Engineer',
  avatar: '',
  ...overrides,
})

const createProjectRepository = (state: { projects: Project[] }): ProjectRepository => ({
  list: async () => state.projects,
  getById: async (id) => state.projects.find((project) => project.id === id) ?? null,
  create: async (input: CreateProjectInput) => ({
    ...createProject(),
    ...input,
    id: `project-${state.projects.length + 1}`,
    memberIds: input.memberIds ?? [],
    taskIds: input.taskIds ?? [],
  }),
  update: async (id: string, input: UpdateProjectInput) => ({ ...createProject({ id }), ...input }),
  delete: async () => undefined,
  assignMember: async () => createProject(),
  unassignMember: async () => createProject(),
  setMemberIds: async () => createProject(),
})

const createTaskRepository = (state: { tasks: Task[] }): TaskRepository => ({
  list: async () => state.tasks,
  listByProjectId: async (projectId) => state.tasks.filter((task) => task.projectId === projectId),
  getById: async (id) => state.tasks.find((task) => task.id === id) ?? null,
  create: async (input: CreateTaskInput) => ({ ...createTask(), ...input, id: `task-${state.tasks.length + 1}` }),
  update: async (id: string, input: UpdateTaskInput) => ({ ...createTask({ id }), ...input }),
  delete: async () => undefined,
  setStatus: async () => createTask(),
  assignMember: async () => createTask(),
  setTagIds: async () => createTask(),
  setChecklist: async () => createTask(),
  setSubtaskIds: async () => createTask(),
})

const createSubtaskRepository = (state: { subtasks: Subtask[] }): SubtaskRepository => ({
  list: async () => state.subtasks,
  listByTaskId: async (taskId) => state.subtasks.filter((subtask) => subtask.taskId === taskId),
  getById: async (id) => state.subtasks.find((subtask) => subtask.id === id) ?? null,
  create: async (input: CreateSubtaskInput) => ({ ...createSubtask(), ...input, id: `subtask-${state.subtasks.length + 1}` }),
  update: async (id: string, input: UpdateSubtaskInput) => ({ ...createSubtask({ id }), ...input }),
  delete: async () => undefined,
  setStatus: async () => createSubtask(),
  assignMember: async () => createSubtask(),
  setTagIds: async () => createSubtask(),
  setChecklist: async () => createSubtask(),
})

const createTagRepository = (state: { tags: Tag[] }): TagRepository => ({
  list: async () => state.tags,
  getById: async (id) => state.tags.find((tag) => tag.id === id) ?? null,
  create: async (input: CreateTagInput) => ({ ...createTag(), ...input, id: `tag-${state.tags.length + 1}` }),
  update: async (id: string, input: UpdateTagInput) => ({ ...createTag({ id }), ...input }),
  delete: async () => undefined,
})

const createMemberRepository = (state: { members: Member[] }): MemberRepository => ({
  list: async () => state.members,
  getById: async (id) => state.members.find((member) => member.id === id) ?? null,
  create: async (input: CreateMemberInput) => ({ ...createMember(), ...input, id: `member-${state.members.length + 1}` }),
  update: async (id: string, input: UpdateMemberInput) => ({ ...createMember({ id }), ...input }),
  delete: async () => undefined,
})

const createSettingsRepository = (settings: AppSettings): SettingsRepository => ({
  get: async () => settings,
  save: async (nextSettings) => nextSettings,
  reset: async () => settings,
})

const createWrapper = (settings: AppSettings, providerResolver: AIProviderResolver) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const state = {
    projects: [createProject()],
    tasks: [createTask()],
    subtasks: [createSubtask()],
    tags: [createTag()],
    members: [createMember()],
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AIProviderResolverProvider resolver={providerResolver}>
        <ProjectRepositoryProvider repository={createProjectRepository(state)}>
          <TaskRepositoryProvider repository={createTaskRepository(state)}>
            <SubtaskRepositoryProvider repository={createSubtaskRepository(state)}>
              <SettingsRepositoryProvider repository={createSettingsRepository(settings)}>
                <MemberManagementRepositoryProvider
                  repositories={{
                    members: createMemberRepository(state),
                    projects: createProjectRepository(state),
                    subtasks: createSubtaskRepository(state),
                    tasks: createTaskRepository(state),
                  }}
                >
                  <TagManagementRepositoryProvider
                    repositories={{
                      subtasks: createSubtaskRepository(state),
                      tags: createTagRepository(state),
                      tasks: createTaskRepository(state),
                    }}
                  >
                    {children}
                  </TagManagementRepositoryProvider>
                </MemberManagementRepositoryProvider>
              </SettingsRepositoryProvider>
            </SubtaskRepositoryProvider>
          </TaskRepositoryProvider>
        </ProjectRepositoryProvider>
      </AIProviderResolverProvider>
    </QueryClientProvider>
  )

  return {
    state,
    wrapper: Wrapper,
  }
}

describe('useAIProjectSummary', () => {
  it('reports not-configured state from saved settings', async () => {
    const { wrapper } = createWrapper(
      {
        theme: 'light',
        aiProvider: {
          provider: 'groq',
          apiKey: null,
          selectedModelId: null,
        },
      },
      {
        mode: 'live',
        resolve: () => {
          throw new Error('provider should not be resolved')
        },
      },
    )

    const result = renderHook(() => useAIProjectSummary('project-1'), { wrapper })

    await waitFor(() =>
      expect(result.result.current.configurationState).toEqual({
        isConfigured: false,
        message: 'Add a Groq API key in Settings before generating an AI project summary.',
        actionLabel: 'Configure AI',
      }),
    )
  })

  it('generates a read-only project summary without mutating business data', async () => {
    const summarizeProject = vi.fn(async () => ({
      summary: 'The project is on track.',
      health: 'on_track' as const,
      risks: [],
      blockers: [],
      nextSteps: ['Keep the current pace.'],
      notableCompletedWork: ['Finished the initial setup.'],
    }))
    const provider: AIProvider = {
      listModels: async () => [],
      testConnection: async () => ({ connected: true, message: 'ok' }),
      generateProjectPlan: async () => ({ taskSuggestions: [] }),
      generateSubtasks: async () => ({ subtaskSuggestions: [] }),
      suggestPriority: async () => ({ suggestedPriority: 'medium', rationale: 'ok' }),
      summarizeProject,
    }
    const resolver: AIProviderResolver = {
      mode: 'live',
      resolve: () => ({
        isConfigured: true,
        provider,
        providerId: 'groq',
        selectedModelId: 'llama-3.3-70b-versatile',
      }),
    }
    const { state, wrapper } = createWrapper(
      {
        theme: 'light',
        aiProvider: {
          provider: 'groq',
          apiKey: 'secret-key',
          selectedModelId: 'llama-3.3-70b-versatile',
        },
      },
      resolver,
    )
    const result = renderHook(() => useAIProjectSummary('project-1'), { wrapper })

    await waitFor(() => expect(result.result.current.project?.id).toBe('project-1'))
    await waitFor(() => expect(result.result.current.configurationState.isConfigured).toBe(true))

    const beforeTasks = JSON.stringify(state.tasks)
    const beforeProjects = JSON.stringify(state.projects)

    await act(async () => {
      await result.result.current.generate('   Summarize this for a weekly stakeholder update.   ')
    })

    expect(result.result.current.currentSummary).toEqual({
      summary: 'The project is on track.',
      health: 'on_track',
      risks: [],
      blockers: [],
      nextSteps: ['Keep the current pace.'],
      notableCompletedWork: ['Finished the initial setup.'],
    })
    expect(JSON.stringify(state.tasks)).toBe(beforeTasks)
    expect(JSON.stringify(state.projects)).toBe(beforeProjects)
    expect(summarizeProject).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalInstructions: 'Summarize this for a weekly stakeholder update.',
      }),
    )

    act(() => {
      result.result.current.clearSummary()
    })

    expect(result.result.current.currentSummary).toBeNull()
    expect(result.result.current.generationError).toBeNull()
  })

  it('reports validation errors when instructions exceed the bounded limit', async () => {
    const provider: AIProvider = {
      listModels: async () => [],
      testConnection: async () => ({ connected: true, message: 'ok' }),
      generateProjectPlan: async () => ({ taskSuggestions: [] }),
      generateSubtasks: async () => ({ subtaskSuggestions: [] }),
      suggestPriority: async () => ({ suggestedPriority: 'medium', rationale: 'ok' }),
      summarizeProject: async () => ({
        summary: '',
        health: 'on_track',
        risks: [],
        blockers: [],
        nextSteps: [],
        notableCompletedWork: [],
      }),
    }
    const resolver: AIProviderResolver = {
      mode: 'live',
      resolve: () => ({
        isConfigured: true,
        provider,
        providerId: 'groq',
        selectedModelId: 'llama-3.3-70b-versatile',
      }),
    }
    const { wrapper } = createWrapper(
      {
        theme: 'light',
        aiProvider: {
          provider: 'groq',
          apiKey: 'secret-key',
          selectedModelId: 'llama-3.3-70b-versatile',
        },
      },
      resolver,
    )
    const result = renderHook(() => useAIProjectSummary('project-1'), { wrapper })

    await waitFor(() => expect(result.result.current.project?.id).toBe('project-1'))
    await waitFor(() => expect(result.result.current.configurationState.isConfigured).toBe(true))

    await act(async () => {
      await expect(result.result.current.generate('A'.repeat(1001))).rejects.toThrow(
        'Additional instructions must be 1000 characters or fewer.',
      )
    })

    await waitFor(() => expect(result.result.current.generationError?.kind).toBe('validation'))
  })
})
