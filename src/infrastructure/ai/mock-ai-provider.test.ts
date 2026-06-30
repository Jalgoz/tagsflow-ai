import { describe, expect, it } from 'vitest'
import { MockAIProvider } from './mock-ai-provider'

describe('MockAIProvider', () => {
  it('lists deterministic models and succeeds without network access', async () => {
    const provider = new MockAIProvider()

    await expect(provider.listModels()).resolves.toEqual([
      {
        id: 'mock-model-v1',
        name: 'Mock Model',
        provider: 'mock',
        contextWindowTokens: 8192,
      },
    ])

    await expect(provider.testConnection()).resolves.toEqual({
      connected: true,
      message: 'Mock AI provider connection succeeded.',
      modelIds: ['mock-model-v1'],
    })
  })

  it('returns provider-neutral DTOs for workflow methods', async () => {
    const provider = new MockAIProvider()

    await expect(
      provider.generateProjectPlan({
        title: 'Foundation',
        description: 'Description',
        objective: 'Objective',
        inScopeContent: 'In scope',
        outOfScopeContent: 'Out of scope',
        startDate: null,
        dueDate: null,
        existingTasks: [],
        existingTagNames: ['Planning', 'Frontend'],
        memberNames: ['Alex Doe'],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        taskSuggestions: expect.arrayContaining([
          expect.objectContaining({
            title: 'Foundation foundation',
            status: 'todo',
          }),
        ]),
      }),
    )
  })

  it('includes additional instructions in the output when provided', async () => {
    const provider = new MockAIProvider()

    await expect(
      provider.generateProjectPlan({
        title: 'Foundation',
        description: 'Description',
        objective: 'Objective',
        inScopeContent: 'In scope',
        outOfScopeContent: 'Out of scope',
        startDate: null,
        dueDate: null,
        existingTasks: [],
        existingTagNames: [],
        memberNames: [],
        additionalInstructions: 'Create a security review task',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        taskSuggestions: expect.arrayContaining([
          expect.objectContaining({
            title: 'Instructed task',
            description: 'Create a security review task',
          }),
        ]),
      }),
    )
  })

  it('generates subtasks including additional instructions when provided', async () => {
    const provider = new MockAIProvider()

    await expect(
      provider.generateSubtasks({
        project: { title: 'Project', description: '', objective: '', inScopeContent: '', outOfScopeContent: '', startDate: null, dueDate: null, status: 'active' },
        task: { title: 'Foundation', description: '', inScopeContent: '', outOfScopeContent: '', priority: 'high', status: 'todo', startDate: null, dueDate: null },
        existingSubtasks: [],
        existingTagNames: [],
        memberNames: [],
        additionalInstructions: 'Focus on tests',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        subtaskSuggestions: expect.arrayContaining([
          expect.objectContaining({
            title: 'Instructed subtask',
            description: 'Focus on tests',
          }),
        ]),
      }),
    )
  })

  it('suggests priority with deterministic valid output', async () => {
    const provider = new MockAIProvider()

    await expect(
      provider.suggestPriority({
        project: {
          title: 'Project',
          description: '',
          objective: '',
          inScopeContent: '',
          outOfScopeContent: '',
          status: 'active',
          startDate: null,
          dueDate: null,
        },
        selectedTask: {
          title: 'Task',
          description: '',
          inScopeContent: '',
          outOfScopeContent: '',
          currentPriority: 'medium',
          status: 'todo',
          startDate: null,
          dueDate: null,
          checklistSummary: 'No checklist items.',
          tagNames: [],
          assigneeName: null,
          subtaskProgressSummary: 'No subtasks.',
        },
        siblingTasks: [],
      }),
    ).resolves.toEqual({
      suggestedPriority: 'high',
      rationale: 'Mock priority suggestion for development and tests.',
    })
  })

  it('summarizes projects with deterministic valid read-only output', async () => {
    const provider = new MockAIProvider()

    await expect(
      provider.summarizeProject({
        project: {
          title: 'Platform refresh',
          description: '',
          objective: '',
          inScopeContent: '',
          outOfScopeContent: '',
          status: 'active',
          startDate: null,
          dueDate: null,
          progressPercent: 42,
        },
        taskCounts: {
          backlog: 0,
          todo: 1,
          in_progress: 1,
          blocked: 1,
          review: 0,
          done: 0,
        },
        priorityCounts: {
          low: 0,
          medium: 1,
          high: 1,
          urgent: 1,
        },
        blockedTasks: [
          {
            title: 'Resolve design review',
            priority: 'high',
            status: 'blocked',
            dueDate: '2026-06-12',
            assigneeName: 'Alex Doe',
          },
        ],
        overdueTasks: [],
        upcomingTasks: [],
        completedTasks: [{ title: 'Set up project workspace', priority: 'medium' }],
        taskDetails: [],
        existingTagNames: ['Frontend'],
        memberNames: ['Alex Doe'],
        referenceDate: '2026-06-09',
      }),
    ).resolves.toEqual({
      summary: 'Mock summary for Platform refresh. Progress is 42%.',
      health: 'blocked',
      risks: ['Mock delivery risk.'],
      blockers: ['Mock blocked task requires follow-up.'],
      nextSteps: ['Mock next step.'],
      notableCompletedWork: ['Completed: Set up project workspace'],
    })
  })
})
