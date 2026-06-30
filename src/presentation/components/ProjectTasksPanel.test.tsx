import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import {
  AIProviderResolverProvider,
  createAIProviderResolver,
  SettingsRepositoryProvider,
  ProjectRepositoryProvider,
  MemberManagementRepositoryProvider,
  SubtaskRepositoryProvider,
  TagManagementRepositoryProvider,
  TaskRepositoryProvider,
} from '../../application'
import type {
  AppSettings,
  CreateSubtaskInput,
  CreateTaskInput,
  MemberRepository,
  ProjectRepository,
  Project,
  SettingsRepository,
  Subtask,
  SubtaskRepository,
  TagRepository,
  Task,
  TaskRepository,
  UpdateSubtaskInput,
  UpdateTaskInput,
} from '../../domain'
import { ToastProvider } from '../feedback'
import { vi } from 'vitest'
import { ProjectTasksPanel } from './ProjectTasksPanel'

vi.mock('./AISubtaskGeneratorDialog', () => ({
  AISubtaskGeneratorDialog: () => <div data-testid="mock-subtask-generator-dialog" />
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
})

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Build task workflow',
  description: 'Manage project work.',
  inScopeContent: 'Project task list',
  outOfScopeContent: 'Global table',
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

const createTaskRepository = (initialTasks: Task[] = []): TaskRepository & { state: { tasks: Task[] } } => {
  const state = {
    tasks: [...initialTasks],
  }

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
    state,
    list: async () => state.tasks,
    listByProjectId: async (projectId) => state.tasks.filter((task) => task.projectId === projectId),
    getById: async (id) => state.tasks.find((task) => task.id === id) ?? null,
    create: async (input: CreateTaskInput) => {
      const task = createTask({ ...input, id: `task-${state.tasks.length + 1}` })
      state.tasks.push(task)
      return task
    },
    update: async (id, input) => updateTask(id, input),
    delete: async (id) => {
      state.tasks = state.tasks.filter((task) => task.id !== id)
    },
    setStatus: async (id, status) => updateTask(id, { status }),
    assignMember: async (id, memberId) => updateTask(id, { assigneeMemberId: memberId }),
    setTagIds: async (id, tagIds) => updateTask(id, { tagIds }),
    setChecklist: async (id, checklist) => updateTask(id, { checklist }),
    setSubtaskIds: async (id, subtaskIds) => updateTask(id, { subtaskIds }),
  }
}

const createSubtaskRepository = (initialSubtasks: Subtask[] = []): SubtaskRepository => {
  const state = {
    subtasks: [...initialSubtasks],
  }

  const updateSubtask = (id: string, input: UpdateSubtaskInput): Subtask => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    const updatedSubtask = { ...subtask, ...input }
    state.subtasks = state.subtasks.map((currentSubtask) =>
      currentSubtask.id === id ? updatedSubtask : currentSubtask,
    )
    return updatedSubtask
  }

  return {
    list: async () => state.subtasks,
    listByTaskId: async (taskId) => state.subtasks.filter((subtask) => subtask.taskId === taskId),
    getById: async (id) => state.subtasks.find((subtask) => subtask.id === id) ?? null,
    create: async (input: CreateSubtaskInput) => {
      const subtask = createSubtask({ ...input, id: `subtask-${state.subtasks.length + 1}` })
      state.subtasks.push(subtask)
      return subtask
    },
    update: async (id, input) => updateSubtask(id, input),
    delete: async (id) => {
      state.subtasks = state.subtasks.filter((subtask) => subtask.id !== id)
    },
    setStatus: async (id, status) => updateSubtask(id, { status }),
    assignMember: async (id, memberId) => updateSubtask(id, { assigneeMemberId: memberId }),
    setTagIds: async (id, tagIds) => updateSubtask(id, { tagIds }),
    setChecklist: async (id, checklist) => updateSubtask(id, { checklist }),
  }
}

const createMemberRepository = (): MemberRepository => ({
  list: async () => [],
  getById: async () => null,
  create: async (input) => ({ ...input, id: 'member-1' }),
  update: async (id, input) => ({ avatar: '', email: '', id, name: '', role: '', ...input }),
  delete: async () => undefined,
})

const createTagRepository = (): TagRepository => ({
  list: async () => [],
  getById: async () => null,
  create: async (input) => ({ ...input, id: 'tag-1' }),
  update: async (id, input) => ({ id, name: '', ...input }),
  delete: async () => undefined,
})

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Project workspace',
  description: 'Project context for the panel tests.',
  objective: 'Keep the panel stable.',
  inScopeContent: 'Task and subtask surface.',
  outOfScopeContent: 'Global pages.',
  status: 'active',
  startDate: null,
  dueDate: null,
  memberIds: [],
  taskIds: [],
  ...overrides,
})

const createProjectRepository = (
  initialProjects: Project[] = [createProject()],
): ProjectRepository & { state: { projects: Project[] } } => {
  const state = {
    projects: [...initialProjects],
  }

  const updateProject = (id: string, input: Partial<Project>): Project => {
    const project = state.projects.find((currentProject) => currentProject.id === id)

    if (project === undefined) {
      throw new Error(`Project with ID "${id}" was not found.`)
    }

    const updatedProject = { ...project, ...input }
    state.projects = state.projects.map((currentProject) => (currentProject.id === id ? updatedProject : currentProject))
    return updatedProject
  }

  return {
    state,
    list: async () => state.projects,
    getById: async (id) => state.projects.find((project) => project.id === id) ?? null,
    create: async (input) => {
      const project = createProject({ ...input, id: `project-${state.projects.length + 1}` })
      state.projects.push(project)
      return project
    },
    update: async (id, input) => updateProject(id, input),
    delete: async (id) => {
      state.projects = state.projects.filter((project) => project.id !== id)
    },
    assignMember: async (id, memberId) => {
      const currentMemberIds: string[] = state.projects.find((project) => project.id === id)?.memberIds ?? []
      return updateProject(id, { memberIds: [...new Set([...currentMemberIds, memberId])] })
    },
    unassignMember: async (id, memberId) => {
      const currentMemberIds: string[] = state.projects.find((project) => project.id === id)?.memberIds ?? []
      return updateProject(id, { memberIds: currentMemberIds.filter((currentMemberId) => currentMemberId !== memberId) })
    },
    setMemberIds: async (id, memberIds) => updateProject(id, { memberIds }),
  }
}

const createSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
  theme: 'light',
  aiProvider: {
    provider: 'groq',
    apiKey: 'secret-key',
    selectedModelId: 'mock-model-v1',
  },
  ...overrides,
})

const createSettingsRepository = (settings: AppSettings): SettingsRepository => ({
  get: async () => settings,
  save: async (nextSettings) => nextSettings,
  reset: async () => settings,
})

const renderPanel = (subtasks: Subtask[] = [], settings = createSettings()) => {
  const taskRepository = createTaskRepository([createTask({ subtaskIds: subtasks.map((subtask) => subtask.id) })])
  const subtaskRepository = createSubtaskRepository(subtasks)
  const projectRepository = createProjectRepository([createProject({ taskIds: ['task-1'] })])
  const settingsRepository = createSettingsRepository(settings)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TaskRepositoryProvider repository={taskRepository}>
            <SubtaskRepositoryProvider repository={subtaskRepository}>
              <MemberManagementRepositoryProvider
                repositories={{
                  members: createMemberRepository(),
                  projects: projectRepository,
                  subtasks: subtaskRepository,
                  tasks: taskRepository,
                }}
              >
                <SettingsRepositoryProvider repository={settingsRepository}>
                  <AIProviderResolverProvider resolver={createAIProviderResolver({ mode: 'mock' })}>
                    <ProjectRepositoryProvider repository={projectRepository}>
                      <TagManagementRepositoryProvider
                        repositories={{
                          subtasks: subtaskRepository,
                          tags: createTagRepository(),
                          tasks: taskRepository,
                        }}
                      >
                        {children}
                      </TagManagementRepositoryProvider>
                    </ProjectRepositoryProvider>
                  </AIProviderResolverProvider>
                </SettingsRepositoryProvider>
              </MemberManagementRepositoryProvider>
            </SubtaskRepositoryProvider>
          </TaskRepositoryProvider>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )

  return {
    state: taskRepository.state,
    taskRepository,
    subtaskRepository,
    ...render(<ProjectTasksPanel projectId="project-1" />, { wrapper: Wrapper }),
  }
}

const expandSubtasks = async () => {
  const toggle = await screen.findByRole('button', { name: 'Show subtasks' }, { timeout: 8000 })
  fireEvent.click(toggle)
}

describe('ProjectTasksPanel subtask layout', () => {
  it('opens subtask creation in a focused dialog instead of an inline task-card form', async () => {
    const { container, subtaskRepository } = renderPanel([createSubtask({ id: 'subtask-existing', title: 'Existing subtask' })])

    await expandSubtasks()
    fireEvent.click(screen.getByRole('button', { name: 'New subtask' }))

    const dialog = screen.getByRole('dialog', { name: 'CREATE SUBTASK' })
    expect(dialog).not.toBeNull()
    expect(container.querySelector('.subtask-area .task-form')).toBeNull()
    expect(within(dialog).getByText('Title *')).not.toBeNull()

    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'Write acceptance test' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create subtask' }))

    await waitFor(() => expect(screen.getByText('Write acceptance test')).not.toBeNull())
    expect(screen.queryByRole('dialog', { name: 'CREATE SUBTASK' })).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('Subtask created.')
    await expect(subtaskRepository.listByTaskId('task-1')).resolves.toHaveLength(2)
  })

  it('opens subtask editing in a focused dialog and hides the active subtask actions underneath', async () => {
    renderPanel([createSubtask()])

    await expandSubtasks()
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1])

    const dialog = screen.getByRole('dialog', { name: 'EDIT SUBTASK' })
    expect(dialog).not.toBeNull()
    expect(screen.queryByLabelText('Update status for Draft outline')).toBeNull()

    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'Updated outline' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.getByText('Updated outline')).not.toBeNull())
    expect(screen.getByRole('status').textContent).toContain('Subtask updated.')
  })

  it('keeps subtask delete confirmation behavior inside the parent task workflow', async () => {
    renderPanel([createSubtask()])

    await expandSubtasks()
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1])

    expect(screen.getByRole('alertdialog', { name: 'Delete this subtask?' })).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Keep subtask' }))
    expect(screen.queryByRole('alertdialog', { name: 'Delete this subtask?' })).toBeNull()
    expect(screen.getByText('Draft outline')).not.toBeNull()

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1])
    fireEvent.click(screen.getByRole('button', { name: 'Delete subtask' }))

    await waitFor(() => expect(screen.queryByText('Draft outline')).toBeNull())
    expect(screen.getByRole('status').textContent).toContain('Subtask deleted.')
  })

  it('shows required field validation inside the focused subtask form surface', async () => {
    renderPanel()

    await expandSubtasks()
    fireEvent.click(screen.getByRole('button', { name: 'New subtask' }))
    const dialog = screen.getByRole('dialog', { name: 'CREATE SUBTASK' })

    expect(within(dialog).getByText('Title *')).not.toBeNull()
    expect(within(dialog).getByText('Status *')).not.toBeNull()
    expect(within(dialog).getByText('Priority *')).not.toBeNull()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Create subtask' }))

    await waitFor(() => expect(within(dialog).getByText('Title is required.')).not.toBeNull())
  })
})

describe('ProjectTasksPanel top-level layout', () => {
  it('opens task creation in a focused dialog instead of an inline form', async () => {
    const { container } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'New task' }))

    const dialog = screen.getByRole('dialog', { name: 'CREATE TASK' })
    expect(dialog).not.toBeNull()
    expect(container.querySelector('.member-workspace__inline-panel .task-form')).toBeNull()
    expect(within(dialog).getByText('Title *')).not.toBeNull()

    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'New top-level task' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create task' }))

    await waitFor(() => expect(screen.getByText('New top-level task')).not.toBeNull())
    expect(screen.queryByRole('dialog', { name: 'CREATE TASK' })).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('Task created.')
  })

  it('opens task editing in a focused dialog and hides the task card underneath', async () => {
    renderPanel()

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Build task workflow' })).not.toBeNull())
    
    // Open edit for the existing task
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    const dialog = screen.getByRole('dialog', { name: 'EDIT TASK' })
    expect(dialog).not.toBeNull()
    
    // The task card itself should be hidden while editing
    expect(screen.queryByRole('heading', { name: 'Build task workflow' })).toBeNull()

    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'Updated task workflow' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Updated task workflow' })).not.toBeNull())
    expect(screen.getByRole('status').textContent).toContain('Task updated.')
  })

  it('opens AI priority suggestion from a task card, allows canceling without mutation, and applies the suggested priority', async () => {
    const { state } = renderPanel()

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Build task workflow' })).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Suggest priority' }))

    const dialog = await screen.findByRole('dialog', { name: 'AI PRIORITY SUGGESTION' })
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Generate suggestion' })).not.toBeNull())
    fireEvent.click(within(dialog).getByRole('button', { name: 'Generate suggestion' }))

    await waitFor(() => expect(within(dialog).getByText('Review suggestion')).not.toBeNull())
    expect(within(dialog).getByText('Current priority')).not.toBeNull()
    expect(within(dialog).getByText('Suggested priority')).not.toBeNull()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'AI PRIORITY SUGGESTION' })).toBeNull())
    expect(state.tasks[0]?.priority).toBe('medium')

    fireEvent.click(screen.getByRole('button', { name: 'Suggest priority' }))
    const reopenedDialog = await screen.findByRole('dialog', { name: 'AI PRIORITY SUGGESTION' })
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: 'Generate suggestion' }))

    await within(reopenedDialog).findByText('Review suggestion')
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: 'Apply priority' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'AI PRIORITY SUGGESTION' })).toBeNull())
    await waitFor(() => expect(state.tasks[0]?.priority).toBe('high'))
    expect(screen.getByRole('status').textContent).toContain('Task priority updated.')
  })

  it('shows the AI priority not-configured state with navigation to settings', async () => {
    renderPanel([], createSettings({
      aiProvider: {
        provider: 'groq',
        apiKey: null,
        selectedModelId: null,
      },
    }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Build task workflow' })).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Suggest priority' }))

    const dialog = await screen.findByRole('dialog', { name: 'AI PRIORITY SUGGESTION' })
    expect(within(dialog).getByText('AI configuration required')).not.toBeNull()
    expect(within(dialog).getByRole('link', { name: 'Configure AI' })).not.toBeNull()
  })

  it('disables priority generation when additional instructions exceed the limit', async () => {
    renderPanel()

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Build task workflow' })).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Suggest priority' }))

    const dialog = await screen.findByRole('dialog', { name: 'AI PRIORITY SUGGESTION' })
    const instructionsField = await within(dialog).findByLabelText('Additional instructions')
    fireEvent.change(instructionsField, {
      target: { value: 'A'.repeat(801) },
    })

    expect((within(dialog).getByRole('button', { name: 'Generate suggestion' }) as HTMLButtonElement).disabled).toBe(true)
    expect(within(dialog).getByText('Instructions must be 800 characters or fewer.')).not.toBeNull()
  })
})
