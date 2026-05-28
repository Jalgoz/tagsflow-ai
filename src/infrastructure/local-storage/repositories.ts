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
  TaskStatus,
  UpdateMemberInput,
  UpdateProjectInput,
  UpdateSubtaskInput,
  UpdateTagInput,
  UpdateTaskInput,
} from '../../domain'
import { LocalStorageDatabase } from './database'
import { LocalStorageBackupRepository } from './backup-repository'
import { createDefaultSettings } from './defaults'
import { createDefaultId, type IdGenerator } from './id'

const uniqueIds = (ids: string[]): string[] => [...new Set(ids)]

const withoutId = (ids: string[], id: string): string[] => ids.filter((itemId) => itemId !== id)

const replaceItem = <TItem extends { id: string }>(items: TItem[], id: string, updater: (item: TItem) => TItem): TItem[] => {
  let found = false
  const nextItems = items.map((item) => {
    if (item.id !== id) {
      return item
    }

    found = true
    return updater(item)
  })

  if (!found) {
    throw new Error(`Entity with ID "${id}" was not found.`)
  }

  return nextItems
}

const findById = <TItem extends { id: string }>(items: TItem[], id: string): TItem | null => {
  return items.find((item) => item.id === id) ?? null
}

export class LocalStorageProjectRepository implements ProjectRepository {
  private readonly database: LocalStorageDatabase
  private readonly createId: IdGenerator

  constructor(database = new LocalStorageDatabase(), createId: IdGenerator = createDefaultId) {
    this.database = database
    this.createId = createId
  }

  async list(): Promise<Project[]> {
    return this.database.load().projects
  }

  async getById(id: string): Promise<Project | null> {
    return findById(this.database.load().projects, id)
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const project: Project = {
      ...input,
      id: this.createId(),
      memberIds: input.memberIds ?? [],
      taskIds: input.taskIds ?? [],
    }

    this.database.update((database) => ({
      ...database,
      projects: [...database.projects, project],
    }))

    return project
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    let updatedProject: Project | undefined

    this.database.update((database) => ({
      ...database,
      projects: replaceItem(database.projects, id, (project) => {
        updatedProject = { ...project, ...input }
        return updatedProject
      }),
    }))

    if (updatedProject === undefined) {
      throw new Error(`Project with ID "${id}" was not found.`)
    }

    return updatedProject
  }

  async delete(id: string): Promise<void> {
    this.database.update((database) => {
      const taskIdsToDelete = new Set(database.tasks.filter((task) => task.projectId === id).map((task) => task.id))

      return {
        ...database,
        projects: database.projects.filter((project) => project.id !== id),
        tasks: database.tasks.filter((task) => !taskIdsToDelete.has(task.id)),
        subtasks: database.subtasks.filter((subtask) => !taskIdsToDelete.has(subtask.taskId)),
      }
    })
  }

  async assignMember(projectId: string, memberId: string): Promise<Project> {
    const project = await this.getRequiredProject(projectId)

    return this.update(projectId, { memberIds: uniqueIds([...project.memberIds, memberId]) })
  }

  async unassignMember(projectId: string, memberId: string): Promise<Project> {
    const project = await this.getRequiredProject(projectId)

    return this.update(projectId, { memberIds: withoutId(project.memberIds, memberId) })
  }

  async setMemberIds(projectId: string, memberIds: string[]): Promise<Project> {
    return this.update(projectId, { memberIds: uniqueIds(memberIds) })
  }

  private async getRequiredProject(projectId: string): Promise<Project> {
    const project = await this.getById(projectId)

    if (project === null) {
      throw new Error(`Project with ID "${projectId}" was not found.`)
    }

    return project
  }
}

export class LocalStorageTaskRepository implements TaskRepository {
  private readonly database: LocalStorageDatabase
  private readonly createId: IdGenerator

  constructor(database = new LocalStorageDatabase(), createId: IdGenerator = createDefaultId) {
    this.database = database
    this.createId = createId
  }

  async list(): Promise<Task[]> {
    return this.database.load().tasks
  }

  async listByProjectId(projectId: string): Promise<Task[]> {
    return this.database.load().tasks.filter((task) => task.projectId === projectId)
  }

  async getById(id: string): Promise<Task | null> {
    return findById(this.database.load().tasks, id)
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const task: Task = {
      ...input,
      id: this.createId(),
      assigneeMemberId: input.assigneeMemberId ?? null,
      tagIds: input.tagIds ?? [],
      checklist: input.checklist ?? [],
      subtaskIds: input.subtaskIds ?? [],
    }

    this.database.update((database) => ({
      ...database,
      tasks: [...database.tasks, task],
      projects: database.projects.map((project) =>
        project.id === task.projectId ? { ...project, taskIds: uniqueIds([...project.taskIds, task.id]) } : project,
      ),
    }))

    return task
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    let updatedTask: Task | undefined

    this.database.update((database) => ({
      ...database,
      tasks: replaceItem(database.tasks, id, (task) => {
        updatedTask = { ...task, ...input }
        return updatedTask
      }),
    }))

    if (updatedTask === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    return updatedTask
  }

  async delete(id: string): Promise<void> {
    this.database.update((database) => ({
      ...database,
      projects: database.projects.map((project) => ({ ...project, taskIds: withoutId(project.taskIds, id) })),
      tasks: database.tasks.filter((task) => task.id !== id),
      subtasks: database.subtasks.filter((subtask) => subtask.taskId !== id),
    }))
  }

  async setStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.update(id, { status })
  }

  async assignMember(id: string, memberId: string | null): Promise<Task> {
    return this.update(id, { assigneeMemberId: memberId })
  }

  async setTagIds(id: string, tagIds: string[]): Promise<Task> {
    return this.update(id, { tagIds: uniqueIds(tagIds) })
  }

  async setChecklist(id: string, checklist: ChecklistItem[]): Promise<Task> {
    return this.update(id, { checklist })
  }

  async setSubtaskIds(id: string, subtaskIds: string[]): Promise<Task> {
    return this.update(id, { subtaskIds: uniqueIds(subtaskIds) })
  }
}

export class LocalStorageSubtaskRepository implements SubtaskRepository {
  private readonly database: LocalStorageDatabase
  private readonly createId: IdGenerator

  constructor(database = new LocalStorageDatabase(), createId: IdGenerator = createDefaultId) {
    this.database = database
    this.createId = createId
  }

  async list(): Promise<Subtask[]> {
    return this.database.load().subtasks
  }

  async listByTaskId(taskId: string): Promise<Subtask[]> {
    return this.database.load().subtasks.filter((subtask) => subtask.taskId === taskId)
  }

  async getById(id: string): Promise<Subtask | null> {
    return findById(this.database.load().subtasks, id)
  }

  async create(input: CreateSubtaskInput): Promise<Subtask> {
    const subtask: Subtask = {
      ...input,
      id: this.createId(),
      assigneeMemberId: input.assigneeMemberId ?? null,
      tagIds: input.tagIds ?? [],
      checklist: input.checklist ?? [],
    }

    this.database.update((database) => ({
      ...database,
      subtasks: [...database.subtasks, subtask],
      tasks: database.tasks.map((task) =>
        task.id === subtask.taskId ? { ...task, subtaskIds: uniqueIds([...task.subtaskIds, subtask.id]) } : task,
      ),
    }))

    return subtask
  }

  async update(id: string, input: UpdateSubtaskInput): Promise<Subtask> {
    let updatedSubtask: Subtask | undefined

    this.database.update((database) => ({
      ...database,
      subtasks: replaceItem(database.subtasks, id, (subtask) => {
        updatedSubtask = { ...subtask, ...input }
        return updatedSubtask
      }),
    }))

    if (updatedSubtask === undefined) {
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    return updatedSubtask
  }

  async delete(id: string): Promise<void> {
    this.database.update((database) => ({
      ...database,
      tasks: database.tasks.map((task) => ({ ...task, subtaskIds: withoutId(task.subtaskIds, id) })),
      subtasks: database.subtasks.filter((subtask) => subtask.id !== id),
    }))
  }

  async setStatus(id: string, status: TaskStatus): Promise<Subtask> {
    return this.update(id, { status })
  }

  async assignMember(id: string, memberId: string | null): Promise<Subtask> {
    return this.update(id, { assigneeMemberId: memberId })
  }

  async setTagIds(id: string, tagIds: string[]): Promise<Subtask> {
    return this.update(id, { tagIds: uniqueIds(tagIds) })
  }

  async setChecklist(id: string, checklist: ChecklistItem[]): Promise<Subtask> {
    return this.update(id, { checklist })
  }
}

export class LocalStorageMemberRepository implements MemberRepository {
  private readonly database: LocalStorageDatabase
  private readonly createId: IdGenerator

  constructor(database = new LocalStorageDatabase(), createId: IdGenerator = createDefaultId) {
    this.database = database
    this.createId = createId
  }

  async list(): Promise<Member[]> {
    return this.database.load().members
  }

  async getById(id: string): Promise<Member | null> {
    return findById(this.database.load().members, id)
  }

  async create(input: CreateMemberInput): Promise<Member> {
    const member: Member = {
      ...input,
      id: this.createId(),
    }

    this.database.update((database) => ({
      ...database,
      members: [...database.members, member],
    }))

    return member
  }

  async update(id: string, input: UpdateMemberInput): Promise<Member> {
    let updatedMember: Member | undefined

    this.database.update((database) => ({
      ...database,
      members: replaceItem(database.members, id, (member) => {
        updatedMember = { ...member, ...input }
        return updatedMember
      }),
    }))

    if (updatedMember === undefined) {
      throw new Error(`Member with ID "${id}" was not found.`)
    }

    return updatedMember
  }

  async delete(id: string): Promise<void> {
    this.database.update((database) => ({
      ...database,
      members: database.members.filter((member) => member.id !== id),
      projects: database.projects.map((project) => ({ ...project, memberIds: withoutId(project.memberIds, id) })),
      tasks: database.tasks.map((task) =>
        task.assigneeMemberId === id ? { ...task, assigneeMemberId: null } : task,
      ),
      subtasks: database.subtasks.map((subtask) =>
        subtask.assigneeMemberId === id ? { ...subtask, assigneeMemberId: null } : subtask,
      ),
    }))
  }
}

export class LocalStorageTagRepository implements TagRepository {
  private readonly database: LocalStorageDatabase
  private readonly createId: IdGenerator

  constructor(database = new LocalStorageDatabase(), createId: IdGenerator = createDefaultId) {
    this.database = database
    this.createId = createId
  }

  async list(): Promise<Tag[]> {
    return this.database.load().tags
  }

  async getById(id: string): Promise<Tag | null> {
    return findById(this.database.load().tags, id)
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const tag: Tag = {
      ...input,
      id: this.createId(),
    }

    this.database.update((database) => ({
      ...database,
      tags: [...database.tags, tag],
    }))

    return tag
  }

  async update(id: string, input: UpdateTagInput): Promise<Tag> {
    let updatedTag: Tag | undefined

    this.database.update((database) => ({
      ...database,
      tags: replaceItem(database.tags, id, (tag) => {
        updatedTag = { ...tag, ...input }
        return updatedTag
      }),
    }))

    if (updatedTag === undefined) {
      throw new Error(`Tag with ID "${id}" was not found.`)
    }

    return updatedTag
  }

  async delete(id: string): Promise<void> {
    this.database.update((database) => ({
      ...database,
      tags: database.tags.filter((tag) => tag.id !== id),
      tasks: database.tasks.map((task) => ({ ...task, tagIds: withoutId(task.tagIds, id) })),
      subtasks: database.subtasks.map((subtask) => ({ ...subtask, tagIds: withoutId(subtask.tagIds, id) })),
    }))
  }
}

export class LocalStorageSettingsRepository implements SettingsRepository {
  private readonly database: LocalStorageDatabase

  constructor(database = new LocalStorageDatabase()) {
    this.database = database
  }

  async get(): Promise<AppSettings> {
    return this.database.load().settings
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    this.database.update((database) => ({
      ...database,
      settings,
    }))

    return settings
  }

  async reset(): Promise<AppSettings> {
    const settings = createDefaultSettings()

    return this.save(settings)
  }
}

export const createLocalStorageRepositories = (database = new LocalStorageDatabase(), createId: IdGenerator = createDefaultId) => ({
  projects: new LocalStorageProjectRepository(database, createId),
  tasks: new LocalStorageTaskRepository(database, createId),
  subtasks: new LocalStorageSubtaskRepository(database, createId),
  members: new LocalStorageMemberRepository(database, createId),
  tags: new LocalStorageTagRepository(database, createId),
  settings: new LocalStorageSettingsRepository(database),
  backups: new LocalStorageBackupRepository(database),
})

export type LocalStorageRepositories = ReturnType<typeof createLocalStorageRepositories>
