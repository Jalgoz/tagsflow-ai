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
})
