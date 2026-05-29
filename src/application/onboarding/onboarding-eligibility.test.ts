import { describe, expect, it } from 'vitest'
import type { LocalBackupData } from '../../domain'
import { hasLocalBusinessData, isFirstLaunchOnboardingEligible } from './onboarding-eligibility'

const createBackupCollections = (): Pick<LocalBackupData, 'projects' | 'tasks' | 'subtasks' | 'members' | 'tags'> => ({
  projects: [],
  tasks: [],
  subtasks: [],
  members: [],
  tags: [],
})

describe('onboarding eligibility', () => {
  it('detects eligible empty first-launch state', () => {
    expect(
      isFirstLaunchOnboardingEligible({
        hasBusinessData: false,
        onboardingCompleted: false,
      }),
    ).toBe(true)
  })

  it('suppresses onboarding when any project exists', () => {
    const backup = createBackupCollections()
    backup.projects.push({
      id: 'project-1',
      title: 'Project',
      description: '',
      objective: '',
      inScopeContent: '',
      outOfScopeContent: '',
      status: 'active',
      startDate: null,
      dueDate: null,
      memberIds: [],
      taskIds: [],
    })

    expect(hasLocalBusinessData(backup)).toBe(true)
    expect(
      isFirstLaunchOnboardingEligible({
        hasBusinessData: true,
        onboardingCompleted: false,
      }),
    ).toBe(false)
  })

  it('suppresses onboarding when any task exists', () => {
    const backup = createBackupCollections()
    backup.tasks.push({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Task',
      description: '',
      inScopeContent: '',
      outOfScopeContent: '',
      priority: 'medium',
      status: 'todo',
      startDate: null,
      dueDate: null,
      assigneeMemberId: null,
      tagIds: [],
      checklist: [],
      subtaskIds: [],
    })

    expect(hasLocalBusinessData(backup)).toBe(true)
  })

  it('suppresses onboarding when any subtask exists', () => {
    const backup = createBackupCollections()
    backup.subtasks.push({
      id: 'subtask-1',
      taskId: 'task-1',
      title: 'Subtask',
      description: '',
      inScopeContent: '',
      outOfScopeContent: '',
      priority: 'medium',
      status: 'todo',
      startDate: null,
      dueDate: null,
      assigneeMemberId: null,
      tagIds: [],
      checklist: [],
    })

    expect(hasLocalBusinessData(backup)).toBe(true)
  })

  it('suppresses onboarding when any member exists', () => {
    const backup = createBackupCollections()
    backup.members.push({
      id: 'member-1',
      name: 'Member',
      email: 'member@test.local',
      role: 'Role',
      avatar: 'MB',
    })

    expect(hasLocalBusinessData(backup)).toBe(true)
  })

  it('suppresses onboarding when any tag exists', () => {
    const backup = createBackupCollections()
    backup.tags.push({
      id: 'tag-1',
      name: 'Tag',
    })

    expect(hasLocalBusinessData(backup)).toBe(true)
  })

  it('suppresses onboarding after completion even when local data is empty', () => {
    expect(
      isFirstLaunchOnboardingEligible({
        hasBusinessData: false,
        onboardingCompleted: true,
      }),
    ).toBe(false)
  })
})
