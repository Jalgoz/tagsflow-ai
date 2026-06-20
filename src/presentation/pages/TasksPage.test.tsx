import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import {
  MemberManagementRepositoryProvider,
  ProjectRepositoryProvider,
  SubtaskRepositoryProvider,
  TagManagementRepositoryProvider,
  TaskRepositoryProvider,
} from '../../application'
import type {
  CreateMemberInput,
  CreateProjectInput,
  CreateSubtaskInput,
  CreateTagInput,
  CreateTaskInput,
  Member,
  MemberRepository,
  Project,
  ProjectRepository,
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
import { ToastProvider } from '../feedback'
import { TasksPage } from './TasksPage'
import { DASHBOARD_TASK_SEARCH_PARAM } from './global-tasks'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
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

const project: Project = {
  description: '',
  dueDate: null,
  id: 'project-1',
  inScopeContent: '',
  memberIds: [member.id],
  objective: '',
  outOfScopeContent: '',
  startDate: null,
  status: 'active',
  taskIds: ['task-1', 'task-2'],
  title: 'SaaS Platform',
}

const createTask = (overrides: Partial<Task> = {}): Task => ({
  assigneeMemberId: null,
  checklist: [],
  description: 'Default task description',
  dueDate: null,
  id: 'task-1',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  projectId: project.id,
  startDate: null,
  status: 'todo',
  subtaskIds: [],
  tagIds: [],
  title: 'Default task',
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
  priority: 'low',
  startDate: null,
  status: 'todo',
  tagIds: [],
  taskId: 'task-1',
  title: 'Draft outline',
  ...overrides,
})

const createTaskRepository = (initialTasks: Task[] = []): TaskRepository => {
  const state = { tasks: [...initialTasks] }

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
    assignMember: async (id, memberId) => updateTask(id, { assigneeMemberId: memberId }),
    create: async (input: CreateTaskInput) => {
      const task = createTask({ ...input, id: `task-${state.tasks.length + 1}` })
      state.tasks.push(task)
      return task
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

const createSubtaskRepository = (initialSubtasks: Subtask[] = []): SubtaskRepository => {
  const state = { subtasks: [...initialSubtasks] }

  const updateSubtask = (id: string, input: UpdateSubtaskInput): Subtask => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    const updatedSubtask = { ...subtask, ...input }
    state.subtasks = state.subtasks.map((currentSubtask) => (currentSubtask.id === id ? updatedSubtask : currentSubtask))
    return updatedSubtask
  }

  return {
    assignMember: async (id, memberId) => updateSubtask(id, { assigneeMemberId: memberId }),
    create: async (input: CreateSubtaskInput) => {
      const subtask = createSubtask({ ...input, id: `subtask-${state.subtasks.length + 1}` })
      state.subtasks.push(subtask)
      return subtask
    },
    delete: async (id) => {
      state.subtasks = state.subtasks.filter((subtask) => subtask.id !== id)
    },
    getById: async (id) => state.subtasks.find((subtask) => subtask.id === id) ?? null,
    list: async () => state.subtasks,
    listByTaskId: async (taskId) => state.subtasks.filter((subtask) => subtask.taskId === taskId),
    setChecklist: async (id, checklist) => updateSubtask(id, { checklist }),
    setStatus: async (id, status) => updateSubtask(id, { status }),
    setTagIds: async (id, tagIds) => updateSubtask(id, { tagIds }),
    update: async (id, input) => updateSubtask(id, input),
  }
}

const createProjectRepository = (projects: Project[]): ProjectRepository => ({
  assignMember: async () => {
    throw new Error('Not used in TasksPage tests.')
  },
  create: async (input: CreateProjectInput) => ({ ...input, id: 'project-new', memberIds: input.memberIds ?? [], taskIds: [] }),
  delete: async () => undefined,
  getById: async (id) => projects.find((currentProject) => currentProject.id === id) ?? null,
  list: async () => projects,
  setMemberIds: async () => {
    throw new Error('Not used in TasksPage tests.')
  },
  unassignMember: async () => {
    throw new Error('Not used in TasksPage tests.')
  },
  update: async (id, input: UpdateProjectInput) => ({ ...project, ...input, id }),
})

const createMemberRepository = (members: Member[]): MemberRepository => ({
  create: async (input: CreateMemberInput) => ({ ...input, id: 'member-new' }),
  delete: async () => undefined,
  getById: async (id) => members.find((currentMember) => currentMember.id === id) ?? null,
  list: async () => members,
  update: async (id, input: UpdateMemberInput) => ({ avatar: '', email: '', id, name: '', role: '', ...input }),
})

const createTagRepository = (tags: Tag[]): TagRepository => ({
  create: async (input: CreateTagInput) => ({ ...input, id: 'tag-new' }),
  delete: async () => undefined,
  getById: async (id) => tags.find((currentTag) => currentTag.id === id) ?? null,
  list: async () => tags,
  update: async (id, input: UpdateTagInput) => ({ id, name: '', ...input }),
})

const renderTasksPage = (options: { initialEntry?: string; subtasks?: Subtask[]; tasks?: Task[] } = {}) => {
  const tasks = options.tasks ?? [
    createTask({
      assigneeMemberId: member.id,
      checklist: [{ completed: true, text: 'Reviewed' }],
      description: 'Build the global task list.',
      dueDate: '2026-05-25',
      id: 'task-1',
      priority: 'high',
      status: 'in_progress',
      subtaskIds: ['subtask-1'],
      tagIds: [tag.id],
      title: 'Build global task view',
    }),
    createTask({
      description: 'Clean up a blocked issue.',
      id: 'task-2',
      priority: 'urgent',
      status: 'blocked',
      title: 'Fix blocked task',
    }),
  ]
  const subtasks = options.subtasks ?? [
    createSubtask({
      assigneeMemberId: member.id,
      dueDate: '2026-05-24',
      priority: 'medium',
      status: 'todo',
      tagIds: [tag.id],
    }),
  ]
  const taskRepository = createTaskRepository(tasks)
  const subtaskRepository = createSubtaskRepository(subtasks)
  const projectRepository = createProjectRepository([project])
  const memberRepository = createMemberRepository([member])
  const tagRepository = createTagRepository([tag])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const initialEntry = options.initialEntry ?? '/tasks'

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <ProjectRepositoryProvider repository={projectRepository}>
            <TaskRepositoryProvider repository={taskRepository}>
              <SubtaskRepositoryProvider repository={subtaskRepository}>
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
              </SubtaskRepositoryProvider>
            </TaskRepositoryProvider>
          </ProjectRepositoryProvider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )

  return {
    subtaskRepository,
    taskRepository,
    ...render(<TasksPage />, { wrapper: Wrapper }),
  }
}

describe('TasksPage', () => {
  it('renders global task metadata and does not expose task creation', async () => {
    renderTasksPage()

    expect(await screen.findByRole('heading', { name: 'Global tasks view' })).not.toBeNull()
    expect(await screen.findByText('Build global task view')).not.toBeNull()
    expect(screen.getAllByText('SaaS Platform').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Frontend').length).toBeGreaterThan(0)
    expect(screen.getByText('1/1 done')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /new task/i })).toBeNull()
    expect(screen.queryByText('Create task')).toBeNull()
  })

  it('filters, searches, sorts, and clears filters', async () => {
    renderTasksPage()

    expect(await screen.findByText('Build global task view')).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'blocked' } })
    expect(screen.queryByText('Build global task view')).toBeNull()
    expect(screen.getByText('Fix blocked task')).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'in_progress' } })
    expect(screen.queryByText('Fix blocked task')).toBeNull()
    expect(screen.getByText('No tasks match the current search and filters.')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByText('Fix blocked task')).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'title' } })
    fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'desc' } })

    const cards = screen.getAllByRole('article')
    expect(within(cards[0]).getByText('Fix blocked task')).not.toBeNull()
  })

  it('applies dashboard query filter presets on load', async () => {
    renderTasksPage({ initialEntry: '/tasks?dashboardTaskFilter=blocked' })

    expect(await screen.findByText('Fix blocked task')).not.toBeNull()
    expect(screen.queryByText('Build global task view')).toBeNull()
  })

  it('applies dashboard search query on load', async () => {
    renderTasksPage({ initialEntry: `/tasks?${DASHBOARD_TASK_SEARCH_PARAM}=blocked` })

    expect(await screen.findByText('Fix blocked task')).not.toBeNull()
    expect(screen.queryByText('Build global task view')).toBeNull()
  })

  it('expands subtasks and supports creating a subtask from the global view', async () => {
    const { subtaskRepository } = renderTasksPage()

    const showSubtaskButtons = await screen.findAllByRole('button', { name: 'Show subtasks' })
    fireEvent.click(showSubtaskButtons[0])

    expect(await screen.findByText('Draft outline')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'New subtask' })).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'New subtask' }))

    const dialog = screen.getByRole('dialog', { name: 'Create subtask' })
    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: 'Write global acceptance test' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create subtask' }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Subtask created.')
    })
    expect(await screen.findByText('Write global acceptance test')).not.toBeNull()

    await expect(subtaskRepository.listByTaskId('task-1')).resolves.toHaveLength(2)
  })

  it('edits a task and shows a success toast', async () => {
    renderTasksPage({ subtasks: [] })

    const editButtons = await screen.findAllByRole('button', { name: 'Edit' })
    fireEvent.click(editButtons[0])
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Updated global task' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Task updated.')
    })
    expect(await screen.findByText('Updated global task')).not.toBeNull()
  })

  it('warns before saving a task as done with pending subtasks', async () => {
    renderTasksPage()

    const editButtons = await screen.findAllByRole('button', { name: 'Edit' })
    fireEvent.click(editButtons[0])
    const dialog = screen.getByRole('dialog', { name: 'Edit global task' })
    fireEvent.change(within(dialog).getByLabelText(/Status/), { target: { value: 'done' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('heading', { name: 'Save task as done with pending subtasks?' })).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Save as done' }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Task updated.')
    })
    expect((await screen.findAllByText('Done')).length).toBeGreaterThan(0)
  })

  it('deletes a task after confirmation and shows a success toast', async () => {
    renderTasksPage()

    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByRole('heading', { name: 'Delete task?' })).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Task deleted.')
    })
    expect(screen.queryByText('Build global task view')).toBeNull()
  })
})
