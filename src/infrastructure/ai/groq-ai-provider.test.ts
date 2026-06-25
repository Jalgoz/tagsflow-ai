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
})
