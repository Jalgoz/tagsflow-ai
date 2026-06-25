import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  AppSettings,
  ChecklistItem,
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
  createAIProviderResolver,
} from '../../application'
import { ToastProvider } from '../feedback'
import { ProjectDetailPage } from './ProjectDetailPage'

afterEach(() => {
  cleanup()
})

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

const createProjectRepository = (state: TestState): ProjectRepository => {
  const updateProjectState = (projectId: string, updater: (project: Project) => Project): Project => {
    const currentProject = state.projects.find((project) => project.id === projectId)

    if (currentProject === undefined) {
      throw new Error(`Project with ID "${projectId}" was not found.`)
    }

    const updatedProject = updater(currentProject)
    state.projects = state.projects.map((project) => (project.id === projectId ? updatedProject : project))

    return updatedProject
  }

  return {
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
    update: async (id: string, input: UpdateProjectInput) => updateProjectState(id, (project) => ({ ...project, ...input })),
    delete: async (id: string) => {
      state.projects = state.projects.filter((project) => project.id !== id)
    },
    assignMember: async (projectId: string, memberId: string) =>
      updateProjectState(projectId, (project) => ({
        ...project,
        memberIds: [...project.memberIds, memberId],
      })),
    unassignMember: async (projectId: string, memberId: string) =>
      updateProjectState(projectId, (project) => ({
        ...project,
        memberIds: project.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
      })),
    setMemberIds: async (projectId: string, memberIds: string[]) =>
      updateProjectState(projectId, (project) => ({
        ...project,
        memberIds,
      })),
  }
}

const createTaskRepository = (state: TestState): TaskRepository => ({
  list: async () => state.tasks,
  listByProjectId: async (projectId) => state.tasks.filter((task) => task.projectId === projectId),
  getById: async (id) => state.tasks.find((task) => task.id === id) ?? null,
  create: async (input: CreateTaskInput) => {
    const task = createTask({
      ...input,
      id: `task-${state.tasks.length + 1}`,
      assigneeMemberId: input.assigneeMemberId ?? null,
      checklist: input.checklist ?? [],
      subtaskIds: input.subtaskIds ?? [],
      tagIds: input.tagIds ?? [],
    })

    state.tasks.push(task)
    state.projects = state.projects.map((project) =>
      project.id === input.projectId ? { ...project, taskIds: [...project.taskIds, task.id] } : project,
    )
    return task
  },
  update: async (id: string, input: UpdateTaskInput) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, ...input }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  delete: async (id: string) => {
    state.tasks = state.tasks.filter((task) => task.id !== id)
  },
  setStatus: async (id, status) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, status }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  assignMember: async (id, memberId) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, assigneeMemberId: memberId }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  setTagIds: async (id, tagIds) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, tagIds }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  setChecklist: async (id, checklist: ChecklistItem[]) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, checklist }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  },
  setSubtaskIds: async (id, subtaskIds) => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, subtaskIds }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
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
      throw new Error(`Tag with ID "${id}" was not found.`)
    }

    const updatedTag = { ...tag, ...input }
    state.tags = state.tags.map((currentTag) => (currentTag.id === id ? updatedTag : currentTag))
    return updatedTag
  },
  delete: async (id: string) => {
    state.tags = state.tags.filter((tag) => tag.id !== id)
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
      throw new Error(`Member with ID "${id}" was not found.`)
    }

    const updatedMember = { ...member, ...input }
    state.members = state.members.map((currentMember) => (currentMember.id === id ? updatedMember : currentMember))
    return updatedMember
  },
  delete: async (id: string) => {
    state.members = state.members.filter((member) => member.id !== id)
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
      throw new Error(`Subtask with ID "${id}" was not found.`)
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
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    const updatedSubtask = { ...subtask, status }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
  assignMember: async (id, memberId) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    const updatedSubtask = { ...subtask, assigneeMemberId: memberId }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
  setTagIds: async (id, tagIds) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    const updatedSubtask = { ...subtask, tagIds }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
  setChecklist: async (id, checklist: ChecklistItem[]) => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    const updatedSubtask = { ...subtask, checklist }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  },
})

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

const createWrapper = ({
  initialEntries = ['/projects/project-1'],
  settings = createSettings(),
  tasks = [createTask()],
}: {
  initialEntries?: string[]
  settings?: AppSettings
  tasks?: Task[]
}) => {
  const state: TestState = {
    projects: [createProject({ taskIds: tasks.map((task) => task.id) })],
    tasks: [...tasks],
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

  const projectRepository = createProjectRepository(state)
  const taskRepository = createTaskRepository(state)
  const subtaskRepository = createSubtaskRepository(state)
  const settingsRepository = createSettingsRepository(state)
  const memberRepository = createMemberRepository(state)
  const tagRepository = createTagRepository(state)
  const resolver = createAIProviderResolver({ mode: 'mock' })

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AIProviderResolverProvider resolver={resolver}>
            <ProjectRepositoryProvider repository={projectRepository}>
              <TaskRepositoryProvider repository={taskRepository}>
                <SubtaskRepositoryProvider repository={subtaskRepository}>
                  <SettingsRepositoryProvider repository={settingsRepository}>
                    <MemberManagementRepositoryProvider
                      repositories={{
                        members: memberRepository,
                        projects: projectRepository,
                        tasks: taskRepository,
                        subtasks: subtaskRepository,
                      }}
                    >
                      <TagManagementRepositoryProvider
                        repositories={{
                          tags: tagRepository,
                          tasks: taskRepository,
                          subtasks: subtaskRepository,
                        }}
                      >
                        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
                      </TagManagementRepositoryProvider>
                    </MemberManagementRepositoryProvider>
                  </SettingsRepositoryProvider>
                </SubtaskRepositoryProvider>
              </TaskRepositoryProvider>
            </ProjectRepositoryProvider>
          </AIProviderResolverProvider>
        </ToastProvider>
      </QueryClientProvider>
    )
  }

  return {
    state,
    taskRepository,
    wrapper: Wrapper,
  }
}

describe('ProjectDetailPage', () => {
  it('keeps the edit surface and delete confirmation mutually exclusive', async () => {
    const { wrapper } = createWrapper({})

    render(
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Routes>,
      { wrapper },
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Project Atlas' })).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Edit project' }))
    expect(screen.getByRole('heading', { name: 'Edit project' })).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }))

    expect(screen.queryByRole('heading', { name: 'Edit project' })).toBeNull()
    expect(screen.getByRole('alertdialog', { name: 'Delete this project?' })).not.toBeNull()
  })

  it('shows a success toast and returns to the projects route after deletion', async () => {
    const { wrapper } = createWrapper({})

    render(
      <Routes>
        <Route path="/projects" element={<div>Projects route</div>} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Routes>,
      { wrapper },
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Project Atlas' })).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this project?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete project' }))

    await waitFor(() => expect(screen.getByText('Projects route')).not.toBeNull())
    expect(screen.getByRole('status').textContent).toContain('Project deleted.')
  })

  it('shows the AI planner not-configured state with navigation to settings', async () => {
    const { wrapper } = createWrapper({
      settings: createSettings({
        aiProvider: {
          provider: 'groq',
          apiKey: null,
          selectedModelId: null,
        },
      }),
    })

    render(
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/settings" element={<div>Settings route</div>} />
      </Routes>,
      { wrapper },
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Project Atlas' })).not.toBeNull())

    fireEvent.click(screen.getByRole('tab', { name: 'AI Insights' }))

    await waitFor(() => expect(screen.getByText('AI configuration required')).not.toBeNull())
    await waitFor(() => expect(screen.getByRole('link', { name: 'Open Settings' })).not.toBeNull())
  })

  it('generates planner proposals, allows closing review without mutations, and inserts after confirmation', async () => {
    const { state, wrapper } = createWrapper({})

    render(
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Routes>,
      { wrapper },
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Project Atlas' })).not.toBeNull())

    fireEvent.click(screen.getByRole('tab', { name: 'AI Insights' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate plan' })).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Generate plan' }))

    await waitFor(() => expect(screen.getByText('Review proposals')).not.toBeNull())
    expect(screen.getByDisplayValue('Project Atlas foundation')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Close review' }))
    expect(state.tasks).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Generate plan' }))
    await waitFor(() => expect(screen.getByText('Review proposals')).not.toBeNull())

    const proposalCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(proposalCheckboxes[1]!)

    fireEvent.click(screen.getByRole('button', { name: 'Insert selected (1)' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'Insert selected planner tasks?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Insert tasks' }))

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('1 planner task inserted.'))
    expect(state.tasks).toHaveLength(2)
    expect(state.tasks[1]).toMatchObject({
      title: 'Project Atlas foundation',
      projectId: 'project-1',
    })
  })
})
