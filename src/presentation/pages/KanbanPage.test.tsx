import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
  UpdateProjectInput,
  UpdateSubtaskInput,
  UpdateTagInput,
  UpdateTaskInput,
} from '../../domain'
import { KanbanPage } from './KanbanPage'

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
  description: '',
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

const createTaskRepository = (initialTasks: Task[] = []): TaskRepository => ({
  assignMember: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  create: async (input: CreateTaskInput) => ({ ...createTask({ id: 'task-new' }), ...input }),
  delete: async () => undefined,
  getById: async (id) => initialTasks.find((task) => task.id === id) ?? null,
  list: async () => initialTasks,
  listByProjectId: async (projectId) => initialTasks.filter((task) => task.projectId === projectId),
  setChecklist: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  setStatus: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  setSubtaskIds: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  setTagIds: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  update: async (id, input: UpdateTaskInput) => ({ ...createTask({ id }), ...input }),
})

const createSubtaskRepository = (initialSubtasks: Subtask[] = []): SubtaskRepository => ({
  assignMember: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  create: async (input: CreateSubtaskInput) => ({ ...createSubtask({ id: 'subtask-new' }), ...input }),
  delete: async () => undefined,
  getById: async (id) => initialSubtasks.find((subtask) => subtask.id === id) ?? null,
  list: async () => initialSubtasks,
  listByTaskId: async (taskId) => initialSubtasks.filter((subtask) => subtask.taskId === taskId),
  setChecklist: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  setStatus: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  setTagIds: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  update: async (id, input: UpdateSubtaskInput) => ({ ...createSubtask({ id }), ...input }),
})

const createProjectRepository = (projects: Project[]): ProjectRepository => ({
  assignMember: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  create: async (input: CreateProjectInput) => ({ ...input, id: 'project-new', memberIds: input.memberIds ?? [], taskIds: [] }),
  delete: async () => undefined,
  getById: async (id) => projects.find((currentProject) => currentProject.id === id) ?? null,
  list: async () => projects,
  setMemberIds: async () => {
    throw new Error('Not used in KanbanPage tests.')
  },
  unassignMember: async () => {
    throw new Error('Not used in KanbanPage tests.')
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

const renderKanbanPage = () => {
  const tasks = [
    createTask({
      assigneeMemberId: member.id,
      checklist: [{ completed: true, text: 'Reviewed' }],
      dueDate: '2026-05-25',
      id: 'task-1',
      priority: 'high',
      status: 'in_progress',
      subtaskIds: ['subtask-1'],
      tagIds: [tag.id],
      title: 'Build global kanban',
    }),
    createTask({
      id: 'task-2',
      priority: 'urgent',
      status: 'blocked',
      title: 'Fix blocked task',
    }),
  ]

  const subtasks = [createSubtask({ id: 'subtask-1', status: 'todo' })]

  const taskRepository = createTaskRepository(tasks)
  const subtaskRepository = createSubtaskRepository(subtasks)
  const projectRepository = createProjectRepository([project])
  const memberRepository = createMemberRepository([member])
  const tagRepository = createTagRepository([tag])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/kanban']}>
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
                  <Routes>
                    <Route path="/kanban" element={children} />
                    <Route path="/projects/:projectId" element={<h1>Project detail destination</h1>} />
                  </Routes>
                </TagManagementRepositoryProvider>
              </MemberManagementRepositoryProvider>
            </SubtaskRepositoryProvider>
          </TaskRepositoryProvider>
        </ProjectRepositoryProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )

  return render(<KanbanPage />, { wrapper: Wrapper })
}

describe('KanbanPage', () => {
  it('renders configured columns, metadata, and read-only boundaries', async () => {
    renderKanbanPage()

    expect(await screen.findByRole('heading', { name: 'Global kanban overview' })).not.toBeNull()
    expect(await screen.findByText('Build global kanban')).not.toBeNull()
    expect(screen.getByLabelText('Backlog column')).not.toBeNull()
    expect(screen.getByLabelText('To Do column')).not.toBeNull()
    expect(screen.getByLabelText('In Progress column')).not.toBeNull()
    expect(screen.getByLabelText('Blocked column')).not.toBeNull()
    expect(screen.getByLabelText('Review column')).not.toBeNull()
    expect(screen.getByLabelText('Done column')).not.toBeNull()
    expect(screen.getAllByText('SaaS Platform').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0)
    expect(screen.getByText('Assignee: Ada Lovelace')).not.toBeNull()
    expect(screen.queryByText(/Checklist:/i)).toBeNull()
    expect(screen.queryByText(/Subtasks:/i)).toBeNull()
    expect(screen.queryByText(/Due:/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /new task/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull()

    fireEvent.click(screen.getByText('Build global kanban'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('filters by project-related controls and clears filters', async () => {
    renderKanbanPage()

    expect(await screen.findByText('Build global kanban')).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'urgent' } })
    expect(screen.queryByText('Build global kanban')).toBeNull()
    expect(screen.getByText('Fix blocked task')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByText('Build global kanban')).not.toBeNull()
  })

  it('navigates to project detail from card links', async () => {
    renderKanbanPage()

    const projectLinks = await screen.findAllByRole('link', { name: 'SaaS Platform' })
    fireEvent.click(projectLinks[0])

    expect(await screen.findByRole('heading', { name: 'Project detail destination' })).not.toBeNull()
  })
})
