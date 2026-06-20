import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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
  UpdateTagInput,
} from '../../domain'
import { DashboardPage } from './DashboardPage'
import { DASHBOARD_TASK_FILTER_PARAM, DASHBOARD_TASK_SEARCH_PARAM } from './global-tasks'

afterEach(() => {
  cleanup()
})

const toIsoDate = (offsetDays: number): string => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

const createProject = (overrides: Partial<Project> = {}): Project => ({
  description: '',
  dueDate: toIsoDate(21),
  id: 'project-1',
  inScopeContent: '',
  memberIds: [],
  objective: '',
  outOfScopeContent: '',
  startDate: null,
  status: 'active',
  taskIds: ['task-1', 'task-2', 'task-3'],
  title: 'Project Atlas',
  ...overrides,
})

const createTask = (overrides: Partial<Task> = {}): Task => ({
  assigneeMemberId: null,
  checklist: [],
  description: 'Default task description',
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
  priority: 'medium',
  startDate: null,
  status: 'todo',
  tagIds: [],
  taskId: 'task-1',
  title: 'Default subtask',
  ...overrides,
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

const createProjectRepository = (projects: Project[]): ProjectRepository => ({
  assignMember: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  create: async (input: CreateProjectInput) => ({ ...createProject(), ...input }),
  delete: async () => undefined,
  getById: async (id: string) => projects.find((project) => project.id === id) ?? null,
  list: async () => projects,
  setMemberIds: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  unassignMember: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  update: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
})

const createTaskRepository = (tasks: Task[]): TaskRepository => ({
  assignMember: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  create: async (input: CreateTaskInput) => ({ ...createTask(), ...input }),
  delete: async () => undefined,
  getById: async (id: string) => tasks.find((task) => task.id === id) ?? null,
  list: async () => tasks,
  listByProjectId: async (projectId: string) => tasks.filter((task) => task.projectId === projectId),
  setChecklist: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  setStatus: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  setSubtaskIds: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  setTagIds: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  update: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
})

const createSubtaskRepository = (subtasks: Subtask[]): SubtaskRepository => ({
  assignMember: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  create: async (input: CreateSubtaskInput) => ({ ...createSubtask(), ...input }),
  delete: async () => undefined,
  getById: async (id: string) => subtasks.find((subtask) => subtask.id === id) ?? null,
  list: async () => subtasks,
  listByTaskId: async (taskId: string) => subtasks.filter((subtask) => subtask.taskId === taskId),
  setChecklist: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  setStatus: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  setTagIds: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
  update: async () => {
    throw new Error('Not used in DashboardPage tests.')
  },
})

const createMemberRepository = (members: Member[]): MemberRepository => ({
  create: async (input: CreateMemberInput) => ({ ...input, id: 'member-new' }),
  delete: async () => undefined,
  getById: async (id: string) => members.find((memberItem) => memberItem.id === id) ?? null,
  list: async () => members,
  update: async (id: string, input: UpdateMemberInput) => ({ avatar: '', email: '', id, name: '', role: '', ...input }),
})

const createTagRepository = (tags: Tag[]): TagRepository => ({
  create: async (input: CreateTagInput) => ({ ...input, id: 'tag-new' }),
  delete: async () => undefined,
  getById: async (id: string) => tags.find((tagItem) => tagItem.id === id) ?? null,
  list: async () => tags,
  update: async (id: string, input: UpdateTagInput) => ({ id, name: '', ...input }),
})

interface RenderDashboardPageOptions {
  projects?: Project[]
  tasks?: Task[]
  subtasks?: Subtask[]
  members?: Member[]
  tags?: Tag[]
  initialEntry?: string
}

const renderDashboardPage = ({
  projects = [createProject()],
  tasks = [],
  subtasks = [],
  members = [],
  tags = [],
  initialEntry = '/dashboard',
}: RenderDashboardPageOptions = {}) => {
  const projectRepository = createProjectRepository(projects)
  const taskRepository = createTaskRepository(tasks)
  const subtaskRepository = createSubtaskRepository(subtasks)
  const memberRepository = createMemberRepository(members)
  const tagRepository = createTagRepository(tags)

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )

  return render(
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tasks" element={<div>Tasks route</div>} />
      <Route path="/projects/:projectId" element={<div>Project detail route</div>} />
      <Route path="/projects" element={<div>Projects route</div>} />
    </Routes>,
    { wrapper: Wrapper },
  )
}

describe('DashboardPage', () => {
  it('renders functional dashboard content with metrics, charts, and lists', async () => {
    const tasks = [
      createTask({
        assigneeMemberId: member.id,
        dueDate: toIsoDate(2),
        id: 'task-1',
        priority: 'high',
        status: 'in_progress',
        subtaskIds: ['subtask-1'],
        tagIds: [tag.id],
        title: 'Launch UI iteration',
      }),
      createTask({
        dueDate: toIsoDate(1),
        id: 'task-2',
        priority: 'urgent',
        status: 'blocked',
        title: 'Resolve API contract blocker',
      }),
      createTask({
        dueDate: toIsoDate(-2),
        id: 'task-3',
        priority: 'medium',
        status: 'done',
        title: 'Complete backlog grooming',
      }),
    ]

    const subtasks = [
      createSubtask({ id: 'subtask-1', status: 'done', taskId: 'task-1' }),
      createSubtask({ id: 'subtask-2', status: 'todo', taskId: 'task-1' }),
    ]

    renderDashboardPage({
      members: [member],
      projects: [createProject({ taskIds: tasks.map((task) => task.id), title: 'Project Atlas' })],
      subtasks,
      tags: [tag],
      tasks,
    })

    expect(await screen.findByRole('heading', { name: 'Workspace overview' })).not.toBeNull()
    expect(await screen.findByText('Summary metrics')).not.toBeNull()
    expect(screen.queryByText('Dashboard overview')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Upcoming deadlines' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Blocked work' })).not.toBeNull()
    expect(screen.getByText('Task status distribution')).not.toBeNull()
    expect(screen.getByText('Task priority distribution')).not.toBeNull()
    expect(screen.getByText('Completed this week')).not.toBeNull()
    expect(
      screen.getAllByText(
        'Exact completion timing is unavailable because completion timestamps are not part of the current task model.',
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Launch UI iteration')).not.toBeNull()
    expect(screen.getAllByText('Resolve API contract blocker').length).toBeGreaterThan(0)
    expect(screen.getByText('Ada Lovelace')).not.toBeNull()
    expect(screen.getByText('Frontend')).not.toBeNull()
  })

  it('renders chart no-data states when projects exist but no tasks are available', async () => {
    renderDashboardPage({
      projects: [createProject({ taskIds: [] })],
      tasks: [],
    })

    expect(await screen.findByRole('heading', { name: 'Workspace overview' })).not.toBeNull()
    expect(await screen.findByText('No task status data available yet.')).not.toBeNull()
    expect(screen.getByText('No task priority data available yet.')).not.toBeNull()
  })

  it('renders empty dashboard state when no projects exist', async () => {
    renderDashboardPage({ projects: [] })

    expect(await screen.findByText('No projects yet')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Go to projects' })).not.toBeNull()
  })

  it('navigates aggregate task metric cards to /tasks', async () => {
    const project = createProject({ id: 'project-1', taskIds: ['task-1'], title: 'Project Atlas' })
    const task = createTask({
      dueDate: toIsoDate(1),
      id: 'task-1',
      projectId: project.id,
      status: 'blocked',
      title: 'Resolve blocker',
    })

    renderDashboardPage({ projects: [project], tasks: [task] })

    expect(await screen.findByRole('heading', { name: 'Workspace overview' })).not.toBeNull()
    fireEvent.click(await screen.findByRole('link', { name: /Total tasks/i }))
    await waitFor(() => {
      expect(screen.getByText('Tasks route')).not.toBeNull()
    })
  })

  it('builds dashboard metric links with task filter query presets', async () => {
    const project = createProject({ id: 'project-1', taskIds: ['task-1'], title: 'Project Atlas' })
    const task = createTask({ id: 'task-1', projectId: project.id, status: 'blocked', title: 'Resolve blocker' })

    renderDashboardPage({ projects: [project], tasks: [task] })
    expect(await screen.findByRole('link', { name: /Total tasks/i })).not.toBeNull()

    expect(screen.getByRole('link', { name: /Total tasks/i }).getAttribute('href')).toBe(
      `/tasks?${DASHBOARD_TASK_FILTER_PARAM}=all`,
    )
    expect(screen.getByRole('link', { name: /Pending tasks/i }).getAttribute('href')).toBe(
      `/tasks?${DASHBOARD_TASK_FILTER_PARAM}=pending`,
    )
    expect(screen.getByRole('link', { name: /Completed tasks/i }).getAttribute('href')).toBe(
      `/tasks?${DASHBOARD_TASK_FILTER_PARAM}=completed`,
    )
    expect(screen.getByRole('link', { name: /Blocked tasks/i }).getAttribute('href')).toBe(
      `/tasks?${DASHBOARD_TASK_FILTER_PARAM}=blocked`,
    )
    expect(screen.getByRole('link', { name: /Overdue tasks/i }).getAttribute('href')).toBe(
      `/tasks?${DASHBOARD_TASK_FILTER_PARAM}=overdue`,
    )
    expect(screen.getByRole('link', { name: /Upcoming deadlines/i }).getAttribute('href')).toBe(
      `/tasks?${DASHBOARD_TASK_FILTER_PARAM}=upcoming`,
    )
  })

  it('navigates project dashboard items to /projects/:projectId', async () => {
    const project = createProject({ id: 'project-1', taskIds: ['task-1'], title: 'Project Atlas' })
    const task = createTask({
      dueDate: toIsoDate(1),
      id: 'task-1',
      projectId: project.id,
      status: 'blocked',
      title: 'Resolve blocker',
    })

    renderDashboardPage({ projects: [project], tasks: [task] })
    expect(await screen.findByRole('heading', { name: 'Workspace overview' })).not.toBeNull()
    const projectLinks = await screen.findAllByRole('link', { name: /Project Atlas/i })
    fireEvent.click(projectLinks[0])
    await waitFor(() => {
      expect(screen.getByText('Project detail route')).not.toBeNull()
    })
  })

  it('navigates task-specific dashboard list items to /tasks with task title search', async () => {
    const project = createProject({ id: 'project-1', taskIds: ['task-1'], title: 'Project Atlas' })
    const task = createTask({
      dueDate: toIsoDate(1),
      id: 'task-1',
      projectId: project.id,
      status: 'in_progress',
      title: 'Upcoming release task',
    })

    renderDashboardPage({ projects: [project], tasks: [task] })
    expect(await screen.findByRole('heading', { name: 'Workspace overview' })).not.toBeNull()
    const taskLink = await screen.findByRole('link', { name: /Upcoming release task/i })
    expect(taskLink.getAttribute('href')).toBe(
      `/tasks?${DASHBOARD_TASK_FILTER_PARAM}=all&${DASHBOARD_TASK_SEARCH_PARAM}=Upcoming+release+task`,
    )
    fireEvent.click(taskLink)
    await waitFor(() => {
      expect(screen.getByText('Tasks route')).not.toBeNull()
    })
  })
})
