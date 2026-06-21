import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MemberManagementRepositoryProvider,
  SubtaskRepositoryProvider,
  TagManagementRepositoryProvider,
  TaskRepositoryProvider,
} from '../../application'
import type {
  CreateSubtaskInput,
  CreateTaskInput,
  Member,
  MemberRepository,
  ProjectRepository,
  Subtask,
  SubtaskRepository,
  Tag,
  TagRepository,
  Task,
  TaskRepository,
  UpdateSubtaskInput,
  UpdateTaskInput,
} from '../../domain'
import { ToastProvider } from '../feedback'
import { ProjectKanbanPanel } from './ProjectKanbanPanel'

let dragEndHandler: ((event: { active: { id: string }; over?: { id: string } }) => void | Promise<void>) | null = null

vi.mock('@dnd-kit/core', async () => {
  return {
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: ReactNode
      onDragEnd: (event: { active: { id: string }; over?: { id: string } }) => void | Promise<void>
    }) => {
      dragEndHandler = onDragEnd
      return <div data-testid="mock-dnd-context">{children}</div>
    },
    PointerSensor: class {},
    closestCenter: vi.fn(),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    }),
    useDroppable: () => ({
      isOver: false,
      setNodeRef: vi.fn(),
    }),
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn((...sensors: unknown[]) => sensors),
    DragOverlay: ({ children }: { children: ReactNode }) => {
      return <div data-testid="mock-drag-overlay">{children}</div>
    },
  }
})

afterEach(() => {
  cleanup()
  dragEndHandler = null
})

const member: Member = {
  avatar: '',
  email: 'ada@example.com',
  id: 'member-1',
  name: 'Ada Lovelace',
  role: 'Engineer',
}

const tag: Tag = {
  color: '#4f46e5',
  id: 'tag-1',
  name: 'Frontend',
}

const createTask = (overrides: Partial<Task> = {}): Task => ({
  assigneeMemberId: null,
  checklist: [],
  description: '',
  dueDate: null,
  id: 'task-1',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  projectId: 'project-1',
  startDate: null,
  status: 'todo',
  subtaskIds: [],
  tagIds: [],
  title: 'Task one',
  ...overrides,
})

const createSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  assigneeMemberId: null,
  checklist: [],
  description: '',
  dueDate: null,
  id: 'subtask-1',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  startDate: null,
  status: 'todo',
  tagIds: [],
  taskId: 'task-1',
  title: 'Subtask',
  ...overrides,
})

const createTaskRepository = (initialTasks: Task[]): TaskRepository => {
  const state = { tasks: [...initialTasks] }

  const updateTask = (id: string, input: UpdateTaskInput): Task => {
    const currentTask = state.tasks.find((task) => task.id === id)
    if (currentTask === undefined) {
      throw new Error('Task not found.')
    }

    const nextTask = { ...currentTask, ...input }
    state.tasks = state.tasks.map((task) => (task.id === id ? nextTask : task))
    return nextTask
  }

  return {
    assignMember: async (id, memberId) => updateTask(id, { assigneeMemberId: memberId }),
    create: async (input: CreateTaskInput) => {
      const createdTask = createTask({ ...input, id: `task-${state.tasks.length + 1}` })
      state.tasks.push(createdTask)
      return createdTask
    },
    delete: async (id) => {
      state.tasks = state.tasks.filter((task) => task.id !== id)
    },
    getById: async (id) => state.tasks.find((task) => task.id === id) ?? null,
    list: async () => state.tasks,
    listByProjectId: async (projectId) => state.tasks.filter((task) => task.projectId === projectId),
    setChecklist: async (id, checklist) => updateTask(id, { checklist }),
    setStatus: async (id, status) => updateTask(id, { status }),
    setSubtaskIds: async (id, subtaskIds) => updateTask(id, { subtaskIds }),
    setTagIds: async (id, tagIds) => updateTask(id, { tagIds }),
    update: async (id, input) => updateTask(id, input),
  }
}

const createSubtaskRepository = (initialSubtasks: Subtask[] = []): SubtaskRepository => ({
  assignMember: async (id, memberId) => ({ ...(initialSubtasks.find((subtask) => subtask.id === id) as Subtask), assigneeMemberId: memberId }),
  create: async (input: CreateSubtaskInput) => ({
    assigneeMemberId: input.assigneeMemberId ?? null,
    checklist: input.checklist ?? [],
    description: input.description,
    dueDate: input.dueDate,
    id: 'subtask-created',
    inScopeContent: input.inScopeContent,
    outOfScopeContent: input.outOfScopeContent,
    priority: input.priority,
    startDate: input.startDate,
    status: input.status,
    tagIds: input.tagIds ?? [],
    taskId: input.taskId,
    title: input.title,
  }),
  delete: async () => undefined,
  getById: async () => null,
  list: async () => initialSubtasks,
  listByTaskId: async (taskId) => initialSubtasks.filter((subtask) => subtask.taskId === taskId),
  setChecklist: async (id, checklist) => ({ ...(initialSubtasks.find((subtask) => subtask.id === id) as Subtask), checklist }),
  setStatus: async (id, status) => ({ ...(initialSubtasks.find((subtask) => subtask.id === id) as Subtask), status }),
  setTagIds: async (id, tagIds) => ({ ...(initialSubtasks.find((subtask) => subtask.id === id) as Subtask), tagIds }),
  update: async (id, input: UpdateSubtaskInput) => ({ ...(initialSubtasks.find((subtask) => subtask.id === id) as Subtask), ...input }),
})

const createMemberRepository = (members: Member[] = []): MemberRepository => ({
  create: async (input) => ({ ...input, id: 'member-1' }),
  delete: async () => undefined,
  getById: async (id) => members.find((currentMember) => currentMember.id === id) ?? null,
  list: async () => members,
  update: async (id, input) => ({ avatar: '', email: '', id, name: '', role: '', ...input }),
})

const createTagRepository = (tags: Tag[] = []): TagRepository => ({
  create: async (input) => ({ ...input, id: 'tag-1' }),
  delete: async () => undefined,
  getById: async (id) => tags.find((currentTag) => currentTag.id === id) ?? null,
  list: async () => tags,
  update: async (id, input) => ({ id, name: '', ...input }),
})

const createProjectRepository = (): ProjectRepository => ({
  assignMember: async () => {
    throw new Error('Not used in tests.')
  },
  create: async (input) => ({ ...input, id: 'project-1', memberIds: [], taskIds: [] }),
  delete: async () => undefined,
  getById: async () => null,
  list: async () => [],
  setMemberIds: async () => {
    throw new Error('Not used in tests.')
  },
  unassignMember: async () => {
    throw new Error('Not used in tests.')
  },
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
})

type RenderPanelOptions = {
  members?: Member[]
  subtasks?: Subtask[]
  tags?: Tag[]
}

const renderPanel = (tasks: Task[], options: RenderPanelOptions = {}) => {
  const taskRepository = createTaskRepository(tasks)
  const subtaskRepository = createSubtaskRepository(options.subtasks ?? [])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TaskRepositoryProvider repository={taskRepository}>
          <SubtaskRepositoryProvider repository={subtaskRepository}>
            <MemberManagementRepositoryProvider
              repositories={{
                members: createMemberRepository(options.members ?? []),
                projects: createProjectRepository(),
                subtasks: subtaskRepository,
                tasks: taskRepository,
              }}
            >
              <TagManagementRepositoryProvider
                repositories={{
                  subtasks: subtaskRepository,
                  tags: createTagRepository(options.tags ?? []),
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

  return { taskRepository, ...render(<ProjectKanbanPanel projectId="project-1" />, { wrapper: Wrapper }) }
}

describe('ProjectKanbanPanel', () => {
  it('renders all approved columns and places tasks by status', async () => {
    renderPanel([createTask({ id: 'task-todo', status: 'todo', title: 'Todo task' }), createTask({ id: 'task-done', status: 'done', title: 'Done task' })])

    await waitFor(() => expect(screen.getByText('Backlog')).not.toBeNull())
    expect(screen.getByText('To Do')).not.toBeNull()
    expect(screen.getByText('In Progress')).not.toBeNull()
    expect(screen.getByText('Blocked')).not.toBeNull()
    expect(screen.getByText('Review')).not.toBeNull()
    expect(screen.getByText('Done')).not.toBeNull()
    expect(screen.getByText('Todo task')).not.toBeNull()
    expect(screen.getByText('Done task')).not.toBeNull()
  })

  it('creates a task from a selected column with default status', async () => {
    const { taskRepository } = renderPanel([])
    await waitFor(() => expect(screen.getByText('Backlog')).not.toBeNull())

    fireEvent.click(screen.getAllByRole('button', { name: 'New task' })[0])
    const dialog = screen.getByRole('dialog', { name: 'CREATE TASK' })
    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'Created from backlog' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create task' }))

    await waitFor(() => expect(screen.getByText('Task created.')).not.toBeNull())
    await expect(taskRepository.listByProjectId('project-1')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'backlog', title: 'Created from backlog' })]),
    )
  })

  it('opens task detail and closes without sending a mutation', async () => {
    const { taskRepository } = renderPanel(
      [
        createTask({
          assigneeMemberId: member.id,
          checklist: [{ completed: true, text: 'Reviewed' }],
          description: '',
          dueDate: '2026-06-25',
          inScopeContent: '',
          outOfScopeContent: '',
          tagIds: [tag.id],
          title: 'Inspect task',
        }),
      ],
      {
        members: [member],
        subtasks: [createSubtask({ status: 'done' })],
        tags: [tag],
      },
    )

    await waitFor(() => expect(screen.getByText('Inspect task')).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Open details for Inspect task' }))

    const dialog = screen.getByRole('dialog', { name: 'Inspect task' })
    expect(within(dialog).getByText('Description')).not.toBeNull()
    expect(within(dialog).getAllByText('Not set').length).toBeGreaterThan(0)
    expect(within(dialog).getByText('Ada Lovelace')).not.toBeNull()
    expect(within(dialog).getByText('Frontend')).not.toBeNull()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inspect task' })).toBeNull())
    await expect(taskRepository.listByProjectId('project-1')).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Inspect task' })]))
  })

  it('opens the task edit form and moves the card to the saved status column', async () => {
    const { taskRepository, container } = renderPanel([createTask({ id: 'task-edit', title: 'Move me' })])
    await waitFor(() => expect(screen.getByText('Move me')).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }))
    const dialog = screen.getByRole('dialog', { name: 'EDIT TASK' })
    fireEvent.change(within(dialog).getByLabelText(/Status/), { target: { value: 'done' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.getByText('Task updated.')).not.toBeNull())
    await expect(taskRepository.getById('task-edit')).resolves.toEqual(expect.objectContaining({ status: 'done' }))

    const doneHeading = screen.getByText('Done')
    const doneColumn = doneHeading.closest('.project-kanban__column')
    expect(doneColumn).not.toBeNull()
    expect(within(doneColumn as HTMLElement).getByText('Move me')).not.toBeNull()
    expect(container.querySelector('[role="dialog"][aria-modal="true"]')).toBeNull()
  })

  it('opens delete confirmation, cancels without mutation, and removes the task after confirm', async () => {
    const { taskRepository } = renderPanel([createTask({ id: 'task-delete', title: 'Delete me' })])
    await waitFor(() => expect(screen.getByText('Delete me')).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this task?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep task' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog', { name: 'Delete this task?' })).toBeNull())
    await expect(taskRepository.getById('task-delete')).resolves.toEqual(expect.objectContaining({ id: 'task-delete' }))

    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    const confirmDialog = screen.getByRole('alertdialog', { name: 'Delete this task?' })
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Delete task' }))

    await waitFor(() => expect(screen.getByText('Task deleted.')).not.toBeNull())
    await expect(taskRepository.getById('task-delete')).resolves.toBeNull()
    await waitFor(() => expect(screen.queryByText('Delete me')).toBeNull())
  })

  it('updates task status when dragging between columns', async () => {
    const { taskRepository } = renderPanel([createTask({ id: 'task-drag', title: 'Drag me', status: 'todo' })])
    await waitFor(() => expect(screen.getByText('Drag me')).not.toBeNull())

    expect(dragEndHandler).not.toBeNull()
    await act(async () => {
      await dragEndHandler?.({ active: { id: 'task-drag' }, over: { id: 'done' } })
    })

    await waitFor(() => expect(screen.getByText('Task status updated.')).not.toBeNull())
    await expect(taskRepository.getById('task-drag')).resolves.toEqual(expect.objectContaining({ status: 'done' }))
  })

  it('keeps same-column drops as a no-op', async () => {
    const { taskRepository } = renderPanel([createTask({ id: 'task-same', title: 'Stay put', status: 'todo' })])
    await waitFor(() => expect(screen.getByText('Stay put')).not.toBeNull())

    expect(dragEndHandler).not.toBeNull()
    await act(async () => {
      await dragEndHandler?.({ active: { id: 'task-same' }, over: { id: 'todo' } })
    })

    await expect(taskRepository.getById('task-same')).resolves.toEqual(expect.objectContaining({ status: 'todo' }))
    expect(screen.queryByText('Task status updated.')).toBeNull()
  })

  it('requires confirmation before dragging a task with pending subtasks to done', async () => {
    const { taskRepository } = renderPanel(
      [createTask({ id: 'task-pending', status: 'todo', subtaskIds: ['subtask-1'], title: 'Pending drag' })],
      { subtasks: [createSubtask({ id: 'subtask-1', status: 'todo', taskId: 'task-pending' })] },
    )
    await waitFor(() => expect(screen.getByText('Pending drag')).not.toBeNull())

    await act(async () => {
      await dragEndHandler?.({ active: { id: 'task-pending' }, over: { id: 'done' } })
    })

    expect(screen.getByRole('alertdialog', { name: 'Mark task done with pending subtasks?' })).not.toBeNull()
    await expect(taskRepository.getById('task-pending')).resolves.toEqual(expect.objectContaining({ status: 'todo' }))

    fireEvent.click(screen.getByRole('button', { name: 'Keep task open' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog', { name: 'Mark task done with pending subtasks?' })).toBeNull())
    await expect(taskRepository.getById('task-pending')).resolves.toEqual(expect.objectContaining({ status: 'todo' }))

    await act(async () => {
      await dragEndHandler?.({ active: { id: 'task-pending' }, over: { id: 'done' } })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }))
    await waitFor(() => expect(screen.getByText('Task status updated.')).not.toBeNull())
    await expect(taskRepository.getById('task-pending')).resolves.toEqual(expect.objectContaining({ status: 'done' }))
  })

  it('requires confirmation before saving an edit as done with pending subtasks', async () => {
    const { taskRepository } = renderPanel(
      [createTask({ id: 'task-edit-pending', status: 'todo', subtaskIds: ['subtask-1'], title: 'Pending edit' })],
      { subtasks: [createSubtask({ id: 'subtask-1', status: 'todo', taskId: 'task-edit-pending' })] },
    )
    await waitFor(() => expect(screen.getByText('Pending edit')).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }))
    const dialog = screen.getByRole('dialog', { name: 'EDIT TASK' })
    fireEvent.change(within(dialog).getByLabelText(/Status/), { target: { value: 'done' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.getByRole('alertdialog', { name: 'Save task as done with pending subtasks?' })).not.toBeNull())
    await expect(taskRepository.getById('task-edit-pending')).resolves.toEqual(expect.objectContaining({ status: 'todo' }))

    fireEvent.click(screen.getByRole('button', { name: 'Save as done' }))
    await waitFor(() => expect(screen.getByText('Task updated.')).not.toBeNull())
    await expect(taskRepository.getById('task-edit-pending')).resolves.toEqual(expect.objectContaining({ status: 'done' }))
  })
})
