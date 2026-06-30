import { describe, expect, it, vi } from 'vitest'
import { GroqAIProvider } from './groq-ai-provider'

const createResponse = (body: unknown, status = 200, statusText = 'OK') =>
  new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: {
      'Content-Type': 'application/json',
    },
  })

describe('GroqAIProvider', () => {
  it('lists models through the Groq models endpoint', async () => {
    const transport = vi.fn(async () =>
      createResponse({
        data: [
          {
            id: 'llama-3.3-70b-versatile',
            owned_by: 'groq',
            context_window: 131072,
          },
        ],
      }),
    )
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: null,
      transport,
    })

    await expect(provider.listModels()).resolves.toEqual([
      {
        id: 'llama-3.3-70b-versatile',
        name: 'llama-3.3-70b-versatile',
        provider: 'groq',
        contextWindowTokens: 131072,
      },
    ])

    expect(transport).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-key',
        }),
      }),
    )
  })

  it('uses the same model listing path to test the connection', async () => {
    const transport = vi.fn(async () =>
      createResponse({
        data: [{ id: 'llama-3.3-70b-versatile' }],
      }),
    )
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport,
    })

    await expect(provider.testConnection()).resolves.toEqual({
      connected: true,
      message: 'Groq connection succeeded for the current configuration.',
      modelIds: ['llama-3.3-70b-versatile'],
    })
  })

  it('uses a bound default fetch transport so browser invocation does not fail', async () => {
    const originalFetch = globalThis.fetch
    let called = false
    const mockWindowFetch = function (this: typeof globalThis) {
        if (this !== globalThis) {
          throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation")
        }

        called = true
        return Promise.resolve(
          createResponse({
            data: [{ id: 'llama-3.3-70b-versatile' }],
          }),
        )
    }

    globalThis.fetch = mockWindowFetch as typeof fetch

    try {
      const provider = new GroqAIProvider({
        apiKey: 'secret-key',
        selectedModelId: null,
      })

      await expect(provider.listModels()).resolves.toEqual([
        {
          id: 'llama-3.3-70b-versatile',
          name: 'llama-3.3-70b-versatile',
          provider: 'groq',
          contextWindowTokens: undefined,
        },
      ])
      expect(called).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('normalizes Groq authentication failures without exposing the full API key', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: null,
      transport: async () => createResponse({ error: { message: 'Bearer secret-key is invalid.' } }, 401, 'Unauthorized'),
    })

    await expect(provider.listModels()).rejects.toMatchObject({
      code: 'authentication_failed',
      message: 'Groq rejected the API key.',
    })
  })

  it('normalizes network failures without exposing the full API key', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: null,
      transport: async () => {
        throw new TypeError('Network failed for secret-key')
      },
    })

    await expect(provider.listModels()).rejects.toMatchObject({
      code: 'network_error',
      message: 'Network failed for [REDACTED]',
    })
  })

  it('builds a structured project planner request with the selected model', async () => {
    const transport = vi.fn(async () =>
      createResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                taskSuggestions: [
                  {
                    title: 'Plan milestones',
                    description: 'Break the project into milestones.',
                    priority: 'high',
                    status: 'todo',
                    dueDate: '2026-07-01',
                    existingTagNames: ['Planning'],
                  },
                ],
              }),
            },
          },
        ],
      }),
    )
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport,
    })

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
        existingTagNames: ['Planning'],
        memberNames: ['Alex Doe'],
      }),
    ).resolves.toEqual({
      taskSuggestions: [
        {
          title: 'Plan milestones',
          description: 'Break the project into milestones.',
          priority: 'high',
          status: 'todo',
          dueDate: '2026-07-01',
          existingTagNames: ['Planning'],
        },
      ],
    })

    expect(transport).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
      }),
    )

    const transportCalls = transport.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit | undefined]>
    expect(transportCalls[0]).toBeDefined()
    const requestOptions = transportCalls[0]?.[1]
    const requestBody = JSON.parse(String(requestOptions?.body))
    expect(requestBody.model).toBe('llama-3.3-70b-versatile')
    expect(requestBody.response_format).toEqual({ type: 'json_object' })
    expect(requestBody.messages[0]?.content).toContain('Return valid JSON only.')
    expect(requestBody.messages[1]?.content).toContain('Foundation')
  })

  it('includes additional instructions in the user prompt and preserves output boundaries', async () => {
    const transport = vi.fn(async () =>
      createResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                taskSuggestions: [
                  {
                    title: 'Instructed task',
                    description: 'Description',
                    priority: 'high',
                    status: 'todo',
                    dueDate: null,
                    existingTagNames: [],
                  },
                ],
              }),
            },
          },
        ],
      }),
    )
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport,
    })

    await provider.generateProjectPlan({
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
    })

    const transportCalls = transport.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit | undefined]>
    const requestOptions = transportCalls[0]?.[1]
    const requestBody = JSON.parse(String(requestOptions?.body))
    
    // System prompt boundary preservation
    expect(requestBody.messages[0]?.content).toContain('Return valid JSON only.')
    expect(requestBody.messages[0]?.content).toContain('Do not generate IDs, subtasks, nested tasks, checklist items, member assignments, or new tags.')
    
    // User prompt instruction inclusion
    expect(requestBody.messages[1]?.content).toContain('Additional planning instructions to prioritize (within project scope):')
    expect(requestBody.messages[1]?.content).toContain('Create a security review task')
  })

  it('returns a missing configuration error when no model is selected for planning', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: null,
      transport: async () => createResponse({ data: [] }),
    })

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
      }),
    ).rejects.toMatchObject({
      code: 'missing_configuration',
      message: 'Select an AI model before using AI project planning.',
    })
  })

  it('normalizes invalid planner payloads without exposing secrets', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport: async () =>
        createResponse({
          choices: [
            {
              message: {
                content: '{"taskSuggestions":[{"title":"Only title"}]}',
              },
            },
          ],
        }),
    })

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
      }),
    ).rejects.toMatchObject({
      code: 'invalid_response',
      message: 'The AI project planner returned data in an unexpected format.',
    })
  })

  it('redacts secrets when planner requests fail', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport: async () => {
        throw new TypeError('Planner request failed for secret-key')
      },
    })

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
      }),
    ).rejects.toMatchObject({
      code: 'network_error',
      message: 'Planner request failed for [REDACTED]',
    })
  })

  it('builds a structured subtask generator request with the selected model', async () => {
    const transport = vi.fn(async () =>
      createResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                subtaskSuggestions: [
                  {
                    title: 'Implement login',
                    description: 'Do the backend.',
                    priority: 'high',
                    status: 'todo',
                    dueDate: null,
                    checklistItems: [],
                    existingTagNames: [],
                  },
                ],
              }),
            },
          },
        ],
      }),
    )
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport,
    })

    await expect(
      provider.generateSubtasks({
        project: {
          title: 'Project',
          description: '',
          objective: '',
          inScopeContent: '',
          outOfScopeContent: '',
          startDate: null,
          dueDate: null,
          status: 'active',
        },
        task: {
          title: 'Task',
          description: '',
          inScopeContent: '',
          outOfScopeContent: '',
          priority: 'high',
          status: 'todo',
          startDate: null,
          dueDate: null,
        },
        existingSubtasks: [],
        existingTagNames: [],
        memberNames: [],
        additionalInstructions: 'Focus on auth',
      }),
    ).resolves.toEqual({
      subtaskSuggestions: [
        {
          title: 'Implement login',
          description: 'Do the backend.',
          priority: 'high',
          status: 'todo',
          dueDate: null,
          checklistItems: [],
          existingTagNames: [],
        },
      ],
    })

    const transportCalls = transport.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit | undefined]>
    const requestOptions = transportCalls[0]?.[1]
    const requestBody = JSON.parse(String(requestOptions?.body))
    
    expect(requestBody.model).toBe('llama-3.3-70b-versatile')
    expect(requestBody.messages[0]?.content).toContain('one-level-deep subtasks')
    expect(requestBody.messages[1]?.content).toContain('Focus on auth')
  })

  it('returns a missing configuration error when no model is selected for subtask generation', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: null,
      transport: async () => createResponse({ data: [] }),
    })

    await expect(
      provider.generateSubtasks({
        project: { title: '', description: '', objective: '', inScopeContent: '', outOfScopeContent: '', startDate: null, dueDate: null, status: 'active' },
        task: { title: '', description: '', inScopeContent: '', outOfScopeContent: '', priority: 'high', status: 'todo', startDate: null, dueDate: null },
        existingSubtasks: [],
        existingTagNames: [],
        memberNames: [],
      }),
    ).rejects.toMatchObject({
      code: 'missing_configuration',
      message: 'Select an AI model before using AI project planning.',
    })
  })

  it('normalizes invalid subtask generator payloads without exposing secrets', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport: async () =>
        createResponse({
          choices: [{ message: { content: 'invalid JSON' } }],
        }),
    })

    await expect(
      provider.generateSubtasks({
        project: { title: '', description: '', objective: '', inScopeContent: '', outOfScopeContent: '', startDate: null, dueDate: null, status: 'active' },
        task: { title: '', description: '', inScopeContent: '', outOfScopeContent: '', priority: 'high', status: 'todo', startDate: null, dueDate: null },
        existingSubtasks: [],
        existingTagNames: [],
        memberNames: [],
      }),
    ).rejects.toMatchObject({
      code: 'invalid_response',
      message: 'The AI subtask generator returned invalid JSON.',
    })
  })

  it('redacts secrets when subtask requests fail', async () => {
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport: async () => {
        throw new TypeError('Subtask request failed for secret-key')
      },
    })

    await expect(
      provider.generateSubtasks({
        project: { title: '', description: '', objective: '', inScopeContent: '', outOfScopeContent: '', startDate: null, dueDate: null, status: 'active' },
        task: { title: '', description: '', inScopeContent: '', outOfScopeContent: '', priority: 'high', status: 'todo', startDate: null, dueDate: null },
        existingSubtasks: [],
        existingTagNames: [],
        memberNames: [],
      }),
    ).rejects.toMatchObject({
      code: 'network_error',
      message: 'Subtask request failed for [REDACTED]',
    })
  })

  it('builds a structured priority suggestion request with the selected model', async () => {
    const transport = vi.fn(async () =>
      createResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestedPriority: 'high',
                rationale: 'The task is time-sensitive.',
              }),
            },
          },
        ],
      }),
    )
    const provider = new GroqAIProvider({
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b-versatile',
      transport,
    })

    await expect(
      provider.suggestPriority({
        project: {
          title: 'Platform refresh',
          description: 'Refresh the product surface.',
          objective: 'Ship the next milestone.',
          inScopeContent: 'Dashboard and tasks.',
          outOfScopeContent: 'Backend services.',
          status: 'active',
          startDate: '2026-06-01',
          dueDate: '2026-06-30',
        },
        selectedTask: {
          title: 'Review current UX',
          description: 'Audit the current task flows and identify gaps.',
          inScopeContent: 'Selected scope',
          outOfScopeContent: 'Outside scope',
          currentPriority: 'medium',
          status: 'todo',
          startDate: '2026-06-02',
          dueDate: '2026-06-12',
          checklistSummary: '2/3 complete. Items: Define scope (done); Review metrics; Prepare release notes',
          tagNames: ['Frontend', 'Planning'],
          assigneeName: 'Alex Doe',
          subtaskProgressSummary: '1/3 complete. Subtasks: First pass (done); Second pass (todo); Third pass (todo)',
        },
        siblingTasks: [
          {
            title: 'Ship onboarding',
            priority: 'high',
            status: 'blocked',
            dueDate: '2026-06-18',
          },
        ],
        additionalInstructions: '   Focus on release blockers first.   ',
      }),
    ).resolves.toEqual({
      suggestedPriority: 'high',
      rationale: 'The task is time-sensitive.',
    })

    const transportCalls = transport.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit | undefined]>
    const requestOptions = transportCalls[0]?.[1]
    const requestBody = JSON.parse(String(requestOptions?.body))

    expect(requestBody.model).toBe('llama-3.3-70b-versatile')
    expect(requestBody.response_format).toEqual({ type: 'json_object' })
    expect(requestBody.messages[0]?.content).toContain('Return valid JSON only.')
    expect(requestBody.messages[0]?.content).toContain('Do not generate IDs, tasks, subtasks, project updates, tag creation, member assignments, checklist edits, or other mutation instructions.')
    expect(requestBody.messages[1]?.content).toContain('Platform refresh')
    expect(requestBody.messages[1]?.content).toContain('Current priority: medium')
    expect(requestBody.messages[1]?.content).toContain('Focus on release blockers first.')
  })
})
