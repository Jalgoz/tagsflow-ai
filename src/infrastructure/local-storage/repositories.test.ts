import { describe, expect, it } from 'vitest'

import { LocalStorageDatabase } from './database'
import {
  createLocalStorageRepositories,
  LocalStorageMemberRepository,
  LocalStorageProjectRepository,
  LocalStorageSettingsRepository,
  LocalStorageSubtaskRepository,
  LocalStorageTagRepository,
  LocalStorageTaskRepository,
} from './repositories'
import { createInMemoryStorage } from './testing'

const createIdGenerator = () => {
  let nextId = 1

  return () => `id-${nextId++}`
}

const createDatabase = () => new LocalStorageDatabase(createInMemoryStorage())

const createProjectInput = () => ({
  title: 'Project',
  description: 'Description',
  objective: 'Objective',
  inScopeContent: 'In scope',
  outOfScopeContent: 'Out of scope',
  status: 'active' as const,
  startDate: null,
  dueDate: null,
})

const createTaskInput = (projectId: string) => ({
  projectId,
  title: 'Task',
  description: 'Description',
  inScopeContent: 'In scope',
  outOfScopeContent: 'Out of scope',
  priority: 'medium' as const,
  status: 'todo' as const,
  startDate: null,
  dueDate: null,
})

const createSubtaskInput = (taskId: string) => ({
  taskId,
  title: 'Subtask',
  description: 'Description',
  inScopeContent: 'In scope',
  outOfScopeContent: 'Out of scope',
  priority: 'low' as const,
  status: 'backlog' as const,
  startDate: null,
  dueDate: null,
})

describe('local repository CRUD behavior', () => {
  it('creates, lists, gets, updates, and deletes projects', async () => {
    const repository = new LocalStorageProjectRepository(createDatabase(), createIdGenerator())

    const project = await repository.create(createProjectInput())
    const updatedProject = await repository.update(project.id, { title: 'Updated project' })

    expect(project.id).toBe('id-1')
    expect(updatedProject.title).toBe('Updated project')
    expect(await repository.getById(project.id)).toEqual(updatedProject)
    expect(await repository.list()).toEqual([updatedProject])

    await repository.delete(project.id)

    expect(await repository.list()).toEqual([])
  })

  it('creates, lists, updates, and deletes tasks', async () => {
    const database = createDatabase()
    const createId = createIdGenerator()
    const projects = new LocalStorageProjectRepository(database, createId)
    const tasks = new LocalStorageTaskRepository(database, createId)
    const project = await projects.create(createProjectInput())

    const task = await tasks.create(createTaskInput(project.id))
    const updatedTask = await tasks.setStatus(task.id, 'in_progress')

    expect(task.id).toBe('id-2')
    expect(updatedTask.status).toBe('in_progress')
    expect(await tasks.getById(task.id)).toEqual(updatedTask)
    expect(await tasks.list()).toEqual([updatedTask])
    expect(await tasks.listByProjectId(project.id)).toEqual([updatedTask])
    expect((await projects.getById(project.id))?.taskIds).toEqual([task.id])

    await tasks.delete(task.id)

    expect(await tasks.list()).toEqual([])
    expect((await projects.getById(project.id))?.taskIds).toEqual([])
  })

  it('creates, lists, updates, and deletes subtasks', async () => {
    const database = createDatabase()
    const createId = createIdGenerator()
    const projects = new LocalStorageProjectRepository(database, createId)
    const tasks = new LocalStorageTaskRepository(database, createId)
    const subtasks = new LocalStorageSubtaskRepository(database, createId)
    const project = await projects.create(createProjectInput())
    const task = await tasks.create(createTaskInput(project.id))

    const subtask = await subtasks.create(createSubtaskInput(task.id))
    const updatedSubtask = await subtasks.assignMember(subtask.id, 'member-1')

    expect(subtask.id).toBe('id-3')
    expect(updatedSubtask.assigneeMemberId).toBe('member-1')
    expect(await subtasks.getById(subtask.id)).toEqual(updatedSubtask)
    expect(await subtasks.list()).toEqual([updatedSubtask])
    expect(await subtasks.listByTaskId(task.id)).toEqual([updatedSubtask])
    expect((await tasks.getById(task.id))?.subtaskIds).toEqual([subtask.id])

    await subtasks.delete(subtask.id)

    expect(await subtasks.list()).toEqual([])
    expect((await tasks.getById(task.id))?.subtaskIds).toEqual([])
  })

  it('creates, lists, gets, updates, and deletes members', async () => {
    const repository = new LocalStorageMemberRepository(createDatabase(), createIdGenerator())

    const member = await repository.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'Engineer',
      avatar: 'AL',
    })
    const updatedMember = await repository.update(member.id, { role: 'Lead engineer' })

    expect(await repository.getById(member.id)).toEqual(updatedMember)
    expect(await repository.list()).toEqual([updatedMember])

    await repository.delete(member.id)

    expect(await repository.list()).toEqual([])
  })

  it('creates, lists, gets, updates, and deletes tags', async () => {
    const repository = new LocalStorageTagRepository(createDatabase(), createIdGenerator())

    const tag = await repository.create({ name: 'Frontend' })
    const updatedTag = await repository.update(tag.id, { color: '#6366f1' })

    expect(await repository.getById(tag.id)).toEqual(updatedTag)
    expect(await repository.list()).toEqual([updatedTag])

    await repository.delete(tag.id)

    expect(await repository.list()).toEqual([])
  })

  it('gets, saves, and resets settings', async () => {
    const repository = new LocalStorageSettingsRepository(createDatabase())

    expect(await repository.get()).toEqual({
      theme: 'light',
      aiProvider: {
        provider: 'groq',
        apiKey: null,
        selectedModelId: null,
      },
    })

    await repository.save({
      theme: 'dark',
      aiProvider: {
        provider: 'groq',
        apiKey: 'key',
        selectedModelId: 'model',
      },
    })

    expect((await repository.get()).theme).toBe('dark')
    expect(await repository.reset()).toEqual({
      theme: 'light',
      aiProvider: {
        provider: 'groq',
        apiKey: null,
        selectedModelId: null,
      },
    })
  })
})

describe('local repository relationship cleanup', () => {
  it('removes project tasks and their subtasks when deleting a project', async () => {
    const database = createDatabase()
    const repositories = createLocalStorageRepositories(database, createIdGenerator())
    const project = await repositories.projects.create(createProjectInput())
    const task = await repositories.tasks.create(createTaskInput(project.id))
    await repositories.subtasks.create(createSubtaskInput(task.id))

    await repositories.projects.delete(project.id)

    expect(await repositories.projects.list()).toEqual([])
    expect(await repositories.tasks.list()).toEqual([])
    expect(await repositories.subtasks.list()).toEqual([])
  })

  it('removes a task from its project and deletes child subtasks when deleting a task', async () => {
    const database = createDatabase()
    const repositories = createLocalStorageRepositories(database, createIdGenerator())
    const project = await repositories.projects.create(createProjectInput())
    const task = await repositories.tasks.create(createTaskInput(project.id))
    await repositories.subtasks.create(createSubtaskInput(task.id))

    await repositories.tasks.delete(task.id)

    expect((await repositories.projects.getById(project.id))?.taskIds).toEqual([])
    expect(await repositories.tasks.list()).toEqual([])
    expect(await repositories.subtasks.list()).toEqual([])
  })

  it('unassigns deleted members from projects, tasks, and subtasks', async () => {
    const database = createDatabase()
    const repositories = createLocalStorageRepositories(database, createIdGenerator())
    const member = await repositories.members.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'Engineer',
      avatar: 'AL',
    })
    const project = await repositories.projects.create({ ...createProjectInput(), memberIds: [member.id] })
    const task = await repositories.tasks.create({ ...createTaskInput(project.id), assigneeMemberId: member.id })
    const subtask = await repositories.subtasks.create({ ...createSubtaskInput(task.id), assigneeMemberId: member.id })

    await repositories.members.delete(member.id)

    expect((await repositories.projects.getById(project.id))?.memberIds).toEqual([])
    expect((await repositories.tasks.getById(task.id))?.assigneeMemberId).toBeNull()
    expect((await repositories.subtasks.getById(subtask.id))?.assigneeMemberId).toBeNull()
  })

  it('removes deleted tag IDs from tasks and subtasks', async () => {
    const database = createDatabase()
    const repositories = createLocalStorageRepositories(database, createIdGenerator())
    const tag = await repositories.tags.create({ name: 'Frontend' })
    const project = await repositories.projects.create(createProjectInput())
    const task = await repositories.tasks.create({ ...createTaskInput(project.id), tagIds: [tag.id] })
    const subtask = await repositories.subtasks.create({ ...createSubtaskInput(task.id), tagIds: [tag.id] })

    await repositories.tags.delete(tag.id)

    expect((await repositories.tasks.getById(task.id))?.tagIds).toEqual([])
    expect((await repositories.subtasks.getById(subtask.id))?.tagIds).toEqual([])
  })
})
