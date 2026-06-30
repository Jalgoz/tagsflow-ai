import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type {
  AIConnectionTestResult,
  AIModelInfo,
  AIProvider,
  AppSettings,
  CreateMemberInput,
  CreateProjectInput,
  CreateSubtaskInput,
  CreateTagInput,
  CreateTaskInput,
  Member,
  MemberRepository,
  Project,
  ProjectRepository,
  ProjectPlanResult,
  ProjectSummaryResult,
  SettingsRepository,
  Subtask,
  SubtaskGenerationResult,
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
} from '../../application'
import { projectQueryKeys } from '../projects'
import { taskQueryKeys } from '../tasks'
import { useAIProjectPlanner } from './project-planner-hooks'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Project Atlas',
  description: 'Build the planner slice.',
  objective: 'Ship the AI planner.',
  inScopeContent: 'Project detail and tasks.',
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
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
  subtaskIds: [],
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

const createSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
  theme: 'light',
  aiProvider: {
    provider: 'groq',
    apiKey: 'secret-key',
    selectedModelId: 'mock-model-v1',
  },
  ...overrides,
})

type TestState = {
  members: Member[]
  projects: Project[]
  settings: AppSettings
  subtasks: Subtask[]
  tags: Tag[]
  tasks: Task[]
}

const createSettingsRepository = (state: TestState): SettingsRepository => ({
  get: async () => state.settings,
  save: async (settings) => {
    state.settings = settings
    return settings
  },
  reset: async () => {
    state.settings = createSettings()
    return state.settings
  },
})

const createProjectRepository = (state: TestState): ProjectRepository => ({
  list: async () => state.projects,
  getById: async (id) => state.projects.find((project) => project.id === id) ?? null,
  create: async (input: CreateProjectInput) => {
    const project = createProject({
      ...input,
      id: `project-${state.projects.length + 1}`,
      memberIds: input.memberIds ?? [],
      taskIds: input.taskIds ?? [],
    })
    state.projects.push(project)
    return project
  },
  update: async (id: string, input: UpdateProjectInput) => {
    const project = state.projects.find((currentProject) => currentProject.id === id)

    if (project === undefined) {
      throw new Error(`Project ${id} not found.`)
    }

    const updatedProject = { ...project, ...input }
    state.projects = state.projects.map((currentProject) => (currentProject.id === id ? updatedProject : currentProject))
    return updatedProject
  },
  delete: async (id: string) => {
    state.projects = state.projects.filter((project) => project.id !== id)
  },
  assignMember: async (projectId: string, memberId: string) => {
    const project = state.projects.find((currentProject) => currentProject.id === projectId)

    if (project === undefined) {
      throw new Error(`Project ${projectId} not found.`)
    }

    const updatedProject = {
      ...project,
      memberIds: [...project.memberIds, memberId],
    }
    state.projects = state.projects.map((currentProject) => (currentProject.id === projectId ? updatedProject : currentProject))
    return updatedProject
  },
  unassignMember: async (projectId: string, memberId: string) => {
    const project = state.projects.find((currentProject) => currentProject.id === projectId)

    if (project === undefined) {
      throw new Error(`Project ${projectId} not found.`)
    }

    const updatedProject = {
      ...project,
      memberIds: project.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
    }
    state.projects = state.projects.map((currentProject) => (currentProject.id === projectId ? updatedProject : currentProject))
    return updatedProject
  },
  setMemberIds: async (projectId: string, memberIds: string[]) => {
    const project = state.projects.find((currentProject) => currentProject.id === projectId)

    if (project === undefined) {
      throw new Error(`Project ${projectId} not found.`)
    }

    const updatedProject = {
      ...project,
      memberIds,
    }
    state.projects = state.projects.map((currentProject) => (currentProject.id === projectId ? updatedProject : currentProject))
    return updatedProject
  },
})

const createTaskRepository = (state: TestState): TaskRepository => ({
  list: async () => state.tasks,
  listByProjectId: async (projectId) => state.tasks.filter((task) => task.projectId === projectId),
  getById: async (id) => state.tasks.find((task) => task.id === id) ?? null,
  create: async (input: CreateTaskInput) => {
    const createdTask = createTask({
      ...input,
      id: `task-${state.tasks.length + 1}`,
      assigneeMemberId: input.assigneeMemberId ?? null,
      checklist: input.checklist ?? [],
      subtaskIds: input.subtaskIds ?? [],
      tagIds: input.tagIds ?? [],
    })
    state.tasks.push(createdTask)
    state.projects = state.projects.map((project) =>
      project.id === input.projectId ? { ...project, taskIds: [...project.taskIds, createdTask.id] } : project,
    )
    return createdTask
  },
  update: async (id: string, input: UpdateTaskInput) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task ${id} not found.`)
    }

    const updatedTask = { ...task, ...input }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  delete: async (id: string) => {
    state.tasks = state.tasks.filter((task) => task.id !== id)
  },
  setStatus: async (id: string, status) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task ${id} not found.`)
    }

    const updatedTask = { ...task, status }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  assignMember: async (id: string, memberId: string | null) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task ${id} not found.`)
    }

    const updatedTask = { ...task, assigneeMemberId: memberId }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  setTagIds: async (id: string, tagIds: string[]) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task ${id} not found.`)
    }

    const updatedTask = { ...task, tagIds }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  setChecklist: async (id: string, checklist) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task ${id} not found.`)
    }

    const updatedTask = { ...task, checklist }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  setSubtaskIds: async (id: string, subtaskIds) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task ${id} not found.`)
    }

    const updatedTask = { ...task, subtaskIds }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
})

const createMemberRepository = (state: TestState): MemberRepository => ({
  list: async () => state.members,
  getById: async (id) => state.members.find((member) => member.id === id) ?? null,
  create: async (input: CreateMemberInput) => {
    const member = createMember({ ...input, id: `member-${state.members.length + 1}` })
    state.members.push(member)
    return member
  },
  update: async (id: string, input: UpdateMemberInput) => {
    const member = state.members.find((currentMember) => currentMember.id === id)

    if (member === undefined) {
      throw new Error(`Member ${id} not found.`)
    }

    const updatedMember = { ...member, ...input }
    state.members = state.members.map((currentMember) => (currentMember.id === id ? updatedMember : currentMember))
    return updatedMember
  },
  delete: async (id: string) => {
    state.members = state.members.filter((member) => member.id !== id)
  },
})

const createTagRepository = (state: TestState): TagRepository => ({
  list: async () => state.tags,
  getById: async (id) => state.tags.find((tag) => tag.id === id) ?? null,
  create: async (input: CreateTagInput) => {
    const tag = createTag({ ...input, id: `tag-${state.tags.length + 1}` })
    state.tags.push(tag)
    return tag
  },
  update: async (id: string, input: UpdateTagInput) => {
    const tag = state.tags.find((currentTag) => currentTag.id === id)

    if (tag === undefined) {
      throw new Error(`Tag ${id} not found.`)
    }

    const updatedTag = { ...tag, ...input }
    state.tags = state.tags.map((currentTag) => (currentTag.id === id ? updatedTag : currentTag))
    return updatedTag
  },
  delete: async (id: string) => {
    state.tags = state.tags.filter((tag) => tag.id !== id)
  },
})

const createSubtaskRepository = (state: TestState): SubtaskRepository => ({
  list: async () => state.subtasks,
  listByTaskId: async (taskId) => state.subtasks.filter((subtask) => subtask.taskId === taskId),
  getById: async (id) => state.subtasks.find((subtask) => subtask.id === id) ?? null,
  create: async (input: CreateSubtaskInput) => {
    const subtask: Subtask = {
      id: `subtask-${state.subtasks.length + 1}`,
      taskId: input.taskId,
      title: input.title,
      description: input.description,
      inScopeContent: input.inScopeContent,
      outOfScopeContent: input.outOfScopeContent,
      priority: input.priority,
      status: input.status,
      startDate: input.startDate,
      dueDate: input.dueDate,
      assigneeMemberId: input.assigneeMemberId ?? null,
      tagIds: input.tagIds ?? [],
      checklist: input.checklist ?? [],
    }
    state.subtasks.push(subtask)
    return subtask
  },
  update: async (id: string, input: UpdateSubtaskInput) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask ${id} not found.`)
    }

    const updatedSubtask = { ...subtask, ...input }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
  delete: async (id: string) => {
    state.subtasks = state.subtasks.filter((subtask) => subtask.id !== id)
  },
  setStatus: async (id, status) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask ${id} not found.`)
    }

    const updatedSubtask = { ...subtask, status }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
  assignMember: async (id, memberId) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask ${id} not found.`)
    }

    const updatedSubtask = { ...subtask, assigneeMemberId: memberId }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
  setTagIds: async (id, tagIds) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask ${id} not found.`)
    }

    const updatedSubtask = { ...subtask, tagIds }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
  setChecklist: async (id, checklist) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask ${id} not found.`)
    }

    const updatedSubtask = { ...subtask, checklist }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
})

const createMockAIProvider = (result: ProjectPlanResult): AIProvider => ({
  listModels: async (): Promise<AIModelInfo[]> => [
    {
      id: 'mock-model-v1',
      name: 'Mock Model',
      provider: 'mock',
    },
  ],
  testConnection: async (): Promise<AIConnectionTestResult> => ({
    connected: true,
    message: 'Connected.',
  }),
  generateProjectPlan: async (): Promise<ProjectPlanResult> => result,
  generateSubtasks: async (): Promise<SubtaskGenerationResult> => ({
    subtaskSuggestions: [],
  }),
  suggestPriority: async () => ({
    suggestedPriority: 'medium' as const,
    rationale: 'Mock',
  }),
  summarizeProject: async (): Promise<ProjectSummaryResult> => ({
    summary: 'Mock summary',
    risks: [],
    nextSteps: [],
  }),
})

const createWrapper = ({
  provider,
  settings = createSettings(),
}: {
  provider: AIProvider
  settings?: AppSettings
}) => {
  const state: TestState = {
    projects: [createProject()],
    tasks: [createTask()],
    tags: [createTag(), createTag({ id: 'tag-2', name: 'Frontend' })],
    members: [createMember()],
    subtasks: [],
    settings,
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const repositories = {
    settings: createSettingsRepository(state),
    projects: createProjectRepository(state),
    tasks: createTaskRepository(state),
    members: createMemberRepository(state),
    tags: createTagRepository(state),
    subtasks: createSubtaskRepository(state),
  }

  const resolver = {
    mode: 'live' as const,
    resolve: () => ({
      isConfigured: true as const,
      provider,
      providerId: 'groq' as const,
      selectedModelId: 'mock-model-v1',
    }),
  }

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <AIProviderResolverProvider resolver={resolver}>
        <ProjectRepositoryProvider repository={repositories.projects}>
          <TaskRepositoryProvider repository={repositories.tasks}>
            <SubtaskRepositoryProvider repository={repositories.subtasks}>
              <SettingsRepositoryProvider repository={repositories.settings}>
                <MemberManagementRepositoryProvider
                  repositories={{
                    members: repositories.members,
                    projects: repositories.projects,
                    tasks: repositories.tasks,
                    subtasks: repositories.subtasks,
                  }}
                >
                  <TagManagementRepositoryProvider
                    repositories={{
                      tags: repositories.tags,
                      tasks: repositories.tasks,
                      subtasks: repositories.subtasks,
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
    repositories,
    state,
    wrapper: Wrapper,
  }
}

describe('useAIProjectPlanner', () => {
  it('blocks generation when AI is not configured', async () => {
    const { wrapper } = createWrapper({
      provider: createMockAIProvider({
        taskSuggestions: [],
      }),
      settings: createSettings({
        aiProvider: {
          provider: 'groq',
          apiKey: null,
          selectedModelId: null,
        },
      }),
    })

    const { result } = renderHook(() => useAIProjectPlanner('project-1'), { wrapper })

    await waitFor(() =>
      expect(result.current.configurationState).toEqual({
        isConfigured: false,
        message: 'Add a Groq API key in Settings before generating an AI project plan.',
        actionLabel: 'Configure AI',
      }),
    )
    expect(result.current.configurationState).toEqual({
      isConfigured: false,
      message: 'Add a Groq API key in Settings before generating an AI project plan.',
      actionLabel: 'Configure AI',
    })
    expect(result.current.drafts).toEqual([])
  })

  it('generates planner drafts successfully and does not insert before confirmation', async () => {
    const provider = createMockAIProvider({
      taskSuggestions: [
        {
          title: 'Plan milestones',
          description: 'Break the project into milestones.',
          priority: 'high',
          status: 'todo',
          dueDate: '2026-07-01',
          existingTagNames: ['Planning'],
        },
      ],
    })
    const { state, wrapper } = createWrapper({ provider })
    const { result } = renderHook(() => useAIProjectPlanner('project-1'), { wrapper })

    await waitFor(() => expect(result.current.project?.id).toBe('project-1'))
    await act(async () => {
      await result.current.generate()
    })

    await waitFor(() => expect(result.current.drafts).toHaveLength(1))
    expect(result.current.drafts[0]).toMatchObject({
      title: 'Plan milestones',
      tagIds: ['tag-1'],
      isInserted: false,
      isSelected: true,
    })
    expect(state.tasks).toHaveLength(1)
  })

  it('generates planner drafts passing instructions to the provider', async () => {
    const provider = createMockAIProvider({
      taskSuggestions: [
        {
          title: 'Plan milestones',
          description: 'Break the project into milestones.',
          priority: 'high',
          status: 'todo',
          dueDate: '2026-07-01',
          existingTagNames: ['Planning'],
        },
      ],
    })
    
    vi.spyOn(provider, 'generateProjectPlan')
    
    const { wrapper } = createWrapper({ provider })
    const { result } = renderHook(() => useAIProjectPlanner('project-1'), { wrapper })

    await waitFor(() => expect(result.current.project?.id).toBe('project-1'))
    await act(async () => {
      await result.current.generate('Test instructions')
    })

    expect(provider.generateProjectPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalInstructions: 'Test instructions'
      })
    )
  })

  it('maps provider failures into safe visible generation errors', async () => {
    const { wrapper } = createWrapper({
      provider: {
        ...createMockAIProvider({
          taskSuggestions: [],
        }),
        generateProjectPlan: async () => {
          const error = new Error('Provider rejected the request.')
          ;(error as Error & { code?: string }).code = 'provider_error'
          throw error
        },
      },
    })
    const { result } = renderHook(() => useAIProjectPlanner('project-1'), { wrapper })

    await waitFor(() => expect(result.current.project?.id).toBe('project-1'))
    await act(async () => {
      await result.current.generate().catch(() => undefined)
    })

    await waitFor(() =>
      expect(result.current.generationError).toEqual({
        kind: 'provider',
        message: 'Provider rejected the request.',
      }),
    )
    expect(result.current.drafts).toEqual([])
  })

  it('inserts only selected proposals and reuses task invalidation paths', async () => {
    const invalidateSpy = vi.fn()
    const provider = createMockAIProvider({
      taskSuggestions: [
        {
          title: 'Plan milestones',
          description: 'Break the project into milestones.',
          priority: 'high',
          status: 'todo',
          dueDate: '2026-07-01',
          existingTagNames: ['Planning'],
        },
        {
          title: 'Launch review checklist',
          description: 'Create the launch review ceremony.',
          priority: 'medium',
          status: 'review',
          dueDate: '2026-07-03',
          existingTagNames: ['Frontend'],
        },
      ],
    })
    const { queryClient, repositories, state, wrapper } = createWrapper({ provider })
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async (...args) => {
      invalidateSpy(...args)
      return Promise.resolve()
    })

    const { result } = renderHook(() => useAIProjectPlanner('project-1'), { wrapper })

    await waitFor(() => expect(result.current.project?.id).toBe('project-1'))
    await act(async () => {
      await result.current.generate()
    })

    await waitFor(() => expect(result.current.drafts).toHaveLength(2))

    act(() => {
      result.current.toggleDraftSelection(result.current.drafts[1]!.id)
    })

    await act(async () => {
      const insertResult = await result.current.insertSelected()
      expect(insertResult).toEqual({
        status: 'completed',
        successCount: 1,
        failureCount: 0,
        failedDraftTitles: [],
      })
    })

    expect(state.tasks).toHaveLength(2)
    expect(state.tasks[1]).toMatchObject({
      title: 'Plan milestones',
      projectId: 'project-1',
      tagIds: ['tag-1'],
    })
    expect(state.tasks.some((task) => task.title === 'Launch review checklist')).toBe(false)
    expect(await repositories.projects.getById('project-1')).toMatchObject({
      taskIds: ['task-1', 'task-2'],
    })
    expect(result.current.drafts[0]).toMatchObject({
      isInserted: true,
      isSelected: false,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskQueryKeys.list() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskQueryKeys.projectList('project-1') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectQueryKeys.detail('project-1') })
  })
})
