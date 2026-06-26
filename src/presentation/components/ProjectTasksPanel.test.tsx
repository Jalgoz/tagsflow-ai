import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  MemberManagementRepositoryProvider,
  SubtaskRepositoryProvider,
  TagManagementRepositoryProvider,
  TaskRepositoryProvider,
} from '../../application'
import type {
  CreateSubtaskInput,
  CreateTaskInput,
  MemberRepository,
  ProjectRepository,
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

const createTaskRepository = (initialTasks: Task[] = []): TaskRepository => {
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

const createProjectRepository = (): ProjectRepository => ({
  list: async () => [],
  getById: async () => null,
  create: async (input) => ({ ...input, id: 'project-1', memberIds: input.memberIds ?? [], taskIds: input.taskIds ?? [] }),
  update: async (id, input) => ({
    description: '',
    dueDate: null,
    id,
    inScopeContent: '',
    memberIds: [],
    objective: '',
    outOfScopeContent: '',
    startDate: null,
    status: 'active',
    taskIds: [],
    title: '',
    ...input,
  }),
  delete: async () => undefined,
  assignMember: async () => {
    throw new Error('Not used in ProjectTasksPanel tests.')
  },
  unassignMember: async () => {
    throw new Error('Not used in ProjectTasksPanel tests.')
  },
  setMemberIds: async () => {
    throw new Error('Not used in ProjectTasksPanel tests.')
  },
})

const renderPanel = (subtasks: Subtask[] = []) => {
  const taskRepository = createTaskRepository([createTask({ subtaskIds: subtasks.map((subtask) => subtask.id) })])
  const subtaskRepository = createSubtaskRepository(subtasks)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TaskRepositoryProvider repository={taskRepository}>
          <SubtaskRepositoryProvider repository={subtaskRepository}>
            <MemberManagementRepositoryProvider
              repositories={{
                members: createMemberRepository(),
                projects: createProjectRepository(),
                subtasks: subtaskRepository,
                tasks: taskRepository,
              }}
            >
              <TagManagementRepositoryProvider
                repositories={{
                  subtasks: subtaskRepository,
                  tags: createTagRepository(),
                  tasks: taskRepository,
                }}
              >
                {children}
              </TagManagementRepositoryProvider>
            </MemberManagementRepositoryProvider>
          </SubtaskRepositoryProvider>
        </TaskRepositoryProvider>
      </ToastProvider>
    </QueryClientProvider>
  )

  return {
    subtaskRepository,
    ...render(<ProjectTasksPanel projectId="project-1" />, { wrapper: Wrapper }),
  }
}

const expandSubtasks = async () => {
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Build task workflow' })).not.toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Show subtasks' }))
}

describe('ProjectTasksPanel subtask layout', () => {
  it('opens subtask creation in a focused dialog instead of an inline task-card form', async () => {
    const { container, subtaskRepository } = renderPanel()

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
    await expect(subtaskRepository.listByTaskId('task-1')).resolves.toHaveLength(1)
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
})
