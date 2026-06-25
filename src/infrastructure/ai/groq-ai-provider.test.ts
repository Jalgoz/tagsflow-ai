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

  it('keeps workflow-specific methods explicit and unsupported in this slice', async () => {
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
      }),
    ).rejects.toMatchObject({
      code: 'unsupported_feature',
      message: 'AI project planning is not implemented in this slice.',
    })
  })
})
