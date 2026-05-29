import { describe, expect, it } from 'vitest'
import { TASK_STATUSES, PRIORITIES } from '../../domain'
import { assertValidLocalDatabase } from '../../infrastructure'
import { buildDemoLocalBackupData } from './demo-data-factory'

const createSettings = () => ({
  theme: 'dark' as const,
  aiProvider: {
    provider: 'groq' as const,
    apiKey: 'secret',
    selectedModelId: 'llama-3.3-70b',
  },
})

describe('buildDemoLocalBackupData', () => {
  it('creates the expected project with deterministic members, tags, tasks, and subtasks', () => {
    const demoData = buildDemoLocalBackupData({
      referenceDate: new Date('2026-05-20T00:00:00.000Z'),
      settings: createSettings(),
    })

    expect(demoData.projects).toHaveLength(1)
    expect(demoData.projects[0]?.title).toBe('Development of a SaaS Frontend Platform')
    expect(demoData.members.length).toBeGreaterThanOrEqual(4)
    expect(demoData.tags.length).toBeGreaterThanOrEqual(5)
    expect(demoData.tasks.length).toBeGreaterThanOrEqual(6)
    expect(demoData.subtasks.length).toBeGreaterThanOrEqual(6)

    const taskIds = new Set(demoData.tasks.map((task) => task.id))
    const subtaskIds = new Set(demoData.subtasks.map((subtask) => subtask.id))
    const memberIds = new Set(demoData.members.map((member) => member.id))
    const tagIds = new Set(demoData.tags.map((tag) => tag.id))

    for (const task of demoData.tasks) {
      expect(taskIds.has(task.id)).toBe(true)
      expect(task.projectId).toBe(demoData.projects[0]?.id)
      expect(TASK_STATUSES).toContain(task.status)
      expect(PRIORITIES).toContain(task.priority)
      expect(task.checklist.every((item) => typeof item.text === 'string')).toBe(true)
      expect(task.subtaskIds.every((subtaskId) => subtaskIds.has(subtaskId))).toBe(true)
      expect(task.assigneeMemberId === null || memberIds.has(task.assigneeMemberId)).toBe(true)
      expect(task.tagIds.every((tagId) => tagIds.has(tagId))).toBe(true)
      expect(task.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(task.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }

    for (const subtask of demoData.subtasks) {
      expect(taskIds.has(subtask.taskId)).toBe(true)
      expect(TASK_STATUSES).toContain(subtask.status)
      expect(PRIORITIES).toContain(subtask.priority)
      expect(subtask.checklist.every((item) => typeof item.text === 'string')).toBe(true)
      expect(subtask.assigneeMemberId === null || memberIds.has(subtask.assigneeMemberId)).toBe(true)
      expect(subtask.tagIds.every((tagId) => tagIds.has(tagId))).toBe(true)
      expect(subtask.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(subtask.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('covers approved workflow statuses across generated tasks', () => {
    const demoData = buildDemoLocalBackupData({
      referenceDate: new Date('2026-05-20T00:00:00.000Z'),
      settings: createSettings(),
    })

    const statuses = new Set(demoData.tasks.map((task) => task.status))
    expect(statuses).toEqual(new Set(['backlog', 'todo', 'in_progress', 'blocked', 'review', 'done']))
  })

  it('produces a payload that satisfies local database validation', () => {
    const demoData = buildDemoLocalBackupData({
      referenceDate: new Date('2026-05-20T00:00:00.000Z'),
      settings: createSettings(),
    })

    expect(() => assertValidLocalDatabase({ ...demoData, version: 1 })).not.toThrow()
  })
})
