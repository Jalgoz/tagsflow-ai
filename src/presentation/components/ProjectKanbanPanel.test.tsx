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
  Tag,
  TagRepository,
  Task,
  TaskRepository,
  UpdateSubtaskInput,
  UpdateTaskInput,
} from '../../domain'
import { ToastProvider } from '../feedback'
import { ProjectKanbanPanel } from './ProjectKanbanPanel'

afterEach(() => {
  cleanup()
})

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
  assignMember: async (id, memberId) => ({ ...(initialSubtasks.find((subtask) => subtask.id === id) as Subtask), assigneeMemberId: memberId }),
  update: async (id, input: UpdateSubtaskInput) => ({ ...(initialSubtasks.find((subtask) => subtask.id === id) as Subtask), ...input }),
})

const createMemberRepository = (): MemberRepository => ({
  create: async (input) => ({ ...input, id: 'member-1' }),
  delete: async () => undefined,
  getById: async () => null,
  list: async () => [],
  update: async (id, input) => ({ avatar: '', email: '', id, name: '', role: '', ...input }),
})

const createTagRepository = (tags: Tag[] = []): TagRepository => ({
  create: async (input) => ({ ...input, id: 'tag-1' }),
  delete: async () => undefined,
  getById: async () => null,
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

const renderPanel = (tasks: Task[]) => {
  const taskRepository = createTaskRepository(tasks)
  const subtaskRepository = createSubtaskRepository()
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
    const dialog = screen.getByRole('dialog', { name: 'Create task' })
    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'Created from backlog' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create task' }))

    await waitFor(() => expect(screen.getByText('Task created.')).not.toBeNull())
    await expect(taskRepository.listByProjectId('project-1')).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'backlog', title: 'Created from backlog' })]),
    )
  })
})
