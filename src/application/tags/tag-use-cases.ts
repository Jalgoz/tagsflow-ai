import type { CreateTagInput, SubtaskRepository, Tag, TagRepository, TaskRepository, UpdateTagInput } from '../../domain'

export interface TagUsageSummary {
  taskCount: number
  subtaskCount: number
  totalCount: number
  isUsed: boolean
}

export interface TagUseCaseDependencies {
  tags: TagRepository
  tasks: TaskRepository
  subtasks: SubtaskRepository
}

export interface TagUseCases {
  listTags(): Promise<Tag[]>
  getTagById(tagId: string): Promise<Tag | null>
  createTag(input: CreateTagInput): Promise<Tag>
  updateTag(tagId: string, input: UpdateTagInput): Promise<Tag>
  deleteTag(tagId: string): Promise<void>
  getTagUsageSummary(tagId: string): Promise<TagUsageSummary>
  findOrCreateTagByName(name: string, color?: string): Promise<Tag>
}

const normalizeTagName = (value: string): string => value.trim().toLowerCase()

export const createTagUseCases = (dependencies: TagUseCaseDependencies): TagUseCases => {
  const getTagUsageSummary = async (tagId: string): Promise<TagUsageSummary> => {
    const [tasks, subtasks] = await Promise.all([dependencies.tasks.list(), dependencies.subtasks.list()])

    const taskCount = tasks.filter((task) => task.tagIds.includes(tagId)).length
    const subtaskCount = subtasks.filter((subtask) => subtask.tagIds.includes(tagId)).length
    const totalCount = taskCount + subtaskCount

    return {
      taskCount,
      subtaskCount,
      totalCount,
      isUsed: totalCount > 0,
    }
  }

  const findOrCreateTagByName = async (name: string, color?: string): Promise<Tag> => {
    const normalizedName = normalizeTagName(name)

    if (normalizedName === '') {
      throw new Error('Tag name is required.')
    }

    const existingTag = (await dependencies.tags.list()).find(
      (tag) => normalizeTagName(tag.name) === normalizedName,
    )

    if (existingTag !== undefined) {
      return existingTag
    }

    const input: CreateTagInput = {
      name: name.trim(),
      color: color?.trim() === '' ? undefined : color?.trim(),
    }

    return dependencies.tags.create(input)
  }

  return {
    listTags: async () => dependencies.tags.list(),
    getTagById: async (tagId) => dependencies.tags.getById(tagId),
    createTag: async (input) => dependencies.tags.create(input),
    updateTag: async (tagId, input) => dependencies.tags.update(tagId, input),
    deleteTag: async (tagId) => dependencies.tags.delete(tagId),
    getTagUsageSummary,
    findOrCreateTagByName,
  }
}
