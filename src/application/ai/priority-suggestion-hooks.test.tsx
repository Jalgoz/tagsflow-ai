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
import { useAIPrioritySuggestion, type PrioritySuggestionApplyResult } from './priority-suggestion-hooks'
import { createAIProviderResolver } from './ai-provider-resolver'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Project Atlas',
  description: 'Build the project module.',
  objective: 'Ship the MVP',
  inScopeContent: 'Frontend implementation',
  outOfScopeContent: 'Backend work',
  status: 'active',
  startDate: null,
  dueDate: null,
  memberIds: [],
  taskIds: [],
  ...overrides,
})

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Audit current workflow',
  description: 'Review current project detail surfaces.',
  inScopeContent: 'Selected scope',
  outOfScopeContent: 'Outside scope',
  priority: 'medium',
  status: 'todo',
  startDate: null,
  dueDate: null,
  assigneeMemberId: null,
  tagIds: [],
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
  update: async (id: string, input: UpdateProjectInput) => ({
    ...createProject({ id }),
    ...input,
  }),
  delete: async () => undefined,
  assignMember: async () => createProject(),
  unassignMember: async () => createProject(),
  setMemberIds: async () => createProject(),
})

const createTaskRepository = (state: { tasks: Task[] }): TaskRepository => {
  const updateTask = (id: string, input: UpdateTaskInput): Task => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, ...input }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  }

  return {
    list: async () => state.tasks,
    listByProjectId: async (projectId) => state.tasks.filter((task) => task.projectId === projectId),
    getById: async (id) => state.tasks.find((task) => task.id === id) ?? null,
    create: async (input: CreateTaskInput) => {
      const task = createTask({ ...input, id: `task-${state.tasks.length + 1}` })
      state.tasks.push(task)
      return task
    },
    update: async (id, input) => updateTask(id, input),
    delete: async () => undefined,
    setStatus: async (id, status) => updateTask(id, { status }),
    assignMember: async (id, memberId) => updateTask(id, { assigneeMemberId: memberId }),
    setTagIds: async (id, tagIds) => updateTask(id, { tagIds }),
    setChecklist: async (id, checklist) => updateTask(id, { checklist }),
    setSubtaskIds: async (id, subtaskIds) => updateTask(id, { subtaskIds }),
  }
}

const createSubtaskRepository = (state: { subtasks: Subtask[] }): SubtaskRepository => ({
  list: async () => state.subtasks,
  listByTaskId: async (taskId) => state.subtasks.filter((subtask) => subtask.taskId === taskId),
  getById: async (id) => state.subtasks.find((subtask) => subtask.id === id) ?? null,
  create: async (input: CreateSubtaskInput) => ({
    ...createSubtask(),
    ...input,
    id: `subtask-${state.subtasks.length + 1}`,
  }),
  update: async (id, input: UpdateSubtaskInput) => ({
    ...createSubtask({ id }),
    ...input,
  }),
  delete: async () => undefined,
  setStatus: async () => createSubtask(),
  assignMember: async () => createSubtask(),
  setTagIds: async () => createSubtask(),
  setChecklist: async () => createSubtask(),
})

const createTagRepository = (state: { tags: Tag[] }): TagRepository => ({
  list: async () => state.tags,
  getById: async (id) => state.tags.find((tag) => tag.id === id) ?? null,
  create: async (input: CreateTagInput) => ({
    ...createTag(),
    ...input,
    id: `tag-${state.tags.length + 1}`,
  }),
  update: async (id: string, input: UpdateTagInput) => ({
    ...createTag({ id }),
    ...input,
  }),
  delete: async () => undefined,
})

const createMemberRepository = (state: { members: Member[] }): MemberRepository => ({
  list: async () => state.members,
  getById: async (id) => state.members.find((member) => member.id === id) ?? null,
  create: async (input: CreateMemberInput) => ({
    ...createMember(),
    ...input,
    id: `member-${state.members.length + 1}`,
  }),
  update: async (id: string, input: UpdateMemberInput) => ({
    ...createMember({ id }),
    ...input,
  }),
  delete: async () => undefined,
})

const createSettingsRepository = (settings: AppSettings): SettingsRepository => ({
  get: async () => settings,
  save: async (nextSettings) => nextSettings,
  reset: async () => settings,
})

const createWrapper = (settings: AppSettings, providerResolver = createAIProviderResolver({ mode: 'mock' })) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const state = {
    projects: [createProject({ taskIds: ['task-1'] })],
    tasks: [createTask()],
    subtasks: [createSubtask()],
    tags: [createTag(), createTag({ id: 'tag-2', name: 'Frontend' })],
    members: [createMember()],
  }
  const projectRepository = createProjectRepository(state)
  const taskRepository = createTaskRepository(state)
  const subtaskRepository = createSubtaskRepository(state)
  const memberRepository = createMemberRepository(state)
  const tagRepository = createTagRepository(state)
  const settingsRepository = createSettingsRepository(settings)

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AIProviderResolverProvider resolver={providerResolver}>
        <ProjectRepositoryProvider repository={projectRepository}>
          <TaskRepositoryProvider repository={taskRepository}>
            <SubtaskRepositoryProvider repository={subtaskRepository}>
              <SettingsRepositoryProvider repository={settingsRepository}>
                <MemberManagementRepositoryProvider
                  repositories={{
                    members: memberRepository,
                    projects: projectRepository,
                    subtasks: subtaskRepository,
                    tasks: taskRepository,
                  }}
                >
                  <TagManagementRepositoryProvider
                    repositories={{
                      subtasks: subtaskRepository,
                      tags: tagRepository,
                      tasks: taskRepository,
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
    queryClient,
    state,
    wrapper: Wrapper,
  }
}

describe('useAIPrioritySuggestion', () => {
  it('reports not-configured state from saved settings', async () => {
    const { wrapper } = createWrapper({
      theme: 'light',
      aiProvider: {
        provider: 'groq',
        apiKey: null,
        selectedModelId: null,
      },
    })

    const result = renderHook(() => useAIPrioritySuggestion('project-1', 'task-1'), { wrapper })

    await waitFor(() =>
      expect(result.result.current.configurationState).toEqual({
        isConfigured: false,
        message: 'Add a Groq API key in Settings before generating AI priority suggestions.',
        actionLabel: 'Configure AI',
      }),
    )
  })

  it('generates a reviewable suggestion before mutation and invalidates task queries after apply', async () => {
    const provider: AIProvider = {
      listModels: async () => [],
      testConnection: async () => ({ connected: true, message: 'ok' }),
      generateProjectPlan: async () => ({ taskSuggestions: [] }),
      generateSubtasks: async () => ({ subtaskSuggestions: [] }),
      suggestPriority: async () => ({
        suggestedPriority: 'high' as const,
        rationale: 'The task is time-sensitive.',
      }),
      summarizeProject: async () => ({ summary: '', risks: [], nextSteps: [] }),
    }
    const resolver: AIProviderResolver = {
      mode: 'live' as const,
      resolve: () => ({
        isConfigured: true,
        provider,
        providerId: 'groq' as const,
        selectedModelId: 'llama-3.3-70b-versatile',
      }),
    }
    const { queryClient, state, wrapper } = createWrapper(
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
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const result = renderHook(() => useAIPrioritySuggestion('project-1', 'task-1'), { wrapper })

    await waitFor(() => expect(result.result.current.project?.id).toBe('project-1'))
    await waitFor(() => expect(result.result.current.task?.id).toBe('task-1'))
    await waitFor(() => expect(result.result.current.configurationState.isConfigured).toBe(true))

    await act(async () => {
      await result.result.current.generate('   Prioritize release blockers first.   ')
    })

    expect(result.result.current.currentSuggestion).toEqual(
      expect.objectContaining({
        suggestedPriority: 'high',
      }),
    )
    expect(state.tasks[0]?.priority).toBe('medium')

    let applyResult: PrioritySuggestionApplyResult | undefined

    await act(async () => {
      applyResult = await result.result.current.applySuggestion()
    })

    expect(applyResult).toEqual({
      status: 'updated',
      suggestedPriority: 'high',
    })

    await waitFor(() => expect(state.tasks[0]?.priority).toBe('high'))
    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('treats same-priority suggestions as a no-op', async () => {
    const provider: AIProvider = {
      listModels: async () => [],
      testConnection: async () => ({ connected: true, message: 'ok' }),
      generateProjectPlan: async () => ({ taskSuggestions: [] }),
      generateSubtasks: async () => ({ subtaskSuggestions: [] }),
      suggestPriority: async () => ({
        suggestedPriority: 'medium' as const,
        rationale: 'The task is already set appropriately.',
      }),
      summarizeProject: async () => ({ summary: '', risks: [], nextSteps: [] }),
    }
    const resolver: AIProviderResolver = {
      mode: 'live' as const,
      resolve: () => ({
        isConfigured: true,
        provider,
        providerId: 'groq' as const,
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
    const result = renderHook(() => useAIPrioritySuggestion('project-1', 'task-1'), { wrapper })

    await waitFor(() => expect(result.result.current.project?.id).toBe('project-1'))
    await waitFor(() => expect(result.result.current.task?.id).toBe('task-1'))
    await waitFor(() => expect(result.result.current.configurationState.isConfigured).toBe(true))

    await act(async () => {
      await result.result.current.generate()
    })

    let applyResult: PrioritySuggestionApplyResult | undefined

    await act(async () => {
      applyResult = await result.result.current.applySuggestion()
    })

    expect(applyResult).toEqual({
      status: 'same_priority',
      suggestedPriority: 'medium',
    })
    expect(state.tasks[0]?.priority).toBe('medium')
  })

  it('reports validation errors when instructions exceed the bounded limit', async () => {
    const { wrapper } = createWrapper({
      theme: 'light',
      aiProvider: {
        provider: 'groq',
        apiKey: 'secret-key',
        selectedModelId: 'llama-3.3-70b-versatile',
      },
    })
    const result = renderHook(() => useAIPrioritySuggestion('project-1', 'task-1'), { wrapper })

    await waitFor(() => expect(result.result.current.project?.id).toBe('project-1'))
    await waitFor(() => expect(result.result.current.task?.id).toBe('task-1'))
    await waitFor(() => expect(result.result.current.configurationState.isConfigured).toBe(true))

    await expect(result.result.current.generate('A'.repeat(801))).rejects.toThrow(
      'Additional instructions must be 800 characters or fewer.',
    )

    await waitFor(() => expect(result.result.current.generationError?.kind).toBe('validation'))
  })
})
